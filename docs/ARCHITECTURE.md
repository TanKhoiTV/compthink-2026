# Trekkopoly Architecture Notes

> Living document capturing architectural decisions, module relationships, and
> key design patterns discovered during implementation. Read alongside
> [`docs/architecture.html`](architecture.html) (system diagram) and
> [`docs/adr/`](adr/) (formal ADRs).

---

## Table of Contents

1. [Dual Game Loop](#dual-game-loop)
2. [Animation System](#animation-system)
3. [Online / Single-player Architecture](#online--single-player-architecture)
4. [Auth System](#auth-system)
5. [Key Technical Decisions](#key-technical-decisions)

---

## Dual Game Loop

The game has **two parallel game-loop implementations** that share the same
Render layer:

| Path | Entry | Draft | Placement | Used for |
|---|---|---|---|---|
| **Legacy** | `app.ts::startDailyDraft()` | `selectHandCard() →` inline pass/deal animation + state mutation | `placeHandCardOnBoard()` | Pre-Room singleplayer (still functional via `#test-game`? No — that now goes through spAdapter) |
| **Room FSM** | `spAdapter.ts::startBotGame()` → `localRoom.ts::initLocalGame()` → `server/game.ts::initRoom()` | `spAdapter.selectHandCard() → localDraftCard() → server draftCard()` → `applySnapshotAndRender()` | `localPlaceCard() → server placeCard()` | Multiplayer (online) + singleplayer (bot) |

### Room FSM (current primary path)

The `server/game.ts` `Room` type is the single source of truth for game state
in both online and single-player modes:

```
app.ts::#test-game
  → spAdapter.startBotGame()
    → localRoom.initLocalGame()       // creates Room + 3 bots in-process
    → spAdapter.initSPGlobals()       // binds global action handlers
      ├── selectHandCard()            // draft pick with pass animation delay
      ├── handleBoardCellClick()      // placement click
      ├── endCurrentDay()             // confirm day button
      ├── clearSelectedHandCard()     // × button
      ├── startHoldHandCard()         // hold-to-focus simplified (no timer)
      ├── handleDiscardCard()         // drag-to-discard rest
      └── closeFocusedCard()          // close overlay

server/game.ts Room
  → exportSnapshot() → snapshotAdapter.applySnapshotToState()
    → updates state.ts variables
  → localRoom.applySnapshotAndRender()
    → rerenderGameShell()
```

### Legacy Path (still present, mostly superseded)

The legacy path in `app.ts` (`startDailyDraft`, `selectHandCard`,
`startNextDayOrPhase`, etc.) was the original single-player implementation.
It has its own inline animation handling and state mutations. The Room FSM
path (`spAdapter`) overrides its `globalThis` handlers.

**Dead code status (v0.23.0):** `startDailyDraft`, `startTurnTimer`,
`endCurrentDay` in `app.ts` are still present but unused when spAdapter is
active. `startNextDayOrPhase` is still used by the legacy simulation replay
path (the simulation result is computed by `app.ts` because it uses local
state scraping, not the Room FSM).

---

## Animation System

### Draft — Pass Animation (cards flying out)

**CSS keyframes:** `draftPassToDeckClean` (940ms, non-selected cards fly right)
and `draftChosenKeepClean` (940ms, selected card flies up).

**Triggered by:** `.player-hand__cards.is-passing` class.

#### Legacy Path
```
selectHandCard()
  → setIsPassingDraftCards(true)
  → rerenderGameShell()            // renders cards WITH .is-passing
  → setTimeout(PASS_ANIMATION_MS)  // 940ms
    → move picked to hand
    → return remaining to deck
    → set up next pool or finishDailyDraft
```

#### Room FSM Path (spAdapter, v0.23.0+)
```
spAdapter.selectHandCard()
  → [_draftPicking guard] prevent double-clicks
  → setDraftSelectedCardId(cardId)     // CSS .daily-draft-card--selected
  → setIsPassingDraftCards(true)
  → rerenderGameShell()                // renders cards WITH .is-passing
  → setTimeout(PASS_ANIMATION_MS)      // 940ms
    → setIsPassingDraftCards(false)
    → setDraftSelectedCardId(null)
    → localDraftCard(cardId, "store")  // processes pick → snapshot → rerender
    → if still in draft:
        → hand.classList.add("player-hand--dealing", "is-dealing")
        → double-requestAnimationFrame → .deal-active
        → setTimeout(DEAL_ANIMATION_MS) → cleanup
```

### Draft — Deal Animation (cards flying in)

**CSS keyframes:** Staggered via `.daily-draft-card--N` classes on `.deal-active`.

**Pre-v0.23.0 bug:** `localRoom.ts` attempted to detect pass/deal
transitions by querying the DOM *after* `applySnapshotToState()` mutated
state but before `rerenderGameShell()` re-rendered. Since the DOM was stale
at that point, `hadHandCards` always equalled `hasHandCards` — the
detection conditions could never be true. The animation code there was dead.

**Fixed in v0.23.0:** Deal animation is triggered explicitly in
`spAdapter.ts` after `localDraftCard()` completes and the new snapshot is
rendered.

### Online Draft — Deal Animation (v0.22.0+)

`onlineGame.ts::startOnlineDealAnimation()` uses the same CSS classes
(`player-hand--dealing`, `is-dealing`, `deal-active`) but via DOM
manipulation after the snapshot-driven render. Called from
`initOnlineGameGlobals()` when `.player-hand--draft .daily-draft-card`
is detected in the DOM.

No pass animation for online mode — the pass is server-side and the client
receives the already-rotated snapshot atomically.

### hold-to-focus vs Drag Conflict (v0.23.0)

Two handlers share `pointerdown` on hand cards:
- `handleHandCardDown()` → `startHoldHandCard()` → 500ms timeout → overlay
- `startHandPointerDrag()` → begins drag tracking

**Race:** If the user holds before moving, the 500ms timeout fires the
overlay mid-drag. **Fix:** `startHoldHandCard()` now checks
`getHandPointerDragState().isDragging` before showing the overlay. If a
drag is already in progress, the overlay is suppressed.

---

## Online / Single-player Architecture

```
┌──────────────────────────────────────────┐
│  Client (browser)                         │
│                                           │
│  src/screens/    src/arena/               │
│  ┌───────────┐  ┌───────────┐             │
│  │ lobby.ts  │  │ render.ts│             │
│  │ onlineGame│  │ extra-   │             │
│  │ .ts       │  │ panels.ts│             │
│  └─────┬─────┘  └─────┬─────┘             │
│        │               │                  │
│        │   src/state.ts (shared state)    │
│        │               │                  │
│  ┌─────┴───────────────┴─────┐            │
│  │ src/online/                │            │
│  │  ├── lobbyClient.ts        │            │
│  │  │   - WebSocket connect    │            │
│  │  │   - room CRUD           │            │
│  │  │   - snapshot handler    │            │
│  │  │   - saved sessions      │            │
│  │  ├── socketClient.ts       │            │
│  │  │   - WS send/receive     │            │
│  │  │   - RPC dispatch        │            │
│  │  ├── snapshotAdapter.ts    │            │
│  │  │   - snapshot → state    │            │
│  │  ├── spAdapter.ts          │            │
│  │  │   - global handlers for │            │
│  │  │     single-player       │            │
│  │  └── localRoom.ts          │            │
│  │      - wraps Room FSM      │            │
│  │      - timer management    │            │
│  └────────────────────────────┘            │
│                                           │
└─────┬──────────────────┬──────────────────┘
      │ WebSocket        │ In-process
      │ (online)         │ (single-player)
      ▼                  ▼
┌──────────────┐  ┌──────────────┐
│ server/      │  │ server/      │
│ server.ts:   │  │ game.ts:     │
│  - HTTP      │  │  Room FSM     │
│  - WS        │  │  draftCard() │
│  - auth      │  │  placeCard() │
└──────────────┘  └──────┬───────┘
                         │
                    server/bot.ts
                    - Bot AI opponent
```

### Key differences

| Aspect | Online | Single-player (Room FSM) |
|---|---|---|
| Network | WebSocket to HF Space | In-process (same JS context) |
| Room lifecycle | `lobbyClient.ts` create/join | `localRoom.ts::initLocalGame()` |
| Snapshot | Over WS, handled by lobbyClient | Synchronous, `exportSnapshot()` |
| Bots | N/A (real players) | `server/bot.ts` auto-plays |
| Animations | `onlineGame.ts` DOM hooks | `spAdapter.ts` timing |
| Auth | JWT via `?token=` | Skipped (local) |

---

## Auth System

- **Server:** `server/auth.ts` — PBKDF2 password hashing, JWT creation/verification
  (via `crypto.subtle`, no external deps). `POST /api/auth/register`,
  `POST /api/auth/login`, `GET /api/auth/me`.
- **Client:** `lobbyClient.ts` `saveAuthSession()`/`clearAuthSession()` stores
  JWT + user info in localStorage. Loaded at startup via `loadAuthSession()`.
- **WebSocket auth:** `connectToRoom()` appends `&token=JWT` query param.
  Server `handleWebSocket()` validates and overrides display name.
- **Env:** `AUTH_SECRET` (set in HF Space env vars, not committed).

---

## Key Technical Decisions

### Deployment
- **Hugging Face Spaces** (Docker SDK) — free, no credit card needed.
  `app_port: 8080` required in `README.yaml` for proxy routing.
  `PORT` env var alone is insufficient.
- **GitHub Pages** for client (static PWA). Auto-deploy from `main`.
- **cron-job.org** pings `/health` every 12h to keep the HF Space warm.

### Timer Architecture
- **Draft timer:** 180s (default). Managed by `localRoom.ts::startDraftTimer()`
  via a client-side `setInterval`. Cleared when the player picks or the
  round advances.
- **Placement timer:** 180s. Managed by `localRoom.ts::startPlacementTimer()`.
- **Phase guard:** `startDraftTimer()` and `refreshLocalSnapshot()` check
  `exportSnapshot(localRoom, localPlayerId).phase === "draft"` before starting,
  preventing stale timer fires after a phase transition.
- **snapshotAdapter.ts** no longer overwrites timer values (v0.20.4 fix).

### Scoring Broadcast
- Server `runSimulationAndScoring()` first broadcasts scoring results to all
  clients, then advances to the next day after a 3-second `setTimeout()`.
  This lets clients display the score table before the phase changes.

### Drag-to-Discard ("Rested" mechanic)
- Player can drag a placed card to the deck area to discard it for rest
  resources (Xu + Stamina).
- Requires server-side `discardChosenCard()` (removes from chosen, grants
  resources). Client `localDiscardCard()`. Global handler
  `globalThis.handleDiscardCard` wired in `spAdapter.ts`.

### CSS Strategy
- Build pipeline: `css/client.less` → `build/client.css` (lessc).
  All CSS edits go in the `.less` source; `build/client.css` is overwritten.
- Game shell uses CSS `zoom` for responsive scaling, with `@supports not (zoom: 1)`
  fallback to `transform: scale()` for Safari/WebKit.
- Card images use `background-color: #e8d8bf` fallback + `onerror` handler
  for graceful degradation.

### Agent Testing Notes
- `#test-game` URL hash bypasses dashboard for instant single-player entry.
- `agent-browser` `click @eN` has limited reliability (CDP event timing).
  Prefer `eval document.querySelector('[data-draft-card-id]').click()`.

---

## Architectural Invariants

1. **State flows one direction:** Server/Room → `exportSnapshot()` →
   `snapshotAdapter.applySnapshotToState()` → `state.ts` → **Render**. The
   render layer never mutates game state directly; all mutations go through
   server functions (`draftCard()`, `placeCard()`, etc.) or their local
   wrappers.
2. **Arena shell is shared:** `renderMainArena()` and `renderOnlineGameArena()`
   both place content into `#game-shell` with the same outer structure
   (score panel, resource orbs, board grid, player hand section).
3. **Online and offline use the same Room FSM.** The only differences are
   rendering templates and the network layer.
4. **Draft is synchronous Sushi Go.** Each player picks one card per round.
   Remaining cards pass clockwise. 5 rounds, starting pool of 7 cards.
