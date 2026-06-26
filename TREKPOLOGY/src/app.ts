import { renderMapSelectionScreen } from "./ui/mapSelection.js";
import { cleanupDashboardHub, initDashboardHub, renderDashboard } from "./ui/dashboard.js";
import { maybeStartOnboarding, isOnboardingActive, initTourLauncher, type OnboardingCtx } from "./onboarding/onboardingTour.js";
import {
  authClientState,
  createOnlineRoom,
  initOnlineClient,
  clearSavedOnlineSession,
  getSavedOnlineSession,
  joinOnlineRoom,
  leaveOnlineRoom,
  pauseReplayOnServer,
  resumeReplayOnServer,
  loginAccount,
  logoutAccount,
  onlineClientState,
  reconnectOnlineRoom,
  registerAccount,
  selectOnlineDraftCard,
  confirmOnlineDraftPick,
  confirmOnlinePlanning,
  sendDiscardCard,
  sendPayDebt,
  sendPlaceCard,
  sendReturnBoardCard,
  setOnlineReady,
  startOnlineGame,
} from "./online/socketClient.js";

import { phase1Cards } from "./data/cards.phase1.js";
import { mapGameCardToTravelCard } from "./data/cardMapper.js";
import {
  DRAFT_PICK_SECONDS,
  DRAFT_CENTER_DEAL_STEP_MS,
  DRAFT_PASS_ANIMATION_MS,
  getDraftCenterDealDurationMs,
  HAND_SIZE,
  PHASE_DAYS,
  PLAYER_COUNT,
  STARTING_COIN,
  STARTING_STAMINA,
  TURN_DURATION_SECONDS,
  days,
  rows,
} from "./game/constants.js";
import type {
  HandPointerDragState,
  Player,
  PlayerId,
  TravelCardData,
} from "./types.js";
import {
  countCardsWithTag,
  createEmptyBoardSlots,
  getBoardCardByPosition as getBoardCardByPositionFromSlots,
  getCardTagKeys,
  getCurrentDayPlacedCards as getCurrentDayPlacedCardsFromSlots,
  getPlacedCards as getPlacedCardsFromSlots,
  type BoardPosition,
  type BoardSlots,
  type BoardTotals,
} from "./game/board.js";
import {
  createDailyDraftPlayers as createDailyDraftPlayersFromDeck,
  getActiveDraftPlayerIndex,
  getCurrentDraftPlayer as getCurrentDraftPlayerFromList,
  pickRandomCard,
  rotateDraftPoolsClockwise as rotateDraftPoolsClockwiseList,
  type DraftPickResult,
  type DraftPlayerState,
} from "./game/draft.js";
import {
  buildSimulationReplaySteps as buildSimulationReplayStepsFromBoard,
  calculateScoreBreakdown as calculateScoreBreakdownFromCards,
  calculateSimulationResult as calculateSimulationResultFromBoard,
  type DayScoreSummary,
  type ScoreBreakdown,
  type SimulationReplayStep,
  type SimulationResult,
} from "./game/scoring.js";
import {
  createInitialDeck as createInitialDeckFromCards,
  drawDailyHandFromDeck as drawDailyHandFromDeckFromState,
  returnUnplayedHandToDeck as returnUnplayedHandToDeckFromState,
  shuffleCards as shuffleCardsList,
} from "./game/deck.js";
import {
  getCardAffordability as getCardAffordabilityFromResources,
  getCardAffordabilityMessage as getCardAffordabilityMessageFromResources,
  getRemainingResources as getRemainingResourcesFromTotals,
} from "./game/resources.js";
const app = document.getElementById("app")!;

const DRAFT_STARTING_POOL_SIZE = 7;
const DRAFT_PICK_TARGET = HAND_SIZE;


import {
  GameSoundName,
  playGameSound,
  setupGameAudioDelegation,
  playCardThump,
  playCardFlick,
  playFilteredPaperSound,
} from "./audio/gameAudio.js";


const playersLeftBase: Player[] = [
  {
    id: "p2",
    rank: 3,
    name: "Cường",
    score: 180,
    coin: 890,
    stamina: 20,
    usedSlots: 3,
  },
  {
    id: "p1",
    rank: 1,
    name: "An",
    score: 0,
    coin: STARTING_COIN,
    stamina: STARTING_STAMINA,
    usedSlots: 0,
    active: true,
  },
];

const playersRight: Player[] = [
  {
    id: "p3",
    rank: 3,
    name: "Minh",
    score: 190,
    coin: 720,
    stamina: 15,
    usedSlots: 3,
  },
  {
    id: "p4",
    rank: 3,
    name: "Khánh",
    score: 240,
    coin: 720,
    stamina: 15,
    usedSlots: 3,
  },
];

const images = {
  coffee:
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1f0d5?auto=format&fit=crop&w=1000&q=80",
  bridge:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
  sea:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
  food:
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80",
  market:
    "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1000&q=80",
  night:
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80",
  temple:
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80",
};

const fallbackHandCards: TravelCardData[] = [
  {
    id: "fallback_coffee",
    name: "Cà Phê Trứng",
    shortName: "Cà Phê Trứng",
    city: "Hà Nội",
    shortCity: "Hà Nội",
    image: images.coffee,
    rarity: "uncommon",
    rarityLabel: "★★",
    vp: 12,
    coin: 30,
    stamina: 5,
    tag: "food",
    tagLabel: "Ẩm thực",
    icon: "☕",
    description:
      "Một ly cà phê trứng béo mịn, rất hợp để mở đầu hành trình khám phá phố cổ Hà Nội.",
    bonusText: "Nếu có 2 tag Ẩm thực: +5 VP",
  },
  {
    id: "fallback_bridge",
    name: "Cầu Vàng",
    shortName: "Cầu Vàng",
    city: "Đà Nẵng",
    shortCity: "Đà Nẵng",
    image: images.bridge,
    rarity: "epic",
    rarityLabel: "★★★★",
    vp: 45,
    coin: 150,
    stamina: 35,
    tag: "culture",
    tagLabel: "Văn hóa",
    icon: "🏛️",
    description:
      "Băng qua cây cầu trên mây với khung cảnh ngoạn mục, một điểm đến có giá trị cao.",
    bonusText: "Nếu có 3 tag Văn hóa: +15 VP",
  },
  {
    id: "fallback_cruise",
    name: "Du Thuyền Hạ Long",
    shortName: "Du Thuyền",
    city: "Quảng Ninh",
    shortCity: "Quảng Ninh",
    image: images.sea,
    rarity: "legendary",
    rarityLabel: "★★★★★",
    vp: 85,
    coin: 400,
    stamina: 60,
    tag: "nature",
    tagLabel: "Thiên nhiên",
    icon: "⛵",
    description:
      "Khám phá vịnh Hạ Long giữa những dãy núi đá vôi kỳ vĩ, điểm cao nhưng tốn tài nguyên.",
    bonusText: "Nếu có 4 lá khác nhau: +30 VP",
  },
  {
    id: "fallback_banhmi",
    name: "Bánh Mì Huỳnh Hoa",
    shortName: "Bánh Mì",
    city: "Sài Gòn",
    shortCity: "Sài Gòn",
    image: images.food,
    rarity: "common",
    rarityLabel: "★",
    vp: 14,
    coin: 28,
    stamina: 4,
    tag: "food",
    tagLabel: "Ẩm thực",
    icon: "🥖",
    description:
      "Một món ăn đường phố nổi tiếng, rẻ, dễ ghép combo với các điểm ẩm thực khác.",
    bonusText: "Nếu đi cùng 1 lá Ẩm thực khác: +4 VP",
  },
  {
    id: "fallback_night_market",
    name: "Chợ Đêm Đà Lạt",
    shortName: "Chợ Đêm",
    city: "Đà Lạt",
    shortCity: "Đà Lạt",
    image: images.night,
    rarity: "common",
    rarityLabel: "★",
    vp: 15,
    coin: 32,
    stamina: 6,
    tag: "night",
    tagLabel: "Buổi tối",
    icon: "🌙",
    description:
      "Không khí nhộn nhịp về đêm, phù hợp nối chuỗi lịch trình tối và tạo điểm ổn định.",
    bonusText: "Nếu đi sau 1 lá buổi Tối: +6 VP",
  },
];

const PHASE1_CARD_IMAGE_BY_ID = new Map(
  phase1Cards.map((card) => [card.card_id, card.image_url] as const)
);

function getPreferredCardImage(card: TravelCardData) {
  const phase1Image = PHASE1_CARD_IMAGE_BY_ID.get(card.id);

  if (phase1Image) return phase1Image;

  // The old online server still sends /images/phase1/*.png paths that do not
  // exist in this repository. Skip them instead of issuing guaranteed 404s.
  if (card.image && !/(^|\/)images\/phase1\//i.test(card.image)) {
    return card.image;
  }

  return images.food;
}

function getCardBackgroundImage(card: TravelCardData) {
  const urls = Array.from(new Set([getPreferredCardImage(card), images.food]));

  return urls.map((url) => `url('${url}')`).join(", ");
}

function normalizeCardImage(card: TravelCardData): TravelCardData {
  if (card.image && card.image.trim().length > 0) {
    return card;
  }

  return {
    ...card,
    image: images.food,
  };
}

function preloadCardImages(cards: TravelCardData[]) {
  const framePaths = new Set<string>();

  for (const card of cards) {
    framePaths.add(getCardFramePath(card));

    const image = new Image();
    image.src = getPreferredCardImage(card);
  }

  for (const framePath of framePaths) {
    const frameImage = new Image();
    frameImage.src = framePath;
  }
}

function preloadDraftImages() {
  const draftCards: TravelCardData[] = [];

  for (const player of draftPlayers) {
    draftCards.push(...player.pool);
    draftCards.push(...player.picked);
  }

  preloadCardImages(draftCards);
}

function createInitialDeck() {
  return createInitialDeckFromCards({
    cards: phase1Cards.map(mapGameCardToTravelCard).map(normalizeCardImage),
    fallbackCards: [],
    handSize: HAND_SIZE,
  });
}

function shuffleCards(cards: TravelCardData[]) {
  return shuffleCardsList(cards);
}

function drawDailyHandFromDeck() {
  const result = drawDailyHandFromDeckFromState({
    deck,
    handSize: HAND_SIZE,
    shuffleCards,
  });

  deck = result.deck;

  return result.hand;
}

function returnUnplayedHandToDeck() {
  const result = returnUnplayedHandToDeckFromState({
    deck,
    playerHand,
    shuffleCards,
  });

  deck = result.deck;
  playerHand = result.playerHand;
}

function getCurrentDayLabel() {
  return `Ngày ${days[currentDayIndex]}`;
}

function getCurrentPhaseLabel() {
  return `Phase ${phaseNumber}`;
}

export function isOnlineRoomActive() {
  return Boolean(onlineClientState.roomId && onlineClientState.playerId && onlineClientState.roomState);
}

function isOnlineGameOver() {
  return onlineClientState.roomState?.phase === "gameover";
}

function getOnlineFinalRankings() {
  const state = onlineClientState.roomState;

  if (!state) return [];

  return playerIds
    .map((playerId) => {
      const player = state.players[playerId];

      return {
        playerId,
        name: player.name,
        score: player.score,
        coin: player.coin,
        stamina: player.stamina,
        usedSlots: player.usedSlots,
        isConnected: player.isConnected,
      };
    })
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      if (second.coin !== first.coin) return second.coin - first.coin;
      return second.stamina - first.stamina;
    });
}


function getOnlineSelfState() {
  return onlineClientState.roomState?.self ?? null;
}

function getOnlineSelfDraftPool(): TravelCardData[] | null {
  return (getOnlineSelfState()?.draftPool as TravelCardData[] | undefined) ?? null;
}

function getOnlineDraftDisplayPool(): TravelCardData[] | null {
  if (!isOnlineRoomActive()) return null;

  const serverPool = getOnlineSelfDraftPool();

  /*
    Fix online draft bị mất bài ở tab khác:
    server vẫn có state.self.draftPool nhưng client đôi khi đang giữ
    onlineDraftDisplayPool rỗng/null do animation/pass state. Khi đó UI không render bài,
    dù hết giờ server vẫn auto-pick được. Luôn fallback về serverPool nếu có bài.
  */
  if (isPassingDraftCards && !isOnlineFinalDraftReturnAnimating) {
    const passPool = onlineDraftPassSnapshotPool ?? onlineDraftDisplayPool;

    if (passPool && passPool.length > 0) {
      return passPool;
    }

    return passPool ?? serverPool;
  }

  if (
    (isInitialDealInProgress || isDraftCenterDealing) &&
    onlineDraftDisplayPool &&
    onlineDraftDisplayPool.length > 0
  ) {
    return onlineDraftDisplayPool;
  }

  if (onlineDraftDisplayPool && onlineDraftDisplayPool.length > 0) {
    return onlineDraftDisplayPool;
  }

  if (serverPool && serverPool.length > 0) {
    onlineDraftDisplayPool = [...serverPool];
    return onlineDraftDisplayPool;
  }

  return onlineDraftDisplayPool ?? serverPool;
}

function getDraftPoolSignature(cards: TravelCardData[] | null | undefined) {
  return (cards ?? []).map((card) => card.id).join(",");
}

function setOnlineDraftDisplayPoolFromServer() {
  const serverPool = getOnlineSelfDraftPool();

  onlineDraftDisplayPool = serverPool ? [...serverPool] : null;
  onlineDraftPendingPool = null;
}

function recoverOnlineDraftDisplayAfterTabVisible(reason = "visible-sync") {
  if (!isOnlineRoomActive()) return false;

  const state = onlineClientState.roomState;
  if (!state || state.phase !== "draft") return false;

  const serverPool = getOnlineSelfDraftPool();
  if (!serverPool || serverPool.length === 0) return false;

  const visiblePool =
    onlineDraftDisplayPool ??
    onlineDraftPassSnapshotPool ??
    onlineDraftPendingPool;

  const hasVisibleCards = !!visiblePool && visiblePool.length > 0;
  const animationExpired = draftDealVisualEndsAt > 0 && Date.now() > draftDealVisualEndsAt + 180;
  const visualDealStillRunning =
    isInitialDealInProgress ||
    isDraftCenterDealing ||
    isPassingDraftCards ||
    Date.now() < draftDealVisualEndsAt;
  const staleAnimation = animationExpired && visualDealStillRunning;

  /*
    Khi tab bị background, browser pause timer/animation.
    Nếu focus lại mà server đang có pool thật, ưu tiên hiện bài ngay,
    không chạy animation chia bài muộn ở tab đó nữa.
  */
  if (hasVisibleCards && !staleAnimation && !visualDealStillRunning) return false;

  clearOnlineDraftAnimationTimer();
  clearDraftCenterDealAnimation();

  onlineDraftDisplayPool = [...serverPool];
  onlineDraftPassSnapshotPool = null;
  onlineDraftPendingPool = null;
  draftHandPendingCardId = null;
  draftPoolFlyReturnCardId = null;

  isPassingDraftCards = false;
  isInitialDealInProgress = false;
  shouldActivateOnlineDealAnimation = false;
  shouldActivateOnlinePassAnimation = false;
  draftDealVisualEndsAt = 0;

  draftSelectedCardId = state.self.selectedDraftCardId ?? null;
  lastOnlineRenderSignature = "";

  console.debug(`[DRAFT SYNC] recovered draft pool after tab visible: ${reason}`, {
    poolSize: serverPool.length,
    timer: state.timer,
    round: state.draftRound,
  });

  return true;
}

function syncOnlineDraftDisplayAfterTabVisible() {
  if (document.visibilityState !== "visible") return;

  if (recoverOnlineDraftDisplayAfterTabVisible("visibility/focus")) {
    rerenderGameShell();
  }
}

function isOnlineInterRoundPoolPassActive(): boolean {
  return isPassingDraftCards && !isOnlineFinalDraftReturnAnimating;
}

function getDraftCenterDealCardCount(): number {
  if (isOnlineRoomActive()) {
    const pool =
      onlineDraftDisplayPool ??
      onlineDraftPendingPool ??
      getOnlineSelfDraftPool() ??
      [];
    return Math.max(1, pool.length);
  }

  const renderPool = getDraftCenterRenderPool();
  if (renderPool.length > 0) return renderPool.length;

  const localPool = getCurrentDraftPlayer()?.pool ?? [];
  return Math.max(1, localPool.length);
}

function getDraftCenterDealDurationForCurrentPool(): number {
  return getDraftCenterDealDurationMs(getDraftCenterDealCardCount());
}

function completeOnlineDraftPoolPassAndDeal() {
  onlineDraftAnimationTimerId = null;

  if (!onlineDraftPendingPool?.length) {
    if (onlinePassCompleteRetryCount < 40) {
      onlinePassCompleteRetryCount += 1;
      onlineDraftAnimationTimerId = window.setTimeout(
        completeOnlineDraftPoolPassAndDeal,
        100,
      );
      return;
    }
    setOnlineDraftDisplayPoolFromServer();
  } else {
    onlinePassCompleteRetryCount = 0;
    onlineDraftDisplayPool = [...onlineDraftPendingPool];
    onlineDraftPendingPool = null;
  }

  onlineDraftPassSnapshotPool = null;
  draftHandPendingCardId = null;
  draftPoolFlyReturnCardId = null;
  isPassingDraftCards = false;
  resetDraftPoolCollapseState();
  isInitialDealInProgress = true;

  const roomState = onlineClientState.roomState;
  draftSelectedCardId = roomState?.self.selectedDraftCardId ?? null;

  const dealMs = getDraftCenterDealDurationMs(
    Math.max(1, onlineDraftDisplayPool?.length ?? 0),
  );
  isDraftCenterDealing = true;
  draftDealVisualEndsAt = Date.now() + dealMs;

  lastOnlineRenderSignature = "";
  rerenderGameShell();
  startDraftCenterDealAnimation(dealMs);

  onlineDraftAnimationTimerId = window.setTimeout(() => {
    finishOnlineDraftDealVisualOnly();
  }, dealMs);
}

function beginOnlineDraftPoolPass(
  snapshotPool: TravelCardData[],
  nextServerPool: TravelCardData[] | null
) {
  if (isOnlineFinalDraftReturnAnimating || !isDraftPhase) return;
  if (snapshotPool.length === 0) return;

  if (isPassingDraftCards) {
    if (nextServerPool?.length) {
      onlineDraftPendingPool = [...nextServerPool];
    }
    return;
  }

  clearOnlineDraftAnimationTimer();

  onlinePassCompleteRetryCount = 0;
  onlineDraftPassSnapshotPool = [...snapshotPool];
  if (nextServerPool?.length) {
    onlineDraftPendingPool = [...nextServerPool];
  }

  draftSelectedCardId = null;
  draftPoolFlyReturnCardId = null;
  resetDraftPoolCollapseState();

  shouldActivateOnlineDealAnimation = false;
  shouldActivateOnlinePassAnimation = true;
  isInitialDealInProgress = false;
  isPassingDraftCards = true;

  onlineDraftAnimationTimerId = window.setTimeout(() => {
    completeOnlineDraftPoolPassAndDeal();
  }, DRAFT_PASS_ANIMATION_MS);
}


function getOnlineSelfHand(): TravelCardData[] | null {
  return (getOnlineSelfState()?.hand as TravelCardData[] | undefined) ?? null;
}

function getOnlinePlayerHand(playerId?: PlayerId): TravelCardData[] | null {
  if (!playerId || !onlineClientState.roomState) return null;

  if (playerId === getOnlineSelfPlayerId()) {
    return getOnlineSelfHand();
  }

  return (getOnlinePlayer(playerId)?.hand as TravelCardData[] | undefined) ?? null;
}

function getOnlinePlayerDraftPool(playerId?: PlayerId): TravelCardData[] {
  if (!playerId || !onlineClientState.roomState) return [];

  if (playerId === getOnlineSelfPlayerId()) {
    return getOnlineSelfDraftPool() ?? [];
  }

  return (getOnlinePlayer(playerId)?.draftPool as TravelCardData[] | undefined) ?? [];
}

function getOnlinePlayerPickedDraftCards(playerId?: PlayerId): TravelCardData[] {
  if (!playerId || !onlineClientState.roomState) return [];

  if (playerId === getOnlineSelfPlayerId()) {
    return (getOnlineSelfState()?.pickedDraftCards as TravelCardData[] | undefined) ?? [];
  }

  return (getOnlinePlayer(playerId)?.pickedDraftCards as TravelCardData[] | undefined) ?? [];
}

function getOnlinePlayerSelectedDraftCardId(playerId?: PlayerId): string | null {
  if (!playerId || !onlineClientState.roomState) return null;

  if (playerId === getOnlineSelfPlayerId()) {
    return getOnlineSelfState()?.selectedDraftCardId ?? null;
  }

  return (getOnlinePlayer(playerId)?.selectedDraftCardId as string | null | undefined) ?? null;
}

function isOnlinePlayerDraftPickConfirmed(playerId?: PlayerId): boolean {
  if (!playerId || !onlineClientState.roomState) return false;

  if (playerId === getOnlineSelfPlayerId()) {
    return getOnlineSelfState()?.draftPickConfirmed === true;
  }

  return (getOnlinePlayer(playerId)?.draftPickConfirmed as boolean | undefined) === true;
}

function getOnlinePlayerPendingPickedDraftCard(playerId?: PlayerId): TravelCardData | null {
  const selectedDraftCardId = getOnlinePlayerSelectedDraftCardId(playerId);

  if (!selectedDraftCardId) return null;

  return getOnlinePlayerDraftPool(playerId).find((card) => card.id === selectedDraftCardId) ?? null;
}

function getSpectateDraftPoolCards(): TravelCardData[] {
  if (!isSpectatingOnlinePlayer() || !isDraftPhase) return [];

  const viewedPlayerId = getViewedPlayerId();
  const selectedDraftCardId = getOnlinePlayerSelectedDraftCardId(viewedPlayerId);

  return getOnlinePlayerDraftPool(viewedPlayerId).filter((card) => {
    return card.id !== selectedDraftCardId;
  });
}

function getSpectatePickedDraftCards(): TravelCardData[] {
  if (!isSpectatingOnlinePlayer() || !isDraftPhase) return [];

  const viewedPlayerId = getViewedPlayerId();
  const pickedCards = [...getOnlinePlayerPickedDraftCards(viewedPlayerId)];
  const pendingPickedCard = getOnlinePlayerPendingPickedDraftCard(viewedPlayerId);

  if (pendingPickedCard && !pickedCards.some((card) => card.id === pendingPickedCard.id)) {
    pickedCards.push(pendingPickedCard);
  }

  return pickedCards;
}

function getSpectateHandCards(): TravelCardData[] {
  if (!isSpectatingOnlinePlayer()) return [];

  const viewedPlayerId = getViewedPlayerId();
  const handCards = getOnlinePlayerHand(viewedPlayerId) ?? [];

  if (isDraftPhase) {
    const allDraftCards = [
      ...getSpectateDraftPoolCards(),
      ...getSpectatePickedDraftCards(),
    ];
    const seen = new Set<string>();

    return allDraftCards.filter((card) => {
      if (seen.has(card.id)) return false;

      seen.add(card.id);
      return true;
    });
  }

  return handCards;
}

function getOnlineSelectedDraftCardId() {
  return getOnlineSelfState()?.selectedDraftCardId ?? null;
}

function getDraftVisualSelectedCardId() {
  return getOnlineSelectedDraftCardId() ?? draftSelectedCardId;
}

function getDraftPoolHighlightedCardId(): string | null {
  // Pool không hiển thị trạng thái "đã chọn" — lá pending nằm trên tay, slot pool bị ẩn.
  return null;
}

function shouldShowDraftWaitBanner(): boolean {
  if (!isDraftPhase || isDraftDealVisualActive() || isPassingDraftCards) return false;
  if (!isOnlineRoomActive()) return false;

  // Chỉ hiện SAU khi đã bấm "Kết thúc lượt" (đã confirm). Khi vòng xong (mọi
  // người đã pick) server reset draftPickConfirmed → banner tự ẩn.
  if (onlineClientState.roomState?.self?.draftPickConfirmed !== true) return false;

  const connectedCount = playerIds.filter((playerId) => {
    return onlineClientState.roomState?.players[playerId]?.isConnected;
  }).length;

  return connectedCount > 1;
}

function getOnlinePlayer(playerId?: PlayerId) {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId] ?? null;
}

function getOnlineSelfPlayerId(): PlayerId {
  return onlineClientState.playerId ?? currentPlayerId;
}

function getViewedPlayerId(): PlayerId {
  if (!isOnlineRoomActive()) return currentPlayerId;

  return spectatingPlayerId ?? getOnlineSelfPlayerId();
}

function getViewedOnlinePlayer() {
  return getOnlinePlayer(getViewedPlayerId());
}

function isSpectatingOnlinePlayer(): boolean {
  return isOnlineRoomActive() && getViewedPlayerId() !== getOnlineSelfPlayerId();
}

function resetSpectateView() {
  spectatingPlayerId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  selectedHandCardId = null;
  draggedHandCardId = null;
  suppressNextClick = false;
}

function syncSpectateTargetWithRoomState() {
  if (!isOnlineRoomActive()) {
    spectatingPlayerId = null;
    return;
  }

  if (!spectatingPlayerId) return;

  const selfPlayerId = getOnlineSelfPlayerId();
  const targetPlayer = getOnlinePlayer(spectatingPlayerId);

  if (spectatingPlayerId === selfPlayerId || !targetPlayer || !targetPlayer.hasJoined) {
    resetSpectateView();
  }
}

function getSpectatableOnlinePlayerIds(): PlayerId[] {
  if (!isOnlineRoomActive()) return [];

  const selfPlayerId = getOnlineSelfPlayerId();

  return playerIds.filter((playerId) => {
    if (playerId === selfPlayerId) return false;

    const player = getOnlinePlayer(playerId);

    return player?.isConnected === true || player?.hasJoined === true;
  });
}

function setSpectateTarget(playerId: PlayerId | null) {
  if (!playerId) {
    resetSpectateView();
    return;
  }

  const selfPlayerId = getOnlineSelfPlayerId();
  const targetPlayer = getOnlinePlayer(playerId);

  if (playerId === selfPlayerId || !targetPlayer || !targetPlayer.hasJoined) {
    resetSpectateView();
    return;
  }

  spectatingPlayerId = playerId;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  selectedHandCardId = null;
  draggedHandCardId = null;
  handPointerDragState = null;
  suppressNextClick = false;
  clearBoardDragHoverClass();
  clearDeckDiscardHoverClass();
}

function cycleSpectateTarget(direction: 1 | -1) {
  if (!isOnlineRoomActive()) return;

  const candidates = getSpectatableOnlinePlayerIds();

  if (candidates.length === 0) {
    resetSpectateView();
    rerenderGameShell();
    return;
  }

  const currentIndex = spectatingPlayerId ? candidates.indexOf(spectatingPlayerId) : -1;
  const nextIndex = currentIndex === -1
    ? direction > 0
      ? 0
      : candidates.length - 1
    : (currentIndex + direction + candidates.length) % candidates.length;

  setSpectateTarget(candidates[nextIndex]);
  rerenderGameShell();
}

export function getDisplayPlayerName() {
  const viewedPlayer = getViewedOnlinePlayer();

  return viewedPlayer?.name ?? "Player";
}

function getCompactPhaseDayLabel() {
  return `${getCurrentPhaseLabel()} • ${getCurrentDayLabel()}`.toUpperCase();
}

