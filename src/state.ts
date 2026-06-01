/**
 * state.ts — Mutable game state for the client.
 *
 * Extracted from Trekkopoly/src/app.ts (lines 996–1092).
 * All state lives here as module-level `let` bindings with exported getters.
 */

import { createEmptyBoardSlots } from "./shared/board.ts";
import type { TravelCard } from "./shared/types.ts";
import type { BoardSlots } from "./shared/board.ts";
import type { PlayerId } from "./shared/client-types.ts";
import { clearTimer } from "./services/timer-service.ts";

// ── Game phase FSM ───────────────────────────────────────────────────────────
//
//   draft → placement → endDay → draft (next day) or finished
//
export type GamePhase = "draft" | "placement" | "simulation" | "finished";

let gamePhase: GamePhase = "draft";

// ── Deck state ──────────────────────────────────────────────────────────────

let deck: TravelCard[] = [];
let playerHand: TravelCard[] = [];

// ── Draft state ──────────────────────────────────────────────────────────────

let draftPool: TravelCard[] = []; // 7 cards shown for current pick round
let draftSelectedCardId: string | null = null;
let draftPickSecondsLeft = 180;
let draftTimerId: number | null = null;
let draftRound = 1;

// ── Board state (offline mode) ───────────────────────────────────────────────

const playerIds: PlayerId[] = ["p1", "p2", "p3", "p4"];
const currentPlayerId: PlayerId = "p1";
let playerBoards: Record<PlayerId, BoardSlots> = createEmptyPlayerBoards();

function createEmptyPlayerBoards(): Record<PlayerId, BoardSlots> {
	return {
		p1: createEmptyBoardSlots(),
		p2: createEmptyBoardSlots(),
		p3: createEmptyBoardSlots(),
		p4: createEmptyBoardSlots(),
	};
}

function getCurrentPlayerBoard(): BoardSlots {
	return playerBoards[currentPlayerId];
}

export function setCurrentPlayerBoard(nextBoard: BoardSlots) {
	playerBoards[currentPlayerId] = nextBoard;
}

/** Direct setter used by snapshotAdapter to replace board for any player. */
export function setBoardSlots(slots: BoardSlots) {
	playerBoards[currentPlayerId] = slots;
}

export function getBoardSlots(): BoardSlots {
	return getCurrentPlayerBoard();
}

export function getOpponentPlayerIds(): PlayerId[] {
	return playerIds.filter((id) => id !== currentPlayerId);
}

// ── Opponent display state (from snapshot) ─────────────────────────────────--

let opponentPlayers: import("./shared/types.ts").PlayerState[] = [];

export function setOpponentPlayers(
	players: import("./shared/types.ts").PlayerState[],
) {
	opponentPlayers = players;
}

export function getOpponentPlayers(): import("./shared/types.ts").PlayerState[] {
	return opponentPlayers;
}

// ── Phase state ──────────────────────────────────────────────────────────────

let phaseNumber = 1;
let currentDayIndex = 0;
let accumulatedVP = 0;

// ── UI interaction state ─────────────────────────────────────────────────────

let isInitialDealInProgress = false;
let isPassingDraftCards = false;
let selectedHandCardId: string | null = null;
let focusedHandCardId: string | null = null;
let focusedBoardCard: TravelCard | null = null;
let suppressNextClick = false;
let isSimulationMode = false;
// ── Simulation state ─────────────────────────────────────────────────────────

import type { SimulationResult } from "./shared/scoring.ts";

let simulationResult: SimulationResult | null = null;
let simulationReplayIndex = 0;
let isReplayComplete = false;
let simulationTimerId: number | null = null;
let showFocusedPopup = false;

// ── Debt modal state ─────────────────────────────────────────────────────────

let debtModalVisible = false;
let debtModalNotice = "";
let debtModalTimerId: number | null = null;

// ── Timer state ──────────────────────────────────────────────────────────────

let remainingTurnSeconds = 180;
let localCoinDebt = 0;

// ── Drag state ───────────────────────────────────────────────────────────────

