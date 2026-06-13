/**
 * game.ts — Room FSM, Phase Sequencer, Broadcaster
 *
 * Owns: Room state machine, phase timer, day counter, broadcast loop.
 * Does NOT own: per-player resources, grid mutations, VP calculations.
 *
 * Phase order per day:  DRAFTING → ASSEMBLY → SIMULATION → SCORING
 * 5-day loop:           LOBBY → [day 1-5 loop] → FINISHED
 */

import {
	createBoardCells as createBoard,
	placeCardOnBoardCells as placeCardOnBoard,
	skipBoardSlotCells as skipBoardSlot,
	lockBoardSlotCells as lockBoardSlot,
	validateDistanceCells as validateDistance,
} from "../src/shared/board.ts";
import {
	validateCardUsage,
	payDraftCost,
	gainRestResources,
	applyOnPlayEffects,
	applyFinalDebtPenalty,
	passHandsClockwise,
	STARTING_RESOURCES,
	MAX_STAMINA,
} from "../src/shared/rules.ts";
import { shuffleCards } from "../src/shared/deck.ts";
import { calculateScore, boardToTimeline } from "../src/shared/score.ts";
import { simulateRandomEvent } from "../src/shared/dice.ts";
import type {
	BoardCell,
	GamePhase,
	GridPosition,
	ItineraryEntry,
	PlayerResources,
	PlayerState,
	RoomSnapshot,
	TravelCard,
} from "../src/shared/types.ts";

// ─── FSM event types ──────────────────────────────────────────────────────────

export type RoomEvent =
	| { type: "PLAYER_JOIN"; playerId: string; name: string }
	| { type: "PLAYER_LEAVE"; playerId: string }
	| { type: "START_GAME" }
	| {
			type: "CARD_DRAFTED";
			playerId: string;
			cardId: string;
			mode: "store" | "rest";
	  }
	| { type: "PASS_HANDS" }
	| { type: "DRAFTING_DONE" }
	| {
			type: "CARD_PLACED";
			playerId: string;
			cardId: string;
			position: GridPosition;
	  }
	| { type: "SLOT_SKIPPED"; playerId: string; position: GridPosition }
	| { type: "DAY_CONFIRMED"; playerId: string }
	| { type: "SIMULATION_DONE" }
	| { type: "SCORING_DONE" }
	| { type: "PHASE_CHOSEN"; playerId: string; branch: "da-lat" | "da-nang" }
	| { type: "NEXT_DAY" };

// ─── Allowed FSM transitions ──────────────────────────────────────────────────

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
	lobby: ["draft"],
	draft: ["placement"],
	placement: ["scoring"],
	scoring: ["draft", "finished"], // draft = next day, finished = after maxDays
	finished: [],
};

// ─── Room interface ───────────────────────────────────────────────────────────

