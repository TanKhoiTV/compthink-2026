import { state } from "../state/gameState.js";
import {
  getConfirmedPickedDraftCards,
  getCurrentDraftPlayer,
  getDraftCenterRenderPool,
  getDraftHandDisplayCards,
  getDraftLeftoverReturnCards,
  getDraftSelectedCard,
  getOnlineSelfDraftPool,
  isDraftPickTimerFrozen,
  isOnlineRoomActive,
  shouldHideDraftPoolSlot,
  shouldShowDraftLeftoverReturn,
  shouldShowDraftPickPool,
  shouldShowDraftWaitBanner,
} from "../game/queries.js";
import {
  getBoardDisplayName,
  getHandCityClass,
  getHandTitleClass,
} from "./cardDisplay.js";
import { renderHandCard } from "./cardRender.js";
import { images } from "../data/images.js";
import type { TravelCardData } from "../types.js";
import {
  DRAFT_CENTER_DEAL_STEP_MS,
  getDraftCenterDealDurationMs,
} from "../game/constants.js";

// ── Data ──────────────────────────────────────────────────────

const DRAFT_PICKED_FAN_LAYOUT: Record<
  number,
  Array<{ rotate: number; ty: number }>
> = {
  1: [{ rotate: 0, ty: -6 }],
  2: [
    { rotate: -16, ty: -4 },
    { rotate: 16, ty: -4 },
  ],
  3: [
    { rotate: -18, ty: -5 },
    { rotate: 0, ty: -10 },
    { rotate: 18, ty: -5 },
  ],
  4: [
    { rotate: -20, ty: -3 },
    { rotate: -8, ty: -8 },
    { rotate: 8, ty: -8 },
    { rotate: 20, ty: -3 },
  ],
  5: [
    { rotate: -18, ty: -2 },
    { rotate: -9, ty: -7 },
    { rotate: 0, ty: -11 },
    { rotate: 9, ty: -7 },
    { rotate: 18, ty: -2 },
  ],
};

// ── Internal helpers ──────────────────────────────────────────

function getDraftCenterDealCardCount(): number {
  if (isOnlineRoomActive()) {
    const pool = state.onlineDraftDisplayPool ??
      state.onlineDraftPendingPool ??
      getOnlineSelfDraftPool() ??
      [];
    return Math.max(1, pool.length);
  }

  const renderPool = getDraftCenterRenderPool();
  if (renderPool.length > 0) return renderPool.length;

  const localPool = getCurrentDraftPlayer()?.pool ?? [];
  return Math.max(1, localPool.length);
}

function getDraftFanSlotLayout(count: number, slotIndex: number) {
  return (
    DRAFT_PICKED_FAN_LAYOUT[count]?.[slotIndex - 1] ?? { rotate: 0, ty: 0 }
  );
}

function computeDraftHandSlotRect(
  count: number,
  slotIndex: number,
): DOMRect | null {
  const cardsEl = document.querySelector(
    ".player-hand__cards--draft",
  ) as HTMLElement | null;
  if (!cardsEl || count < 1 || slotIndex < 1 || slotIndex > count) return null;

  const layout = getDraftFanSlotLayout(count, slotIndex);
  const { cardW, cardH, stepX } = readDraftHandCardMetrics();
  const containerRect = cardsEl.getBoundingClientRect();
  const totalWidth = cardW + (count - 1) * stepX;
  const firstLeft = containerRect.left + (containerRect.width - totalWidth) / 2;
  const slotLeft = firstLeft + (slotIndex - 1) * stepX;
  const slotTop = containerRect.bottom - cardH - 4 + layout.ty;

  return new DOMRect(slotLeft, slotTop, cardW, cardH);
}

function parseDraftHandSlotMeta(
  cardEl: HTMLElement,
): { count: number; slotIndex: number } | null {
  const slotMatch = cardEl.className.match(/hand-card--picked-slot-(\d)/);
  const parent = cardEl.closest(
    "[class*='picked-count-']",
  ) as HTMLElement | null;
  const countMatch = parent?.className.match(/picked-count-(\d)/);

  if (!slotMatch || !countMatch) return null;

  return {
    count: parseInt(countMatch[1], 10),
    slotIndex: parseInt(slotMatch[1], 10),
  };
}

