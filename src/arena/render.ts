/**
 * arena/render.ts — Board grid, hand strip, draft pool, focused card rendering.
 *
 * Extracted from TREKPOLOGY/src/app.ts (lines 1798–2190, 4110–4560).
 */

import {
  getBoardSlots,
  getCurrentDayIndex,
  getIsDraftPhase,
  getPlayerHand,
  getSelectedHandCardId,
  getFocusedHandCardId,
  getFocusedBoardCard,
  getIsSimulationMode,
  getPhaseNumber,
  getAccumulatedVP,
  getRemainingTurnSeconds,
  getPlayerBoards,
  currentPlayerId,
  playerIds,
} from '../state.ts';
import type { TravelCard } from '../../scr/shared/types.ts';
import type { BoardSlots, BoardPosition } from '../../scr/shared/board.ts';

// ── Constants ───────────────────────────────────────────────────────────────

const DAYS = [1, 2, 3, 4, 5];
const ROWS = ['Sáng', 'Trưa', 'Chiều', 'Tối', 'Khuya'];

// ── Main arena ──────────────────────────────────────────────────────────────

export function renderMainArena(): string {
  const boardSlots = getBoardSlots();
  const currentDayIndex = getCurrentDayIndex();
  const isDraft = getIsDraftPhase();
  const isSimulation = getIsSimulationMode();
  const focusedCard = getHandCardById(getFocusedHandCardId()) ?? getFocusedBoardCard();

  return `
    <main class="arena ${isSimulation ? 'arena--scanning' : ''}">
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
            ${DAYS.map((day, index) =>
              `<div class="day-pill ${index === currentDayIndex ? 'day-pill--current' : ''} ${index < currentDayIndex ? 'day-pill--done' : ''}">NGÀY ${day}</div>`
            ).join('')}
          </div>

          <section class="board-grid">
            ${ROWS.map((row, rowIndex) => `
              <div class="time-label">${row}</div>
              ${DAYS.map((_, colIndex) => renderBoardCell(boardSlots, rowIndex, colIndex, currentDayIndex, isDraft, isSimulation)).join('')}
            `).join('')}
          </section>
        </div>

        ${isDraft ? renderDraftPanel() : ''}
      </div>

      ${renderHandStrip()}
      ${focusedCard ? renderFocusedCard(focusedCard) : ''}
      ${renderTurnTimer()}
    </main>
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
  const isPlaceable = !isDraft && !isSimulation && isCurrentDayColumn && getSelectedHandCardId() !== null && card === null;

  if (!card) {
    return `
      <div
        class="board-cell board-cell--empty ${isSimulation ? 'board-cell--locked-mode' : ''} ${!isCurrentDayColumn && !isSimulation ? 'board-cell--not-current-day' : ''} ${isPlaceable ? 'board-cell--placeable' : ''}"
        data-board-cell="true"
        data-row-index="${rowIndex}"
        data-col-index="${colIndex}"
        title="${isCurrentDayColumn ? (isPlaceable ? 'Thả thẻ vào ô ngày hiện tại' : 'Chỉ xếp thẻ cho ngày hiện tại') : 'Không phải ngày hiện tại'}"
      >
        <span class="empty-plus">+</span>
      </div>
    `;
  }

  return `
    <div
      class="board-cell board-cell--occupied board-cell--clickable"
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
  const rarityClass = card.rarity ? `card--rarity-${card.rarity}` : '';
  return `
    <div class="board-mini-card ${rarityClass}">
      <img src="${card.image}" alt="${card.name}" loading="lazy" />
      <div class="board-mini-card__info">
        <span class="board-mini-card__name">${card.name}</span>
        <span class="board-mini-card__tags">${card.tag ? tagLabel(card.tag) : ''}</span>
      </div>
      <div class="board-mini-card__stats">
        <span class="stat stat--vp">${card.vp}</span>
        <span class="stat stat--coin">${card.coin}</span>
        <span class="stat stat--stamina">${card.stamina}</span>
      </div>
    </div>
  `;
}

