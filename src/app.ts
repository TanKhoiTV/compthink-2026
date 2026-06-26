import { renderMapSelectionScreen } from "./ui/mapSelection.js";
import {
  cleanupDashboardHub,
  initDashboardHub,
  renderDashboard,
} from "./ui/dashboard.js";
import {
  GAME_HELP_STEPS,
  initHelpBubbleDelegation,
  renderHelpBubble,
} from "./ui/HelpBubble.js";
import {
  initOnboardingModalDelegation,
  renderOnboardingModal,
  syncOnboardingAutoOpen,
} from "./ui/OnboardingModal.js";
import {
  formatSignedVP,
  formatTurnTimer,
  getBoardCityClass,
  getBoardDisplayCity,
  getBoardDisplayName,
  getBoardTitleClass,
  getBoardTokenType,
  getCardBonusBadge,
  getDraftPrimaryTag,
  getFocusedCityClass,
  getFocusedTitleClass,
  getHandCityClass,
  getHandTitleClass,
  getTextFitClass,
  isBoardDebtToken,
  isBoardLockToken,
  stripCardText,
} from "./ui/cardDisplay.js";
import {
  renderBoardMiniCard,
  renderDailyDraftCard,
  renderFocusedCard,
  renderHandCard,
} from "./ui/cardRender.js";
import {
  getDraftCenterCardWrapper,
  getDraftCenterDealDurationForCurrentPool,
  getDraftHandDisplayCount,
  getDraftHandFallbackSlotRect,
  getDraftHandFlySourceFromElement,
  getDraftHandFlyTargetForPending,
  getDraftPendingHandSlotRect,
  getDraftTimerDisplayLabel,
  isDraftTimerDanger,
  readDraftHandCardMetrics,
  renderDraftCenterOverlay,
  renderDraftHandTopMeta,
  renderDraftLeftoverReturnOverlay,
  renderPickedDraftCards,
} from "./ui/draftArena.js";
import {
  authClientState,
  clearSavedOnlineSession,
  confirmOnlineDraftPick,
  confirmOnlinePlanning,
  createOnlineRoom,
  getSavedOnlineSession,
  initOnlineClient,
  joinOnlineRoom,
  leaveOnlineRoom,
  loginAccount,
  logoutAccount,
  onlineClientState,
  reconnectOnlineRoom,
  registerAccount,
  selectOnlineDraftCard,
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
  days,
  DRAFT_CENTER_DEAL_STEP_MS,
  DRAFT_PASS_ANIMATION_MS,
  DRAFT_PICK_SECONDS,
  getDraftCenterDealDurationMs,
  HAND_SIZE,
  PHASE_DAYS,
  PLAYER_COUNT,
  rows,
  STARTING_COIN,
  STARTING_STAMINA,
  TURN_DURATION_SECONDS,
} from "./game/constants.js";
import type {
  BoardTokenCard,
  HandPointerDragState,
  Player,
  PlayerId,
  TravelCardData,
} from "./types.js";
import {
  type BoardPosition,
  type BoardSlots,
  countCardsWithTag,
  createEmptyBoardSlots,
  getBoardCardByPosition as getBoardCardByPositionFromSlots,
  getCardTagKeys,
  getCurrentDayPlacedCards as getCurrentDayPlacedCardsFromSlots,
  getPlacedCards as getPlacedCardsFromSlots,
} from "./game/board.js";
import {
  createDailyDraftPlayers as createDailyDraftPlayersFromDeck,
  type DraftPickResult,
  type DraftPlayerState,
  getActiveDraftPlayerIndex,
  getCurrentDraftPlayer as getCurrentDraftPlayerFromList,
  pickRandomCard,
  rotateDraftPoolsClockwise as rotateDraftPoolsClockwiseList,
} from "./game/draft.js";
import {
  buildSimulationReplaySteps as buildSimulationReplayStepsFromBoard,
  calculateSimulationResult as calculateSimulationResultFromBoard,
  type DayScoreSummary,
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
} from "./game/resources.js";
import { DRAFT_STARTING_POOL_SIZE } from "./game/constants.js";
import {
  currentPlayerId,
  initialDeck,
  playerIds,
  state,
} from "./state/gameState.js";
import {
  createExhaustLockTokenCard,
  findCardInDraftPool,
  getBoardSlots,
  getBoardTotals,
  getConfirmedPickedDraftCards,
  getCurrentDraftPlayer,
  getCurrentScoreBreakdown,
  getDisplayPlayerName,
  getDraftCenterRenderPool,
  getDraftHandDisplayCards,
  getDraftLeftoverReturnCards,
  getDraftSelectedCard,
  getOnlineDraftDisplayPool,
  getOnlinePlayerBoard,
  getOnlineSelfDraftPool,
  getOnlineSelfHand,
  getOnlineSelfPublicPlayer,
  getOnlineSelfState,
  getPlanningConfirmStatusLabel,
  getRemainingResources,
  getSelfPlanningConfirmLockSignature,
  getSimulationEventResourceModifier,
  isDraftDealVisualActive,
  isDraftPickTimerFrozen,
  isDraftPoolToggleBlocked,
  isOnlineInterRoundPoolPassActive,
  isOnlinePlanningPhase,
  isOnlineRoomActive,
  isSelfPlanningConfirmed,
  isSinglePlayerLocalDraftMode,
  shouldHideDraftPoolSlot,
  shouldShowDraftLeftoverReturn,
  shouldShowDraftPickPool,
  shouldShowDraftWaitBanner,
} from "./game/queries.js";
import {
  renderDeckPilePanel,
  renderFinalRankingPanel,
  renderMidGameRankingModal,
  renderPlayerEffectTokens,
  renderResourceOrbs,
  renderScoreBreakdownPanel,
  renderSimulationResultPanel,
} from "./ui/renderHelpers.js";
import type { AppScreen } from "./types.js";

import {
  applyLobbyBackground,
  renderOnlineEntryScreen,
  renderOnlineLobbyRoomScreen,
  renderOnlineRoomMenu,
  renderSaigonCollageBackground,
  setupSaigonCollageHover,
} from "./ui/screens.js";
import {
  getLeftSidePlayersToRender,
  getRightSidePlayersToRender,
  renderPlayer,
  renderSidePlayerSpacers,
} from "./ui/sidePlayerBoards.js";

const app = document.getElementById("app")!;

