/**
 * router.ts — Screen shell, transitions, and rerender loop.
 *
 * Extracted from Trekkopoly/src/app.ts (lines 5362–5703, 5911–6093).
 */

import type { AppScreen } from "./shared/client-types.ts";
import { renderMainArena } from "./arena/render.ts";
import { renderDashboard } from "./screens/dashboard.ts";
import { renderOnlineGameArena } from "./screens/onlineGame.ts";
import {
	renderOnlineEntryScreen,
	renderOnlineLobbyRoomScreen,
} from "./screens/lobby.ts";
import {
	getCurrentLobbySnapshot,
	getSavedSession,
	getCurrentPlayerName,
	getCurrentRoomId,
	getCurrentGameSnapshot,
} from "./online/lobbyClient.ts";
import { getAuthDisplayName } from "./online/socketClient.ts";
import {
	getSuppressNextClick,
	setSuppressNextClick,
	getDebtModalVisible,
	getLocalCoinDebt,
	getDebtModalNotice,
} from "./state.ts";
import { renderDebtTokenModal } from "./arena/extra-panels.ts";
import { getBoardSlots } from "./state.ts";
import { calculateBoardTotals } from "./shared/board.ts";
import { getRemainingResources } from "./shared/resources.ts";
import {
	getDiscardedResourceCoinBonus,
	getDiscardedResourceStaminaBonus,
} from "./state.ts";
import { STARTING_COIN, STARTING_STAMINA } from "./shared/constants.ts";

// ── Screen state ────────────────────────────────────────────────────────────

export let currentAppScreen: AppScreen = "loading";

// ── Player name (set after join/auth) ────────────────────────────────────────

let displayPlayerName = "Player 1";

export function setDisplayPlayerName(name: string) {
	displayPlayerName = name;
}

export function getDisplayPlayerName(): string {
	return displayPlayerName;
}

// ── Screen transition ───────────────────────────────────────────────────────

export function transitionToScreen(screen: AppScreen, skipMusicSync?: boolean) {
	currentAppScreen = screen;
	rerenderGameShell();
	// Stop/start in-game BGM based on the new screen (avoids overlapping
	// with the dashboard hero video's audio track).
	if (!skipMusicSync) {
		(globalThis as any).__syncInGameBgm?.();
	}
}

// ── Lobby background setter ─────────────────────────────────────────────────

/**
 * Sets the travel-desk lobby background directly on #app (inline !important
 * beats any CSS) while on the entry/lobby screen; removes it everywhere else
 * so the in-game arena background takes over.
 */
function applyLobbyBackground() {
	const app = document.getElementById("app");
	if (!app) return;

	if (currentAppScreen === "lobby") {
		app.style.setProperty(
			"background",
			"url('assets/images/backgrounds/lobby-bg.jpg') center/cover no-repeat #0c0b11",
			"important",
		);
	} else {
		app.style.removeProperty("background");
	}
}

// ── Cinematic lobby -> game transition ───────────────────────────────────────
// Plays a fullscreen video over the lobby card when the host starts an online
// room, then swaps to the game screen with a zoom-in reveal.

let isCinematicTransitioning = false;

export function triggerCinematicLobbyToGameTransition() {
	if (isCinematicTransitioning) return;
	isCinematicTransitioning = true;

	const blocker = document.createElement("div");
	blocker.id = "cinematic-blocker";
	blocker.style.cssText = "position:fixed;inset:0;z-index:99999999;cursor:wait;";
	const swallow = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();
	};
	blocker.addEventListener("mousedown", swallow);
	blocker.addEventListener("click", swallow);
	blocker.addEventListener("touchstart", swallow, { passive: false });
	document.body.appendChild(blocker);

	document.querySelector(".online-lobby-card")?.classList.add("is-exiting");

	const video = document.getElementById(
		"cinematic-transition-video",
	) as HTMLVideoElement | null;
	const overlay = document.getElementById("white-flash-overlay");

	if (!video || !overlay) {
		isCinematicTransitioning = false;
		blocker.remove();
		transitionToScreen("game");
		return;
	}

	setTimeout(() => {
		video.style.display = "block";
		video.currentTime = 0;
		video.play().catch(() => {
			video.muted = true;
			void video.play();
		});

		const finish = () => {
			if (!isCinematicTransitioning) return;
			isCinematicTransitioning = false;

			overlay.style.display = "block";
			overlay.style.opacity = "1";
			video.style.display = "none";
			video.ontimeupdate = null;
			video.onended = null;

			blocker.remove();

			// Transition to game but skip music sync to avoid starting during overlay fadeout
			transitionToScreen("game", true);

			const gameShell = document.querySelector(".game-shell");
			gameShell?.classList.add("is-zooming-in");

			setTimeout(() => {
				overlay.style.opacity = "0";
				setTimeout(() => {
					overlay.style.display = "none";
					gameShell?.classList.remove("is-zooming-in");
					// Start in-game music after overlay fadeout completes
					(globalThis as any).__syncInGameBgm?.();
				}, 1500);
			}, 50);
		};

		video.onended = finish;
		video.ontimeupdate = () => {
			if (video.duration && video.currentTime >= video.duration - 0.2) {
				finish();
			}
		};

		setTimeout(() => {
			if (isCinematicTransitioning) finish();
		}, 20000);
	}, 400);
}

