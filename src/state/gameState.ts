// ─── src/state/gameState.ts ────────────────────────────────────────────────
import { phase1Cards } from "../data/cards.phase1.js";
import { mapGameCardToTravelCard } from "../data/cardMapper.js";
import {
	createInitialDeck as createInitialDeckFromCards,
	shuffleCards,
} from "../game/deck.js";
import {
	HAND_SIZE,
	TURN_DURATION_SECONDS,
	DRAFT_PICK_SECONDS,
} from "../game/constants.js";
import { createEmptyBoardSlots } from "../game/board.js";
import type { BoardSlots, BoardPosition } from "../game/board.js";
import type {
	PlayerId,
	HandPointerDragState,
	TravelCardData,
	AppScreen,
} from "../types.js";
import type { DraftPickResult, DraftPlayerState } from "../game/draft.js";
import type { SimulationResult } from "../game/scoring.js";

// ── Const data ─────────────────────────────────────────────────────────────
export const playerIds: PlayerId[] = ["p1", "p2", "p3", "p4"];
export const currentPlayerId: PlayerId = "p1";

const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80";

function normalizeCardImage(card: TravelCardData): TravelCardData {
	if (card.image && card.image.trim().length > 0) return card;
	return { ...card, image: FALLBACK_IMAGE };
}

function createInitialDeck(): TravelCardData[] {
	return createInitialDeckFromCards({
		cards: phase1Cards.map(mapGameCardToTravelCard).map(normalizeCardImage),
		fallbackCards: [],
		handSize: HAND_SIZE,
	});
}

export const initialDeck: TravelCardData[] = createInitialDeck();

// ── GameState interface (91 fields grouped by concern) ─────────────────────
export interface GameState {
	// ── Core game ──────────────────────────────────────────────────
	phaseNumber: number;
	currentDayIndex: number;
	accumulatedVP: number;
	discardedResourceBonus: { coin: number; stamina: number };
	eventResourceModifier: { coin: number; stamina: number };
	localCoinDebt: number;
	hasAppliedFinalCoinDebtPenalty: boolean;
	hasAppliedSimulationScore: boolean;
	dayAdvanceTimerId: number | null;
	dailyDealTimerId: number | null;
	deck: TravelCardData[];
	playerHand: TravelCardData[];
	isInitialDealInProgress: boolean;
	isDraftPhase: boolean;
	draftPlayers: DraftPlayerState[];
	draftSelectedCardId: string | null;
	draftPickSecondsLeft: number;
	draftTimerId: number | null;
	isPassingDraftCards: boolean;
	isDraftPoolCollapsed: boolean;
	isDraftPoolCollapseAnimating: boolean;
	draftPoolCollapseAnimMode: "collapse" | "expand" | null;
	draftPoolCollapseTimerId: number | null;
	draftPassDisplayPool: TravelCardData[] | null;
	draftRound: number;
	lastDraftPickResults: DraftPickResult[];
	playerBoards: Record<PlayerId, BoardSlots>;
	botPlacedDays: Record<PlayerId, Set<number>>;
	botPlacementTimerId: number | null;

	// ── Hand interaction ───────────────────────────────────────────
	selectedHandCardId: string | null;
	draggedHandCardId: string | null;
	handPointerDragState: HandPointerDragState | null;
	lastPlacedBoardPosition: BoardPosition | null;
	lastUtilityEffectFlash: {
		rowIndex: number;
		colIndex: number;
		type: "coin" | "stamina" | "vp";
		value: number;
		id: number;
	} | null;
	resourceOrbFlashType: "coin" | "stamina" | "vp" | null;
	focusedHandCardId: string | null;
	focusedBoardCard: TravelCardData | null;
	focusedBoardPosition: BoardPosition | null;
	holdTimer: number | null;
	suppressNextClick: boolean;
	isSimulationMode: boolean;
	simulationResult: SimulationResult | null;
	remainingTurnSeconds: number;
	turnTimerId: number | null;
	simulationReplayIndex: number;
	simulationReplayTimerId: number | null;
	isReplayComplete: boolean;
	isMidGameRankingOpen: boolean;
	hasPlayedDealAnimation: boolean;
	didMoveHandPointerDrag: boolean;
	lastPointerDownCardId: string | null;

