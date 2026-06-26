import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentPlayerId, playerIds, state } from "../state/gameState.js";
import { onlineClientState, sendPlaceCard } from "../online/socketClient.js";
import { makeCard } from "../game/test-utils.js";
import type { BoardTokenCard } from "../types.js";
import type { BoardSlots } from "../game/board.js";

// ── Polyfill for browser APIs not available in vitest/node ──

// Use a Proxy so window.setTimeout always resolves to the current
// globalThis.setTimeout — essential for vi.useFakeTimers() to work.
(globalThis as any).window ??= new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "setTimeout") {
        return globalThis.setTimeout.bind(globalThis);
      }
      return undefined;
    },
    has(_target, prop) {
      return prop === "setTimeout";
    },
  },
);
(globalThis as any).alert ??= vi.fn();

// ── Mock IO boundaries ──

vi.mock("../ui/arenaRenderer.js", () => ({ rerenderArena: vi.fn() }));
vi.mock("../audio/gameAudio.js", () => ({ playGameSound: vi.fn() }));
vi.mock("../game/botPlacement.js", () => ({
  placeBotCardsAfterPlayerMove: vi.fn(),
}));
vi.mock("../online/socketClient.js", async (importOriginal) => {
  const mod = await importOriginal<
    typeof import("../online/socketClient.js")
  >();
  return { ...mod, sendPlaceCard: vi.fn(), sendPayDebt: vi.fn() };
});
vi.mock("../ui/boardArena.js", () => ({ getUtilityPlacementEffect: vi.fn() }));

// ── Imports under test ──

import {
  canDiscardHandCard,
  canPlaceOnBoardCell,
  placeHandCardOnBoard,
} from "./cardPlacement.js";
import {
  addLocalDebtOrExhaustToken,
  clearLocalGeneratedTokenForReturnedCard,
} from "./debtTokens.js";
import {
  applyUtilityPlacementEffect,
  triggerUtilityEffectFlash,
} from "./utilityEffects.js";

// ── Helpers ──

import { getUtilityPlacementEffect } from "../ui/boardArena.js";
import { rerenderArena } from "../ui/arenaRenderer.js";
import { playGameSound } from "../audio/gameAudio.js";

function makeEmptyBoards(): Record<string, BoardSlots> {
  const boards: Record<string, BoardSlots> = {};
  for (const id of playerIds) {
    boards[id] = Array.from({ length: 5 }, () => Array<null>(5).fill(null));
  }
  return boards;
}

// ═══════════════════════════════════════════
// cardPlacement
// ═══════════════════════════════════════════

describe("canPlaceOnBoardCell", () => {
  beforeEach(() => {
    state.playerBoards = makeEmptyBoards() as Record<
      string,
      BoardSlots
    >;
  });

  it("returns true for empty cell", () => {
    expect(canPlaceOnBoardCell(0, 0)).toBe(true);
  });

  it("returns false for occupied cell", () => {
    const card = makeCard({ id: "placed-card" });
    state.playerBoards[currentPlayerId][0][0] = card;
    expect(canPlaceOnBoardCell(0, 0)).toBe(false);
  });
});

describe("canDiscardHandCard", () => {
  it("returns false during draft phase", () => {
    state.isDraftPhase = true;
    state.isSimulationMode = false;
    state.isInitialDealInProgress = false;
    expect(canDiscardHandCard()).toBe(false);
  });

  it("returns false during simulation mode", () => {
    state.isDraftPhase = false;
    state.isSimulationMode = true;
    state.isInitialDealInProgress = false;
    expect(canDiscardHandCard()).toBe(false);
  });

  it("returns false during initial deal", () => {
    state.isDraftPhase = false;
    state.isSimulationMode = false;
    state.isInitialDealInProgress = true;
    expect(canDiscardHandCard()).toBe(false);
  });

  it("returns true when conditions are normal", () => {
    state.isDraftPhase = false;
    state.isSimulationMode = false;
    state.isInitialDealInProgress = false;
    expect(canDiscardHandCard()).toBe(true);
  });
});

