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
import type { RoomSnapshot, TravelCard } from "../shared/types.ts";
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

// Online game state — set by handleRoomSnapshot when game starts
let currentGameSnapshot: RoomSnapshot | null = null;
let currentCards: TravelCard[] = [];

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
		// Register callbacks BEFORE connecting so initial snapshot isn't lost
		setOnRoomSnapshot(handleRoomSnapshot);
		setOnDisconnect(handleDisconnect);

		// Set player identity BEFORE connecting so snapshot handler
		// has currentPlayerId/currentPlayerName when it receives the
		// initial roomSnapshot during the WebSocket handshake.
		const playerId = crypto.randomUUID();
		currentPlayerId = playerId;
		currentPlayerName = playerName;

		// Use all Saigon phase 1 cards for now
		const cards = getCardsByPhasePool("SAIGON");
		currentCards = cards;

		const result = await createRoomAndJoin(cards, playerId, playerName, 2, 5);

		currentRoomId = result.roomId;

		saveSession({
			roomId: result.roomId,
			playerId,
			playerName,
		});
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
		// Register callbacks BEFORE connecting so initial snapshot isn't lost
		setOnRoomSnapshot(handleRoomSnapshot);
		setOnDisconnect(handleDisconnect);

		const playerId = crypto.randomUUID();
		// Set identity before connect so snapshot handler has it ready
		currentPlayerId = playerId;
		currentPlayerName = playerName;

		const result = await connectToRoom(roomId, playerId, playerName);

		currentRoomId = roomId;

		saveSession({
			roomId,
			playerId: result.playerId,
			playerName,
		});
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
		// Register callbacks BEFORE connecting so initial snapshot isn't lost
		setOnRoomSnapshot(handleRoomSnapshot);
		setOnDisconnect(handleDisconnect);

		// Reconnect uses saved identity — set before connect so snapshot
		// handler has currentPlayerId/currentPlayerName ready
		currentRoomId = saved.roomId;
		currentPlayerId = saved.playerId;
		currentPlayerName = saved.playerName;

		await connectToRoom(saved.roomId, saved.playerId, saved.playerName);
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

// ── Debt payment ──────────────────────────────────────────────────────────

export async function sendPayDebt(amount?: number): Promise<void> {
	try {
		await rpcCall("payDebt", amount ? { amount } : {});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn("[lobby] payDebt failed:", message);
	}
}

// ── Return board card ───────────────────────────────────────────────────────

export async function sendReturnBoardCard(
	day: number,
	slot: string,
): Promise<void> {
	try {
		await rpcCall("returnBoardCard", { day, slot });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn("[lobby] returnBoardCard failed:", message);
	}
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
		currentGameSnapshot = null;
		// Re-render the lobby screen
		import("../router.ts").then(({ rerenderGameShell }) => {
			rerenderGameShell();
		});
	} else {
		// Game has started (draft/placement/scoring/finished) —
		// store snapshot and switch to game screen
		currentLobbySnapshot = null;
		currentGameSnapshot = snapshot;
		import("../router.ts").then(({ transitionToScreen }) => {
			transitionToScreen("game");
		});
	}
}

function buildLobbySnapshot(snapshot: RoomSnapshot): LobbySnapshot | null {
	if (!currentPlayerId || !currentPlayerName) return null;

	// Build slots up to maxPlayers, filling empty slots with placeholder
	const maxPlayers = snapshot.maxPlayers ?? 2;
	const players: LobbyPlayer[] = [];

	for (let i = 0; i < maxPlayers; i++) {
		const p = snapshot.players[i];
		if (p) {
			players.push({
				id: p.playerId,
				name: p.name,
				isConnected: true,
				hasJoined: true,
				isReady: p.ready,
			});
		} else {
			players.push({
				id: "",
				name: "",
				isConnected: false,
				hasJoined: false,
				isReady: false,
			});
		}
	}

	// Host is the player in slot 0
	const hostSlot = snapshot.players[0];
	const isHost = hostSlot ? hostSlot.playerId === currentPlayerId : false;

	// Room is full when all slots have connected players
	const slotsFull = snapshot.players.length >= maxPlayers;
	const allReady = slotsFull && players.every((p) => p.isReady);

	return {
		roomId: snapshot.roomId,
		playerId: currentPlayerId,
		playerName: currentPlayerName,
		phase: snapshot.phase,
		players,
		isHost,
		canStart: isHost && slotsFull && allReady,
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

export function getCurrentGameSnapshot(): RoomSnapshot | null {
	return currentGameSnapshot;
}

export function getCurrentCards(): TravelCard[] {
	return currentCards;
}

// Auto-init lobby globals on module load
initLobbyGlobals();