import {
  type GameSoundName,
  playCardFlick,
  playCardThump,
  playFilteredPaperSound,
  playGameSound,
  setupGameAudioDelegation,
} from "./audio/gameAudio.js";
import {
  getInGameBackgroundMusic,
  playSimulationScanSoundForCurrentStep,
  renderInGameMusicControl,
  setInGameBackgroundMusicVolume,
  setupInGameMusicDelegation,
  shouldPlayInGameMusic,
  stopOutsideBackgroundMedia,
  syncInGameBackgroundMusic,
  toggleInGameBackgroundMusic,
  updateInGameMusicMenuDom,
} from "./audio/inGameMusic.js";
import {
  getCompactPhaseDayLabel,
  getCurrentCoinDebtAmount,
  getCurrentDayLabel,
  getCurrentPhaseLabel,
  getCurrentReplayPartialVP,
  getCurrentReplayStep,
  getPhaseScoreBeforeCurrentSimulation,
  getPhaseScorePreview,
  getReplayDayEndIndex,
  getReplayDayExitStage,
  getReplayDayRailClass,
  getStablePhaseScoreDisplay,
  isOnlineGameOver,
  renderDebtSealGlyph,
  renderTravelTimelineExportPanel,
  shouldShowReplayDay,
} from "./ui/renderHelpers.js";
// Moved to ui/sidePlayerBoards.ts
export const images = {
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

function preloadCardImages(cards: TravelCardData[]) {
  for (const card of cards) {
    if (!card.image) continue;

    const image = new Image();
    image.src = card.image;
  }
}

function preloadDraftImages() {
  const draftCards: TravelCardData[] = [];

  for (const player of state.draftPlayers) {
    draftCards.push(...player.pool);
    draftCards.push(...player.picked);
  }

  preloadCardImages(draftCards);
}

function shuffleCards(cards: TravelCardData[]) {
  return shuffleCardsList(cards);
}

function drawDailyHandFromDeck() {
  const result = drawDailyHandFromDeckFromState({
    deck: state.deck,
    handSize: HAND_SIZE,
    shuffleCards,
  });

  state.deck = result.deck;

  return result.hand;
}

function returnUnplayedHandToDeck() {
  const result = returnUnplayedHandToDeckFromState({
    deck: state.deck,
    playerHand: state.playerHand,
    shuffleCards,
  });

  state.deck = result.deck;
  state.playerHand = result.playerHand;
}
// Moved to game/queries.ts
function getDraftPoolSignature(cards: TravelCardData[] | null | undefined) {
  return (cards ?? []).map((card) => card.id).join(",");
}

function setOnlineDraftDisplayPoolFromServer() {
  const serverPool = getOnlineSelfDraftPool();

  state.onlineDraftDisplayPool = serverPool ? [...serverPool] : null;
  state.onlineDraftPendingPool = null;
}

function recoverOnlineDraftDisplayAfterTabVisible(reason = "visible-sync") {
  if (!isOnlineRoomActive()) return false;

  const roomState = onlineClientState.roomState;
  if (!roomState || roomState.phase !== "draft") return false;

  const serverPool = getOnlineSelfDraftPool();
  if (!serverPool || serverPool.length === 0) return false;

  const visiblePool = state.onlineDraftDisplayPool ??
    state.onlineDraftPassSnapshotPool ??
    state.onlineDraftPendingPool;

  const hasVisibleCards = !!visiblePool && visiblePool.length > 0;
  const animationExpired = state.draftDealVisualEndsAt > 0 &&
    Date.now() > state.draftDealVisualEndsAt + 180;
  const visualDealStillRunning = state.isInitialDealInProgress ||
    state.isDraftCenterDealing ||
    state.isPassingDraftCards ||
    Date.now() < state.draftDealVisualEndsAt;
  const staleAnimation = animationExpired && visualDealStillRunning;

  /*
    Khi tab bị background, browser pause timer/animation.
    Nếu focus lại mà server đang có pool thật, ưu tiên hiện bài ngay,
    không chạy animation chia bài muộn ở tab đó nữa.
  */
  if (hasVisibleCards && !staleAnimation && !visualDealStillRunning) {
    return false;
  }

  clearOnlineDraftAnimationTimer();
  clearDraftCenterDealAnimation();

  state.onlineDraftDisplayPool = [...serverPool];
  state.onlineDraftPassSnapshotPool = null;
  state.onlineDraftPendingPool = null;
  state.draftHandPendingCardId = null;
  state.draftPoolFlyReturnCardId = null;

  state.isPassingDraftCards = false;
  state.isInitialDealInProgress = false;
  state.shouldActivateOnlineDealAnimation = false;
  state.shouldActivateOnlinePassAnimation = false;
  state.draftDealVisualEndsAt = 0;

  state.draftSelectedCardId = roomState.self.selectedDraftCardId ?? null;
  state.lastOnlineRenderSignature = "";

  console.debug(
    `[DRAFT SYNC] recovered draft pool after tab visible: ${reason}`,
    {
      poolSize: serverPool.length,
      timer: roomState.timer,
      round: state.draftRound,
    },
  );

  return true;
}

function syncOnlineDraftDisplayAfterTabVisible() {
  if (document.visibilityState !== "visible") return;

  if (recoverOnlineDraftDisplayAfterTabVisible("visibility/focus")) {
    rerenderGameShell();
  }
}
// Moved to ui/draftArena.ts
function completeOnlineDraftPoolPassAndDeal() {
  state.onlineDraftAnimationTimerId = null;

  if (!state.onlineDraftPendingPool?.length) {
    if (state.onlinePassCompleteRetryCount < 40) {
      state.onlinePassCompleteRetryCount += 1;
      state.onlineDraftAnimationTimerId = window.setTimeout(
        completeOnlineDraftPoolPassAndDeal,
        100,
      );
      return;
    }
    setOnlineDraftDisplayPoolFromServer();
  } else {
    state.onlinePassCompleteRetryCount = 0;
    state.onlineDraftDisplayPool = [...state.onlineDraftPendingPool];
    state.onlineDraftPendingPool = null;
  }

  state.onlineDraftPassSnapshotPool = null;
  state.draftHandPendingCardId = null;
  state.draftPoolFlyReturnCardId = null;
  state.isPassingDraftCards = false;
  resetDraftPoolCollapseState();
  state.isInitialDealInProgress = true;

  const roomState = onlineClientState.roomState;
  state.draftSelectedCardId = roomState?.self.selectedDraftCardId ?? null;

  const dealMs = getDraftCenterDealDurationMs(
    Math.max(1, state.onlineDraftDisplayPool?.length ?? 0),
  );
  state.isDraftCenterDealing = true;
  state.draftDealVisualEndsAt = Date.now() + dealMs;

  state.lastOnlineRenderSignature = "";
  rerenderGameShell();
  startDraftCenterDealAnimation(dealMs);

  state.onlineDraftAnimationTimerId = window.setTimeout(() => {
    finishOnlineDraftDealVisualOnly();
  }, dealMs);
}

function beginOnlineDraftPoolPass(
  snapshotPool: TravelCardData[],
  nextServerPool: TravelCardData[] | null,
) {
  if (state.isOnlineFinalDraftReturnAnimating || !state.isDraftPhase) return;
  if (snapshotPool.length === 0) return;

  if (state.isPassingDraftCards) {
    if (nextServerPool?.length) {
      state.onlineDraftPendingPool = [...nextServerPool];
    }
    return;
  }

  clearOnlineDraftAnimationTimer();

  state.onlinePassCompleteRetryCount = 0;
  state.onlineDraftPassSnapshotPool = [...snapshotPool];
  if (nextServerPool?.length) {
    state.onlineDraftPendingPool = [...nextServerPool];
  }

  state.draftSelectedCardId = null;
  state.draftPoolFlyReturnCardId = null;
  resetDraftPoolCollapseState();

  state.shouldActivateOnlineDealAnimation = false;
  state.shouldActivateOnlinePassAnimation = true;
  state.isInitialDealInProgress = false;
  state.isPassingDraftCards = true;

  state.onlineDraftAnimationTimerId = window.setTimeout(() => {
    completeOnlineDraftPoolPassAndDeal();
  }, DRAFT_PASS_ANIMATION_MS);
}
// Moved to game/queries.ts
function getDraftPoolHighlightedCardId(): string | null {
  // Pool không hiển thị trạng thái "đã chọn" — lá pending nằm trên tay, slot pool bị ẩn.
  return null;
}
// Moved to game/queries.ts
function getConnectedLobbyPlayers() {
  const roomState = onlineClientState.roomState;

  if (!roomState) return [];

  return playerIds
    .map((playerId) => roomState.players[playerId])
    .filter((player) => player.isConnected);
}

function canCurrentPlayerStartRoom() {
  const roomState = onlineClientState.roomState;

  if (!roomState || roomState.phase !== "lobby") return false;
  if (onlineClientState.playerId !== "p1") return false;

  const connectedPlayers = getConnectedLobbyPlayers();

  return (
    connectedPlayers.length > 0 &&
    connectedPlayers.every((player) => player.isReady)
  );
}

function applyOnlineRoomStateToLocal() {
  const roomState = onlineClientState.roomState;

  if (!roomState) return;

  syncSelfPlanningConfirmLockFromServer();

  state.phaseNumber = state.phaseNumber ?? state.phaseNumber;
  state.currentDayIndex = Math.max(
    0,
    Math.min(PHASE_DAYS - 1, roomState.dayIndex),
  );

  const onlineSelfPublicState =
    roomState.players[onlineClientState.playerId ?? currentPlayerId];

  if (onlineSelfPublicState) {
    state.accumulatedVP = onlineSelfPublicState.score;
  }

  rememberCurrentCertificatePhase();

  state.isDraftPhase = roomState.phase === "draft";
  state.isSimulationMode = roomState.phase === "simulation" ||
    roomState.phase === "result" ||
    roomState.phase === "gameover";
  state.isReplayComplete = roomState.phase === "result" ||
    roomState.phase === "gameover";

  state.draftRound = state.draftRound;
  state.draftPickSecondsLeft = roomState.timer;
  state.remainingTurnSeconds = roomState.timer;

  if (isOnlineRoomActive()) {
    stopDraftTimer();
    stopTurnTimer();
    stopBotPlacementTimer();
  }

  const serverDraftPool =
    (roomState.self.draftPool as TravelCardData[] | undefined) ?? [];
  const onlinePoolSignature = getDraftPoolSignature(serverDraftPool);
  const hasDisplayPool = state.onlineDraftDisplayPool !== null &&
    state.onlineDraftDisplayPool.length > 0;

  if (isOnlineRoomActive()) {
    const enteredDraft = roomState.phase === "draft" &&
      state.lastOnlineAnimationPhase !== "draft";
    const pickedDraftCount = roomState.self.pickedDraftCards?.length ?? 0;
    const pickedIncreased = pickedDraftCount > state.lastOnlinePickedDraftCount;
    const draftRoundAdvanced =
      state.draftRound > state.lastOnlineAnimationDraftRound;

    /*
      Online draft tách 3 việc:
      - server pool: dữ liệu thật mới nhất
      - display pool: pool đang render trên màn hình
      - pending pool: pool mới chờ animation pass xong mới apply
      Như vậy lượt 2/3/4/5 có thể chạy animation trả bài vào state.deck trước,
      rồi mới hiện pool tiếp theo. Lượt 1 cũng không bị full rerender/reset khi chọn.
    */
    if (enteredDraft) {
      clearOnlineDraftAnimationTimer();
      resetDraftPoolCollapseState();
      state.draftHandPendingCardId = null;
      state.draftPoolFlyReturnCardId = null;
      state.onlineDraftPassSnapshotPool = null;

      setOnlineDraftDisplayPoolFromServer();

      /*
        Nếu tab đang ở background hoặc mình quay lại khi lượt draft đã chạy vài giây,
        KHÔNG chạy lại animation chia bài từ đầu. Nếu chạy lại, tab đó sẽ kẹt
        "Đang chia bài..." và không render pool chọn bài, dù server vẫn có bài.
      */
      const shouldSkipOnlineDealAnimation =
        document.visibilityState !== "visible" ||
        roomState.timer < DRAFT_PICK_SECONDS - 1;

      state.shouldActivateOnlineDealAnimation = !shouldSkipOnlineDealAnimation;
      state.shouldActivateOnlinePassAnimation = false;
      state.isInitialDealInProgress = !shouldSkipOnlineDealAnimation;
      state.isPassingDraftCards = false;
      state.hasPlayedOnlinePlanningDealAfterDraft = false;

      if (shouldSkipOnlineDealAnimation) {
        state.isDraftCenterDealing = false;
        state.draftDealVisualEndsAt = 0;
        state.onlineDraftAnimationTimerId = null;
      } else {
        const dealMs = getDraftCenterDealDurationMs(
          Math.max(1, serverDraftPool.length),
        );
        state.onlineDraftAnimationTimerId = window.setTimeout(() => {
          finishOnlineDraftDealVisualOnly();
        }, dealMs);
      }
    } else if (
      roomState.phase === "draft" &&
      state.lastOnlineAnimationPhase === "draft" &&
      (pickedIncreased || draftRoundAdvanced)
    ) {
      if (
        state.isPassingDraftCards &&
        !state.isOnlineFinalDraftReturnAnimating
      ) {
        if (serverDraftPool.length > 0) {
          state.onlineDraftPendingPool = [...serverDraftPool];
        }

        if (pickedIncreased && !state.isDraftPickFlying) {
          state.draftHandPendingCardId = null;
          state.draftPoolFlyReturnCardId = null;
        }
      } else if (!state.isOnlineFinalDraftReturnAnimating) {
        const snapshot = state.onlineDraftDisplayPool ??
          state.onlineDraftPassSnapshotPool ??
          (serverDraftPool.length > 0 ? [...serverDraftPool] : null);

        if (snapshot?.length) {
          beginOnlineDraftPoolPass(snapshot, serverDraftPool);
        } else if (!hasDisplayPool) {
          setOnlineDraftDisplayPoolFromServer();
        }
      }
    } else if (
      roomState.phase === "draft" &&
      serverDraftPool.length > 0 &&
      (!state.onlineDraftDisplayPool ||
        state.onlineDraftDisplayPool.length === 0)
    ) {
      setOnlineDraftDisplayPoolFromServer();
    } else if (roomState.phase === "draft" && !hasDisplayPool) {
      setOnlineDraftDisplayPoolFromServer();
    }

    const isEnteringPlanningAfterDraft = roomState.phase === "planning" &&
      state.lastOnlineAnimationPhase === "draft" &&
      state.onlineDraftDisplayPool !== null &&
      state.onlineDraftDisplayPool.length > 0 &&
      !state.isOnlineFinalDraftReturnAnimating &&
      state.onlineFinalDraftReturnTimerId === null;

    if (isEnteringPlanningAfterDraft) {
      /*
        Lượt draft cuối: server đã chuyển sang planning, nhưng client giữ lại
        2 lá dư trong state.onlineDraftDisplayPool thêm 1 nhịp để chạy animation:
        gom bài -> bay vào state.deck. Không xóa display pool ngay.
      */
      clearOnlineDraftAnimationTimer();

      state.isOnlineFinalDraftReturnAnimating = true;
      state.isDraftPhase = true;
      state.isSimulationMode = false;
      state.isPassingDraftCards = true;
      state.isInitialDealInProgress = false;
      state.shouldActivateOnlinePassAnimation = true;
      state.shouldActivateOnlineDealAnimation = false;

      state.onlineFinalDraftReturnTimerId = window.setTimeout(() => {
        state.isOnlineFinalDraftReturnAnimating = false;
        state.isPassingDraftCards = false;
        state.onlineDraftDisplayPool = null;
        state.onlineDraftPendingPool = null;
        state.onlineFinalDraftReturnTimerId = null;
        state.lastOnlineRenderSignature = "";

        /*
          Sau khi 2 lá dư gom và bay về state.deck, mới hiện hand planning
          bằng animation chia bài bình thường.
        */
        playOnlinePlanningHandDealAfterDraft();
      }, 1550);
    }

    if (
      roomState.phase !== "draft" &&
      !state.isOnlineFinalDraftReturnAnimating
    ) {
      clearOnlineDraftAnimationTimer();

      state.onlineDraftDisplayPool = null;
      state.onlineDraftPassSnapshotPool = null;
      state.onlineDraftPendingPool = null;
      state.shouldActivateOnlineDealAnimation = false;
      state.shouldActivateOnlinePassAnimation = false;
      state.isInitialDealInProgress = false;
      state.isPassingDraftCards = false;
    }

    if (
      pickedDraftCount > state.lastOnlinePickedDraftCount &&
      !state.isDraftPickFlying &&
      !state.isPassingDraftCards
    ) {
      state.draftHandPendingCardId = null;
      state.draftPoolFlyReturnCardId = null;
    }

    state.lastOnlinePickedDraftCount = pickedDraftCount;
    state.lastOnlineAnimationPhase = roomState.phase;
    state.lastOnlineAnimationDraftRound = state.draftRound;
    state.lastOnlineAnimationPoolSignature = onlinePoolSignature;
  }

  const shouldPlayPlanningDealFallback = isOnlineRoomActive() &&
    roomState.phase === "planning" &&
    state.lastOnlineAnimationPhase === "draft" &&
    !state.isOnlineFinalDraftReturnAnimating &&
    !state.hasPlayedOnlinePlanningDealAfterDraft;

  if (shouldPlayPlanningDealFallback) {
    playOnlinePlanningHandDealAfterDraft();
    return;
  }

  if (
    roomState.phase === "planning" &&
    !state.isOnlineFinalDraftReturnAnimating
  ) {
    const onlineHand = getOnlineSelfHand();

    if (onlineHand) {
      state.playerHand = [...onlineHand];
    }

    updatePlanningConfirmButtonVisualOnly();
  }

  if (roomState.phase === "draft") {
    state.playerHand = [];

    if (!state.isDraftPickFlying) {
      state.draftSelectedCardId = roomState.self.selectedDraftCardId;

      if (
        roomState.self.selectedDraftCardId &&
        !state.draftHandPendingCardId &&
        !isDraftDealVisualActive()
      ) {
        state.draftHandPendingCardId = roomState.self.selectedDraftCardId;
      }
    }

    if (!isDraftDealVisualActive() && !state.isDraftPickFlying) {
      updateDraftHandVisualOnly();
      updateDraftPoolFlownVisualOnly();
      updateDraftSelectedVisualOnly();
    }
  }

  if (roomState.phase === "simulation" || roomState.phase === "result") {
    if (isOnlineRoomActive() && !state.hasStartedOnlineSimulationReplay) {
      runOnlineSimulationReplay();
      return;
    }

    if (!state.simulationResult) {
      state.simulationResult = calculateSimulationResult();
      state.simulationReplayIndex = 0;
    }
  } else {
    state.simulationResult = null;
    state.simulationReplayIndex = 0;
    state.isReplayComplete = false;
    state.hasStartedOnlineSimulationReplay = false;
    state.hasAppliedSimulationScore = false;
  }
}

function getCurrentDayPlacedCards(
  dayIndex = state.currentDayIndex,
): TravelCardData[] {
  return getCurrentDayPlacedCardsFromSlots(getBoardSlots(), dayIndex);
}

function setCurrentPlayerBoard(nextBoard: BoardSlots) {
  state.playerBoards[currentPlayerId] = nextBoard;
}

function getOpponentPlayerIds(): PlayerId[] {
  return playerIds.filter((playerId) => playerId !== currentPlayerId);
}

function getFirstEmptyBoardPosition(
  board: BoardSlots,
  preferredColIndex = state.currentDayIndex,
): BoardPosition | null {
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

function cloneCardForBot(
  card: TravelCardData,
  playerId: PlayerId,
  index: number,
): TravelCardData {
  return {
    ...card,
    id:
      `${card.id}_${playerId}_${state.currentDayIndex}_${index}_${Date.now()}`,
  };
}

function getBotSourceCards(playerId: PlayerId): TravelCardData[] {
  const draftIndexByPlayerId: Record<PlayerId, number> = {
    p1: 1,
    p2: 0,
    p3: 2,
    p4: 3,
  };

  const draftPlayer = state.draftPlayers[draftIndexByPlayerId[playerId]];
  const pickedCards = draftPlayer?.picked ?? [];

  if (pickedCards.length > 0) {
    return pickedCards;
  }

  return initialDeck;
}

function placeOneBotCard(
  playerId: PlayerId,
  card: TravelCardData,
  index: number,
) {
  const board = state.playerBoards[playerId];
  const position = getFirstEmptyBoardPosition(board, state.currentDayIndex);

  if (!position) return;

  board[position.rowIndex][position.colIndex] = cloneCardForBot(
    card,
    playerId,
    index,
  );
}

function countBotCardsInCurrentDay(playerId: PlayerId): number {
  let count = 0;
  const board = state.playerBoards[playerId];

  for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
    if (board[rowIndex]?.[state.currentDayIndex] !== null) {
      count += 1;
    }
  }

  return count;
}

function stopBotPlacementTimer() {
  if (state.botPlacementTimerId !== null) {
    window.clearInterval(state.botPlacementTimerId);
    state.botPlacementTimerId = null;
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

  if (
    state.isDraftPhase ||
    state.isSimulationMode ||
    state.isInitialDealInProgress
  ) {
    stopBotPlacementTimer();
    return;
  }

  const opponentIds = getOpponentPlayerIds();
  const availablePlayerIds = opponentIds.filter((playerId) => {
    return countBotCardsInCurrentDay(playerId) < 3;
  });

  if (availablePlayerIds.length === 0) {
    for (const playerId of opponentIds) {
      state.botPlacedDays[playerId].add(state.currentDayIndex);
    }

    stopBotPlacementTimer();
    return;
  }

  const playerId =
    availablePlayerIds[Math.floor(Math.random() * availablePlayerIds.length)];
  const sourceCards = getBotSourceCards(playerId);
  const currentCount = countBotCardsInCurrentDay(playerId);
  const sourceCard =
    sourceCards[currentCount % Math.max(1, sourceCards.length)] ??
      initialDeck[0];

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
  if (
    state.isDraftPhase ||
    state.isSimulationMode ||
    state.isInitialDealInProgress
  ) {
    return;
  }
  if (!hasBotPlacementAvailable()) return;

  /*
    Local fake realtime:
    Cứ mỗi ~1.1s sẽ có 1 người chơi phụ xếp 1 lá.
    Khi lên online thật, đoạn này sẽ được thay bằng socket event "board:updated".
  */
  state.botPlacementTimerId = window.setInterval(() => {
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
// Moved to ui/sidePlayerBoards.ts
function isLastPlacedBoardCell(rowIndex: number, colIndex: number) {
  return (
    state.lastPlacedBoardPosition !== null &&
    state.lastPlacedBoardPosition.rowIndex === rowIndex &&
    state.lastPlacedBoardPosition.colIndex === colIndex
  );
}

function getPlacedCards(): TravelCardData[] {
  return getPlacedCardsFromSlots(getBoardSlots());
}

function stopSimulationReplayTimer() {
  if (state.simulationReplayTimerId !== null) {
    window.clearInterval(state.simulationReplayTimerId);
    state.simulationReplayTimerId = null;
  }
}
// Moved to audio/inGameMusic.ts
function buildSimulationReplaySteps() {
  return buildSimulationReplayStepsFromBoard({
    boardSlots: getBoardSlots(),
    currentDayIndex: state.currentDayIndex,
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
    currentDayIndex: state.currentDayIndex,
    dayLabel: getCurrentDayLabel(),
    rows,
    getBoardDisplayName,
    getCardTagKeys,
    countCardsWithTag,
    getCurrentDayPlacedCards,
  });
}
// Moved to ui/sidePlayerBoards.ts
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
  const nextCard = state.deck.shift();

  if (nextCard) {
    state.playerHand.push(nextCard);
  }
}

function canPlaceOnBoardCell(rowIndex: number, colIndex: number) {
  const cell = getBoardSlots()[rowIndex]?.[colIndex] ?? null;

  return cell === null;
}

function getNextTimeSlotPosition(
  rowIndex: number,
  colIndex: number,
): BoardPosition | null {
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
    state.localCoinDebt += params.coinDebt;
  }

  if (params.staminaDebt <= 0) return;

  const nextPosition = getNextTimeSlotPosition(
    params.rowIndex,
    params.colIndex,
  );

  if (!nextPosition) return;
  if (
    getBoardSlots()[nextPosition.rowIndex]?.[nextPosition.colIndex] !== null
  ) {
    return;
  }

  getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] =
    createExhaustLockTokenCard({
      rowIndex: nextPosition.rowIndex,
      colIndex: nextPosition.colIndex,
      sourceCardName: params.card.name,
    });
}

function payLocalDebtToken(
  rowIndex: number,
  colIndex: number,
  card: TravelCardData,
) {
  const token = card as BoardTokenCard;
  const debtAmount = token.debtAmount ?? 0;
  const remaining = getRemainingResources();

  if (debtAmount <= 0) return;

  if (remaining.coin < debtAmount) {
    alert(`Không đủ xu để trả nợ. Cần ${debtAmount} xu.`);
    return;
  }

  state.eventResourceModifier = {
    ...state.eventResourceModifier,
    coin: state.eventResourceModifier.coin - debtAmount,
  };

  getBoardSlots()[rowIndex][colIndex] = null;
  playGameSound("eventPromo");
  rerenderArena();
}

function payDebtToken(
  rowIndex: number,
  colIndex: number,
  card: TravelCardData,
) {
  if (colIndex !== state.currentDayIndex) {
    state.focusedBoardCard = card;
    state.focusedBoardPosition = { rowIndex, colIndex };
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

function clearLocalGeneratedTokenForReturnedCard(
  rowIndex: number,
  colIndex: number,
  card: TravelCardData,
) {
  const nextPosition = getNextTimeSlotPosition(rowIndex, colIndex);

  if (!nextPosition) return;

  const nextCell =
    getBoardSlots()[nextPosition.rowIndex]?.[nextPosition.colIndex] ?? null;
  const token = nextCell as BoardTokenCard | null;

  if (
    token &&
    token.boardTokenType === "lock" &&
    token.sourceCardName === card.name
  ) {
    getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] = null;
  }
}

function getHandCardById(id: string | null) {
  if (!id) return null;

  if (isOnlineRoomActive()) {
    const onlineDraftCard = getOnlineSelfDraftPool()?.find((card) =>
      card.id === id
    ) ?? null;

    if (onlineDraftCard) {
      return onlineDraftCard;
    }

    const onlineHandCard = getOnlineSelfHand()?.find((card) =>
      card.id === id
    ) ?? null;

    if (onlineHandCard) {
      return onlineHandCard;
    }
  }

  if (state.isDraftPhase) {
    const draftCard = getCurrentDraftPlayer()?.pool.find((card) =>
      card.id === id
    ) ?? null;

    if (draftCard) {
      return draftCard;
    }
  }

  return state.playerHand.find((card) => card.id === id) ?? null;
}

function getBoardCardByPosition(
  rowIndex: number,
  colIndex: number,
): TravelCardData | null {
  return getBoardCardByPositionFromSlots(getBoardSlots(), rowIndex, colIndex);
}
// Moved to ui/cardRender.ts
function getUtilityPlacementEffect(card: TravelCardData) {
  const effect = card.onPlayEffect;
  const tags = getCardTagKeys(card);
  const isUtilityCard = tags.includes("UTILITY") ||
    String(card.tag || "").toLowerCase() === "utility" ||
    stripCardText(card.tagLabel || "")
      .toLowerCase()
      .includes("tiện ích");

  const fullText = stripCardText(
    [
      card.name,
      card.shortName || "",
      card.description || "",
      card.bonusText || "",
      card.tagLabel || "",
    ].join(" "),
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

  if (
    fullText.includes("vp") ||
    fullText.includes("điểm") ||
    fullText.includes("diem")
  ) {
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

  state.lastUtilityEffectFlash = {
    ...params,
    id: flashId,
  };
  state.resourceOrbFlashType = params.type;

  window.setTimeout(() => {
    if (state.lastUtilityEffectFlash?.id === flashId) {
      state.lastUtilityEffectFlash = null;
    }

    if (state.resourceOrbFlashType === params.type) {
      state.resourceOrbFlashType = null;
    }

    rerenderArena();
  }, 1050);
}

function applyUtilityPlacementEffect(
  card: TravelCardData,
  rowIndex: number,
  colIndex: number,
) {
  const effect = getUtilityPlacementEffect(card);

  if (!effect) return false;

  if (effect.type === "coin") {
    state.eventResourceModifier = {
      ...state.eventResourceModifier,
      coin: state.eventResourceModifier.coin + effect.value,
    };
    playGameSound("eventPromo");
  } else if (effect.type === "stamina") {
    state.eventResourceModifier = {
      ...state.eventResourceModifier,
      stamina: state.eventResourceModifier.stamina + effect.value,
    };
    playGameSound("eventPromo");
  } else if (effect.type === "vp") {
    state.accumulatedVP += effect.value;
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
    !state.lastUtilityEffectFlash ||
    state.lastUtilityEffectFlash.rowIndex !== rowIndex ||
    state.lastUtilityEffectFlash.colIndex !== colIndex
  ) {
    return "";
  }

  const { type, value } = state.lastUtilityEffectFlash;
  const icon = type === "coin" ? "🪙" : type === "stamina" ? "⚡" : "★";
  const label = type === "coin"
    ? `+${value} Xu`
    : type === "stamina"
    ? `+${value} Thể lực`
    : `+${value} VP`;

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
// Moved to ui/cardRender.ts
async function measureDraftPendingHandSlotRect(): Promise<DOMRect | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve())
        );
      });
    }

    updateDraftHandVisualOnly({ hiddenPendingMeasure: true });

    const cardsEl = document.querySelector(
      ".player-hand__cards--draft",
    ) as HTMLElement | null;
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
  state.draftHandPendingCardId = null;

  if (state.draftSelectedCardId === cardId) {
    state.draftSelectedCardId = null;
  }

  getDraftCenterCardWrapper(cardId)?.classList.remove(
    "draft-center-card-wrapper--flown-to-hand",
  );
  updateDraftPoolFlownVisualOnly();
  updateDraftHandVisualOnly();
  updateDraftConfirmButtonVisualOnly();
}
// Moved to ui/draftArena.ts
function updateDraftConfirmButtonVisualOnly() {
  if (!state.isDraftPhase) return;

  const button = document.querySelector(
    ".state.deck-pile-panel__draft-confirm",
  ) as HTMLButtonElement | null;
  if (!button) return;

  const canConfirm =
    !!(state.draftHandPendingCardId || state.draftSelectedCardId) &&
    !state.isDraftPickFlying &&
    !state.isPassingDraftCards &&
    !isDraftDealVisualActive() &&
    !state.isDraftPoolCollapseAnimating;

  button.disabled = !canConfirm;
}

