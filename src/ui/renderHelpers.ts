import { state } from "../state/gameState.js";
import { onlineClientState } from "../online/socketClient.js";
import { days } from "../game/constants.js";
import {
  getOnlineSelfPublicPlayer,
  isOnlineRoomActive,
} from "../game/queries.js";

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
  renderTravelTimelineExportPanel,
  shouldShowReplayDay,
};
