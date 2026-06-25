import { describe, it, expect } from "vitest";
import { createEmptyBoardSlots, getPlacedCards } from "./shared/board.ts";
import { calculateScoreBreakdown } from "./shared/scoring.ts";
import {
	createInitialDeck,
	shuffleCards,
	drawDailyHandFromDeck,
} from "./shared/deck.ts";
import { saigonFoodCards } from "./shared/data/index.ts";
import { HAND_SIZE, days, rows } from "./shared/constants.ts";

describe("board", () => {
	it("creates an empty 5×5 board", () => {
		const board = createEmptyBoardSlots();
		expect(board.length).toBe(rows.length);
		board.forEach((row: (typeof board)[number]) => {
			expect(row.length).toBe(days.length);
			row.forEach((cell) => expect(cell).toBeNull());
		});
	});

	it("getPlacedCards returns empty for empty board", () => {
		const board = createEmptyBoardSlots();
		expect(getPlacedCards(board)).toEqual([]);
	});
});

describe("scoring", () => {
	it("score breakdown for empty board has zero values", () => {
		const breakdown = calculateScoreBreakdown({
			placedCards: [],
			getBoardDisplayName: () => "",
		});
		expect(breakdown.baseVP).toBe(0);
		expect(breakdown.bonusVP).toBe(0);
	});
});

describe("deck", () => {
	it("createInitialDeck with saigonFoodCards returns HAND_SIZE cards", () => {
		const deck = createInitialDeck({
			cards: saigonFoodCards,
			fallbackCards: [],
			handSize: HAND_SIZE,
		});
		expect(deck.length).toBeGreaterThanOrEqual(HAND_SIZE);
	});

	it("shuffleCards preserves deck size", () => {
		const deck = createInitialDeck({
			cards: saigonFoodCards,
			fallbackCards: [],
			handSize: HAND_SIZE,
		});
		const shuffled = shuffleCards([...deck]);
		expect(shuffled.length).toBe(deck.length);
	});

	it("drawDailyHandFromDeck draws HAND_SIZE cards", () => {
		const deck = createInitialDeck({
			cards: saigonFoodCards,
			fallbackCards: [],
			handSize: HAND_SIZE,
		});
		const result = drawDailyHandFromDeck({
			deck,
			handSize: HAND_SIZE,
			shuffleCards,
		});
		expect(result.hand.length).toBe(HAND_SIZE);
		expect(result.deck.length).toBe(deck.length - HAND_SIZE);
	});
});
