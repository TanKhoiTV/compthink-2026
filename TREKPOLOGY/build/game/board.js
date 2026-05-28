import { days, rows } from "./constants.js";
export function createEmptyBoardSlots() {
    return rows.map(() => days.map(() => null));
}
export function getPlacedCards(boardSlots) {
    const placedCards = [];
    for (const row of boardSlots) {
        for (const card of row) {
            if (card !== null) {
                placedCards.push(card);
            }
        }
    }
    return placedCards;
}
export function getCurrentDayPlacedCards(boardSlots, dayIndex) {
    var _a, _b;
    const cards = [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const card = (_b = (_a = boardSlots[rowIndex]) === null || _a === void 0 ? void 0 : _a[dayIndex]) !== null && _b !== void 0 ? _b : null;
        if (card) {
            cards.push(card);
        }
    }
    return cards;
}
export function getBoardCardByPosition(boardSlots, rowIndex, colIndex) {
    var _a, _b;
    return (_b = (_a = boardSlots[rowIndex]) === null || _a === void 0 ? void 0 : _a[colIndex]) !== null && _b !== void 0 ? _b : null;
}
export function getCardTagKeys(card) {
    if (card.tags && card.tags.length > 0) {
        return card.tags.map((tag) => tag.toUpperCase());
    }
    return [card.tag.toUpperCase()];
}
export function countCardsWithTag(cards, tag) {
    return cards.filter((card) => getCardTagKeys(card).includes(tag)).length;
}
