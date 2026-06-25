import { state } from "../state/gameState.js";
import { onlineClientState } from "../online/socketClient.js";
import { days } from "../game/constants.js";
import {
  getCurrentDayPlacedCards,
  getCurrentScoreBreakdown,
  getMidGameRankings,
  getOnlineFinalRankings,
  getOnlineSelfHand,
  getOnlineSelfPublicPlayer,
  getOnlineSelfScore,
  getPlanningConfirmStatusLabel,
  getRemainingResources,
  isDraftDealVisualActive,
  isDraftPoolToggleBlocked,
  isOnlinePlanningPhase,
  isOnlineRoomActive,
  isSelfPlanningConfirmed,
  shouldShowDraftPickPool,
} from "../game/queries.js";
import type { SimulationReplayStep } from "../game/scoring.js";
import { formatSignedVP, formatTurnTimer } from "./cardDisplay.js";
import { GAME_HELP_STEPS, renderHelpBubble } from "./HelpBubble.js";

function getCurrentDayLabel() {
  return `Ngày ${days[state.currentDayIndex]}`;
}

function getCurrentPhaseLabel() {
  return `Phase ${state.phaseNumber}`;
}

function isOnlineGameOver() {
  return onlineClientState.roomState?.phase === "gameover";
}

function getCompactPhaseDayLabel() {
  return `${getCurrentPhaseLabel()} • ${getCurrentDayLabel()}`.toUpperCase();
}

function getCurrentReplayStep() {
  if (
    !state.simulationResult ||
    state.simulationResult.replaySteps.length === 0
  ) {
    return null;
  }

  return state.simulationResult.replaySteps[
    Math.min(
      state.simulationReplayIndex,
      state.simulationResult.replaySteps.length - 1,
    )
  ];
}

function getReplayDayEndIndex(dayIndex: number) {
  if (!state.simulationResult) return -1;

  let endIndex = -1;

  for (
    let index = 0;
    index < state.simulationResult.replaySteps.length;
    index += 1
  ) {
    if (state.simulationResult.replaySteps[index].dayIndex === dayIndex) {
      endIndex = index;
    }
  }

  return endIndex;
}

function shouldShowReplayDay(dayIndex: number) {
  if (!state.simulationResult) return true;

  const currentStep = getCurrentReplayStep();
  const activeDayIndex = currentStep?.dayIndex ?? 0;
  const dayEndIndex = getReplayDayEndIndex(dayIndex);

  if (dayIndex >= activeDayIndex) return true;
  if (dayEndIndex < 0) return true;

  /*
    Mỗi replay step đang chạy khoảng 850ms.
    Chờ khoảng 3 giây sau khi ngày đã quét xong rồi mới ẩn.
  */
  const stepsAfterDayEnded = state.simulationReplayIndex - dayEndIndex;
  return stepsAfterDayEnded <= 4;
}

function getReplayDayExitStage(dayIndex: number) {
  if (!state.simulationResult) return 0;

  const currentStep = getCurrentReplayStep();
  const activeDayIndex = currentStep?.dayIndex ?? 0;
  const dayEndIndex = getReplayDayEndIndex(dayIndex);

  if (dayIndex >= activeDayIndex) return 0;
  if (dayEndIndex < 0) return 0;

  const stepsAfterDayEnded = state.simulationReplayIndex - dayEndIndex;

  if (stepsAfterDayEnded <= 0) return 0;
  if (stepsAfterDayEnded <= 4) return stepsAfterDayEnded;

  return 5;
}

