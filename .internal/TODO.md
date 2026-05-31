# Trekkopoly — Remaining Work

**Last updated:** 2026-05-31  
**Current version:** v0.17.0  
**Deployed at:** https://tankhoitv.github.io/compthink-2026/  
**Server:** https://trekkopoly.compthink-2026.deno.net

Items sorted top to bottom by priority within each tier. First → do first.

---

## Tier P0 — Responsive Layout & Browser Compatibility

### [x] White bar / blank sliver below game area
- User reports white bar is "almost hidden" but still visible
- Earlier fix (v0.12.4) hid the `<h1>` in `index.html` and gave `.arena__main` a solid `#e9dece` background
- Root cause may be sub-pixel rounding: `zoom` calc at some viewport sizes leaves a 1px gap between the game shell's visual bottom and the viewport edge
- **Fix applied:** Changed `html, body, #app` background to use solid `#e9dece` base under the gradient so any sub-pixel gap shows warm beige (matching `.arena__main`) instead of white-ish radial gradient highlights. Added `overflow: hidden` on `#game-container` wrapper to clip any parent-element rendering artifacts.

### [x] Background cut short / blank borders at non-16:9 viewports
- At viewport aspect ratios other than 16:9 (e.g. 4:3, ultrawide, tablet), the zoom-scaled game shell doesn't fill the viewport
- The `#app` background gradient shows around the centered game shell as letterboxing (expected center technique, but user says borders look like blank space rather than a seamless extension)
- **Fix applied:** Replaced the radial+linear gradient overlay on `html, body, #app` with a soft edge vignette (`rgba(80,55,25,0.06)` at edges) over solid `#e9dece`. Letterbox now shows a warm beige frame with subtle edge shading — looks intentional rather than blank. Matches `.arena__main`'s solid `#e9dece`.

### [ ] 4K — zoomed in too much, requires scrolling
- User tested the white bar fix on a 4K monitor — game is zoomed in too much and requires scrolling
- At 3840×2160, `--ui-scale: 2.2` produces a 3520×1980 visual box which should fit (320px side + 180px top/bottom letterbox)
- Theory: browser may not support CSS `zoom` at 4K, falling into `@supports not (zoom: 1)` transform:scale() path; with transform, the containing block stays at 1600×900 layout size and `overflow: hidden` may not clip correctly
- **Investigate:** test which zoom path is hit at 4K on real hardware; may need different scale threshold or separate 4K transform handling
- Low priority — unlikely our first testers have 4K monitors

### [ ] Safari/iOS iPad responsive fallback
- CSS `zoom` is non-standard, unsupported on WebKit
- `@supports not (zoom: 1)` fallback now uses `transform: scale(var(--ui-scale))` with `transform-origin: center center`
- Recent fix changed fallback from margin-based to `transform-origin: center center` (simpler, no margin compensation needed)
- **Need testing** on actual iPad (Mini / Air / Pro) — both portrait and landscape
- iPad-specific breakpoints: iPad Mini 1133×744, iPad 10th gen 1180×820, iPad Pro 1366×1024

### [ ] Combined width+height scale rules validation
- Added `@media (max-width: 1366px) and (max-height: 800px) { --ui-scale: 0.78 }` (and 1200px/0.7, 1024px/0.64)
- Prevents height-based rules from causing width overflow on small screens like iPad Mini
- **Need visual verification** on actual small-screen devices

---

## Tier 1 — Core Gaps (gameplay-impacting)

### [ ] #44 — Playtest and identify all major bugs
Systematic playtest of the full single-player loop:
- Draft → placement → simulation → day advance → game over
- Check debt penalty calculation
- Verify score breakdown numbers (base VP, bonus VP, debt)
- Test edge cases: empty hand, all slots filled, debt overflow
- Drag-and-drop placement + click placement both work
- File bugs as GitHub issues

### [x] Debounce / re-entrancy in board interaction
- During testing, placement click might fire multiple times if timing gets tight
- Current guards: `getIsInitialDealInProgress()` / `getIsPassingDraftCards()` for draft only
- Board placement has no re-entrancy guard (`placingInProgress` flag)
- `placeHandCardOnBoard()` is called from click handler AND drag-drop handler → both could race
- **Fix applied:** Added `placingInProgress` flag to `state.ts` with getter/setter. `placeHandCardOnBoard()` now checks the guard on entry and releases it after rerender. Both click-path and drag-drop-path are covered.

