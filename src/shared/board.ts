import type { BoardCell, TravelCard } from "./types.ts";
import { days, rows } from "./constants.ts";

export type BoardSlots = (TravelCard | null)[][];

export type BoardPosition = {
	rowIndex: number;
	colIndex: number;
};

export type BoardTotals = {
	vp: number;
	coin: number;
	stamina: number;
	usedSlots: number;
};

export function createEmptyBoardSlots(): BoardSlots {
	return rows.map(() => days.map(() => null));
}

export function calculateBoardTotals(boardSlots: BoardSlots): BoardTotals {
	let vp = 0;
	let coin = 0;
	let stamina = 0;
	let usedSlots = 0;

	for (const row of boardSlots) {
		for (const card of row) {
			if (card !== null) {
				vp += card.vp ?? 0;
				coin += card.coin ?? 0;
				stamina += card.stamina ?? 0;
				usedSlots += 1;
			}
		}
	}

	return { vp, coin, stamina, usedSlots };
}

export function getPlacedCards(boardSlots: BoardSlots): TravelCard[] {
	const placedCards: TravelCard[] = [];

	for (const row of boardSlots) {
		for (const card of row) {
			if (card !== null) {
				placedCards.push(card);
			}
		}
	}

	return placedCards;
}

export function getCurrentDayPlacedCards(
	boardSlots: BoardSlots,
	dayIndex: number,
): TravelCard[] {
	const cards: TravelCard[] = [];

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const card = boardSlots[rowIndex]?.[dayIndex] ?? null;

		if (card) {
			cards.push(card);
		}
	}

	return cards;
}

export function getBoardCardByPosition(
	boardSlots: BoardSlots,
	rowIndex: number,
	colIndex: number,
): TravelCard | null {
	return boardSlots[rowIndex]?.[colIndex] ?? null;
}

export function getCardTagKeys(card: TravelCard): string[] {
	if (card.tags && card.tags.length > 0) {
		return card.tags.map((tag) => tag.toUpperCase());
	}

	return [card.tag.toUpperCase()];
}

export function countCardsWithTag(cards: TravelCard[], tag: string): number {
	return cards.filter((card) => getCardTagKeys(card).includes(tag)).length;
}

// ─── Canonical validation (adapted from original scr/shared/board.ts) ─────────

/** Map row index to legacy TimeSlot name. */
function rowIndexToSlot(rowIndex: number): string {
	const slots = ["early_morning", "morning", "afternoon", "evening", "night"];
	return slots[rowIndex] ?? "unknown";
}

/** Map legacy TimeSlot name to row index. */
function slotToRowIndex(slot: string): number {
	const slots: Record<string, number> = {
		early_morning: 0,
		morning: 1,
		afternoon: 2,
		evening: 3,
		night: 4,
	};
	return slots[slot] ?? -1;
}

/** Legacy-style position type (compatibility). */
export type GridPosition = {
	day: number;
	slot: string;
};

export type ValidationResult = {
	ok: boolean;
	reason?: string;
};

export const DAYS = [1, 2, 3, 4, 5] as const;
export const TIME_SLOTS = [
	"early_morning",
	"morning",
	"afternoon",
	"evening",
	"night",
] as const;
export const DISTANCE_LIMIT_KM = 20;

export function cellId(position: GridPosition) {
	return `day-\${position.day}-\${position.slot}`;
}

export function validateGridPlacement(
	boardSlots: BoardSlots,
	position: GridPosition,
	activeDay: number,
): ValidationResult {
	if (!DAYS.includes(position.day as (typeof DAYS)[number])) {
		return { ok: false, reason: "Invalid travel day." };
	}
	if (!TIME_SLOTS.includes(position.slot as (typeof TIME_SLOTS)[number])) {
		return { ok: false, reason: "Invalid time slot." };
	}
	if (position.day !== activeDay) {
		return {
			ok: false,
			reason: `Cards can only be placed on day \${activeDay}.`,
		};
	}

	const rowIndex = slotToRowIndex(position.slot);
	const colIndex = days.indexOf(position.day);
	if (rowIndex < 0 || colIndex < 0) {
		return { ok: false, reason: "Grid cell does not exist." };
	}

	const cell = boardSlots[rowIndex]?.[colIndex];
	if (cell === undefined)
		return { ok: false, reason: "Grid cell does not exist." };
	if (cell !== null)
		return {
			ok: false,
			reason: "This time slot already has a destination card.",
		};

	return { ok: true };
}

