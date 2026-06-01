/**
 * localRoom.ts — Local game room for single-player mode.
 *
 * Creates a server Room with N bots (default 3) + 1 human player.
 * Runs the game FSM entirely in-process (no HTTP/WebSocket).
 * Broadcasts snapshots → snapshotAdapter → local state → render.
 *
 * BotManager auto-plays all bot turns. Human player actions
 * call game.ts functions directly (same as server RPCs).
 *
 * Usage (in app.ts or dashboard.ts):
 *   import { initLocalGame } from "./online/localRoom.ts";
 *   initLocalGame(humanPlayerId, numBots, cards);
 */

import {
	createRoom,
	addPlayer,
	startGame,
	toggleReady,
	draftCard,
	placeCard,
	confirmDay,
	discardChosenCard,
	exportSnapshot,
	type Room,
} from "../../server/game.ts";
import { createBotPlayer, scheduleBotTurns } from "../../server/bot.ts";
import type { TravelCard, TimeSlot } from "../shared/types.ts";
import { syncAllStateFromSnapshot } from "./snapshotAdapter.ts";
import { detectHandTransition } from "../services/animation-controller.ts";
import {
	startDraftTimer as startSharedDraftTimer,
	stopDraftTimer,
	startPlacementTimer as startSharedPlacementTimer,
	stopPlacementTimer,
	isDraftTimerRunning,
} from "../services/game-timer.ts";
import { rerenderGameShell } from "../router.ts";
import { playGameSound } from "../audio/gameAudio.ts";
import {
	setIsInitialDealInProgress,
	setIsPassingDraftCards,
	getPlayerHand,
	setRemainingTurnSeconds,
} from "../state.ts";
import { getCardsByPhasePool } from "../shared/data/cards.all.ts";
import { DEAL_ANIMATION_MS } from "../shared/animations.ts";
import { TURN_DURATION_SECONDS } from "../shared/constants.ts";

// ─── State ──────────────────────────────────────────────────────────────────

let localRoom: Room | null = null;
let localPlayerId: string | null = null;
let localCards: TravelCard[] = [];
let botTimerIds: number[] = [];
// Timer state managed by services/game-timer.ts

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Initialize a local game room with bots.
 * Call this when the user clicks "BẮT ĐẦU HÀNH TRÌNH".
 *
 * @param playerId - The human player's ID (e.g. "p1")
 * @param playerName - The human player's display name
 * @param numBots - Number of bot opponents (default 3)
 * @param cards - Card catalogue (default: Saigon cards)
 */
export function initLocalGame(
	playerId = "p1",
	playerName = "Nhà Lữ Hành",
	numBots = 3,
	cards?: TravelCard[],
): void {
	// Clean up any previous local game
	cleanupLocalGame();

	const deck = cards ?? getCardsByPhasePool("SAIGON");
	localCards = deck;
	localPlayerId = playerId;

	// Create room with players + bots
	const room = createRoom("LOCAL", deck, handleLocalBroadcast, 1 + numBots);
	localRoom = room;

	// Add human player first (host/slot 0)
	addPlayer(room, playerId, playerName);

	// Add bot players
	for (let i = 0; i < numBots; i++) {
		const bot = createBotPlayer(i, "bot-");
		// Add directly to room (bypasses WebSocket)
		try {
			addPlayer(room, bot.playerId, bot.name);
		} catch {
			// Room might be full — skip
			break;
		}
	}

	// Auto-toggle ready for all players (including human for now)
	// In the future, the UI will show a ready button
	for (const p of room.players) {
		try {
			toggleReady(room, p.playerId);
		} catch {
			// Already ready or other issue
		}
	}

	// Start the game
	try {
		startGame(room, playerId);
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error("[localRoom] Failed to start game:", msg);
	}

	// Initial render
	applySnapshotAndRender();

	// Schedule bot turns
	scheduleBots();
}

/**
 * Clean up any running local game.
 */
export function cleanupLocalGame(): void {
	// Clear bot timers
	for (const id of botTimerIds) {
		clearTimeout(id);
	}
	botTimerIds = [];
	stopDraftTimer();
	stopPlacementTimer();
	localRoom = null;
	localPlayerId = null;
}

/**
 * Get the current local room (for direct game function calls).
 */
export function getLocalRoom(): Room | null {
	return localRoom;
}

/**
 * Get the local player's ID.
 */
export function getLocalPlayerId(): string | null {
	return localPlayerId;
}

/**
 * Handle a human player's action by calling the appropriate game function.
 * These mirror the RPC calls the WebSocket client would make.
 */

export function localDraftCard(cardId: string, mode: "store" | "rest"): void {
	if (!localRoom || !localPlayerId) return;
	try {
		// Clear the draft timer — player is making a choice
		stopDraftTimer();
		draftCard(localRoom, localPlayerId, cardId, mode);
		applySnapshotAndRender();
		scheduleBots();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[localRoom] draftCard failed:", msg);
	}
}

export function localPlaceCard(
	cardId: string,
	day: number,
	slot: TimeSlot,
): void {
	if (!localRoom || !localPlayerId) return;
	try {
		placeCard(localRoom, localPlayerId, cardId, { day, slot });
		applySnapshotAndRender();
		scheduleBots();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[localRoom] placeCard failed:", msg);
	}
}

