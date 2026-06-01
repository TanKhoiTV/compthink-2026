/**
 * server.ts — HTTP + WebSocket entry point
 *
 * Owns: HTTP listener, WS handshake, room registry Map<roomId, Room>.
 * Does NOT own: business logic, player state, scoring.
 *
 * Run with:
 *   deno run --allow-net --allow-read server.ts
 *
 * Endpoints:
 *   GET  /health              → 200 OK
 *   GET  /rooms               → JSON list of active rooms
 *   POST /rooms               → Create a new room (body: { cards: TravelCard[] })
 *   GET  /ws?roomId=X&playerId=Y&name=Z  → WebSocket upgrade
 */

import {
	createRoom,
	addPlayer,
	removePlayer,
	exportSnapshot,
	type Room,
} from "./game.ts";
import {
	createPlayerSession,
	dispatch,
	sendNotification,
	sendError,
	type PlayerSession,
} from "./player.ts";
import type { TravelCard } from "../src/shared/types.ts";
import { registerUser, loginUser, verifyAuthToken } from "./auth.ts";

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = Number(Deno.env.get("PORT") ?? 8080);
const HOST = Deno.env.get("HOST") ?? "0.0.0.0";

// ─── Global room registry ─────────────────────────────────────────────────────

/** roomId → Room */
const rooms = new Map<string, Room>();

/** playerId → PlayerSession (one per active WebSocket connection) */
const sessions = new Map<string, PlayerSession>();

// ─── Broadcast factory ────────────────────────────────────────────────────────

/**
 * Creates a broadcast function bound to a specific roomId.
 * game.ts calls this whenever state changes.
 * We send a JSON-RPC notification (no `id`) to every connected player in the room.
 */
function makeBroadcaster(roomId: string): (room: Room) => void {
	return (room: Room) => {
		for (const player of room.players) {
			const session = sessions.get(player.playerId);
			if (session?.socket.readyState === WebSocket.OPEN) {
				const snapshot = exportSnapshot(room, player.playerId);
				const payload = JSON.stringify({
					jsonrpc: "2.0",
					method: "roomSnapshot",
					params: snapshot,
				});
				session.socket.send(payload);
			}
		}
	};
}

// ─── HTTP handlers ────────────────────────────────────────────────────────────