describe("placeHandCardOnBoard — offline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.playerHand = [
      makeCard({ id: "test-card", coin: 1, stamina: 1, vp: 1 }),
    ];
    state.playerBoards = makeEmptyBoards() as Record<string, BoardSlots>;
    state.isSimulationMode = false;
    state.isInitialDealInProgress = false;
    state.currentDayIndex = 0;
    state.localCoinDebt = 0;
    state.selectedHandCardId = null;
    state.draggedHandCardId = null;
    state.focusedHandCardId = null;
    state.focusedBoardCard = null;
    state.focusedBoardPosition = null;
    state.suppressNextClick = false;
    state.lastPlacedBoardPosition = null;
    state.eventResourceModifier = { coin: 0, stamina: 0 };
    state.discardedResourceBonus = { coin: 0, stamina: 0 };
    state.accumulatedVP = 0;
    state.simulationResult = null;
    onlineClientState.roomId = null;
  });

  it("returns early when isSimulationMode", () => {
    state.isSimulationMode = true;
    placeHandCardOnBoard("test-card", 0, 0);

    expect(state.playerHand).toHaveLength(1);
    expect(state.playerBoards[currentPlayerId][0][0]).toBeNull();
    expect(sendPlaceCard).not.toHaveBeenCalled();
  });

  it("returns early when isInitialDealInProgress", () => {
    state.isInitialDealInProgress = true;
    placeHandCardOnBoard("test-card", 0, 0);

    expect(state.playerHand).toHaveLength(1);
    expect(state.playerBoards[currentPlayerId][0][0]).toBeNull();
  });

  it("returns early when colIndex does not match currentDayIndex", () => {
    state.currentDayIndex = 2;
    placeHandCardOnBoard("test-card", 0, 1);

    expect(state.playerHand).toHaveLength(1);
    expect(state.playerBoards[currentPlayerId][0][0]).toBeNull();
  });

  it("returns early when cell is occupied", () => {
    state.playerBoards[currentPlayerId][0][0] = makeCard({ id: "blocker" });
    placeHandCardOnBoard("test-card", 0, 0);

    expect(state.playerHand).toHaveLength(1);
  });

  it("returns early when card is not in hand", () => {
    placeHandCardOnBoard("nonexistent-card", 0, 0);

    expect(state.playerHand).toHaveLength(1);
  });

  it("places card on board and removes from hand", () => {
    state.eventResourceModifier = { coin: 999, stamina: 999 };
    placeHandCardOnBoard("test-card", 0, 0);

    expect(state.playerHand).toHaveLength(0);
    expect(state.playerBoards[currentPlayerId][0][0]).not.toBeNull();
    expect(state.playerBoards[currentPlayerId][0][0]?.id).toBe("test-card");
  });

  it("clears selection state after placing", () => {
    state.selectedHandCardId = "test-card";
    state.draggedHandCardId = "test-card";
    state.focusedHandCardId = "test-card";
    state.eventResourceModifier = { coin: 999, stamina: 999 };

    placeHandCardOnBoard("test-card", 0, 0);

    expect(state.selectedHandCardId).toBeNull();
    expect(state.draggedHandCardId).toBeNull();
    expect(state.focusedHandCardId).toBeNull();
  });

  it("calls sendPlaceCard even in offline mode", () => {
    state.eventResourceModifier = { coin: 999, stamina: 999 };
    placeHandCardOnBoard("test-card", 0, 0);

    expect(sendPlaceCard).toHaveBeenCalledWith(
      expect.objectContaining({
        cardId: "test-card",
        rowIndex: 0,
        colIndex: 0,
      }),
    );
  });
});

// ═══════════════════════════════════════════
// debtTokens
// ═══════════════════════════════════════════

describe("addLocalDebtOrExhaustToken", () => {
  beforeEach(() => {
    state.localCoinDebt = 0;
    state.playerBoards = makeEmptyBoards() as Record<string, BoardSlots>;
    onlineClientState.roomId = null;
  });

  it("adds coin debt when coinDebt > 0", () => {
    addLocalDebtOrExhaustToken({
      rowIndex: 0,
      colIndex: 0,
      card: makeCard({ id: "test", coin: 5, stamina: 0 }),
      coinDebt: 5,
      staminaDebt: 0,
    });

    expect(state.localCoinDebt).toBe(5);
  });

  it("does not modify coin debt when coinDebt is 0", () => {
    addLocalDebtOrExhaustToken({
      rowIndex: 0,
      colIndex: 0,
      card: makeCard({ id: "test", coin: 0, stamina: 0 }),
      coinDebt: 0,
      staminaDebt: 0,
    });

    expect(state.localCoinDebt).toBe(0);
  });

  it("creates exhaust lock token at next position when staminaDebt > 0", () => {
    const card = makeCard({
      id: "test",
      name: "Test Card",
      coin: 0,
      stamina: 5,
    });
    addLocalDebtOrExhaustToken({
      rowIndex: 0,
      colIndex: 0,
      card,
      coinDebt: 0,
      staminaDebt: 5,
    });

    // Lock token placed at next row (row 1, col 0)
    const lockToken = state.playerBoards[currentPlayerId][1][0];
    expect(lockToken).not.toBeNull();
    expect(lockToken).toHaveProperty("boardTokenType", "lock");
  });

  it("does not overwrite existing token at next position", () => {
    state.playerBoards[currentPlayerId][1][0] = makeCard({
      id: "existing",
    });

    const card = makeCard({
      id: "test",
      name: "Test Card",
      coin: 0,
      stamina: 5,
    });
    addLocalDebtOrExhaustToken({
      rowIndex: 0,
      colIndex: 0,
      card,
      coinDebt: 0,
      staminaDebt: 5,
    });

    // Existing card should remain
    expect(state.playerBoards[currentPlayerId][1][0]?.id).toBe("existing");
  });

  it("skips token placement when there is no next position", () => {
    // Last row and last day — getNextTimeSlotPosition returns null
    addLocalDebtOrExhaustToken({
      rowIndex: 4,
      colIndex: 4,
      card: makeCard({ id: "test", name: "Test", coin: 0, stamina: 5 }),
      coinDebt: 0,
      staminaDebt: 5,
    });

    // No token created (no position to place at)
    expect(state.localCoinDebt).toBe(0);
  });
});

