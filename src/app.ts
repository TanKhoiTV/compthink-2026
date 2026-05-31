/**
 * app.ts — Application entry point and game loop.
 *
 * Mirrors the old Trekkopoly/src/app.ts game loop (single-player local mode):
 *   draft → placement → endDay → draft (next day) → ... → finished
 *
 * Draft: 7 cards, pick 1 per round × 5 rounds → 5 cards in hand.
 * Placement: click card → click board cell → place. "End Day" to advance.
 * Day advance: score base VP → increment day → start new draft or finish.
 */

import { setupGameAudioDelegation, playGameSound } from "./audio/gameAudio.ts";
import type { SimulationReplayStep } from "./shared/scoring.ts";
import {
	rerenderGameShell,
	transitionToScreen,
	updateTimerDom,
} from "./router.ts";
import { renderFocusedCard } from "./arena/render.ts";
import {
	setDeck,
	setPlayerHand,
	setCurrentDayIndex,
	setGamePhase,
	setDraftPool,
	setDraftRound,
	setDraftSelectedCardId,
	setDraftPickSecondsLeft,
	getDraftPickSecondsLeft,
	setDraftTimerId,
	getDraftTimerId,
	setSelectedHandCardId,
	setFocusedHandCardId,
	setFocusedBoardCard,
	getFocusedBoardCard,
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
	setShowFocusedPopup,
	getSimulationResult,
	setSimulationResult,
	getSimulationReplayIndex,
	setSimulationReplayIndex,
	setIsReplayComplete,
	getSimulationTimerId,
	setSimulationTimerId,
	setIsInitialDealInProgress,
	getIsInitialDealInProgress,
	setIsPassingDraftCards,
	getIsPassingDraftCards,
	getRemainingTurnSeconds,
	setRemainingTurnSeconds,
	getLocalCoinDebt,
	setLocalCoinDebt,
	setSuppressNextClick,
	getHoldTimerId,
	setHoldTimerId,
	getHandPointerDragState,
	setHandPointerDragState,
	setDraggedHandCardId,
	getPlacingInProgress,
	setPlacingInProgress,
	getSimulationAdvanceTimeoutId,
	setSimulationAdvanceTimeoutId,
	setDebtModalVisible,
	setDebtModalNotice,
	getDebtModalTimerId,
	setDebtModalTimerId,
	clearDebtModalTimer,
	getPlayerBoards,
	getOpponentPlayerIds,
	addDiscardedResourceBonus,
} from "./state.ts";
import { isConnected } from "./online/socketClient.ts";
import "./online/lobbyClient.ts"; // Side-effect: binds lobby globals
import type { PlayerId } from "./shared/client-types.ts";
import type { TravelCard } from "./shared/types.ts";
import { createInitialDeck, shuffleCards } from "./shared/deck.ts";
import { allCards } from "./shared/data/cards.all.ts";
import {
	HAND_SIZE,
	STARTING_COIN,
	STARTING_STAMINA,
	PHASE_DAYS,
	DRAFT_PICK_SECONDS,
	TURN_DURATION_SECONDS,
} from "./shared/constants.ts";
import {
	DEAL_ANIMATION_MS,
	PASS_ANIMATION_MS,
	SIMULATION_STEP_INTERVAL_MS,
	SIMULATION_ADVANCE_DELAY_MS,
	BOARD_CELL_FLASH_MS,
	HOLD_TO_FOCUS_MS,
	DEBT_MODAL_AUTO_CLOSE_MS,
	TIMER_TICK_INTERVAL_MS,
	FOCUSED_CARD_ZINDEX,
} from "./shared/animations.ts";
import { calculateBoardTotals } from "./shared/board.ts";
import { getRemainingResources } from "./shared/resources.ts";
import { calculateSimulationResult } from "./shared/scoring.ts";
import type { GameSoundName } from "./audio/gameAudio.ts";
import { ROWS } from "./arena/render.ts";
import { VERSION, BUILD_TIME, APP_NAME } from "./version.ts";

// ── Constants ───────────────────────────────────────────────────────────────

const DRAFT_POOL_SIZE = 7;
const DRAFT_PICK_TARGET = HAND_SIZE; // 5

console.log(`${APP_NAME} v${VERSION} (build ${BUILD_TIME}) running!`);

// ── Exhaust lock token system ──────────────────────────────────────────────

