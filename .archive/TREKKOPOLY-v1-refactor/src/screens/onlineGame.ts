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
} from "../online/lobbyClient.ts";
import { rpcCall } from "../online/socketClient.ts";
import { renderHandCard, renderBoardGrid } from "../arena/render.ts";
import type { RoomSnapshot, TravelCard, PlayerState } from "../shared/types.ts";
import { boardCellsToSlots, DAYS, TIME_SLOTS } from "../shared/board.ts";
import { playGameSound } from "../audio/gameAudio.ts";
import {
	setIsInitialDealInProgress,
	setIsPassingDraftCards,
	setRemainingTurnSeconds,
	getPlayerHand,
} from "../state.ts";
import {
	startDraftTimer as startSharedDraftTimer,
	stopDraftTimer,
	startPlacementTimer as startSharedPlacementTimer,
	stopPlacementTimer,
	isDraftTimerRunning,
} from "../services/game-timer.ts";
import { detectHandTransition } from "../services/animation-controller.ts";
import { DEAL_ANIMATION_MS } from "../shared/animations.ts";
import { TURN_DURATION_SECONDS } from "../shared/constants.ts";
import {
	GAME_HELP_STEPS,
	renderHelpBubble,
} from "../components/HelpBubble.ts";

// Timer DOM updates are handled by the shared game-timer.ts module.
// Animation state tracking is handled by animation-controller.ts

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

	switch (phase) {
		case "draft":
			return renderOnlineGameArenaShell(
				snapshot,
				myPlayer,
				opponents(snapshot, playerId),
				renderOnlineDraftContent(snapshot, myPlayer, cards),
			);
		case "placement":
			return renderOnlineGameArenaShell(
				snapshot,
				myPlayer,
				opponents(snapshot, playerId),
				renderOnlinePlacementContent(snapshot, myPlayer),
			);
		case "scoring":
		case "finished":
			return renderOnlineGameArenaShell(
				snapshot,
				myPlayer,
				opponents(snapshot, playerId),
				renderOnlineScoringContent(snapshot, myPlayer),
			);
		default:
			return `<div class="loading-screen"><p>Pha: ${phase}...</p></div>`;
	}
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function opponents(snapshot: RoomSnapshot, playerId: string): PlayerState[] {
	return snapshot.players.filter((p) => p.playerId !== playerId);
}

function resolveCards(ids: string[], allCards: TravelCard[]): TravelCard[] {
	return ids
		.map((id) => allCards.find((c) => c.card_id === id))
		.filter((c): c is TravelCard => c !== undefined);
}

// ── Arena shell (shared layout for all phases) ──────────────────────────────

function renderOnlineGameArenaShell(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
	opponentPlayers: PlayerState[],
	contentArea: string,
): string {
	const phase = snapshot.phase;

	return `
    <main class="arena">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>${escapeHtml(myPlayer.name)}</h1>
          </div>
        </div>
        ${renderOnlineScorePanel(snapshot, myPlayer)}
      </div>

      ${renderOnlineResourceOrbs(myPlayer)}
      ${renderOnlinePhaseLabel(snapshot)}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${DAYS.map(
							(day, index) =>
								`<div class="day-pill ${index === snapshot.day - 1 ? "day-pill--current" : ""} ${index < snapshot.day - 1 ? "day-pill--done" : ""}">NGÀY ${day}</div>`,
						).join("")}
          </div>
          ${
						phase === "placement" || phase === "scoring"
							? `<section class="board-grid">${renderBoardGrid(
									boardCellsToSlots(myPlayer.board, cards()),
									snapshot.day - 1,
									false,
									false,
									phase === "placement" ? getOnlineSelectedCardId() : null,
								)}</section>`
							: ""
					}
        </div>

        <div class="online-content-area">
          ${contentArea}
        </div>
      </div>

      ${renderOnlineOpponentPanel(opponentPlayers)}
    </main>
  `;
}

function cards(): TravelCard[] {
	return getCurrentCards() ?? [];
}

function escapeHtml(str: string): string {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}

// ── Score panel (mirrors score-breakdown from single-player) ───────────────

