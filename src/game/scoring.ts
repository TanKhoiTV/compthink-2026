import type { TravelCardData } from "../types.js";
import type { BoardSlots } from "./board.js";

export type ScoreBreakdown = {
  baseVP: number;
  bonusVP: number;
  totalVP: number;
  spentCoin: number;
  spentStamina: number;
  usedSlots: number;
  lines: string[];
};

export type SimulationReplayEventType =
  | "promo"
  | "traffic"
  | "storm"
  | "distance";

export type SimulationReplayStep = {
  id: string;
  dayIndex: number;
  rowIndex: number;
  dayLabel: string;
  timeLabel: string;
  title: string;
  subtitle: string;
  vpDelta: number;
  coinDelta: number;
  staminaDelta: number;
  eventText?: string;
  eventType?: SimulationReplayEventType;
  eventVpDelta?: number;
  eventStaminaDelta?: number;
  distanceKm?: number;
  isBadEvent?: boolean;
  isDebtPenalty?: boolean;
  isBoardToken?: boolean;
  comboText?: string;
  isEmpty?: boolean;
};

export type DayScoreSummary = {
  dayIndex: number;
  label: string;
  vp: number;
  steps: number;
};

export type SimulationResult = ScoreBreakdown & {
  debtPenalty: number;
  eventModifier: number;
  distancePenalty: number;
  finalVP: number;
  warnings: string[];
  events: string[];
  replaySteps: SimulationReplayStep[];
  daySummaries: DayScoreSummary[];
};

type CalculateScoreBreakdownParams = {
  placedCards: TravelCardData[];
  getBoardDisplayName: (card: TravelCardData) => string;
};

type BuildSimulationReplayStepsParams = {
  boardSlots: BoardSlots;
  currentDayIndex: number;
  dayLabel: string;
  rows: string[];
  getCardTagKeys: (card: TravelCardData) => string[];
  countCardsWithTag: (cards: TravelCardData[], tag: string) => number;
  getCurrentDayPlacedCards: (dayIndex?: number) => TravelCardData[];
};

type CalculateSimulationResultParams = {
  boardSlots: BoardSlots;
  currentDayIndex: number;
  dayLabel: string;
  rows: string[];
  getBoardDisplayName: (card: TravelCardData) => string;
  getCardTagKeys: (card: TravelCardData) => string[];
  countCardsWithTag: (cards: TravelCardData[], tag: string) => number;
  getCurrentDayPlacedCards: (dayIndex?: number) => TravelCardData[];
};

export function calculateScoreBreakdown({
  placedCards,
  getBoardDisplayName,
}: CalculateScoreBreakdownParams): ScoreBreakdown {
  const baseVP = placedCards.reduce((sum, card) => sum + card.vp, 0);
  const spentCoin = placedCards.reduce((sum, card) => sum + card.coin, 0);
  const spentStamina = placedCards.reduce((sum, card) => sum + card.stamina, 0);
  const lines: string[] = [];

  let bonusVP = 0;

  const foodCount = countCardsByTag(placedCards, "FOOD");
  const cultureCount = countCardsByTag(placedCards, "CULTURE");
  const actionCount = countCardsByTag(placedCards, "ACTION");

  if (foodCount >= 2) {
    const foodBonus = 5;
    bonusVP += foodBonus;
    lines.push(`Combo Ẩm thực x${foodCount}: +${foodBonus} VP`);
  }

  if (cultureCount >= 2) {
    const cultureBonus = 8;
    bonusVP += cultureBonus;
    lines.push(`Combo Văn hóa x${cultureCount}: +${cultureBonus} VP`);
  }

  if (actionCount >= 2) {
    const actionBonus = 10;
    bonusVP += actionBonus;
    lines.push(`Chuỗi Khám phá x${actionCount}: +${actionBonus} VP`);
  }

  for (const card of placedCards) {
    const effect = card.onPlayEffect;

    if (!effect?.has_effect) continue;

    if (effect.effect_type === "GAIN_VP") {
      bonusVP += effect.effect_value;
      lines.push(`${getBoardDisplayName(card)}: +${effect.effect_value} VP`);
    }
  }

  if (lines.length === 0) {
    lines.push("Chưa có bonus nào được kích hoạt");
  }

  return {
    baseVP,
    bonusVP,
    totalVP: baseVP + bonusVP,
    spentCoin,
    spentStamina,
    usedSlots: placedCards.length,
    lines,
  };
}

