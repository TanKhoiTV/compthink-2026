/**
 * arena/render.ts — Board grid, hand strip (fan layout), draft pool, focused card rendering.
 *
 * Rebuilt from Trekkopoly/src/app.ts (lines 1798–2190, 4110–4560, 1890–1962)
 * to match the CSS structure in css/client.less.
 *
 * Key structural differences from the first extraction:
 *   - Hand uses .player-hand / .player-hand__cards (flex fan layout)
 *   - Cards get hand-card--fan-N classes for staggered positioning
 *   - Card content includes header, image (bg-image), rarity, tag, bonus, footer
 */

import {
	getBoardSlots,
	getCurrentDayIndex,
	getGamePhase,
	getPlayerHand,
	getSelectedHandCardId,
	getFocusedHandCardId,
	getFocusedBoardCard,
	getShowFocusedPopup,
	getIsSimulationMode,
	getAccumulatedVP,
	getRemainingTurnSeconds,
	getDraftPool,
	getDraftPickSecondsLeft,
	getDraftSelectedCardId,
	getDraftRound,
	getSimulationResult,
	getSimulationReplayIndex,
	getIsReplayComplete,
	getIsInitialDealInProgress,
	getIsPassingDraftCards,
	getDeck,
	getLocalCoinDebt,
	getLocalPlayerReady,
	currentPlayerId,
	getDiscardedResourceCoinBonus,
	getDiscardedResourceStaminaBonus,
	getOpponentPlayers,
	getCurrentPlayerName,
} from "../state.ts";
import type { GamePhase } from "../state.ts";
import {
	getRarityLabel,
	getTagLabel,
	getShortName,
	getShortCity,
	getBonusText,
} from "../shared/card-mapper.ts";
import type { TravelCard } from "../shared/types.ts";
import type { BoardSlots } from "../shared/board.ts";
import { calculateBoardTotals, getPlacedCards } from "../shared/board.ts";
import {
	getRemainingResources,
	getCardAffordability,
	getCardAffordabilityMessage,
} from "../shared/resources.ts";
import type { SimulationReplayStep } from "../shared/scoring.ts";
import { calculateScoreBreakdown } from "../shared/scoring.ts";
import { STARTING_COIN, STARTING_STAMINA } from "../shared/constants.ts";
import {
	GAME_HELP_STEPS,
	renderHelpBubble,
} from "../components/HelpBubble.ts";

// ── Constants ───────────────────────────────────────────────────────────────

// Text length thresholds for responsive card sizing
export const HAND_TITLE_SHORT = 16;
export const HAND_TITLE_MEDIUM = 23;
export const HAND_CITY_SHORT = 18;
export const HAND_CITY_MEDIUM = 28;

export const DAYS = [1, 2, 3, 4, 5];
export const ROWS = ["Sáng", "Trưa", "Chiều", "Tối", "Khuya"];

/**
 * Shared board grid renderer — used by both SP (renderMainArena) and
 * online (renderOnlineGameArenaShell) modes.
 *
 * @param boardSlots - The current board state (TravelCard|null[][])
 * @param currentDayIndex - 0-based current day index
 * @param isDraft - true during draft phase
 * @param isSimulation - true during simulation phase
 * @param selectedCardId - currently selected card in hand, or null
 */
export function renderBoardGrid(
	boardSlots: BoardSlots,
	currentDayIndex: number,
	isDraft: boolean,
	isSimulation: boolean,
	selectedCardId: string | null,
): string {
	return ROWS.map(
		(row, rowIndex) => `
              <div class="time-label">${row}</div>
              ${DAYS.map((_, colIndex) =>
								renderBoardCell(
									boardSlots,
									rowIndex,
									colIndex,
									currentDayIndex,
									isDraft,
									isSimulation,
									selectedCardId,
								),
							).join("")}
            `,
	).join("");
}

// ── Helpers ported from Trekkopoly src/data/cardMapper.ts ────────────────────

function getTextFitClass(
	text: string,
	base: string,
	medium: number,
	long: number,
): string {
	const len = text.trim().length;
	if (len >= long) return `${base} ${base}--xs`;
	if (len >= medium) return `${base} ${base}--sm`;
	return base;
}

function getHandTitleClass(name: string): string {
	return getTextFitClass(
		name,
		"hand-card__name",
		HAND_TITLE_SHORT,
		HAND_TITLE_MEDIUM,
	);
}