function renderOnlineScorePanel(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
): string {
	const isDraft = snapshot.phase === "draft";
	const isPlacement = snapshot.phase === "placement";

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
      <div class="resource-orb-cluster resource-orb-cluster--stamina">
        ${renderHelpBubble({
					title: "Cách chơi",
					steps: GAME_HELP_STEPS,
					bubbleLabel: "Cách chơi",
					position: "game",
				})}
        <div class="orb orb--stamina">
          <span class="orb__icon">S</span>
          <span class="orb__value">${myPlayer.resources.stamina}</span>
        </div>
      </div>
      <div class="orb orb--debt">
        <span class="orb__icon">D</span>
        <span class="orb__value">${myPlayer.resources.debtToken}</span>
      </div>
    </div>
  `;
}

// ── Phase label strip ──────────────────────────────────────────────────────

function renderOnlinePhaseLabel(snapshot: RoomSnapshot): string {
	const phaseLabels: Record<string, string> = {
		draft: "DRAFT",
		placement: "PLACEMENT",
		scoring: "SCORING",
		finished: "FINISHED",
	};
	const label = phaseLabels[snapshot.phase] ?? snapshot.phase.toUpperCase();
	return `<div class="phase-label phase-label--${snapshot.phase}"><span>${label}</span></div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// DRAFT PHASE

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
        <div class="player-hand__meta">Bấm 1 lá để chọn, hết giờ mới chuyển</div>
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
	return `
    <div class="daily-draft-card daily-draft-card--${_index + 1}" data-draft-card-id="${card.card_id}">
      ${renderHandCard(card, _index, null)}
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// PLACEMENT PHASE

function renderOnlinePlacementContent(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
): string {
	const _allCards = getCurrentCards();
	if (!_allCards) return "";
	const boardSlots = boardCellsToSlots(myPlayer.board, _allCards);
	const chosenCards = resolveCards(myPlayer.chosen, _allCards);
	const currentDay = snapshot.day;
	const selectedId = getOnlineSelectedCardId();

	if (chosenCards.length === 0) {
		return `
      <section class="player-hand">
        <div class="player-hand__top">
          <div class="player-hand__title">
            <span class="hand-badge">HAND</span>
            <h2>Bài ngày ${currentDay}</h2>
          </div>
          <div class="player-hand__meta">✅ Đã đặt hết bài cho ngày ${currentDay}.</div>
        </div>
        <div class="player-hand__cards"></div>
      </section>
    `;
	}

	// Find cards on locked board cells (debt/lock tokens)
	const debtCards: TravelCard[] = boardSlots
		.flat()
		.filter((c): c is TravelCard => {
			if (!c) return false;
			const cell = myPlayer.board.find((bc) => bc.card_id === c.card_id);
			return cell?.locked === true;
		});

	return `
    <section class="player-hand">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">HAND</span>
          <h2>Bài ngày ${currentDay}</h2>
        </div>
        <div class="player-hand__meta">Giữ 0.5s để xem lớn, kéo thả vào bảng để đặt</div>
      </div>
      <div class="player-hand__cards">
        ${chosenCards
					.map((card, idx) => {
						const isSelected = selectedId === card.card_id;
						return `
            <div class="online-placement-card">
              <div class="placement-card ${isSelected ? "placement-card--selected" : ""}" data-hand-card-id="${card.card_id}" onpointerdown="event.stopPropagation(); startHandPointerDrag(event, '${card.card_id}')">
                ${renderHandCard(card, idx, isSelected ? card.card_id : null)}
              </div>
              <button class="online-placement-card__place" data-online-place="${card.card_id}">📌 Đặt</button>
            </div>
          `;
					})
					.join("")}
      </div>
    </section>

    ${
			debtCards.length > 0
				? `
    <section class="debt-section">
      <h3>💳 Trả nợ</h3>
      ${debtCards
				.map((card) => {
					const buttonLabel = `Trả 10xu để nhận lại thẻ`;
					return `
          <div class="debt-item">
            <span>${escapeHtml(card.name)}</span>
            <button data-online-pay-debt="${card.card_id}">${buttonLabel}</button>
          </div>
        `;
				})
				.join("")}
    </section>
    `
				: ""
		}

    {/* Discard zone */}
    <section
      class="deck-pile-panel"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      <div class="deck-pile-panel__visual">
        <div class="deck-card-stack">
          <div class="deck-card-stack__card deck-card-stack__card--back-3"></div>
          <div class="deck-card-stack__card deck-card-stack__card--back-2"></div>
          <div class="deck-card-stack__card deck-card-stack__card--back-1"></div>
          <div class="deck-card-stack__card deck-card-stack__card--front">
            <span>CÒN</span>
            <strong>${getCurrentCards()?.length}</strong>
            <em>lá</em>
          </div>
        </div>
      </div>
    </section>

    <div class="online-placement-actions">
      <button class="btn btn--primary" id="online-confirm-day-btn">✅ Kết thúc ngày ${currentDay}</button>
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// SCORING / FINISHED

function renderOnlineScoringContent(
	snapshot: RoomSnapshot,
	myPlayer: PlayerState,
): string {
	const sorted = [...snapshot.players].sort(
		(a, b) => b.resources.vp - a.resources.vp,
	);
	const isFinished = snapshot.phase === "finished";

	return `
    <section class="scoring-screen">
      <div class="scoring-screen__header">
        <h2>${isFinished ? "🏆 Kết quả chung cuộc" : `📊 Kết quả ngày ${snapshot.day}`}</h2>
      </div>
      <div class="scoring-screen__table">
        <div class="scoring-table-header">
          <span>Hạng</span>
          <span>Tên</span>
          <span>VP</span>
          <span>Xu</span>
          <span>Thể lực</span>
        </div>
        ${sorted
					.map(
						(p, i) => `
          <div class="scoring-row ${p.playerId === myPlayer.playerId ? "scoring-row--me" : ""}">
            <span class="scoring-rank">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
            <span class="scoring-name">${escapeHtml(p.name)}</span>
            <span class="scoring-vp">${p.resources.vp}</span>
            <span class="scoring-xu">${p.resources.xu}</span>
            <span class="scoring-stamina">${p.resources.stamina}</span>
          </div>
        `,
					)
					.join("")}
      </div>
      ${isFinished ? "" : '<p class="scoring-waiting">⏳ Đang chờ ngày tiếp theo...</p>'}
    </section>
  `;
}

// ── Opponent panel ─────────────────────────────────────────────────────────

function renderOnlineOpponentPanel(opponents: PlayerState[]): string {
	if (opponents.length === 0) return "";

	return `
    <aside class="opponent-strip">
      ${opponents
				.map(
					(p) => `
        <div class="opponent-card">
          <div class="opponent-card__name">${escapeHtml(p.name)}</div>
          <div class="opponent-card__vp">${p.resources.vp}</div>
          <div class="opponent-card__done ${p.ready ? "opponent-card__done--ready" : ""}">${p.ready ? "✅" : "🏆"}</div>
        </div>
      `,
				)
				.join("")}
    </aside>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// CLICK HANDLERS (bound after each render)

let _selectedOnlineCardId: string | null = null;

function getOnlineSelectedCardId(): string | null {
	return _selectedOnlineCardId;
}

/**
 * Start the staggered card-deal fly-in animation on the draft hand.
 * Called after each render that shows draft cards.
 */
function startOnlineDealAnimation(): void {
	const hand = document.querySelector(".player-hand--draft");
	if (!hand) return;
	hand.classList.add("player-hand--dealing", "is-dealing");
	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(() => {
			hand.classList.add("deal-active");
		});
	});
	// Clean up after animation completes (1320ms = DEAL_ANIMATION_MS)
	window.setTimeout(() => {
		hand.classList.remove("player-hand--dealing", "is-dealing", "deal-active");
	}, 1320);
}

export function initOnlineGameGlobals() {
	// Draft: trigger deal animation if draft cards are in the DOM
	if (document.querySelector(".player-hand--draft .daily-draft-card")) {
		startOnlineDealAnimation();
	}

	// Draft: click card to pick (store) — Sushi Go style, like offline mode
	document.querySelectorAll("[data-draft-card-id]").forEach((el) => {
		el.addEventListener("click", (e) => {
			e.stopPropagation();
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-draft-card-id",
			);
			if (cardId) handleOnlineDraftCard(cardId, "store");
		});
	});

	// Placement: select card from hand
	document.querySelectorAll("[data-hand-card-id]").forEach((el) => {
		el.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-hand-card-id",
			);
			if (!cardId) return;
			_selectedOnlineCardId = cardId;
			rerenderOnlineGame();
		});
	});

	// Placement: place button
	document.querySelectorAll("[data-online-place]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const cardId = (e.currentTarget as HTMLElement).getAttribute(
				"data-online-place",
			);
			if (!cardId) return;
			handleOnlinePlaceCard(cardId);
		});
	});

	// Placement: board cell click (place or select cell)
	document.querySelectorAll("[data-board-cell]").forEach((el) => {
		el.addEventListener("click", (e) => {
			const cellEl = e.currentTarget as HTMLElement;
			const rowStr = cellEl.getAttribute("data-row-index");
			if (!rowStr || !_selectedOnlineCardId) return;
			const row = Number(rowStr);
			if (!Number.isInteger(row)) return;
			handleOnlinePlaceCardOnBoard(_selectedOnlineCardId, row);
		});
	});

	// Confirm day
	const confirmBtn = document.getElementById("online-confirm-day-btn");
	if (confirmBtn) {
		confirmBtn.addEventListener("click", () => {
			handleOnlineConfirmDay();
		});
	}

	// Pay debt buttons — pays 10xu to reduce debt counter
	document.querySelectorAll("[data-online-pay-debt]").forEach((btn) => {
		btn.addEventListener("click", () => {
			sendPayDebt(10);
		});
	});

	// Register global discard handler so the unified pointer drag system
	// (handleHandPointerUp in app.ts) routes discard via online RPC.
	(globalThis as any).handleDiscardCard = (cardId: string) => {
		if (cardId) handleOnlineDiscardCard(cardId);
	};

	// Register global card selection handler (called by capture-phase click
	// handler in router.ts for both draft cards and hand cards).
	(globalThis as any).selectHandCard = (cardId: string) => {
		_selectedOnlineCardId = cardId;
		rerenderOnlineGame();
	};

	// Register global board cell click handler (called by capture-phase
	// click handler in router.ts). Places the selected card on board.
	(globalThis as any).handleBoardCellClick = (row: number, _col: number) => {
		if (_selectedOnlineCardId) {
			handleOnlinePlaceCardOnBoard(_selectedOnlineCardId, row);
		}
	};

	// Register global board placement handler (called by handleHandPointerUp
	// in app.ts when a card is dragged to a board cell).
	(globalThis as any).handlePlaceCardOnBoard = (
		cardId: string,
		row: number,
		_col: number,
	) => {
		handleOnlinePlaceCardOnBoard(cardId, row);
	};

	// Animation updates - call after each render to check for animation triggers
	updateOnlineGameAnimations();
}

/**
 * Update animation state based on current game state.
 * This should be called after each render to check for animation triggers.
 */
function updateOnlineGameAnimations(): void {
	const snapshot = getCurrentGameSnapshot();
	if (!snapshot) return;

	// Use shared animation controller (module-level variable, not DOM query)
	const transition = detectHandTransition(getPlayerHand().length);

	if (snapshot.phase === "draft") {
		if (transition.type === "deal") {
			playGameSound("deal");
			setIsPassingDraftCards(false);
			setIsInitialDealInProgress(true);

			const hand = document.querySelector(".player-hand--draft");
			hand?.classList.add("deal-active");

			window.setTimeout(() => {
				setIsInitialDealInProgress(false);
				const hand = document.querySelector(".player-hand");
				hand?.classList.remove(
					"player-hand--dealing",
					"is-dealing",
					"deal-active",
				);

				// Start draft pick timer after deal animation completes
				startSharedDraftTimer(() => handleOnlineDraftExpiry());
			}, DEAL_ANIMATION_MS);
		}

		if (transition.type === "pass") {
			setIsPassingDraftCards(true);
		}

		// Fallback: cards present but no timer running
		if (getPlayerHand().length > 0 && !isDraftTimerRunning()) {
			startSharedDraftTimer(() => handleOnlineDraftExpiry());
		}
	} else {
		// Not in draft — clear the draft timer
		stopDraftTimer();
	}

	// Update placement timer
	if (snapshot.phase === "placement") {
		const myPlayer = snapshot.players.find(
			(p) => p.playerId === getCurrentPlayerId(),
		);
		if (myPlayer && !myPlayer.ready) {
			setRemainingTurnSeconds(TURN_DURATION_SECONDS);
			startSharedPlacementTimer(() => handleOnlineConfirmDay());
		}
	} else {
		stopPlacementTimer();
	}
}

// Draft timer functions for online mode
/**
 * Handle draft timer expiry in online mode: auto-pick first card.
 */
function handleOnlineDraftExpiry(): void {
	const snapshot = getCurrentGameSnapshot();
	if (!snapshot || snapshot.phase !== "draft") return;

	const firstCard = getPlayerHand()[0];
	if (firstCard) {
		handleOnlineDraftCard(firstCard.id, "store");
	}
}

function rerenderOnlineGame(): void {
	import("../router.ts").then(({ rerenderGameShell }) => {
		rerenderGameShell();
	});
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTION HANDLERS

async function handleOnlineDraftCard(
	cardId: string,
	mode: "store" | "rest",
): Promise<void> {
	try {
		await rpcCall("draftCard", { cardId, mode });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] draftCard failed:", msg);
	}
}

async function handleOnlinePlaceCard(cardId: string): Promise<void> {
	const snapshot = getCurrentGameSnapshot();
	if (!snapshot) return;

	// Find the first available slot in the current day
	let slotName: string | undefined = undefined;
	const myPlayer = snapshot.players.find(
		(p) => p.playerId === getCurrentPlayerId(),
	);
	if (myPlayer) {
		const boardSlots = boardCellsToSlots(
			myPlayer.board,
			getCurrentCards() ?? [],
		);
		const currentDayIndex = snapshot.day - 1; // Convert to 0-based index

		// Check each slot in the current day for availability
		for (let rowIndex = 0; rowIndex < TIME_SLOTS.length; rowIndex++) {
			const slot = TIME_SLOTS[rowIndex];
			const cell = boardSlots[rowIndex]?.[currentDayIndex];
			if (cell === null) {
				// Found an empty slot
				slotName = slot;
				break;
			}
		}
	}

	if (!slotName) {
		// No available slots - fall back to morning as before (but warn)
		console.warn(
			"[onlineGame] No available slots in current day, falling back to morning",
		);
		slotName = "morning";
	}

	try {
		await rpcCall("placeCard", {
			cardId,
			day: snapshot.day,
			slot: slotName,
		});
		_selectedOnlineCardId = null;
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] placeCard failed:", msg);
	}
}

async function handleOnlinePlaceCardOnBoard(
	cardId: string,
	rowIndex: number,
): Promise<void> {
	const snapshot = getCurrentGameSnapshot();
	if (!snapshot) return;

	const slotName = TIME_SLOTS[rowIndex] as string | undefined;
	if (!slotName) return;

	try {
		await rpcCall("placeCard", {
			cardId,
			day: snapshot.day,
			slot: slotName,
		});
		_selectedOnlineCardId = null;
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] placeCard failed:", msg);
	}
}

async function handleOnlineConfirmDay(): Promise<void> {
	try {
		await rpcCall("confirmDay", {});
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] confirmDay failed:", msg);
	}
}

// Discard card from hand to deck (rest action)
async function handleOnlineDiscardCard(cardId: string): Promise<void> {
	const snapshot = getCurrentGameSnapshot();
	if (!snapshot) return;

	try {
		await rpcCall("discardChosenCard", { cardId });
		_selectedOnlineCardId = null;
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[onlineGame] discardCard failed:", msg);
	}
}
