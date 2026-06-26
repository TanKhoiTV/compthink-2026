import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentPlayerId, playerIds, state } from "../state/gameState.js";
import { onlineClientState } from "../online/socketClient.js";
import { createEmptyBoardSlots } from "./board.js";
import { makeCard } from "./test-utils.js";
import {
	getBoardSlots,
	getBoardTotals,
	getCurrentDayPlacedCards,
	getCurrentScoreBreakdown,
	getRemainingResources,
} from "./queries.js";
import type { BoardSlots } from "./board.js";
import type { PlayerId } from "../types.js";
import type { SimulationResult } from "./scoring.js";

// vi.mock is hoisted by vitest — must be at top level
vi.mock("../ui/cardDisplay.js", () => ({
	getBoardDisplayName: (card: any) => card.name,
}));

// ── Helpers ──

type PlayerBoardMap = Record<PlayerId, BoardSlots>;

function makeEmptyBoards(): PlayerBoardMap {
	const boards: Partial<PlayerBoardMap> = {};
	for (const id of playerIds) {
		boards[id] = createEmptyBoardSlots();
	}
	return boards as PlayerBoardMap;
}

// ── getBoardSlots ──

describe("getBoardSlots", () => {
	beforeEach(() => {
		onlineClientState.roomId = null;
		onlineClientState.playerId = null;
		onlineClientState.roomState = null;
		state.playerBoards = makeEmptyBoards();
	});

	it("returns local board when offline", () => {
		onlineClientState.roomId = null; // offline
		const slot = makeCard({ id: "test-day" });
		state.playerBoards[currentPlayerId][0][0] = slot;

		const result = getBoardSlots();
		expect(result[0][0]).toBe(slot);
	});

	it("returns online board when online room is active", () => {
		// Set minimal online state
		onlineClientState.roomId = "room-1";
		onlineClientState.playerId = "p1";
		onlineClientState.roomState = {
			self: { hand: [] },
			players: {
				p1: {
					board: [
						[null, null, null, null, null],
						[null, null, null, null, null],
						[null, null, null, null, null],
						[null, null, null, null, null],
						[null, null, null, null, null],
					],
				},
			},
			dayIndex: 0,
		} as any;

		// Set different content in local board to distinguish
		state.playerBoards.p1[0][0] = makeCard({ id: "local-card" });

		const result = getBoardSlots();
		// Online board has all nulls, local board has the card
		expect(result[0][0]).toBeNull();
	});

	it("falls back to local board when online board conversion returns null", () => {
		onlineClientState.roomId = "room-1";
		onlineClientState.playerId = "p1";
		// roomState.players[p1].board is missing => getOnlinePlayerBoard returns null
		onlineClientState.roomState = { self: { hand: [] }, players: {} } as any;

		state.playerBoards.p1[0][0] = makeCard({ id: "fallback-card" });

		const result = getBoardSlots();
		expect(result[0][0]?.id).toBe("fallback-card");
	});
});

// ── getCurrentScoreBreakdown ──

describe("getCurrentScoreBreakdown", () => {
	beforeEach(() => {
		state.simulationResult = null;
		state.playerBoards = makeEmptyBoards();
		onlineClientState.roomId = null;
		onlineClientState.playerId = null;
		onlineClientState.roomState = null;
	});

	it("returns zero breakdown for empty board", () => {
		const result = getCurrentScoreBreakdown();
		expect(result.baseVP).toBe(0);
		expect(result.bonusVP).toBe(0);
		expect(result.totalVP).toBe(0);
		expect(result.usedSlots).toBe(0);
	});

	it("returns cached breakdown from simulationResult", () => {
		state.simulationResult = {
			baseVP: 10,
			bonusVP: 5,
			totalVP: 15,
			finalVP: 15,
			spentCoin: 3,
			spentStamina: 2,
			usedSlots: 2,
			lines: ["Test line 1", "Test line 2"],
			replaySteps: [],
		} as unknown as SimulationResult;

		const result = getCurrentScoreBreakdown();
		expect(result.baseVP).toBe(10);
		expect(result.bonusVP).toBe(5);
		expect(result.totalVP).toBe(15);
		expect(result.spentCoin).toBe(3);
		expect(result.spentStamina).toBe(2);
	});
});

