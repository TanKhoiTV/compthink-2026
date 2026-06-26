import { state } from "../state/gameState.js";
import {
  getBoardCityClass,
  getBoardDisplayCity,
  getBoardDisplayName,
  getBoardTitleClass,
  getFocusedCityClass,
  getFocusedTitleClass,
  getHandCityClass,
  getHandTitleClass,
} from "./cardDisplay.js";
import {
  countCardsWithTag,
  getCardTagKeys,
  getCurrentDayPlacedCards as getCurrentDayPlacedCardsFromSlots,
} from "../game/board.js";
import {
  getBoardSlots,
  getOnlineSelfState,
  getRemainingResources,
} from "../game/queries.js";
import {
  getCardAffordability as getCardAffordabilityFromResources,
  getCardAffordabilityMessage as getCardAffordabilityMessageFromResources,
} from "../game/resources.js";
import type { BoardTokenCard, TravelCardData } from "../types.js";
import type { SimulationReplayStep } from "../game/scoring.js";
import { images } from "../app.js";

// ── Internal helpers ─────────────────────────────────────────

function getCurrentDayPlacedCards(
  dayIndex = state.currentDayIndex,
): TravelCardData[] {
  return getCurrentDayPlacedCardsFromSlots(getBoardSlots(), dayIndex);
}

function getCardAffordability(card: TravelCardData) {
  return getCardAffordabilityFromResources({
    card,
    remaining: getRemainingResources(),
  });
}

function getCardAffordabilityMessage(card: TravelCardData) {
  return getCardAffordabilityMessageFromResources(getCardAffordability(card));
}

function getOnlineSelectedDraftCardId() {
  return getOnlineSelfState()?.selectedDraftCardId ?? null;
}

function getDraftVisualSelectedCardId() {
  return getOnlineSelectedDraftCardId() ?? state.draftSelectedCardId;
}

function isCardBonusActive(card: TravelCardData) {
  const placedCards = getCurrentDayPlacedCards();
  const tagKeys = getCardTagKeys(card);

  if (tagKeys.includes("FOOD") && countCardsWithTag(placedCards, "FOOD") >= 2) {
    return true;
  }

  if (
    tagKeys.includes("CULTURE") &&
    countCardsWithTag(placedCards, "CULTURE") >= 2
  ) {
    return true;
  }

  if (
    tagKeys.includes("ACTION") &&
    countCardsWithTag(placedCards, "ACTION") >= 2
  ) {
    return true;
  }

  return (
    card.onPlayEffect?.has_effect === true &&
    card.onPlayEffect.effect_type === "GAIN_VP"
  );
}

// ── Exported render functions ────────────────────────────────

export function renderBoardMiniCard(
  card: TravelCardData,
  replayStep?: SimulationReplayStep | null,
) {
  const displayName = getBoardDisplayName(card);
  const displayCity = getBoardDisplayCity(card);
  const nameClass = getBoardTitleClass(displayName);
  const cityClass = getBoardCityClass(displayCity);
  const bonusActive = isCardBonusActive(card);
  const token = card as BoardTokenCard;

  if (token.boardTokenType === "debt") {
    return `
      <article
        class="board-mini board-mini--token board-mini--debt"
        title="Bấm để trả ${token.debtAmount ?? 0} xu"
      >
        <div class="board-mini-token__icon">💸</div>
        <strong>Nợ tiền ${token.debtAmount ?? 0} xu</strong>
      </article>
    `;
  }

  if (token.boardTokenType === "lock") {
    return `
      <article
        class="board-mini board-mini--token board-mini--lock"
        title="Ô bị khóa vì kiệt sức"
      >
        <div class="board-mini-token__icon">🔒</div>
        <strong>Bị khóa kiệt sức</strong>
      </article>
    `;
  }

  const eventClass = replayStep?.eventType
    ? `board-mini--event-${replayStep.eventType}`
    : "";
  const eventIcon = replayStep?.eventType === "promo"
    ? "✨"
    : replayStep?.eventType === "traffic"
    ? "🚧"
    : replayStep?.eventType === "storm"
    ? "⛈️"
    : replayStep?.eventType === "distance"
    ? "⚠️"
    : "";
  const eventLabel = replayStep?.eventType === "promo"
    ? `+${replayStep.eventVpDelta ?? 0} VP Event`
    : replayStep?.eventType === "traffic"
    ? `${replayStep.eventStaminaDelta ?? 0} Thể lực`
    : replayStep?.eventType === "storm"
    ? `${replayStep.eventVpDelta ?? 0} VP Event`
    : replayStep?.eventType === "distance"
    ? "Khoảng cách > 20km"
    : "";

  return `
    <article
      class="board-mini board-mini--${card.rarity} ${
    bonusActive ? "board-mini--bonus-active" : ""
  } ${eventClass}"
      title="${card.name} - ${card.city}${
    replayStep?.eventText ? ` • ${replayStep.eventText}` : ""
  }"
    >
      ${
    replayStep?.eventType
      ? `
            <div class="board-mini__event-pill">${eventLabel}</div>
            <div class="board-mini__event-icon">${eventIcon}</div>
            ${
        replayStep.eventType === "distance"
          ? ""
          : replayStep.eventText
          ? `<div class="board-mini__event-note">${replayStep.eventText}</div>`
          : ""
      }
          `
      : ""
  }

      <div
        class="board-mini__image"
        style="background-image: url('${card.image}'), url('${images.food}')"
      ></div>

      <div class="board-mini__tag board-mini__tag--${card.tag}">
        ${card.tagLabel}
      </div>

      <div class="board-mini__info">
        <h3 class="${nameClass}">${displayName}</h3>
        <div class="board-mini__vp">★ ${card.vp}</div>
      </div>
    </article>
  `;
}