export function localDiscardCard(cardId: string): void {
	if (!localRoom || !localPlayerId) return;
	try {
		discardChosenCard(localRoom, localPlayerId, cardId);
		applySnapshotAndRender();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[localRoom] discardChosenCard failed:", msg);
	}
}

export function localConfirmDay(): void {
	if (!localRoom || !localPlayerId) return;
	try {
		stopPlacementTimer();
		confirmDay(localRoom, localPlayerId);
		applySnapshotAndRender();
		scheduleBots();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[localRoom] confirmDay failed:", msg);
	}
}

// ─── Internal ───────────────────────────────────────────────────────────────

/**
 * The broadcast callback for the local Room.
 * Called by game.ts whenever room state changes.
 * We apply the snapshot to local state and re-render.
 */
function handleLocalBroadcast(_room: Room): void {
	if (!localPlayerId) return;
	applySnapshotAndRender();
}

/**
 * Take the current Room snapshot and apply it to local state,
 * then trigger a re-render.
 */
function applySnapshotAndRender(): void {
	if (!localRoom || !localPlayerId) return;

	const snapshot = exportSnapshot(localRoom, localPlayerId);
	syncAllStateFromSnapshot(snapshot, localCards, localPlayerId);

	// ── Animation detection (shared controller, not DOM query) ────────────
	const transition = detectHandTransition(getPlayerHand().length);

	if (snapshot.phase === "draft") {
		if (transition.type === "deal") {
			playGameSound("deal");
			setIsPassingDraftCards(false);
			setIsInitialDealInProgress(true);

			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					const hand = document.querySelector(".player-hand--draft");
					hand?.classList.add("deal-active");
				});
			});

			window.setTimeout(() => {
				setIsInitialDealInProgress(false);
				const hand = document.querySelector(".player-hand");
				hand?.classList.remove(
					"player-hand--dealing",
					"is-dealing",
					"deal-active",
				);

				// Start draft pick timer after deal animation completes
				startDraftTimer();
			}, DEAL_ANIMATION_MS);
		}

		if (transition.type === "pass") {
			setIsPassingDraftCards(true);
		}

		// Fallback: cards present but no timer running
		if (getPlayerHand().length > 0 && !isDraftTimerRunning()) {
			startDraftTimer();
		}
	} else {
		// Not in draft — clear the draft timer
		stopDraftTimer();
	}

	// Update the placement timer
	if (snapshot.phase === "placement") {
		const myPlayer = snapshot.players.find((p) => p.playerId === localPlayerId);
		if (myPlayer && !myPlayer.ready) {
			setRemainingTurnSeconds(TURN_DURATION_SECONDS);
			startPlacementTimer();
		}
	} else {
		stopPlacementTimer();
	}

	rerenderGameShell();
}

/**
 * Start a countdown timer for the current draft round.
 * When time expires, auto-pick the first card in hand.
 */
function startDraftTimer(): void {
	const hand = getPlayerHand();
	if (hand.length === 0) return;
	if (!localRoom || !localPlayerId) return;
	if (exportSnapshot(localRoom, localPlayerId).phase !== "draft") return;

	startSharedDraftTimer(() => {
		// Auto-pick the first card in hand
		const firstCard = getPlayerHand()[0];
		if (firstCard && localRoom && localPlayerId) {
			if (exportSnapshot(localRoom, localPlayerId).phase !== "draft") return;
			try {
				draftCard(localRoom, localPlayerId, firstCard.id, "store");
				applySnapshotAndRender();
				scheduleBots();
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				console.warn("[localRoom] auto-draft failed:", msg);
			}
		}
	});
}

/**
 * Start a countdown timer for the placement phase.
 * When time expires, auto-confirm the day.
 */
function startPlacementTimer(): void {
	if (!localRoom || !localPlayerId) return;

	startSharedPlacementTimer(() => {
		if (localRoom && localPlayerId) {
			try {
				confirmDay(localRoom, localPlayerId);
				applySnapshotAndRender();
				scheduleBots();
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				console.warn("[localRoom] auto-confirm failed:", msg);
			}
		}
	});
}

/**
 * Schedule bot turns after the current state settles.
 * BotManager picks appropriate actions based on the room phase.
 */
function scheduleBots(): void {
	// Clear previous bot timers
	for (const id of botTimerIds) {
		clearTimeout(id);
	}
	botTimerIds = [];

	if (!localRoom) return;

	// Schedule new bot turns with a small delay so the human player
	// can see what happened before bots move
	const timers = scheduleBotTurns(localRoom, 400);
	botTimerIds = timers;

	// After bot turns complete, apply snapshot + re-render
	// scheduleBotTurns returns setTimeout IDs; we chain a final
	// applySnapshotAndRender after the longest bot delay
	if (timers.length > 0) {
		const finalTimer = setTimeout(
			() => {
				applySnapshotAndRender();
			},
			600 + timers.length * 100,
		);
		botTimerIds.push(finalTimer as unknown as number);
	}
}
