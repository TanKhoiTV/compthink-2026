/**
 * player.ts — JSON-RPC Dispatcher (one instance per WebSocket connection)
 *
 * Owns: socket send helper, JSON-RPC dispatch, per-player resource validation,
 *       debt token application, stamina-lock application.
 * Does NOT own: room-level events, grid state, VP calculation.
 *
 * JSON-RPC 2.0 wire format:
 *   Request  → { jsonrpc:"2.0", id, method, params }
 *   Response → { jsonrpc:"2.0", id, result | error }
 *   Notify   → { jsonrpc:"2.0", method, params }  (no id field)
 */

import {
	addPlayer,
	removePlayer,
	startGame,
	draftCard,
	placeCard,
	skipSlot,
	confirmDay,
	toggleReady,
	exportSnapshot,
	type Room,
} from "./game.ts";
import type { GridPosition } from "../src/shared/types.ts";

// ─── JSON-RPC types ───────────────────────────────────────────────────────────

interface RpcRequest {
	jsonrpc: "2.0";
	id: string | number;
	method: string;
	params?: Record<string, unknown>;
}

interface RpcNotification {
	jsonrpc: "2.0";
	method: string;
	params?: Record<string, unknown>;
}

interface RpcSuccess {
	jsonrpc: "2.0";
	id: string | number;
	result: unknown;
}

interface RpcError {
	jsonrpc: "2.0";
	id: string | number | null;
	error: { code: number; message: string; data?: unknown };
}

// Standard JSON-RPC error codes
const RPC_ERRORS = {
	PARSE_ERROR: { code: -32700, message: "Parse error" },
	INVALID_REQUEST: { code: -32600, message: "Invalid Request" },
	METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
	INVALID_PARAMS: { code: -32602, message: "Invalid params" },
	INTERNAL_ERROR: { code: -32603, message: "Internal error" },
	// Game-specific codes (−32000 to −32099)
	GAME_ERROR: { code: -32000, message: "Game error" },
	WRONG_PHASE: { code: -32001, message: "Action not allowed in current phase" },
	RESOURCE_ERROR: { code: -32002, message: "Insufficient resources" },
} as const;

// ─── Player session ───────────────────────────────────────────────────────────

export interface PlayerSession {
	playerId: string;
	name: string;
	socket: WebSocket;
	room: Room | null;
}

export function createPlayerSession(
	playerId: string,
	name: string,
	socket: WebSocket,
): PlayerSession {
	return { playerId, name, socket, room: null };
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

export function sendResult(
	session: PlayerSession,
	id: string | number,
	result: unknown,
): void {
	const msg: RpcSuccess = { jsonrpc: "2.0", id, result };
	safeSend(session.socket, msg);
}

export function sendError(
	session: PlayerSession,
	id: string | number | null,
	code: number,
	message: string,
	data?: unknown,
): void {
	const msg: RpcError = { jsonrpc: "2.0", id, error: { code, message, data } };
	safeSend(session.socket, msg);
}

export function sendNotification(
	session: PlayerSession,
	method: string,
	params: unknown,
): void {
	const msg: RpcNotification = { jsonrpc: "2.0", method, params: params ?? {} };
	safeSend(session.socket, msg);
}

function safeSend(socket: WebSocket, payload: unknown): void {
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(payload));
	}
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

/**
 * Called by server.ts for every incoming WebSocket message.
 * Parses JSON-RPC, routes to the correct game action, sends back result/error.
 */
