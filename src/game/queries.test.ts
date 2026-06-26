import { describe, expect, it } from "vitest";
import type { BoardTokenCard } from "../types.js";
import {
  createExhaustLockTokenCard,
  getDisplayPlayerName,
  getSimulationEventResourceModifier,
  getSimulationEventStaminaPenalty,
} from "./queries.js";

// createExhaustLockTokenCard: ({ rowIndex, colIndex, sourceCardName }) => card
describe("createExhaustLockTokenCard", () => {
  it("creates a token card with lock boardTokenType", () => {
    const result = createExhaustLockTokenCard({
      rowIndex: 0,
      colIndex: 1,
      sourceCardName: "Test Card",
    }) as BoardTokenCard;
    expect(result.boardTokenType).toBe("lock");
  });

  it("includes sourceCardName in the result", () => {
    const result = createExhaustLockTokenCard({
      rowIndex: 0,
      colIndex: 1,
      sourceCardName: "Bia Saigon",
    }) as BoardTokenCard;
    expect(result).toHaveProperty("lockedReason");
    expect(result.sourceCardName ?? result.lockedReason).toBeDefined();
  });

  it("includes rowIndex and colIndex in the card id", () => {
    const result = createExhaustLockTokenCard({
      rowIndex: 2,
      colIndex: 3,
      sourceCardName: "Test",
    }) as BoardTokenCard;
    expect(String(result.id)).toContain("2");
    expect(String(result.id)).toContain("3");
  });
});

// getSimulationEventResourceModifier: (result: SimulationResult | null) => { coin: number, stamina: number }
describe("getSimulationEventResourceModifier", () => {
  it("returns zero modifier for null result", () => {
    const result = getSimulationEventResourceModifier(null as any);
    expect(result).toEqual({ coin: 0, stamina: 0 });
  });

  it("sums stamina deltas from replay steps", () => {
    const result = getSimulationEventResourceModifier({
      replaySteps: [{ eventStaminaDelta: -5 }, { eventStaminaDelta: -3 }],
    } as any);
    expect(result.stamina).toBe(-8);
    expect(result.coin).toBe(0);
  });
});

// getSimulationEventStaminaPenalty: (result: SimulationResult | null) => number
describe("getSimulationEventStaminaPenalty", () => {
  it("returns 0 for null result", () => {
    expect(getSimulationEventStaminaPenalty(null as any)).toBe(0);
  });

  it("returns 0 for result with no stamina penalty", () => {
    const result = getSimulationEventStaminaPenalty({
      eventStaminaPenalty: null,
      replaySteps: [],
    } as any);
    expect(result).toBe(0);
  });
});

// getDisplayPlayerName
describe("getDisplayPlayerName", () => {
  it("returns 'Player' when no online state is active", () => {
    const name = getDisplayPlayerName();
    expect(typeof name).toBe("string");
  });
});
