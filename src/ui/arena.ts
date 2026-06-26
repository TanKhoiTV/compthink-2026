import { state } from "../state/gameState.js";
import {
  getDisplayPlayerName,
  isDraftPickTimerFrozen,
} from "../game/queries.js";
import {
  getBoardCardByPosition,
  getBoardCellReplayClass,
  getHandCardById,
  getReplayStepForBoardCell,
  isLastPlacedBoardCell,
  renderUtilityEffectFlash,
} from "./boardArena.js";
import {
  getDraftHandDisplayCount,
  getDraftTimerDisplayLabel,
  isDraftTimerDanger,
  renderDraftCenterOverlay,
  renderDraftHandTopMeta,
  renderDraftLeftoverReturnOverlay,
  renderPickedDraftCards,
} from "./draftArena.js";
import {
  isOnlineGameOver,
  renderFinalRankingPanel,
  renderResourceOrbs,
  renderScoreBreakdownPanel,
  renderSimulationResultPanel,
} from "./renderHelpers.js";
import {
  renderBoardMiniCard,
  renderFocusedCard,
  renderHandCard,
} from "./cardRender.js";
import { days, rows } from "../game/constants.js";

// ── Arena template ───────────────────────────────────────────

export function renderMainArena() {
  const focusedCard = getHandCardById(state.focusedHandCardId) ??
    state.focusedBoardCard;

  return `
    <main class="arena ${isOnlineGameOver() ? "arena--gameover" : ""} ${
    state.isSimulationMode ? "arena--scanning" : ""
  }">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${getDisplayPlayerName()}</h1>
          </div>
        </div>

        ${
    renderScoreBreakdownPanel({
      draftTimerDanger: state.isDraftPhase ? isDraftTimerDanger() : false,
      draftTimerDisplayLabel: state.isDraftPhase
        ? getDraftTimerDisplayLabel()
        : "",
    })
  }
      </div>


      ${renderResourceOrbs()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${
    days
      .map(
        (day, dayIndex) =>
          `<div class="day-pill ${
            dayIndex === state.currentDayIndex ? "day-pill--current" : ""
          } ${
            dayIndex < state.currentDayIndex ? "day-pill--done" : ""
          }">NGÀY ${day}</div>`,
      )
      .join("")
  }
          </div>

          <section class="board-grid">
            ${
    rows
      .map((row, rowIndex) => {
        return `
                  <div class="time-label">${row}</div>

                  ${
          days
            .map((_, colIndex) => {
              const card = getBoardCardByPosition(rowIndex, colIndex);
              const isCurrentDayColumn = colIndex === state.currentDayIndex;
              const isPlaceable = !state.isDraftPhase &&
                !state.isSimulationMode &&
                !state.isInitialDealInProgress &&
                isCurrentDayColumn &&
                state.selectedHandCardId !== null &&
                card === null;

              if (!card) {
                return `
                          <div
                            class="board-cell board-cell--empty ${
                  getBoardCellReplayClass(
                    rowIndex,
                    colIndex,
                  )
                } ${state.isSimulationMode ? "board-cell--locked-mode" : ""} ${
                  !isCurrentDayColumn && !state.isSimulationMode
                    ? "board-cell--not-current-day"
                    : ""
                } ${isPlaceable ? "board-cell--placeable" : ""}"
                            data-board-drop-cell="true"
                            data-row-index="${rowIndex}"
                            data-col-index="${colIndex}"
                            onclick="event.stopPropagation(); handleBoardCellClick(${rowIndex}, ${colIndex})"
                            title="${
                  isCurrentDayColumn
                    ? isPlaceable
                      ? "Thả lá đang kéo vào ô ngày hiện tại"
                      : "Chỉ xếp bài cho ngày hiện tại"
                    : "Không phải ngày hiện tại"
                }"
                          >
                            <span class="empty-plus">+</span>
                            ${renderUtilityEffectFlash(rowIndex, colIndex)}
                          </div>
                        `;
              }

              return `
                        <div
                          class="board-cell board-cell--occupied board-cell--clickable ${
                getBoardCellReplayClass(
                  rowIndex,
                  colIndex,
                )
              } ${
                isLastPlacedBoardCell(rowIndex, colIndex)
                  ? "board-cell--just-placed"
                  : ""
              }"
                          data-board-drop-cell="true"
                          data-row-index="${rowIndex}"
                          data-col-index="${colIndex}"
                          onclick="event.stopPropagation(); handleBoardCellClick(${rowIndex}, ${colIndex})"
                          title="Ô đã có bài - bấm để xem lớn"
                        >
                          ${
                renderBoardMiniCard(
                  card,
                  getReplayStepForBoardCell(rowIndex, colIndex),
                )
              }
                            ${renderUtilityEffectFlash(rowIndex, colIndex)}
                        </div>
                      `;
            })
            .join("")
        }
                `;
      })
      .join("")
  }
          </section>
          ${renderDraftCenterOverlay()}${renderDraftLeftoverReturnOverlay()}
        </div>

        ${
    isOnlineGameOver()
      ? renderFinalRankingPanel()
      : state.isDraftPhase
      ? ""
      : renderSimulationResultPanel()
  }

        ${
    state.isSimulationMode ? "" : `
              <section
          class="player-hand ${
      state.isDraftPhase ? "player-hand--draft" : ""
    } ${
      !state.isDraftPhase && state.isInitialDealInProgress
        ? "player-hand--dealing is-dealing"
        : ""
    }"
          onclick="${state.isDraftPhase ? "" : "clearSelectedHandCard()"}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${
      state.isDraftPhase ? "DRAFT" : "HAND"
    }</span>
              <h2>
                ${
      state.isDraftPhase
        ? `Chọn bài ngày ${days[state.currentDayIndex]}`
        : `Bài ngày ${days[state.currentDayIndex]}`
    }
              </h2>
            </div>

            <div class="player-hand__meta ${
      state.isDraftPhase && isDraftTimerDanger()
        ? "player-hand__meta--danger"
        : ""
    }">
              ${
      state.isDraftPhase
        ? isDraftPickTimerFrozen()
          ? "Đang chia bài..."
          : `Còn ${state.draftPickSecondsLeft}s • ${
            state.isPassingDraftCards
              ? "Đang chuyền bài..."
              : "bấm 1 lá để chọn"
          }`
        : state.isInitialDealInProgress
        ? "Đang chia bài..."
        : "Giữ 0.5s để xem lớn"
    }
            </div>
          </div>

          ${state.isDraftPhase ? renderDraftHandTopMeta() : ""}

          <div class="player-hand__cards ${
      state.isDraftPhase
        ? `player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${getDraftHandDisplayCount()}`
        : ""
    }">
            ${
      state.isDraftPhase ? renderPickedDraftCards() : state.playerHand
        .map((card, index) => renderHandCard(card, index))
        .join("")
    }
          </div>
        </section>
            `
  }
      </div>

      ${focusedCard ? renderFocusedCard(focusedCard) : ""}
    </main>
  `;
}
