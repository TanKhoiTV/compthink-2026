/**
 * app.ts — Application entry point and game loop.
 *
 * Mirrors the old TREKPOLOGY/src/app.ts game loop (single-player local mode):
 *   draft → placement → endDay → draft (next day) → ... → finished
 *
 * Draft: 7 cards, pick 1 per round × 5 rounds → 5 cards in hand.
 * Placement: click card → click board cell → place. "End Day" to advance.
 * Day advance: score base VP → increment day → start new draft or finish.
 */

import { setupGameAudioDelegation } from "./audio/gameAudio.ts";
import { rerenderGameShell, transitionToScreen } from "./router.ts";
import {
	setDeck,
	setPlayerHand,
	setCurrentDayIndex,
	setGamePhase,
	setDraftPool,
	setDraftRound,
	setDraftSelectedCardId,
	setSelectedHandCardId,
	setFocusedHandCardId,
	setFocusedBoardCard,
	getDeck,
	getPlayerHand,
	getGamePhase,
	getCurrentDayIndex,
	getBoardSlots,
	setCurrentPlayerBoard,
	getAccumulatedVP,
	setAccumulatedVP,
	getDraftPool,
	getDraftRound,
	getSelectedHandCardId,
	getShowFocusedPopup,
	setShowFocusedPopup,
	getSimulationResult,
	setSimulationResult,
	getSimulationReplayIndex,
	setSimulationReplayIndex,
	setIsReplayComplete,
	getSimulationTimerId,
	setSimulationTimerId,
} from "./state.ts";
import type { TravelCard } from "./shared/types.ts";
import { createInitialDeck, shuffleCards } from "./shared/deck.ts";
import { saigonFoodCards } from "./shared/data/index.ts";
import { HAND_SIZE, PHASE_DAYS } from "./shared/constants.ts";
import { calculateSimulationResult } from "./shared/scoring.ts";
import { ROWS } from "./arena/render.ts";

// ── Constants ───────────────────────────────────────────────────────────────

const DRAFT_POOL_SIZE = 7;
const DRAFT_PICK_TARGET = HAND_SIZE; // 5

const VERSION = "0.3.0";
const gameName = "Trekkopoly";
console.log(`${gameName} v${VERSION} running!`);

// Initialise audio
setupGameAudioDelegation();

// Register service worker
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("./sw.js")
			.then((reg) => console.log("SW registered:", reg.scope))
			.catch((err) => console.error("SW failed:", err));
	});
}

// ── Initialise deck ────────────────────────────────────────────────────────────

const fullDeck = createInitialDeck({
	cards: saigonFoodCards,
	fallbackCards: [],
	handSize: HAND_SIZE,
});

setDeck(shuffleCards(fullDeck));
setPlayerHand([]);
setCurrentDayIndex(0);

// ── Start Day 1 draft ─────────────────────────────────────────────────────────

startDailyDraft();

// ── Global game loop functions ────────────────────────────────────────────

/**
 * Deal DRAFT_POOL_SIZE (7) cards from the deck into the draft pool.
 * Set phase to "draft", render the game screen.
 */
function startDailyDraft() {
	const deck = getDeck();
	const shuffled = shuffleCards(deck);
	const pool = shuffled.slice(0, DRAFT_POOL_SIZE);
	setDeck(shuffled.slice(DRAFT_POOL_SIZE));
	setDraftPool(pool);
	setDraftRound(1);
	setDraftSelectedCardId(null);
	setPlayerHand([]);
	setGamePhase("draft");
	rerenderGameShell();
}

/**
 * After 5 picks are made: move the 5 picked cards (playerHand) from draft pool
 * into the placement hand. Return leftover pool cards to deck.
 */
function finishDailyDraft() {
	// Snapshot the hand into a fresh array to break shared reference
	setPlayerHand([...getPlayerHand()]);
	setGamePhase("placement");
	setDraftPool([]);
	setSelectedHandCardId(null);
	rerenderGameShell();
}

/**
 * Place the selected hand card onto a board cell.
 * Removes the card from hand. Does NOT refill hand (keeps it simple for MVP).
 */
function placeHandCardOnBoard(
	cardId: string,
	rowIndex: number,
	colIndex: number,
) {
	if (getGamePhase() !== "placement") return;
	if (colIndex !== getCurrentDayIndex()) return;

	const hand = getPlayerHand();
	const handIndex = hand.findIndex((c) => c.id === cardId);
	if (handIndex === -1) return;

	const card = hand[handIndex];
	hand.splice(handIndex, 1);
	setPlayerHand(hand);

	const board = getBoardSlots();
	board[rowIndex][colIndex] = card;
	setCurrentPlayerBoard(board);

	setSelectedHandCardId(null);
	setFocusedHandCardId(null);
	setFocusedBoardCard(null);
	rerenderGameShell();
}

/**
 * End the current day: score base VP from the day's board cells,
 * advance to next day (or finish).
 */
function endCurrentDay() {
	if (getGamePhase() !== "placement") return;

	// Launch simulation instead of immediately advancing
	setGamePhase("simulation");
	setSelectedHandCardId(null);
	setFocusedHandCardId(null);
	setFocusedBoardCard(null);
	runSystemSimulation();
	rerenderGameShell();
}

// ── Simulation system ────────────────────────────────────────────────────────

/**
 * Run the simulation engine for the current day's board column.
 * Calculates the result, starts a step-by-step replay, and advances
 * the day when complete.
 */
