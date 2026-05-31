/**
 * Animation & timing constants for the game
 *
 * Centralises all magic numbers so they're documented in one place,
 * easy to tweak, and self-explanatory by name.
 */

// ── Draft animations ──────────────────────────────────────────────────────

/** Duration of the card-deal fly-in animation (CSS transition)  */
export const DEAL_ANIMATION_MS = 1_320;

/** Duration of the card-pass fly-out animation (CSS transition)  */
export const PASS_ANIMATION_MS = 940;

// ── Simulation replay ────────────────────────────────────────────────────

/** Interval between each replay step (the scan "ticker" sound)  */
export const SIMULATION_STEP_INTERVAL_MS = 850;

/** Delay after replay completes before advancing to the next day  */
export const SIMULATION_ADVANCE_DELAY_MS = 2_000;

// ── UI feedback ──────────────────────────────────────────────────────────

/** How long the "just placed" flash class stays on a cell  */
export const BOARD_CELL_FLASH_MS = 500;

/** Hold-to-focus threshold for hand cards  */
export const HOLD_TO_FOCUS_MS = 500;

/** Auto-close delay for the debt modal after paying  */
export const DEBT_MODAL_AUTO_CLOSE_MS = 800;

/** Draft/placement timer tick interval  */
export const TIMER_TICK_INTERVAL_MS = 1_000;

// ── Focused-card overlay Z-index ─────────────────────────────────────────

/** Z-index for the focused card popup overlay  */
export const FOCUSED_CARD_ZINDEX = 10_000;

// ── Socket reconnect ─────────────────────────────────────────────────────

/** How long to wait before reconnecting a dropped WebSocket  */
export const SOCKET_RECONNECT_DELAY_MS = 10_000;

// ── Return-sound throttle (gameAudio.ts) ────────────────────────────────

/** Minimum ms between repeated "returnDeck" sounds  */
export const RETURN_SOUND_THROTTLE_MS = 850;

// ── Difficulty / balance (was hard-coded in score.ts) ────────────────────

/** Cost multiplier used to estimate real-world VND from in-game coin  */
export const COST_TO_VND_MULTIPLIER = 50_000;
