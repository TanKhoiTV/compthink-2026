/**
 * lobbyClient.ts — Lobby-specific WebSocket client logic.
 *
 * Handles: room creation, joining, snapshot processing, saved sessions,
 *          ready toggling, room leaving, game start.
 *
 * Depends on: socketClient.ts for transport, router.ts for screen transitions.
 */

import {
	connectToRoom,
	createRoomAndJoin,
	rpcCall,
	disconnectFromRoom,
	setOnRoomSnapshot,
	setOnDisconnect,
} from "./socketClient.ts";
import type { RoomSnapshot } from "../shared/types.ts";
import { getCardsByPhasePool } from "../shared/data/cards.all.ts";

// ── Types ──────────────────────────────────────────────────────────────────

export type SavedSession = {
	roomId: string;
	playerId: string;
	playerName: string;
};

type LobbyPlayer = {
	id: string;
	name: string;
	isConnected: boolean;
	hasJoined: boolean;
	isReady: boolean;
};

type LobbySnapshot = {
	roomId: string;
	playerId: string;
	playerName: string;
	phase: string;
	players: LobbyPlayer[];
	isHost: boolean;
	canStart: boolean;
};

// ── State ──────────────────────────────────────────────────────────────────

let currentRoomId: string | null = null;
let currentPlayerId: string | null = null;
let currentPlayerName: string | null = null;
let currentLobbySnapshot: LobbySnapshot | null = null;

// ── Saved session (localStorage) ───────────────────────────────────────────

const SAVED_SESSION_KEY = "trekkopoly_saved_room";

export function getSavedSession(): SavedSession | null {
	try {
		const raw = localStorage.getItem(SAVED_SESSION_KEY);
		return raw ? (JSON.parse(raw) as SavedSession) : null;
	} catch {
		return null;
	}
}

function saveSession(session: SavedSession) {
	try {
		localStorage.setItem(SAVED_SESSION_KEY, JSON.stringify(session));
	} catch {
		// Storage full or unavailable — non-critical
	}
}

export function clearSavedSession() {
	try {
		localStorage.removeItem(SAVED_SESSION_KEY);
	} catch {
		// ignore
	}
}

// ── Lobby global bindings (called from app.ts init) ────────────────────────

export function initLobbyGlobals() {
	(globalThis as any).gotoOnlineLobby = gotoOnlineLobby;
	(globalThis as any).gotoDashboard = gotoDashboard;
	(globalThis as any).createRoomFromLobby = createRoomFromLobby;
	(globalThis as any).joinRoomFromLobby = joinRoomFromLobby;
	(globalThis as any).reconnectSavedRoomFromLobby = reconnectSavedRoomFromLobby;
	(globalThis as any).clearSavedRoomFromLobby = clearSavedRoomFromLobby;
	(globalThis as any).copyRoomCodeFromLobby = copyRoomCodeFromLobby;
	(globalThis as any).leaveRoomFromLobby = leaveRoomFromLobby;
	(globalThis as any).toggleReadyFromLobby = toggleReadyFromLobby;
	(globalThis as any).startOnlineGame = startOnlineGame;
}

// ── Navigation ─────────────────────────────────────────────────────────────

function gotoOnlineLobby() {
	import("../router.ts").then(({ transitionToScreen }) => {
		transitionToScreen("lobby");
	});
}

function gotoDashboard() {
	disconnectFromRoom();
	currentRoomId = null;
	currentPlayerId = null;
	currentPlayerName = null;
	currentLobbySnapshot = null;
	import("../router.ts").then(({ transitionToScreen }) => {
		transitionToScreen("dashboard");
	});
}

// ── Room creation ──────────────────────────────────────────────────────────

async function createRoomFromLobby() {
	const nameInput = document.getElementById(
		"lobby-create-name",
	) as HTMLInputElement | null;
	const playerName = nameInput?.value?.trim() || "Player";

	try {
		// Use all Saigon phase 1 cards for now
		const cards = getCardsByPhasePool("SAIGON");

		const result = await createRoomAndJoin(
			cards,
			crypto.randomUUID(),
			playerName,
			2,
			5,
		);

		currentRoomId = result.roomId;
		currentPlayerId = result.playerId;
		currentPlayerName = playerName;

		saveSession({
			roomId: result.roomId,
			playerId: result.playerId,
			playerName,
		});

		// Wire up snapshot callback and start listening
		setOnRoomSnapshot(handleRoomSnapshot);
		setOnDisconnect(handleDisconnect);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		alert(`Không thể tạo phòng: ${message}`);
	}
}

// ── Room joining ───────────────────────────────────────────────────────────

