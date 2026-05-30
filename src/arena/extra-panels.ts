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

/* ── Debt Token Modal ──────────────────────────────────────────────────── */

export function renderDebtTokenModal(): string {
  return `
    <dialog id="debt-token-modal" class="debt-modal">
      <form method="dialog" class="debt-modal__content">
        <h2>Bạn đang nợ!</h2>
        <p>Bạn đã tiêu quá số xu cho phép. Mỗi debt token sẽ bị trừ 3 VP vào cuối game.</p>
        <menu>
          <button value="cancel" id="debt-modal-close">Đóng</button>
        </menu>
      </form>
    </dialog>
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
