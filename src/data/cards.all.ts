import type { GameCardData } from "../types";
import { phase1Cards } from "./cards.phase1.js";

export const allCards: GameCardData[] = [
  ...phase1Cards,
];

export function getCardsByPhasePool(phasePool: GameCardData["phase_pool"]) {
  return allCards.filter((card) => card.phase_pool === phasePool);
}

export function getCardsByTag(tag: GameCardData["tags"][number]) {
  return allCards.filter((card) => card.tags.includes(tag));
}

export function getCardById(cardId: string) {
  return allCards.find((card) => card.card_id === cardId) ?? null;
}