function runSystemSimulation() {
	const boardSlots = getBoardSlots();
	const dayIndex = getCurrentDayIndex();
	const dayLabel = `Ngày ${dayIndex + 1}`;

	const result = calculateSimulationResult({
		boardSlots,
		currentDayIndex: dayIndex,
		dayLabel,
		rows: ROWS,
		getBoardDisplayName: (card) => card.name,
		getCardTagKeys: (card) => {
			if (card.tags && card.tags.length > 0)
				return card.tags.map((t) => t.toUpperCase());
			return [card.tag.toUpperCase()];
		},
		countCardsWithTag: (cards, tag) =>
			cards.filter((c) => {
				const keys = c.tags?.length
					? c.tags.map((t) => t.toUpperCase())
					: [c.tag.toUpperCase()];
				return keys.includes(tag);
			}).length,
		getCurrentDayPlacedCards: () => {
			const b = getBoardSlots();
			return (b as (TravelCard | null)[][])
				.map((row: (TravelCard | null)[]) => row[dayIndex])
				.filter((c: TravelCard | null): c is NonNullable<typeof c> => c !== null);
		},
	});

	setSimulationResult(result);
	setSimulationReplayIndex(0);
	setIsReplayComplete(false);

	// Start replay timer: advance one step every 850ms
	const timerId = window.setInterval(() => {
		const currentIdx = getSimulationReplayIndex();
		const totalSteps = result.replaySteps.length;

		if (currentIdx >= totalSteps) {
			// Replay complete — apply score then advance
			clearSimulationTimer();
			setIsReplayComplete(true);
			applyDailyScoreOnce();
			rerenderGameShell();

			// Advance to next day after 2s
			window.setTimeout(() => {
				startNextDayOrPhase();
			}, 2000);
			return;
		}

		// Advance to next step
		setSimulationReplayIndex(currentIdx + 1);
		rerenderGameShell();
	}, 850);

	setSimulationTimerId(timerId);
}

function clearSimulationTimer() {
	const id = getSimulationTimerId();
	if (id !== null) {
		clearInterval(id);
		setSimulationTimerId(null);
	}
}

let hasAppliedSimulationScore = false;

function applyDailyScoreOnce() {
	if (hasAppliedSimulationScore) return;
	hasAppliedSimulationScore = true;

	const result = getSimulationResult();
	if (!result) return;

	setAccumulatedVP(getAccumulatedVP() + result.finalVP);
}

function startNextDayOrPhase() {
	// Reset simulation state
	clearSimulationTimer();
	setSimulationResult(null);
	setSimulationReplayIndex(0);
	setIsReplayComplete(false);
	hasAppliedSimulationScore = false;

	const nextDay = getCurrentDayIndex() + 1;

	if (nextDay >= PHASE_DAYS) {
		// Game over
		setGamePhase("finished");
		setPlayerHand([]);
		setSelectedHandCardId(null);
	} else {
		setCurrentDayIndex(nextDay);
		startDailyDraft();
	}

	rerenderGameShell();
}

// ── Expose global functions (called from inline onclick in render.ts) ───────

/**
 * Hand card clicked during placement phase.
 * Toggles selection; also toggles focused popup on re-click.
 */
(globalThis as any).selectHandCard = (cardId: string) => {
	const phase = getGamePhase();

	if (phase === "draft") {
		// ── Draft phase: pick the card for this round ──
		const pool = getDraftPool();
		const picked = pool.find((c) => c.id === cardId);
		if (!picked) return;

		const currentHand = getPlayerHand();
		currentHand.push(picked);
		setPlayerHand(currentHand);

		// Return remaining pool cards to deck
		const remaining = pool.filter((c) => c.id !== cardId);
		const deck = getDeck();
		setDeck(shuffleCards([...deck, ...remaining]));

		const round = getDraftRound();
		if (round >= DRAFT_PICK_TARGET) {
			finishDailyDraft();
		} else {
			// Pool shrinks each round simulating a pack being passed around
			// Round 1: 7 cards, Round 2: 6, ..., Round 5: 3
			const nextPoolSize = DRAFT_POOL_SIZE - round;
			const newDeck = getDeck();
			const shuffled = shuffleCards(newDeck);
			setDraftPool(shuffled.slice(0, nextPoolSize));
			setDeck(shuffled.slice(nextPoolSize));
			setDraftRound(round + 1);
			rerenderGameShell();
		}
		return;
	}

	if (phase === "placement") {
		// ── Placement phase: select/deselect card ──
		const currentSelected = getSelectedHandCardId();
		if (currentSelected === cardId) {
			if (getShowFocusedPopup()) {
				setFocusedHandCardId(null);
				setShowFocusedPopup(false);
			} else {
				setFocusedHandCardId(cardId);
				setShowFocusedPopup(true);
			}
		} else {
			setSelectedHandCardId(cardId);
			setFocusedHandCardId(null);
			setShowFocusedPopup(false);
		}
		rerenderGameShell();
		return;
	}
};

(globalThis as any).clearSelectedHandCard = () => {
	setSelectedHandCardId(null);
	setFocusedHandCardId(null);
	setShowFocusedPopup(false);
	rerenderGameShell();
};

/**
 * Board cell click — places the selected card if in placement phase
 * and the cell is in the current day column.
 */
(globalThis as any).handleBoardCellClick = (
	rowIndex: number,
	colIndex: number,
) => {
	if (getGamePhase() === "placement") {
		const selectedId = getSelectedHandCardId();
		if (selectedId) {
			placeHandCardOnBoard(selectedId, rowIndex, colIndex);
		}
	}
};

/**
 * End the current day and advance the game.
 */
(globalThis as any).endCurrentDay = () => {
	endCurrentDay();
};

// ── Start the app — render the game screen ──────────────────────────────────

transitionToScreen("game");
