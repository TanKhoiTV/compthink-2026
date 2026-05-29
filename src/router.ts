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
	// Board cell / hand card clicks: inline onclick → window['handleBoardCellClick'] / window['selectHandCard']

	// Hand card hover (visual feedback, no rerender)
	document.querySelectorAll("[data-hand-card-id]").forEach((el) => {
		const cardId = el.getAttribute("data-hand-card-id");
		if (!cardId) return;
		el.addEventListener("pointerenter", () => handleHandCardEnter(cardId));
		el.addEventListener("pointerleave", () => handleHandCardLeave());
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
}