function getHandCityClass(city: string): string {
	return getTextFitClass(
		city,
		"hand-card__city",
		HAND_CITY_SHORT,
		HAND_CITY_MEDIUM,
	);
}

// ── Helper functions for conditional rendering ─────────────────────────

function shouldShowEndDayButton(phase: GamePhase, isDraft: boolean): boolean {
	return !isDraft && phase === "placement";
}

function shouldShowPlayerHand(phase: GamePhase): boolean {
	return phase !== "simulation";
}

function shouldShowSimulationPanel(phase: GamePhase): boolean {
	return phase === "simulation";
}

// ── Main arena ──────────────────────────────────────────────────────────────

export function renderMainArena(): string {
	const boardSlots = getBoardSlots();
	const currentDayIndex = getCurrentDayIndex();
	const phase = getGamePhase();
	const isDraft = phase === "draft";
	const isSimulation = phase === "simulation" || getIsSimulationMode();
	const opponents = getOpponentPlayers();
	const myName = getCurrentPlayerName() || currentPlayerId.toUpperCase();
	const focusedCard = getShowFocusedPopup()
		? (getHandCardById(getFocusedHandCardId()) ?? getFocusedBoardCard())
		: null;

	return `
    <main class="arena ${isSimulation ? "arena--scanning" : ""}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>${escapeHtml(myName)}</h1>
          </div>
        </div>
        ${renderScoreBreakdownPanel()}
        ${renderMusicToggle()}
      </div>

      ${renderResourceOrbs()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${DAYS.map(
							(day, index) =>
								`<div class="day-pill ${index === currentDayIndex ? "day-pill--current" : ""} ${index < currentDayIndex ? "day-pill--done" : ""}">NGÀY ${day}</div>`,
						).join("")}
          </div>

          <section class="board-grid">
            ${renderBoardGrid(boardSlots, currentDayIndex, isDraft, isSimulation, getSelectedHandCardId())}
          </section>
        </div>

        ${shouldShowEndDayButton(phase, isDraft) ? renderEndDayButton() : ""}
        
        ${shouldShowPlayerHand(phase) ? renderPlayerHandSection() : ""}
        ${shouldShowSimulationPanel(phase) ? renderSimulationResultPanel() : ""}
      </div>

      ${opponents.length > 0 ? renderOpponentStrip(opponents) : ""}

      ${renderDeckCardStack()}
      ${focusedCard ? renderFocusedCard(focusedCard) : ""}
      ${renderTurnTimer()}
    </main>\n    ${phase === "finished" ? renderGameOverScreen() : ""}
  `;
}

// ── Board cell ──────────────────────────────────────────────────────────────

function renderBoardCell(
	boardSlots: BoardSlots,
	rowIndex: number,
	colIndex: number,
	currentDayIndex: number,
	isDraft: boolean,
	isSimulation: boolean,
	selectedId: string | null,
): string {
	const card = boardSlots[rowIndex]?.[colIndex] ?? null;
	const isCurrentDayColumn = colIndex === currentDayIndex;
	const isPlaceable =
		!isDraft &&
		!isSimulation &&
		isCurrentDayColumn &&
		selectedId !== null &&
		card === null;

	// Replay highlight during simulation
	let replayClass = "";
	if (isSimulation) {
		const stepInfo = getReplayStepForBoardCell(rowIndex, colIndex);
		if (stepInfo) {
			if (stepInfo.isCurrent) replayClass = "board-cell--replay-current";
			else if (stepInfo.isDone) replayClass = "board-cell--replay-done";
		}
	}

	if (!card) {
		return `
      <div
        class="board-cell board-cell--empty ${isSimulation ? "board-cell--locked-mode" : ""} ${!isCurrentDayColumn && !isSimulation ? "board-cell--not-current-day" : ""} ${isPlaceable ? "board-cell--placeable" : ""} ${replayClass}"
        data-board-cell="true"
        data-row-index="${rowIndex}"
        data-col-index="${colIndex}"
        title="${isCurrentDayColumn ? (isPlaceable ? "Thả thẻ vào ô ngày hiện tại" : "Chỉ xếp thẻ cho ngày hiện tại") : "Không phải ngày hiện tại"}"
      >
        <span class="empty-plus">+</span>
      </div>
    `;
	}

	return `
    <div
      class="board-cell board-cell--occupied board-cell--clickable ${replayClass}"
      data-board-cell="true"
      data-row-index="${rowIndex}"
      data-col-index="${colIndex}"
      title="${card.name}"
    >
      ${renderBoardMiniCard(card)}
    </div>
  `;
}

