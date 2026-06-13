import type { PlayerResources, PlayerState, TravelCard, ValidationResult } from './types.ts';

export const STARTING_RESOURCES: PlayerResources = {
  xu: 10,
  stamina: 6,
  debtToken: 0,
  vp: 0,
};

export const MAX_STAMINA = 8;

/** VP lost per unpaid debt token when the game ends with outstanding debt. */
export const FINAL_DEBT_PENALTY_MULTIPLIER = 10;

export function applyFinalDebtPenalty(resources: PlayerResources): {
  resources: PlayerResources;
  penalty: number;
} {
  const penalty = resources.debtToken * FINAL_DEBT_PENALTY_MULTIPLIER;
  return {
    resources: {
      ...resources,
      vp: Math.max(0, resources.vp - penalty),
    },
    penalty,
  };
}

export function validateCardUsage(player: PlayerState, card: TravelCard): ValidationResult {
  if (!player.storage.includes(card.card_id) && !player.chosen.includes(card.card_id)) {
    return { ok: false, reason: 'Card is not available to this player.' };
  }

  return { ok: true };
}

export function payDraftCost(resources: PlayerResources, card: TravelCard): {
  resources: PlayerResources;
  debtAdded: number;
  exhausted: boolean;
} {
  // A DISCOUNT_XU_NEXT effect from a previously placed card reduces this
  // card's xu cost, then is consumed.
  const cost = Math.max(0, card.cost - (resources.discountXuNext ?? 0));

  const xuShortage = Math.max(0, cost - resources.xu);
  const staminaShortage = Math.max(0, card.stamina - resources.stamina);

  return {
    resources: {
      ...resources,
      xu: Math.max(0, resources.xu - cost),
      stamina: Math.max(0, resources.stamina - card.stamina),
      debtToken: resources.debtToken + xuShortage,
      discountXuNext: 0,
    },
    debtAdded: xuShortage,
    exhausted: staminaShortage > 0,
  };
}

export function gainRestResources(resources: PlayerResources): PlayerResources {
  return {
    ...resources,
    xu: resources.xu + 1,
    stamina: Math.min(MAX_STAMINA, resources.stamina + 1),
  };
}

export function applyOnPlayEffects(resources: PlayerResources, card: TravelCard): PlayerResources {
  // A DOUBLE_VP_NEXT effect from the previously placed card doubles this
  // card's base VP, then is consumed.
  const baseVp = resources.doubleVpNext ? card.victory_point * 2 : card.victory_point;

  const next: PlayerResources = {
    ...resources,
    vp: resources.vp + baseVp,
    doubleVpNext: false,
    ignoreDistancePenaltyNext: false,
  };

  if (card.tags.includes('REST') || card.tags.includes('UTILITY')) {
    next.stamina = Math.min(MAX_STAMINA, next.stamina + 1);
  }

  if (card.tags.includes('TRANSIT')) {
    next.vp += 1;
  }

  const effect = card.onPlayEffect;
  if (effect?.has_effect) {
    switch (effect.effect_type) {
      case 'RECOVER_XU':
        next.xu += effect.effect_value;
        break;
      case 'RECOVER_LA':
        next.stamina = Math.min(MAX_STAMINA, next.stamina + effect.effect_value);
        break;
      case 'DEDUCT_LA':
        next.stamina = Math.max(0, next.stamina - effect.effect_value);
        break;
      case 'GAIN_VP':
        next.vp += effect.effect_value;
        break;
      case 'DOUBLE_VP_NEXT':
        next.doubleVpNext = true;
        break;
      case 'IGNORE_DISTANCE_NEXT':
        next.ignoreDistancePenaltyNext = true;
        break;
      case 'DISCOUNT_XU_NEXT':
        next.discountXuNext = effect.effect_value;
        break;
    }
  }

  return next;
}

export function passHandsClockwise(players: PlayerState[]): PlayerState[] {
  if (players.length <= 1) return players;
  const remainingHands = players.map((player) => [...player.hand]);
  return players.map((player, index) => ({
    ...player,
    hand: remainingHands[(index - 1 + players.length) % players.length],
  }));
}
