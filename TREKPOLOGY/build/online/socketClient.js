var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const AUTH_STORAGE_KEY = "travel_board_auth_user";
export const authClientState = {
    isReady: false,
    user: null,
};
function loadSavedAuthUser() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.username)
            return null;
        return parsed;
    }
    catch (_a) {
        return null;
    }
}
function saveAuthUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}
function createLocalAuthUser(username, displayName) {
    const cleanUsername = username.trim();
    return {
        id: cleanUsername.toLowerCase(),
        username: cleanUsername,
        displayName: (displayName === null || displayName === void 0 ? void 0 : displayName.trim()) || cleanUsername,
    };
}
export function loginAccount(payload) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
export function registerAccount(payload) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
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
export const onlineClientState = {
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
function saveOnlineSession(playerName) {
    var _a, _b, _c;
    if (!onlineClientState.roomId || !onlineClientState.playerId)
        return;
    /*
      Dùng sessionStorage thay vì localStorage.
      localStorage bị share giữa các tab, nên tab 2 join P2 sẽ ghi đè session của tab 1.
      Khi tab 1 refresh sẽ reconnect nhầm thành P2.
      sessionStorage là riêng từng tab, nên tab 1 giữ P1, tab 2 giữ P2.
    */
    localStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
    sessionStorage.setItem(ONLINE_SESSION_STORAGE_KEY, JSON.stringify({
        roomId: onlineClientState.roomId,
        playerId: onlineClientState.playerId,
        playerName: (_c = playerName !== null && playerName !== void 0 ? playerName : (_b = (_a = onlineClientState.roomState) === null || _a === void 0 ? void 0 : _a.players[onlineClientState.playerId]) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "Player",
    }));
}
export function getSavedOnlineSession() {
    const raw = sessionStorage.getItem(ONLINE_SESSION_STORAGE_KEY);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
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
export function initOnlineClient(onStateChange) {
    const savedUser = loadSavedAuthUser();
    authClientState.user = savedUser;
    authClientState.isReady = true;
    window.setTimeout(onStateChange, 0);
    socket.on("connect", () => {
        const savedSession = getSavedOnlineSession();
        if (!savedSession || onlineClientState.roomState)
            return;
        socket.emit("room:reconnect", savedSession);
    });
    socket.on("room:joined", (payload) => {
        var _a;
        onlineClientState.roomId = payload.roomId;
        onlineClientState.playerId = payload.playerId;
        onlineClientState.roomState = payload.state;
        saveOnlineSession((_a = payload.state.players[payload.playerId]) === null || _a === void 0 ? void 0 : _a.name);
        console.log("Joined room:", payload.roomId, "as", payload.playerId);
        onStateChange();
    });
    socket.on("room:state", (state) => {
        onlineClientState.roomState = state;
        onStateChange();
    });
    socket.on("game:error", (payload) => {
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
export function createOnlineRoom(playerName) {
    if (!socket.connected) {
        socket.connect();
    }
    socket.emit("room:create", {
        playerName,
    });
}
export function joinOnlineRoom(roomId, playerName) {
    if (!socket.connected) {
        socket.connect();
    }
    socket.emit("room:join", {
        roomId,
        playerName,
    });
}
export function reconnectOnlineRoom(roomId, playerId, playerName) {
    socket.emit("room:reconnect", {
        roomId,
        playerId,
        playerName,
    });
}
export function setOnlineReady(isReady) {
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
export function selectOnlineDraftCard(cardId) {
    if (!onlineClientState.roomId || !onlineClientState.playerId) {
        return;
    }
    socket.emit("draft:selectCard", {
        roomId: onlineClientState.roomId,
        playerId: onlineClientState.playerId,
        cardId,
    });
}
export function sendPlaceCard(payload) {
    if (!onlineClientState.roomId || !onlineClientState.playerId) {
        return;
    }
    socket.emit("planning:placeCard", Object.assign({ roomId: onlineClientState.roomId, playerId: onlineClientState.playerId }, payload));
}
export function sendDiscardCard(payload) {
    if (!onlineClientState.roomId || !onlineClientState.playerId) {
        return;
    }
    socket.emit("planning:discardCard", Object.assign({ roomId: onlineClientState.roomId, playerId: onlineClientState.playerId }, payload));
}
export function sendPayDebt(payload = {}) {
    if (!onlineClientState.roomId || !onlineClientState.playerId) {
        return;
    }
    socket.emit("planning:payDebt", Object.assign({ roomId: onlineClientState.roomId, playerId: onlineClientState.playerId }, payload));
}
export function sendReturnBoardCard(payload) {
    if (!onlineClientState.roomId || !onlineClientState.playerId) {
        return;
    }
    socket.emit("planning:returnBoardCard", Object.assign({ roomId: onlineClientState.roomId, playerId: onlineClientState.playerId }, payload));
}
