# Implementation Plan: Wire Scoring / Simulation Engine

## Goal
After placement, instead of immediate day advance, run simulation replay (step-by-step ticket scan overlay with VP accumulation, events, sounds). Wire resource/affordability calculation into orbs and card placement.

---

## Tasks

### 1. Add simulation state to `src/state.ts`

**Variables to add** (matching old TREKPOLOGY):
- `simulationResult: SimulationResult | null` — cached result object
- `simulationReplayIndex: number` — current step index during replay
- `simulationReplayTimerId: number | null` — interval timer handle
- `isReplayComplete: boolean` — true when last step reached
- `hasAppliedSimulationScore: boolean` — prevents double-apply
- `eventResourceModifier: { coin: number; stamina: number }` — accumulated event deltas
- `localCoinDebt: number` — accumulated debt
- `debTokensOnBoard: number` — debt token count for final penalty

**Getters/setters to export**: `getSimulationResult`, `setSimulationResult`, `getSimulationReplayIndex`, `setSimulationReplayIndex`, `getIsReplayComplete`, `setIsReplayComplete`, etc.

**Acceptance**: state file has all simulation fields with getters/setters.

---

### 2. Refactor `endCurrentDay()` in `src/app.ts` to launch simulation

**Change**: currently scores base VP and immediately advances day. Replace with:

```
function endCurrentDay() {
  if (getGamePhase() !== "placement") return;
  setGamePhase("simulation");
  clearSelectedHandCard();
  runSystemSimulation();
  rerenderGameShell();
}
```

Add new function `runSystemSimulation()`:
1. Call `calculateSimulationResult()` from `scr/shared/scoring.ts` with the same params old code used:
   - `boardSlots: getBoardSlots()`
   - `currentDayIndex: getCurrentDayIndex()`
   - `dayLabel: "Ngày " + (getCurrentDayIndex() + 1)`
   - `rows: ROWS` (import from render.ts or define locally)
   - `getBoardDisplayName: (card) => card.name`
   - `getCardTagKeys: (card) => card.tags?.map(t => t) ?? [card.tag]`
   - `countCardsWithTag: (cards, tag) => cards.filter(c => c.tags?.includes(tag)).length`
   - `getCurrentDayPlacedCards: (dayIndex) => all cards in boardSlots at column dayIndex`
2. Store result via `setSimulationResult()`
3. Reset `simulationReplayIndex = 0`, `isReplayComplete = false`, `hasAppliedSimulationScore = false`
4. Call `playSimulationScanSoundForCurrentStep()` (stub in gameAudio or implement inline)
5. Start `window.setInterval(...)` at 850ms:
   - Increment `simulationReplayIndex`
   - Play scan sound
   - Rerender arena
   - When last step reached: set `isReplayComplete = true`, call `applyDailyScoreOnce()`, clear interval, after 1800ms timeout call `startNextDayOrPhase()`

**Acceptance**: clicking "Kết thúc ngày" transitions to simulation phase with ticker.

---

### 3. Add `startNextDayOrPhase()` in `src/app.ts`

Refactored from old `startNextDayOrPhase()`:
- Stop simulation timer
- Return unplayed hand cards to deck
- If currentDayIndex >= 4 (last day): calculate final debt penalty, increment phase, reset board/deck
- Else: increment `currentDayIndex`
- Reset all simulation flags: `isSimulationMode = false`, `simulationResult = null`, etc.
- Call `startDailyDraft()` (new day) or `setGamePhase("finished")` (game over)

Also add helper functions from old code:
- `applyDailyScoreOnce()` — adds `simulationResult.finalVP` to `accumulatedVP`
- `getCurrentReplayPartialVP()` — sums VP from steps 0..simulationReplayIndex
- `getStablePhaseScoreDisplay()` — returns `accumulatedVP` if replay complete, else pre-simulation score
- `clearSimulationTimer()` — clears the interval

**Acceptance**: after simulation replay, day advances correctly; after day 5, game over.

---

### 4. Add `renderSimulationResultPanel()` to `src/arena/render.ts`

Implement `renderSimulationResultPanel(): string` matching old `renderSimulationResultPanel()` (lines 3648-3780 in old app.ts):

**Structure**:
```
<section class="ticket-scan-overlay" onclick="event.stopPropagation()">
  <div class="ticket-scan-overlay__scrim"></div>
  <div class="ticket-scan-overlay__header">
    <span>ĐANG QUÉT TÍNH ĐIỂM</span>
    <strong>Phase X • Ngày Y</strong>
    <em>Đang tính: {timeLabel}</em>
  </div>
  <div class="ticket-scan-strip">
    <div class="ticket-scan-track" style="transform: translateX(...)">
      <!-- score-ticket for each step -->
    </div>
  </div>
  <div class="ticket-scan-overlay__footer">
    <div><span>Tiến trình</span><strong>X/Y</strong></div>
    <div><span>Điểm ngày</span><strong>±X VP</strong></div>
    <div><span>Tổng phase</span><strong>X VP</strong></div>
    {isReplayComplete ? <div class="ticket-scan-overlay__complete">...</div> : ""}
  </div>
</section>
```

