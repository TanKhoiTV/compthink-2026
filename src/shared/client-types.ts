/**
 * client-types.ts — Client-only types that extend shared types.
 *
 * These types are used by the UI layer (src/) but not by the server or
 * pure game logic. They add display-level fields (labels, computed names)
 * on top of the canonical scr/shared/ types.
 */
import type { TravelCard } from "./types.ts";

export type PlayerId = "p1" | "p2" | "p3" | "p4";

export type UiCardRarity = "common" | "uncommon" | "epic" | "legendary";

export type TravelCardData = TravelCard & {
	shortName?: string;
	shortCity?: string;
	rarityLabel: string;
	tagLabel: string;
	bonusText: string;
};

export type Player = {
	id: PlayerId;
	rank: number;
	name: string;
	score: number;
	coin: number;
	stamina: number;
	usedSlots: number;
	active?: boolean;
};

export type HandPointerDragState = {
	id: string;
	source: HTMLElement;
	clone: HTMLElement | null;
	startX: number;
	startY: number;
	offsetX: number;
	offsetY: number;
	isDragging: boolean;
};

export type AppScreen =
	| "loading"
	| "dashboard"
	| "mapSelection"
	| "lobby"
	| "game";

export type UiGamePhase =
	| "lobby"
	| "draft"
	| "placement"
	| "scoring"
	| "finished";
