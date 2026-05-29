import type { TravelCard } from './types.ts';

export type TravelEvent = {
  id: string;
  label: string;
  vpDelta: number;
  xuDelta: number;
  staminaDelta: number;
};

const EVENTS: TravelEvent[] = [
  { id: 'rain-delay', label: 'Rain delay adds a rest buffer.', vpDelta: -1, xuDelta: 0, staminaDelta: -1 },
  { id: 'street-festival', label: 'Street festival boosts culture routes.', vpDelta: 3, xuDelta: -10, staminaDelta: 0 },
  { id: 'cheap-transit', label: 'Transit discount saves Xu.', vpDelta: 0, xuDelta: 20, staminaDelta: 0 },
  { id: 'local-tip', label: 'Local tip reveals an efficient shortcut.', vpDelta: 2, xuDelta: 0, staminaDelta: 1 },
];

export function drawDailyHand(cards: TravelCard[], day: number, playerIndex: number, size = 5): string[] {
  return [...cards]
    .sort((a, b) => seededRank(a.card_id, day, playerIndex) - seededRank(b.card_id, day, playerIndex))
    .slice(0, size)
    .map((card) => card.card_id);
}

export function simulateRandomEvent(day: number, playerIndex: number): TravelEvent {
  const index = (day * 7 + playerIndex * 3) % EVENTS.length;
  return EVENTS[index];
}

function seededRank(value: string, day: number, playerIndex: number) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), day * 31 + playerIndex * 17) % 997;
}
