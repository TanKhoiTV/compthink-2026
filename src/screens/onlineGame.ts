/**
 * onlineGame.ts — Online multiplayer game screen renderer.
 *
 * Renders inside the same game-shell structure as single-player (renderMainArena)
 * so both look identical. Data comes from RoomSnapshot over WebSocket.
 *
 * Draft: cards pass around the table — player picks store/rest on one card,
 *        remaining cards go to next player.
 * Placement: select a card, click a board cell.
 * Scoring / Finished: leaderboard table.
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
// ── Main entry ──────────────────────────────────────────────────────────────

export function renderOnlineGameArena(): string {
	const snapshot = getCurrentGameSnapshot();
	const cards = getCurrentCards();
	const playerId = getCurrentPlayerId();
	if (!snapshot || !playerId) {
		return '<div class="loading-screen"><p>Đang kết nối...</p></div>';
	}

	const myPlayer = snapshot.players.find((p) => p.playerId === playerId);
	if (!myPlayer) {
		return '<div class="loading-screen"><p>Đang chờ dữ liệu người chơi...</p></div>';
	}

	const phase = snapshot.phase;
	const opponentPlayers = snapshot.players.filter(
		(p) => p.playerId !== playerId,
	);

	switch (phase) {
		case "draft":
			return renderOnlineGameShell(
				snapshot,
				myPlayer,
				cards,
				opponentPlayers,
				renderOnlineDraftContent(snapshot, myPlayer, cards),
			);
		case "placement":
			return renderOnlineGameShell(
				snapshot,
				myPlayer,
				cards,
				opponentPlayers,
				renderOnlinePlacementContent(snapshot, myPlayer, cards),
			);
		case "scoring":
			return renderOnlineGameShell(
				snapshot,
				myPlayer,
				cards,
				opponentPlayers,
				renderOnlineScoringContent(snapshot, myPlayer),
			);
		case "finished":
			return renderOnlineGameShell(
				snapshot,
				myPlayer,
				cards,
				opponentPlayers,
				renderOnlineFinishedContent(snapshot),
			);
		default:
			return '<div class="loading-screen"><p>Đang chờ...</p></div>';
	}
}

// ── Shared game shell (mirrors renderMainArena HTML structure) ─────────────

function renderOnlineGameShell(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	_allCards: TravelCard[],
	opponents: PlayerState[],
	contentArea: string,
): string {
	return `
    <main class="arena">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>${escapeHtml(myPlayer.name)}</h1>
            <span class="arena__subtitle">Phòng ${escapeHtml(snapshot.roomId)}</span>
          </div>
        </div>
        ${renderOnlineScorePanel(snapshot, myPlayer)}
      </div>

      ${renderOnlineResourceOrbs(myPlayer)}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${DAYS.map((d) => {
							const isCurrent = d === snapshot.day;
							const isPast = d < snapshot.day;
							return `<div class="day-pill ${isCurrent ? "day-pill--current" : ""} ${isPast ? "day-pill--done" : ""}">NGÀY ${d}</div>`;
						}).join("")}
          </div>
          ${contentArea}
        </div>
      </div>

      ${renderOnlineOpponentPanel(opponents)}
    </main>
  `;
}

// ── Score panel (mirrors score-breakdown from single-player) ───────────────

function renderOnlineScorePanel(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
): string {
	const isDraft = snapshot.phase === "draft";
	const isPlacement = snapshot.phase === "placement";

	// Timing display — inline expression assigned directly to template
	const phaseLabel = isDraft
		? "VÒNG"
		: isPlacement
			? "NGÀY"
			: snapshot.phase === "finished"
				? "HẾT"
				: "KQ";
	const phaseValue = isDraft
		? `${(snapshot.pickIndex ?? 0) + 1}/5`
		: `${snapshot.day}/5`;

	return `
    <section class="score-breakdown">
      <div class="score-breakdown__header">
        <span>ĐIỂM</span>
        <strong>${myPlayer.resources.vp}</strong>
      </div>

      <div class="score-breakdown__item">
        <span>XU</span>
        <strong>${myPlayer.resources.xu}</strong>
      </div>

      <div class="score-breakdown__item">
        <span>THỂ LỰC</span>
        <strong>${myPlayer.resources.stamina}</strong>
      </div>

      <div class="score-breakdown__timer">
        <span>${phaseLabel}</span>
        <strong>${phaseValue}</strong>
      </div>
    </section>
  `;
}

// ── Resource orbs ──────────────────────────────────────────────────────────

function renderOnlineResourceOrbs(myPlayer: PlayerState): string {
	return `
    <div class="resource-orbs">
      <div class="orb orb--coin">
        <span class="orb__icon">C</span>
        <span class="orb__value">${myPlayer.resources.xu}</span>
      </div>
      <div class="orb orb--stamina">
        <span class="orb__icon">S</span>
        <span class="orb__value">${myPlayer.resources.stamina}</span>
      </div>
      <div class="orb orb--debt">
        <span class="orb__icon">D</span>
        <span class="orb__value">${myPlayer.resources.debtToken}</span>
      </div>
    </div>
  `;
}

// ── Opponent panel (injected into aside columns via DOM after render) ──────

function renderOnlineOpponentPanel(opponents: PlayerState[]): string {
	if (opponents.length === 0) return "";

	return `
    <aside class="online-opponent-bar">
      <h3 class="online-opponent-bar__title">Đối thủ</h3>
      ${opponents
				.map(
					(p) => `
        <div class="online-opponent-chip">
          <span class="online-opponent-chip__name">${escapeHtml(p.name)}</span>
          <span class="online-opponent-chip__vp">${p.resources.vp} VP</span>
          <span class="online-opponent-chip__status">${p.ready ? "✅ Sẵn sàng" : "⏳"}</span>
        </div>
      `,
				)
				.join("")}
    </aside>
  `;
}

// ── Board grid (shared across phases) ──────────────────────────────────────

function renderOnlineBoardGrid(
	boardSlots: BoardSlots,
	currentDay: number,
	canPlace: boolean,
): string {
	const dayIndex = currentDay - 1;

	return `
    <section class="board-grid">
      ${TIME_SLOTS.map((slot, rowIdx) => `
        <div class="time-label">${SLOT_NAMES[slot] || slot}</div>
        ${DAYS.map((_, colIdx) =>
					renderOnlineBoardCell(boardSlots, rowIdx, colIdx, dayIndex, canPlace),
				).join("")}
      `).join("")}
    </section>
  `;
}

function renderOnlineBoardCell(
	boardSlots: BoardSlots,
	rowIdx: number,
	colIdx: number,
	currentDayIndex: number,
	canPlace: boolean,
): string {
	const card = boardSlots[rowIdx]?.[colIdx] ?? null;
	const isCurrentDay = colIdx === currentDayIndex;

	if (!card) {
		return `
      <div
        class="board-cell board-cell--empty ${!isCurrentDay ? "board-cell--not-current-day" : ""} ${canPlace && isCurrentDay ? "board-cell--placeable" : ""}"
        data-online-slot="${colIdx + 1}|${TIME_SLOTS[rowIdx]}"
        data-day="${colIdx + 1}"
        data-slot="${TIME_SLOTS[rowIdx]}"
        title="${isCurrentDay ? (canPlace ? "Đặt thẻ vào ô" : "") : "Không phải ngày hiện tại"}"
      >
        <span class="empty-plus" ${canPlace && isCurrentDay ? 'style="cursor:pointer"' : ""}>+</span>
      </div>
    `;
	}

	return `
    <div class="board-cell board-cell--occupied" title="${card.name}">
      ${renderBoardMiniCard(card)}
      ${isCurrentDay
				? `<button class="board-cell__return" data-online-return-card="${colIdx + 1}|${TIME_SLOTS[rowIdx]}" title="Trả bài về tay">↩️</button>`
				: ""}
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// DRAFT PHASE
// ═════════════════════════════════════════════════════════════════════════════

function renderOnlineDraftContent(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	allCards: TravelCard[],
): string {
	const handCards = resolveCards(myPlayer.hand, allCards);
	const pickRound = (snapshot.pickIndex ?? 0) + 1;

	if (handCards.length === 0) {
		return `
      <section class="player-hand">
        <div class="player-hand__top">
          <div class="player-hand__title">
            <span class="hand-badge">DRAFT</span>
            <h2>Chọn thẻ ngày ${snapshot.day}</h2>
          </div>
          <div class="player-hand__meta">Đã chọn hết, chờ người chơi khác...</div>
        </div>
        <div class="player-hand__cards">
          <p class="online-draft__empty">⏳ Đang chờ người chơi khác chọn...</p>
        </div>
      </section>
    `;
	}

	return `
    <section class="player-hand player-hand--draft">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">DRAFT</span>
          <h2>Chọn thẻ ngày ${snapshot.day} • Vòng ${pickRound}/5</h2>
        </div>
        <div class="player-hand__meta">Chọn Lưu (giữ) hoặc Nghỉ (bỏ)</div>
      </div>
      <div class="player-hand__cards">
        ${handCards
					.map((card, idx) => renderOnlineDraftCard(card, idx))
					.join("")}
      </div>
    </section>
  `;
}

function renderOnlineDraftCard(card: TravelCard, _index: number): string {
	// rarityClass and fanClass are applied inside renderHandCard

	return `
    <div class="daily-draft-card daily-draft-card--${_index + 1}" data-online-draft-card-id="${card.card_id}">
      ${renderHandCard(card, _index, null)}
      <div class="online-draft-card__actions" style="text-align:center;margin-top:4px;">
        <button class="online-draft-btn online-draft-btn--store" data-online-store="${card.card_id}" style="font-size:0.7rem;padding:2px 6px;">📥 Lưu</button>
        <button class="online-draft-btn online-draft-btn--rest" data-online-rest="${card.card_id}" style="font-size:0.7rem;padding:2px 6px;">💤 Nghỉ</button>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// PLACEMENT PHASE
// ═════════════════════════════════════════════════════════════════════════════

function renderOnlinePlacementContent(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	allCards: TravelCard[],
): string {
	const boardSlots = boardCellsToSlots(myPlayer.board, allCards);
	const chosenCards = resolveCards(myPlayer.chosen, allCards);
	const currentDay = snapshot.day;

	const boardHtml = renderOnlineBoardGrid(boardSlots, currentDay, chosenCards.length > 0);

	return `
    ${boardHtml}

    ${
			chosenCards.length > 0
				? `
    <section class="player-hand">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">HAND</span>
          <h2>Bài ngày ${currentDay} (${chosenCards.length})</h2>
        </div>
        <div class="player-hand__meta">Click thẻ → click ô trống để đặt</div>
      </div>
      <div class="player-hand__cards">
        ${chosenCards
					.map((card, idx) => {
						const isSelected = selectedPlaceCardId === card.card_id;
						return `
              <div class="online-placement-card" data-online-place-card-id="${card.card_id}">
                <div class="placement-card ${isSelected ? "placement-card--selected" : ""}"
                     data-select-place="${card.card_id}">
                  ${renderHandCard(card, idx, isSelected ? card.id : null)}
                </div>
                <button class="online-placement-card__place" data-online-place="${card.card_id}" style="font-size:0.7rem;padding:2px 6px;">📌 Đặt</button>
              </div>
            `;
					})
					.join("")}
      </div>
    </section>
    `
				: `
    <section class="player-hand">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">HAND</span>
          <h2>Bài ngày ${currentDay}</h2>
        </div>
        <div class="player-hand__meta">✅ Đã xếp xong</div>
      </div>
      <div class="player-hand__cards">
        <p style="text-align:center;color:var(--color-text-muted);">✅ Đã đặt hết bài cho ngày ${currentDay}.</p>
      </div>
    </section>
    `
		}

    <div style="text-align:center;margin:12px 0;">
      <button class="online-confirm-btn" data-online-confirm-day="true" style="padding:8px 20px;font-size:1rem;">
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
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// SCORING PHASE
// ═════════════════════════════════════════════════════════════════════════════

function renderOnlineScoringContent(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
): string {
	const sorted = [...snapshot.players].sort(
		(a, b) => b.resources.vp - a.resources.vp,
	);

	return `
    <section class="player-hand">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">KQ</span>
          <h2>📊 Kết quả ngày ${snapshot.day}</h2>
        </div>
        <div class="player-hand__meta">Đang chờ tất cả người chơi...</div>
      </div>

      <table class="score-table" style="width:100%;max-width:600px;margin:12px auto;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">#</th>
            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">Người chơi</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">VP</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">Xu</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">Stamina</th>
          </tr>
        </thead>
        <tbody>
          ${sorted
						.map(
							(p, i) => `
            <tr class="${p.playerId === myPlayer.playerId ? "score-row--me" : ""}">
              <td style="padding:4px 8px;">${i + 1}</td>
              <td style="padding:4px 8px;"><strong>${escapeHtml(p.name)}</strong></td>
              <td style="padding:4px 8px;text-align:right;">${p.resources.vp}</td>
              <td style="padding:4px 8px;text-align:right;">${p.resources.xu}</td>
              <td style="padding:4px 8px;text-align:right;">${p.resources.stamina}</td>
            </tr>
          `,
						)
						.join("")}
        </tbody>
      </table>
    </section>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// FINISHED PHASE (Leaderboard)
// ═════════════════════════════════════════════════════════════════════════════

function renderOnlineFinishedContent(snapshot: RoomSnapshot): string {
	const winner = snapshot.players.find((p) => p.playerId === snapshot.winnerId);
	const sorted = [...snapshot.players].sort(
		(a, b) => b.resources.vp - a.resources.vp,
	);

	return `
    <section class="player-hand">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">🏆</span>
          <h2>Bảng xếp hạng cuối cùng</h2>
        </div>
      </div>

      ${winner
				? `<div class="winner-banner" style="text-align:center;font-size:1.2rem;padding:12px;margin:8px 0;background:linear-gradient(135deg,#ffd70022,#ff8c0022);border-radius:8px;">🥇 ${escapeHtml(winner.name)} chiến thắng với ${winner.resources.vp} VP!</div>`
				: ""}

      <table class="score-table" style="width:100%;max-width:600px;margin:8px auto;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">#</th>
            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">Người chơi</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">VP</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">Xu</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--color-border, #333);">Stamina</th>
          </tr>
        </thead>
        <tbody>
          ${sorted
						.map(
							(p, i) => `
            <tr class="${p.playerId === snapshot.winnerId ? "score-row--winner" : ""}">
              <td style="padding:4px 8px;">${i + 1}</td>
              <td style="padding:4px 8px;"><strong>${escapeHtml(p.name)}</strong></td>
              <td style="padding:4px 8px;text-align:right;">${p.resources.vp}</td>
              <td style="padding:4px 8px;text-align:right;">${p.resources.xu}</td>
              <td style="padding:4px 8px;text-align:right;">${p.resources.stamina}</td>
            </tr>
          `,
						)
						.join("")}
        </tbody>
      </table>

      <div style="text-align:center;margin:16px 0;">
        <button class="online-back-btn" data-online-leave-game="true" style="padding:8px 20px;">← Quay lại trang chủ</button>
      </div>
    </section>
  `;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveCards(ids: string[], catalogue: TravelCard[]): TravelCard[] {
	const byId = new Map(catalogue.map((c) => [c.card_id, c]));
	return ids.map((id) => byId.get(id)).filter(Boolean) as TravelCard[];
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
			const val = target.getAttribute("data-day") || "";
			const slot = target.getAttribute("data-slot") || "";
			const day = parseInt(val, 10);
			const cardId = getSelectedPlaceCardId();
			if (cardId && day > 0 && slot) {
				handleOnlinePlaceCard(cardId, day, slot);
			}
		});
	});

	// Placement: select card (click on card)
	document.querySelectorAll("[data-select-place]").forEach((el) => {
		el.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-select-place",
			);
			if (cardId) selectPlaceCard(cardId);
		});
	});

	// Placement: place button under card
	document.querySelectorAll("[data-online-place]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
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
	const { disconnectFromRoom } = await import("../online/socketClient.ts");
	disconnectFromRoom();
	const { transitionToScreen } = await import("../router.ts");
	transitionToScreen("lobby");
}

async function handleOnlinePayDebt() {
	await sendPayDebt();
}

async function handleOnlineReturnBoardCard(day: number, slot: string) {
	await sendReturnBoardCard(day, slot);
}
