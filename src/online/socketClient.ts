/**
 * socketClient.ts — WebSocket JSON-RPC client for the Deno game server.
 *
 * Protocol: JSON-RPC 2.0 over WebSocket.
 * Server: ws://localhost:8080/ws?roomId=X&playerId=Y&name=Z
 *
 * This replaces Trekkopoly's Socket.IO client (src/online/socketClient.ts).
 */

import type { RoomSnapshot } from "../shared/types.ts";

// ── Connection state ────────────────────────────────────────────────────────

let socket: WebSocket | null = null;
let requestId = 0;
let pendingResolve: ((value: unknown) => void) | null = null;
let pendingReject: ((reason: Error) => void) | null = null;
let onRoomSnapshotCallback: ((snapshot: RoomSnapshot) => void) | null = null;
let onDisconnectCallback: (() => void) | null = null;
// Auto-detect: use the deployed Deno server when on GitHub Pages,
// localhost for development.
const isProduction =
	typeof window !== "undefined" &&
	(window.location.hostname === "tankhoitv.github.io" ||
		window.location.hostname.includes("github.io"));

export let serverBaseUrl = isProduction
	? (localStorage.getItem("trekkopoly_server_url") ?? "https://khoinguyentran-trekkopoly-server.hf.space")
	: "http://localhost:8080";
let wsBaseUrl = isProduction
	? serverBaseUrl.replace(/^http/, "ws")
	: "ws://localhost:8080";

// ── Auth state ────────────────────────────────────────────────────────────

export type AuthUser = {
	id: string;
	username: string;
	displayName: string;
};

export interface AuthClientState {
	isReady: boolean;
	user: AuthUser | null;
	token: string | null;
}

export const authClientState: AuthClientState = {
	isReady: false,
	user: null,
	token: null,
};

const AUTH_TOKEN_KEY = "trekkopoly_auth_token";
const AUTH_USER_KEY = "trekkopoly_auth_user";

/** Load saved auth session from localStorage (called once at startup). */
export function loadAuthSession(): void {
	try {
		const token = localStorage.getItem(AUTH_TOKEN_KEY);
		const userRaw = localStorage.getItem(AUTH_USER_KEY);
		if (token && userRaw) {
			authClientState.token = token;
			authClientState.user = JSON.parse(userRaw) as AuthUser;
			authClientState.isReady = true;
		}
	} catch {
		// Corrupted storage — ignore
	}
}

/** Save auth token + user to state and localStorage. */
export function saveAuthSession(token: string, user: AuthUser): void {
	authClientState.token = token;
	authClientState.user = user;
	authClientState.isReady = true;
	try {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
		localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
	} catch {
		// Storage full or unavailable
	}
}

/** Clear auth session from state and localStorage. */
export function clearAuthSession(): void {
	authClientState.token = null;
	authClientState.user = null;
	authClientState.isReady = false;
	try {
		localStorage.removeItem(AUTH_TOKEN_KEY);
		localStorage.removeItem(AUTH_USER_KEY);
	} catch {
		// ignore
	}
}

/** Get the auth token for WebSocket connections. */
export function getAuthToken(): string | null {
	return authClientState.token;
}

/**
 * Get the display name of the logged-in user, or null if not logged in.
 */
export function getAuthDisplayName(): string | null {
	return authClientState.user?.displayName ?? null;
}

/**
 * Get the saved auth token or null if no active session.
 * Kept for backward compatibility — prefer getAuthToken().
 */
export function getToken(): string | null {
	return authClientState.token;
}

export function configureServerUrls(httpUrl: string, wsUrl: string) {
	serverBaseUrl = httpUrl;
	wsBaseUrl = wsUrl;
}

export function setOnRoomSnapshot(callback: (snapshot: RoomSnapshot) => void) {
	onRoomSnapshotCallback = callback;
}

export function setOnDisconnect(callback: () => void) {
	onDisconnectCallback = callback;
}

export function getSocket(): WebSocket | null {
	return socket;
}

export function isConnected(): boolean {
	return socket !== null && socket.readyState === WebSocket.OPEN;
}