### [x] Simulation replay timer — cleanup on phase transitions
- `runSystemSimulation()` uses `setInterval()` for step-by-step replay
- If the user navigates away (e.g. page refresh during replay), the interval isn't cleaned up
- Consider storing `simTimerId` in state and clearing on phase transition
- **Fix applied:** Stored the 2s post-replay advance `setTimeout` ID in state (`simulationAdvanceTimeoutId`). Added `cancelSimulationAdvanceTimeout()` called from `startNextDayOrPhase()` on phase transitions. Added phase guard (`"simulation"` or `"placement"` only) to prevent stale callbacks from advancing the game out of order.

---

## Tier 2 — Multiplayer / Online (12 items)

### [x] Room creation / lobby screen
- Server already has room CRUD — needs a front-end
- Room list with join buttons
- Player count and status per room

### [x] Join room by code / invite flow
- Room code input screen
- Copy/shareable invite link
- Connect to room via WebSocket

### [x] WebSocket sync to UI
Wire `socketClient.ts` into the game screens:
- Establish WS connection on room join
- Sync game state from server
- Handle reconnection on disconnect

### [x] Online draft picking
- Player sees hand from WS snapshot, picks store/rest
- Calls `rpcCall("draftCard")`
- Server passes hands clockwise after all players pick

### [x] Online board placement
- Player sees board grid + chosen cards from snapshot
- Click slot to place, calls `rpcCall("placeCard" / "skipSlot")`
- Confirm day calls `rpcCall("confirmDay")`

### [x] Online scoring / finished screen
- Score table showing all players after simulation
- Winner banner at game end

### [x] Room reconnect (saved session)
- localStorage saves roomId + playerId + name
- "Reconnect" button on entry screen to rejoin
- Disconnect handler clears stale state

### [x] Lobby snapshot race fix
- Set player identity BEFORE connectToRoom() so initial snapshot isn't discarded
- Fixes room creation staying stuck on entry screen

### [x] Single-player card pool fix
- app.ts was importing only saigonFoodCards (30 cards)
- Now imports allCards (100 cards: FOOD, CULTURE, ACTION, UTILITY)

### [x] Auth / login system
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- PBKDF2 + JWT in server/auth.ts (ported from old TREKPOLOGY)
- Dashboard login/register forms now work
- AUTH_SECRET env var configurable via GitHub secrets

### [x] Online debt payment
- `payDebt()` RPC — pay debt tokens during online game
- `returnBoardCard()` — remove a placed card (return to chosen)
- Server: `payDebt()` and `returnBoardCard()` in game.ts
- Client: `sendPayDebt()` / `sendReturnBoardCard()` in lobbyClient.ts
- UI: debt payment section + ↩️ return button on placed cells

### [ ] Auth-attached player identity
- Old system linked WebSocket sessions to authenticated user (via JWT from /auth/login)
- Currently use anonymous `crypto.randomUUID()` — fine for now but auth would tie identity to account

### [ ] CORS / preflight for Deno Deploy ↔ GitHub Pages
- Server URL: `https://trekkopoly-3ecx8dx2y5kj.compthink-2026.deno.net`
- Client URL: `https://tankhoitv.github.io`
- CORS is set via `CORS_ORIGIN` env var but needs testing with WebSocket handshake + HTTPS preflight
- When multiplayer is used, browser will send preflight OPTIONS requests

---

## Tier 3 — Game Logic Polish

### [ ] Bot/AI opponent placement
Single-player opponent boards with 3 AI bots (p2-p4):
- Code exists in old TREKPOLOGY (first commit, original design)
- Helps solo-play feel alive with opponent cards shown as side panels
- **BLOCKED**: needs bot draft picks (our draft only serves p1), timer-based placement, side-panel rendering
- Dead code in `board-interaction.ts` has partial impl (writes to `playerBoards[playerId]` correctly) but never called
- Flagged as migration gap — defer until draft system supports bot players and side-panel UI is implemented