function getOnlineSelfPublicPlayer() {
  const selfPlayerId = onlineClientState.playerId;

  if (!selfPlayerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[selfPlayerId] ?? null;
}

function getConnectedLobbyPlayers() {
  const state = onlineClientState.roomState;

  if (!state) return [];

  return playerIds
    .map((playerId) => state.players[playerId])
    .filter((player) => player.isConnected);
}

function canCurrentPlayerStartRoom() {
  const state = onlineClientState.roomState;

  if (!state || state.phase !== "lobby") return false;
  if (onlineClientState.playerId !== "p1") return false;

  const connectedPlayers = getConnectedLobbyPlayers();

  return connectedPlayers.length > 0 && connectedPlayers.every((player) => player.isReady);
}

function renderAuthScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-card">
        <div class="auth-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Đăng nhập</h1>
          <p>Đăng nhập tài khoản để tạo phòng, join room và reconnect theo người chơi thật.</p>
        </div>

        <div class="auth-card__grid">
          <form id="auth-login-form" class="auth-form">
            <h2>Đăng nhập</h2>
            <label>
              Username
              <input id="auth-login-username" autocomplete="username" placeholder="an" />
            </label>
            <label>
              Password
              <input id="auth-login-password" autocomplete="current-password" type="password" placeholder="••••••" />
            </label>
            <button type="submit">Đăng nhập</button>
          </form>

          <form id="auth-register-form" class="auth-form">
            <h2>Đăng ký</h2>
            <label>
              Tên hiển thị
              <input id="auth-register-display-name" placeholder="An" maxlength="18" />
            </label>
            <label>
              Username
              <input id="auth-register-username" autocomplete="username" placeholder="an" />
            </label>
            <label>
              Password
              <input id="auth-register-password" autocomplete="new-password" type="password" placeholder="ít nhất 6 ký tự" />
            </label>
            <button type="submit">Tạo tài khoản</button>
          </form>
        </div>

        <div id="auth-status" class="auth-card__status" aria-live="polite"></div>

        <p class="auth-card__note">
          Bản này lưu user local trên server bằng file JSON và hash password bằng PBKDF2.
          Khi deploy thật, có thể chuyển sang PostgreSQL/Prisma mà không đổi flow UI.
        </p>
      </section>
    </main>
  `;
}

function renderOnlineEntryScreen() {
  const savedSession = getSavedOnlineSession();

  return `
    <main class="online-entry-screen">
      <section class="online-entry-card">
        <div class="online-entry-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Online Room</h1>
          <p>Tạo phòng, mời bạn bè bằng mã phòng, rồi bắt đầu khi mọi người sẵn sàng.</p>
          <p class="online-entry-card__welcome">
            Xin chào, <strong>${authClientState.user?.displayName ?? authClientState.user?.username ?? "Nhà Lữ Hành"}</strong>
          </p>
          <button
            type="button"
            class="online-entry-card__back"
            onclick="event.stopPropagation(); window.gotoDashboard()"
          >
            ← Quay lại trang chủ
          </button>
        </div>

        <div class="online-entry-grid">
          <form class="online-entry-form" onsubmit="event.preventDefault(); event.stopPropagation(); window.createRoomFromLobby()">
            <h2>Tạo phòng</h2>
            <label>
              Tên của bạn
              <input id="lobby-create-name" value="${authClientState.user?.displayName ?? "An"}" maxlength="18" />
            </label>
            <button
              type="button"
              onclick="event.preventDefault(); event.stopPropagation(); window.createRoomFromLobby()"
            >
              Tạo phòng
            </button>
          </form>

          <form class="online-entry-form" onsubmit="event.preventDefault(); event.stopPropagation(); window.joinRoomFromLobby()">
            <h2>Vào phòng</h2>
            <label>
              Tên của bạn
              <input id="lobby-join-name" value="${authClientState.user?.displayName ?? "Player"}" maxlength="18" />
            </label>
            <label>
              Room code
              <input id="lobby-room-code" placeholder="ABC123" maxlength="8" />
            </label>
            <button
              type="button"
              onclick="event.preventDefault(); event.stopPropagation(); window.joinRoomFromLobby()"
            >
              Join phòng
            </button>
            <p class="online-entry-form__note">Slot offline đã có chủ chỉ có thể quay lại bằng Reconnect, không join lại bằng code.</p>
          </form>
        </div>

        ${
          savedSession
            ? `
              <div class="online-entry-card__resume">
                <div>
                  <strong>Phiên cũ</strong>
                  <span>Room ${savedSession.roomId} • ${savedSession.playerId} • ${savedSession.playerName}</span>
                </div>
                <button onclick="event.stopPropagation(); reconnectSavedRoomFromLobby()">Reconnect</button>
                <button class="online-entry-card__ghost" onclick="event.stopPropagation(); clearSavedRoomFromLobby()">Xóa lưu</button>
              </div>
            `
            : ""
        }
      </section>
    </main>
  `;
}

function renderOnlineLobbyRoomScreen() {
  const state = onlineClientState.roomState;
  const selfPlayer = getOnlineSelfPublicPlayer();
  const isHost = onlineClientState.playerId === "p1";
  const canStart = canCurrentPlayerStartRoom();

  if (!state || state.phase !== "lobby") {
    return "";
  }

  const playersHtml = playerIds
    .map((playerId) => {
      const player = state.players[playerId];
      const isSelf = playerId === onlineClientState.playerId;

      const slotClass = player.isConnected
        ? "is-connected"
        : player.hasJoined
          ? "is-offline"
          : "is-empty";
      const statusText = player.isConnected
        ? player.isReady
          ? "READY"
          : "WAIT"
        : player.hasJoined
          ? "OFFLINE"
          : "-";

      const hasOccupiedSlot = player.isConnected || player.hasJoined;
      const playerDisplayName = hasOccupiedSlot ? player.name : "Đang chờ...";

      return `
        <div class="online-lobby-player ${slotClass} ${isSelf ? "is-self" : ""}">
          <div class="online-lobby-player__slot">${playerId.toUpperCase()}</div>
          <div class="online-lobby-player__info">
            <strong>${playerDisplayName}</strong>
            <span>${player.isConnected ? player.isReady ? "Sẵn sàng" : "Chưa sẵn sàng" : player.hasJoined ? "Đã offline • giữ slot" : "Trống"}</span>
          </div>
          <div class="online-lobby-player__status ${player.isReady ? "is-ready" : ""} ${player.hasJoined && !player.isConnected ? "is-offline" : ""}">${statusText}</div>
        </div>
      `;
    })
    .join("");

  return `
    <main class="online-lobby-screen">
      <section class="online-lobby-card">
        <div class="online-lobby-card__header">
          <div>
            <span>ONLINE ROOM</span>
            <h1>${state.roomId}</h1>
            <p>Bạn là ${onlineClientState.playerId?.toUpperCase()} • ${selfPlayer?.name ?? "Player"}</p>
          </div>

          <div class="online-lobby-card__header-actions">
            <button class="online-lobby-card__copy" onclick="event.stopPropagation(); copyRoomCodeFromLobby()">Copy code</button>
            <button class="online-lobby-card__leave" onclick="event.stopPropagation(); leaveRoomFromLobby()">Thoát phòng</button>
          </div>
        </div>

        <div class="online-lobby-card__players">
          ${playersHtml}
        </div>

        <div class="online-lobby-card__actions">
          <button
            class="online-lobby-card__ready ${selfPlayer?.isReady ? "is-ready" : ""}"
            onclick="event.stopPropagation(); toggleReadyFromLobby()"
          >
            ${selfPlayer?.isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
          </button>

          <button
            class="online-lobby-card__start"
            ${isHost && canStart ? "" : "disabled"}
            onclick="event.stopPropagation(); startOnlineGame()"
            title="${isHost ? "Cần tất cả người chơi connected sẵn sàng." : "Chỉ host P1 được bắt đầu."}"
          >
            Bắt đầu
          </button>
        </div>

        <div class="online-lobby-card__hint">
          Host là P1. Tất cả người chơi đang trong phòng cần bấm Sẵn sàng trước khi bắt đầu.
        </div>
      </section>
    </main>
  `;
}


function getOnlinePlayerBoard(playerId?: PlayerId) {
  return getOnlinePlayer(playerId)?.board ?? null;
}

function getCurrentOnlinePlayerId(): PlayerId {
  return getViewedPlayerId();
}

function getOnlineScoreForPlayer(playerId?: PlayerId): number | null {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId]?.score ?? null;
}

function getOnlineSelfScore(): number | null {
  return getOnlineScoreForPlayer(getViewedPlayerId());
}


function getKnownOnlineCardById(cardId: string): TravelCardData | null {
  const onlineSelf = getOnlineSelfState();

  const allKnownCards = [
    ...(onlineDraftDisplayPool ?? []),
    ...(onlineDraftPendingPool ?? []),
    ...(onlineSelf?.draftPool ?? []),
    ...(onlineSelf?.pickedDraftCards ?? []),
    ...(onlineSelf?.hand ?? []),
    ...playerIds.reduce<TravelCardData[]>((cards, playerId) => {
      const player = getOnlinePlayer(playerId);

      cards.push(...((player?.draftPool as TravelCardData[] | undefined) ?? []));
      cards.push(...((player?.pickedDraftCards as TravelCardData[] | undefined) ?? []));
      cards.push(...((player?.hand as TravelCardData[] | undefined) ?? []));

      return cards;
    }, []),
    ...playerHand,
    ...initialDeck,
  ] as TravelCardData[];

  return allKnownCards.find((card) => card.id === cardId) ?? null;
}

function createCardFromPublicBoardCell(cell: {
  cardId: string;
  name?: string;
  tag: string;
  icon: string;
  vp: number;
  coin?: number;
  stamina?: number;
  image?: string;
  type?: "card" | "debt" | "lock";
  debtAmount?: number;
  lockedReason?: string;
  sourceCardName?: string;
}): TravelCardData {
  const knownCard = getKnownOnlineCardById(cell.cardId);

  // Online board cells explicitly use type="card". Hydrate those compact
  // public cells from the canonical phase data so focused previews retain
  // their description, rarity and secondary tags after leaving the hand.
  if (knownCard && (cell.type === undefined || cell.type === "card")) {
    return knownCard;
  }

  if (cell.type === "debt") {
    return {
      ...createDebtTokenCard({
        rowIndex: 0,
        colIndex: 0,
        amount: cell.debtAmount ?? 0,
        sourceCardName: cell.sourceCardName ?? cell.name ?? "Lá đã vay",
        lockedReason: cell.lockedReason,
      }),
      id: cell.cardId,
    } as BoardTokenCard;
  }

  if (cell.type === "lock") {
    return {
      ...createExhaustLockTokenCard({
        rowIndex: 0,
        colIndex: 0,
        sourceCardName: cell.sourceCardName ?? cell.name ?? "Lá đã vay thể lực",
      }),
      id: cell.cardId,
    } as BoardTokenCard;
  }

  const fallbackName = cell.name ?? cell.cardId;
  const normalizedTag = cell.tag || "food";

  return {
    id: cell.cardId,
    name: fallbackName,
    shortName: fallbackName,
    city: "",
    shortCity: "",
    image: cell.image ?? images.food,
    rarity: "common",
    rarityLabel: "★",
    vp: cell.vp,
    coin: cell.coin ?? 0,
    stamina: cell.stamina ?? 0,
    tag: normalizedTag,
    tagLabel: normalizedTag,
    tags: [normalizedTag.toUpperCase()],
    icon: cell.icon,
    description: "",
    bonusText: "",
  };
}

function convertOnlineBoardToBoardSlots(playerId?: PlayerId): BoardSlots | null {
  const onlineBoard = getOnlinePlayerBoard(playerId);

  if (!onlineBoard) return null;

  return onlineBoard.map((row) => {
    return row.map((cell) => {
      if (!cell) return null;

      return createCardFromPublicBoardCell(cell);
    });
  });
}

function applyOnlineRoomStateToLocal() {
  const state = onlineClientState.roomState;

  if (!state) return;

  syncSelfPlanningConfirmLockFromServer();

  phaseNumber = state.phaseNumber ?? phaseNumber;
  currentDayIndex = Math.max(0, Math.min(PHASE_DAYS - 1, state.dayIndex));

  const onlineSelfPublicState = state.players[onlineClientState.playerId ?? currentPlayerId];

  if (onlineSelfPublicState) {
    accumulatedVP = onlineSelfPublicState.score;
  }

  rememberCurrentCertificatePhase();

  isDraftPhase = state.phase === "draft";
  isSimulationMode = state.phase === "simulation" || state.phase === "result" || state.phase === "gameover";
  isReplayComplete = state.phase === "result" || state.phase === "gameover";

  draftRound = state.draftRound;
  draftPickSecondsLeft = state.timer;
  remainingTurnSeconds = state.timer;

  if (isOnlineRoomActive()) {
    stopDraftTimer();
    stopTurnTimer();
    stopBotPlacementTimer();
  }

  const serverDraftPool = (state.self.draftPool as TravelCardData[] | undefined) ?? [];
  const onlinePoolSignature = getDraftPoolSignature(serverDraftPool);
  const hasDisplayPool = onlineDraftDisplayPool !== null && onlineDraftDisplayPool.length > 0;

  if (isOnlineRoomActive()) {
    const enteredDraft = state.phase === "draft" && lastOnlineAnimationPhase !== "draft";
    const pickedDraftCount = state.self.pickedDraftCards?.length ?? 0;
    const pickedIncreased = pickedDraftCount > lastOnlinePickedDraftCount;
    const draftRoundAdvanced = state.draftRound > lastOnlineAnimationDraftRound;

    /*
      Online draft tách 3 việc:
      - server pool: dữ liệu thật mới nhất
      - display pool: pool đang render trên màn hình
      - pending pool: pool mới chờ animation pass xong mới apply
      Như vậy lượt 2/3/4/5 có thể chạy animation trả bài vào deck trước,
      rồi mới hiện pool tiếp theo. Lượt 1 cũng không bị full rerender/reset khi chọn.
    */
    if (enteredDraft) {
      clearOnlineDraftAnimationTimer();
      resetDraftPoolCollapseState();
      draftHandPendingCardId = null;
      draftPoolFlyReturnCardId = null;
      onlineDraftPassSnapshotPool = null;

      setOnlineDraftDisplayPoolFromServer();

      /*
        Nếu tab đang ở background hoặc mình quay lại khi lượt draft đã chạy vài giây,
        KHÔNG chạy lại animation chia bài từ đầu. Nếu chạy lại, tab đó sẽ kẹt
        "Đang chia bài..." và không render pool chọn bài, dù server vẫn có bài.
      */
      const shouldSkipOnlineDealAnimation =
        document.visibilityState !== "visible" ||
        state.timer < DRAFT_PICK_SECONDS - 1;

      shouldActivateOnlineDealAnimation = !shouldSkipOnlineDealAnimation;
      shouldActivateOnlinePassAnimation = false;
      isInitialDealInProgress = !shouldSkipOnlineDealAnimation;
      isPassingDraftCards = false;
      hasPlayedOnlinePlanningDealAfterDraft = false;

      if (shouldSkipOnlineDealAnimation) {
        isDraftCenterDealing = false;
        draftDealVisualEndsAt = 0;
        onlineDraftAnimationTimerId = null;
      } else {
        const dealMs = getDraftCenterDealDurationMs(
          Math.max(1, serverDraftPool.length),
        );
        onlineDraftAnimationTimerId = window.setTimeout(() => {
          finishOnlineDraftDealVisualOnly();
        }, dealMs);
      }
    } else if (
      state.phase === "draft" &&
      lastOnlineAnimationPhase === "draft" &&
      (pickedIncreased || draftRoundAdvanced)
    ) {
      if (isPassingDraftCards && !isOnlineFinalDraftReturnAnimating) {
        if (serverDraftPool.length > 0) {
          onlineDraftPendingPool = [...serverDraftPool];
        }

        if (pickedIncreased && !isDraftPickFlying) {
          draftHandPendingCardId = null;
          draftPoolFlyReturnCardId = null;
        }
      } else if (!isOnlineFinalDraftReturnAnimating) {
        const snapshot =
          onlineDraftDisplayPool ??
          onlineDraftPassSnapshotPool ??
          (serverDraftPool.length > 0 ? [...serverDraftPool] : null);

        if (snapshot?.length) {
          beginOnlineDraftPoolPass(snapshot, serverDraftPool);
        } else if (!hasDisplayPool) {
          setOnlineDraftDisplayPoolFromServer();
        }
      }
    } else if (
      state.phase === "draft" &&
      serverDraftPool.length > 0 &&
      (!onlineDraftDisplayPool || onlineDraftDisplayPool.length === 0)
    ) {
      setOnlineDraftDisplayPoolFromServer();
    } else if (state.phase === "draft" && !hasDisplayPool) {
      setOnlineDraftDisplayPoolFromServer();
    }

    const isEnteringPlanningAfterDraft =
      state.phase === "planning" &&
      lastOnlineAnimationPhase === "draft" &&
      onlineDraftDisplayPool !== null &&
      onlineDraftDisplayPool.length > 0 &&
      !isOnlineFinalDraftReturnAnimating &&
      onlineFinalDraftReturnTimerId === null;

    if (isEnteringPlanningAfterDraft) {
      /*
        Lượt draft cuối: server đã chuyển sang planning, nhưng client giữ lại
        2 lá dư trong onlineDraftDisplayPool thêm 1 nhịp để chạy animation:
        gom bài -> bay vào deck. Không xóa display pool ngay.
      */
      clearOnlineDraftAnimationTimer();

      isOnlineFinalDraftReturnAnimating = true;
      isDraftPhase = true;
      isSimulationMode = false;
      isPassingDraftCards = true;
      isInitialDealInProgress = false;
      shouldActivateOnlinePassAnimation = true;
      shouldActivateOnlineDealAnimation = false;

      onlineFinalDraftReturnTimerId = window.setTimeout(() => {
        isOnlineFinalDraftReturnAnimating = false;
        isPassingDraftCards = false;
        onlineDraftDisplayPool = null;
        onlineDraftPendingPool = null;
        onlineFinalDraftReturnTimerId = null;
        lastOnlineRenderSignature = "";

        /*
          Sau khi 2 lá dư gom và bay về deck, mới hiện hand planning
          bằng animation chia bài bình thường.
        */
        playOnlinePlanningHandDealAfterDraft();
      }, 1550);
    }

    if (state.phase !== "draft" && !isOnlineFinalDraftReturnAnimating) {
      clearOnlineDraftAnimationTimer();

      onlineDraftDisplayPool = null;
      onlineDraftPassSnapshotPool = null;
      onlineDraftPendingPool = null;
      shouldActivateOnlineDealAnimation = false;
      shouldActivateOnlinePassAnimation = false;
      isInitialDealInProgress = false;
      isPassingDraftCards = false;
    }

    if (pickedDraftCount > lastOnlinePickedDraftCount && !isDraftPickFlying && !isPassingDraftCards) {
      draftHandPendingCardId = null;
      draftPoolFlyReturnCardId = null;
    }

    lastOnlinePickedDraftCount = pickedDraftCount;
    lastOnlineAnimationPhase = state.phase;
    lastOnlineAnimationDraftRound = state.draftRound;
    lastOnlineAnimationPoolSignature = onlinePoolSignature;
  }

  const shouldPlayPlanningDealFallback =
    isOnlineRoomActive() &&
    state.phase === "planning" &&
    lastOnlineAnimationPhase === "draft" &&
    !isOnlineFinalDraftReturnAnimating &&
    !hasPlayedOnlinePlanningDealAfterDraft;

  if (shouldPlayPlanningDealFallback) {
    playOnlinePlanningHandDealAfterDraft();
    return;
  }

  if (state.phase === "planning" && !isOnlineFinalDraftReturnAnimating) {
    const onlineHand = getOnlineSelfHand();

    if (onlineHand) {
      playerHand = [...onlineHand];
    }

    updatePlanningConfirmButtonVisualOnly();
  }

  if (state.phase === "draft") {
    playerHand = [];

    if (!isDraftPickFlying) {
      draftSelectedCardId = state.self.selectedDraftCardId;

      if (
        state.self.selectedDraftCardId &&
        !draftHandPendingCardId &&
        !isDraftDealVisualActive()
      ) {
        draftHandPendingCardId = state.self.selectedDraftCardId;
      }
    }

    if (!isDraftDealVisualActive() && !isDraftPickFlying) {
      updateDraftHandVisualOnly();
      updateDraftPoolFlownVisualOnly();
      updateDraftSelectedVisualOnly();
    }
  }

  if (state.phase === "simulation" || state.phase === "result") {
    if (isOnlineRoomActive() && !hasStartedOnlineSimulationReplay) {
      runOnlineSimulationReplay();
      return;
    }

    if (!simulationResult) {
      simulationResult = calculateSimulationResult();
      simulationReplayIndex = 0;
    }
  } else {
    simulationResult = null;
    simulationReplayIndex = 0;
    isReplayComplete = false;
    hasStartedOnlineSimulationReplay = false;
    hasAppliedSimulationScore = false;
  }
}

function getCurrentDayPlacedCards(dayIndex = currentDayIndex): TravelCardData[] {
  return getCurrentDayPlacedCardsFromSlots(getBoardSlots(), dayIndex);
}

const initialDeck = createInitialDeck();

const playerIds: PlayerId[] = ["p1", "p2", "p3", "p4"];
export const currentPlayerId: PlayerId = "p1";
let spectatingPlayerId: PlayerId | null = null;
let isOnlineRoomMenuOpen = false;

function createEmptyPlayerBoards(): Record<PlayerId, BoardSlots> {
  return {
    p1: createEmptyBoardSlots(),
    p2: createEmptyBoardSlots(),
    p3: createEmptyBoardSlots(),
    p4: createEmptyBoardSlots(),
  };
}

function createEmptyBotPlacedDays(): Record<PlayerId, Set<number>> {
  return {
    p1: new Set<number>(),
    p2: new Set<number>(),
    p3: new Set<number>(),
    p4: new Set<number>(),
  };
}

function getCurrentPlayerBoard(): BoardSlots {
  if (isOnlineRoomActive()) {
    const onlineBoard = convertOnlineBoardToBoardSlots(getCurrentOnlinePlayerId());

    if (onlineBoard) {
      return onlineBoard;
    }
  }

  return playerBoards[currentPlayerId];
}

function setCurrentPlayerBoard(nextBoard: BoardSlots) {
  playerBoards[currentPlayerId] = nextBoard;
}

export let phaseNumber = 1;
export let currentDayIndex = 0;
export let accumulatedVP = 0;
let discardedResourceBonus = {
  coin: 0,
  stamina: 0,
};
let eventResourceModifier = {
  coin: 0,
  stamina: 0,
};
let localCoinDebt = 0;
let hasAppliedFinalCoinDebtPenalty = false;
let hasAppliedSimulationScore = false;
let dayAdvanceTimerId: number | null = null;
let dailyDealTimerId: number | null = null;
let deck: TravelCardData[] = shuffleCards(initialDeck);
let playerHand: TravelCardData[] = [];
let isInitialDealInProgress = false;
let isDraftPhase = true;
let draftPlayers: DraftPlayerState[] = [];
let draftSelectedCardId: string | null = null;
let draftPickSecondsLeft = DRAFT_PICK_SECONDS;
let draftTimerId: number | null = null;
let isPassingDraftCards = false;
let isDraftPoolCollapsed = false;
let isDraftPoolCollapseAnimating = false;
let draftPoolCollapseAnimMode: "collapse" | "expand" | null = null;
let draftPoolCollapseTimerId: number | null = null;
let draftPassDisplayPool: TravelCardData[] | null = null;
let draftRound = 1;
let lastDraftPickResults: DraftPickResult[] = [];
let playerBoards: Record<PlayerId, BoardSlots> = createEmptyPlayerBoards();
let botPlacedDays: Record<PlayerId, Set<number>> = {
  p1: new Set<number>(),
  p2: new Set<number>(),
  p3: new Set<number>(),
  p4: new Set<number>(),
};
let botPlacementTimerId: number | null = null;

let selectedHandCardId: string | null = null;
let draggedHandCardId: string | null = null;
let handPointerDragState: HandPointerDragState | null = null;
let lastPlacedBoardPosition: BoardPosition | null = null;
let lastUtilityEffectFlash: {
  rowIndex: number;
  colIndex: number;
  type: "coin" | "stamina" | "vp";
  value: number;
  id: number;
} | null = null;
let resourceOrbFlashType: "coin" | "stamina" | "vp" | null = null;
let focusedHandCardId: string | null = null;
let focusedBoardCard: TravelCardData | null = null;
let focusedBoardPosition: BoardPosition | null = null;
let holdTimer: number | null = null;
let suppressNextClick = false;
let isSimulationMode = false;
export let simulationResult: SimulationResult | null = null;
let remainingTurnSeconds = TURN_DURATION_SECONDS;
let turnTimerId: number | null = null;
let simulationReplayIndex = 0;
let simulationReplayTimerId: number | null = null;
let isReplayComplete = false;
let isMidGameRankingOpen = false;
let hasPlayedDealAnimation = true;
let didMoveHandPointerDrag = false;
let lastPointerDownCardId: string | null = null;

export function getBoardSlots(): BoardSlots {
  return getCurrentPlayerBoard();
}

function getOpponentPlayerIds(): PlayerId[] {
  return playerIds.filter((playerId) => playerId !== currentPlayerId);
}

function getFirstEmptyBoardPosition(board: BoardSlots, preferredColIndex = currentDayIndex): BoardPosition | null {
  for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
    if (board[rowIndex]?.[preferredColIndex] === null) {
      return {
        rowIndex,
        colIndex: preferredColIndex,
      };
    }
  }

  for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex += 1) {
      if (board[rowIndex][colIndex] === null) {
        return {
          rowIndex,
          colIndex,
        };
      }
    }
  }

  return null;
}

function cloneCardForBot(card: TravelCardData, playerId: PlayerId, index: number): TravelCardData {
  return {
    ...card,
    id: `${card.id}_${playerId}_${currentDayIndex}_${index}_${Date.now()}`,
  };
}

function getBotSourceCards(playerId: PlayerId): TravelCardData[] {
  const draftIndexByPlayerId: Record<PlayerId, number> = {
    p1: 1,
    p2: 0,
    p3: 2,
    p4: 3,
  };

  const draftPlayer = draftPlayers[draftIndexByPlayerId[playerId]];
  const pickedCards = draftPlayer?.picked ?? [];

  if (pickedCards.length > 0) {
    return pickedCards;
  }

  return initialDeck;
}

function placeOneBotCard(playerId: PlayerId, card: TravelCardData, index: number) {
  const board = playerBoards[playerId];
  const position = getFirstEmptyBoardPosition(board, currentDayIndex);

  if (!position) return;

  board[position.rowIndex][position.colIndex] = cloneCardForBot(card, playerId, index);
}

function countBotCardsInCurrentDay(playerId: PlayerId): number {
  let count = 0;
  const board = playerBoards[playerId];

  for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
    if (board[rowIndex]?.[currentDayIndex] !== null) {
      count += 1;
    }
  }

  return count;
}

function stopBotPlacementTimer() {
  if (botPlacementTimerId !== null) {
    window.clearInterval(botPlacementTimerId);
    botPlacementTimerId = null;
  }
}

function hasBotPlacementAvailable(): boolean {
  return getOpponentPlayerIds().some((playerId) => {
    return countBotCardsInCurrentDay(playerId) < 3;
  });
}

function placeNextRealtimeBotMove() {
  if (isOnlineRoomActive()) {
    stopBotPlacementTimer();
    return;
  }

  if (isDraftPhase || isSimulationMode || isInitialDealInProgress) {
    stopBotPlacementTimer();
    return;
  }

  const opponentIds = getOpponentPlayerIds();
  const availablePlayerIds = opponentIds.filter((playerId) => {
    return countBotCardsInCurrentDay(playerId) < 3;
  });

  if (availablePlayerIds.length === 0) {
    for (const playerId of opponentIds) {
      botPlacedDays[playerId].add(currentDayIndex);
    }

    stopBotPlacementTimer();
    return;
  }

  const playerId = availablePlayerIds[Math.floor(Math.random() * availablePlayerIds.length)];
  const sourceCards = getBotSourceCards(playerId);
  const currentCount = countBotCardsInCurrentDay(playerId);
  const sourceCard = sourceCards[currentCount % Math.max(1, sourceCards.length)] ?? initialDeck[0];

  if (!sourceCard) {
    stopBotPlacementTimer();
    return;
  }

  placeOneBotCard(playerId, sourceCard, currentCount);
  rerenderArena();
}

function startRealtimeBotPlacement() {
  stopBotPlacementTimer();

  if (isOnlineRoomActive()) return;
  if (isDraftPhase || isSimulationMode || isInitialDealInProgress) return;
  if (!hasBotPlacementAvailable()) return;

  /*
    Local fake realtime:
    Cứ mỗi ~1.1s sẽ có 1 người chơi phụ xếp 1 lá.
    Khi lên online thật, đoạn này sẽ được thay bằng socket event "board:updated".
  */
  botPlacementTimerId = window.setInterval(() => {
    placeNextRealtimeBotMove();
  }, 1100);
}

function placeBotCardsForCurrentDay() {
  if (isOnlineRoomActive()) return;

  /*
    Bản cũ fill bot ngay lập tức nên nhìn không giống real-time.
    Bản mới chỉ khởi động timer, bot sẽ lần lượt đặt icon lên side board.
  */
  startRealtimeBotPlacement();
}

function placeBotCardsAfterPlayerMove(sourceCard: TravelCardData) {
  if (isOnlineRoomActive()) return;

  const opponentIds = getOpponentPlayerIds();

  opponentIds.forEach((playerId, index) => {
    if (countBotCardsInCurrentDay(playerId) >= 3) return;

    placeOneBotCard(playerId, sourceCard, index);
  });
}

function getPlayerBoardUsedSlots(playerId: PlayerId): number {
  let usedSlots = 0;

  for (const row of playerBoards[playerId]) {
    for (const card of row) {
      if (card) usedSlots += 1;
    }
  }

  return usedSlots;
}

function isLastPlacedBoardCell(rowIndex: number, colIndex: number) {
  return (
    lastPlacedBoardPosition !== null &&
    lastPlacedBoardPosition.rowIndex === rowIndex &&
    lastPlacedBoardPosition.colIndex === colIndex
  );
}

function getPlacedCards(): TravelCardData[] {
  return getPlacedCardsFromSlots(getBoardSlots());
}

function calculateScoreBreakdown(): ScoreBreakdown {
  return calculateScoreBreakdownFromCards({
    placedCards: getCurrentDayPlacedCards(),
    getBoardDisplayName,
  });
}

function stopSimulationReplayTimer() {
  if (simulationReplayTimerId !== null) {
    window.clearInterval(simulationReplayTimerId);
    simulationReplayTimerId = null;
  }
}

function getCurrentReplayStep() {
  if (!simulationResult || simulationResult.replaySteps.length === 0) {
    return null;
  }

  return simulationResult.replaySteps[
    Math.min(simulationReplayIndex, simulationResult.replaySteps.length - 1)
  ];
}

function isBadSimulationReplayStep(step: SimulationReplayStep | null) {
  if (!step) return false;

  const stepData = step as SimulationReplayStep & {
    isNegativeEvent?: boolean;
  };

  /*
    Event xấu hiện tại:
    - traffic: kẹt xe
    - storm: mưa giông
    - distance: khoảng cách > 20km
    - promo là event tốt nên không dùng scanBad.
  */
  return (
    stepData.isBadEvent === true ||
    stepData.isNegativeEvent === true ||
    stepData.eventType === "traffic" ||
    stepData.eventType === "storm" ||
    stepData.eventType === "distance"
  );
}

function getSimulationEventSoundName(step: SimulationReplayStep | null): GameSoundName | null {
  if (!step?.eventType) return null;

  if (step.eventType === "promo") return "eventPromo";
  if (step.eventType === "traffic") return "eventTraffic";
  if (step.eventType === "storm") return "eventStorm";
  if (step.eventType === "distance") return "eventDistance";

  return null;
}

function playSimulationScanSoundForCurrentStep() {
  const step = getCurrentReplayStep();

  if (!step) return;

  const eventSoundName = getSimulationEventSoundName(step);

  /*
    Event có sound riêng.
    Ô bình thường vẫn dùng ding scan.
  */
  playGameSound(eventSoundName ?? (isBadSimulationReplayStep(step) ? "scanBad" : "scanCell"));
}

function buildSimulationReplaySteps() {
  return buildSimulationReplayStepsFromBoard({
    boardSlots: getBoardSlots(),
    currentDayIndex,
    dayLabel: getCurrentDayLabel(),
    rows,
    getCardTagKeys,
    countCardsWithTag,
    getCurrentDayPlacedCards,
  });
}

function calculateSimulationResult(): SimulationResult {
  return calculateSimulationResultFromBoard({
    boardSlots: getBoardSlots(),
    currentDayIndex,
    dayLabel: getCurrentDayLabel(),
    rows,
    getBoardDisplayName,
    getCardTagKeys,
    countCardsWithTag,
    getCurrentDayPlacedCards,
    // Tutorial ngày 1: ép 1 sự kiện ngẫu nhiên xuất hiện để giới thiệu.
    forceTutorialEvent:
      onlineClientState.roomState?.isTutorial === true && currentDayIndex === 0,
  });
}

export function getCurrentScoreBreakdown(): ScoreBreakdown {
  if (!simulationResult) {
    return calculateScoreBreakdown();
  }

  return {
    baseVP: simulationResult.baseVP,
    bonusVP: simulationResult.bonusVP,
    totalVP: simulationResult.finalVP,
    spentCoin: simulationResult.spentCoin,
    spentStamina: simulationResult.spentStamina + getSimulationEventStaminaPenalty(simulationResult),
    usedSlots: simulationResult.usedSlots,
    lines: simulationResult.lines,
  };
}

function getBoardTotals(): BoardTotals {
  const breakdown = simulationResult
    ? getCurrentScoreBreakdown()
    : calculateScoreBreakdown();

  return {
    // Điểm chỉ cộng vào tổng sau khi replay ngày hiện tại chạy xong.
    vp: accumulatedVP,
    coin: breakdown.spentCoin,
    stamina: breakdown.spentStamina,
    usedSlots: breakdown.usedSlots,
  };
}

function getPlayersLeft() {
  const totals = getBoardTotals();

  return playersLeftBase.map((player) => {
    if (!player.active) {
      return {
        ...player,
        usedSlots: player.id ? getPlayerBoardUsedSlots(player.id) : player.usedSlots,
      };
    }

    const remaining = getRemainingResources();

    return {
      ...player,
      score: totals.vp,
      coin: Math.max(0, remaining.coin),
      stamina: Math.max(0, remaining.stamina),
      usedSlots: totals.usedSlots,
    };
  });
}

function getPlayersRight() {
  return playersRight.map((player) => {
    return {
      ...player,
      usedSlots: player.id ? getPlayerBoardUsedSlots(player.id) : player.usedSlots,
    };
  });
}

export function getRemainingResources() {
  /*
    Online phải lấy trực tiếp coin/stamina từ server state.
    Trước đó hàm này vẫn tính STARTING - cost trên board nên discard ở server đã cộng tài nguyên
    nhưng UI orb không đổi.
  */
  if (isOnlineRoomActive()) {
    const onlineResourcePlayer = getViewedOnlinePlayer() ?? getOnlineSelfPublicPlayer();

    if (onlineResourcePlayer) {
      return {
        coin: onlineResourcePlayer.coin,
        stamina: onlineResourcePlayer.stamina,
      };
    }
  }

  const remaining = getRemainingResourcesFromTotals({
    totals: getBoardTotals(),
    startingCoin: STARTING_COIN,
    startingStamina: STARTING_STAMINA,
  });

  return {
    coin: remaining.coin + discardedResourceBonus.coin + eventResourceModifier.coin,
    stamina: remaining.stamina + discardedResourceBonus.stamina + eventResourceModifier.stamina,
  };
}

function getCardAffordability(card: TravelCardData) {
  return getCardAffordabilityFromResources({
    card,
    remaining: getRemainingResources(),
  });
}

function getCardAffordabilityMessage(card: TravelCardData) {
  return getCardAffordabilityMessageFromResources(getCardAffordability(card));
}

function drawNextCard() {
  const nextCard = deck.shift();

  if (nextCard) {
    playerHand.push(nextCard);
  }
}

function getTextFitClass(
  text: string,
  baseClass: string,
  mediumThreshold: number,
  longThreshold: number
) {
  const len = text.trim().length;

  if (len >= longThreshold) return `${baseClass} ${baseClass}--xs`;
  if (len >= mediumThreshold) return `${baseClass} ${baseClass}--sm`;
  return baseClass;
}

function getHandTitleClass(name: string) {
  return getTextFitClass(name, "framed-card-face__name", 16, 23);
}

function getBoardTitleClass(name: string) {
  return getTextFitClass(name, "board-mini__name", 12, 18);
}

function getBoardCityClass(city: string) {
  return getTextFitClass(city, "board-mini__city", 12, 21);
}

function getBoardDisplayName(card: TravelCardData) {
  return card.shortName?.trim() || card.name;
}

function getBoardDisplayCity(card: TravelCardData) {
  return card.shortCity?.trim() || card.city;
}

type BoardTokenCard = TravelCardData & {
  boardTokenType?: "debt" | "lock";
  debtAmount?: number;
  lockedReason?: string;
  sourceCardName?: string;
};

function getBoardTokenType(card: TravelCardData | null) {
  return (card as BoardTokenCard | null)?.boardTokenType ?? null;
}

function isBoardDebtToken(card: TravelCardData | null) {
  return getBoardTokenType(card) === "debt";
}

function isBoardLockToken(card: TravelCardData | null) {
  return getBoardTokenType(card) === "lock";
}

function canPlaceOnBoardCell(rowIndex: number, colIndex: number) {
  if (isSpectatingOnlinePlayer()) return false;

  const cell = getBoardSlots()[rowIndex]?.[colIndex] ?? null;

  return cell === null;
}

function createDebtTokenCard(params: {
  rowIndex: number;
  colIndex: number;
  amount: number;
  sourceCardName: string;
  lockedReason?: string;
}): TravelCardData {
  return {
    id: `debt_token_${params.rowIndex}_${params.colIndex}_${Date.now()}`,
    name: params.lockedReason ? "Nợ + Kiệt sức" : "Token Nợ",
    shortName: params.lockedReason ? "Nợ + Kiệt sức" : "Token Nợ",
    city: `Trả ${params.amount} xu`,
    shortCity: `Trả ${params.amount} xu`,
    image: images.food,
    rarity: "common",
    rarityLabel: "!",
    vp: 0,
    coin: 0,
    stamina: 0,
    tag: "utility",
    tagLabel: "Nợ",
    tags: ["UTILITY"],
    icon: "💸",
    description: `Bấm để trả ${params.amount} xu. Nếu không trả trước khi hết ngày sẽ bị -20 VP.`,
    bonusText: "Không trả nợ: -20 VP",
    boardTokenType: "debt",
    debtAmount: params.amount,
    lockedReason: params.lockedReason,
    sourceCardName: params.sourceCardName,
  } as BoardTokenCard;
}

function createExhaustLockTokenCard(params: {
  rowIndex: number;
  colIndex: number;
  sourceCardName: string;
}): TravelCardData {
  return {
    id: `exhaust_lock_${params.rowIndex}_${params.colIndex}_${Date.now()}`,
    name: "Bị khóa",
    shortName: "Bị khóa",
    city: "Kiệt sức",
    shortCity: "Kiệt sức",
    image: images.food,
    rarity: "common",
    rarityLabel: "!",
    vp: 0,
    coin: 0,
    stamina: 0,
    tag: "utility",
    tagLabel: "Khóa",
    tags: ["UTILITY"],
    icon: "🔒",
    description: `Ô này bị khóa vì đã vay thể lực ở ${params.sourceCardName}.`,
    bonusText: "Không thể xếp bài vào ô này.",
    boardTokenType: "lock",
    lockedReason: "Kiệt sức",
    sourceCardName: params.sourceCardName,
  } as BoardTokenCard;
}

function getNextTimeSlotPosition(rowIndex: number, colIndex: number): BoardPosition | null {
  if (rowIndex < rows.length - 1) {
    return {
      rowIndex: rowIndex + 1,
      colIndex,
    };
  }

  if (colIndex < PHASE_DAYS - 1) {
    return {
      rowIndex: 0,
      colIndex: colIndex + 1,
    };
  }

  return null;
}

function addLocalDebtOrExhaustToken(params: {
  rowIndex: number;
  colIndex: number;
  card: TravelCardData;
  coinDebt: number;
  staminaDebt: number;
}) {
  if (params.coinDebt > 0) {
    localCoinDebt += params.coinDebt;
  }

  if (params.staminaDebt <= 0) return;

  const nextPosition = getNextTimeSlotPosition(params.rowIndex, params.colIndex);

  if (!nextPosition) return;
  if (getBoardSlots()[nextPosition.rowIndex]?.[nextPosition.colIndex] !== null) return;

  getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] = createExhaustLockTokenCard({
    rowIndex: nextPosition.rowIndex,
    colIndex: nextPosition.colIndex,
    sourceCardName: params.card.name,
  });
}

function payLocalDebtToken(rowIndex: number, colIndex: number, card: TravelCardData) {
  const token = card as BoardTokenCard;
  const debtAmount = token.debtAmount ?? 0;
  const remaining = getRemainingResources();

  if (debtAmount <= 0) return;

  if (remaining.coin < debtAmount) {
    alert(`Không đủ xu để trả nợ. Cần ${debtAmount} xu.`);
    return;
  }

  eventResourceModifier = {
    ...eventResourceModifier,
    coin: eventResourceModifier.coin - debtAmount,
  };

  getBoardSlots()[rowIndex][colIndex] = null;
  playGameSound("eventPromo");
  rerenderArena();
}

function payDebtToken(rowIndex: number, colIndex: number, card: TravelCardData) {
  if (isSpectatingOnlinePlayer()) {
    focusedBoardCard = card;
    focusedBoardPosition = { rowIndex, colIndex };
    rerenderArena();
    return;
  }

  if (colIndex !== currentDayIndex) {
    focusedBoardCard = card;
    focusedBoardPosition = { rowIndex, colIndex };
    rerenderArena();
    return;
  }

  if (isOnlineRoomActive()) {
    sendPayDebt({
      rowIndex,
      colIndex,
    });
    return;
  }

  payLocalDebtToken(rowIndex, colIndex, card);
}

function clearLocalGeneratedTokenForReturnedCard(rowIndex: number, colIndex: number, card: TravelCardData) {
  const nextPosition = getNextTimeSlotPosition(rowIndex, colIndex);

  if (!nextPosition) return;

  const nextCell = getBoardSlots()[nextPosition.rowIndex]?.[nextPosition.colIndex] ?? null;
  const token = nextCell as BoardTokenCard | null;

  if (
    token &&
    token.boardTokenType === "lock" &&
    token.sourceCardName === card.name
  ) {
    getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] = null;
  }
}

function getFocusedTitleClass(name: string) {
  return getTextFitClass(name, "framed-card-face__name", 18, 25);
}

const CARD_FRAME_NAME_BY_TAG: Record<string, string> = {
  action: "action",
  experience: "action",
  culture: "culture",
  food: "food",
  utility: "utility",
};

function getCardFrameName(card: TravelCardData) {
  const primaryTag = (card.tag || card.tags?.[0] || "food").toLowerCase();

  return CARD_FRAME_NAME_BY_TAG[primaryTag] ?? "food";
}

function getCardFramePath(card: TravelCardData) {
  return `./assets/cardFrames/${getCardFrameName(card)}.png`;
}

function getCardEnvironmentTagLabel(card: TravelCardData) {
  const tags = new Set((card.tags ?? []).map((tag) => tag.toUpperCase()));
  const labels: string[] = [];

  if (tags.has("INDOOR")) labels.push("Trong nhà");
  if (tags.has("OUTDOOR")) labels.push("Ngoài trời");

  return labels.join(" / ");
}

function renderFramedCardFace(card: TravelCardData, mode: "hand" | "focused") {
  const titleClass = mode === "focused"
    ? getFocusedTitleClass(card.name)
    : getHandTitleClass(card.name);
  const titleMarkup = mode === "focused"
    ? `<h2 class="${titleClass}"><span>${card.name}</span></h2>`
    : `<h3 class="${titleClass}"><span>${card.name}</span></h3>`;
  const frameName = getCardFrameName(card);
  const environmentTagLabel = getCardEnvironmentTagLabel(card);

  return `
    <div class="framed-card-face framed-card-face--${mode} framed-card-face--frame-${frameName}">
      <div
        class="framed-card-face__photo"
        style="background-image: ${getCardBackgroundImage(card)}"
        role="img"
        aria-label="${card.name}"
      ></div>

      <img
        class="framed-card-face__frame"
        src="${getCardFramePath(card)}"
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      ${titleMarkup}
      <div class="framed-card-face__vp">${card.vp}</div>
      ${
        environmentTagLabel
          ? `<div class="framed-card-face__pill framed-card-face__pill--environment">${environmentTagLabel}</div>`
          : ""
      }
      <div class="framed-card-face__pill framed-card-face__pill--rarity">${card.rarityLabel}</div>
      <div class="framed-card-face__cost framed-card-face__cost--coin">${card.coin}</div>
      <div class="framed-card-face__cost framed-card-face__cost--stamina">${card.stamina}</div>
      <div class="framed-card-face__description">${card.description}</div>
    </div>
  `;
}

function getHandCardById(id: string | null) {
  if (!id) return null;

  if (isSpectatingOnlinePlayer()) {
    const spectateHandCard = getSpectateHandCards().find((card) => card.id === id) ?? null;

    if (spectateHandCard) {
      return spectateHandCard;
    }
  }

  if (isOnlineRoomActive()) {
    const onlineDraftCard = getOnlineSelfDraftPool()?.find((card) => card.id === id) ?? null;

    if (onlineDraftCard) {
      return onlineDraftCard;
    }

    const onlineHandCard = getOnlineSelfHand()?.find((card) => card.id === id) ?? null;

    if (onlineHandCard) {
      return onlineHandCard;
    }
  }

  if (isDraftPhase) {
    const draftCard = getCurrentDraftPlayer()?.pool.find((card) => card.id === id) ?? null;

    if (draftCard) {
      return draftCard;
    }
  }

  return playerHand.find((card) => card.id === id) ?? null;
}

function getBoardCardByPosition(rowIndex: number, colIndex: number): TravelCardData | null {
  return getBoardCardByPositionFromSlots(getBoardSlots(), rowIndex, colIndex);
}

function isCardBonusActive(card: TravelCardData) {
  const placedCards = getCurrentDayPlacedCards();
  const tagKeys = getCardTagKeys(card);

  if (tagKeys.includes("FOOD") && countCardsWithTag(placedCards, "FOOD") >= 2) {
    return true;
  }

  if (tagKeys.includes("CULTURE") && countCardsWithTag(placedCards, "CULTURE") >= 2) {
    return true;
  }

  if (tagKeys.includes("ACTION") && countCardsWithTag(placedCards, "ACTION") >= 2) {
    return true;
  }

  return card.onPlayEffect?.has_effect === true && card.onPlayEffect.effect_type === "GAIN_VP";
}

function getCardBonusBadge(card: TravelCardData) {
  const tagKeys = getCardTagKeys(card);

  if (card.onPlayEffect?.has_effect && card.onPlayEffect.effect_type === "GAIN_VP") {
    return `+${card.onPlayEffect.effect_value} VP`;
  }

  if (tagKeys.includes("FOOD")) {
    return "+5 VP";
  }

  if (tagKeys.includes("CULTURE")) {
    return "+8 VP";
  }

  if (tagKeys.includes("ACTION")) {
    return "+10 VP";
  }

  return "";
}


function stripCardText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getUtilityPlacementEffect(card: TravelCardData) {
  const effect = card.onPlayEffect;
  const tags = getCardTagKeys(card);
  const isUtilityCard =
    tags.includes("UTILITY") ||
    String(card.tag || "").toLowerCase() === "utility" ||
    stripCardText(card.tagLabel || "").toLowerCase().includes("tiện ích");

  const fullText = stripCardText(
    [
      card.name,
      card.shortName || "",
      card.description || "",
      card.bonusText || "",
      card.tagLabel || "",
    ].join(" ")
  ).toLowerCase();

  const explicitValue = Number(effect?.effect_value ?? 0);
  const numberMatch = fullText.match(/(?:\+|nhận|hoi|hồi|cộng|thêm)\s*(\d+)/i);
  const inferredValue = numberMatch ? Number(numberMatch[1]) : 1;
  const value = explicitValue > 0 ? explicitValue : inferredValue;

  if (effect?.has_effect) {
    if (effect.effect_type === "RECOVER_XU") {
      return {
        type: "coin" as const,
        value,
        label: `+${value} Xu`,
        icon: "🪙",
      };
    }

    if (effect.effect_type === "RECOVER_LA") {
      return {
        type: "stamina" as const,
        value,
        label: `+${value} Thể lực`,
        icon: "⚡",
      };
    }

    if (effect.effect_type === "GAIN_VP") {
      return {
        type: "vp" as const,
        value,
        label: `+${value} VP`,
        icon: "★",
      };
    }
  }

  /*
    Fallback cho data utility nếu mapper/server chưa truyền onPlayEffect.
    Đọc mô tả/bonus để vẫn hiện đúng hiệu ứng.
  */
  if (!isUtilityCard) return null;

  if (
    fullText.includes("xu") ||
    fullText.includes("tiền") ||
    fullText.includes("coin") ||
    fullText.includes("gold")
  ) {
    return {
      type: "coin" as const,
      value,
      label: `+${value} Xu`,
      icon: "🪙",
    };
  }

  if (
    fullText.includes("thể lực") ||
    fullText.includes("the luc") ||
    fullText.includes("năng lượng") ||
    fullText.includes("nang luong") ||
    fullText.includes("stamina") ||
    fullText.includes("nl")
  ) {
    return {
      type: "stamina" as const,
      value,
      label: `+${value} Thể lực`,
      icon: "⚡",
    };
  }

  if (fullText.includes("vp") || fullText.includes("điểm") || fullText.includes("diem")) {
    return {
      type: "vp" as const,
      value,
      label: `+${value} VP`,
      icon: "★",
    };
  }

  return {
    type: "vp" as const,
    value,
    label: `+${value} VP`,
    icon: "★",
  };
}

function triggerUtilityEffectFlash(params: {
  rowIndex: number;
  colIndex: number;
  type: "coin" | "stamina" | "vp";
  value: number;
}) {
  const flashId = Date.now();

  lastUtilityEffectFlash = {
    ...params,
    id: flashId,
  };
  resourceOrbFlashType = params.type;

  window.setTimeout(() => {
    if (lastUtilityEffectFlash?.id === flashId) {
      lastUtilityEffectFlash = null;
    }

    if (resourceOrbFlashType === params.type) {
      resourceOrbFlashType = null;
    }

    rerenderArena();
  }, 1050);
}

function applyUtilityPlacementEffect(card: TravelCardData, rowIndex: number, colIndex: number) {
  const effect = getUtilityPlacementEffect(card);

  if (!effect) return false;

  if (effect.type === "coin") {
    eventResourceModifier = {
      ...eventResourceModifier,
      coin: eventResourceModifier.coin + effect.value,
    };
    playGameSound("eventPromo");
  } else if (effect.type === "stamina") {
    eventResourceModifier = {
      ...eventResourceModifier,
      stamina: eventResourceModifier.stamina + effect.value,
    };
    playGameSound("eventPromo");
  } else if (effect.type === "vp") {
    accumulatedVP += effect.value;
    playGameSound("eventPromo");
  }

  triggerUtilityEffectFlash({
    rowIndex,
    colIndex,
    type: effect.type,
    value: effect.value,
  });

  return true;
}

function renderUtilityEffectFlash(rowIndex: number, colIndex: number) {
  if (
    !lastUtilityEffectFlash ||
    lastUtilityEffectFlash.rowIndex !== rowIndex ||
    lastUtilityEffectFlash.colIndex !== colIndex
  ) {
    return "";
  }

  const { type, value } = lastUtilityEffectFlash;
  const icon = type === "coin" ? "🪙" : type === "stamina" ? "⚡" : "★";
  const label = type === "coin" ? `+${value} Xu` : type === "stamina" ? `+${value} Thể lực` : `+${value} VP`;

  return `
    <div class="utility-effect-pop utility-effect-pop--${type}" aria-hidden="true">
      <div class="utility-effect-pop__burst"></div>
      <div class="utility-effect-pop__icon">${icon}</div>
      <div class="utility-effect-pop__label">${label}</div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--1"></div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--2"></div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--3"></div>
    </div>
  `;
}

function renderBoardMiniCard(card: TravelCardData, replayStep?: SimulationReplayStep | null) {
  const displayName = getBoardDisplayName(card);
  const displayCity = getBoardDisplayCity(card);
  const nameClass = getBoardTitleClass(displayName);
  const cityClass = getBoardCityClass(displayCity);
  const bonusActive = isCardBonusActive(card);
  const token = card as BoardTokenCard;

  if (token.boardTokenType === "debt") {
    return `
      <article
        class="board-mini board-mini--token board-mini--debt"
        title="Bấm để trả ${token.debtAmount ?? 0} xu"
      >
        <div class="board-mini-token__icon">💸</div>
        <strong>Nợ tiền ${token.debtAmount ?? 0} xu</strong>
      </article>
    `;
  }

  if (token.boardTokenType === "lock") {
    return `
      <article
        class="board-mini board-mini--token board-mini--lock"
        title="Ô bị khóa vì kiệt sức"
      >
        <div class="board-mini-token__icon">🔒</div>
        <strong>Bị khóa kiệt sức</strong>
      </article>
    `;
  }

  const eventClass = replayStep?.eventType ? `board-mini--event-${replayStep.eventType}` : "";
  const eventIcon =
    replayStep?.eventType === "promo"
      ? "✨"
      : replayStep?.eventType === "traffic"
        ? "🚧"
        : replayStep?.eventType === "storm"
          ? "⛈️"
          : replayStep?.eventType === "distance"
            ? "⚠️"
            : "";
  const eventLabel =
    replayStep?.eventType === "promo"
      ? `+${replayStep.eventVpDelta ?? 0} VP Event`
      : replayStep?.eventType === "traffic"
        ? `${replayStep.eventStaminaDelta ?? 0} Thể lực`
        : replayStep?.eventType === "storm"
          ? `${replayStep.eventVpDelta ?? 0} VP Event`
          : replayStep?.eventType === "distance"
            ? "Khoảng cách > 20km"
            : "";

  return `
    <article
      class="board-mini board-mini--${card.rarity} ${bonusActive ? "board-mini--bonus-active" : ""} ${eventClass}"
      title="${card.name} - ${card.city}${replayStep?.eventText ? ` • ${replayStep.eventText}` : ""}"
    >
      ${
        replayStep?.eventType
          ? `
            <div class="board-mini__event-pill">${eventLabel}</div>
            <div class="board-mini__event-icon">${eventIcon}</div>
            ${
              replayStep.eventType === "distance"
                ? ""
                : replayStep.eventText
                  ? `<div class="board-mini__event-note">${replayStep.eventText}</div>`
                  : ""
            }
          `
          : ""
      }

      <div
        class="board-mini__image"
        style="background-image: ${getCardBackgroundImage(card)}"
      ></div>

      <div class="board-mini__tag board-mini__tag--${card.tag}">
        ${card.tagLabel}
      </div>

      <div class="board-mini__info">
        <h3 class="${nameClass}">${displayName}</h3>
        <div class="board-mini__vp">★ ${card.vp}</div>
      </div>
    </article>
  `;
}

function renderHandCard(card: TravelCardData, index: number, disableFan: boolean = false) {
  const isDraftSelected =
    isDraftPhase &&
    !disableFan &&
    card.id === draftHandPendingCardId;
  const isPlanningSelected = !isDraftPhase && card.id === selectedHandCardId;
  const affordability = getCardAffordability(card);
  const affordabilityMessage = affordability.canAfford
    ? getCardAffordabilityMessage(card)
    : "Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.";
  const unaffordableClass = "";

  return `
    <article
      class="hand-card hand-card--${card.rarity} ${disableFan ? "" : `hand-card--fan-${index + 1}`} ${isPlanningSelected ? "hand-card--selected" : ""} ${isDraftSelected ? "hand-card--draft-selected" : ""} ${unaffordableClass}"
      data-hand-card-id="${card.id}"
      data-card-tag="${card.tag}"
      title="${affordabilityMessage}"
      onpointerdown="${isDraftPhase ? `` : `event.stopPropagation(); startHandPointerDrag(event, '${card.id}')`}"
      onclick="${isDraftPhase ? `` : `event.stopPropagation(); window['selectHandCard']('${card.id}')`}"
    >
      ${
        isPlanningSelected
          ? `<button
              class="hand-card__close"
              onclick="event.stopPropagation(); clearSelectedHandCard()"
              title="Hủy chọn"
            >×</button>`
          : ""
      }

      ${renderFramedCardFace(card, "hand")}
    </article>
  `;
}

function renderFocusedCard(card: TravelCardData) {
  return `
    <div class="focused-card-overlay" onclick="closeFocusedHandCard()">
      <div class="focused-card-backdrop-glow"></div>

      <article
        class="focused-card focused-card--${card.rarity}"
        onclick="event.stopPropagation()"
      >
        <button
          class="focused-card__close"
          onclick="event.stopPropagation(); closeFocusedHandCard()"
          title="Đóng"
        >×</button>

        ${renderFramedCardFace(card, "focused")}

        ${
          focusedBoardPosition && !isSpectatingOnlinePlayer()
            ? `
              <button
                class="focused-card__return-button"
                onclick="event.stopPropagation(); returnFocusedBoardCardToHand()"
                title="Rút lá này từ board về tay"
              >
                ↩ Rút về tay
              </button>
            `
            : ""
        }
      </article>
    </div>
  `;
}

function renderDraftHandTopMeta() {
  const activePlayer = getCurrentDraftPlayer();
  const activePool = activePlayer?.pool ?? [];
  const selectedCard = getDraftSelectedCard();

  return `
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${draftRound}/5</span>
        <strong>${selectedCard ? getBoardDisplayName(selectedCard) : "Bấm 1 lá để chọn"}</strong>
        <em>
          ${
            isInitialDealInProgress
              ? "Đang phát bài vào tay..."
              : isPassingDraftCards
                ? "Đang chuyền bài còn lại vào lượt kế tiếp..."
                : selectedCard
                  ? "Đã chọn. Hết giờ mới chuyền bài."
                  : activePool.length > 0
                    ? "Bấm để chọn, giữ 0.5s để xem lớn."
                    : "Đang chuẩn bị bài..."
          }
        </em>
      </div>

      <div class="draft-hand-meta__wait">
        <span>Chờ hết giờ</span>
      </div>
    </div>
  `;
}

function getPickedDraftCount(): number {
  if (isOnlineRoomActive()) {
    return (getOnlineSelfState()?.pickedDraftCards?.length ?? 0);
  }
  return getCurrentDraftPlayer()?.picked?.length ?? 0;
}

function getConfirmedPickedDraftCards(): TravelCardData[] {
  if (isOnlineRoomActive()) {
    return (getOnlineSelfState()?.pickedDraftCards as TravelCardData[] | undefined) ?? [];
  }
  return getCurrentDraftPlayer()?.picked ?? [];
}

function findCardInDraftPool(cardId: string): TravelCardData | null {
  const pool = isOnlineRoomActive()
    ? (getOnlineDraftDisplayPool() ?? [])
    : (getCurrentDraftPlayer()?.pool ?? []);
  return pool.find((card) => card.id === cardId) ?? null;
}

function getDraftHandDisplayCards(): TravelCardData[] {
  const confirmed = getConfirmedPickedDraftCards();
  const pendingId = draftHandPendingCardId;

  if (!pendingId || confirmed.some((card) => card.id === pendingId)) {
    return confirmed;
  }

  const pendingCard = findCardInDraftPool(pendingId);
  return pendingCard ? [...confirmed, pendingCard] : confirmed;
}

function getDraftHandDisplayCount(): number {
  return getDraftHandDisplayCards().length;
}

const DRAFT_PICKED_FAN_LAYOUT: Record<number, Array<{ rotate: number; ty: number }>> = {
  1: [{ rotate: 0, ty: -6 }],
  2: [
    { rotate: -16, ty: -4 },
    { rotate: 16, ty: -4 },
  ],
  3: [
    { rotate: -18, ty: -5 },
    { rotate: 0, ty: -10 },
    { rotate: 18, ty: -5 },
  ],
  4: [
    { rotate: -20, ty: -3 },
    { rotate: -8, ty: -8 },
    { rotate: 8, ty: -8 },
    { rotate: 20, ty: -3 },
  ],
  5: [
    { rotate: -18, ty: -2 },
    { rotate: -9, ty: -7 },
    { rotate: 0, ty: -11 },
    { rotate: 9, ty: -7 },
    { rotate: 18, ty: -2 },
  ],
};

function readDraftHandCardMetrics() {
  const root = document.documentElement;
  const handCardW = parseFloat(getComputedStyle(root).getPropertyValue("--hand-card-w")) || 158;
  const handCardH = parseFloat(getComputedStyle(root).getPropertyValue("--hand-card-h")) || 218;
  const cardW = handCardW * 0.84;
  const cardH = handCardH * 0.84;
  const stepX = handCardW * 0.46;

  return { handCardW, handCardH, cardW, cardH, stepX };
}

function getDraftFanSlotLayout(count: number, slotIndex: number) {
  return DRAFT_PICKED_FAN_LAYOUT[count]?.[slotIndex - 1] ?? { rotate: 0, ty: 0 };
}

function computeDraftHandSlotRect(count: number, slotIndex: number): DOMRect | null {
  const cardsEl = document.querySelector(".player-hand__cards--draft") as HTMLElement | null;
  if (!cardsEl || count < 1 || slotIndex < 1 || slotIndex > count) return null;

  const layout = getDraftFanSlotLayout(count, slotIndex);
  const { cardW, cardH, stepX } = readDraftHandCardMetrics();
  const containerRect = cardsEl.getBoundingClientRect();
  const totalWidth = cardW + (count - 1) * stepX;
  const firstLeft = containerRect.left + (containerRect.width - totalWidth) / 2;
  const slotLeft = firstLeft + (slotIndex - 1) * stepX;
  const slotTop = containerRect.bottom - cardH - 4 + layout.ty;

  return new DOMRect(slotLeft, slotTop, cardW, cardH);
}

function parseDraftHandSlotMeta(cardEl: HTMLElement): { count: number; slotIndex: number } | null {
  const slotMatch = cardEl.className.match(/hand-card--picked-slot-(\d)/);
  const parent = cardEl.closest("[class*='picked-count-']") as HTMLElement | null;
  const countMatch = parent?.className.match(/picked-count-(\d)/);

  if (!slotMatch || !countMatch) return null;

  return {
    count: parseInt(countMatch[1], 10),
    slotIndex: parseInt(slotMatch[1], 10),
  };
}

function getDraftHandFlyTargetForPending(): { rect: DOMRect; rotate: number } | null {
  const count = getDraftHandDisplayCount();
  const slotIndex = count;
  const rect = computeDraftHandSlotRect(count, slotIndex);

  if (!rect) return null;

  return {
    rect,
    rotate: getDraftFanSlotLayout(count, slotIndex).rotate,
  };
}

function getDraftHandFlySourceFromElement(cardEl: HTMLElement): { rect: DOMRect; rotate: number } | null {
  const meta = parseDraftHandSlotMeta(cardEl);
  if (!meta) return null;

  const rect = computeDraftHandSlotRect(meta.count, meta.slotIndex);
  if (!rect) return null;

  return {
    rect,
    rotate: getDraftFanSlotLayout(meta.count, meta.slotIndex).rotate,
  };
}

function getDraftCenterCardWrapper(cardId: string): HTMLElement | null {
  const card = document.querySelector(
    `.draft-center-card[data-draft-card-id="${cardId}"]`
  );
  return (card?.closest(".draft-center-card-wrapper") as HTMLElement | null) ?? null;
}

function getDraftPendingHandSlotRect(): DOMRect | null {
  const slot =
    document.querySelector(
      ".hand-card--picked-pending:not(.hand-card--picked-pending-hidden)"
    ) ??
    document.querySelector(".hand-card--picked-pending-hidden") ??
    document.querySelector(".hand-card--picked-pending");
  const rect = slot?.getBoundingClientRect() ?? null;

  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
}

function getDraftHandFallbackSlotRect(): DOMRect | null {
  const cardsEl = document.querySelector(".player-hand__cards--draft") as HTMLElement | null;
  if (!cardsEl) return null;

  const handRect = cardsEl.getBoundingClientRect();
  const cardWidth = cardsEl.clientWidth > 0 ? cardsEl.clientWidth * 0.12 : 132;
  const cardHeight = cardWidth * 1.38;

  return new DOMRect(
    handRect.left + handRect.width / 2 - cardWidth / 2,
    handRect.bottom - cardHeight - 8,
    cardWidth,
    cardHeight
  );
}

async function measureDraftPendingHandSlotRect(): Promise<DOMRect | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      });
    }

    updateDraftHandVisualOnly({ hiddenPendingMeasure: true });

    const cardsEl = document.querySelector(".player-hand__cards--draft") as HTMLElement | null;
    if (cardsEl) {
      void cardsEl.offsetHeight;
    }

    const target = getDraftHandFlyTargetForPending();
    if (target) return target.rect;

    const rect = getDraftPendingHandSlotRect();
    if (rect) return rect;
  }

  return getDraftHandFallbackSlotRect();
}

function revertDraftPickFlyToHand(cardId: string) {
  draftHandPendingCardId = null;

  if (draftSelectedCardId === cardId) {
    draftSelectedCardId = null;
  }

  getDraftCenterCardWrapper(cardId)?.classList.remove("draft-center-card-wrapper--flown-to-hand");
  updateDraftPoolFlownVisualOnly();
  updateDraftHandVisualOnly();
  updateDraftConfirmButtonVisualOnly();
}

function renderPickedDraftCard(
  card: TravelCardData,
  index: number,
  options?: { isPending?: boolean; hiddenForMeasure?: boolean }
) {
  const pendingClass = options?.isPending ? " hand-card--picked-pending" : "";
  const hiddenClass = options?.hiddenForMeasure ? " hand-card--picked-pending-hidden" : "";

  return `
    <article
      class="hand-card hand-card--${card.rarity} hand-card--picked-draft hand-card--picked-slot-${index + 1}${pendingClass}${hiddenClass}"
      data-draft-hand-card-id="${card.id}"
    >
      ${renderFramedCardFace(card, "hand")}
    </article>
  `;
}

function renderPickedDraftCards(options?: { hiddenPendingMeasure?: boolean }) {
  const confirmedIds = new Set(getConfirmedPickedDraftCards().map((card) => card.id));

  return getDraftHandDisplayCards()
    .map((card, index) =>
      renderPickedDraftCard(card, index, {
        isPending: card.id === draftHandPendingCardId && !confirmedIds.has(card.id),
        hiddenForMeasure: options?.hiddenPendingMeasure && card.id === draftHandPendingCardId,
      })
    )
    .join("");
}

function shouldShowDraftPickPool(): boolean {
  if (!isDraftPhase) return false;
  if (isOnlineFinalDraftReturnAnimating) return false;
  if (isOnlineInterRoundPoolPassActive()) {
    const passPool = onlineDraftPassSnapshotPool ?? onlineDraftDisplayPool;
    if (passPool?.length) return true;
  }
  if (isPassingDraftCards && draftPassDisplayPool?.length) return true;
  if (getPickedDraftCount() >= DRAFT_PICK_TARGET) return false;
  return true;
}

function getDraftCenterRenderPool(): TravelCardData[] {
  if (isOnlineRoomActive()) {
    if (isOnlineInterRoundPoolPassActive()) {
      return onlineDraftPassSnapshotPool ?? onlineDraftDisplayPool ?? [];
    }
    return getOnlineDraftDisplayPool() ?? [];
  }

  if (isPassingDraftCards && draftPassDisplayPool) {
    return draftPassDisplayPool;
  }

  return getCurrentDraftPlayer()?.pool ?? [];
}

function updateDraftConfirmButtonVisualOnly() {
  if (!isDraftPhase) return;

  const button = document.querySelector(
    ".deck-pile-panel__draft-confirm"
  ) as HTMLButtonElement | null;
  if (!button) return;

  const canConfirm =
    !!(draftHandPendingCardId || draftSelectedCardId) &&
    !isDraftPickFlying &&
    !isPassingDraftCards &&
    !isDraftDealVisualActive() &&
    !isDraftPoolCollapseAnimating;

  button.disabled = !canConfirm;
}

function updatePlanningConfirmButtonVisualOnly() {
  if (!isOnlinePlanningPhase()) return;

  const button = document.querySelector(
    ".deck-pile-panel__planning-confirm"
  ) as HTMLButtonElement | null;
  if (!button) return;

  const confirmed = isSelfPlanningConfirmed();
  button.disabled = confirmed;
  button.textContent = confirmed ? "Đã xác nhận" : "Xác nhận";

  const statusElement = document.querySelector(
    ".deck-pile-panel__planning-status"
  ) as HTMLElement | null;

  if (statusElement) {
    statusElement.textContent = getPlanningConfirmStatusLabel();
  }
}

function resetDraftPoolCollapseState() {
  if (draftPoolCollapseTimerId !== null) {
    window.clearTimeout(draftPoolCollapseTimerId);
    draftPoolCollapseTimerId = null;
  }

  isDraftPoolCollapsed = false;
  isDraftPoolCollapseAnimating = false;
  draftPoolCollapseAnimMode = null;
}

function isDraftPoolToggleBlocked(): boolean {
  return (
    isDraftPoolCollapseAnimating ||
    isDraftPickFlying ||
    isPassingDraftCards ||
    isOnlineFinalDraftReturnAnimating
  );
}

function renderDraftPoolCollapseButton(): string {
  if (!isDraftPhase || !shouldShowDraftPickPool()) return "";
  if (isPassingDraftCards || isOnlineFinalDraftReturnAnimating) return "";

  const label = isDraftPoolCollapsed ? "Mở pool" : "Thu gọn";
  const disabled = isDraftPoolToggleBlocked();

  return `
    <button
      type="button"
      class="deck-pile-panel__pool-toggle"
      onclick="event.stopPropagation(); toggleDraftPoolCollapse()"
      ${disabled ? "disabled" : ""}
      title="${isDraftPoolCollapsed ? "Hiện lại pool chọn bài" : "Thu gọn pool để xem bàn cờ"}"
    >
      ${label}
    </button>
  `;
}

function updateDraftPoolToggleVisualOnly() {
  const button = document.querySelector(
    ".deck-pile-panel__pool-toggle"
  ) as HTMLButtonElement | null;
  if (!button) return;

  button.textContent = isDraftPoolCollapsed ? "Mở pool" : "Thu gọn";
  button.disabled = isDraftPoolToggleBlocked();
  button.title = isDraftPoolCollapsed
    ? "Hiện lại pool chọn bài"
    : "Thu gọn pool để xem bàn cờ";
}

function getDraftCenterPickOverlayElement(): HTMLElement | null {
  return document.querySelector(
    ".draft-center-overlay:not(.draft-center-overlay--returning)"
  ) as HTMLElement | null;
}

function activateDraftCenterPoolDeckFlyAnimation(
  mode: "collapse" | "expand"
): boolean {
  const overlayElement = getDraftCenterPickOverlayElement();
  const deckStackElement = document.querySelector(".deck-card-stack") as HTMLElement | null;

  if (!overlayElement || !deckStackElement) return false;

  const poolCards = Array.from(
    overlayElement.querySelectorAll(
      ".draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)"
    )
  ) as HTMLElement[];

  if (poolCards.length === 0) return false;

  overlayElement.classList.remove(
    "draft-center-overlay--collapsed",
    "draft-center-overlay--collapsing",
    "draft-center-overlay--expanding",
    "pass-active"
  );

  const overlayRect = overlayElement.getBoundingClientRect();
  const deckRect = deckStackElement.getBoundingClientRect();

  const gatherCenterX = overlayRect.left + overlayRect.width * 0.5;
  const gatherCenterY = overlayRect.top + overlayRect.height * 0.38;
  const deckInsertX = deckRect.left + deckRect.width * 0.34;
  const deckInsertY = deckRect.top + deckRect.height * 0.54;

  applyDraftReturnGatherVars(
    poolCards,
    gatherCenterX,
    gatherCenterY,
    deckInsertX,
    deckInsertY
  );

  deckStackElement.closest(".deck-pile-panel")?.classList.add("deck-receiving");
  overlayElement.classList.add(
    mode === "collapse"
      ? "draft-center-overlay--collapsing"
      : "draft-center-overlay--expanding",
    "pass-active"
  );

  return true;
}

function finishDraftPoolCollapseAnimation() {
  draftPoolCollapseTimerId = null;
  isDraftPoolCollapseAnimating = false;
  draftPoolCollapseAnimMode = null;
  isDraftPoolCollapsed = true;

  const overlayElement = getDraftCenterPickOverlayElement();
  overlayElement?.classList.remove(
    "draft-center-overlay--collapsing",
    "pass-active"
  );
  overlayElement?.classList.add("draft-center-overlay--collapsed");

  document.querySelector(".deck-pile-panel")?.classList.remove("deck-receiving");
  updateDraftPoolToggleVisualOnly();
  updateDraftConfirmButtonVisualOnly();
}

function finishDraftPoolExpandAnimation() {
  draftPoolCollapseTimerId = null;
  isDraftPoolCollapseAnimating = false;
  draftPoolCollapseAnimMode = null;
  isDraftPoolCollapsed = false;

  const overlayElement = getDraftCenterPickOverlayElement();
  overlayElement?.classList.remove(
    "draft-center-overlay--expanding",
    "draft-center-overlay--collapsed",
    "pass-active"
  );

  document.querySelector(".deck-pile-panel")?.classList.remove("deck-receiving");
  updateDraftPoolToggleVisualOnly();
  updateDraftConfirmButtonVisualOnly();
}

function collapseDraftPoolVisual() {
  if (isDraftPoolToggleBlocked() || isDraftPoolCollapsed) return;

  isDraftPoolCollapseAnimating = true;
  draftPoolCollapseAnimMode = "collapse";
  updateDraftPoolToggleVisualOnly();
  updateDraftConfirmButtonVisualOnly();
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!activateDraftCenterPoolDeckFlyAnimation("collapse")) {
        finishDraftPoolCollapseAnimation();
      }
    });
  });

  draftPoolCollapseTimerId = window.setTimeout(() => {
    finishDraftPoolCollapseAnimation();
  }, DRAFT_POOL_COLLAPSE_MS);
}

function expandDraftPoolVisual() {
  if (isDraftPoolToggleBlocked() || !isDraftPoolCollapsed) return;

  isDraftPoolCollapsed = false;
  isDraftPoolCollapseAnimating = true;
  draftPoolCollapseAnimMode = "expand";

  const overlayElement = getDraftCenterPickOverlayElement();
  overlayElement?.classList.remove("draft-center-overlay--collapsed");

  updateDraftPoolToggleVisualOnly();
  updateDraftConfirmButtonVisualOnly();
  playGameSound("cardSelect");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!activateDraftCenterPoolDeckFlyAnimation("expand")) {
        finishDraftPoolExpandAnimation();
      }
    });
  });

  draftPoolCollapseTimerId = window.setTimeout(() => {
    finishDraftPoolExpandAnimation();
  }, DRAFT_POOL_COLLAPSE_MS);
}

function toggleDraftPoolCollapse() {
  if (!isDraftPhase || !shouldShowDraftPickPool() || isDraftPoolToggleBlocked()) {
    return;
  }

  if (isDraftPoolCollapsed) {
    expandDraftPoolVisual();
  } else {
    collapseDraftPoolVisual();
  }
}

function shouldShowDraftLeftoverReturn(): boolean {
  return isOnlineFinalDraftReturnAnimating && isPassingDraftCards;
}

function getDraftLeftoverReturnCards(): TravelCardData[] {
  const pool = getOnlineDraftDisplayPool() ?? [];
  const pickedIds = new Set(
    (getOnlineSelfState()?.pickedDraftCards ?? []).map((card) => card.id)
  );
  return pool.filter((card) => !pickedIds.has(card.id));
}

function isDraftPickTimerFrozen(): boolean {
  const hold = onlineClientState.roomState?.draftTimerHold ?? 0;

  if (isOnlineRoomActive()) {
    const serverPool = getOnlineSelfDraftPool();
    const animationExpired = draftDealVisualEndsAt > 0 && Date.now() > draftDealVisualEndsAt + 180;

    if (serverPool?.length && animationExpired) {
      return hold > 0;
    }
  }

  return (
    isDraftCenterDealing ||
    isInitialDealInProgress ||
    isPassingDraftCards ||
    hold > 0 ||
    Date.now() < draftDealVisualEndsAt
  );
}

function getDraftTimerDisplayLabel(): string {
  if (isDraftPickTimerFrozen()) return "Chia bài";
  return `${draftPickSecondsLeft}s`;
}

function updateDraftTimerDisplayVisualOnly() {
  const meta = document.querySelector(".player-hand__meta");
  if (!meta || !isDraftPhase) return;

  meta.textContent = isDraftPickTimerFrozen()
    ? "Đang chia bài..."
    : `Còn ${getDraftTimerDisplayLabel()} • ${
        isPassingDraftCards ? "Đang chuyền bài..." : "bấm 1 lá để chọn"
      }`;
  meta.classList.toggle("player-hand__meta--danger", isDraftTimerDanger());
}

function isDraftTimerDanger(): boolean {
  return !isDraftPickTimerFrozen() && draftPickSecondsLeft <= 3;
}

function renderSpectateDraftCenterOverlay() {
  if (!isDraftPhase) return "";

  const targetPlayer = getViewedOnlinePlayer();
  const activePool = getSpectateDraftPoolCards();
  const pickedCards = getSpectatePickedDraftCards();

  if (activePool.length === 0 && pickedCards.length === 0) {
    return "";
  }

  const topRow = activePool.slice(0, 4);
  const bottomRow = activePool.slice(4);

  const renderRow = (cards: TravelCardData[], startIndex: number) => {
    return cards.map((card, idx) => {
      const globalSlot = startIndex + idx + 1;

      return `
        <div class="draft-center-card-wrapper draft-center-card-wrapper--slot-${globalSlot} draft-center-card-wrapper--spectate-readonly" style="--draft-deal-delay: ${(globalSlot - 1) * DRAFT_CENTER_DEAL_STEP_MS}ms">
          <div class="draft-center-card" data-spectate-draft-card-id="${card.id}" onclick="event.stopPropagation(); openSpectateHandCard('${card.id}')">
            ${renderHandCard(card, startIndex + idx, true)}
          </div>
        </div>
      `;
    }).join("");
  };

  return `
    <div class="draft-center-overlay draft-center-overlay--spectate-readonly">
      <div class="draft-center-container draft-center-container--spectate">
        ${topRow.length > 0 ? `<div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${renderRow(topRow, 0)}</div>` : ""}
        ${bottomRow.length > 0 ? `<div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${renderRow(bottomRow, 4)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderDraftCenterOverlay() {
  if (isSpectatingOnlinePlayer()) return "";
  if (!isDraftPhase) return "";
  if (!shouldShowDraftPickPool()) return "";

  const activePool = getDraftCenterRenderPool();

  if (activePool.length === 0) {
    return `
      <div class="draft-center-overlay">
        <p style="color:#fff5d1; font-size:1.2rem;">Đang chuẩn bị bài...</p>
      </div>
    `;
  }

  const topRow = activePool.slice(0, 4);
  const bottomRow = activePool.slice(4);

  const renderRow = (cards: TravelCardData[], startIndex: number) => {
    return cards.map((card, idx) => {
      const index = startIndex + idx;
      const globalSlot = startIndex + idx + 1;
      const isFlownToHand = shouldHideDraftPoolSlot(card.id);
      const poolPickDisabled =
        isPassingDraftCards ||
        isDraftPoolCollapsed ||
        isDraftPoolCollapseAnimating;
      const pickButton = poolPickDisabled
        ? ""
        : `
          <button class="draft-center-btn" data-draft-card-id="${card.id}">
            CHỌN
          </button>
        `;

      return `
        <div class="draft-center-card-wrapper draft-center-card-wrapper--slot-${globalSlot} ${isFlownToHand ? "draft-center-card-wrapper--flown-to-hand" : ""}" style="--draft-deal-delay: ${(globalSlot - 1) * DRAFT_CENTER_DEAL_STEP_MS}ms">
          <div class="draft-center-card" data-draft-card-id="${card.id}">
            ${renderHandCard(card, index, true)}
          </div>
          ${pickButton}
        </div>
      `;
    }).join("");
  };

  const overlayModifierClass = [
    isPassingDraftCards && !isOnlineFinalDraftReturnAnimating
      ? "draft-center-overlay--passing"
      : "",
    isDraftCenterDealing || isInitialDealInProgress
      ? "draft-center-overlay--dealing"
      : "",
    isDraftPoolCollapsed && !isDraftPoolCollapseAnimating
      ? "draft-center-overlay--collapsed"
      : "",
    draftPoolCollapseAnimMode === "collapse" ? "draft-center-overlay--collapsing" : "",
    draftPoolCollapseAnimMode === "expand" ? "draft-center-overlay--expanding" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="draft-center-overlay ${overlayModifierClass}">
      <div class="draft-center-container">
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${renderRow(topRow, 0)}</div>
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${renderRow(bottomRow, 4)}</div>
      </div>
      ${shouldShowDraftWaitBanner() ? '<div class="draft-center-wait-banner">Đang chờ đối thủ...</div>' : ''}
    </div>
  `;
}

function renderDraftLeftoverReturnOverlay(): string {
  if (isSpectatingOnlinePlayer()) return "";
  if (!shouldShowDraftLeftoverReturn()) return "";

  const cards = getDraftLeftoverReturnCards();

  const cardHtml = cards
    .map((card, index) => {
      const slot = index + 1;
      return `
        <div class="draft-center-card-wrapper draft-center-card-wrapper--return draft-center-card-wrapper--return-${slot}">
          <div class="draft-center-card">
            ${renderHandCard(card, index, true)}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="draft-center-overlay draft-center-overlay--returning">
      <div class="draft-center-container draft-center-container--return">
        ${cardHtml}
      </div>
    </div>
  `;
}

function getDraftPreviewIconsForPlayer(playerId: PlayerId): string[] {
  const draftIndexByPlayerId: Record<PlayerId, number> = {
    p1: 1,
    p2: 0,
    p3: 2,
    p4: 3,
  };

  const draftPlayer = draftPlayers[draftIndexByPlayerId[playerId]];
  const pickedCards = draftPlayer?.picked ?? [];

  return pickedCards.map((card) => card.icon);
}

function shouldRenderDraftPreviewOnSideBoard(playerId?: PlayerId): boolean {
  return Boolean(playerId && playerId !== currentPlayerId && isDraftPhase);
}

function getOnlineBoardForPlayer(playerId?: PlayerId) {
  return getOnlinePlayerBoard(playerId);
}

function renderOnlineSideBoard(playerId: PlayerId) {
  const onlineBoard = getOnlinePlayerBoard(playerId);

  if (!onlineBoard) {
    return Array.from({ length: 25 })
      .map(() => `<div class="opponent-cell">+</div>`)
      .join("");
  }

  const cells: string[] = [];

  for (const row of onlineBoard) {
    for (const cell of row) {
      if (!cell) {
        cells.push(`<div class="opponent-cell">+</div>`);
        continue;
      }

      cells.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${cell.tag}"
          title="${cell.cardId} • ${cell.tag} • ${cell.vp} VP"
        >
          ${cell.icon}
        </div>
      `);
    }
  }

  return cells.join("");
}

function renderSidePlayerBoard(playerId?: PlayerId) {
  if (!playerId) {
    return Array.from({ length: 25 })
      .map(() => `<div class="opponent-cell">+</div>`)
      .join("");
  }

  if (onlineClientState.roomState) {
    return renderOnlineSideBoard(playerId);
  }

  const board = playerBoards[playerId];
  const draftPreviewIcons = shouldRenderDraftPreviewOnSideBoard(playerId)
    ? getDraftPreviewIconsForPlayer(playerId)
    : [];
  const cells: string[] = [];
  let flatIndex = 0;

  for (const row of board) {
    for (const card of row) {
      const previewIcon = draftPreviewIcons[flatIndex] ?? "";

      if (!card) {
        cells.push(`
          <div
            class="opponent-cell ${previewIcon ? "opponent-cell--draft-preview" : ""}"
            title="${previewIcon ? "Người chơi này đã chọn 1 lá trong phase draft" : ""}"
          >
            ${previewIcon || "+"}
          </div>
        `);
        flatIndex += 1;
        continue;
      }

      cells.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${card.tag}"
          title="${card.name} • ${card.tagLabel} • ${card.vp} VP"
        >
          ${card.icon}
        </div>
      `);
      flatIndex += 1;
    }
  }

  return cells.join("");
}

function renderPlayer(player: Player) {
  const onlinePlayer = getOnlinePlayer(player.id);
  const displayPlayer = onlinePlayer
    ? {
        ...player,
        name: onlinePlayer.name,
        score: onlinePlayer.score,
        coin: onlinePlayer.coin,
        stamina: onlinePlayer.stamina,
        usedSlots: onlinePlayer.usedSlots,
      }
    : player;
  const connectionClass = onlinePlayer?.isConnected === false ? " side-player--offline" : "";
  const isSelfOnlinePlayer = isOnlineRoomActive() && player.id === getOnlineSelfPlayerId();
  const canSpectatePlayer = isOnlineRoomActive() && !isSelfOnlinePlayer && onlinePlayer?.isConnected === true;
  const isViewingPlayer = isOnlineRoomActive() && spectatingPlayerId === player.id;
  const spectateClass = canSpectatePlayer ? " side-player--spectatable" : "";
  const viewingClass = isViewingPlayer ? " side-player--viewing" : "";
  const clickHandler = canSpectatePlayer
    ? ` onclick="event.stopPropagation(); spectatePlayerBoard('${displayPlayer.id}')"`
    : "";
  const spectateTitle = canSpectatePlayer
    ? ` title="Bấm để xem sàn của ${displayPlayer.name}"`
    : "";

  return `
    <section class="side-player ${displayPlayer.active ? "side-player--active" : ""}${connectionClass}${spectateClass}${viewingClass}"${clickHandler}${spectateTitle}>
      <div class="side-player__top">
        <div class="side-player__identity">
          <span class="rank">#${displayPlayer.rank}</span>
          <h3>${displayPlayer.name}</h3>
        </div>

        <div class="side-player__score">
          ${displayPlayer.score}
          ${onlinePlayer?.hasJoined && onlinePlayer?.isConnected === false ? `<span class="side-player__offline-badge">OFFLINE</span>` : ""}
        </div>
      </div>

      <div class="side-player__resources">
        <span>🪙 ${displayPlayer.coin}</span>
        <span class="separator">|</span>
        <span>⚡ ${displayPlayer.stamina}</span>
        <span class="slot-count">${displayPlayer.usedSlots}/25</span>
      </div>

      <div class="opponent-board">
        ${renderSidePlayerBoard(displayPlayer.id)}
      </div>

      ${canSpectatePlayer ? `
        <button
          type="button"
          class="side-player__view-button"
          onclick="event.stopPropagation(); spectatePlayerBoard('${displayPlayer.id}')"
          title="Xem bàn của ${displayPlayer.name}"
        >
          Xem
        </button>
      ` : ""}
    </section>
  `;
}

function getCurrentDraftPlayer() {
  return getCurrentDraftPlayerFromList(draftPlayers, getActiveDraftPlayerIndex());
}

function isSinglePlayerLocalDraftMode() {
  /*
    Local/offline hiện chỉ có 1 người thật. Các người chơi còn lại chỉ là bot preview,
    nên không nên dùng cơ chế draft chuyền bài 4 người cho chế độ này.
    Online 2/3/4 người vẫn giữ draft chuyền bài bình thường từ server.
  */
  return !isOnlineRoomActive();
}

function getDraftPrimaryTag(card: TravelCardData) {
  /*
    Không chỉ dựa vào card.tags, vì nếu mapper/data build bị lệch thì tag chính có thể sai.
    ID thật của bộ card có prefix rất rõ:
    SG_FOOD_..., SG_CULT_..., SG_ACT_..., SG_UTIL_...
    Ưu tiên đọc prefix ID trước để draft không bao giờ gom nhầm hết về FOOD.
  */
  const rawId = String(card.id ?? (card as { card_id?: string }).card_id ?? "").toUpperCase();

  if (rawId.includes("_CULT_") || rawId.startsWith("SG_CULT")) return "CULTURE";
  if (rawId.includes("_ACT_") || rawId.startsWith("SG_ACT")) return "ACTION";
  if (rawId.includes("_UTIL_") || rawId.startsWith("SG_UTIL")) return "UTILITY";
  if (rawId.includes("_FOOD_") || rawId.startsWith("SG_FOOD")) return "FOOD";

  const tags = (card.tags ?? []).map((tag) => String(tag).toUpperCase());

  if (tags.includes("CULTURE")) return "CULTURE";
  if (tags.includes("ACTION")) return "ACTION";
  if (tags.includes("UTILITY")) return "UTILITY";
  if (tags.includes("FOOD")) return "FOOD";

  const fallbackTag = String(card.tag ?? "").toUpperCase();

  if (fallbackTag === "CULTURE") return "CULTURE";
  if (fallbackTag === "ACTION") return "ACTION";
  if (fallbackTag === "UTILITY") return "UTILITY";
  if (fallbackTag === "FOOD") return "FOOD";

  return "UNKNOWN";
}

function shuffleValues<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }

  return shuffled;
}

function getDraftTagCounts(cards: TravelCardData[]) {
  return cards.reduce<Record<string, number>>((counts, card) => {
    const tag = getDraftPrimaryTag(card);
    counts[tag] = (counts[tag] ?? 0) + 1;
    return counts;
  }, {});
}

function takeOneCardFromBucket(
  buckets: Map<string, TravelCardData[]>,
  tag: string,
  selectedCards: TravelCardData[],
  selectedIds: Set<string>,
  count: number
) {
  if (selectedCards.length >= count) return;

  const bucket = buckets.get(tag);

  if (!bucket || bucket.length === 0) return;

  const nextCard = bucket.shift();

  if (!nextCard || selectedIds.has(nextCard.id)) return;

  selectedCards.push(nextCard);
  selectedIds.add(nextCard.id);
}

function getSinglePlayerDraftQuota(count: number) {
  /*
    Pool 7 lá mong muốn:
    2 FOOD, 2 CULTURE, 2 ACTION, 1 UTILITY.
    Thứ tự được shuffle để vị trí lá trên fan bài vẫn tự nhiên.
  */
  const baseQuota = ["FOOD", "CULTURE", "ACTION", "UTILITY", "FOOD", "CULTURE", "ACTION"];

  if (count <= baseQuota.length) {
    return shuffleValues(baseQuota.slice(0, count));
  }

  const quota = [...baseQuota];
  const fillOrder = ["FOOD", "CULTURE", "ACTION", "UTILITY"];

  while (quota.length < count) {
    quota.push(fillOrder[quota.length % fillOrder.length]);
  }

  return shuffleValues(quota);
}

function drawRandomCardsFromDeck(count: number): TravelCardData[] {
  if (count <= 0 || deck.length === 0) return [];

  /*
    Sửa lỗi roll toàn Ẩm thực:
    - Trước đây có thể tag bị đọc sai hoặc lấy theo thứ tự deck.
    - Bản này bucket theo prefix ID thật + quota cứng.
    - Nếu deck còn CULTURE/ACTION/UTILITY thì pool 7 lá không thể toàn FOOD.
  */
  const shuffledDeck = shuffleCards(deck);
  const buckets = new Map<string, TravelCardData[]>();

  for (const card of shuffledDeck) {
    const tag = getDraftPrimaryTag(card);
    const bucket = buckets.get(tag) ?? [];

    bucket.push(card);
    buckets.set(tag, bucket);
  }

  for (const [tag, bucket] of buckets.entries()) {
    buckets.set(tag, shuffleValues(bucket));
  }

  const selectedCards: TravelCardData[] = [];
  const selectedIds = new Set<string>();
  const quota = getSinglePlayerDraftQuota(count);

  for (const tag of quota) {
    takeOneCardFromBucket(buckets, tag, selectedCards, selectedIds, count);
  }

  /*
    Nếu một nhóm hết bài thì bù bằng nhóm còn lại, nhưng vẫn đi vòng qua nhiều tag
    thay vì lấy nguyên một cụm FOOD.
  */
  const fallbackOrder = shuffleValues(["CULTURE", "ACTION", "UTILITY", "FOOD", "UNKNOWN"]);

  while (selectedCards.length < count) {
    let pickedThisRound = false;

    for (const tag of fallbackOrder) {
      const before = selectedCards.length;
      takeOneCardFromBucket(buckets, tag, selectedCards, selectedIds, count);

      if (selectedCards.length > before) {
        pickedThisRound = true;
      }

      if (selectedCards.length >= count) break;
    }

    if (!pickedThisRound) break;
  }

  deck = shuffledDeck.filter((card) => !selectedIds.has(card.id));

  console.log("[Draft] deck tag counts before draw:", getDraftTagCounts(shuffledDeck));
  console.log("[Draft] single-player pool:", selectedCards.map((card) => `${card.id}:${getDraftPrimaryTag(card)}`));
  console.log("[Draft] single-player pool tag counts:", getDraftTagCounts(selectedCards));

  return selectedCards;
}

function createSinglePlayerDraftPlayers(): DraftPlayerState[] {
  const names = ["Cường", "An", "Minh", "Khánh"];
  const activeIndex = getActiveDraftPlayerIndex();
  const playerPool = drawRandomCardsFromDeck(DRAFT_STARTING_POOL_SIZE);

  return names.map((name, index) => {
    return {
      name,
      pool: index === activeIndex ? playerPool : [],
      picked: [],
    };
  });
}

function resetSinglePlayerDraftPool() {
  if (!isSinglePlayerLocalDraftMode()) return;

  const activeIndex = getActiveDraftPlayerIndex();
  const currentPlayer = getCurrentDraftPlayer();

  if (!currentPlayer) return;

  /*
    Chơi 1 người đúng yêu cầu:
    - Lượt 1: random 7 lá.
    - Pick xong 1 lá: trả 6 lá còn lại về deck.
    - Lượt 2: random lại 6 lá mới.
    - Lượt 3: random lại 5 lá mới.
    - Lượt 4: random lại 4 lá mới.
    - Lượt 5: random lại 3 lá mới.
    => Không giữ pool cũ, nhưng số lá giảm dần theo số lá đã pick.
  */
  if (currentPlayer.pool.length > 0) {
    deck = shuffleCards([...deck, ...currentPlayer.pool]);
  }

  const nextPoolSize = Math.max(
    DRAFT_STARTING_POOL_SIZE - currentPlayer.picked.length,
    DRAFT_STARTING_POOL_SIZE - DRAFT_PICK_TARGET + 1
  );
  const nextPool = drawRandomCardsFromDeck(nextPoolSize);

  draftPlayers = draftPlayers.map((player, index) => {
    if (index !== activeIndex) return player;

    return {
      ...player,
      pool: nextPool,
    };
  });
}

function createDailyDraftPlayers(): DraftPlayerState[] {
  if (isSinglePlayerLocalDraftMode()) {
    return createSinglePlayerDraftPlayers();
  }

  const result = createDailyDraftPlayersFromDeck({
    deck,
    initialDeck,
    handSize: DRAFT_STARTING_POOL_SIZE,
    playerCount: PLAYER_COUNT,
    shuffleCards,
  });

  deck = result.deck;

  return result.draftPlayers;
}

function stopDraftTimer() {
  if (draftTimerId !== null) {
    window.clearInterval(draftTimerId);
    draftTimerId = null;
  }
}

function startDraftTimer() {
  stopDraftTimer();

  if (isOnlineRoomActive()) return;
  if (!isDraftPhase || isPassingDraftCards) return;

  draftTimerId = window.setInterval(() => {
    draftPickSecondsLeft -= 1;

    if (draftPickSecondsLeft <= 0) {
      draftPickSecondsLeft = 0;
      autoPickDraftCard();
      return;
    }

    if (isDraftPoolCollapseAnimating) {
      updateDraftTimerDisplayVisualOnly();
      return;
    }

      rerenderArena();
  }, 1000);
}

function initializeDailyDraftPhase() {
  clearDayAdvanceTimer();
  clearDailyDealTimer();
  stopTurnTimer();
  stopSimulationReplayTimer();
  stopDraftTimer();
  stopBotPlacementTimer();

  draftPlayers = createDailyDraftPlayers();
  preloadDraftImages();
  draftSelectedCardId = null;
  draftHandPendingCardId = null;
  draftPoolFlyReturnCardId = null;
  lastOnlinePickedDraftCount = 0;
  draftPickSecondsLeft = DRAFT_PICK_SECONDS;
  isPassingDraftCards = false;
  resetDraftPoolCollapseState();
  draftPassDisplayPool = null;
  draftRound = 1;
  lastDraftPickResults = [];

  playerHand = [];
  isDraftPhase = true;
  isInitialDealInProgress = false;
  isSimulationMode = false;
  simulationResult = null;
  simulationReplayIndex = 0;
  isReplayComplete = false;
  hasAppliedSimulationScore = false;
  remainingTurnSeconds = TURN_DURATION_SECONDS;

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  lastPlacedBoardPosition = null;
  suppressNextClick = false;

  playDraftDealAnimationAndStartTimer();
}

function getDraftSelectedCard() {
  if (isOnlineRoomActive()) {
    const onlinePool = getOnlineDraftDisplayPool();
    const selectedId = getDraftVisualSelectedCardId();

    if (!onlinePool || !selectedId) return null;

    return onlinePool.find((card) => card.id === selectedId) ?? null;
  }

  const currentPlayer = getCurrentDraftPlayer();

  if (!currentPlayer || !draftSelectedCardId) return null;

  return currentPlayer.pool.find((card) => card.id === draftSelectedCardId) ?? null;
}

function rotateDraftPoolsClockwise() {
  draftPlayers = rotateDraftPoolsClockwiseList(draftPlayers);
}

function completeDailyDraftPhase() {
  stopDraftTimer();
  clearDailyDealTimer();

  const currentPlayer = getCurrentDraftPlayer();

  /*
    Draft 7 pick 5:
    - Người chơi giữ đúng 5 lá đã pick.
    - 2 lá dư trong pool được trả lại deck và shuffle lại.
  */
  const leftoverDraftCards = draftPlayers.reduce<TravelCardData[]>((cards, player) => {
    cards.push(...player.pool);
    return cards;
  }, []);

  if (leftoverDraftCards.length > 0) {
    deck = shuffleCards([...deck, ...leftoverDraftCards]);
  }

  playerHand = currentPlayer ? currentPlayer.picked.slice(0, DRAFT_PICK_TARGET) : [];

  isDraftPhase = false;
  isPassingDraftCards = false;
  draftSelectedCardId = null;
  draftPickSecondsLeft = 0;
  lastDraftPickResults = [];
  isInitialDealInProgress = true;

  rerenderArena();
  finishDailyDealAndStartTimer();
}

function finishDraftPick(cardId: string | null) {
  if (!isDraftPhase || isPassingDraftCards) return;

  const activeIndex = getActiveDraftPlayerIndex();
  const pickResults: DraftPickResult[] = [];

  if (isSinglePlayerLocalDraftMode()) {
    const currentPlayer = getCurrentDraftPlayer();

    if (!currentPlayer || currentPlayer.pool.length === 0) {
      completeDailyDraftPhase();
      return;
    }

    const chosenCard = currentPlayer.pool.find((card) => card.id === cardId) ?? pickRandomCard(currentPlayer.pool);

    if (!chosenCard) {
      completeDailyDraftPhase();
      return;
    }

    pickResults.push({
      playerIndex: activeIndex,
      pickedCard: chosenCard,
    });

    draftPassDisplayPool = [...currentPlayer.pool];

    draftPlayers = draftPlayers.map((player, playerIndex) => {
      if (playerIndex !== activeIndex) return player;

      return {
        ...player,
        picked: [...player.picked, chosenCard],
        pool: player.pool.filter((card) => card.id !== chosenCard.id),
      };
    });

    lastDraftPickResults = pickResults;
    draftSelectedCardId = null;
    draftHandPendingCardId = null;
    draftPoolFlyReturnCardId = null;
    isPassingDraftCards = true;

    stopDraftTimer();
    rerenderArena();
    activateDraftCenterPoolPassAnimation();

    window.setTimeout(() => {
      draftPassDisplayPool = null;
      const nextCurrentPlayer = getCurrentDraftPlayer();

      if (!nextCurrentPlayer || nextCurrentPlayer.picked.length >= DRAFT_PICK_TARGET) {
        isPassingDraftCards = false;
        completeDailyDraftPhase();
        return;
      }

      /*
        Chơi 1 người: mỗi lượt random lại pool mới, nhưng size giảm dần.
        7 lá -> pick -> random 6 lá -> pick -> random 5 lá -> ... -> đủ 5 lá.
      */
      resetSinglePlayerDraftPool();
      preloadDraftImages();

      draftRound += 1;
      draftPickSecondsLeft = DRAFT_PICK_SECONDS;
      isPassingDraftCards = false;
      lastDraftPickResults = [];

      playDraftDealAnimationAndStartTimer();
    }, DRAFT_PASS_ANIMATION_MS);

    return;
  }

  const currentPlayerBeforePass = getCurrentDraftPlayer();
  draftPassDisplayPool = currentPlayerBeforePass ? [...currentPlayerBeforePass.pool] : null;

  draftPlayers = draftPlayers.map((player, playerIndex) => {
    if (player.pool.length === 0) return player;

    const chosenCard =
      playerIndex === activeIndex
        ? player.pool.find((card) => card.id === cardId) ?? pickRandomCard(player.pool)
        : pickRandomCard(player.pool);

    if (!chosenCard) return player;

    pickResults.push({
      playerIndex,
      pickedCard: chosenCard,
    });

    return {
      ...player,
      picked: [...player.picked, chosenCard],
      pool: player.pool.filter((card) => card.id !== chosenCard.id),
    };
  });

  lastDraftPickResults = pickResults;
  draftSelectedCardId = null;
  draftHandPendingCardId = null;
  draftPoolFlyReturnCardId = null;
  isPassingDraftCards = true;

  stopDraftTimer();
  rerenderArena();
  activateDraftCenterPoolPassAnimation();

  window.setTimeout(() => {
    draftPassDisplayPool = null;
    const currentPlayer = getCurrentDraftPlayer();

    /*
      Draft mới: phát 7 lá, nhưng chỉ pick đủ 5 lá.
      Khi đã đủ 5 lá thì trả 2 lá dư còn lại về deck, không cần draft tới khi pool rỗng.
    */
    if (!currentPlayer || currentPlayer.picked.length >= DRAFT_PICK_TARGET) {
      isPassingDraftCards = false;
      completeDailyDraftPhase();
      return;
    }

    rotateDraftPoolsClockwise();
    preloadDraftImages();

    draftRound += 1;
    draftPickSecondsLeft = DRAFT_PICK_SECONDS;
    isPassingDraftCards = false;
    lastDraftPickResults = [];

    playDraftDealAnimationAndStartTimer();
  }, DRAFT_PASS_ANIMATION_MS);
}

function autoPickDraftCard() {
  const currentPlayer = getCurrentDraftPlayer();

  if (!currentPlayer || currentPlayer.picked.length >= DRAFT_PICK_TARGET) {
    completeDailyDraftPhase();
    return;
  }

  finishDraftPick(draftSelectedCardId ?? null);
}

function getDraftStatusText() {
  if (isPassingDraftCards) {
    return isSinglePlayerLocalDraftMode()
      ? "Đang đổi pool mới ngẫu nhiên cho lượt kế tiếp"
      : "Đang truyền bài còn lại theo chiều kim đồng hồ";
  }

  return isSinglePlayerLocalDraftMode()
    ? "Chọn 1 lá để giữ. Sau mỗi lượt, pool sẽ random lá mới."
    : "Chọn 1 lá để giữ. Hết 10s hệ thống sẽ chọn ngẫu nhiên.";
}

function renderDailyDraftCard(card: TravelCardData, index: number) {
  const isSelected = card.id === getDraftVisualSelectedCardId();

  return `
    <article
      class="daily-draft-card daily-draft-card--${index + 1} draft-deal-slot ${isSelected ? "daily-draft-card--selected" : ""}"
      data-draft-card-id="${card.id}"
      title="${card.name} - ${card.city}"
    >
      ${renderHandCard(card, index)}
    </article>
  `;
}

function updateDraftSelectedVisualOnly() {
  updateDraftPoolFlownVisualOnly();

  const selectedCard = getDraftSelectedCard();
  const titleElement = document.querySelector(".draft-hand-meta__info strong");

  if (titleElement) {
    titleElement.textContent = selectedCard
      ? getBoardDisplayName(selectedCard)
      : "Bấm 1 lá để chọn";
  }

  const hintElement = document.querySelector(".draft-hand-meta__info em");

  if (hintElement) {
    hintElement.textContent = selectedCard
      ? "Đã chọn. Bấm lại lá đó để hủy chọn."
      : "Bấm để chọn, giữ 0.5s để xem lớn.";
  }

  const waitBanner = document.querySelector(".draft-center-wait-banner") as HTMLElement | null;
  if (waitBanner) {
    waitBanner.style.display = shouldShowDraftWaitBanner() ? "" : "none";
  }

  updateDraftConfirmButtonVisualOnly();
}

function removeDraftPickFlyLayer() {
  document.querySelectorAll(".draft-pick-fly-layer").forEach((element) => element.remove());
}

function ensureDraftPickFlyLayer(): HTMLElement {
  let layer = document.querySelector(".draft-pick-fly-layer") as HTMLElement | null;

  if (!layer) {
    layer = document.createElement("div");
    layer.className = "draft-pick-fly-layer";
    document.body.appendChild(layer);
  }

  return layer;
}

function clampDraftPickFlyScale(scale: number): number {
  return Math.max(0.85, Math.min(1.2, scale));
}

function computeDraftPickFlyScaleEnd(fromRect: DOMRect, toRect: DOMRect): number {
  if (fromRect.width <= 0) return 1;
  return clampDraftPickFlyScale(toRect.width / fromRect.width);
}

function shouldHideDraftPoolSlot(cardId: string): boolean {
  if (isDraftDealVisualActive()) {
    return cardId === draftHandPendingCardId || cardId === draftPoolFlyReturnCardId;
  }

  if (cardId === draftHandPendingCardId || cardId === draftPoolFlyReturnCardId) {
    return true;
  }

  /*
    Online draft giữ display pool cũ trong lúc pass animation.
    Lá vừa pick đã nằm trên tay nhưng vẫn còn trong display pool → ẩn slot
    cho tới khi pool mới được apply sau animation.
  */
  if (isPassingDraftCards || isOnlineFinalDraftReturnAnimating) {
    return getConfirmedPickedDraftCards().some((card) => card.id === cardId);
  }

  return false;
}

function animateDraftPickFly(
  fromRect: DOMRect,
  toRect: DOMRect,
  sourceInnerHtml: string,
  scaleEnd: number,
  options?: {
    scaleStart?: number;
    direction?: "to-hand" | "to-pool";
    rotateStart?: number;
    rotateEnd?: number;
    flyWidth?: number;
    flyHeight?: number;
  }
): Promise<void> {
  const layer = ensureDraftPickFlyLayer();
  const { cardW, cardH } = readDraftHandCardMetrics();
  const flyWidth = options?.flyWidth ?? cardW;
  const flyHeight = options?.flyHeight ?? cardH;
  const fromCx = fromRect.left + fromRect.width / 2;
  const fromCy = fromRect.top + fromRect.height / 2;
  const toCx = toRect.left + toRect.width / 2;
  const toCy = toRect.top + toRect.height / 2;
  const scaleStart = options?.scaleStart ?? 1;
  const rotateStart = options?.rotateStart ?? 0;
  const rotateEnd = options?.rotateEnd ?? 0;

  const fly = document.createElement("div");
  fly.className = "draft-pick-fly-card";
  if (options?.direction === "to-pool") {
    fly.classList.add("draft-pick-fly-card--to-pool");
  }
  fly.style.left = `${fromCx - flyWidth / 2}px`;
  fly.style.top = `${fromCy - flyHeight / 2}px`;
  fly.style.width = `${flyWidth}px`;
  fly.style.height = `${flyHeight}px`;
  fly.style.setProperty("--fly-dx", `${toCx - fromCx}px`);
  fly.style.setProperty("--fly-dy", `${toCy - fromCy}px`);
  fly.style.setProperty("--fly-scale-start", String(scaleStart));
  fly.style.setProperty("--fly-scale-end", String(scaleEnd));
  fly.style.setProperty("--fly-rotate-start", `${rotateStart}deg`);
  fly.style.setProperty("--fly-rotate-end", `${rotateEnd}deg`);
  fly.innerHTML = sourceInnerHtml;

  layer.appendChild(fly);
  void fly.offsetHeight;
  fly.classList.add("draft-pick-fly-card--animating");

  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;

      fly.remove();

      if (layer.childElementCount === 0) {
        layer.remove();
      }

      resolve();
    };

    fly.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, DRAFT_PICK_FLY_MS + 100);
  });
}

