/**
 * onlineGame.ts — Online multiplayer game screen renderer.
 *
 * Renders the game UI from RoomSnapshot data received over WebSocket,
 * instead of from local state.ts. All actions send RPC calls to the server.
 *
 * Reuses existing card rendering utilities from arena/render.ts for
 * visual consistency with the single-player game.
 */

import {
	getCurrentGameSnapshot,
	getCurrentCards,
	getCurrentPlayerId,
	sendPayDebt,
	sendReturnBoardCard,
} from "../online/lobbyClient.ts";
import { rpcCall } from "../online/socketClient.ts";
import { renderHandCard, renderBoardMiniCard } from "../arena/render.ts";
import type { RoomSnapshot, TravelCard, PlayerState } from "../shared/types.ts";
import type { BoardSlots } from "../shared/board.ts";
import {
	boardCellsToSlots,
	DAYS,
	TIME_SLOTS,
	SLOT_NAMES,
} from "../shared/board.ts";
import {
	getRarityLabel,
	getTagLabel,
	getShortName,
	getShortCity,
	getBonusText,
} from "../shared/card-mapper.ts";

// ── Main entry ──────────────────────────────────────────────────────────────

export function renderOnlineGameArena(): string {
	const snapshot = getCurrentGameSnapshot();
	const cards = getCurrentCards();
	const playerId = getCurrentPlayerId();
	if (!snapshot || !playerId) {
		return '<div class="loading-screen"><p>Đang kết nối...</p></div>';
	}

	// Find our player data in the snapshot
	const myPlayer = snapshot.players.find((p) => p.playerId === playerId);
	if (!myPlayer) {
		return '<div class="loading-screen"><p>Đang chờ dữ liệu người chơi...</p></div>';
	}

	switch (snapshot.phase) {
		case "draft":
			return renderOnlineDraft(snapshot, myPlayer, cards);
		case "placement":
			return renderOnlinePlacement(snapshot, myPlayer, cards);
		case "scoring":
			return renderOnlineScoring(snapshot, myPlayer, cards);
		case "finished":
			return renderOnlineFinished(snapshot);
		default:
			return '<div class="loading-screen"><p>Đang chờ...</p></div>';
	}
}

// ── Draft phase ─────────────────────────────────────────────────────────────

function renderOnlineDraft(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	allCards: TravelCard[],
): string {
	const handCards = resolveCards(myPlayer.hand, allCards);
	const pickRound = (snapshot.pickIndex ?? 0) + 1;
	const totalRounds = 5;

	const opponentInfo = snapshot.players
		.filter((p) => p.playerId !== myPlayer.playerId)
		.map((p) => getOpponentStatusMarkup(p))
		.join("");

	return `
    <main class="arena">
      <div class="arena__top">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>ONLINE — ${escapeHtml(snapshot.roomId)}</h1>
            <span class="arena__subtitle">Ngày ${snapshot.day} • Lượt chọn ${pickRound}/${totalRounds}</span>
          </div>
        </div>
      </div>

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
      			${DAYS.map((d) => {
							const isCurrent = d === snapshot.day;
							const isPast = d < snapshot.day;
							return `<div class="day-pill ${isCurrent ? "day-pill--current" : ""} ${isPast ? "day-pill--done" : ""}">NGÀY ${d}</div>`;
						}).join("")}
          </div>

          <section class="online-draft-section">
            <div class="online-draft__hand">
              <h2>Bài trên tay (${handCards.length})</h2>
              <div class="online-draft__cards">
                ${
									handCards.length === 0
										? '<p class="online-draft__empty">Đã chọn hết bài, chờ người chơi khác...</p>'
										: handCards
												.map((card, idx) => renderDraftCard(card, idx))
												.join("")
								}
              </div>
            </div>

            <div class="online-draft__opponents">
              ${opponentInfo || ""}
            </div>
          </section>
        </div>
      </div>
    </main>
  `;
}