export function placeCardOnBoard(
	boardSlots: BoardSlots,
	card: TravelCard,
	position: GridPosition,
): BoardSlots {
	const rowIndex = slotToRowIndex(position.slot);
	const colIndex = days.indexOf(position.day);
	if (rowIndex < 0 || colIndex < 0) return boardSlots;

	return boardSlots.map((row, ri) =>
		row.map((existing, ci) =>
			ri === rowIndex && ci === colIndex ? card : existing,
		),
	);
}

export function validateDistance(
	boardSlots: BoardSlots,
	cards: TravelCard[],
): { totalKm: number; penalty: number; warnings: string[] } {
	const byId = new Map(cards.map((card) => [card.id, card]));
	let previous: TravelCard | undefined;
	let previousCol: number | undefined;
	let totalKm = 0;
	let penalty = 0;
	const warnings: string[] = [];

	// Flatten board in row-major order (all day-0 slots, then day-1, etc.)
	for (let colIndex = 0; colIndex < days.length; colIndex += 1) {
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
			const cell = boardSlots[rowIndex]?.[colIndex];
			if (!cell || cell.is_virtual) {
				previous = undefined;
				previousCol = undefined;
				continue;
			}

			if (previous && previousCol === colIndex) {
				const distance = haversineKm(
					previous.coordinates.lat,
					previous.coordinates.lng,
					cell.coordinates.lat,
					cell.coordinates.lng,
				);
				totalKm += distance;
				if (distance > DISTANCE_LIMIT_KM) {
					penalty += 2;
					warnings.push(
						`\${previous.name} -> \${cell.name}: \${distance.toFixed(1)}km exceeds \${DISTANCE_LIMIT_KM}km.`,
					);
				}
			}

			previous = cell;
			previousCol = colIndex;
		}
	}

	return { totalKm: Number(totalKm.toFixed(1)), penalty, warnings };
}

function haversineKm(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
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

// ─── BoardCell[] functions (server-side flat model, coexists with BoardSlots above) ───

export function createBoardCells(): BoardCell[] {
	return DAYS.flatMap((day) => TIME_SLOTS.map((slot) => ({ day, slot })));
}

export function placeCardOnBoardCells(
	board: BoardCell[],
	cardId: string,
	position: GridPosition,
): BoardCell[] {
	return board.map((cell) =>
		cell.day === position.day && cell.slot === position.slot
			? { ...cell, card_id: cardId }
			: cell,
	);
}

export function skipBoardSlotCells(
	board: BoardCell[],
	position: GridPosition,
): BoardCell[] {
	return board.map((cell) =>
		cell.day === position.day && cell.slot === position.slot
			? { ...cell, skipped: true }
			: cell,
	);
}

export function lockBoardSlotCells(
	board: BoardCell[],
	position: GridPosition,
): BoardCell[] {
	return board.map((cell) =>
		cell.day === position.day && cell.slot === position.slot
			? { ...cell, locked: true }
			: cell,
	);
}

export function validateDistanceCells(board: BoardCell[], cards: TravelCard[]) {
	const byId = new Map(cards.map((card) => [card.card_id, card]));
	let previous: TravelCard | undefined;
	let previousDay: number | undefined;
	let totalKm = 0;
	let penalty = 0;
	const warnings: string[] = [];

	for (const cell of [...board].sort(
		(a, b) =>
			a.day - b.day ||
			TIME_SLOTS.indexOf(a.slot as (typeof TIME_SLOTS)[number]) -
				TIME_SLOTS.indexOf(b.slot as (typeof TIME_SLOTS)[number]),
	)) {
		const current = cell.card_id ? byId.get(cell.card_id) : undefined;
		if (!current || current.is_virtual) {
			previous = undefined;
			previousDay = undefined;
			continue;
		}

		if (previous && previousDay === cell.day) {
			const distance = haversineKm(
				previous.coordinates.lat,
				previous.coordinates.lng,
				current.coordinates.lat,
				current.coordinates.lng,
			);
			totalKm += distance;
			if (distance > DISTANCE_LIMIT_KM) {
				penalty += 2;
				warnings.push(
					`${previous.name} -> ${current.name}: ${distance.toFixed(1)}km exceeds ${DISTANCE_LIMIT_KM}km.`,
				);
			}
		}

		previous = current;
		previousDay = cell.day;
	}

	return { totalKm: Number(totalKm.toFixed(1)), penalty, warnings };
}