async function joinRoomFromLobby() {
	const nameInput = document.getElementById(
		"lobby-join-name",
	) as HTMLInputElement | null;
	const codeInput = document.getElementById(
		"lobby-room-code",
	) as HTMLInputElement | null;
	const playerName = nameInput?.value?.trim() || "Player";
	const roomId = codeInput?.value?.trim().toUpperCase();

	if (!roomId) {
		alert("Vui lòng nhập mã phòng.");
		return;
	}

	try {
		const playerId = crypto.randomUUID();
		const result = await connectToRoom(roomId, playerId, playerName);

		currentRoomId = roomId;
		currentPlayerId = result.playerId;
		currentPlayerName = playerName;

		saveSession({
			roomId,
			playerId: result.playerId,
			playerName,
		});

		// Wire up callbacks
		setOnRoomSnapshot(handleRoomSnapshot);
		setOnDisconnect(handleDisconnect);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		alert(`Không thể vào phòng: ${message}`);
	}
}

// ── Reconnect / clear saved ────────────────────────────────────────────────

async function reconnectSavedRoomFromLobby() {
	const saved = getSavedSession();
	if (!saved) return;

	try {
		const result = await connectToRoom(
			saved.roomId,
			saved.playerId,
			saved.playerName,
		);

		currentRoomId = saved.roomId;
		currentPlayerId = result.playerId;
		currentPlayerName = saved.playerName;

		setOnRoomSnapshot(handleRoomSnapshot);
		setOnDisconnect(handleDisconnect);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		alert(`Không thể reconnect: ${message}`);
	}
}

function clearSavedRoomFromLobby() {
	clearSavedSession();
	// Re-render lobby to hide the resume section
	gotoOnlineLobby();
}

// ── Room code copy ─────────────────────────────────────────────────────────

function copyRoomCodeFromLobby() {
	if (!currentRoomId) return;
	navigator.clipboard.writeText(currentRoomId).catch(() => {
		// Fallback: select the text manually
	});
}

// ── Leave room ─────────────────────────────────────────────────────────────

function leaveRoomFromLobby() {
	disconnectFromRoom();
	currentRoomId = null;
	currentPlayerId = null;
	currentPlayerName = null;
	currentLobbySnapshot = null;
	// Go back to entry screen (re-render lobby without lobby room)
	gotoOnlineLobby();
}

// ── Ready toggle ───────────────────────────────────────────────────────────

async function toggleReadyFromLobby() {
	try {
		await rpcCall("toggleReady", {});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn("[lobby] toggleReady failed:", message);
	}
}

// ── Start game ─────────────────────────────────────────────────────────────

async function startOnlineGame() {
	try {
		await rpcCall("startGame", {});
		// Server will broadcast a snapshot with phase="draft"
		// The game screen transition is handled by handleRoomSnapshot
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		alert(`Không thể bắt đầu: ${message}`);
	}
}

// ── Snapshot handler ───────────────────────────────────────────────────────

function handleRoomSnapshot(snapshot: RoomSnapshot) {
	if (snapshot.phase === "lobby") {
		// Still in lobby — update player list
		currentLobbySnapshot = buildLobbySnapshot(snapshot);
		// Re-render the lobby screen
		import("../router.ts").then(({ rerenderGameShell }) => {
			rerenderGameShell();
		});
	} else if (snapshot.phase === "draft" || snapshot.phase === "placement") {
		// Game has started — transition to game screen
		// Store the snapshot for the game to use
		currentLobbySnapshot = null;
		import("../router.ts").then(({ transitionToScreen }) => {
			transitionToScreen("game");
		});
	}
}

function buildLobbySnapshot(snapshot: RoomSnapshot): LobbySnapshot | null {
	if (!currentPlayerId || !currentPlayerName) return null;

	const players: LobbyPlayer[] = snapshot.players.map((p) => ({
		id: p.playerId,
		name: p.name,
		isConnected: true, // If in snapshot, they're connected
		hasJoined: true,
		isReady: p.ready,
	}));

	const isHost = snapshot.players[0]?.playerId === currentPlayerId;
	const allReady = players.length >= 1 && players.every((p) => p.isReady);

	return {
		roomId: snapshot.roomId,
		playerId: currentPlayerId,
		playerName: currentPlayerName,
		phase: snapshot.phase,
		players,
		isHost,
		canStart: isHost && players.length >= 1 && allReady,
	};
}

// ── Disconnect handler ─────────────────────────────────────────────────────

function handleDisconnect() {
	currentRoomId = null;
	currentPlayerId = null;
	currentPlayerName = null;
	currentLobbySnapshot = null;

	// If on lobby screen, re-render to show entry
	if (
		window.location.pathname.includes("lobby") ||
		document.querySelector(".online-lobby-screen")
	) {
		gotoOnlineLobby();
	}
}

// ── Snapshot getter for router ─────────────────────────────────────────────

export function getCurrentLobbySnapshot(): LobbySnapshot | null {
	return currentLobbySnapshot;
}

export function getCurrentRoomId(): string | null {
	return currentRoomId;
}

export function getCurrentPlayerId(): string | null {
	return currentPlayerId;
}

export function getCurrentPlayerName(): string | null {
	return currentPlayerName;
}

// Auto-init lobby globals on module load
initLobbyGlobals();