function updatePlanningConfirmButtonVisualOnly() {
  if (!isOnlinePlanningPhase()) return;

  const button = document.querySelector(
    ".state.deck-pile-panel__planning-confirm",
  ) as HTMLButtonElement | null;
  if (!button) return;

  const confirmed = isSelfPlanningConfirmed();
  button.disabled = confirmed;
  button.textContent = confirmed ? "Đã xác nhận" : "Xác nhận";

  const statusElement = document.querySelector(
    ".state.deck-pile-panel__planning-status",
  ) as HTMLElement | null;

  if (statusElement) {
    statusElement.textContent = getPlanningConfirmStatusLabel();
  }
}

function resetDraftPoolCollapseState() {
  if (state.draftPoolCollapseTimerId !== null) {
    window.clearTimeout(state.draftPoolCollapseTimerId);
    state.draftPoolCollapseTimerId = null;
  }

  state.isDraftPoolCollapsed = false;
  state.isDraftPoolCollapseAnimating = false;
  state.draftPoolCollapseAnimMode = null;
}

function updateDraftPoolToggleVisualOnly() {
  const button = document.querySelector(
    ".state.deck-pile-panel__pool-toggle",
  ) as HTMLButtonElement | null;
  if (!button) return;

  button.textContent = state.isDraftPoolCollapsed ? "Mở pool" : "Thu gọn";
  button.disabled = isDraftPoolToggleBlocked();
  button.title = state.isDraftPoolCollapsed
    ? "Hiện lại pool chọn bài"
    : "Thu gọn pool để xem bàn cờ";
}

function getDraftCenterPickOverlayElement(): HTMLElement | null {
  return document.querySelector(
    ".draft-center-overlay:not(.draft-center-overlay--returning)",
  ) as HTMLElement | null;
}

function activateDraftCenterPoolDeckFlyAnimation(
  mode: "collapse" | "expand",
): boolean {
  const overlayElement = getDraftCenterPickOverlayElement();
  const deckStackElement = document.querySelector(
    ".state.deck-card-stack",
  ) as HTMLElement | null;

  if (!overlayElement || !deckStackElement) return false;

  const poolCards = Array.from(
    overlayElement.querySelectorAll(
      ".draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)",
    ),
  ) as HTMLElement[];

  if (poolCards.length === 0) return false;

  overlayElement.classList.remove(
    "draft-center-overlay--collapsed",
    "draft-center-overlay--collapsing",
    "draft-center-overlay--expanding",
    "pass-active",
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
    deckInsertY,
  );

  deckStackElement
    .closest(".state.deck-pile-panel")
    ?.classList.add("state.deck-receiving");
  overlayElement.classList.add(
    mode === "collapse"
      ? "draft-center-overlay--collapsing"
      : "draft-center-overlay--expanding",
    "pass-active",
  );

  return true;
}

function finishDraftPoolCollapseAnimation() {
  state.draftPoolCollapseTimerId = null;
  state.isDraftPoolCollapseAnimating = false;
  state.draftPoolCollapseAnimMode = null;
  state.isDraftPoolCollapsed = true;

  const overlayElement = getDraftCenterPickOverlayElement();
  overlayElement?.classList.remove(
    "draft-center-overlay--collapsing",
    "pass-active",
  );
  overlayElement?.classList.add("draft-center-overlay--collapsed");

  document
    .querySelector(".state.deck-pile-panel")
    ?.classList.remove("state.deck-receiving");
  updateDraftPoolToggleVisualOnly();
  updateDraftConfirmButtonVisualOnly();
}

function finishDraftPoolExpandAnimation() {
  state.draftPoolCollapseTimerId = null;
  state.isDraftPoolCollapseAnimating = false;
  state.draftPoolCollapseAnimMode = null;
  state.isDraftPoolCollapsed = false;

  const overlayElement = getDraftCenterPickOverlayElement();
  overlayElement?.classList.remove(
    "draft-center-overlay--expanding",
    "draft-center-overlay--collapsed",
    "pass-active",
  );

  document
    .querySelector(".state.deck-pile-panel")
    ?.classList.remove("state.deck-receiving");
  updateDraftPoolToggleVisualOnly();
  updateDraftConfirmButtonVisualOnly();
}

function collapseDraftPoolVisual() {
  if (isDraftPoolToggleBlocked() || state.isDraftPoolCollapsed) return;

  state.isDraftPoolCollapseAnimating = true;
  state.draftPoolCollapseAnimMode = "collapse";
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

  state.draftPoolCollapseTimerId = window.setTimeout(() => {
    finishDraftPoolCollapseAnimation();
  }, DRAFT_POOL_COLLAPSE_MS);
}

function expandDraftPoolVisual() {
  if (isDraftPoolToggleBlocked() || !state.isDraftPoolCollapsed) return;

  state.isDraftPoolCollapsed = false;
  state.isDraftPoolCollapseAnimating = true;
  state.draftPoolCollapseAnimMode = "expand";

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

  state.draftPoolCollapseTimerId = window.setTimeout(() => {
    finishDraftPoolExpandAnimation();
  }, DRAFT_POOL_COLLAPSE_MS);
}

function toggleDraftPoolCollapse() {
  if (
    !state.isDraftPhase ||
    !shouldShowDraftPickPool() ||
    isDraftPoolToggleBlocked()
  ) {
    return;
  }

  if (state.isDraftPoolCollapsed) {
    expandDraftPoolVisual();
  } else {
    collapseDraftPoolVisual();
  }
}
// Moved to game/queries.ts
function updateDraftTimerDisplayVisualOnly() {
  const meta = document.querySelector(".player-hand__meta");
  if (!meta || !state.isDraftPhase) return;

  meta.textContent = isDraftPickTimerFrozen()
    ? "Đang chia bài..."
    : `Còn ${getDraftTimerDisplayLabel()} • ${
      state.isPassingDraftCards ? "Đang chuyền bài..." : "bấm 1 lá để chọn"
    }`;
  meta.classList.toggle("player-hand__meta--danger", isDraftTimerDanger());
}

function getOnlineBoardForPlayer(playerId?: PlayerId) {
  return getOnlinePlayerBoard(playerId);
}
// Moved to ui/sidePlayerBoards.ts
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
  count: number,
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
  const baseQuota = [
    "FOOD",
    "CULTURE",
    "ACTION",
    "UTILITY",
    "FOOD",
    "CULTURE",
    "ACTION",
  ];

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
  if (count <= 0 || state.deck.length === 0) return [];

  /*
    Sửa lỗi roll toàn Ẩm thực:
    - Trước đây có thể tag bị đọc sai hoặc lấy theo thứ tự state.deck.
    - Bản này bucket theo prefix ID thật + quota cứng.
    - Nếu state.deck còn CULTURE/ACTION/UTILITY thì pool 7 lá không thể toàn FOOD.
  */
  const shuffledDeck = shuffleCards(state.deck);
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
  const fallbackOrder = shuffleValues([
    "CULTURE",
    "ACTION",
    "UTILITY",
    "FOOD",
    "UNKNOWN",
  ]);

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

  state.deck = shuffledDeck.filter((card) => !selectedIds.has(card.id));

  console.log(
    "[Draft] state.deck tag counts before draw:",
    getDraftTagCounts(shuffledDeck),
  );
  console.log(
    "[Draft] single-player pool:",
    selectedCards.map((card) => `${card.id}:${getDraftPrimaryTag(card)}`),
  );
  console.log(
    "[Draft] single-player pool tag counts:",
    getDraftTagCounts(selectedCards),
  );

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
    - Pick xong 1 lá: trả 6 lá còn lại về state.deck.
    - Lượt 2: random lại 6 lá mới.
    - Lượt 3: random lại 5 lá mới.
    - Lượt 4: random lại 4 lá mới.
    - Lượt 5: random lại 3 lá mới.
    => Không giữ pool cũ, nhưng số lá giảm dần theo số lá đã pick.
  */
  if (currentPlayer.pool.length > 0) {
    state.deck = shuffleCards([...state.deck, ...currentPlayer.pool]);
  }

  const nextPoolSize = Math.max(
    DRAFT_STARTING_POOL_SIZE - currentPlayer.picked.length,
    DRAFT_STARTING_POOL_SIZE - HAND_SIZE + 1,
  );
  const nextPool = drawRandomCardsFromDeck(nextPoolSize);

  state.draftPlayers = state.draftPlayers.map((player, index) => {
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
    deck: state.deck,
    initialDeck,
    handSize: DRAFT_STARTING_POOL_SIZE,
    playerCount: PLAYER_COUNT,
    shuffleCards,
  });

  state.deck = result.deck;

  return result.draftPlayers;
}

function stopDraftTimer() {
  if (state.draftTimerId !== null) {
    window.clearInterval(state.draftTimerId);
    state.draftTimerId = null;
  }
}

