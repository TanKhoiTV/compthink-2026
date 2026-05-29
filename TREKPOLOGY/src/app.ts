import { renderMapSelectionScreen } from "./ui/mapSelection.js";
import { initDashboardHub, renderDashboard } from "./ui/dashboard.js";
import {
  authClientState,
  createOnlineRoom,
  initOnlineClient,
  clearSavedOnlineSession,
  getSavedOnlineSession,
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
  DRAFT_PICK_SECONDS,
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
  type GameSoundName,
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
  for (const card of cards) {
    if (!card.image) continue;

    const image = new Image();
    image.src = card.image;
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

  return onlineDraftDisplayPool ?? getOnlineSelfDraftPool();
}

function getDraftPoolSignature(cards: TravelCardData[] | null | undefined) {
  return (cards ?? []).map((card) => card.id).join(",");
}

function setOnlineDraftDisplayPoolFromServer() {
  const serverPool = getOnlineSelfDraftPool();

  onlineDraftDisplayPool = serverPool ? [...serverPool] : null;
  onlineDraftPendingPool = null;
}


function getOnlineSelfHand(): TravelCardData[] | null {
  return (getOnlineSelfState()?.hand as TravelCardData[] | undefined) ?? null;
}

function getOnlineSelectedDraftCardId() {
  return getOnlineSelfState()?.selectedDraftCardId ?? null;
}

function getDraftVisualSelectedCardId() {
  return getOnlineSelectedDraftCardId() ?? draftSelectedCardId;
}

function getOnlinePlayer(playerId?: PlayerId) {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId] ?? null;
}

export function getDisplayPlayerName() {
  const selfPlayerId = onlineClientState.playerId ?? currentPlayerId;
  const onlineSelf = getOnlinePlayer(selfPlayerId);

  return onlineSelf?.name ?? "Player";
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
  return onlineClientState.playerId ?? currentPlayerId;
}

function getOnlineScoreForPlayer(playerId?: PlayerId): number | null {
  if (!playerId || !onlineClientState.roomState) return null;

  return onlineClientState.roomState.players[playerId]?.score ?? null;
}

function getOnlineSelfScore(): number | null {
  return getOnlineScoreForPlayer(onlineClientState.playerId ?? currentPlayerId);
}


