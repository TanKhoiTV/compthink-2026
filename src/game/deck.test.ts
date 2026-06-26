import { describe, it, expect, vi } from "vitest";
import type { TravelCardData } from "../types.js";
import {
  createInitialDeck,
  shuffleCards,
  drawDailyHandFromDeck,
  returnUnplayedHandToDeck,
} from "./deck.js";

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

describe("createInitialDeck", () => {
  it("returns cards array when it has enough cards", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    const fallbackCards = [makeCard({ id: "f1" })];
    const deck = createInitialDeck({ cards, fallbackCards, handSize: 2 });
    expect(deck).toHaveLength(2);
    expect(deck.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("pads with fallback cards when cards array is too short", () => {
    const cards = [makeCard({ id: "a" })];
    const fallbackCards = [makeCard({ id: "f1" }), makeCard({ id: "f2" })];
    const deck = createInitialDeck({ cards, fallbackCards, handSize: 3 });
    expect(deck).toHaveLength(3);
    expect(deck.map((c) => c.id)).toEqual(["a", "f1", "f2"]);
  });

  it("does not exceed fallback array length when more cards are needed", () => {
    const cards = [makeCard({ id: "a" })];
    const fallbackCards = [makeCard({ id: "f1" })];
    const deck = createInitialDeck({ cards, fallbackCards, handSize: 5 });
    expect(deck).toHaveLength(2);
  });
});

describe("shuffleCards", () => {
  it("returns an array of the same length", () => {
    const cards = [
      makeCard({ id: "a" }),
      makeCard({ id: "b" }),
      makeCard({ id: "c" }),
    ];
    const shuffled = shuffleCards(cards);
    expect(shuffled).toHaveLength(3);
  });

  it("does not mutate the original array", () => {
    const cards = [
      makeCard({ id: "a" }),
      makeCard({ id: "b" }),
      makeCard({ id: "c" }),
    ];
    const original = [...cards];
    shuffleCards(cards);
    expect(cards).toEqual(original);
  });

  it("contains all original elements", () => {
    const cards = [
      makeCard({ id: "a" }),
      makeCard({ id: "b" }),
      makeCard({ id: "c" }),
    ];
    const shuffled = shuffleCards(cards);
    const shuffledIds = shuffled.map((c) => c.id).sort();
    expect(shuffledIds).toEqual(["a", "b", "c"]);
  });
});

describe("drawDailyHandFromDeck", () => {
  it("draws the correct number of cards", () => {
    const cards = Array.from({ length: 10 }, (_, i) =>
      makeCard({ id: `card-${i}` })
    );
    const result = drawDailyHandFromDeck({
      deck: cards,
      handSize: 5,
      shuffleCards,
    });
    expect(result.hand).toHaveLength(5);
    expect(result.deck).toHaveLength(5);
  });

  it("uses the provided shuffle function", () => {
    const cards = Array.from({ length: 10 }, (_, i) =>
      makeCard({ id: `card-${i}` })
    );
    const mockShuffle = vi.fn((c: TravelCardData[]) => [...c].reverse());
    drawDailyHandFromDeck({
      deck: cards,
      handSize: 3,
      shuffleCards: mockShuffle,
    });
    expect(mockShuffle).toHaveBeenCalledOnce();
  });
});

describe("returnUnplayedHandToDeck", () => {
  it("returns cards to deck and clears hand", () => {
    const deck = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    const hand = [makeCard({ id: "c" }), makeCard({ id: "d" })];
    const result = returnUnplayedHandToDeck({
      deck,
      playerHand: hand,
      shuffleCards,
    });
    expect(result.deck).toHaveLength(4);
    expect(result.playerHand).toHaveLength(0);
  });

  it("returns unchanged when hand is empty", () => {
    const deck = [makeCard({ id: "a" })];
    const result = returnUnplayedHandToDeck({
      deck,
      playerHand: [],
      shuffleCards,
    });
    expect(result.deck).toHaveLength(1);
    expect(result.playerHand).toHaveLength(0);
  });
});
