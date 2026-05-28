import type { PlayerId, RoomState, ServerTravelCardData } from "./types.js";
import {
  createEmptyPlayer,
  createRoomId,
  createServerDeck,
  shuffleCards,
} from "./gameEngine.js";
import { startDraftForCurrentDay } from "./draftEngine.js";

const PLAYER_IDS: PlayerId[] = ["p1", "p2", "p3", "p4"];


type ServerCardEffect = {
  has_effect: boolean;
  effect_type: string;
  effect_value: number;
};

type ServerTravelCardWithEffect = ServerTravelCardData & {
  onPlayEffect?: ServerCardEffect;
};

type PlayerWithTemporaryEffects = RoomState["players"][PlayerId] & {
  ignoreDistanceNext?: number;
  discountXuNext?: number;
  doubleVpNext?: number;
};

function getCardEffect(card: ServerTravelCardData | null): ServerCardEffect | null {
  return (card as ServerTravelCardWithEffect | null)?.onPlayEffect ?? null;
}

function getPrimaryCardTag(card: ServerTravelCardData): string {
  const tags = card.tags ?? [];

  if (tags.includes("UTILITY")) return "UTILITY";
  if (tags.includes("FOOD")) return "FOOD";
  if (tags.includes("CULTURE")) return "CULTURE";
  if (tags.includes("ACTION")) return "ACTION";

  return card.tag?.toUpperCase?.() ?? "UNKNOWN";
}

function isUtilityCard(card: ServerTravelCardData | null): boolean {
  if (!card) return false;
  return getPrimaryCardTag(card) === "UTILITY";
}

function getNextTimeSlotPosition(rowIndex: number, colIndex: number): {
  rowIndex: number;
  colIndex: number;
} | null {
  if (rowIndex < 4) {
    return {
      rowIndex: rowIndex + 1,
      colIndex,
    };
  }

  if (colIndex < 4) {
    return {
      rowIndex: 0,
      colIndex: colIndex + 1,
    };
  }

  return null;
}

function addStaminaLockToNextSlot(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    rowIndex: number;
    colIndex: number;
    cardId: string;
    cardName: string;
  }
) {
  const player = state.players[payload.playerId];
  const nextPosition = getNextTimeSlotPosition(payload.rowIndex, payload.colIndex);

  if (!player || !nextPosition) return;

  if (player.board[nextPosition.rowIndex]?.[nextPosition.colIndex] !== null) {
    return;
  }

  player.board[nextPosition.rowIndex][nextPosition.colIndex] = {
    cardId: `lock_${payload.cardId}_${payload.colIndex}_${payload.rowIndex}`,
    name: "Bị khóa",
    tag: "utility",
    icon: "🔒",
    vp: 0,
    coin: 0,
    stamina: 0,
    type: "lock",
    lockedReason: "Kiệt sức",
    sourceCardName: payload.cardName,
  };
}

function applyUtilityCardEffect(
  player: RoomState["players"][PlayerId],
  card: ServerTravelCardData
) {
  const effect = getCardEffect(card);

  if (!effect?.has_effect || effect.effect_type === "NONE") return;

  const effectValue = Math.max(0, Number(effect.effect_value) || 0);
  const playerWithEffects = player as PlayerWithTemporaryEffects;

  switch (effect.effect_type) {
    case "RECOVER_XU":
      player.coin += effectValue;
      return;

    case "RECOVER_LA":
      player.stamina += effectValue;
      return;

    case "DEDUCT_LA":
      player.stamina = Math.max(0, player.stamina - effectValue);
      return;

    case "IGNORE_DISTANCE_NEXT":
      playerWithEffects.ignoreDistanceNext = (playerWithEffects.ignoreDistanceNext ?? 0) + effectValue;
      return;

    case "DISCOUNT_XU_NEXT":
      playerWithEffects.discountXuNext = (playerWithEffects.discountXuNext ?? 0) + effectValue;
      return;

    case "DOUBLE_VP_NEXT":
      playerWithEffects.doubleVpNext = (playerWithEffects.doubleVpNext ?? 0) + effectValue;
      return;

    default:
      return;
  }
}

function getServerCardById(cardId: string): ServerTravelCardData | null {
  return createServerDeck().find((card) => card.id === cardId) ?? null;
}

function clearGeneratedTokenForReturnedCard(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    rowIndex: number;
    colIndex: number;
    cardName: string;
  }
) {
  const player = state.players[payload.playerId];
  const nextPosition = getNextTimeSlotPosition(payload.rowIndex, payload.colIndex);

  if (!player || !nextPosition) return;

  const nextCell = player.board[nextPosition.rowIndex]?.[nextPosition.colIndex];

  if (
    nextCell &&
    nextCell.type === "lock" &&
    nextCell.sourceCardName === payload.cardName
  ) {
    player.board[nextPosition.rowIndex][nextPosition.colIndex] = null;
  }
}