Each score-ticket card shows: time label, VP delta, title, subtitle, coin/stamina costs, combo badge, event stamp (icon + text), connector between tickets. Animate horizontal track translate via CSS `--scan-index`.

Also add `formatSignedVP(value: number): string` helper.

**Insertion point**: In `renderMainArena()`, add `renderSimulationResultPanel()` before the closing `</main>` when `getGamePhase() === "simulation"`.

**Acceptance**: during simulation replay, a ticket overlay appears with step-by-step scanning.

---

### 5. Wire board cell replay classes in `renderBoardCell()`

Add `getBoardCellReplayClass(rowIndex, colIndex): string`:
- During simulation, call `getReplayStepForBoardCell()` to find the step
- Return `board-cell--replay-current`, `board-cell--replay-done`, or `board-cell--replay-pending`
- If the step has an event type, append `board-cell--event-${eventType}`

Apply the class in `renderBoardCell()` when `getGamePhase() === "simulation"`.

**Acceptance**: board cells highlight during replay scan (current cell animates, done cells dim).

---

### 6. Wire `getRemainingResources()` into resource orbs

In `renderResourceOrbs()`:
- Import `getRemainingResources`, `getCardAffordability` from `scr/shared/resources.ts`
- Calculate totals from all placed cards across the board
- Call `getRemainingResources()` with totals and starting values (STARTING_COIN=3, STARTING_STAMINA=2 from constants)
- Show real values instead of `--`

Also add debt amount: walk board for debt tokens, sum their amounts, display in D orb.

**Acceptance**: C/S/D orbs show real remaining resources instead of `--`.

---

### 7. Wire resource affordability into hand cards in `renderHandCard()`

Add `getCardAffordability()` call in hand card rendering:
- Pass remaining resources + card cost
- If `!canAfford`, add CSS class `hand-card--unaffordable` and update title with affordability message

**Acceptance**: hand cards dim/shade when insufficient resources.

---

### 8. Wire scan sound into `src/audio/gameAudio.ts`

Add a `scanCell` sound mapping in `playGameSound()` if not already present. The old code uses these sounds:
- `scan-cell.mp3` — played each step
- `scan-bad.mp3` — played for bad events (storm, traffic, distance)
- `event-promo.mp3` — played for promo events

Add `playSimulationScanSoundForCurrentStep()` that checks current step's `eventType` and plays appropriate sound.

**Acceptance**: scan sounds play during simulation replay.

---

### 9. Add `"simulation"` to `GamePhase` type in `state.ts`

Currently `GamePhase = "draft" | "placement" | "endDay" | "finished"`. Change to:
```
export type GamePhase = "draft" | "placement" | "simulation" | "finished";
```

Update any exhaustive checks on GamePhase.

**Acceptance**: game phase includes "simulation".

---

### 10. Update `renderMainArena()` in `src/arena/render.ts`

- During simulation phase: hide hand section (`renderPlayerHandSection`), hide end-day button
- Add `renderSimulationResultPanel()` output
- Export common constants `ROWS` and `DAYS` so `app.ts` can import them for simulation params

**Acceptance**: arena looks correct during simulation phase (hand hidden, overlay showing).

---

## Files to Modify

| File | Changes |
|---|---|
| `src/state.ts` | Add simulation state fields + getters/setters, add `"simulation"` to `GamePhase` |
| `src/app.ts` | New `runSystemSimulation()`, refactor `endCurrentDay()`, add `startNextDayOrPhase()`, `applyDailyScoreOnce()`, helpers. Import scoring module + ROWS/DAYS constants. |
| `src/arena/render.ts` | Add `renderSimulationResultPanel()`, `formatSignedVP()`, `getBoardCellReplayClass()`, `getReplayStepForBoardCell()`. Wire resource orbs with real values. Wire affordability into hand card rendering. Export ROWS, DAYS. |
| `src/audio/gameAudio.ts` | Add `playSimulationScanSoundForCurrentStep()` or equivalent. Ensure scan sounds are mapped. |

## New Files

None — all functions go into existing files.

## Dependencies

1. State fields (Task 1) must exist before app.ts can read/write them.
2. Scoring module types (`SimulationResult`, `SimulationReplayStep`) already in `scr/shared/scoring.ts` — no changes needed.
3. ROWS/DAYS must be exported from render.ts before app.ts can import them.

## Risks

- **Simulation overlay CSS** (`ticket-scan-overlay`, `score-ticket`, `ticket-scan-track`) exists in `css/client.less` (from original TREKPOLOGY) but may need verification it actually compiles and styles correctly. Test locally first.
- **Sound files** (`scan-cell.mp3`, `scan-bad.mp3`, `event-*.mp3`) exist in `public/assets/audio/sounds/` but may not play if LFS issue recurs (now fixed with `lfs: true` in deploy workflow).
- **Resource calculations** assume all placed cards on the entire board, not just current day's column. Old code calculates per-phase totals. Verify with design doc.
- **GamePhase exhaustive checks**: `"simulation"` is new — any switch/if chain checking all phases may silently skip it.