function getReplayDayRailClass(dayIndex: number, activeDayIndex: number) {
  const exitStage = getReplayDayExitStage(dayIndex);

  return [
    dayIndex === activeDayIndex ? "is-active" : "",
    dayIndex < activeDayIndex ? "is-done" : "",
    exitStage > 0 && exitStage <= 4 ? `is-exiting-${exitStage}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderTravelTimelineExportPanel(extraClass = "") {
  return `
    <div class="flow-export travel-export-panel ${extraClass}">
      <span>Xuất lịch trình</span>
      <p>Xuất board hiện tại thành lịch trình du lịch để lưu hoặc chia sẻ.</p>
      <div class="flow-export__actions">
        <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        <button onclick="event.stopPropagation(); copyTravelTimeline()">Copy text</button>
      </div>
    </div>
  `;
}

function getCurrentReplayPartialVP() {
  if (!state.simulationResult) return 0;

  return state.simulationResult.replaySteps
    .slice(0, state.simulationReplayIndex + 1)
    .reduce((sum, step) => sum + step.vpDelta, 0);
}

function getPhaseScoreBeforeCurrentSimulation() {
  if (!state.simulationResult) return state.accumulatedVP;

  /*
    Khi applyDailyScoreOnce đã chạy, state.accumulatedVP đã là điểm sau ngày hiện tại.
    Muốn preview không cộng/trừ 2 lần thì phải lùi lại finalVP.
  */
  return state.hasAppliedSimulationScore
    ? state.accumulatedVP - state.simulationResult.finalVP
    : state.accumulatedVP;
}

function getPhaseScorePreview() {
  if (!state.simulationResult) return state.accumulatedVP;

  const baseScore = getPhaseScoreBeforeCurrentSimulation();
  const currentDayDelta = state.isReplayComplete
    ? state.simulationResult.finalVP
    : getCurrentReplayPartialVP();

  return baseScore + currentDayDelta;
}

function getStablePhaseScoreDisplay() {
  if (!state.simulationResult) return state.accumulatedVP;

  /*
    Tránh hiện tượng điểm tổng nhảy trong lúc đang scan:
    - Điểm ngày có thể lên/xuống theo từng ô.
    - Tổng phase chỉ đổi sau khi replay kết thúc và applyDailyScoreOnce chạy.
  */
  return state.isReplayComplete
    ? state.accumulatedVP
    : getPhaseScoreBeforeCurrentSimulation();
}

function getCurrentCoinDebtAmount() {
  if (isOnlineRoomActive()) {
    const onlineSelf = getOnlineSelfPublicPlayer();

    return Math.max(0, onlineSelf?.coinDebt ?? 0);
  }

  return Math.max(0, state.localCoinDebt);
}

function renderDebtSealGlyph() {
  return `
    <svg class="player-effect-seal__icon-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path class="player-effect-seal__icon-solid" d="M30.8 10.2c.8-1.5 2.9-1.5 3.7 0l2.2 4.1c.3.5.8.9 1.4 1l4.8 1c1.8.4 2.3 2.6.9 3.7l-3.3 2.7c-.5.4-.8 1-.8 1.6l.1 1.8c4.4 1.8 7.5 5.9 7.5 10.7c0 6.4-5.1 11.5-11.5 11.5h-7.6c-6.8 0-12.4-5.5-12.4-12.3c0-4.8 2.8-8.9 6.9-10.8l.1-.9c.1-.7-.2-1.3-.7-1.8l-3-2.5c-1.4-1.2-.8-3.4 1-3.8l4.4-.9c.6-.1 1.1-.5 1.4-1l2.3-4.1Z"/>
      <path class="player-effect-seal__icon-cut" d="M34.8 29.6l-3.2 5l3.5 3.2l-2.5 4.6l4.1 3.6"/>
      <text class="player-effect-seal__icon-mark" x="31.9" y="38.6" text-anchor="middle">$</text>
    </svg>
  `;
}

// ── Group B render functions ──

function renderResourceOrbs() {
  if (state.isSimulationMode || state.simulationResult || isOnlineGameOver()) {
    return "";
  }

  const remaining = getRemainingResources();

  return `
    <div class="resource-orbs" aria-label="Tài nguyên hiện tại">
      <div class="resource-orb resource-orb--coin ${
    state.resourceOrbFlashType === "coin" ? "resource-orb--effect-pulse" : ""
  }" title="Xu hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--coin">💰</div>
          <div class="resource-orb__value">${remaining.coin}</div>
        </div>
        <div class="resource-orb__label">TIỀN</div>
      </div>

      <div class="resource-orb-cluster resource-orb-cluster--stamina">
        ${
    renderHelpBubble({
      id: "gameplay-help",
      title: "Cách chơi",
      bubbleLabel: "Cách chơi",
      steps: GAME_HELP_STEPS,
      placement: "game",
    })
  }
        <div class="resource-orb resource-orb--stamina ${
    state.resourceOrbFlashType === "stamina" ? "resource-orb--effect-pulse" : ""
  }" title="Thể lực hiện có">
          <div class="resource-orb__frame">
            <div class="resource-orb__icon resource-orb__icon--stamina">🏃</div>
            <div class="resource-orb__value">${remaining.stamina}</div>
          </div>
          <div class="resource-orb__label">THỂ LỰC</div>
        </div>
      </div>
    </div>
  `;
}

function renderScoreBreakdownPanel(options?: {
  draftTimerDanger?: boolean;
  draftTimerDisplayLabel?: string;
}) {
  const { draftTimerDanger = false, draftTimerDisplayLabel = "" } = options ??
    {};
  const breakdown = getCurrentScoreBreakdown();
  const isOnlineLobby = onlineClientState.roomState?.phase === "lobby" ||
    onlineClientState.roomState?.phase === "cinematic";
  const onlineSelfScore = getOnlineSelfScore();
  const totalScoreToDisplay = onlineSelfScore ??
    (state.simulationResult
      ? getStablePhaseScoreDisplay()
      : state.accumulatedVP);
  const compactPhaseDayLabel = getCompactPhaseDayLabel();

  return `
    <section class="score-breakdown score-breakdown--status" title="${compactPhaseDayLabel}">
      <div class="score-breakdown__header score-breakdown__capsule score-breakdown__capsule--score">
        <span>ĐIỂM</span>
        <strong>${totalScoreToDisplay}</strong>
      </div>

      <div class="score-breakdown__details score-breakdown__capsule score-breakdown__capsule--phase">
        <span>PHASE</span>
        <strong>${compactPhaseDayLabel}</strong>
      </div>

      <div class="score-breakdown__item score-breakdown__capsule score-breakdown__capsule--slots">
        <span>SLOT</span>
        <strong>${breakdown.usedSlots}/5</strong>
      </div>

      ${
    isOnlineLobby
      ? `
            <div class="score-breakdown__lobby-actions">
              <button
                class="online-start-button"
                onclick="event.stopPropagation(); startOnlineGame()"
                title="Bắt đầu trò chơi cho toàn bộ người chơi trong phòng."
              >
                ▶ Bắt đầu trò chơi
              </button>
            </div>
          `
      : ""
  }

      ${
    state.simulationResult
      ? `
            <button
              class="score-breakdown__timer score-breakdown__timer--reset"
              onclick="event.stopPropagation(); resetSimulation()"
              title="Prototype: mở khóa để test lại lượt"
            >
              ↺ Test lại
            </button>
          `
      : state.isDraftPhase
      ? `
              <div
                class="score-breakdown__timer ${
        draftTimerDanger ? "score-breakdown__timer--danger" : ""
      }"
                title="Thời gian chọn bài trong phase chia bài."
              >
                <span>DRAFT</span>
                <strong>${draftTimerDisplayLabel}</strong>
              </div>
            `
      : `
              <div
                class="score-breakdown__timer ${
        state.remainingTurnSeconds <= 10 ? "score-breakdown__timer--danger" : ""
      }"
                title="Đồng hồ đếm ngược. Hết giờ hệ thống tự mô phỏng."
              >
                <span>TIME</span>
                <strong>${formatTurnTimer(state.remainingTurnSeconds)}</strong>
              </div>
            `
  }
    </section>
  `;
}

function renderFinalRankingPanel() {
  if (!isOnlineGameOver()) return "";

  const rankings = getOnlineFinalRankings();
  const selfPlayerId = onlineClientState.playerId;

  return `
    <section class="final-ranking-panel">
      <div class="final-ranking-panel__header">
        <span>KẾT THÚC PHASE</span>
        <h2>Bảng xếp hạng cuối cùng</h2>
        <p>Hết 5 ngày. BXH sẽ tự đóng sau ${
    onlineClientState.roomState?.timer ?? 10
  }s để qua Phase ${state.phaseNumber + 1}.</p>
      </div>

      <div class="final-ranking-panel__list">
        ${
    rankings
      .map((player, index) => {
        const isSelf = player.playerId === selfPlayerId;

        return `
              <div class="final-ranking-row ${
          isSelf ? "final-ranking-row--self" : ""
        }">
                <div class="final-ranking-row__rank">#${index + 1}</div>

                <div class="final-ranking-row__name">
                  <strong>${player.name}</strong>
                  <span>${player.playerId}${
          player.isConnected ? "" : " • offline"
        }</span>
                </div>

                <div class="final-ranking-row__score">${player.score} VP</div>

                <div class="final-ranking-row__meta">
                  <span>🪙 ${player.coin}</span>
                  <span>⚡ ${player.stamina}</span>
                  <span>${player.usedSlots}/25</span>
                </div>
              </div>
            `;
      })
      .join("")
  }
      </div>

      ${renderTravelTimelineExportPanel("travel-export-panel--final")}

      <div class="final-ranking-panel__footer">
        ${
    state.phaseNumber >= 3
      ? "Đã kết thúc Phase 3. Đây là kết quả cuối của game."
      : `Đang chuẩn bị chuyển sang Phase ${state.phaseNumber + 1}...`
  }
      </div>
    </section>
  `;
}

function renderSimulationResultPanel() {
  if (!state.simulationResult) return "";

  const result = state.simulationResult;
  const currentStep = getCurrentReplayStep();
  const totalSteps = Math.max(1, result.replaySteps.length);
  const currentStepNumber = Math.min(
    state.simulationReplayIndex + 1,
    totalSteps,
  );
  const currentDayDelta = state.isReplayComplete
    ? result.finalVP
    : getCurrentReplayPartialVP();
  const ticketStepWidth = 366;
  const firstTicketCenter = 223;
  const endCenterBoost = state.simulationReplayIndex === totalSteps - 1
    ? 460
    : state.simulationReplayIndex === totalSteps - 2
    ? 180
    : 0;
  const trackOffset = firstTicketCenter +
    state.simulationReplayIndex * ticketStepWidth +
    endCenterBoost;

  const getEventIcon = (eventType?: string | null) => {
    if (eventType === "storm") return "⛈";
    if (eventType === "traffic") return "🚦";
    if (eventType === "distance") return "🧭";
    if (eventType === "promo") return "🏷";
    return "✦";
  };

  const getEventTitle = (step: SimulationReplayStep) => {
    if (step.eventText) return step.eventText;
    if (step.eventType === "storm") return "Mưa giông";
    if (step.eventType === "traffic") return "Kẹt xe";
    if (step.eventType === "distance") return "Xa tuyến";
    if (step.eventType === "promo") return "Ưu đãi";
    return "";
  };

  return `
    <section class="ticket-scan-overlay" onclick="event.stopPropagation()">
      <div class="ticket-scan-overlay__scrim"></div>

      <div class="ticket-scan-overlay__header">
        <span>ĐANG QUÉT TÍNH ĐIỂM</span>
        <strong>${getCurrentPhaseLabel()} • ${getCurrentDayLabel()}</strong>
        <em>${
    currentStep ? `Đang tính: ${currentStep.timeLabel}` : "Đang chuẩn bị..."
  }</em>
      </div>

      <div class="ticket-scan-strip">
        <div class="ticket-scan-strip__backdrop"></div>

        <div
          class="ticket-scan-track"
          style="transform: translateX(calc(50% - ${trackOffset}px)); --scan-index: ${state.simulationReplayIndex};"
        >
          ${
    result.replaySteps
      .map((step, stepIndex) => {
        const isLastTicket = stepIndex === totalSteps - 1;
        const shouldTearImmediately = !state.isReplayComplete &&
          isLastTicket &&
          stepIndex === state.simulationReplayIndex;
        const isActive = !state.isReplayComplete &&
          stepIndex === state.simulationReplayIndex &&
          !shouldTearImmediately;
        const isDone = state.isReplayComplete ||
          stepIndex < state.simulationReplayIndex ||
          shouldTearImmediately;
        const isFuture = !state.isReplayComplete &&
          stepIndex > state.simulationReplayIndex;
        const eventTitle = getEventTitle(step);
        const hasEvent = Boolean(step.eventType || step.eventText);

        return `
                <article
                  class="score-ticket ${isActive ? "is-active" : ""} ${
          isDone ? "is-torn" : ""
        } ${isFuture ? "is-future" : ""} ${step.isEmpty ? "is-empty" : ""} ${
          hasEvent ? "has-event" : ""
        } ${step.eventType ? `score-ticket--event-${step.eventType}` : ""}"
                >
                  <div class="score-ticket__perforation score-ticket__perforation--left"></div>
                  <div class="score-ticket__perforation score-ticket__perforation--right"></div>

                  <div class="score-ticket__head">
                    <span>${step.timeLabel}</span>
                    <strong>${
          step.vpDelta >= 0 ? "+" : ""
        }${step.vpDelta} VP</strong>
                  </div>

                  <div class="score-ticket__body">
                    <h4>${step.title}</h4>
                    <p>${step.subtitle}</p>
                  </div>

                  <div class="score-ticket__stats">
                    <span class="${
          step.coinDelta > 0 ? "is-cost" : ""
        }">Xu ${step.coinDelta}</span>
                    <span class="${
          step.staminaDelta > 0 ? "is-cost" : ""
        }">Lực ${step.staminaDelta}</span>
                  </div>

                  ${
          step.comboText ? `<div class="score-ticket__combo">COMBO</div>` : ""
        }

                  ${
          hasEvent
            ? `
                        <div class="score-ticket__stamp">
                          <b>${getEventIcon(step.eventType)}</b>
                          <span>${eventTitle}</span>
                        </div>
                      `
            : ""
        }

                  <div class="score-ticket__tear-mark"></div>
                </article>

                ${
          stepIndex < result.replaySteps.length - 1
            ? `<div class="score-ticket-connector ${
              stepIndex < state.simulationReplayIndex ? "is-passed" : ""
            }"></div>`
            : ""
        }
              `;
      })
      .join("")
  }
        </div>
      </div>

      <div class="ticket-scan-overlay__footer">
        <div>
          <span>Tiến trình</span>
          <strong>${currentStepNumber}/${totalSteps}</strong>
        </div>

        <div>
          <span>Điểm ngày</span>
          <strong>${formatSignedVP(currentDayDelta)}</strong>
        </div>

        <div>
          <span>Tổng phase</span>
          <strong>${getStablePhaseScoreDisplay()} VP</strong>
        </div>

        ${
    state.isReplayComplete
      ? `
              <div class="ticket-scan-overlay__complete">
                <span>Hoàn tất</span>
                <strong>${getPhaseScoreBeforeCurrentSimulation()} → ${getPhaseScorePreview()} VP</strong>
              </div>
            `
      : ""
  }
      </div>
    </section>
  `;
}