function getBoardTokenType(card: TravelCardData | null) {
  return (card as TravelCardData & {
    boardTokenType?: "debt" | "lock";
  } | null)?.boardTokenType ?? null;
}

function isDebtTokenCard(card: TravelCardData | null) {
  return getBoardTokenType(card) === "debt";
}

function isLockTokenCard(card: TravelCardData | null) {
  return getBoardTokenType(card) === "lock";
}

function getDebtTokenAmount(card: TravelCardData | null) {
  return (card as TravelCardData & {
    debtAmount?: number;
  } | null)?.debtAmount ?? 0;
}

export function buildSimulationReplaySteps({
  boardSlots,
  currentDayIndex,
  dayLabel,
  rows,
  getCardTagKeys,
  countCardsWithTag,
  getCurrentDayPlacedCards,
}: BuildSimulationReplayStepsParams): {
  steps: SimulationReplayStep[];
  daySummaries: DayScoreSummary[];
} {
  const steps: SimulationReplayStep[] = [];
  const dayIndex = currentDayIndex;
  const daySummary: DayScoreSummary = {
    dayIndex,
    label: dayLabel,
    vp: 0,
    steps: 0,
  };

  const currentDayCards = getCurrentDayPlacedCards(dayIndex);
  let previousCard: TravelCardData | null = null;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const card = boardSlots[rowIndex]?.[dayIndex] ?? null;
    const timeLabel = rows[rowIndex];

    if (!card) {
      steps.push({
        id: `empty_${dayIndex}_${rowIndex}`,
        dayIndex,
        rowIndex,
        dayLabel,
        timeLabel,
        title: "Không có hoạt động",
        subtitle: "Không có hoạt động, xem như thời gian nghỉ / di chuyển.",
        vpDelta: 0,
        coinDelta: 0,
        staminaDelta: 0,
        isEmpty: true,
      });
      continue;
    }

    /*
      Token nợ / khóa không phải địa điểm thật.
      Vì vậy:
      - Không roll random event.
      - Không check khoảng cách > 20km.
      - Không cập nhật previousCard.
    */
    if (isDebtTokenCard(card)) {
      const debtPenalty = -20;

      daySummary.vp += debtPenalty;
      daySummary.steps += 1;

      steps.push({
        id: card.id,
        dayIndex,
        rowIndex,
        dayLabel,
        timeLabel,
        title: "Token nợ",
        subtitle: `Nợ tiền ${getDebtTokenAmount(card)} xu`,
        vpDelta: debtPenalty,
        coinDelta: 0,
        staminaDelta: 0,
        isDebtPenalty: true,
        isBoardToken: true,
      });

      continue;
    }

    if (isLockTokenCard(card)) {
      steps.push({
        id: card.id,
        dayIndex,
        rowIndex,
        dayLabel,
        timeLabel,
        title: "Bị khóa",
        subtitle: "Kiệt sức, không thể xếp hoạt động.",
        vpDelta: 0,
        coinDelta: 0,
        staminaDelta: 0,
        isBoardToken: true,
      });

      continue;
    }

    const tagKeys = getCardTagKeys(card);
    let comboText = "";

    if (tagKeys.includes("FOOD") && countCardsWithTag(currentDayCards, "FOOD") >= 2) {
      comboText = "Combo Ẩm thực đang kích hoạt";
    } else if (tagKeys.includes("CULTURE") && countCardsWithTag(currentDayCards, "CULTURE") >= 2) {
      comboText = "Combo Văn hóa đang kích hoạt";
    } else if (tagKeys.includes("ACTION") && countCardsWithTag(currentDayCards, "ACTION") >= 2) {
      comboText = "Chuỗi Khám phá đang kích hoạt";
    }

    const randomEvent = getDeterministicRandomScanEvent(card, dayIndex, rowIndex);
    const distanceEvent = previousCard
      ? getDistanceEvent(previousCard, card, dayIndex, rowIndex)
      : null;

    const activeEvent = distanceEvent ?? randomEvent;
    const eventVpDelta = activeEvent?.vpDelta ?? 0;
    const eventStaminaDelta = activeEvent?.staminaDelta ?? 0;
    const stepVP = card.vp + eventVpDelta;

    daySummary.vp += stepVP;
    daySummary.steps += 1;

    steps.push({
      id: card.id,
      dayIndex,
      rowIndex,
      dayLabel,
      timeLabel,
      title: card.name,
      subtitle: `${card.city} • ${card.tagLabel}`,
      vpDelta: stepVP,
      coinDelta: -card.coin,
      staminaDelta: -card.stamina + eventStaminaDelta,
      comboText,
      eventText: activeEvent?.text,
      eventType: activeEvent?.type,
      eventVpDelta,
      eventStaminaDelta,
      distanceKm: activeEvent?.distanceKm,
      isBadEvent: activeEvent?.isBad === true,
    });

    previousCard = card;
  }

  return { steps, daySummaries: [daySummary] };
}

