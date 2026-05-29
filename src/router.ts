/**
 * router.ts — Screen shell, transitions, and rerender loop.
 *
 * Extracted from TREKPOLOGY/src/app.ts (lines 5362–5703, 5911–6093).
 */

import type { AppScreen } from "../scr/shared/client-types.ts";
import { renderMainArena } from "./arena/render.ts";

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

export function transitionToScreen(screen: AppScreen) {
	currentAppScreen = screen;
	rerenderGameShell();
}

// ── Shell render ────────────────────────────────────────────────────────────

export function renderGameShell(): string {
	switch (currentAppScreen) {
		case "loading":
			return '<div class="loading-screen"><p>Đang tải...</p></div>';
		case "dashboard":
			return '<div class="dashboard-screen"><p>Dashboard (sẽ render sau)</p></div>';
		case "lobby":
			return '<div class="lobby-screen"><p>Phòng chờ (sẽ render sau)</p></div>';
		case "game":
			return renderMainArena();
		default:
			return '<div class="loading-screen"><p>Đang tải...</p></div>';
	}
}

export function rerenderGameShell() {
	const app = document.getElementById("app");
	if (!app) return;
	app.innerHTML = renderGameShell();
	reattachCardClickDelegation();
}

// ── Card click delegation ───────────────────────────────────────────────────

function reattachCardClickDelegation() {
	// Board cell clicks
	document.querySelectorAll("[data-board-cell]").forEach((el) => {
		const rowIndex = Number(el.getAttribute("data-row-index"));
		const colIndex = Number(el.getAttribute("data-col-index"));
		el.addEventListener("click", (e) => {
			e.stopPropagation();
			handleBoardCellClick(rowIndex, colIndex);
		});
	});

	// Hand card clicks
	document.querySelectorAll("[data-hand-card-id]").forEach((el) => {
		const cardId = el.getAttribute("data-hand-card-id");
		if (!cardId) return;
		el.addEventListener("click", () => handleHandCardClick(cardId));
		el.addEventListener("pointerenter", () => handleHandCardEnter(cardId));
		el.addEventListener("pointerleave", () => handleHandCardLeave());
	});

	// Draft card clicks
	document.querySelectorAll("[data-draft-card-id]").forEach((el) => {
		const cardId = el.getAttribute("data-draft-card-id");
		if (!cardId) return;
		el.addEventListener("click", () => handleDraftCardClick(cardId));
	});

	// Focused card close
	const closeBtn = document.getElementById("focused-card-close");
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			import("./state.ts").then((state) => {
				state.setFocusedHandCardId(null);
				state.setFocusedBoardCard(null);
				rerenderGameShell();
			});
		});
	}
}

// ── Click handlers (import state and rerender) ──────────────────────────────

async function handleBoardCellClick(rowIndex: number, colIndex: number) {
	const state = await import("./state.ts");
	// Placeholder: will wire to server placement in full implementation
	console.log(`Board cell click: row=${rowIndex}, col=${colIndex}`);
}

async function handleHandCardClick(cardId: string) {
	const state = await import("./state.ts");
	const currentSelected = state.getSelectedHandCardId();

	if (currentSelected === cardId) {
		// Card already selected — toggle focused detail popup
		const currentlyFocused = state.getFocusedHandCardId();
		if (currentlyFocused === cardId && state.getShowFocusedPopup()) {
			// Already showing popup — dismiss
			state.setFocusedHandCardId(null);
			state.setShowFocusedPopup(false);
		} else {
			// Show popup
			state.setFocusedHandCardId(cardId);
			state.setShowFocusedPopup(true);
		}
	} else {
		// Select the card, clear any focused popup
		state.setSelectedHandCardId(cardId);
		state.setFocusedHandCardId(null);
		state.setShowFocusedPopup(false);
	}

	rerenderGameShell();
}

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
}

async function handleDraftCardClick(cardId: string) {
	const state = await import("./state.ts");
	state.setDraftSelectedCardId(cardId);
	rerenderGameShell();
}