async function playDraftPickFlyToHand(cardId: string) {
  const card = findCardInDraftPool(cardId);
  if (!card) {
    revertDraftPickFlyToHand(cardId);
    return;
  }

  const wrapper = getDraftCenterCardWrapper(cardId);
  const poolCard = wrapper?.querySelector(".hand-card") as HTMLElement | null;
  const fromRect = poolCard?.getBoundingClientRect();
  const sourceHtml = poolCard?.outerHTML;

  if (!fromRect || !sourceHtml || !poolCard || !wrapper || fromRect.width <= 0 || fromRect.height <= 0) {
    revertDraftPickFlyToHand(cardId);
    return;
  }

  draftHandPendingCardId = cardId;
  wrapper.classList.add("draft-center-card-wrapper--flown-to-hand");
  updateDraftPoolFlownVisualOnly();
  updateDraftHandVisualOnly({ hiddenPendingMeasure: true });

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });

  const toTarget = getDraftHandFlyTargetForPending();

  if (!toTarget) {
    revertDraftPickFlyToHand(cardId);
    return;
  }

  const poolScaleStart = clampDraftPickFlyScale(fromRect.width / readDraftHandCardMetrics().cardW);

  await animateDraftPickFly(fromRect, toTarget.rect, sourceHtml, DRAFT_HAND_PICK_SCALE, {
    direction: "to-hand",
    scaleStart: poolScaleStart,
    rotateStart: 0,
    rotateEnd: toTarget.rotate,
    flyWidth: readDraftHandCardMetrics().cardW,
    flyHeight: readDraftHandCardMetrics().cardH,
  });
  updateDraftHandVisualOnly();
}

