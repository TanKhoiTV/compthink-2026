export const STARTING_COIN = 30;
export const STARTING_STAMINA = 15;
export const HAND_SIZE = 5;
export const TURN_DURATION_SECONDS = 15;
export const PHASE_DAYS = 5;
export const PLAYER_COUNT = 4;
export const DRAFT_PICK_SECONDS = 90;

/** Draft center deal animation — keep in sync with server/draftEngine.ts */
export const DRAFT_CENTER_DEAL_CARD_MS = 900;
export const DRAFT_CENTER_DEAL_GAP_MS = 150;
export const DRAFT_CENTER_DEAL_STEP_MS =
	DRAFT_CENTER_DEAL_CARD_MS + DRAFT_CENTER_DEAL_GAP_MS;
export const DRAFT_PASS_ANIMATION_MS = 1500;
export const DRAFT_STARTING_POOL_SIZE = 7;

/** Total ms until the last card finishes flying in (1–7 cards). */
export function getDraftCenterDealDurationMs(cardCount: number): number {
	const n = Math.max(1, Math.min(DRAFT_STARTING_POOL_SIZE, cardCount));
	return (
		DRAFT_CENTER_DEAL_STEP_MS * (n - 1) + DRAFT_CENTER_DEAL_CARD_MS + 250
	);
}

/** Server timer hold (seconds) while deal/pass animation runs. */
export function getDraftDealHoldSeconds(
	cardCount: number,
	includePass = false,
): number {
	const dealMs = getDraftCenterDealDurationMs(cardCount);
	const extraMs = includePass ? DRAFT_PASS_ANIMATION_MS + 300 : 300;
	return Math.max(1, Math.ceil((dealMs + extraMs) / 1000));
}

export const days = [1, 2, 3, 4, 5];
export const rows = ["Sáng", "Trưa", "Chiều", "Tối", "Khuya"];
