/**
 * bot.ts — Auto-play logic for bot players in the server Room FSM.
 *
 * Provides bot player creation and turn-scheduling so that rooms with
 * bot players (e.g. single-player mode with 3 bots + 1 human) advance
 * through all game phases without requiring a human to play every seat.
 *
 * Usage:
 *   import { createBotPlayer, scheduleBotTurns } from "./bot.ts";
 *
 *   // Add bots to room
 *   for (let i = 0; i < numBots; i++) {
 *     const bot = createBotPlayer(i, "bot-");
 *     addPlayer(room, bot.playerId, bot.name);
 *   }
 *
 *   // After startGame, schedule bots to auto-play
 *   scheduleBotTurns(room, 500);
 */

import { draftCard, placeCard, confirmDay, type Room } from "./game.ts";
import type {
	PlayerState,
	GridPosition,
	TimeSlot,
} from "../src/shared/types.ts";
import { STARTING_RESOURCES } from "../src/shared/rules.ts";
import { createBoardCells } from "../src/shared/board.ts";

// ─── Bot name pool ───────────────────────────────────────────────────────────

const BOT_NAMES = [
	"Bot Alpha",
	"Bot Beta",
	"Bot Gamma",
	"Bot Delta",
	"Bot Epsilon",
	"Bot Zeta",
	"Bot Eta",
	"Bot Theta",
	"Bot Iota",
	"Bot Kappa",
];

// ─── Player factory ──────────────────────────────────────────────────────────

/**
 * Create a bot PlayerState with a generated name and default resources.
 * The playerId is constructed as `${prefix}${index}` (e.g. "bot-0", "bot-1").
 */
export function createBotPlayer(
	index: number,
	playerIdPrefix = "bot-",
): PlayerState {
	const name = BOT_NAMES[index % BOT_NAMES.length];
	return {
		playerId: `${playerIdPrefix}${index}`,
		name,
		board: createBoardCells(),
		hand: [],
		chosen: [],
		storage: [],
		resources: { ...STARTING_RESOURCES },
		ready: false,
	};
}

// ─── Bot turn execution ─────────────────────────────────────────────────────

/**
 * Execute one bot turn based on the current room phase.
 *
 * - draft: pick the first card in the bot's hand with "store" mode.
 *   If hand is empty, the bot has nothing to do this round.
 *
 * - placement: iterate through the bot's chosen cards and place each into
 *   the first available (non-occupied, non-locked, non-skipped) cell on the
 *   current day. When all chosen cards are placed (or none remain), confirm
 *   the day.
 *
 * - All other phases: no action needed (scoring/finished are server-driven).
 *
 * Returns true if the bot performed an action, false if idle.
 */
export function runBotTurn(room: Room, playerId: string): boolean {
	if (room.phase === "draft") {
		return autoDraft(room, playerId);
	}
	if (room.phase === "placement") {
		return autoPlace(room, playerId);
	}
	return false;
}

/**
 * Schedule all non-ready bot players in the room to execute their turns
 * after `delayMs` milliseconds. Bots that are already ready are skipped.
 *
 * Returns an array of setTimeout IDs so the caller can cancel if needed.
 */
export function scheduleBotTurns(room: Room, delayMs = 500): number[] {
	const timers: number[] = [];

	for (const player of room.players) {
		// Skip non-bots (bots have "Bot " prefix in name)
		if (!isBotPlayer(player)) continue;
		// Skip bots that already have their turn ready
		if (player.ready) continue;

		// Skip bots with empty hand in draft (nothing to do)
		if (room.phase === "draft" && player.hand.length === 0) continue;

		const id = setTimeout(() => {
			try {
				runBotTurn(room, player.playerId);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				console.warn(`[bot] ${player.name} turn failed: ${message}`);
			}
		}, delayMs) as unknown as number;

		timers.push(id);
	}

	return timers;
}

// ─── Draft auto-play ─────────────────────────────────────────────────────────

/**
 * Auto-draft: pick the first card in the bot's hand with "store" mode.
 * The bot always stores — it never discards for rest resources.
 */
function autoDraft(room: Room, playerId: string): boolean {
	if (room.phase !== "draft") return false;

	const player = getPlayerOrNull(room, playerId);
	if (!player || player.hand.length === 0) return false;

	const cardId = player.hand[0];
	try {
		draftCard(room, playerId, cardId, "store");
		return true;
	} catch {
		// If the first card fails (e.g. cost issue), try the rest
		for (const cId of player.hand.slice(1)) {
			try {
				draftCard(room, playerId, cId, "store");
				return true;
			} catch {
				// Try next card
			}
		}
		return false;
	}
}

// ─── Placement auto-play ─────────────────────────────────────────────────────

/**
 * Auto-place: place the bot's chosen cards sequentially into available cells
 * on the current day. Slots are filled from early_morning → night.
 * When all chosen are placed (or none left), confirm the day.
 */
function autoPlace(room: Room, playerId: string): boolean {
	if (room.phase !== "placement") return false;

	const player = getPlayerOrNull(room, playerId);
	if (!player) return false;

	// If nothing to place, confirm and return
	if (player.chosen.length === 0) {
		try {
			confirmDay(room, playerId);
			return true;
		} catch {
			return false;
		}
	}

	// Find available (empty, unlocked, unskipped) cells on current day
	const availableCells = player.board.filter(
		(cell) =>
			cell.day === room.day && !cell.card_id && !cell.locked && !cell.skipped,
	);

	if (availableCells.length === 0) {
		// No space — discard remaining chosen by confirming
		try {
			confirmDay(room, playerId);
			return true;
		} catch {
			return false;
		}
	}

	// Place as many cards as we have space for, in order
	const cardsToPlace = player.chosen.slice(0, availableCells.length);
	let placed = 0;

	for (let i = 0; i < cardsToPlace.length; i++) {
		const cardId = cardsToPlace[i];
		const cell = availableCells[i];

		try {
			const position: GridPosition = {
				day: room.day,
				slot: cell.slot as TimeSlot,
			};
			placeCard(room, playerId, cardId, position);
			placed++;
		} catch {
			// If one card fails to place, skip it and try the next
			continue;
		}
	}

	// If we placed everything (or nothing to place), confirm day
	if (placed === 0 || player.chosen.length === 0) {
		try {
			confirmDay(room, playerId);
			return true;
		} catch {
			return false;
		}
	}

	return placed > 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlayerOrNull(room: Room, playerId: string): PlayerState | null {
	return room.players.find((p) => p.playerId === playerId) ?? null;
}

/**
 * Check if a player is a bot by name prefix.
 * Bot names always start with "Bot ".
 */
export function isBotPlayer(player: PlayerState): boolean {
	return player.name.startsWith("Bot ");
}
