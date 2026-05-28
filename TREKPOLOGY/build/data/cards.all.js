import { phase1Cards } from "./cards.phase1.js";
export const allCards = [
    ...phase1Cards,
];
export function getCardsByPhasePool(phasePool) {
    return allCards.filter((card) => card.phase_pool === phasePool);
}
export function getCardsByTag(tag) {
    return allCards.filter((card) => card.tags.includes(tag));
}
export function getCardById(cardId) {
    var _a;
    return (_a = allCards.find((card) => card.card_id === cardId)) !== null && _a !== void 0 ? _a : null;
}