export function dispatch(session: PlayerSession, rawMessage: string): void {
	let req: RpcRequest;

	// 1. Parse
	try {
		const parsed = JSON.parse(rawMessage);
		if (parsed.jsonrpc !== "2.0" || typeof parsed.method !== "string") {
			sendError(
				session,
				null,
				RPC_ERRORS.INVALID_REQUEST.code,
				"Invalid JSON-RPC request",
			);
			return;
		}
		req = parsed as RpcRequest;
	} catch {
		sendError(session, null, RPC_ERRORS.PARSE_ERROR.code, "Parse error");
		return;
	}

	const { id, method, params = {} } = req;

	// 2. Route
	try {
		switch (method) {
			// ── Room management ──────────────────────────────────────────────────

			case "joinRoom": {
				const { roomId, name } = params as { roomId: string; name: string };
				if (!roomId || !name) {
					throw rpcError(
						RPC_ERRORS.INVALID_PARAMS.code,
						"joinRoom requires roomId and name",
					);
				}
				// Room assignment is handled by server.ts; player.ts just records the name
				session.name = name;
				sendResult(session, id, { ok: true, playerId: session.playerId });
				break;
			}

			case "startGame": {
				requireRoom(session);
				startGame(session.room!);
				sendResult(session, id, { ok: true });
				break;
			}

			case "toggleReady": {
				requireRoom(session);
				toggleReady(session.room!, session.playerId);
				sendResult(session, id, { ok: true });
				break;
			}

			// ── Drafting phase ───────────────────────────────────────────────────

			case "draftCard": {
				requireRoom(session);
				const { cardId, mode } = params as {
					cardId: string;
					mode: "store" | "rest";
				};
				if (!cardId || !mode) {
					throw rpcError(
						RPC_ERRORS.INVALID_PARAMS.code,
						"draftCard requires cardId and mode",
					);
				}
				if (mode !== "store" && mode !== "rest") {
					throw rpcError(
						RPC_ERRORS.INVALID_PARAMS.code,
						'mode must be "store" or "rest"',
					);
				}
				draftCard(session.room!, session.playerId, cardId, mode);
				sendResult(session, id, {
					ok: true,
					snapshot: exportSnapshot(session.room!, session.playerId),
				});
				break;
			}

			// ── Placement phase ──────────────────────────────────────────────────

			case "placeCard": {
				requireRoom(session);
				const { cardId, day, slot } = params as {
					cardId: string;
					day: number;
					slot: string;
				};
				if (!cardId || !day || !slot) {
					throw rpcError(
						RPC_ERRORS.INVALID_PARAMS.code,
						"placeCard requires cardId, day, and slot",
					);
				}
				const position: GridPosition = {
					day,
					slot: slot as GridPosition["slot"],
				};
				placeCard(session.room!, session.playerId, cardId, position);
				sendResult(session, id, {
					ok: true,
					snapshot: exportSnapshot(session.room!, session.playerId),
				});
				break;
			}

			case "skipSlot": {
				requireRoom(session);
				const { day, slot } = params as { day: number; slot: string };
				if (!day || !slot) {
					throw rpcError(
						RPC_ERRORS.INVALID_PARAMS.code,
						"skipSlot requires day and slot",
					);
				}
				const position: GridPosition = {
					day,
					slot: slot as GridPosition["slot"],
				};
				skipSlot(session.room!, session.playerId, position);
				sendResult(session, id, {
					ok: true,
					snapshot: exportSnapshot(session.room!, session.playerId),
				});
				break;
			}

			case "confirmDay": {
				requireRoom(session);
				confirmDay(session.room!, session.playerId);
				sendResult(session, id, {
					ok: true,
					snapshot: exportSnapshot(session.room!, session.playerId),
				});
				break;
			}

			// ── Queries ──────────────────────────────────────────────────────────

			case "getSnapshot": {
				requireRoom(session);
				sendResult(
					session,
					id,
					exportSnapshot(session.room!, session.playerId),
				);
				break;
			}

			case "ping": {
				sendResult(session, id, { pong: true, ts: Date.now() });
				break;
			}

			// ── Unknown method ───────────────────────────────────────────────────

			default:
				sendError(
					session,
					id,
					RPC_ERRORS.METHOD_NOT_FOUND.code,
					`Unknown method: ${method}`,
				);
		}
	} catch (err: unknown) {
		if (isRpcError(err)) {
			sendError(session, id, err.code, err.message, err.data);
		} else {
			const message = err instanceof Error ? err.message : String(err);
			sendError(session, id, RPC_ERRORS.GAME_ERROR.code, message);
		}
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireRoom(session: PlayerSession): void {
	if (!session.room) {
		throw rpcError(RPC_ERRORS.GAME_ERROR.code, "Player is not in a room");
	}
}

interface AppRpcError {
	code: number;
	message: string;
	data?: unknown;
	_isRpc: true;
}

function rpcError(code: number, message: string, data?: unknown): AppRpcError {
	return { code, message, data, _isRpc: true };
}

function isRpcError(err: unknown): err is AppRpcError {
	return typeof err === "object" && err !== null && "_isRpc" in err;
}
