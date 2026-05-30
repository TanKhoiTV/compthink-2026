# Trekkopoly — Architecture

## Overview

Trekkopoly is a travel itinerary board game built as a **single-page web app** with a **lightweight WebSocket relay server**. The game runs in a browser; the server handles room management and online multiplayer. Single-player/local mode runs entirely client-side.

**Live:** https://tankhoitv.github.io/compthink-2026/  
**Server:** https://trekkopoly-3ecx8dx2y5kj.compthink-2026.deno.net  
**Source:** https://github.com/TanKhoiTV/compthink-2026

---

## Directory Structure

```
.
├── index.html            # SPA entry point (minimal shell)
├── sw.js                 # Service worker (network-first, offline fallback)
│
├── src/                  # Client source (TypeScript, bundled by Rollup)
│   ├── app.ts            # Entry point, game loop, timer, audio orchestration
│   ├── router.ts         # Screen routing, event delegation (capture-phase clicks)
│   ├── state.ts          # Global state (module-level variables + get/set exports)
│   │
│   ├── arena/            # Arena screen (game board, hand, draft)
│   │   ├── render.ts     # DOM rendering: board grid, hand fan, draft pool, focused card
│   │   └── board-interaction.ts  # [DEAD CODE] Old placement/bot logic, not imported
│   │
│   ├── screens/          # Screen renderers (splash, dashboard, map selection)
│   │
│   ├── audio/            # Audio engine
│   │   └── gameAudio.ts  # Playback, throttling, AudioContext unlock, BGM
│   │
│   ├── online/           # WebSocket client (multiplayer)
│   │   └── socketClient.ts
│   │
│   └── shared/           # Shared game logic (same code, dual-runtime)
│       ├── types.ts      # TravelCard, GamePhase, Resource types
│       ├── constants.ts  # PHASE_DAYS, HAND_SIZE, STARTING_*, DRAFT_PICK_SECONDS
│       ├── board.ts      # BoardSlots, position validation, distance calculation
│       ├── deck.ts       # Card pool, deck creation, shuffle
│       ├── resources.ts  # Remaining resource calculation, affordability
│       ├── scoring.ts    # Simulation engine (5-step scoring algorithm)
│       └── data/         # Card data (Saigon phase 1)
│           └── index.ts
│
├── server/               # Deno server (WebSocket relay + room management)
│   ├── server.ts         # HTTP + WS listener, CORS, health endpoint
│   ├── game.ts           # Game state machine, draft/placement/scoring relay
│   ├── rooms.ts          # Room CRUD, player join/leave
│   ├── player.ts         # Player state
│   ├── deno.json         # Deno config (imports, tasks, lint)
│   └── test-data.ts      # Local dev test helpers
│
├── css/                  # Styles (Less → CSS)
│   ├── style.less        # Entry point (imports all partials)
│   └── client.less       # Compiled/aggregated stylesheet
│
├── assets/               # Static assets (Git LFS-tracked)
│   └── audio/            # MP3 sound effects + BGM
│
├── build/                # Rollup output (client.js, client.js.map)
├── _site/                # Deploy artifact (CI copies everything here)
│
├── rollup.config.js      # Rollup config: TypeScript + replace (build timestamp)
├── tsconfig.json         # Shared TS config (dual-runtime compatible)
├── eslint.config.mjs     # ESLint flat config (client TypeScript)
├── vitest.config.ts      # Vitest config (smoke tests for shared logic)
├── package.json          # npm scripts: build, lint, test
│
├── docs/                 # Design docs, meeting notes, decisions
│   ├── game-logic-design.md  # Source of truth for game rules
│   └── adr/              # Architecture Decision Records
│
├── TREKPOLOGY/           # Original codebase (reference only, deferred cleanup #82)
└── .internal/            # Agent instructions, plans, TODO (git-ignored)
```

---

## Dual Runtime

| Runtime | Role | Entry | Bundler | Deploy Target |
|---------|------|-------|---------|--------------|
| **Deno** | WebSocket relay server | `server/server.ts` | Deno native | Deno Deploy |
| **Browser** | Game client (SPA) | `src/app.ts` | Rollup + TypeScript | GitHub Pages |

The `src/shared/` directory is compiled into both bundles:
- `src/shared/` → server imports via `../src/shared/...` (Deno resolves `.ts` extensions natively)
- `src/shared/` → client imports via `./shared/...` (Rollup resolves `.ts` through @rollup/plugin-typescript)

---

## Build Pipeline

```
npm run build
  ├── npm run build:css   → lessc css/style.less build/client.css
  └── npm run build:js    → rollup -c
       ├── @rollup/plugin-replace     (BUILD_TIME placeholder → UTC+7 timestamp)
       └── @rollup/plugin-typescript  (.ts → .js bundle)

npm test
  └── vitest run          → src/game-logic.test.ts (6 smoke tests)

npm run lint
  ├── eslint src/         → Client TypeScript (flat config)
  └── cd server && deno lint → Server TypeScript
```