function startDraftTimer() {
  stopDraftTimer();

  if (isOnlineRoomActive()) return;
  if (!state.isDraftPhase || state.isPassingDraftCards) return;

  state.draftTimerId = window.setInterval(() => {
    state.draftPickSecondsLeft -= 1;

    if (state.draftPickSecondsLeft <= 0) {
      state.draftPickSecondsLeft = 0;
      autoPickDraftCard();
      return;
    }

    if (state.isDraftPoolCollapseAnimating) {
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

  state.draftPlayers = createDailyDraftPlayers();
  preloadDraftImages();
  state.draftSelectedCardId = null;
  state.draftHandPendingCardId = null;
  state.draftPoolFlyReturnCardId = null;
  state.lastOnlinePickedDraftCount = 0;
  state.draftPickSecondsLeft = DRAFT_PICK_SECONDS;
  state.isPassingDraftCards = false;
  resetDraftPoolCollapseState();
  state.draftPassDisplayPool = null;
  state.draftRound = 1;
  state.lastDraftPickResults = [];

  state.playerHand = [];
  state.isDraftPhase = true;
  state.isInitialDealInProgress = false;
  state.isSimulationMode = false;
  state.simulationResult = null;
  state.simulationReplayIndex = 0;
  state.isReplayComplete = false;
  state.hasAppliedSimulationScore = false;
  state.remainingTurnSeconds = TURN_DURATION_SECONDS;

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.lastPlacedBoardPosition = null;
  state.suppressNextClick = false;

  playDraftDealAnimationAndStartTimer();
}
// Moved to game/queries.ts
function rotateDraftPoolsClockwise() {
  state.draftPlayers = rotateDraftPoolsClockwiseList(state.draftPlayers);
}

function completeDailyDraftPhase() {
  stopDraftTimer();
  clearDailyDealTimer();

  const currentPlayer = getCurrentDraftPlayer();

  /*
    Draft 7 pick 5:
    - Người chơi giữ đúng 5 lá đã pick.
    - 2 lá dư trong pool được trả lại state.deck và shuffle lại.
  */
  const leftoverDraftCards = state.draftPlayers.reduce<TravelCardData[]>(
    (cards, player) => {
      cards.push(...player.pool);
      return cards;
    },
    [],
  );

  if (leftoverDraftCards.length > 0) {
    state.deck = shuffleCards([...state.deck, ...leftoverDraftCards]);
  }

  state.playerHand = currentPlayer
    ? currentPlayer.picked.slice(0, HAND_SIZE)
    : [];

  state.isDraftPhase = false;
  state.isPassingDraftCards = false;
  state.draftSelectedCardId = null;
  state.draftPickSecondsLeft = 0;
  state.lastDraftPickResults = [];
  state.isInitialDealInProgress = true;

  rerenderArena();
  finishDailyDealAndStartTimer();
}

function finishDraftPick(cardId: string | null) {
  if (!state.isDraftPhase || state.isPassingDraftCards) return;

  const activeIndex = getActiveDraftPlayerIndex();
  const pickResults: DraftPickResult[] = [];

  if (isSinglePlayerLocalDraftMode()) {
    const currentPlayer = getCurrentDraftPlayer();

    if (!currentPlayer || currentPlayer.pool.length === 0) {
      completeDailyDraftPhase();
      return;
    }

    const chosenCard = currentPlayer.pool.find((card) => card.id === cardId) ??
      pickRandomCard(currentPlayer.pool);

    if (!chosenCard) {
      completeDailyDraftPhase();
      return;
    }

    pickResults.push({
      playerIndex: activeIndex,
      pickedCard: chosenCard,
    });

    state.draftPassDisplayPool = [...currentPlayer.pool];

    state.draftPlayers = state.draftPlayers.map((player, playerIndex) => {
      if (playerIndex !== activeIndex) return player;

      return {
        ...player,
        picked: [...player.picked, chosenCard],
        pool: player.pool.filter((card) => card.id !== chosenCard.id),
      };
    });

    state.lastDraftPickResults = pickResults;
    state.draftSelectedCardId = null;
    state.draftHandPendingCardId = null;
    state.draftPoolFlyReturnCardId = null;
    state.isPassingDraftCards = true;

    stopDraftTimer();
    rerenderArena();
    activateDraftCenterPoolPassAnimation();

    window.setTimeout(() => {
      state.draftPassDisplayPool = null;
      const nextCurrentPlayer = getCurrentDraftPlayer();

      if (!nextCurrentPlayer || nextCurrentPlayer.picked.length >= HAND_SIZE) {
        state.isPassingDraftCards = false;
        completeDailyDraftPhase();
        return;
      }

      /*
        Chơi 1 người: mỗi lượt random lại pool mới, nhưng size giảm dần.
        7 lá -> pick -> random 6 lá -> pick -> random 5 lá -> ... -> đủ 5 lá.
      */
      resetSinglePlayerDraftPool();
      preloadDraftImages();

      state.draftRound += 1;
      state.draftPickSecondsLeft = DRAFT_PICK_SECONDS;
      state.isPassingDraftCards = false;
      state.lastDraftPickResults = [];

      playDraftDealAnimationAndStartTimer();
    }, DRAFT_PASS_ANIMATION_MS);

    return;
  }

  const currentPlayerBeforePass = getCurrentDraftPlayer();
  state.draftPassDisplayPool = currentPlayerBeforePass
    ? [...currentPlayerBeforePass.pool]
    : null;

  state.draftPlayers = state.draftPlayers.map((player, playerIndex) => {
    if (player.pool.length === 0) return player;

    const chosenCard = playerIndex === activeIndex
      ? (player.pool.find((card) => card.id === cardId) ??
        pickRandomCard(player.pool))
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

  state.lastDraftPickResults = pickResults;
  state.draftSelectedCardId = null;
  state.draftHandPendingCardId = null;
  state.draftPoolFlyReturnCardId = null;
  state.isPassingDraftCards = true;

  stopDraftTimer();
  rerenderArena();
  activateDraftCenterPoolPassAnimation();

  window.setTimeout(() => {
    state.draftPassDisplayPool = null;
    const currentPlayer = getCurrentDraftPlayer();

    /*
      Draft mới: phát 7 lá, nhưng chỉ pick đủ 5 lá.
      Khi đã đủ 5 lá thì trả 2 lá dư còn lại về state.deck, không cần draft tới khi pool rỗng.
    */
    if (!currentPlayer || currentPlayer.picked.length >= HAND_SIZE) {
      state.isPassingDraftCards = false;
      completeDailyDraftPhase();
      return;
    }

    rotateDraftPoolsClockwise();
    preloadDraftImages();

    state.draftRound += 1;
    state.draftPickSecondsLeft = DRAFT_PICK_SECONDS;
    state.isPassingDraftCards = false;
    state.lastDraftPickResults = [];

    playDraftDealAnimationAndStartTimer();
  }, DRAFT_PASS_ANIMATION_MS);
}

function autoPickDraftCard() {
  const currentPlayer = getCurrentDraftPlayer();

  if (!currentPlayer || currentPlayer.picked.length >= HAND_SIZE) {
    completeDailyDraftPhase();
    return;
  }

  finishDraftPick(state.draftSelectedCardId ?? null);
}

function getDraftStatusText() {
  if (state.isPassingDraftCards) {
    return isSinglePlayerLocalDraftMode()
      ? "Đang đổi pool mới ngẫu nhiên cho lượt kế tiếp"
      : "Đang truyền bài còn lại theo chiều kim đồng hồ";
  }

  return isSinglePlayerLocalDraftMode()
    ? "Chọn 1 lá để giữ. Sau mỗi lượt, pool sẽ random lá mới."
    : "Chọn 1 lá để giữ. Hết 10s hệ thống sẽ chọn ngẫu nhiên.";
}
// Moved to ui/cardRender.ts
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

  const waitBanner = document.querySelector(
    ".draft-center-wait-banner",
  ) as HTMLElement | null;
  if (waitBanner) {
    waitBanner.style.display = shouldShowDraftWaitBanner() ? "" : "none";
  }

  updateDraftConfirmButtonVisualOnly();
}

function removeDraftPickFlyLayer() {
  document
    .querySelectorAll(".draft-pick-fly-layer")
    .forEach((element) => element.remove());
}

function ensureDraftPickFlyLayer(): HTMLElement {
  let layer = document.querySelector(
    ".draft-pick-fly-layer",
  ) as HTMLElement | null;

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

function computeDraftPickFlyScaleEnd(
  fromRect: DOMRect,
  toRect: DOMRect,
): number {
  if (fromRect.width <= 0) return 1;
  return clampDraftPickFlyScale(toRect.width / fromRect.width);
}
// Moved to game/queries.ts
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
  },
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

  if (
    !fromRect ||
    !sourceHtml ||
    !poolCard ||
    !wrapper ||
    fromRect.width <= 0 ||
    fromRect.height <= 0
  ) {
    revertDraftPickFlyToHand(cardId);
    return;
  }

  state.draftHandPendingCardId = cardId;
  wrapper.classList.add("draft-center-card-wrapper--flown-to-hand");
  updateDraftPoolFlownVisualOnly();
  updateDraftHandVisualOnly({ hiddenPendingMeasure: true });

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => resolve())
    );
  });

  const toTarget = getDraftHandFlyTargetForPending();

  if (!toTarget) {
    revertDraftPickFlyToHand(cardId);
    return;
  }

  const poolScaleStart = clampDraftPickFlyScale(
    fromRect.width / readDraftHandCardMetrics().cardW,
  );

  await animateDraftPickFly(
    fromRect,
    toTarget.rect,
    sourceHtml,
    DRAFT_HAND_PICK_SCALE,
    {
      direction: "to-hand",
      scaleStart: poolScaleStart,
      rotateStart: 0,
      rotateEnd: toTarget.rotate,
      flyWidth: readDraftHandCardMetrics().cardW,
      flyHeight: readDraftHandCardMetrics().cardH,
    },
  );
  updateDraftHandVisualOnly();
}

async function playDraftPickFlyToPool(cardId: string) {
  const handCard = document.querySelector(
    `[data-draft-hand-card-id="${cardId}"]`,
  ) as HTMLElement | null;
  const sourceInnerHtml = handCard?.outerHTML;
  const handFlySource = handCard
    ? getDraftHandFlySourceFromElement(handCard)
    : null;
  const fromRect = handFlySource?.rect ?? handCard?.getBoundingClientRect();

  if (
    !fromRect ||
    !sourceInnerHtml ||
    !handCard ||
    fromRect.width <= 0 ||
    fromRect.height <= 0
  ) {
    return;
  }

  handCard.classList.add("hand-card--picked-pending-hidden");

  state.draftPoolFlyReturnCardId = cardId;
  updateDraftPoolFlownVisualOnly();

  const wrapper = getDraftCenterCardWrapper(cardId);
  const poolCard = wrapper?.querySelector(".hand-card") as HTMLElement | null;
  const poolTargetRect = poolCard?.getBoundingClientRect() ??
    wrapper?.getBoundingClientRect();

  if (!poolTargetRect) {
    state.draftHandPendingCardId = null;
    state.draftPoolFlyReturnCardId = null;
    updateDraftHandVisualOnly();
    updateDraftPoolFlownVisualOnly();
    return;
  }

  const { cardW, cardH } = readDraftHandCardMetrics();
  const poolScaleEnd = clampDraftPickFlyScale(poolTargetRect.width / cardW);

  try {
    await animateDraftPickFly(
      fromRect,
      poolTargetRect,
      sourceInnerHtml,
      poolScaleEnd,
      {
        direction: "to-pool",
        scaleStart: DRAFT_HAND_PICK_SCALE,
        rotateStart: handFlySource?.rotate ?? 0,
        rotateEnd: 0,
        flyWidth: cardW,
        flyHeight: cardH,
      },
    );
  } finally {
    state.draftHandPendingCardId = null;
    state.draftPoolFlyReturnCardId = null;
    updateDraftHandVisualOnly();
    updateDraftPoolFlownVisualOnly();
  }
}

async function playDraftPickSwap(fromCardId: string, toCardId: string) {
  const fromHandEl = document.querySelector(
    `[data-draft-hand-card-id="${fromCardId}"]`,
  ) as HTMLElement | null;
  const fromHandFlySource = fromHandEl
    ? getDraftHandFlySourceFromElement(fromHandEl)
    : null;
  const fromRect = fromHandFlySource?.rect ??
    fromHandEl?.getBoundingClientRect();
  const fromHtml = fromHandEl?.outerHTML;

  const toPoolWrapper = getDraftCenterCardWrapper(toCardId);
  const toPoolCard = toPoolWrapper?.querySelector(
    ".hand-card",
  ) as HTMLElement | null;
  const toPoolRect = toPoolCard?.getBoundingClientRect();
  const toPoolHtml = toPoolCard?.outerHTML;

  const fromPoolWrapper = getDraftCenterCardWrapper(fromCardId);
  const fromPoolCard = fromPoolWrapper?.querySelector(
    ".hand-card",
  ) as HTMLElement | null;
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

  state.draftHandPendingCardId = toCardId;
  state.draftPoolFlyReturnCardId = fromCardId;
  updateDraftPoolFlownVisualOnly();
  updateDraftHandVisualOnly({ hiddenPendingMeasure: true });

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => resolve())
    );
  });

  const toHandTarget = getDraftHandFlyTargetForPending();

  if (!toHandTarget) {
    fromHandEl.classList.remove("hand-card--picked-pending-hidden");
    state.draftHandPendingCardId = fromCardId;
    state.draftPoolFlyReturnCardId = null;
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
      animateDraftPickFly(
        toPoolRect,
        toHandTarget.rect,
        toPoolHtml,
        DRAFT_HAND_PICK_SCALE,
        {
          scaleStart: poolPickScaleStart,
          rotateStart: 0,
          rotateEnd: toHandTarget.rotate,
          flyWidth: cardW,
          flyHeight: cardH,
        },
      ),
    ]);
  } finally {
    state.draftPoolFlyReturnCardId = null;
    updateDraftHandVisualOnly();
    updateDraftPoolFlownVisualOnly();
  }
}

function updateDraftHandVisualOnly(options?: {
  hiddenPendingMeasure?: boolean;
}) {
  const cardsEl = document.querySelector(
    ".player-hand__cards--draft",
  ) as HTMLElement | null;
  if (!cardsEl) return;

  const count = getDraftHandDisplayCount();
  cardsEl.className =
    `player-hand__cards player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${count}`;
  cardsEl.innerHTML = renderPickedDraftCards(options);
}

function updateDraftPoolFlownVisualOnly() {
  document.querySelectorAll(".draft-center-card-wrapper").forEach((wrapper) => {
    const cardEl = wrapper.querySelector(
      ".draft-center-card[data-draft-card-id]",
    ) as HTMLElement | null;
    const cardId = cardEl?.dataset.draftCardId;
    if (!cardId) return;

    wrapper.classList.remove("draft-center-card-wrapper--selected");
    wrapper.classList.toggle(
      "draft-center-card-wrapper--flown-to-hand",
      shouldHideDraftPoolSlot(cardId),
    );

    cardEl.style.removeProperty("z-index");
    cardEl.style.removeProperty("isolation");

    const innerCard = cardEl.querySelector(".hand-card") as HTMLElement | null;
    innerCard?.classList.remove("hand-card--draft-selected");
    innerCard?.style.removeProperty("z-index");
    innerCard?.style.removeProperty("position");

    const button = wrapper.querySelector(
      ".draft-center-btn",
    ) as HTMLButtonElement | null;
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
  cardId: string,
) {
  state.isDraftPickFlying = true;

  let didChangeHand = false;

  try {
    if (!nextSelected) {
      if (prevPending) {
        await playDraftPickFlyToPool(prevPending);
        didChangeHand = true;
      }
    } else if (!prevPending) {
      await playDraftPickFlyToHand(nextSelected);
      didChangeHand = state.draftHandPendingCardId === nextSelected;
    } else if (prevPending !== nextSelected) {
      await playDraftPickSwap(prevPending, nextSelected);
      didChangeHand = state.draftHandPendingCardId === nextSelected;
    }

    if (didChangeHand) {
      updateDraftHandVisualOnly();
    }

    updateDraftSelectedVisualOnly();

    if (isOnlineRoomActive()) {
      selectOnlineDraftCard(cardId);
    }
  } finally {
    state.isDraftPickFlying = false;
    updateDraftConfirmButtonVisualOnly();
    updateDraftPoolToggleVisualOnly();
  }
}

function selectDraftCard(cardId: string) {
  if (!state.isDraftPhase) return;

  if (
    state.isDraftPickFlying ||
    state.isPassingDraftCards ||
    isDraftDealVisualActive() ||
    state.isDraftPoolCollapsed ||
    state.isDraftPoolCollapseAnimating
  ) {
    return;
  }

  if (state.suppressNextClick) {
    state.suppressNextClick = false;

    if (
      state.focusedHandCardId ||
      state.focusedBoardCard ||
      state.focusedBoardPosition
    ) {
      return;
    }
  }

  const prevPending = state.draftHandPendingCardId;
  const nextSelected = state.draftSelectedCardId === cardId ? null : cardId;

  playGameSound("cardSelect");
  state.draftSelectedCardId = nextSelected;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;

  if (nextSelected && !prevPending) {
    state.draftHandPendingCardId = nextSelected;
    updateDraftPoolFlownVisualOnly();
    updateDraftHandVisualOnly({ hiddenPendingMeasure: true });
    updateDraftConfirmButtonVisualOnly();
  }

  void handleDraftPickSelectionChange(prevPending, nextSelected, cardId);
}

function confirmDraftPick() {
  if (!state.isDraftPhase) return;

  if (
    state.isDraftPickFlying ||
    state.isPassingDraftCards ||
    !(state.draftHandPendingCardId || state.draftSelectedCardId)
  ) {
    return;
  }

  const cardId = state.draftSelectedCardId ?? state.draftHandPendingCardId;

  if (!cardId) return;

  if (isOnlineRoomActive()) {
    confirmOnlineDraftPick();
    return;
  }

  finishDraftPick(cardId);
}

function resetSelfPlanningConfirmLock() {
  state.selfPlanningConfirmPending = false;
  state.planningConfirmLockSignature = "";
  state.planningConfirmRetryCount = 0;

  if (state.planningConfirmRetryTimerId !== null) {
    window.clearTimeout(state.planningConfirmRetryTimerId);
    state.planningConfirmRetryTimerId = null;
  }
}

function hasServerAckedPlanningConfirm() {
  const playerId = onlineClientState.playerId;
  const roomState = onlineClientState.roomState;

  if (!playerId || !roomState) {
    return false;
  }

  if (roomState.phase === "simulation" || roomState.phase === "result") {
    return true;
  }

  return roomState.players[playerId]?.planningConfirmed === true;
}

function schedulePlanningConfirmRetry() {
  if (state.planningConfirmRetryTimerId !== null) return;
  if (!state.selfPlanningConfirmPending || !isOnlinePlanningPhase()) return;
  if (hasServerAckedPlanningConfirm()) {
    resetSelfPlanningConfirmLock();
    return;
  }

  state.planningConfirmRetryTimerId = window.setTimeout(() => {
    state.planningConfirmRetryTimerId = null;

    if (
      !state.selfPlanningConfirmPending ||
      !isOnlinePlanningPhase() ||
      hasServerAckedPlanningConfirm()
    ) {
      resetSelfPlanningConfirmLock();
      updatePlanningConfirmButtonVisualOnly();
      return;
    }

    state.planningConfirmRetryCount += 1;

    if (state.planningConfirmRetryCount > 8) {
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
  const roomState = onlineClientState.roomState;
  const playerId = onlineClientState.playerId;

  if (!roomState || !playerId) {
    resetSelfPlanningConfirmLock();
    return;
  }

  if (roomState.phase !== "planning") {
    resetSelfPlanningConfirmLock();
    state.lastOnlinePlanningDayIndex = null;
    return;
  }

  if (
    state.lastOnlinePlanningDayIndex !== null &&
    state.lastOnlinePlanningDayIndex !== roomState.dayIndex
  ) {
    resetSelfPlanningConfirmLock();
  }

  state.lastOnlinePlanningDayIndex = roomState.dayIndex;

  if (roomState.players[playerId]?.planningConfirmed === true) {
    resetSelfPlanningConfirmLock();
    return;
  }

  if (state.selfPlanningConfirmPending) {
    schedulePlanningConfirmRetry();
  }

  if (
    state.selfPlanningConfirmPending &&
    state.planningConfirmLockSignature !== getSelfPlanningConfirmLockSignature()
  ) {
    resetSelfPlanningConfirmLock();
  }
}

function confirmPlanningPick() {
  if (!isOnlinePlanningPhase()) return;
  if (isSelfPlanningConfirmed()) return;

  state.selfPlanningConfirmPending = true;
  state.planningConfirmLockSignature = getSelfPlanningConfirmLockSignature();
  state.planningConfirmRetryCount = 0;

  try {
    confirmOnlinePlanning();
  } catch (error) {
    resetSelfPlanningConfirmLock();

    const message = error instanceof Error
      ? error.message
      : "Không gửi được xác nhận.";
    alert(message);
    updatePlanningConfirmButtonVisualOnly();
    return;
  }

  updatePlanningConfirmButtonVisualOnly();
  schedulePlanningConfirmRetry();
}

function selectHandCard(cardId: string) {
  if (
    state.isDraftPhase ||
    state.isSimulationMode ||
    state.isInitialDealInProgress
  ) {
    return;
  }

  if (state.suppressNextClick) {
    state.suppressNextClick = false;
    return;
  }

  playGameSound("cardSelect");
  state.selectedHandCardId = state.selectedHandCardId === cardId
    ? null
    : cardId;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;

  rerenderGameShell();
}

function clearSelectedHandCard() {
  if (state.isDraftPhase) return;

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;

  rerenderArena();
}

function stopTurnTimer() {
  if (state.turnTimerId !== null) {
    window.clearInterval(state.turnTimerId);
    state.turnTimerId = null;
  }
}

function startTurnTimer() {
  stopTurnTimer();

  if (isOnlineRoomActive()) return;
  if (state.isSimulationMode || state.isDraftPhase) return;

  state.turnTimerId = window.setInterval(() => {
    state.remainingTurnSeconds -= 1;

    if (state.remainingTurnSeconds <= 0) {
      state.remainingTurnSeconds = 0;
      stopTurnTimer();
      runSystemSimulation();
      return;
    }

    rerenderArena();
  }, 1000);
}

function clearDayAdvanceTimer() {
  if (state.dayAdvanceTimerId !== null) {
    window.clearTimeout(state.dayAdvanceTimerId);
    state.dayAdvanceTimerId = null;
  }
}

function clearDailyDealTimer() {
  if (state.dailyDealTimerId !== null) {
    window.clearTimeout(state.dailyDealTimerId);
    state.dailyDealTimerId = null;
  }
}

function activateDraftDealAnimation() {
  startDraftCenterDealAnimation(getDraftCenterDealDurationForCurrentPool());
}

function ensureOnlineDraftDealAnimationStarted() {
  if (
    !isOnlineRoomActive() ||
    !state.isDraftPhase ||
    !state.isInitialDealInProgress
  ) {
    return;
  }

  const handElement = document.querySelector(
    ".player-hand--draft.player-hand--dealing",
  ) as HTMLElement | null;

  if (!handElement || handElement.classList.contains("deal-active")) return;

  handElement.classList.add("deal-active");
}

function applyDraftReturnGatherVars(
  cards: HTMLElement[],
  gatherCenterX: number,
  gatherCenterY: number,
  deckInsertX: number,
  deckInsertY: number,
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

    card.style.setProperty("--state.deck-in-x", `${deckX}px`);
    card.style.setProperty("--state.deck-in-y", `${deckY}px`);
    card.style.setProperty("--state.deck-r", `${-6 + stackOffset * 3}deg`);
  });
}

function activateDraftCenterPoolPassAnimation() {
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const overlayElement = (document.querySelector(
        ".draft-center-overlay--passing:not(.draft-center-overlay--returning)",
      ) as HTMLElement | null) ??
        (document.querySelector(
          ".draft-center-overlay:not(.draft-center-overlay--returning)",
        ) as HTMLElement | null);
      const deckStackElement = document.querySelector(
        ".state.deck-card-stack",
      ) as HTMLElement | null;

      if (!overlayElement || !deckStackElement) return;

      const passingCards = Array.from(
        overlayElement.querySelectorAll(
          ".draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)",
        ),
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
        deckInsertY,
      );

      deckStackElement
        .closest(".state.deck-pile-panel")
        ?.classList.add("state.deck-receiving");
      overlayElement.classList.add("pass-active");
    });
  });
}