function createExhaustLockTokenCard(params: {
	rowIndex: number;
	colIndex: number;
	sourceCardName: string;
}): TravelCard {
	return {
		id: `exhaust_lock_${params.rowIndex}_${params.colIndex}_${Date.now()}`,
		name: "Bị khóa",
		shortName: "Bị khóa",
		city: "Kiệt sức",
		shortCity: "Kiệt sức",
		image: "assets/images/card-food.png",
		rarity: "common",
		rarityLabel: "!",
		vp: 0,
		coin: 0,
		stamina: 0,
		tag: "UTILITY",
		tagLabel: "Khóa",
		tags: ["UTILITY"],
		icon: "🔒",
		description: `Ô này bị khóa vì đã vay thể lực ở ${params.sourceCardName}.`,
		bonusText: "Không thể xếp bài vào ô này.",
		boardTokenType: "lock",
		lockedReason: "Kiệt sức",
		sourceCardName: params.sourceCardName,
		// Satisfy required TravelCard fields
		card_id: `exhaust_lock_${params.rowIndex}_${params.colIndex}_${Date.now()}`,
		cost: 0,
		on_play_effect: "NONE",
		victory_point: 0,
		coordinates: { lat: 0, lng: 0 },
	};
}

function getNextTimeSlotPosition(
	rowIndex: number,
	colIndex: number,
): { rowIndex: number; colIndex: number } | null {
	const board = getBoardSlots();
	const numRows = board.length;
	const numCols = board[0]?.length ?? 0;

	if (rowIndex < numRows - 1) {
		return { rowIndex: rowIndex + 1, colIndex };
	}

	if (colIndex < numCols - 1) {
		return { rowIndex: 0, colIndex: colIndex + 1 };
	}

	return null;
}

function addStaminaDebtAndLockToken(params: {
	rowIndex: number;
	colIndex: number;
	card: TravelCard;
	staminaDebt: number;
}) {
	if (params.staminaDebt <= 0) return;

	const nextPosition = getNextTimeSlotPosition(
		params.rowIndex,
		params.colIndex,
	);

	if (!nextPosition) return;
	const board = getBoardSlots();
	if (board[nextPosition.rowIndex]?.[nextPosition.colIndex] !== null) return;

	board[nextPosition.rowIndex][nextPosition.colIndex] =
		createExhaustLockTokenCard({
			rowIndex: nextPosition.rowIndex,
			colIndex: nextPosition.colIndex,
			sourceCardName: params.card.name,
		});
	setCurrentPlayerBoard(board);
}

// Initialise audio
setupGameAudioDelegation();

// ── BGM (background music) with volume/mute toggle ──────────────────────────

const IN_GAME_BGM_SRC = "assets/audio/music/in-game-background.mp3";
const DEFAULT_BGM_VOLUME = 0.5;
const BGM_MUTED_KEY = "compthink.bgmMuted";
const BGM_VOLUME_KEY = "compthink.bgmVolume";

let inGameBgm: HTMLAudioElement | null = null;
let isMusicMuted = localStorage.getItem(BGM_MUTED_KEY) === "true";
const musicVolume =
	Number(localStorage.getItem(BGM_VOLUME_KEY)) || DEFAULT_BGM_VOLUME;

function clampVolume(v: number): number {
	return Math.max(0, Math.min(1, v));
}

function getInGameBgm(): HTMLAudioElement {
	if (!inGameBgm) {
		const audio = new Audio(IN_GAME_BGM_SRC);
		audio.loop = true;
		audio.preload = "auto";
		audio.volume = clampVolume(musicVolume);
		audio.muted = isMusicMuted;
		inGameBgm = audio;
	}
	return inGameBgm;
}

function syncInGameBgm() {
	const audio = getInGameBgm();
	audio.volume = clampVolume(musicVolume);
	audio.muted = isMusicMuted;

	if (isMusicMuted || musicVolume <= 0) {
		audio.pause();
		return;
	}

	if (audio.paused) {
		audio.play().catch(() => {
			/* Browser blocks autoplay — will retry on next pointerdown */
		});
	}
}

function setupInGameBgmDelegation() {
	const tryPlay = () => syncInGameBgm();
	document.addEventListener("pointerdown", tryPlay, { passive: true });
	document.addEventListener("keydown", tryPlay);
}

setupInGameBgmDelegation();

// Expose globally for inline click handlers
(globalThis as any).toggleMusicMute = () => {
	isMusicMuted = !isMusicMuted;
	localStorage.setItem(BGM_MUTED_KEY, String(isMusicMuted));
	syncInGameBgm();
	// Update the toggle button icon
	const btn = document.querySelector(".music-toggle-btn");
	if (btn) {
		const icon = btn.querySelector(".music-toggle-btn__icon");
		if (icon) icon.textContent = isMusicMuted ? "🔇" : "🔊";
		btn.classList.toggle("is-muted", isMusicMuted);
	}
};

(globalThis as any).getMusicState = () => ({
	muted: isMusicMuted,
	volume: clampVolume(musicVolume),
});