export type HandPointerDragState = {
	id: string;

	source: HTMLElement;
	clone: HTMLElement | null;
	startX: number;
	startY: number;
	offsetX: number;
	offsetY: number;
	isDragging: boolean;
};

let handPointerDragState: HandPointerDragState | null = null;
let draggedHandCardId: string | null = null;

export function getHandPointerDragState(): HandPointerDragState | null {
	return handPointerDragState;
}

export function setHandPointerDragState(state: HandPointerDragState | null) {
	handPointerDragState = state;
}

export function getDraggedHandCardId(): string | null {
	return draggedHandCardId;
}

export function setDraggedHandCardId(id: string | null) {
	draggedHandCardId = id;
}

// ── Export getters / setters ─────────────────────────────────────────────────

export function getDeck(): TravelCard[] {
	return deck;
}

export function setDeck(newDeck: TravelCard[]) {
	deck = newDeck;
}

export function getPlayerHand(): TravelCard[] {
	return playerHand;
}

export function setPlayerHand(hand: TravelCard[]) {
	playerHand = hand;
}

// ── Chosen cards & player name (for snapshot-based rendering) ───────────────--

let playerChosenCards: TravelCard[] = [];
let currentPlayerName = "";

export function getPlayerChosenCards(): TravelCard[] {
	return playerChosenCards;
}

export function setPlayerChosenCards(cards: TravelCard[]) {
	playerChosenCards = cards;
}

export function getCurrentPlayerName(): string {
	return currentPlayerName;
}

export function setCurrentPlayerName(name: string) {
	currentPlayerName = name;
}

export function getCurrentDayIndex(): number {
	return currentDayIndex;
}

export function setCurrentDayIndex(index: number) {
	currentDayIndex = index;
}

export function getPhaseNumber(): number {
	return phaseNumber;
}

export function setPhaseNumber(n: number) {
	phaseNumber = n;
}

export function getAccumulatedVP(): number {
	return accumulatedVP;
}

export function setAccumulatedVP(vp: number) {
	accumulatedVP = vp;
}

export function getGamePhase(): GamePhase {
	return gamePhase;
}

export function setGamePhase(p: GamePhase) {
	gamePhase = p;
}

export function getSimulationResult(): SimulationResult | null {
	return simulationResult;
}

export function setSimulationResult(r: SimulationResult | null) {
	simulationResult = r;
}

export function getSimulationReplayIndex(): number {
	return simulationReplayIndex;
}

export function setSimulationReplayIndex(i: number) {
	simulationReplayIndex = i;
}

export function getIsReplayComplete(): boolean {
	return isReplayComplete;
}

export function setIsReplayComplete(v: boolean) {
	isReplayComplete = v;
}

export function getSimulationTimerId(): number | null {
	return simulationTimerId;
}

export function setSimulationTimerId(id: number | null) {
	simulationTimerId = id;
}

export function getDraftPool(): TravelCard[] {
	return draftPool;
}

export function setDraftPool(pool: TravelCard[]) {
	draftPool = pool;
}

export function getDraftSelectedCardId(): string | null {
	return draftSelectedCardId;
}

export function setDraftSelectedCardId(id: string | null) {
	draftSelectedCardId = id;
}

export function getDraftRound(): number {
	return draftRound;
}

export function setDraftRound(r: number) {
	draftRound = r;
}

export function getDraftPickSecondsLeft(): number {
	return draftPickSecondsLeft;
}

export function setDraftPickSecondsLeft(s: number) {
	draftPickSecondsLeft = s;
}

export function getDraftTimerId(): number | null {
	return draftTimerId;
}

export function setDraftTimerId(id: number | null) {
	draftTimerId = id;
}

export function getSelectedHandCardId(): string | null {
	return selectedHandCardId;
}

export function setSelectedHandCardId(id: string | null) {
	selectedHandCardId = id;
}

export function getFocusedHandCardId(): string | null {
	return focusedHandCardId;
}

export function setFocusedHandCardId(id: string | null) {
	focusedHandCardId = id;
}

export function getFocusedBoardCard(): TravelCard | null {
	return focusedBoardCard;
}

