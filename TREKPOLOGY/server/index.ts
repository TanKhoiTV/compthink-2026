import http from "node:http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  PlayerId,
  RoomState,
  ServerToClientEvents,
} from "./types.js";
import { confirmDraftPick, selectDraftCard } from "./draftEngine.js";
import { getPlayerViewState } from "./gameEngine.js";
import {
  confirmPlanning,
  createRoom,
  discardCardFromPlayerHand,
  joinRoom,
  leaveRoom,
  payDebtTokenOnBoard,
  placeCardOnPlayerBoard,
  returnBoardCardToPlayerHand,
  reconnectRoom,
  setPlayerReady,
  startGame,
} from "./rooms.js";
import { tickRoom } from "./timerEngine.js";
import { driveBots, fillRoomWithBots } from "./bot.js";

const httpServer = http.createServer();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map<string, RoomState>();
const socketPlayerIds = new Map<string, PlayerId>();
const socketRoomIds = new Map<string, string>();

const matchmakingQueue: { socketId: string; playerName: string }[] = [];

function bindSocketPlayer(
  socket: { id: string; join: (room: string) => void },
  payload: { roomId: string; playerId: PlayerId },
  state: RoomState
): PlayerId | null {
  const mappedPlayerId = socketPlayerIds.get(socket.id);
  const playerId = mappedPlayerId ?? payload.playerId;
  const player = state.players[playerId];

  if (!player?.isConnected) {
    return null;
  }

  socketPlayerIds.set(socket.id, playerId);
  socketRoomIds.set(socket.id, payload.roomId);
  socket.join(payload.roomId);

  return playerId;
}

function emitRoomState(roomId: string) {
  const state = rooms.get(roomId);

  if (!state) return;

  const sockets = io.sockets.adapter.rooms.get(roomId);

  if (!sockets) return;

  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId);
    const playerId = socketPlayerIds.get(socketId);

    if (!socket || !playerId) continue;

    socket.emit("room:state", getPlayerViewState(state, playerId));
  }
}

// =========================================================
// MATCHMAKING: mở trận từ nhóm đang chờ + đổ bot cho đủ 4
// =========================================================
const MATCHMAKING_FILL_TIMEOUT_MS = 12000;
let matchmakingTimer: ReturnType<typeof setTimeout> | null = null;

function clearMatchmakingTimer() {
  if (matchmakingTimer) {
    clearTimeout(matchmakingTimer);
    matchmakingTimer = null;
  }
}

// Hết giờ chờ mà chưa đủ 4 người thật → mở trận với số người đang có + bot.
function scheduleMatchmakingTimer() {
  if (matchmakingTimer) return; // đã có hẹn giờ đang chạy
  matchmakingTimer = setTimeout(() => {
    matchmakingTimer = null;
    if (matchmakingQueue.length === 0) return;
    const group = matchmakingQueue.splice(0, Math.min(4, matchmakingQueue.length));
    launchMatchmakingGame(group);
    if (matchmakingQueue.length > 0) scheduleMatchmakingTimer(); // còn người chờ → hẹn tiếp
  }, MATCHMAKING_FILL_TIMEOUT_MS);
}

// Tạo phòng từ nhóm người thật (1–4), điền bot cho đủ ghế, rồi sút vào cinematic.
function launchMatchmakingGame(group: { socketId: string; playerName: string }[]) {
  if (group.length === 0) return;

  const host = group[0];
  const { roomId, playerId: hostPlayerId, state } = createRoom(host.playerName);
  rooms.set(roomId, state);

  const hostSocket = io.sockets.sockets.get(host.socketId);
  if (hostSocket) {
    socketPlayerIds.set(host.socketId, hostPlayerId);
    socketRoomIds.set(host.socketId, roomId);
    hostSocket.join(roomId);
    hostSocket.emit("room:joined", { roomId, playerId: hostPlayerId, state: getPlayerViewState(state, hostPlayerId) });
  }

  for (let i = 1; i < group.length && i < 4; i++) {
    const member = group[i];
    const memberSocket = io.sockets.sockets.get(member.socketId);
    const memberPlayerId = joinRoom(state, member.playerName);
    if (memberSocket && memberPlayerId) {
      socketPlayerIds.set(member.socketId, memberPlayerId);
      socketRoomIds.set(member.socketId, roomId);
      memberSocket.join(roomId);
      memberSocket.emit("room:joined", { roomId, playerId: memberPlayerId, state: getPlayerViewState(state, memberPlayerId) });
    }
  }

  // Điền ghế trống bằng bot cho đủ 4 (khi chưa đủ người thật).
  fillRoomWithBots(state);

  const allPlayerIds: PlayerId[] = ["p1", "p2", "p3", "p4"];
  allPlayerIds.forEach((pid) => {
    if (state.players[pid]) state.players[pid].isReady = true;
  });
  state.phase = "cinematic";
  state.timer = 7; // đếm ngược chuyển cảnh

  emitRoomState(roomId);
}

setInterval(() => {
  for (const [roomId, state] of rooms) {
    tickRoom(state);
    driveBots(state);
    emitRoomState(roomId);
  }
}, 1000);