/**
 * Connect to a game room via WebSocket.
 * Automatically sends joinRoom after the connection opens.
 * If the user is logged in, the auth token is passed as a query param
 * so the server can link the WebSocket session to the authenticated user.
 */
export function connectToRoom(
	roomId: string,
	playerId: string,
	name: string,
): Promise<{ ok: boolean; playerId: string }> {
	return new Promise((resolve, reject) => {
		if (socket) {
			socket.close();
			socket = null;
		}

		// Append auth token if logged in
		const token = getAuthToken();
		let url = `${wsBaseUrl}/ws?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}&name=${encodeURIComponent(name)}`;
		if (token) {
			url += `&token=${encodeURIComponent(token)}`;
		}
		socket = new WebSocket(url);

		socket.onopen = () => {
			// Send joinRoom immediately after connection
			rpcCall("joinRoom", { roomId, name })
				.then((result) => resolve(result as { ok: boolean; playerId: string }))
				.catch(reject);
		};

		socket.onmessage = (event: MessageEvent) => {
			try {
				const msg = JSON.parse(event.data as string);

				if (msg.method) {
					// Server notification (no id)
					handleNotification(msg);
				} else if (msg.id !== undefined) {
					// Response to our request
					handleResponse(msg);
				}
			} catch {
				console.warn("[socketClient] Failed to parse message:", event.data);
			}
		};

		socket.onclose = () => {
			socket = null;
			if (onDisconnectCallback) onDisconnectCallback();
		};

		socket.onerror = () => {
			reject(new Error("WebSocket connection failed"));
		};
	});
}

/**
 * Make a JSON-RPC call. Returns a promise that resolves with the result
 * or rejects on error / timeout.
 */
export function rpcCall(
	method: string,
	params: Record<string, unknown> = {},
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			reject(new Error("WebSocket not connected"));
			return;
		}

		requestId += 1;
		const id = requestId;
		pendingResolve = resolve;
		pendingReject = reject;

		socket.send(
			JSON.stringify({
				jsonrpc: "2.0",
				id,
				method,
				params,
			}),
		);

		// Timeout after 10 seconds
		setTimeout(() => {
			if (pendingResolve === resolve) {
				pendingResolve = null;
				pendingReject = null;
				reject(new Error(`RPC call '${method}' timed out`));
			}
		}, 10000);
	});
}

/**
 * Disconnect from the current room.
 */
export function disconnectFromRoom() {
	if (socket) {
		socket.close();
		socket = null;
	}
}

/**
 * Create a room via HTTP POST, then connect to it via WebSocket.
 * Convenience wrapper for the full join flow.
 */
export async function createRoomAndJoin(
	cards: unknown[],
	playerId: string,
	playerName: string,
	maxPlayers = 2,
	maxDays = 5,
): Promise<{ ok: boolean; playerId: string; roomId: string }> {
	const response = await fetch(`${serverBaseUrl}/rooms`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ cards, maxPlayers, maxDays }),
	});

	if (!response.ok) {
		throw new Error(`Failed to create room: ${response.statusText}`);
	}

	const { roomId } = (await response.json()) as { roomId: string };
	const result = await connectToRoom(roomId, playerId, playerName);
	return { ...result, roomId };
}

// ── Low-level helpers ───────────────────────────────────────────────────────

function handleNotification(msg: { method: string; params: unknown }) {
	switch (msg.method) {
		case "roomSnapshot":
			if (onRoomSnapshotCallback) {
				onRoomSnapshotCallback(msg.params as RoomSnapshot);
			}
			break;
		default:
			console.debug("[socketClient] Unhandled notification:", msg.method);
	}
}

function handleResponse(msg: {
	id: number;
	result?: unknown;
	error?: { code: number; message: string };
}) {
	if (msg.error) {
		if (pendingReject) {
			pendingReject(new Error(msg.error.message));
			pendingResolve = null;
			pendingReject = null;
		}
	} else if (pendingResolve) {
		pendingResolve(msg.result);
		pendingResolve = null;
		pendingReject = null;
	}
}