function activateDraftPassAnimation() {
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const handCardsElement = document.querySelector(
        ".player-hand__cards.is-passing",
      ) as HTMLElement | null;
      const deckStackElement = document.querySelector(
        ".state.deck-card-stack",
      ) as HTMLElement | null;

      if (!handCardsElement || !deckStackElement) return;

      const passingCards = Array.from(
        handCardsElement.querySelectorAll(
          ".draft-deal-slot:not(.daily-draft-card--selected)",
        ),
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
          sau khi gom, cụm bài vòng lên trên rồi mới rơi vào state.deck.
          Tính control points theo vị trí thật của state.deck để không bay vào khoảng trắng.
        */
        const arc1X = gatherX + (deckX - gatherX) * 0.34;
        const arc1Y = Math.min(gatherY, deckY) - 150 -
          Math.abs(stackOffset) * 7;
        const arc2X = gatherX + (deckX - gatherX) * 0.72;
        const arc2Y = Math.min(gatherY, deckY) - 185 -
          Math.abs(stackOffset) * 5;

        card.style.setProperty("--gather-x", `${gatherX}px`);
        card.style.setProperty("--gather-y", `${gatherY}px`);
        card.style.setProperty("--gather-r", `${stackOffset * 4}deg`);

        card.style.setProperty("--arc1-x", `${arc1X}px`);
        card.style.setProperty("--arc1-y", `${arc1Y}px`);
        card.style.setProperty("--arc2-x", `${arc2X}px`);
        card.style.setProperty("--arc2-y", `${arc2Y}px`);

        card.style.setProperty("--state.deck-in-x", `${deckX}px`);
        card.style.setProperty("--state.deck-in-y", `${deckY}px`);
        card.style.setProperty("--state.deck-r", `${-6 + stackOffset * 3}deg`);
      });

      deckStackElement
        .closest(".state.deck-pile-panel")
        ?.classList.add("state.deck-receiving");
      handCardsElement.classList.add("pass-active");
    });
  });
}

function activateDraftCenterReturnAnimation() {
  playGameSound("returnDeck");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const overlayElement = document.querySelector(
        ".draft-center-overlay--returning",
      ) as HTMLElement | null;
      const deckStackElement = document.querySelector(
        ".state.deck-card-stack",
      ) as HTMLElement | null;

      if (!overlayElement || !deckStackElement) return;

      const returnCards = Array.from(
        overlayElement.querySelectorAll(".draft-center-card-wrapper--return"),
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
        deckInsertY,
      );

      deckStackElement
        .closest(".state.deck-pile-panel")
        ?.classList.add("state.deck-receiving");
      overlayElement.classList.add("pass-active");
    });
  });
}

