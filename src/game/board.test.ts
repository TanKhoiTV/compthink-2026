import { describe, it, expect } from "vitest";
import type { TravelCardData } from "../types.js";
import { days, rows } from "./constants.js";
import {
  createEmptyBoardSlots,
  getPlacedCards,
  getCurrentDayPlacedCards,
  getBoardCardByPosition,
  getCardTagKeys,
  countCardsWithTag,
  getNextTimeSlotPosition,
} from "./board.js";

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

describe("createEmptyBoardSlots", () => {
  it("creates a grid with correct dimensions", () => {
    const board = createEmptyBoardSlots();
    expect(board).toHaveLength(rows.length);
    board.forEach((row) => {
      expect(row).toHaveLength(days.length);
      row.forEach((cell) => expect(cell).toBeNull());
    });
  });
});

describe("getPlacedCards", () => {
  it("returns empty array for empty board", () => {
    const board = createEmptyBoardSlots();
    expect(getPlacedCards(board)).toEqual([]);
  });

  it("returns placed cards from non-empty board", () => {
    const board = createEmptyBoardSlots();
    const card = makeCard();
    board[0][0] = card;
    expect(getPlacedCards(board)).toEqual([card]);
  });

  it("returns all placed cards across multiple cells", () => {
    const board = createEmptyBoardSlots();
    const card1 = makeCard({ id: "card-1", name: "Card 1" });
    const card2 = makeCard({ id: "card-2", name: "Card 2", tag: "CULTURE" });
    board[0][0] = card1;
    board[2][3] = card2;
    expect(getPlacedCards(board)).toEqual([card1, card2]);
  });
});

describe("getCurrentDayPlacedCards", () => {
  it("returns empty array when no cards on the given day", () => {
    const board = createEmptyBoardSlots();
    expect(getCurrentDayPlacedCards(board, 0)).toEqual([]);
  });

  it("returns cards from the given day column only", () => {
    const board = createEmptyBoardSlots();
    const card1 = makeCard({ id: "card-1" });
    const card2 = makeCard({ id: "card-2" });
    board[0][0] = card1;
    board[1][0] = card2;
    board[0][1] = makeCard({ id: "other-day" });

    const cards = getCurrentDayPlacedCards(board, 0);
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.id)).toEqual(["card-1", "card-2"]);
  });
});

describe("getBoardCardByPosition", () => {
  it("returns null for empty cell", () => {
    const board = createEmptyBoardSlots();
    expect(getBoardCardByPosition(board, 0, 0)).toBeNull();
  });

  it("returns the card at the given position", () => {
    const board = createEmptyBoardSlots();
    const card = makeCard({ id: "pos-card" });
    board[1][2] = card;
    expect(getBoardCardByPosition(board, 1, 2)).toBe(card);
  });

  it("returns null for out-of-bounds position", () => {
    const board = createEmptyBoardSlots();
    expect(getBoardCardByPosition(board, 99, 99)).toBeNull();
  });
});

describe("getCardTagKeys", () => {
  it("returns single tag when tags array is absent", () => {
    const card = makeCard({ tag: "FOOD" });
    expect(getCardTagKeys(card)).toEqual(["FOOD"]);
  });

  it("returns tags from tags array when present", () => {
    const card = makeCard({ tag: "FOOD", tags: ["food", "culture"] });
    expect(getCardTagKeys(card)).toEqual(["FOOD", "CULTURE"]);
  });
});

describe("countCardsWithTag", () => {
  it("returns 0 for empty array", () => {
    expect(countCardsWithTag([], "FOOD")).toBe(0);
  });

  it("counts cards with matching tag", () => {
    const cards = [
      makeCard({ id: "a", tag: "FOOD" }),
      makeCard({ id: "b", tag: "CULTURE" }),
      makeCard({ id: "c", tag: "FOOD" }),
    ];
    expect(countCardsWithTag(cards, "FOOD")).toBe(2);
  });
});

describe("getNextTimeSlotPosition", () => {
  it("moves to next row within same day", () => {
    expect(getNextTimeSlotPosition(0, 0)).toEqual({
      rowIndex: 1,
      colIndex: 0,
    });
  });

  it("moves to next day when at last row", () => {
    expect(getNextTimeSlotPosition(4, 0)).toEqual({
      rowIndex: 0,
      colIndex: 1,
    });
  });

  it("returns null when at last row and last day", () => {
    expect(getNextTimeSlotPosition(4, 4)).toBeNull();
  });
});