// ── Shell render ────────────────────────────────────────────────────────────

export function renderGameShell(): string {
	switch (currentAppScreen) {
		case "loading":
			return '<div class="loading-screen"><p>Đang tải...</p></div>';
		case "dashboard":
			return renderDashboard();
		case "lobby": {
			const snapshot = getCurrentLobbySnapshot();
			const savedSession = getSavedSession();
			const displayName = getCurrentPlayerName() || getAuthDisplayName() || "Nhà Lữ Hành";

			if (snapshot && snapshot.phase === "lobby") {
				return renderOnlineLobbyRoomScreen(
					snapshot.roomId,
					snapshot.playerId,
					snapshot.playerName,
					snapshot.phase,
					snapshot.players,
					snapshot.isHost,
					snapshot.canStart,
				);
			}

			return renderOnlineEntryScreen(savedSession, displayName);
		}
		case "game": {
			const roomId = getCurrentRoomId();

			// Online multiplayer mode — opponent panel is rendered inside the arena
			if (roomId && getCurrentGameSnapshot()) {
				return `<div class="game-shell">
					<aside class="players-column players-column--left"></aside>
					${renderOnlineGameArena()}
					<aside class="players-column players-column--right"></aside>
				</div>`;
			}

			// Single-player mode
			const debtAmount = getLocalCoinDebt();
			const debtModalVisible = getDebtModalVisible();
			const debtModalNotice = getDebtModalNotice();
			const remaining =
				debtModalVisible && debtAmount > 0
					? getRemainingResources({
							totals: calculateBoardTotals(getBoardSlots()),
							startingCoin: STARTING_COIN,
							startingStamina: STARTING_STAMINA,
							discardBonusCoin: getDiscardedResourceCoinBonus?.() ?? 0,
							discardBonusStamina: getDiscardedResourceStaminaBonus?.() ?? 0,
						})
					: { coin: 0, stamina: 0 };
			return `<div class="game-shell">
				<aside class="players-column players-column--left"></aside>
				${renderMainArena()}
				<aside class="players-column players-column--right"></aside>
			</div>
			${
				debtModalVisible && debtAmount > 0
					? renderDebtTokenModal(
							debtModalVisible,
							debtAmount,
							remaining.coin,
							debtModalNotice,
						)
					: ""
			}`;
		}
		default:
			return '<div class="loading-screen"><p>Đang tải...</p></div>';
	}
}

export function rerenderGameShell() {
	const app = document.getElementById("app");
	if (!app) return;
	// Use DOMParser to safely parse HTML from our own render function
	const html = renderGameShell();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	// Clear existing content
	app.textContent = "";

	// Append parsed nodes
	while (doc.body.firstChild) {
		app.appendChild(doc.body.firstChild);
	}
	reattachCardClickDelegation();
	applyLobbyBackground();

	// Post-render: init screen-specific globals & effects
	if (currentAppScreen === "dashboard") {
		import("./screens/dashboard.ts").then((mod) => {
			mod.initDashboardGlobals();
			mod.initDashboardHubWithCleanup();
		});
	} else if (currentAppScreen === "lobby") {
		// Lobby globals are already bound in app.ts initLobbyGlobals()
		// No post-render side-effects needed — lobby is static HTML
	} else if (currentAppScreen === "game" && getCurrentRoomId()) {
		// Online game — init action handlers
		import("./screens/onlineGame.ts").then((mod) => {
			mod.initOnlineGameGlobals();
		});
	}
}

/**
 * Lightweight timer DOM update — avoids full shell re-render on every tick.
 * Finds .score-breakdown__timer and updates textContent + danger class in-place.
 */
