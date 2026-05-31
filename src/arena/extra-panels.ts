/**
 * extra-panels.ts — Score panels, resource orbs, ranking, debt, effect tokens, deck pile.
 *
 * Extracted from TREKPOLOGY/src/app.ts (lines 3346–4109).
 */
import type { TravelCard } from "../shared/types.ts";

/* ── Score Breakdown Panel ──────────────────────────────────────────────── */

export function renderScoreBreakdownPanel(
  totalScore: number,
  usedSlots: number,
  compactPhaseDayLabel: string,
  breakdown: { baseVp: number; comboVp: number; penaltyVp: number; resourceVp: number; routeKm: number; warnings: string[] },
  isOnlineLobby: boolean,
): string {
  return `
    <section class="score-breakdown score-breakdown--status" title="${compactPhaseDayLabel}">
      <div class="score-breakdown__header score-breakdown__capsule score-breakdown__capsule--score">
        <span>ĐIỂM</span>
        <strong>${totalScore}</strong>
      </div>
      <div class="score-breakdown__details score-breakdown__capsule score-breakdown__capsule--phase">
        <span>PHASE</span>
        <strong>${compactPhaseDayLabel}</strong>
      </div>
      <div class="score-breakdown__item score-breakdown__capsule score-breakdown__capsule--slots">
        <span>SLOT</span>
        <strong>${usedSlots}/5</strong>
      </div>
      ${isOnlineLobby ? `
        <div class="score-breakdown__lobby-actions">
          <button onclick="event.stopPropagation(); window.gotoOnlineEntryScreen()" type="button">Phòng Online</button>
        </div>
      ` : ""}
      <details class="score-breakdown__details-panel">
        <summary>Chi tiết điểm</summary>
        <dl>
          <dt>Base VP</dt><dd>${breakdown.baseVp}</dd>
          <dt>Combo VP</dt><dd>${breakdown.comboVp}</dd>
          <dt>Penalty VP</dt><dd>-${breakdown.penaltyVp}</dd>
          <dt>Resource VP</dt><dd>${breakdown.resourceVp}</dd>
          <dt>Tổng km</dt><dd>${breakdown.routeKm}km</dd>
        </dl>
        ${breakdown.warnings.length > 0 ? `<ul>${breakdown.warnings.map((w) => `<li>⚠️ ${w}</li>`).join("")}</ul>` : ""}
      </details>
    </section>
  `;
}

/* ── Resource Orbs ──────────────────────────────────────────────────────── */

export function renderResourceOrbs(xu: number, stamina: number, debtToken: number, vp: number): string {
  return `
    <section class="resource-orbs">
      <div class="resource-orbs__orb resource-orbs__orb--xu" title="Tiền Việt (Xu)">
        <span>${xu}</span>
      </div>
      <div class="resource-orbs__orb resource-orbs__orb--stamina" title="Thể lực (Stamina)">
        <span>${stamina}</span>
      </div>
      ${debtToken > 0 ? `<div class="resource-orbs__orb resource-orbs__orb--debt" title="Nợ">${debtToken}</div>` : ""}
      <div class="resource-orbs__orb resource-orbs__orb--vp" title="Điểm VP">
        <span>${vp}</span>
      </div>
    </section>
  `;
}

/* ── Final Ranking Panel ────────────────────────────────────────────────── */

export function renderFinalRankingPanel(
  rankings: Array<{ playerId: string; name: string; score: number; isSelf: boolean }>,
): string {
  const sorted = [...rankings].sort((a, b) => b.score - a.score);
  return `
    <section class="final-ranking-screen">
      <div class="final-ranking-card">
        <h1>Xếp hạng cuối cùng</h1>
        <ol class="final-ranking-list">
          ${sorted.map((r, i) => `
            <li class="final-ranking-item ${r.isSelf ? "is-self" : ""}">
              <span class="final-ranking-item__rank">#${i + 1}</span>
              <span class="final-ranking-item__name">${r.name}</span>
              <span class="final-ranking-item__score">${r.score} VP</span>
            </li>
          `).join("")}
        </ol>
        <button onclick="event.stopPropagation(); window.gotoDashboard()" type="button">Quay lại trang chủ</button>
      </div>
    </section>
  `;
}

/* ── Travel Timeline Export Panel ───────────────────────────────────────── */

