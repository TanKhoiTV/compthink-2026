import type { TravelCardData } from "../types.js";
import type { BoardTotals } from "./board.js";

export type ResourceState = {
  coin: number;
  stamina: number;
};

export type CardAffordability = {
  canAfford: boolean;
  missingCoin: number;
  missingStamina: number;
};

export type GetRemainingResourcesParams = {
  totals: BoardTotals;
  startingCoin: number;
  startingStamina: number;
};

export type GetCardAffordabilityParams = {
  card: TravelCardData;
  remaining: ResourceState;
};

export function getRemainingResources({
  totals,
  startingCoin,
  startingStamina,
}: GetRemainingResourcesParams): ResourceState {
  return {
    coin: Math.max(0, startingCoin - totals.coin),
    stamina: Math.max(0, startingStamina - totals.stamina),
  };
}

export function getCardAffordability({
  card,
  remaining,
}: GetCardAffordabilityParams): CardAffordability {
  const missingCoin = Math.max(0, card.coin - remaining.coin);
  const missingStamina = Math.max(0, card.stamina - remaining.stamina);

  return {
    canAfford: missingCoin === 0 && missingStamina === 0,
    missingCoin,
    missingStamina,
  };
}

export function getCardAffordabilityMessage(
  affordability: CardAffordability,
): string {
  const reasons: string[] = [];

  if (affordability.missingCoin > 0) {
    reasons.push(`thiếu ${affordability.missingCoin} xu`);
  }

  if (affordability.missingStamina > 0) {
    reasons.push(`thiếu ${affordability.missingStamina} thể lực`);
  }

  if (reasons.length === 0) {
    return "Đủ tài nguyên để đặt lá này";
  }

  return `Không đủ tài nguyên: ${reasons.join(", ")}`;
}
