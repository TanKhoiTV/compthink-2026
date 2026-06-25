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
  reconnectRoom,
  returnBoardCardToPlayerHand,
  setPlayerReady,
  startGame,
} from "./rooms.js";
import { tickRoom } from "./timerEngine.js";

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map<string, RoomState>();
const socketPlayerIds = new Map<string, PlayerId>();
const socketRoomIds = new Map<string, string>();

function bindSocketPlayer(
  socket: { id: string; join: (room: string) => void },
  payload: { roomId: string; playerId: PlayerId },
  state: RoomState,
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

setInterval(() => {
  for (const [roomId, state] of rooms) {
    tickRoom(state);
    emitRoomState(roomId);
  }
}, 1000);

io.on("connection", (socket) => {
  socket.on("room:create", ({ playerName }) => {
    const { roomId, playerId, state } = createRoom(playerName);

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
      socket.emit("game:error", {
        message: "Không tìm thấy phòng để reconnect.",
      });
      return;
    }

    const reconnectedPlayerId = reconnectRoom(state, { playerId, playerName });

    if (!reconnectedPlayerId) {
      socket.emit("game:error", {
        message: "Không tìm thấy người chơi để reconnect.",
      });
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
      socket.emit("game:error", {
        message: "Người chơi chưa kết nối hoặc không hợp lệ.",
      });
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
