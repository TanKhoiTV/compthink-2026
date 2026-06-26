import { describe, it, expect } from "vitest";
import type { TravelCardData } from "../types.js";
import type { BoardTotals } from "./board.js";
import {
	getRemainingResources,
	getCardAffordability,
	getCardAffordabilityMessage,
} from "./resources.js";

function makeCard(overrides: Partial<TravelCardData> = {}): TravelCardData {
	return {
		id: "test-card-1",
		name: "Test Card",
		city: "Test City",
		image: "test",
		rarity: "common",
		rarityLabel: "Common",
		vp: 0,
		coin: 0,
		stamina: 0,
		tag: "FOOD",
		tagLabel: "Food",
		icon: "food",
		description: "A test card",
		bonusText: "",
		...overrides,
	};
}

describe("getRemainingResources", () => {
	it("returns full resources when nothing spent", () => {
		const totals: BoardTotals = { vp: 0, coin: 0, stamina: 0, usedSlots: 0 };
		const result = getRemainingResources({
			totals,
			startingCoin: 30,
			startingStamina: 15,
		});
		expect(result).toEqual({ coin: 30, stamina: 15 });
	});

	it("returns reduced resources when some are spent", () => {
		const totals: BoardTotals = { vp: 0, coin: 10, stamina: 5, usedSlots: 2 };
		const result = getRemainingResources({
			totals,
			startingCoin: 30,
			startingStamina: 15,
		});
		expect(result).toEqual({ coin: 20, stamina: 10 });
	});

	it("does not return negative remaining resources", () => {
		const totals: BoardTotals = { vp: 0, coin: 40, stamina: 20, usedSlots: 99 };
		const result = getRemainingResources({
			totals,
			startingCoin: 30,
			startingStamina: 15,
		});
		expect(result).toEqual({ coin: 0, stamina: 0 });
	});
});

describe("getCardAffordability", () => {
	it("returns canAfford=true when resources are sufficient", () => {
		const card = makeCard({ coin: 5, stamina: 3 });
		const result = getCardAffordability({
			card,
			remaining: { coin: 10, stamina: 10 },
		});
		expect(result).toEqual({
			canAfford: true,
			missingCoin: 0,
			missingStamina: 0,
		});
	});

	it("returns canAfford=false when resources are insufficient", () => {
		const card = makeCard({ coin: 10, stamina: 5 });
		const result = getCardAffordability({
			card,
			remaining: { coin: 5, stamina: 2 },
		});
		expect(result).toEqual({
			canAfford: false,
			missingCoin: 5,
			missingStamina: 3,
		});
	});

	it("returns canAfford=false when card costs exactly exceed remaining", () => {
		const card = makeCard({ coin: 10, stamina: 5 });
		const result = getCardAffordability({
			card,
			remaining: { coin: 10, stamina: 4 },
		});
		expect(result).toEqual({
			canAfford: false,
			missingCoin: 0,
			missingStamina: 1,
		});
	});
});

describe("getCardAffordabilityMessage", () => {
	it("returns positive message when card is affordable", () => {
		const msg = getCardAffordabilityMessage({
			canAfford: true,
			missingCoin: 0,
			missingStamina: 0,
		});
		expect(msg).toBe("Đủ tài nguyên để đặt lá này");
	});

	it("reports missing coin only", () => {
		const msg = getCardAffordabilityMessage({
			canAfford: false,
			missingCoin: 5,
			missingStamina: 0,
		});
		expect(msg).toContain("thiếu");
		expect(msg).toContain("5");
		expect(msg).toContain("xu");
	});

	it("reports missing stamina only", () => {
		const msg = getCardAffordabilityMessage({
			canAfford: false,
			missingCoin: 0,
			missingStamina: 3,
		});
		expect(msg).toContain("thiếu");
		expect(msg).toContain("3");
		expect(msg).toContain("thể lực");
	});

	it("reports both missing resources", () => {
		const msg = getCardAffordabilityMessage({
			canAfford: false,
			missingCoin: 5,
			missingStamina: 3,
		});
		expect(msg).toContain("5");
		expect(msg).toContain("xu");
		expect(msg).toContain("3");
		expect(msg).toContain("thể lực");
	});
});