export function calculateSimulationResult({
  boardSlots,
  currentDayIndex,
  dayLabel,
  rows,
  getBoardDisplayName,
  getCardTagKeys,
  countCardsWithTag,
  getCurrentDayPlacedCards,
}: CalculateSimulationResultParams): SimulationResult {
  const breakdown = calculateScoreBreakdown({
    placedCards: getCurrentDayPlacedCards(),
    getBoardDisplayName,
  });
  const warnings: string[] = [];
  const events: string[] = [];
  const { steps: replaySteps, daySummaries } = buildSimulationReplaySteps({
    boardSlots,
    currentDayIndex,
    dayLabel,
    rows,
    getCardTagKeys,
    countCardsWithTag,
    getCurrentDayPlacedCards,
  });

  const debtPenalty = replaySteps.reduce((sum, step) => {
    return step.isDebtPenalty ? sum + Math.abs(step.vpDelta) : sum;
  }, 0);
  const eventModifier = replaySteps.reduce((sum, step) => {
    if (step.eventType === "promo" || step.eventType === "storm") {
      return sum + (step.eventVpDelta ?? 0);
    }

    return sum;
  }, 0);
  const distancePenalty = replaySteps.reduce((sum, step) => {
    if (step.eventType === "distance") {
      return sum + Math.abs(step.eventVpDelta ?? 0);
    }

    return sum;
  }, 0);

  if (breakdown.usedSlots === 0) {
    warnings.push("Chưa có thẻ nào trên lịch trình.");
  }

  if (breakdown.usedSlots > 0 && breakdown.bonusVP === 0) {
    warnings.push("Lịch trình chưa kích hoạt combo nào.");
  }

  for (let rowIndex = 0; rowIndex < boardSlots.length; rowIndex += 1) {
    const filledInRow = boardSlots[rowIndex]
      .filter((_, colIndex) => colIndex === currentDayIndex)
      .filter((card) => card !== null).length;

    if (filledInRow >= 4) {
      warnings.push(`${rows[rowIndex]} có lịch dày, nên chừa ô nghỉ/di chuyển.`);
    }
  }

  if (warnings.length === 0) {
    warnings.push("Lịch trình hiện tại ổn để mô phỏng MVP.");
  }

  for (const step of replaySteps) {
    if (step.eventText) {
      events.push(`${step.timeLabel}: ${step.eventText}`);
    }
  }

  if (events.length === 0) {
    events.push("Không có event phát sinh trong ngày này.");
  }

  const replayBaseAndEventVP = replaySteps.reduce((sum, step) => {
    return sum + step.vpDelta;
  }, 0);
  const comboOnlyVP = breakdown.bonusVP;

  const finalVP =
    replayBaseAndEventVP +
    comboOnlyVP;

  return {
    ...breakdown,
    debtPenalty,
    eventModifier,
    distancePenalty,
    finalVP,
    warnings,
    events,
    replaySteps,
    daySummaries,
    lines: [
      ...breakdown.lines,
      `Debt penalty: -${debtPenalty} VP`,
      `Event modifier: ${eventModifier >= 0 ? "+" : ""}${eventModifier} VP`,
      `Distance penalty: -${distancePenalty} VP`,
      `Final VP: ${finalVP}`,
    ],
  };
}

