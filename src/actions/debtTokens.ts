import { state } from "../state/gameState.js";
import {
  createExhaustLockTokenCard,
  getBoardSlots,
  getRemainingResources,
  isOnlineRoomActive,
} from "../game/queries.js";
import { getNextTimeSlotPosition } from "../game/board.js";
import { rerenderArena } from "../ui/arenaRenderer.js";
import { playGameSound } from "../audio/gameAudio.js";
import { sendPayDebt } from "../online/socketClient.js";
import type { BoardTokenCard, TravelCardData } from "../types.js";

export function addLocalDebtOrExhaustToken(params: {
  rowIndex: number;
  colIndex: number;
  card: TravelCardData;
  coinDebt: number;
  staminaDebt: number;
}) {
  if (params.coinDebt > 0) {
    state.localCoinDebt += params.coinDebt;
  }

  if (params.staminaDebt <= 0) return;

  const nextPosition = getNextTimeSlotPosition(
    params.rowIndex,
    params.colIndex,
  );

  if (!nextPosition) return;
  if (
    getBoardSlots()[nextPosition.rowIndex]?.[nextPosition.colIndex] !== null
  ) {
    return;
  }

  getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] =
    createExhaustLockTokenCard({
      rowIndex: nextPosition.rowIndex,
      colIndex: nextPosition.colIndex,
      sourceCardName: params.card.name,
    });
}

export function payLocalDebtToken(
  rowIndex: number,
  colIndex: number,
  card: TravelCardData,
) {
  const token = card as BoardTokenCard;
  const debtAmount = token.debtAmount ?? 0;
  const remaining = getRemainingResources();

  if (debtAmount <= 0) return;

  if (remaining.coin < debtAmount) {
    alert(`Không đủ xu để trả nợ. Cần ${debtAmount} xu.`);
    return;
  }

  state.eventResourceModifier = {
    ...state.eventResourceModifier,
    coin: state.eventResourceModifier.coin - debtAmount,
  };

  getBoardSlots()[rowIndex][colIndex] = null;
  playGameSound("eventPromo");
  rerenderArena();
}

export function payDebtToken(
  rowIndex: number,
  colIndex: number,
  card: TravelCardData,
) {
  if (colIndex !== state.currentDayIndex) {
    state.focusedBoardCard = card;
    state.focusedBoardPosition = { rowIndex, colIndex };
    rerenderArena();
    return;
  }

  if (isOnlineRoomActive()) {
    sendPayDebt({
      rowIndex,
      colIndex,
    });
    return;
  }

  payLocalDebtToken(rowIndex, colIndex, card);
}

export function clearLocalGeneratedTokenForReturnedCard(
  rowIndex: number,
  colIndex: number,
  card: TravelCardData,
) {
  const nextPosition = getNextTimeSlotPosition(rowIndex, colIndex);

  if (!nextPosition) return;

  const nextCell =
    getBoardSlots()[nextPosition.rowIndex]?.[nextPosition.colIndex] ?? null;
  const token = nextCell as BoardTokenCard | null;

  if (
    token &&
    token.boardTokenType === "lock" &&
    token.sourceCardName === card.name
  ) {
    getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] = null;
  }
}