	// ── Modal ──────────────────────────────────────────────────────
	isDebtTokenModalOpen: boolean;
	debtTokenModalNotice: string;

	// ── Animation ──────────────────────────────────────────────────
	lastAnimatedCoin: number;
	lastAnimatedStamina: number;

	// ── Audio (NOT reset by new game) ──────────────────────────────
	inGameBackgroundMusic: HTMLAudioElement | null;
	isInGameMusicMuted: boolean;
	inGameMusicVolume: number;

	// ── Screen ─────────────────────────────────────────────────────
	currentAppScreen: AppScreen;
	bgSmokeVideo: HTMLVideoElement | null;

	// ── Transition ────────────────────────────────────────────────
	isTransitioning: boolean;

	// ── Online game ────────────────────────────────────────────────
	lastOnlinePhase: string | null;
	isCinematicTransitioning: boolean;
	lastOnlineRenderSignature: string;
	lastOnlineAnimationPhase: string | null;
	selfPlanningConfirmPending: boolean;
	planningConfirmLockSignature: string;
	lastOnlinePlanningDayIndex: number | null;
	planningConfirmRetryTimerId: number | null;
	planningConfirmRetryCount: number;
	lastOnlineAnimationDraftRound: number;
	lastOnlineAnimationPoolSignature: string;
	onlineDraftAnimationTimerId: number | null;
	hasStartedOnlineSimulationReplay: boolean;
	onlineDraftDisplayPool: TravelCardData[] | null;
	onlineDraftPassSnapshotPool: TravelCardData[] | null;
	onlineDraftPendingPool: TravelCardData[] | null;
	onlinePassCompleteRetryCount: number;
	isDraftCenterDealing: boolean;
	draftDealVisualEndsAt: number;
	isDraftPickFlying: boolean;
	draftHandPendingCardId: string | null;
	draftPoolFlyReturnCardId: string | null;
	lastOnlinePickedDraftCount: number;
	shouldActivateOnlineDealAnimation: boolean;
	shouldActivateOnlinePassAnimation: boolean;
	isOnlineFinalDraftReturnAnimating: boolean;
	onlineFinalDraftReturnTimerId: number | null;
	hasPlayedOnlinePlanningDealAfterDraft: boolean;
	draftCenterDealEndTimerId: number | null;
	draftCenterDealGeneration: number;
}