function finishDraftDealWithoutFullRerender() {
  state.isInitialDealInProgress = false;
  state.dailyDealTimerId = null;
  clearDraftCenterDealAnimation();
  state.draftDealVisualEndsAt = 0;

  const handElement = document.querySelector(".player-hand");
  handElement?.classList.remove(
    "player-hand--dealing",
    "is-dealing",
    "deal-active",
  );

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
  state.isInitialDealInProgress = false;
  state.onlineDraftAnimationTimerId = null;
  clearDraftCenterDealAnimation();
  state.draftDealVisualEndsAt = 0;

  const handElement = document.querySelector(".player-hand");
  handElement?.classList.remove(
    "player-hand--dealing",
    "is-dealing",
    "deal-active",
  );

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
    state.playerHand = [...onlineHand];
  }

  state.isDraftPhase = false;
  state.isSimulationMode = false;
  state.isPassingDraftCards = false;
  state.isInitialDealInProgress = true;
  state.hasPlayedOnlinePlanningDealAfterDraft = true;

  playGameSound("deal");
  rerenderGameShell();

  /*
    Tránh giật:
    Sau khi render hand planning để chạy animation, khóa render signature ngay.
    Nếu không, socket update planning kế tiếp có thể rerender lại giữa animation,
    nhìn như card bị snap/giật.
  */
  state.lastOnlineRenderSignature = getOnlineRenderSignature();

  window.requestAnimationFrame(() => {
    const handElement = document.querySelector(
      ".player-hand:not(.player-hand--draft)",
    ) as HTMLElement | null;
    handElement?.classList.add("planning-deal-active");
  });

  window.setTimeout(() => {
    state.isInitialDealInProgress = false;

    const handElement = document.querySelector(".player-hand");
    handElement?.classList.remove(
      "player-hand--dealing",
      "is-dealing",
      "deal-active",
      "planning-deal-active",
    );

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
  state.isInitialDealInProgress = true;
  state.draftSelectedCardId = null;
  rerenderArena();
  const dealMs = getDraftCenterDealDurationForCurrentPool();
  startDraftCenterDealAnimation(dealMs);

  /*
    CSS draft deal: animation chạy trên từng wrapper theo số lá pool hiện tại.
    Không rerender toàn arena ở frame cuối; chỉ gỡ class để tránh snap/jank.
  */
  state.dailyDealTimerId = window.setTimeout(() => {
    finishDraftDealWithoutFullRerender();
  }, dealMs);
}

function finishDailyDealAndStartTimer() {
  clearDailyDealTimer();

  state.dailyDealTimerId = window.setTimeout(() => {
    state.isInitialDealInProgress = false;
    state.dailyDealTimerId = null;

    const handElement = document.querySelector(".player-hand");
    handElement?.classList.remove(
      "player-hand--dealing",
      "is-dealing",
      "deal-active",
    );

    const handMeta = handElement?.querySelector(".player-hand__meta");
    if (handMeta) {
      handMeta.textContent = "Giữ 0.5s để xem lớn";
    }

    startTurnTimer();

    if (!state.isDraftPhase && !state.isSimulationMode) {
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

  if (state.currentDayIndex >= PHASE_DAYS - 1) {
    if (!state.hasAppliedFinalCoinDebtPenalty && state.localCoinDebt > 0) {
      state.accumulatedVP -= state.localCoinDebt * 10;
      state.hasAppliedFinalCoinDebtPenalty = true;
    }

    state.phaseNumber += 1;
    state.currentDayIndex = 0;
    state.playerBoards = {
      p1: createEmptyBoardSlots(),
      p2: createEmptyBoardSlots(),
      p3: createEmptyBoardSlots(),
      p4: createEmptyBoardSlots(),
    };
    state.botPlacedDays = {
      p1: new Set(),
      p2: new Set(),
      p3: new Set(),
      p4: new Set(),
    };
    state.deck = shuffleCards(initialDeck);
    state.discardedResourceBonus = {
      coin: 0,
      stamina: 0,
    };
    state.eventResourceModifier = {
      coin: 0,
      stamina: 0,
    };
    state.localCoinDebt = 0;
    state.hasAppliedFinalCoinDebtPenalty = false;
  } else {
    state.currentDayIndex += 1;
  }

  state.isSimulationMode = false;
  state.simulationResult = null;
  state.simulationReplayIndex = 0;
  state.isReplayComplete = false;
  state.hasAppliedSimulationScore = false;
  state.remainingTurnSeconds = TURN_DURATION_SECONDS;

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.lastPlacedBoardPosition = null;
  state.suppressNextClick = false;
}

function applyDailyScoreOnce() {
  if (!state.simulationResult || state.hasAppliedSimulationScore) return;

  const eventModifier = getSimulationEventResourceModifier(
    state.simulationResult,
  );

  /*
    Event giờ ảnh hưởng thật:
    - VP: cộng/trừ thông qua state.simulationResult.finalVP.
    - Thể lực: eventStaminaDelta âm sẽ trừ vào tài nguyên còn lại của phase.
  */
  // finalVP có thể âm. Dùng += để âm sẽ trừ trực tiếp khỏi tổng phase.
  state.accumulatedVP += state.simulationResult.finalVP;
  state.eventResourceModifier = {
    coin: state.eventResourceModifier.coin + eventModifier.coin,
    stamina: state.eventResourceModifier.stamina + eventModifier.stamina,
  };
  state.hasAppliedSimulationScore = true;
}

function runSystemSimulation() {
  clearHoldTimer();
  clearCustomHandDragVisuals();
  stopBotPlacementTimer();

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = false;

  state.simulationResult = calculateSimulationResult();
  state.simulationReplayIndex = 0;
  state.isReplayComplete = false;
  state.isSimulationMode = true;

  playSimulationScanSoundForCurrentStep();

  stopTurnTimer();
  stopSimulationReplayTimer();

  state.simulationReplayTimerId = window.setInterval(() => {
    if (!state.simulationResult) return;

    if (
      state.simulationReplayIndex >=
        state.simulationResult.replaySteps.length - 1
    ) {
      state.simulationReplayIndex = state.simulationResult.replaySteps.length -
        1;
      state.isReplayComplete = true;
      applyDailyScoreOnce();
      stopSimulationReplayTimer();
      rerenderArena();

      clearDayAdvanceTimer();
      state.dayAdvanceTimerId = window.setTimeout(() => {
        startNextDayOrPhase();
      }, 1800);

      return;
    }

    state.simulationReplayIndex += 1;
    playSimulationScanSoundForCurrentStep();
    rerenderArena();
  }, 850);

  rerenderArena();
}

function runOnlineSimulationReplay() {
  clearHoldTimer();
  clearCustomHandDragVisuals();
  stopBotPlacementTimer();
  stopTurnTimer();
  stopSimulationReplayTimer();

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = false;

  state.simulationResult = calculateSimulationResult();
  state.simulationReplayIndex = 0;
  state.isReplayComplete = false;
  state.isSimulationMode = true;
  state.hasStartedOnlineSimulationReplay = true;

  playSimulationScanSoundForCurrentStep();

  state.simulationReplayTimerId = window.setInterval(() => {
    if (!state.simulationResult) return;

    if (
      state.simulationReplayIndex >=
        state.simulationResult.replaySteps.length - 1
    ) {
      state.simulationReplayIndex = state.simulationResult.replaySteps.length -
        1;
      state.isReplayComplete = true;

      /*
        Online: điểm do server cộng khi phase chuyển từ simulation sang result.
        Client chỉ replay animation, không tự cộng điểm để tránh lệch giữa các máy.
      */
      stopSimulationReplayTimer();
      rerenderGameShell();
      return;
    }

    state.simulationReplayIndex += 1;
    playSimulationScanSoundForCurrentStep();
    rerenderGameShell();
  }, 850);

  rerenderGameShell();
}

function resetTurnForPrototype() {
  stopBotPlacementTimer();
  state.isSimulationMode = false;
  state.simulationResult = null;
  state.simulationReplayIndex = 0;
  state.isReplayComplete = false;
  state.hasAppliedSimulationScore = false;
  state.remainingTurnSeconds = TURN_DURATION_SECONDS;

  clearDayAdvanceTimer();
  clearDailyDealTimer();
  state.isInitialDealInProgress = false;
  stopSimulationReplayTimer();

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = false;

  rerenderArena();
  startTurnTimer();
}

import {
  buildTravelCertificateHtml,
  buildTravelTimelineExport,
  copyTravelTimelineToClipboard,
  createCertificatePhaseSnapshot,
  downloadTextFile,
  downloadTravelCertificateHtml,
  downloadTravelTimeline,
  formatTravelTimelineAsText,
  getCertificateExportData,
  getCertificateHistoryStorageKey,
  getExportFileSafeName,
  getPhaseStyleLabel,
  loadCertificateHistory,
  rememberCurrentCertificatePhase,
  saveCertificateHistory,
} from "./export/certificate.js";

function getReplayStepForBoardCell(rowIndex: number, colIndex: number) {
  if (!state.simulationResult) return null;

  const stepIndex = state.simulationResult.replaySteps.findIndex(
    (step) => step.rowIndex === rowIndex && step.dayIndex === colIndex,
  );

  if (stepIndex < 0 || stepIndex > state.simulationReplayIndex) {
    return null;
  }

  return state.simulationResult.replaySteps[stepIndex] ?? null;
}

function getBoardCellReplayClass(rowIndex: number, colIndex: number) {
  if (!state.simulationResult || colIndex !== state.currentDayIndex) return "";

  const currentStep = getCurrentReplayStep();
  const isCurrent = currentStep?.rowIndex === rowIndex &&
    currentStep?.dayIndex === colIndex;

  const stepIndex = state.simulationResult.replaySteps.findIndex(
    (step) => step.rowIndex === rowIndex && step.dayIndex === colIndex,
  );

  const step = stepIndex >= 0
    ? state.simulationResult.replaySteps[stepIndex]
    : null;
  const isProcessed = stepIndex >= 0 && stepIndex < state.simulationReplayIndex;
  const eventClass = step?.eventType && stepIndex <= state.simulationReplayIndex
    ? `board-cell--event-${step.eventType}`
    : "";

  if (isCurrent) return `board-cell--replay-current ${eventClass}`.trim();
  if (isProcessed) return `board-cell--replay-done ${eventClass}`.trim();
  return "board-cell--replay-pending";
}

function openDebtTokenModal() {
  if (getCurrentCoinDebtAmount() <= 0) return;

  state.isDebtTokenModalOpen = true;
  state.debtTokenModalNotice = "";
  rerenderGameShell();
}

function closeDebtTokenModal() {
  state.isDebtTokenModalOpen = false;
  state.debtTokenModalNotice = "";
  rerenderGameShell();
}

function payCurrentCoinDebt() {
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
  const payableAmount = Math.min(remaining.coin, state.localCoinDebt);

  if (payableAmount <= 0) {
    state.debtTokenModalNotice = "Bạn chưa có xu để trả nợ lúc này.";
    rerenderGameShell();
    return;
  }

  state.localCoinDebt = Math.max(0, state.localCoinDebt - payableAmount);
  state.eventResourceModifier = {
    ...state.eventResourceModifier,
    coin: state.eventResourceModifier.coin - payableAmount,
  };

  state.debtTokenModalNotice = state.localCoinDebt > 0
    ? `Đã trả ${payableAmount} xu. Hiện còn nợ ${state.localCoinDebt} xu.`
    : `Đã trả hết nợ (${payableAmount} xu).`;

  playGameSound("eventPromo");

  if (state.localCoinDebt <= 0) {
    closeDebtTokenModal();
    return;
  }

  rerenderGameShell();
}

function renderDebtTokenModal() {
  if (!state.isDebtTokenModalOpen) return "";

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
    state.debtTokenModalNotice
      ? `<div class="effect-token-modal__notice">${state.debtTokenModalNotice}</div>`
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
            class="effect-token-modal__primary ${
    remainingCoin <= 0 ? "is-disabled" : ""
  }"
            onclick="event.stopPropagation(); window.payCoinDebtFromModal()"
          >
            Trả nợ
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderMainArena() {
  const focusedCard = getHandCardById(state.focusedHandCardId) ??
    state.focusedBoardCard;

  return `
    <main class="arena ${isOnlineGameOver() ? "arena--gameover" : ""} ${
    state.isSimulationMode ? "arena--scanning" : ""
  }">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${getDisplayPlayerName()}</h1>
          </div>
        </div>

        ${
    renderScoreBreakdownPanel({
      draftTimerDanger: state.isDraftPhase ? isDraftTimerDanger() : false,
      draftTimerDisplayLabel: state.isDraftPhase
        ? getDraftTimerDisplayLabel()
        : "",
    })
  }
      </div>


      ${renderResourceOrbs()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${
    days
      .map(
        (day, dayIndex) =>
          `<div class="day-pill ${
            dayIndex === state.currentDayIndex ? "day-pill--current" : ""
          } ${
            dayIndex < state.currentDayIndex ? "day-pill--done" : ""
          }">NGÀY ${day}</div>`,
      )
      .join("")
  }
          </div>

          <section class="board-grid">
            ${
    rows
      .map((row, rowIndex) => {
        return `
                  <div class="time-label">${row}</div>

                  ${
          days
            .map((_, colIndex) => {
              const card = getBoardCardByPosition(rowIndex, colIndex);
              const isCurrentDayColumn = colIndex === state.currentDayIndex;
              const isPlaceable = !state.isDraftPhase &&
                !state.isSimulationMode &&
                !state.isInitialDealInProgress &&
                isCurrentDayColumn &&
                state.selectedHandCardId !== null &&
                card === null;

              if (!card) {
                return `
                          <div
                            class="board-cell board-cell--empty ${
                  getBoardCellReplayClass(
                    rowIndex,
                    colIndex,
                  )
                } ${state.isSimulationMode ? "board-cell--locked-mode" : ""} ${
                  !isCurrentDayColumn && !state.isSimulationMode
                    ? "board-cell--not-current-day"
                    : ""
                } ${isPlaceable ? "board-cell--placeable" : ""}"
                            data-board-drop-cell="true"
                            data-row-index="${rowIndex}"
                            data-col-index="${colIndex}"
                            onclick="event.stopPropagation(); handleBoardCellClick(${rowIndex}, ${colIndex})"
                            title="${
                  isCurrentDayColumn
                    ? isPlaceable
                      ? "Thả lá đang kéo vào ô ngày hiện tại"
                      : "Chỉ xếp bài cho ngày hiện tại"
                    : "Không phải ngày hiện tại"
                }"
                          >
                            <span class="empty-plus">+</span>
                            ${renderUtilityEffectFlash(rowIndex, colIndex)}
                          </div>
                        `;
              }

              return `
                        <div
                          class="board-cell board-cell--occupied board-cell--clickable ${
                getBoardCellReplayClass(
                  rowIndex,
                  colIndex,
                )
              } ${
                isLastPlacedBoardCell(rowIndex, colIndex)
                  ? "board-cell--just-placed"
                  : ""
              }"
                          data-board-drop-cell="true"
                          data-row-index="${rowIndex}"
                          data-col-index="${colIndex}"
                          onclick="event.stopPropagation(); handleBoardCellClick(${rowIndex}, ${colIndex})"
                          title="Ô đã có bài - bấm để xem lớn"
                        >
                          ${
                renderBoardMiniCard(
                  card,
                  getReplayStepForBoardCell(rowIndex, colIndex),
                )
              }
                            ${renderUtilityEffectFlash(rowIndex, colIndex)}
                        </div>
                      `;
            })
            .join("")
        }
                `;
      })
      .join("")
  }
          </section>
          ${renderDraftCenterOverlay()}${renderDraftLeftoverReturnOverlay()}
        </div>

        ${
    isOnlineGameOver()
      ? renderFinalRankingPanel()
      : state.isDraftPhase
      ? ""
      : renderSimulationResultPanel()
  }

        ${
    state.isSimulationMode ? "" : `
              <section
          class="player-hand ${
      state.isDraftPhase ? "player-hand--draft" : ""
    } ${
      !state.isDraftPhase && state.isInitialDealInProgress
        ? "player-hand--dealing is-dealing"
        : ""
    }"
          onclick="${state.isDraftPhase ? "" : "clearSelectedHandCard()"}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${
      state.isDraftPhase ? "DRAFT" : "HAND"
    }</span>
              <h2>
                ${
      state.isDraftPhase
        ? `Chọn bài ngày ${days[state.currentDayIndex]}`
        : `Bài ngày ${days[state.currentDayIndex]}`
    }
              </h2>
            </div>

            <div class="player-hand__meta ${
      state.isDraftPhase && isDraftTimerDanger()
        ? "player-hand__meta--danger"
        : ""
    }">
              ${
      state.isDraftPhase
        ? isDraftPickTimerFrozen()
          ? "Đang chia bài..."
          : `Còn ${state.draftPickSecondsLeft}s • ${
            state.isPassingDraftCards
              ? "Đang chuyền bài..."
              : "bấm 1 lá để chọn"
          }`
        : state.isInitialDealInProgress
        ? "Đang chia bài..."
        : "Giữ 0.5s để xem lớn"
    }
            </div>
          </div>

          ${state.isDraftPhase ? renderDraftHandTopMeta() : ""}

          <div class="player-hand__cards ${
      state.isDraftPhase
        ? `player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${getDraftHandDisplayCount()}`
        : ""
    }">
            ${
      state.isDraftPhase ? renderPickedDraftCards() : state.playerHand
        .map((card, index) => renderHandCard(card, index))
        .join("")
    }
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
  if (state.holdTimer !== null) {
    window.clearTimeout(state.holdTimer);
    state.holdTimer = null;
  }
}

function spawnFloatingText(
  selector: string,
  delta: number,
  type: "coin" | "stamina",
) {
  const container = document.querySelector(selector);
  if (!container) return;
  const textNode = document.createElement("div");
  textNode.className = `floating-text floating-text--${type}`;
  textNode.textContent = `${delta > 0 ? "+" : ""}${delta}`;
  container.appendChild(textNode);
  container.classList.remove("resource-pulse");
  void container.clientWidth; // force reflow
  container.classList.add("resource-pulse");
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
    if (
      state.lastAnimatedCoin !== -1 &&
      remaining.coin !== state.lastAnimatedCoin
    ) {
      spawnFloatingText(
        ".resource-orb--coin .resource-orb__frame",
        remaining.coin - state.lastAnimatedCoin,
        "coin",
      );
    }
    if (
      state.lastAnimatedStamina !== -1 &&
      remaining.stamina !== state.lastAnimatedStamina
    ) {
      spawnFloatingText(
        ".resource-orb--stamina .resource-orb__frame",
        remaining.stamina - state.lastAnimatedStamina,
        "stamina",
      );
    }
    state.lastAnimatedCoin = remaining.coin;
    state.lastAnimatedStamina = remaining.stamina;
  });
}

function placeHandCardOnBoard(
  cardId: string,
  rowIndex: number,
  colIndex: number,
) {
  if (state.isSimulationMode || state.isInitialDealInProgress) return;
  if (colIndex !== state.currentDayIndex) return;
  if (!canPlaceOnBoardCell(rowIndex, colIndex)) return;

  const handIndex = state.playerHand.findIndex((card) => card.id === cardId);
  if (handIndex === -1) return;

  const selectedCard = state.playerHand[handIndex];

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

    state.selectedHandCardId = null;
    state.draggedHandCardId = null;
    state.focusedHandCardId = null;
    state.focusedBoardCard = null;
    state.focusedBoardPosition = null;
    state.suppressNextClick = false;

    if (onlineUtilityEffect) {
      rerenderArena();
    }

    return;
  }

  const remainingBeforePlace = getRemainingResources();
  const coinDebt = Math.max(0, selectedCard.coin - remainingBeforePlace.coin);
  const staminaDebt = Math.max(
    0,
    selectedCard.stamina - remainingBeforePlace.stamina,
  );

  playGameSound("cardPlace");

  state.playerHand.splice(handIndex, 1);

  const didApplyUtilityEffect = applyUtilityPlacementEffect(
    selectedCard,
    rowIndex,
    colIndex,
  );

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

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = false;

  state.lastPlacedBoardPosition = { rowIndex, colIndex };

  rerenderArena();

  window.setTimeout(() => {
    if (
      state.lastPlacedBoardPosition?.rowIndex === rowIndex &&
      state.lastPlacedBoardPosition?.colIndex === colIndex
    ) {
      state.lastPlacedBoardPosition = null;
      rerenderArena();
    }
  }, 420);
}

function placeSelectedHandCard(rowIndex: number, colIndex: number) {
  if (!state.selectedHandCardId) return;

  placeHandCardOnBoard(state.selectedHandCardId, rowIndex, colIndex);
}

function returnFocusedBoardCardToHand() {
  if (state.isSimulationMode) return;
  if (!state.focusedBoardPosition) return;

  const { rowIndex, colIndex } = state.focusedBoardPosition;
  if (colIndex !== state.currentDayIndex) return;

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

    state.focusedHandCardId = null;
    state.focusedBoardCard = null;
    state.focusedBoardPosition = null;
    state.lastPlacedBoardPosition = null;
    state.selectedHandCardId = null;
    state.suppressNextClick = false;

    return;
  }

  getBoardSlots()[rowIndex][colIndex] = null;
  clearLocalGeneratedTokenForReturnedCard(rowIndex, colIndex, card);

  /*
    Hand UI hiện được thiết kế đẹp nhất cho 5 lá.
    Khi đặt bài xuống board, game đã tự rút thêm 1 lá từ state.deck để bù hand.
    Vì vậy nếu rút lá từ board về tay mà chỉ push(card), hand sẽ thành 6 lá
    và fan-layout bị tràn/cứng như ảnh bạn gửi.

    Cách xử lý prototype:
    - Rút lá board về tay.
    - Nếu hand đang đủ 5 lá, trả lá cuối cùng của hand về đầu state.deck.
    - Hand luôn giữ tối đa 5 lá, layout không bị vỡ.
  */
  state.playerHand.unshift(card);

  while (state.playerHand.length > HAND_SIZE) {
    const overflowCard = state.playerHand.pop();

    if (overflowCard) {
      state.deck.unshift(overflowCard);
    }
  }

  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.lastPlacedBoardPosition = null;
  state.selectedHandCardId = null;
  state.suppressNextClick = false;

  rerenderArena();
}

function beginHandCardVisualDrag(event: PointerEvent) {
  if (!state.handPointerDragState || state.handPointerDragState.isDragging) {
    return;
  }

  clearHoldTimer();
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = false;

  const { source } = state.handPointerDragState;
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

  state.handPointerDragState.clone = clone;
  state.handPointerDragState.offsetX = event.clientX - rect.left;
  state.handPointerDragState.offsetY = event.clientY - rect.top;
  state.handPointerDragState.isDragging = true;
  state.didMoveHandPointerDrag = true;

  state.draggedHandCardId = state.handPointerDragState.id;
  state.selectedHandCardId = state.handPointerDragState.id;

  updateHandCardDragPosition(event);
}

function updateHandCardDragPosition(event: PointerEvent) {
  if (!state.handPointerDragState?.clone) return;

  state.handPointerDragState.clone.style.left = `${
    event.clientX - state.handPointerDragState.offsetX
  }px`;
  state.handPointerDragState.clone.style.top = `${
    event.clientY - state.handPointerDragState.offsetY
  }px`;
}

function getDropCellFromPointer(event: PointerEvent) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  return element?.closest(
    "[data-board-drop-cell='true']",
  ) as HTMLElement | null;
}

function getDeckDiscardTargetFromPointer(event: PointerEvent) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  return element?.closest(
    "[data-discard-drop-zone='true']",
  ) as HTMLElement | null;
}

function clearDeckDiscardHoverClass() {
  document
    .querySelectorAll(".state.deck-pile-panel--discard-hover")
    .forEach((element) => {
      element.classList.remove("state.deck-pile-panel--discard-hover");
      delete (element as HTMLElement).dataset.discardCoin;
      delete (element as HTMLElement).dataset.discardStamina;
    });
}

function canDiscardHandCard() {
  return (
    !state.isDraftPhase &&
    !state.isSimulationMode &&
    !state.isInitialDealInProgress
  );
}

function discardHandCardToDeck(cardId: string) {
  if (!canDiscardHandCard()) return;

  const handIndex = state.playerHand.findIndex((card) => card.id === cardId);
  if (handIndex === -1) return;

  const selectedCard = state.playerHand[handIndex];

  playGameSound("returnDeck");

  if (isOnlineRoomActive()) {
    const roomState = onlineClientState.roomState;
    const selfPlayerId = onlineClientState.playerId;

    /*
      Optimistic update để UI đổi ngay:
      - remove lá khỏi hand
      - cộng coin/stamina trên public player
      Server vẫn là nguồn chính, room:roomState gửi về sẽ xác nhận lại.
    */
    if (roomState && selfPlayerId) {
      const onlineHandIndex = roomState.self.hand.findIndex(
        (card) => card.id === selectedCard.id,
      );

      if (onlineHandIndex >= 0) {
        roomState.self.hand.splice(onlineHandIndex, 1);
      }

      const publicSelf = roomState.players[selfPlayerId];

      if (publicSelf) {
        publicSelf.coin += selectedCard.coin;
        publicSelf.stamina += selectedCard.stamina;
      }

      state.playerHand = [...(roomState.self.hand as TravelCardData[])];
    }

    sendDiscardCard({
      cardId: selectedCard.id,
      coin: selectedCard.coin,
      stamina: selectedCard.stamina,
      name: selectedCard.name,
    });

    state.selectedHandCardId = null;
    state.draggedHandCardId = null;
    state.focusedHandCardId = null;
    state.focusedBoardCard = null;
    state.focusedBoardPosition = null;
    state.suppressNextClick = false;

    rerenderGameShell();
    return;
  }

  state.playerHand.splice(handIndex, 1);

  state.discardedResourceBonus = {
    coin: state.discardedResourceBonus.coin + selectedCard.coin,
    stamina: state.discardedResourceBonus.stamina + selectedCard.stamina,
  };

  state.selectedHandCardId = null;
  state.draggedHandCardId = null;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = false;

  rerenderArena();
}

function clearCustomHandDragVisuals() {
  clearBoardDragHoverClass();
  clearDeckDiscardHoverClass();

  if (state.handPointerDragState?.source) {
    state.handPointerDragState.source.classList.remove(
      "hand-card--drag-source-hidden",
    );
  }

  state.handPointerDragState?.clone?.remove();
  state.handPointerDragState = null;
  state.draggedHandCardId = null;

  // Valid Slot Highlight Remove
  document
    .querySelectorAll(".board-cell--placeable")
    .forEach((el) => el.classList.remove("board-cell--placeable"));
}

function handleHandPointerMove(event: PointerEvent) {
  if (!state.handPointerDragState) return;

  const distanceX = event.clientX - state.handPointerDragState.startX;
  const distanceY = event.clientY - state.handPointerDragState.startY;
  const distance = Math.hypot(distanceX, distanceY);

  if (!state.handPointerDragState.isDragging && distance >= 8) {
    clearHoldTimer();
    beginHandCardVisualDrag(event);
  }

  if (!state.handPointerDragState?.isDragging) return;

  event.preventDefault();
  updateHandCardDragPosition(event);

  clearBoardDragHoverClass();
  clearDeckDiscardHoverClass();

  const discardTarget = getDeckDiscardTargetFromPointer(event);

  if (discardTarget && canDiscardHandCard()) {
    const draggedDiscardCard = getHandCardById(state.draggedHandCardId);

    discardTarget.classList.add("state.deck-pile-panel--discard-hover");
    discardTarget.dataset.discardCoin = String(draggedDiscardCard?.coin ?? 0);
    discardTarget.dataset.discardStamina = String(
      draggedDiscardCard?.stamina ?? 0,
    );
    return;
  }

  const dropCell = getDropCellFromPointer(event);

  if (!dropCell) return;

  const rowIndex = Number(dropCell.dataset.rowIndex);
  const colIndex = Number(dropCell.dataset.colIndex);

  const draggedCard = getHandCardById(state.draggedHandCardId);

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

  const dragState = state.handPointerDragState;
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

    state.suppressNextClick = true;

    window.setTimeout(() => {
      state.suppressNextClick = false;
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

    state.selectedHandCardId = null;
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

  state.selectedHandCardId = null;
  state.suppressNextClick = false;

  rerenderArena();
}

function triggerResourceRejectedFeedback(rowIndex?: number, colIndex?: number) {
  playGameSound("reject");

  const target = rowIndex !== undefined && colIndex !== undefined
    ? document.querySelector(
      `[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`,
    )
    : document.querySelector(".arena");

  target?.classList.add("resource-rejected-feedback");

  window.setTimeout(() => {
    target?.classList.remove("resource-rejected-feedback");
  }, 380);
}

function getDraggedCardIdFromEvent(event: DragEvent) {
  const fromDataTransfer = event.dataTransfer?.getData("text/plain");

  return fromDataTransfer || state.draggedHandCardId;
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
  clearHoldTimer();

  /*
    Không rerender ở dragstart.
    Nếu rerender tại đây, DOM của lá đang bị kéo sẽ bị thay mới ngay lập tức,
    khiến trình duyệt hủy thao tác drag nên bạn sẽ thấy "không kéo được".
  */
  state.draggedHandCardId = id;
  state.selectedHandCardId = id;
  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.suppressNextClick = true;

  event.dataTransfer?.setData("text/plain", id);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

(window as any).endDragHandCard = () => {
  clearHoldTimer();
  clearBoardDragHoverClass();

  state.draggedHandCardId = null;

  window.setTimeout(() => {
    state.suppressNextClick = false;
  }, 0);
};

(window as any).handleBoardCellDragOver = (
  event: DragEvent,
  rowIndex: number,
  colIndex: number,
) => {
  if (!state.draggedHandCardId) return;
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

(window as any).dropHandCardOnBoard = (
  event: DragEvent,
  rowIndex: number,
  colIndex: number,
) => {
  clearHoldTimer();
  clearBoardDragHoverClass();

  const cardId = getDraggedCardIdFromEvent(event);

  state.draggedHandCardId = null;

  if (!cardId) return;

  const card = getHandCardById(cardId);

  if (!canPlaceOnBoardCell(rowIndex, colIndex) || !card) {
    triggerResourceRejectedFeedback(rowIndex, colIndex);
    return;
  }

  placeHandCardOnBoard(cardId, rowIndex, colIndex);
};

(window as any).startHandPointerDrag = (event: PointerEvent, id: string) => {
  if (state.isInitialDealInProgress) return;

  if (state.isSimulationMode) return;
  if (event.button !== 0) return;

  state.didMoveHandPointerDrag = false;
  state.lastPointerDownCardId = id;

  const card = getHandCardById(id);

  /*
    Không chặn card thiếu tài nguyên nữa.
    Thiếu xu/thể lực vẫn được chọn/kéo để tạo cơ chế Nợ / Kiệt sức.
  */
  if (!card) return;

  clearCustomHandDragVisuals();

  const source = event.currentTarget as HTMLElement | null;
  if (!source) return;

  state.handPointerDragState = {
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
  document.querySelectorAll(".board-cell").forEach((el) => {
    const r = parseInt(el.getAttribute("data-row-index") || "-1");
    const c = parseInt(el.getAttribute("data-col-index") || "-1");
    if (r >= 0 && c >= 0 && canPlaceOnBoardCell(r, c)) {
      el.classList.add("board-cell--placeable");
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
  if (state.isPassingDraftCards || state.isInitialDealInProgress) return;

  clearHoldTimer();

  state.holdTimer = window.setTimeout(() => {
    state.focusedHandCardId = id;
    state.focusedBoardCard = null;
    state.focusedBoardPosition = null;
    state.suppressNextClick = true;
    clearHoldTimer();
    rerenderArena();
  }, 500);
};

(window as any).cancelHoldHandCard = () => {
  clearHoldTimer();
};

(window as any).clearSelectedHandCard = () => {
  clearHoldTimer();

  if (state.selectedHandCardId === null) return;

  state.selectedHandCardId = null;
  rerenderArena();
};

(window as any).handleBoardCellClick = (rowIndex: number, colIndex: number) => {
  clearHoldTimer();

  const card = getBoardCardByPosition(rowIndex, colIndex);

  if (card) {
    if (isBoardDebtToken(card)) {
      if (
        !state.isDraftPhase &&
        !state.isInitialDealInProgress &&
        colIndex === state.currentDayIndex &&
        state.selectedHandCardId
      ) {
        placeSelectedHandCard(rowIndex, colIndex);
        return;
      }

      payDebtToken(rowIndex, colIndex, card);
      return;
    }

    clearCustomHandDragVisuals();
    state.focusedHandCardId = null;
    state.focusedBoardCard = card;
    state.focusedBoardPosition = { rowIndex, colIndex };
    state.selectedHandCardId = null;
    state.suppressNextClick = false;
    rerenderArena();
    return;
  }

  if (
    !state.isDraftPhase &&
    !state.isInitialDealInProgress &&
    colIndex === state.currentDayIndex
  ) {
    placeSelectedHandCard(rowIndex, colIndex);
  }
};

(window as any).focusBoardCard = (rowIndex: number, colIndex: number) => {
  const card = getBoardCardByPosition(rowIndex, colIndex);
  if (!card) return;

  state.focusedHandCardId = null;
  state.focusedBoardCard = card;
  state.focusedBoardPosition = { rowIndex, colIndex };
  state.selectedHandCardId = null;
  state.suppressNextClick = false;

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

  state.focusedHandCardId = null;
  state.focusedBoardCard = null;
  state.focusedBoardPosition = null;
  state.draggedHandCardId = null;
  state.suppressNextClick = false;

  rerenderArena();
};
// Moved to ui/sidePlayerBoards.ts
// Background smoke video reference (shared between gotoMapSelection and rerenderGameShell)

function transitionToScreen(newScreen: AppScreen) {
  if (newScreen !== "dashboard") {
    stopOutsideBackgroundMedia();
  }

  if (!(document as any).startViewTransition) {
    state.currentAppScreen = newScreen;
    rerenderGameShell();
    return;
  }
  (document as any).startViewTransition(() => {
    state.currentAppScreen = newScreen;
    rerenderGameShell();
  });
}

(window as any).gotoMapSelection = () => {
  if (state.isTransitioning) return;
  if (!authClientState.user) {
    (window as any).focusHubAuthPanel();
    setAuthStatus("Đăng nhập hoặc đăng ký để bắt đầu hành trình.");
    return;
  }
  state.isTransitioning = true;

  // 1. Create overlay video — plays from beginning (smoke effect)
  const vid = document.createElement("video");
  vid.src = "./assets/chuyencanh.mp4";
  vid.muted = true;
  vid.playsInline = true;
  vid.style.cssText = [
    "position:fixed",
    "inset:0",
    "width:100%",
    "height:100%",
    "object-fit:cover",
    "z-index:9999",
    "pointer-events:auto",
    "opacity:0",
    "transition:opacity 0.4s ease",
  ].join(";");
  document.body.appendChild(vid);

  // Fade in the video overlay
  vid.playbackRate = 1.75;
  void vid.play().catch(() => {
    vid.muted = true;
    vid.playbackRate = 1.75;
    void vid.play();
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      vid.style.opacity = "1";
    });
  });

  let transitioned = false;

  vid.addEventListener("timeupdate", () => {
    // 2. When smoke covers screen (~3.5s), swap to map selection
    if (!transitioned && vid.currentTime >= 3.5) {
      transitioned = true;
      state.isTransitioning = false;
      state.bgSmokeVideo = vid;

      // Remove from body — rerenderGameShell will re-insert it into the screen
      document.body.removeChild(vid);
      vid.style.cssText = [
        "position:absolute",
        "inset:0",
        "width:100%",
        "height:100%",
        "object-fit:cover",
        "z-index:0",
        "pointer-events:none",
        "opacity:1",
      ].join(";");

      state.currentAppScreen = "map_selection";
      rerenderGameShell();

      // 3. Animate map card columns in — staggered slide from right
      requestAnimationFrame(() => {
        const cols = document.querySelectorAll(".map-card-col");
        cols.forEach((el, i) => {
          setTimeout(
            () => el.classList.add("map-card-col--slide-in"),
            200 + i * 140,
          );
        });
      });
    }

    // 4. Loop from second 5 to avoid smoke replaying
    if (vid.duration && vid.currentTime >= vid.duration - 0.5) {
      vid.currentTime = 5;
    }
  });
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
  if (state.bgSmokeVideo) {
    state.bgSmokeVideo.pause();
    state.bgSmokeVideo.remove();
    state.bgSmokeVideo = null;
  }
  transitionToScreen("dashboard");
};

(window as any).switchHubAuthTab = (tab: "login" | "register") => {
  document.querySelectorAll("[data-hub-auth-tab]").forEach((element) => {
    element.classList.toggle(
      "is-active",
      (element as HTMLElement).dataset.hubAuthTab === tab,
    );
  });

  document.querySelectorAll("[data-hub-auth-panel]").forEach((element) => {
    element.classList.toggle(
      "is-active",
      (element as HTMLElement).dataset.hubAuthPanel === tab,
    );
  });
};

(window as any).focusHubAuthPanel = () => {
  const authPanel = document.getElementById("hub-auth");

  if (!authPanel) {
    state.currentAppScreen = "dashboard";
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

  const firstInput = authPanel.querySelector(
    "input",
  ) as HTMLInputElement | null;
  firstInput?.focus();
};

(window as any).startOfflineGame = () => {
  alert("Chế độ chơi offline (Bot) đang được phát triển!");
};

function triggerCinematicLobbyToGameTransition() {
  console.log("TRIGGERING CINEMATIC TRANSITION!");
  state.isCinematicTransitioning = true;

  const blocker = document.createElement("div");
  blocker.id = "cinematic-blocker";
  blocker.style.cssText =
    "position:fixed;inset:0;z-index:99999999;cursor:wait;";
  blocker.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  blocker.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  blocker.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    { passive: false },
  );
  document.body.appendChild(blocker);

  const lobbyCard = document.querySelector(".online-lobby-card");
  if (lobbyCard) lobbyCard.classList.add("is-exiting");

  const video = document.getElementById(
    "cinematic-transition-video",
  ) as HTMLVideoElement | null;
  const overlay = document.getElementById(
    "white-flash-overlay",
  ) as HTMLElement | null;

  if (!video || !overlay) {
    console.warn("Missing video or overlay for cinematic transition.");
    state.isCinematicTransitioning = false;
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
      video.play().catch((err) => {
        console.error("Video play failed completely.", err);
      });
    });

    video.onpause = () => {
      if (state.isCinematicTransitioning) {
        console.warn("Video paused unexpectedly, resuming...");
        video.play().catch((err) => console.error(err));
      }
    };

    const finishTransition = () => {
      if (!state.isCinematicTransitioning) return;
      state.isCinematicTransitioning = false;

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
      if (state.isCinematicTransitioning) {
        console.warn("Cinematic transition video timeout fallback.");
        finishTransition();
      }
    }, 20000); // Increased to 20s to allow longer videos
  }, 400);
}

function renderWithGlobalOverlays(content: string) {
  return `${content}${renderOnboardingModal()}`;
}

function renderGameShell() {
  if (!authClientState.isReady) {
    return renderWithGlobalOverlays(renderDashboard(true));
  }

  if (!isOnlineRoomActive()) {
    if (!authClientState.user || state.currentAppScreen === "dashboard") {
      state.currentAppScreen = "dashboard";
      return renderWithGlobalOverlays(renderDashboard());
    }

    if (state.currentAppScreen === "map_selection") {
      return renderWithGlobalOverlays(renderMapSelectionScreen());
    }

    return renderWithGlobalOverlays(renderOnlineEntryScreen());
  }

  if (onlineClientState.roomState?.phase === "lobby") {
    return renderWithGlobalOverlays(
      renderOnlineLobbyRoomScreen(
        onlineClientState.roomState,
        getOnlineSelfPublicPlayer(),
        onlineClientState.playerId,
        canCurrentPlayerStartRoom(),
        playerIds,
      ),
    );
  }

  const leftPlayers = getLeftSidePlayersToRender();
  const rightPlayers = getRightSidePlayersToRender();

  return renderWithGlobalOverlays(`
    <div class="game-shell">
      ${renderSaigonCollageBackground()}
      ${
    renderOnlineRoomMenu({
      isRoomActive: isOnlineRoomActive(),
      roomId: onlineClientState.roomId,
      roomPhase: onlineClientState.roomState?.phase,
      renderInGameMusicControl,
    })
  }
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

function rerenderGameShell() {
  stopOutsideBackgroundMedia();

  syncOnboardingAutoOpen(authClientState.isReady);
  app.innerHTML = renderGameShell();
  applyLobbyBackground(
    app,
    isOnlineRoomActive(),
    onlineClientState.roomState?.phase,
  );
  setupSaigonCollageHover();
  syncInGameBackgroundMusic();
  initDashboardHub();

  // Re-insert background video into map selection screen if it exists
  if (state.currentAppScreen === "map_selection" && state.bgSmokeVideo) {
    const screen = document.querySelector(".map-selection-screen");
    if (screen && screen.firstChild) {
      screen.insertBefore(state.bgSmokeVideo, screen.firstChild);
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

const DRAFT_PICK_FLY_MS = 750;
const DRAFT_POOL_COLLAPSE_MS = 1350;
const DRAFT_HAND_PICK_SCALE = 0.84;

function restartDraftCenterDealVisuals(): boolean {
  const overlay = document.querySelector(
    ".draft-center-overlay",
  ) as HTMLElement | null;
  if (!overlay) return false;

  overlay.classList.remove("draft-center-overlay--dealing");

  const wrappers = overlay.querySelectorAll(".draft-center-card-wrapper");
  wrappers.forEach((node) => {
    const wrapper = node as HTMLElement;
    wrapper.classList.remove("draft-center-card-wrapper--flown-to-hand");
    wrapper.style.animation = "none";
  });

  void overlay.offsetWidth;

  wrappers.forEach((node) => {
    (node as HTMLElement).style.removeProperty("animation");
  });

  overlay.classList.add("draft-center-overlay--dealing");
  return true;
}

function clearDraftCenterDealAnimation() {
  state.draftCenterDealGeneration += 1;

  if (state.draftCenterDealEndTimerId !== null) {
    window.clearTimeout(state.draftCenterDealEndTimerId);
    state.draftCenterDealEndTimerId = null;
  }

  state.isDraftCenterDealing = false;
  document
    .querySelector(".draft-center-overlay")
    ?.classList.remove("draft-center-overlay--dealing");
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
  if (state.draftCenterDealEndTimerId !== null) {
    window.clearTimeout(state.draftCenterDealEndTimerId);
    state.draftCenterDealEndTimerId = null;
  }

  const generation = ++state.draftCenterDealGeneration;
  state.isDraftCenterDealing = true;
  state.draftDealVisualEndsAt = Date.now() + durationMs;
  playGameSound("deal");

  const activate = () => {
    if (generation !== state.draftCenterDealGeneration) return;
    restartDraftCenterDealVisuals();
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(activate);
  });

  state.draftCenterDealEndTimerId = window.setTimeout(() => {
    if (generation !== state.draftCenterDealGeneration) return;

    state.draftCenterDealEndTimerId = null;
    state.isDraftCenterDealing = false;
    document
      .querySelector(".draft-center-overlay")
      ?.classList.remove("draft-center-overlay--dealing");
  }, durationMs);
}

function clearOnlineDraftAnimationTimer() {
  if (state.onlineDraftAnimationTimerId !== null) {
    window.clearTimeout(state.onlineDraftAnimationTimerId);
    state.onlineDraftAnimationTimerId = null;
  }

  if (state.onlineFinalDraftReturnTimerId !== null) {
    window.clearTimeout(state.onlineFinalDraftReturnTimerId);
    state.onlineFinalDraftReturnTimerId = null;
  }

  clearDraftCenterDealAnimation();
}

function getOnlineRenderSignature() {
  const roomState = onlineClientState.roomState;

  if (!roomState) return "offline";

  const self = roomState.self;
  const playersSignature = playerIds
    .map((playerId) => {
      const player = roomState.players[playerId];
      const boardSignature = player.board
        .map((row) =>
          row
            .map((cell) => {
              if (!cell) return "-";

              return `${cell.cardId}:${cell.tag}:${cell.icon}:${cell.vp}`;
            })
            .join(",")
        )
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
    roomState.phase,
    state.phaseNumber ?? 1,
    roomState.dayIndex,
    state.draftRound,
    roomState.timer,
    self.draftPool.map((card) => card.id).join(","),
    self.pickedDraftCards.map((card) => card.id).join(","),
    self.hand.map((card) => card.id).join(","),
    playersSignature,
  ].join("##");
}

function updateOnlineTimerOnly() {
  const roomState = onlineClientState.roomState;
  const timerElement = document.querySelector(
    ".score-breakdown__timer",
  ) as HTMLElement | null;
  const timerValueElement = timerElement?.querySelector(
    "strong",
  ) as HTMLElement | null;

  if (!roomState || !timerElement || !timerValueElement) return;

  if (roomState.phase === "draft") {
    timerValueElement.textContent = getDraftTimerDisplayLabel();
    timerElement.classList.toggle(
      "score-breakdown__timer--danger",
      !isDraftPickTimerFrozen() && state.draftPickSecondsLeft <= 3,
    );
    updateDraftTimerDisplayVisualOnly();
    updateDraftPoolToggleVisualOnly();
    return;
  }

  if (roomState.phase === "planning") {
    timerValueElement.textContent = formatTurnTimer(roomState.timer);
    timerElement.classList.toggle(
      "score-breakdown__timer--danger",
      roomState.timer <= 10,
    );
    updatePlanningConfirmButtonVisualOnly();
    return;
  }

  if (roomState.phase === "gameover") {
    timerValueElement.textContent = `${roomState.timer}s`;
    timerElement.classList.toggle(
      "score-breakdown__timer--danger",
      roomState.timer <= 3,
    );
  }
}

function renderAfterOnlineStateChange() {
  const nextSignature = getOnlineRenderSignature();
  const currentPhase = onlineClientState.roomState?.phase ?? null;

  if (nextSignature !== state.lastOnlineRenderSignature) {
    console.log(
      "Signature changed:",
      state.lastOnlineRenderSignature,
      "=>",
      nextSignature,
    );
    state.lastOnlineRenderSignature = nextSignature;

    if (state.lastOnlinePhase === "lobby" && currentPhase === "cinematic") {
      state.lastOnlinePhase = currentPhase;
      triggerCinematicLobbyToGameTransition();
      return;
    }

    state.lastOnlinePhase = currentPhase;

    const shouldDeferRerenderForActiveDeal =
      (isDraftDealVisualActive() || state.isDraftPickFlying) &&
      !state.shouldActivateOnlineDealAnimation &&
      !state.shouldActivateOnlinePassAnimation;

    const shouldDeferRerenderForDraftTransition = (state.isPassingDraftCards ||
      state.isInitialDealInProgress ||
      state.isDraftCenterDealing) &&
      !state.shouldActivateOnlinePassAnimation &&
      !state.shouldActivateOnlineDealAnimation;

    const passVisualRunning = isOnlineInterRoundPoolPassActive() &&
      document.querySelector(".draft-center-overlay--passing.pass-active");

    const poolCollapseVisualRunning = state.isDraftPoolCollapseAnimating &&
      document.querySelector(
        ".draft-center-overlay--collapsing.pass-active, .draft-center-overlay--expanding.pass-active",
      );

    if (!state.isCinematicTransitioning) {
      if (
        shouldDeferRerenderForActiveDeal ||
        shouldDeferRerenderForDraftTransition
      ) {
        updateDraftSelectedVisualOnly();
        updateDraftHandVisualOnly();
        updateDraftPoolFlownVisualOnly();
        updateOnlineTimerOnly();
        updateDraftConfirmButtonVisualOnly();
      } else if (
        (passVisualRunning || poolCollapseVisualRunning) &&
        !state.shouldActivateOnlinePassAnimation &&
        !state.shouldActivateOnlineDealAnimation
      ) {
        updateOnlineTimerOnly();
        updateDraftPoolToggleVisualOnly();
      } else {
        rerenderGameShell();
      }
    }

    if (state.shouldActivateOnlineDealAnimation) {
      state.shouldActivateOnlineDealAnimation = false;
      startDraftCenterDealAnimation(getDraftCenterDealDurationForCurrentPool());
    }

    if (state.shouldActivateOnlinePassAnimation) {
      state.shouldActivateOnlinePassAnimation = false;
      if (state.isOnlineFinalDraftReturnAnimating) {
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
state.lastOnlineRenderSignature = getOnlineRenderSignature();
state.lastOnlinePhase = onlineClientState.roomState?.phase ?? null;

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

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return;

      const draftCardElement = target.closest(
        "[data-draft-card-id]",
      ) as HTMLElement | null;
      const handCardElement = target.closest(
        "[data-hand-card-id]",
      ) as HTMLElement | null;

      let nextCardId: string | null = null;
      let nextMode: "draft" | "hand" | null = null;

      if (state.isDraftPhase && draftCardElement) {
        nextCardId = draftCardElement.dataset.draftCardId ?? null;
        nextMode = "draft";
      } else if (
        !state.isDraftPhase &&
        !state.isSimulationMode &&
        handCardElement
      ) {
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

      if (nextMode === "draft" && !state.isPassingDraftCards) {
        /*
        Online/offline draft chọn ngay từ pointerdown.
        Lượt 1 đang có deal animation nên browser click có thể bị mất;
        pointerdown ổn định hơn và vẫn giữ được hold preview.
      */
        skipNextDraftClick = true;
        selectDraftCard(nextCardId);
      }

      state.holdTimer = window.setTimeout(() => {
        if (!holdCardId) return;

        didOpenHoldPreview = true;
        state.focusedHandCardId = holdCardId;
        state.focusedBoardCard = null;
        state.focusedBoardPosition = null;
        state.suppressNextClick = true;
        rerenderGameShell();
      }, 500);
    },
    true,
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!holdCardId || state.holdTimer === null) return;

      const distance = Math.hypot(
        event.clientX - holdStartX,
        event.clientY - holdStartY,
      );

      if (distance > 8) {
        clearDelegatedHold();
      }
    },
    true,
  );

  document.addEventListener(
    "pointerup",
    (event) => {
      const cardId = holdCardId;
      const mode = holdMode;
      const openedPreview = didOpenHoldPreview;
      const distance = Math.hypot(
        event.clientX - holdStartX,
        event.clientY - holdStartY,
      );

      clearDelegatedHold();

      /*
      Draft đã chọn ở pointerdown để không bị mất click trong animation dealing.
      Pointerup chỉ dọn hold state, không select lần nữa để tránh toggle ngược.
    */
      if (
        mode === "draft" &&
        cardId &&
        !openedPreview &&
        distance <= 8 &&
        state.isDraftPhase
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  document.addEventListener(
    "pointercancel",
    () => {
      clearDelegatedHold();
    },
    true,
  );

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return;

      const draftCardElement = target.closest(
        "[data-draft-card-id]",
      ) as HTMLElement | null;

      if (draftCardElement && state.isDraftPhase) {
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

      const handCardElement = target.closest(
        "[data-hand-card-id]",
      ) as HTMLElement | null;

      if (handCardElement && !state.isDraftPhase) {
        event.preventDefault();
        event.stopPropagation();

        const cardId = handCardElement.dataset.handCardId;

        if (cardId) {
          selectHandCard(cardId);
        }
      }
    },
    true,
  );
}

setupCardClickDelegation();
setupAuthFormDelegation();
setupGameAudioDelegation();
setupInGameMusicDelegation();
initHelpBubbleDelegation();
initOnboardingModalDelegation();

initOnlineClient(
  () => {
    applyOnlineRoomStateToLocal();
    renderAfterOnlineStateChange();
  },
  () => {
    resetSelfPlanningConfirmLock();
    updatePlanningConfirmButtonVisualOnly();
  },
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
  statusElement.classList.toggle(
    "hub-auth__status--success",
    Boolean(message) && !isError,
  );
  statusElement.classList.toggle("auth-card__status--error", isError);
  statusElement.classList.toggle(
    "auth-card__status--success",
    Boolean(message) && !isError,
  );
}

function setupAuthFormDelegation() {
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target as HTMLFormElement | null;

      if (!form) return;

      if (form.id === "auth-login-form" || form.id === "hub-auth-login-form") {
        event.preventDefault();
        event.stopPropagation();
        (window as any).loginFromAuthScreen();
        return;
      }

      if (
        form.id === "auth-register-form" ||
        form.id === "hub-auth-register-form"
      ) {
        event.preventDefault();
        event.stopPropagation();
        (window as any).registerFromAuthScreen();
      }
    },
    true,
  );
}

(window as any).loginFromAuthScreen = async () => {
  const usernameInput = (document.querySelector(
    "#hub-auth-login-username",
  ) as HTMLInputElement | null) ??
    (document.querySelector("#auth-login-username") as HTMLInputElement | null);
  const passwordInput = (document.querySelector(
    "#hub-auth-login-password",
  ) as HTMLInputElement | null) ??
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
    const message = error instanceof Error
      ? error.message
      : "Đăng nhập thất bại.";
    setAuthStatus(message, true);
    alert(message);
  }
};

(window as any).registerFromAuthScreen = async () => {
  const displayNameInput = (document.querySelector(
    "#hub-auth-register-display-name",
  ) as HTMLInputElement | null) ??
    (document.querySelector(
      "#auth-register-display-name",
    ) as HTMLInputElement | null);
  const usernameInput = (document.querySelector(
    "#hub-auth-register-username",
  ) as HTMLInputElement | null) ??
    (document.querySelector(
      "#auth-register-username",
    ) as HTMLInputElement | null);
  const passwordInput = (document.querySelector(
    "#hub-auth-register-password",
  ) as HTMLInputElement | null) ??
    (document.querySelector(
      "#auth-register-password",
    ) as HTMLInputElement | null);

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
    const message = error instanceof Error
      ? error.message
      : "Đăng ký thất bại.";
    setAuthStatus(message, true);
    alert(message);
  }
};

(window as any).logoutFromAuthScreen = () => {
  logoutAccount();

  onlineClientState.roomId = null;
  onlineClientState.playerId = null;
  onlineClientState.roomState = null;
  state.currentAppScreen = "dashboard";

  rerenderGameShell();
};

(window as any).createRoomFromLobby = () => {
  stopOutsideBackgroundMedia();

  const input = document.querySelector(
    "#lobby-create-name",
  ) as HTMLInputElement | null;
  const playerName = input?.value.trim() ||
    authClientState.user?.displayName ||
    authClientState.user?.username ||
    "An";

  createOnlineRoom(playerName);
};

(window as any).joinRoomFromLobby = () => {
  stopOutsideBackgroundMedia();

  const nameInput = document.querySelector(
    "#lobby-join-name",
  ) as HTMLInputElement | null;
  const roomInput = document.querySelector(
    "#lobby-room-code",
  ) as HTMLInputElement | null;

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

  reconnectOnlineRoom(
    savedSession.roomId,
    savedSession.playerId,
    savedSession.playerName,
  );
};

(window as any).clearSavedRoomFromLobby = () => {
  clearSavedOnlineSession();
  rerenderGameShell();
};

(window as any).toggleReadyFromLobby = () => {
  const selfPlayer = getOnlineSelfPublicPlayer();

  if (
    !selfPlayer ||
    !onlineClientState.playerId ||
    !onlineClientState.roomState
  ) {
    return;
  }

  const nextReadyState = !selfPlayer.isReady;

  /*
    Cập nhật tạm local để bấm thấy đổi ngay.
    Server vẫn là nguồn chính; room:state gửi về sẽ xác nhận lại.
  */
  onlineClientState.roomState.players[onlineClientState.playerId].isReady =
    nextReadyState;
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
  state.isMidGameRankingOpen = true;
  rerenderGameShell();
};

(window as any).closeMidGameRanking = () => {
  state.isMidGameRankingOpen = false;
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
  const roomState = onlineClientState.roomState;

  if (!roomState) {
    console.log("No online room state.");
    return null;
  }

  const result: Record<
    string,
    {
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
    }
  > = {};

  for (const playerId of playerIds) {
    const player = roomState.players[playerId];
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
    })),
  );

  console.log(result);
  return result;
};

