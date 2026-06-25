import type { BoardTokenCard, TravelCardData } from "../types.js";
import { getCardTagKeys } from "../game/board.js";

function getTextFitClass(
  text: string,
  baseClass: string,
  mediumThreshold: number,
  longThreshold: number,
) {
  const len = text.trim().length;

  if (len >= longThreshold) return `${baseClass} ${baseClass}--xs`;
  if (len >= mediumThreshold) return `${baseClass} ${baseClass}--sm`;
  return baseClass;
}

function getHandTitleClass(name: string) {
  return getTextFitClass(name, "hand-card__name", 16, 23);
}

function getHandCityClass(city: string) {
  return getTextFitClass(city, "hand-card__city", 18, 28);
}

function getBoardTitleClass(name: string) {
  return getTextFitClass(name, "board-mini__name", 12, 18);
}

function getBoardCityClass(city: string) {
  return getTextFitClass(city, "board-mini__city", 12, 21);
}

function getBoardDisplayName(card: TravelCardData) {
  return card.shortName?.trim() || card.name;
}

function getBoardDisplayCity(card: TravelCardData) {
  return card.shortCity?.trim() || card.city;
}

function getBoardTokenType(card: TravelCardData | null) {
  return (card as BoardTokenCard | null)?.boardTokenType ?? null;
}

function isBoardDebtToken(card: TravelCardData | null) {
  return getBoardTokenType(card) === "debt";
}

function isBoardLockToken(card: TravelCardData | null) {
  return getBoardTokenType(card) === "lock";
}

function getFocusedTitleClass(name: string) {
  return getTextFitClass(name, "focused-card__name", 18, 25);
}

function getFocusedCityClass(city: string) {
  return getTextFitClass(city, "focused-card__city", 18, 28);
}

function getCardBonusBadge(card: TravelCardData) {
  const tagKeys = getCardTagKeys(card);

  if (
    card.onPlayEffect?.has_effect &&
    card.onPlayEffect.effect_type === "GAIN_VP"
  ) {
    return `+${card.onPlayEffect.effect_value} VP`;
  }

  if (tagKeys.includes("FOOD")) {
    return "+5 VP";
  }

  if (tagKeys.includes("CULTURE")) {
    return "+8 VP";
  }

  if (tagKeys.includes("ACTION")) {
    return "+10 VP";
  }

  return "";
}

function stripCardText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDraftPrimaryTag(card: TravelCardData) {
  /*
    Không chỉ dựa vào card.tags, vì nếu mapper/data build bị lệch thì tag chính có thể sai.
    ID thật của bộ card có prefix rất rõ:
    SG_FOOD_..., SG_CULT_..., SG_ACT_..., SG_UTIL_...
    Ưu tiên đọc prefix ID trước để draft không bao giờ gom nhầm hết về FOOD.
  */
  const rawId = String(
    card.id ?? (card as { card_id?: string }).card_id ?? "",
  ).toUpperCase();

  if (rawId.includes("_CULT_") || rawId.startsWith("SG_CULT")) return "CULTURE";
  if (rawId.includes("_ACT_") || rawId.startsWith("SG_ACT")) return "ACTION";
  if (rawId.includes("_UTIL_") || rawId.startsWith("SG_UTIL")) return "UTILITY";
  if (rawId.includes("_FOOD_") || rawId.startsWith("SG_FOOD")) return "FOOD";

  const tags = (card.tags ?? []).map((tag) => String(tag).toUpperCase());

  if (tags.includes("CULTURE")) return "CULTURE";
  if (tags.includes("ACTION")) return "ACTION";
  if (tags.includes("UTILITY")) return "UTILITY";
  if (tags.includes("FOOD")) return "FOOD";

  const fallbackTag = String(card.tag ?? "").toUpperCase();

  if (fallbackTag === "CULTURE") return "CULTURE";
  if (fallbackTag === "ACTION") return "ACTION";
  if (fallbackTag === "UTILITY") return "UTILITY";
  if (fallbackTag === "FOOD") return "FOOD";

  return "UNKNOWN";
}

function formatTurnTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  const secondsText = remainingSeconds < 10
    ? `0${remainingSeconds}`
    : `${remainingSeconds}`;

  return `${minutes}:${secondsText}`;
}

function formatSignedVP(value: number) {
  if (value > 0) return `+${value} VP`;
  if (value < 0) return `${value} VP`;
  return "0 VP";
}

export {
  formatSignedVP,
  formatTurnTimer,
  getBoardCityClass,
  getBoardDisplayCity,
  getBoardDisplayName,
  getBoardTitleClass,
  getBoardTokenType,
  getCardBonusBadge,
  getDraftPrimaryTag,
  getFocusedCityClass,
  getFocusedTitleClass,
  getHandCityClass,
  getHandTitleClass,
  getTextFitClass,
  isBoardDebtToken,
  isBoardLockToken,
  stripCardText,
};