export function createRoom(firstPlayerName: string): {
  roomId: string;
  playerId: PlayerId;
  state: RoomState;
} {
  const roomId = createRoomId();

  const state: RoomState = {
    roomId,
    phase: "lobby",
    phaseNumber: 1,
    dayIndex: 0,
    draftRound: 0,
    timer: 0,
    deck: shuffleCards(createServerDeck()),
    players: {
      p1: createEmptyPlayer("p1", firstPlayerName || "An", true),
      p2: createEmptyPlayer("p2", "Cường", false),
      p3: createEmptyPlayer("p3", "Minh", false),
      p4: createEmptyPlayer("p4", "Khánh", false),
    },
  };

  return {
    roomId,
    playerId: "p1",
    state,
  };
}

export function joinRoom(state: RoomState, playerName: string): PlayerId | null {
  const openPlayerId = PLAYER_IDS.find((playerId) => !state.players[playerId].hasJoined);

  if (!openPlayerId) {
    return null;
  }

  state.players[openPlayerId] = {
    ...state.players[openPlayerId],
    name: playerName || state.players[openPlayerId].name,
    isConnected: true,
    isReady: false,
    hasJoined: true,
  };

  return openPlayerId;
}

export function reconnectRoom(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    playerName: string;
  }
): PlayerId | null {
  const player = state.players[payload.playerId];

  if (!player) return null;

  player.isConnected = true;
  player.hasJoined = true;

  if (payload.playerName) {
    player.name = payload.playerName;
  }

  return payload.playerId;
}

export function setPlayerReady(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    isReady: boolean;
  }
): string | null {
  if (state.phase !== "lobby") {
    return "Chỉ có thể sẵn sàng khi phòng đang chờ.";
  }

  const player = state.players[payload.playerId];

  if (!player || !player.isConnected) {
    return "Người chơi chưa ở trong phòng.";
  }

  player.isReady = payload.isReady;
  return null;
}

function getConnectedPlayers(state: RoomState) {
  return PLAYER_IDS
    .map((playerId) => state.players[playerId])
    .filter((player) => player.isConnected);
}

function areAllConnectedPlayersReady(state: RoomState) {
  const connectedPlayers = getConnectedPlayers(state);

  return connectedPlayers.length > 0 && connectedPlayers.every((player) => player.isReady);
}

export function leaveRoom(
  state: RoomState,
  payload: {
    playerId: PlayerId;
  }
): string | null {
  const player = state.players[payload.playerId];

  if (!player) {
    return "Không tìm thấy người chơi.";
  }

  player.isConnected = false;
  player.isReady = false;
  player.hasJoined = true;

  /*
    Thoát phòng chỉ chuyển sang offline/reserved.
    Không cho người khác dùng room code để chiếm lại slot này.
    Người cũ chỉ quay lại bằng reconnect session.
  */
  return null;
}

export function startGame(
  state: RoomState,
  payload: {
    playerId: PlayerId;
  }
): string | null {
  if (state.phase !== "lobby") {
    return "Phòng đã bắt đầu.";
  }

  if (payload.playerId !== "p1") {
    return "Chỉ host p1 mới được bắt đầu.";
  }

  const host = state.players.p1;

  if (!host || !host.isConnected) {
    return "Host chưa ở trong phòng.";
  }

  if (!areAllConnectedPlayersReady(state)) {
    return "Cần tất cả người chơi trong phòng bấm Sẵn sàng.";
  }

  state.dayIndex = 0;

  for (const playerId of PLAYER_IDS) {
    state.players[playerId].isReady = false;
  }

  state.phase = "cinematic";
  state.timer = 7; // Wait 7 seconds for cinematic transition before starting draft
  return null;
}


export function placeCardOnPlayerBoard(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    cardId: string;
    rowIndex: number;
    colIndex: number;
    tag?: string;
    icon?: string;
    vp?: number;
    coin?: number;
    stamina?: number;
    image?: string;
    name?: string;
  }
): string | null {
  const player = state.players[payload.playerId];

  if (!player) return "Không tìm thấy người chơi.";
  if (state.phase !== "planning") return "Chưa tới phase xếp bài.";
  if (payload.colIndex !== state.dayIndex) return "Chỉ được xếp bài vào ngày hiện tại.";

  const cell = player.board[payload.rowIndex]?.[payload.colIndex];

  if (cell === undefined) return "Ô không hợp lệ.";
  if (cell !== null) {
    return "Ô này đã có bài hoặc đang bị khóa.";
  }

  const handIndex = player.hand.findIndex((card) => card.id === payload.cardId);
  const card = handIndex >= 0 ? player.hand[handIndex] : null;

  const cardId = card?.id ?? payload.cardId;
  const cardName = card?.name ?? payload.name ?? payload.cardId;
  const cardImage = card?.image ?? payload.image ?? "";
  const cardTag = card?.tag ?? payload.tag;
  const cardIcon = card?.icon ?? payload.icon;
  const cardVp = card?.vp ?? payload.vp;
  const cardCoin = card?.coin ?? payload.coin ?? 0;
  const cardStamina = card?.stamina ?? payload.stamina ?? 0;

  if (!cardTag || !cardIcon || typeof cardVp !== "number") {
    return "Không đủ dữ liệu lá bài để xếp.";
  }

  const coinDebt = Math.max(0, cardCoin - player.coin);
  const staminaDebt = Math.max(0, cardStamina - player.stamina);

  if (handIndex >= 0) {
    player.hand.splice(handIndex, 1);
  }

  player.coin = Math.max(0, player.coin - cardCoin);
  player.stamina = Math.max(0, player.stamina - cardStamina);

  if (coinDebt > 0) {
    player.coinDebt = (player.coinDebt ?? 0) + coinDebt;
  }

  if (card && isUtilityCard(card)) {
    /*
      Utility: đặt xuống để kích hoạt hiệu ứng rồi biến mất.
      Không chiếm ô, không tăng usedSlots, không tạo board card.
    */
    applyUtilityCardEffect(player, card);
    return null;
  }

  player.usedSlots += 1;

  player.board[payload.rowIndex][payload.colIndex] = {
    cardId,
    name: cardName,
    tag: cardTag,
    icon: cardIcon,
    vp: cardVp,
    coin: cardCoin,
    stamina: cardStamina,
    image: cardImage,
    type: "card",
  };

  if (staminaDebt > 0) {
    addStaminaLockToNextSlot(state, {
      playerId: payload.playerId,
      rowIndex: payload.rowIndex,
      colIndex: payload.colIndex,
      cardId,
      cardName,
    });
  }

  return null;
}

