/**
 * game.ts — Room FSM, Phase Sequencer, Broadcaster
 *
 * Owns: Room state machine, phase timer, day counter, broadcast loop.
 * Does NOT own: per-player resources, grid mutations, VP calculations.
 *
 * Phase order per day:  DRAFTING → ASSEMBLY → SIMULATION → SCORING
 * After 3 days:         PHASE_TRANSITION (player chooses next region)
 * Full flow:            LOBBY → [day 1-3 loop] → PHASE_TRANSITION → FINISHED
 */

import {
    createBoardCells as createBoard,
    placeCardOnBoardCells as placeCardOnBoard,
    skipBoardSlotCells as skipBoardSlot,
    lockBoardSlotCells as lockBoardSlot,
    validateDistanceCells as validateDistance,
} from '../scr/shared/board.ts';
import {
    validateCardUsage,
    payDraftCost,
    gainRestResources,
    applyOnPlayEffects,
    passHandsClockwise,
    STARTING_RESOURCES,
    MAX_STAMINA,
} from '../scr/shared/rules.ts';
import { calculateScore, boardToTimeline } from '../scr/shared/score.ts';
import { drawDailyHand, simulateRandomEvent } from '../scr/shared/dice.ts';
import type {
    BoardCell,
    GamePhase,
    GridPosition,
    ItineraryEntry,
    PlayerResources,
    PlayerState,
    RoomSnapshot,
    TravelCard,
} from '../scr/shared/types.ts';

// ─── FSM event types ──────────────────────────────────────────────────────────

export type RoomEvent =
    | { type: 'PLAYER_JOIN'; playerId: string; name: string }
    | { type: 'PLAYER_LEAVE'; playerId: string }
    | { type: 'START_GAME' }
    | { type: 'CARD_DRAFTED'; playerId: string; cardId: string; mode: 'store' | 'rest' }
    | { type: 'PASS_HANDS' }
    | { type: 'DRAFTING_DONE' }
    | { type: 'CARD_PLACED'; playerId: string; cardId: string; position: GridPosition }
    | { type: 'SLOT_SKIPPED'; playerId: string; position: GridPosition }
    | { type: 'DAY_CONFIRMED'; playerId: string }
    | { type: 'SIMULATION_DONE' }
    | { type: 'SCORING_DONE' }
    | { type: 'PHASE_CHOSEN'; playerId: string; branch: 'da-lat' | 'da-nang' }
    | { type: 'NEXT_DAY' };

// ─── Allowed FSM transitions ──────────────────────────────────────────────────

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
    lobby: ['draft'],
    draft: ['placement'],
    placement: ['scoring'],
    scoring: ['draft', 'finished'],   // draft = next day, finished = after day 3
    finished: [],
};

// ─── Room interface ───────────────────────────────────────────────────────────