// ── Mini card (on board) ────────────────────────────────────────────────────

export function renderBoardMiniCard(card: TravelCard): string {
	// Board token cards (lock/debt) get a special compact layout
	const token = card as TravelCard & {
		boardTokenType?: "debt" | "lock";
	};

	if (token.boardTokenType === "lock") {
		return `
      <article class="board-mini board-mini--token board-mini--lock" title="Ô bị khóa vì kiệt sức">
        <div class="board-mini-token__icon">🔒</div>
        <strong>Bị khóa kiệt sức</strong>
      </article>
    `;
	}

	if (token.boardTokenType === "debt") {
		return `
      <article class="board-mini board-mini--token board-mini--debt" title="Bấm để trả nợ">
        <div class="board-mini-token__icon">💸</div>
        <strong>Nợ tiền ${token.debtAmount ?? 0} xu</strong>
      </article>
    `;
	}

	const tagClass = card.tag ? `board-mini__tag--${card.tag.toLowerCase()}` : "";
	const rarityClass = card.rarity ? `board-mini--${card.rarity}` : "";
	return `
    <article class="board-mini ${rarityClass}" title="${card.name}">
      <div
        class="board-mini__image"
        style="background-image: url('${card.image}')"
      ></div>
      <div class="board-mini__tag ${tagClass}">
        ${card.tag ? getTagLabel(card.tag) : ""}
      </div>
      <div class="board-mini__info">
        <h3 class="board-mini__name">${card.name}</h3>
        <div class="board-mini__vp">★ ${card.vp}</div>
      </div>
    </article>
  `;
}

// ── Draft hand top meta ───────────────────────────────────────────────────

function renderDraftHandTopMeta(): string {
	const pool = getDraftPool();
	const hand = getPlayerHand();
	const selectedId = getDraftSelectedCardId();
	const selectedCard = selectedId
		? pool.find((c) => c.id === selectedId) ||
			hand.find((c) => c.id === selectedId)
		: null;
	const draftRound = getDraftRound();
	const isDealing = getIsInitialDealInProgress();
	const statusText = isDealing
		? "Đang phát bài vào tay..."
		: selectedCard
			? "Đã chọn. Hết giờ mới chuyền bài."
			: "Bấm để chọn, giữ 0.5s để xem lớn.";

	return `
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${draftRound}/5</span>
        <strong>${selectedCard ? selectedCard.name : "Bấm 1 lá để chọn"}</strong>
        <em>${statusText}</em>
      </div>
    </div>
  `;
}

// ── Player hand section ─────────────────────────────────────────────────────

function renderPlayerHandSection(): string {
	const hand = getPlayerHand();
	const gamePhase = getGamePhase();
	const isDraft = gamePhase === "draft";
	const currentDayIndex = getCurrentDayIndex();
	const selectedId = getSelectedHandCardId();

	if (isDraft) {
		// ── Draft phase: render draft pool inside player-hand--draft ──
		const pool = getDraftPool();
		const secondsLeft = getDraftPickSecondsLeft();
		const draftSelectedId = getDraftSelectedCardId();
		const dangerClass = secondsLeft <= 3 ? "player-hand__meta--danger" : "";
		const isDealing = getIsInitialDealInProgress();
		const dealingClass = isDealing ? "player-hand--dealing is-dealing" : "";
		const isPassing = getIsPassingDraftCards();
		const passingClass = isPassing ? "is-passing" : "";

		return `
      <section class="player-hand player-hand--draft ${dealingClass}">
        <div class="player-hand__top">
          <div class="player-hand__title">
            <span class="hand-badge">DRAFT</span>
            <h2>Chọn thẻ ngày ${DAYS[currentDayIndex]}</h2>
          </div>
          <div class="player-hand__meta ${dangerClass}">Còn ${secondsLeft}s • bấm 1 lá để chọn</div>
        </div>
        ${renderDraftHandTopMeta()}
        <div class="player-hand__cards ${passingClass}">
          ${pool
						.map(
							(card, index) => `
            <div class="daily-draft-card daily-draft-card--${index + 1}${card.id === draftSelectedId ? " daily-draft-card--selected" : ""}" data-draft-card-id="${card.id}">
              ${renderHandCard(card, index, null)}
            </div>
          `,
						)
						.join("")}
        </div>
      </section>
    `;
	}

	if (hand.length === 0) {
		return `
      <section class="player-hand">
        <div class="player-hand__top">
          <div class="player-hand__title">
            <span class="hand-badge">HAND</span>
            <h2>Bài ngày ${DAYS[currentDayIndex]}</h2>
          </div>
          <div class="player-hand__meta">Không có thẻ nào</div>
        </div>
        <div class="player-hand__cards"></div>
      </section>
    `;
	}

	return `
    <section class="player-hand">
      <div class="player-hand__top">
        <div class="player-hand__title">
          <span class="hand-badge">HAND</span>
          <h2>Bài ngày ${DAYS[currentDayIndex]}</h2>
        </div>
        <div class="player-hand__meta">Giữ 0.5s để xem lớn</div>
      </div>
      <div class="player-hand__cards">
        ${hand.map((card, index) => renderHandCard(card, index, selectedId)).join("")}
      </div>
    </section>
  `;
}

