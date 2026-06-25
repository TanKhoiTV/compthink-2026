import type { PlayerId, RoomState } from "./types.js";
import {
  DRAFT_PICK_SECONDS,
  finishDraftRound,
  startDraftForCurrentDay,
} from "./draftEngine.js";
import {
  createEmptyBoard,
  createServerDeck,
  PLAYER_IDS,
} from "./gameEngine.js";

export const SIMULATION_SECONDS = 6;
const RESULT_SECONDS = 3;
const GAMEOVER_SECONDS = 10;
const MAX_DAY_INDEX = 4;

type ServerScanEventResult = {
  vpDelta: number;
  staminaDelta: number;
};

const SERVER_CARD_LOOKUP = new Map(
  createServerDeck().map((card) => [card.id, card]),
);

function hashStringToUnit(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function getRandomScanEventDelta(
  cardId: string,
  dayIndex: number,
  rowIndex: number,
): ServerScanEventResult {
  const roll = hashStringToUnit(`${cardId}|${dayIndex}|${rowIndex}|scan-event`);

  if (roll >= 0.15) {
    return {
      vpDelta: 0,
      staminaDelta: 0,
    };
  }

  const eventRoll = hashStringToUnit(
    `${cardId}|${dayIndex}|${rowIndex}|event-type`,
  );

  if (eventRoll < 1 / 3) {
    return {
      vpDelta: 10,
      staminaDelta: 0,
    };
  }

  if (eventRoll < 2 / 3) {
    return {
      vpDelta: 0,
      staminaDelta: -8,
    };
  }

  return {
    vpDelta: -10,
    staminaDelta: 0,
  };
}

function getPseudoDistanceKm(
  previousCardId: string,
  currentCardId: string,
  dayIndex: number,
  rowIndex: number,
) {
  const previousCard = SERVER_CARD_LOOKUP.get(previousCardId);
  const currentCard = SERVER_CARD_LOOKUP.get(currentCardId);

  /*
    Phải khớp logic client trong src/game/scoring.ts:
    - Khác city: chắc chắn > 20km.
    - Cùng city: 4-16km, không phạt.
  */
  if (previousCard && currentCard && previousCard.city !== currentCard.city) {
    return 22 +
      Math.round(
        hashStringToUnit(`${previousCardId}|${currentCardId}|distance`) * 18,
      );
  }

  return 4 +
    Math.round(
      hashStringToUnit(
        `${previousCardId}|${currentCardId}|same-city|${dayIndex}|${rowIndex}`,
      ) * 12,
    );
}

function getCurrentDayComboBonus(state: RoomState, playerId: PlayerId) {
  const player = state.players[playerId];
  const dayIndex = state.dayIndex;

  if (!player) return 0;

  const tagCounts = new Map<string, number>();

  for (const row of player.board) {
    const cell = row[dayIndex];

    if (!cell || cell.type === "debt" || cell.type === "lock") continue;

    const tag = (cell.tag || "").toUpperCase();

    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  let bonus = 0;

  if ((tagCounts.get("FOOD") ?? 0) >= 2) bonus += 5;
  if ((tagCounts.get("CULTURE") ?? 0) >= 2) bonus += 8;
  if ((tagCounts.get("ACTION") ?? 0) >= 2) bonus += 10;

  return bonus;
}

function getCurrentDaySimulationDelta(
  state: RoomState,
  playerId: PlayerId,
): ServerScanEventResult {
  const player = state.players[playerId];
  const dayIndex = state.dayIndex;

  if (!player) {
    return {
      vpDelta: 0,
      staminaDelta: 0,
    };
  }

  let totalVp = 0;
  let totalStamina = 0;
  let previousCardId: string | null = null;

  for (let rowIndex = 0; rowIndex < player.board.length; rowIndex += 1) {
    const cell = player.board[rowIndex]?.[dayIndex];

    if (!cell) continue;

    if (cell.type === "debt") {
      continue;
    }

    if (cell.type === "lock") {
      continue;
    }

    totalVp += cell.vp ?? 0;

    /*
      Khớp client: distance event ưu tiên hơn random event.
      Nếu distance > 20km thì -30VP và không roll random event cho ô đó.
    */
    if (previousCardId) {
      const distanceKm = getPseudoDistanceKm(
        previousCardId,
        cell.cardId,
        dayIndex,
        rowIndex,
      );

      if (distanceKm > 20) {
        totalVp -= 30;
        previousCardId = cell.cardId;
        continue;
      }
    }

    const eventDelta = getRandomScanEventDelta(cell.cardId, dayIndex, rowIndex);
    totalVp += eventDelta.vpDelta;
    totalStamina += eventDelta.staminaDelta;

    previousCardId = cell.cardId;
  }

  totalVp += getCurrentDayComboBonus(state, playerId);

  return {
    vpDelta: totalVp,
    staminaDelta: totalStamina,
  };
}

function applySimulationScores(state: RoomState) {
  for (const playerId of PLAYER_IDS) {
    const player = state.players[playerId];

    if (!player) continue;

    const delta = getCurrentDaySimulationDelta(state, playerId);

    /*
      Server là nguồn điểm thật online.
      VP âm phải trừ trực tiếp khỏi player.score.
    */
    player.score += delta.vpDelta;
    player.stamina = Math.max(0, player.stamina + delta.staminaDelta);
  }
}

function resetBoardsForNextPhase(state: RoomState) {
  for (const playerId of PLAYER_IDS) {
    const player = state.players[playerId];

    if (!player) continue;

    player.board = createEmptyBoard();
    player.usedSlots = 0;
    player.draftPool = [];
    player.pickedDraftCards = [];
    player.hand = [];
    player.selectedDraftCardId = null;
    player.coinDebt = 0;
  }
}

function startNextPhase(state: RoomState) {
  state.phaseNumber += 1;
  state.dayIndex = 0;
  resetBoardsForNextPhase(state);
  startDraftForCurrentDay(state);
}

function applyFinalCoinDebtPenalty(state: RoomState) {
  for (const playerId of PLAYER_IDS) {
    const player = state.players[playerId];

    if (!player) continue;

    const coinDebt = Math.max(0, player.coinDebt ?? 0);

    if (coinDebt > 0) {
      player.score -= coinDebt * 10;
    }
  }
}

function startNextDayOrFinish(state: RoomState) {
  if (state.dayIndex >= MAX_DAY_INDEX) {
    /*
      Đã qua result của ngày 5.
      Trừ điểm nợ xu còn lại: 1 xu nợ = -10 VP, rồi hiển thị BXH.
    */
    applyFinalCoinDebtPenalty(state);
    state.phase = "gameover";
    state.timer = GAMEOVER_SECONDS;
    return;
  }

  state.dayIndex += 1;
  startDraftForCurrentDay(state);
}

export function advancePlanningToSimulation(state: RoomState) {
  if (state.phase !== "planning") return;

  state.phase = "simulation";
  state.timer = SIMULATION_SECONDS;

  for (const playerId of PLAYER_IDS) {
    state.players[playerId].planningConfirmed = false;
  }
}

export function tickRoom(state: RoomState) {
  if (
    state.phase !== "draft" &&
    state.phase !== "planning" &&
    state.phase !== "simulation" &&
    state.phase !== "result" &&
    state.phase !== "gameover" &&
    state.phase !== "cinematic"
  ) {
    return;
  }

  if (state.phase === "draft" && (state.draftTimerHold ?? 0) > 0) {
    state.draftTimerHold -= 1;
    return;
  }

  if (state.timer > 0) {
    state.timer -= 1;
  }

  if (state.timer > 0) {
    return;
  }

  if (state.phase === "cinematic") {
    startDraftForCurrentDay(state);
    return;
  }

  if (state.phase === "draft") {
    finishDraftRound(state);

    if (state.phase === "draft" && state.timer <= 0) {
      state.timer = DRAFT_PICK_SECONDS;
      state.draftTimerHold = Math.max(state.draftTimerHold ?? 0, 1);
    }

    return;
  }

  if (state.phase === "planning") {
    advancePlanningToSimulation(state);
    return;
  }

  if (state.phase === "simulation") {
    applySimulationScores(state);
    state.phase = "result";
    state.timer = RESULT_SECONDS;
    return;
  }

  if (state.phase === "result") {
    startNextDayOrFinish(state);
    return;
  }

  if (state.phase === "gameover") {
    startNextPhase(state);
  }
}