function renderDraftCard(card: TravelCard, _index: number): string {
	const rarityClass = card.rarity
		? `hand-card--${card.rarity}`
		: "hand-card--common";
	const shortName = getShortName(card.name);
	const shortCity = getShortCity(card.city || "");

	return `
    <div class="online-draft-card" data-online-draft-card-id="${card.card_id}">
      <article class="hand-card ${rarityClass}">
        <div class="hand-card__header">
          <div class="hand-card__title-block">
            <h3>${escapeHtml(shortName)}</h3>
            <div>📍 ${escapeHtml(shortCity)}</div>
          </div>
          <div class="hand-card__vp">${card.vp}</div>
        </div>
        <div class="hand-card__image" style="background-image: url('${card.image}')">
          <div class="hand-card__icons">
            <span>${card.icon || "★"}</span>
            <span>${getRarityLabel(card.rarity)}</span>
          </div>
        </div>
        <div class="hand-card__content">
          <div class="hand-card__meta-row">
            <span class="hand-card__rarity">${getRarityLabel(card.rarity)}</span>
            <span class="hand-card__tag">${getTagLabel(card.tag || (card.tags?.[0] ?? "FOOD"))}</span>
          </div>
          <p>${card.description || ""}</p>
          <div class="hand-card__bonus">${getBonusText(card)}</div>
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
      <div class="online-draft-card__actions">
        <button class="online-draft-btn online-draft-btn--store" data-online-store="${card.card_id}">📥 Lưu</button>
        <button class="online-draft-btn online-draft-btn--rest" data-online-rest="${card.card_id}">💤 Nghỉ</button>
      </div>
    </div>
  `;
}

// ── Placement phase ─────────────────────────────────────────────────────────

function renderOnlinePlacement(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	allCards: TravelCard[],
): string {
	const boardSlots = boardCellsToSlots(myPlayer.board, allCards);
	const chosenCards = resolveCards(myPlayer.chosen, allCards);
	const currentDay = snapshot.day;
	const dayIndex = currentDay - 1;

	const opponentInfo = snapshot.players
		.filter((p) => p.playerId !== myPlayer.playerId)
		.map((p) => getOpponentStatusMarkup(p))
		.join("");

	return `
    <main class="arena">
      <div class="arena__top">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>ONLINE — ${escapeHtml(snapshot.roomId)}</h1>
            <span class="arena__subtitle">Ngày ${currentDay} • Xếp bài</span>
          </div>
        </div>
      </div>

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
      			${DAYS.map((d) => {
							const isCurrent = d === currentDay;
							const isPast = d < currentDay;
							return `<div class="day-pill ${isCurrent ? "day-pill--current" : ""} ${isPast ? "day-pill--done" : ""}">NGÀY ${d}</div>`;
						}).join("")}
          </div>

          <section class="board-grid">
            ${TIME_SLOTS.map(
							(slot, rowIdx) => `
              <div class="time-label">${SLOT_NAMES[slot] || slot}</div>
              ${DAYS.map((_, colIdx) => renderOnlineBoardCell(boardSlots, rowIdx, colIdx, dayIndex, chosenCards)).join("")}
            `,
						).join("")}
          </section>
        </div>

        ${
					chosenCards.length > 0
						? `
          <div class="online-placement__chosen">
            <h3>Bài đã chọn (${chosenCards.length}) — chọn thẻ rồi click vào ô trống</h3>
            <div class="online-placement__chosen-cards">
              ${chosenCards
								.map((card, idx) => {
									const isSelectedCard = selectedPlaceCardId === card.card_id;
									return `
                  <div class="online-placement-card" data-online-place-card-id="${card.card_id}">
                    <div class="placement-card ${isSelectedCard ? "placement-card--selected" : ""}"
                         data-select-place="${card.card_id}">
                      ${renderHandCard(card, idx, isSelectedCard ? String(card.id) : null)}
                    </div>
                    <button class="online-placement-card__place" data-online-place="${card.card_id}">📌 Đặt</button>
                  </div>
                `;
								})
								.join("")}
            </div>
          </div>
        `
						: `
          <div class="online-placement__done">
            <p>✅ Đã xếp xong bài cho ngày ${currentDay}.</p>
          </div>
        `
				}

        <div class="online-placement__actions">
          <button class="online-confirm-btn" data-online-confirm-day="true">
            ✅ Xác nhận ngày ${currentDay}
          </button>
        </div>

        ${
					myPlayer.resources.debtToken > 0
						? `
        <div class="placement__debt-pay">
          <span class="debt-label">💳 Nợ: <strong>${myPlayer.resources.debtToken} xu</strong></span>
          <button class="online-debt-btn" data-online-pay-debt="all">
            💰 Trả nợ (${Math.min(myPlayer.resources.xu, myPlayer.resources.debtToken)} xu)
          </button>
        </div>
        `
						: ""
				}

        <div class="online-draft__opponents">
          ${opponentInfo || ""}
        </div>
      </div>
    </main>
  `;
}