(window as any).onlineClientState = onlineClientState;

(window as any).debugOnlineScores = () => {
  const roomState = onlineClientState.roomState;

  if (!state) {
    console.log("No online room state.");
    return null;
  }

  const result = playerIds.map((playerId) => {
    const player = roomState!.players[playerId];

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
(globalThis as any).clearSelectedHandCard = (
  window as any
).clearSelectedHandCard;

(globalThis as any).loginFromAuthScreen = (window as any).loginFromAuthScreen;
(globalThis as any).registerFromAuthScreen = (
  window as any
).registerFromAuthScreen;
(globalThis as any).logoutFromAuthScreen = (window as any).logoutFromAuthScreen;
(globalThis as any).forceLogoutAuth = (window as any).logoutFromAuthScreen;

(globalThis as any).createRoomFromLobby = (window as any).createRoomFromLobby;
(globalThis as any).joinRoomFromLobby = (window as any).joinRoomFromLobby;
(globalThis as any).reconnectSavedRoomFromLobby = (
  window as any
).reconnectSavedRoomFromLobby;
(globalThis as any).clearSavedRoomFromLobby = (
  window as any
).clearSavedRoomFromLobby;
(globalThis as any).toggleReadyFromLobby = (window as any).toggleReadyFromLobby;
(globalThis as any).copyRoomCodeFromLobby = (
  window as any
).copyRoomCodeFromLobby;
(globalThis as any).leaveRoomFromLobby = (window as any).leaveRoomFromLobby;
(globalThis as any).onlineClientState = onlineClientState;
(globalThis as any).openMidGameRanking = (window as any).openMidGameRanking;
(globalThis as any).closeMidGameRanking = (window as any).closeMidGameRanking;
(globalThis as any).downloadTravelCertificateHtml = (
  window as any
).downloadTravelCertificateHtml;
(globalThis as any).toggleInGameBackgroundMusic = toggleInGameBackgroundMusic;
(globalThis as any).setInGameBackgroundMusicVolume =
  setInGameBackgroundMusicVolume;
(globalThis as any).downloadTravelTimelineTxt = (
  window as any
).downloadTravelTimelineTxt;
(globalThis as any).downloadTravelTimelineJson = (
  window as any
).downloadTravelTimelineJson;
(globalThis as any).copyTravelTimeline = (window as any).copyTravelTimeline;
(globalThis as any).playGameSound = playGameSound;
(globalThis as any).debugOnlineBoards = (window as any).debugOnlineBoards;
(globalThis as any).selectDraftCard = (window as any).selectDraftCard;

document.addEventListener(
  "visibilitychange",
  syncOnlineDraftDisplayAfterTabVisible,
);
window.addEventListener("focus", syncOnlineDraftDisplayAfterTabVisible);

rerenderGameShell();