function renderPickedDraftCard(
  card: TravelCardData,
  index: number,
  options?: { isPending?: boolean; hiddenForMeasure?: boolean },
) {
  const pendingClass = options?.isPending ? " hand-card--picked-pending" : "";
  const hiddenClass = options?.hiddenForMeasure
    ? " hand-card--picked-pending-hidden"
    : "";

  return `
    <article
      class="hand-card hand-card--${card.rarity} hand-card--picked-draft hand-card--picked-slot-${
    index + 1
  }${pendingClass}${hiddenClass}"
      data-draft-hand-card-id="${card.id}"
    >
      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${getHandTitleClass(card.name)}">${card.name}</h3>
          <div class="${getHandCityClass(card.city)}">📍 ${card.city}</div>
        </div>

        <div class="hand-card__vp">${card.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${card.image}'), url('${images.food}')">
        <div class="hand-card__icons">
          <span>${card.icon}</span>
          <span>★</span>
        </div>
      </div>

      <div class="hand-card__content">
        <div class="hand-card__meta-row">
          <span class="hand-card__rarity">${card.rarityLabel}</span>
          <span class="hand-card__tag">${card.tagLabel}</span>
        </div>

        <p>${card.description}</p>

        <div class="hand-card__bonus">
          ${card.bonusText}
        </div>
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

// ── Exported render/data functions ────────────────────────────

export function getDraftCenterDealDurationForCurrentPool(): number {
  return getDraftCenterDealDurationMs(getDraftCenterDealCardCount());
}

export function renderDraftHandTopMeta() {
  const activePlayer = getCurrentDraftPlayer();
  const activePool = activePlayer?.pool ?? [];
  const selectedCard = getDraftSelectedCard();

  return `
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${state.draftRound}/5</span>
        <strong>${
    selectedCard ? getBoardDisplayName(selectedCard) : "Bấm 1 lá để chọn"
  }</strong>
        <em>
          ${
    state.isInitialDealInProgress
      ? "Đang phát bài vào tay..."
      : state.isPassingDraftCards
      ? "Đang chuyền bài còn lại vào lượt kế tiếp..."
      : selectedCard
      ? "Đã chọn. Hết giờ mới chuyền bài."
      : activePool.length > 0
      ? "Bấm để chọn, giữ 0.5s để xem lớn."
      : "Đang chuẩn bị bài..."
  }
        </em>
      </div>

      <div class="draft-hand-meta__wait">
        <span>Chờ hết giờ</span>
      </div>
    </div>
  `;
}

export function getDraftHandDisplayCount(): number {
  return getDraftHandDisplayCards().length;
}

export function readDraftHandCardMetrics() {
  const root = document.documentElement;
  const handCardW =
    parseFloat(getComputedStyle(root).getPropertyValue("--hand-card-w")) || 158;
  const handCardH =
    parseFloat(getComputedStyle(root).getPropertyValue("--hand-card-h")) || 218;
  const cardW = handCardW * 0.84;
  const cardH = handCardH * 0.84;
  const stepX = handCardW * 0.46;

  return { handCardW, handCardH, cardW, cardH, stepX };
}

export function getDraftHandFlyTargetForPending(): {
  rect: DOMRect;
  rotate: number;
} | null {
  const count = getDraftHandDisplayCount();
  const slotIndex = count;
  const rect = computeDraftHandSlotRect(count, slotIndex);

  if (!rect) return null;

  return {
    rect,
    rotate: getDraftFanSlotLayout(count, slotIndex).rotate,
  };
}

export function getDraftHandFlySourceFromElement(
  cardEl: HTMLElement,
): { rect: DOMRect; rotate: number } | null {
  const meta = parseDraftHandSlotMeta(cardEl);
  if (!meta) return null;

  const rect = computeDraftHandSlotRect(meta.count, meta.slotIndex);
  if (!rect) return null;

  return {
    rect,
    rotate: getDraftFanSlotLayout(meta.count, meta.slotIndex).rotate,
  };
}

export function getDraftCenterCardWrapper(cardId: string): HTMLElement | null {
  const card = document.querySelector(
    `.draft-center-card[data-draft-card-id="${cardId}"]`,
  );
  return (
    (card?.closest(".draft-center-card-wrapper") as HTMLElement | null) ?? null
  );
}

export function getDraftPendingHandSlotRect(): DOMRect | null {
  const slot = document.querySelector(
    ".hand-card--picked-pending:not(.hand-card--picked-pending-hidden)",
  ) ??
    document.querySelector(".hand-card--picked-pending-hidden") ??
    document.querySelector(".hand-card--picked-pending");
  const rect = slot?.getBoundingClientRect() ?? null;

  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
}

export function getDraftHandFallbackSlotRect(): DOMRect | null {
  const cardsEl = document.querySelector(
    ".player-hand__cards--draft",
  ) as HTMLElement | null;
  if (!cardsEl) return null;

  const handRect = cardsEl.getBoundingClientRect();
  const cardWidth = cardsEl.clientWidth > 0 ? cardsEl.clientWidth * 0.12 : 132;
  const cardHeight = cardWidth * 1.38;

  return new DOMRect(
    handRect.left + handRect.width / 2 - cardWidth / 2,
    handRect.bottom - cardHeight - 8,
    cardWidth,
    cardHeight,
  );
}

export function renderPickedDraftCards(
  options?: { hiddenPendingMeasure?: boolean },
) {
  const confirmedIds = new Set(
    getConfirmedPickedDraftCards().map((card) => card.id),
  );

  return getDraftHandDisplayCards()
    .map((card, index) =>
      renderPickedDraftCard(card, index, {
        isPending: card.id === state.draftHandPendingCardId &&
          !confirmedIds.has(card.id),
        hiddenForMeasure: options?.hiddenPendingMeasure &&
          card.id === state.draftHandPendingCardId,
      })
    )
    .join("");
}

export function getDraftTimerDisplayLabel(): string {
  if (isDraftPickTimerFrozen()) return "Chia bài";
  return `${state.draftPickSecondsLeft}s`;
}

export function isDraftTimerDanger(): boolean {
  return !isDraftPickTimerFrozen() && state.draftPickSecondsLeft <= 3;
}

export function renderDraftCenterOverlay() {
  if (!state.isDraftPhase) return "";
  if (!shouldShowDraftPickPool()) return "";

  const activePool = getDraftCenterRenderPool();

  if (activePool.length === 0) {
    return `
      <div class="draft-center-overlay">
        <p style="color:#fff5d1; font-size:1.2rem;">Đang chuẩn bị bài...</p>
      </div>
    `;
  }

  const topRow = activePool.slice(0, 4);
  const bottomRow = activePool.slice(4);

  const renderRow = (cards: TravelCardData[], startIndex: number) => {
    return cards
      .map((card, idx) => {
        const index = startIndex + idx;
        const globalSlot = startIndex + idx + 1;
        const isFlownToHand = shouldHideDraftPoolSlot(card.id);
        const poolPickDisabled = state.isPassingDraftCards ||
          state.isDraftPoolCollapsed ||
          state.isDraftPoolCollapseAnimating;
        const pickButton = poolPickDisabled ? "" : `
          <button class="draft-center-btn" data-draft-card-id="${card.id}">
            CHỌN
          </button>
        `;

        return `
        <div class="draft-center-card-wrapper draft-center-card-wrapper--slot-${globalSlot} ${
          isFlownToHand ? "draft-center-card-wrapper--flown-to-hand" : ""
        }" style="--draft-deal-delay: ${
          (globalSlot - 1) * DRAFT_CENTER_DEAL_STEP_MS
        }ms">
          <div class="draft-center-card" data-draft-card-id="${card.id}">
            ${renderHandCard(card, index, true)}
          </div>
          ${pickButton}
        </div>
      `;
      })
      .join("");
  };

  const overlayModifierClass = [
    state.isPassingDraftCards && !state.isOnlineFinalDraftReturnAnimating
      ? "draft-center-overlay--passing"
      : "",
    state.isDraftCenterDealing || state.isInitialDealInProgress
      ? "draft-center-overlay--dealing"
      : "",
    state.isDraftPoolCollapsed && !state.isDraftPoolCollapseAnimating
      ? "draft-center-overlay--collapsed"
      : "",
    state.draftPoolCollapseAnimMode === "collapse"
      ? "draft-center-overlay--collapsing"
      : "",
    state.draftPoolCollapseAnimMode === "expand"
      ? "draft-center-overlay--expanding"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="draft-center-overlay ${overlayModifierClass}">
      <div class="draft-center-container">
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${
    renderRow(
      topRow,
      0,
    )
  }</div>
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${
    renderRow(
      bottomRow,
      4,
    )
  }</div>
      </div>
      ${
    shouldShowDraftWaitBanner()
      ? '<div class="draft-center-wait-banner">Đang chờ đối thủ...</div>'
      : ""
  }
    </div>
  `;
}

export function renderDraftLeftoverReturnOverlay(): string {
  if (!shouldShowDraftLeftoverReturn()) return "";

  const cards = getDraftLeftoverReturnCards();

  const cardHtml = cards
    .map((card, index) => {
      const slot = index + 1;
      return `
        <div class="draft-center-card-wrapper draft-center-card-wrapper--return draft-center-card-wrapper--return-${slot}">
          <div class="draft-center-card">
            ${renderHandCard(card, index, true)}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="draft-center-overlay draft-center-overlay--returning">
      <div class="draft-center-container draft-center-container--return">
        ${cardHtml}
      </div>
    </div>
  `;
}