function getKnownOnlineCardById(cardId: string): TravelCardData | null {
  const onlineSelf = getOnlineSelfState();

  const allKnownCards = [
    ...(onlineDraftDisplayPool ?? []),
    ...(onlineDraftPendingPool ?? []),
    ...(onlineSelf?.draftPool ?? []),
    ...(onlineSelf?.pickedDraftCards ?? []),
    ...(onlineSelf?.hand ?? []),
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

  if (knownCard && !cell.type) {
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
  const displayPoolSignature = getDraftPoolSignature(onlineDraftDisplayPool);
  const hasDisplayPool = onlineDraftDisplayPool !== null;

  if (isOnlineRoomActive()) {
    const enteredDraft = state.phase === "draft" && lastOnlineAnimationPhase !== "draft";
    const serverPoolChanged =
      state.phase === "draft" &&
      lastOnlineAnimationPhase === "draft" &&
      onlinePoolSignature !== lastOnlineAnimationPoolSignature;

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

      setOnlineDraftDisplayPoolFromServer();

      shouldActivateOnlineDealAnimation = true;
      shouldActivateOnlinePassAnimation = false;
      isInitialDealInProgress = true;
      isPassingDraftCards = false;
      hasPlayedOnlinePlanningDealAfterDraft = false;

      playGameSound("deal");

      onlineDraftAnimationTimerId = window.setTimeout(() => {
        finishOnlineDraftDealVisualOnly();
      }, 1320);
    } else if (serverPoolChanged && hasDisplayPool && displayPoolSignature !== onlinePoolSignature) {
      clearOnlineDraftAnimationTimer();

      onlineDraftPendingPool = [...serverDraftPool];

      shouldActivateOnlineDealAnimation = false;
      shouldActivateOnlinePassAnimation = true;
      isInitialDealInProgress = false;
      isPassingDraftCards = true;

      onlineDraftAnimationTimerId = window.setTimeout(() => {
        if (onlineDraftPendingPool) {
          onlineDraftDisplayPool = [...onlineDraftPendingPool];
          onlineDraftPendingPool = null;
        }

        /*
          Sau khi trả/chuyền bài vào deck xong, render pool mới dưới dạng dealing
          để các lượt 2/3/4/5 cũng có animation chia bài giống lượt 1.
        */
        isPassingDraftCards = false;
        isInitialDealInProgress = true;
        shouldActivateOnlineDealAnimation = true;
        onlineDraftAnimationTimerId = null;
        draftSelectedCardId = state.self.selectedDraftCardId;

        rerenderGameShell();
        activateDraftDealAnimation();

        onlineDraftAnimationTimerId = window.setTimeout(() => {
          finishOnlineDraftDealVisualOnly();
        }, 1320);
      }, 1500);
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
      onlineDraftPendingPool = null;
      shouldActivateOnlineDealAnimation = false;
      shouldActivateOnlinePassAnimation = false;
      isInitialDealInProgress = false;
      isPassingDraftCards = false;
    }

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
  }

  if (state.phase === "draft") {
    playerHand = [];
    draftSelectedCardId = state.self.selectedDraftCardId;
    updateDraftSelectedVisualOnly();
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
const hasPlayedDealAnimation = true;
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
  return getTextFitClass(name, "hand-card__name", 16, 23);
}

function getHandCityClass(city: string) {
  return getTextFitClass(city, "hand-card__city", 18, 28);
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
  return getTextFitClass(name, "focused-card__name", 18, 25);
}

function getFocusedCityClass(city: string) {
  return getTextFitClass(city, "focused-card__city", 18, 28);
}

function getHandCardById(id: string | null) {
  if (!id) return null;

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

function renderHandCard(card: TravelCardData, index: number) {
  const isDraftSelected = isDraftPhase && card.id === getDraftVisualSelectedCardId();
  const isPlanningSelected = !isDraftPhase && card.id === selectedHandCardId;
  const isSelected = isDraftSelected || isPlanningSelected;
  const affordability = getCardAffordability(card);
  const affordabilityMessage = affordability.canAfford
    ? getCardAffordabilityMessage(card)
    : "Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.";
  const unaffordableClass = "";

  return `
    <article
      class="hand-card hand-card--${card.rarity} hand-card--fan-${index + 1} ${isPlanningSelected ? "hand-card--selected" : ""} ${isDraftSelected ? "hand-card--draft-selected" : ""} ${unaffordableClass}"
      data-hand-card-id="${card.id}"
      style="${isSelected ? "box-shadow: 0 0 0 4px rgba(255,255,255,.95), 0 0 0 8px rgba(139,92,246,.82), 0 18px 34px rgba(75,47,25,.28);" : ""}"
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

function renderFocusedCard(card: TravelCardData) {
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

        ${
          focusedBoardPosition
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

function renderDraftHandCards() {
  const onlinePool = isOnlineRoomActive() ? getOnlineDraftDisplayPool() : null;
  const activePlayer = getCurrentDraftPlayer();
  const activePool = onlinePool ?? activePlayer?.pool ?? [];

  if (activePool.length === 0) {
    return `<div class="draft-hand-empty">Đang chuẩn bị bài...</div>`;
  }

  return activePool
    .map((card, index) => renderDailyDraftCard(card, index))
    .join("");
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

  return `
    <section class="side-player ${displayPlayer.active ? "side-player--active" : ""}${connectionClass}">
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
    Chơi 1 người: sau khi chọn 1 lá, 6 lá còn lại quay về deck rồi roll pool mới.
    Như vậy mỗi lượt pick thật sự là một lượt random mới, không phải chuyền bài ảo với bot.
  */
  if (currentPlayer.pool.length > 0) {
    deck = shuffleCards([...deck, ...currentPlayer.pool]);
  }

  const nextPool = drawRandomCardsFromDeck(DRAFT_STARTING_POOL_SIZE);

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
  draftPickSecondsLeft = DRAFT_PICK_SECONDS;
  isPassingDraftCards = false;
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
    isPassingDraftCards = true;

    stopDraftTimer();
    rerenderArena();
    activateDraftPassAnimation();

    window.setTimeout(() => {
      const nextCurrentPlayer = getCurrentDraftPlayer();

      if (!nextCurrentPlayer || nextCurrentPlayer.picked.length >= DRAFT_PICK_TARGET) {
        completeDailyDraftPhase();
        return;
      }

      resetSinglePlayerDraftPool();
      preloadDraftImages();

      draftRound += 1;
      draftPickSecondsLeft = DRAFT_PICK_SECONDS;
      isPassingDraftCards = false;
      lastDraftPickResults = [];

      playDraftDealAnimationAndStartTimer();
    }, 940);

    return;
  }

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
  isPassingDraftCards = true;

  stopDraftTimer();
  rerenderArena();
  activateDraftPassAnimation();

  window.setTimeout(() => {
    const currentPlayer = getCurrentDraftPlayer();

    /*
      Draft mới: phát 7 lá, nhưng chỉ pick đủ 5 lá.
      Khi đã đủ 5 lá thì trả 2 lá dư còn lại về deck, không cần draft tới khi pool rỗng.
    */
    if (!currentPlayer || currentPlayer.picked.length >= DRAFT_PICK_TARGET) {
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
  }, 940);
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
  const selectedId = getDraftVisualSelectedCardId();
  const draftCards = Array.from(
    document.querySelectorAll("[data-draft-card-id]")
  ) as HTMLElement[];

  draftCards.forEach((element) => {
    const isSelected = element.dataset.draftCardId === selectedId;
    const innerCard = element.querySelector(".hand-card") as HTMLElement | null;

    element.classList.toggle("daily-draft-card--selected", isSelected);
    innerCard?.classList.toggle("hand-card--draft-selected", isSelected);

    /*
      Chỉ set layer trực tiếp. Không set inline transform nữa để không đè animation deal/pass.
      CSS sẽ lo hiệu ứng nổi/glow khi selected.
    */
    if (isSelected) {
      element.style.setProperty("z-index", "99999", "important");
      element.style.setProperty("isolation", "isolate", "important");
    } else {
      element.style.removeProperty("z-index");
      element.style.removeProperty("isolation");
    }

    if (innerCard) {
      if (isSelected) {
        innerCard.style.setProperty("z-index", "99999", "important");
        innerCard.style.setProperty("position", "relative", "important");
      } else {
        innerCard.style.removeProperty("z-index");
        innerCard.style.removeProperty("position");
      }
    }
  });

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
}

function selectDraftCard(cardId: string) {
  if (!isDraftPhase || isPassingDraftCards) return;

  /*
    Online dùng cùng cơ chế input cho mọi lượt 5/4/3/2/1:
    - không bị dealing chặn click
    - không full rerender hand khi chọn
    - bấm lại cùng lá thì toggle hủy chọn
  */
  // Cho phép chọn bài ngay cả khi animation chia bài chưa gỡ class kịp.
  // Nếu chặn bằng isInitialDealInProgress, chỉ cần animation bị kẹt là card không bấm được.
  // if (!isOnlineRoomActive() && isInitialDealInProgress) return;

  if (suppressNextClick) {
    suppressNextClick = false;

    if (focusedHandCardId || focusedBoardCard || focusedBoardPosition) {
      return;
    }
  }

  const nextSelectedCardId = draftSelectedCardId === cardId ? null : cardId;

  playGameSound("cardSelect");
  draftSelectedCardId = nextSelectedCardId;
  focusedHandCardId = null;
  focusedBoardCard = null;
  focusedBoardPosition = null;

  if (isOnlineRoomActive()) {
    selectOnlineDraftCard(cardId);
    updateDraftSelectedVisualOnly();
    return;
  }

  rerenderGameShell();
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
  playGameSound("deal");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const handElement = document.querySelector(".player-hand--draft.player-hand--dealing");
      handElement?.classList.add("deal-active");
    });
  });
}

