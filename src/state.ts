/**
 * state.ts — Mutable game state for the client.
 *
 * Extracted from TREKPOLOGY/src/app.ts (lines 996–1092).
 * All state lives here as module-level `let` bindings with exported getters.
 */

import { createEmptyBoardSlots } from "../scr/shared/board.ts";
import type { TravelCard } from "../scr/shared/types.ts";
import type { BoardSlots } from "../scr/shared/board.ts";
import type { PlayerId } from "../scr/shared/client-types.ts";

// ── Game phase FSM ───────────────────────────────────────────────────────────
//
//   draft → placement → endDay → draft (next day) or finished
//
export type GamePhase = "draft" | "placement" | "endDay" | "finished";

let gamePhase: GamePhase = "draft";

// ── Deck state ──────────────────────────────────────────────────────────────

let deck: TravelCard[] = [];
let playerHand: TravelCard[] = [];

// ── Draft state ──────────────────────────────────────────────────────────────

let draftPool: TravelCard[] = []; // 7 cards shown for current pick round
let draftSelectedCardId: string | null = null;
const draftPickSecondsLeft = 10;
const draftTimerId: number | null = null;
const isPassingDraftCards = false;
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

function setCurrentPlayerBoard(nextBoard: BoardSlots) {
	playerBoards[currentPlayerId] = nextBoard;
}

export function getBoardSlots(): BoardSlots {
	return getCurrentPlayerBoard();
}

export function getOpponentPlayerIds(): PlayerId[] {
	return playerIds.filter((id) => id !== currentPlayerId);
}

// ── Phase state ──────────────────────────────────────────────────────────────

let phaseNumber = 1;
let currentDayIndex = 0;
let accumulatedVP = 0;

// ── UI interaction state ─────────────────────────────────────────────────────

let selectedHandCardId: string | null = null;
const draggedHandCardId: string | null = null;
let focusedHandCardId: string | null = null;
let focusedBoardCard: TravelCard | null = null;
let suppressNextClick = false;
let isSimulationMode = false;
const simulationReplayIndex = 0;
const isReplayComplete = false;
let showFocusedPopup = false;

// ── Timer state ──────────────────────────────────────────────────────────────

let remainingTurnSeconds = 15;
const turnTimerId: number | null = null;
const dayAdvanceTimerId: number | null = null;

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

export function getPlayerBoards(): Record<PlayerId, BoardSlots> {
	return playerBoards;
}

export function setPlayerBoards(boards: Record<PlayerId, BoardSlots>) {
	playerBoards = boards;
}

export { currentPlayerId, playerIds };
