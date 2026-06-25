/**
 * snapshotAdapter.ts — Bridge between server RoomSnapshot and single-player state.
 *
 * The single-player rendering (renderMainArena in arena/render.ts) reads from
 * module-level getters in state.ts. This adapter populates those getters from
 * a RoomSnapshot so the same polished renderer works for BOTH modes.
 *
 * Usage:
 *   import { applySnapshotToState } from "./online/snapshotAdapter.ts";
 *   applySnapshotToState(snapshot, cards, myPlayerId);
 *   renderMainArena(); // renders identically for SP and MP
 */

import {
	setBoardSlots,
	setPlayerHand,
	setGamePhase,
	setCurrentDayIndex,
	setDeck,
	setDraftPool,
	setDraftRound,
	setPlayerChosenCards,
	setAccumulatedVP,
	setOpponentPlayers,
	setCurrentPlayerName,
	setDiscardedResourceCoinBonus,
	setDiscardedResourceStaminaBonus,
	setLocalCoinDebt,
	setSelectedHandCardId,
	setDraftSelectedCardId,
	setDraftPickSecondsLeft,
	setRemainingTurnSeconds,
	setIsInitialDealInProgress,
	setIsPassingDraftCards,
	setIsSimulationMode,
	setPhaseNumber,
} from "../state.ts";
import { boardCellsToSlots } from "../shared/board.ts";
import type { RoomSnapshot, TravelCard } from "../shared/types.ts";

/**
 * Sync ALL local state fields from a server/local RoomSnapshot.
 * Single point of truth — prevents the 9-field gap by setting EVERY field.
 *
 * @param snapshot - RoomSnapshot from server/localRoom
 * @param cards - Full card catalogue (for resolving card IDs to TravelCard objects)
 * @param myPlayerId - The local player's ID (null for non-player view)
 */
export function syncAllStateFromSnapshot(
	snapshot: RoomSnapshot,
	cards: TravelCard[],
	myPlayerId: string | null,
): void {
	const myPlayer = myPlayerId
		? snapshot.players.find((p) => p.playerId === myPlayerId)
		: null;

	if (!myPlayer) {
		// No viewing player — still set phase/day for opponent viewing
		setGamePhase(phaseToLocal(snapshot.phase));
		setCurrentDayIndex(snapshot.day - 1);
		setBoardSlots(createEmptySlots());
		return;
	}

	// ── Phase mapping ────────────────────────────────────────────────────────
	setGamePhase(phaseToLocal(snapshot.phase));
	setIsSimulationMode(snapshot.phase === "scoring");

	// ── Day (0-based for local state) ─────────────────────────────────────────
	setCurrentDayIndex(snapshot.day - 1);

	// ── Board (convert BoardCell[] → BoardSlots) ──────────────────────────────
	const slots = boardCellsToSlots(myPlayer.board, cards);
	setBoardSlots(slots);

	// ── Hand cards ───────────────────────────────────────────────────────────
	const handCards = myPlayer.hand
		.map((cardId) => cards.find((c) => c.card_id === cardId))
		.filter((c): c is TravelCard => c !== undefined);
	const chosenCards = myPlayer.chosen
		.map((cardId) => cards.find((c) => c.card_id === cardId))
		.filter((c): c is TravelCard => c !== undefined);
	setPlayerChosenCards(chosenCards);

	// playerHand: show hand in draft, chosen in placement
	if (snapshot.phase === "placement") {
		setPlayerHand(chosenCards);
	} else {
		setPlayerHand(handCards);
	}

	// ── Draft pool ────────────────────────────────────────────────────────────
	if (snapshot.phase === "draft") {
		setDraftPool(handCards);
		setDraftRound(snapshot.pickIndex + 1); // 0-based → 1-based
	} else {
		setDraftPool([]);
	}

	// ── Deck (from full card catalogue for display) ───────────────────────────
	setDeck(cards);

	// ── Scoring state ─────────────────────────────────────────────────────────
	setAccumulatedVP(myPlayer.resources.vp);

	// ── Opponent players (for sidebar display) ────────────────────────────────
	const opponents = snapshot.players.filter((p) => p.playerId !== myPlayerId);
	setOpponentPlayers(opponents);

	// ── Player identity ──────────────────────────────────────────────────────
	setCurrentPlayerName(myPlayer.name);

	// ══════════════════════════════════════════════════════════════════════════
	// MISSING FIELDS (9) — these were lost in the split sync approach
	// ══════════════════════════════════════════════════════════════════════════

	// ── Timer defaults ────────────────────────────────────────────────────────
	// Set a default so renderers don't see NaN/null. The countdown is managed
	// by localRoom.ts startDraftTimer()/startPlacementTimer() which overwrites.
	setDraftPickSecondsLeft(30);
	setRemainingTurnSeconds(120);
	setPhaseNumber(snapshot.day); // 1-based day number

	// ── Resource bonuses (clear for online; Room accounts for discards) ──────
	setDiscardedResourceCoinBonus(0);
	setDiscardedResourceStaminaBonus(0);
	setLocalCoinDebt(myPlayer.resources.debtToken);

	// ── Selection state (reset per render — animation controller sets them) ──
	setSelectedHandCardId(null);
	setDraftSelectedCardId(null);

	// ── Animation flags (reset per render) ────────────────────────────────────
	setIsInitialDealInProgress(false);
	setIsPassingDraftCards(false);
}

/**
 * Convert a player's hand (card IDs) to TravelCard[] for display.
 */
export function handToCards(
	cardIds: string[],
	cards: TravelCard[],
): TravelCard[] {
	return cardIds
		.map((id) => cards.find((c) => c.card_id === id))
		.filter((c): c is TravelCard => c !== undefined);
}

// ─── Local phase mapping ──────────────────────────────────────────────────────

const PHASE_MAP: Record<string, string> = {
	lobby: "draft", // fallback — lobby shouldn't reach arena
	draft: "draft",
	placement: "placement",
	scoring: "simulation", // map server scoring to local simulation
	finished: "finished",
};

/**
 * Map server GamePhase to local state GamePhase.
 * Server uses "scoring" which includes both simulation and scoring;
 * local state calls this phase "simulation".
 */
function phaseToLocal(
	phase: string,
): "draft" | "placement" | "simulation" | "finished" {
	return (
		(PHASE_MAP[phase] as "draft" | "placement" | "simulation" | "finished") ||
		"draft"
	);
}

/**
 * Create empty 5x5 board slots.
 */
function createEmptySlots(): (TravelCard | null)[][] {
	return Array.from({ length: 5 }, () => Array(5).fill(null));
}