async function playDraftPickFlyToPool(cardId: string) {
  const handCard = document.querySelector(
    `[data-draft-hand-card-id="${cardId}"]`
  ) as HTMLElement | null;
  const sourceInnerHtml = handCard?.outerHTML;
  const handFlySource = handCard ? getDraftHandFlySourceFromElement(handCard) : null;
  const fromRect = handFlySource?.rect ?? handCard?.getBoundingClientRect();

  if (!fromRect || !sourceInnerHtml || !handCard || fromRect.width <= 0 || fromRect.height <= 0) {
    return;
  }

  handCard.classList.add("hand-card--picked-pending-hidden");

  draftPoolFlyReturnCardId = cardId;
  updateDraftPoolFlownVisualOnly();

  const wrapper = getDraftCenterCardWrapper(cardId);
  const poolCard = wrapper?.querySelector(".hand-card") as HTMLElement | null;
  const poolTargetRect = poolCard?.getBoundingClientRect() ?? wrapper?.getBoundingClientRect();

  if (!poolTargetRect) {
    draftHandPendingCardId = null;
    draftPoolFlyReturnCardId = null;
    updateDraftHandVisualOnly();
    updateDraftPoolFlownVisualOnly();
    return;
  }

  const { cardW, cardH } = readDraftHandCardMetrics();
  const poolScaleEnd = clampDraftPickFlyScale(poolTargetRect.width / cardW);

  try {
    await animateDraftPickFly(fromRect, poolTargetRect, sourceInnerHtml, poolScaleEnd, {
      direction: "to-pool",
      scaleStart: DRAFT_HAND_PICK_SCALE,
      rotateStart: handFlySource?.rotate ?? 0,
      rotateEnd: 0,
      flyWidth: cardW,
      flyHeight: cardH,
    });
  } finally {
    draftHandPendingCardId = null;
    draftPoolFlyReturnCardId = null;
    updateDraftHandVisualOnly();
    updateDraftPoolFlownVisualOnly();
  }
}

async function playDraftPickSwap(fromCardId: string, toCardId: string) {
  const fromHandEl = document.querySelector(
    `[data-draft-hand-card-id="${fromCardId}"]`
  ) as HTMLElement | null;
  const fromHandFlySource = fromHandEl ? getDraftHandFlySourceFromElement(fromHandEl) : null;
  const fromRect = fromHandFlySource?.rect ?? fromHandEl?.getBoundingClientRect();
  const fromHtml = fromHandEl?.outerHTML;

  const toPoolWrapper = getDraftCenterCardWrapper(toCardId);
  const toPoolCard = toPoolWrapper?.querySelector(".hand-card") as HTMLElement | null;
  const toPoolRect = toPoolCard?.getBoundingClientRect();
  const toPoolHtml = toPoolCard?.outerHTML;

  const fromPoolWrapper = getDraftCenterCardWrapper(fromCardId);
  const fromPoolCard = fromPoolWrapper?.querySelector(".hand-card") as HTMLElement | null;
  const fromPoolRect = fromPoolCard?.getBoundingClientRect();
  const fromPoolHtml = fromPoolCard?.outerHTML;

  if (
    !fromRect ||
    !fromHtml ||
    !toPoolRect ||
    !toPoolHtml ||
    !fromPoolRect ||
    !fromPoolHtml ||
    !fromHandEl ||
    fromRect.width <= 0 ||
    toPoolRect.width <= 0 ||
    fromPoolRect.width <= 0
  ) {
    return;
  }

  fromHandEl.classList.add("hand-card--picked-pending-hidden");

  draftHandPendingCardId = toCardId;
  draftPoolFlyReturnCardId = fromCardId;
  updateDraftPoolFlownVisualOnly();
  updateDraftHandVisualOnly({ hiddenPendingMeasure: true });

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });

  const toHandTarget = getDraftHandFlyTargetForPending();

  if (!toHandTarget) {
    fromHandEl.classList.remove("hand-card--picked-pending-hidden");
    draftHandPendingCardId = fromCardId;
    draftPoolFlyReturnCardId = null;
    updateDraftPoolFlownVisualOnly();
    updateDraftHandVisualOnly();
    return;
  }

  const { cardW, cardH } = readDraftHandCardMetrics();
  const returnScaleEnd = clampDraftPickFlyScale(fromPoolRect.width / cardW);
  const poolPickScaleStart = clampDraftPickFlyScale(toPoolRect.width / cardW);

  try {
    await Promise.all([
      animateDraftPickFly(fromRect, fromPoolRect, fromHtml, returnScaleEnd, {
        direction: "to-pool",
        scaleStart: DRAFT_HAND_PICK_SCALE,
        rotateStart: fromHandFlySource?.rotate ?? 0,
        rotateEnd: 0,
        flyWidth: cardW,
        flyHeight: cardH,
      }),
      animateDraftPickFly(toPoolRect, toHandTarget.rect, toPoolHtml, DRAFT_HAND_PICK_SCALE, {
        scaleStart: poolPickScaleStart,
        rotateStart: 0,
        rotateEnd: toHandTarget.rotate,
        flyWidth: cardW,
        flyHeight: cardH,
      }),
    ]);
  } finally {
    draftPoolFlyReturnCardId = null;
    updateDraftHandVisualOnly();
    updateDraftPoolFlownVisualOnly();
  }
}

function updateDraftHandVisualOnly(options?: { hiddenPendingMeasure?: boolean }) {
  const cardsEl = document.querySelector(".player-hand__cards--draft") as HTMLElement | null;
  if (!cardsEl) return;

  const count = getDraftHandDisplayCount();
  cardsEl.className = `player-hand__cards player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${count}`;
  cardsEl.innerHTML = renderPickedDraftCards(options);
}

function updateDraftPoolFlownVisualOnly() {
  document.querySelectorAll(".draft-center-card-wrapper").forEach((wrapper) => {
    const cardEl = wrapper.querySelector(
      ".draft-center-card[data-draft-card-id]"
    ) as HTMLElement | null;
    const cardId = cardEl?.dataset.draftCardId;
    if (!cardId) return;

    wrapper.classList.remove("draft-center-card-wrapper--selected");
    wrapper.classList.toggle("draft-center-card-wrapper--flown-to-hand", shouldHideDraftPoolSlot(cardId));

    cardEl.style.removeProperty("z-index");
    cardEl.style.removeProperty("isolation");

    const innerCard = cardEl.querySelector(".hand-card") as HTMLElement | null;
    innerCard?.classList.remove("hand-card--draft-selected");
    innerCard?.style.removeProperty("z-index");
    innerCard?.style.removeProperty("position");

    const button = wrapper.querySelector(".draft-center-btn") as HTMLButtonElement | null;
    if (button) {
      button.textContent = "CHỌN";
      button.classList.remove("daily-draft-card--selected");
      button.style.removeProperty("z-index");
      button.style.removeProperty("isolation");
    }
  });
}

async function handleDraftPickSelectionChange(
  prevPending: string | null,
  nextSelected: string | null,
  cardId: string
) {
  isDraftPickFlying = true;

  let didChangeHand = false;

  try {
    if (!nextSelected) {
      if (prevPending) {
        await playDraftPickFlyToPool(prevPending);
        didChangeHand = true;
      }
    } else if (!prevPending) {
      await playDraftPickFlyToHand(nextSelected);
      didChangeHand = draftHandPendingCardId === nextSelected;
    } else if (prevPending !== nextSelected) {
      await playDraftPickSwap(prevPending, nextSelected);
      didChangeHand = draftHandPendingCardId === nextSelected;
    }

    if (didChangeHand) {
      updateDraftHandVisualOnly();
    }

    updateDraftSelectedVisualOnly();

    if (isOnlineRoomActive()) {
      selectOnlineDraftCard(cardId);
    }
  } finally {
    isDraftPickFlying = false;
    updateDraftConfirmButtonVisualOnly();
    updateDraftPoolToggleVisualOnly();
  }
}

function selectDraftCard(cardId: string) {
  if (!isDraftPhase) return;

  if (
    isDraftPickFlying ||
    isPassingDraftCards ||
    isDraftDealVisualActive() ||
    isDraftPoolCollapsed ||
    isDraftPoolCollapseAnimating
  ) {
    return;
  }

  if (suppressNextClick) {
    suppressNextClick = false;

    if (focusedHandCardId || focusedBoardCard || focusedBoardPosition) {
      return;
    }
  }

  const prevPending = draftHandPendingCardId;
  const nextSelected = draftSelectedCardId === cardId ? null : cardId;

  playGameSound("cardSelect");
  draftSelectedCardId = nextSelected;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;

  if (nextSelected && !prevPending) {
    draftHandPendingCardId = nextSelected;
    updateDraftPoolFlownVisualOnly();
    updateDraftHandVisualOnly({ hiddenPendingMeasure: true });
    updateDraftConfirmButtonVisualOnly();
  }

  void handleDraftPickSelectionChange(prevPending, nextSelected, cardId);
}

function confirmDraftPick() {
  if (!isDraftPhase) return;

  if (
    isDraftPickFlying ||
    isPassingDraftCards ||
    !(draftHandPendingCardId || draftSelectedCardId)
  ) {
    return;
  }

  const cardId = draftSelectedCardId ?? draftHandPendingCardId;

  if (!cardId) return;

  if (isOnlineRoomActive()) {
    confirmOnlineDraftPick();
    return;
  }

  finishDraftPick(cardId);
}

function isOnlinePlanningPhase() {
  return isOnlineRoomActive() && onlineClientState.roomState?.phase === "planning";
}

function getSelfPlanningConfirmLockSignature() {
  const playerId = onlineClientState.playerId;
  const state = onlineClientState.roomState;

  if (!playerId || !state) {
    return "";
  }

  const handIds = (state.self.hand ?? []).map((card) => card.id).join(",");
  const dayIndex = state.dayIndex;
  const board = state.players[playerId]?.board ?? [];
  const dayBoard = board
    .map((row) => row[dayIndex])
    .map((cell) => cell?.cardId ?? "-")
    .join(",");

  return `${dayIndex}|${handIds}|${dayBoard}`;
}

function resetSelfPlanningConfirmLock() {
  selfPlanningConfirmPending = false;
  planningConfirmLockSignature = "";
  planningConfirmRetryCount = 0;

  if (planningConfirmRetryTimerId !== null) {
    window.clearTimeout(planningConfirmRetryTimerId);
    planningConfirmRetryTimerId = null;
  }
}

function getServerPlanningConfirmProgress() {
  const state = onlineClientState.roomState;

  if (!state) {
    return { total: 0, confirmed: 0 };
  }

  const connectedPlayerIds = playerIds.filter((playerId) => {
    const player = state.players[playerId];

    return player?.isConnected === true && player?.hasJoined === true;
  });

  const confirmedCount = connectedPlayerIds.filter((playerId) => {
    return state.players[playerId]?.planningConfirmed === true;
  }).length;

  return {
    total: connectedPlayerIds.length,
    confirmed: confirmedCount,
  };
}

function hasServerAckedPlanningConfirm() {
  const playerId = onlineClientState.playerId;
  const state = onlineClientState.roomState;

  if (!playerId || !state) {
    return false;
  }

  if (state.phase === "simulation" || state.phase === "result") {
    return true;
  }

  return state.players[playerId]?.planningConfirmed === true;
}

function schedulePlanningConfirmRetry() {
  if (planningConfirmRetryTimerId !== null) return;
  if (!selfPlanningConfirmPending || !isOnlinePlanningPhase()) return;
  if (hasServerAckedPlanningConfirm()) {
    resetSelfPlanningConfirmLock();
    return;
  }

  planningConfirmRetryTimerId = window.setTimeout(() => {
    planningConfirmRetryTimerId = null;

    if (
      !selfPlanningConfirmPending ||
      !isOnlinePlanningPhase() ||
      hasServerAckedPlanningConfirm()
    ) {
      resetSelfPlanningConfirmLock();
      updatePlanningConfirmButtonVisualOnly();
      return;
    }

    planningConfirmRetryCount += 1;

    if (planningConfirmRetryCount > 8) {
      updatePlanningConfirmButtonVisualOnly();
      return;
    }

    try {
      confirmOnlinePlanning();
    } catch {
      resetSelfPlanningConfirmLock();
      updatePlanningConfirmButtonVisualOnly();
      return;
    }

    schedulePlanningConfirmRetry();
  }, 2000);
}

function syncSelfPlanningConfirmLockFromServer() {
  const state = onlineClientState.roomState;
  const playerId = onlineClientState.playerId;

  if (!state || !playerId) {
    resetSelfPlanningConfirmLock();
    return;
  }

  if (state.phase !== "planning") {
    resetSelfPlanningConfirmLock();
    lastOnlinePlanningDayIndex = null;
    return;
  }

  if (
    lastOnlinePlanningDayIndex !== null &&
    lastOnlinePlanningDayIndex !== state.dayIndex
  ) {
    resetSelfPlanningConfirmLock();
  }

  lastOnlinePlanningDayIndex = state.dayIndex;

  if (state.players[playerId]?.planningConfirmed === true) {
    resetSelfPlanningConfirmLock();
    return;
  }

  if (selfPlanningConfirmPending) {
    schedulePlanningConfirmRetry();
  }

  if (
    selfPlanningConfirmPending &&
    planningConfirmLockSignature !== getSelfPlanningConfirmLockSignature()
  ) {
    resetSelfPlanningConfirmLock();
  }
}

function isSelfPlanningConfirmed() {
  const playerId = onlineClientState.playerId;
  const state = onlineClientState.roomState;

  if (!playerId || !state?.players[playerId]) {
    return false;
  }

  if (state.players[playerId].planningConfirmed === true) {
    return true;
  }

  return (
    selfPlanningConfirmPending &&
    planningConfirmLockSignature !== "" &&
    planningConfirmLockSignature === getSelfPlanningConfirmLockSignature()
  );
}

function getPlanningConfirmStatusLabel() {
  const state = onlineClientState.roomState;
  const serverProgress = getServerPlanningConfirmProgress();

  if (state?.phase === "simulation") {
    return "Đang quét...";
  }

  if (serverProgress.total <= 0) {
    return "";
  }

  const selfServerConfirmed =
    state?.players[onlineClientState.playerId ?? "p1"]?.planningConfirmed === true;

  if (isSelfPlanningConfirmed() && !selfServerConfirmed) {
    if (planningConfirmRetryCount > 8) {
      if (serverProgress.total <= 1) {
        return "Không kết nối server • chạy: cd TREKPOLOGY/server && npm start";
      }

      return "Không nhận phản hồi server • thử reload trang";
    }

    if (serverProgress.total <= 1) {
      return "Đã xác nhận • đang chạy lịch trình...";
    }

    if (serverProgress.total > 1) {
      const waitingCount = Math.max(0, serverProgress.total - serverProgress.confirmed - 1);

      return `Đã xác nhận • chờ ${waitingCount} người (${serverProgress.confirmed + 1}/${serverProgress.total})`;
    }

    return "Đã xác nhận • đang đồng bộ server...";
  }

  if (serverProgress.confirmed >= serverProgress.total) {
    return "Đủ người xác nhận • đang quét...";
  }

  if (isSelfPlanningConfirmed()) {
    const waitingCount = serverProgress.total - serverProgress.confirmed;

    return `Đã xác nhận • chờ ${waitingCount} người (${serverProgress.confirmed}/${serverProgress.total})`;
  }

  if (serverProgress.total > 1) {
    return `Cần tất cả online xác nhận (${serverProgress.confirmed}/${serverProgress.total})`;
  }

  return "";
}

