/**
 * arena/render.ts — Board grid, hand strip (fan layout), draft pool, focused card rendering.
 *
 * Rebuilt from TREKPOLOGY/src/app.ts (lines 1798–2190, 4110–4560, 1890–1962)
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
	currentPlayerId,
} from "../state.ts";
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

// ── Constants ───────────────────────────────────────────────────────────────

export const DAYS = [1, 2, 3, 4, 5];
export const ROWS = ["Sáng", "Trưa", "Chiều", "Tối", "Khuya"];

// ── Helpers ported from TREKPOLOGY src/app.ts / src/data/cardMapper.ts ──────

function getRarityLabel(rarity: string | undefined): string {
	switch (rarity) {
		case "common":
			return "★";
		case "uncommon":
			return "★★";
		case "epic":
			return "★★★★";
		case "legendary":
			return "★★★★★";
		default:
			return "★";
	}
}

function getTagLabel(tag: string): string {
	switch (tag) {
		case "FOOD":
			return "Ẩm thực";
		case "CULTURE":
			return "Văn hóa";
		case "ACTION":
			return "Khám phá";
		case "UTILITY":
			return "Tiện ích";
		case "OUTDOOR":
			return "Ngoài trời";
		case "INDOOR":
			return "Trong nhà";
		default:
			return "Khác";
	}
}

function getBonusText(card: TravelCard): string {
	const effect = card.onPlayEffect;
	if (effect && effect.has_effect) {
		switch (effect.effect_type) {
			case "RECOVER_LA":
				return `Khi đặt xuống: hồi ${effect.effect_value} thể lực`;
			case "RECOVER_XU":
				return `Khi đặt xuống: hồi ${effect.effect_value} xu`;
			case "GAIN_VP":
				return `Khi đặt xuống: +${effect.effect_value} VP`;
		}
	}

	const tags = card.tags ?? [];
	if (tags.includes("FOOD")) return "Nếu có 2 lá Ẩm thực: +5 VP";
	if (tags.includes("CULTURE")) return "Nếu có 2 lá Văn hóa: +8 VP";
	if (tags.includes("ACTION")) return "Nếu đặt sau lá Khám phá: +10 VP";
	return "Không có hiệu ứng đặc biệt";
}

function getShortName(name: string): string {
	const trimmed = name.trim();
	const manual: Record<string, string> = {
		"Cà Phê Bệt Nhà Thờ Đức Bà": "Cà Phê Bệt",
		"Bánh Tráng Nướng Hồ Con Rùa": "Bánh Tráng",
		"Cà Phê Vợt Cheo Leo": "Cà Phê Vợt",
		"Phá Lấu Bò Cô Oanh": "Phá Lấu",
		"Súp Cua Chợ Tân Định": "Súp Cua",
		"Bánh Mì Huỳnh Hoa": "Bánh Mì",
		"Phố Ẩm Thực Hồ Thị Kỷ": "Hồ Thị Kỷ",
		"Cà Phê Chung Cư 42 Nguyễn Huệ": "Cà Phê 42",
		"Phố Sủi Cảo Hà Tôn Quyền": "Sủi Cảo",
		"Cơm Tấm Ba Ghiền": "Cơm Tấm",
		"Phố Ốc Vĩnh Khánh": "Ốc Vĩnh Khánh",
		"Bánh Xèo Đinh Công Tráng": "Bánh Xèo",
		"Chè Hà Ký Chợ Lớn": "Chè Hà Ký",
		"Phở Hòa Pasteur": "Phở Hòa",
		"Lẩu Cá Kèo Bà Huyện Thanh Quan": "Lẩu Cá Kèo",
		"Dimsum Tiến Phát": "Dimsum",
		"Nhà Hàng Chay Hum": "Chay Hum",
		"Ăn Tối Du Thuyền Sông Sài Gòn": "Du Thuyền Tối",
		"Tầng 79 Landmark 81": "Landmark 81",
		"Cơm Quê Dượng Bầu": "Dượng Bầu",
	};
	if (manual[trimmed]) return manual[trimmed];
	if (trimmed.length <= 14) return trimmed;
	const words = trimmed.split(/\s+/);
	if (words.length <= 3) return trimmed;
	return words.slice(0, 3).join(" ");
}

function getShortCity(city: string): string {
	const trimmed = city.trim();
	const manual: Record<string, string> = {
		"Sài Gòn": "Sài Gòn",
		"Hà Nội": "Hà Nội",
		"Đà Lạt": "Đà Lạt",
		"Đà Nẵng": "Đà Nẵng",
		"Quảng Ninh": "Quảng Ninh",
	};
	if (manual[trimmed]) return manual[trimmed];
	if (trimmed.length <= 12) return trimmed;
	return trimmed.slice(0, 12).trim() + "…";
}

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
	return getTextFitClass(name, "hand-card__name", 16, 23);
}

function getHandCityClass(city: string): string {
	return getTextFitClass(city, "hand-card__city", 18, 28);
}

// ── Main arena ──────────────────────────────────────────────────────────────

export function renderMainArena(): string {
	const boardSlots = getBoardSlots();
	const currentDayIndex = getCurrentDayIndex();
	const phase = getGamePhase();
	const isDraft = phase === "draft";
	const isSimulation = phase === "simulation" || getIsSimulationMode();
	const focusedCard = getShowFocusedPopup()
		? (getHandCardById(getFocusedHandCardId()) ?? getFocusedBoardCard())
		: null;

	return `
    <main class="arena ${isSimulation ? "arena--scanning" : ""}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>
          <div>
            <h1>${currentPlayerId.toUpperCase()}</h1>
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
            ${ROWS.map(
							(row, rowIndex) => `
              <div class="time-label">${row}</div>
              ${DAYS.map((_, colIndex) => renderBoardCell(boardSlots, rowIndex, colIndex, currentDayIndex, isDraft, isSimulation)).join("")}
            `,
						).join("")}
          </section>
        </div>

        ${!isDraft && phase === "placement" ? renderEndDayButton() : ""}

        ${phase !== "simulation" ? renderPlayerHandSection() : ""}
        ${phase === "simulation" ? renderSimulationResultPanel() : ""}
      </div>

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
): string {
	const card = boardSlots[rowIndex]?.[colIndex] ?? null;
	const isCurrentDayColumn = colIndex === currentDayIndex;
	const selectedId = getSelectedHandCardId();
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
	const shortName = (card as any).shortName || getShortName(card.name);
	const shortCity = (card as any).shortCity || getShortCity(card.city || "");
	const titleClass = getHandTitleClass(shortName);
	const cityClass = getHandCityClass(shortCity);

	// Resource affordability
	const boardTotals = calculateBoardTotals(getBoardSlots());
	const remaining = getRemainingResources({
		totals: boardTotals,
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
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
        <img src="${card.image}" alt="${card.name}" class="focused-card__image" />
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
	const state = (globalThis as any).getMusicState?.() ?? { muted: false };
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

function renderDeckCardStack(): string {
	const deck = getDeck();
	const remaining = deck.length;

	// Hide during simulation / game over
	const sim = getIsSimulationMode();
	const phase = getGamePhase();
	if (sim || phase === "simulation" || phase === "finished") return "";

	return `
    <section class="deck-pile-panel">
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

function renderScoreBreakdownPanel(): string {
	const board = getBoardSlots();
	const dayIndex = getCurrentDayIndex();

	// Collect all placed cards from the board
	const placedCards: TravelCard[] = [];
	for (let row = 0; row <= dayIndex; row++) {
		const col = board[row] || [];
		for (let colIdx = 0; colIdx < col.length; colIdx++) {
			const card = col[colIdx];
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
				? `<div>💸 Nợ ${getLocalCoinDebt()}₡ (-${getLocalCoinDebt() * 10}VP)</div>`
				: ""
		}
	  </div>

      ${timerHtml}
    </section>
  `;
}

// ── Resource orbs ───────────────────────────────────────────────────────────

function renderResourceOrbs(): string {
	const board = getBoardSlots();
	const totals = calculateBoardTotals(board);
	const remaining = getRemainingResources({
		totals,
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
	});
	const debt = getLocalCoinDebt();

	return `
    <div class="resource-orbs">
      <div class="orb orb--coin">
        <span class="orb__icon">C</span>
        <span class="orb__value">${remaining.coin}</span>
      </div>
      <div class="orb orb--stamina">
        <span class="orb__icon">S</span>
        <span class="orb__value">${remaining.stamina}</span>
      </div>
      <div class="orb orb--debt">
        <span class="orb__icon">D</span>
        <span class="orb__value">${debt}</span>
      </div>
    </div>
  `;
}

// ── End Day button ──────────────────────────────────────────────────────────

function renderEndDayButton(): string {
	return `
    <div class="end-day-bar">
      <button class="end-day-btn" onclick="event.stopPropagation(); window['endCurrentDay']()">
        Kết thúc ngày ${getCurrentDayIndex() + 1}
      </button>
    </div>
  `;
}

// ── Game Over screen ─────────────────────────────────────────────────────────

function renderGameOverScreen(): string {
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

function renderTurnTimer(): string {
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

function renderSimulationResultPanel(): string {
	const result = getSimulationResult();
	if (!result) return "";

	const replayIndex = getSimulationReplayIndex();
	const totalSteps = result.replaySteps.length;
	const isComplete = getIsReplayComplete();

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
		.slice(0, Math.max(replayIndex, 1))
		.map((step: SimulationReplayStep, i: number) => {
			const isActive = i === replayIndex - 1;
			const isDone = i < replayIndex - 1;
			return `
      <div class="score-ticket ${isActive ? "score-ticket--active" : ""} ${isDone ? "score-ticket--done" : ""} ${step.isBadEvent ? "score-ticket--bad" : ""} ${step.isBoardToken ? "score-ticket--token" : ""}">
        <div class="score-ticket__time">${step.timeLabel}</div>
        <div class="score-ticket__vp ${step.vpDelta > 0 ? "score-ticket__vp--pos" : step.vpDelta < 0 ? "score-ticket__vp--neg" : ""}">${formatSignedVP(step.vpDelta)}</div>
        <div class="score-ticket__title">${step.title}</div>
        ${step.subtitle ? `<div class="score-ticket__subtitle">${step.subtitle}</div>` : ""}
        ${step.comboText ? `<div class="score-ticket__combo">${step.comboText}</div>` : ""}
        ${step.eventText ? `<div class="score-ticket__event">${step.eventText}</div>` : ""}
      </div>
    `;
		})
		.join("");

	return `
    <section class="ticket-scan-overlay" onclick="event.stopPropagation()">
      <div class="ticket-scan-overlay__scrim"></div>
      <div class="ticket-scan-overlay__header">
        <span>ĐANG QUÉT TÍNH ĐIỂM</span>
        <strong>Ngày ${getCurrentDayIndex() + 1}</strong>
        ${currentStep ? `<em>${currentStep.timeLabel}: ${currentStep.title}</em>` : ""}
      </div>
      <div class="ticket-scan-strip">
        ${stepsHtml}
      </div>
      <div class="ticket-scan-overlay__footer">
        <div><span>Tiến trình</span><strong>${Math.min(replayIndex, totalSteps)} / ${totalSteps}</strong></div>
        <div><span>Điểm ngày</span><strong>${formatSignedVP(partialVP)} VP</strong></div>
        <div><span>Tổng</span><strong>${getAccumulatedVP()} VP</strong></div>
        ${isComplete ? `<div class="ticket-scan-overlay__complete"><span>✓ Hoàn tất</span><em>+${result.finalVP} VP</em></div>` : ""}
      </div>
    </section>
  `;
}
