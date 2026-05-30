import type { PlayerResources, PlayerState, TravelCard, ValidationResult } from './types.ts';

export const STARTING_RESOURCES: PlayerResources = {
  xu: 10,
  stamina: 6,
  debtToken: 0,
  vp: 0,
};

export const MAX_STAMINA = 8;

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
  const xuShortage = Math.max(0, card.cost - resources.xu);
  const staminaShortage = Math.max(0, card.stamina - resources.stamina);

  return {
    resources: {
      ...resources,
      xu: Math.max(0, resources.xu - card.cost),
      stamina: Math.max(0, resources.stamina - card.stamina),
      debtToken: resources.debtToken + xuShortage,
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
  const next: PlayerResources = {
    ...resources,
    vp: resources.vp + card.victory_point,
  };

  if (card.tags.includes('REST') || card.tags.includes('UTILITY')) {
    next.stamina = Math.min(MAX_STAMINA, next.stamina + 1);
  }

  if (card.tags.includes('TRANSIT')) {
    next.vp += 1;
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