function confirmPlanningPick() {
  if (isSpectatingOnlinePlayer()) return;
  if (!isOnlinePlanningPhase()) return;
  if (isSelfPlanningConfirmed()) return;

  selfPlanningConfirmPending = true;
  planningConfirmLockSignature = getSelfPlanningConfirmLockSignature();
  planningConfirmRetryCount = 0;

  try {
    confirmOnlinePlanning();
  } catch (error) {
    resetSelfPlanningConfirmLock();

    const message = error instanceof Error ? error.message : "Không gửi được xác nhận.";
    alert(message);
    updatePlanningConfirmButtonVisualOnly();
    return;
  }

  updatePlanningConfirmButtonVisualOnly();
  schedulePlanningConfirmRetry();
}


function selectHandCard(cardId: string) {
  if (isDraftPhase || isSimulationMode || isInitialDealInProgress) return;

  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }

  playGameSound("cardSelect");
  selectedHandCardId = selectedHandCardId === cardId ? null : cardId;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;

  rerenderGameShell();
}

function clearSelectedHandCard() {
  if (isDraftPhase) return;

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;

  rerenderArena();
}

function formatTurnTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  const secondsText =
    remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;

  return `${minutes}:${secondsText}`;
}

function stopTurnTimer() {
  if (turnTimerId !== null) {
    window.clearInterval(turnTimerId);
    turnTimerId = null;
  }
}

function startTurnTimer() {
  stopTurnTimer();

  if (isOnlineRoomActive()) return;
  if (isSimulationMode || isDraftPhase) return;

  turnTimerId = window.setInterval(() => {
    remainingTurnSeconds -= 1;

    if (remainingTurnSeconds <= 0) {
      remainingTurnSeconds = 0;
      stopTurnTimer();
      runSystemSimulation();
      return;
    }

      rerenderArena();
  }, 1000);
}

function clearDayAdvanceTimer() {
  if (dayAdvanceTimerId !== null) {
    window.clearTimeout(dayAdvanceTimerId);
    dayAdvanceTimerId = null;
  }
}

function clearDailyDealTimer() {
  if (dailyDealTimerId !== null) {
    window.clearTimeout(dailyDealTimerId);
    dailyDealTimerId = null;
  }
}

function activateDraftDealAnimation() {
  startDraftCenterDealAnimation(getDraftCenterDealDurationForCurrentPool());
}

function ensureOnlineDraftDealAnimationStarted() {
  if (!isOnlineRoomActive() || !isDraftPhase || !isInitialDealInProgress) return;

  const handElement = document.querySelector(".player-hand--draft.player-hand--dealing") as HTMLElement | null;

  if (!handElement || handElement.classList.contains("deal-active")) return;

  handElement.classList.add("deal-active");
}

function applyDraftReturnGatherVars(
  cards: HTMLElement[],
  gatherCenterX: number,
  gatherCenterY: number,
  deckInsertX: number,
  deckInsertY: number,
  // "overTop": arc vòng lên trên (pass/return về deck phía trên).
  // "directScoop": arc bám đường deck→cụm, bow nhẹ ra ngoài — dùng khi chia bài
  //   bay ra từ góc dưới-phải, không vòng lên đầu màn hình.
  arcStyle: "overTop" | "directScoop" = "overTop"
) {
  cards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width * 0.5;
    const cardCenterY = cardRect.top + cardRect.height * 0.5;
    const stackOffset = index - (cards.length - 1) / 2;

    const gatherX = gatherCenterX - cardCenterX + stackOffset * 5;
    const gatherY = gatherCenterY - cardCenterY + Math.abs(stackOffset) * 3;
    const deckX = deckInsertX - cardCenterX + stackOffset * 2;
    const deckY = deckInsertY - cardCenterY + stackOffset * 2;

    const arc1X = gatherX + (deckX - gatherX) * 0.34;
    const arc2X = gatherX + (deckX - gatherX) * 0.72;
    let arc1Y: number;
    let arc2Y: number;
    if (arcStyle === "directScoop") {
      // Bám theo đường thẳng deck→cụm, bow nhẹ ra ngoài (xuống dưới một chút)
      // để cảm giác "trườn" lên từ góc dưới-phải, không nhảy vọt lên trên.
      arc1Y = gatherY + (deckY - gatherY) * 0.34 + 26 + Math.abs(stackOffset) * 4;
      arc2Y = gatherY + (deckY - gatherY) * 0.72 + 14 + Math.abs(stackOffset) * 3;
    } else {
      arc1Y = Math.min(gatherY, deckY) - 150 - Math.abs(stackOffset) * 7;
      arc2Y = Math.min(gatherY, deckY) - 185 - Math.abs(stackOffset) * 5;
    }

    card.style.setProperty("--gather-x", `${gatherX}px`);
    card.style.setProperty("--gather-y", `${gatherY}px`);
    card.style.setProperty("--gather-r", `${stackOffset * 4}deg`);

    card.style.setProperty("--arc1-x", `${arc1X}px`);
    card.style.setProperty("--arc1-y", `${arc1Y}px`);
    card.style.setProperty("--arc2-x", `${arc2X}px`);
    card.style.setProperty("--arc2-y", `${arc2Y}px`);

    card.style.setProperty("--deck-in-x", `${deckX}px`);
    card.style.setProperty("--deck-in-y", `${deckY}px`);
    card.style.setProperty("--deck-r", `${-6 + stackOffset * 3}deg`);
  });
}

function activateDraftCenterPoolPassAnimation() {
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const overlayElement =
        (document.querySelector(
          ".draft-center-overlay--passing:not(.draft-center-overlay--returning)"
        ) as HTMLElement | null) ??
        (document.querySelector(".draft-center-overlay:not(.draft-center-overlay--returning)") as HTMLElement | null);
      const deckStackElement = document.querySelector(".deck-card-stack") as HTMLElement | null;

      if (!overlayElement || !deckStackElement) return;

      const passingCards = Array.from(
        overlayElement.querySelectorAll(
          ".draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)"
        )
      ) as HTMLElement[];

      if (passingCards.length === 0) return;

      overlayElement.classList.add("draft-center-overlay--passing");

      const overlayRect = overlayElement.getBoundingClientRect();
      const deckRect = deckStackElement.getBoundingClientRect();

      const gatherCenterX = overlayRect.left + overlayRect.width * 0.5;
      const gatherCenterY = overlayRect.top + overlayRect.height * 0.38;
      const deckInsertX = deckRect.left + deckRect.width * 0.34;
      const deckInsertY = deckRect.top + deckRect.height * 0.54;

      applyDraftReturnGatherVars(
        passingCards,
        gatherCenterX,
        gatherCenterY,
        deckInsertX,
        deckInsertY
      );

      deckStackElement.closest(".deck-pile-panel")?.classList.add("deck-receiving");
      overlayElement.classList.add("pass-active");
    });
  });
}

function activateDraftPassAnimation() {
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const handCardsElement = document.querySelector(".player-hand__cards.is-passing") as HTMLElement | null;
      const deckStackElement = document.querySelector(".deck-card-stack") as HTMLElement | null;

      if (!handCardsElement || !deckStackElement) return;

      const passingCards = Array.from(
        handCardsElement.querySelectorAll(".draft-deal-slot:not(.daily-draft-card--selected)")
      ) as HTMLElement[];

      const handRect = handCardsElement.getBoundingClientRect();
      const deckRect = deckStackElement.getBoundingClientRect();

      // Điểm gom: ngay phía trên trung tâm fan bài hiện tại.
      const gatherCenterX = handRect.left + handRect.width * 0.5;
      const gatherCenterY = handRect.top + handRect.height * 0.38;

      // Điểm đút vào deck: mép trái/giữa của sấp bài bên phải.
      // Dùng getBoundingClientRect nên nó tự đúng theo màn hình, không còn bay vào khoảng trắng.
      const deckInsertX = deckRect.left + deckRect.width * 0.34;
      const deckInsertY = deckRect.top + deckRect.height * 0.54;

      passingCards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width * 0.5;
        const cardCenterY = cardRect.top + cardRect.height * 0.5;
        const stackOffset = index - (passingCards.length - 1) / 2;

        const gatherX = gatherCenterX - cardCenterX + stackOffset * 5;
        const gatherY = gatherCenterY - cardCenterY + Math.abs(stackOffset) * 3;
        const deckX = deckInsertX - cardCenterX + stackOffset * 2;
        const deckY = deckInsertY - cardCenterY + stackOffset * 2;

        /*
          Quỹ đạo kiểu Slay the Spire:
          sau khi gom, cụm bài vòng lên trên rồi mới rơi vào deck.
          Tính control points theo vị trí thật của deck để không bay vào khoảng trắng.
        */
        const arc1X = gatherX + (deckX - gatherX) * 0.34;
        const arc1Y = Math.min(gatherY, deckY) - 150 - Math.abs(stackOffset) * 7;
        const arc2X = gatherX + (deckX - gatherX) * 0.72;
        const arc2Y = Math.min(gatherY, deckY) - 185 - Math.abs(stackOffset) * 5;

        card.style.setProperty("--gather-x", `${gatherX}px`);
        card.style.setProperty("--gather-y", `${gatherY}px`);
        card.style.setProperty("--gather-r", `${stackOffset * 4}deg`);

        card.style.setProperty("--arc1-x", `${arc1X}px`);
        card.style.setProperty("--arc1-y", `${arc1Y}px`);
        card.style.setProperty("--arc2-x", `${arc2X}px`);
        card.style.setProperty("--arc2-y", `${arc2Y}px`);

        card.style.setProperty("--deck-in-x", `${deckX}px`);
        card.style.setProperty("--deck-in-y", `${deckY}px`);
        card.style.setProperty("--deck-r", `${-6 + stackOffset * 3}deg`);
      });

      deckStackElement.closest(".deck-pile-panel")?.classList.add("deck-receiving");
      handCardsElement.classList.add("pass-active");
    });
  });
}

function activateDraftCenterReturnAnimation() {
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const overlayElement = document.querySelector(
        ".draft-center-overlay--returning"
      ) as HTMLElement | null;
      const deckStackElement = document.querySelector(".deck-card-stack") as HTMLElement | null;

      if (!overlayElement || !deckStackElement) return;

      const returnCards = Array.from(
        overlayElement.querySelectorAll(".draft-center-card-wrapper--return")
      ) as HTMLElement[];

      const overlayRect = overlayElement.getBoundingClientRect();
      const deckRect = deckStackElement.getBoundingClientRect();

      const gatherCenterX = overlayRect.left + overlayRect.width * 0.5;
      const gatherCenterY = overlayRect.top + overlayRect.height * 0.38;

      const deckInsertX = deckRect.left + deckRect.width * 0.34;
      const deckInsertY = deckRect.top + deckRect.height * 0.54;

      applyDraftReturnGatherVars(
        returnCards,
        gatherCenterX,
        gatherCenterY,
        deckInsertX,
        deckInsertY
      );

      deckStackElement.closest(".deck-pile-panel")?.classList.add("deck-receiving");
      overlayElement.classList.add("pass-active");
    });
  });
}

function finishDraftDealWithoutFullRerender() {
  isInitialDealInProgress = false;
  dailyDealTimerId = null;
  clearDraftCenterDealAnimation();
  draftDealVisualEndsAt = 0;

  const handElement = document.querySelector(".player-hand");
  handElement?.classList.remove("player-hand--dealing", "is-dealing", "deal-active");

  const handMeta = handElement?.querySelector(".player-hand__meta");
  if (handMeta) {
    handMeta.textContent = isDraftPickTimerFrozen()
      ? "Đang chia bài..."
      : `Còn ${getDraftTimerDisplayLabel()} • bấm 1 lá để chọn`;
  }

  const draftInfo = handElement?.querySelector(".draft-hand-meta__info em");
  if (draftInfo) {
    draftInfo.textContent = "Nếu không chọn, hết giờ sẽ chọn ngẫu nhiên.";
  }

  startDraftTimer();
  updateDraftPoolToggleVisualOnly();
}

function finishOnlineDraftDealVisualOnly() {
  isInitialDealInProgress = false;
  onlineDraftAnimationTimerId = null;
  clearDraftCenterDealAnimation();
  draftDealVisualEndsAt = 0;

  const handElement = document.querySelector(".player-hand");
  handElement?.classList.remove("player-hand--dealing", "is-dealing", "deal-active");

  const handMeta = handElement?.querySelector(".player-hand__meta");
  if (handMeta) {
    handMeta.textContent = isDraftPickTimerFrozen()
      ? "Đang chia bài..."
      : `Còn ${getDraftTimerDisplayLabel()} • bấm 1 lá để chọn`;
  }

  const draftInfo = handElement?.querySelector(".draft-hand-meta__info em");
  if (draftInfo) {
    draftInfo.textContent = "Bấm để chọn, giữ 0.5s để xem lớn.";
  }

  updateDraftSelectedVisualOnly();
  updateDraftConfirmButtonVisualOnly();
  updateDraftPoolToggleVisualOnly();
}

function playOnlinePlanningHandDealAfterDraft() {
  const onlineHand = getOnlineSelfHand();

  if (onlineHand) {
    playerHand = [...onlineHand];
  }

  isDraftPhase = false;
  isSimulationMode = false;
  isPassingDraftCards = false;
  isInitialDealInProgress = true;
  hasPlayedOnlinePlanningDealAfterDraft = true;

  playGameSound("deal");
  rerenderGameShell();

  /*
    Tránh giật:
    Sau khi render hand planning để chạy animation, khóa render signature ngay.
    Nếu không, socket update planning kế tiếp có thể rerender lại giữa animation,
    nhìn như card bị snap/giật.
  */
  lastOnlineRenderSignature = getOnlineRenderSignature();

  window.requestAnimationFrame(() => {
    const handElement = document.querySelector(".player-hand:not(.player-hand--draft)") as HTMLElement | null;
    handElement?.classList.add("planning-deal-active");
  });

  window.setTimeout(() => {
    isInitialDealInProgress = false;

    const handElement = document.querySelector(".player-hand");
    handElement?.classList.remove("player-hand--dealing", "is-dealing", "deal-active", "planning-deal-active");

    const handMeta = handElement?.querySelector(".player-hand__meta");
    if (handMeta) {
      handMeta.textContent = "Giữ 0.5s để xem lớn";
    }
  }, 1760);
}

function playDraftDealAnimationAndStartTimer() {
  stopDraftTimer();
  clearDailyDealTimer();

  resetDraftPoolCollapseState();
  isInitialDealInProgress = true;
  draftSelectedCardId = null;
  rerenderArena();
  const dealMs = getDraftCenterDealDurationForCurrentPool();
  startDraftCenterDealAnimation(dealMs);

  /*
    CSS draft deal: animation chạy trên từng wrapper theo số lá pool hiện tại.
    Không rerender toàn arena ở frame cuối; chỉ gỡ class để tránh snap/jank.
  */
  dailyDealTimerId = window.setTimeout(() => {
    finishDraftDealWithoutFullRerender();
  }, dealMs);
}

function finishDailyDealAndStartTimer() {
  clearDailyDealTimer();

  dailyDealTimerId = window.setTimeout(() => {
    isInitialDealInProgress = false;
    dailyDealTimerId = null;

    const handElement = document.querySelector(".player-hand");
    handElement?.classList.remove("player-hand--dealing", "is-dealing", "deal-active");

    const handMeta = handElement?.querySelector(".player-hand__meta");
    if (handMeta) {
      handMeta.textContent = "Giữ 0.5s để xem lớn";
    }

    startTurnTimer();
  
    if (!isDraftPhase && !isSimulationMode) {
      startRealtimeBotPlacement();

      window.setTimeout(() => {
        placeNextRealtimeBotMove();
      }, 250);
    }
  }, 1320);
}

function startNextDayOrPhase() {
  clearDayAdvanceTimer();
  clearDailyDealTimer();
  stopSimulationReplayTimer();
  stopTurnTimer();
  stopBotPlacementTimer();

  returnUnplayedHandToDeck();

  if (currentDayIndex >= PHASE_DAYS - 1) {
    if (!hasAppliedFinalCoinDebtPenalty && localCoinDebt > 0) {
      accumulatedVP -= localCoinDebt * 10;
      hasAppliedFinalCoinDebtPenalty = true;
    }

    phaseNumber += 1;
    currentDayIndex = 0;
    playerBoards = createEmptyPlayerBoards();
    botPlacedDays = createEmptyBotPlacedDays();
    deck = shuffleCards(initialDeck);
    discardedResourceBonus = {
      coin: 0,
      stamina: 0,
    };
    eventResourceModifier = {
      coin: 0,
      stamina: 0,
    };
    localCoinDebt = 0;
    hasAppliedFinalCoinDebtPenalty = false;
  } else {
    currentDayIndex += 1;
  }

  isSimulationMode = false;
  simulationResult = null;
  simulationReplayIndex = 0;
  isReplayComplete = false;
  hasAppliedSimulationScore = false;
  remainingTurnSeconds = TURN_DURATION_SECONDS;

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  lastPlacedBoardPosition = null;
  suppressNextClick = false;

}

function getSimulationEventResourceModifier(result: SimulationResult | null) {
  if (!result) {
    return {
      coin: 0,
      stamina: 0,
    };
  }

  return result.replaySteps.reduce(
    (sum, step) => {
      return {
        coin: sum.coin,
        stamina: sum.stamina + (step.eventStaminaDelta ?? 0),
      };
    },
    {
      coin: 0,
      stamina: 0,
    }
  );
}

function getSimulationEventStaminaPenalty(result: SimulationResult | null) {
  const modifier = getSimulationEventResourceModifier(result);

  return Math.abs(Math.min(0, modifier.stamina));
}

function applyDailyScoreOnce() {
  if (!simulationResult || hasAppliedSimulationScore) return;

  const eventModifier = getSimulationEventResourceModifier(simulationResult);

  /*
    Event giờ ảnh hưởng thật:
    - VP: cộng/trừ thông qua simulationResult.finalVP.
    - Thể lực: eventStaminaDelta âm sẽ trừ vào tài nguyên còn lại của phase.
  */
  // finalVP có thể âm. Dùng += để âm sẽ trừ trực tiếp khỏi tổng phase.
  accumulatedVP += simulationResult.finalVP;
  eventResourceModifier = {
    coin: eventResourceModifier.coin + eventModifier.coin,
    stamina: eventResourceModifier.stamina + eventModifier.stamina,
  };
  hasAppliedSimulationScore = true;
}

function runSystemSimulation() {
  clearHoldTimer();
  clearCustomHandDragVisuals();
  stopBotPlacementTimer();

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = false;

  simulationResult = calculateSimulationResult();
  simulationReplayIndex = 0;
  isReplayComplete = false;
  isSimulationMode = true;

  playSimulationScanSoundForCurrentStep();

  stopTurnTimer();
  stopSimulationReplayTimer();

  simulationReplayTimerId = window.setInterval(() => {
    if (!simulationResult) return;

    if (simulationReplayIndex >= simulationResult.replaySteps.length - 1) {
      simulationReplayIndex = simulationResult.replaySteps.length - 1;
      isReplayComplete = true;
          applyDailyScoreOnce();
      stopSimulationReplayTimer();
      rerenderArena();

      clearDayAdvanceTimer();
      dayAdvanceTimerId = window.setTimeout(() => {
        startNextDayOrPhase();
      }, 1800);

      return;
    }

    simulationReplayIndex += 1;
    playSimulationScanSoundForCurrentStep();
    rerenderArena();
  }, 850);

  rerenderArena();
}


// Tutorial: pause replay tại bước có sự kiện để tour giới thiệu; resume khi bấm Tiếp.
let tutorialReplayPauseIndex = -1;
let tutorialReplayPaused = false;

export function isTutorialReplayPaused(): boolean {
  return tutorialReplayPaused;
}

export function resumeTutorialReplay(): void {
  if (!tutorialReplayPaused) return;
  tutorialReplayPaused = false;
  resumeReplayOnServer(); // cho server chạy tiếp phase chấm điểm
  startOnlineReplayTimer();
}

function startOnlineReplayTimer() {
  stopSimulationReplayTimer();
  simulationReplayTimerId = window.setInterval(() => {
    if (!simulationResult) return;

    if (simulationReplayIndex >= simulationResult.replaySteps.length - 1) {
      simulationReplayIndex = simulationResult.replaySteps.length - 1;
      isReplayComplete = true;
      // Online: điểm do server cộng khi phase chuyển simulation→result.
      stopSimulationReplayTimer();
      rerenderGameShell();
      return;
    }

    simulationReplayIndex += 1;
    playSimulationScanSoundForCurrentStep();

    // Tutorial: dừng lại đúng bước có sự kiện để giới thiệu.
    if (simulationReplayIndex === tutorialReplayPauseIndex && !tutorialReplayPaused) {
      tutorialReplayPaused = true;
      pauseReplayOnServer(); // đóng băng server để overlay không tự tắt
      stopSimulationReplayTimer();
      rerenderGameShell();
      return;
    }

    rerenderGameShell();
  }, 850);
}

function runOnlineSimulationReplay() {
  clearHoldTimer();
  clearCustomHandDragVisuals();
  stopBotPlacementTimer();
  stopTurnTimer();
  stopSimulationReplayTimer();

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = false;

  simulationResult = calculateSimulationResult();
  simulationReplayIndex = 0;
  isReplayComplete = false;
  isSimulationMode = true;
  hasStartedOnlineSimulationReplay = true;

  // Xác định bước pause cho tutorial ngày 1: bước ĐẦU TIÊN có sự kiện.
  tutorialReplayPaused = false;
  tutorialReplayPauseIndex =
    onlineClientState.roomState?.isTutorial === true && currentDayIndex === 0
      ? simulationResult.replaySteps.findIndex((s) => Boolean(s.eventType))
      : -1;

  playSimulationScanSoundForCurrentStep();

  // Sự kiện ngay ở bước 0 → pause ngay từ đầu.
  if (tutorialReplayPauseIndex === 0) {
    tutorialReplayPaused = true;
    pauseReplayOnServer();
    rerenderGameShell();
    return;
  }

  startOnlineReplayTimer();
  rerenderGameShell();
}

function resetTurnForPrototype() {
  stopBotPlacementTimer();
  isSimulationMode = false;
  simulationResult = null;
  simulationReplayIndex = 0;
  isReplayComplete = false;
  hasAppliedSimulationScore = false;
  remainingTurnSeconds = TURN_DURATION_SECONDS;

  clearDayAdvanceTimer();
  clearDailyDealTimer();
  isInitialDealInProgress = false;
  stopSimulationReplayTimer();

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = false;

  rerenderArena();
  startTurnTimer();
}

function renderScoreBreakdownPanel() {
  const breakdown = getCurrentScoreBreakdown();
  const isOnlineLobby = onlineClientState.roomState?.phase === "lobby" || onlineClientState.roomState?.phase === "cinematic";
  const onlineSelfScore = getOnlineSelfScore();
  const totalScoreToDisplay =
    onlineSelfScore ?? (simulationResult ? getStablePhaseScoreDisplay() : accumulatedVP);
  const compactPhaseDayLabel = getCompactPhaseDayLabel();

  return `
    <section class="score-breakdown score-breakdown--status" title="${compactPhaseDayLabel}">
      <div class="score-breakdown__header score-breakdown__capsule score-breakdown__capsule--score">
        <span>ĐIỂM</span>
        <strong>${totalScoreToDisplay}</strong>
      </div>

      <div class="score-breakdown__details score-breakdown__capsule score-breakdown__capsule--phase">
        <span>PHASE</span>
        <strong>${compactPhaseDayLabel}</strong>
      </div>

      <div class="score-breakdown__item score-breakdown__capsule score-breakdown__capsule--slots">
        <span>SLOT</span>
        <strong>${breakdown.usedSlots}/5</strong>
      </div>

      ${
        isOnlineLobby
          ? `
            <div class="score-breakdown__lobby-actions">
              <button
                class="online-start-button"
                onclick="event.stopPropagation(); startOnlineGame()"
                title="Bắt đầu trò chơi cho toàn bộ người chơi trong phòng."
              >
                ▶ Bắt đầu trò chơi
              </button>
            </div>
          `
          : ""
      }

      ${
        simulationResult
          ? `
            <button
              class="score-breakdown__timer score-breakdown__timer--reset"
              onclick="event.stopPropagation(); resetSimulation()"
              title="Prototype: mở khóa để test lại lượt"
            >
              ↺ Test lại
            </button>
          `
          : isDraftPhase
            ? `
              <div
                class="score-breakdown__timer ${isDraftTimerDanger() ? "score-breakdown__timer--danger" : ""}"
                title="Thời gian chọn bài trong phase chia bài."
              >
                <span>DRAFT</span>
                <strong>${getDraftTimerDisplayLabel()}</strong>
              </div>
            `
            : `
              <div
                class="score-breakdown__timer ${remainingTurnSeconds <= 10 ? "score-breakdown__timer--danger" : ""}"
                title="Đồng hồ đếm ngược. Hết giờ hệ thống tự mô phỏng."
              >
                <span>TIME</span>
                <strong>${formatTurnTimer(remainingTurnSeconds)}</strong>
              </div>
            `
      }
    </section>
  `;
}

function renderResourceOrbs() {
  if (isSimulationMode || simulationResult || isOnlineGameOver()) {
    return "";
  }

  const remaining = getRemainingResources();

  return `
    <div class="resource-orbs" aria-label="Tài nguyên hiện tại">
      <div class="resource-orb resource-orb--coin ${resourceOrbFlashType === "coin" ? "resource-orb--effect-pulse" : ""}" title="Xu hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--coin">💰</div>
          <div class="resource-orb__value">${remaining.coin}</div>
        </div>
        <div class="resource-orb__label">TIỀN</div>
      </div>

      <div class="resource-orb-cluster resource-orb-cluster--stamina">
        <div class="resource-orb resource-orb--stamina ${resourceOrbFlashType === "stamina" ? "resource-orb--effect-pulse" : ""}" title="Thể lực hiện có">
          <div class="resource-orb__frame">
            <div class="resource-orb__icon resource-orb__icon--stamina">🏃</div>
            <div class="resource-orb__value">${remaining.stamina}</div>
          </div>
          <div class="resource-orb__label">THỂ LỰC</div>
        </div>
      </div>
    </div>
  `;
}

function getReplayDayEndIndex(dayIndex: number) {
  if (!simulationResult) return -1;

  let endIndex = -1;

  for (let index = 0; index < simulationResult.replaySteps.length; index += 1) {
    if (simulationResult.replaySteps[index].dayIndex === dayIndex) {
      endIndex = index;
    }
  }

  return endIndex;
}

function shouldShowReplayDay(dayIndex: number) {
  if (!simulationResult) return true;

  const currentStep = getCurrentReplayStep();
  const activeDayIndex = currentStep?.dayIndex ?? 0;
  const dayEndIndex = getReplayDayEndIndex(dayIndex);

  if (dayIndex >= activeDayIndex) return true;
  if (dayEndIndex < 0) return true;

  /*
    Mỗi replay step đang chạy khoảng 850ms.
    Chờ khoảng 3 giây sau khi ngày đã quét xong rồi mới ẩn.
  */
  const stepsAfterDayEnded = simulationReplayIndex - dayEndIndex;
  return stepsAfterDayEnded <= 4;
}

function getReplayDayExitStage(dayIndex: number) {
  if (!simulationResult) return 0;

  const currentStep = getCurrentReplayStep();
  const activeDayIndex = currentStep?.dayIndex ?? 0;
  const dayEndIndex = getReplayDayEndIndex(dayIndex);

  if (dayIndex >= activeDayIndex) return 0;
  if (dayEndIndex < 0) return 0;

  const stepsAfterDayEnded = simulationReplayIndex - dayEndIndex;

  if (stepsAfterDayEnded <= 0) return 0;
  if (stepsAfterDayEnded <= 4) return stepsAfterDayEnded;

  return 5;
}

