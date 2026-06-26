import type { TravelCardData } from "../types.js";
import { days, rows, PHASE_DAYS } from "./constants.js";

export type BoardSlots = (TravelCardData | null)[][];

export type BoardPosition = {
	rowIndex: number;
	colIndex: number;
};

export type BoardTotals = {
	vp: number;
	coin: number;
	stamina: number;
	usedSlots: number;
};

export function createEmptyBoardSlots(): BoardSlots {
	return rows.map(() => days.map(() => null));
}

export function getPlacedCards(boardSlots: BoardSlots): TravelCardData[] {
	const placedCards: TravelCardData[] = [];

	for (const row of boardSlots) {
		for (const card of row) {
			if (card !== null) {
				placedCards.push(card);
			}
		}
	}

	return placedCards;
}

export function getCurrentDayPlacedCards(
	boardSlots: BoardSlots,
	dayIndex: number,
): TravelCardData[] {
	const cards: TravelCardData[] = [];

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const card = boardSlots[rowIndex]?.[dayIndex] ?? null;

		if (card) {
			cards.push(card);
		}
	}

	return cards;
}

export function getBoardCardByPosition(
	boardSlots: BoardSlots,
	rowIndex: number,
	colIndex: number,
): TravelCardData | null {
	return boardSlots[rowIndex]?.[colIndex] ?? null;
}

export function getCardTagKeys(card: TravelCardData): string[] {
	if (card.tags && card.tags.length > 0) {
		return card.tags.map((tag) => tag.toUpperCase());
	}

	return [card.tag.toUpperCase()];
}

export function countCardsWithTag(
	cards: TravelCardData[],
	tag: string,
): number {
	return cards.filter((card) => getCardTagKeys(card).includes(tag)).length;
}

export function getNextTimeSlotPosition(
	rowIndex: number,
	colIndex: number,
): BoardPosition | null {
	if (rowIndex < rows.length - 1) {
		return {
			rowIndex: rowIndex + 1,
			colIndex,
		};
	}

	if (colIndex < PHASE_DAYS - 1) {
		return {
			rowIndex: 0,
			colIndex: colIndex + 1,
		};
	}

	return null;
}
