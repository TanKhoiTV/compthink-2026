import type { BoardCell, GridPosition, TravelCard, ValidationResult } from './types.ts';

export const DAYS = [1, 2, 3, 4, 5] as const;
export const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;
export const DISTANCE_LIMIT_KM = 20;

export function createBoard(): BoardCell[] {
  return DAYS.flatMap((day) => TIME_SLOTS.map((slot) => ({ day, slot })));
}

export function cellId(position: GridPosition) {
  return `day-${position.day}-${position.slot}`;
}

export function validateGridPlacement(board: BoardCell[], position: GridPosition, activeDay: number): ValidationResult {
  if (!DAYS.includes(position.day as (typeof DAYS)[number])) return { ok: false, reason: 'Invalid travel day.' };
  if (!TIME_SLOTS.includes(position.slot as (typeof TIME_SLOTS)[number])) return { ok: false, reason: 'Invalid time slot.' };
  if (position.day !== activeDay) return { ok: false, reason: `Cards can only be placed on day ${activeDay}.` };

  const target = board.find((cell) => cell.day === position.day && cell.slot === position.slot);
  if (!target) return { ok: false, reason: 'Grid cell does not exist.' };
  if (target.card_id) return { ok: false, reason: 'This time slot already has a destination card.' };
  if (target.skipped) return { ok: false, reason: 'This time slot has been skipped as a rest buffer.' };
  if (target.locked) return { ok: false, reason: 'This time slot is locked because of exhaustion.' };

  return { ok: true };
}

export function placeCardOnBoard(board: BoardCell[], cardId: string, position: GridPosition): BoardCell[] {
  return board.map((cell) => (cell.day === position.day && cell.slot === position.slot ? { ...cell, card_id: cardId } : cell));
}

export function skipBoardSlot(board: BoardCell[], position: GridPosition): BoardCell[] {
  return board.map((cell) => (cell.day === position.day && cell.slot === position.slot ? { ...cell, skipped: true } : cell));
}

export function lockBoardSlot(board: BoardCell[], position: GridPosition): BoardCell[] {
  return board.map((cell) => (cell.day === position.day && cell.slot === position.slot ? { ...cell, locked: true } : cell));
}

export function validateDistance(board: BoardCell[], cards: TravelCard[]) {
  const byId = new Map(cards.map((card) => [card.card_id, card]));
  let previous: TravelCard | undefined;
  let previousDay: number | undefined;
  let totalKm = 0;
  let penalty = 0;
  const warnings: string[] = [];

  for (const cell of [...board].sort((a, b) => a.day - b.day || TIME_SLOTS.indexOf(a.slot) - TIME_SLOTS.indexOf(b.slot))) {
    const current = cell.card_id ? byId.get(cell.card_id) : undefined;
    if (!current || current.is_virtual) {
      previous = undefined;
      previousDay = undefined;
      continue;
    }

    if (previous && previousDay === cell.day) {
      const distance = haversineKm(previous.coordinates.lat, previous.coordinates.lng, current.coordinates.lat, current.coordinates.lng);
      totalKm += distance;
      if (distance > DISTANCE_LIMIT_KM) {
        penalty += 2;
        warnings.push(`${previous.name} -> ${current.name}: ${distance.toFixed(1)}km exceeds ${DISTANCE_LIMIT_KM}km.`);
      }
    }

    previous = current;
    previousDay = cell.day;
  }

  return { totalKm: Number(totalKm.toFixed(1)), penalty, warnings };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
