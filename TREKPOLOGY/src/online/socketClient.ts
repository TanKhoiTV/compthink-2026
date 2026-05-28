import type { PlayerId } from "../types.js";

declare const io: any;

export type PublicBoardCell = {
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
} | null;

export type OnlineTravelCardData = {
  id: string;
  name: string;
  city: string;
  image: string;
  rarity: "common" | "uncommon" | "epic" | "legendary";
  rarityLabel: string;
  vp: number;
  coin: number;
  stamina: number;
  tag: string;
  tagLabel: string;
  tags?: string[];
  icon: string;
  description: string;
  bonusText: string;
  shortName?: string;
  shortCity?: string;
};

export type PlayerPublicState = {
  id: PlayerId;
  name: string;
  score: number;
  coin: number;
  stamina: number;
  usedSlots: number;
  coinDebt: number;
  isConnected: boolean;
  isReady: boolean;
  hasJoined: boolean;
  board: PublicBoardCell[][];
};

export type OnlineRoomState = {
  roomId: string;
  phase: "lobby" | "cinematic" | "draft" | "planning" | "simulation" | "result" | "gameover";
  phaseNumber: number;
  dayIndex: number;
  draftRound: number;
  timer: number;
  selfPlayerId: PlayerId;
  players: Record<PlayerId, PlayerPublicState>;
  self: {
    draftPool: OnlineTravelCardData[];
    pickedDraftCards: OnlineTravelCardData[];
    hand: OnlineTravelCardData[];
    selectedDraftCardId: string | null;
  };
};

export type OnlineClientState = {
  roomId: string | null;
  playerId: PlayerId | null;
  roomState: OnlineRoomState | null;
};

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
};

export type AuthClientState = {
  isReady: boolean;
  user: AuthUser | null;
};

const AUTH_STORAGE_KEY = "travel_board_auth_user";

export const authClientState: AuthClientState = {
  isReady: false,
  user: null,
};

function loadSavedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthUser;

    if (!parsed || !parsed.username) return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function createLocalAuthUser(username: string, displayName?: string): AuthUser {
  const cleanUsername = username.trim();

  return {
    id: cleanUsername.toLowerCase(),
    username: cleanUsername,
    displayName: displayName?.trim() || cleanUsername,
  };
}

export async function loginAccount(payload: {
  username: string;
  password: string;
}) {
  const username = payload.username.trim();

  if (!username) {
    throw new Error("Nhập username trước.");
  }

  if (!payload.password) {
    throw new Error("Nhập password trước.");
  }

  const user = createLocalAuthUser(username);

  authClientState.user = user;
  authClientState.isReady = true;
  saveAuthUser(user);

  return user;
}

export async function registerAccount(payload: {
  displayName?: string;
  username: string;
  password: string;
}) {
  const username = payload.username.trim();

  if (!username) {
    throw new Error("Nhập username trước.");
  }

  if (!payload.password || payload.password.length < 6) {
    throw new Error("Password cần ít nhất 6 ký tự.");
  }

  const user = createLocalAuthUser(username, payload.displayName);

  authClientState.user = user;
  authClientState.isReady = true;
  saveAuthUser(user);

  return user;
}

export function logoutAccount() {
  authClientState.user = null;
  authClientState.isReady = true;

  onlineClientState.roomId = null;
  onlineClientState.playerId = null;
  onlineClientState.roomState = null;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  clearSavedOnlineSession();
}

const socket = io("http://localhost:3001");
const ONLINE_SESSION_STORAGE_KEY = "travel_board_online_session";

export const onlineClientState: OnlineClientState = {
  roomId: null,
  playerId: null,
  roomState: null,
};

function clearLegacySharedOnlineSession() {
  /*
    Xóa session cũ đã từng lưu bằng localStorage.
    Nếu không xóa, các tab cũ có thể tiếp tục reconnect nhầm player.
  */
  localStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
}

clearLegacySharedOnlineSession();