export function discardCardFromPlayerHand(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    cardId: string;
    coin?: number;
    stamina?: number;
    name?: string;
  }
): string | null {
  const player = state.players[payload.playerId];

  if (!player) return "Không tìm thấy người chơi.";
  if (state.phase !== "planning") return "Chỉ được discard trong phase xếp bài.";

  const handIndex = player.hand.findIndex((card) => card.id === payload.cardId);
  const card = handIndex >= 0 ? player.hand[handIndex] : null;

  if (!card) {
    return "Không tìm thấy lá bài trên tay để discard.";
  }

  player.hand.splice(handIndex, 1);

  /*
    Discard = bỏ lá khỏi tay để nhận lại tài nguyên bằng cost của lá.
    Không tăng usedSlots, không đặt lên board, không tính điểm.
  */
  player.coin += card.coin ?? payload.coin ?? 0;
  player.stamina += card.stamina ?? payload.stamina ?? 0;

  return null;
}


export function payDebtTokenOnBoard(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    amount?: number;
    rowIndex?: number;
    colIndex?: number;
  }
): string | null {
  const player = state.players[payload.playerId];

  if (!player) return "Không tìm thấy người chơi.";
  if (state.phase !== "planning") return "Chỉ được trả nợ trong phase xếp bài.";

  const debtAmount = player.coinDebt ?? 0;

  if (debtAmount <= 0) {
    return "Bạn không có nợ xu cần trả.";
  }

  const requestedAmount = Math.max(0, Math.floor(payload.amount ?? debtAmount));
  const payableAmount = Math.min(player.coin, debtAmount, requestedAmount);

  if (payableAmount <= 0) {
    return `Không có đủ xu để trả nợ. Đang nợ ${debtAmount} xu.`;
  }

  player.coin -= payableAmount;
  player.coinDebt = Math.max(0, debtAmount - payableAmount);

  return null;
}

export function returnBoardCardToPlayerHand(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    rowIndex: number;
    colIndex: number;
  }
): string | null {
  const player = state.players[payload.playerId];

  if (!player) return "Không tìm thấy người chơi.";
  if (state.phase !== "planning") return "Chỉ được rút bài trong phase xếp bài.";
  if (payload.colIndex !== state.dayIndex) return "Chỉ được rút bài của ngày hiện tại.";

  const cell = player.board[payload.rowIndex]?.[payload.colIndex];

  if (!cell) return "Ô này không có bài.";
  if (cell.type === "debt" || cell.type === "lock") {
    return "Không thể rút token nợ/khóa về tay.";
  }

  const originalCard = getServerCardById(cell.cardId);
  const returnedCard: ServerTravelCardData = originalCard ?? {
    id: cell.cardId,
    name: cell.name,
    city: "",
    image: cell.image ?? "",
    rarity: "common",
    rarityLabel: "★",
    vp: cell.vp,
    coin: cell.coin,
    stamina: cell.stamina,
    tag: cell.tag,
    tagLabel: cell.tag,
    tags: [cell.tag.toUpperCase()],
    icon: cell.icon,
    description: "",
    bonusText: "",
    shortName: cell.name,
    shortCity: "",
  };

  player.board[payload.rowIndex][payload.colIndex] = null;
  clearGeneratedTokenForReturnedCard(state, {
    playerId: payload.playerId,
    rowIndex: payload.rowIndex,
    colIndex: payload.colIndex,
    cardName: cell.name,
  });

  player.hand.unshift(returnedCard);

  while (player.hand.length > 5) {
    const overflowCard = player.hand.pop();

    if (overflowCard) {
      state.deck.unshift(overflowCard);
    }
  }

  player.coin += cell.coin ?? 0;
  player.stamina += cell.stamina ?? 0;
  player.usedSlots = Math.max(0, player.usedSlots - 1);

  return null;
}
