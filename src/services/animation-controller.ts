/**
 * animation-controller.ts — Shared deal/pass animation detection.
 *
 * Both SP (localRoom.ts) and online (onlineGame.ts) modes call
 * `detectHandTransition()` with the current card count.
 * The function returns which animation to play, using a module-level
 * `wasHandEmpty` variable (the proven online pattern) instead of
 * querying the DOM (the broken SP pattern).
 */

/**
 * The set of animation state flags that can be set by detectHandTransition.
 * The caller (localRoom.ts / onlineGame.ts) applies these to state.ts
 * and optionally fires callbacks (play sound, start timer).
 */
export interface HandTransition {
	type: "deal" | "pass" | "none";
	isDealing: boolean;
	isPassing: boolean;
}

let wasHandEmpty = true;

/**
 * Detect deal/pass transitions using module-level variable (NOT DOM query).
 *
 * @param currentCardCount — number of cards currently in hand or draft pool
 * @returns which animation to play and the corresponding state.ts flags
 */
export function detectHandTransition(currentCardCount: number): HandTransition {
	const wasEmpty = wasHandEmpty;
	const isEmpty = currentCardCount === 0;

	// Update for next call
	wasHandEmpty = isEmpty;

	// Transition from empty → has cards: deal animation
	if (!isEmpty && wasEmpty) {
		return { type: "deal", isDealing: true, isPassing: false };
	}

	// Transition from has cards → empty: pass animation (player picked, rest sent)
	if (isEmpty && !wasEmpty) {
		return { type: "pass", isDealing: false, isPassing: true };
	}

	// No transition
	return { type: "none", isDealing: false, isPassing: false };
}

/**
 * Reset the module-level tracking (e.g., when starting a new game).
 */
export function resetAnimationState(): void {
	wasHandEmpty = true;
}