// Register service worker + auto-update on new deploy
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("./sw.js")
			.then((reg) => {
				console.log("SW registered:", reg.scope);

				// If a new SW is already waiting, activate it immediately
				if (reg.active && reg.waiting) {
					reg.waiting.postMessage("SKIP_WAITING");
				}

				// Listen for new SW installations
				reg.addEventListener("updatefound", () => {
					const newWorker = reg.installing;
					if (!newWorker) return;

					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// New SW is ready — activate it
							newWorker.postMessage("SKIP_WAITING");
						}
					});
				});
			})
			.catch((err) => console.error("SW failed:", err));
	});

	// Reload page when a new SW takes over
	navigator.serviceWorker.addEventListener("controllerchange", () => {
		console.log("SW updated — reloading for latest version");
		window.location.reload();
	});
}

// ── Initialise deck ────────────────────────────────────────────────────────────

// ── Lazy single-player game init ──────────────────────────────────────────
// DON'T start the game on module load — it runs under dashboard/online too.
// Defer until user clicks single-player "Chơi".

let singlePlayerStarted = false;

function startSinglePlayerGame() {
	if (singlePlayerStarted) return;
	singlePlayerStarted = true;

	const fullDeck = createInitialDeck({
		cards: allCards,
		fallbackCards: [],
		handSize: HAND_SIZE,
	});

	setDeck(shuffleCards(fullDeck));
	setPlayerHand([]);
	setCurrentDayIndex(0);

	startDailyDraft();
}

// Expose globally so dashboard.ts's gotoMapSelection can call it
(globalThis as any).startSinglePlayerGame = startSinglePlayerGame;

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
	setIsInitialDealInProgress(true);
	playGameSound("deal");
	rerenderGameShell();

	// Deal animation: after render, add .deal-active to trigger CSS, then finish
	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(() => {
			const handElement = document.querySelector(".player-hand--draft");
			handElement?.classList.add("deal-active");
		});
	});

	window.setTimeout(() => {
		setIsInitialDealInProgress(false);
		const handElement = document.querySelector(".player-hand");
		handElement?.classList.remove(
			"player-hand--dealing",
			"is-dealing",
			"deal-active",
		);
		startDraftTimer();
	}, DEAL_ANIMATION_MS);
}

/**
 * After 5 picks are made: move the 5 picked cards (playerHand) from draft pool
 * into the placement hand. Return leftover pool cards to deck.
 */
function finishDailyDraft() {
	stopDraftTimer();
	// Snapshot the hand into a fresh array to break shared reference
	setPlayerHand([...getPlayerHand()]);
	setGamePhase("placement");
	setDraftPool([]);
	setSelectedHandCardId(null);
	playGameSound("returnDeck");
	setRemainingTurnSeconds(TURN_DURATION_SECONDS);
	startTurnTimer();
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
	// Re-entrancy guard — prevent double-fire from click + drag-drop racing
	if (getPlacingInProgress()) return;
	setPlacingInProgress(true);

	const board = getBoardSlots();
	if (board[rowIndex]?.[colIndex] !== null) {
		setPlacingInProgress(false);
		return;
	}

	const hand = getPlayerHand();
	const handIndex = hand.findIndex((c) => c.id === cardId);
	if (handIndex === -1) return;

	const card = hand[handIndex];

	// Calculate resource debt before placing
	const totals = calculateBoardTotals(getBoardSlots());
	const remaining = getRemainingResources({
		totals,
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
	});
	const coinDebt = Math.max(0, card.coin - remaining.coin);
	if (coinDebt > 0) {
		setLocalCoinDebt(getLocalCoinDebt() + coinDebt);
	}

	const staminaDebt = Math.max(0, card.stamina - remaining.stamina);

	hand.splice(handIndex, 1);
	setPlayerHand(hand);

	board[rowIndex][colIndex] = card;
	setCurrentPlayerBoard(board);

	// Place exhaust lock token if stamina debt incurred
	addStaminaDebtAndLockToken({
		rowIndex,
		colIndex,
		card,
		staminaDebt,
	});

	setSelectedHandCardId(null);
	setFocusedHandCardId(null);
	setFocusedBoardCard(null);
	playGameSound("cardPlace");
	rerenderGameShell();

	// Release re-entrancy guard after render completes
	setPlacingInProgress(false);

	// Flash animation on the placed cell
	requestAnimationFrame(() => {
		const cell = document.querySelector(
			`[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`,
		);
		if (cell) {
			cell.classList.add("board-cell--just-placed");
			setTimeout(
				() => cell.classList.remove("board-cell--just-placed"),
				BOARD_CELL_FLASH_MS,
			);
		}
	});

	// Place bot cards after player move (if offline)
	if (!isConnected()) {
		placeBotCardsAfterPlayerMove(card);
	}
}

/**
 * Place bot cards on opponent boards after the player places a card.
 * Each bot places one card (up to 3 per day) using the player's card as a template.
 */