function renderPlayerEffectTokens() {
  const effectTokens: string[] = [];
  const coinDebt = getCurrentCoinDebtAmount();

  if (coinDebt > 0) {
    effectTokens.push(`
      <button
        type="button"
        class="player-effect-seal player-effect-seal--debt"
        onclick="event.stopPropagation(); window.openDebtTokenModal()"
        aria-label="Token nợ: ${coinDebt} xu"
      >
        <span class="player-effect-seal__surface">
          <span class="player-effect-seal__ring"></span>

          <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${renderDebtSealGlyph()}</span>
        </span>

        <span class="player-effect-seal__count">${coinDebt}</span>
        <span class="player-effect-seal__hover-label">TOKEN NỢ</span>
      </button>
    `);
  }

  if (!effectTokens.length) {
    return "";
  }

  return `
    <div class="player-effect-dock">
      ${effectTokens.join("")}
    </div>
  `;
}

function renderMidGameRankingModal() {
  if (!state.isMidGameRankingOpen || !isOnlineRoomActive()) {
    return "";
  }

  const rankings = getMidGameRankings();
  const selfPlayerId = onlineClientState.playerId;
  const phaseDayLabel = getCompactPhaseDayLabel();

  return `
    <div class="mid-ranking-backdrop" onclick="event.stopPropagation(); closeMidGameRanking()">
      <section class="mid-ranking-modal" onclick="event.stopPropagation()">
        <div class="mid-ranking-modal__header">
          <div>
            <span>BẢNG XẾP HẠNG GIỮA TRẬN</span>
            <h2>${phaseDayLabel}</h2>
            <p>Cập nhật sau mỗi ngày khi server cộng điểm simulation xong.</p>
          </div>

          <button
            class="mid-ranking-modal__close"
            onclick="event.stopPropagation(); closeMidGameRanking()"
            title="Đóng bảng xếp hạng"
          >
            ✕
          </button>
        </div>

        <div class="mid-ranking-modal__list">
          ${
    rankings.length > 0
      ? rankings
        .map((player, index) => {
          const isSelf = player.playerId === selfPlayerId;

          return `
                      <div class="mid-ranking-row ${
            isSelf ? "mid-ranking-row--self" : ""
          }">
                        <div class="mid-ranking-row__rank">#${index + 1}</div>

                        <div class="mid-ranking-row__player">
                          <strong>${player.name}</strong>
                          <span>${player.playerId}${
            player.isConnected ? "" : " • offline"
          }</span>
                        </div>

                        <div class="mid-ranking-row__score">${player.score} VP</div>

                        <div class="mid-ranking-row__meta">
                          <span>🪙 ${player.coin}</span>
                          <span>⚡ ${player.stamina}</span>
                          <span>${player.usedSlots}/25</span>
                        </div>
                      </div>
                    `;
        })
        .join("")
      : `<div class="mid-ranking-empty">Chưa có người chơi trong phòng.</div>`
  }
        </div>

        <div class="mid-ranking-modal__footer">
          Điểm chỉ thay đổi sau khi kết thúc quét điểm từng ngày.
        </div>
      </section>
    </div>
  `;
}

