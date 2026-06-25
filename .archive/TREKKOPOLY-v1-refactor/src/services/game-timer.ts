/**
 * game-timer.ts — Shared draft/placement timer management.
 *
 * Both SP (localRoom.ts) and online (onlineGame.ts) modes import this
 * module for timer lifecycle. The onExpiry callback lets each mode
 * handle timeout differently (auto-draft vs auto-pick via RPC).
 */

import { TIMER_TICK_INTERVAL_MS } from "../shared/animations.ts";
import {
	DRAFT_PICK_SECONDS,
	TURN_DURATION_SECONDS,
} from "../shared/constants.ts";
import { updateTimerDom } from "../router.ts";

// ── Types ──────────────────────────────────────────────────────────────────

export type TimerTickHandler = (secondsLeft: number) => void;
export type TimerExpiryHandler = () => void;

// ── Module-level state ─────────────────────────────────────────────────────

let draftTimerId: number | null = null;
let placementTimerId: number | null = null;

// ── Draft timer ────────────────────────────────────────────────────────────

/**
 * Start the draft turn countdown.
 * Calls updateTimerDom() on each tick and the expiry callback when time runs out.
 *
 * @param onExpiry — Called when the timer reaches 0.
 * @param onTick — Optional custom tick handler; runs AFTER updateTimerDom().
 */
export function startDraftTimer(
	onExpiry: TimerExpiryHandler,
	onTick?: TimerTickHandler,
): void {
	stopDraftTimer();

	let secondsLeft = DRAFT_PICK_SECONDS;
	setDraftPickSecondsLocal(secondsLeft);

	draftTimerId = window.setInterval(() => {
		secondsLeft--;
		setDraftPickSecondsLocal(secondsLeft);
		updateTimerDom();
		onTick?.(secondsLeft);

		if (secondsLeft <= 0) {
			stopDraftTimer();
			onExpiry();
		}
	}, TIMER_TICK_INTERVAL_MS);
}

/**
 * Stop the draft timer if running.
 */
export function stopDraftTimer(): void {
	if (draftTimerId !== null) {
		clearInterval(draftTimerId);
		draftTimerId = null;
	}
}

/**
 * Check if the draft timer is currently running.
 */
export function isDraftTimerRunning(): boolean {
	return draftTimerId !== null;
}

// ── Placement timer ────────────────────────────────────────────────────────

/**
 * Start the placement turn countdown.
 *
 * @param onExpiry — Called when the timer reaches 0.
 * @param onTick — Optional custom tick handler.
 */
export function startPlacementTimer(
	onExpiry: TimerExpiryHandler,
	onTick?: TimerTickHandler,
): void {
	stopPlacementTimer();

	let secondsLeft = TURN_DURATION_SECONDS;
	setRemainingTurnSecondsLocal(secondsLeft);

	placementTimerId = window.setInterval(() => {
		secondsLeft--;
		setRemainingTurnSecondsLocal(secondsLeft);
		updateTimerDom();
		onTick?.(secondsLeft);

		if (secondsLeft <= 0) {
			stopPlacementTimer();
			onExpiry();
		}
	}, TIMER_TICK_INTERVAL_MS);
}

/**
 * Stop the placement timer if running.
 */
export function stopPlacementTimer(): void {
	if (placementTimerId !== null) {
		clearInterval(placementTimerId);
		placementTimerId = null;
	}
}

/**
 * Check if the placement timer is currently running.
 */
export function isPlacementTimerRunning(): boolean {
	return placementTimerId !== null;
}

/**
 * Clear both timers (used on game cleanup / phase transition).
 */
export function clearAllTimers(): void {
	stopDraftTimer();
	stopPlacementTimer();
}

// ── Direct state access (avoids circular dependency with state.ts) ──────────

import { setDraftPickSecondsLeft, setRemainingTurnSeconds } from "../state.ts";

function setDraftPickSecondsLocal(s: number): void {
	try {
		setDraftPickSecondsLeft(s);
	} catch {
		// state.ts may not be fully initialised during cleanup
	}
}

function setRemainingTurnSecondsLocal(s: number): void {
	try {
		setRemainingTurnSeconds(s);
	} catch {
		// state.ts may not be fully initialised during cleanup
	}
}
