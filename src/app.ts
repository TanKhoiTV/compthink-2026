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
	getRemainingTurnSeconds,
	setRemainingTurnSeconds,
	getLocalCoinDebt,
	setLocalCoinDebt,
	setSuppressNextClick,
	getHoldTimerId,
	setHoldTimerId,
} from "./state.ts";
import type { TravelCard } from "./shared/types.ts";
import { createInitialDeck, shuffleCards } from "./shared/deck.ts";
import { saigonFoodCards } from "./shared/data/index.ts";
import {
	HAND_SIZE,
	STARTING_COIN,
	STARTING_STAMINA,
	PHASE_DAYS,
	DRAFT_PICK_SECONDS,
	TURN_DURATION_SECONDS,
} from "./shared/constants.ts";
import { calculateBoardTotals } from "./shared/board.ts";
import { getRemainingResources } from "./shared/resources.ts";
import { calculateSimulationResult } from "./shared/scoring.ts";
import type { GameSoundName } from "./audio/gameAudio.ts";
import { ROWS } from "./arena/render.ts";

// ── Constants ───────────────────────────────────────────────────────────────

const DRAFT_POOL_SIZE = 7;
const DRAFT_PICK_TARGET = HAND_SIZE; // 5

const VERSION = "0.14.0";
const BUILD_TIME = "__BUILD_TIME_PLACEHOLDER__";
const gameName = "Trekkopoly";
console.log(`${gameName} v${VERSION} (build ${BUILD_TIME}) running!`);

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
	setIsInitialDealInProgress(true);
	playGameSound("deal");
	rerenderGameShell();

	// Deal animation: after render, add .deal-active to trigger CSS, then finish after 1320ms
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
	}, 1320);
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

	hand.splice(handIndex, 1);
	setPlayerHand(hand);

	const board = getBoardSlots();
	board[rowIndex][colIndex] = card;
	setCurrentPlayerBoard(board);

	setSelectedHandCardId(null);
	setFocusedHandCardId(null);
	setFocusedBoardCard(null);
	playGameSound("cardPlace");
	rerenderGameShell();

	// Flash animation on the placed cell
	requestAnimationFrame(() => {
		const cell = document.querySelector(
			`[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`,
		);
		if (cell) {
			cell.classList.add("board-cell--just-placed");
			setTimeout(
				() => cell.classList.remove("board-cell--just-placed"),
				500,
			);
		}
	});
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
		playSimulationScanSoundForCurrentStep();
		rerenderGameShell();
	}, 850);

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
	}, 1000);

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
	}, 1000);
}

function startNextDayOrPhase() {
	stopTurnTimer();

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

		playGameSound("cardSelect");

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
			// Timer restart is done inside deal animation callback
			window.setTimeout(() => {
				startDraftTimer();
			}, 1320);
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

// ── Focused card popup (hold 500ms to view enlarged card) ────────────────

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
	}, 500);

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
	wrapper.style.zIndex = "10000";
	// biome-ignore lint/suspicious/noInnerHTML: template from own render code, not user input
	wrapper.innerHTML = html;

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

/**
 * End the current day and advance the game.
 */
(globalThis as any).endCurrentDay = () => {
	endCurrentDay();
};

// ── Start the app — render the game screen ──────────────────────────────────

transitionToScreen("game");
syncInGameBgm();
