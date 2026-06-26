import {
	currentPlayerId,
	initialDeck,
	playerIds,
	state,
} from "../state/gameState.js";
import { isOnlineRoomActive } from "./queries.js";
import { rerenderArena } from "../ui/arenaRenderer.js";
import type { BoardPosition, BoardSlots } from "./board.js";
import type { PlayerId, TravelCardData } from "../types.js";

function getOpponentPlayerIds(): PlayerId[] {
	return playerIds.filter((playerId) => playerId !== currentPlayerId);
}

function getFirstEmptyBoardPosition(
	board: BoardSlots,
	preferredColIndex = state.currentDayIndex,
): BoardPosition | null {
	for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
		if (board[rowIndex]?.[preferredColIndex] === null) {
			return {
				rowIndex,
				colIndex: preferredColIndex,
			};
		}
	}

	for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
		for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex += 1) {
			if (board[rowIndex][colIndex] === null) {
				return {
					rowIndex,
					colIndex,
				};
			}
		}
	}

	return null;
}

function cloneCardForBot(
	card: TravelCardData,
	playerId: PlayerId,
	index: number,
): TravelCardData {
	return {
		...card,
		id: `${card.id}_${playerId}_${state.currentDayIndex}_${index}_${Date.now()}`,
	};
}

function getBotSourceCards(playerId: PlayerId): TravelCardData[] {
	const draftIndexByPlayerId: Record<PlayerId, number> = {
		p1: 1,
		p2: 0,
		p3: 2,
		p4: 3,
	};

	const draftPlayer = state.draftPlayers[draftIndexByPlayerId[playerId]];
	const pickedCards = draftPlayer?.picked ?? [];

	if (pickedCards.length > 0) {
		return pickedCards;
	}

	return initialDeck;
}

function placeOneBotCard(
	playerId: PlayerId,
	card: TravelCardData,
	index: number,
) {
	const board = state.playerBoards[playerId];
	const position = getFirstEmptyBoardPosition(board, state.currentDayIndex);

	if (!position) return;

	board[position.rowIndex][position.colIndex] = cloneCardForBot(
		card,
		playerId,
		index,
	);
}

function countBotCardsInCurrentDay(playerId: PlayerId): number {
	let count = 0;
	const board = state.playerBoards[playerId];

	for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
		if (board[rowIndex]?.[state.currentDayIndex] !== null) {
			count += 1;
		}
	}

	return count;
}

export function stopBotPlacementTimer() {
	if (state.botPlacementTimerId !== null) {
		window.clearInterval(state.botPlacementTimerId);
		state.botPlacementTimerId = null;
	}
}

function hasBotPlacementAvailable(): boolean {
	return getOpponentPlayerIds().some((playerId) => {
		return countBotCardsInCurrentDay(playerId) < 3;
	});
}

export function placeNextRealtimeBotMove() {
	if (isOnlineRoomActive()) {
		stopBotPlacementTimer();
		return;
	}

	if (
		state.isDraftPhase ||
		state.isSimulationMode ||
		state.isInitialDealInProgress
	) {
		stopBotPlacementTimer();
		return;
	}

	const opponentIds = getOpponentPlayerIds();
	const availablePlayerIds = opponentIds.filter((playerId) => {
		return countBotCardsInCurrentDay(playerId) < 3;
	});

	if (availablePlayerIds.length === 0) {
		for (const playerId of opponentIds) {
			state.botPlacedDays[playerId].add(state.currentDayIndex);
		}

		stopBotPlacementTimer();
		return;
	}

	const playerId =
		availablePlayerIds[Math.floor(Math.random() * availablePlayerIds.length)];
	const sourceCards = getBotSourceCards(playerId);
	const currentCount = countBotCardsInCurrentDay(playerId);
	const sourceCard =
		sourceCards[currentCount % Math.max(1, sourceCards.length)] ??
		initialDeck[0];

	if (!sourceCard) {
		stopBotPlacementTimer();
		return;
	}

	placeOneBotCard(playerId, sourceCard, currentCount);
	rerenderArena();
}

export function startRealtimeBotPlacement() {
	stopBotPlacementTimer();

	if (isOnlineRoomActive()) return;
	if (
		state.isDraftPhase ||
		state.isSimulationMode ||
		state.isInitialDealInProgress
	) {
		return;
	}
	if (!hasBotPlacementAvailable()) return;

	/*
    Local fake realtime:
    Cứ mỗi ~1.1s sẽ có 1 người chơi phụ xếp 1 lá.
    Khi lên online thật, đoạn này sẽ được thay bằng socket event "board:updated".
  */
	state.botPlacementTimerId = window.setInterval(() => {
		placeNextRealtimeBotMove();
	}, 1100);
}

function placeBotCardsForCurrentDay() {
	if (isOnlineRoomActive()) return;

	/*
    Bản cũ fill bot ngay lập tức nên nhìn không giống real-time.
    Bản mới chỉ khởi động timer, bot sẽ lần lượt đặt icon lên side board.
  */
	startRealtimeBotPlacement();
}

export function placeBotCardsAfterPlayerMove(sourceCard: TravelCardData) {
	if (isOnlineRoomActive()) return;

	const opponentIds = getOpponentPlayerIds();

	opponentIds.forEach((playerId, index) => {
		if (countBotCardsInCurrentDay(playerId) >= 3) return;

		placeOneBotCard(playerId, sourceCard, index);
	});
}