function getReplayDayRailClass(dayIndex: number, activeDayIndex: number) {
  const exitStage = getReplayDayExitStage(dayIndex);

  return [
    dayIndex === activeDayIndex ? "is-active" : "",
    dayIndex < activeDayIndex ? "is-done" : "",
    exitStage > 0 && exitStage <= 4 ? `is-exiting-${exitStage}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderFinalRankingPanel() {
  if (!isOnlineGameOver()) return "";

  const rankings = getOnlineFinalRankings();
  const selfPlayerId = onlineClientState.playerId;

  return `
    <section class="final-ranking-panel">
      <div class="final-ranking-panel__header">
        <span>KẾT THÚC PHASE</span>
        <h2>Bảng xếp hạng cuối cùng</h2>
        <p>Hết 5 ngày. BXH sẽ tự đóng sau ${onlineClientState.roomState?.timer ?? 10}s để qua Phase ${phaseNumber + 1}.</p>
      </div>

      <div class="final-ranking-panel__list">
        ${rankings
          .map((player, index) => {
            const isSelf = player.playerId === selfPlayerId;

            return `
              <div class="final-ranking-row ${isSelf ? "final-ranking-row--self" : ""}">
                <div class="final-ranking-row__rank">#${index + 1}</div>

                <div class="final-ranking-row__name">
                  <strong>${player.name}</strong>
                  <span>${player.playerId}${player.isConnected ? "" : " • offline"}</span>
                </div>

                <div class="final-ranking-row__score">${player.score} VP</div>

                <div class="final-ranking-row__meta">
                  <span>🪙 ${player.coin}</span>
                  <span>⚡ ${player.stamina}</span>
                  <span>${player.usedSlots}/25</span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>

      ${renderTravelTimelineExportPanel("travel-export-panel--final")}

      <div class="final-ranking-panel__footer">
        ${
          phaseNumber >= 3
            ? "Đã kết thúc Phase 3. Đây là kết quả cuối của game."
            : `Đang chuẩn bị chuyển sang Phase ${phaseNumber + 1}...`
        }
      </div>
    </section>
  `;
}


import {
  getExportFileSafeName,
  buildTravelTimelineExport,
  getCertificateHistoryStorageKey,
  loadCertificateHistory,
  saveCertificateHistory,
  getPhaseStyleLabel,
  createCertificatePhaseSnapshot,
  rememberCurrentCertificatePhase,
  getCertificateExportData,
  buildTravelCertificateHtml,
  downloadTravelCertificateHtml,
  formatTravelTimelineAsText,
  downloadTextFile,
  downloadTravelTimeline,
  copyTravelTimelineToClipboard
} from "./export/certificate.js";

function renderTravelTimelineExportPanel(extraClass = "") {
  return `
    <div class="flow-export travel-export-panel ${extraClass}">
      <span>Xuất lịch trình</span>
      <p>Xuất board hiện tại thành lịch trình du lịch để lưu hoặc chia sẻ.</p>
      <div class="flow-export__actions">
        <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        <button onclick="event.stopPropagation(); copyTravelTimeline()">Copy text</button>
      </div>
    </div>
  `;
}

function formatSignedVP(value: number) {
  if (value > 0) return `+${value} VP`;
  if (value < 0) return `${value} VP`;
  return "0 VP";
}

function getCurrentReplayPartialVP() {
  if (!simulationResult) return 0;

  return simulationResult.replaySteps
    .slice(0, simulationReplayIndex + 1)
    .reduce((sum, step) => sum + step.vpDelta, 0);
}

function getPhaseScoreBeforeCurrentSimulation() {
  if (!simulationResult) return accumulatedVP;

  /*
    Khi applyDailyScoreOnce đã chạy, accumulatedVP đã là điểm sau ngày hiện tại.
    Muốn preview không cộng/trừ 2 lần thì phải lùi lại finalVP.
  */
  return hasAppliedSimulationScore
    ? accumulatedVP - simulationResult.finalVP
    : accumulatedVP;
}

function getPhaseScorePreview() {
  if (!simulationResult) return accumulatedVP;

  const baseScore = getPhaseScoreBeforeCurrentSimulation();
  const currentDayDelta = isReplayComplete
    ? simulationResult.finalVP
    : getCurrentReplayPartialVP();

  return baseScore + currentDayDelta;
}

function getStablePhaseScoreDisplay() {
  if (!simulationResult) return accumulatedVP;

  /*
    Tránh hiện tượng điểm tổng nhảy trong lúc đang scan:
    - Điểm ngày có thể lên/xuống theo từng ô.
    - Tổng phase chỉ đổi sau khi replay kết thúc và applyDailyScoreOnce chạy.
  */
  return isReplayComplete
    ? accumulatedVP
    : getPhaseScoreBeforeCurrentSimulation();
}

/**
 * Đặt vị trí track quét điểm bằng cách ĐO LÁ ACTIVE THẬT (ticket rộng không đều
 * — ô trống hẹp, ô có thẻ rộng — nên không thể tính bằng index×stride).
 * Lệch TRÁI: mép trái lá active ~20% từ trái để thấy trọn lá + lá kế.
 * Set với transition:none → đo lại mỗi render mà KHÔNG gây transition = không giật.
 */
function positionScanTrack() {
  const strip = document.querySelector(".ticket-scan-strip") as HTMLElement | null;
  const track = document.querySelector(".ticket-scan-track") as HTMLElement | null;
  if (!strip || !track) return;
  const tickets = track.querySelectorAll<HTMLElement>(".score-ticket");
  if (tickets.length === 0) return;

  const idx = Math.max(0, Math.min(simulationReplayIndex, tickets.length - 1));
  const active = tickets[idx];
  if (!active) return;

  const leftBias = Math.round(strip.clientWidth * 0.2);
  const x = Math.round(leftBias - active.offsetLeft);

  // CSS transition là !important → phải tắt bằng setProperty(...,"important").
  track.style.setProperty("transition", "none", "important");
  track.style.transform = `translateX(${x}px)`;
  void track.offsetWidth; // commit ngay, không chạy transition
  track.style.removeProperty("transition"); // trả lại transition CSS cho lần sau
}

function renderSimulationResultPanel() {
  if (!simulationResult) return "";

  const result = simulationResult;
  const currentStep = getCurrentReplayStep();
  const totalSteps = Math.max(1, result.replaySteps.length);
  const currentStepNumber = Math.min(simulationReplayIndex + 1, totalSteps);
  const currentDayDelta = isReplayComplete
    ? result.finalVP
    : getCurrentReplayPartialVP();
  // Căn giữa được thực hiện bằng đo DOM thật trong centerActiveScoreTicket()
  // (gọi sau render) — tránh magic-number lệch khi width/gap CSS đổi.

  const getEventIcon = (eventType?: string | null) => {
    if (eventType === "storm") return "⛈";
    if (eventType === "traffic") return "🚦";
    if (eventType === "distance") return "🧭";
    if (eventType === "promo") return "🏷";
    return "✦";
  };

  const getEventTitle = (step: SimulationReplayStep) => {
    if (step.eventText) return step.eventText;
    if (step.eventType === "storm") return "Mưa giông";
    if (step.eventType === "traffic") return "Kẹt xe";
    if (step.eventType === "distance") return "Xa tuyến";
    if (step.eventType === "promo") return "Ưu đãi";
    return "";
  };

  return `
    <section class="ticket-scan-overlay" onclick="event.stopPropagation()">
      <div class="ticket-scan-overlay__scrim"></div>

      <div class="ticket-scan-overlay__header">
        <span>ĐANG QUÉT TÍNH ĐIỂM</span>
        <strong>${getCurrentPhaseLabel()} • ${getCurrentDayLabel()}</strong>
        <em>${currentStep ? `Đang tính: ${currentStep.timeLabel}` : "Đang chuẩn bị..."}</em>
      </div>

      <div class="ticket-scan-strip">
        <div class="ticket-scan-strip__backdrop"></div>

        <div
          class="ticket-scan-track"
          data-scan-index="${simulationReplayIndex}"
          style="--scan-index: ${simulationReplayIndex};"
        >
          ${result.replaySteps
            .map((step, stepIndex) => {
              const isLastTicket = stepIndex === totalSteps - 1;
              const shouldTearImmediately =
                !isReplayComplete && isLastTicket && stepIndex === simulationReplayIndex;
              const isActive =
                !isReplayComplete && stepIndex === simulationReplayIndex && !shouldTearImmediately;
              const isDone =
                isReplayComplete || stepIndex < simulationReplayIndex || shouldTearImmediately;
              const isFuture = !isReplayComplete && stepIndex > simulationReplayIndex;
              const eventTitle = getEventTitle(step);
              const hasEvent = Boolean(step.eventType || step.eventText);

              return `
                <article
                  class="score-ticket ${isActive ? "is-active" : ""} ${isDone ? "is-torn" : ""} ${isFuture ? "is-future" : ""} ${step.isEmpty ? "is-empty" : ""} ${hasEvent ? "has-event" : ""} ${step.eventType ? `score-ticket--event-${step.eventType}` : ""}"
                >
                  <div class="score-ticket__perforation score-ticket__perforation--left"></div>
                  <div class="score-ticket__perforation score-ticket__perforation--right"></div>

                  <div class="score-ticket__head">
                    <span>${step.timeLabel}</span>
                    <strong>${step.vpDelta >= 0 ? "+" : ""}${step.vpDelta} VP</strong>
                  </div>

                  <div class="score-ticket__body">
                    <h4>${step.title}</h4>
                    <p>${step.subtitle}</p>
                  </div>

                  <div class="score-ticket__stats">
                    <span class="${step.coinDelta > 0 ? "is-cost" : ""}">Xu ${step.coinDelta}</span>
                    <span class="${step.staminaDelta > 0 ? "is-cost" : ""}">Lực ${step.staminaDelta}</span>
                  </div>

                  ${
                    step.comboText
                      ? `<div class="score-ticket__combo">COMBO</div>`
                      : ""
                  }

                  ${
                    hasEvent
                      ? `
                        <div class="score-ticket__stamp">
                          <b>${getEventIcon(step.eventType)}</b>
                          <span>${eventTitle}</span>
                        </div>
                      `
                      : ""
                  }

                  <div class="score-ticket__tear-mark"></div>
                </article>

                ${
                  stepIndex < result.replaySteps.length - 1
                    ? `<div class="score-ticket-connector ${stepIndex < simulationReplayIndex ? "is-passed" : ""}"></div>`
                    : ""
                }
              `;
            })
            .join("")}
        </div>
      </div>

      <div class="ticket-scan-overlay__footer">
        <div>
          <span>Tiến trình</span>
          <strong>${currentStepNumber}/${totalSteps}</strong>
        </div>

        <div>
          <span>Điểm ngày</span>
          <strong>${formatSignedVP(currentDayDelta)}</strong>
        </div>

        <div>
          <span>Tổng phase</span>
          <strong>${getStablePhaseScoreDisplay()} VP</strong>
        </div>

        ${
          isReplayComplete
            ? `
              <div class="ticket-scan-overlay__complete">
                <span>Hoàn tất</span>
                <strong>${getPhaseScoreBeforeCurrentSimulation()} → ${getPhaseScorePreview()} VP</strong>
              </div>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function getReplayStepForBoardCell(rowIndex: number, colIndex: number) {
  if (!simulationResult) return null;

  const stepIndex = simulationResult.replaySteps.findIndex(
    (step) => step.rowIndex === rowIndex && step.dayIndex === colIndex
  );

  if (stepIndex < 0 || stepIndex > simulationReplayIndex) {
    return null;
  }

  return simulationResult.replaySteps[stepIndex] ?? null;
}

function getBoardCellReplayClass(rowIndex: number, colIndex: number) {
  if (!simulationResult || colIndex !== currentDayIndex) return "";

  const currentStep = getCurrentReplayStep();
  const isCurrent =
    currentStep?.rowIndex === rowIndex && currentStep?.dayIndex === colIndex;

  const stepIndex = simulationResult.replaySteps.findIndex(
    (step) => step.rowIndex === rowIndex && step.dayIndex === colIndex
  );

  const step = stepIndex >= 0 ? simulationResult.replaySteps[stepIndex] : null;
  const isProcessed = stepIndex >= 0 && stepIndex < simulationReplayIndex;
  const eventClass = step?.eventType && stepIndex <= simulationReplayIndex
    ? `board-cell--event-${step.eventType}`
    : "";

  if (isCurrent) return `board-cell--replay-current ${eventClass}`.trim();
  if (isProcessed) return `board-cell--replay-done ${eventClass}`.trim();
  return "board-cell--replay-pending";
}

let isDebtTokenModalOpen = false;
let debtTokenModalNotice = "";

function getCurrentCoinDebtAmount() {
  if (isOnlineRoomActive()) {
    const onlineSelf = getOnlineSelfPublicPlayer();

    return Math.max(0, onlineSelf?.coinDebt ?? 0);
  }

  return Math.max(0, localCoinDebt);
}

function openDebtTokenModal() {
  if (isSpectatingOnlinePlayer()) return;
  if (getCurrentCoinDebtAmount() <= 0) return;

  isDebtTokenModalOpen = true;
  debtTokenModalNotice = "";
  rerenderGameShell();
}

function closeDebtTokenModal() {
  isDebtTokenModalOpen = false;
  debtTokenModalNotice = "";
  rerenderGameShell();
}

function payCurrentCoinDebt() {
  if (isSpectatingOnlinePlayer()) return;

  const debtAmount = getCurrentCoinDebtAmount();

  if (debtAmount <= 0) {
    closeDebtTokenModal();
    return;
  }

  if (isOnlineRoomActive()) {
    sendPayDebt();
    closeDebtTokenModal();
    return;
  }

  const remaining = getRemainingResources();
  const payableAmount = Math.min(remaining.coin, localCoinDebt);

  if (payableAmount <= 0) {
    debtTokenModalNotice = "Bạn chưa có xu để trả nợ lúc này.";
    rerenderGameShell();
    return;
  }

  localCoinDebt = Math.max(0, localCoinDebt - payableAmount);
  eventResourceModifier = {
    ...eventResourceModifier,
    coin: eventResourceModifier.coin - payableAmount,
  };

  debtTokenModalNotice =
    localCoinDebt > 0
      ? `Đã trả ${payableAmount} xu. Hiện còn nợ ${localCoinDebt} xu.`
      : `Đã trả hết nợ (${payableAmount} xu).`;

  playGameSound("eventPromo");

  if (localCoinDebt <= 0) {
    closeDebtTokenModal();
    return;
  }

  rerenderGameShell();
}

function renderDebtSealGlyph() {
  return `
    <svg class="player-effect-seal__icon-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path class="player-effect-seal__icon-solid" d="M30.8 10.2c.8-1.5 2.9-1.5 3.7 0l2.2 4.1c.3.5.8.9 1.4 1l4.8 1c1.8.4 2.3 2.6.9 3.7l-3.3 2.7c-.5.4-.8 1-.8 1.6l.1 1.8c4.4 1.8 7.5 5.9 7.5 10.7c0 6.4-5.1 11.5-11.5 11.5h-7.6c-6.8 0-12.4-5.5-12.4-12.3c0-4.8 2.8-8.9 6.9-10.8l.1-.9c.1-.7-.2-1.3-.7-1.8l-3-2.5c-1.4-1.2-.8-3.4 1-3.8l4.4-.9c.6-.1 1.1-.5 1.4-1l2.3-4.1Z"/>
      <path class="player-effect-seal__icon-cut" d="M34.8 29.6l-3.2 5l3.5 3.2l-2.5 4.6l4.1 3.6"/>
      <text class="player-effect-seal__icon-mark" x="31.9" y="38.6" text-anchor="middle">$</text>
    </svg>
  `;
}

function renderDebtTokenModal() {
  if (!isDebtTokenModalOpen) return "";

  const debtAmount = getCurrentCoinDebtAmount();
  const remainingCoin = getRemainingResources().coin;
  const totalPenalty = debtAmount * 10;

  return `
    <div
      class="effect-token-modal-backdrop"
      onclick="event.stopPropagation(); window.closeDebtTokenModal()"
    >
      <section
        class="effect-token-modal effect-token-modal--debt"
        onclick="event.stopPropagation()"
      >
        <button
          type="button"
          class="effect-token-modal__close"
          onclick="event.stopPropagation(); window.closeDebtTokenModal()"
          aria-label="Đóng cửa sổ token nợ"
          title="Đóng"
        >
          ✕
        </button>

        <div class="effect-token-modal__header">
          <div class="effect-token-modal__seal-preview">
            <span class="player-effect-seal player-effect-seal--debt player-effect-seal--preview">
              <span class="player-effect-seal__surface">
                <span class="player-effect-seal__ring"></span>
                <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${renderDebtSealGlyph()}</span>
              </span>

              <span class="player-effect-seal__count">${debtAmount}</span>
            </span>
          </div>

          <div class="effect-token-modal__title-wrap">
            <span class="effect-token-modal__eyebrow">TOKEN NỢ</span>
            <h3>Nợ ${debtAmount} xu</h3>
            <p>Cuối game nếu chưa trả: <strong>-${totalPenalty} VP</strong></p>
          </div>
        </div>

        <div class="effect-token-modal__body">
          <div class="effect-token-modal__info">
            <div>
              <span>Hiện đang nợ</span>
              <strong>${debtAmount} xu</strong>
            </div>
            <div>
              <span>Xu hiện có</span>
              <strong>${remainingCoin} xu</strong>
            </div>
          </div>

          <p class="effect-token-modal__desc">
            Bấm trả nợ để thanh toán số xu hiện đang nợ. Nếu kết thúc game mà vẫn còn nợ,
            bạn sẽ bị trừ tổng cộng <strong>-${totalPenalty} VP</strong>.
          </p>

          ${
            debtTokenModalNotice
              ? `<div class="effect-token-modal__notice">${debtTokenModalNotice}</div>`
              : ""
          }
        </div>

        <div class="effect-token-modal__footer">
          <button
            type="button"
            class="effect-token-modal__ghost"
            onclick="event.stopPropagation(); window.closeDebtTokenModal()"
          >
            Đóng
          </button>

          <button
            type="button"
            class="effect-token-modal__primary ${remainingCoin <= 0 ? "is-disabled" : ""}"
            onclick="event.stopPropagation(); window.payCoinDebtFromModal()"
          >
            Trả nợ
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderPlayerEffectTokens() {
  const effectTokens: string[] = [];
  const coinDebt = getCurrentCoinDebtAmount();

  if (coinDebt > 0) {
    effectTokens.push(`
      <${isSpectatingOnlinePlayer() ? "div" : "button"}
        ${isSpectatingOnlinePlayer() ? "" : 'type="button"'}
        class="player-effect-seal player-effect-seal--debt ${isSpectatingOnlinePlayer() ? "player-effect-seal--readonly" : ""}"
        ${isSpectatingOnlinePlayer() ? "" : 'onclick="event.stopPropagation(); window.openDebtTokenModal()"'}
        aria-label="Token nợ: ${coinDebt} xu"
      >
        <span class="player-effect-seal__surface">
          <span class="player-effect-seal__ring"></span>

          <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${renderDebtSealGlyph()}</span>
        </span>

        <span class="player-effect-seal__count">${coinDebt}</span>
        <span class="player-effect-seal__hover-label">TOKEN NỢ</span>
      </${isSpectatingOnlinePlayer() ? "div" : "button"}>
    `);
  }

  if (!effectTokens.length) {
    return "";
  }

  return `
    <div class="player-effect-dock">
      ${effectTokens.join("")}
    </div>
  `;
}

function renderSpectateDeckPlaceholder() {
  return "";
}

function renderDeckPilePanel() {
  if (isSpectatingOnlinePlayer()) {
    return renderSpectateDeckPlaceholder();
  }

  const deckCount = isOnlineRoomActive() ? 0 : deck.length;
  const handCount =
    (isOnlineRoomActive() ? getOnlineSelfHand() : null)?.length ?? playerHand.length;
  const canConfirm =
    !!(draftHandPendingCardId || draftSelectedCardId) &&
    !isDraftPickFlying &&
    !isPassingDraftCards &&
    !isDraftDealVisualActive() &&
    !isDraftPoolCollapseAnimating;
  const isOnlinePlanning = isOnlinePlanningPhase();
  const selfPlanningConfirmed = isSelfPlanningConfirmed();
  const serverPhase = onlineClientState.roomState?.phase;
  const showDraftConfirm = isDraftPhase && serverPhase === "draft";
  const showPlanningConfirm = isOnlinePlanning && serverPhase === "planning";
  const planningStatusLabel = showPlanningConfirm ? getPlanningConfirmStatusLabel() : "";
  const planningConfirmButton = showPlanningConfirm
    ? `
      <div class="deck-pile-panel__planning-actions">
        <button
          type="button"
          class="deck-pile-panel__planning-confirm"
          onclick="event.stopPropagation(); confirmPlanningPick()"
          ${selfPlanningConfirmed ? "disabled" : ""}
        >
          ${selfPlanningConfirmed ? "Đã xác nhận" : "Xác nhận"}
        </button>
        ${planningStatusLabel ? `<div class="deck-pile-panel__planning-status">${planningStatusLabel}</div>` : ""}
      </div>
    `
    : "";
  const draftConfirmButton = showDraftConfirm
    ? `
      <button
        type="button"
        class="deck-pile-panel__draft-confirm"
        onclick="event.stopPropagation(); confirmDraftPick()"
        ${canConfirm ? "" : "disabled"}
      >
        Kết thúc lượt
      </button>
    `
    : "";
  const phaseConfirmButton = draftConfirmButton || planningConfirmButton;

  const effectTokensHtml = renderPlayerEffectTokens();
  const poolToggleButton = renderDraftPoolCollapseButton();
  const showDeckHeader = showDraftConfirm || showPlanningConfirm || effectTokensHtml.length > 0;
  const deckPanelHeader = showDeckHeader
    ? `
      <div class="deck-pile-panel__header">
        <div class="deck-pile-panel__header-left">${poolToggleButton}${effectTokensHtml}</div>
        <div class="deck-pile-panel__header-right">${phaseConfirmButton}</div>
      </div>
    `
    : "";

  return `
    <section
      class="deck-pile-panel${isDraftPhase ? " deck-pile-panel--draft" : ""}"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      ${deckPanelHeader}

      <div class="deck-pile-panel__visual">
        <div class="deck-card-stack">
          <div class="deck-card-stack__card deck-card-stack__card--layer-3"></div>
          <div class="deck-card-stack__card deck-card-stack__card--layer-2"></div>
          <div class="deck-card-stack__card deck-card-stack__card--layer-1"></div>

          <div class="deck-card-stack__card deck-card-stack__card--back">
            <div class="deck-card-stack__back-frame">
              <div class="deck-card-stack__corner deck-card-stack__corner--tl">✦</div>
              <div class="deck-card-stack__corner deck-card-stack__corner--tr">✦</div>
              <div class="deck-card-stack__corner deck-card-stack__corner--bl">✦</div>
              <div class="deck-card-stack__corner deck-card-stack__corner--br">✦</div>

              <div class="deck-card-stack__crest">
                <div class="deck-card-stack__crest-ring"></div>
                <div class="deck-card-stack__crest-core">🧭</div>
              </div>

              <div class="deck-card-stack__brand">
                <span class="deck-card-stack__brand-top">LỮ KHÁCH</span>
                <strong class="deck-card-stack__brand-main">BÀN CỜ</strong>
                <em class="deck-card-stack__brand-sub">TRAVEL DECK</em>
              </div>

              <div class="deck-card-stack__route">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="deck-pile-panel__info">
        <div>
          <span>Trên tay</span>
          <strong>${handCount}</strong>
        </div>

        <div>
          <span>Đã xếp ngày</span>
          <strong>${getCurrentDayPlacedCards().length}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderSpectateBanner() {
  return "";
}

function renderSpectateHandCard(card: TravelCardData, index: number) {
  return `
    <article
      class="spectate-card-tray__card hand-card hand-card--${card.rarity} hand-card--spectate-readonly"
      data-spectate-hand-card-id="${card.id}"
      title="${card.name} - ${card.city}"
      onclick="event.stopPropagation(); openSpectateHandCard('${card.id}')"
      style="--spectate-card-index: ${index};"
    >
      ${renderFramedCardFace(card, "hand")}
    </article>
  `;
}

function renderSpectateHandSection(
  title: string,
  label: string,
  cards: TravelCardData[],
  emptyText: string,
  className = ""
) {
  return `
    <div class="spectate-card-tray__section ${className}">
      <div class="spectate-card-tray__section-title">
        <span>${label}</span>
        <strong>${title}</strong>
        <em>${cards.length} lá</em>
      </div>

      <div class="spectate-card-tray__cards">
        ${cards.length > 0 ? cards.map((card, index) => renderSpectateHandCard(card, index)).join("") : `<div class="spectate-hand-empty">${emptyText}</div>`}
      </div>
    </div>
  `;
}

function renderSpectateHandPanel() {
  const viewedPlayerId = getViewedPlayerId();
  const targetPlayer = getViewedOnlinePlayer();
  const viewedPlayerName = targetPlayer?.name ?? "đối thủ";
  const handCards = getOnlinePlayerHand(viewedPlayerId) ?? [];
  const pickedDraftCards = getSpectatePickedDraftCards();
  const displayCards = isDraftPhase ? pickedDraftCards : handCards;
  const displayCount = displayCards.length;
  const emptyText = isDraftPhase
    ? "Đối thủ chưa chọn lá nào trong vòng draft này."
    : "Đối thủ chưa có bài trên tay.";

  return `
    <section
      class="player-hand player-hand--spectate-normal ${isDraftPhase ? "player-hand--draft player-hand--spectate-draft" : ""}"
      onclick="event.stopPropagation()"
      aria-label="Bài của người chơi đang xem"
    >
      <div class="player-hand__top player-hand__top--spectate">
        <div class="player-hand__title">
          <span class="hand-badge">${isDraftPhase ? "PICK" : "HAND"}</span>
          <h2>${isDraftPhase ? `Lá đã chọn của ${viewedPlayerName}` : `Bài trên tay của ${viewedPlayerName}`}</h2>
        </div>

        <button
          type="button"
          class="player-hand__return-button"
          onclick="event.stopPropagation(); returnToOwnBoard()"
          title="Quay về bàn của mình"
        >
          ← Bàn mình
        </button>
      </div>

      <div class="player-hand__cards ${isDraftPhase ? `player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${Math.max(1, displayCount)}` : ""}">
        ${
          displayCount > 0
            ? displayCards.map((card, index) => renderSpectateReadonlyHandCard(card, index)).join("")
            : `<div class="spectate-normal-empty">${emptyText}</div>`
        }
      </div>
    </section>
  `;
}

function renderSpectateReturnButton() {
  return "";
}

function renderSpectateReadonlyHandCard(card: TravelCardData, index: number) {
  const pickedClass = isDraftPhase
    ? ` hand-card--picked-draft hand-card--picked-slot-${index + 1}`
    : ` hand-card--fan-${index + 1}`;

  return `
    <article
      class="hand-card hand-card--${card.rarity} hand-card--spectate-readonly${pickedClass}"
      data-spectate-hand-card-id="${card.id}"
      title="${card.name} - ${card.city}"
      onclick="event.stopPropagation(); openSpectateHandCard('${card.id}')"
      style="--hand-card-index: ${index};"
    >
      ${renderFramedCardFace(card, "hand")}
    </article>
  `;
}

function renderMainArena() {
  const focusedCard = getHandCardById(focusedHandCardId) ?? focusedBoardCard;
  const isSpectating = isSpectatingOnlinePlayer();

  return `
    <main class="arena ${isOnlineGameOver() ? "arena--gameover" : ""} ${isSimulationMode ? "arena--scanning" : ""} ${isSpectating ? "arena--spectating" : ""}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${getDisplayPlayerName()}</h1>
          </div>
        </div>

        ${renderScoreBreakdownPanel()}
      </div>

      ${renderSpectateBanner()}

      ${renderResourceOrbs()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${days.map((day, dayIndex) => `<div class="day-pill ${dayIndex === currentDayIndex ? "day-pill--current" : ""} ${dayIndex < currentDayIndex ? "day-pill--done" : ""}">NGÀY ${day}</div>`).join("")}
          </div>

          <section class="board-grid">
            ${rows
              .map((row, rowIndex) => {
                return `
                  <div class="time-label">${row}</div>

                  ${days
                    .map((_, colIndex) => {
                      const card = getBoardCardByPosition(rowIndex, colIndex);
                      const isCurrentDayColumn = colIndex === currentDayIndex;
                      const isPlaceable = !isSpectating && !isDraftPhase && !isSimulationMode && !isInitialDealInProgress && isCurrentDayColumn && selectedHandCardId !== null && card === null;

                      if (!card) {
                        return `
                          <div
                            class="board-cell board-cell--empty ${getBoardCellReplayClass(rowIndex, colIndex)} ${isSimulationMode ? "board-cell--locked-mode" : ""} ${!isCurrentDayColumn && !isSimulationMode ? "board-cell--not-current-day" : ""} ${isPlaceable ? "board-cell--placeable" : ""}"
                            data-board-drop-cell="true"
                            data-row-index="${rowIndex}"
                            data-col-index="${colIndex}"
                            onclick="event.stopPropagation(); handleBoardCellClick(${rowIndex}, ${colIndex})"
                            title="${isCurrentDayColumn ? (isPlaceable ? "Thả lá đang kéo vào ô ngày hiện tại" : "Chỉ xếp bài cho ngày hiện tại") : "Không phải ngày hiện tại"}"
                          >
                            <span class="empty-plus">+</span>
                            ${renderUtilityEffectFlash(rowIndex, colIndex)}
                          </div>
                        `;
                      }

                      return `
                        <div
                          class="board-cell board-cell--occupied board-cell--clickable ${getBoardCellReplayClass(rowIndex, colIndex)} ${isLastPlacedBoardCell(rowIndex, colIndex) ? "board-cell--just-placed" : ""}"
                          data-board-drop-cell="true"
                          data-row-index="${rowIndex}"
                          data-col-index="${colIndex}"
                          onclick="event.stopPropagation(); handleBoardCellClick(${rowIndex}, ${colIndex})"
                          title="Ô đã có bài - bấm để xem lớn"
                        >
                          ${renderBoardMiniCard(card, getReplayStepForBoardCell(rowIndex, colIndex))}
                            ${renderUtilityEffectFlash(rowIndex, colIndex)}
                        </div>
                      `;
                    })
                    .join("")}
                `;
              })
              .join("")}
          </section>
          ${isSpectating && isDraftPhase ? renderSpectateDraftCenterOverlay() : renderDraftCenterOverlay()}${renderDraftLeftoverReturnOverlay()}
          ${renderSpectateReturnButton()}
        </div>

        ${isOnlineGameOver() ? renderFinalRankingPanel() : isDraftPhase ? "" : renderSimulationResultPanel()}

        ${
          isSimulationMode
            ? ""
            : isSpectating
              ? renderSpectateHandPanel()
              : `
              <section
          class="player-hand ${isDraftPhase ? "player-hand--draft" : ""} ${!isDraftPhase && isInitialDealInProgress ? "player-hand--dealing is-dealing" : ""}"
          onclick="${isDraftPhase ? "" : "clearSelectedHandCard()"}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${isDraftPhase ? "DRAFT" : "HAND"}</span>
              <h2>
                ${
                  isDraftPhase
                    ? `Chọn bài ngày ${days[currentDayIndex]}`
                    : `Bài ngày ${days[currentDayIndex]}`
                }
              </h2>
            </div>

            <div class="player-hand__meta ${isDraftPhase && isDraftTimerDanger() ? "player-hand__meta--danger" : ""}">
              ${
                isDraftPhase
                  ? isDraftPickTimerFrozen()
                    ? "Đang chia bài..."
                    : `Còn ${draftPickSecondsLeft}s • ${isPassingDraftCards ? "Đang chuyền bài..." : "bấm 1 lá để chọn"}`
                  : isInitialDealInProgress
                    ? "Đang chia bài..."
                    : "Giữ 0.5s để xem lớn"
              }
            </div>
          </div>

          ${isDraftPhase ? renderDraftHandTopMeta() : ""}

          <div class="player-hand__cards ${isDraftPhase ? `player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${getDraftHandDisplayCount()}` : ""}">
            ${isDraftPhase ? renderPickedDraftCards() : playerHand.map((card, index) => renderHandCard(card, index)).join("")}
          </div>
        </section>
            `
        }
      </div>

      ${focusedCard ? renderFocusedCard(focusedCard) : ""}
    </main>
  `;
}

function clearHoldTimer() {
  if (holdTimer !== null) {
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }
}

let lastAnimatedCoin = -1;
let lastAnimatedStamina = -1;

function spawnFloatingText(selector: string, delta: number, type: 'coin' | 'stamina') {
  const container = document.querySelector(selector);
  if (!container) return;
  const textNode = document.createElement('div');
  textNode.className = `floating-text floating-text--${type}`;
  textNode.textContent = `${delta > 0 ? '+' : ''}${delta}`;
  container.appendChild(textNode);
  container.classList.remove('resource-pulse');
  void container.clientWidth; // force reflow
  container.classList.add('resource-pulse');
  setTimeout(() => textNode.remove(), 1200);
}

function rerenderArena() {
  const arena = document.querySelector(".arena");
  if (!arena) return;

  arena.outerHTML = renderMainArena();

  if (isDraftDealVisualActive()) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        restartDraftCenterDealVisuals();
      });
    });
  }

  requestAnimationFrame(() => {
    const remaining = getRemainingResources();
    if (lastAnimatedCoin !== -1 && remaining.coin !== lastAnimatedCoin) {
      spawnFloatingText('.resource-orb--coin .resource-orb__frame', remaining.coin - lastAnimatedCoin, 'coin');
    }
    if (lastAnimatedStamina !== -1 && remaining.stamina !== lastAnimatedStamina) {
      spawnFloatingText('.resource-orb--stamina .resource-orb__frame', remaining.stamina - lastAnimatedStamina, 'stamina');
    }
    lastAnimatedCoin = remaining.coin;
    lastAnimatedStamina = remaining.stamina;
  });
}

function placeHandCardOnBoard(cardId: string, rowIndex: number, colIndex: number) {
  if (isSpectatingOnlinePlayer()) return;
  if (isSimulationMode || isInitialDealInProgress) return;
  if (colIndex !== currentDayIndex) return;
  if (!canPlaceOnBoardCell(rowIndex, colIndex)) return;

  const handIndex = playerHand.findIndex((card) => card.id === cardId);
  if (handIndex === -1) return;

  const selectedCard = playerHand[handIndex];

  if (isOnlineRoomActive()) {
    playGameSound("cardPlace");

    const onlineUtilityEffect = getUtilityPlacementEffect(selectedCard);

    if (onlineUtilityEffect) {
      triggerUtilityEffectFlash({
        rowIndex,
        colIndex,
        type: onlineUtilityEffect.type,
        value: onlineUtilityEffect.value,
      });
    }

    sendPlaceCard({
      cardId: selectedCard.id,
      rowIndex,
      colIndex,
      tag: selectedCard.tag,
      icon: selectedCard.icon,
      vp: selectedCard.vp,
      coin: selectedCard.coin,
      stamina: selectedCard.stamina,
      name: selectedCard.name,
    });

    selectedHandCardId = null;
    draggedHandCardId = null;
    focusedHandCardId = null;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    suppressNextClick = false;

    if (onlineUtilityEffect) {
      rerenderArena();
    }

    return;
  }

  const remainingBeforePlace = getRemainingResources();
  const coinDebt = Math.max(0, selectedCard.coin - remainingBeforePlace.coin);
  const staminaDebt = Math.max(0, selectedCard.stamina - remainingBeforePlace.stamina);

  playGameSound("cardPlace");

  playerHand.splice(handIndex, 1);

  const didApplyUtilityEffect = applyUtilityPlacementEffect(selectedCard, rowIndex, colIndex);

  if (!didApplyUtilityEffect) {
    getBoardSlots()[rowIndex][colIndex] = selectedCard;

    addLocalDebtOrExhaustToken({
      rowIndex,
      colIndex,
      card: selectedCard,
      coinDebt,
      staminaDebt,
    });
  }

  sendPlaceCard({
    cardId: selectedCard.id,
    rowIndex,
    colIndex,
    tag: selectedCard.tag,
    icon: selectedCard.icon,
    vp: selectedCard.vp,
    coin: selectedCard.coin,
    stamina: selectedCard.stamina,
    image: selectedCard.image,
    name: selectedCard.name,
  });

  placeBotCardsAfterPlayerMove(selectedCard);

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = false;

  lastPlacedBoardPosition = { rowIndex, colIndex };

  rerenderArena();

  window.setTimeout(() => {
    if (
      lastPlacedBoardPosition?.rowIndex === rowIndex &&
      lastPlacedBoardPosition?.colIndex === colIndex
    ) {
      lastPlacedBoardPosition = null;
      rerenderArena();
    }
  }, 420);
}

function placeSelectedHandCard(rowIndex: number, colIndex: number) {
  if (!selectedHandCardId) return;

  placeHandCardOnBoard(selectedHandCardId, rowIndex, colIndex);
}

function returnFocusedBoardCardToHand() {
  if (isSpectatingOnlinePlayer()) return;
  if (isSimulationMode) return;
  if (!focusedBoardPosition) return;

  const { rowIndex, colIndex } = focusedBoardPosition;
  if (colIndex !== currentDayIndex) return;

  const card = getBoardSlots()[rowIndex]?.[colIndex];

  if (!card || isBoardDebtToken(card) || isBoardLockToken(card)) return;

  /*
    Online board là state từ server. Không được chỉ set null trên client,
    vì lần nhận room:state tiếp theo server sẽ gửi lại lá đó và nó hiện lại.
    Phải gửi event lên server để xóa ô thật.
  */
  if (isOnlineRoomActive()) {
    sendReturnBoardCard({
      rowIndex,
      colIndex,
    });

    focusedHandCardId = null;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    lastPlacedBoardPosition = null;
    selectedHandCardId = null;
    suppressNextClick = false;

    return;
  }

  getBoardSlots()[rowIndex][colIndex] = null;
  clearLocalGeneratedTokenForReturnedCard(rowIndex, colIndex, card);

  /*
    Hand UI hiện được thiết kế đẹp nhất cho 5 lá.
    Khi đặt bài xuống board, game đã tự rút thêm 1 lá từ deck để bù hand.
    Vì vậy nếu rút lá từ board về tay mà chỉ push(card), hand sẽ thành 6 lá
    và fan-layout bị tràn/cứng như ảnh bạn gửi.

    Cách xử lý prototype:
    - Rút lá board về tay.
    - Nếu hand đang đủ 5 lá, trả lá cuối cùng của hand về đầu deck.
    - Hand luôn giữ tối đa 5 lá, layout không bị vỡ.
  */
  playerHand.unshift(card);

  while (playerHand.length > HAND_SIZE) {
    const overflowCard = playerHand.pop();

    if (overflowCard) {
      deck.unshift(overflowCard);
    }
  }

  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  lastPlacedBoardPosition = null;
  selectedHandCardId = null;
  suppressNextClick = false;

  rerenderArena();
}

function beginHandCardVisualDrag(event: PointerEvent) {
  if (!handPointerDragState || handPointerDragState.isDragging) return;

  clearHoldTimer();
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = false;

  const { source } = handPointerDragState;
  const rect = source.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;

  clone.classList.add("hand-card--drag-clone");
  clone.classList.remove("hand-card--selected");
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.top = `${rect.top}px`;
  clone.style.transform = "none";
  clone.style.pointerEvents = "none";

  document.body.appendChild(clone);

  source.classList.add("hand-card--drag-source-hidden");

  handPointerDragState.clone = clone;
  handPointerDragState.offsetX = event.clientX - rect.left;
  handPointerDragState.offsetY = event.clientY - rect.top;
  handPointerDragState.isDragging = true;
    didMoveHandPointerDrag = true;

  draggedHandCardId = handPointerDragState.id;
  selectedHandCardId = handPointerDragState.id;

  updateHandCardDragPosition(event);
}

function updateHandCardDragPosition(event: PointerEvent) {
  if (!handPointerDragState?.clone) return;

  handPointerDragState.clone.style.left = `${event.clientX - handPointerDragState.offsetX}px`;
  handPointerDragState.clone.style.top = `${event.clientY - handPointerDragState.offsetY}px`;
}

function getDropCellFromPointer(event: PointerEvent) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  return element?.closest("[data-board-drop-cell='true']") as HTMLElement | null;
}

function getDeckDiscardTargetFromPointer(event: PointerEvent) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  return element?.closest("[data-discard-drop-zone='true']") as HTMLElement | null;
}

function clearDeckDiscardHoverClass() {
  document
    .querySelectorAll(".deck-pile-panel--discard-hover")
    .forEach((element) => {
      element.classList.remove("deck-pile-panel--discard-hover");
      delete (element as HTMLElement).dataset.discardCoin;
      delete (element as HTMLElement).dataset.discardStamina;
    });
}

function canDiscardHandCard() {
  return !isSpectatingOnlinePlayer() && !isDraftPhase && !isSimulationMode && !isInitialDealInProgress;
}

function discardHandCardToDeck(cardId: string) {
  if (!canDiscardHandCard()) return;

  const handIndex = playerHand.findIndex((card) => card.id === cardId);
  if (handIndex === -1) return;

  const selectedCard = playerHand[handIndex];

  playGameSound("returnDeck");

  if (isOnlineRoomActive()) {
    const state = onlineClientState.roomState;
    const selfPlayerId = onlineClientState.playerId;

    /*
      Optimistic update để UI đổi ngay:
      - remove lá khỏi hand
      - cộng coin/stamina trên public player
      Server vẫn là nguồn chính, room:state gửi về sẽ xác nhận lại.
    */
    if (state && selfPlayerId) {
      const onlineHandIndex = state.self.hand.findIndex((card) => card.id === selectedCard.id);

      if (onlineHandIndex >= 0) {
        state.self.hand.splice(onlineHandIndex, 1);
      }

      const publicSelf = state.players[selfPlayerId];

      if (publicSelf) {
        publicSelf.coin += selectedCard.coin;
        publicSelf.stamina += selectedCard.stamina;
      }

      playerHand = [...(state.self.hand as TravelCardData[])];
    }

    sendDiscardCard({
      cardId: selectedCard.id,
      coin: selectedCard.coin,
      stamina: selectedCard.stamina,
      name: selectedCard.name,
    });

    selectedHandCardId = null;
    draggedHandCardId = null;
    focusedHandCardId = null;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    suppressNextClick = false;

    rerenderGameShell();
    return;
  }

  playerHand.splice(handIndex, 1);

  discardedResourceBonus = {
    coin: discardedResourceBonus.coin + selectedCard.coin,
    stamina: discardedResourceBonus.stamina + selectedCard.stamina,
  };

  selectedHandCardId = null;
  draggedHandCardId = null;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = false;

  rerenderArena();
}

function clearCustomHandDragVisuals() {
  clearBoardDragHoverClass();
  clearDeckDiscardHoverClass();

  if (handPointerDragState?.source) {
    handPointerDragState.source.classList.remove("hand-card--drag-source-hidden");
  }

  handPointerDragState?.clone?.remove();
  handPointerDragState = null;
  draggedHandCardId = null;
  
  // Valid Slot Highlight Remove
  document.querySelectorAll('.board-cell--placeable').forEach(el => el.classList.remove('board-cell--placeable'));
}

function handleHandPointerMove(event: PointerEvent) {
  if (!handPointerDragState) return;

  const distanceX = event.clientX - handPointerDragState.startX;
  const distanceY = event.clientY - handPointerDragState.startY;
  const distance = Math.hypot(distanceX, distanceY);

  if (!handPointerDragState.isDragging && distance >= 8) {
    clearHoldTimer();
    beginHandCardVisualDrag(event);
  }

  if (!handPointerDragState?.isDragging) return;

  event.preventDefault();
  updateHandCardDragPosition(event);

  clearBoardDragHoverClass();
  clearDeckDiscardHoverClass();

  const discardTarget = getDeckDiscardTargetFromPointer(event);

  if (discardTarget && canDiscardHandCard()) {
    const draggedDiscardCard = getHandCardById(draggedHandCardId);

    discardTarget.classList.add("deck-pile-panel--discard-hover");
    discardTarget.dataset.discardCoin = String(draggedDiscardCard?.coin ?? 0);
    discardTarget.dataset.discardStamina = String(draggedDiscardCard?.stamina ?? 0);
    return;
  }

  const dropCell = getDropCellFromPointer(event);

  if (!dropCell) return;

  const rowIndex = Number(dropCell.dataset.rowIndex);
  const colIndex = Number(dropCell.dataset.colIndex);

  const draggedCard = getHandCardById(draggedHandCardId);

  if (
    Number.isInteger(rowIndex) &&
    Number.isInteger(colIndex) &&
    canPlaceOnBoardCell(rowIndex, colIndex) &&
    draggedCard
  ) {
    /*
      Cho phép thả cả khi không đủ xu/thể lực.
      Khi đặt xuống, game sẽ tự tạo token Nợ / Kiệt sức ở ngày hôm sau.
    */
    dropCell.classList.add("board-cell--drag-hover");
  } else {
    dropCell.classList.add("board-cell--drag-invalid");
  }
}

function handleHandPointerUp(event: PointerEvent) {
  document.removeEventListener("pointermove", handleHandPointerMove);
  document.removeEventListener("pointerup", handleHandPointerUp);
  document.removeEventListener("pointercancel", handleHandPointerCancel);

  const dragState = handPointerDragState;
  const wasDragging = dragState?.isDragging === true;

  clearHoldTimer();

  if (!dragState) return;

  if (wasDragging) {
    const dropCell = getDropCellFromPointer(event);
    const discardTarget = getDeckDiscardTargetFromPointer(event);
    const rowIndex = Number(dropCell?.dataset.rowIndex);
    const colIndex = Number(dropCell?.dataset.colIndex);
    const cardId = dragState.id;

    clearCustomHandDragVisuals();

    suppressNextClick = true;

    window.setTimeout(() => {
      suppressNextClick = false;
    }, 0);

    const draggedCard = getHandCardById(cardId);

    if (discardTarget && draggedCard && canDiscardHandCard()) {
      discardHandCardToDeck(cardId);
      return;
    }

    if (
      dropCell &&
      Number.isInteger(rowIndex) &&
      Number.isInteger(colIndex) &&
      canPlaceOnBoardCell(rowIndex, colIndex) &&
      draggedCard
    ) {
      placeHandCardOnBoard(cardId, rowIndex, colIndex);
      return;
    }

    if (dropCell && Number.isInteger(rowIndex) && Number.isInteger(colIndex)) {
      triggerResourceRejectedFeedback(rowIndex, colIndex);
    } else {
      triggerResourceRejectedFeedback();
    }

    selectedHandCardId = null;
    rerenderArena();
    return;
  }

  clearCustomHandDragVisuals();
}

function handleHandPointerCancel() {
  document.removeEventListener("pointermove", handleHandPointerMove);
  document.removeEventListener("pointerup", handleHandPointerUp);
  document.removeEventListener("pointercancel", handleHandPointerCancel);

  clearHoldTimer();
  clearCustomHandDragVisuals();

  selectedHandCardId = null;
  suppressNextClick = false;

  rerenderArena();
}

function triggerResourceRejectedFeedback(rowIndex?: number, colIndex?: number) {
  playGameSound("reject");

  const target =
    rowIndex !== undefined && colIndex !== undefined
      ? document.querySelector(`[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`)
      : document.querySelector(".arena");

  target?.classList.add("resource-rejected-feedback");

  window.setTimeout(() => {
    target?.classList.remove("resource-rejected-feedback");
  }, 380);
}

function getDraggedCardIdFromEvent(event: DragEvent) {
  const fromDataTransfer = event.dataTransfer?.getData("text/plain");

  return fromDataTransfer || draggedHandCardId;
}

function clearBoardDragHoverClass() {
  document
    .querySelectorAll(".board-cell--drag-hover, .board-cell--drag-invalid")
    .forEach((element) => {
      element.classList.remove("board-cell--drag-hover");
      element.classList.remove("board-cell--drag-invalid");
    });
}