type ScanEventResult = {
  type: SimulationReplayEventType;
  text: string;
  vpDelta: number;
  staminaDelta: number;
  distanceKm?: number;
  isBad: boolean;
};

function hashStringToUnit(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function getDeterministicRandomScanEvent(
  card: TravelCardData,
  dayIndex: number,
  rowIndex: number
): ScanEventResult | null {
  const roll = hashStringToUnit(`${card.id}|${dayIndex}|${rowIndex}|scan-event`);

  // Mỗi ô có 15% cơ hội gặp random event.
  if (roll >= 0.15) return null;

  const eventRoll = hashStringToUnit(`${card.id}|${dayIndex}|${rowIndex}|event-type`);

  if (eventRoll < 1 / 3) {
    return {
      type: "promo",
      text: "Khuyến mãi: +10 VP",
      vpDelta: 10,
      staminaDelta: 0,
      isBad: false,
    };
  }

  if (eventRoll < 2 / 3) {
    return {
      type: "traffic",
      text: "Kẹt xe: -8 thể lực",
      vpDelta: 0,
      staminaDelta: -8,
      isBad: true,
    };
  }

  return {
    type: "storm",
    text: "Mưa giông: -10 VP",
    vpDelta: -10,
    staminaDelta: 0,
    isBad: true,
  };
}

function getCardLocation(card: TravelCardData): { lat: number; lng: number } | null {
  const rawCard = card as TravelCardData & {
    lat?: number;
    lng?: number;
    location?: { lat?: number; lng?: number } | string;
  };

  if (typeof rawCard.lat === "number" && typeof rawCard.lng === "number") {
    return {
      lat: rawCard.lat,
      lng: rawCard.lng,
    };
  }

  if (
    rawCard.location &&
    typeof rawCard.location === "object" &&
    typeof rawCard.location.lat === "number" &&
    typeof rawCard.location.lng === "number"
  ) {
    return {
      lat: rawCard.location.lat,
      lng: rawCard.location.lng,
    };
  }

  return null;
}

function getPseudoDistanceKm(
  previousCard: TravelCardData,
  currentCard: TravelCardData,
  dayIndex: number,
  rowIndex: number
) {
  const previousLocation = getCardLocation(previousCard);
  const currentLocation = getCardLocation(currentCard);

  if (previousLocation && currentLocation) {
    return calculateDistanceKm(previousLocation, currentLocation);
  }

  /*
    Fallback khi data chưa có lat/lng:
    dùng city khác nhau + hash ổn định để prototype vẫn test được luật khoảng cách.
  */
  if (previousCard.city !== currentCard.city) {
    return 22 + Math.round(hashStringToUnit(`${previousCard.id}|${currentCard.id}|distance`) * 18);
  }

  return 4 + Math.round(hashStringToUnit(`${previousCard.id}|${currentCard.id}|same-city|${dayIndex}|${rowIndex}`) * 12);
}

function getDistanceEvent(
  previousCard: TravelCardData,
  currentCard: TravelCardData,
  dayIndex: number,
  rowIndex: number
): ScanEventResult | null {
  const distanceKm = getPseudoDistanceKm(previousCard, currentCard, dayIndex, rowIndex);

  if (distanceKm <= 20) return null;

  return {
    type: "distance",
    text: "Khoảng cách > 20km",
    vpDelta: -30,
    staminaDelta: 0,
    distanceKm,
    isBad: true,
  };
}

function calculateDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

function getCardTagKeys(card: TravelCardData): string[] {
  if (card.tags && card.tags.length > 0) {
    return card.tags.map((tag) => tag.toUpperCase());
  }

  return [card.tag.toUpperCase()];
}

function countCardsByTag(cards: TravelCardData[], tag: string): number {
  return cards.filter((card) => getCardTagKeys(card).includes(tag)).length;
}