// ── Hand strip ──────────────────────────────────────────────────────────────

export function renderHandCards(): string {
  const hand = getPlayerHand();
  const selectedId = getSelectedHandCardId();

  if (hand.length === 0) {
    return '<div class="hand-strip hand-strip--empty"><p>Không có thẻ nào</p></div>';
  }

  return `
    <section class="hand-strip">
      ${hand.map((card) => renderHandCard(card, card.id === selectedId)).join('')}
    </section>
  `;
}

export function renderHandCard(card: TravelCard, isSelected: boolean): string {
  const rarityClass = card.rarity ? `card--rarity-${card.rarity}` : '';
  return `
    <div
      class="hand-card ${rarityClass} ${isSelected ? 'hand-card--selected' : ''}"
      data-hand-card-id="${card.id}"
      title="${card.name}"
    >
      <img src="${card.image}" alt="${card.name}" loading="lazy" />
      <div class="hand-card__overlay">
        <span class="hand-card__name">${card.name}</span>
        <span class="hand-card__vp">${card.vp} VP</span>
      </div>
    </div>
  `;
}

// ── Hand strip (full section) ──────────────────────────────────────────────

function renderHandStrip(): string {
  return `
    <div class="hand-strip-container">
      ${renderHandCards()}
    </div>
  `;
}

// ── Draft panel ─────────────────────────────────────────────────────────────

function renderDraftPanel(): string {
  return `
    <div class="draft-panel">
      <h2>Chọn thẻ (Vòng ${getDraftRound()})</h2>
      <div class="draft-cards">
        <!-- Draft cards rendered by draft UI -->
      </div>
    </div>
  `;
}

// ── Draft hand cards ───────────────────────────────────────────────────────

export function renderDraftHandCards(cards: TravelCard[]): string {
  return cards
    .map(
      (card) => `
    <div class="draft-card" data-draft-card-id="${card.id}">
      ${renderBoardMiniCard(card)}
      <button class="draft-card__select">Chọn</button>
    </div>
  `,
    )
    .join('');
}

// ── Focused card popup ──────────────────────────────────────────────────────

export function renderFocusedCard(card: TravelCard): string {
  const rarityClass = card.rarity ? `card--rarity-${card.rarity}` : '';
  return `
    <div class="focused-card-overlay">
      <div class="focused-card ${rarityClass}">
        <button id="focused-card-close" class="focused-card__close">&times;</button>
        <img src="${card.image}" alt="${card.name}" class="focused-card__image" />
        <div class="focused-card__details">
          <h2>${card.name}</h2>
          <p>${card.description ?? ''}</p>
          <div class="focused-card__stats">
            <span>VP: ${card.vp}</span>
            <span>Xu: ${card.coin}</span>
            <span>Stamina: ${card.stamina}</span>
          </div>
          ${card.tags ? `<div class="focused-card__tags">${card.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
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

// ── Turn timer ──────────────────────────────────────────────────────────────

function renderTurnTimer(): string {
  return `
    <div class="turn-timer">
      <span>${getRemainingTurnSeconds()}s</span>
    </div>
  `;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getHandCardById(
  cardId: string | null,
): TravelCard | null {
  if (!cardId) return null;
  const hand = getPlayerHand();
  return hand.find((c) => c.id === cardId) ?? null;
}

function getDraftRound(): number {
  return 1;
}

function tagLabel(tag: string): string {
  const labels: Record<string, string> = {
    FOOD: 'Ẩm thực',
    CULTURE: 'Văn hóa',
    ACTION: 'Hành động',
    UTILITY: 'Tiện ích',
    TRANSIT: 'Di chuyển',
    REST: 'Nghỉ ngơi',
    OUTDOOR: 'Ngoài trời',
    INDOOR: 'Trong nhà',
  };
  return labels[tag] ?? tag;
}