export {
  getCompactPhaseDayLabel,
  getCurrentCoinDebtAmount,
  getCurrentDayLabel,
  getCurrentPhaseLabel,
  getCurrentReplayPartialVP,
  getCurrentReplayStep,
  getPhaseScoreBeforeCurrentSimulation,
  getPhaseScorePreview,
  getReplayDayEndIndex,
  getReplayDayExitStage,
  getReplayDayRailClass,
  getStablePhaseScoreDisplay,
  isOnlineGameOver,
  renderDebtSealGlyph,
  renderDeckPilePanel,
  renderDraftPoolCollapseButton,
  renderFinalRankingPanel,
  renderMidGameRankingModal,
  renderPlayerEffectTokens,
  renderResourceOrbs,
  renderScoreBreakdownPanel,
  renderSimulationResultPanel,
  renderTravelTimelineExportPanel,
  shouldShowReplayDay,
};

// ── Draft pool toggle button ──

function renderDraftPoolCollapseButton(): string {
  if (!state.isDraftPhase || !shouldShowDraftPickPool()) return "";
  if (state.isPassingDraftCards || state.isOnlineFinalDraftReturnAnimating) {
    return "";
  }

  const label = state.isDraftPoolCollapsed ? "Mở pool" : "Thu gọn";
  const disabled = isDraftPoolToggleBlocked();

  return `
    <button
      type="button"
      class="state.deck-pile-panel__pool-toggle"
      onclick="event.stopPropagation(); toggleDraftPoolCollapse()"
      ${disabled ? "disabled" : ""}
      title="${
    state.isDraftPoolCollapsed
      ? "Hiện lại pool chọn bài"
      : "Thu gọn pool để xem bàn cờ"
  }"
    >
      ${label}
    </button>
  `;
}

