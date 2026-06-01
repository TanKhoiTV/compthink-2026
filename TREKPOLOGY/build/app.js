var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import { renderMapSelectionScreen } from "./ui/mapSelection.js";
import { cleanupDashboardHub, initDashboardHub, renderDashboard } from "./ui/dashboard.js";
import { authClientState, createOnlineRoom, initOnlineClient, clearSavedOnlineSession, getSavedOnlineSession, joinOnlineRoom, leaveOnlineRoom, loginAccount, logoutAccount, onlineClientState, reconnectOnlineRoom, registerAccount, selectOnlineDraftCard, confirmOnlineDraftPick, sendDiscardCard, sendPayDebt, sendPlaceCard, sendReturnBoardCard, setOnlineReady, startOnlineGame, } from "./online/socketClient.js";
import { phase1Cards } from "./data/cards.phase1.js";
import { mapGameCardToTravelCard } from "./data/cardMapper.js";
import { DRAFT_PICK_SECONDS, HAND_SIZE, PHASE_DAYS, PLAYER_COUNT, STARTING_COIN, STARTING_STAMINA, TURN_DURATION_SECONDS, days, rows, } from "./game/constants.js";
import { countCardsWithTag, createEmptyBoardSlots, getBoardCardByPosition as getBoardCardByPositionFromSlots, getCardTagKeys, getCurrentDayPlacedCards as getCurrentDayPlacedCardsFromSlots, getPlacedCards as getPlacedCardsFromSlots, } from "./game/board.js";
import { createDailyDraftPlayers as createDailyDraftPlayersFromDeck, getActiveDraftPlayerIndex, getCurrentDraftPlayer as getCurrentDraftPlayerFromList, pickRandomCard, rotateDraftPoolsClockwise as rotateDraftPoolsClockwiseList, } from "./game/draft.js";
import { buildSimulationReplaySteps as buildSimulationReplayStepsFromBoard, calculateScoreBreakdown as calculateScoreBreakdownFromCards, calculateSimulationResult as calculateSimulationResultFromBoard, } from "./game/scoring.js";
import { createInitialDeck as createInitialDeckFromCards, drawDailyHandFromDeck as drawDailyHandFromDeckFromState, returnUnplayedHandToDeck as returnUnplayedHandToDeckFromState, shuffleCards as shuffleCardsList, } from "./game/deck.js";
import { getCardAffordability as getCardAffordabilityFromResources, getCardAffordabilityMessage as getCardAffordabilityMessageFromResources, getRemainingResources as getRemainingResourcesFromTotals, } from "./game/resources.js";
const app = document.getElementById("app");
const DRAFT_STARTING_POOL_SIZE = 7;
const DRAFT_PICK_TARGET = HAND_SIZE;
import { playGameSound, setupGameAudioDelegation, } from "./audio/gameAudio.js";
const playersLeftBase = [
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
const playersRight = [
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
    coffee: "https://images.unsplash.com/photo-1517701550927-30cf4ba1f0d5?auto=format&fit=crop&w=1000&q=80",
    bridge: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    sea: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80",
    market: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1000&q=80",
    night: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80",
    temple: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80",
};
const fallbackHandCards = [
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
        description: "Một ly cà phê trứng béo mịn, rất hợp để mở đầu hành trình khám phá phố cổ Hà Nội.",
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
        description: "Băng qua cây cầu trên mây với khung cảnh ngoạn mục, một điểm đến có giá trị cao.",
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
        description: "Khám phá vịnh Hạ Long giữa những dãy núi đá vôi kỳ vĩ, điểm cao nhưng tốn tài nguyên.",
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
        description: "Một món ăn đường phố nổi tiếng, rẻ, dễ ghép combo với các điểm ẩm thực khác.",
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
        description: "Không khí nhộn nhịp về đêm, phù hợp nối chuỗi lịch trình tối và tạo điểm ổn định.",
        bonusText: "Nếu đi sau 1 lá buổi Tối: +6 VP",
    },
];
function normalizeCardImage(card) {
    if (card.image && card.image.trim().length > 0) {
        return card;
    }
    return Object.assign(Object.assign({}, card), { image: images.food });
}
function preloadCardImages(cards) {
    for (const card of cards) {
        if (!card.image)
            continue;
        const image = new Image();
        image.src = card.image;
    }
}
function preloadDraftImages() {
    const draftCards = [];
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
function shuffleCards(cards) {
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
    var _a;
    return ((_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) === "gameover";
}
function getOnlineFinalRankings() {
    const state = onlineClientState.roomState;
    if (!state)
        return [];
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
        if (second.score !== first.score)
            return second.score - first.score;
        if (second.coin !== first.coin)
            return second.coin - first.coin;
        return second.stamina - first.stamina;
    });
}
function getOnlineSelfState() {
    var _a, _b;
    return (_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.self) !== null && _b !== void 0 ? _b : null;
}
function getOnlineSelfDraftPool() {
    var _a, _b;
    return (_b = (_a = getOnlineSelfState()) === null || _a === void 0 ? void 0 : _a.draftPool) !== null && _b !== void 0 ? _b : null;
}
function getOnlineDraftDisplayPool() {
    if (!isOnlineRoomActive())
        return null;
    const serverPool = getOnlineSelfDraftPool();
    /*
      Fix online draft bị mất bài ở tab khác:
      server vẫn có state.self.draftPool nhưng client đôi khi đang giữ
      onlineDraftDisplayPool rỗng/null do animation/pass state. Khi đó UI không render bài,
      dù hết giờ server vẫn auto-pick được. Luôn fallback về serverPool nếu có bài.
    */
    if (isPassingDraftCards && !isOnlineFinalDraftReturnAnimating) {
        const passPool = onlineDraftPassSnapshotPool !== null && onlineDraftPassSnapshotPool !== void 0 ? onlineDraftPassSnapshotPool : onlineDraftDisplayPool;
        if (passPool && passPool.length > 0) {
            return passPool;
        }
        if (serverPool && serverPool.length > 0) {
            onlineDraftDisplayPool = [...serverPool];
            return onlineDraftDisplayPool;
        }
        return passPool !== null && passPool !== void 0 ? passPool : serverPool;
    }
    if (onlineDraftDisplayPool && onlineDraftDisplayPool.length > 0) {
        return onlineDraftDisplayPool;
    }
    if (serverPool && serverPool.length > 0) {
        onlineDraftDisplayPool = [...serverPool];
        return onlineDraftDisplayPool;
    }
    return onlineDraftDisplayPool !== null && onlineDraftDisplayPool !== void 0 ? onlineDraftDisplayPool : serverPool;
}
function getDraftPoolSignature(cards) {
    return (cards !== null && cards !== void 0 ? cards : []).map((card) => card.id).join(",");
}
function setOnlineDraftDisplayPoolFromServer() {
    const serverPool = getOnlineSelfDraftPool();
    onlineDraftDisplayPool = serverPool ? [...serverPool] : null;
    onlineDraftPendingPool = null;
}
function recoverOnlineDraftDisplayAfterTabVisible(reason = "visible-sync") {
    var _a, _b;
    if (!isOnlineRoomActive())
        return false;
    const state = onlineClientState.roomState;
    if (!state || state.phase !== "draft")
        return false;
    const serverPool = getOnlineSelfDraftPool();
    if (!serverPool || serverPool.length === 0)
        return false;
    const visiblePool = (_a = onlineDraftDisplayPool !== null && onlineDraftDisplayPool !== void 0 ? onlineDraftDisplayPool : onlineDraftPassSnapshotPool) !== null && _a !== void 0 ? _a : onlineDraftPendingPool;
    const hasVisibleCards = !!visiblePool && visiblePool.length > 0;
    const animationExpired = draftDealVisualEndsAt > 0 && Date.now() > draftDealVisualEndsAt + 180;
    const visualDealStillRunning = isInitialDealInProgress ||
        isDraftCenterDealing ||
        isPassingDraftCards ||
        Date.now() < draftDealVisualEndsAt;
    const staleAnimation = animationExpired && visualDealStillRunning;
    /*
      Khi tab bị background, browser pause timer/animation.
      Nếu focus lại mà server đang có pool thật, ưu tiên hiện bài ngay,
      không chạy animation chia bài muộn ở tab đó nữa.
    */
    if (hasVisibleCards && !staleAnimation && !visualDealStillRunning)
        return false;
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
    draftSelectedCardId = (_b = state.self.selectedDraftCardId) !== null && _b !== void 0 ? _b : null;
    lastOnlineRenderSignature = "";
    console.debug(`[DRAFT SYNC] recovered draft pool after tab visible: ${reason}`, {
        poolSize: serverPool.length,
        timer: state.timer,
        round: state.draftRound,
    });
    return true;
}
function syncOnlineDraftDisplayAfterTabVisible() {
    if (document.visibilityState !== "visible")
        return;
    if (recoverOnlineDraftDisplayAfterTabVisible("visibility/focus")) {
        rerenderGameShell();
    }
}
function isOnlineInterRoundPoolPassActive() {
    return isPassingDraftCards && !isOnlineFinalDraftReturnAnimating;
}
function completeOnlineDraftPoolPassAndDeal() {
    var _a;
    onlineDraftAnimationTimerId = null;
    if (onlineDraftPendingPool) {
        onlineDraftDisplayPool = [...onlineDraftPendingPool];
        onlineDraftPendingPool = null;
    }
    onlineDraftPassSnapshotPool = null;
    draftHandPendingCardId = null;
    draftPoolFlyReturnCardId = null;
    isPassingDraftCards = false;
    isInitialDealInProgress = true;
    const roomState = onlineClientState.roomState;
    draftSelectedCardId = (_a = roomState === null || roomState === void 0 ? void 0 : roomState.self.selectedDraftCardId) !== null && _a !== void 0 ? _a : null;
    lastOnlineRenderSignature = "";
    rerenderGameShell();
    startDraftCenterDealAnimation();
    onlineDraftAnimationTimerId = window.setTimeout(() => {
        finishOnlineDraftDealVisualOnly();
    }, DRAFT_CENTER_DEAL_TOTAL_MS);
}
function beginOnlineDraftPoolPass(snapshotPool, nextServerPool) {
    if (isOnlineFinalDraftReturnAnimating || !isDraftPhase)
        return;
    if (snapshotPool.length === 0)
        return;
    if (isPassingDraftCards) {
        if (nextServerPool === null || nextServerPool === void 0 ? void 0 : nextServerPool.length) {
            onlineDraftPendingPool = [...nextServerPool];
        }
        return;
    }
    clearOnlineDraftAnimationTimer();
    onlineDraftPassSnapshotPool = [...snapshotPool];
    if (nextServerPool === null || nextServerPool === void 0 ? void 0 : nextServerPool.length) {
        onlineDraftPendingPool = [...nextServerPool];
    }
    draftSelectedCardId = null;
    draftPoolFlyReturnCardId = null;
    shouldActivateOnlineDealAnimation = false;
    shouldActivateOnlinePassAnimation = true;
    isInitialDealInProgress = false;
    isPassingDraftCards = true;
    onlineDraftAnimationTimerId = window.setTimeout(() => {
        completeOnlineDraftPoolPassAndDeal();
    }, DRAFT_PASS_ANIMATION_MS);
}
function getOnlineSelfHand() {
    var _a, _b;
    return (_b = (_a = getOnlineSelfState()) === null || _a === void 0 ? void 0 : _a.hand) !== null && _b !== void 0 ? _b : null;
}
function getOnlineSelectedDraftCardId() {
    var _a, _b;
    return (_b = (_a = getOnlineSelfState()) === null || _a === void 0 ? void 0 : _a.selectedDraftCardId) !== null && _b !== void 0 ? _b : null;
}
function getDraftVisualSelectedCardId() {
    var _a;
    return (_a = getOnlineSelectedDraftCardId()) !== null && _a !== void 0 ? _a : draftSelectedCardId;
}
function getDraftPoolHighlightedCardId() {
    // Pool không hiển thị trạng thái "đã chọn" — lá pending nằm trên tay, slot pool bị ẩn.
    return null;
}
function shouldShowDraftWaitBanner() {
    if (!isDraftPhase || isDraftDealVisualActive() || isPassingDraftCards)
        return false;
    if (!draftHandPendingCardId)
        return false;
    if (!isOnlineRoomActive())
        return false;
    const connectedCount = playerIds.filter((playerId) => {
        var _a, _b;
        return (_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.players[playerId]) === null || _b === void 0 ? void 0 : _b.isConnected;
    }).length;
    return connectedCount > 1;
}
function getOnlinePlayer(playerId) {
    var _a;
    if (!playerId || !onlineClientState.roomState)
        return null;
    return (_a = onlineClientState.roomState.players[playerId]) !== null && _a !== void 0 ? _a : null;
}
export function getDisplayPlayerName() {
    var _a, _b;
    const selfPlayerId = (_a = onlineClientState.playerId) !== null && _a !== void 0 ? _a : currentPlayerId;
    const onlineSelf = getOnlinePlayer(selfPlayerId);
    return (_b = onlineSelf === null || onlineSelf === void 0 ? void 0 : onlineSelf.name) !== null && _b !== void 0 ? _b : "Player";
}
function getCompactPhaseDayLabel() {
    return `${getCurrentPhaseLabel()} • ${getCurrentDayLabel()}`.toUpperCase();
}
function getOnlineSelfPublicPlayer() {
    var _a;
    const selfPlayerId = onlineClientState.playerId;
    if (!selfPlayerId || !onlineClientState.roomState)
        return null;
    return (_a = onlineClientState.roomState.players[selfPlayerId]) !== null && _a !== void 0 ? _a : null;
}
function getConnectedLobbyPlayers() {
    const state = onlineClientState.roomState;
    if (!state)
        return [];
    return playerIds
        .map((playerId) => state.players[playerId])
        .filter((player) => player.isConnected);
}
function canCurrentPlayerStartRoom() {
    const state = onlineClientState.roomState;
    if (!state || state.phase !== "lobby")
        return false;
    if (onlineClientState.playerId !== "p1")
        return false;
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const savedSession = getSavedOnlineSession();
    return `
    <main class="online-entry-screen">
      <section class="online-entry-card">
        <div class="online-entry-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Online Room</h1>
          <p>Tạo phòng, mời bạn bè bằng mã phòng, rồi bắt đầu khi mọi người sẵn sàng.</p>
          <p class="online-entry-card__welcome">
            Xin chào, <strong>${(_d = (_b = (_a = authClientState.user) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : (_c = authClientState.user) === null || _c === void 0 ? void 0 : _c.username) !== null && _d !== void 0 ? _d : "Nhà Lữ Hành"}</strong>
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
              <input id="lobby-create-name" value="${(_f = (_e = authClientState.user) === null || _e === void 0 ? void 0 : _e.displayName) !== null && _f !== void 0 ? _f : "An"}" maxlength="18" />
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
              <input id="lobby-join-name" value="${(_h = (_g = authClientState.user) === null || _g === void 0 ? void 0 : _g.displayName) !== null && _h !== void 0 ? _h : "Player"}" maxlength="18" />
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

        ${savedSession
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
        : ""}
      </section>
    </main>
  `;
}
function renderOnlineLobbyRoomScreen() {
    var _a, _b;
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
            <p>Bạn là ${(_a = onlineClientState.playerId) === null || _a === void 0 ? void 0 : _a.toUpperCase()} • ${(_b = selfPlayer === null || selfPlayer === void 0 ? void 0 : selfPlayer.name) !== null && _b !== void 0 ? _b : "Player"}</p>
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
            class="online-lobby-card__ready ${(selfPlayer === null || selfPlayer === void 0 ? void 0 : selfPlayer.isReady) ? "is-ready" : ""}"
            onclick="event.stopPropagation(); toggleReadyFromLobby()"
          >
            ${(selfPlayer === null || selfPlayer === void 0 ? void 0 : selfPlayer.isReady) ? "Hủy sẵn sàng" : "Sẵn sàng"}
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
function getOnlinePlayerBoard(playerId) {
    var _a, _b;
    return (_b = (_a = getOnlinePlayer(playerId)) === null || _a === void 0 ? void 0 : _a.board) !== null && _b !== void 0 ? _b : null;
}
function getCurrentOnlinePlayerId() {
    var _a;
    return (_a = onlineClientState.playerId) !== null && _a !== void 0 ? _a : currentPlayerId;
}
function getOnlineScoreForPlayer(playerId) {
    var _a, _b;
    if (!playerId || !onlineClientState.roomState)
        return null;
    return (_b = (_a = onlineClientState.roomState.players[playerId]) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : null;
}
function getOnlineSelfScore() {
    var _a;
    return getOnlineScoreForPlayer((_a = onlineClientState.playerId) !== null && _a !== void 0 ? _a : currentPlayerId);
}
function getKnownOnlineCardById(cardId) {
    var _a, _b, _c, _d;
    const onlineSelf = getOnlineSelfState();
    const allKnownCards = [
        ...(onlineDraftDisplayPool !== null && onlineDraftDisplayPool !== void 0 ? onlineDraftDisplayPool : []),
        ...(onlineDraftPendingPool !== null && onlineDraftPendingPool !== void 0 ? onlineDraftPendingPool : []),
        ...((_a = onlineSelf === null || onlineSelf === void 0 ? void 0 : onlineSelf.draftPool) !== null && _a !== void 0 ? _a : []),
        ...((_b = onlineSelf === null || onlineSelf === void 0 ? void 0 : onlineSelf.pickedDraftCards) !== null && _b !== void 0 ? _b : []),
        ...((_c = onlineSelf === null || onlineSelf === void 0 ? void 0 : onlineSelf.hand) !== null && _c !== void 0 ? _c : []),
        ...playerHand,
        ...initialDeck,
    ];
    return (_d = allKnownCards.find((card) => card.id === cardId)) !== null && _d !== void 0 ? _d : null;
}
function createCardFromPublicBoardCell(cell) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const knownCard = getKnownOnlineCardById(cell.cardId);
    if (knownCard && !cell.type) {
        return knownCard;
    }
    if (cell.type === "debt") {
        return Object.assign(Object.assign({}, createDebtTokenCard({
            rowIndex: 0,
            colIndex: 0,
            amount: (_a = cell.debtAmount) !== null && _a !== void 0 ? _a : 0,
            sourceCardName: (_c = (_b = cell.sourceCardName) !== null && _b !== void 0 ? _b : cell.name) !== null && _c !== void 0 ? _c : "Lá đã vay",
            lockedReason: cell.lockedReason,
        })), { id: cell.cardId });
    }
    if (cell.type === "lock") {
        return Object.assign(Object.assign({}, createExhaustLockTokenCard({
            rowIndex: 0,
            colIndex: 0,
            sourceCardName: (_e = (_d = cell.sourceCardName) !== null && _d !== void 0 ? _d : cell.name) !== null && _e !== void 0 ? _e : "Lá đã vay thể lực",
        })), { id: cell.cardId });
    }
    const fallbackName = (_f = cell.name) !== null && _f !== void 0 ? _f : cell.cardId;
    const normalizedTag = cell.tag || "food";
    return {
        id: cell.cardId,
        name: fallbackName,
        shortName: fallbackName,
        city: "",
        shortCity: "",
        image: (_g = cell.image) !== null && _g !== void 0 ? _g : images.food,
        rarity: "common",
        rarityLabel: "★",
        vp: cell.vp,
        coin: (_h = cell.coin) !== null && _h !== void 0 ? _h : 0,
        stamina: (_j = cell.stamina) !== null && _j !== void 0 ? _j : 0,
        tag: normalizedTag,
        tagLabel: normalizedTag,
        tags: [normalizedTag.toUpperCase()],
        icon: cell.icon,
        description: "",
        bonusText: "",
    };
}
function convertOnlineBoardToBoardSlots(playerId) {
    const onlineBoard = getOnlinePlayerBoard(playerId);
    if (!onlineBoard)
        return null;
    return onlineBoard.map((row) => {
        return row.map((cell) => {
            if (!cell)
                return null;
            return createCardFromPublicBoardCell(cell);
        });
    });
}
function applyOnlineRoomStateToLocal() {
    var _a, _b, _c, _d, _e, _f;
    const state = onlineClientState.roomState;
    if (!state)
        return;
    phaseNumber = (_a = state.phaseNumber) !== null && _a !== void 0 ? _a : phaseNumber;
    currentDayIndex = Math.max(0, Math.min(PHASE_DAYS - 1, state.dayIndex));
    const onlineSelfPublicState = state.players[(_b = onlineClientState.playerId) !== null && _b !== void 0 ? _b : currentPlayerId];
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
    const serverDraftPool = (_c = state.self.draftPool) !== null && _c !== void 0 ? _c : [];
    const onlinePoolSignature = getDraftPoolSignature(serverDraftPool);
    const hasDisplayPool = onlineDraftDisplayPool !== null && onlineDraftDisplayPool.length > 0;
    if (isOnlineRoomActive()) {
        const enteredDraft = state.phase === "draft" && lastOnlineAnimationPhase !== "draft";
        const pickedDraftCount = (_e = (_d = state.self.pickedDraftCards) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0;
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
            draftHandPendingCardId = null;
            draftPoolFlyReturnCardId = null;
            onlineDraftPassSnapshotPool = null;
            setOnlineDraftDisplayPoolFromServer();
            /*
              Nếu tab đang ở background hoặc mình quay lại khi lượt draft đã chạy vài giây,
              KHÔNG chạy lại animation chia bài từ đầu. Nếu chạy lại, tab đó sẽ kẹt
              "Đang chia bài..." và không render pool chọn bài, dù server vẫn có bài.
            */
            const shouldSkipOnlineDealAnimation = document.visibilityState !== "visible" ||
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
            }
            else {
                onlineDraftAnimationTimerId = window.setTimeout(() => {
                    finishOnlineDraftDealVisualOnly();
                }, DRAFT_CENTER_DEAL_TOTAL_MS);
            }
        }
        else if (state.phase === "draft" &&
            lastOnlineAnimationPhase === "draft" &&
            (pickedIncreased || draftRoundAdvanced)) {
            if (isPassingDraftCards && !isOnlineFinalDraftReturnAnimating) {
                if (serverDraftPool.length > 0) {
                    onlineDraftPendingPool = [...serverDraftPool];
                }
                if (pickedIncreased && !isDraftPickFlying) {
                    draftHandPendingCardId = null;
                    draftPoolFlyReturnCardId = null;
                }
            }
            else if (!isOnlineFinalDraftReturnAnimating) {
                const snapshot = (_f = onlineDraftDisplayPool !== null && onlineDraftDisplayPool !== void 0 ? onlineDraftDisplayPool : onlineDraftPassSnapshotPool) !== null && _f !== void 0 ? _f : (serverDraftPool.length > 0 ? [...serverDraftPool] : null);
                if (snapshot === null || snapshot === void 0 ? void 0 : snapshot.length) {
                    beginOnlineDraftPoolPass(snapshot, serverDraftPool);
                }
                else if (!hasDisplayPool) {
                    setOnlineDraftDisplayPoolFromServer();
                }
            }
        }
        else if (state.phase === "draft" &&
            serverDraftPool.length > 0 &&
            (!onlineDraftDisplayPool || onlineDraftDisplayPool.length === 0)) {
            setOnlineDraftDisplayPoolFromServer();
        }
        else if (state.phase === "draft" && !hasDisplayPool) {
            setOnlineDraftDisplayPoolFromServer();
        }
        const isEnteringPlanningAfterDraft = state.phase === "planning" &&
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
    const shouldPlayPlanningDealFallback = isOnlineRoomActive() &&
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
    }
    if (state.phase === "draft") {
        playerHand = [];
        if (!isDraftPickFlying) {
            draftSelectedCardId = state.self.selectedDraftCardId;
            if (state.self.selectedDraftCardId &&
                !draftHandPendingCardId &&
                !isDraftDealVisualActive()) {
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
    }
    else {
        simulationResult = null;
        simulationReplayIndex = 0;
        isReplayComplete = false;
        hasStartedOnlineSimulationReplay = false;
        hasAppliedSimulationScore = false;
    }
}
function getCurrentDayPlacedCards(dayIndex = currentDayIndex) {
    return getCurrentDayPlacedCardsFromSlots(getBoardSlots(), dayIndex);
}
const initialDeck = createInitialDeck();
const playerIds = ["p1", "p2", "p3", "p4"];
export const currentPlayerId = "p1";
function createEmptyPlayerBoards() {
    return {
        p1: createEmptyBoardSlots(),
        p2: createEmptyBoardSlots(),
        p3: createEmptyBoardSlots(),
        p4: createEmptyBoardSlots(),
    };
}
function createEmptyBotPlacedDays() {
    return {
        p1: new Set(),
        p2: new Set(),
        p3: new Set(),
        p4: new Set(),
    };
}
function getCurrentPlayerBoard() {
    if (isOnlineRoomActive()) {
        const onlineBoard = convertOnlineBoardToBoardSlots(getCurrentOnlinePlayerId());
        if (onlineBoard) {
            return onlineBoard;
        }
    }
    return playerBoards[currentPlayerId];
}
function setCurrentPlayerBoard(nextBoard) {
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
let dayAdvanceTimerId = null;
let dailyDealTimerId = null;
let deck = shuffleCards(initialDeck);
let playerHand = [];
let isInitialDealInProgress = false;
let isDraftPhase = true;
let draftPlayers = [];
let draftSelectedCardId = null;
let draftPickSecondsLeft = DRAFT_PICK_SECONDS;
let draftTimerId = null;
let isPassingDraftCards = false;
let draftPassDisplayPool = null;
let draftRound = 1;
let lastDraftPickResults = [];
let playerBoards = createEmptyPlayerBoards();
let botPlacedDays = {
    p1: new Set(),
    p2: new Set(),
    p3: new Set(),
    p4: new Set(),
};
let botPlacementTimerId = null;
let selectedHandCardId = null;
let draggedHandCardId = null;
let handPointerDragState = null;
let lastPlacedBoardPosition = null;
let lastUtilityEffectFlash = null;
let resourceOrbFlashType = null;
let focusedHandCardId = null;
let focusedBoardCard = null;
let focusedBoardPosition = null;
let holdTimer = null;
let suppressNextClick = false;
let isSimulationMode = false;
export let simulationResult = null;
let remainingTurnSeconds = TURN_DURATION_SECONDS;
let turnTimerId = null;
let simulationReplayIndex = 0;
let simulationReplayTimerId = null;
let isReplayComplete = false;
let isMidGameRankingOpen = false;
let hasPlayedDealAnimation = true;
let didMoveHandPointerDrag = false;
let lastPointerDownCardId = null;
export function getBoardSlots() {
    return getCurrentPlayerBoard();
}
function getOpponentPlayerIds() {
    return playerIds.filter((playerId) => playerId !== currentPlayerId);
}
function getFirstEmptyBoardPosition(board, preferredColIndex = currentDayIndex) {
    var _a;
    for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
        if (((_a = board[rowIndex]) === null || _a === void 0 ? void 0 : _a[preferredColIndex]) === null) {
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
function cloneCardForBot(card, playerId, index) {
    return Object.assign(Object.assign({}, card), { id: `${card.id}_${playerId}_${currentDayIndex}_${index}_${Date.now()}` });
}
function getBotSourceCards(playerId) {
    var _a;
    const draftIndexByPlayerId = {
        p1: 1,
        p2: 0,
        p3: 2,
        p4: 3,
    };
    const draftPlayer = draftPlayers[draftIndexByPlayerId[playerId]];
    const pickedCards = (_a = draftPlayer === null || draftPlayer === void 0 ? void 0 : draftPlayer.picked) !== null && _a !== void 0 ? _a : [];
    if (pickedCards.length > 0) {
        return pickedCards;
    }
    return initialDeck;
}
function placeOneBotCard(playerId, card, index) {
    const board = playerBoards[playerId];
    const position = getFirstEmptyBoardPosition(board, currentDayIndex);
    if (!position)
        return;
    board[position.rowIndex][position.colIndex] = cloneCardForBot(card, playerId, index);
}
function countBotCardsInCurrentDay(playerId) {
    var _a;
    let count = 0;
    const board = playerBoards[playerId];
    for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
        if (((_a = board[rowIndex]) === null || _a === void 0 ? void 0 : _a[currentDayIndex]) !== null) {
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
function hasBotPlacementAvailable() {
    return getOpponentPlayerIds().some((playerId) => {
        return countBotCardsInCurrentDay(playerId) < 3;
    });
}
function placeNextRealtimeBotMove() {
    var _a;
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
    const sourceCard = (_a = sourceCards[currentCount % Math.max(1, sourceCards.length)]) !== null && _a !== void 0 ? _a : initialDeck[0];
    if (!sourceCard) {
        stopBotPlacementTimer();
        return;
    }
    placeOneBotCard(playerId, sourceCard, currentCount);
    rerenderArena();
}
function startRealtimeBotPlacement() {
    stopBotPlacementTimer();
    if (isOnlineRoomActive())
        return;
    if (isDraftPhase || isSimulationMode || isInitialDealInProgress)
        return;
    if (!hasBotPlacementAvailable())
        return;
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
    if (isOnlineRoomActive())
        return;
    /*
      Bản cũ fill bot ngay lập tức nên nhìn không giống real-time.
      Bản mới chỉ khởi động timer, bot sẽ lần lượt đặt icon lên side board.
    */
    startRealtimeBotPlacement();
}
function placeBotCardsAfterPlayerMove(sourceCard) {
    if (isOnlineRoomActive())
        return;
    const opponentIds = getOpponentPlayerIds();
    opponentIds.forEach((playerId, index) => {
        if (countBotCardsInCurrentDay(playerId) >= 3)
            return;
        placeOneBotCard(playerId, sourceCard, index);
    });
}
function getPlayerBoardUsedSlots(playerId) {
    let usedSlots = 0;
    for (const row of playerBoards[playerId]) {
        for (const card of row) {
            if (card)
                usedSlots += 1;
        }
    }
    return usedSlots;
}
function isLastPlacedBoardCell(rowIndex, colIndex) {
    return (lastPlacedBoardPosition !== null &&
        lastPlacedBoardPosition.rowIndex === rowIndex &&
        lastPlacedBoardPosition.colIndex === colIndex);
}
function getPlacedCards() {
    return getPlacedCardsFromSlots(getBoardSlots());
}
function calculateScoreBreakdown() {
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
    return simulationResult.replaySteps[Math.min(simulationReplayIndex, simulationResult.replaySteps.length - 1)];
}
function isBadSimulationReplayStep(step) {
    if (!step)
        return false;
    const stepData = step;
    /*
      Event xấu hiện tại:
      - traffic: kẹt xe
      - storm: mưa giông
      - distance: khoảng cách > 20km
      - promo là event tốt nên không dùng scanBad.
    */
    return (stepData.isBadEvent === true ||
        stepData.isNegativeEvent === true ||
        stepData.eventType === "traffic" ||
        stepData.eventType === "storm" ||
        stepData.eventType === "distance");
}
function getSimulationEventSoundName(step) {
    if (!(step === null || step === void 0 ? void 0 : step.eventType))
        return null;
    if (step.eventType === "promo")
        return "eventPromo";
    if (step.eventType === "traffic")
        return "eventTraffic";
    if (step.eventType === "storm")
        return "eventStorm";
    if (step.eventType === "distance")
        return "eventDistance";
    return null;
}
function playSimulationScanSoundForCurrentStep() {
    const step = getCurrentReplayStep();
    if (!step)
        return;
    const eventSoundName = getSimulationEventSoundName(step);
    /*
      Event có sound riêng.
      Ô bình thường vẫn dùng ding scan.
    */
    playGameSound(eventSoundName !== null && eventSoundName !== void 0 ? eventSoundName : (isBadSimulationReplayStep(step) ? "scanBad" : "scanCell"));
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
function calculateSimulationResult() {
    return calculateSimulationResultFromBoard({
        boardSlots: getBoardSlots(),
        currentDayIndex,
        dayLabel: getCurrentDayLabel(),
        rows,
        getBoardDisplayName,
        getCardTagKeys,
        countCardsWithTag,
        getCurrentDayPlacedCards,
    });
}
export function getCurrentScoreBreakdown() {
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
function getBoardTotals() {
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
            return Object.assign(Object.assign({}, player), { usedSlots: player.id ? getPlayerBoardUsedSlots(player.id) : player.usedSlots });
        }
        const remaining = getRemainingResources();
        return Object.assign(Object.assign({}, player), { score: totals.vp, coin: Math.max(0, remaining.coin), stamina: Math.max(0, remaining.stamina), usedSlots: totals.usedSlots });
    });
}
function getPlayersRight() {
    return playersRight.map((player) => {
        return Object.assign(Object.assign({}, player), { usedSlots: player.id ? getPlayerBoardUsedSlots(player.id) : player.usedSlots });
    });
}
export function getRemainingResources() {
    /*
      Online phải lấy trực tiếp coin/stamina từ server state.
      Trước đó hàm này vẫn tính STARTING - cost trên board nên discard ở server đã cộng tài nguyên
      nhưng UI orb không đổi.
    */
    if (isOnlineRoomActive()) {
        const onlineSelf = getOnlineSelfPublicPlayer();
        if (onlineSelf) {
            return {
                coin: onlineSelf.coin,
                stamina: onlineSelf.stamina,
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
function getCardAffordability(card) {
    return getCardAffordabilityFromResources({
        card,
        remaining: getRemainingResources(),
    });
}
function getCardAffordabilityMessage(card) {
    return getCardAffordabilityMessageFromResources(getCardAffordability(card));
}
function drawNextCard() {
    const nextCard = deck.shift();
    if (nextCard) {
        playerHand.push(nextCard);
    }
}
function getTextFitClass(text, baseClass, mediumThreshold, longThreshold) {
    const len = text.trim().length;
    if (len >= longThreshold)
        return `${baseClass} ${baseClass}--xs`;
    if (len >= mediumThreshold)
        return `${baseClass} ${baseClass}--sm`;
    return baseClass;
}
function getHandTitleClass(name) {
    return getTextFitClass(name, "hand-card__name", 16, 23);
}
function getHandCityClass(city) {
    return getTextFitClass(city, "hand-card__city", 18, 28);
}
function getBoardTitleClass(name) {
    return getTextFitClass(name, "board-mini__name", 12, 18);
}
function getBoardCityClass(city) {
    return getTextFitClass(city, "board-mini__city", 12, 21);
}
function getBoardDisplayName(card) {
    var _a;
    return ((_a = card.shortName) === null || _a === void 0 ? void 0 : _a.trim()) || card.name;
}
function getBoardDisplayCity(card) {
    var _a;
    return ((_a = card.shortCity) === null || _a === void 0 ? void 0 : _a.trim()) || card.city;
}
function getBoardTokenType(card) {
    var _a;
    return (_a = card === null || card === void 0 ? void 0 : card.boardTokenType) !== null && _a !== void 0 ? _a : null;
}
function isBoardDebtToken(card) {
    return getBoardTokenType(card) === "debt";
}
function isBoardLockToken(card) {
    return getBoardTokenType(card) === "lock";
}
function canPlaceOnBoardCell(rowIndex, colIndex) {
    var _a, _b;
    const cell = (_b = (_a = getBoardSlots()[rowIndex]) === null || _a === void 0 ? void 0 : _a[colIndex]) !== null && _b !== void 0 ? _b : null;
    return cell === null;
}
function createDebtTokenCard(params) {
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
    };
}
function createExhaustLockTokenCard(params) {
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
    };
}
function getNextTimeSlotPosition(rowIndex, colIndex) {
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
function addLocalDebtOrExhaustToken(params) {
    var _a;
    if (params.coinDebt > 0) {
        localCoinDebt += params.coinDebt;
    }
    if (params.staminaDebt <= 0)
        return;
    const nextPosition = getNextTimeSlotPosition(params.rowIndex, params.colIndex);
    if (!nextPosition)
        return;
    if (((_a = getBoardSlots()[nextPosition.rowIndex]) === null || _a === void 0 ? void 0 : _a[nextPosition.colIndex]) !== null)
        return;
    getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] = createExhaustLockTokenCard({
        rowIndex: nextPosition.rowIndex,
        colIndex: nextPosition.colIndex,
        sourceCardName: params.card.name,
    });
}
function payLocalDebtToken(rowIndex, colIndex, card) {
    var _a;
    const token = card;
    const debtAmount = (_a = token.debtAmount) !== null && _a !== void 0 ? _a : 0;
    const remaining = getRemainingResources();
    if (debtAmount <= 0)
        return;
    if (remaining.coin < debtAmount) {
        alert(`Không đủ xu để trả nợ. Cần ${debtAmount} xu.`);
        return;
    }
    eventResourceModifier = Object.assign(Object.assign({}, eventResourceModifier), { coin: eventResourceModifier.coin - debtAmount });
    getBoardSlots()[rowIndex][colIndex] = null;
    playGameSound("eventPromo");
    rerenderArena();
}
function payDebtToken(rowIndex, colIndex, card) {
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
function clearLocalGeneratedTokenForReturnedCard(rowIndex, colIndex, card) {
    var _a, _b;
    const nextPosition = getNextTimeSlotPosition(rowIndex, colIndex);
    if (!nextPosition)
        return;
    const nextCell = (_b = (_a = getBoardSlots()[nextPosition.rowIndex]) === null || _a === void 0 ? void 0 : _a[nextPosition.colIndex]) !== null && _b !== void 0 ? _b : null;
    const token = nextCell;
    if (token &&
        token.boardTokenType === "lock" &&
        token.sourceCardName === card.name) {
        getBoardSlots()[nextPosition.rowIndex][nextPosition.colIndex] = null;
    }
}
function getFocusedTitleClass(name) {
    return getTextFitClass(name, "focused-card__name", 18, 25);
}
function getFocusedCityClass(city) {
    return getTextFitClass(city, "focused-card__city", 18, 28);
}
function getHandCardById(id) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!id)
        return null;
    if (isOnlineRoomActive()) {
        const onlineDraftCard = (_b = (_a = getOnlineSelfDraftPool()) === null || _a === void 0 ? void 0 : _a.find((card) => card.id === id)) !== null && _b !== void 0 ? _b : null;
        if (onlineDraftCard) {
            return onlineDraftCard;
        }
        const onlineHandCard = (_d = (_c = getOnlineSelfHand()) === null || _c === void 0 ? void 0 : _c.find((card) => card.id === id)) !== null && _d !== void 0 ? _d : null;
        if (onlineHandCard) {
            return onlineHandCard;
        }
    }
    if (isDraftPhase) {
        const draftCard = (_f = (_e = getCurrentDraftPlayer()) === null || _e === void 0 ? void 0 : _e.pool.find((card) => card.id === id)) !== null && _f !== void 0 ? _f : null;
        if (draftCard) {
            return draftCard;
        }
    }
    return (_g = playerHand.find((card) => card.id === id)) !== null && _g !== void 0 ? _g : null;
}
function getBoardCardByPosition(rowIndex, colIndex) {
    return getBoardCardByPositionFromSlots(getBoardSlots(), rowIndex, colIndex);
}
function isCardBonusActive(card) {
    var _a;
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
    return ((_a = card.onPlayEffect) === null || _a === void 0 ? void 0 : _a.has_effect) === true && card.onPlayEffect.effect_type === "GAIN_VP";
}
function getCardBonusBadge(card) {
    var _a;
    const tagKeys = getCardTagKeys(card);
    if (((_a = card.onPlayEffect) === null || _a === void 0 ? void 0 : _a.has_effect) && card.onPlayEffect.effect_type === "GAIN_VP") {
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
function stripCardText(value) {
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function getUtilityPlacementEffect(card) {
    var _a;
    const effect = card.onPlayEffect;
    const tags = getCardTagKeys(card);
    const isUtilityCard = tags.includes("UTILITY") ||
        String(card.tag || "").toLowerCase() === "utility" ||
        stripCardText(card.tagLabel || "").toLowerCase().includes("tiện ích");
    const fullText = stripCardText([
        card.name,
        card.shortName || "",
        card.description || "",
        card.bonusText || "",
        card.tagLabel || "",
    ].join(" ")).toLowerCase();
    const explicitValue = Number((_a = effect === null || effect === void 0 ? void 0 : effect.effect_value) !== null && _a !== void 0 ? _a : 0);
    const numberMatch = fullText.match(/(?:\+|nhận|hoi|hồi|cộng|thêm)\s*(\d+)/i);
    const inferredValue = numberMatch ? Number(numberMatch[1]) : 1;
    const value = explicitValue > 0 ? explicitValue : inferredValue;
    if (effect === null || effect === void 0 ? void 0 : effect.has_effect) {
        if (effect.effect_type === "RECOVER_XU") {
            return {
                type: "coin",
                value,
                label: `+${value} Xu`,
                icon: "🪙",
            };
        }
        if (effect.effect_type === "RECOVER_LA") {
            return {
                type: "stamina",
                value,
                label: `+${value} Thể lực`,
                icon: "⚡",
            };
        }
        if (effect.effect_type === "GAIN_VP") {
            return {
                type: "vp",
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
    if (!isUtilityCard)
        return null;
    if (fullText.includes("xu") ||
        fullText.includes("tiền") ||
        fullText.includes("coin") ||
        fullText.includes("gold")) {
        return {
            type: "coin",
            value,
            label: `+${value} Xu`,
            icon: "🪙",
        };
    }
    if (fullText.includes("thể lực") ||
        fullText.includes("the luc") ||
        fullText.includes("năng lượng") ||
        fullText.includes("nang luong") ||
        fullText.includes("stamina") ||
        fullText.includes("nl")) {
        return {
            type: "stamina",
            value,
            label: `+${value} Thể lực`,
            icon: "⚡",
        };
    }
    if (fullText.includes("vp") || fullText.includes("điểm") || fullText.includes("diem")) {
        return {
            type: "vp",
            value,
            label: `+${value} VP`,
            icon: "★",
        };
    }
    return {
        type: "vp",
        value,
        label: `+${value} VP`,
        icon: "★",
    };
}
function triggerUtilityEffectFlash(params) {
    const flashId = Date.now();
    lastUtilityEffectFlash = Object.assign(Object.assign({}, params), { id: flashId });
    resourceOrbFlashType = params.type;
    window.setTimeout(() => {
        if ((lastUtilityEffectFlash === null || lastUtilityEffectFlash === void 0 ? void 0 : lastUtilityEffectFlash.id) === flashId) {
            lastUtilityEffectFlash = null;
        }
        if (resourceOrbFlashType === params.type) {
            resourceOrbFlashType = null;
        }
        rerenderArena();
    }, 1050);
}
function applyUtilityPlacementEffect(card, rowIndex, colIndex) {
    const effect = getUtilityPlacementEffect(card);
    if (!effect)
        return false;
    if (effect.type === "coin") {
        eventResourceModifier = Object.assign(Object.assign({}, eventResourceModifier), { coin: eventResourceModifier.coin + effect.value });
        playGameSound("eventPromo");
    }
    else if (effect.type === "stamina") {
        eventResourceModifier = Object.assign(Object.assign({}, eventResourceModifier), { stamina: eventResourceModifier.stamina + effect.value });
        playGameSound("eventPromo");
    }
    else if (effect.type === "vp") {
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
function renderUtilityEffectFlash(rowIndex, colIndex) {
    if (!lastUtilityEffectFlash ||
        lastUtilityEffectFlash.rowIndex !== rowIndex ||
        lastUtilityEffectFlash.colIndex !== colIndex) {
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
function renderBoardMiniCard(card, replayStep) {
    var _a, _b, _c, _d, _e;
    const displayName = getBoardDisplayName(card);
    const displayCity = getBoardDisplayCity(card);
    const nameClass = getBoardTitleClass(displayName);
    const cityClass = getBoardCityClass(displayCity);
    const bonusActive = isCardBonusActive(card);
    const token = card;
    if (token.boardTokenType === "debt") {
        return `
      <article
        class="board-mini board-mini--token board-mini--debt"
        title="Bấm để trả ${(_a = token.debtAmount) !== null && _a !== void 0 ? _a : 0} xu"
      >
        <div class="board-mini-token__icon">💸</div>
        <strong>Nợ tiền ${(_b = token.debtAmount) !== null && _b !== void 0 ? _b : 0} xu</strong>
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
    const eventClass = (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) ? `board-mini--event-${replayStep.eventType}` : "";
    const eventIcon = (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "promo"
        ? "✨"
        : (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "traffic"
            ? "🚧"
            : (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "storm"
                ? "⛈️"
                : (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "distance"
                    ? "⚠️"
                    : "";
    const eventLabel = (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "promo"
        ? `+${(_c = replayStep.eventVpDelta) !== null && _c !== void 0 ? _c : 0} VP Event`
        : (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "traffic"
            ? `${(_d = replayStep.eventStaminaDelta) !== null && _d !== void 0 ? _d : 0} Thể lực`
            : (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "storm"
                ? `${(_e = replayStep.eventVpDelta) !== null && _e !== void 0 ? _e : 0} VP Event`
                : (replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType) === "distance"
                    ? "Khoảng cách > 20km"
                    : "";
    return `
    <article
      class="board-mini board-mini--${card.rarity} ${bonusActive ? "board-mini--bonus-active" : ""} ${eventClass}"
      title="${card.name} - ${card.city}${(replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventText) ? ` • ${replayStep.eventText}` : ""}"
    >
      ${(replayStep === null || replayStep === void 0 ? void 0 : replayStep.eventType)
        ? `
            <div class="board-mini__event-pill">${eventLabel}</div>
            <div class="board-mini__event-icon">${eventIcon}</div>
            ${replayStep.eventType === "distance"
            ? ""
            : replayStep.eventText
                ? `<div class="board-mini__event-note">${replayStep.eventText}</div>`
                : ""}
          `
        : ""}

      <div
        class="board-mini__image"
        style="background-image: url('${card.image}'), url('${images.food}')"
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
function renderHandCard(card, index, disableFan = false) {
    const isDraftSelected = isDraftPhase &&
        !disableFan &&
        card.id === draftHandPendingCardId;
    const isPlanningSelected = !isDraftPhase && card.id === selectedHandCardId;
    const isSelected = isDraftSelected || isPlanningSelected;
    const affordability = getCardAffordability(card);
    const affordabilityMessage = affordability.canAfford
        ? getCardAffordabilityMessage(card)
        : "Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.";
    const unaffordableClass = "";
    return `
    <article
      class="hand-card hand-card--${card.rarity} ${disableFan ? "" : `hand-card--fan-${index + 1}`} ${isPlanningSelected ? "hand-card--selected" : ""} ${isDraftSelected ? "hand-card--draft-selected" : ""} ${unaffordableClass}"
      data-hand-card-id="${card.id}"
      style="${isSelected ? "box-shadow: 0 0 0 4px rgba(255,255,255,.95), 0 0 0 8px rgba(139,92,246,.82), 0 18px 34px rgba(75,47,25,.28);" : ""}"
      title="${affordabilityMessage}"
      onpointerdown="${isDraftPhase ? `` : `event.stopPropagation(); startHandPointerDrag(event, '${card.id}')`}"
      onclick="${isDraftPhase ? `` : `event.stopPropagation(); window['selectHandCard']('${card.id}')`}"
    >
      ${isPlanningSelected
        ? `<button
              class="hand-card__close"
              onclick="event.stopPropagation(); clearSelectedHandCard()"
              title="Hủy chọn"
            >×</button>`
        : ""}

      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${getHandTitleClass(card.name)}">${card.name}</h3>
          <div class="${getHandCityClass(card.city)}">📍 ${card.city}</div>
        </div>

        <div class="hand-card__vp">${card.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${card.image}'), url('${images.food}')">
        <div class="hand-card__icons">
          <span>${card.icon}</span>
          <span>★</span>
        </div>
      </div>

      <div class="hand-card__content">
        <div class="hand-card__meta-row">
          <span class="hand-card__rarity">${card.rarityLabel}</span>
          <span class="hand-card__tag">${card.tagLabel}</span>
        </div>

        <p>${card.description}</p>

        <div class="hand-card__bonus">
          ${card.bonusText}
        </div>
      </div>

      <div class="hand-card__footer">
        <div>
          <span>GOLD</span>
          <strong>${card.coin}</strong>
        </div>

        <div>
          <span>STAMINA</span>
          <strong>${card.stamina}</strong>
        </div>
      </div>
    </article>
  `;
}
function renderFocusedCard(card) {
    const titleClass = getFocusedTitleClass(card.name);
    const cityClass = getFocusedCityClass(card.city);
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

        <div class="focused-card__header">
          <div class="focused-card__title-wrap">
            <h2 class="${titleClass}">${card.name}</h2>
            <span class="${cityClass}">📍 ${card.city}</span>
          </div>

          <div class="focused-card__vp">${card.vp}</div>
        </div>

        <div class="focused-card__image" style="background-image: url('${card.image}'), url('${images.food}')">
          <div class="focused-card__icons">
            <span>${card.icon}</span>
            <span>★</span>
          </div>
        </div>

        <div class="focused-card__body">
          <div class="focused-card__tags">
            <span>${card.rarityLabel}</span>
            <span>${card.tagLabel}</span>
          </div>

          <p>${card.description}</p>

          <div class="focused-card__bonus">
            ${card.bonusText}
          </div>
        </div>

        <div class="focused-card__footer">
          <div>
            <span>GOLD</span>
            <strong>${card.coin}</strong>
          </div>

          <div>
            <span>STAMINA</span>
            <strong>${card.stamina}</strong>
          </div>
        </div>

        ${focusedBoardPosition
        ? `
              <button
                class="focused-card__return-button"
                onclick="event.stopPropagation(); returnFocusedBoardCardToHand()"
                title="Rút lá này từ board về tay"
              >
                ↩ Rút về tay
              </button>
            `
        : ""}
      </article>
    </div>
  `;
}
function renderDraftHandTopMeta() {
    var _a;
    const activePlayer = getCurrentDraftPlayer();
    const activePool = (_a = activePlayer === null || activePlayer === void 0 ? void 0 : activePlayer.pool) !== null && _a !== void 0 ? _a : [];
    const selectedCard = getDraftSelectedCard();
    return `
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${draftRound}/5</span>
        <strong>${selectedCard ? getBoardDisplayName(selectedCard) : "Bấm 1 lá để chọn"}</strong>
        <em>
          ${isInitialDealInProgress
        ? "Đang phát bài vào tay..."
        : isPassingDraftCards
            ? "Đang chuyền bài còn lại vào lượt kế tiếp..."
            : selectedCard
                ? "Đã chọn. Hết giờ mới chuyền bài."
                : activePool.length > 0
                    ? "Bấm để chọn, giữ 0.5s để xem lớn."
                    : "Đang chuẩn bị bài..."}
        </em>
      </div>

      <div class="draft-hand-meta__wait">
        <span>Chờ hết giờ</span>
      </div>
    </div>
  `;
}
function getPickedDraftCount() {
    var _a, _b, _c, _d, _e, _f;
    if (isOnlineRoomActive()) {
        return ((_c = (_b = (_a = getOnlineSelfState()) === null || _a === void 0 ? void 0 : _a.pickedDraftCards) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0);
    }
    return (_f = (_e = (_d = getCurrentDraftPlayer()) === null || _d === void 0 ? void 0 : _d.picked) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0;
}
function getConfirmedPickedDraftCards() {
    var _a, _b, _c, _d;
    if (isOnlineRoomActive()) {
        return (_b = (_a = getOnlineSelfState()) === null || _a === void 0 ? void 0 : _a.pickedDraftCards) !== null && _b !== void 0 ? _b : [];
    }
    return (_d = (_c = getCurrentDraftPlayer()) === null || _c === void 0 ? void 0 : _c.picked) !== null && _d !== void 0 ? _d : [];
}
function findCardInDraftPool(cardId) {
    var _a, _b, _c, _d;
    const pool = isOnlineRoomActive()
        ? ((_a = getOnlineDraftDisplayPool()) !== null && _a !== void 0 ? _a : [])
        : ((_c = (_b = getCurrentDraftPlayer()) === null || _b === void 0 ? void 0 : _b.pool) !== null && _c !== void 0 ? _c : []);
    return (_d = pool.find((card) => card.id === cardId)) !== null && _d !== void 0 ? _d : null;
}
function getDraftHandDisplayCards() {
    const confirmed = getConfirmedPickedDraftCards();
    const pendingId = draftHandPendingCardId;
    if (!pendingId || confirmed.some((card) => card.id === pendingId)) {
        return confirmed;
    }
    const pendingCard = findCardInDraftPool(pendingId);
    return pendingCard ? [...confirmed, pendingCard] : confirmed;
}
function getDraftHandDisplayCount() {
    return getDraftHandDisplayCards().length;
}
const DRAFT_PICKED_FAN_LAYOUT = {
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
function getDraftFanSlotLayout(count, slotIndex) {
    var _a, _b;
    return (_b = (_a = DRAFT_PICKED_FAN_LAYOUT[count]) === null || _a === void 0 ? void 0 : _a[slotIndex - 1]) !== null && _b !== void 0 ? _b : { rotate: 0, ty: 0 };
}
function computeDraftHandSlotRect(count, slotIndex) {
    const cardsEl = document.querySelector(".player-hand__cards--draft");
    if (!cardsEl || count < 1 || slotIndex < 1 || slotIndex > count)
        return null;
    const layout = getDraftFanSlotLayout(count, slotIndex);
    const { cardW, cardH, stepX } = readDraftHandCardMetrics();
    const containerRect = cardsEl.getBoundingClientRect();
    const totalWidth = cardW + (count - 1) * stepX;
    const firstLeft = containerRect.left + (containerRect.width - totalWidth) / 2;
    const slotLeft = firstLeft + (slotIndex - 1) * stepX;
    const slotTop = containerRect.bottom - cardH - 4 + layout.ty;
    return new DOMRect(slotLeft, slotTop, cardW, cardH);
}
function parseDraftHandSlotMeta(cardEl) {
    const slotMatch = cardEl.className.match(/hand-card--picked-slot-(\d)/);
    const parent = cardEl.closest("[class*='picked-count-']");
    const countMatch = parent === null || parent === void 0 ? void 0 : parent.className.match(/picked-count-(\d)/);
    if (!slotMatch || !countMatch)
        return null;
    return {
        count: parseInt(countMatch[1], 10),
        slotIndex: parseInt(slotMatch[1], 10),
    };
}
function getDraftHandFlyTargetForPending() {
    const count = getDraftHandDisplayCount();
    const slotIndex = count;
    const rect = computeDraftHandSlotRect(count, slotIndex);
    if (!rect)
        return null;
    return {
        rect,
        rotate: getDraftFanSlotLayout(count, slotIndex).rotate,
    };
}
function getDraftHandFlySourceFromElement(cardEl) {
    const meta = parseDraftHandSlotMeta(cardEl);
    if (!meta)
        return null;
    const rect = computeDraftHandSlotRect(meta.count, meta.slotIndex);
    if (!rect)
        return null;
    return {
        rect,
        rotate: getDraftFanSlotLayout(meta.count, meta.slotIndex).rotate,
    };
}
function getDraftCenterCardWrapper(cardId) {
    var _a;
    const card = document.querySelector(`.draft-center-card[data-draft-card-id="${cardId}"]`);
    return (_a = card === null || card === void 0 ? void 0 : card.closest(".draft-center-card-wrapper")) !== null && _a !== void 0 ? _a : null;
}
function getDraftPendingHandSlotRect() {
    var _a, _b, _c;
    const slot = (_b = (_a = document.querySelector(".hand-card--picked-pending:not(.hand-card--picked-pending-hidden)")) !== null && _a !== void 0 ? _a : document.querySelector(".hand-card--picked-pending-hidden")) !== null && _b !== void 0 ? _b : document.querySelector(".hand-card--picked-pending");
    const rect = (_c = slot === null || slot === void 0 ? void 0 : slot.getBoundingClientRect()) !== null && _c !== void 0 ? _c : null;
    if (!rect || rect.width <= 0 || rect.height <= 0) {
        return null;
    }
    return rect;
}
function getDraftHandFallbackSlotRect() {
    const cardsEl = document.querySelector(".player-hand__cards--draft");
    if (!cardsEl)
        return null;
    const handRect = cardsEl.getBoundingClientRect();
    const cardWidth = cardsEl.clientWidth > 0 ? cardsEl.clientWidth * 0.12 : 132;
    const cardHeight = cardWidth * 1.38;
    return new DOMRect(handRect.left + handRect.width / 2 - cardWidth / 2, handRect.bottom - cardHeight - 8, cardWidth, cardHeight);
}
function measureDraftPendingHandSlotRect() {
    return __awaiter(this, void 0, void 0, function* () {
        for (let attempt = 0; attempt < 4; attempt++) {
            if (attempt > 0) {
                yield new Promise((resolve) => {
                    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
                });
            }
            updateDraftHandVisualOnly({ hiddenPendingMeasure: true });
            const cardsEl = document.querySelector(".player-hand__cards--draft");
            if (cardsEl) {
                void cardsEl.offsetHeight;
            }
            const target = getDraftHandFlyTargetForPending();
            if (target)
                return target.rect;
            const rect = getDraftPendingHandSlotRect();
            if (rect)
                return rect;
        }
        return getDraftHandFallbackSlotRect();
    });
}
function revertDraftPickFlyToHand(cardId) {
    var _a;
    draftHandPendingCardId = null;
    if (draftSelectedCardId === cardId) {
        draftSelectedCardId = null;
    }
    (_a = getDraftCenterCardWrapper(cardId)) === null || _a === void 0 ? void 0 : _a.classList.remove("draft-center-card-wrapper--flown-to-hand");
    updateDraftPoolFlownVisualOnly();
    updateDraftHandVisualOnly();
    updateDraftConfirmButtonVisualOnly();
}
function renderPickedDraftCard(card, index, options) {
    const pendingClass = (options === null || options === void 0 ? void 0 : options.isPending) ? " hand-card--picked-pending" : "";
    const hiddenClass = (options === null || options === void 0 ? void 0 : options.hiddenForMeasure) ? " hand-card--picked-pending-hidden" : "";
    return `
    <article
      class="hand-card hand-card--${card.rarity} hand-card--picked-draft hand-card--picked-slot-${index + 1}${pendingClass}${hiddenClass}"
      data-draft-hand-card-id="${card.id}"
    >
      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${getHandTitleClass(card.name)}">${card.name}</h3>
          <div class="${getHandCityClass(card.city)}">📍 ${card.city}</div>
        </div>

        <div class="hand-card__vp">${card.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${card.image}'), url('${images.food}')">
        <div class="hand-card__icons">
          <span>${card.icon}</span>
          <span>★</span>
        </div>
      </div>

      <div class="hand-card__content">
        <div class="hand-card__meta-row">
          <span class="hand-card__rarity">${card.rarityLabel}</span>
          <span class="hand-card__tag">${card.tagLabel}</span>
        </div>

        <p>${card.description}</p>

        <div class="hand-card__bonus">
          ${card.bonusText}
        </div>
      </div>

      <div class="hand-card__footer">
        <div>
          <span>GOLD</span>
          <strong>${card.coin}</strong>
        </div>

        <div>
          <span>STAMINA</span>
          <strong>${card.stamina}</strong>
        </div>
      </div>
    </article>
  `;
}
function renderPickedDraftCards(options) {
    const confirmedIds = new Set(getConfirmedPickedDraftCards().map((card) => card.id));
    return getDraftHandDisplayCards()
        .map((card, index) => renderPickedDraftCard(card, index, {
        isPending: card.id === draftHandPendingCardId && !confirmedIds.has(card.id),
        hiddenForMeasure: (options === null || options === void 0 ? void 0 : options.hiddenPendingMeasure) && card.id === draftHandPendingCardId,
    }))
        .join("");
}
function shouldShowDraftPickPool() {
    if (!isDraftPhase)
        return false;
    if (isOnlineFinalDraftReturnAnimating)
        return false;
    if (isOnlineInterRoundPoolPassActive()) {
        const passPool = onlineDraftPassSnapshotPool !== null && onlineDraftPassSnapshotPool !== void 0 ? onlineDraftPassSnapshotPool : onlineDraftDisplayPool;
        if (passPool === null || passPool === void 0 ? void 0 : passPool.length)
            return true;
    }
    if (isPassingDraftCards && (draftPassDisplayPool === null || draftPassDisplayPool === void 0 ? void 0 : draftPassDisplayPool.length))
        return true;
    if (getPickedDraftCount() >= DRAFT_PICK_TARGET)
        return false;
    return true;
}
function getDraftCenterRenderPool() {
    var _a, _b, _c, _d;
    if (isOnlineRoomActive()) {
        if (isOnlineInterRoundPoolPassActive()) {
            return (_a = onlineDraftPassSnapshotPool !== null && onlineDraftPassSnapshotPool !== void 0 ? onlineDraftPassSnapshotPool : onlineDraftDisplayPool) !== null && _a !== void 0 ? _a : [];
        }
        return (_b = getOnlineDraftDisplayPool()) !== null && _b !== void 0 ? _b : [];
    }
    if (isPassingDraftCards && draftPassDisplayPool) {
        return draftPassDisplayPool;
    }
    return (_d = (_c = getCurrentDraftPlayer()) === null || _c === void 0 ? void 0 : _c.pool) !== null && _d !== void 0 ? _d : [];
}
function updateDraftConfirmButtonVisualOnly() {
    const button = document.querySelector(".deck-pile-panel__draft-confirm");
    if (!button)
        return;
    const canConfirm = !!(draftHandPendingCardId || draftSelectedCardId) &&
        !isDraftPickFlying &&
        !isPassingDraftCards &&
        !isDraftDealVisualActive();
    button.disabled = !canConfirm;
}
function shouldShowDraftLeftoverReturn() {
    return isOnlineFinalDraftReturnAnimating && isPassingDraftCards;
}
function getDraftLeftoverReturnCards() {
    var _a, _b, _c;
    const pool = (_a = getOnlineDraftDisplayPool()) !== null && _a !== void 0 ? _a : [];
    const pickedIds = new Set(((_c = (_b = getOnlineSelfState()) === null || _b === void 0 ? void 0 : _b.pickedDraftCards) !== null && _c !== void 0 ? _c : []).map((card) => card.id));
    return pool.filter((card) => !pickedIds.has(card.id));
}
function isDraftPickTimerFrozen() {
    var _a, _b;
    const hold = (_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.draftTimerHold) !== null && _b !== void 0 ? _b : 0;
    if (isOnlineRoomActive()) {
        const serverPool = getOnlineSelfDraftPool();
        const animationExpired = draftDealVisualEndsAt > 0 && Date.now() > draftDealVisualEndsAt + 180;
        if ((serverPool === null || serverPool === void 0 ? void 0 : serverPool.length) && animationExpired) {
            return hold > 0;
        }
    }
    return (isDraftCenterDealing ||
        isInitialDealInProgress ||
        isPassingDraftCards ||
        hold > 0 ||
        Date.now() < draftDealVisualEndsAt);
}
function getDraftTimerDisplayLabel() {
    if (isDraftPickTimerFrozen())
        return "Chia bài";
    return `${draftPickSecondsLeft}s`;
}
function isDraftTimerDanger() {
    return !isDraftPickTimerFrozen() && draftPickSecondsLeft <= 3;
}
function renderDraftCenterOverlay() {
    if (!isDraftPhase)
        return "";
    if (!shouldShowDraftPickPool())
        return "";
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
    const renderRow = (cards, startIndex) => {
        return cards.map((card, idx) => {
            const index = startIndex + idx;
            const globalSlot = startIndex + idx + 1;
            const isFlownToHand = shouldHideDraftPoolSlot(card.id);
            const pickButton = isPassingDraftCards
                ? ""
                : `
          <button class="draft-center-btn" data-draft-card-id="${card.id}">
            CHỌN
          </button>
        `;
            return `
        <div class="draft-center-card-wrapper draft-center-card-wrapper--slot-${globalSlot} ${isFlownToHand ? "draft-center-card-wrapper--flown-to-hand" : ""}">
          <div class="draft-center-card" data-draft-card-id="${card.id}">
            ${renderHandCard(card, index, true)}
          </div>
          ${pickButton}
        </div>
      `;
        }).join("");
    };
    return `
    <div class="draft-center-overlay ${isPassingDraftCards && !isOnlineFinalDraftReturnAnimating ? "draft-center-overlay--passing" : ""}">
      <div class="draft-center-container">
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${renderRow(topRow, 0)}</div>
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${renderRow(bottomRow, 4)}</div>
      </div>
      ${shouldShowDraftWaitBanner() ? '<div class="draft-center-wait-banner">Đang chờ đối thủ...</div>' : ''}
    </div>
  `;
}
function renderDraftLeftoverReturnOverlay() {
    if (!shouldShowDraftLeftoverReturn())
        return "";
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
function getDraftPreviewIconsForPlayer(playerId) {
    var _a;
    const draftIndexByPlayerId = {
        p1: 1,
        p2: 0,
        p3: 2,
        p4: 3,
    };
    const draftPlayer = draftPlayers[draftIndexByPlayerId[playerId]];
    const pickedCards = (_a = draftPlayer === null || draftPlayer === void 0 ? void 0 : draftPlayer.picked) !== null && _a !== void 0 ? _a : [];
    return pickedCards.map((card) => card.icon);
}
function shouldRenderDraftPreviewOnSideBoard(playerId) {
    return Boolean(playerId && playerId !== currentPlayerId && isDraftPhase);
}
function getOnlineBoardForPlayer(playerId) {
    return getOnlinePlayerBoard(playerId);
}
function renderOnlineSideBoard(playerId) {
    const onlineBoard = getOnlinePlayerBoard(playerId);
    if (!onlineBoard) {
        return Array.from({ length: 25 })
            .map(() => `<div class="opponent-cell">+</div>`)
            .join("");
    }
    const cells = [];
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
function renderSidePlayerBoard(playerId) {
    var _a;
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
    const cells = [];
    let flatIndex = 0;
    for (const row of board) {
        for (const card of row) {
            const previewIcon = (_a = draftPreviewIcons[flatIndex]) !== null && _a !== void 0 ? _a : "";
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
function renderPlayer(player) {
    const onlinePlayer = getOnlinePlayer(player.id);
    const displayPlayer = onlinePlayer
        ? Object.assign(Object.assign({}, player), { name: onlinePlayer.name, score: onlinePlayer.score, coin: onlinePlayer.coin, stamina: onlinePlayer.stamina, usedSlots: onlinePlayer.usedSlots }) : player;
    const connectionClass = (onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.isConnected) === false ? " side-player--offline" : "";
    return `
    <section class="side-player ${displayPlayer.active ? "side-player--active" : ""}${connectionClass}">
      <div class="side-player__top">
        <div class="side-player__identity">
          <span class="rank">#${displayPlayer.rank}</span>
          <h3>${displayPlayer.name}</h3>
        </div>

        <div class="side-player__score">
          ${displayPlayer.score}
          ${(onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.hasJoined) && (onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.isConnected) === false ? `<span class="side-player__offline-badge">OFFLINE</span>` : ""}
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
function getDraftPrimaryTag(card) {
    var _a, _b, _c, _d;
    /*
      Không chỉ dựa vào card.tags, vì nếu mapper/data build bị lệch thì tag chính có thể sai.
      ID thật của bộ card có prefix rất rõ:
      SG_FOOD_..., SG_CULT_..., SG_ACT_..., SG_UTIL_...
      Ưu tiên đọc prefix ID trước để draft không bao giờ gom nhầm hết về FOOD.
    */
    const rawId = String((_b = (_a = card.id) !== null && _a !== void 0 ? _a : card.card_id) !== null && _b !== void 0 ? _b : "").toUpperCase();
    if (rawId.includes("_CULT_") || rawId.startsWith("SG_CULT"))
        return "CULTURE";
    if (rawId.includes("_ACT_") || rawId.startsWith("SG_ACT"))
        return "ACTION";
    if (rawId.includes("_UTIL_") || rawId.startsWith("SG_UTIL"))
        return "UTILITY";
    if (rawId.includes("_FOOD_") || rawId.startsWith("SG_FOOD"))
        return "FOOD";
    const tags = ((_c = card.tags) !== null && _c !== void 0 ? _c : []).map((tag) => String(tag).toUpperCase());
    if (tags.includes("CULTURE"))
        return "CULTURE";
    if (tags.includes("ACTION"))
        return "ACTION";
    if (tags.includes("UTILITY"))
        return "UTILITY";
    if (tags.includes("FOOD"))
        return "FOOD";
    const fallbackTag = String((_d = card.tag) !== null && _d !== void 0 ? _d : "").toUpperCase();
    if (fallbackTag === "CULTURE")
        return "CULTURE";
    if (fallbackTag === "ACTION")
        return "ACTION";
    if (fallbackTag === "UTILITY")
        return "UTILITY";
    if (fallbackTag === "FOOD")
        return "FOOD";
    return "UNKNOWN";
}
function shuffleValues(values) {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const temp = shuffled[index];
        shuffled[index] = shuffled[randomIndex];
        shuffled[randomIndex] = temp;
    }
    return shuffled;
}
function getDraftTagCounts(cards) {
    return cards.reduce((counts, card) => {
        var _a;
        const tag = getDraftPrimaryTag(card);
        counts[tag] = ((_a = counts[tag]) !== null && _a !== void 0 ? _a : 0) + 1;
        return counts;
    }, {});
}
function takeOneCardFromBucket(buckets, tag, selectedCards, selectedIds, count) {
    if (selectedCards.length >= count)
        return;
    const bucket = buckets.get(tag);
    if (!bucket || bucket.length === 0)
        return;
    const nextCard = bucket.shift();
    if (!nextCard || selectedIds.has(nextCard.id))
        return;
    selectedCards.push(nextCard);
    selectedIds.add(nextCard.id);
}
function getSinglePlayerDraftQuota(count) {
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
function drawRandomCardsFromDeck(count) {
    var _a;
    if (count <= 0 || deck.length === 0)
        return [];
    /*
      Sửa lỗi roll toàn Ẩm thực:
      - Trước đây có thể tag bị đọc sai hoặc lấy theo thứ tự deck.
      - Bản này bucket theo prefix ID thật + quota cứng.
      - Nếu deck còn CULTURE/ACTION/UTILITY thì pool 7 lá không thể toàn FOOD.
    */
    const shuffledDeck = shuffleCards(deck);
    const buckets = new Map();
    for (const card of shuffledDeck) {
        const tag = getDraftPrimaryTag(card);
        const bucket = (_a = buckets.get(tag)) !== null && _a !== void 0 ? _a : [];
        bucket.push(card);
        buckets.set(tag, bucket);
    }
    for (const [tag, bucket] of buckets.entries()) {
        buckets.set(tag, shuffleValues(bucket));
    }
    const selectedCards = [];
    const selectedIds = new Set();
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
            if (selectedCards.length >= count)
                break;
        }
        if (!pickedThisRound)
            break;
    }
    deck = shuffledDeck.filter((card) => !selectedIds.has(card.id));
    console.log("[Draft] deck tag counts before draw:", getDraftTagCounts(shuffledDeck));
    console.log("[Draft] single-player pool:", selectedCards.map((card) => `${card.id}:${getDraftPrimaryTag(card)}`));
    console.log("[Draft] single-player pool tag counts:", getDraftTagCounts(selectedCards));
    return selectedCards;
}
function createSinglePlayerDraftPlayers() {
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
    if (!isSinglePlayerLocalDraftMode())
        return;
    const activeIndex = getActiveDraftPlayerIndex();
    const currentPlayer = getCurrentDraftPlayer();
    if (!currentPlayer)
        return;
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
    const nextPoolSize = Math.max(DRAFT_STARTING_POOL_SIZE - currentPlayer.picked.length, DRAFT_STARTING_POOL_SIZE - DRAFT_PICK_TARGET + 1);
    const nextPool = drawRandomCardsFromDeck(nextPoolSize);
    draftPlayers = draftPlayers.map((player, index) => {
        if (index !== activeIndex)
            return player;
        return Object.assign(Object.assign({}, player), { pool: nextPool });
    });
}
function createDailyDraftPlayers() {
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
    if (isOnlineRoomActive())
        return;
    if (!isDraftPhase || isPassingDraftCards)
        return;
    draftTimerId = window.setInterval(() => {
        draftPickSecondsLeft -= 1;
        if (draftPickSecondsLeft <= 0) {
            draftPickSecondsLeft = 0;
            autoPickDraftCard();
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
    var _a, _b;
    if (isOnlineRoomActive()) {
        const onlinePool = getOnlineDraftDisplayPool();
        const selectedId = getDraftVisualSelectedCardId();
        if (!onlinePool || !selectedId)
            return null;
        return (_a = onlinePool.find((card) => card.id === selectedId)) !== null && _a !== void 0 ? _a : null;
    }
    const currentPlayer = getCurrentDraftPlayer();
    if (!currentPlayer || !draftSelectedCardId)
        return null;
    return (_b = currentPlayer.pool.find((card) => card.id === draftSelectedCardId)) !== null && _b !== void 0 ? _b : null;
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
    const leftoverDraftCards = draftPlayers.reduce((cards, player) => {
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
function finishDraftPick(cardId) {
    var _a;
    if (!isDraftPhase || isPassingDraftCards)
        return;
    const activeIndex = getActiveDraftPlayerIndex();
    const pickResults = [];
    if (isSinglePlayerLocalDraftMode()) {
        const currentPlayer = getCurrentDraftPlayer();
        if (!currentPlayer || currentPlayer.pool.length === 0) {
            completeDailyDraftPhase();
            return;
        }
        const chosenCard = (_a = currentPlayer.pool.find((card) => card.id === cardId)) !== null && _a !== void 0 ? _a : pickRandomCard(currentPlayer.pool);
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
            if (playerIndex !== activeIndex)
                return player;
            return Object.assign(Object.assign({}, player), { picked: [...player.picked, chosenCard], pool: player.pool.filter((card) => card.id !== chosenCard.id) });
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
        var _a;
        if (player.pool.length === 0)
            return player;
        const chosenCard = playerIndex === activeIndex
            ? (_a = player.pool.find((card) => card.id === cardId)) !== null && _a !== void 0 ? _a : pickRandomCard(player.pool)
            : pickRandomCard(player.pool);
        if (!chosenCard)
            return player;
        pickResults.push({
            playerIndex,
            pickedCard: chosenCard,
        });
        return Object.assign(Object.assign({}, player), { picked: [...player.picked, chosenCard], pool: player.pool.filter((card) => card.id !== chosenCard.id) });
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
    finishDraftPick(draftSelectedCardId !== null && draftSelectedCardId !== void 0 ? draftSelectedCardId : null);
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
function renderDailyDraftCard(card, index) {
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
    const waitBanner = document.querySelector(".draft-center-wait-banner");
    if (waitBanner) {
        waitBanner.style.display = shouldShowDraftWaitBanner() ? "" : "none";
    }
    updateDraftConfirmButtonVisualOnly();
}
function removeDraftPickFlyLayer() {
    document.querySelectorAll(".draft-pick-fly-layer").forEach((element) => element.remove());
}
function ensureDraftPickFlyLayer() {
    let layer = document.querySelector(".draft-pick-fly-layer");
    if (!layer) {
        layer = document.createElement("div");
        layer.className = "draft-pick-fly-layer";
        document.body.appendChild(layer);
    }
    return layer;
}
function clampDraftPickFlyScale(scale) {
    return Math.max(0.85, Math.min(1.2, scale));
}
function computeDraftPickFlyScaleEnd(fromRect, toRect) {
    if (fromRect.width <= 0)
        return 1;
    return clampDraftPickFlyScale(toRect.width / fromRect.width);
}
function shouldHideDraftPoolSlot(cardId) {
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
function animateDraftPickFly(fromRect, toRect, sourceInnerHtml, scaleEnd, options) {
    var _a, _b, _c, _d, _e;
    const layer = ensureDraftPickFlyLayer();
    const { cardW, cardH } = readDraftHandCardMetrics();
    const flyWidth = (_a = options === null || options === void 0 ? void 0 : options.flyWidth) !== null && _a !== void 0 ? _a : cardW;
    const flyHeight = (_b = options === null || options === void 0 ? void 0 : options.flyHeight) !== null && _b !== void 0 ? _b : cardH;
    const fromCx = fromRect.left + fromRect.width / 2;
    const fromCy = fromRect.top + fromRect.height / 2;
    const toCx = toRect.left + toRect.width / 2;
    const toCy = toRect.top + toRect.height / 2;
    const scaleStart = (_c = options === null || options === void 0 ? void 0 : options.scaleStart) !== null && _c !== void 0 ? _c : 1;
    const rotateStart = (_d = options === null || options === void 0 ? void 0 : options.rotateStart) !== null && _d !== void 0 ? _d : 0;
    const rotateEnd = (_e = options === null || options === void 0 ? void 0 : options.rotateEnd) !== null && _e !== void 0 ? _e : 0;
    const fly = document.createElement("div");
    fly.className = "draft-pick-fly-card";
    if ((options === null || options === void 0 ? void 0 : options.direction) === "to-pool") {
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
            if (settled)
                return;
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
function playDraftPickFlyToHand(cardId) {
    return __awaiter(this, void 0, void 0, function* () {
        const card = findCardInDraftPool(cardId);
        if (!card) {
            revertDraftPickFlyToHand(cardId);
            return;
        }
        const wrapper = getDraftCenterCardWrapper(cardId);
        const poolCard = wrapper === null || wrapper === void 0 ? void 0 : wrapper.querySelector(".hand-card");
        const fromRect = poolCard === null || poolCard === void 0 ? void 0 : poolCard.getBoundingClientRect();
        const sourceHtml = poolCard === null || poolCard === void 0 ? void 0 : poolCard.outerHTML;
        if (!fromRect || !sourceHtml || !poolCard || !wrapper || fromRect.width <= 0 || fromRect.height <= 0) {
            revertDraftPickFlyToHand(cardId);
            return;
        }
        draftHandPendingCardId = cardId;
        wrapper.classList.add("draft-center-card-wrapper--flown-to-hand");
        updateDraftPoolFlownVisualOnly();
        updateDraftHandVisualOnly({ hiddenPendingMeasure: true });
        yield new Promise((resolve) => {
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
        });
        const toTarget = getDraftHandFlyTargetForPending();
        if (!toTarget) {
            revertDraftPickFlyToHand(cardId);
            return;
        }
        const poolScaleStart = clampDraftPickFlyScale(fromRect.width / readDraftHandCardMetrics().cardW);
        yield animateDraftPickFly(fromRect, toTarget.rect, sourceHtml, DRAFT_HAND_PICK_SCALE, {
            direction: "to-hand",
            scaleStart: poolScaleStart,
            rotateStart: 0,
            rotateEnd: toTarget.rotate,
            flyWidth: readDraftHandCardMetrics().cardW,
            flyHeight: readDraftHandCardMetrics().cardH,
        });
        updateDraftHandVisualOnly();
    });
}
function playDraftPickFlyToPool(cardId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const handCard = document.querySelector(`[data-draft-hand-card-id="${cardId}"]`);
        const sourceInnerHtml = handCard === null || handCard === void 0 ? void 0 : handCard.outerHTML;
        const handFlySource = handCard ? getDraftHandFlySourceFromElement(handCard) : null;
        const fromRect = (_a = handFlySource === null || handFlySource === void 0 ? void 0 : handFlySource.rect) !== null && _a !== void 0 ? _a : handCard === null || handCard === void 0 ? void 0 : handCard.getBoundingClientRect();
        if (!fromRect || !sourceInnerHtml || !handCard || fromRect.width <= 0 || fromRect.height <= 0) {
            return;
        }
        handCard.classList.add("hand-card--picked-pending-hidden");
        draftPoolFlyReturnCardId = cardId;
        updateDraftPoolFlownVisualOnly();
        const wrapper = getDraftCenterCardWrapper(cardId);
        const poolCard = wrapper === null || wrapper === void 0 ? void 0 : wrapper.querySelector(".hand-card");
        const poolTargetRect = (_b = poolCard === null || poolCard === void 0 ? void 0 : poolCard.getBoundingClientRect()) !== null && _b !== void 0 ? _b : wrapper === null || wrapper === void 0 ? void 0 : wrapper.getBoundingClientRect();
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
            yield animateDraftPickFly(fromRect, poolTargetRect, sourceInnerHtml, poolScaleEnd, {
                direction: "to-pool",
                scaleStart: DRAFT_HAND_PICK_SCALE,
                rotateStart: (_c = handFlySource === null || handFlySource === void 0 ? void 0 : handFlySource.rotate) !== null && _c !== void 0 ? _c : 0,
                rotateEnd: 0,
                flyWidth: cardW,
                flyHeight: cardH,
            });
        }
        finally {
            draftHandPendingCardId = null;
            draftPoolFlyReturnCardId = null;
            updateDraftHandVisualOnly();
            updateDraftPoolFlownVisualOnly();
        }
    });
}
function playDraftPickSwap(fromCardId, toCardId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const fromHandEl = document.querySelector(`[data-draft-hand-card-id="${fromCardId}"]`);
        const fromHandFlySource = fromHandEl ? getDraftHandFlySourceFromElement(fromHandEl) : null;
        const fromRect = (_a = fromHandFlySource === null || fromHandFlySource === void 0 ? void 0 : fromHandFlySource.rect) !== null && _a !== void 0 ? _a : fromHandEl === null || fromHandEl === void 0 ? void 0 : fromHandEl.getBoundingClientRect();
        const fromHtml = fromHandEl === null || fromHandEl === void 0 ? void 0 : fromHandEl.outerHTML;
        const toPoolWrapper = getDraftCenterCardWrapper(toCardId);
        const toPoolCard = toPoolWrapper === null || toPoolWrapper === void 0 ? void 0 : toPoolWrapper.querySelector(".hand-card");
        const toPoolRect = toPoolCard === null || toPoolCard === void 0 ? void 0 : toPoolCard.getBoundingClientRect();
        const toPoolHtml = toPoolCard === null || toPoolCard === void 0 ? void 0 : toPoolCard.outerHTML;
        const fromPoolWrapper = getDraftCenterCardWrapper(fromCardId);
        const fromPoolCard = fromPoolWrapper === null || fromPoolWrapper === void 0 ? void 0 : fromPoolWrapper.querySelector(".hand-card");
        const fromPoolRect = fromPoolCard === null || fromPoolCard === void 0 ? void 0 : fromPoolCard.getBoundingClientRect();
        const fromPoolHtml = fromPoolCard === null || fromPoolCard === void 0 ? void 0 : fromPoolCard.outerHTML;
        if (!fromRect ||
            !fromHtml ||
            !toPoolRect ||
            !toPoolHtml ||
            !fromPoolRect ||
            !fromPoolHtml ||
            !fromHandEl ||
            fromRect.width <= 0 ||
            toPoolRect.width <= 0 ||
            fromPoolRect.width <= 0) {
            return;
        }
        fromHandEl.classList.add("hand-card--picked-pending-hidden");
        draftHandPendingCardId = toCardId;
        draftPoolFlyReturnCardId = fromCardId;
        updateDraftPoolFlownVisualOnly();
        updateDraftHandVisualOnly({ hiddenPendingMeasure: true });
        yield new Promise((resolve) => {
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
            yield Promise.all([
                animateDraftPickFly(fromRect, fromPoolRect, fromHtml, returnScaleEnd, {
                    direction: "to-pool",
                    scaleStart: DRAFT_HAND_PICK_SCALE,
                    rotateStart: (_b = fromHandFlySource === null || fromHandFlySource === void 0 ? void 0 : fromHandFlySource.rotate) !== null && _b !== void 0 ? _b : 0,
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
        }
        finally {
            draftPoolFlyReturnCardId = null;
            updateDraftHandVisualOnly();
            updateDraftPoolFlownVisualOnly();
        }
    });
}
function updateDraftHandVisualOnly(options) {
    const cardsEl = document.querySelector(".player-hand__cards--draft");
    if (!cardsEl)
        return;
    const count = getDraftHandDisplayCount();
    cardsEl.className = `player-hand__cards player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${count}`;
    cardsEl.innerHTML = renderPickedDraftCards(options);
}
function updateDraftPoolFlownVisualOnly() {
    document.querySelectorAll(".draft-center-card-wrapper").forEach((wrapper) => {
        const cardEl = wrapper.querySelector(".draft-center-card[data-draft-card-id]");
        const cardId = cardEl === null || cardEl === void 0 ? void 0 : cardEl.dataset.draftCardId;
        if (!cardId)
            return;
        wrapper.classList.remove("draft-center-card-wrapper--selected");
        wrapper.classList.toggle("draft-center-card-wrapper--flown-to-hand", shouldHideDraftPoolSlot(cardId));
        cardEl.style.removeProperty("z-index");
        cardEl.style.removeProperty("isolation");
        const innerCard = cardEl.querySelector(".hand-card");
        innerCard === null || innerCard === void 0 ? void 0 : innerCard.classList.remove("hand-card--draft-selected");
        innerCard === null || innerCard === void 0 ? void 0 : innerCard.style.removeProperty("z-index");
        innerCard === null || innerCard === void 0 ? void 0 : innerCard.style.removeProperty("position");
        const button = wrapper.querySelector(".draft-center-btn");
        if (button) {
            button.textContent = "CHỌN";
            button.classList.remove("daily-draft-card--selected");
            button.style.removeProperty("z-index");
            button.style.removeProperty("isolation");
        }
    });
}
function handleDraftPickSelectionChange(prevPending, nextSelected, cardId) {
    return __awaiter(this, void 0, void 0, function* () {
        isDraftPickFlying = true;
        let didChangeHand = false;
        try {
            if (!nextSelected) {
                if (prevPending) {
                    yield playDraftPickFlyToPool(prevPending);
                    didChangeHand = true;
                }
            }
            else if (!prevPending) {
                yield playDraftPickFlyToHand(nextSelected);
                didChangeHand = draftHandPendingCardId === nextSelected;
            }
            else if (prevPending !== nextSelected) {
                yield playDraftPickSwap(prevPending, nextSelected);
                didChangeHand = draftHandPendingCardId === nextSelected;
            }
            if (didChangeHand) {
                updateDraftHandVisualOnly();
            }
            updateDraftSelectedVisualOnly();
            if (isOnlineRoomActive()) {
                selectOnlineDraftCard(cardId);
            }
        }
        finally {
            isDraftPickFlying = false;
            updateDraftConfirmButtonVisualOnly();
        }
    });
}
function selectDraftCard(cardId) {
    if (!isDraftPhase)
        return;
    if (isDraftPickFlying || isPassingDraftCards || isDraftDealVisualActive()) {
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
    var _a;
    if (!isDraftPhase)
        return;
    if (isDraftPickFlying ||
        isPassingDraftCards ||
        !(draftHandPendingCardId || draftSelectedCardId)) {
        return;
    }
    const cardId = draftSelectedCardId !== null && draftSelectedCardId !== void 0 ? draftSelectedCardId : draftHandPendingCardId;
    if (!cardId)
        return;
    if (isOnlineRoomActive()) {
        const snapshot = (_a = onlineDraftPassSnapshotPool !== null && onlineDraftPassSnapshotPool !== void 0 ? onlineDraftPassSnapshotPool : onlineDraftDisplayPool) !== null && _a !== void 0 ? _a : getOnlineSelfDraftPool();
        if ((snapshot === null || snapshot === void 0 ? void 0 : snapshot.length) &&
            !isPassingDraftCards &&
            !isOnlineFinalDraftReturnAnimating) {
            beginOnlineDraftPoolPass(snapshot, null);
            rerenderGameShell();
            shouldActivateOnlinePassAnimation = false;
            activateDraftCenterPoolPassAnimation();
        }
        confirmOnlineDraftPick();
        return;
    }
    finishDraftPick(cardId);
}
function selectHandCard(cardId) {
    if (isDraftPhase || isSimulationMode || isInitialDealInProgress)
        return;
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
    if (isDraftPhase)
        return;
    selectedHandCardId = null;
    draggedHandCardId = null;
    focusedHandCardId = null;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    rerenderArena();
}
function formatTurnTimer(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    const secondsText = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
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
    if (isOnlineRoomActive())
        return;
    if (isSimulationMode || isDraftPhase)
        return;
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
    startDraftCenterDealAnimation();
}
function ensureOnlineDraftDealAnimationStarted() {
    if (!isOnlineRoomActive() || !isDraftPhase || !isInitialDealInProgress)
        return;
    const handElement = document.querySelector(".player-hand--draft.player-hand--dealing");
    if (!handElement || handElement.classList.contains("deal-active"))
        return;
    handElement.classList.add("deal-active");
}
function applyDraftReturnGatherVars(cards, gatherCenterX, gatherCenterY, deckInsertX, deckInsertY) {
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
        card.style.setProperty("--deck-in-x", `${deckX}px`);
        card.style.setProperty("--deck-in-y", `${deckY}px`);
        card.style.setProperty("--deck-r", `${-6 + stackOffset * 3}deg`);
    });
}
function activateDraftCenterPoolPassAnimation() {
    playGameSound("returnDeck");
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            var _a, _b;
            const overlayElement = (_a = document.querySelector(".draft-center-overlay--passing:not(.draft-center-overlay--returning)")) !== null && _a !== void 0 ? _a : document.querySelector(".draft-center-overlay:not(.draft-center-overlay--returning)");
            const deckStackElement = document.querySelector(".deck-card-stack");
            if (!overlayElement || !deckStackElement)
                return;
            const passingCards = Array.from(overlayElement.querySelectorAll(".draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)"));
            if (passingCards.length === 0)
                return;
            overlayElement.classList.add("draft-center-overlay--passing");
            const overlayRect = overlayElement.getBoundingClientRect();
            const deckRect = deckStackElement.getBoundingClientRect();
            const gatherCenterX = overlayRect.left + overlayRect.width * 0.5;
            const gatherCenterY = overlayRect.top + overlayRect.height * 0.38;
            const deckInsertX = deckRect.left + deckRect.width * 0.34;
            const deckInsertY = deckRect.top + deckRect.height * 0.54;
            applyDraftReturnGatherVars(passingCards, gatherCenterX, gatherCenterY, deckInsertX, deckInsertY);
            (_b = deckStackElement.closest(".deck-pile-panel")) === null || _b === void 0 ? void 0 : _b.classList.add("deck-receiving");
            overlayElement.classList.add("pass-active");
        });
    });
}
function activateDraftPassAnimation() {
    playGameSound("returnDeck");
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            var _a;
            const handCardsElement = document.querySelector(".player-hand__cards.is-passing");
            const deckStackElement = document.querySelector(".deck-card-stack");
            if (!handCardsElement || !deckStackElement)
                return;
            const passingCards = Array.from(handCardsElement.querySelectorAll(".draft-deal-slot:not(.daily-draft-card--selected)"));
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
            (_a = deckStackElement.closest(".deck-pile-panel")) === null || _a === void 0 ? void 0 : _a.classList.add("deck-receiving");
            handCardsElement.classList.add("pass-active");
        });
    });
}
function activateDraftCenterReturnAnimation() {
    playGameSound("returnDeck");
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            var _a;
            const overlayElement = document.querySelector(".draft-center-overlay--returning");
            const deckStackElement = document.querySelector(".deck-card-stack");
            if (!overlayElement || !deckStackElement)
                return;
            const returnCards = Array.from(overlayElement.querySelectorAll(".draft-center-card-wrapper--return"));
            const overlayRect = overlayElement.getBoundingClientRect();
            const deckRect = deckStackElement.getBoundingClientRect();
            const gatherCenterX = overlayRect.left + overlayRect.width * 0.5;
            const gatherCenterY = overlayRect.top + overlayRect.height * 0.38;
            const deckInsertX = deckRect.left + deckRect.width * 0.34;
            const deckInsertY = deckRect.top + deckRect.height * 0.54;
            applyDraftReturnGatherVars(returnCards, gatherCenterX, gatherCenterY, deckInsertX, deckInsertY);
            (_a = deckStackElement.closest(".deck-pile-panel")) === null || _a === void 0 ? void 0 : _a.classList.add("deck-receiving");
            overlayElement.classList.add("pass-active");
        });
    });
}
function finishDraftDealWithoutFullRerender() {
    isInitialDealInProgress = false;
    dailyDealTimerId = null;
    const handElement = document.querySelector(".player-hand");
    handElement === null || handElement === void 0 ? void 0 : handElement.classList.remove("player-hand--dealing", "is-dealing", "deal-active");
    const handMeta = handElement === null || handElement === void 0 ? void 0 : handElement.querySelector(".player-hand__meta");
    if (handMeta) {
        handMeta.textContent = isDraftPickTimerFrozen()
            ? "Đang chia bài..."
            : `Còn ${getDraftTimerDisplayLabel()} • bấm 1 lá để chọn`;
    }
    const draftInfo = handElement === null || handElement === void 0 ? void 0 : handElement.querySelector(".draft-hand-meta__info em");
    if (draftInfo) {
        draftInfo.textContent = "Nếu không chọn, hết giờ sẽ chọn ngẫu nhiên.";
    }
    startDraftTimer();
}
function finishOnlineDraftDealVisualOnly() {
    isInitialDealInProgress = false;
    onlineDraftAnimationTimerId = null;
    const handElement = document.querySelector(".player-hand");
    handElement === null || handElement === void 0 ? void 0 : handElement.classList.remove("player-hand--dealing", "is-dealing", "deal-active");
    const handMeta = handElement === null || handElement === void 0 ? void 0 : handElement.querySelector(".player-hand__meta");
    if (handMeta) {
        handMeta.textContent = isDraftPickTimerFrozen()
            ? "Đang chia bài..."
            : `Còn ${getDraftTimerDisplayLabel()} • bấm 1 lá để chọn`;
    }
    const draftInfo = handElement === null || handElement === void 0 ? void 0 : handElement.querySelector(".draft-hand-meta__info em");
    if (draftInfo) {
        draftInfo.textContent = "Bấm để chọn, giữ 0.5s để xem lớn.";
    }
    updateDraftSelectedVisualOnly();
    updateDraftConfirmButtonVisualOnly();
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
        const handElement = document.querySelector(".player-hand:not(.player-hand--draft)");
        handElement === null || handElement === void 0 ? void 0 : handElement.classList.add("planning-deal-active");
    });
    window.setTimeout(() => {
        isInitialDealInProgress = false;
        const handElement = document.querySelector(".player-hand");
        handElement === null || handElement === void 0 ? void 0 : handElement.classList.remove("player-hand--dealing", "is-dealing", "deal-active", "planning-deal-active");
        const handMeta = handElement === null || handElement === void 0 ? void 0 : handElement.querySelector(".player-hand__meta");
        if (handMeta) {
            handMeta.textContent = "Giữ 0.5s để xem lớn";
        }
    }, 1760);
}
function playDraftDealAnimationAndStartTimer() {
    stopDraftTimer();
    clearDailyDealTimer();
    isInitialDealInProgress = true;
    draftSelectedCardId = null;
    rerenderArena();
    startDraftCenterDealAnimation();
    /*
      CSS draft deal 7 lá: animation chạy trực tiếp trên 7 wrapper.
      Không rerender toàn arena ở frame cuối; chỉ gỡ class để tránh snap/jank.
    */
    dailyDealTimerId = window.setTimeout(() => {
        finishDraftDealWithoutFullRerender();
    }, DRAFT_CENTER_DEAL_TOTAL_MS);
}
function finishDailyDealAndStartTimer() {
    clearDailyDealTimer();
    dailyDealTimerId = window.setTimeout(() => {
        isInitialDealInProgress = false;
        dailyDealTimerId = null;
        const handElement = document.querySelector(".player-hand");
        handElement === null || handElement === void 0 ? void 0 : handElement.classList.remove("player-hand--dealing", "is-dealing", "deal-active");
        const handMeta = handElement === null || handElement === void 0 ? void 0 : handElement.querySelector(".player-hand__meta");
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
    }
    else {
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
function getSimulationEventResourceModifier(result) {
    if (!result) {
        return {
            coin: 0,
            stamina: 0,
        };
    }
    return result.replaySteps.reduce((sum, step) => {
        var _a;
        return {
            coin: sum.coin,
            stamina: sum.stamina + ((_a = step.eventStaminaDelta) !== null && _a !== void 0 ? _a : 0),
        };
    }, {
        coin: 0,
        stamina: 0,
    });
}
function getSimulationEventStaminaPenalty(result) {
    const modifier = getSimulationEventResourceModifier(result);
    return Math.abs(Math.min(0, modifier.stamina));
}
function applyDailyScoreOnce() {
    if (!simulationResult || hasAppliedSimulationScore)
        return;
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
        if (!simulationResult)
            return;
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
    playSimulationScanSoundForCurrentStep();
    simulationReplayTimerId = window.setInterval(() => {
        if (!simulationResult)
            return;
        if (simulationReplayIndex >= simulationResult.replaySteps.length - 1) {
            simulationReplayIndex = simulationResult.replaySteps.length - 1;
            isReplayComplete = true;
            /*
              Online: điểm do server cộng khi phase chuyển từ simulation sang result.
              Client chỉ replay animation, không tự cộng điểm để tránh lệch giữa các máy.
            */
            stopSimulationReplayTimer();
            rerenderGameShell();
            return;
        }
        simulationReplayIndex += 1;
        playSimulationScanSoundForCurrentStep();
        rerenderGameShell();
    }, 850);
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
    var _a, _b;
    const breakdown = getCurrentScoreBreakdown();
    const isOnlineLobby = ((_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) === "lobby" || ((_b = onlineClientState.roomState) === null || _b === void 0 ? void 0 : _b.phase) === "cinematic";
    const onlineSelfScore = getOnlineSelfScore();
    const totalScoreToDisplay = onlineSelfScore !== null && onlineSelfScore !== void 0 ? onlineSelfScore : (simulationResult ? getStablePhaseScoreDisplay() : accumulatedVP);
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

      ${isOnlineLobby
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
        : ""}

      ${simulationResult
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
            `}
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

      <div class="resource-orb resource-orb--stamina ${resourceOrbFlashType === "stamina" ? "resource-orb--effect-pulse" : ""}" title="Thể lực hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--stamina">🏃</div>
          <div class="resource-orb__value">${remaining.stamina}</div>
        </div>
        <div class="resource-orb__label">THỂ LỰC</div>
      </div>
    </div>
  `;
}
function getReplayDayEndIndex(dayIndex) {
    if (!simulationResult)
        return -1;
    let endIndex = -1;
    for (let index = 0; index < simulationResult.replaySteps.length; index += 1) {
        if (simulationResult.replaySteps[index].dayIndex === dayIndex) {
            endIndex = index;
        }
    }
    return endIndex;
}
function shouldShowReplayDay(dayIndex) {
    var _a;
    if (!simulationResult)
        return true;
    const currentStep = getCurrentReplayStep();
    const activeDayIndex = (_a = currentStep === null || currentStep === void 0 ? void 0 : currentStep.dayIndex) !== null && _a !== void 0 ? _a : 0;
    const dayEndIndex = getReplayDayEndIndex(dayIndex);
    if (dayIndex >= activeDayIndex)
        return true;
    if (dayEndIndex < 0)
        return true;
    /*
      Mỗi replay step đang chạy khoảng 850ms.
      Chờ khoảng 3 giây sau khi ngày đã quét xong rồi mới ẩn.
    */
    const stepsAfterDayEnded = simulationReplayIndex - dayEndIndex;
    return stepsAfterDayEnded <= 4;
}
function getReplayDayExitStage(dayIndex) {
    var _a;
    if (!simulationResult)
        return 0;
    const currentStep = getCurrentReplayStep();
    const activeDayIndex = (_a = currentStep === null || currentStep === void 0 ? void 0 : currentStep.dayIndex) !== null && _a !== void 0 ? _a : 0;
    const dayEndIndex = getReplayDayEndIndex(dayIndex);
    if (dayIndex >= activeDayIndex)
        return 0;
    if (dayEndIndex < 0)
        return 0;
    const stepsAfterDayEnded = simulationReplayIndex - dayEndIndex;
    if (stepsAfterDayEnded <= 0)
        return 0;
    if (stepsAfterDayEnded <= 4)
        return stepsAfterDayEnded;
    return 5;
}
function getReplayDayRailClass(dayIndex, activeDayIndex) {
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
    var _a, _b;
    if (!isOnlineGameOver())
        return "";
    const rankings = getOnlineFinalRankings();
    const selfPlayerId = onlineClientState.playerId;
    return `
    <section class="final-ranking-panel">
      <div class="final-ranking-panel__header">
        <span>KẾT THÚC PHASE</span>
        <h2>Bảng xếp hạng cuối cùng</h2>
        <p>Hết 5 ngày. BXH sẽ tự đóng sau ${(_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.timer) !== null && _b !== void 0 ? _b : 10}s để qua Phase ${phaseNumber + 1}.</p>
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
        ${phaseNumber >= 3
        ? "Đã kết thúc Phase 3. Đây là kết quả cuối của game."
        : `Đang chuẩn bị chuyển sang Phase ${phaseNumber + 1}...`}
      </div>
    </section>
  `;
}
import { rememberCurrentCertificatePhase, downloadTravelCertificateHtml, downloadTravelTimeline, copyTravelTimelineToClipboard } from "./export/certificate.js";
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
function formatSignedVP(value) {
    if (value > 0)
        return `+${value} VP`;
    if (value < 0)
        return `${value} VP`;
    return "0 VP";
}
function getCurrentReplayPartialVP() {
    if (!simulationResult)
        return 0;
    return simulationResult.replaySteps
        .slice(0, simulationReplayIndex + 1)
        .reduce((sum, step) => sum + step.vpDelta, 0);
}
function getPhaseScoreBeforeCurrentSimulation() {
    if (!simulationResult)
        return accumulatedVP;
    /*
      Khi applyDailyScoreOnce đã chạy, accumulatedVP đã là điểm sau ngày hiện tại.
      Muốn preview không cộng/trừ 2 lần thì phải lùi lại finalVP.
    */
    return hasAppliedSimulationScore
        ? accumulatedVP - simulationResult.finalVP
        : accumulatedVP;
}
function getPhaseScorePreview() {
    if (!simulationResult)
        return accumulatedVP;
    const baseScore = getPhaseScoreBeforeCurrentSimulation();
    const currentDayDelta = isReplayComplete
        ? simulationResult.finalVP
        : getCurrentReplayPartialVP();
    return baseScore + currentDayDelta;
}
function getStablePhaseScoreDisplay() {
    if (!simulationResult)
        return accumulatedVP;
    /*
      Tránh hiện tượng điểm tổng nhảy trong lúc đang scan:
      - Điểm ngày có thể lên/xuống theo từng ô.
      - Tổng phase chỉ đổi sau khi replay kết thúc và applyDailyScoreOnce chạy.
    */
    return isReplayComplete
        ? accumulatedVP
        : getPhaseScoreBeforeCurrentSimulation();
}
function renderSimulationResultPanel() {
    if (!simulationResult)
        return "";
    const result = simulationResult;
    const currentStep = getCurrentReplayStep();
    const totalSteps = Math.max(1, result.replaySteps.length);
    const currentStepNumber = Math.min(simulationReplayIndex + 1, totalSteps);
    const currentDayDelta = isReplayComplete
        ? result.finalVP
        : getCurrentReplayPartialVP();
    const ticketStepWidth = 366;
    const firstTicketCenter = 223;
    const endCenterBoost = simulationReplayIndex === totalSteps - 1
        ? 460
        : simulationReplayIndex === totalSteps - 2
            ? 180
            : 0;
    const trackOffset = firstTicketCenter + simulationReplayIndex * ticketStepWidth + endCenterBoost;
    const getEventIcon = (eventType) => {
        if (eventType === "storm")
            return "⛈";
        if (eventType === "traffic")
            return "🚦";
        if (eventType === "distance")
            return "🧭";
        if (eventType === "promo")
            return "🏷";
        return "✦";
    };
    const getEventTitle = (step) => {
        if (step.eventText)
            return step.eventText;
        if (step.eventType === "storm")
            return "Mưa giông";
        if (step.eventType === "traffic")
            return "Kẹt xe";
        if (step.eventType === "distance")
            return "Xa tuyến";
        if (step.eventType === "promo")
            return "Ưu đãi";
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
          style="transform: translateX(calc(50% - ${trackOffset}px)); --scan-index: ${simulationReplayIndex};"
        >
          ${result.replaySteps
        .map((step, stepIndex) => {
        const isLastTicket = stepIndex === totalSteps - 1;
        const shouldTearImmediately = !isReplayComplete && isLastTicket && stepIndex === simulationReplayIndex;
        const isActive = !isReplayComplete && stepIndex === simulationReplayIndex && !shouldTearImmediately;
        const isDone = isReplayComplete || stepIndex < simulationReplayIndex || shouldTearImmediately;
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

                  ${step.comboText
            ? `<div class="score-ticket__combo">COMBO</div>`
            : ""}

                  ${hasEvent
            ? `
                        <div class="score-ticket__stamp">
                          <b>${getEventIcon(step.eventType)}</b>
                          <span>${eventTitle}</span>
                        </div>
                      `
            : ""}

                  <div class="score-ticket__tear-mark"></div>
                </article>

                ${stepIndex < result.replaySteps.length - 1
            ? `<div class="score-ticket-connector ${stepIndex < simulationReplayIndex ? "is-passed" : ""}"></div>`
            : ""}
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

        ${isReplayComplete
        ? `
              <div class="ticket-scan-overlay__complete">
                <span>Hoàn tất</span>
                <strong>${getPhaseScoreBeforeCurrentSimulation()} → ${getPhaseScorePreview()} VP</strong>
              </div>
            `
        : ""}
      </div>
    </section>
  `;
}
function getReplayStepForBoardCell(rowIndex, colIndex) {
    var _a;
    if (!simulationResult)
        return null;
    const stepIndex = simulationResult.replaySteps.findIndex((step) => step.rowIndex === rowIndex && step.dayIndex === colIndex);
    if (stepIndex < 0 || stepIndex > simulationReplayIndex) {
        return null;
    }
    return (_a = simulationResult.replaySteps[stepIndex]) !== null && _a !== void 0 ? _a : null;
}
function getBoardCellReplayClass(rowIndex, colIndex) {
    if (!simulationResult || colIndex !== currentDayIndex)
        return "";
    const currentStep = getCurrentReplayStep();
    const isCurrent = (currentStep === null || currentStep === void 0 ? void 0 : currentStep.rowIndex) === rowIndex && (currentStep === null || currentStep === void 0 ? void 0 : currentStep.dayIndex) === colIndex;
    const stepIndex = simulationResult.replaySteps.findIndex((step) => step.rowIndex === rowIndex && step.dayIndex === colIndex);
    const step = stepIndex >= 0 ? simulationResult.replaySteps[stepIndex] : null;
    const isProcessed = stepIndex >= 0 && stepIndex < simulationReplayIndex;
    const eventClass = (step === null || step === void 0 ? void 0 : step.eventType) && stepIndex <= simulationReplayIndex
        ? `board-cell--event-${step.eventType}`
        : "";
    if (isCurrent)
        return `board-cell--replay-current ${eventClass}`.trim();
    if (isProcessed)
        return `board-cell--replay-done ${eventClass}`.trim();
    return "board-cell--replay-pending";
}
let isDebtTokenModalOpen = false;
let debtTokenModalNotice = "";
function getCurrentCoinDebtAmount() {
    var _a;
    if (isOnlineRoomActive()) {
        const onlineSelf = getOnlineSelfPublicPlayer();
        return Math.max(0, (_a = onlineSelf === null || onlineSelf === void 0 ? void 0 : onlineSelf.coinDebt) !== null && _a !== void 0 ? _a : 0);
    }
    return Math.max(0, localCoinDebt);
}
function openDebtTokenModal() {
    if (getCurrentCoinDebtAmount() <= 0)
        return;
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
    eventResourceModifier = Object.assign(Object.assign({}, eventResourceModifier), { coin: eventResourceModifier.coin - payableAmount });
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
    if (!isDebtTokenModalOpen)
        return "";
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

          ${debtTokenModalNotice
        ? `<div class="effect-token-modal__notice">${debtTokenModalNotice}</div>`
        : ""}
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
    const effectTokens = [];
    const coinDebt = getCurrentCoinDebtAmount();
    if (coinDebt > 0) {
        effectTokens.push(`
      <button
        type="button"
        class="player-effect-seal player-effect-seal--debt"
        onclick="event.stopPropagation(); window.openDebtTokenModal()"
        aria-label="Token nợ: ${coinDebt} xu"
      >
        <span class="player-effect-seal__surface">
          <span class="player-effect-seal__ring"></span>

          <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${renderDebtSealGlyph()}</span>
        </span>

        <span class="player-effect-seal__count">${coinDebt}</span>
        <span class="player-effect-seal__hover-label">TOKEN NỢ</span>
      </button>
    `);
    }
    if (!effectTokens.length) {
        return `
      <div class="player-effect-dock player-effect-dock--empty">
        <div class="player-effect-dock__placeholder">✨ No active effects</div>
      </div>
    `;
    }
    return `
    <div class="player-effect-dock">
      ${effectTokens.join("")}
    </div>
  `;
}
function renderDeckPilePanel() {
    var _a, _b;
    const deckCount = isOnlineRoomActive() ? 0 : deck.length;
    const handCount = (_b = (_a = (isOnlineRoomActive() ? getOnlineSelfHand() : null)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : playerHand.length;
    const canConfirm = !!(draftHandPendingCardId || draftSelectedCardId) &&
        !isDraftPickFlying &&
        !isPassingDraftCards &&
        !isDraftDealVisualActive();
    const draftConfirmButton = isDraftPhase
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
    return `
    <section
      class="deck-pile-panel"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      ${renderPlayerEffectTokens()}

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

      ${draftConfirmButton}

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
function renderMainArena() {
    var _a;
    const focusedCard = (_a = getHandCardById(focusedHandCardId)) !== null && _a !== void 0 ? _a : focusedBoardCard;
    return `
    <main class="arena ${isOnlineGameOver() ? "arena--gameover" : ""} ${isSimulationMode ? "arena--scanning" : ""}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${getDisplayPlayerName()}</h1>
          </div>
        </div>

        ${renderScoreBreakdownPanel()}
      </div>


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
            const isPlaceable = !isDraftPhase && !isSimulationMode && !isInitialDealInProgress && isCurrentDayColumn && selectedHandCardId !== null && card === null;
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
          ${renderDraftCenterOverlay()}${renderDraftLeftoverReturnOverlay()}
        </div>

        ${isOnlineGameOver() ? renderFinalRankingPanel() : isDraftPhase ? "" : renderSimulationResultPanel()}

        ${isSimulationMode
        ? ""
        : `
              <section
          class="player-hand ${isDraftPhase ? "player-hand--draft" : ""} ${!isDraftPhase && isInitialDealInProgress ? "player-hand--dealing is-dealing" : ""}"
          onclick="${isDraftPhase ? "" : "clearSelectedHandCard()"}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${isDraftPhase ? "DRAFT" : "HAND"}</span>
              <h2>
                ${isDraftPhase
            ? `Chọn bài ngày ${days[currentDayIndex]}`
            : `Bài ngày ${days[currentDayIndex]}`}
              </h2>
            </div>

            <div class="player-hand__meta ${isDraftPhase && isDraftTimerDanger() ? "player-hand__meta--danger" : ""}">
              ${isDraftPhase
            ? isDraftPickTimerFrozen()
                ? "Đang chia bài..."
                : `Còn ${draftPickSecondsLeft}s • ${isPassingDraftCards ? "Đang chuyền bài..." : "bấm 1 lá để chọn"}`
            : isInitialDealInProgress
                ? "Đang chia bài..."
                : "Giữ 0.5s để xem lớn"}
            </div>
          </div>

          ${isDraftPhase ? renderDraftHandTopMeta() : ""}

          <div class="player-hand__cards ${isDraftPhase ? `player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${getDraftHandDisplayCount()}` : ""}">
            ${isDraftPhase ? renderPickedDraftCards() : playerHand.map((card, index) => renderHandCard(card, index)).join("")}
          </div>
        </section>
            `}
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
function spawnFloatingText(selector, delta, type) {
    const container = document.querySelector(selector);
    if (!container)
        return;
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
    if (!arena)
        return;
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
function placeHandCardOnBoard(cardId, rowIndex, colIndex) {
    if (isSimulationMode || isInitialDealInProgress)
        return;
    if (colIndex !== currentDayIndex)
        return;
    if (!canPlaceOnBoardCell(rowIndex, colIndex))
        return;
    const handIndex = playerHand.findIndex((card) => card.id === cardId);
    if (handIndex === -1)
        return;
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
        if ((lastPlacedBoardPosition === null || lastPlacedBoardPosition === void 0 ? void 0 : lastPlacedBoardPosition.rowIndex) === rowIndex &&
            (lastPlacedBoardPosition === null || lastPlacedBoardPosition === void 0 ? void 0 : lastPlacedBoardPosition.colIndex) === colIndex) {
            lastPlacedBoardPosition = null;
            rerenderArena();
        }
    }, 420);
}
function placeSelectedHandCard(rowIndex, colIndex) {
    if (!selectedHandCardId)
        return;
    placeHandCardOnBoard(selectedHandCardId, rowIndex, colIndex);
}
function returnFocusedBoardCardToHand() {
    var _a;
    if (isSimulationMode)
        return;
    if (!focusedBoardPosition)
        return;
    const { rowIndex, colIndex } = focusedBoardPosition;
    if (colIndex !== currentDayIndex)
        return;
    const card = (_a = getBoardSlots()[rowIndex]) === null || _a === void 0 ? void 0 : _a[colIndex];
    if (!card || isBoardDebtToken(card) || isBoardLockToken(card))
        return;
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
function beginHandCardVisualDrag(event) {
    if (!handPointerDragState || handPointerDragState.isDragging)
        return;
    clearHoldTimer();
    focusedHandCardId = null;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    suppressNextClick = false;
    const { source } = handPointerDragState;
    const rect = source.getBoundingClientRect();
    const clone = source.cloneNode(true);
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
function updateHandCardDragPosition(event) {
    if (!(handPointerDragState === null || handPointerDragState === void 0 ? void 0 : handPointerDragState.clone))
        return;
    handPointerDragState.clone.style.left = `${event.clientX - handPointerDragState.offsetX}px`;
    handPointerDragState.clone.style.top = `${event.clientY - handPointerDragState.offsetY}px`;
}
function getDropCellFromPointer(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    return element === null || element === void 0 ? void 0 : element.closest("[data-board-drop-cell='true']");
}
function getDeckDiscardTargetFromPointer(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    return element === null || element === void 0 ? void 0 : element.closest("[data-discard-drop-zone='true']");
}
function clearDeckDiscardHoverClass() {
    document
        .querySelectorAll(".deck-pile-panel--discard-hover")
        .forEach((element) => {
        element.classList.remove("deck-pile-panel--discard-hover");
        delete element.dataset.discardCoin;
        delete element.dataset.discardStamina;
    });
}
function canDiscardHandCard() {
    return !isDraftPhase && !isSimulationMode && !isInitialDealInProgress;
}
function discardHandCardToDeck(cardId) {
    if (!canDiscardHandCard())
        return;
    const handIndex = playerHand.findIndex((card) => card.id === cardId);
    if (handIndex === -1)
        return;
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
            playerHand = [...state.self.hand];
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
    var _a;
    clearBoardDragHoverClass();
    clearDeckDiscardHoverClass();
    if (handPointerDragState === null || handPointerDragState === void 0 ? void 0 : handPointerDragState.source) {
        handPointerDragState.source.classList.remove("hand-card--drag-source-hidden");
    }
    (_a = handPointerDragState === null || handPointerDragState === void 0 ? void 0 : handPointerDragState.clone) === null || _a === void 0 ? void 0 : _a.remove();
    handPointerDragState = null;
    draggedHandCardId = null;
    // Valid Slot Highlight Remove
    document.querySelectorAll('.board-cell--placeable').forEach(el => el.classList.remove('board-cell--placeable'));
}
function handleHandPointerMove(event) {
    var _a, _b;
    if (!handPointerDragState)
        return;
    const distanceX = event.clientX - handPointerDragState.startX;
    const distanceY = event.clientY - handPointerDragState.startY;
    const distance = Math.hypot(distanceX, distanceY);
    if (!handPointerDragState.isDragging && distance >= 8) {
        clearHoldTimer();
        beginHandCardVisualDrag(event);
    }
    if (!(handPointerDragState === null || handPointerDragState === void 0 ? void 0 : handPointerDragState.isDragging))
        return;
    event.preventDefault();
    updateHandCardDragPosition(event);
    clearBoardDragHoverClass();
    clearDeckDiscardHoverClass();
    const discardTarget = getDeckDiscardTargetFromPointer(event);
    if (discardTarget && canDiscardHandCard()) {
        const draggedDiscardCard = getHandCardById(draggedHandCardId);
        discardTarget.classList.add("deck-pile-panel--discard-hover");
        discardTarget.dataset.discardCoin = String((_a = draggedDiscardCard === null || draggedDiscardCard === void 0 ? void 0 : draggedDiscardCard.coin) !== null && _a !== void 0 ? _a : 0);
        discardTarget.dataset.discardStamina = String((_b = draggedDiscardCard === null || draggedDiscardCard === void 0 ? void 0 : draggedDiscardCard.stamina) !== null && _b !== void 0 ? _b : 0);
        return;
    }
    const dropCell = getDropCellFromPointer(event);
    if (!dropCell)
        return;
    const rowIndex = Number(dropCell.dataset.rowIndex);
    const colIndex = Number(dropCell.dataset.colIndex);
    const draggedCard = getHandCardById(draggedHandCardId);
    if (Number.isInteger(rowIndex) &&
        Number.isInteger(colIndex) &&
        canPlaceOnBoardCell(rowIndex, colIndex) &&
        draggedCard) {
        /*
          Cho phép thả cả khi không đủ xu/thể lực.
          Khi đặt xuống, game sẽ tự tạo token Nợ / Kiệt sức ở ngày hôm sau.
        */
        dropCell.classList.add("board-cell--drag-hover");
    }
    else {
        dropCell.classList.add("board-cell--drag-invalid");
    }
}
function handleHandPointerUp(event) {
    document.removeEventListener("pointermove", handleHandPointerMove);
    document.removeEventListener("pointerup", handleHandPointerUp);
    document.removeEventListener("pointercancel", handleHandPointerCancel);
    const dragState = handPointerDragState;
    const wasDragging = (dragState === null || dragState === void 0 ? void 0 : dragState.isDragging) === true;
    clearHoldTimer();
    if (!dragState)
        return;
    if (wasDragging) {
        const dropCell = getDropCellFromPointer(event);
        const discardTarget = getDeckDiscardTargetFromPointer(event);
        const rowIndex = Number(dropCell === null || dropCell === void 0 ? void 0 : dropCell.dataset.rowIndex);
        const colIndex = Number(dropCell === null || dropCell === void 0 ? void 0 : dropCell.dataset.colIndex);
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
        if (dropCell &&
            Number.isInteger(rowIndex) &&
            Number.isInteger(colIndex) &&
            canPlaceOnBoardCell(rowIndex, colIndex) &&
            draggedCard) {
            placeHandCardOnBoard(cardId, rowIndex, colIndex);
            return;
        }
        if (dropCell && Number.isInteger(rowIndex) && Number.isInteger(colIndex)) {
            triggerResourceRejectedFeedback(rowIndex, colIndex);
        }
        else {
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
function triggerResourceRejectedFeedback(rowIndex, colIndex) {
    playGameSound("reject");
    const target = rowIndex !== undefined && colIndex !== undefined
        ? document.querySelector(`[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`)
        : document.querySelector(".arena");
    target === null || target === void 0 ? void 0 : target.classList.add("resource-rejected-feedback");
    window.setTimeout(() => {
        target === null || target === void 0 ? void 0 : target.classList.remove("resource-rejected-feedback");
    }, 380);
}
function getDraggedCardIdFromEvent(event) {
    var _a;
    const fromDataTransfer = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain");
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
window.startDragHandCard = (event, id) => {
    var _a;
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
    (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", id);
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
    }
};
window.endDragHandCard = () => {
    clearHoldTimer();
    clearBoardDragHoverClass();
    draggedHandCardId = null;
    window.setTimeout(() => {
        suppressNextClick = false;
    }, 0);
};
window.handleBoardCellDragOver = (event, rowIndex, colIndex) => {
    if (!draggedHandCardId)
        return;
    if (getBoardSlots()[rowIndex][colIndex] !== null)
        return;
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
    }
    const target = event.currentTarget;
    target === null || target === void 0 ? void 0 : target.classList.add("board-cell--drag-hover");
};
window.handleBoardCellDragLeave = (event) => {
    const target = event.currentTarget;
    target === null || target === void 0 ? void 0 : target.classList.remove("board-cell--drag-hover");
};
window.dropHandCardOnBoard = (event, rowIndex, colIndex) => {
    clearHoldTimer();
    clearBoardDragHoverClass();
    const cardId = getDraggedCardIdFromEvent(event);
    draggedHandCardId = null;
    if (!cardId)
        return;
    const card = getHandCardById(cardId);
    if (!canPlaceOnBoardCell(rowIndex, colIndex) || !card) {
        triggerResourceRejectedFeedback(rowIndex, colIndex);
        return;
    }
    placeHandCardOnBoard(cardId, rowIndex, colIndex);
};
window.startHandPointerDrag = (event, id) => {
    if (isInitialDealInProgress)
        return;
    if (isSimulationMode)
        return;
    if (event.button !== 0)
        return;
    didMoveHandPointerDrag = false;
    lastPointerDownCardId = id;
    const card = getHandCardById(id);
    /*
      Không chặn card thiếu tài nguyên nữa.
      Thiếu xu/thể lực vẫn được chọn/kéo để tạo cơ chế Nợ / Kiệt sức.
    */
    if (!card)
        return;
    clearCustomHandDragVisuals();
    const source = event.currentTarget;
    if (!source)
        return;
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
window.openDebtTokenModal = () => {
    openDebtTokenModal();
};
window.closeDebtTokenModal = () => {
    closeDebtTokenModal();
};
window.payCoinDebtFromModal = () => {
    payCurrentCoinDebt();
};
window.selectDraftCard = selectDraftCard;
window.confirmDraftPick = confirmDraftPick;
globalThis.confirmDraftPick = confirmDraftPick;
window.startHoldHandCard = (id) => {
    if (isPassingDraftCards || isInitialDealInProgress)
        return;
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
window.cancelHoldHandCard = () => {
    clearHoldTimer();
};
window.clearSelectedHandCard = () => {
    clearHoldTimer();
    if (selectedHandCardId === null)
        return;
    selectedHandCardId = null;
    rerenderArena();
};
window.handleBoardCellClick = (rowIndex, colIndex) => {
    clearHoldTimer();
    const card = getBoardCardByPosition(rowIndex, colIndex);
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
window.focusBoardCard = (rowIndex, colIndex) => {
    const card = getBoardCardByPosition(rowIndex, colIndex);
    if (!card)
        return;
    focusedHandCardId = null;
    focusedBoardCard = card;
    focusedBoardPosition = { rowIndex, colIndex };
    selectedHandCardId = null;
    suppressNextClick = false;
    rerenderArena();
};
window.runSimulation = () => {
    runSystemSimulation();
};
window.resetSimulation = () => {
    resetTurnForPrototype();
};
window.returnFocusedBoardCardToHand = () => {
    returnFocusedBoardCardToHand();
};
window.closeFocusedHandCard = () => {
    clearHoldTimer();
    focusedHandCardId = null;
    focusedBoardCard = null;
    focusedBoardPosition = null;
    draggedHandCardId = null;
    suppressNextClick = false;
    rerenderArena();
};
function getStaticPlayerById(playerId) {
    var _a;
    const fallbackRankByPlayerId = {
        p1: 1,
        p2: 3,
        p3: 3,
        p4: 3,
    };
    return ((_a = [...playersLeftBase, ...playersRight].find((player) => player.id === playerId)) !== null && _a !== void 0 ? _a : {
        id: playerId,
        rank: fallbackRankByPlayerId[playerId],
        name: playerId.toUpperCase(),
        score: 0,
        coin: STARTING_COIN,
        stamina: STARTING_STAMINA,
        usedSlots: 0,
    });
}
function getVisibleSidePlayersForOnline() {
    const selfPlayerId = onlineClientState.playerId;
    if (!selfPlayerId || !onlineClientState.roomState) {
        return [];
    }
    return playerIds
        .filter((playerId) => {
        var _a;
        if (playerId === selfPlayerId)
            return false;
        const onlinePlayer = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.players[playerId];
        /*
          Trong màn chơi chỉ hiện người chơi đang online.
          Slot trống/offline không render card mini/sidebar nữa, để chỗ đó là khoảng trắng.
          Lobby vẫn hiện OFFLINE để biết ai đã rời phòng.
        */
        return (onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.isConnected) === true;
    })
        .map((playerId) => {
        var _a, _b, _c, _d, _e, _f;
        const staticPlayer = getStaticPlayerById(playerId);
        const onlinePlayer = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.players[playerId];
        return Object.assign(Object.assign({}, staticPlayer), { name: (_b = onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.name) !== null && _b !== void 0 ? _b : staticPlayer.name, score: (_c = onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.score) !== null && _c !== void 0 ? _c : staticPlayer.score, coin: (_d = onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.coin) !== null && _d !== void 0 ? _d : staticPlayer.coin, stamina: (_e = onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.stamina) !== null && _e !== void 0 ? _e : staticPlayer.stamina, usedSlots: (_f = onlinePlayer === null || onlinePlayer === void 0 ? void 0 : onlinePlayer.usedSlots) !== null && _f !== void 0 ? _f : staticPlayer.usedSlots, active: false });
    });
}
function getLeftSidePlayersToRender() {
    if (isOnlineRoomActive()) {
        return getVisibleSidePlayersForOnline().slice(0, 2);
    }
    return getPlayersLeft();
}
function getRightSidePlayersToRender() {
    if (isOnlineRoomActive()) {
        return getVisibleSidePlayersForOnline().slice(2);
    }
    return [playersRight[0]];
}
function getMidGameRankings() {
    const state = onlineClientState.roomState;
    if (!state)
        return [];
    return playerIds
        .map((playerId) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const player = state.players[playerId];
        return {
            playerId,
            name: (_a = player === null || player === void 0 ? void 0 : player.name) !== null && _a !== void 0 ? _a : playerId.toUpperCase(),
            score: (_b = player === null || player === void 0 ? void 0 : player.score) !== null && _b !== void 0 ? _b : 0,
            coin: (_c = player === null || player === void 0 ? void 0 : player.coin) !== null && _c !== void 0 ? _c : STARTING_COIN,
            stamina: (_d = player === null || player === void 0 ? void 0 : player.stamina) !== null && _d !== void 0 ? _d : STARTING_STAMINA,
            usedSlots: (_e = player === null || player === void 0 ? void 0 : player.usedSlots) !== null && _e !== void 0 ? _e : 0,
            isConnected: (_f = player === null || player === void 0 ? void 0 : player.isConnected) !== null && _f !== void 0 ? _f : false,
            hasJoined: (_g = player === null || player === void 0 ? void 0 : player.hasJoined) !== null && _g !== void 0 ? _g : false,
        };
    })
        .filter((player) => player.hasJoined || player.isConnected)
        .sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        if (b.usedSlots !== a.usedSlots)
            return b.usedSlots - a.usedSlots;
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
          ${rankings.length > 0
        ? rankings
            .map((player, index) => {
            const isSelf = player.playerId === selfPlayerId;
            return `
                      <div class="mid-ranking-row ${isSelf ? "mid-ranking-row--self" : ""}">
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
        : `<div class="mid-ranking-empty">Chưa có người chơi trong phòng.</div>`}
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
let inGameBackgroundMusic = null;
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
function clampInGameMusicVolume(value) {
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
    var _a;
    return isOnlineRoomActive() && ((_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) !== "lobby";
}
function stopOutsideBackgroundMedia() {
    /*
      Tắt hẳn audio/video nền ngoài màn chơi, đặc biệt là video hero ở dashboard.
      Không đụng tới audio nền riêng trong game.
    */
    cleanupDashboardHub();
    document.querySelectorAll("audio, video").forEach((media) => {
        if (media === inGameBackgroundMusic)
            return;
        const element = media;
        try {
            element.pause();
            element.muted = true;
            if (element.id === "hub-hero-video" || element.classList.contains("hub-hero__video")) {
                element.currentTime = 0;
            }
        }
        catch (_a) {
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
    const button = document.querySelector("[data-in-game-music-toggle]");
    const value = document.querySelector("[data-in-game-music-value]");
    const slider = document.querySelector("[data-in-game-music-slider]");
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
function setInGameBackgroundMusicVolume(value) {
    const normalizedValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(normalizedValue))
        return;
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
window.toggleInGameBackgroundMusic = toggleInGameBackgroundMusic;
window.setInGameBackgroundMusicVolume = setInGameBackgroundMusicVolume;
function renderOnlineRoomMenu() {
    var _a, _b;
    if (!isOnlineRoomActive() || ((_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) === "lobby") {
        return "";
    }
    return `
    <div class="online-room-menu" onclick="event.stopPropagation()">
      <input id="online-room-menu-toggle" class="online-room-menu__toggle-input" type="checkbox" />

      <label
        class="online-room-menu__button"
        for="online-room-menu-toggle"
        title="Mở menu phòng"
      >
        ☰
      </label>

      <div class="online-room-menu__panel">
        <div class="online-room-menu__text">
          <strong>Menu phòng</strong>
          <span>Room ${(_b = onlineClientState.roomId) !== null && _b !== void 0 ? _b : "-"}</span>
        </div>

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
function renderSidePlayerSpacers(count) {
    return Array.from({ length: Math.max(0, count) }, () => {
        return `<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`;
    }).join("");
}
export let currentAppScreen = "dashboard";
// Background smoke video reference (shared between gotoMapSelection and rerenderGameShell)
let bgSmokeVideo = null;
function transitionToScreen(newScreen) {
    if (newScreen !== "dashboard") {
        stopOutsideBackgroundMedia();
    }
    if (!document.startViewTransition) {
        currentAppScreen = newScreen;
        rerenderGameShell();
        return;
    }
    document.startViewTransition(() => {
        currentAppScreen = newScreen;
        rerenderGameShell();
    });
}
let isTransitioning = false;
window.gotoMapSelection = () => {
    if (isTransitioning)
        return;
    if (!authClientState.user) {
        window.focusHubAuthPanel();
        setAuthStatus("Đăng nhập hoặc đăng ký để bắt đầu hành trình.");
        return;
    }
    isTransitioning = true;
    // 1. Create overlay video — plays from beginning (smoke effect)
    const vid = document.createElement("video");
    vid.src = "./assets/chuyencanh.mp4";
    vid.muted = true;
    vid.playsInline = true;
    vid.style.cssText = [
        "position:fixed", "inset:0", "width:100%", "height:100%",
        "object-fit:cover", "z-index:9999", "pointer-events:auto",
        "opacity:0", "transition:opacity 0.4s ease"
    ].join(";");
    document.body.appendChild(vid);
    // Fade in the video overlay
    vid.playbackRate = 1.75;
    void vid.play().catch(() => { vid.muted = true; vid.playbackRate = 1.75; void vid.play(); });
    requestAnimationFrame(() => { requestAnimationFrame(() => { vid.style.opacity = "1"; }); });
    let transitioned = false;
    vid.addEventListener("timeupdate", () => {
        // 2. When smoke covers screen (~3.5s), swap to map selection
        if (!transitioned && vid.currentTime >= 3.5) {
            transitioned = true;
            isTransitioning = false;
            bgSmokeVideo = vid;
            // Remove from body — rerenderGameShell will re-insert it into the screen
            document.body.removeChild(vid);
            vid.style.cssText = [
                "position:absolute", "inset:0", "width:100%", "height:100%",
                "object-fit:cover", "z-index:0", "pointer-events:none", "opacity:1"
            ].join(";");
            currentAppScreen = "map_selection";
            rerenderGameShell();
            // 3. Animate map card columns in — staggered slide from right
            requestAnimationFrame(() => {
                const cols = document.querySelectorAll(".map-card-col");
                cols.forEach((el, i) => {
                    setTimeout(() => el.classList.add("map-card-col--slide-in"), 200 + i * 140);
                });
            });
        }
        // 4. Loop from second 5 to avoid smoke replaying
        if (vid.duration && vid.currentTime >= vid.duration - 0.5) {
            vid.currentTime = 5;
        }
    });
};
window.gotoOnlineLobby = () => {
    if (!authClientState.user) {
        window.focusHubAuthPanel();
        setAuthStatus("Đăng nhập hoặc đăng ký để bắt đầu hành trình.");
        return;
    }
    transitionToScreen("lobby");
};
window.gotoDashboard = () => {
    // Remove background video cleanly
    if (bgSmokeVideo) {
        bgSmokeVideo.pause();
        bgSmokeVideo.remove();
        bgSmokeVideo = null;
    }
    transitionToScreen("dashboard");
};
window.switchHubAuthTab = (tab) => {
    document.querySelectorAll("[data-hub-auth-tab]").forEach((element) => {
        element.classList.toggle("is-active", element.dataset.hubAuthTab === tab);
    });
    document.querySelectorAll("[data-hub-auth-panel]").forEach((element) => {
        element.classList.toggle("is-active", element.dataset.hubAuthPanel === tab);
    });
};
window.focusHubAuthPanel = () => {
    const authPanel = document.getElementById("hub-auth");
    if (!authPanel) {
        currentAppScreen = "dashboard";
        rerenderGameShell();
        window.requestAnimationFrame(() => {
            window.focusHubAuthPanel();
        });
        return;
    }
    authPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    authPanel.classList.remove("hub-auth--pulse");
    window.requestAnimationFrame(() => {
        authPanel.classList.add("hub-auth--pulse");
    });
    const firstInput = authPanel.querySelector("input");
    firstInput === null || firstInput === void 0 ? void 0 : firstInput.focus();
};
window.startOfflineGame = () => {
    alert("Chế độ chơi offline (Bot) đang được phát triển!");
};
function renderSaigonCollageBackground() {
    return `<div class="saigon-collage-bg" aria-hidden="true"></div>`;
}
const SAIGON_COLLAGE_BG_SIZE = {
    width: 1308,
    height: 801,
};
const SAIGON_COLLAGE_HOTSPOTS = [
    // v4: tọa độ crop trực tiếp từ ảnh nền gốc 1308x801.
    // Vì sprite lấy từ chính ảnh nền nên khi glow sẽ khớp vị trí, không còn bị "phân thân".
    { key: "vendor", selector: ".saigon-collage-bg__glow--vendor", x: 0, y: 0, width: 430, height: 330 },
    { key: "vehicle", selector: ".saigon-collage-bg__glow--vehicle", x: 590, y: 72, width: 360, height: 190 },
    { key: "foodcart", selector: ".saigon-collage-bg__glow--foodcart", x: 0, y: 455, width: 405, height: 305 },
    { key: "women", selector: ".saigon-collage-bg__glow--women", x: 900, y: 485, width: 390, height: 295 },
];
function prepareSaigonAlphaCanvas(hotspot, shell) {
    var _a;
    if (hotspot.ctx && hotspot.canvas && ((_a = hotspot.image) === null || _a === void 0 ? void 0 : _a.complete)) {
        return;
    }
    const image = shell.querySelector(hotspot.selector);
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
function getSaigonBackgroundCoordinate(shell, event) {
    const rect = shell.getBoundingClientRect();
    const scale = Math.max(rect.width / SAIGON_COLLAGE_BG_SIZE.width, rect.height / SAIGON_COLLAGE_BG_SIZE.height);
    const renderedWidth = SAIGON_COLLAGE_BG_SIZE.width * scale;
    const renderedHeight = SAIGON_COLLAGE_BG_SIZE.height * scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    return {
        x: (event.clientX - rect.left - offsetX) / scale,
        y: (event.clientY - rect.top - offsetY) / scale,
    };
}
let lastOnlinePhase = null;
let isCinematicTransitioning = false;
function triggerCinematicLobbyToGameTransition() {
    console.log("TRIGGERING CINEMATIC TRANSITION!");
    isCinematicTransitioning = true;
    const blocker = document.createElement("div");
    blocker.id = "cinematic-blocker";
    blocker.style.cssText = "position:fixed;inset:0;z-index:99999999;cursor:wait;";
    blocker.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
    blocker.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
    blocker.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
    document.body.appendChild(blocker);
    const lobbyCard = document.querySelector(".online-lobby-card");
    if (lobbyCard)
        lobbyCard.classList.add("is-exiting");
    const video = document.getElementById("cinematic-transition-video");
    const overlay = document.getElementById("white-flash-overlay");
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
            if (!isCinematicTransitioning)
                return;
            isCinematicTransitioning = false;
            overlay.style.display = "block";
            overlay.style.opacity = "1";
            video.style.display = "none";
            video.ontimeupdate = null; // cleanup
            const b = document.getElementById("cinematic-blocker");
            if (b)
                b.remove();
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
function isInsideOpaqueSaigonPixel(hotspot, bgX, bgY) {
    if (bgX < hotspot.x
        || bgX > hotspot.x + hotspot.width
        || bgY < hotspot.y
        || bgY > hotspot.y + hotspot.height) {
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
    const shell = document.querySelector(".game-shell");
    if (shell) {
        delete shell.dataset.saigonHover;
    }
}
function renderGameShell() {
    var _a;
    if (!authClientState.isReady) {
        return renderDashboard(true);
    }
    if (!isOnlineRoomActive()) {
        if (!authClientState.user || currentAppScreen === "dashboard") {
            currentAppScreen = "dashboard";
            return renderDashboard();
        }
        if (currentAppScreen === "map_selection") {
            return renderMapSelectionScreen();
        }
        return renderOnlineEntryScreen();
    }
    if (((_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) === "lobby") {
        return renderOnlineLobbyRoomScreen();
    }
    const leftPlayers = getLeftSidePlayersToRender();
    const rightPlayers = getRightSidePlayersToRender();
    return `
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
  `;
}
window.rerenderGameShell = rerenderGameShell;
function applyLobbyBackground() {
    var _a;
    const isLobbyScreen = !isOnlineRoomActive() ||
        ((_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) === "lobby";
    if (isLobbyScreen) {
        // Set background directly on #app — inline style beats CSS !important
        app.style.setProperty("background", "url('./assets/backgrounds/lobby-background.jpg') center/cover no-repeat #0c0b11", "important");
    }
    else {
        // Remove inline override, let CSS handle game background
        app.style.removeProperty("background");
    }
}
function rerenderGameShell() {
    stopOutsideBackgroundMedia();
    app.innerHTML = renderGameShell();
    applyLobbyBackground();
    setupSaigonCollageHover();
    syncInGameBackgroundMusic();
    initDashboardHub();
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
let lastOnlineAnimationPhase = null;
let lastOnlineAnimationDraftRound = 0;
let lastOnlineAnimationPoolSignature = "";
let onlineDraftAnimationTimerId = null;
let hasStartedOnlineSimulationReplay = false;
let onlineDraftDisplayPool = null;
let onlineDraftPassSnapshotPool = null;
let onlineDraftPendingPool = null;
const DRAFT_CENTER_DEAL_CARD_MS = 900;
const DRAFT_CENTER_DEAL_GAP_MS = 150; // pause after each card lands before next departs
const DRAFT_CENTER_DEAL_STEP_MS = DRAFT_CENTER_DEAL_CARD_MS + DRAFT_CENTER_DEAL_GAP_MS;
const DRAFT_CENTER_DEAL_TOTAL_MS = DRAFT_CENTER_DEAL_STEP_MS * 6 + DRAFT_CENTER_DEAL_CARD_MS + 250;
let isDraftCenterDealing = false;
let draftDealVisualEndsAt = 0;
let isDraftPickFlying = false;
let draftHandPendingCardId = null;
let draftPoolFlyReturnCardId = null;
let lastOnlinePickedDraftCount = 0;
const DRAFT_PICK_FLY_MS = 750;
const DRAFT_PASS_ANIMATION_MS = 1500;
const DRAFT_HAND_PICK_SCALE = 0.84;
let shouldActivateOnlineDealAnimation = false;
let shouldActivateOnlinePassAnimation = false;
let isOnlineFinalDraftReturnAnimating = false;
let onlineFinalDraftReturnTimerId = null;
let hasPlayedOnlinePlanningDealAfterDraft = false;
let draftCenterDealEndTimerId = null;
let draftCenterDealGeneration = 0;
function isDraftDealVisualActive() {
    return (isDraftCenterDealing ||
        isInitialDealInProgress ||
        Date.now() < draftDealVisualEndsAt);
}
function restartDraftCenterDealVisuals() {
    const overlay = document.querySelector(".draft-center-overlay");
    if (!overlay)
        return false;
    overlay.classList.remove("draft-center-overlay--dealing");
    const wrappers = overlay.querySelectorAll(".draft-center-card-wrapper");
    wrappers.forEach((node) => {
        const wrapper = node;
        wrapper.classList.remove("draft-center-card-wrapper--flown-to-hand");
        wrapper.style.animation = "none";
    });
    void overlay.offsetWidth;
    wrappers.forEach((node) => {
        node.style.removeProperty("animation");
    });
    overlay.classList.add("draft-center-overlay--dealing");
    return true;
}
function clearDraftCenterDealAnimation() {
    var _a;
    draftCenterDealGeneration += 1;
    if (draftCenterDealEndTimerId !== null) {
        window.clearTimeout(draftCenterDealEndTimerId);
        draftCenterDealEndTimerId = null;
    }
    isDraftCenterDealing = false;
    (_a = document.querySelector(".draft-center-overlay")) === null || _a === void 0 ? void 0 : _a.classList.remove("draft-center-overlay--dealing");
}
function getDraftCenterPoolSignature() {
    var _a, _b, _c, _d;
    const pool = isOnlineRoomActive()
        ? ((_b = (_a = getOnlineDraftDisplayPool()) !== null && _a !== void 0 ? _a : getOnlineSelfDraftPool()) !== null && _b !== void 0 ? _b : [])
        : ((_d = (_c = getCurrentDraftPlayer()) === null || _c === void 0 ? void 0 : _c.pool) !== null && _d !== void 0 ? _d : []);
    return pool.map((c) => c.id).join(",");
}
function startDraftCenterDealAnimation(durationMs = DRAFT_CENTER_DEAL_TOTAL_MS) {
    if (draftCenterDealEndTimerId !== null) {
        window.clearTimeout(draftCenterDealEndTimerId);
        draftCenterDealEndTimerId = null;
    }
    const generation = ++draftCenterDealGeneration;
    isDraftCenterDealing = true;
    draftDealVisualEndsAt = Date.now() + durationMs;
    playGameSound("deal");
    const activate = () => {
        if (generation !== draftCenterDealGeneration)
            return;
        restartDraftCenterDealVisuals();
    };
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(activate);
    });
    draftCenterDealEndTimerId = window.setTimeout(() => {
        var _a;
        if (generation !== draftCenterDealGeneration)
            return;
        draftCenterDealEndTimerId = null;
        isDraftCenterDealing = false;
        (_a = document.querySelector(".draft-center-overlay")) === null || _a === void 0 ? void 0 : _a.classList.remove("draft-center-overlay--dealing");
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
    var _a;
    const state = onlineClientState.roomState;
    if (!state)
        return "offline";
    const self = state.self;
    const playersSignature = playerIds
        .map((playerId) => {
        const player = state.players[playerId];
        const boardSignature = player.board
            .map((row) => row.map((cell) => {
            if (!cell)
                return "-";
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
            boardSignature,
        ].join("~");
    })
        .join("||");
    return [
        state.phase,
        (_a = state.phaseNumber) !== null && _a !== void 0 ? _a : 1,
        state.dayIndex,
        state.draftRound,
        self.draftPool.map((card) => card.id).join(","),
        self.pickedDraftCards.map((card) => card.id).join(","),
        self.hand.map((card) => card.id).join(","),
        playersSignature,
    ].join("##");
}
function updateOnlineTimerOnly() {
    var _a;
    const state = onlineClientState.roomState;
    const timerElement = document.querySelector(".score-breakdown__timer");
    const timerValueElement = timerElement === null || timerElement === void 0 ? void 0 : timerElement.querySelector("strong");
    if (!state || !timerElement || !timerValueElement)
        return;
    if (state.phase === "draft") {
        const hold = (_a = state.draftTimerHold) !== null && _a !== void 0 ? _a : 0;
        const frozen = isDraftCenterDealing ||
            isInitialDealInProgress ||
            isPassingDraftCards ||
            hold > 0 ||
            Date.now() < draftDealVisualEndsAt;
        timerValueElement.textContent = frozen ? "Chia bài" : `${state.timer}s`;
        timerElement.classList.toggle("score-breakdown__timer--danger", !frozen && state.timer <= 3);
        return;
    }
    if (state.phase === "planning") {
        timerValueElement.textContent = formatTurnTimer(state.timer);
        timerElement.classList.toggle("score-breakdown__timer--danger", state.timer <= 10);
        return;
    }
    if (state.phase === "gameover") {
        timerValueElement.textContent = `${state.timer}s`;
        timerElement.classList.toggle("score-breakdown__timer--danger", state.timer <= 3);
    }
}
function renderAfterOnlineStateChange() {
    var _a, _b;
    const nextSignature = getOnlineRenderSignature();
    const currentPhase = (_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) !== null && _b !== void 0 ? _b : null;
    if (nextSignature !== lastOnlineRenderSignature) {
        console.log("Signature changed:", lastOnlineRenderSignature, "=>", nextSignature);
        lastOnlineRenderSignature = nextSignature;
        if (lastOnlinePhase === "lobby" && currentPhase === "cinematic") {
            lastOnlinePhase = currentPhase;
            triggerCinematicLobbyToGameTransition();
            return;
        }
        lastOnlinePhase = currentPhase;
        const shouldDeferRerenderForActiveDeal = (isDraftDealVisualActive() || isDraftPickFlying) &&
            !shouldActivateOnlineDealAnimation &&
            !shouldActivateOnlinePassAnimation;
        const passVisualRunning = isOnlineInterRoundPoolPassActive() &&
            document.querySelector(".draft-center-overlay--passing.pass-active");
        if (!isCinematicTransitioning) {
            if (shouldDeferRerenderForActiveDeal) {
                updateDraftSelectedVisualOnly();
                updateOnlineTimerOnly();
            }
            else if (passVisualRunning && !shouldActivateOnlinePassAnimation && !shouldActivateOnlineDealAnimation) {
                updateOnlineTimerOnly();
            }
            else {
                rerenderGameShell();
            }
        }
        if (shouldActivateOnlineDealAnimation) {
            shouldActivateOnlineDealAnimation = false;
            startDraftCenterDealAnimation();
        }
        if (shouldActivateOnlinePassAnimation) {
            shouldActivateOnlinePassAnimation = false;
            if (isOnlineFinalDraftReturnAnimating) {
                activateDraftCenterReturnAnimation();
            }
            else {
                activateDraftCenterPoolPassAnimation();
            }
        }
        return;
    }
    updateOnlineTimerOnly();
}
rerenderGameShell();
lastOnlineRenderSignature = getOnlineRenderSignature();
lastOnlinePhase = (_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.phase) !== null && _b !== void 0 ? _b : null;
function setupCardClickDelegation() {
    let holdStartX = 0;
    let holdStartY = 0;
    let holdCardId = null;
    let holdMode = null;
    let didOpenHoldPreview = false;
    let skipNextDraftClick = false;
    function clearDelegatedHold() {
        clearHoldTimer();
        holdCardId = null;
        holdMode = null;
        didOpenHoldPreview = false;
    }
    document.addEventListener("pointerdown", (event) => {
        var _a, _b;
        const target = event.target;
        if (!target)
            return;
        const draftCardElement = target.closest("[data-draft-card-id]");
        const handCardElement = target.closest("[data-hand-card-id]");
        let nextCardId = null;
        let nextMode = null;
        if (isDraftPhase && draftCardElement) {
            nextCardId = (_a = draftCardElement.dataset.draftCardId) !== null && _a !== void 0 ? _a : null;
            nextMode = "draft";
        }
        else if (!isDraftPhase && !isSimulationMode && handCardElement) {
            nextCardId = (_b = handCardElement.dataset.handCardId) !== null && _b !== void 0 ? _b : null;
            nextMode = "hand";
        }
        if (!nextCardId || !nextMode)
            return;
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
            if (!holdCardId)
                return;
            didOpenHoldPreview = true;
            focusedHandCardId = holdCardId;
            focusedBoardCard = null;
            focusedBoardPosition = null;
            suppressNextClick = true;
            rerenderGameShell();
        }, 500);
    }, true);
    document.addEventListener("pointermove", (event) => {
        if (!holdCardId || holdTimer === null)
            return;
        const distance = Math.hypot(event.clientX - holdStartX, event.clientY - holdStartY);
        if (distance > 8) {
            clearDelegatedHold();
        }
    }, true);
    document.addEventListener("pointerup", (event) => {
        const cardId = holdCardId;
        const mode = holdMode;
        const openedPreview = didOpenHoldPreview;
        const distance = Math.hypot(event.clientX - holdStartX, event.clientY - holdStartY);
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
        const target = event.target;
        if (!target)
            return;
        const draftCardElement = target.closest("[data-draft-card-id]");
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
        const handCardElement = target.closest("[data-hand-card-id]");
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
initOnlineClient(() => {
    applyOnlineRoomStateToLocal();
    renderAfterOnlineStateChange();
});
window.createOnlineRoom = (playerName = "An") => {
    createOnlineRoom(playerName);
};
window.joinOnlineRoom = (roomId, playerName = "Player") => {
    joinOnlineRoom(roomId, playerName);
};
window.startOnlineGame = () => {
    startOnlineGame();
};
window.selectDraftCard = selectDraftCard;
window.selectHandCard = selectHandCard;
window.clearSelectedHandCard = clearSelectedHandCard;
function setAuthStatus(message, isError = false) {
    var _a;
    const statusElement = (_a = document.querySelector("#hub-auth-status")) !== null && _a !== void 0 ? _a : document.querySelector("#auth-status");
    if (!statusElement)
        return;
    statusElement.textContent = message;
    statusElement.classList.toggle("hub-auth__status--error", isError);
    statusElement.classList.toggle("hub-auth__status--success", Boolean(message) && !isError);
    statusElement.classList.toggle("auth-card__status--error", isError);
    statusElement.classList.toggle("auth-card__status--success", Boolean(message) && !isError);
}
function setupAuthFormDelegation() {
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!form)
            return;
        if (form.id === "auth-login-form" || form.id === "hub-auth-login-form") {
            event.preventDefault();
            event.stopPropagation();
            window.loginFromAuthScreen();
            return;
        }
        if (form.id === "auth-register-form" || form.id === "hub-auth-register-form") {
            event.preventDefault();
            event.stopPropagation();
            window.registerFromAuthScreen();
        }
    }, true);
}
window.loginFromAuthScreen = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const usernameInput = (_a = document.querySelector("#hub-auth-login-username")) !== null && _a !== void 0 ? _a : document.querySelector("#auth-login-username");
    const passwordInput = (_b = document.querySelector("#hub-auth-login-password")) !== null && _b !== void 0 ? _b : document.querySelector("#auth-login-password");
    setAuthStatus("Đang đăng nhập...");
    try {
        yield loginAccount({
            username: (_c = usernameInput === null || usernameInput === void 0 ? void 0 : usernameInput.value.trim()) !== null && _c !== void 0 ? _c : "",
            password: (_d = passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.value) !== null && _d !== void 0 ? _d : "",
        });
        setAuthStatus("Đăng nhập thành công.");
        rerenderGameShell();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Đăng nhập thất bại.";
        setAuthStatus(message, true);
        alert(message);
    }
});
window.registerFromAuthScreen = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const displayNameInput = (_a = document.querySelector("#hub-auth-register-display-name")) !== null && _a !== void 0 ? _a : document.querySelector("#auth-register-display-name");
    const usernameInput = (_b = document.querySelector("#hub-auth-register-username")) !== null && _b !== void 0 ? _b : document.querySelector("#auth-register-username");
    const passwordInput = (_c = document.querySelector("#hub-auth-register-password")) !== null && _c !== void 0 ? _c : document.querySelector("#auth-register-password");
    setAuthStatus("Đang tạo tài khoản...");
    try {
        yield registerAccount({
            displayName: (displayNameInput === null || displayNameInput === void 0 ? void 0 : displayNameInput.value.trim()) || undefined,
            username: (_d = usernameInput === null || usernameInput === void 0 ? void 0 : usernameInput.value.trim()) !== null && _d !== void 0 ? _d : "",
            password: (_e = passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.value) !== null && _e !== void 0 ? _e : "",
        });
        setAuthStatus("Tạo tài khoản thành công.");
        rerenderGameShell();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Đăng ký thất bại.";
        setAuthStatus(message, true);
        alert(message);
    }
});
window.logoutFromAuthScreen = () => {
    logoutAccount();
    onlineClientState.roomId = null;
    onlineClientState.playerId = null;
    onlineClientState.roomState = null;
    currentAppScreen = "dashboard";
    rerenderGameShell();
};
window.createRoomFromLobby = () => {
    var _a, _b;
    stopOutsideBackgroundMedia();
    const input = document.querySelector("#lobby-create-name");
    const playerName = (input === null || input === void 0 ? void 0 : input.value.trim()) || ((_a = authClientState.user) === null || _a === void 0 ? void 0 : _a.displayName) || ((_b = authClientState.user) === null || _b === void 0 ? void 0 : _b.username) || "An";
    createOnlineRoom(playerName);
};
window.joinRoomFromLobby = () => {
    stopOutsideBackgroundMedia();
    const nameInput = document.querySelector("#lobby-join-name");
    const roomInput = document.querySelector("#lobby-room-code");
    const playerName = (nameInput === null || nameInput === void 0 ? void 0 : nameInput.value.trim()) || "Player";
    const roomId = roomInput === null || roomInput === void 0 ? void 0 : roomInput.value.trim().toUpperCase();
    if (!roomId) {
        alert("Nhập room code trước.");
        return;
    }
    joinOnlineRoom(roomId, playerName);
};
window.reconnectSavedRoomFromLobby = () => {
    stopOutsideBackgroundMedia();
    const savedSession = getSavedOnlineSession();
    if (!savedSession)
        return;
    reconnectOnlineRoom(savedSession.roomId, savedSession.playerId, savedSession.playerName);
};
window.clearSavedRoomFromLobby = () => {
    clearSavedOnlineSession();
    rerenderGameShell();
};
window.toggleReadyFromLobby = () => {
    const selfPlayer = getOnlineSelfPublicPlayer();
    if (!selfPlayer || !onlineClientState.playerId || !onlineClientState.roomState)
        return;
    const nextReadyState = !selfPlayer.isReady;
    /*
      Cập nhật tạm local để bấm thấy đổi ngay.
      Server vẫn là nguồn chính; room:state gửi về sẽ xác nhận lại.
    */
    onlineClientState.roomState.players[onlineClientState.playerId].isReady = nextReadyState;
    rerenderGameShell();
    setOnlineReady(nextReadyState);
};
window.leaveRoomFromLobby = () => {
    leaveOnlineRoom();
    rerenderGameShell();
};
window.copyRoomCodeFromLobby = () => __awaiter(void 0, void 0, void 0, function* () {
    const roomId = onlineClientState.roomId;
    if (!roomId)
        return;
    try {
        yield navigator.clipboard.writeText(roomId);
        alert(`Đã copy room code: ${roomId}`);
    }
    catch (_a) {
        prompt("Copy room code:", roomId);
    }
});
window.openMidGameRanking = () => {
    isMidGameRankingOpen = true;
    rerenderGameShell();
};
window.closeMidGameRanking = () => {
    isMidGameRankingOpen = false;
    rerenderGameShell();
};
window.downloadTravelCertificateHtml = () => {
    downloadTravelCertificateHtml();
};
window.downloadTravelTimelineTxt = () => {
    downloadTravelTimeline("txt");
};
window.downloadTravelTimelineJson = () => {
    downloadTravelTimeline("json");
};
window.copyTravelTimeline = () => {
    copyTravelTimelineToClipboard();
};
window.debugOnlineBoards = () => {
    const state = onlineClientState.roomState;
    if (!state) {
        console.log("No online room state.");
        return null;
    }
    const result = {};
    const playerIds = ["p1", "p2", "p3", "p4"];
    for (const playerId of playerIds) {
        const player = state.players[playerId];
        const filledCells = [];
        for (let rowIndex = 0; rowIndex < player.board.length; rowIndex += 1) {
            const row = player.board[rowIndex];
            for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
                const cell = row[colIndex];
                if (!cell)
                    continue;
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
    console.table(playerIds.map((playerId) => ({
        playerId,
        name: result[playerId].name,
        connected: result[playerId].connected,
        usedSlots: result[playerId].usedSlots,
        filled: result[playerId].filledCells.length,
    })));
    console.log(result);
    return result;
};
window.onlineClientState = onlineClientState;
window.debugOnlineScores = () => {
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
globalThis.createOnlineRoom = window.createOnlineRoom;
globalThis.joinOnlineRoom = window.joinOnlineRoom;
globalThis.startOnlineGame = window.startOnlineGame;
globalThis.selectDraftCard = window.selectDraftCard;
globalThis.selectHandCard = window.selectHandCard;
globalThis.clearSelectedHandCard = window.clearSelectedHandCard;
globalThis.loginFromAuthScreen = window.loginFromAuthScreen;
globalThis.registerFromAuthScreen = window.registerFromAuthScreen;
globalThis.logoutFromAuthScreen = window.logoutFromAuthScreen;
globalThis.forceLogoutAuth = window.logoutFromAuthScreen;
globalThis.createRoomFromLobby = window.createRoomFromLobby;
globalThis.joinRoomFromLobby = window.joinRoomFromLobby;
globalThis.reconnectSavedRoomFromLobby = window.reconnectSavedRoomFromLobby;
globalThis.clearSavedRoomFromLobby = window.clearSavedRoomFromLobby;
globalThis.toggleReadyFromLobby = window.toggleReadyFromLobby;
globalThis.copyRoomCodeFromLobby = window.copyRoomCodeFromLobby;
globalThis.leaveRoomFromLobby = window.leaveRoomFromLobby;
globalThis.onlineClientState = onlineClientState;
globalThis.openMidGameRanking = window.openMidGameRanking;
globalThis.closeMidGameRanking = window.closeMidGameRanking;
globalThis.downloadTravelCertificateHtml = window.downloadTravelCertificateHtml;
globalThis.toggleInGameBackgroundMusic = window.toggleInGameBackgroundMusic;
globalThis.setInGameBackgroundMusicVolume = window.setInGameBackgroundMusicVolume;
globalThis.downloadTravelTimelineTxt = window.downloadTravelTimelineTxt;
globalThis.downloadTravelTimelineJson = window.downloadTravelTimelineJson;
globalThis.copyTravelTimeline = window.copyTravelTimeline;
globalThis.playGameSound = playGameSound;
globalThis.debugOnlineBoards = window.debugOnlineBoards;
globalThis.selectDraftCard = window.selectDraftCard;
document.addEventListener("visibilitychange", syncOnlineDraftDisplayAfterTabVisible);
window.addEventListener("focus", syncOnlineDraftDisplayAfterTabVisible);
rerenderGameShell();
