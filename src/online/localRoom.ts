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
import { applySnapshotToState } from "./snapshotAdapter.ts";
import { rerenderGameShell, updateTimerDom } from "../router.ts";
import { playGameSound } from "../audio/gameAudio.ts";
import {
	setIsInitialDealInProgress,
	setIsPassingDraftCards,
	getPlayerHand,
	setDraftPickSecondsLeft,
	setRemainingTurnSeconds,
} from "../state.ts";
import { getCardsByPhasePool } from "../shared/data/cards.all.ts";
import { DEAL_ANIMATION_MS } from "../shared/animations.ts";
import {
	DRAFT_PICK_SECONDS,
	TURN_DURATION_SECONDS,
} from "../shared/constants.ts";

// ─── State ──────────────────────────────────────────────────────────────────

let localRoom: Room | null = null;
let localPlayerId: string | null = null;
let localCards: TravelCard[] = [];
let botTimerIds: number[] = [];
let draftTimerId: number | null = null;
let placementTimerId: number | null = null;

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
 * Re-apply the latest snapshot to client state and re-render.
 * Useful when the DOM wasn't ready during initial snapshot application
 * (e.g., hash bypass test mode).
 */
/**
 * Clean up any running local game.
 */
export function cleanupLocalGame(): void {
	// Clear bot timers
	for (const id of botTimerIds) {
		clearTimeout(id);
	}
	botTimerIds = [];
	clearDraftTimer();
	clearPlacementTimer();
	localRoom = null;
	localPlayerId = null;
}

function clearDraftTimer(): void {
	if (draftTimerId !== null) {
		clearInterval(draftTimerId);
		draftTimerId = null;
	}
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
		clearDraftTimer();
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
		clearPlacementTimer();
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
	applySnapshotToState(snapshot, localCards, localPlayerId);

	// ── Draft animation triggers ───────────────────────────────────────────
	// Track previous hand size to detect pass (hand shrinks) vs deal (new cards)
	const handEl = document.querySelector(".player-hand--draft");
	const hadHandCards = handEl?.querySelector(".hand-card");

	if (snapshot.phase === "draft") {
		const hasHandCards = handEl?.querySelector(".hand-card");

		if (hasHandCards && !hadHandCards) {
			// Pass complete — new cards just arrived. Play deal animation.
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

		if (!hasHandCards && hadHandCards) {
			// Hand just got emptied — player picked, remaining cards passed back.
			// Play pass animation.
			setIsPassingDraftCards(true);
		}

		// Fallback: cards are in the DOM but no timer running (e.g., DOM wasn't
		// ready during the first call, or refresh after transitionToScreen).
		if (hasHandCards && draftTimerId === null) {
			startDraftTimer();
		}
	} else {
		// Not in draft — clear the draft timer
		clearDraftTimer();
	}

	// Update the placement timer
	if (snapshot.phase === "placement") {
		const myPlayer = snapshot.players.find((p) => p.playerId === localPlayerId);
		if (myPlayer && !myPlayer.ready) {
			setRemainingTurnSeconds(TURN_DURATION_SECONDS);
			startPlacementTimer();
		}
	} else {
		clearPlacementTimer();
	}

	rerenderGameShell();
}

/**
 * Start a countdown timer for the current draft round.
 * When time expires, auto-pick the first card in hand.
 */
function startDraftTimer(): void {
	clearDraftTimer();

	const hand = getPlayerHand();
	if (hand.length === 0) return;

	// Guard: only start the timer if we're still in the draft phase
	if (!localRoom || !localPlayerId) return;
	if (exportSnapshot(localRoom, localPlayerId).phase !== "draft") return;

	let secondsLeft = DRAFT_PICK_SECONDS;
	setDraftPickSecondsLeft(secondsLeft);

	draftTimerId = window.setInterval(() => {
		secondsLeft--;
		setDraftPickSecondsLeft(secondsLeft);
		updateTimerDom();

		if (secondsLeft <= 0) {
			clearDraftTimer();

			// Auto-pick the first card in hand
			const firstCard = getPlayerHand()[0];
			if (firstCard && localRoom && localPlayerId) {
				// Re-check phase — the game may have transitioned since the timer started
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
		}
	}, 1000);
}

/**
 * Start a countdown timer for the placement phase.
 * When time expires, auto-confirm the day.
 */
function startPlacementTimer(): void {
	clearPlacementTimer();

	let secondsLeft = TURN_DURATION_SECONDS;
	setRemainingTurnSeconds(secondsLeft);

	placementTimerId = window.setInterval(() => {
		secondsLeft--;
		setRemainingTurnSeconds(secondsLeft);
		updateTimerDom();

		if (secondsLeft <= 0) {
			clearPlacementTimer();

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
		}
	}, 1000);
}

function clearPlacementTimer(): void {
	if (placementTimerId !== null) {
		clearInterval(placementTimerId);
		placementTimerId = null;
	}
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
