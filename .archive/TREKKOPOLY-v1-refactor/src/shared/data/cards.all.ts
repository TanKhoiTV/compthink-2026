import type { TravelCard } from "../types.ts";
import { saigonFoodCards } from "./cards.saigon.food.ts";
import { saigonCultureCards } from "./cards.saigon.culture.ts";
import { saigonActionCards } from "./cards.saigon.action.ts";
import { saigonUtilityCards } from "./cards.saigon.utility.ts";

/** All Phase 1 Saigon cards */
export const allCards: TravelCard[] = [
	...saigonFoodCards,
	...saigonCultureCards,
	...saigonActionCards,
	...saigonUtilityCards,
];

/** Filter cards by phase pool */
export function getCardsByPhasePool(phasePool: string) {
	return allCards.filter((card) => card.phase_pool === phasePool);
}

/** Filter cards by tag */
export function getCardsByTag(tag: string) {
	return allCards.filter((card) => (card.tags as string[]).includes(tag));
}

/** Find card by ID */
export function getCardById(cardId: string): TravelCard | null {
	return allCards.find((card) => card.id === cardId) ?? null;
}
