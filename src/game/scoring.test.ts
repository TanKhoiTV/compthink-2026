import { describe, it, expect } from "vitest";
import type { TravelCardData } from "../types.js";
import { calculateScoreBreakdown } from "./scoring.js";

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

const getBoardDisplayName = (card: TravelCardData) => card.name;

describe("calculateScoreBreakdown", () => {
  it("returns zero breakdown for empty placed cards", () => {
    const result = calculateScoreBreakdown({
      placedCards: [],
      getBoardDisplayName,
    });

    expect(result.baseVP).toBe(0);
    expect(result.bonusVP).toBe(0);
    expect(result.totalVP).toBe(0);
    expect(result.spentCoin).toBe(0);
    expect(result.spentStamina).toBe(0);
    expect(result.usedSlots).toBe(0);
    expect(result.lines).toContain("Chưa có bonus nào được kích hoạt");
  });

  it("calculates base VP from placed cards", () => {
    const cards = [
      makeCard({ id: "a", vp: 5, coin: 2, stamina: 1 }),
      makeCard({ id: "b", vp: 3, coin: 1, stamina: 0 }),
    ];

    const result = calculateScoreBreakdown({
      placedCards: cards,
      getBoardDisplayName,
    });

    expect(result.baseVP).toBe(8);
    // Both cards default to tag FOOD, triggering food combo (+5 VP)
    expect(result.totalVP).toBe(13);
    expect(result.spentCoin).toBe(3);
    expect(result.spentStamina).toBe(1);
    expect(result.usedSlots).toBe(2);
  });

  it("activates food combo with 2+ FOOD cards", () => {
    const cards = [
      makeCard({ id: "a", tag: "FOOD" }),
      makeCard({ id: "b", tag: "FOOD" }),
    ];

    const result = calculateScoreBreakdown({
      placedCards: cards,
      getBoardDisplayName,
    });

    expect(result.bonusVP).toBeGreaterThan(0);
    expect(result.lines).toContainEqual(
      expect.stringContaining("Ẩm thực"),
    );
  });

  it("activates culture combo with 2+ CULTURE cards", () => {
    const cards = [
      makeCard({ id: "a", tag: "CULTURE" }),
      makeCard({ id: "b", tag: "CULTURE" }),
    ];

    const result = calculateScoreBreakdown({
      placedCards: cards,
      getBoardDisplayName,
    });

    expect(result.bonusVP).toBeGreaterThan(0);
    expect(result.lines).toContainEqual(
      expect.stringContaining("Văn hóa"),
    );
  });

  it("activates action combo with 2+ ACTION cards", () => {
    const cards = [
      makeCard({ id: "a", tag: "ACTION" }),
      makeCard({ id: "b", tag: "ACTION" }),
    ];

    const result = calculateScoreBreakdown({
      placedCards: cards,
      getBoardDisplayName,
    });

    expect(result.bonusVP).toBeGreaterThan(0);
    expect(result.lines).toContainEqual(
      expect.stringContaining("Chuỗi Khám phá"),
    );
  });

  it("applies onPlayEffect GAIN_VP bonus", () => {
    const cards = [
      makeCard({
        id: "a",
        vp: 2,
        onPlayEffect: {
          has_effect: true,
          effect_type: "GAIN_VP",
          effect_value: 7,
        },
      }),
    ];

    const result = calculateScoreBreakdown({
      placedCards: cards,
      getBoardDisplayName,
    });

    expect(result.bonusVP).toBe(7);
    expect(result.totalVP).toBe(9);
    expect(result.lines).toContainEqual(
      expect.stringContaining("+7 VP"),
    );
  });
});