export interface Room {
    roomId: string;
    phase: GamePhase;
    day: number;            // 1–5 (board has 5 days, POC uses 3)
    maxDays: number;        // 3 for MVP / phase 1
    pickIndex: number;      // which pick round within drafting (0–2)
    maxPlayers: number;
    players: PlayerState[];
    cards: TravelCard[];    // full card catalogue for this phase/region
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
    maxDays = 3,
): Room {
    return {
        roomId,
        phase: 'lobby',
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
    if (room.phase !== 'lobby') {
        throw new Error('Cannot join after game has started.');
    }
    if (room.players.length >= room.maxPlayers) {
        throw new Error('Room is full.');
    }
    if (room.players.some((p) => p.playerId === playerId)) {
        throw new Error('Player already in room.');
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
    };

    room.players.push(player);
    room.log.push(`${name} joined room ${room.roomId}.`);
}

export function removePlayer(room: Room, playerId: string): void {
    room.players = room.players.filter((p) => p.playerId !== playerId);
    room.log.push(`Player ${playerId} left room ${room.roomId}.`);
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

// ─── Phase: LOBBY → DRAFT ─────────────────────────────────────────────────────

export function startGame(room: Room): void {
    if (room.players.length < 1) {
        throw new Error('Need at least 1 player to start.');
    }
    doTransition(room, 'draft', 'Game started.');
    beginDraftingPhase(room);
    room.broadcast(room);
}

// ─── Phase: DRAFT ─────────────────────────────────────────────────────────────

function beginDraftingPhase(room: Room): void {
    room.pickIndex = 0;
    const { day } = room;

    room.players.forEach((player, index) => {
        // Deal 5 cards from the seeded hand generator
        player.hand = drawDailyHand(room.cards, day, index, 7);
        player.chosen = [];
        player.ready = false;
        player.draftChoice = undefined;
    });

    room.log.push(`Day ${day}: Drafting phase started. Hands dealt.`);

    room.broadcast(room);
}

/**
 * A player picks a card from their hand — either stores it (chosen) or
 * discards it for a rest bonus.
 */
export function draftCard(
    room: Room,
    playerId: string,
    cardId: string,
    mode: 'store' | 'rest',
): void {
    assertPhase(room, 'draft', 'draftCard');

    const player = getPlayer(room, playerId);
    if (!player.hand.includes(cardId)) {
        throw new Error(`Card ${cardId} is not in ${playerId}'s hand.`);
    }

    const card = getCard(room, cardId);

    if (mode === 'store') {
        // Pay cost (may incur debt)
        const { resources, debtAdded, exhausted } = payDraftCost(player.resources, card);
        player.resources = resources;

        if (debtAdded > 0) {
            room.log.push(
                `${player.name} incurred ${debtAdded} debt to draft "${card.name}".`,
            );
        }

        // If stamina was overspent, lock a random slot on next day
        if (exhausted && room.day < room.maxDays) {
            const nextDay = room.day + 1;
            const slots = ['early_morning', 'morning', 'afternoon', 'evening', 'night'] as const;
            const randomSlot = slots[Math.floor(Math.random() * slots.length)];
            const lockTarget: GridPosition = { day: nextDay, slot: randomSlot };
            player.board = lockBoardSlot(player.board, lockTarget);
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
        room.log.push(`Day ${room.day}: All draft picks done. Moving to placement.`);
        doTransition(room, 'placement', 'Drafting complete');
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
    assertPhase(room, 'placement', 'placeCard');

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

    // Apply on-play effects (VP, stamina bonuses from REST/UTILITY/TRANSIT tags)
    player.resources = applyOnPlayEffects(player.resources, card);

    // Mutate the board
    player.board = placeCardOnBoard(player.board, cardId, position);

    // Move card from chosen/storage to placed (remove from chosen)
    player.chosen = player.chosen.filter((id) => id !== cardId);

    room.log.push(
        `${player.name} placed "${card.name}" at day ${position.day} ${position.slot}.`,
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
    assertPhase(room, 'placement', 'skipSlot');

    const player = getPlayer(room, playerId);

    if (position.day !== room.day) {
        throw new Error(`Can only skip slots on day ${room.day}.`);
    }

    player.board = skipBoardSlot(player.board, position);
    room.log.push(`${player.name} skipped ${position.slot} on day ${position.day}.`);
    room.broadcast(room);
}

/**
 * Player confirms their day is finished.
 * When all players are ready, runs simulation & scoring then advances.
 */
export function confirmDay(room: Room, playerId: string): void {
    assertPhase(room, 'placement', 'confirmDay');

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

    doTransition(room, 'scoring', `Day ${day} confirmed by all players`);

    room.players.forEach((player, index) => {
        // 1. Simulate random event for this day/player combo
        const event = simulateRandomEvent(day, index);
        room.log.push(
            `${player.name} — event: "${event.label}" ` +
            `(VP ${event.vpDelta >= 0 ? '+' : ''}${event.vpDelta}, ` +
            `Xu ${event.xuDelta >= 0 ? '+' : ''}${event.xuDelta}, ` +
            `Stamina ${event.staminaDelta >= 0 ? '+' : ''}${event.staminaDelta})`,
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

    // Advance day or finish
    if (day >= room.maxDays) {
        finishGame(room);
    } else {
        room.day += 1;
        doTransition(room, 'draft', `Starting day ${room.day}`);
        beginDraftingPhase(room);
    }

    room.broadcast(room);
}

// ─── Finish ───────────────────────────────────────────────────────────────────

function finishGame(room: Room): void {
    room.log.push('All days complete. Building final timelines…');

    // Build itinerary timeline for each player
    room.players.forEach((player) => {
        const tl = boardToTimeline(player.board, room.cards);
        room.log.push(
            `${player.name} itinerary: ${tl.length} stops.`,
        );
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

    doTransition(room, 'finished', 'Game over');
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
    if (!p) throw new Error(`Player ${playerId} not found in room ${room.roomId}.`);
    return p;
}

function getCard(room: Room, cardId: string): TravelCard {
    const c = room.cards.find((card) => card.card_id === cardId);
    if (!c) throw new Error(`Card ${cardId} not found in room catalogue.`);
    return c;
}

function allPlayersReady(room: Room): boolean {
    return room.players.length > 0 && room.players.every((p) => p.ready);
}