describe("clearLocalGeneratedTokenForReturnedCard", () => {
  beforeEach(() => {
    state.playerBoards = makeEmptyBoards() as Record<string, BoardSlots>;
    onlineClientState.roomId = null;
  });

  it("clears lock token at next position when sourceCardName matches", () => {
    // Place a card at (0, 0)
    state.playerBoards[currentPlayerId][0][0] = makeCard({
      id: "parent",
      name: "Parent Card",
    });

    // Place a lock token at (1, 0) — the next position
    const lockToken: BoardTokenCard = {
      ...makeCard({ id: "lock-token" }),
      boardTokenType: "lock",
      sourceCardName: "Parent Card",
      lockedReason: "Kiệt sức",
    };
    state.playerBoards[currentPlayerId][1][0] = lockToken;

    clearLocalGeneratedTokenForReturnedCard(
      0,
      0,
      makeCard({ id: "parent", name: "Parent Card" }),
    );

    expect(state.playerBoards[currentPlayerId][1][0]).toBeNull();
  });

  it("does nothing when no token at next position", () => {
    state.playerBoards[currentPlayerId][0][0] = makeCard({
      id: "parent",
      name: "Parent Card",
    });

    clearLocalGeneratedTokenForReturnedCard(
      0,
      0,
      makeCard({ id: "parent", name: "Parent Card" }),
    );

    // Next position (1, 0) should still be null
    expect(state.playerBoards[currentPlayerId][1][0]).toBeNull();
  });

  it("does nothing when sourceCardName does not match", () => {
    state.playerBoards[currentPlayerId][0][0] = makeCard({
      id: "parent",
      name: "Parent Card",
    });

    const lockToken: BoardTokenCard = {
      ...makeCard({ id: "lock-token" }),
      boardTokenType: "lock",
      sourceCardName: "Other Card",
      lockedReason: "Kiệt sức",
    };
    state.playerBoards[currentPlayerId][1][0] = lockToken;

    clearLocalGeneratedTokenForReturnedCard(
      0,
      0,
      makeCard({ id: "parent", name: "Parent Card" }),
    );

    // Token should remain because sourceCardName doesn't match
    expect(state.playerBoards[currentPlayerId][1][0]).not.toBeNull();
  });

  it("does nothing when card is at last position (no next position)", () => {
    clearLocalGeneratedTokenForReturnedCard(
      4,
      4,
      makeCard({ id: "parent", name: "Parent Card" }),
    );

    // Should not error — getNextTimeSlotPosition returns null
    expect(state.playerBoards[currentPlayerId][4][4]).toBeNull();
  });
});

// ═══════════════════════════════════════════
// utilityEffects
// ═══════════════════════════════════════════