function ensureOnlineDraftDealAnimationStarted() {
  if (!isOnlineRoomActive() || !isDraftPhase || !isInitialDealInProgress) return;

  const handElement = document.querySelector(".player-hand--draft.player-hand--dealing") as HTMLElement | null;

  if (!handElement || handElement.classList.contains("deal-active")) return;

  handElement.classList.add("deal-active");
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

function finishDraftDealWithoutFullRerender() {
  isInitialDealInProgress = false;
  dailyDealTimerId = null;

  const handElement = document.querySelector(".player-hand");
  handElement?.classList.remove("player-hand--dealing", "is-dealing", "deal-active");

  const handMeta = handElement?.querySelector(".player-hand__meta");
  if (handMeta) {
    handMeta.textContent = `Còn ${draftPickSecondsLeft}s • bấm 1 lá để chọn`;
  }

  const draftInfo = handElement?.querySelector(".draft-hand-meta__info em");
  if (draftInfo) {
    draftInfo.textContent = "Nếu không chọn, hết giờ sẽ chọn ngẫu nhiên.";
  }

  startDraftTimer();
}

function finishOnlineDraftDealVisualOnly() {
  isInitialDealInProgress = false;
  onlineDraftAnimationTimerId = null;

  const handElement = document.querySelector(".player-hand");
  handElement?.classList.remove("player-hand--dealing", "is-dealing", "deal-active");

  const handMeta = handElement?.querySelector(".player-hand__meta");
  if (handMeta) {
    handMeta.textContent = `Còn ${draftPickSecondsLeft}s • bấm 1 lá để chọn`;
  }

  const draftInfo = handElement?.querySelector(".draft-hand-meta__info em");
  if (draftInfo) {
    draftInfo.textContent = "Bấm để chọn, giữ 0.5s để xem lớn.";
  }

  updateDraftSelectedVisualOnly();
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

  isInitialDealInProgress = true;
  draftSelectedCardId = null;
  rerenderArena();
  activateDraftDealAnimation();

  /*
    CSS draft deal 7 lá: animation chạy trực tiếp trên 7 wrapper.
    Không rerender toàn arena ở frame cuối; chỉ gỡ class để tránh snap/jank.
  */
  dailyDealTimerId = window.setTimeout(() => {
    finishDraftDealWithoutFullRerender();
  }, 1320);
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
    if (!simulationResult) return;

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
                class="score-breakdown__timer ${draftPickSecondsLeft <= 3 ? "score-breakdown__timer--danger" : ""}"
                title="Thời gian chọn bài trong phase chia bài."
              >
                <span>DRAFT</span>
                <strong>${draftPickSecondsLeft}s</strong>
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
      <div class="resource-orb resource-orb--coin" title="Xu hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--coin">💰</div>
          <div class="resource-orb__value">${remaining.coin}</div>
        </div>
        <div class="resource-orb__label">TIỀN</div>
      </div>

      <div class="resource-orb resource-orb--stamina" title="Thể lực hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--stamina">🏃</div>
          <div class="resource-orb__value">${remaining.stamina}</div>
        </div>
        <div class="resource-orb__label">THỂ LỰC</div>
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

function renderSimulationResultPanel() {
  if (!simulationResult) return "";

  const result = simulationResult;
  const currentStep = getCurrentReplayStep();
  const totalSteps = Math.max(1, result.replaySteps.length);
  const currentStepNumber = Math.min(simulationReplayIndex + 1, totalSteps);
  const currentDayDelta = isReplayComplete
    ? result.finalVP
    : getCurrentReplayPartialVP();
  const ticketStepWidth = 366;
  const firstTicketCenter = 223;
  const endCenterBoost =
    simulationReplayIndex === totalSteps - 1
      ? 460
      : simulationReplayIndex === totalSteps - 2
        ? 180
        : 0;
  const trackOffset = firstTicketCenter + simulationReplayIndex * ticketStepWidth + endCenterBoost;

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
          style="transform: translateX(calc(50% - ${trackOffset}px)); --scan-index: ${simulationReplayIndex};"
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
        <div class="player-effect-dock__placeholder">Hiệu ứng đang có</div>
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
  const deckCount = isOnlineRoomActive() ? 0 : deck.length;
  const handCount =
    (isOnlineRoomActive() ? getOnlineSelfHand() : null)?.length ?? playerHand.length;

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
  const focusedCard = getHandCardById(focusedHandCardId) ?? focusedBoardCard;

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
                        </div>
                      `;
                    })
                    .join("")}
                `;
              })
              .join("")}
          </section>
        </div>

        ${isOnlineGameOver() ? renderFinalRankingPanel() : isDraftPhase ? "" : renderSimulationResultPanel()}

        ${
          isSimulationMode
            ? ""
            : `
              <section
          class="player-hand ${isInitialDealInProgress ? "player-hand--dealing is-dealing" : ""} ${isDraftPhase ? "player-hand--draft" : ""}"
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

            <div class="player-hand__meta ${isDraftPhase && draftPickSecondsLeft <= 3 ? "player-hand__meta--danger" : ""}">
              ${
                isDraftPhase
                  ? isInitialDealInProgress
                    ? "Đang phát bài..."
                    : `Còn ${draftPickSecondsLeft}s • ${isPassingDraftCards ? "Đang chuyền bài..." : "bấm 1 lá để chọn"}`
                  : isInitialDealInProgress
                    ? "Đang chia bài..."
                    : "Giữ 0.5s để xem lớn"
              }
            </div>
          </div>

          ${isDraftPhase ? renderDraftHandTopMeta() : ""}

          <div class="player-hand__cards ${isDraftPhase && isPassingDraftCards ? "is-passing" : ""}">
            ${isDraftPhase ? renderDraftHandCards() : playerHand.map((card, index) => renderHandCard(card, index)).join("")}
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

function rerenderArena() {
  const arena = document.querySelector(".arena");
  if (!arena) return;

  arena.outerHTML = renderMainArena();
}

function placeHandCardOnBoard(cardId: string, rowIndex: number, colIndex: number) {
  if (isSimulationMode || isInitialDealInProgress) return;
  if (colIndex !== currentDayIndex) return;
  if (!canPlaceOnBoardCell(rowIndex, colIndex)) return;

  const handIndex = playerHand.findIndex((card) => card.id === cardId);
  if (handIndex === -1) return;

  const selectedCard = playerHand[handIndex];

  if (isOnlineRoomActive()) {
    playGameSound("cardPlace");

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

    return;
  }

  const remainingBeforePlace = getRemainingResources();
  const coinDebt = Math.max(0, selectedCard.coin - remainingBeforePlace.coin);
  const staminaDebt = Math.max(0, selectedCard.stamina - remainingBeforePlace.stamina);

  playGameSound("cardPlace");

  playerHand.splice(handIndex, 1);
  getBoardSlots()[rowIndex][colIndex] = selectedCard;

  addLocalDebtOrExhaustToken({
    rowIndex,
    colIndex,
    card: selectedCard,
    coinDebt,
    staminaDebt,
  });

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
  return !isDraftPhase && !isSimulationMode && !isInitialDealInProgress;
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

(window as any).confirmDraftPick = () => {
  // Draft phase: click card = select only.
  // Cards are passed only when the 10s timer reaches 0.
};

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

(window as any).handleBoardCellClick = (rowIndex: number, colIndex: number) => {
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

const IN_GAME_BACKGROUND_MUSIC_SRC = "/assets/audio/music/in-game-background.mp3";
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

(window as any).toggleInGameBackgroundMusic = toggleInGameBackgroundMusic;
(window as any).setInGameBackgroundMusicVolume = setInGameBackgroundMusicVolume;

function renderOnlineRoomMenu() {
  if (!isOnlineRoomActive() || onlineClientState.roomState?.phase === "lobby") {
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
          <span>Room ${onlineClientState.roomId ?? "-"}</span>
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

function renderSidePlayerSpacers(count: number) {
  return Array.from({ length: Math.max(0, count) }, () => {
    return `<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`;
  }).join("");
}


export type AppScreen = "dashboard" | "map_selection" | "lobby" | "game";
export let currentAppScreen: AppScreen = "dashboard";

// Background smoke video reference (shared between gotoMapSelection and rerenderGameShell)
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

(window as any).gotoMapSelection = () => {
  if (!authClientState.user) {
    (window as any).focusHubAuthPanel();
    setAuthStatus("Đăng nhập hoặc đăng ký để bắt đầu hành trình.");
    return;
  }

  // 1. Create overlay video — plays from beginning (smoke effect)
  const vid = document.createElement("video");
  vid.src = "/assets/videos/chuyencanh.mp4";
  vid.muted = true;
  vid.playsInline = true;
  vid.style.cssText = [
    "position:fixed", "inset:0", "width:100%", "height:100%",
    "object-fit:cover", "z-index:9999", "pointer-events:none",
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
    video.currentTime = 0;
    
    // Play with sound, fallback to muted if autoplay blocked
    video.play().catch((e) => {
        console.warn("Video play failed with sound, attempting muted.", e);
        video.muted = true;
        video.play().catch(err => {
            console.error("Video play failed completely.", err);
        });
    });

    const finishTransition = () => {
      if (!isCinematicTransitioning) return;
      isCinematicTransitioning = false;

      overlay.style.display = "block";
      overlay.style.opacity = "1";
      video.style.display = "none";
      video.ontimeupdate = null; // cleanup
      
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

function renderGameShell() {
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

  if (onlineClientState.roomState?.phase === "lobby") {
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

(window as any).rerenderGameShell = rerenderGameShell;
function rerenderGameShell() {
  stopOutsideBackgroundMedia();

  app.innerHTML = renderGameShell();
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
}

let lastOnlineRenderSignature = "";
let lastOnlineAnimationPhase: string | null = null;
let lastOnlineAnimationDraftRound = 0;
let lastOnlineAnimationPoolSignature = "";
let onlineDraftAnimationTimerId: number | null = null;
let hasStartedOnlineSimulationReplay = false;
let onlineDraftDisplayPool: TravelCardData[] | null = null;
let onlineDraftPendingPool: TravelCardData[] | null = null;
let shouldActivateOnlineDealAnimation = false;
let shouldActivateOnlinePassAnimation = false;
let isOnlineFinalDraftReturnAnimating = false;
let onlineFinalDraftReturnTimerId: number | null = null;
let hasPlayedOnlinePlanningDealAfterDraft = false;

function clearOnlineDraftAnimationTimer() {
  if (onlineDraftAnimationTimerId !== null) {
    window.clearTimeout(onlineDraftAnimationTimerId);
    onlineDraftAnimationTimerId = null;
  }

  if (onlineFinalDraftReturnTimerId !== null) {
    window.clearTimeout(onlineFinalDraftReturnTimerId);
    onlineFinalDraftReturnTimerId = null;
  }
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
        boardSignature,
      ].join("~");
    })
    .join("||");

  return [
    state.phase,
    state.phaseNumber ?? 1,
    state.dayIndex,
    state.draftRound,
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
    timerValueElement.textContent = `${state.timer}s`;
    timerElement.classList.toggle("score-breakdown__timer--danger", state.timer <= 3);
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
    
    if (!isCinematicTransitioning) {
        rerenderGameShell();
    }

    if (shouldActivateOnlineDealAnimation) {
      shouldActivateOnlineDealAnimation = false;
      activateDraftDealAnimation();

      window.setTimeout(() => {
        ensureOnlineDraftDealAnimationStarted();
      }, 80);
    }

    if (shouldActivateOnlinePassAnimation) {
      shouldActivateOnlinePassAnimation = false;
      activateDraftPassAnimation();
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

initOnlineClient(() => {
  applyOnlineRoomStateToLocal();
  renderAfterOnlineStateChange();
});

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

  createOnlineRoom(playerName);
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

rerenderGameShell();
