/*
  Bot players — server-side.

  Kiến trúc tận dụng: game đã tự chạy bằng timer (tickRoom) và finishDraftRound
  tự pick hộ. Bot chỉ cần (1) điền ghế trống để làm đối thủ ghi điểm, và (2) tự
  ra nước đi NHANH mỗi tick để không phải chờ hết 90s timer mỗi vòng.

  driveBots(state) được gọi trong vòng setInterval của index.ts, sau tickRoom.
*/
import type { RoomState, PlayerId, ServerTravelCardData } from "./types.js";
import { PLAYER_IDS } from "./gameEngine.js";
import { selectDraftCard, confirmDraftPick } from "./draftEngine.js";
import { placeCardOnPlayerBoard, confirmPlanning } from "./rooms.js";

const BOT_NAMES = ["Minh (Bot)", "Lan (Bot)", "Hùng (Bot)"];

/** Điền mọi ghế chưa có người bằng bot (ready, connected) để có thể start solo. */
export function fillRoomWithBots(state: RoomState): void {
  let n = 0;
  for (const id of PLAYER_IDS) {
    const p = state.players[id];
    if (p.hasJoined) continue;
    p.hasJoined = true;
    p.isConnected = true;
    p.isReady = true;
    p.isBot = true;
    p.name = BOT_NAMES[n % BOT_NAMES.length];
    n += 1;
  }
}

export function roomHasBots(state: RoomState): boolean {
  return PLAYER_IDS.some((id) => state.players[id].isBot === true);
}

/** Chọn thẻ tham lam: VP cao nhất trong pool. */
function chooseDraftCard(pool: ServerTravelCardData[]): ServerTravelCardData {
  return [...pool].sort((a, b) => (b.vp ?? 0) - (a.vp ?? 0))[0] ?? pool[0];
}

/** Đặt thẻ trong tay vào các ô trống của cột ngày hiện tại (VP cao trước). */
function placeBotCards(state: RoomState, id: PlayerId): void {
  const p = state.players[id];
  const day = state.dayIndex;
  const hand = [...p.hand].sort((a, b) => (b.vp ?? 0) - (a.vp ?? 0));

  for (const card of hand) {
    const row = p.board.findIndex((r) => r[day] === null);
    if (row < 0) break; // hết ô trong ngày
    const err = placeCardOnPlayerBoard(state, {
      playerId: id,
      cardId: card.id,
      rowIndex: row,
      colIndex: day,
    });
    if (err) break; // hết tài nguyên / không hợp lệ → dừng đặt
  }
}

/**
 * Một bước bot mỗi tick. Bot hành động ~1s sau khi vào phase → không chờ timer.
 * Idempotent: gọi lại khi bot đã xong thì không làm gì.
 */
export function driveBots(state: RoomState): void {
  if (state.phase === "draft") {
    if ((state.draftTimerHold ?? 0) > 0) return; // chờ deal animation xong
    for (const id of PLAYER_IDS) {
      const p = state.players[id];
      if (p.isBot !== true) continue;
      if (p.draftPool.length === 0 || p.draftPickConfirmed === true) continue;
      const card = chooseDraftCard(p.draftPool);
      selectDraftCard(state, { playerId: id, cardId: card.id });
      confirmDraftPick(state, { playerId: id });
    }
    return;
  }

  if (state.phase === "planning") {
    for (const id of PLAYER_IDS) {
      const p = state.players[id];
      if (p.isBot !== true || p.planningConfirmed === true) continue;
      placeBotCards(state, id);
      confirmPlanning(state, { playerId: id });
    }
  }
}
