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
	getDraftRound,
	getSimulationResult,
	getSimulationReplayIndex,
	getIsReplayComplete,
	currentPlayerId,
} from "../state.ts";
import type { TravelCard } from "../../scr/shared/types.ts";
import type { BoardSlots } from "../../scr/shared/board.ts";

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
        ${renderScorePanel()}
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
      </div>

      ${phase !== "simulation" ? renderPlayerHandSection() : ""}
      ${phase === "simulation" ? renderSimulationResultPanel() : ""}
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
		const round = getDraftRound();
		const alreadyPicked = hand.length;

		return `
      <section class="player-hand player-hand--draft">
        <div class="player-hand__top">
          <div class="player-hand__title">
            <span class="hand-badge">DRAFT</span>
            <h2>Chọn thẻ ngày ${DAYS[currentDayIndex]}</h2>
          </div>
          <div class="player-hand__meta">Vòng ${round}/5 · Đã chọn: ${alreadyPicked}/5</div>
        </div>
        <div class="player-hand__cards">
          ${pool
						.map(
							(card, index) => `
            <div class="daily-draft-card daily-draft-card--${index + 1}" data-draft-card-id="${card.id}">
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

	return `
    <article
      class="hand-card ${rarityClass} ${fanClass} ${isSelected ? "hand-card--selected" : ""}"
      data-hand-card-id="${card.id}"
      title="${card.name}"
      data-select-card="true"
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

function renderScorePanel(): string {
	return `
    <div class="score-panel">
      <div class="score-panel__item">
        <span class="score-panel__label">VP</span>
        <span class="score-panel__value">${getAccumulatedVP()}</span>
      </div>
      <div class="score-panel__item">
        <span class="score-panel__label">Ngày</span>
        <span class="score-panel__value">${getCurrentDayIndex() + 1}/5</span>
      </div>
    </div>
  `;
}

// ── Resource orbs ───────────────────────────────────────────────────────────

function renderResourceOrbs(): string {
	return `
    <div class="resource-orbs">
      <div class="orb orb--coin">
        <span class="orb__icon">C</span>
        <span class="orb__value">--</span>
      </div>
      <div class="orb orb--stamina">
        <span class="orb__icon">S</span>
        <span class="orb__value">--</span>
      </div>
      <div class="orb orb--debt">
        <span class="orb__icon">D</span>
        <span class="orb__value">--</span>
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
	return `
    <div class="game-over-overlay">
      <div class="game-over-card">
        <h1>Hoàn thành!</h1>
        <p class="game-over__vp">Tổng VP: ${getAccumulatedVP()}</p>
        <button onclick="location.reload()" class="game-over__replay">Chơi lại</button>
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

	const stepsHtml = result.replaySteps
		.slice(0, Math.max(replayIndex, 1))
		.map((step, i) => {
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
