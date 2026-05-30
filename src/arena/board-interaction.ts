/**
 * board-interaction.ts — Card placement, return, bot logic, simulation replay.
 *
 * Extracted from TREKPOLOGY/src/app.ts (lines 1240–4345).
 */

import {
	getIsSimulationMode,
	getSelectedHandCardId,
	setSelectedHandCardId,
	getFocusedBoardCard,
	setFocusedBoardCard,
	getFocusedBoardPosition,
	setFocusedBoardPosition,
	getPlayerHand,
	setPlayerHand,
	getBoardSlots,
	getCurrentDayIndex,
	getIsInitialDealInProgress,
	getSuppressNextClick,
	setSuppressNextClick,
	getPlayerBoards,
	getCurrentPlayerId,
	getOpponentPlayerIds,
} from "../state.ts";
import { isConnected, rpcCall } from "../online/socketClient.ts";
import { playGameSound } from "../audio/gameAudio.ts";
import { rerenderArena } from "../router.ts";
import type { TravelCard } from "../shared/types.ts";
import type { BoardSlots, BoardPosition } from "../shared/board.ts";
import type { PlayerId } from "../shared/client-types.ts";

/* ── Board placement helpers ──────────────────────────────────────────── */

export function canPlaceOnBoardCell(
	rowIndex: number,
	colIndex: number,
): boolean {
	const board = getBoardSlots();
	if (rowIndex < 0 || rowIndex >= board.length) return false;
	if (colIndex < 0 || colIndex >= (board[0]?.length ?? 0)) return false;
	if (board[rowIndex]?.[colIndex] !== null) return false;
	return true;
}

/* ── Card placement ───────────────────────────────────────────────────── */

export function placeHandCardOnBoard(
	cardId: string,
	rowIndex: number,
	colIndex: number,
) {
	if (getIsSimulationMode() || getIsInitialDealInProgress()) return;
	if (colIndex !== getCurrentDayIndex()) return;
	if (!canPlaceOnBoardCell(rowIndex, colIndex)) return;

	const hand = getPlayerHand();
	const handIndex = hand.findIndex((card) => card.id === cardId);
	if (handIndex === -1) return;

	const selectedCard = hand[handIndex];

	// Online: send RPC
	if (isConnected()) {
		playGameSound("cardPlace");
		rpcCall("placeCard", {
			cardId: selectedCard.id,
			rowIndex,
			colIndex,
			tag: selectedCard.tag,
			icon: selectedCard.icon,
			vp: selectedCard.vp,
			coin: selectedCard.coin,
			stamina: selectedCard.stamina,
			name: selectedCard.name,
		}).catch(console.error);

		setSelectedHandCardId(null);
		return;
	}

	// Offline: mutate board directly
	playGameSound("cardPlace");
	hand.splice(handIndex, 1);
	const board = getBoardSlots();
	board[rowIndex][colIndex] = selectedCard;

	// Place bot cards after player move
	placeBotCardsAfterPlayerMove(selectedCard);

	setSelectedHandCardId(null);
	rerenderArena();

	// Remove highlight after animation
	window.setTimeout(() => rerenderArena(), 420);
}

export function placeSelectedHandCard(rowIndex: number, colIndex: number) {
	const cardId = getSelectedHandCardId();
	if (!cardId) return;
	placeHandCardOnBoard(cardId, rowIndex, colIndex);
}

/* ── Card return to hand ──────────────────────────────────────────────── */

export function returnFocusedBoardCardToHand() {
	if (getIsSimulationMode()) return;

	const pos = getFocusedBoardPosition();
	if (!pos) return;

	const { rowIndex, colIndex } = pos;
	const board = getBoardSlots();
	const card = board[rowIndex]?.[colIndex];
	if (!card) return;

	board[rowIndex][colIndex] = null;
	const hand = getPlayerHand();
	hand.push(card);
	setPlayerHand(hand);

	setFocusedBoardCard(null);
	setFocusedBoardPosition(null);
	setSuppressNextClick(true);
	rerenderArena();
}

/* ── Bot placement ────────────────────────────────────────────────────── */

export function placeBotCardsAfterPlayerMove(sourceCard: TravelCard) {
	if (isConnected()) return;

	const opponentIds = getOpponentPlayerIds();
	opponentIds.forEach((playerId, index) => {
		if (countBotCardsInCurrentDay(playerId) >= 3) return;
		placeOneBotCard(playerId, sourceCard, index);
	});
}

function countBotCardsInCurrentDay(playerId: PlayerId): number {
	const board = getPlayerBoards()[playerId];
	const dayIndex = getCurrentDayIndex();
	let count = 0;
	for (const row of board) {
		if (row[dayIndex] !== null) count += 1;
	}
	return count;
}

function placeOneBotCard(
	playerId: PlayerId,
	sourceCard: TravelCard,
	seedOffset: number,
) {
	const board = getPlayerBoards()[playerId];
	const dayIndex = getCurrentDayIndex();

	// Find first empty slot in current day
	for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
		if (board[rowIndex]?.[dayIndex] === null) {
			board[rowIndex][dayIndex] = sourceCard;
			return;
		}
	}
}

export function placeBotCardsForCurrentDay() {
	if (isConnected()) return;
	// Start real-time bot placement (timer-based)
	startRealtimeBotPlacement();
}

let botTimerId: number | null = null;

function startRealtimeBotPlacement() {
	if (botTimerId) return;
	const bots = getOpponentPlayerIds();
	let botIndex = 0;

	botTimerId = window.setInterval(() => {
		if (botIndex >= bots.length) {
			if (botTimerId) {
				clearInterval(botTimerId);
				botTimerId = null;
			}
			return;
		}

		const playerId = bots[botIndex];
		if (countBotCardsInCurrentDay(playerId) < 3) {
			placeOneBotCard(
				playerId,
				getPlayerHand()[0] ?? ({ id: "dummy" } as TravelCard),
				botIndex,
			);
			rerenderArena();
		}

		botIndex += 1;
	}, 800);
}

export function stopBotPlacement() {
	if (botTimerId) {
		clearInterval(botTimerId);
		botTimerId = null;
	}
}