// ── Hand card (individually) ────────────────────────────────────────────────

export function renderHandCard(
	card: TravelCard,
	index: number,
	selectedId: string | null,
): string {
	const isSelected = card.id === selectedId;
	const rarityClass = card.rarity
		? `hand-card--${card.rarity}`
		: "hand-card--common";
	const fanClass = `hand-card--fan-${index + 1}`;
	const shortName =
		(card as { shortName?: string }).shortName?.trim() ||
		getShortName(card.name);
	const shortCity =
		(card as { shortCity?: string }).shortCity?.trim() ||
		getShortCity(card.city || "");
	const titleClass = getHandTitleClass(shortName);
	const cityClass = getHandCityClass(shortCity);

	// Resource affordability (includes discard bonus)
	const boardTotals = calculateBoardTotals(getBoardSlots());
	const remaining = getRemainingResources({
		totals: boardTotals,
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
		discardBonusCoin: getDiscardedResourceCoinBonus(),
		discardBonusStamina: getDiscardedResourceStaminaBonus(),
	});
	const affordability = getCardAffordability({ card, remaining });
	const affordabilityClass = !affordability.canAfford
		? "hand-card--unaffordable"
		: "";
	const affordabilityTitle = getCardAffordabilityMessage(affordability);

	return `
    <article
      class="hand-card ${rarityClass} ${fanClass} ${isSelected ? "hand-card--selected" : ""} ${affordabilityClass}"
      data-hand-card-id="${card.id}"
      title="${card.name} — ${affordabilityTitle}"
      data-select-card="true"
      onpointerdown="event.stopPropagation(); startHandPointerDrag(event, '${card.id}')"
    >
      ${
				isSelected
					? `
        <button class="hand-card__close" onclick="event.stopPropagation(); clearSelectedHandCard()" title="Hủy chọn">×</button>
      `
					: ""
			}

      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${titleClass}">${shortName}</h3>
          <div class="${cityClass}">📍 ${shortCity}</div>
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
  `;
}

// ── Hand strip (legacy export — kept for compatibility) ────────────────────

export function renderHandCards(): string {
	const hand = getPlayerHand();
	const selectedId = getSelectedHandCardId();

	return hand
		.map((card, index) => renderHandCard(card, index, selectedId))
		.join("");
}

// ── Draft hand cards ────────────────────────────────────────────────────────

export function renderDraftHandCards(cards: TravelCard[]): string {
	return cards
		.map(
			(card, index) => `
    <div class="daily-draft-card daily-draft-card--${index + 1}" data-draft-card-id="${card.id}">
      ${renderHandCard(card, index, null)}
      <button class="draft-card__select">Chọn</button>
    </div>
  `,
		)
		.join("");
}

// ── Focused card popup ──────────────────────────────────────────────────────