export interface Room {
	roomId: string;
	phase: GamePhase;
	day: number; // 1–5 (5 days per game design doc)
	maxDays: number; // 5 days per game-logic-design.md
	pickIndex: number; // which pick round within drafting (0–2)
	maxPlayers: number;
	players: PlayerState[];
	cards: TravelCard[]; // full card catalogue for this phase/region
	log: string[];
	winnerId?: string;
	timeline?: ItineraryEntry[];
	/** broadcast callback — injected by server.ts so game.ts stays platform-free */
	broadcast: (room: Room) => void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRoom(
	roomId: string,
	cards: TravelCard[],
	broadcast: (room: Room) => void,
	maxPlayers = 2,
	maxDays = 5,
): Room {
	return {
		roomId,
		phase: "lobby",
		day: 1,
		maxDays,
		pickIndex: 0,
		maxPlayers,
		players: [],
		cards,
		log: [`Room ${roomId} created.`],
		broadcast,
	};
}

// ─── Player management ────────────────────────────────────────────────────────

export function addPlayer(room: Room, playerId: string, name: string): void {
	// Reconnect: a player who previously disconnected can rejoin an
	// in-progress room and resume with their existing board/hand/resources.
	const existing = room.players.find((p) => p.playerId === playerId);
	if (existing) {
		if (existing.connected) {
			throw new Error("Player already in room.");
		}
		existing.connected = true;
		existing.name = name;
		room.log.push(`${name} reconnected to room ${room.roomId}.`);
		room.broadcast(room);
		return;
	}

	if (room.phase !== "lobby") {
		throw new Error("Cannot join after game has started.");
	}
	if (room.players.length >= room.maxPlayers) {
		throw new Error("Room is full.");
	}

	const player: PlayerState = {
		playerId,
		name,
		board: createBoard(),
		hand: [],
		chosen: [],
		storage: [],
		resources: { ...STARTING_RESOURCES },
		ready: false,
		connected: true,
	};

	room.players.push(player);
	room.log.push(`${name} joined room ${room.roomId}.`);
}

/**
 * Handle a player disconnect. In the lobby, the seat is freed immediately.
 * Once the game has started, the player's state (board/hand/resources) is
 * kept so they can reconnect via `addPlayer` and resume.
 */
export function removePlayer(room: Room, playerId: string): void {
	if (room.phase === "lobby") {
		room.players = room.players.filter((p) => p.playerId !== playerId);
		room.log.push(`Player ${playerId} left room ${room.roomId}.`);
		return;
	}

	const player = room.players.find((p) => p.playerId === playerId);
	if (!player) return;

	player.connected = false;
	room.log.push(`${player.name} disconnected from room ${room.roomId}.`);
}

// ─── FSM transition guard ─────────────────────────────────────────────────────

function assertPhase(room: Room, required: GamePhase, action: string): void {
	if (room.phase !== required) {
		throw new Error(
			`Action "${action}" requires phase "${required}", but room is in phase "${room.phase}".`,
		);
	}
}

function canTransition(from: GamePhase, to: GamePhase): boolean {
	return TRANSITIONS[from]?.includes(to) ?? false;
}

function doTransition(room: Room, to: GamePhase, note: string): void {
	if (!canTransition(room.phase, to)) {
		throw new Error(
			`Invalid FSM transition from "${room.phase}" to "${to}": ${note}`,
		);
	}
	room.log.push(`[FSM] ${room.phase} → ${to} (day ${room.day}): ${note}`);
	room.phase = to;
}

// ─── Lobby: toggle ready ─────────────────────────────────────────────────────

/**
 * Toggle the ready flag for a player in the lobby.
 * When all connected players are ready, the host can start the game.
 */
export function toggleReady(room: Room, playerId: string): void {
	assertPhase(room, "lobby", "toggleReady");

	const player = getPlayer(room, playerId);
	player.ready = !player.ready;

	const status = player.ready ? "ready" : "not ready";
	room.log.push(`${player.name} is ${status}.`);

	room.broadcast(room);
}

// ─── Phase: LOBBY → DRAFT ─────────────────────────────────────────────────────

export function startGame(room: Room, callerPlayerId?: string): void {
	// Room must be full
	if (room.players.length < room.maxPlayers) {
		throw new Error(
			`Room must be full to start. ${room.players.length}/${room.maxPlayers} players.`,
		);
	}

	// Only the host (first player) can start
	const host = room.players[0];
	if (!host) {
		throw new Error("No host found.");
	}

	if (callerPlayerId && callerPlayerId !== host.playerId) {
		throw new Error(`Only ${host.name} (host) can start the game.`);
	}

	// Check all connected players are ready
	const notReady = room.players.filter((p) => !p.ready);
	if (notReady.length > 0) {
		throw new Error(
			`Not all players are ready: ${notReady.map((p) => p.name).join(", ")}`,
		);
	}

	doTransition(room, "draft", "Game started.");
	beginDraftingPhase(room);
	room.broadcast(room);
}

// ─── Phase: DRAFT ─────────────────────────────────────────────────────────────

/**
 * Card IDs that are no longer eligible to be dealt: cards already placed on
 * any player's board, or still sitting in a player's chosen/storage piles.
 */
function collectUsedCardIds(room: Room): Set<string> {
	const used = new Set<string>();

	for (const player of room.players) {
		for (const cell of player.board) {
			if (cell.card_id) used.add(cell.card_id);
		}
		for (const cardId of player.chosen) used.add(cardId);
		for (const cardId of player.storage) used.add(cardId);
	}

	return used;
}

function beginDraftingPhase(room: Room): void {
	room.pickIndex = 0;
	const { day } = room;
	const HAND_SIZE = 7;
	const required = room.players.length * HAND_SIZE;

	// Deal from cards that haven't been placed/held yet, so the same card
	// can't be dealt twice across the multi-day game. If the unused pool
	// can't fill every hand (e.g. a large room nearing catalogue exhaustion),
	// fall back to the full catalogue so the draft can still proceed.
	const usedCardIds = collectUsedCardIds(room);
	const unusedCards = room.cards.filter((c) => !usedCardIds.has(c.card_id));
	const pool = unusedCards.length >= required ? unusedCards : room.cards;

	const shuffled = shuffleCards(pool);
	let cursor = 0;

	room.players.forEach((player) => {
		player.hand = shuffled
			.slice(cursor, cursor + HAND_SIZE)
			.map((c) => c.card_id);
		cursor += HAND_SIZE;
		player.chosen = [];
		player.ready = false;
		player.draftChoice = undefined;
	});

	room.log.push(`Day ${day}: Drafting phase started. Hands dealt.`);

	room.broadcast(room);
}

type PayDebtResult = { paid: number; remainingDebt: number };

/**
 * Pay down debt using available xu.
 */
export function payDebt(
	room: Room,
	playerId: string,
	amount?: number,
): PayDebtResult {
	const player = getPlayer(room, playerId);
	const currentDebt = player.resources.debtToken;

	if (currentDebt <= 0) {
		throw new Error("Không có nợ để trả.");
	}

	const requestedAmount = Math.max(1, Math.floor(amount ?? currentDebt));
	const payableAmount = Math.min(
		player.resources.xu,
		currentDebt,
		requestedAmount,
	);

	if (payableAmount <= 0) {
		throw new Error(
			`Không đủ xu để trả nợ. Đang nợ ${currentDebt} xu, có ${player.resources.xu} xu.`,
		);
	}

	player.resources.xu -= payableAmount;
	player.resources.debtToken -= payableAmount;

	room.log.push(
		`${player.name} paid ${payableAmount} debt (${player.resources.debtToken} remaining).`,
	);

	room.broadcast(room);
	return { paid: payableAmount, remainingDebt: player.resources.debtToken };
}

type ReturnCardResult = { cardId: string };

/**
 * Return a placed card from the board back to the player's chosen cards.
 * Only allowed for cards on the current day.
 */
export function returnBoardCard(
	room: Room,
	playerId: string,
	day: number,
	slot: string,
): ReturnCardResult {
	const player = getPlayer(room, playerId);

	if (day !== room.day) {
		throw new Error(`Chỉ được rút bài của ngày hiện tại (ngày ${room.day}).`);
	}

	// Find the cell at this position
	const cellIndex = player.board.findIndex(
		(c) => c.day === day && c.slot === slot,
	);
	if (cellIndex === -1 || !player.board[cellIndex].card_id) {
		throw new Error("Ô này không có bài để rút.");
	}

	const cell = player.board[cellIndex];

	// Don't allow returning a locked (stamina-debt) slot
	if (cell.locked) {
		throw new Error("Không thể rút token khóa về tay.");
	}

	const cardId = cell.card_id!;

	// Remove card from board
	player.board = player.board.map((c, i) =>
		i === cellIndex ? { ...c, card_id: undefined } : c,
	);

	// Return to chosen so it can be re-placed
	player.chosen.push(cardId);

	room.log.push(
		`${player.name} returned card ${cardId} from board (day ${day} ${slot}).`,
	);

	room.broadcast(room);
	return { cardId };
}

/**
 * A player picks a card from their hand — either stores it (chosen) or
 * discards it for a rest bonus.
 */
export function draftCard(
	room: Room,
	playerId: string,
	cardId: string,
	mode: "store" | "rest",
): void {
	assertPhase(room, "draft", "draftCard");

	const player = getPlayer(room, playerId);
	if (!player.hand.includes(cardId)) {
		throw new Error(`Card ${cardId} is not in ${playerId}'s hand.`);
	}

	const card = getCard(room, cardId);

	if (mode === "store") {
		// Pay cost (may incur debt)
		const { resources, debtAdded, exhausted } = payDraftCost(
			player.resources,
			card,
		);
		player.resources = resources;

		if (debtAdded > 0) {
			room.log.push(
				`${player.name} incurred ${debtAdded} debt to draft "${card.name}".`,
			);
		}

		// If stamina was overspent, lock a random slot on next day
		if (exhausted && room.day < room.maxDays) {
			const nextDay = room.day + 1;
			const slots = [
				"early_morning",
				"morning",
				"afternoon",
				"evening",
				"night",
			] as const;
			const randomSlot = slots[Math.floor(Math.random() * slots.length)];
			const lockTarget: GridPosition = { day: nextDay, slot: randomSlot };
			player.board = lockBoardSlot(player.board, lockTarget, {
				lockedReason: "Kiệt sức",
				sourceCardName: card.name,
			});
			room.log.push(
				`${player.name} is exhausted — ${randomSlot} slot of day ${nextDay} locked.`,
			);
		}

		player.chosen.push(cardId);
		room.log.push(`${player.name} drafted "${card.name}" (store).`);
	} else {
		// Discard for rest bonus
		player.resources = gainRestResources(player.resources);
		room.log.push(
			`${player.name} discarded "${card.name}" for rest resources.`,
		);
	}

	// Remove card from hand
	player.hand = player.hand.filter((id) => id !== cardId);
	player.draftChoice = { cardId, mode };
	player.ready = true;

	// Advance round if all players are ready
	if (allPlayersReady(room)) {
		advanceDraftRound(room);
	}
}

function advanceDraftRound(room: Room): void {
	room.pickIndex += 1;
	room.players.forEach((p) => (p.ready = false));

	const DRAFT_ROUNDS = 5;

	if (room.pickIndex >= DRAFT_ROUNDS) {
		// Drafting complete — discard remaining hands, move to placement
		room.players.forEach((p) => (p.hand = []));
		room.log.push(
			`Day ${room.day}: All draft picks done. Moving to placement.`,
		);
		doTransition(room, "placement", "Drafting complete");
		room.broadcast(room);
		return;
	}

	// Pass hands clockwise for the next pick round
	const hands = room.players.map((p) => [...p.hand]);
	const n = room.players.length;
	room.players.forEach((p, i) => {
		p.hand = hands[(i + 1) % n];
		p.ready = false;
	});

	room.log.push(`Draft round ${room.pickIndex + 1} started (hands passed).`);
	room.broadcast(room);
}

// ─── Phase: PLACEMENT ─────────────────────────────────────────────────────────

/**
 * Place a chosen card onto the board grid.
 */
export function placeCard(
	room: Room,
	playerId: string,
	cardId: string,
	position: GridPosition,
): void {
	assertPhase(room, "placement", "placeCard");

	const player = getPlayer(room, playerId);
	const card = getCard(room, cardId);

	// Card must be in player's chosen list or storage
	const check = validateCardUsage(player, card);
	if (!check.ok) throw new Error(check.reason);

	// Board validates slot availability & day constraint
	const { day } = room;
	if (position.day !== day) {
		throw new Error(`Can only place cards on day ${day}.`);
	}

	const cell = player.board.find(
		(c) => c.day === position.day && c.slot === position.slot,
	);
	if (!cell) {
		throw new Error(`Invalid board position: day ${position.day} ${position.slot}.`);
	}
	if (cell.card_id) {
		throw new Error("This time slot already has a destination card.");
	}
	if (cell.locked) {
		throw new Error(
			`This slot is locked${cell.sourceCardName ? ` (exhausted by "${cell.sourceCardName}")` : ""}.`,
		);
	}

	// Capture the IGNORE_DISTANCE_NEXT buff before applyOnPlayEffects consumes it.
	const ignoreDistancePenalty = player.resources.ignoreDistancePenaltyNext ?? false;

	// Apply on-play effects (VP, stamina bonuses from REST/UTILITY/TRANSIT tags)
	player.resources = applyOnPlayEffects(player.resources, card);

	// Mutate the board
	player.board = placeCardOnBoard(player.board, cardId, position, { ignoreDistancePenalty });

	// Move card from chosen/storage to placed (remove from chosen)
	player.chosen = player.chosen.filter((id) => id !== cardId);

	room.log.push(
		`${player.name} placed "${card.name}" at day ${position.day} ${position.slot}.`,
	);

	room.broadcast(room);
}

/**
 * Discard a chosen card during placement for rest resources.
 * Removes the card from the player's chosen list and grants the
 * rest bonus (+1 coin, +1 stamina, capped at MAX_STAMINA).
 */
export function discardChosenCard(
	room: Room,
	playerId: string,
	cardId: string,
): void {
	assertPhase(room, "placement", "discardChosenCard");
	const player = getPlayer(room, playerId);
	const card = room.cards.find((c) => c.card_id === cardId);
	if (!card) throw new Error(`Card ${cardId} not found`);
	if (!player.chosen.includes(cardId)) {
		throw new Error(`Card ${cardId} is not in your chosen cards`);
	}

	player.chosen = player.chosen.filter((id) => id !== cardId);
	player.resources = gainRestResources(player.resources);

	room.log.push(
		`${player.name} discarded "${card.name}" for rest resources during placement.`,
	);
	room.broadcast(room);
}

/**
 * Skip a time slot (mark as rest/travel buffer).
 * This breaks the distance-penalty chain on adjacent slots.
 */
export function skipSlot(
	room: Room,
	playerId: string,
	position: GridPosition,
): void {
	assertPhase(room, "placement", "skipSlot");

	const player = getPlayer(room, playerId);

	if (position.day !== room.day) {
		throw new Error(`Can only skip slots on day ${room.day}.`);
	}

	player.board = skipBoardSlot(player.board, position);
	room.log.push(
		`${player.name} skipped ${position.slot} on day ${position.day}.`,
	);
	room.broadcast(room);
}

/**
 * Player confirms their day is finished.
 * When all players are ready, runs simulation & scoring then advances.
 */
export function confirmDay(room: Room, playerId: string): void {
	assertPhase(room, "placement", "confirmDay");

	const player = getPlayer(room, playerId);
	player.ready = true;
	room.log.push(`${player.name} confirmed day ${room.day}.`);

	if (allPlayersReady(room)) {
		runSimulationAndScoring(room);
	}
}

// ─── Phase: SIMULATION + SCORING (internal) ───────────────────────────────────

function runSimulationAndScoring(room: Room): void {
	const { day } = room;
	room.log.push(`Day ${day}: Running simulation & scoring…`);

	doTransition(room, "scoring", `Day ${day} confirmed by all players`);

	room.players.forEach((player, index) => {
		// 1. Simulate random event for this day/player combo
		const event = simulateRandomEvent(day, index);
		room.log.push(
			`${player.name} — event: "${event.label}" ` +
				`(VP ${event.vpDelta >= 0 ? "+" : ""}${event.vpDelta}, ` +
				`Xu ${event.xuDelta >= 0 ? "+" : ""}${event.xuDelta}, ` +
				`Stamina ${event.staminaDelta >= 0 ? "+" : ""}${event.staminaDelta})`,
		);

		// Apply event deltas to resources (clamp stamina)
		player.resources = {
			...player.resources,
			vp: player.resources.vp + event.vpDelta,
			xu: Math.max(0, player.resources.xu + event.xuDelta),
			stamina: Math.max(
				0,
				Math.min(MAX_STAMINA, player.resources.stamina + event.staminaDelta),
			),
		};

		// 2. Distance warnings (logged only; penalty applied in score)
		const { warnings } = validateDistance(player.board, room.cards);
		warnings.forEach((w) => room.log.push(`  ⚠ ${player.name}: ${w}`));

		// 3. Calculate full score
		const score = calculateScore(player.board, room.cards, player.resources);
		player.resources.vp = score.totalVp;

		room.log.push(
			`${player.name} day ${day} score: ` +
				`base=${score.baseVp} combo=${score.comboVp} ` +
				`resource=${score.resourceVp} penalty=-${score.penaltyVp} ` +
				`→ total=${score.totalVp} (${score.routeKm}km)`,
		);

		// Reset ready flag
		player.ready = false;
		// Discard leftover chosen cards for this day
		player.chosen = [];
		player.storage = [];
	});

	// 1. Broadcast scoring results FIRST so clients see the score table
	room.broadcast(room);

	// 2. After a pause, advance to next day (or finish)
	setTimeout(() => {
		// Guard: room might have been cleaned up
		if (room.phase !== "scoring") return;

		if (day >= room.maxDays) {
			finishGame(room);
		} else {
			room.day += 1;
			doTransition(room, "draft", `Starting day ${room.day}`);
			beginDraftingPhase(room);
		}
		room.broadcast(room);
	}, 3000);
}

// ─── Finish ───────────────────────────────────────────────────────────────────

function finishGame(room: Room): void {
	room.log.push("All days complete. Building final timelines…");

	// Apply a one-time penalty for any unpaid debt at game end
	room.players.forEach((player) => {
		const { resources, penalty } = applyFinalDebtPenalty(player.resources);
		if (penalty > 0) {
			player.resources = resources;
			room.log.push(
				`${player.name} ended the game with unpaid debt — -${penalty} VP penalty.`,
			);
		}
	});

	// Build itinerary timeline for each player
	room.players.forEach((player) => {
		const tl = boardToTimeline(player.board, room.cards);
		room.log.push(`${player.name} itinerary: ${tl.length} stops.`);
	});

	// Determine winner (highest VP)
	if (room.players.length > 1) {
		const sorted = [...room.players].sort(
			(a, b) => b.resources.vp - a.resources.vp,
		);
		room.winnerId = sorted[0].playerId;
		room.log.push(
			`Winner: ${sorted[0].name} with ${sorted[0].resources.vp} VP.`,
		);
	}

	doTransition(room, "finished", "Game over");
}

// ─── Snapshot export (what clients receive) ───────────────────────────────────

export function exportSnapshot(room: Room, viewerId?: string): RoomSnapshot {
	return {
		roomId: room.roomId,
		phase: room.phase,
		day: room.day,
		pickIndex: room.pickIndex,
		maxPlayers: room.maxPlayers,
		players: room.players.map((p) => ({
			playerId: p.playerId,
			name: p.name,
			board: p.board,
			chosen: p.chosen,
			storage: p.storage,
			resources: p.resources,
			ready: p.ready,
			connected: p.connected,
			draftChoice: p.draftChoice,
			hand: viewerId && p.playerId === viewerId ? p.hand : [],
		})),
		winnerId: room.winnerId,
		log: [...room.log],
	};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlayer(room: Room, playerId: string): PlayerState {
	const p = room.players.find((pl) => pl.playerId === playerId);
	if (!p)
		throw new Error(`Player ${playerId} not found in room ${room.roomId}.`);
	return p;
}

function getCard(room: Room, cardId: string): TravelCard {
	const c = room.cards.find((card) => card.card_id === cardId);
	if (!c) throw new Error(`Card ${cardId} not found in room catalogue.`);
	return c;
}

/**
 * True when every connected player is ready. Disconnected players don't
 * block phase advancement — their existing state is preserved in case
 * they reconnect.
 */
function allPlayersReady(room: Room): boolean {
	const connected = room.players.filter((p) => p.connected);
	return connected.length > 0 && connected.every((p) => p.ready);
}
