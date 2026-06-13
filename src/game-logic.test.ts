import { describe, it, expect } from "vitest";
import {
	createEmptyBoardSlots,
	getPlacedCards,
	createBoardCells,
	placeCardOnBoardCells,
	validateDistanceCells,
} from "./shared/board.ts";
import { calculateScoreBreakdown } from "./shared/scoring.ts";
import {
	createInitialDeck,
	shuffleCards,
	drawDailyHandFromDeck,
} from "./shared/deck.ts";
import { saigonFoodCards } from "./shared/data/index.ts";
import { HAND_SIZE, days, rows } from "./shared/constants.ts";
import {
	applyOnPlayEffects,
	payDraftCost,
	applyFinalDebtPenalty,
	STARTING_RESOURCES,
	MAX_STAMINA,
	FINAL_DEBT_PENALTY_MULTIPLIER,
} from "./shared/rules.ts";
import type { TravelCard } from "./shared/types.ts";

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

describe("applyOnPlayEffects", () => {
	function makeCard(overrides: Partial<TravelCard> = {}): TravelCard {
		return {
			id: "C1",
			card_id: "C1",
			name: "Test Card",
			tags: [],
			tag: "FOOD",
			coin: 0,
			cost: 0,
			stamina: 0,
			vp: 0,
			victory_point: 0,
			on_play_effect: "",
			image: "",
			city: "Saigon",
			coordinates: { lat: 0, lng: 0 },
			...overrides,
		};
	}

	it("RECOVER_XU adds xu", () => {
		const card = makeCard({
			onPlayEffect: { has_effect: true, effect_type: "RECOVER_XU", effect_value: 2 },
		});
		const result = applyOnPlayEffects(STARTING_RESOURCES, card);
		expect(result.xu).toBe(STARTING_RESOURCES.xu + 2);
	});

	it("RECOVER_LA adds stamina capped at MAX_STAMINA", () => {
		const card = makeCard({
			onPlayEffect: { has_effect: true, effect_type: "RECOVER_LA", effect_value: 10 },
		});
		const result = applyOnPlayEffects(STARTING_RESOURCES, card);
		expect(result.stamina).toBe(MAX_STAMINA);
	});

	it("DEDUCT_LA subtracts stamina floored at 0", () => {
		const card = makeCard({
			onPlayEffect: { has_effect: true, effect_type: "DEDUCT_LA", effect_value: 100 },
		});
		const result = applyOnPlayEffects(STARTING_RESOURCES, card);
		expect(result.stamina).toBe(0);
	});

	it("DOUBLE_VP_NEXT doubles the following card's base VP", () => {
		const buffCard = makeCard({
			vp: 1,
			victory_point: 1,
			onPlayEffect: { has_effect: true, effect_type: "DOUBLE_VP_NEXT", effect_value: 1 },
		});
		const afterBuff = applyOnPlayEffects(STARTING_RESOURCES, buffCard);
		expect(afterBuff.doubleVpNext).toBe(true);

		const nextCard = makeCard({ vp: 5, victory_point: 5 });
		const afterNext = applyOnPlayEffects(afterBuff, nextCard);

		expect(afterNext.vp - afterBuff.vp).toBe(10);
		expect(afterNext.doubleVpNext).toBe(false);
	});

	it("DISCOUNT_XU_NEXT reduces the next draft cost and is consumed", () => {
		const buffCard = makeCard({
			onPlayEffect: { has_effect: true, effect_type: "DISCOUNT_XU_NEXT", effect_value: 3 },
		});
		const afterBuff = applyOnPlayEffects(STARTING_RESOURCES, buffCard);
		expect(afterBuff.discountXuNext).toBe(3);

		const nextCard = makeCard({ cost: 5, coin: 5 });
		const { resources } = payDraftCost(afterBuff, nextCard);

		expect(resources.xu).toBe(afterBuff.xu - 2);
		expect(resources.discountXuNext).toBe(0);
	});

	it("IGNORE_DISTANCE_NEXT sets ignoreDistancePenaltyNext and is consumed", () => {
		const buffCard = makeCard({
			onPlayEffect: { has_effect: true, effect_type: "IGNORE_DISTANCE_NEXT", effect_value: 0 },
		});
		const afterBuff = applyOnPlayEffects(STARTING_RESOURCES, buffCard);
		expect(afterBuff.ignoreDistancePenaltyNext).toBe(true);

		const nextCard = makeCard();
		const afterNext = applyOnPlayEffects(afterBuff, nextCard);
		expect(afterNext.ignoreDistancePenaltyNext).toBe(false);
	});
});

describe("applyFinalDebtPenalty", () => {
	it("deducts debtToken * FINAL_DEBT_PENALTY_MULTIPLIER from vp", () => {
		const resources = { ...STARTING_RESOURCES, vp: 50, debtToken: 2 };
		const { resources: result, penalty } = applyFinalDebtPenalty(resources);

		expect(penalty).toBe(2 * FINAL_DEBT_PENALTY_MULTIPLIER);
		expect(result.vp).toBe(50 - penalty);
	});

	it("floors vp at 0 when penalty exceeds vp", () => {
		const resources = { ...STARTING_RESOURCES, vp: 5, debtToken: 3 };
		const { resources: result } = applyFinalDebtPenalty(resources);

		expect(result.vp).toBe(0);
	});

	it("is a no-op when there is no debt", () => {
		const resources = { ...STARTING_RESOURCES, vp: 50, debtToken: 0 };
		const { resources: result, penalty } = applyFinalDebtPenalty(resources);

		expect(penalty).toBe(0);
		expect(result.vp).toBe(50);
	});
});

describe("board distance penalty", () => {
	function farCard(id: string, lat: number, lng: number): TravelCard {
		return {
			id,
			card_id: id,
			name: id,
			tags: [],
			tag: "FOOD",
			coin: 0,
			cost: 0,
			stamina: 0,
			vp: 0,
			victory_point: 0,
			on_play_effect: "",
			image: "",
			city: "Saigon",
			coordinates: { lat, lng },
		};
	}

	it("flags a distance penalty between cards over the limit on the same day", () => {
		const cardA = farCard("A", 10.0, 106.0);
		const cardB = farCard("B", 10.5, 106.5);

		let board = createBoardCells();
		board = placeCardOnBoardCells(board, "A", { day: 1, slot: "early_morning" });
		board = placeCardOnBoardCells(board, "B", { day: 1, slot: "morning" });

		const { penalty } = validateDistanceCells(board, [cardA, cardB]);
		expect(penalty).toBeGreaterThan(0);
	});

	it("IGNORE_DISTANCE_NEXT exempts the placed card from the distance penalty", () => {
		const cardA = farCard("A", 10.0, 106.0);
		const cardB = farCard("B", 10.5, 106.5);

		let board = createBoardCells();
		board = placeCardOnBoardCells(board, "A", { day: 1, slot: "early_morning" });
		board = placeCardOnBoardCells(board, "B", { day: 1, slot: "morning" }, { ignoreDistancePenalty: true });

		const { penalty } = validateDistanceCells(board, [cardA, cardB]);
		expect(penalty).toBe(0);
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
