import { validateDistanceCells as validateDistance } from './board.ts';
import type { BoardCell, ItineraryEntry, PlayerResources, TravelCard } from './types.ts';

export type ScoreBreakdown = {
  baseVp: number;
  comboVp: number;
  penaltyVp: number;
  resourceVp: number;
  totalVp: number;
  routeKm: number;
  warnings: string[];
};

export function calculateScore(board: BoardCell[], cards: TravelCard[], resources: PlayerResources): ScoreBreakdown {
  const byId = new Map(cards.map((card) => [card.card_id, card]));
  const placed = board.map((cell) => (cell.card_id ? byId.get(cell.card_id) : undefined)).filter(Boolean) as TravelCard[];
  const baseVp = placed.reduce((sum, card) => sum + card.victory_point, 0);
  const comboVp = calculateComboVp(placed);
  const distance = validateDistance(board, cards);
  const events = calculateEventPenalty(board, cards);
  const debtPenalty = resources.debtToken * 3;
  const resourceVp = Math.floor(resources.xu / 2) + Math.floor(resources.stamina / 2);
  const penaltyVp = distance.penalty + debtPenalty + events.penalty;

  return {
    baseVp,
    comboVp,
    penaltyVp,
    resourceVp,
    totalVp: baseVp + comboVp + resourceVp - penaltyVp,
    routeKm: distance.totalKm,
    warnings: [...distance.warnings, ...events.warnings],
  };
}

export function boardToTimeline(board: BoardCell[], cards: TravelCard[]): ItineraryEntry[] {
  const byId = new Map(cards.map((card) => [card.card_id, card]));
  return board
    .filter((cell) => cell.card_id)
    .map((cell) => {
      const card = byId.get(cell.card_id ?? '');
      if (!card) return undefined;
      return {
        day: cell.day,
        slot: cell.slot,
        title: card.name,
        coordinates: card.coordinates,
        estimatedCost: card.cost * 50000,
        note: card.on_play_effect,
      };
    })
    .filter((entry): entry is ItineraryEntry => Boolean(entry));
}

function calculateComboVp(cards: TravelCard[]) {
  let combo = 0;
  for (let index = 1; index < cards.length; index += 1) {
    const previous = cards[index - 1];
    const current = cards[index];
    const sharedTags = current.tags.filter((tag) => previous.tags.includes(tag));
    combo += sharedTags.length * 2;
  }
  return combo;
}

function calculateEventPenalty(board: BoardCell[], cards: TravelCard[]) {
  const byId = new Map(cards.map((card) => [card.card_id, card]));
  let penalty = 0;
  const warnings: string[] = [];

  for (const cell of board) {
    const card = cell.card_id ? byId.get(cell.card_id) : undefined;
    if (!card || card.tags.includes('INDOOR')) continue;

    const roll = eventRoll(`${card.card_id}-${cell.day}-${cell.slot}`);
    if (roll >= 15) continue;

    const risky = card.tags.includes('OUTDOOR') || card.tags.includes('ACTION');
    const delta = risky ? 3 : 1;
    penalty += delta;
    warnings.push(`${card.name}: Weather event -${delta} VP.`);
  }

  return { penalty, warnings };
}

function eventRoll(seed: string) {
  return [...seed].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 100, 7);
}
