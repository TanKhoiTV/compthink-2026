import { onlineClientState } from "../online/socketClient.js";
import { currentPlayerId, state } from "../state/gameState.js";
import type { PlayerId, TravelCardData } from "../types.js";
import {
  calculateScoreBreakdown as calculateScoreBreakdownFromCards,
  type ScoreBreakdown,
} from "./scoring.js";
import {
  type BoardSlots,
  type BoardTotals,
  getCurrentDayPlacedCards as getCurrentDayPlacedCardsFromSlots,
} from "./board.js";
import { getRemainingResources as getRemainingResourcesFromTotals } from "./resources.js";
import { STARTING_COIN, STARTING_STAMINA } from "./constants.js";
import { getBoardDisplayName } from "../ui/cardDisplay.js";
import {
  getCurrentPlayerBoard,
  getSimulationEventStaminaPenalty,
} from "../app.js";

// ── Local helpers (re-implemented to avoid circular imports) ──

function getOnlinePlayer(playerId?: PlayerId) {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId] ?? null;
}

function getCurrentDayPlacedCards(
  dayIndex = state.currentDayIndex,
): TravelCardData[] {
  return getCurrentDayPlacedCardsFromSlots(getBoardSlots(), dayIndex);
}

// ── Online room state ──

export function isOnlineRoomActive() {
  return Boolean(
    onlineClientState.roomId &&
      onlineClientState.playerId &&
      onlineClientState.roomState,
  );
}

export function getDisplayPlayerName() {
  const selfPlayerId = onlineClientState.playerId ?? currentPlayerId;
  const onlineSelf = getOnlinePlayer(selfPlayerId);

  return onlineSelf?.name ?? "Player";
}

export function getOnlineSelfPublicPlayer() {
  const selfPlayerId = onlineClientState.playerId;

  if (!selfPlayerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[selfPlayerId] ?? null;
}

// ── Board slots ──

export function getBoardSlots(): BoardSlots {
  return getCurrentPlayerBoard();
}

// ── Score breakdown ──

function calculateScoreBreakdown(): ScoreBreakdown {
  return calculateScoreBreakdownFromCards({
    placedCards: getCurrentDayPlacedCards(),
    getBoardDisplayName,
  });
}

export function getCurrentScoreBreakdown(): ScoreBreakdown {
  if (!state.simulationResult) {
    return calculateScoreBreakdown();
  }

  return {
    baseVP: state.simulationResult.baseVP,
    bonusVP: state.simulationResult.bonusVP,
    totalVP: state.simulationResult.finalVP,
    spentCoin: state.simulationResult.spentCoin,
    spentStamina: state.simulationResult.spentStamina +
      getSimulationEventStaminaPenalty(state.simulationResult),
    usedSlots: state.simulationResult.usedSlots,
    lines: state.simulationResult.lines,
  };
}

export function getBoardTotals(): BoardTotals {
  const breakdown = state.simulationResult
    ? getCurrentScoreBreakdown()
    : calculateScoreBreakdown();

  return {
    // Điểm chỉ cộng vào tổng sau khi replay ngày hiện tại chạy xong.
    vp: state.accumulatedVP,
    coin: breakdown.spentCoin,
    stamina: breakdown.spentStamina,
    usedSlots: breakdown.usedSlots,
  };
}

// ── Resources ──

export function getRemainingResources() {
  /*
    Online phải lấy trực tiếp coin/stamina từ server state.
    Trước đó hàm này vẫn tính STARTING - cost trên board nên discard ở server đã cộng tài nguyên
    nhưng UI orb không đổi.
  */
  if (isOnlineRoomActive()) {
    const onlineSelf = getOnlineSelfPublicPlayer();

    if (onlineSelf) {
      return {
        coin: onlineSelf.coin,
        stamina: onlineSelf.stamina,
      };
    }
  }

  const remaining = getRemainingResourcesFromTotals({
    totals: getBoardTotals(),
    startingCoin: STARTING_COIN,
    startingStamina: STARTING_STAMINA,
  });

  return {
    coin: remaining.coin +
      state.discardedResourceBonus.coin +
      state.eventResourceModifier.coin,
    stamina: remaining.stamina +
      state.discardedResourceBonus.stamina +
      state.eventResourceModifier.stamina,
  };
}