function renderOnlineBoardCell(
	boardSlots: BoardSlots,
	rowIdx: number,
	colIdx: number,
	currentDayIndex: number,
	chosenCards: TravelCard[],
): string {
	const card = boardSlots[rowIdx]?.[colIdx] ?? null;
	const day = DAYS[colIdx];
	const slot = TIME_SLOTS[rowIdx];
	const isCurrentDay = colIdx === currentDayIndex;
	const canPlace = isCurrentDay && card === null && chosenCards.length > 0;

	if (!card) {
		return `
      <div class="board-cell board-cell--empty ${!isCurrentDay ? "board-cell--not-current-day" : ""} ${canPlace ? "board-cell--placeable" : ""}"
           data-online-slot="${day}-${slot}"
           data-day="${day}"
           data-slot="${slot}"
           title="${isCurrentDay ? "Đặt thẻ vào ô này" : "Không phải ngày hiện tại"}">
        <span class="empty-plus" ${canPlace ? 'style="cursor:pointer"' : ""}>+</span>
      </div>
    `;
	}

	return `
    <div class="board-cell board-cell--occupied"
         title="${card.name}">
      ${renderBoardMiniCard(card)}
      ${isCurrentDay ? `<button class="board-cell__return" data-online-return-card="${day}|${slot}" title="Trả bài về tay">↩️</button>` : ""}
    </div>
  `;
}

// ── Scoring phase ───────────────────────────────────────────────────────────

function renderOnlineScoring(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	_allCards: TravelCard[],
): string {
	return `
    <main class="arena">
      <div class="arena__top">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>ONLINE — ${escapeHtml(snapshot.roomId)}</h1>
            <span class="arena__subtitle">Ngày ${snapshot.day} • Kết quả</span>
          </div>
        </div>
      </div>

      <div class="arena__main">
        <div class="score-panel-online">
          <h2>📊 Kết quả ngày ${snapshot.day}</h2>

          <table class="score-table">
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>VP</th>
                <th>Xu</th>
                <th>Stamina</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${snapshot.players
								.map(
									(p) => `
                <tr class="${p.playerId === myPlayer.playerId ? "score-row--me" : ""}">
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td>${p.resources.vp}</td>
                  <td>${p.resources.xu}</td>
                  <td>${p.resources.stamina}</td>
                  <td>${p.ready ? "✅ Sẵn sàng" : "⏳ Đang tính..."}</td>
                </tr>
              `,
								)
								.join("")}
            </tbody>
          </table>

          <p class="score-hint">Đang chờ tất cả người chơi...</p>
        </div>
      </div>
    </main>
  `;
}

// ── Finished phase ──────────────────────────────────────────────────────────