### [ ] Pass-card animation — verify all 5 draft rounds
- Draft flow: pick → stop timer → pass animation (940ms) → rotate pool → deal animation (1320ms) → next round
- Round 5 (last) also plays pass animation before transitioning to placement
- Last round: animation → `finishDailyDraft()` → show hand with 5 selected cards
- **Verify**: hand has exactly 5 cards after round 5, no stray cards in pool

### [ ] Debt penalty display — prevent negative VP
- When debt > accumulated VP, `accumulatedVP -= debt * 10` can go negative
- Floor at 0 in `startNextDayOrPhase()`: `getAccumulatedVP() - debt * 10 < 0 → setAccumulatedVP(0)`
- UI should show "0 VP" not negative

### [ ] Deck count consistency
- Deck starts at 35 cards (7 dealt per day × 5 days)
- After each draft round: pool returns to deck (pass animation)
- Final remaining deck count after 5 days should be 35 - (7×5) = 0
- **Verify** deck card stack shows "CÒN 0 lá" at game start of day 6

---

## Tier 4 — UI Polish

### [ ] Arena background — solid fill for clipped areas
- Currently `#app` has a gradient background showing outside the game shell
- Consider filling `body` / `#app` with `#e9dece` (the warm beige) for seamless letterbox
- Or add a `::before` pseudo-element on `#app` that fills the entire viewport with the arena gradient extended

### [ ] Score breakdown panel — timer position
- `.score-breakdown__timer` is an `O(1)` DOM update target
- Timer position inside the panel should match old TREKPOLOGY layout; verify it doesn't overlap VP numbers
- At zoom levels, font sizes might need to adjust

### [ ] Hold-to-focus on drag-and-drop
- Currently 500ms hold triggers `showFocusedCardOverlay()`, but `pointerdown` for drag-and-drop also fires
- Need to distinguish: short tap → hold for focus → drag (long press + move)
- Old TREKPOLOGY used a threshold: <200ms = click, 200-600ms = hold-focus, >600ms + movement = drag
- Current implementation may conflict: `globalThis.startHoldHandCard` timer fires at 500ms, but drag `pointerdown` fires immediately

### [ ] Certificate export — layout at scaled sizes
- `buildTravelCertificateHtml()` produces standalone HTML
- Layout fixed at A4 / 800px wide — may not scale well when printed on paper or viewed on mobile
- Could use CSS `@media print` for consistent print output

---

## Tier 5 — Content & Documentation

### [ ] #36 — Write card details for each deck card
Card art, flavor text, thematic descriptions for all ~30 cards:
- Currently have minimal descriptions
- Need full flavor text for each card

### [ ] #35 — Design detailed UI for each component
Formal design documentation:
- Component tree, states, transitions
- Color palette, typography spec
- Responsive breakpoints plan

### [ ] Audio — verify all sound effect paths
- Audio files are Git LFS-tracked; deployed via `actions/checkout@v4` with `lfs: true`
- Verify every `playGameSound()` call resolves to an actual MP3 (not LFS pointer file)
- Sound names used: `"cardSelect"`, `"cardPlace"`, `"deal"`, `"returnDeck"`, `"scanCell"`, `"scanBad"`, `"eventTraffic"`, `"eventStorm"`, `"eventDistance"`, `"eventPromo"`
- BGM: `inGameBgm` singleton with `loop=true` at 50% volume, unlocked via `syncInGameBgm()`

---

## Tier 6 — Housekeeping

### [ ] Version bump after next feature push
- Current: `v0.14.1` in `src/app.ts` (`const VERSION = "0.14.1"`)
- Bump in same commit as feature/fix (rule from `AGENTS.md`)
- Next feature: bump to `v0.15.0` (minor for new feature) or `v0.14.2` (patch for bugfix)

### [ ] Clean up stale service worker caches
- SW uses `trekkopoly-v5` (bumped from v4 to flush LFS pointer files)
- Previous cache names (`trekkopoly-v3`, `trekkopoly-v4`) remain in browser storage
- Add cleanup loop in SW `activate` event to delete orphaned caches

### [ ] Refresh `ARCHITECTURE.md` and `TYPES.md` with new learnings
- Game-shell zoom centering approach (zoom-aware calc) not documented
- Drag-and-drop system architecture
- Certificate export module
- Combined width+height media query strategy

---

## Legend

```
[ ] — Not started / needs work
[~] — In progress / partially done
[x] — Completed
```