export function renderTravelTimelineExportPanel(
  entries: Array<{ day: number; slot: string; title: string; lat: number; lng: number; cost: number; note: string }>,
  extraClass = "",
): string {
  return `
    <section class="travel-export-panel ${extraClass}">
      <h2>Travel Timeline</h2>
      <div class="travel-export-panel__content">
        ${entries.map((entry) => `
          <div class="travel-export-entry">
            <span class="travel-export-entry__day">Day ${entry.day} / ${entry.slot}</span>
            <strong>${entry.title}</strong>
            <span>${entry.lat.toFixed(4)}, ${entry.lng.toFixed(4)}</span>
            <span>${entry.cost.toLocaleString()}₫</span>
            <p>${entry.note}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

/* ── Simulation Result Panel ────────────────────────────────────────────── */

export function renderSimulationResultPanel(
  results: Array<{ dayLabel: string; totalVp: number; breakdown: { baseVp: number; comboVp: number; penaltyVp: number } }>,
): string {
  return `
    <section class="simulation-result-panel">
      <h2>Kết quả mô phỏng</h2>
      <div class="simulation-result-panel__list">
        ${results.map((r) => `
          <div class="simulation-result-item">
            <strong>${r.dayLabel}</strong>
            <span>${r.totalVp} VP</span>
            <details>
              <summary>Chi tiết</summary>
              <dl>
                <dt>Base</dt><dd>${r.breakdown.baseVp}</dd>
                <dt>Combo</dt><dd>${r.breakdown.comboVp}</dd>
                <dt>Penalty</dt><dd>-${r.breakdown.penaltyVp}</dd>
              </dl>
            </details>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

/* ── Debt Seal Glyph (SVG) ──────────────────────────────────────────────── */

export function renderDebtSealGlyph(): string {
  return `
    <svg class="player-effect-seal__icon-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path class="player-effect-seal__icon-solid" d="M30.8 10.2c.8-1.5 2.9-1.5 3.7 0l2.2 4.1c.3.5.8.9 1.4 1l4.8 1c1.8.4 2.3 2.6.9 3.7l-3.3 2.7c-.5.4-.8 1-.8 1.6l.1 1.8c4.4 1.8 7.5 5.9 7.5 10.7c0 6.4-5.1 11.5-11.5 11.5h-7.6c-6.8 0-12.4-5.5-12.4-12.3c0-4.8 2.8-8.9 6.9-10.8l.1-.9c.1-.7-.2-1.3-.7-1.8l-3-2.5c-1.4-1.2-.8-3.4 1-3.8l4.4-.9c.6-.1 1.1-.5 1.4-1l2.3-4.1Z"/>
      <path class="player-effect-seal__icon-cut" d="M34.8 29.6l-3.2 5l3.5 3.2l-2.5 4.6l4.1 3.6"/>
      <text class="player-effect-seal__icon-mark" x="31.9" y="38.6" text-anchor="middle">$</text>
    </svg>
  `;
}

/* ── Debt Token Modal ──────────────────────────────────────────────────── */

export function renderDebtTokenModal(
  isVisible: boolean,
  debtAmount: number,
  remainingCoin: number,
  notice: string,
): string {
  if (!isVisible || debtAmount <= 0) return "";

  const totalPenalty = debtAmount * 10;
  const canPay = remainingCoin >= 1;
  const paidOff = notice.includes("Đã trả hết");

  return `
    <div
      class="debt-modal-backdrop"
      onclick="event.stopPropagation(); window.closeDebtTokenModal()"
    >
      <section
        class="debt-modal"
        onclick="event.stopPropagation()"
      >
        <button
          type="button"
          class="debt-modal__close"
          onclick="event.stopPropagation(); window.closeDebtTokenModal()"
          aria-label="Đóng"
          title="Đóng"
        >
          ✕
        </button>

        <div class="debt-modal__header">
          <div class="debt-modal__seal-preview">
            <span class="player-effect-seal player-effect-seal--debt player-effect-seal--preview">
              <span class="player-effect-seal__surface">
                <span class="player-effect-seal__ring"></span>
                <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${renderDebtSealGlyph()}</span>
              </span>
              <span class="player-effect-seal__count">${debtAmount}</span>
            </span>
          </div>

          <div class="debt-modal__title-wrap">
            <span class="debt-modal__eyebrow">TOKEN NỢ</span>
            <h3>Nợ ${debtAmount} xu</h3>
            <p>Cuối game nếu chưa trả: <strong>-${totalPenalty} VP</strong></p>
          </div>
        </div>

        <div class="debt-modal__body">
          <div class="debt-modal__info">
            <div>
              <span>Hiện đang nợ</span>
              <strong>${debtAmount} xu</strong>
            </div>
            <div>
              <span>Xu hiện có</span>
              <strong>${remainingCoin} xu</strong>
            </div>
          </div>

          ${
            notice
              ? `<p class="debt-modal__notice">${notice}</p>`
              : ""
          }

          <div class="debt-modal__actions">
            ${
              !paidOff && canPay
                ? `<button type="button" class="debt-modal__pay-btn" onclick="event.stopPropagation(); window.payCurrentCoinDebt()">
                    Trả bớt nợ
                  </button>`
                : ""
            }
            <button type="button" class="debt-modal__close-btn" onclick="event.stopPropagation(); window.closeDebtTokenModal()">
              ${paidOff ? "Đóng" : canPay ? "Để sau" : "OK"}
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}

/* ── Player Effect Tokens ───────────────────────────────────────────────── */

export function renderPlayerEffectTokens(
  effects: Array<{ type: string; value: number; label: string }>,
): string {
  if (effects.length === 0) return "";
  return `
    <section class="player-effect-tokens">
      ${effects.map((e) => `
        <div class="player-effect-token player-effect-token--${e.type.toLowerCase()}">
          <span>${e.label}</span>
          <strong>${e.value > 0 ? "+" : ""}${e.value}</strong>
        </div>
      `).join("")}
    </section>
  `;
}

/* ── Deck Pile Panel ───────────────────────────────────────────────────── */

export function renderDeckPilePanel(remainingCount: number, totalCount: number): string {
  return `
    <section class="deck-pile-panel">
      <div class="deck-pile-panel__pile">
        <span>Bài còn lại</span>
        <strong>${remainingCount}/${totalCount}</strong>
      </div>
    </section>
  `;
}