function saveOnlineSession(playerName?: string) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) return;

  /*
    Dùng sessionStorage thay vì localStorage.
    localStorage bị share giữa các tab, nên tab 2 join P2 sẽ ghi đè session của tab 1.
    Khi tab 1 refresh sẽ reconnect nhầm thành P2.
    sessionStorage là riêng từng tab, nên tab 1 giữ P1, tab 2 giữ P2.
  */
  localStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
  sessionStorage.setItem(
    ONLINE_SESSION_STORAGE_KEY,
    JSON.stringify({
      roomId: onlineClientState.roomId,
      playerId: onlineClientState.playerId,
      playerName: playerName ?? onlineClientState.roomState?.players[onlineClientState.playerId]?.name ?? "Player",
    })
  );
}

export function getSavedOnlineSession(): {
  roomId: string;
  playerId: PlayerId;
  playerName: string;
} | null {
  const raw = sessionStorage.getItem(ONLINE_SESSION_STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSavedOnlineSession() {
  sessionStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
  localStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
  onlineClientState.roomId = null;
  onlineClientState.playerId = null;
  onlineClientState.roomState = null;
}



export function initOnlineClient(onStateChange: () => void) {
  const savedUser = loadSavedAuthUser();

  authClientState.user = savedUser;
  authClientState.isReady = true;
  window.setTimeout(onStateChange, 0);

  socket.on("connect", () => {
    const savedSession = getSavedOnlineSession();

    if (!savedSession || onlineClientState.roomState) return;

    socket.emit("room:reconnect", savedSession);
  });

  socket.on("room:joined", (payload: {
    roomId: string;
    playerId: PlayerId;
    state: OnlineRoomState;
  }) => {
    onlineClientState.roomId = payload.roomId;
    onlineClientState.playerId = payload.playerId;
    onlineClientState.roomState = payload.state;

    saveOnlineSession(payload.state.players[payload.playerId]?.name);
    console.log("Joined room:", payload.roomId, "as", payload.playerId);
    onStateChange();
  });

  socket.on("room:state", (state: OnlineRoomState) => {
    onlineClientState.roomState = state;
    onStateChange();
  });

  socket.on("game:error", (payload: { message: string }) => {
    alert(payload.message);
  });

  socket.on("connect_error", () => {
    console.warn("Không kết nối được socket server. Kiểm tra server port 3001.");
  });

  socket.on("room:left", () => {
    clearSavedOnlineSession();
    onStateChange();
  });
}

export function createOnlineRoom(playerName: string) {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("room:create", {
    playerName,
  });
}

export function joinOnlineRoom(roomId: string, playerName: string) {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("room:join", {
    roomId,
    playerName,
  });
}


export function reconnectOnlineRoom(roomId: string, playerId: PlayerId, playerName: string) {
  socket.emit("room:reconnect", {
    roomId,
    playerId,
    playerName,
  });
}

export function setOnlineReady(isReady: boolean) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("room:setReady", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
    isReady,
  });
}


export function leaveOnlineRoom() {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    clearSavedOnlineSession();
    return;
  }

  socket.emit("room:leave", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
  });

  clearSavedOnlineSession();
}



export function startOnlineGame() {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("game:start", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
  });
}

export function selectOnlineDraftCard(cardId: string) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("draft:selectCard", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
    cardId,
  });
}

export function sendPlaceCard(payload: {
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
}) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("planning:placeCard", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
    ...payload,
  });
}


export function sendDiscardCard(payload: {
  cardId: string;
  coin?: number;
  stamina?: number;
  name?: string;
}) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("planning:discardCard", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
    ...payload,
  });
}


export function sendPayDebt(payload: {
  amount?: number;
  rowIndex?: number;
  colIndex?: number;
} = {}) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("planning:payDebt", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
    ...payload,
  });
}


export function sendReturnBoardCard(payload: {
  rowIndex: number;
  colIndex: number;
}) {
  if (!onlineClientState.roomId || !onlineClientState.playerId) {
    return;
  }

  socket.emit("planning:returnBoardCard", {
    roomId: onlineClientState.roomId,
    playerId: onlineClientState.playerId,
    ...payload,
  });
}