(window as any).startDragHandCard = (event: DragEvent, id: string) => {
  if (isSpectatingOnlinePlayer()) return;

  clearHoldTimer();

  /*
    Không rerender ở dragstart.
    Nếu rerender tại đây, DOM của lá đang bị kéo sẽ bị thay mới ngay lập tức,
    khiến trình duyệt hủy thao tác drag nên bạn sẽ thấy "không kéo được".
  */
  draggedHandCardId = id;
  selectedHandCardId = id;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  suppressNextClick = true;

  event.dataTransfer?.setData("text/plain", id);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

(window as any).endDragHandCard = () => {
  clearHoldTimer();
  clearBoardDragHoverClass();

  draggedHandCardId = null;

  window.setTimeout(() => {
    suppressNextClick = false;
  }, 0);
};

(window as any).handleBoardCellDragOver = (event: DragEvent, rowIndex: number, colIndex: number) => {
  if (isSpectatingOnlinePlayer()) return;
  if (!draggedHandCardId) return;
  if (getBoardSlots()[rowIndex][colIndex] !== null) return;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }

  const target = event.currentTarget as HTMLElement | null;
  target?.classList.add("board-cell--drag-hover");
};

(window as any).handleBoardCellDragLeave = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  target?.classList.remove("board-cell--drag-hover");
};

(window as any).dropHandCardOnBoard = (event: DragEvent, rowIndex: number, colIndex: number) => {
  if (isSpectatingOnlinePlayer()) return;

  clearHoldTimer();
  clearBoardDragHoverClass();

  const cardId = getDraggedCardIdFromEvent(event);

  draggedHandCardId = null;

  if (!cardId) return;

  const card = getHandCardById(cardId);

  if (!canPlaceOnBoardCell(rowIndex, colIndex) || !card) {
    triggerResourceRejectedFeedback(rowIndex, colIndex);
    return;
  }

  placeHandCardOnBoard(cardId, rowIndex, colIndex);
};

(window as any).startHandPointerDrag = (event: PointerEvent, id: string) => {
  if (isSpectatingOnlinePlayer()) return;
  if (isInitialDealInProgress) return;

  if (isSimulationMode) return;
  if (event.button !== 0) return;

  didMoveHandPointerDrag = false;
  lastPointerDownCardId = id;

  const card = getHandCardById(id);

  /*
    Không chặn card thiếu tài nguyên nữa.
    Thiếu xu/thể lực vẫn được chọn/kéo để tạo cơ chế Nợ / Kiệt sức.
  */
  if (!card) return;

  clearCustomHandDragVisuals();

  const source = event.currentTarget as HTMLElement | null;
  if (!source) return;

  handPointerDragState = {
    id,
    source,
    clone: null,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
  };

  document.addEventListener("pointermove", handleHandPointerMove);
  document.addEventListener("pointerup", handleHandPointerUp);
  document.addEventListener("pointercancel", handleHandPointerCancel);

  // Valid Slot Highlight
  document.querySelectorAll('.board-cell').forEach((el) => {
    const r = parseInt(el.getAttribute('data-row-index') || '-1');
    const c = parseInt(el.getAttribute('data-col-index') || '-1');
    if (r >= 0 && c >= 0 && canPlaceOnBoardCell(r, c)) {
      el.classList.add('board-cell--placeable');
    }
  });
};

(window as any).openDebtTokenModal = () => {
  openDebtTokenModal();
};

(window as any).closeDebtTokenModal = () => {
  closeDebtTokenModal();
};

(window as any).payCoinDebtFromModal = () => {
  payCurrentCoinDebt();
};

(window as any).selectDraftCard = selectDraftCard;

(window as any).confirmDraftPick = confirmDraftPick;
(globalThis as any).confirmDraftPick = confirmDraftPick;
(window as any).confirmPlanningPick = confirmPlanningPick;
(globalThis as any).confirmPlanningPick = confirmPlanningPick;
(window as any).toggleDraftPoolCollapse = toggleDraftPoolCollapse;
(globalThis as any).toggleDraftPoolCollapse = toggleDraftPoolCollapse;

(window as any).startHoldHandCard = (id: string) => {
  if (isPassingDraftCards || isInitialDealInProgress) return;

  clearHoldTimer();

  holdTimer = window.setTimeout(() => {
    focusedHandCardId = id;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    suppressNextClick = true;
    clearHoldTimer();
    rerenderArena();
  }, 500);
};

(window as any).cancelHoldHandCard = () => {
  clearHoldTimer();
};

(window as any).clearSelectedHandCard = () => {
  clearHoldTimer();

  if (selectedHandCardId === null) return;

  selectedHandCardId = null;
  rerenderArena();
};

(window as any).spectatePlayerBoard = (playerId: PlayerId) => {
  if (!isOnlineRoomActive()) return;

  setSpectateTarget(playerId);
  rerenderGameShell();
};

(window as any).cycleSpectatePlayer = (direction: 1 | -1 = 1) => {
  cycleSpectateTarget(direction);
};

(window as any).returnToOwnBoard = () => {
  resetSpectateView();
  rerenderGameShell();
};

(window as any).openSpectateHandCard = (cardId: string) => {
  if (!isSpectatingOnlinePlayer()) return;

  const card = getSpectateHandCards().find((item) => item.id === cardId);

  if (!card) return;

  clearHoldTimer();
  focusedHandCardId = card.id;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  selectedHandCardId = null;
  draggedHandCardId = null;
  suppressNextClick = false;
  rerenderArena();
};

(window as any).handleBoardCellClick = (rowIndex: number, colIndex: number) => {
  clearHoldTimer();

  const card = getBoardCardByPosition(rowIndex, colIndex);

  if (isSpectatingOnlinePlayer()) {
    if (card) {
      clearCustomHandDragVisuals();
      focusedHandCardId = null;
      focusedBoardCard = card;
      focusedBoardPosition = { rowIndex, colIndex };
      selectedHandCardId = null;
      suppressNextClick = false;
      rerenderArena();
    }

    return;
  }

  if (card) {
    if (isBoardDebtToken(card)) {
      if (!isDraftPhase && !isInitialDealInProgress && colIndex === currentDayIndex && selectedHandCardId) {
        placeSelectedHandCard(rowIndex, colIndex);
        return;
      }

      payDebtToken(rowIndex, colIndex, card);
      return;
    }

    clearCustomHandDragVisuals();
    focusedHandCardId = null;
    focusedBoardCard = card;
    focusedBoardPosition = { rowIndex, colIndex };
    selectedHandCardId = null;
    suppressNextClick = false;
    rerenderArena();
    return;
  }

  if (!isDraftPhase && !isInitialDealInProgress && colIndex === currentDayIndex) {
    placeSelectedHandCard(rowIndex, colIndex);
  }
};

(window as any).focusBoardCard = (rowIndex: number, colIndex: number) => {
  const card = getBoardCardByPosition(rowIndex, colIndex);
  if (!card) return;

  focusedHandCardId = null;
  focusedBoardCard = card;
  focusedBoardPosition = { rowIndex, colIndex };
  selectedHandCardId = null;
  suppressNextClick = false;

  rerenderArena();
};

(window as any).runSimulation = () => {
  runSystemSimulation();
};

(window as any).resetSimulation = () => {
  resetTurnForPrototype();
};

(window as any).returnFocusedBoardCardToHand = () => {
  returnFocusedBoardCardToHand();
};

(window as any).closeFocusedHandCard = () => {
  clearHoldTimer();

  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;
  draggedHandCardId = null;
  suppressNextClick = false;

  rerenderArena();
};

function getStaticPlayerById(playerId: PlayerId): Player {
  const fallbackRankByPlayerId: Record<PlayerId, number> = {
    p1: 1,
    p2: 3,
    p3: 3,
    p4: 3,
  };

  return (
    [...playersLeftBase, ...playersRight].find((player) => player.id === playerId) ?? {
      id: playerId,
      rank: fallbackRankByPlayerId[playerId],
      name: playerId.toUpperCase(),
      score: 0,
      coin: STARTING_COIN,
      stamina: STARTING_STAMINA,
      usedSlots: 0,
    }
  );
}

function getVisibleSidePlayersForOnline(): Player[] {
  const selfPlayerId = onlineClientState.playerId;

  if (!selfPlayerId || !onlineClientState.roomState) {
    return [];
  }

  return playerIds
    .filter((playerId) => {
      if (playerId === selfPlayerId) return false;

      const onlinePlayer = onlineClientState.roomState?.players[playerId];

      /*
        Trong màn chơi chỉ hiện người chơi đang online.
        Slot trống/offline không render card mini/sidebar nữa, để chỗ đó là khoảng trắng.
        Lobby vẫn hiện OFFLINE để biết ai đã rời phòng.
      */
      return onlinePlayer?.isConnected === true;
    })
    .map((playerId) => {
      const staticPlayer = getStaticPlayerById(playerId);
      const onlinePlayer = onlineClientState.roomState?.players[playerId];

      return {
        ...staticPlayer,
        name: onlinePlayer?.name ?? staticPlayer.name,
        score: onlinePlayer?.score ?? staticPlayer.score,
        coin: onlinePlayer?.coin ?? staticPlayer.coin,
        stamina: onlinePlayer?.stamina ?? staticPlayer.stamina,
        usedSlots: onlinePlayer?.usedSlots ?? staticPlayer.usedSlots,
        active: false,
      };
    });
}

function getLeftSidePlayersToRender(): Player[] {
  if (isOnlineRoomActive()) {
    return getVisibleSidePlayersForOnline().slice(0, 2);
  }

  return getPlayersLeft();
}

function getRightSidePlayersToRender(): Player[] {
  if (isOnlineRoomActive()) {
    return getVisibleSidePlayersForOnline().slice(2);
  }

  return [playersRight[0]];
}

function getMidGameRankings() {
  const state = onlineClientState.roomState;

  if (!state) return [];

  return playerIds
    .map((playerId) => {
      const player = state.players[playerId];

      return {
        playerId,
        name: player?.name ?? playerId.toUpperCase(),
        score: player?.score ?? 0,
        coin: player?.coin ?? STARTING_COIN,
        stamina: player?.stamina ?? STARTING_STAMINA,
        usedSlots: player?.usedSlots ?? 0,
        isConnected: player?.isConnected ?? false,
        hasJoined: player?.hasJoined ?? false,
      };
    })
    .filter((player) => player.hasJoined || player.isConnected)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.usedSlots !== a.usedSlots) return b.usedSlots - a.usedSlots;
      return a.playerId.localeCompare(b.playerId);
    });
}

function renderMidGameRankingModal() {
  if (!isMidGameRankingOpen || !isOnlineRoomActive()) {
    return "";
  }

  const rankings = getMidGameRankings();
  const selfPlayerId = onlineClientState.playerId;
  const phaseDayLabel = getCompactPhaseDayLabel();

  return `
    <div class="mid-ranking-backdrop" onclick="event.stopPropagation(); closeMidGameRanking()">
      <section class="mid-ranking-modal" onclick="event.stopPropagation()">
        <div class="mid-ranking-modal__header">
          <div>
            <span>BẢNG XẾP HẠNG GIỮA TRẬN</span>
            <h2>${phaseDayLabel}</h2>
            <p>Cập nhật sau mỗi ngày khi server cộng điểm simulation xong.</p>
          </div>

          <button
            class="mid-ranking-modal__close"
            onclick="event.stopPropagation(); closeMidGameRanking()"
            title="Đóng bảng xếp hạng"
          >
            ✕
          </button>
        </div>

        <div class="mid-ranking-modal__list">
          ${
            rankings.length > 0
              ? rankings
                  .map((player, index) => {
                    const isSelf = player.playerId === selfPlayerId;
                    const canSpectateFromRank = !isSelf && player.hasJoined;

                    return `
                      <div
                        class="mid-ranking-row ${isSelf ? "mid-ranking-row--self" : ""} ${canSpectateFromRank ? "mid-ranking-row--spectatable" : ""}"
                        ${canSpectateFromRank ? `onclick="event.stopPropagation(); closeMidGameRanking(); spectatePlayerBoard('${player.playerId}')" title="Xem sàn của ${player.name}"` : ""}
                      >
                        <div class="mid-ranking-row__rank">#${index + 1}</div>

                        <div class="mid-ranking-row__player">
                          <strong>${player.name}</strong>
                          <span>${player.playerId}${player.isConnected ? "" : " • offline"}</span>
                        </div>

                        <div class="mid-ranking-row__score">${player.score} VP</div>

                        <div class="mid-ranking-row__meta">
                          <span>🪙 ${player.coin}</span>
                          <span>⚡ ${player.stamina}</span>
                          <span>${player.usedSlots}/25</span>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="mid-ranking-empty">Chưa có người chơi trong phòng.</div>`
          }
        </div>

        <div class="mid-ranking-modal__footer">
          Điểm chỉ thay đổi sau khi kết thúc quét điểm từng ngày.
        </div>
      </section>
    </div>
  `;
}



/* =========================================
   IN-GAME BACKGROUND MUSIC
   - Tắt media nền bên ngoài khi vào trận.
   - Phát nhạc nền riêng trong game.
   - Menu phòng có nút bật/tắt + thanh âm lượng.
   ========================================= */

const IN_GAME_BACKGROUND_MUSIC_SRC = "assets/sounds/in-game-background.mp3";
const IN_GAME_MUSIC_MUTED_KEY = "travelDeck.inGameMusicMuted";
const IN_GAME_MUSIC_VOLUME_KEY = "travelDeck.inGameMusicVolume";
const DEFAULT_IN_GAME_MUSIC_VOLUME = 0.5;

let inGameBackgroundMusic: HTMLAudioElement | null = null;
const savedInGameMusicMuted = localStorage.getItem(IN_GAME_MUSIC_MUTED_KEY);
const savedInGameMusicVolume = Number(localStorage.getItem(IN_GAME_MUSIC_VOLUME_KEY));
let isInGameMusicMuted = savedInGameMusicMuted === "true";
let inGameMusicVolume = savedInGameMusicVolume;

/*
  Mặc định nhạc trong game phải bắt đầu ở 50%.
  Nếu localStorage cũ từng lưu 0 do các bản trước, reset về 50% để không còn hiện 0%.
*/
if (!Number.isFinite(inGameMusicVolume) || inGameMusicVolume <= 0) {
  inGameMusicVolume = DEFAULT_IN_GAME_MUSIC_VOLUME;
  localStorage.setItem(IN_GAME_MUSIC_VOLUME_KEY, String(inGameMusicVolume));

  if (savedInGameMusicMuted === null) {
    localStorage.setItem(IN_GAME_MUSIC_MUTED_KEY, "false");
  }
}

function clampInGameMusicVolume(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getInGameBackgroundMusic() {
  if (!inGameBackgroundMusic) {
    const audio = new Audio(IN_GAME_BACKGROUND_MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = clampInGameMusicVolume(inGameMusicVolume);
    audio.muted = isInGameMusicMuted;
    inGameBackgroundMusic = audio;
  }

  return inGameBackgroundMusic;
}

function shouldPlayInGameMusic() {
  return isOnlineRoomActive() && onlineClientState.roomState?.phase !== "lobby";
}

function stopOutsideBackgroundMedia() {
  /*
    Tắt hẳn audio/video nền ngoài màn chơi, đặc biệt là video hero ở dashboard.
    Không đụng tới audio nền riêng trong game.
  */
  cleanupDashboardHub();
  document.querySelectorAll("audio, video").forEach((media) => {
    if (media === inGameBackgroundMusic) return;

    const element = media as HTMLMediaElement;

    try {
      element.pause();
      element.muted = true;

      if (element.id === "hub-hero-video" || element.classList.contains("hub-hero__video")) {
        element.currentTime = 0;
      }
    } catch {
      // Ignore browsers that block pausing detached media.
    }
  });
}

function syncInGameBackgroundMusic() {
  const audio = getInGameBackgroundMusic();

  audio.volume = clampInGameMusicVolume(inGameMusicVolume);
  audio.muted = isInGameMusicMuted;

  if (!shouldPlayInGameMusic()) {
    audio.pause();
    return;
  }

  stopOutsideBackgroundMedia();

  if (isInGameMusicMuted || inGameMusicVolume <= 0) {
    audio.pause();
    return;
  }

  void audio.play().catch(() => {
    /*
      Browser chỉ cho autoplay sau thao tác người dùng.
      setupInGameMusicDelegation sẽ gọi lại hàm này ở pointerdown/click tiếp theo.
    */
  });
}

function updateInGameMusicMenuDom() {
  const button = document.querySelector<HTMLButtonElement>("[data-in-game-music-toggle]");
  const value = document.querySelector<HTMLElement>("[data-in-game-music-value]");
  const slider = document.querySelector<HTMLInputElement>("[data-in-game-music-slider]");

  if (button) {
    button.classList.toggle("is-muted", isInGameMusicMuted || inGameMusicVolume <= 0);
    button.textContent = isInGameMusicMuted || inGameMusicVolume <= 0 ? "🔇" : "🔊";
    button.title = isInGameMusicMuted ? "Bật nhạc nền" : "Tắt nhạc nền";
  }

  if (value) {
    value.textContent = `${Math.round(clampInGameMusicVolume(inGameMusicVolume) * 100)}%`;
  }

  if (slider) {
    slider.value = String(Math.round(clampInGameMusicVolume(inGameMusicVolume) * 100));
  }
}

function toggleInGameBackgroundMusic() {
  isInGameMusicMuted = !isInGameMusicMuted;
  localStorage.setItem(IN_GAME_MUSIC_MUTED_KEY, String(isInGameMusicMuted));

  if (!isInGameMusicMuted && inGameMusicVolume <= 0) {
    inGameMusicVolume = DEFAULT_IN_GAME_MUSIC_VOLUME;
    localStorage.setItem(IN_GAME_MUSIC_VOLUME_KEY, String(inGameMusicVolume));
  }

  syncInGameBackgroundMusic();
  updateInGameMusicMenuDom();
}

function setInGameBackgroundMusicVolume(value: string | number) {
  const normalizedValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(normalizedValue)) return;

  inGameMusicVolume = clampInGameMusicVolume(normalizedValue > 1 ? normalizedValue / 100 : normalizedValue);
  isInGameMusicMuted = inGameMusicVolume <= 0;

  localStorage.setItem(IN_GAME_MUSIC_VOLUME_KEY, String(inGameMusicVolume));
  localStorage.setItem(IN_GAME_MUSIC_MUTED_KEY, String(isInGameMusicMuted));

  syncInGameBackgroundMusic();
  updateInGameMusicMenuDom();
}

function renderInGameMusicControl() {
  const volumePercent = Math.round(clampInGameMusicVolume(inGameMusicVolume) * 100);
  const isMuted = isInGameMusicMuted || volumePercent <= 0;

  return `
    <div class="online-room-menu__music" title="Nhạc nền trong trận">
      <button
        type="button"
        class="online-room-menu__music-toggle ${isMuted ? "is-muted" : ""}"
        data-in-game-music-toggle
        onclick="event.stopPropagation(); window.toggleInGameBackgroundMusic()"
        title="${isMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}"
      >
        ${isMuted ? "🔇" : "🔊"}
      </button>

      <div class="online-room-menu__music-body">
        <div class="online-room-menu__music-head">
          <span>Nhạc nền</span>
          <strong data-in-game-music-value>${volumePercent}%</strong>
        </div>

        <input
          data-in-game-music-slider
          class="online-room-menu__music-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${volumePercent}"
          oninput="event.stopPropagation(); window.setInGameBackgroundMusicVolume(event.target.value)"
          onchange="event.stopPropagation(); window.setInGameBackgroundMusicVolume(event.target.value)"
        />
      </div>
    </div>
  `;
}

function setupInGameMusicDelegation() {
  const tryPlay = () => {
    syncInGameBackgroundMusic();
  };

  document.addEventListener("pointerdown", tryPlay, { passive: true });
  document.addEventListener("keydown", tryPlay);
}

function setupSpectateKeyboardControls() {
  document.addEventListener("keydown", (event) => {
    if (!isOnlineRoomActive() || onlineClientState.roomState?.phase === "lobby") return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName?.toLowerCase();

    if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;

    if (event.key === "e" || event.key === "E") {
      event.preventDefault();
      cycleSpectateTarget(1);
      return;
    }

    if (event.key === "q" || event.key === "Q") {
      event.preventDefault();
      cycleSpectateTarget(-1);
      return;
    }

    if (event.key === "Escape" && isSpectatingOnlinePlayer()) {
      event.preventDefault();
      resetSpectateView();
      rerenderGameShell();
    }
  });
}

(window as any).toggleInGameBackgroundMusic = toggleInGameBackgroundMusic;
(window as any).setInGameBackgroundMusicVolume = setInGameBackgroundMusicVolume;

function toggleOnlineRoomMenu() {
  isOnlineRoomMenuOpen = !isOnlineRoomMenuOpen;
  rerenderGameShell();
}

function closeOnlineRoomMenu() {
  if (!isOnlineRoomMenuOpen) return;

  isOnlineRoomMenuOpen = false;
  rerenderGameShell();
}

(window as any).toggleOnlineRoomMenu = toggleOnlineRoomMenu;
(window as any).closeOnlineRoomMenu = closeOnlineRoomMenu;

function renderOnlineRoomMenu() {
  if (!isOnlineRoomActive() || onlineClientState.roomState?.phase === "lobby") {
    return "";
  }

  return `
    <div class="online-room-menu ${isOnlineRoomMenuOpen ? "is-open" : ""}" onclick="event.stopPropagation()">
      <button
        type="button"
        class="online-room-menu__button"
        title="Mở menu phòng"
        onclick="event.preventDefault(); event.stopPropagation(); toggleOnlineRoomMenu()"
      >
        ☰
      </button>

      <div class="online-room-menu__panel">
        ${renderInGameMusicControl()}

        <button
          class="online-room-menu__ranking"
          onclick="event.stopPropagation(); openMidGameRanking()"
          title="Xem bảng xếp hạng giữa trận"
        >
          BXH
        </button>

        <div class="online-room-menu__export" title="Xuất chứng nhận hành trình">
          <span>Xuất</span>
          <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        </div>

        <button
          class="online-room-menu__leave"
          onclick="event.stopPropagation(); leaveRoomFromLobby()"
          title="Thoát khỏi phòng online"
        >
          ✕
        </button>
      </div>
    </div>
  `;
}

function renderSidePlayerSpacers(count: number) {
  return Array.from({ length: Math.max(0, count) }, () => {
    return `<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`;
  }).join("");
}


export type AppScreen = "dashboard" | "map_selection" | "lobby" | "game";
export let currentAppScreen: AppScreen = "dashboard";

// Background smoke video reference (shared between gotoMapSelection and rerenderGameShell)
const MAP_SELECTION_TRANSITION_VIDEO_SRC = new URL(
  "../assets/chuyencanh.mp4",
  import.meta.url
).href;
let bgSmokeVideo: HTMLVideoElement | null = null;

function transitionToScreen(newScreen: AppScreen) {
  if (newScreen !== "dashboard") {
    stopOutsideBackgroundMedia();
  }

  if (!(document as any).startViewTransition) {
    currentAppScreen = newScreen;
    rerenderGameShell();
    return;
  }
  (document as any).startViewTransition(() => {
    currentAppScreen = newScreen;
    rerenderGameShell();
  });
}

let isTransitioning = false;

(window as any).gotoMapSelection = () => {
  if (isTransitioning) return;
  if (!authClientState.user) {
    (window as any).focusHubAuthPanel();
    setAuthStatus("Đăng nhập hoặc đăng ký để bắt đầu hành trình.");
    return;
  }
  isTransitioning = true;

  // 1. Create overlay video — plays from beginning (smoke effect)
  const vid = document.createElement("video");
  vid.src = MAP_SELECTION_TRANSITION_VIDEO_SRC;
  vid.muted = true;
  vid.playsInline = true;
  vid.style.cssText = [
    "position:fixed", "inset:0", "width:100%", "height:100%",
    "object-fit:cover", "z-index:9999", "pointer-events:auto",
    "opacity:0", "transition:opacity 0.4s ease"
  ].join(";");
  document.body.appendChild(vid);

  let transitioned = false;
  let fallbackTimer: number | null = null;

  const enterMapSelection = (keepVideoAsBackground: boolean) => {
    if (transitioned) return;

    transitioned = true;
    isTransitioning = false;

    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    vid.removeEventListener("timeupdate", handleTransitionProgress);
    vid.removeEventListener("error", handleTransitionError);
    vid.remove();

    if (keepVideoAsBackground) {
      bgSmokeVideo = vid;
      vid.style.cssText = [
        "position:absolute", "inset:0", "width:100%", "height:100%",
        "object-fit:cover", "z-index:0", "pointer-events:none", "opacity:1"
      ].join(";");
    } else {
      vid.pause();
      bgSmokeVideo = null;
    }

    currentAppScreen = "map_selection";
    rerenderGameShell();

    requestAnimationFrame(() => {
      const cols = document.querySelectorAll(".map-card-col");
      cols.forEach((el, i) => {
        setTimeout(() => el.classList.add("map-card-col--slide-in"), 200 + i * 140);
      });
    });
  };

  const handleTransitionError = () => {
    console.warn("Map transition video could not be loaded; continuing without it.");
    enterMapSelection(false);
  };

  function handleTransitionProgress() {
    if (vid.currentTime >= 3.5) {
      enterMapSelection(true);
      return;
    }

    // Loop from second 5 to avoid smoke replaying on the map screen.
    if (vid.duration && vid.currentTime >= vid.duration - 0.5) {
      vid.currentTime = 5;
    }
  }

  vid.addEventListener("timeupdate", handleTransitionProgress);
  vid.addEventListener("error", handleTransitionError, { once: true });

  // Fade in the video overlay. If playback is blocked, continue immediately.
  vid.playbackRate = 1.75;
  void vid.play().catch(handleTransitionError);
  requestAnimationFrame(() => { requestAnimationFrame(() => { vid.style.opacity = "1"; }); });

  // A slow or stalled media request must never leave the interface blocked.
  fallbackTimer = window.setTimeout(() => {
    enterMapSelection(vid.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
  }, 6000);
};

(window as any).gotoOnlineLobby = () => {
  if (!authClientState.user) {
    (window as any).focusHubAuthPanel();
    setAuthStatus("Đăng nhập hoặc đăng ký để bắt đầu hành trình.");
    return;
  }
  transitionToScreen("lobby");
};

(window as any).gotoDashboard = () => {
  // Remove background video cleanly
  if (bgSmokeVideo) {
    bgSmokeVideo.pause();
    bgSmokeVideo.remove();
    bgSmokeVideo = null;
  }
  transitionToScreen("dashboard");
};

(window as any).switchHubAuthTab = (tab: "login" | "register") => {
  document.querySelectorAll("[data-hub-auth-tab]").forEach((element) => {
    element.classList.toggle(
      "is-active",
      (element as HTMLElement).dataset.hubAuthTab === tab
    );
  });

  document.querySelectorAll("[data-hub-auth-panel]").forEach((element) => {
    element.classList.toggle(
      "is-active",
      (element as HTMLElement).dataset.hubAuthPanel === tab
    );
  });
};

(window as any).focusHubAuthPanel = () => {
  const authPanel = document.getElementById("hub-auth");

  if (!authPanel) {
    currentAppScreen = "dashboard";
    rerenderGameShell();

    window.requestAnimationFrame(() => {
      (window as any).focusHubAuthPanel();
    });
    return;
  }

  authPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  authPanel.classList.remove("hub-auth--pulse");

  window.requestAnimationFrame(() => {
    authPanel.classList.add("hub-auth--pulse");
  });

  const firstInput = authPanel.querySelector("input") as HTMLInputElement | null;
  firstInput?.focus();
};

(window as any).startOfflineGame = () => {
  alert("Chế độ chơi offline (Bot) đang được phát triển!");
};


function renderSaigonCollageBackground() {
  return `<div class="saigon-collage-bg" aria-hidden="true"></div>`;
}

const SAIGON_COLLAGE_BG_SIZE = {
  width: 1308,
  height: 801,
} as const;

type SaigonHotspotKey = "vendor" | "vehicle" | "foodcart" | "women";

type SaigonAlphaHotspot = {
  key: SaigonHotspotKey;
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: HTMLImageElement;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null;
};

const SAIGON_COLLAGE_HOTSPOTS: SaigonAlphaHotspot[] = [
  // v4: tọa độ crop trực tiếp từ ảnh nền gốc 1308x801.
  // Vì sprite lấy từ chính ảnh nền nên khi glow sẽ khớp vị trí, không còn bị "phân thân".
  { key: "vendor", selector: ".saigon-collage-bg__glow--vendor", x: 0, y: 0, width: 430, height: 330 },
  { key: "vehicle", selector: ".saigon-collage-bg__glow--vehicle", x: 590, y: 72, width: 360, height: 190 },
  { key: "foodcart", selector: ".saigon-collage-bg__glow--foodcart", x: 0, y: 455, width: 405, height: 305 },
  { key: "women", selector: ".saigon-collage-bg__glow--women", x: 900, y: 485, width: 390, height: 295 },
];

function prepareSaigonAlphaCanvas(hotspot: SaigonAlphaHotspot, shell: HTMLElement) {
  if (hotspot.ctx && hotspot.canvas && hotspot.image?.complete) {
    return;
  }

  const image = shell.querySelector<HTMLImageElement>(hotspot.selector);

  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);

  hotspot.image = image;
  hotspot.canvas = canvas;
  hotspot.ctx = ctx;
}

function getSaigonBackgroundCoordinate(shell: HTMLElement, event: MouseEvent) {
  const rect = shell.getBoundingClientRect();
  const scale = Math.max(
    rect.width / SAIGON_COLLAGE_BG_SIZE.width,
    rect.height / SAIGON_COLLAGE_BG_SIZE.height,
  );
  const renderedWidth = SAIGON_COLLAGE_BG_SIZE.width * scale;
  const renderedHeight = SAIGON_COLLAGE_BG_SIZE.height * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;

  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale,
  };
}

let lastOnlinePhase: string | null = null;
let isCinematicTransitioning = false;

function triggerCinematicLobbyToGameTransition() {
  console.log("TRIGGERING CINEMATIC TRANSITION!");
  isCinematicTransitioning = true;
  
  const blocker = document.createElement("div");
  blocker.id = "cinematic-blocker";
  blocker.style.cssText = "position:fixed;inset:0;z-index:99999999;cursor:wait;";
  blocker.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
  blocker.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
  blocker.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); }, {passive: false});
  document.body.appendChild(blocker);
  
  const lobbyCard = document.querySelector(".online-lobby-card");
  if (lobbyCard) lobbyCard.classList.add("is-exiting");

  const video = document.getElementById("cinematic-transition-video") as HTMLVideoElement | null;
  const overlay = document.getElementById("white-flash-overlay") as HTMLElement | null;
  
  if (!video || !overlay) {
    console.warn("Missing video or overlay for cinematic transition.");
    isCinematicTransitioning = false;
    rerenderGameShell();
    return;
  }

  setTimeout(() => {
    video.style.display = "block";
    video.style.pointerEvents = "none";
    video.currentTime = 0;
    
    // Play with sound, fallback to muted if autoplay blocked
    video.play().catch((e) => {
        console.warn("Video play failed with sound, attempting muted.", e);
        video.muted = true;
        video.play().catch(err => {
            console.error("Video play failed completely.", err);
        });
    });

    video.onpause = () => {
      if (isCinematicTransitioning) {
          console.warn("Video paused unexpectedly, resuming...");
          video.play().catch(err => console.error(err));
      }
    };

    const finishTransition = () => {
      if (!isCinematicTransitioning) return;
      isCinematicTransitioning = false;

      overlay.style.display = "block";
      overlay.style.opacity = "1";
      video.style.display = "none";
      video.ontimeupdate = null; // cleanup
      
      const b = document.getElementById("cinematic-blocker");
      if (b) b.remove();
      
      rerenderGameShell();
      
      const gameShell = document.querySelector(".game-shell");
      if (gameShell) {
        gameShell.classList.add("is-zooming-in");
      }

      setTimeout(() => {
         overlay.style.opacity = "0";
         setTimeout(() => {
            overlay.style.display = "none";
            
            if (gameShell) {
                gameShell.classList.remove("is-zooming-in");
            }
         }, 1500); 
      }, 50); 
    };

    video.onended = finishTransition;
    
    // Add timeupdate as a reliable way to detect video end for corrupted AI videos
    video.ontimeupdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.2) {
        finishTransition();
      }
    };

    // Fallback if video fails to play or gets stuck completely
    setTimeout(() => {
      if (isCinematicTransitioning) {
        console.warn("Cinematic transition video timeout fallback.");
        finishTransition();
      }
    }, 20000); // Increased to 20s to allow longer videos
  }, 400); 
}

function isInsideOpaqueSaigonPixel(hotspot: SaigonAlphaHotspot, bgX: number, bgY: number) {
  if (
    bgX < hotspot.x
    || bgX > hotspot.x + hotspot.width
    || bgY < hotspot.y
    || bgY > hotspot.y + hotspot.height
  ) {
    return false;
  }

  if (!hotspot.ctx || !hotspot.canvas) {
    return false;
  }

  const localX = (bgX - hotspot.x) / hotspot.width;
  const localY = (bgY - hotspot.y) / hotspot.height;
  const pixelX = Math.min(hotspot.canvas.width - 1, Math.max(0, Math.floor(localX * hotspot.canvas.width)));
  const pixelY = Math.min(hotspot.canvas.height - 1, Math.max(0, Math.floor(localY * hotspot.canvas.height)));
  const alpha = hotspot.ctx.getImageData(pixelX, pixelY, 1, 1).data[3];

  // Alpha nhỏ là viền feather / nền trong suốt, không tính hover.
  return alpha > 28;
}

function setupSaigonCollageHover() {
  // Background hover/glow đã tắt. Chỉ giữ một background tĩnh.
  const shell = document.querySelector<HTMLElement>(".game-shell");
  if (shell) {
    delete shell.dataset.saigonHover;
  }
}