export function setFocusedBoardCard(card: TravelCard | null) {
	focusedBoardCard = card;
}

export function getIsSimulationMode(): boolean {
	return isSimulationMode;
}

export function getShowFocusedPopup(): boolean {
	return showFocusedPopup;
}

export function setShowFocusedPopup(v: boolean) {
	showFocusedPopup = v;
}

export function setIsSimulationMode(v: boolean) {
	isSimulationMode = v;
}

export function getRemainingTurnSeconds(): number {
	return remainingTurnSeconds;
}

export function setRemainingTurnSeconds(s: number) {
	remainingTurnSeconds = s;
}

export function getSuppressNextClick(): boolean {
	return suppressNextClick;
}

export function setSuppressNextClick(v: boolean) {
	suppressNextClick = v;
}

let holdTimerId: number | null = null;

export function getHoldTimerId(): number | null {
	return holdTimerId;
}

export function setHoldTimerId(id: number | null) {
	holdTimerId = id;
}

export function getLocalCoinDebt(): number {
	return localCoinDebt;
}

export function setLocalCoinDebt(v: number) {
	localCoinDebt = v;
}

export function getDebtModalVisible(): boolean {
	return debtModalVisible;
}

export function setDebtModalVisible(v: boolean) {
	debtModalVisible = v;
}

export function getDebtModalNotice(): string {
	return debtModalNotice;
}

export function setDebtModalNotice(v: string) {
	debtModalNotice = v;
}

export function getDebtModalTimerId(): number | null {
	return debtModalTimerId;
}

export function setDebtModalTimerId(id: number | null) {
	debtModalTimerId = id;
}

export function clearDebtModalTimer() {
	const id = getDebtModalTimerId();
	if (id !== null) {
		clearTimer(id);
		setDebtModalTimerId(null);
	}
}

export function getIsInitialDealInProgress(): boolean {
	return isInitialDealInProgress;
}

export function setIsInitialDealInProgress(v: boolean) {
	isInitialDealInProgress = v;
}

export function getIsPassingDraftCards(): boolean {
	return isPassingDraftCards;
}

export function setIsPassingDraftCards(v: boolean) {
	isPassingDraftCards = v;
}

export function getPlayerBoards(): Record<PlayerId, BoardSlots> {
	return playerBoards;
}

export function setPlayerBoards(boards: Record<PlayerId, BoardSlots>) {
	playerBoards = boards;
}

// ── Placement re-entrancy guard ───────────────────────────────────────────

let placingInProgress = false;

export function getPlacingInProgress(): boolean {
	return placingInProgress;
}

export function setPlacingInProgress(v: boolean) {
	placingInProgress = v;
}

// ── Simulation advance timeout (2s delay after replay) ────────────────────

let simulationAdvanceTimeoutId: number | null = null;

export function getSimulationAdvanceTimeoutId(): number | null {
	return simulationAdvanceTimeoutId;
}

export function setSimulationAdvanceTimeoutId(id: number | null) {
	simulationAdvanceTimeoutId = id;
}

// ── Timer state ───────────────────────────────────────────────────────────

let placementTimerId: number | null = null;

export function getPlacementTimerId(): number | null {
	return placementTimerId;
}

export function setPlacementTimerId(id: number | null) {
	placementTimerId = id;
}

// ── Discard resource bonus (refunded from discarded hand cards) ────────────

let discardedResourceCoinBonus = 0;
let discardedResourceStaminaBonus = 0;

export function getDiscardedResourceCoinBonus(): number {
	return discardedResourceCoinBonus;
}

export function setDiscardedResourceCoinBonus(v: number) {
	discardedResourceCoinBonus = v;
}

export function getDiscardedResourceStaminaBonus(): number {
	return discardedResourceStaminaBonus;
}

export function setDiscardedResourceStaminaBonus(v: number) {
	discardedResourceStaminaBonus = v;
}

export function addDiscardedResourceBonus(coin: number, stamina: number) {
	discardedResourceCoinBonus += coin;
	discardedResourceStaminaBonus += stamina;
}

export { currentPlayerId, playerIds };
