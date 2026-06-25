import { onlineClientState } from "../online/socketClient.js";
import {
  currentPlayerId,
  initialDeck,
  playerIds,
  state,
} from "../state/gameState.js";
import type { BoardTokenCard, PlayerId, TravelCardData } from "../types.js";
import {
  calculateScoreBreakdown as calculateScoreBreakdownFromCards,
  type ScoreBreakdown,
  type SimulationResult,
} from "./scoring.js";
import {
  type BoardSlots,
  type BoardTotals,
  getCurrentDayPlacedCards as getCurrentDayPlacedCardsFromSlots,
} from "./board.js";
import { getRemainingResources as getRemainingResourcesFromTotals } from "./resources.js";
import { STARTING_COIN, STARTING_STAMINA } from "./constants.js";
import { getBoardDisplayName } from "../ui/cardDisplay.js";

const FALLBACK_CARD_IMAGE =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80";

// ── Local helpers ──

function getOnlinePlayer(playerId?: PlayerId) {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId] ?? null;
}

export function getOnlineSelfState() {
  return onlineClientState.roomState?.self ?? null;
}

export function getOnlinePlayerBoard(playerId?: PlayerId) {
  return getOnlinePlayer(playerId)?.board ?? null;
}

function getCurrentOnlinePlayerId(): PlayerId {
  return onlineClientState.playerId ?? currentPlayerId;
}

function getOnlineScoreForPlayer(playerId?: PlayerId): number | null {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId]?.score ?? null;
}

function getKnownOnlineCardById(cardId: string): TravelCardData | null {
  const onlineSelf = getOnlineSelfState();

  const allKnownCards = [
    ...(state.onlineDraftDisplayPool ?? []),
    ...(state.onlineDraftPendingPool ?? []),
    ...(onlineSelf?.draftPool ?? []),
    ...(onlineSelf?.pickedDraftCards ?? []),
    ...(onlineSelf?.hand ?? []),
    ...state.playerHand,
    ...initialDeck,
  ] as TravelCardData[];

  return allKnownCards.find((card) => card.id === cardId) ?? null;
}

function createDebtTokenCard(params: {
  rowIndex: number;
  colIndex: number;
  amount: number;
  sourceCardName: string;
  lockedReason?: string;
}): TravelCardData {
  return {
    id: `debt_token_${params.rowIndex}_${params.colIndex}_${Date.now()}`,
    name: params.lockedReason ? "Nợ + Kiệt sức" : "Token Nợ",
    shortName: params.lockedReason ? "Nợ + Kiệt sức" : "Token Nợ",
    city: `Trả ${params.amount} xu`,
    shortCity: `Trả ${params.amount} xu`,
    image: FALLBACK_CARD_IMAGE,
    rarity: "common",
    rarityLabel: "!",
    vp: 0,
    coin: 0,
    stamina: 0,
    tag: "utility",
    tagLabel: "Nợ",
    tags: ["UTILITY"],
    icon: "💸",
    description:
      `Bấm để trả ${params.amount} xu. Nếu không trả trước khi hết ngày sẽ bị -20 VP.`,
    bonusText: "Không trả nợ: -20 VP",
    boardTokenType: "debt",
    debtAmount: params.amount,
    lockedReason: params.lockedReason,
    sourceCardName: params.sourceCardName,
  } as BoardTokenCard;
}

export function createExhaustLockTokenCard(params: {
  rowIndex: number;
  colIndex: number;
  sourceCardName: string;
}): TravelCardData {
  return {
    id: `exhaust_lock_${params.rowIndex}_${params.colIndex}_${Date.now()}`,
    name: "Bị khóa",
    shortName: "Bị khóa",
    city: "Kiệt sức",
    shortCity: "Kiệt sức",
    image: FALLBACK_CARD_IMAGE,
    rarity: "common",
    rarityLabel: "!",
    vp: 0,
    coin: 0,
    stamina: 0,
    tag: "utility",
    tagLabel: "Khóa",
    tags: ["UTILITY"],
    icon: "🔒",
    description: `Ô này bị khóa vì đã vay thể lực ở ${params.sourceCardName}.`,
    bonusText: "Không thể xếp bài vào ô này.",
    boardTokenType: "lock",
    lockedReason: "Kiệt sức",
    sourceCardName: params.sourceCardName,
  } as BoardTokenCard;
}

function createCardFromPublicBoardCell(cell: {
  cardId: string;
  name?: string;
  tag: string;
  icon: string;
  vp: number;
  coin?: number;
  stamina?: number;
  image?: string;
  type?: "card" | "debt" | "lock";
  debtAmount?: number;
  lockedReason?: string;
  sourceCardName?: string;
}): TravelCardData {
  const knownCard = getKnownOnlineCardById(cell.cardId);

  if (knownCard && !cell.type) {
    return knownCard;
  }

  if (cell.type === "debt") {
    return {
      ...createDebtTokenCard({
        rowIndex: 0,
        colIndex: 0,
        amount: cell.debtAmount ?? 0,
        sourceCardName: cell.sourceCardName ?? cell.name ?? "Lá đã vay",
        lockedReason: cell.lockedReason,
      }),
      id: cell.cardId,
    } as BoardTokenCard;
  }

  if (cell.type === "lock") {
    return {
      ...createExhaustLockTokenCard({
        rowIndex: 0,
        colIndex: 0,
        sourceCardName: cell.sourceCardName ?? cell.name ?? "Lá đã vay thể lực",
      }),
      id: cell.cardId,
    } as BoardTokenCard;
  }

  const fallbackName = cell.name ?? cell.cardId;
  const normalizedTag = cell.tag || "food";

  return {
    id: cell.cardId,
    name: fallbackName,
    shortName: fallbackName,
    city: "",
    shortCity: "",
    image: cell.image ?? FALLBACK_CARD_IMAGE,
    rarity: "common",
    rarityLabel: "★",
    vp: cell.vp,
    coin: cell.coin ?? 0,
    stamina: cell.stamina ?? 0,
    tag: normalizedTag,
    tagLabel: normalizedTag,
    tags: [normalizedTag.toUpperCase()],
    icon: cell.icon,
    description: "",
    bonusText: "",
  };
}