function handleHealth(): Response {
	return new Response(JSON.stringify({ status: "ok", rooms: rooms.size }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

function handleListRooms(): Response {
	const list = [...rooms.values()].map((r) => ({
		roomId: r.roomId,
		phase: r.phase,
		day: r.day,
		players: r.players.length,
		maxPlayers: r.maxPlayers,
	}));
	return json(list);
}

async function handleCreateRoom(req: Request): Promise<Response> {
	let body: { cards?: TravelCard[]; maxPlayers?: number; maxDays?: number };

	try {
		body = await req.json();
	} catch {
		return errorResponse(400, "Invalid JSON body");
	}

	if (!Array.isArray(body.cards) || body.cards.length === 0) {
		return errorResponse(
			400,
			"body.cards must be a non-empty array of TravelCard",
		);
	}

	const roomId = crypto.randomUUID().slice(0, 8).toUpperCase();
	const broadcaster = makeBroadcaster(roomId);
	const room = createRoom(
		roomId,
		body.cards,
		broadcaster,
		body.maxPlayers ?? 2,
		body.maxDays ?? 5,
	);
	rooms.set(roomId, room);

	console.log(`[server] Room ${roomId} created (${body.cards.length} cards).`);
	return json({ roomId }, 201);
}

// ─── WebSocket handler ────────────────────────────────────────────────────────

async function handleWebSocket(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const roomId = url.searchParams.get("roomId");
	const playerId = url.searchParams.get("playerId") ?? crypto.randomUUID();
	let name = url.searchParams.get("name") ?? `Player-${playerId.slice(0, 4)}`;
	const token = url.searchParams.get("token") ?? null;

	// Validate auth token if provided — use authenticated user's display name
	let authUser: import("./player.ts").AuthUser | null = null;
	if (token) {
		const validated = await verifyAuthToken(token).catch(() => null);
		if (validated) {
			authUser = validated;
			// Prefer the authenticated user's display name over the query param
			name = authUser.displayName;
		} else {
			// Token is invalid — still allow connection but without auth
			console.warn(
				`[ws] Invalid token provided for player ${playerId} in room ${roomId}`,
			);
		}
	}

	if (!roomId) {
		return errorResponse(400, "Missing roomId query parameter");
	}

	const room = rooms.get(roomId);
	if (!room) {
		return errorResponse(404, `Room ${roomId} not found`);
	}

	// Upgrade the HTTP request to a WebSocket connection
	// Deno.upgradeWebSocket works on both HTTP/1.1 (with Upgrade header)
	// and HTTP/2 (via Deno Deploy's proxy layer) — it throws if the
	// request is not a valid WebSocket upgrade.
	let socket: WebSocket;
	let response: Response;
	try {
		({ socket, response } = Deno.upgradeWebSocket(req));
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return errorResponse(400, `WebSocket upgrade failed: ${msg}`);
	}

	const session = createPlayerSession(playerId, name, socket, authUser);
	session.room = room;
	sessions.set(playerId, session);

	socket.onopen = () => {
		console.log(
			`[ws] Player ${name} (${playerId}) connected to room ${roomId}.`,
		);

		try {
			addPlayer(room, playerId, name);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			// If player can't join (room full, wrong phase, etc.) send error and close
			sendError(session, null, -32000, message);
			socket.close(1008, message);
			return;
		}

		// Send initial snapshot immediately after join
		sendNotification(session, "roomSnapshot", exportSnapshot(room, playerId));
	};

	socket.onmessage = (event: MessageEvent) => {
		const data = typeof event.data === "string" ? event.data : "";
		dispatch(session, data);
	};

	socket.onclose = (event: CloseEvent) => {
		console.log(
			`[ws] Player ${name} (${playerId}) disconnected from room ${roomId}. ` +
				`Code=${event.code} reason="${event.reason}"`,
		);
		sessions.delete(playerId);

		// Only remove from room if game hasn't ended
		if (room && room.phase !== "finished") {
			removePlayer(room, playerId);
			// Notify remaining players
			makeBroadcaster(roomId)(room);
		}

		// Clean up empty lobby rooms
		if (room.players.length === 0 && room.phase === "lobby") {
			rooms.delete(roomId);
			console.log(`[server] Room ${roomId} removed (empty).`);
		}
	};

	socket.onerror = (err: Event) => {
		console.error(`[ws] Socket error for player ${playerId}:`, err);
	};

	return response;
}

// ─── Main router ──────────────────────────────────────────────────────────────

async function router(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const { pathname, method } = { pathname: url.pathname, method: req.method };

	// CORS preflight for local dev
	if (method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders() });
	}

	try {
		if (pathname === "/health" && method === "GET") {
			return addCors(handleHealth());
		}

		if (pathname === "/rooms" && method === "GET") {
			return addCors(handleListRooms());
		}

		if (pathname === "/rooms" && method === "POST") {
			return addCors(await handleCreateRoom(req));
		}

		// Auth: register
		if (pathname === "/api/auth/register" && method === "POST") {
			try {
				const body = await req.json();
				const result = await registerUser({
					username: body.username,
					password: body.password,
					displayName: body.displayName,
				});
				return addCors(json(result));
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				return addCors(errorResponse(400, message));
			}
		}

		// Auth: login
		if (pathname === "/api/auth/login" && method === "POST") {
			try {
				const body = await req.json();
				const result = await loginUser({
					username: body.username,
					password: body.password,
				});
				return addCors(json(result));
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				return addCors(errorResponse(400, message));
			}
		}

		// Auth: verify token
		if (pathname === "/api/auth/me" && method === "GET") {
			const authHeader = req.headers.get("Authorization") || "";
			const token = authHeader.startsWith("Bearer ")
				? authHeader.slice(7)
				: null;
			const user = await verifyAuthToken(token);
			if (!user) {
				return addCors(
					errorResponse(401, "Chưa đăng nhập hoặc token hết hạn."),
				);
			}
			return addCors(json({ user }));
		}

		// WebSocket upgrade endpoint
		// Deno Deploy uses HTTP/2 at the edge — the Upgrade header may be
		// absent because the WebSocket negotiation happens at the proxy layer.
		// Deno.upgradeWebSocket() handles the upgrade internally regardless;
		// if the request is not a valid upgrade it throws, which we catch below.
		if (pathname === "/ws" && method === "GET") {
			return await handleWebSocket(req);
		}

		return addCors(errorResponse(404, `Not found: ${method} ${pathname}`));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("[server] Unhandled error:", message);
		return addCors(errorResponse(500, "Internal Server Error"));
	}
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders() },
	});
}

function errorResponse(status: number, message: string): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders() },
	});
}

function corsHeaders(): Record<string, string> {
	// Production: set CORS_ORIGIN to your Pages URL (e.g. https://tankhoitv.github.io)
	// Dev: leave unset for localhost (falls back to "*")
	const origin = Deno.env.get("CORS_ORIGIN") ?? "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

function addCors(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [k, v] of Object.entries(corsHeaders())) {
		headers.set(k, v);
	}
	return new Response(response.body, {
		status: response.status,
		headers,
	});
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

console.log(`[server] Starting on http://${HOST}:${PORT}`);
console.log(
	`[server] WebSocket endpoint: ws://${HOST}:${PORT}/ws?roomId=XXXX&playerId=YYY&name=ZZZ`,
);

Deno.serve({ hostname: HOST, port: PORT }, router);