// ── Factory ─────────────────────────────────────────────────────────────────
export function createInitialState(): GameState {
	const savedMuted = localStorage.getItem("travelDeck.inGameMusicMuted");
	const savedVolume = Number(
		localStorage.getItem("travelDeck.inGameMusicVolume"),
	);
	const isMuted = savedMuted === "true";
	const volume =
		Number.isFinite(savedVolume) && savedVolume > 0 ? savedVolume : 0.5;

	if (!Number.isFinite(savedVolume) || savedVolume <= 0) {
		localStorage.setItem("travelDeck.inGameMusicVolume", String(0.5));
		if (savedMuted === null) {
			localStorage.setItem("travelDeck.inGameMusicMuted", "false");
		}
	}

	return {
		// core game
		phaseNumber: 1,
		currentDayIndex: 0,
		accumulatedVP: 0,
		discardedResourceBonus: { coin: 0, stamina: 0 },
		eventResourceModifier: { coin: 0, stamina: 0 },
		localCoinDebt: 0,
		hasAppliedFinalCoinDebtPenalty: false,
		hasAppliedSimulationScore: false,
		dayAdvanceTimerId: null,
		dailyDealTimerId: null,
		deck: shuffleCards(initialDeck),
		playerHand: [],
		isInitialDealInProgress: false,
		isDraftPhase: true,
		draftPlayers: [],
		draftSelectedCardId: null,
		draftPickSecondsLeft: DRAFT_PICK_SECONDS,
		draftTimerId: null,
		isPassingDraftCards: false,
		isDraftPoolCollapsed: false,
		isDraftPoolCollapseAnimating: false,
		draftPoolCollapseAnimMode: null,
		draftPoolCollapseTimerId: null,
		draftPassDisplayPool: null,
		draftRound: 1,
		lastDraftPickResults: [],
		playerBoards: {
			p1: createEmptyBoardSlots(),
			p2: createEmptyBoardSlots(),
			p3: createEmptyBoardSlots(),
			p4: createEmptyBoardSlots(),
		},
		botPlacedDays: {
			p1: new Set(),
			p2: new Set(),
			p3: new Set(),
			p4: new Set(),
		},
		botPlacementTimerId: null,

		// hand interaction
		selectedHandCardId: null,
		draggedHandCardId: null,
		handPointerDragState: null,
		lastPlacedBoardPosition: null,
		lastUtilityEffectFlash: null,
		resourceOrbFlashType: null,
		focusedHandCardId: null,
		focusedBoardCard: null,
		focusedBoardPosition: null,
		holdTimer: null,
		suppressNextClick: false,
		isSimulationMode: false,
		simulationResult: null,
		remainingTurnSeconds: TURN_DURATION_SECONDS,
		turnTimerId: null,
		simulationReplayIndex: 0,
		simulationReplayTimerId: null,
		isReplayComplete: false,
		isMidGameRankingOpen: false,
		hasPlayedDealAnimation: true,
		didMoveHandPointerDrag: false,
		lastPointerDownCardId: null,

		// modal
		isDebtTokenModalOpen: false,
		debtTokenModalNotice: "",

		// animation
		lastAnimatedCoin: -1,
		lastAnimatedStamina: -1,

		// audio
		inGameBackgroundMusic: null,
		isInGameMusicMuted: isMuted,
		inGameMusicVolume: volume,

		// screen
		currentAppScreen: "dashboard",
		bgSmokeVideo: null,

		// transition
		isTransitioning: false,

		// online game
		lastOnlinePhase: null,
		isCinematicTransitioning: false,
		lastOnlineRenderSignature: "",
		lastOnlineAnimationPhase: null,
		selfPlanningConfirmPending: false,
		planningConfirmLockSignature: "",
		lastOnlinePlanningDayIndex: null,
		planningConfirmRetryTimerId: null,
		planningConfirmRetryCount: 0,
		lastOnlineAnimationDraftRound: 0,
		lastOnlineAnimationPoolSignature: "",
		onlineDraftAnimationTimerId: null,
		hasStartedOnlineSimulationReplay: false,
		onlineDraftDisplayPool: null,
		onlineDraftPassSnapshotPool: null,
		onlineDraftPendingPool: null,
		onlinePassCompleteRetryCount: 0,
		isDraftCenterDealing: false,
		draftDealVisualEndsAt: 0,
		isDraftPickFlying: false,
		draftHandPendingCardId: null,
		draftPoolFlyReturnCardId: null,
		lastOnlinePickedDraftCount: 0,
		shouldActivateOnlineDealAnimation: false,
		shouldActivateOnlinePassAnimation: false,
		isOnlineFinalDraftReturnAnimating: false,
		onlineFinalDraftReturnTimerId: null,
		hasPlayedOnlinePlanningDealAfterDraft: false,
		draftCenterDealEndTimerId: null,
		draftCenterDealGeneration: 0,
	};
}

/** Single source of truth. Mutable by design — direct property writes. */
export const state: GameState = createInitialState();

/** Reset for a new game (preserves audio prefs). */
export function resetStateForNewGame(): void {
	const fresh = createInitialState();
	fresh.isInGameMusicMuted = state.isInGameMusicMuted;
	fresh.inGameMusicVolume = state.inGameMusicVolume;
	Object.assign(state, fresh);
}