function placeBotCardsAfterPlayerMove(sourceCard: TravelCard) {
	const opponentIds = getOpponentPlayerIds();
	opponentIds.forEach((playerId: PlayerId) => {
		const board = getPlayerBoards()[playerId];
		const dayIndex = getCurrentDayIndex();

		if (!board || !board.length) return;

		// Count existing cards in this bot's current day
		let count = 0;
		for (const row of board) {
			if (row[dayIndex] !== null) count += 1;
		}
		if (count >= 3) return;

		// Find first empty slot in current day
		for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
			if (board[rowIndex]?.[dayIndex] === null) {
				board[rowIndex][dayIndex] = sourceCard;
				break;
			}
		}
	});

	rerenderGameShell();
}

/**
 * End the current day: score base VP from the day's board cells,
 * advance to next day (or finish).
 */
function endCurrentDay() {
	if (getGamePhase() !== "placement") return;

	stopTurnTimer();

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
				.filter(
					(c: TravelCard | null): c is NonNullable<typeof c> => c !== null,
				);
		},
	});

	setSimulationResult(result);
	setSimulationReplayIndex(0);
	setIsReplayComplete(false);

	// Start replay timer: advance one step at a time
	const timerId = window.setInterval(() => {
		const currentIdx = getSimulationReplayIndex();
		const totalSteps = result.replaySteps.length;

		if (currentIdx >= totalSteps) {
			// Replay complete — apply score then advance
			clearSimulationTimer();
			setIsReplayComplete(true);
			applyDailyScoreOnce();
			rerenderGameShell();

			// Advance to next day after a short pause
			const advanceTimeoutId = window.setTimeout(() => {
				setSimulationAdvanceTimeoutId(null);
				startNextDayOrPhase();
			}, SIMULATION_ADVANCE_DELAY_MS);
			setSimulationAdvanceTimeoutId(advanceTimeoutId);
			return;
		}

		// Advance to next step
		setSimulationReplayIndex(currentIdx + 1);
		playSimulationScanSoundForCurrentStep();
		rerenderGameShell();
	}, SIMULATION_STEP_INTERVAL_MS);

	setSimulationTimerId(timerId);
}

function playSimulationScanSoundForCurrentStep() {
	const result = getSimulationResult();
	if (!result) return;

	const replayIndex = getSimulationReplayIndex();
	if (replayIndex <= 0) return;

	const step = result.replaySteps[replayIndex - 1];
	if (!step) return;

	const eventSoundName = getSimulationEventSoundName(step);
	const isBad = isBadSimulationReplayStep(step);

	playGameSound(eventSoundName ?? (isBad ? "scanBad" : "scanCell"));
}

function isBadSimulationReplayStep(step: SimulationReplayStep): boolean {
	return (
		step.isBadEvent === true ||
		step.eventType === "traffic" ||
		step.eventType === "storm" ||
		step.eventType === "distance"
	);
}

function getSimulationEventSoundName(
	step: SimulationReplayStep,
): GameSoundName | null {
	if (!step.eventType) return null;
	if (step.eventType === "promo") return "eventPromo";
	if (step.eventType === "traffic") return "eventTraffic";
	if (step.eventType === "storm") return "eventStorm";
	if (step.eventType === "distance") return "eventDistance";
	return null;
}

function clearSimulationTimer() {
	const id = getSimulationTimerId();
	if (id !== null) {
		clearInterval(id);
		setSimulationTimerId(null);
	}
}