// ── Deck pile panel ──

function renderDeckPilePanel() {
  const handCount =
    (isOnlineRoomActive() ? getOnlineSelfHand() : null)?.length ??
      state.playerHand.length;
  const canConfirm =
    !!(state.draftHandPendingCardId || state.draftSelectedCardId) &&
    !state.isDraftPickFlying &&
    !state.isPassingDraftCards &&
    !isDraftDealVisualActive() &&
    !state.isDraftPoolCollapseAnimating;
  const isOnlinePlanning = isOnlinePlanningPhase();
  const selfPlanningConfirmed = isSelfPlanningConfirmed();
  const serverPhase = onlineClientState.roomState?.phase;
  const showDraftConfirm = state.isDraftPhase && serverPhase === "draft";
  const showPlanningConfirm = isOnlinePlanning && serverPhase === "planning";
  const planningStatusLabel = showPlanningConfirm
    ? getPlanningConfirmStatusLabel()
    : "";
  const planningConfirmButton = showPlanningConfirm
    ? `
      <div class="state.deck-pile-panel__planning-actions">
        <button
          type="button"
          class="state.deck-pile-panel__planning-confirm"
          onclick="event.stopPropagation(); confirmPlanningPick()"
          ${selfPlanningConfirmed ? "disabled" : ""}
        >
          ${selfPlanningConfirmed ? "Đã xác nhận" : "Xác nhận"}
        </button>
        ${
      planningStatusLabel
        ? `<div class="state.deck-pile-panel__planning-status">${planningStatusLabel}</div>`
        : ""
    }
      </div>
    `
    : "";
  const draftConfirmButton = showDraftConfirm
    ? `
      <button
        type="button"
        class="state.deck-pile-panel__draft-confirm"
        onclick="event.stopPropagation(); confirmDraftPick()"
        ${canConfirm ? "" : "disabled"}
      >
        Kết thúc lượt
      </button>
    `
    : "";
  const phaseConfirmButton = draftConfirmButton || planningConfirmButton;

  const effectTokensHtml = renderPlayerEffectTokens();
  const poolToggleButton = renderDraftPoolCollapseButton();
  const showDeckHeader = showDraftConfirm || showPlanningConfirm ||
    effectTokensHtml.length > 0;
  const deckPanelHeader = showDeckHeader
    ? `
      <div class="state.deck-pile-panel__header">
        <div class="state.deck-pile-panel__header-left">${poolToggleButton}${effectTokensHtml}</div>
        <div class="state.deck-pile-panel__header-right">${phaseConfirmButton}</div>
      </div>
    `
    : "";

  return `
    <section
      class="state.deck-pile-panel${
    state.isDraftPhase ? " state.deck-pile-panel--draft" : ""
  }"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      ${deckPanelHeader}

      <div class="state.deck-pile-panel__visual">
        <div class="state.deck-card-stack">
          <div class="state.deck-card-stack__card state.deck-card-stack__card--layer-3"></div>
          <div class="state.deck-card-stack__card state.deck-card-stack__card--layer-2"></div>
          <div class="state.deck-card-stack__card state.deck-card-stack__card--layer-1"></div>

          <div class="state.deck-card-stack__card state.deck-card-stack__card--back">
            <div class="state.deck-card-stack__back-frame">
              <div class="state.deck-card-stack__corner state.deck-card-stack__corner--tl">✦</div>
              <div class="state.deck-card-stack__corner state.deck-card-stack__corner--tr">✦</div>
              <div class="state.deck-card-stack__corner state.deck-card-stack__corner--bl">✦</div>
              <div class="state.deck-card-stack__corner state.deck-card-stack__corner--br">✦</div>

              <div class="state.deck-card-stack__crest">
                <div class="state.deck-card-stack__crest-ring"></div>
                <div class="state.deck-card-stack__crest-core">🧭</div>
              </div>

              <div class="state.deck-card-stack__brand">
                <span class="state.deck-card-stack__brand-top">LỮ KHÁCH</span>
                <strong class="state.deck-card-stack__brand-main">BÀN CỜ</strong>
                <em class="state.deck-card-stack__brand-sub">TRAVEL DECK</em>
              </div>

              <div class="state.deck-card-stack__route">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="state.deck-pile-panel__info">
        <div>
          <span>Trên tay</span>
          <strong>${handCount}</strong>
        </div>

        <div>
          <span>Đã xếp ngày</span>
          <strong>${getCurrentDayPlacedCards().length}</strong>
        </div>
      </div>
    </section>
  `;
}
