import { state } from "../state/gameState.js";
import { getUtilityPlacementEffect } from "../ui/boardArena.js";
import { rerenderArena } from "../ui/arenaRenderer.js";
import { playGameSound } from "../audio/gameAudio.js";
import type { TravelCardData } from "../types.js";

export function triggerUtilityEffectFlash(params: {
  rowIndex: number;
  colIndex: number;
  type: "coin" | "stamina" | "vp";
  value: number;
}) {
  const flashId = Date.now();

  state.lastUtilityEffectFlash = {
    ...params,
    id: flashId,
  };
  state.resourceOrbFlashType = params.type;

  window.setTimeout(() => {
    if (state.lastUtilityEffectFlash?.id === flashId) {
      state.lastUtilityEffectFlash = null;
    }

    if (state.resourceOrbFlashType === params.type) {
      state.resourceOrbFlashType = null;
    }

    rerenderArena();
  }, 1050);
}

export function applyUtilityPlacementEffect(
  card: TravelCardData,
  rowIndex: number,
  colIndex: number,
) {
  const effect = getUtilityPlacementEffect(card);

  if (!effect) return false;

  if (effect.type === "coin") {
    state.eventResourceModifier = {
      ...state.eventResourceModifier,
      coin: state.eventResourceModifier.coin + effect.value,
    };
    playGameSound("eventPromo");
  } else if (effect.type === "stamina") {
    state.eventResourceModifier = {
      ...state.eventResourceModifier,
      stamina: state.eventResourceModifier.stamina + effect.value,
    };
    playGameSound("eventPromo");
  } else if (effect.type === "vp") {
    state.accumulatedVP += effect.value;
    playGameSound("eventPromo");
  }

  triggerUtilityEffectFlash({
    rowIndex,
    colIndex,
    type: effect.type,
    value: effect.value,
  });

  return true;
}