export function updateTimerDom() {
	const timerEl = document.querySelector(".score-breakdown__timer");
	if (!timerEl) return;
	const strongEl = timerEl.querySelector("strong");
	if (!strongEl) return;

	import("./state.ts").then((s) => {
		const phase = s.getGamePhase();
		if (phase === "draft") {
			const secs = s.getDraftPickSecondsLeft();
			strongEl.textContent = `${secs}s`;
			timerEl.classList.toggle("score-breakdown__timer--danger", secs <= 3);
		} else if (phase === "placement") {
			const secs = s.getRemainingTurnSeconds();
			const m = Math.floor(Math.max(0, secs) / 60);
			const safeSec = Math.max(0, secs) % 60;
			strongEl.textContent = `${m}:${safeSec < 10 ? "0" : ""}${safeSec}`;
			timerEl.classList.toggle("score-breakdown__timer--danger", secs <= 10);
		}
	});
}

// ── Card click delegation (backup for inline handlers, hover) ───────────────

function reattachCardClickDelegation() {
	// Hand card hover (visual feedback, no rerender) + hold-to-focus
	document.querySelectorAll("[data-hand-card-id]").forEach((el) => {
		const cardId = el.getAttribute("data-hand-card-id");
		if (!cardId) return;
		el.addEventListener("pointerenter", () => handleHandCardEnter(cardId));
		el.addEventListener("pointerleave", () => handleHandCardLeave());
		el.addEventListener("pointerdown", () => handleHandCardDown(cardId));
		el.addEventListener("pointerup", () => handleHandCardUp());
	});

	// Draft card hold-to-focus (same mechanism, different selector)
	document.querySelectorAll("[data-draft-card-id]").forEach((el) => {
		const cardId = el.getAttribute("data-draft-card-id");
		if (!cardId) return;
		el.addEventListener("pointerdown", () => handleHandCardDown(cardId));
		el.addEventListener("pointerup", () => handleHandCardUp());
	});

	// Focused card close
	const closeBtn = document.getElementById("focused-card-close");
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			import("./state.ts").then((state) => {
				state.setFocusedHandCardId(null);
				state.setFocusedBoardCard(null);
				state.setShowFocusedPopup(false);
				rerenderGameShell();
			});
		});
	}
}

// ── Document-level click delegation (capture phase, matches Trekkopoly pattern) ──
// Old Trekkopoly used capture:true + [data-draft-card-id] for draft cards.
// This ensures clicks are caught before any inline handler processes them.

document.addEventListener(
	"click",
	(e) => {
		const target = e.target as HTMLElement;

		// Draft card click (via [data-draft-card-id] wrapper)
		const draftCard = target.closest("[data-draft-card-id]");
		if (draftCard) {
			if (getSuppressNextClick()) {
				setSuppressNextClick(false);
				return;
			}
			const cardId = draftCard.getAttribute("data-draft-card-id");
			if (cardId) {
				e.preventDefault();
				e.stopPropagation();
				(globalThis as any).selectHandCard?.(cardId);
				return;
			}
		}

		// Hand card click
		const handCard = target.closest("[data-hand-card-id]");
		if (handCard && !handCard.closest(".hand-card__close")) {
			if (getSuppressNextClick()) {
				setSuppressNextClick(false);
				return; // was a hold-to-focus, suppress selection
			}
			const cardId = handCard.getAttribute("data-hand-card-id");
			if (cardId) {
				e.preventDefault();
				e.stopPropagation();
				(globalThis as any).selectHandCard?.(cardId);
				return;
			}
		}

		// Board cell click
		const boardCell = target.closest("[data-board-cell]");
		if (boardCell) {
			const row = Number(boardCell.getAttribute("data-row-index"));
			const col = Number(boardCell.getAttribute("data-col-index"));
			e.preventDefault();
			e.stopPropagation();
			(globalThis as any).handleBoardCellClick?.(row, col);
			return;
		}
	},
	true,
); /* capture phase — matches old Trekkopoly */

// ── Hover handlers (no rerender — CSS handles visual feedback) ──────────────

function handleHandCardEnter(cardId: string) {
	// CSS :hover effects handle visual feedback on the card itself.
	// No rerender needed — the card fan layout uses CSS transitions.
	// Just stash the focused card id for potential future use.
	import("./state.ts").then((state) => {
		state.setFocusedHandCardId(cardId);
	});
}

function handleHandCardLeave() {
	import("./state.ts").then((state) => {
		state.setFocusedHandCardId(null);
	});
	(globalThis as any).cancelHoldHandCard?.();
}

function handleHandCardDown(cardId: string) {
	(globalThis as any).startHoldHandCard?.(cardId);
}

function handleHandCardUp() {
	(globalThis as any).cancelHoldHandCard?.();
}