function renderOnlineFinished(snapshot: RoomSnapshot): string {
	const winner = snapshot.players.find((p) => p.playerId === snapshot.winnerId);
	const sorted = [...snapshot.players].sort(
		(a, b) => b.resources.vp - a.resources.vp,
	);

	return `
    <main class="arena">
      <div class="arena__top">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>ONLINE — ${escapeHtml(snapshot.roomId)}</h1>
            <span class="arena__subtitle">🏆 Trò chơi kết thúc!</span>
          </div>
        </div>
      </div>

      <div class="arena__main">
        <div class="score-panel-online score-panel-online--final">
          <h2>🏆 Bảng xếp hạng cuối cùng</h2>

          ${winner ? `<div class="winner-banner">🥇 ${escapeHtml(winner.name)} chiến thắng với ${winner.resources.vp} VP!</div>` : ""}

          <table class="score-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Người chơi</th>
                <th>VP</th>
                <th>Xu</th>
                <th>Stamina</th>
              </tr>
            </thead>
            <tbody>
              ${sorted
								.map(
									(p, i) => `
                <tr class="${p.playerId === snapshot.winnerId ? "score-row--winner" : ""}">
                  <td>${i + 1}</td>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td>${p.resources.vp}</td>
                  <td>${p.resources.xu}</td>
                  <td>${p.resources.stamina}</td>
                </tr>
              `,
								)
								.join("")}
            </tbody>
          </table>

          <button class="online-back-btn" data-online-leave-game="true">← Quay lại trang chủ</button>
        </div>
      </div>
    </main>
  `;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveCards(ids: string[], catalogue: TravelCard[]): TravelCard[] {
	const byId = new Map(catalogue.map((c) => [c.card_id, c]));
	return ids.map((id) => byId.get(id)).filter(Boolean) as TravelCard[];
}

function getOpponentStatusMarkup(p: PlayerState): string {
	return `
    <div class="opponent-chip">
      <span class="opponent-chip__name">${escapeHtml(p.name)}</span>
      <span class="opponent-chip__status">${p.ready ? "✅ Sẵn sàng" : "⏳ Đang chọn"}</span>
    </div>
  `;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// ── Global action handlers (bound on render) ────────────────────────────────

export function initOnlineGameGlobals() {
	// Draft: store card
	document.querySelectorAll("[data-online-store]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-online-store",
			);
			if (cardId) handleOnlineDraftCard(cardId, "store");
		});
	});

	// Draft: rest card
	document.querySelectorAll("[data-online-rest]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-online-rest",
			);
			if (cardId) handleOnlineDraftCard(cardId, "rest");
		});
	});

	// Placement: click slot to place
	document.querySelectorAll("[data-online-slot]").forEach((el) => {
		el.addEventListener("click", (e) => {
			const target = e.currentTarget as HTMLElement;
			const day = parseInt(target.getAttribute("data-day") || "0", 10);
			const slot = target.getAttribute("data-slot") || "";
			const cardId = getSelectedPlaceCardId();
			if (cardId && day > 0 && slot) {
				handleOnlinePlaceCard(cardId, day, slot);
			}
		});
	});

	// Placement: select card
	document.querySelectorAll("[data-select-place]").forEach((el) => {
		el.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-select-place",
			);
			if (cardId) selectPlaceCard(cardId);
		});
	});

	// Placement: place button
	document.querySelectorAll("[data-online-place]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-online-place",
			);
			if (cardId) selectPlaceCard(cardId);
		});
	});

	// Confirm day
	const confirmBtn = document.querySelector("[data-online-confirm-day]");
	if (confirmBtn) {
		confirmBtn.addEventListener("click", () => handleOnlineConfirmDay());
	}

	// Leave game
	const leaveBtn = document.querySelector("[data-online-leave-game]");
	if (leaveBtn) {
		leaveBtn.addEventListener("click", () => handleOnlineLeaveGame());
	}

	// Placement: pay debt
	document.querySelectorAll("[data-online-pay-debt]").forEach((btn) => {
		btn.addEventListener("click", () => {
			handleOnlinePayDebt();
		});
	});

	// Placement: return board card
	document.querySelectorAll("[data-online-return-card]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const val = (e.currentTarget as HTMLElement).getAttribute(
				"data-online-return-card",
			);
			if (val) {
				const [dayStr, slot] = val.split("|");
				const day = parseInt(dayStr, 10);
				if (day > 0 && slot) handleOnlineReturnBoardCard(day, slot);
			}
		});
	});
}

// ── Action handlers ─────────────────────────────────────────────────────────

let selectedPlaceCardId: string | null = null;

function getSelectedPlaceCardId(): string | null {
	return selectedPlaceCardId;
}

function selectPlaceCard(cardId: string | null) {
	selectedPlaceCardId = cardId;
	// Re-render to update selection highlight
	import("../router.ts").then(({ rerenderGameShell }) => {
		rerenderGameShell();
	});
}

async function handleOnlineDraftCard(cardId: string, mode: "store" | "rest") {
	try {
		await rpcCall("draftCard", { cardId, mode });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] draftCard failed:", msg);
	}
}

async function handleOnlinePlaceCard(
	cardId: string,
	day: number,
	slot: string,
) {
	try {
		await rpcCall("placeCard", { cardId, day, slot });
		selectedPlaceCardId = null;
		// RPC response triggers a new snapshot → re-render
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] placeCard failed:", msg);
		alert(`Không thể đặt thẻ: ${msg}`);
	}
}

async function handleOnlineConfirmDay() {
	try {
		await rpcCall("confirmDay", {});
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] confirmDay failed:", msg);
		alert(`Không thể xác nhận: ${msg}`);
	}
}

async function handleOnlineLeaveGame() {
	// Disconnect and navigate back to lobby entry
	const { disconnectFromRoom } = await import("../online/socketClient.ts");
	disconnectFromRoom();
	// Navigate to lobby entry
	const { transitionToScreen } = await import("../router.ts");
	transitionToScreen("lobby");
}

async function handleOnlinePayDebt() {
	await sendPayDebt();
}

async function handleOnlineReturnBoardCard(day: number, slot: string) {
	await sendReturnBoardCard(day, slot);
}