function renderSpectateRuntimeStyles() {
  return `
    <style id="spectate-runtime-styles">
      .side-player--spectatable {
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .side-player--spectatable:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 35px rgba(21, 173, 255, 0.22);
      }

      .side-player--viewing {
        background: linear-gradient(180deg, rgba(11, 53, 115, 0.92), rgba(6, 31, 76, 0.88)) !important;
        border-color: rgba(36, 132, 255, 0.96) !important;
        box-shadow: 0 0 0 2px rgba(36, 132, 255, 0.42), 0 20px 42px rgba(6, 31, 76, 0.38) !important;
        color: #f3fbff !important;
      }

      .side-player--viewing .side-player__identity h3,
      .side-player--viewing .side-player__score,
      .side-player--viewing .side-player__resources {
        color: #f3fbff !important;
      }

      .side-player--viewing .rank {
        background: #1d6dff !important;
        color: #ffffff !important;
      }

      .mid-ranking-row--spectatable {
        cursor: pointer;
      }

      .mid-ranking-row--spectatable:hover {
        border-color: rgba(96, 211, 255, 0.55);
        background: rgba(96, 211, 255, 0.10);
      }

      .player-effect-seal--readonly {
        cursor: default;
      }

      .spectate-card-tray {
        position: fixed;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        width: min(980px, calc(100vw - 680px));
        min-width: 520px;
        z-index: 7200;
        pointer-events: auto;
        background: transparent;
        border: 0;
        box-shadow: none;
        display: grid;
        gap: 6px;
      }

      .spectate-card-tray__header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
      }

      .spectate-card-tray__header strong,
      .spectate-card-tray__header button {
        border: 1px solid rgba(147, 197, 253, 0.52);
        background: rgba(12, 58, 126, 0.86);
        color: #f5fbff;
        border-radius: 999px;
        box-shadow: 0 10px 26px rgba(9, 31, 70, 0.28);
        font-weight: 900;
        letter-spacing: 0.02em;
      }

      .spectate-card-tray__header strong {
        padding: 7px 14px;
      }

      .spectate-card-tray__header button {
        cursor: pointer;
        padding: 7px 13px;
      }

      .spectate-card-tray__body {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        align-items: end;
        pointer-events: auto;
      }

      .spectate-card-tray--hand .spectate-card-tray__body {
        grid-template-columns: minmax(0, 1fr);
      }

      .spectate-card-tray__section {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .spectate-card-tray__section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #f5fbff;
        text-shadow: 0 2px 8px rgba(6, 25, 58, 0.56);
      }

      .spectate-card-tray__section-title span {
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(37, 99, 235, 0.9);
        border: 1px solid rgba(191, 219, 254, 0.58);
        font-size: 0.68rem;
        font-weight: 950;
        flex: 0 0 auto;
      }

      .spectate-card-tray__section-title strong {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 0.86rem;
        font-weight: 950;
      }

      .spectate-card-tray__section-title em {
        flex: 0 0 auto;
        margin-left: auto;
        font-style: normal;
        font-size: 0.76rem;
        opacity: 0.88;
      }

      .spectate-card-tray__cards {
        --spectate-mini-card-w: 96px;
        --spectate-mini-card-h: 142px;
        min-height: calc(var(--spectate-mini-card-h) + 8px);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 6px;
        overflow-x: auto;
        overflow-y: visible;
        padding: 4px 6px 10px;
        border-radius: 18px;
        background: rgba(5, 23, 52, 0.18);
        backdrop-filter: blur(2px);
        scrollbar-width: thin;
      }

      .spectate-card-tray__card.hand-card {
        width: var(--spectate-mini-card-w) !important;
        height: var(--spectate-mini-card-h) !important;
        flex: 0 0 var(--spectate-mini-card-w) !important;
        margin-left: 0 !important;
        transform: none !important;
        transform-origin: center bottom !important;
        cursor: zoom-in;
        border-radius: 12px !important;
        z-index: calc(7300 + var(--spectate-card-index, 0)) !important;
      }

      .spectate-card-tray__card.hand-card:hover {
        transform: translateY(-18px) scale(1.18) !important;
        z-index: 7800 !important;
      }

      .spectate-card-tray__card .framed-card-face__description,
      .spectate-card-tray__card .framed-card-face__cost,
      .spectate-card-tray__card .framed-card-face__pill--rarity {
        display: none !important;
      }

      .spectate-card-tray__card .framed-card-face__name {
        font-size: 0.52rem !important;
      }

      .spectate-hand-empty {
        min-width: 180px;
        min-height: 74px;
        padding: 12px 14px;
        display: grid;
        place-items: center;
        border: 1px dashed rgba(90, 221, 255, 0.35);
        border-radius: 18px;
        color: rgba(238, 251, 255, 0.88);
        background: rgba(13, 33, 55, 0.38);
        font-weight: 850;
        text-align: center;
        font-size: 0.8rem;
      }

      @media (max-width: 1500px) {
        .spectate-card-tray {
          width: min(820px, calc(100vw - 520px));
          min-width: 430px;
        }

        .spectate-card-tray__cards {
          --spectate-mini-card-w: 82px;
          --spectate-mini-card-h: 122px;
        }
      }

      @media (max-width: 1180px) {
        .spectate-card-tray {
          width: calc(100vw - 44px);
          min-width: 0;
          bottom: 8px;
        }
      }

      .draft-center-overlay--spectate-readonly {
        pointer-events: auto;
      }

      .draft-center-container--spectate {
        gap: 12px;
      }

      .draft-center-card-wrapper--spectate-readonly {
        cursor: pointer;
      }

      .draft-center-card-wrapper--spectate-readonly .draft-center-card {
        filter: drop-shadow(0 18px 30px rgba(8, 34, 78, 0.28));
      }

      .spectate-draft-title {
        align-self: center;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(6, 31, 76, 0.82);
        border: 1px solid rgba(96, 184, 255, 0.38);
        color: #f3fbff;
        font-weight: 900;
        letter-spacing: 0.04em;
        box-shadow: 0 12px 28px rgba(6, 31, 76, 0.28);
      }

      .spectate-hand-empty {
        min-width: 240px;
        padding: 18px 20px;
        border: 1px dashed rgba(90, 221, 255, 0.35);
        border-radius: 18px;
        color: rgba(238, 251, 255, 0.76);
        background: rgba(13, 33, 55, 0.28);
        font-weight: 800;
        text-align: center;
      }

      .arena--spectating .board-cell {
        cursor: zoom-in;
      }

      .arena--spectating .board-cell--empty {
        cursor: default;
      }






      .spectate-return-button {
        display: none !important;
      }

      .player-hand--spectate-normal {
        pointer-events: auto;
      }

      .player-hand--spectate-normal .hand-card {
        cursor: zoom-in !important;
      }

      .player-hand--spectate-normal .hand-card--spectate-readonly {
        pointer-events: auto;
      }

      .player-hand--spectate-normal .hand-card--spectate-readonly:hover {
        transform: translateY(-8px) scale(1.02);
      }

      .spectate-normal-empty {
        min-width: 280px;
        min-height: 86px;
        display: grid;
        place-items: center;
        border: 2px dashed rgba(73, 145, 190, 0.42);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
        color: #18455d;
        font-weight: 800;
        text-align: center;
        padding: 14px 20px;
      }

      .draft-center-overlay--spectate-readonly {
        pointer-events: none;
      }

      .draft-center-overlay--spectate-readonly .draft-center-card,
      .draft-center-overlay--spectate-readonly .hand-card {
        pointer-events: auto;
        cursor: zoom-in !important;
      }

      .draft-center-overlay--spectate-readonly .draft-center-card:hover {
        transform: translateY(-8px) scale(1.02);
      }


      .side-player__view-button {
        width: calc(100% - 28px);
        margin: 10px 14px 0;
        border: 1px solid rgba(37, 99, 235, 0.32);
        border-radius: 999px;
        padding: 7px 12px;
        background: rgba(255, 255, 255, 0.78);
        color: #0b4477;
        font-weight: 950;
        letter-spacing: 0.04em;
        cursor: pointer;
        box-shadow: 0 8px 18px rgba(13, 48, 92, 0.12);
      }

      .side-player__view-button:hover {
        background: #0d5fb8;
        border-color: rgba(147, 197, 253, 0.78);
        color: #ffffff;
      }

      .side-player--viewing .side-player__view-button {
        background: rgba(219, 234, 254, 0.14);
        border-color: rgba(191, 219, 254, 0.65);
        color: #ffffff;
      }

      .online-room-menu.is-open .online-room-menu__panel {
        width: 392px !important;
        max-width: min(392px, calc(100vw - 86px)) !important;
        opacity: 1 !important;
        overflow: visible !important;
        pointer-events: auto !important;
        padding: 7px 8px 7px 12px !important;
        transform: translateX(0) !important;
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
        flex-wrap: nowrap !important;
      }

      .online-room-menu__text {
        display: none !important;
      }

      .online-room-menu__music {
        flex: 0 0 198px !important;
        width: 198px !important;
        max-width: 198px !important;
        min-width: 198px !important;
      }

      .online-room-menu__music-body {
        min-width: 0 !important;
      }

      .online-room-menu__music-head span,
      .online-room-menu__music-head strong,
      .online-room-menu__export span,
      .online-room-menu__export button,
      .online-room-menu__ranking {
        white-space: nowrap !important;
      }

      .online-room-menu__ranking {
        flex: 0 0 auto !important;
        min-width: 58px !important;
      }

      .online-room-menu__export {
        flex: 0 0 auto !important;
        min-width: 104px !important;
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
      }

      .online-room-menu__export span {
        display: none !important;
      }

      .online-room-menu__export button {
        max-width: 104px !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }

      .online-room-menu__leave {
        flex: 0 0 44px !important;
      }

      @media (max-width: 720px) {
        .online-room-menu.is-open .online-room-menu__panel {
          width: calc(100vw - 72px) !important;
          max-width: calc(100vw - 72px) !important;
          gap: 8px !important;
        }

        .online-room-menu__music {
          flex-basis: 172px !important;
          width: 172px !important;
          min-width: 172px !important;
          max-width: 172px !important;
        }
      }

      .online-room-menu__button {
        border: 0;
        appearance: none;
      }

      .player-hand__top--spectate {
        align-items: center;
        gap: 12px;
      }

      .player-hand__return-button {
        margin-left: auto;
        border: 0;
        border-radius: 999px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #144f91, #0d2e5e);
        color: #ffffff;
        font-weight: 950;
        letter-spacing: 0.04em;
        box-shadow: 0 10px 22px rgba(7, 24, 56, 0.26);
        cursor: pointer;
        white-space: nowrap;
      }

      .player-hand__return-button:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }

      .player-hand--spectate-normal .player-hand__cards--picked .hand-card--picked-draft {
        cursor: zoom-in !important;
      }

      .player-hand--spectate-normal .player-hand__cards--picked .hand-card--picked-draft:hover {
        z-index: 40 !important;
      }

    </style>
  `;
}

function renderWithGlobalOverlays(content: string) {
  return `${renderSpectateRuntimeStyles()}${content}`;
}

function renderGameShell() {
  if (!authClientState.isReady) {
    return renderWithGlobalOverlays(renderDashboard(true));
  }

  if (!isOnlineRoomActive()) {
    spectatingPlayerId = null;

    if (!authClientState.user || currentAppScreen === "dashboard") {
      currentAppScreen = "dashboard";
      return renderWithGlobalOverlays(renderDashboard());
    }
    
    if (currentAppScreen === "map_selection") {
      return renderWithGlobalOverlays(renderMapSelectionScreen());
    }

    return renderWithGlobalOverlays(renderOnlineEntryScreen());
  }

  if (onlineClientState.roomState?.phase === "lobby") {
    spectatingPlayerId = null;
    return renderWithGlobalOverlays(renderOnlineLobbyRoomScreen());
  }

  syncSpectateTargetWithRoomState();

  const leftPlayers = getLeftSidePlayersToRender();
  const rightPlayers = getRightSidePlayersToRender();

  return renderWithGlobalOverlays(`
    <div class="game-shell">
      ${renderSaigonCollageBackground()}
      ${renderOnlineRoomMenu()}
      ${renderMidGameRankingModal()}
      ${renderDebtTokenModal()}

      <aside class="players-column players-column--left">
        ${leftPlayers.map(renderPlayer).join("")}
        ${renderSidePlayerSpacers(2 - leftPlayers.length)}
      </aside>

      ${renderMainArena()}

      <aside class="players-column players-column--right">
        ${rightPlayers.map(renderPlayer).join("")}
        ${renderSidePlayerSpacers(1 - rightPlayers.length)}
        ${renderDeckPilePanel()}
      </aside>
    </div>
  `);
}

(window as any).rerenderGameShell = rerenderGameShell;
function applyLobbyBackground() {
  const isLobbyScreen =
    !isOnlineRoomActive() ||
    onlineClientState.roomState?.phase === "lobby";

  if (isLobbyScreen) {
    // Set background directly on #app — inline style beats CSS !important
    app.style.setProperty("background",
      "url('./assets/backgrounds/lobby-background.jpg') center/cover no-repeat #0c0b11",
      "important"
    );
  } else {
    // Remove inline override, let CSS handle game background
    app.style.removeProperty("background");
  }
}

function buildOnboardingCtx(): OnboardingCtx {
  return {
    isLoggedIn: () => Boolean(authClientState.user),
    getPhase: () => onlineClientState.roomState?.phase ?? null,
    getSelfPlacedCount: () => {
      const id = onlineClientState.playerId;
      const board = id ? onlineClientState.roomState?.players?.[id]?.board : null;
      if (!board) return 0;
      return board.reduce(
        (sum, row) => sum + row.filter((cell) => cell != null).length,
        0,
      );
    },
    getDraftSelected: () =>
      Boolean(onlineClientState.roomState?.self?.selectedDraftCardId),
    getDraftPickedCount: () =>
      onlineClientState.roomState?.self?.pickedDraftCards?.length ?? 0,
    getDayIndex: () => onlineClientState.roomState?.dayIndex ?? 0,
    getPlayers: () => {
      const players = onlineClientState.roomState?.players;
      const selfId = onlineClientState.playerId;
      if (!players) return [];
      const ids = ["p1", "p2", "p3", "p4"] as const;
      const out: { name: string; score: number; isBot: boolean; isSelf: boolean }[] = [];
      for (const id of ids) {
        const p = players[id] as (typeof players)[typeof id] & { isBot?: boolean; vp?: number };
        if (!p) continue;
        out.push({
          name: p.name,
          score: p.score ?? p.vp ?? 0,
          isBot: p.isBot === true,
          isSelf: id === selfId,
        });
      }
      return out;
    },
    gotoHome: () => {
      leaveOnlineRoom();
      (window as any).gotoDashboard?.();
    },
    isReplayPausedForEvent: () => isTutorialReplayPaused(),
    resumeReplay: () => resumeTutorialReplay(),
  };
}

function rerenderGameShell() {
  stopOutsideBackgroundMedia();

  maybeStartOnboarding(buildOnboardingCtx());
  app.innerHTML = renderGameShell();
  applyLobbyBackground();
  setupSaigonCollageHover();
  syncInGameBackgroundMusic();
  initDashboardHub();
  positionScanTrack();

  // Re-insert background video into map selection screen if it exists
  if (currentAppScreen === "map_selection" && bgSmokeVideo) {
    const screen = document.querySelector(".map-selection-screen");
    if (screen && screen.firstChild) {
      screen.insertBefore(bgSmokeVideo, screen.firstChild);
    }
  }

  if (isDraftDealVisualActive()) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        restartDraftCenterDealVisuals();
      });
    });
  }
}

let lastOnlineRenderSignature = "";
let lastOnlineAnimationPhase: string | null = null;
let selfPlanningConfirmPending = false;
let planningConfirmLockSignature = "";
let lastOnlinePlanningDayIndex: number | null = null;
let planningConfirmRetryTimerId: number | null = null;
let planningConfirmRetryCount = 0;
let lastOnlineAnimationDraftRound = 0;
let lastOnlineAnimationPoolSignature = "";
let onlineDraftAnimationTimerId: number | null = null;
let hasStartedOnlineSimulationReplay = false;
let onlineDraftDisplayPool: TravelCardData[] | null = null;
let onlineDraftPassSnapshotPool: TravelCardData[] | null = null;
let onlineDraftPendingPool: TravelCardData[] | null = null;
let onlinePassCompleteRetryCount = 0;

let isDraftCenterDealing = false;
let draftDealVisualEndsAt = 0;
let isDraftPickFlying = false;
let draftHandPendingCardId: string | null = null;
let draftPoolFlyReturnCardId: string | null = null;
let lastOnlinePickedDraftCount = 0;
const DRAFT_PICK_FLY_MS = 750;
const DRAFT_POOL_COLLAPSE_MS = 1350;
const DRAFT_HAND_PICK_SCALE = 0.84;
let shouldActivateOnlineDealAnimation = false;
let shouldActivateOnlinePassAnimation = false;
let isOnlineFinalDraftReturnAnimating = false;
let onlineFinalDraftReturnTimerId: number | null = null;
let hasPlayedOnlinePlanningDealAfterDraft = false;
let draftCenterDealEndTimerId: number | null = null;
let draftCenterDealGeneration = 0;

function isDraftDealVisualActive(): boolean {
  return (
    isDraftCenterDealing ||
    isInitialDealInProgress ||
    Date.now() < draftDealVisualEndsAt
  );
}

function restartDraftCenterDealVisuals(): boolean {
  const overlay = document.querySelector(".draft-center-overlay") as HTMLElement | null;
  if (!overlay) return false;

  /* Reset so the expand keyframe can replay cleanly */
  overlay.classList.remove("draft-center-overlay--dealing");

  const wrappers = Array.from(
    overlay.querySelectorAll(".draft-center-card-wrapper"),
  ) as HTMLElement[];
  if (wrappers.length === 0) return false;

  wrappers.forEach((w) => {
    w.classList.remove("draft-center-card-wrapper--flown-to-hand");
    w.style.animation = "none";
    // Clear old CSS vars
    w.style.removeProperty("--gather-x");
    w.style.removeProperty("--gather-y");
    w.style.removeProperty("--gather-r");
    w.style.removeProperty("--arc1-x");
    w.style.removeProperty("--arc1-y");
    w.style.removeProperty("--arc2-x");
    w.style.removeProperty("--arc2-y");
    w.style.removeProperty("--deck-in-x");
    w.style.removeProperty("--deck-in-y");
    w.style.removeProperty("--deck-r");
  });

  // Force reflow
  void overlay.offsetWidth;

  // Remove animation: none so keyframe can replay
  wrappers.forEach((w) => {
    w.style.removeProperty("animation");
  });

  /* Calculate gather point at center of overlay, like collapse/expand does */
  const overlayRect = overlay.getBoundingClientRect();
  const gatherCenterX = overlayRect.left + overlayRect.width * 0.5;
  const gatherCenterY = overlayRect.top + overlayRect.height * 0.38;

  /* Gốc deck cho lúc CHIA BÀI: luôn bay ra từ góc dưới-phải màn hình.
     (.deck-card-stack canh giữa nên không dùng — đó là lý do trước đây bay từ trên.) */
  const deckInsertX = window.innerWidth - 70;
  const deckInsertY = window.innerHeight - 50;

  /* Set --gather-x/y/r và --deck-in-x/y/r per-card. Dùng arc "directScoop"
     để các lá trườn lên từ góc dưới-phải về cụm, không vòng lên đầu màn hình. */
  applyDraftReturnGatherVars(
    wrappers,
    gatherCenterX,
    gatherCenterY,
    deckInsertX,
    deckInsertY,
    "directScoop",
  );

  /* Re-add dealing class → CSS triggers draftCenterPoolExpandFromDeckV2 keyframe */
  overlay.classList.add("draft-center-overlay--dealing");
  return true;
}

function clearDraftCenterDealAnimation() {
  draftCenterDealGeneration += 1;

  if (draftCenterDealEndTimerId !== null) {
    window.clearTimeout(draftCenterDealEndTimerId);
    draftCenterDealEndTimerId = null;
  }

  isDraftCenterDealing = false;

  const overlay = document.querySelector(".draft-center-overlay") as HTMLElement | null;
  overlay?.classList.remove("draft-center-overlay--dealing");

  // Clean up gather CSS vars
  overlay?.querySelectorAll(".draft-center-card-wrapper").forEach((node) => {
    const el = node as HTMLElement;
    el.style.removeProperty("animation");
    el.style.removeProperty("--gather-x");
    el.style.removeProperty("--gather-y");
    el.style.removeProperty("--gather-r");
    el.style.removeProperty("--arc1-x");
    el.style.removeProperty("--arc1-y");
    el.style.removeProperty("--arc2-x");
    el.style.removeProperty("--arc2-y");
    el.style.removeProperty("--deck-in-x");
    el.style.removeProperty("--deck-in-y");
    el.style.removeProperty("--deck-r");
  });
}

function getDraftCenterPoolSignature(): string {
  const pool = isOnlineRoomActive()
    ? (getOnlineDraftDisplayPool() ?? getOnlineSelfDraftPool() ?? [])
    : (getCurrentDraftPlayer()?.pool ?? []);
  return pool.map((c) => c.id).join(",");
}

function startDraftCenterDealAnimation(
  durationMs = getDraftCenterDealDurationForCurrentPool(),
) {
  if (draftCenterDealEndTimerId !== null) {
    window.clearTimeout(draftCenterDealEndTimerId);
    draftCenterDealEndTimerId = null;
  }

  const generation = ++draftCenterDealGeneration;
  isDraftCenterDealing = true;
  draftDealVisualEndsAt = Date.now() + durationMs;
  playGameSound("deal");

  const activate = () => {
    if (generation !== draftCenterDealGeneration) return;
    restartDraftCenterDealVisuals();
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(activate);
  });

  draftCenterDealEndTimerId = window.setTimeout(() => {
    if (generation !== draftCenterDealGeneration) return;

    draftCenterDealEndTimerId = null;
    isDraftCenterDealing = false;

    const ov = document.querySelector(".draft-center-overlay") as HTMLElement | null;
    ov?.classList.remove("draft-center-overlay--dealing");

    // Clean up FLIP inline styles
    ov?.querySelectorAll(".draft-center-card-wrapper").forEach((node) => {
      (node as HTMLElement).style.cssText = "";
    });
  }, durationMs);
}

function clearOnlineDraftAnimationTimer() {
  if (onlineDraftAnimationTimerId !== null) {
    window.clearTimeout(onlineDraftAnimationTimerId);
    onlineDraftAnimationTimerId = null;
  }

  if (onlineFinalDraftReturnTimerId !== null) {
    window.clearTimeout(onlineFinalDraftReturnTimerId);
    onlineFinalDraftReturnTimerId = null;
  }

  clearDraftCenterDealAnimation();
}

function getOnlineRenderSignature() {
  const state = onlineClientState.roomState;

  if (!state) return "offline";

  const self = state.self;
  const playersSignature = playerIds
    .map((playerId) => {
      const player = state.players[playerId];
      const boardSignature = player.board
        .map((row) => row.map((cell) => {
          if (!cell) return "-";

          return `${cell.cardId}:${cell.tag}:${cell.icon}:${cell.vp}`;
        }).join(","))
        .join("|");

      return [
        playerId,
        player.name,
        player.score,
        player.coin,
        player.stamina,
        player.usedSlots,
        player.isConnected ? "1" : "0",
        player.isReady ? "1" : "0",
        player.planningConfirmed ? "1" : "0",
        boardSignature,
      ].join("~");
    })
    .join("||");

  return [
    state.phase,
    state.phaseNumber ?? 1,
    state.dayIndex,
    state.draftRound,
    state.timer,
    self.draftPool.map((card) => card.id).join(","),
    self.pickedDraftCards.map((card) => card.id).join(","),
    self.hand.map((card) => card.id).join(","),
    playersSignature,
  ].join("##");
}

function updateOnlineTimerOnly() {
  const state = onlineClientState.roomState;
  const timerElement = document.querySelector(".score-breakdown__timer") as HTMLElement | null;
  const timerValueElement = timerElement?.querySelector("strong") as HTMLElement | null;

  if (!state || !timerElement || !timerValueElement) return;

  if (state.phase === "draft") {
    timerValueElement.textContent = getDraftTimerDisplayLabel();
    timerElement.classList.toggle(
      "score-breakdown__timer--danger",
      !isDraftPickTimerFrozen() && draftPickSecondsLeft <= 3
    );
    updateDraftTimerDisplayVisualOnly();
    updateDraftPoolToggleVisualOnly();
    return;
  }

  if (state.phase === "planning") {
    timerValueElement.textContent = formatTurnTimer(state.timer);
    timerElement.classList.toggle("score-breakdown__timer--danger", state.timer <= 10);
    updatePlanningConfirmButtonVisualOnly();
    return;
  }

  if (state.phase === "gameover") {
    timerValueElement.textContent = `${state.timer}s`;
    timerElement.classList.toggle("score-breakdown__timer--danger", state.timer <= 3);
  }
}

function renderAfterOnlineStateChange() {
  const nextSignature = getOnlineRenderSignature();
  const currentPhase = onlineClientState.roomState?.phase ?? null;

  if (nextSignature !== lastOnlineRenderSignature) {
    console.log("Signature changed:", lastOnlineRenderSignature, "=>", nextSignature); 
    lastOnlineRenderSignature = nextSignature;

    if (lastOnlinePhase === "lobby" && currentPhase === "cinematic") {
      lastOnlinePhase = currentPhase;
      triggerCinematicLobbyToGameTransition();
      return;
    }
    
    lastOnlinePhase = currentPhase;

    const shouldDeferRerenderForActiveDeal =
      (isDraftDealVisualActive() || isDraftPickFlying) &&
      !shouldActivateOnlineDealAnimation &&
      !shouldActivateOnlinePassAnimation;

    const shouldDeferRerenderForDraftTransition =
      (isPassingDraftCards ||
        isInitialDealInProgress ||
        isDraftCenterDealing) &&
      !shouldActivateOnlinePassAnimation &&
      !shouldActivateOnlineDealAnimation;

    const passVisualRunning =
      isOnlineInterRoundPoolPassActive() &&
      document.querySelector(".draft-center-overlay--passing.pass-active");

    const poolCollapseVisualRunning =
      isDraftPoolCollapseAnimating &&
      document.querySelector(
        ".draft-center-overlay--collapsing.pass-active, .draft-center-overlay--expanding.pass-active"
      );

    if (!isCinematicTransitioning) {
      if (shouldDeferRerenderForActiveDeal || shouldDeferRerenderForDraftTransition) {
        updateDraftSelectedVisualOnly();
        updateDraftHandVisualOnly();
        updateDraftPoolFlownVisualOnly();
        updateOnlineTimerOnly();
        updateDraftConfirmButtonVisualOnly();
      } else if (
        (passVisualRunning || poolCollapseVisualRunning) &&
        !shouldActivateOnlinePassAnimation &&
        !shouldActivateOnlineDealAnimation
      ) {
        updateOnlineTimerOnly();
        updateDraftPoolToggleVisualOnly();
      } else {
        rerenderGameShell();
      }
    }

    if (shouldActivateOnlineDealAnimation) {
      shouldActivateOnlineDealAnimation = false;
      startDraftCenterDealAnimation(getDraftCenterDealDurationForCurrentPool());
    }

    if (shouldActivateOnlinePassAnimation) {
      shouldActivateOnlinePassAnimation = false;
      if (isOnlineFinalDraftReturnAnimating) {
        activateDraftCenterReturnAnimation();
      } else {
        activateDraftCenterPoolPassAnimation();
      }
    }

    return;
  }

  updateOnlineTimerOnly();
}

rerenderGameShell();
lastOnlineRenderSignature = getOnlineRenderSignature();
lastOnlinePhase = onlineClientState.roomState?.phase ?? null;

function setupCardClickDelegation() {
  let holdStartX = 0;
  let holdStartY = 0;
  let holdCardId: string | null = null;
  let holdMode: "draft" | "hand" | null = null;
  let didOpenHoldPreview = false;
  let skipNextDraftClick = false;

  function clearDelegatedHold() {
    clearHoldTimer();
    holdCardId = null;
    holdMode = null;
    didOpenHoldPreview = false;
  }

  document.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement | null;

    if (!target) return;

    const draftCardElement = target.closest("[data-draft-card-id]") as HTMLElement | null;
    const handCardElement = target.closest("[data-hand-card-id]") as HTMLElement | null;

    let nextCardId: string | null = null;
    let nextMode: "draft" | "hand" | null = null;

    if (isDraftPhase && draftCardElement) {
      nextCardId = draftCardElement.dataset.draftCardId ?? null;
      nextMode = "draft";
    } else if (!isDraftPhase && !isSimulationMode && handCardElement) {
      nextCardId = handCardElement.dataset.handCardId ?? null;
      nextMode = "hand";
    }

    if (!nextCardId || !nextMode) return;

    holdCardId = nextCardId;
    holdMode = nextMode;
    didOpenHoldPreview = false;
    holdStartX = event.clientX;
    holdStartY = event.clientY;

    clearHoldTimer();

    if (nextMode === "draft" && !isPassingDraftCards) {
      /*
        Online/offline draft chọn ngay từ pointerdown.
        Lượt 1 đang có deal animation nên browser click có thể bị mất;
        pointerdown ổn định hơn và vẫn giữ được hold preview.
      */
      skipNextDraftClick = true;
      selectDraftCard(nextCardId);
    }

    holdTimer = window.setTimeout(() => {
      if (!holdCardId) return;

      didOpenHoldPreview = true;
      focusedHandCardId = holdCardId;
      focusedBoardCard = null;
      focusedBoardPosition = null;
      suppressNextClick = true;
      rerenderGameShell();
    }, 500);
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!holdCardId || holdTimer === null) return;

    const distance = Math.hypot(
      event.clientX - holdStartX,
      event.clientY - holdStartY
    );

    if (distance > 8) {
      clearDelegatedHold();
    }
  }, true);

  document.addEventListener("pointerup", (event) => {
    const cardId = holdCardId;
    const mode = holdMode;
    const openedPreview = didOpenHoldPreview;
    const distance = Math.hypot(
      event.clientX - holdStartX,
      event.clientY - holdStartY
    );

    clearDelegatedHold();

    /*
      Draft đã chọn ở pointerdown để không bị mất click trong animation dealing.
      Pointerup chỉ dọn hold state, không select lần nữa để tránh toggle ngược.
    */
    if (mode === "draft" && cardId && !openedPreview && distance <= 8 && isDraftPhase) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener("pointercancel", () => {
    clearDelegatedHold();
  }, true);

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;

    if (!target) return;

    const draftCardElement = target.closest("[data-draft-card-id]") as HTMLElement | null;

    if (draftCardElement && isDraftPhase) {
      event.preventDefault();
      event.stopPropagation();

      if (skipNextDraftClick) {
        skipNextDraftClick = false;
        return;
      }

      const cardId = draftCardElement.dataset.draftCardId;

      if (cardId) {
        selectDraftCard(cardId);
      }

      return;
    }

    const handCardElement = target.closest("[data-hand-card-id]") as HTMLElement | null;

    if (handCardElement && !isDraftPhase) {
      event.preventDefault();
      event.stopPropagation();

      const cardId = handCardElement.dataset.handCardId;

      if (cardId) {
        selectHandCard(cardId);
      }
    }
  }, true);
}


setupCardClickDelegation();
setupAuthFormDelegation();
setupGameAudioDelegation();
setupInGameMusicDelegation();
setupSpectateKeyboardControls();
initTourLauncher(buildOnboardingCtx);

initOnlineClient(
  () => {
    applyOnlineRoomStateToLocal();
    renderAfterOnlineStateChange();
  },
  () => {
    resetSelfPlanningConfirmLock();
    updatePlanningConfirmButtonVisualOnly();
  }
);

(window as any).createOnlineRoom = (playerName = "An") => {
  createOnlineRoom(playerName);
};

(window as any).joinOnlineRoom = (roomId: string, playerName = "Player") => {
  joinOnlineRoom(roomId, playerName);
};

(window as any).startOnlineGame = () => {
  startOnlineGame();
};


(window as any).selectDraftCard = selectDraftCard;
(window as any).selectHandCard = selectHandCard;
(window as any).clearSelectedHandCard = clearSelectedHandCard;


function setAuthStatus(message: string, isError = false) {
  const statusElement =
    (document.querySelector("#hub-auth-status") as HTMLElement | null) ??
    (document.querySelector("#auth-status") as HTMLElement | null);

  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.classList.toggle("hub-auth__status--error", isError);
  statusElement.classList.toggle("hub-auth__status--success", Boolean(message) && !isError);
  statusElement.classList.toggle("auth-card__status--error", isError);
  statusElement.classList.toggle("auth-card__status--success", Boolean(message) && !isError);
}

function setupAuthFormDelegation() {
  document.addEventListener("submit", (event) => {
    const form = event.target as HTMLFormElement | null;

    if (!form) return;

    if (form.id === "auth-login-form" || form.id === "hub-auth-login-form") {
      event.preventDefault();
      event.stopPropagation();
      (window as any).loginFromAuthScreen();
      return;
    }

    if (form.id === "auth-register-form" || form.id === "hub-auth-register-form") {
      event.preventDefault();
      event.stopPropagation();
      (window as any).registerFromAuthScreen();
    }
  }, true);
}


(window as any).loginFromAuthScreen = async () => {
  const usernameInput =
    (document.querySelector("#hub-auth-login-username") as HTMLInputElement | null) ??
    (document.querySelector("#auth-login-username") as HTMLInputElement | null);
  const passwordInput =
    (document.querySelector("#hub-auth-login-password") as HTMLInputElement | null) ??
    (document.querySelector("#auth-login-password") as HTMLInputElement | null);

  setAuthStatus("Đang đăng nhập...");

  try {
    await loginAccount({
      username: usernameInput?.value.trim() ?? "",
      password: passwordInput?.value ?? "",
    });

    setAuthStatus("Đăng nhập thành công.");
    rerenderGameShell();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đăng nhập thất bại.";
    setAuthStatus(message, true);
    alert(message);
  }
};

(window as any).registerFromAuthScreen = async () => {
  const displayNameInput =
    (document.querySelector("#hub-auth-register-display-name") as HTMLInputElement | null) ??
    (document.querySelector("#auth-register-display-name") as HTMLInputElement | null);
  const usernameInput =
    (document.querySelector("#hub-auth-register-username") as HTMLInputElement | null) ??
    (document.querySelector("#auth-register-username") as HTMLInputElement | null);
  const passwordInput =
    (document.querySelector("#hub-auth-register-password") as HTMLInputElement | null) ??
    (document.querySelector("#auth-register-password") as HTMLInputElement | null);

  setAuthStatus("Đang tạo tài khoản...");

  try {
    await registerAccount({
      displayName: displayNameInput?.value.trim() || undefined,
      username: usernameInput?.value.trim() ?? "",
      password: passwordInput?.value ?? "",
    });

    setAuthStatus("Tạo tài khoản thành công.");
    rerenderGameShell();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đăng ký thất bại.";
    setAuthStatus(message, true);
    alert(message);
  }
};

(window as any).logoutFromAuthScreen = () => {
  logoutAccount();

  onlineClientState.roomId = null;
  onlineClientState.playerId = null;
  onlineClientState.roomState = null;
  currentAppScreen = "dashboard";

  rerenderGameShell();
};


(window as any).createRoomFromLobby = () => {
  stopOutsideBackgroundMedia();

  const input = document.querySelector("#lobby-create-name") as HTMLInputElement | null;
  const playerName = input?.value.trim() || authClientState.user?.displayName || authClientState.user?.username || "An";

  createOnlineRoom(playerName, isOnboardingActive());
};

(window as any).joinRoomFromLobby = () => {
  stopOutsideBackgroundMedia();

  const nameInput = document.querySelector("#lobby-join-name") as HTMLInputElement | null;
  const roomInput = document.querySelector("#lobby-room-code") as HTMLInputElement | null;

  const playerName = nameInput?.value.trim() || "Player";
  const roomId = roomInput?.value.trim().toUpperCase();

  if (!roomId) {
    alert("Nhập room code trước.");
    return;
  }

  joinOnlineRoom(roomId, playerName);
};

(window as any).reconnectSavedRoomFromLobby = () => {
  stopOutsideBackgroundMedia();

  const savedSession = getSavedOnlineSession();

  if (!savedSession) return;

  reconnectOnlineRoom(savedSession.roomId, savedSession.playerId, savedSession.playerName);
};

(window as any).clearSavedRoomFromLobby = () => {
  clearSavedOnlineSession();
  rerenderGameShell();
};

(window as any).toggleReadyFromLobby = () => {
  const selfPlayer = getOnlineSelfPublicPlayer();

  if (!selfPlayer || !onlineClientState.playerId || !onlineClientState.roomState) return;

  const nextReadyState = !selfPlayer.isReady;

  /*
    Cập nhật tạm local để bấm thấy đổi ngay.
    Server vẫn là nguồn chính; room:state gửi về sẽ xác nhận lại.
  */
  onlineClientState.roomState.players[onlineClientState.playerId].isReady = nextReadyState;
  rerenderGameShell();

  setOnlineReady(nextReadyState);
};

(window as any).leaveRoomFromLobby = () => {
  leaveOnlineRoom();
  rerenderGameShell();
};


(window as any).copyRoomCodeFromLobby = async () => {
  const roomId = onlineClientState.roomId;

  if (!roomId) return;

  try {
    await navigator.clipboard.writeText(roomId);
    alert(`Đã copy room code: ${roomId}`);
  } catch {
    prompt("Copy room code:", roomId);
  }
};


(window as any).openMidGameRanking = () => {
  isMidGameRankingOpen = true;
  rerenderGameShell();
};

(window as any).closeMidGameRanking = () => {
  isMidGameRankingOpen = false;
  rerenderGameShell();
};

(window as any).downloadTravelCertificateHtml = () => {
  downloadTravelCertificateHtml();
};

(window as any).downloadTravelTimelineTxt = () => {
  downloadTravelTimeline("txt");
};

(window as any).downloadTravelTimelineJson = () => {
  downloadTravelTimeline("json");
};

(window as any).copyTravelTimeline = () => {
  copyTravelTimelineToClipboard();
};


(window as any).debugOnlineBoards = () => {
  const state = onlineClientState.roomState;

  if (!state) {
    console.log("No online room state.");
    return null;
  }

  const result: Record<string, {
    name: string;
    connected: boolean;
    usedSlots: number;
    filledCells: Array<{
      rowIndex: number;
      colIndex: number;
      cardId: string;
      tag: string;
      icon: string;
      vp: number;
    }>;
  }> = {};

  const playerIds: PlayerId[] = ["p1", "p2", "p3", "p4"];

  for (const playerId of playerIds) {
    const player = state.players[playerId];
    const filledCells: Array<{
      rowIndex: number;
      colIndex: number;
      cardId: string;
      tag: string;
      icon: string;
      vp: number;
    }> = [];

    for (let rowIndex = 0; rowIndex < player.board.length; rowIndex += 1) {
      const row = player.board[rowIndex];

      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        const cell = row[colIndex];

        if (!cell) continue;

        filledCells.push({
          rowIndex,
          colIndex,
          cardId: cell.cardId,
          tag: cell.tag,
          icon: cell.icon,
          vp: cell.vp,
        });
      }
    }

    result[playerId] = {
      name: player.name,
      connected: player.isConnected,
      usedSlots: player.usedSlots,
      filledCells,
    };
  }

  console.table(
    playerIds.map((playerId) => ({
      playerId,
      name: result[playerId].name,
      connected: result[playerId].connected,
      usedSlots: result[playerId].usedSlots,
      filled: result[playerId].filledCells.length,
    }))
  );

  console.log(result);
  return result;
};

(window as any).onlineClientState = onlineClientState;


(window as any).debugOnlineScores = () => {
  const state = onlineClientState.roomState;

  if (!state) {
    console.log("No online room state.");
    return null;
  }

  const result = playerIds.map((playerId) => {
    const player = state.players[playerId];

    return {
      playerId,
      name: player.name,
      score: player.score,
      coin: player.coin,
      stamina: player.stamina,
      usedSlots: player.usedSlots,
      connected: player.isConnected,
      ready: player.isReady,
      joined: player.hasJoined,
    };
  });

  console.table(result);
  return result;
};

(globalThis as any).createOnlineRoom = (window as any).createOnlineRoom;
(globalThis as any).joinOnlineRoom = (window as any).joinOnlineRoom;
(globalThis as any).startOnlineGame = (window as any).startOnlineGame;
(globalThis as any).selectDraftCard = (window as any).selectDraftCard;
(globalThis as any).selectHandCard = (window as any).selectHandCard;
(globalThis as any).clearSelectedHandCard = (window as any).clearSelectedHandCard;

(globalThis as any).loginFromAuthScreen = (window as any).loginFromAuthScreen;
(globalThis as any).registerFromAuthScreen = (window as any).registerFromAuthScreen;
(globalThis as any).logoutFromAuthScreen = (window as any).logoutFromAuthScreen;
(globalThis as any).forceLogoutAuth = (window as any).logoutFromAuthScreen;

(globalThis as any).createRoomFromLobby = (window as any).createRoomFromLobby;
(globalThis as any).joinRoomFromLobby = (window as any).joinRoomFromLobby;
(globalThis as any).reconnectSavedRoomFromLobby = (window as any).reconnectSavedRoomFromLobby;
(globalThis as any).clearSavedRoomFromLobby = (window as any).clearSavedRoomFromLobby;
(globalThis as any).toggleReadyFromLobby = (window as any).toggleReadyFromLobby;
(globalThis as any).copyRoomCodeFromLobby = (window as any).copyRoomCodeFromLobby;
(globalThis as any).leaveRoomFromLobby = (window as any).leaveRoomFromLobby;
(globalThis as any).onlineClientState = onlineClientState;
(globalThis as any).openMidGameRanking = (window as any).openMidGameRanking;
(globalThis as any).closeMidGameRanking = (window as any).closeMidGameRanking;
(globalThis as any).downloadTravelCertificateHtml = (window as any).downloadTravelCertificateHtml;
(globalThis as any).toggleInGameBackgroundMusic = (window as any).toggleInGameBackgroundMusic;
(globalThis as any).setInGameBackgroundMusicVolume = (window as any).setInGameBackgroundMusicVolume;
(globalThis as any).downloadTravelTimelineTxt = (window as any).downloadTravelTimelineTxt;
(globalThis as any).downloadTravelTimelineJson = (window as any).downloadTravelTimelineJson;
(globalThis as any).copyTravelTimeline = (window as any).copyTravelTimeline;
(globalThis as any).playGameSound = playGameSound;
(globalThis as any).debugOnlineBoards = (window as any).debugOnlineBoards;
(globalThis as any).selectDraftCard = (window as any).selectDraftCard;


document.addEventListener("visibilitychange", syncOnlineDraftDisplayAfterTabVisible);
window.addEventListener("focus", syncOnlineDraftDisplayAfterTabVisible);


rerenderGameShell();