export function renderFocusedCard(card: TravelCard): string {
	const rarityClass = card.rarity ? `card--rarity-${card.rarity}` : "";
	return `
    <div class="focused-card-overlay">
      <div class="focused-card ${rarityClass}">
        <button id="focused-card-close" class="focused-card__close">&times;</button>
        <img src="${card.image}" alt="${card.name}" class="focused-card__image" onerror="this.style.display='none'" />
        <div class="focused-card__details">
          <h2>${card.name}</h2>
          <p>${card.description ?? ""}</p>
          <div class="focused-card__stats">
            <span>VP: ${card.vp}</span>
            <span>Xu: ${card.coin}</span>
            <span>Stamina: ${card.stamina}</span>
          </div>
          ${card.tags ? `<div class="focused-card__tags">${card.tags.map((t) => `<span class="tag">${getTagLabel(t)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

// ── Score panel ─────────────────────────────────────────────────────────────

function renderMusicToggle(): string {
	const state = (
		globalThis as { getMusicState?: () => { muted: boolean } }
	).getMusicState?.() ?? { muted: false };
	const icon = state.muted ? "🔇" : "🔊";
	const mutedClass = state.muted ? "is-muted" : "";

	return `
    <button
      class="music-toggle-btn ${mutedClass}"
      onclick="event.stopPropagation(); window.toggleMusicMute()"
      title="Bật/tắt nhạc nền"
      type="button"
    >
      <span class="music-toggle-btn__icon">${icon}</span>
    </button>
  `;
}

export function renderDeckCardStack(): string {
	const deck = getDeck();
	const remaining = deck.length;

	// Hide during simulation / game over
	const sim = getIsSimulationMode();
	const phase = getGamePhase();
	if (sim || phase === "simulation" || phase === "finished") return "";

	return `
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
            <strong>${remaining}</strong>
            <em>lá</em>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderScoreBreakdownPanel(): string {
	const board = getBoardSlots();
	const dayIndex = getCurrentDayIndex();

	// Collect all placed cards from completed days (all time slots)
	const placedCards: TravelCard[] = [];
	for (let colIdx = 0; colIdx <= dayIndex; colIdx++) {
		for (let row = 0; row < board.length; row++) {
			const card = board[row]?.[colIdx];
			if (card) placedCards.push(card);
		}
	}

	const breakdown = calculateScoreBreakdown({
		placedCards,
		getBoardDisplayName: (c) => c.name,
	});

	const totalScore = getAccumulatedVP() || breakdown.totalVP;
	const usedSlots = placedCards.length;
	const maxSlots = dayIndex * 5 + 5;
	const phase = getGamePhase();
	const timerSecs = getRemainingTurnSeconds();
	const bonusClass =
		breakdown.bonusVP > 0 ? "score-breakdown__item--bonus" : "";

	function fmtTimer(s: number): string {
		const safe = Math.max(0, s);
		const m = Math.floor(safe / 60);
		const sec = safe % 60;
		return `${m}:${sec < 10 ? "0" : ""}${sec}`;
	}

	let timerHtml: string;
	if (phase === "draft") {
		const draftSecs = getDraftPickSecondsLeft();
		const danger = draftSecs <= 3 ? "score-breakdown__timer--danger" : "";
		timerHtml = `
      <div class="score-breakdown__timer ${danger}">
        <span>DRAFT</span>
        <strong>${draftSecs}s</strong>
      </div>`;
	} else if (phase === "placement") {
		const danger = timerSecs <= 10 ? "score-breakdown__timer--danger" : "";
		timerHtml = `
      <div class="score-breakdown__timer ${danger}">
        <span>TIME</span>
        <strong>${fmtTimer(timerSecs)}</strong>
      </div>`;
	} else {
		timerHtml = `
      <div class="score-breakdown__timer">
        <span>NGÀY</span>
        <strong>${dayIndex + 1}/5</strong>
      </div>`;
	}

	return `
    <section class="score-breakdown">
      <div class="score-breakdown__header">
        <span>ĐIỂM</span>
        <strong>${totalScore}</strong>
      </div>

      <div class="score-breakdown__item">
        <span>BASE VP</span>
        <strong>${breakdown.baseVP}</strong>
      </div>

      <div class="score-breakdown__item ${bonusClass}">
        <span>BONUS</span>
        <strong>${breakdown.bonusVP > 0 ? `+${breakdown.bonusVP}` : 0}</strong>
      </div>

      <div class="score-breakdown__item">
        <span>SLOT</span>
        <strong>${usedSlots}/${maxSlots}</strong>
      </div>

      <div class="score-breakdown__details">
		<div>₡${breakdown.spentCoin} • ⚡${breakdown.spentStamina}</div>
		${
			getLocalCoinDebt() > 0
				? `<button type="button" class="debt-link" onclick="event.stopPropagation(); window.openDebtTokenModal()" title="Bấm để quản lý nợ">💸 Nợ ${getLocalCoinDebt()}₡ (-${getLocalCoinDebt() * 10}VP)</button>`
				: ""
		}
	  </div>

      ${timerHtml}
    </section>
  `;
}

// ── Resource orbs ───────────────────────────────────────────────────────────

export function renderResourceOrbs(): string {
	const board = getBoardSlots();
	const totals = calculateBoardTotals(board);
	const remaining = getRemainingResources({
		totals,
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
		discardBonusCoin: getDiscardedResourceCoinBonus(),
		discardBonusStamina: getDiscardedResourceStaminaBonus(),
	});
	const debt = getLocalCoinDebt();

	return `
    <div class="resource-orbs">
      <div class="resource-orb resource-orb--coin">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon">🪙</div>
          <div class="resource-orb__value">${remaining.coin}</div>
        </div>
        <div class="resource-orb__label">Xu</div>
      </div>
      <div class="resource-orb-cluster resource-orb-cluster--stamina">
        ${renderHelpBubble({
					title: "Cách chơi",
					steps: GAME_HELP_STEPS,
					bubbleLabel: "Cách chơi",
					position: "game",
				})}
        <div class="resource-orb resource-orb--stamina">
          <div class="resource-orb__frame">
            <div class="resource-orb__icon resource-orb__icon--stamina">⚡</div>
            <div class="resource-orb__value">${remaining.stamina}</div>
          </div>
          <div class="resource-orb__label">Thể lực</div>
        </div>
      </div>
      ${
				debt > 0
					? `
      <div class="resource-orb resource-orb--debt">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon">💸</div>
          <div class="resource-orb__value">${debt}</div>
        </div>
        <div class="resource-orb__label">Nợ</div>
      </div>`
					: ""
			}
    </div>
  `;
}

// ── End Day button ──────────────────────────────────────────────────────────

function renderEndDayButton(): string {
	const ready = getLocalPlayerReady();
	if (ready) {
		return `
    <div class="end-day-bar">
      <button class="end-day-btn end-day-btn--awaiting" disabled>
        ⏳ Đang chờ người chơi khác...
      </button>
    </div>
  `;
	}
	return `
    <div class="end-day-bar">
      <button class="end-day-btn" onclick="event.stopPropagation(); window['endCurrentDay']()">
        Kết thúc ngày ${getCurrentDayIndex() + 1}
      </button>
    </div>
  `;
}

// ── Game Over screen ─────────────────────────────────────────────────────────

export function renderGameOverScreen(): string {
	const breakdownTotal = getAccumulatedVP();
	const board = getBoardSlots();
	const totals = calculateBoardTotals(board);
	const placedCards = getPlacedCards(board);
	const breakdown = calculateScoreBreakdown({
		placedCards,
		getBoardDisplayName: (c) => c.name,
	});

	// Debt penalty: accumulatedVP may be lower than card score due to debt
	const debtPenalty = breakdown.totalVP - breakdownTotal;
	const finalScore = breakdownTotal;

	const comboLines = (breakdown.lines ?? [])
		.map((d: string) => `<li class="game-over__detail-item">${d}</li>`)
		.join("");

	return `
    <div class="game-over-overlay">
      <div class="game-over-card">
        <div class="game-over__header">
          <span class="game-over__badge">KẾT THÚC</span>
          <h1 class="game-over__title">Hoàn thành!</h1>
          <p class="game-over__subtitle">Chuyến đi 5 ngày đã kết thúc</p>
        </div>

        <div class="game-over__score">
          <span class="game-over__score-label">Tổng điểm</span>
          <span class="game-over__score-value">${finalScore}</span>
          <span class="game-over__score-unit">VP</span>
        </div>

        <div class="game-over__breakdown">
          <div class="game-over__row">
            <span>Điểm cơ bản</span>
            <span>${breakdown.baseVP}</span>
          </div>
          <div class="game-over__row">
            <span>Thưởng combo</span>
            <span>${breakdown.bonusVP > 0 ? `+${breakdown.bonusVP}` : "0"}</span>
          </div>
          ${comboLines ? `<ul class="game-over__details">${comboLines}</ul>` : ""}
          ${
						debtPenalty > 0
							? `
          <div class="game-over__row game-over__row--debt">
            <span>Nợ xu (×10 VP)</span>
            <span>-${debtPenalty}</span>
          </div>`
							: ""
					}
        </div>

        <div class="game-over__stats">
          <div class="game-over__stat">
            <span class="game-over__stat-value">${totals.usedSlots}/25</span>
            <span class="game-over__stat-label">Số thẻ đã đặt</span>
          </div>
          <div class="game-over__stat">
            <span class="game-over__stat-value">${totals.coin}</span>
            <span class="game-over__stat-label">🟡 Xu</span>
          </div>
          <div class="game-over__stat">
            <span class="game-over__stat-value">${totals.stamina}</span>
            <span class="game-over__stat-label">⚡ Thể lực</span>
          </div>
        </div>

        <button onclick="location.reload()" class="game-over__replay">
          Chơi lại
        </button>

        <div class="game-over__actions">
          <button onclick="downloadTravelCertificateHtml()" class="game-over__action">
            🏆 Chứng nhận hành trình
          </button>
          <button onclick="downloadTravelTimelineTxt()" class="game-over__action game-over__action--alt">
            📋 Tải lịch trình (.txt)
          </button>
          <button onclick="downloadTravelTimelineJson()" class="game-over__action game-over__action--alt">
            📊 Tải lịch trình (.json)
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Turn timer ──────────────────────────────────────────────────────────────

export function renderTurnTimer(): string {
	return `
    <div class="turn-timer">
      <span>${getRemainingTurnSeconds()}s</span>
    </div>
  `;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getHandCardById(cardId: string | null): TravelCard | null {
	if (!cardId) return null;
	const hand = getPlayerHand();
	return hand.find((c) => c.id === cardId) ?? null;
}

// ── Simulation helpers ───────────────────────────────────────────────────────

function formatSignedVP(value: number): string {
	if (value > 0) return `+${value}`;
	if (value < 0) return `${value}`;
	return "0";
}

function getReplayStepForBoardCell(
	rowIndex: number,
	colIndex: number,
): { stepIndex: number; isCurrent: boolean; isDone: boolean } | null {
	const result = getSimulationResult();
	if (!result) return null;

	const replayIndex = getSimulationReplayIndex();

	for (let i = 0; i < result.replaySteps.length; i++) {
		const step = result.replaySteps[i];
		if (step.rowIndex === rowIndex && step.dayIndex === colIndex) {
			return {
				stepIndex: i,
				isCurrent: i === replayIndex - 1,
				isDone: i < replayIndex,
			};
		}
	}
	return null;
}

function getSimEventIcon(eventType?: string | null): string {
	if (eventType === "storm") return "⛈";
	if (eventType === "traffic") return "🚦";
	if (eventType === "distance") return "🧭";
	if (eventType === "promo") return "🏷";
	return "✦";
}

function getSimEventTitle(
	eventType?: string | null,
	eventText?: string | null,
): string {
	if (eventText) return eventText;
	if (eventType === "storm") return "Mưa giông";
	if (eventType === "traffic") return "Kẹt xe";
	if (eventType === "distance") return "Xa tuyến";
	if (eventType === "promo") return "Ưu đãi";
	return "";
}

export function renderSimulationResultPanel(): string {
	const result = getSimulationResult();
	if (!result) return "";

	const replayIndex = getSimulationReplayIndex();
	const totalSteps = result.replaySteps.length;
	const isComplete = getIsReplayComplete();

	// Track offset for horizontal scroll animation (matches old Trekkopoly)
	const TICKET_WIDTH = 366;
	const FIRST_TICKET_CENTER = 223;
	const endBoost =
		replayIndex === totalSteps - 1
			? 460
			: replayIndex === totalSteps - 2
				? 180
				: 0;
	const trackOffset =
		FIRST_TICKET_CENTER + replayIndex * TICKET_WIDTH + endBoost;

	// Current step being shown
	const currentStep =
		replayIndex > 0 && replayIndex <= totalSteps
			? result.replaySteps[replayIndex - 1]
			: null;

	// Partial VP from steps processed so far
	let partialVP = 0;
	for (let i = 0; i < Math.min(replayIndex, totalSteps); i++) {
		partialVP += result.replaySteps[i].vpDelta;
	}

	const stepsHtml = (result.replaySteps as SimulationReplayStep[])
		.map((step: SimulationReplayStep, i: number) => {
			const isLast = i === totalSteps - 1;
			const shouldTear = !isComplete && isLast && i === replayIndex;
			const isActive = !isComplete && i === replayIndex && !shouldTear;
			const isDone = isComplete || i < replayIndex || shouldTear;
			const isFuture = !isComplete && i > replayIndex;
			const hasEvent = Boolean(step.eventType || step.eventText);
			const eventTitle = getSimEventTitle(step.eventType, step.eventText);
			const eventIcon = getSimEventIcon(step.eventType);

			return `
      <article
        class="score-ticket ${isActive ? "is-active" : ""} ${isDone ? "is-torn" : ""} ${isFuture ? "is-future" : ""} ${step.isEmpty ? "is-empty" : ""} ${hasEvent ? "has-event" : ""} ${step.isBadEvent ? "score-ticket--bad" : ""} ${step.eventType ? `score-ticket--event-${step.eventType}` : ""}">
        <div class="score-ticket__perforation score-ticket__perforation--left"></div>
        <div class="score-ticket__perforation score-ticket__perforation--right"></div>

        <div class="score-ticket__head">
          <span>${step.timeLabel}</span>
          <strong>${formatSignedVP(step.vpDelta)} VP</strong>
        </div>

        <div class="score-ticket__body">
          <h4>${step.title}</h4>
          <p>${step.subtitle ?? ""}</p>
        </div>

        <div class="score-ticket__stats">
          <span class="${step.coinDelta > 0 ? "is-cost" : ""}">Xu ${step.coinDelta}</span>
          <span class="${step.staminaDelta > 0 ? "is-cost" : ""}">Lực ${step.staminaDelta}</span>
        </div>

        ${step.comboText ? `<div class="score-ticket__combo">COMBO</div>` : ""}

        ${
					hasEvent
						? `
        <div class="score-ticket__stamp">
          <b>${eventIcon}</b>
          <span>${eventTitle}</span>
        </div>`
						: ""
				}
      </article>`;
		})
		.join("");

	// Day rail
	const dayRailHtml =
		result.daySummaries
			?.map(
				(ds: { dayIndex: number; label: string; vp: number }, i: number) => {
					const activeDay = getCurrentDayIndex();
					const isDayActive = i === activeDay;
					const isDayDone = i < activeDay;
					return `
      <div class="replay-day ${isDayActive ? "replay-day--active" : ""} ${isDayDone ? "replay-day--done" : ""}">
        <span class="replay-day__label">${ds.label?.replace("Ngày ", "") ?? i + 1}</span>
        <span class="replay-day__vp">${formatSignedVP(ds.vp)}</span>
      </div>`;
				},
			)
			.join("") ?? "";

	return `
    <section class="ticket-scan-overlay" onclick="event.stopPropagation()">
      <div class="ticket-scan-overlay__scrim"></div>

      <div class="ticket-scan-overlay__header">
        <span>ĐANG QUÉT TÍNH ĐIỂM</span>
        <strong>Ngày ${getCurrentDayIndex() + 1}</strong>
        <em>${currentStep ? `Đang tính: ${currentStep.timeLabel}` : "Đang chuẩn bị..."}</em>
      </div>

      <div class="ticket-scan-strip">
        <div class="ticket-scan-strip__backdrop"></div>
        <div
          class="ticket-scan-track"
          style="transform: translateX(calc(50% - ${trackOffset}px)); --scan-index: ${replayIndex};"
        >
          ${stepsHtml}
        </div>
      </div>

      ${dayRailHtml ? `<div class="replay-day-rail">${dayRailHtml}</div>` : ""}

      <div class="ticket-scan-overlay__footer">
        <div><span>Tiến trình</span><strong>${Math.min(replayIndex, totalSteps)} / ${totalSteps}</strong></div>
        <div><span>Điểm ngày</span><strong>${formatSignedVP(partialVP)} VP</strong></div>
        <div><span>Tổng</span><strong>${getAccumulatedVP()} VP</strong></div>
        ${isComplete ? `<div class="ticket-scan-overlay__complete"><span>✓ Hoàn tất</span><em>+${result.finalVP} VP</em></div>` : ""}
      </div>
    </section>
  `;
}

// ── Opponent strip (single-player with bots) ─────────────────────────────────

export function renderOpponentStrip(
	opponents: Array<{
		name: string;
		playerId: string;
		resources: { vp: number };
		ready: boolean;
		hand: string[];
		chosen: string[];
		board: unknown[];
	}>,
): string {
	return `
    <div class="opponent-strip">
      ${opponents
				.map(
					(p) => `
        <div class="opponent-chip" title="${escapeHtml(p.name)} — ${p.resources.vp} VP, ${p.hand.length} lá trên tay, ${p.chosen.length} lá đã chọn, ${p.board.length} lá đã đặt">
          <span class="opponent-chip__name">${escapeHtml(p.name)}</span>
          <span class="opponent-chip__vp">${p.resources.vp}</span>
          <span class="opponent-chip__icon">🏆</span>
        </div>
      `,
				)
				.join("")}
    </div>
  `;
}

// ── Escaping ─────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