**Key constraint:** `@rollup/plugin-replace` must come **before** `@rollup/plugin-typescript` in the plugins array. If reversed, TypeScript parses the raw `__BUILD_TIME_PLACEHOLDER__` string as a value it can't resolve.

---

## Game State Model

State is managed via **module-level variables** in `src/state.ts` with getter/setter exports. No framework (React, Vue) — pure TypeScript.

```
Key state slices:
  ├── Game phase          → "lobby" | "draft" | "placement" | "scoring" | "finished"
  ├── Board               → 5×5 grid of (TravelCard | null) per player
  ├── Hand                → Array of TravelCard (5 cards after draft)
  ├── Draft pool          → 7→6→5→4→3 cards per round
  ├── Simulation result   → { replaySteps, totalVP, ... }
  ├── Timer state         → Draft timer (10s), turn timer (15s)
  ├── Audio               → BGM instance, mute/volume, sound throttling
  └── UI interaction      → Selected/focused card ids, hold timer, popup state
```

---

## Game Loop (FSM)

```
LOBBY ──START──▶ DRAFT ──5 picks──▶ PLACEMENT ──endDay──▶ SCORING ──next──▶ DRAFT
                                                                │
                                                                │ (after Day 5)
                                                                ▼
                                                             FINISHED
```

**Draft phase:** (7 cards dealt, pick 1 per round, 5 rounds)
1. Deal animation: cards fly into pool (1.32s)
2. Player picks a card (click or timer auto-pick)
3. Pass animation: unselected cards fly to deck (0.94s)
4. Deal animation for next round's pool (1.32s)
5. Repeat until 5 picks made → transition to placement

**Placement phase:**
1. Player hand fan rendered at bottom of arena
2. Click card to select, click board cell (current day column) to place
3. Resource costs checked: coin debt tracked (penalty at day advance), stamina debt creates lock token on next slot
4. "End Day" button advances to simulation

**Scoring (simulation):**
1. 5-step simulation runs: debt scan → random events → combo scan → distance scan → final tally
2. Step-by-step replay overlay (850ms per step)
3. After replay: score applied, day advances or game over

---

## Event Delegation

Click handling uses **capture-phase** delegation (matches old TREKPOLOGY):

```typescript
document.addEventListener("click", handler, true);
```

This single handler:
1. Checks for `[data-draft-card-id]` → draft card selection
2. Checks for `[data-hand-card-id]` → hand card selection (placement)
3. Checks for `[data-board-cell]` → board cell click (place card)

No per-element `addEventListener("click")` — capture-phase is the single path. This was done to eliminate double-fire bugs.

---

## Audio

- **SFX:** `playGameSound(name)` — throttled per-sound (100ms debounce). 15+ named sounds (cardSelect, cardPlace, deal, returnDeck, scanCell, scanBad, etc.)
- **BGM:** Singleton `Audio` element with `loop=true`, 50% default volume. Mute/volume persisted in localStorage.
- **Autoplay unlock:** PointerDown/KeyDown delegation on document. `syncInGameBgm()` retries on user interaction.
- **Files:** Git LFS-tracked (require `lfs: true` in `actions/checkout@v4` — otherwise 130-byte pointer files are served instead of MP3s).

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | Outcome |
|----------|---------|---------|
| `ci.yml` | PR / push to main | Lint → test → build (3 jobs) |
| `deploy-pages.yml` | Push to main | Build + deploy to GitHub Pages |
| `deploy-server.yml` | Push to main | Deploy server to Deno Deploy |

**Pages deploy:** `actions/checkout@v4` with `lfs: true`, builds JS + CSS, copies to `_site/`, deploys via `actions/deploy-pages@v4`.

**Deno Deploy:** Authenticated via `DENO_DEPLOY_TOKEN`. Org = `compthink-2026`, app = `trekkopoly`, entrypoint = `server/server.ts`.

---

## Key Design Decisions

- **No framework** — pure TypeScript DOM manipulation, minimal dependency footprint
- **Capture-phase event delegation** — matches old TREKPOLOGY, prevents double-fire from per-element listeners
- **Direct push to main allowed** — admin bypass for migration speed (PR workflow re-enabled post-migration)
- **Version bump in same commit** — never standalone, always paired with the feature/fix it versions
- **CSS from Less compiled by `lessc`** — 9500+ lines, auto-formatted by biome/lessc
- **Service worker: network-first** — always fetch from network, cache as offline fallback. Cache name (`trekkopoly-vN`) bumped on content changes to flush LFS pointer poison
