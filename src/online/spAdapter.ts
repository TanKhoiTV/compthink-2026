/**
 * spAdapter.ts — Single-player global action adapter for bot-based Room.
 *
 * Binds the global functions that RPG.html inline onclick handlers call
 * (selectHandCard, handleBoardCellClick, endCurrentDay, etc.) to the
 * localRoom.ts game functions, so the polished single-player renderer
 * works with the server game FSM + bots.
 *
 * Usage:
 *   import { initSPGlobals, startBotGame } from "./online/spAdapter.ts";
 *   startBotGame("p1", "Nhà Lữ Hành", 3);
 *
 * This replaces the old app.ts game loop (startDailyDraft → selectHandCard
 * → placeCard → confirmDay) with a Room-based flow where bots auto-play.
 */

import {
	initLocalGame,
	localDraftCard,
	localPlaceCard,
	localConfirmDay,
	getLocalRoom,
	getLocalPlayerId,
} from "./localRoom.ts";
import {
	setSelectedHandCardId,
	getSelectedHandCardId,
	getGamePhase,
	getCurrentDayIndex,
	setFocusedHandCardId,
	getPlayerChosenCards,
} from "../state.ts";
import { TIME_SLOTS } from "../shared/board.ts";
import type { TravelCard, TimeSlot } from "../shared/types.ts";

// ─── Module-level state ──────────────────────────────────────────────────────

let globalsBound = false;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Start a bot-based single-player game and bind all global action handlers.
 *
 * @param playerId - Human player ID (default "p1")
 * @param playerName - Human player name (default "Nhà Lữ Hành")
 * @param numBots - Number of bot opponents (default 3)
 * @param cards - Optional card catalogue override
 */
export function startBotGame(
	playerId = "p1",
	playerName = "Nhà Lữ Hành",
	numBots = 3,
	cards?: TravelCard[],
): void {
	// Initialize the local Room with bots
	initLocalGame(playerId, playerName, numBots, cards);

	// Bind globals (idempotent)
	initSPGlobals();
}

/**
 * Bind all global game action handlers.
 * Safe to call multiple times — re-binding is idempotent.
 */
export function initSPGlobals(): void {
	if (globalsBound) return;
	globalsBound = true;

	// ── Draft: select a card from the pool ───────────────────────────────────
	(globalThis as any).selectHandCard = (cardId: string) => {
		const phase = getGamePhase();

		if (phase === "draft") {
			// In draft mode, picking a card = drafting it (store = keep)
			localDraftCard(cardId, "store");
			return;
		}

		if (phase === "placement") {
			// In placement mode, picking a card = select it for placing
			setSelectedHandCardId(cardId);
			return;
		}

		console.warn("[spAdapter] selectHandCard ignored — phase:", phase);
	};

	// ── Board cell click: place selected card ────────────────────────────────
	(globalThis as any).handleBoardCellClick = (row: number, _col: number) => {
		const phase = getGamePhase();
		if (phase !== "placement") return;

		const selectedId = getSelectedHandCardId();
		if (!selectedId) {
			// No card selected — nothing to place
			return;
		}

		// Derive slot from row index (0 = early_morning … 4 = night)
		const slotName = TIME_SLOTS[row] as TimeSlot | undefined;
		if (!slotName) {
			console.warn("[spAdapter] Invalid row index:", row);
			return;
		}

		const day = getCurrentDayIndex() + 1; // Current day (1-based)

		try {
			localPlaceCard(selectedId, day, slotName);
			// Clear selection after successful placement
			setSelectedHandCardId(null);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			console.warn("[spAdapter] placeCard failed:", msg);
		}
	};

	// ── End day: confirm all placements are done ──────────────────────────────
	(globalThis as any).endCurrentDay = () => {
		// Check that the player has no unplaced chosen cards
		const unplaced = getPlayerChosenCards();
		if (unplaced.length > 0) {
			console.warn(
				`[spAdapter] ${unplaced.length} cards remain unplaced — confirm anyway?`,
			);
			// The server game.ts's confirmDay will succeed regardless;
			// leftover chosen are discarded in scoring
		}
		localConfirmDay();
	};

	// ── Clear card selection ────────────────────────────────────────────────
	(globalThis as any).clearSelectedHandCard = () => {
		setSelectedHandCardId(null);
	};

	// ── Hold-to-focus handlers ──────────────────────────────────────────────
	(globalThis as any).startHoldHandCard = (cardId: string) => {
		setFocusedHandCardId(cardId);
	};

	(globalThis as any).cancelHoldHandCard = () => {
		setFocusedHandCardId(null);
	};

	// ── Focused card overlay close ──────────────────────────────────────────
	(globalThis as any).closeFocusedCard = () => {
		setFocusedHandCardId(null);
	};

	console.log("[spAdapter] Global action handlers bound.");
}

/**
 * Unbind globals (for cleanup before online mode).
 */
export function teardownSPGlobals(): void {
	if (!globalsBound) return;
	globalsBound = false;

	delete (globalThis as any).selectHandCard;
	delete (globalThis as any).handleBoardCellClick;
	delete (globalThis as any).endCurrentDay;
	delete (globalThis as any).clearSelectedHandCard;
	delete (globalThis as any).startHoldHandCard;
	delete (globalThis as any).cancelHoldHandCard;
	delete (globalThis as any).closeFocusedCard;

	console.log("[spAdapter] Global action handlers unbound.");
}