function cancelSimulationAdvanceTimeout() {
	const id = getSimulationAdvanceTimeoutId();
	if (id !== null) {
		clearTimeout(id);
		setSimulationAdvanceTimeoutId(null);
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

// ── Draft timer ───────────────────────────────────────────────────────────

function startDraftTimer() {
	stopDraftTimer();

	if (getGamePhase() !== "draft") return;

	setDraftPickSecondsLeft(DRAFT_PICK_SECONDS);

	const timerId = window.setInterval(() => {
		const seconds = getDraftPickSecondsLeft() - 1;
		setDraftPickSecondsLeft(seconds);

		if (seconds <= 0) {
			setDraftPickSecondsLeft(0);
			autoPickDraftCard();
			return;
		}

		updateTimerDom();
	}, TIMER_TICK_INTERVAL_MS);

	setDraftTimerId(timerId);
}

function stopDraftTimer() {
	const id = getDraftTimerId();
	if (id !== null) {
		clearInterval(id);
		setDraftTimerId(null);
	}
}

function autoPickDraftCard() {
	stopDraftTimer();

	const pool = getDraftPool();
	if (pool.length === 0) return;

	// Pick the first unpicked card in the pool
	const picked = pool[0];
	(globalThis as any).selectHandCard?.(picked.id);
}

// ── Placement turn timer ─────────────────────────────────────────────────────

let placementTimerId: number | null = null;

function stopTurnTimer() {
	if (placementTimerId !== null) {
		clearInterval(placementTimerId);
		placementTimerId = null;
	}
}

function startTurnTimer() {
	stopTurnTimer();

	if (getGamePhase() !== "placement") return;

	setRemainingTurnSeconds(TURN_DURATION_SECONDS);

	placementTimerId = window.setInterval(() => {
		const secs = getRemainingTurnSeconds() - 1;
		setRemainingTurnSeconds(secs);

		if (secs <= 0) {
			setRemainingTurnSeconds(0);
			stopTurnTimer();
			endCurrentDay();
			return;
		}

		updateTimerDom();
	}, TIMER_TICK_INTERVAL_MS);
}

function startNextDayOrPhase() {
	// Guard: only advance from simulation or placement; prevents stale
	// timeouts from a previous replay from advancing the game out of order.
	const phase = getGamePhase();
	if (phase !== "simulation" && phase !== "placement") return;

	stopTurnTimer();
	cancelSimulationAdvanceTimeout();

	// Apply coin debt penalty before advancing
	const debt = getLocalCoinDebt();
	if (debt > 0) {
		setAccumulatedVP(getAccumulatedVP() - debt * 10);
		setLocalCoinDebt(0);
	}

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

// ── Drag-and-drop: pointer drag from hand to board ────────────────────────

function clearBoardDragState() {
	const dragState = getHandPointerDragState();
	dragState?.clone?.remove();
	setHandPointerDragState(null);
	setDraggedHandCardId(null);
	clearDeckDiscardHoverClass();
	document
		.querySelectorAll(".board-cell--drag-hover, .board-cell--drag-invalid")
		.forEach((el) => {
			el.classList.remove("board-cell--drag-hover");
			el.classList.remove("board-cell--drag-invalid");
		});
	document
		.querySelectorAll(".hand-card--drag-source-hidden")
		.forEach((el) => el.classList.remove("hand-card--drag-source-hidden"));
}

function getDropCellFromPointer(event: PointerEvent): HTMLElement | null {
	const el = document.elementFromPoint(event.clientX, event.clientY);
	return el?.closest('[data-board-cell="true"]') as HTMLElement | null;
}

function getDeckDiscardTargetFromPointer(
	event: PointerEvent,
): HTMLElement | null {
	const el = document.elementFromPoint(event.clientX, event.clientY);
	return el?.closest('[data-discard-drop-zone="true"]') as HTMLElement | null;
}

function canDiscardHandCard(): boolean {
	const phase = getGamePhase();
	return (
		phase !== "draft" && phase !== "simulation" && !getIsInitialDealInProgress()
	);
}

function clearDeckDiscardHoverClass() {
	document
		.querySelectorAll(".deck-pile-panel--discard-hover")
		.forEach((el) => el.classList.remove("deck-pile-panel--discard-hover"));
}

function discardHandCardToDeck(cardId: string) {
	if (!canDiscardHandCard()) return;

	const hand = getPlayerHand();
	const handIndex = hand.findIndex((c) => c.id === cardId);
	if (handIndex === -1) return;

	const card = hand[handIndex];
	playGameSound("returnDeck");

	hand.splice(handIndex, 1);
	setPlayerHand(hand);

	addDiscardedResourceBonus(card.coin, card.stamina);

	setSelectedHandCardId(null);
	setDraggedHandCardId(null);
	setFocusedHandCardId(null);
	setFocusedBoardCard(null);
	setSuppressNextClick(false);

	rerenderGameShell();
}

(globalThis as any).startHandPointerDrag = (
	event: PointerEvent,
	id: string,
) => {
	if (getGamePhase() !== "placement") return;
	if (getIsInitialDealInProgress()) return;
	if (event.button !== 0) return;

	const source = event.currentTarget as HTMLElement | null;
	if (!source) return;

	const card = getPlayerHand().find((c) => c.id === id);
	if (!card) return;

	// Clear any existing drag state
	clearBoardDragState();

	setHandPointerDragState({
		id,
		source,
		clone: null,
		startX: event.clientX,
		startY: event.clientY,
		offsetX: 0,
		offsetY: 0,
		isDragging: false,
	});

	document.addEventListener("pointermove", handleHandPointerMove);
	document.addEventListener("pointerup", handleHandPointerUp);
	document.addEventListener("pointercancel", handleHandPointerCancel);
};

function beginHandCardVisualDrag(event: PointerEvent) {
	const dragState = getHandPointerDragState();
	if (!dragState || dragState.isDragging) return;

	(globalThis as any).cancelHoldHandCard?.();

	const { source } = dragState;
	const rect = source.getBoundingClientRect();
	const clone = source.cloneNode(true) as HTMLElement;

	clone.classList.add("hand-card--drag-clone");
	clone.classList.remove("hand-card--selected");
	clone.style.width = `${rect.width}px`;
	clone.style.height = `${rect.height}px`;
	clone.style.left = `${rect.left}px`;
	clone.style.top = `${rect.top}px`;
	clone.style.transform = "none";
	clone.style.pointerEvents = "none";
	document.body.appendChild(clone);

	source.classList.add("hand-card--drag-source-hidden");

	dragState.clone = clone;
	dragState.offsetX = event.clientX - rect.left;
	dragState.offsetY = event.clientY - rect.top;
	dragState.isDragging = true;

	setDraggedHandCardId(dragState.id);
	setSelectedHandCardId(dragState.id);

	updateHandCardDragPosition(event);
}

function updateHandCardDragPosition(event: PointerEvent) {
	const dragState = getHandPointerDragState();
	if (!dragState?.clone) return;

	dragState.clone.style.left = `${event.clientX - dragState.offsetX}px`;
	dragState.clone.style.top = `${event.clientY - dragState.offsetY}px`;
}

function handleHandPointerMove(event: PointerEvent) {
	const dragState = getHandPointerDragState();
	if (!dragState) return;

	const dx = event.clientX - dragState.startX;
	const dy = event.clientY - dragState.startY;

	if (!dragState.isDragging && Math.hypot(dx, dy) >= 8) {
		beginHandCardVisualDrag(event);
	}

	if (!dragState.isDragging) return;

	event.preventDefault();
	updateHandCardDragPosition(event);

	// Clear old hover states
	clearDeckDiscardHoverClass();
	document
		.querySelectorAll(".board-cell--drag-hover, .board-cell--drag-invalid")
		.forEach((el) => {
			el.classList.remove("board-cell--drag-hover");
			el.classList.remove("board-cell--drag-invalid");
		});

	// Check discard zone hover first
	const discardTarget = getDeckDiscardTargetFromPointer(event);
	if (discardTarget && canDiscardHandCard()) {
		discardTarget.classList.add("deck-pile-panel--discard-hover");
		return;
	}

	const dropCell = getDropCellFromPointer(event);
	if (!dropCell) return;

	const rowIndex = Number(dropCell.dataset.rowIndex);
	const colIndex = Number(dropCell.dataset.colIndex);
	const currentDay = getCurrentDayIndex();

	// Only highlight cells for the current day column
	if (
		Number.isInteger(rowIndex) &&
		Number.isInteger(colIndex) &&
		colIndex === currentDay &&
		getBoardSlots()[rowIndex]?.[colIndex] === null
	) {
		dropCell.classList.add("board-cell--drag-hover");
	} else {
		dropCell.classList.add("board-cell--drag-invalid");
	}
}

function handleHandPointerUp(event: PointerEvent) {
	document.removeEventListener("pointermove", handleHandPointerMove);
	document.removeEventListener("pointerup", handleHandPointerUp);
	document.removeEventListener("pointercancel", handleHandPointerCancel);

	const dragState = getHandPointerDragState();
	if (!dragState) return;

	const wasDragging = dragState.isDragging;

	if (wasDragging) {
		const dropCell = getDropCellFromPointer(event);
		const discardTarget = getDeckDiscardTargetFromPointer(event);
		const rowIndex = Number(dropCell?.dataset.rowIndex);
		const colIndex = Number(dropCell?.dataset.colIndex);
		const currentDay = getCurrentDayIndex();
		const cardId = dragState.id;

		clearBoardDragState();

		setSuppressNextClick(true);
		setTimeout(() => setSuppressNextClick(false), 0);

		// Check discard zone first
		if (discardTarget && canDiscardHandCard()) {
			discardHandCardToDeck(cardId);
			return;
		}

		if (
			dropCell &&
			Number.isInteger(rowIndex) &&
			Number.isInteger(colIndex) &&
			colIndex === currentDay &&
			getBoardSlots()[rowIndex]?.[colIndex] === null
		) {
			placeHandCardOnBoard(cardId, rowIndex, colIndex);
			return;
		}

		// Drop rejected — deselect
		setSelectedHandCardId(null);
		return;
	}

	clearBoardDragState();
}

function handleHandPointerCancel() {
	document.removeEventListener("pointermove", handleHandPointerMove);
	document.removeEventListener("pointerup", handleHandPointerUp);
	document.removeEventListener("pointercancel", handleHandPointerCancel);
	clearBoardDragState();
}
(globalThis as any).selectHandCard = (cardId: string) => {
	const phase = getGamePhase();

	if (phase === "draft") {
		// Guard: prevent clicks during animation transitions
		if (getIsInitialDealInProgress() || getIsPassingDraftCards()) {
			return;
		}

		// ── Draft phase: pick the card, then animate remaining cards away ──
		const pool = getDraftPool();
		const picked = pool.find((c) => c.id === cardId);
		if (!picked) return;

		playGameSound("cardSelect");

		// Keep card in pool during pass animation (don't move to hand yet)
		setDraftSelectedCardId(cardId);

		const remaining = pool.filter((c) => c.id !== cardId);
		const round = getDraftRound();

		if (round >= DRAFT_PICK_TARGET) {
			// Last round — show pass animation before transitioning to placement
			stopDraftTimer();
			setIsPassingDraftCards(true);
			playGameSound("returnDeck");
			rerenderGameShell();

			window.setTimeout(() => {
				// Move picked card to hand
				const currentHand = getPlayerHand();
				currentHand.push(picked);
				setPlayerHand(currentHand);

				// Return remaining cards to deck
				const deck = getDeck();
				setDeck(shuffleCards([...deck, ...remaining]));

				setDraftSelectedCardId(null);
				setIsPassingDraftCards(false);
				finishDailyDraft();
			}, PASS_ANIMATION_MS);
		} else {
			// Stop draft timer, show pass animation
			stopDraftTimer();
			setIsPassingDraftCards(true);
			playGameSound("returnDeck");
			rerenderGameShell();

			// After animation completes, set up next round
			window.setTimeout(() => {
				// Move picked card to hand now
				const currentHand = getPlayerHand();
				currentHand.push(picked);
				setPlayerHand(currentHand);

				// Return remaining cards to deck
				const deck = getDeck();
				setDeck(shuffleCards([...deck, ...remaining]));

				// Pool shrinks each round: Round 1 → 7, 2 → 6, ..., 5 → 3
				const nextPoolSize = DRAFT_POOL_SIZE - round;
				const newDeck = getDeck();
				const shuffled = shuffleCards(newDeck);
				setDraftPool(shuffled.slice(0, nextPoolSize));
				setDeck(shuffled.slice(nextPoolSize));
				setDraftRound(round + 1);
				setDraftSelectedCardId(null);
				setIsPassingDraftCards(false);

				// Deal animation for the new round's pool
				setIsInitialDealInProgress(true);
				rerenderGameShell();

				window.requestAnimationFrame(() => {
					window.requestAnimationFrame(() => {
						const handElement = document.querySelector(".player-hand--draft");
						handElement?.classList.add("deal-active");
					});
				});

				window.setTimeout(() => {
					setIsInitialDealInProgress(false);
					const handElement = document.querySelector(".player-hand");
					handElement?.classList.remove(
						"player-hand--dealing",
						"is-dealing",
						"deal-active",
					);
					startDraftTimer();
				}, DEAL_ANIMATION_MS);
			}, PASS_ANIMATION_MS);
		}
		return;
	}

	if (phase === "placement") {
		// ── Placement phase: toggle selection via CSS class — no full rerender ──
		playGameSound("cardSelect");
		const currentSelected = getSelectedHandCardId();

		// Remove selection from all hand cards
		document
			.querySelectorAll("[data-hand-card-id].hand-card--selected")
			.forEach((el) => {
				el.classList.remove("hand-card--selected");
			});
		// Remove any focused popup overlay
		hideFocusedCardOverlay();

		if (currentSelected === cardId) {
			// Toggle off: deselect
			setSelectedHandCardId(null);
			setFocusedHandCardId(null);
			setShowFocusedPopup(false);
		} else {
			// Select the clicked card
			setSelectedHandCardId(cardId);
			setFocusedHandCardId(null);
			setShowFocusedPopup(false);
			const el = document.querySelector(
				`[data-hand-card-id="${CSS.escape(cardId)}"]`,
			);
			el?.classList.add("hand-card--selected");
		}

		return;
	}
};

// ── Focused card popup (hold to view enlarged card) ────────────────────

(globalThis as any).startHoldHandCard = (cardId: string) => {
	if (getGamePhase() === "simulation") return;

	clearHoldCardTimer();

	const id = window.setTimeout(() => {
		setFocusedHandCardId(cardId);
		setFocusedBoardCard(null);
		setSuppressNextClick(true);
		setShowFocusedPopup(true);
		setHoldTimerId(null);

		// Direct DOM injection — avoids flicker from full rerender
		showFocusedCardOverlay(cardId);
	}, HOLD_TO_FOCUS_MS);

	setHoldTimerId(id);
};

(globalThis as any).cancelHoldHandCard = () => {
	clearHoldCardTimer();
};

function clearHoldCardTimer() {
	const id = getHoldTimerId();
	if (id !== null) {
		clearTimeout(id);
		setHoldTimerId(null);
	}
}

function showFocusedCardOverlay(cardId: string) {
	// Remove any existing overlay first
	hideFocusedCardOverlay();

	// Find the card — check hand first, then draft pool
	let card: TravelCard | null =
		getPlayerHand().find((c) => c.id === cardId) ?? null;

	if (!card) {
		card = getDraftPool().find((c) => c.id === cardId) ?? null;
	}

	if (!card) {
		card = getFocusedBoardCard();
	}

	if (!card) return;

	const html = renderFocusedCard(card);

	// Create wrapper and insert into DOM
	const wrapper = document.createElement("div");
	wrapper.id = "focused-card-wrapper";
	wrapper.style.position = "relative";
	wrapper.style.zIndex = String(FOCUSED_CARD_ZINDEX);
	// Use DOMParser to safely parse HTML from our own render function
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	while (doc.body.firstChild) {
		wrapper.appendChild(doc.body.firstChild);
	}

	const app = document.getElementById("app");
	if (app) {
		app.appendChild(wrapper);

		// Attach close handler directly
		const closeBtn = document.getElementById("focused-card-close");
		if (closeBtn) {
			closeBtn.addEventListener("click", () => {
				// If there's a selected card, also close the focused card
				setFocusedHandCardId(null);
				setFocusedBoardCard(null);
				setShowFocusedPopup(false);
				hideFocusedCardOverlay();
			});
		}
	}
}

function hideFocusedCardOverlay() {
	const existing = document.getElementById("focused-card-wrapper");
	if (existing) {
		existing.remove();
	}
}

(globalThis as any).clearSelectedHandCard = () => {
	setSelectedHandCardId(null);
	setFocusedHandCardId(null);
	setShowFocusedPopup(false);
	hideFocusedCardOverlay();
	document
		.querySelectorAll("[data-hand-card-id].hand-card--selected")
		.forEach((el) => {
			el.classList.remove("hand-card--selected");
		});
	const popup = document.getElementById("focused-card-close");
	if (popup) {
		const overlay = popup.closest(".hand-card__overlay");
		overlay?.remove();
	}
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

// Expose playGameSound globally for inline onclick handlers
(globalThis as any).playGameSound = playGameSound;

// ── Certificate / Export ────────────────────────────────────────────────────

import {
	downloadTravelCertificateHtml,
	downloadTravelTimeline,
} from "./export/certificate.ts";

(globalThis as any).downloadTravelCertificateHtml = () => {
	downloadTravelCertificateHtml();
};
(globalThis as any).downloadTravelTimelineTxt = () => {
	downloadTravelTimeline("txt");
};
(globalThis as any).downloadTravelTimelineJson = () => {
	downloadTravelTimeline("json");
};

/**
 * End the current day and advance the game.
 */
(globalThis as any).endCurrentDay = () => {
	endCurrentDay();
};

// ── Debt modal globals ───────────────────────────────────────────────────────

(globalThis as any).openDebtTokenModal = () => {
	if (getLocalCoinDebt() <= 0) return;
	setDebtModalVisible(true);
	setDebtModalNotice("");
	rerenderGameShell();
};

(globalThis as any).closeDebtTokenModal = () => {
	setDebtModalVisible(false);
	setDebtModalNotice("");
	clearDebtModalTimer(); // Clean up any active timer
	rerenderGameShell();
};

(globalThis as any).payCurrentCoinDebt = () => {
	const debtAmount = getLocalCoinDebt();
	if (debtAmount <= 0) {
		(globalThis as any).closeDebtTokenModal();
		return;
	}

	const remaining = getRemainingResources({
		totals: calculateBoardTotals(getBoardSlots()),
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
	});
	const payableAmount = Math.min(remaining.coin, getLocalCoinDebt());

	if (payableAmount <= 0) {
		setDebtModalNotice("Bạn chưa có xu để trả nợ lúc này.");
		rerenderGameShell();
		return;
	}

	setLocalCoinDebt(getLocalCoinDebt() - payableAmount);
	// Deduct coin from resources (eventResourceModifier pattern)
	// We deduct by settng localCoinDebt less — in single-player the coin
	// tracking already deducted the original placement cost; paying debt
	// is an additional coin expense tracked via the debt board tokens.

	const newDebt = getLocalCoinDebt();
	const notice =
		newDebt > 0
			? `Đã trả ${payableAmount} xu. Hiện còn nợ ${newDebt} xu.`
			: `Đã trả hết nợ (${payableAmount} xu).`;
	setDebtModalNotice(notice);
	playGameSound("eventPromo");

	if (newDebt <= 0) {
		// Store timer ID for cleanup
		const timerId = window.setTimeout(() => {
			(globalThis as any).closeDebtTokenModal();
		}, DEBT_MODAL_AUTO_CLOSE_MS);
		// Use state to track debt modal timer for proper cleanup
		if (!getDebtModalTimerId()) {
			setDebtModalTimerId(timerId);
		} else {
			// Clear existing timer if any
			clearDebtModalTimer();
			setDebtModalTimerId(timerId);
		}
	}

	rerenderGameShell();
};

// ── Start the app — render dashboard ───────────────────────────────────────

transitionToScreen("dashboard");
