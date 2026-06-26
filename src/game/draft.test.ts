import { describe, expect, it, vi } from "vitest";
import { makeCard } from "./test-utils.js";
import {
  createDailyDraftPlayers,
  getActiveDraftPlayerIndex,
  getCurrentDraftPlayer,
  getDraftPlayerNames,
  pickRandomCard,
  rotateDraftPoolsClockwise,
} from "./draft.js";
import type { DraftPlayerState } from "./draft.js";
import type { TravelCardData } from "../types.js";

// ── Helpers ──

function makeDraftPlayer(
  name: string,
  cards: TravelCardData[],
): DraftPlayerState {
  return { name, pool: cards, picked: [] };
}

// ── getDraftPlayerNames ──

describe("getDraftPlayerNames", () => {
  it("returns the 4 expected bot names", () => {
    const names = getDraftPlayerNames();
    expect(names).toEqual(["Cường", "An", "Minh", "Khánh"]);
  });
});

// ── getActiveDraftPlayerIndex ──

describe("getActiveDraftPlayerIndex", () => {
  it("returns index 1 (An)", () => {
    expect(getActiveDraftPlayerIndex()).toBe(1);
  });
});

// ── getCurrentDraftPlayer ──

describe("getCurrentDraftPlayer", () => {
  const players = [
    makeDraftPlayer("Cường", []),
    makeDraftPlayer("An", []),
    makeDraftPlayer("Minh", []),
  ];

  it("returns player at default active index (1 = An)", () => {
    const result = getCurrentDraftPlayer(players);
    expect(result?.name).toBe("An");
  });

  it("returns undefined for empty array", () => {
    expect(getCurrentDraftPlayer([])).toBeUndefined();
  });

  it("returns player at custom index when provided", () => {
    const result = getCurrentDraftPlayer(players, 2);
    expect(result?.name).toBe("Minh");
  });
});

// ── pickRandomCard ──

describe("pickRandomCard", () => {
  it("returns null for empty array", () => {
    expect(pickRandomCard([])).toBeNull();
  });

  it("returns the single card from 1-card array", () => {
    const card = makeCard({ id: "only-card" });
    expect(pickRandomCard([card])?.id).toBe("only-card");
  });

  it("returns one of the cards from multi-card array", () => {
    const cards = [
      makeCard({ id: "card-a" }),
      makeCard({ id: "card-b" }),
      makeCard({ id: "card-c" }),
    ];
    const result = pickRandomCard(cards);
    expect(cards.map((c) => c.id)).toContain(result?.id);
  });
});

// ── rotateDraftPoolsClockwise ──

describe("rotateDraftPoolsClockwise", () => {
  it("rotates pools for 2 players", () => {
    const cardA = makeCard({ id: "a" });
    const cardB = makeCard({ id: "b" });
    const players = [
      makeDraftPlayer("Cường", [cardA]),
      makeDraftPlayer("An", [cardB]),
    ];

    const result = rotateDraftPoolsClockwise(players);

    // Player 0 gets player 1's old pool, player 1 gets player 0's old pool
    expect(result[0].pool).toEqual([cardB]);
    expect(result[1].pool).toEqual([cardA]);
  });

  it("rotates pools for 4 players", () => {
    const cards = ["a", "b", "c", "d"].map((id) => makeCard({ id }));
    const players = cards.map((card, i) =>
      makeDraftPlayer(`Player ${i}`, [card])
    );

    const result = rotateDraftPoolsClockwise(players);

    // Each player gets previous player's pool
    expect(result[0].pool).toEqual([cards[3]]);
    expect(result[1].pool).toEqual([cards[0]]);
    expect(result[2].pool).toEqual([cards[1]]);
    expect(result[3].pool).toEqual([cards[2]]);
  });

  it("does not mutate the input players", () => {
    const cardA = makeCard({ id: "a" });
    const cardB = makeCard({ id: "b" });
    const players = [
      makeDraftPlayer("Cường", [cardA]),
      makeDraftPlayer("An", [cardB]),
    ];

    rotateDraftPoolsClockwise(players);

    expect(players[0].pool).toEqual([cardA]);
    expect(players[1].pool).toEqual([cardB]);
  });
});

// ── createDailyDraftPlayers ──

describe("createDailyDraftPlayers", () => {
  const mockShuffle = (cards: TravelCardData[]) => {
    // Deterministic "shuffle" for testing: reverse the array
    return [...cards].reverse();
  };

  it("creates correct number of draft players", () => {
    const cards = Array.from(
      { length: 30 },
      (_, i) => makeCard({ id: `card-${i}`, tag: "FOOD" }),
    );
    const result = createDailyDraftPlayers({
      deck: cards,
      initialDeck: [],
      handSize: 5,
      playerCount: 4,
      shuffleCards: mockShuffle,
    });

    expect(result.draftPlayers).toHaveLength(4);
  });

  it("gives each player handSize cards in their pool", () => {
    const cards = Array.from(
      { length: 30 },
      (_, i) => makeCard({ id: `card-${i}`, tag: "FOOD" }),
    );
    const result = createDailyDraftPlayers({
      deck: cards,
      initialDeck: [],
      handSize: 5,
      playerCount: 4,
      shuffleCards: mockShuffle,
    });

    result.draftPlayers.forEach((player) => {
      expect(player.pool).toHaveLength(5);
      expect(player.picked).toEqual([]);
    });
  });

  it("returns remaining deck after distributing cards", () => {
    const cards = Array.from(
      { length: 30 },
      (_, i) => makeCard({ id: `card-${i}`, tag: "FOOD" }),
    );
    const result = createDailyDraftPlayers({
      deck: cards,
      initialDeck: [],
      handSize: 5,
      playerCount: 4,
      shuffleCards: mockShuffle,
    });

    // 30 cards total - 20 distributed (4 players * 5) = 10 remaining
    expect(result.deck.length).toBeGreaterThan(0);
    expect(
      result.deck.length + result.draftPlayers.reduce(
        (sum, p) => sum + p.pool.length,
        0,
      ),
    ).toBe(30);
  });

  it("calls shuffleCards to create balanced deck", () => {
    const shuffleSpy = vi.fn((cards: TravelCardData[]) => [...cards].reverse());
    const cards = Array.from(
      { length: 30 },
      (_, i) => makeCard({ id: `card-${i}`, tag: "FOOD" }),
    );

    createDailyDraftPlayers({
      deck: cards,
      initialDeck: [],
      handSize: 5,
      playerCount: 4,
      shuffleCards: shuffleSpy,
    });

    // createBalancedRandomDeck shuffles per-tag bucket, then shuffleGeneric preferredOrder
    expect(shuffleSpy).toHaveBeenCalled();
  });

  it("handles insufficient deck by giving smaller pools", () => {
    const cards = Array.from(
      { length: 6 },
      (_, i) => makeCard({ id: `card-${i}`, tag: "FOOD" }),
    );
    const result = createDailyDraftPlayers({
      deck: cards,
      initialDeck: [],
      handSize: 5,
      playerCount: 4,
      shuffleCards: mockShuffle,
    });

    // Only 6 cards available, spread across 4 players
    const totalDistributed = result.draftPlayers.reduce(
      (sum, p) => sum + p.pool.length,
      0,
    );
    expect(totalDistributed).toBe(6);
  });
});
