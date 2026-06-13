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
import { runBotTurn } from "./bot.ts";
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
	return new Response(JSON.stringify(list), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

async function handleCreateRoom(req: Request): Promise<Response> {
	let body: { cards?: TravelCard[]; maxPlayers?: number; maxDays?: number };

	try {
		body = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (!Array.isArray(body.cards) || body.cards.length === 0) {
		return new Response(
			JSON.stringify({
				error: "body.cards must be a non-empty array of TravelCard",
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
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
	return new Response(JSON.stringify({ roomId }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
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
		return new Response(
			JSON.stringify({ error: "Missing roomId query parameter" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const room = rooms.get(roomId);
	if (!room) {
		return new Response(JSON.stringify({ error: `Room ${roomId} not found` }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
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
		return new Response(
			JSON.stringify({ error: `WebSocket upgrade failed: ${msg}` }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
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

		// Clean up rooms nobody can come back to: empty lobbies, or
		// in-progress games where every player has disconnected.
		const allDisconnected =
			room.players.length > 0 && room.players.every((p) => !p.connected);
		if (
			(room.players.length === 0 && room.phase === "lobby") ||
			(room.phase !== "finished" && allDisconnected)
		) {
			rooms.delete(roomId);
			console.log(`[server] Room ${roomId} removed (abandoned).`);
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

	// Determine allowed origin from the request's Origin header
	const origin = allowedOrigin(req);

	// Helper: wrap any Response with CORS headers for this origin
	const withCors = (res: Response): Response => addCors(res, origin);

	// CORS preflight
	if (method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: corsHeaders(origin),
		});
	}

	try {
		if (pathname === "/health" && method === "GET") {
			return withCors(handleHealth());
		}

		if (pathname === "/rooms" && method === "GET") {
			return withCors(handleListRooms());
		}

		if (pathname === "/rooms" && method === "POST") {
			return withCors(await handleCreateRoom(req));
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
				return jsonRes(result, origin);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				return errorRes(400, message, origin);
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
				return jsonRes(result, origin);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				return errorRes(400, message, origin);
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
				return jsonRes(
					{ error: "Chưa đăng nhập hoặc token hết hạn." },
					origin,
					401,
				);
			}
			return jsonRes({ user }, origin);
		}

		// WebSocket upgrade endpoint
		if (pathname === "/ws" && method === "GET") {
			return await handleWebSocket(req);
		}

		return jsonRes({ error: `Not found: ${method} ${pathname}` }, origin, 404);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("[server] Unhandled error:", message);
		return errorRes(500, "Internal Server Error", origin);
	}
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

/**
 * Determine the allowed origin for CORS.
 * Echoes the request's Origin if it matches known client domains,
 * otherwise returns the Origin verbatim (safe for public APIs).
 */
function allowedOrigin(req: Request): string {
	const requestOrigin = req.headers.get("Origin");
	const allowedOrigins = [
		"https://tankhoitv.github.io",
		"http://localhost:5173",
		"http://localhost:8080",
	];
	if (requestOrigin) {
		// Allow known domains OR any origin (loose cors for dev)
		if (allowedOrigins.includes(requestOrigin)) {
			return requestOrigin;
		}
	}
	return requestOrigin ?? "*";
}

function corsHeaders(origin: string): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		Vary: "Origin",
	};
}

function addCors(response: Response, origin: string): Response {
	const headers = new Headers(response.headers);
	for (const [k, v] of Object.entries(corsHeaders(origin))) {
		headers.set(k, v);
	}
	return new Response(response.body, {
		status: response.status,
		headers,
	});
}

function jsonRes(data: unknown, origin: string, status = 200): Response {
	return addCors(
		new Response(JSON.stringify(data), {
			status,
			headers: { "Content-Type": "application/json" },
		}),
		origin,
	);
}

function errorRes(status: number, message: string, origin: string): Response {
	return jsonRes({ error: message }, origin, status);
}

// ─── Disconnected-player autoplay tick ────────────────────────────────────────

/**
 * Every tick, any disconnected human player in an active room has their
 * current turn (draft pick or placement) played for them via the bot
 * engine. This keeps their hand/board in sync with the room so the game
 * doesn't stall waiting on someone who may never come back — and lets
 * them resume cleanly if they do reconnect.
 */
const DISCONNECTED_AUTOPLAY_INTERVAL_MS = 5000;

function runDisconnectedPlayerTurns(): void {
	for (const room of rooms.values()) {
		if (room.phase !== "draft" && room.phase !== "placement") continue;

		let acted = false;
		for (const player of room.players) {
			if (player.connected) continue;
			try {
				if (runBotTurn(room, player.playerId)) acted = true;
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				console.warn(
					`[autoplay] ${player.name} turn failed in room ${room.roomId}: ${message}`,
				);
			}
		}

		if (acted) makeBroadcaster(room.roomId)(room);
	}
}

setInterval(runDisconnectedPlayerTurns, DISCONNECTED_AUTOPLAY_INTERVAL_MS);

// ─── Boot ─────────────────────────────────────────────────────────────────────

console.log(`[server] Starting on http://${HOST}:${PORT}`);
console.log(
	`[server] WebSocket endpoint: ws://${HOST}:${PORT}/ws?roomId=XXXX&playerId=YYY&name=ZZZ`,
);

Deno.serve({ hostname: HOST, port: PORT }, router);