export function renderHandCard(
  card: TravelCardData,
  index: number,
  disableFan: boolean = false,
) {
  const isDraftSelected = state.isDraftPhase &&
    !disableFan &&
    card.id === state.draftHandPendingCardId;
  const isPlanningSelected = !state.isDraftPhase &&
    card.id === state.selectedHandCardId;
  const isSelected = isDraftSelected || isPlanningSelected;
  const affordability = getCardAffordability(card);
  const affordabilityMessage = affordability.canAfford
    ? getCardAffordabilityMessage(card)
    : "Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.";
  const unaffordableClass = "";

  return `
    <article
      class="hand-card hand-card--${card.rarity} ${
    disableFan ? "" : `hand-card--fan-${index + 1}`
  } ${isPlanningSelected ? "hand-card--selected" : ""} ${
    isDraftSelected ? "hand-card--draft-selected" : ""
  } ${unaffordableClass}"
      data-hand-card-id="${card.id}"
      style="${
    isSelected
      ? "box-shadow: 0 0 0 4px rgba(255,255,255,.95), 0 0 0 8px rgba(139,92,246,.82), 0 18px 34px rgba(75,47,25,.28);"
      : ""
  }"
      title="${affordabilityMessage}"
      onpointerdown="${
    state.isDraftPhase
      ? ``
      : `event.stopPropagation(); startHandPointerDrag(event, '${card.id}')`
  }"
      onclick="${
    state.isDraftPhase
      ? ``
      : `event.stopPropagation(); window['selectHandCard']('${card.id}')`
  }"
    >
      ${
    isPlanningSelected
      ? `<button
              class="hand-card__close"
              onclick="event.stopPropagation(); clearSelectedHandCard()"
              title="Hủy chọn"
            >×</button>`
      : ""
  }

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

export function renderFocusedCard(card: TravelCardData) {
  const titleClass = getFocusedTitleClass(card.name);
  const cityClass = getFocusedCityClass(card.city);

  return `
    <div class="focused-card-overlay" onclick="closeFocusedHandCard()">
      <div class="focused-card-backdrop-glow"></div>

      <article
        class="focused-card focused-card--${card.rarity}"
        onclick="event.stopPropagation()"
      >
        <button
          class="focused-card__close"
          onclick="event.stopPropagation(); closeFocusedHandCard()"
          title="Đóng"
        >×</button>

        <div class="focused-card__header">
          <div class="focused-card__title-wrap">
            <h2 class="${titleClass}">${card.name}</h2>
            <span class="${cityClass}">📍 ${card.city}</span>
          </div>

          <div class="focused-card__vp">${card.vp}</div>
        </div>

        <div class="focused-card__image" style="background-image: url('${card.image}'), url('${images.food}')">
          <div class="focused-card__icons">
            <span>${card.icon}</span>
            <span>★</span>
          </div>
        </div>

        <div class="focused-card__body">
          <div class="focused-card__tags">
            <span>${card.rarityLabel}</span>
            <span>${card.tagLabel}</span>
          </div>

          <p>${card.description}</p>

          <div class="focused-card__bonus">
            ${card.bonusText}
          </div>
        </div>

        <div class="focused-card__footer">
          <div>
            <span>GOLD</span>
            <strong>${card.coin}</strong>
          </div>

          <div>
            <span>STAMINA</span>
            <strong>${card.stamina}</strong>
          </div>
        </div>

        ${
    state.focusedBoardPosition
      ? `
              <button
                class="focused-card__return-button"
                onclick="event.stopPropagation(); returnFocusedBoardCardToHand()"
                title="Rút lá này từ board về tay"
              >
                ↩ Rút về tay
              </button>
            `
      : ""
  }
      </article>
    </div>
  `;
}

export function renderDailyDraftCard(card: TravelCardData, index: number) {
  const isSelected = card.id === getDraftVisualSelectedCardId();

  return `
    <article
      class="daily-draft-card daily-draft-card--${index + 1} draft-deal-slot ${
    isSelected ? "daily-draft-card--selected" : ""
  }"
      data-draft-card-id="${card.id}"
      title="${card.name} - ${card.city}"
    >
      ${renderHandCard(card, index)}
    </article>
  `;
}