function convertOnlineBoardToBoardSlots(
  playerId?: PlayerId,
): BoardSlots | null {
  const onlineBoard = getOnlinePlayerBoard(playerId);

  if (!onlineBoard) return null;

  return onlineBoard.map((row) => {
    return row.map((cell) => {
      if (!cell) return null;

      return createCardFromPublicBoardCell(cell);
    });
  });
}

function getCurrentDayPlacedCards(
  dayIndex = state.currentDayIndex,
): TravelCardData[] {
  return getCurrentDayPlacedCardsFromSlots(getBoardSlots(), dayIndex);
}

export function getSelfPlanningConfirmLockSignature() {
  const playerId = onlineClientState.playerId;
  const roomState = onlineClientState.roomState;

  if (!playerId || !roomState) {
    return "";
  }

  const handIds = (roomState.self.hand ?? []).map((card) => card.id).join(",");
  const dayIndex = roomState.dayIndex;
  const board = roomState.players[playerId]?.board ?? [];
  const dayBoard = board
    .map((row) => row[dayIndex])
    .map((cell) => cell?.cardId ?? "-")
    .join(",");

  return `${dayIndex}|${handIds}|${dayBoard}`;
}

export function getSimulationEventResourceModifier(
  result: SimulationResult | null,
) {
  if (!result) {
    return {
      coin: 0,
      stamina: 0,
    };
  }

  return result.replaySteps.reduce(
    (sum, step) => {
      return {
        coin: sum.coin,
        stamina: sum.stamina + (step.eventStaminaDelta ?? 0),
      };
    },
    {
      coin: 0,
      stamina: 0,
    },
  );
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

// ── Online rankings ──

export function getOnlineSelfScore(): number | null {
  return getOnlineScoreForPlayer(
    onlineClientState.playerId ?? currentPlayerId,
  );
}

export function getOnlineFinalRankings() {
  const roomState = onlineClientState.roomState;

  if (!roomState) return [];

  return playerIds
    .map((playerId) => {
      const player = roomState.players[playerId];

      return {
        playerId,
        name: player.name,
        score: player.score,
        coin: player.coin,
        stamina: player.stamina,
        usedSlots: player.usedSlots,
        isConnected: player.isConnected,
      };
    })
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      if (second.coin !== first.coin) return second.coin - first.coin;
      return second.stamina - first.stamina;
    });
}

export function getMidGameRankings() {
  const roomState = onlineClientState.roomState;

  if (!roomState) return [];

  return playerIds
    .map((playerId) => {
      const player = roomState.players[playerId];

      return {
        playerId,
        name: player?.name ?? playerId.toUpperCase(),
        score: player?.score ?? 0,
        coin: player?.coin ?? STARTING_COIN,
        stamina: player?.stamina ?? STARTING_STAMINA,
        usedSlots: player?.usedSlots ?? 0,
        isConnected: player?.isConnected ?? false,
        hasJoined: player?.hasJoined ?? false,
      };
    })
    .filter((player) => player.hasJoined || player.isConnected)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.usedSlots !== a.usedSlots) return b.usedSlots - a.usedSlots;
      return a.playerId.localeCompare(b.playerId);
    });
}

export function isOnlinePlanningPhase() {
  return (
    isOnlineRoomActive() && onlineClientState.roomState?.phase === "planning"
  );
}

export function isSelfPlanningConfirmed() {
  const playerId = onlineClientState.playerId;
  const roomState = onlineClientState.roomState;

  if (!playerId || !roomState?.players[playerId]) {
    return false;
  }

  if (roomState.players[playerId].planningConfirmed === true) {
    return true;
  }

  return (
    state.selfPlanningConfirmPending &&
    state.planningConfirmLockSignature !== "" &&
    state.planningConfirmLockSignature === getSelfPlanningConfirmLockSignature()
  );
}

export function isDraftDealVisualActive(): boolean {
  return (
    state.isDraftCenterDealing ||
    state.isInitialDealInProgress ||
    Date.now() < state.draftDealVisualEndsAt
  );
}

// ── Board slots ──

export function getBoardSlots(): BoardSlots {
  if (isOnlineRoomActive()) {
    const onlineBoard = convertOnlineBoardToBoardSlots(
      getCurrentOnlinePlayerId(),
    );

    if (onlineBoard) {
      return onlineBoard;
    }
  }

  return state.playerBoards[currentPlayerId];
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

// ── Stamin penalty ──

export function getSimulationEventStaminaPenalty(
  result: SimulationResult | null,
) {
  const modifier = getSimulationEventResourceModifier(result);

  return Math.abs(Math.min(0, modifier.stamina));
}