// ── getBoardTotals ──

describe("getBoardTotals", () => {
	beforeEach(() => {
		state.accumulatedVP = 0;
		state.simulationResult = null;
		state.playerBoards = makeEmptyBoards();
		onlineClientState.roomId = null;
		onlineClientState.playerId = null;
		onlineClientState.roomState = null;
	});

	it("returns initial zero totals", () => {
		const result = getBoardTotals();
		expect(result.vp).toBe(0);
		expect(result.coin).toBe(0);
		expect(result.stamina).toBe(0);
		expect(result.usedSlots).toBe(0);
	});

	it("returns accumulated VP", () => {
		state.accumulatedVP = 42;
		state.simulationResult = null;

		const result = getBoardTotals();
		expect(result.vp).toBe(42);
	});

	it("returns totals from simulationResult when available", () => {
		state.accumulatedVP = 10;
		state.simulationResult = {
			baseVP: 5,
			bonusVP: 3,
			totalVP: 8,
			finalVP: 8,
			spentCoin: 2,
			spentStamina: 1,
			usedSlots: 1,
			lines: [],
			replaySteps: [],
		} as unknown as SimulationResult;

		const result = getBoardTotals();
		expect(result.vp).toBe(10);
		expect(result.coin).toBe(2);
		expect(result.stamina).toBe(1);
	});
});

// ── getRemainingResources ──

describe("getRemainingResources", () => {
	beforeEach(() => {
		state.discardedResourceBonus = { coin: 0, stamina: 0 };
		state.eventResourceModifier = { coin: 0, stamina: 0 };
		state.playerBoards = makeEmptyBoards();
		onlineClientState.roomId = null;
		onlineClientState.playerId = null;
		onlineClientState.roomState = null;
	});

	it("returns starting resources when offline with empty board", () => {
		const result = getRemainingResources();
		expect(result.coin).toBeGreaterThanOrEqual(0);
		expect(result.stamina).toBeGreaterThanOrEqual(0);
	});

	it("applies resource bonuses", () => {
		state.discardedResourceBonus = { coin: 3, stamina: 4 };
		state.eventResourceModifier = { coin: 1, stamina: 2 };

		const result = getRemainingResources();
		expect(result.coin).toBeGreaterThanOrEqual(4);
		expect(result.stamina).toBeGreaterThanOrEqual(6);
	});

	it("returns resources from online self when online", () => {
		onlineClientState.roomId = "room-1";
		onlineClientState.playerId = "p1";
		onlineClientState.roomState = {
			self: { hand: [], coin: 99, stamina: 88 },
			players: {
				p1: {
					hand: [],
					coin: 99,
					stamina: 88,
					board: [],
				},
			},
			dayIndex: 0,
		} as any;

		const result = getRemainingResources();
		expect(result.coin).toBe(99);
		expect(result.stamina).toBe(88);
	});
});

// ── getCurrentDayPlacedCards ──

describe("getCurrentDayPlacedCards", () => {
	beforeEach(() => {
		state.currentDayIndex = 0;
		state.playerBoards = makeEmptyBoards();
		onlineClientState.roomId = null;
		onlineClientState.playerId = null;
		onlineClientState.roomState = null;
	});

	it("returns empty array for empty board", () => {
		const result = getCurrentDayPlacedCards();
		expect(result).toEqual([]);
	});

	it("returns cards placed on current day column", () => {
		const card = makeCard({ id: "day0-card" });
		state.playerBoards[currentPlayerId][0][0] = card; // column index matches currentDayIndex

		const result = getCurrentDayPlacedCards();
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("day0-card");
	});
});