describe("applyUtilityPlacementEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.eventResourceModifier = { coin: 0, stamina: 0 };
    state.accumulatedVP = 0;
    state.lastUtilityEffectFlash = null;
    state.resourceOrbFlashType = null;
    onlineClientState.roomId = null;
  });

  it("returns false when getUtilityPlacementEffect returns null", () => {
    (getUtilityPlacementEffect as ReturnType<typeof vi.fn>).mockReturnValue(
      null,
    );

    const card = makeCard({ id: "plain-card" });
    const result = applyUtilityPlacementEffect(card, 0, 0);

    expect(result).toBe(false);
  });

  it("applies coin modifier for coin-type effect", () => {
    (getUtilityPlacementEffect as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "coin",
      value: 5,
      label: "+5 Xu",
      icon: "🪙",
    });

    const card = makeCard({ id: "coin-card" });
    const result = applyUtilityPlacementEffect(card, 0, 0);

    expect(result).toBe(true);
    expect(state.eventResourceModifier.coin).toBe(5);
  });

  it("applies stamina modifier for stamina-type effect", () => {
    (getUtilityPlacementEffect as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "stamina",
      value: 3,
      label: "+3 Thể lực",
      icon: "⚡",
    });

    const card = makeCard({ id: "stamina-card" });
    const result = applyUtilityPlacementEffect(card, 0, 0);

    expect(result).toBe(true);
    expect(state.eventResourceModifier.stamina).toBe(3);
  });

  it("accumulates VP for vp-type effect", () => {
    (getUtilityPlacementEffect as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "vp",
      value: 10,
      label: "+10 VP",
      icon: "★",
    });

    const card = makeCard({ id: "vp-card" });
    const result = applyUtilityPlacementEffect(card, 0, 0);

    expect(result).toBe(true);
    expect(state.accumulatedVP).toBe(10);
  });

  it("plays event-promo sound effect on success", () => {
    (getUtilityPlacementEffect as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "coin",
      value: 2,
      label: "+2 Xu",
      icon: "🪙",
    });

    const card = makeCard({ id: "sound-card" });
    applyUtilityPlacementEffect(card, 0, 0);

    expect(playGameSound).toHaveBeenCalledWith("eventPromo");
  });

  it("sets lastUtilityEffectFlash and resourceOrbFlashType", () => {
    (getUtilityPlacementEffect as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "coin",
      value: 5,
      label: "+5 Xu",
      icon: "🪙",
    });

    const card = makeCard({ id: "flash-card" });
    applyUtilityPlacementEffect(card, 0, 0);

    expect(state.lastUtilityEffectFlash).not.toBeNull();
    expect(state.lastUtilityEffectFlash?.type).toBe("coin");
    expect(state.lastUtilityEffectFlash?.value).toBe(5);
    expect(state.resourceOrbFlashType).toBe("coin");
  });
});

describe("triggerUtilityEffectFlash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.lastUtilityEffectFlash = null;
    state.resourceOrbFlashType = null;
  });

  it("sets lastUtilityEffectFlash with an id", () => {
    triggerUtilityEffectFlash({
      rowIndex: 0,
      colIndex: 0,
      type: "vp",
      value: 10,
    });

    expect(state.lastUtilityEffectFlash).not.toBeNull();
    expect(state.lastUtilityEffectFlash?.type).toBe("vp");
    expect(state.lastUtilityEffectFlash?.value).toBe(10);
    expect(state.lastUtilityEffectFlash?.rowIndex).toBe(0);
    expect(state.lastUtilityEffectFlash?.colIndex).toBe(0);
    expect(state.lastUtilityEffectFlash?.id).toBeGreaterThan(0);
    expect(state.resourceOrbFlashType).toBe("vp");
  });

  it("clears lastUtilityEffectFlash after timeout", async () => {
    vi.useFakeTimers();
    triggerUtilityEffectFlash({
      rowIndex: 0,
      colIndex: 0,
      type: "coin",
      value: 3,
    });

    expect(state.lastUtilityEffectFlash).not.toBeNull();

    // Advance past the 1050ms timeout
    await vi.advanceTimersByTimeAsync(1100);

    expect(state.lastUtilityEffectFlash).toBeNull();
    expect(state.resourceOrbFlashType).toBeNull();
    vi.useRealTimers();
  });

  it("only clears its own flash when multiple are triggered", async () => {
    vi.useFakeTimers();
    triggerUtilityEffectFlash({
      rowIndex: 0,
      colIndex: 0,
      type: "coin",
      value: 3,
    });

    const firstId = state.lastUtilityEffectFlash!.id;

    // Advance faked clock so Date.now() produces a distinct ID
    await vi.advanceTimersByTimeAsync(1);

    // Trigger a second flash before the first timeout
    triggerUtilityEffectFlash({
      rowIndex: 1,
      colIndex: 0,
      type: "stamina",
      value: 5,
    });

    const secondId = state.lastUtilityEffectFlash!.id;
    expect(secondId).not.toBe(firstId);

    // Advance past first timeout (scheduled at T+1050) but not the second (T+1051)
    await vi.advanceTimersByTimeAsync(1049);

    // Second flash should still be active (its timer hasn't expired yet)
    expect(state.lastUtilityEffectFlash).not.toBeNull();
    expect(state.lastUtilityEffectFlash?.type).toBe("stamina");

    // Advance past second timeout
    await vi.advanceTimersByTimeAsync(1050);

    expect(state.lastUtilityEffectFlash).toBeNull();
    vi.useRealTimers();
  });

  it("calls rerenderArena after timeout", async () => {
    vi.useFakeTimers();
    triggerUtilityEffectFlash({
      rowIndex: 0,
      colIndex: 0,
      type: "vp",
      value: 5,
    });

    await vi.advanceTimersByTimeAsync(1100);

    expect(rerenderArena).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