io.on("connection", (socket) => {
  socket.on("room:create", ({ playerName, isTutorial }) => {
    const { roomId, playerId, state } = createRoom(playerName);

    if (isTutorial) {
      state.isTutorial = true;
    }

    rooms.set(roomId, state);
    socketPlayerIds.set(socket.id, playerId);
    socketRoomIds.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit("room:joined", {
      roomId,
      playerId,
      state: getPlayerViewState(state, playerId),
    });
    emitRoomState(roomId);
  });

// =========================================================
  // MATCHMAKING: TÌM TRẬN TỰ ĐỘNG (BẾ 4 NGƯỜI VÀO GAME)
  // =========================================================
  socket.on("matchmaking:find", ({ playerName }) => {
    // 1. Nhét vào hàng đợi (nếu chưa có)
    const isAlreadyInQueue = matchmakingQueue.some(p => p.socketId === socket.id);
    if (!isAlreadyInQueue) {
      matchmakingQueue.push({ socketId: socket.id, playerName: playerName || "Lữ Khách" });
    }

    // 2. Đủ 4 người thật → mở trận ngay. Chưa đủ → bật đồng hồ chờ;
    //    hết 12s sẽ mở trận với số người đang có + bot cho đủ 4.
    if (matchmakingQueue.length >= 4) {
      clearMatchmakingTimer();
      const group = matchmakingQueue.splice(0, 4);
      launchMatchmakingGame(group);
    } else {
      scheduleMatchmakingTimer();
    }
  });

  // Hủy tìm trận (Thoát hàng đợi)
  socket.on("matchmaking:cancel", () => {
    const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
    if (matchmakingQueue.length === 0) clearMatchmakingTimer();
  });
  // =========================================================

  socket.on("tutorial:pauseReplay", ({ roomId }) => {
    const state = rooms.get(roomId);
    if (state) state.tutorialPaused = true;
  });

  socket.on("tutorial:resumeReplay", ({ roomId }) => {
    const state = rooms.get(roomId);
    if (state) state.tutorialPaused = false;
  });

  socket.on("room:join", ({ roomId, playerName }) => {
    const state = rooms.get(roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const playerId = joinRoom(state, playerName);

    if (!playerId) {
      socket.emit("game:error", { message: "Phòng đã đủ 4 người." });
      return;
    }

    socketPlayerIds.set(socket.id, playerId);
    socketRoomIds.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit("room:joined", {
      roomId,
      playerId,
      state: getPlayerViewState(state, playerId),
    });
    emitRoomState(roomId);
  });

  socket.on("room:reconnect", ({ roomId, playerId, playerName }) => {
    const state = rooms.get(roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng để reconnect." });
      return;
    }

    const reconnectedPlayerId = reconnectRoom(state, { playerId, playerName });

    if (!reconnectedPlayerId) {
      socket.emit("game:error", { message: "Không tìm thấy người chơi để reconnect." });
      return;
    }

    socketPlayerIds.set(socket.id, reconnectedPlayerId);
    socketRoomIds.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit("room:joined", {
      roomId,
      playerId: reconnectedPlayerId,
      state: getPlayerViewState(state, reconnectedPlayerId),
    });
    emitRoomState(roomId);
  });

  socket.on("room:leave", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("room:left");
      socketPlayerIds.delete(socket.id);
      socketRoomIds.delete(socket.id);
      return;
    }

    const error = leaveRoom(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    socket.leave(payload.roomId);
    socketPlayerIds.delete(socket.id);
    socketRoomIds.delete(socket.id);
    socket.emit("room:left");

    emitRoomState(payload.roomId);
  });

  socket.on("room:setReady", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = setPlayerReady(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("game:start", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    fillRoomWithBots(state); // điền ghế trống bằng bot trước khi check sẵn sàng
    const error = startGame(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("draft:selectCard", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = selectDraftCard(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("draft:confirmPick", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = confirmDraftPick(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("planning:placeCard", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = placeCardOnPlayerBoard(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("planning:discardCard", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = discardCardFromPlayerHand(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("planning:payDebt", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = payDebtTokenOnBoard(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("planning:returnBoardCard", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const error = returnBoardCardToPlayerHand(state, payload);

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("planning:confirm", (payload) => {
    const state = rooms.get(payload.roomId);

    if (!state) {
      socket.emit("game:error", { message: "Không tìm thấy phòng." });
      return;
    }

    const playerId = bindSocketPlayer(socket, payload, state);

    if (!playerId) {
      socket.emit("game:error", { message: "Người chơi chưa kết nối hoặc không hợp lệ." });
      return;
    }

    const error = confirmPlanning(state, { playerId });

    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    emitRoomState(payload.roomId);
  });

  socket.on("disconnect", () => {
    const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }
    if (matchmakingQueue.length === 0) clearMatchmakingTimer();
    const playerId = socketPlayerIds.get(socket.id);
    const roomId = socketRoomIds.get(socket.id);
    const state = roomId ? rooms.get(roomId) : null;

    if (playerId && state) {
      state.players[playerId].isConnected = false;
      state.players[playerId].isReady = false;
      state.players[playerId].planningConfirmed = false;
      emitRoomState(roomId!);
    }

    socketPlayerIds.delete(socket.id);
    socketRoomIds.delete(socket.id);
  });
});

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on http://localhost:${PORT}`);
});
