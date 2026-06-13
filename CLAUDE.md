# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Trekkopoly (a.k.a. "Traveling Game") — a travel-itinerary board game built as a single-page web app (vanilla TypeScript, no framework) with a Deno WebSocket relay server for multiplayer. Single-player runs entirely client-side against bots.

## Commands

```bash
# Client build
npm run build        # build:css (lessc) + build:js (rollup)
npm run build:css     # css/style.less -> build/client.css
npm run build:js      # rollup -c -> build/client.js

# Client lint / test
npm run lint          # eslint src/
npm test              # vitest run (src/**/*.test.ts)
npx vitest run src/game-logic.test.ts   # single test file
npx vitest run -t "test name"           # single test by name

# Server (run from server/, requires Deno)
deno task start       # deno run --allow-net server.ts
deno task dev         # with --watch
deno task test        # deno test --allow-read --allow-write --allow-env --allow-net server/*.test.ts
deno test --allow-read --allow-write --allow-env --allow-net server/game.test.ts  # single file
deno task lint
```

**Build pipeline ordering constraint:** in `rollup.config.js`, `@rollup/plugin-replace` (resolves `__BUILD_TIME_PLACEHOLDER__`) must come **before** `@rollup/plugin-typescript`. If reversed, TypeScript chokes on the unresolved placeholder string.

## Architecture

Dual runtime sharing one TypeScript codebase:

| Runtime | Entry | Bundler | Deploy |
|---|---|---|---|
| Browser (client) | `src/app.ts` | Rollup + `@rollup/plugin-typescript` | GitHub Pages |
| Deno (server) | `server/server.ts` | Deno native | Deno Deploy |

`src/shared/` is compiled into **both** bundles — keep code here runtime-agnostic (no DOM/browser APIs, no Deno APIs). Server imports it via `../src/shared/...`; client via `./shared/...`.

### Directory map (`src/`)

- `app.ts` — entry point: game loop, timers, audio orchestration
- `router.ts` — screen routing + **capture-phase** click delegation (single `document.addEventListener("click", handler, true)` — checks `[data-draft-card-id]`, `[data-hand-card-id]`, `[data-board-cell]`; avoid adding per-element click listeners, that's how double-fire bugs got introduced before)
- `state.ts` — all game state as module-level variables with getter/setter exports (no framework, no reactivity — UI updates via explicit `rerenderGameShell()`)
- `arena/` — board/hand/draft rendering (`render.ts`, `extra-panels.ts`)
- `screens/` — `dashboard.ts`, `lobby.ts`, `onlineGame.ts`
- `audio/gameAudio.ts` — SFX (`playGameSound(name)`, throttled ~100ms) + singleton looping BGM, mute/volume in localStorage
- `online/` — multiplayer client: `socketClient.ts` (WS transport), `lobbyClient.ts`, `localRoom.ts`, `spAdapter.ts` / `snapshotAdapter.ts` (adapt single-player state to the same room-snapshot shape used online)
- `export/certificate.ts` — exports the finished board as a travel-plan certificate
- `services/` — `game-timer.ts`, `timer-service.ts`, `animation-controller.ts`
- `shared/` — dual-runtime game logic: `types.ts`, `client-types.ts`, `constants.ts`, `board.ts`, `deck.ts`, `draft.ts`, `resources.ts`, `rules.ts`, `score.ts`, `scoring.ts`, `dice.ts`, `animations.ts`, `card-mapper.ts`, `data/` (card pool)

### Server (`server/`)

- `server.ts` — HTTP + WS listener, CORS, health endpoint
- `game.ts` — game state machine (draft/placement/scoring relay)
- `rooms.ts` / `player.ts` — room CRUD, player state
- `bot.ts` — AI player logic
- `auth.ts` — auth handling

### Game loop (FSM)

```
LOBBY --START--> DRAFT --5 picks--> PLACEMENT --endDay--> SCORING --next--> DRAFT
                                                              |
                                                       (after Day 5)
                                                              v
                                                          FINISHED
```

- **Draft:** 7 cards dealt, pick 1 per round for 5 rounds (deal anim 1.32s, pass anim 0.94s), then -> placement.
- **Placement:** hand fan at bottom; click card then board cell (current day column) to place. Coin debt tracked (penalty at day advance), stamina debt creates a lock token on the next slot.
- **Scoring:** 5-step simulation (debt scan -> random events -> combo scan -> distance scan -> final tally), replayed step-by-step (~850ms/step) before applying score and advancing day/game-over.

### Other conventions

- CSS is authored in Less (`css/style.less` entry) and compiled with `lessc`.
- Audio/media assets are Git LFS-tracked (`assets -> public/assets` symlink); CI checkout must use `lfs: true` or MP3s/videos are served as pointer files.
- Service worker (`sw.js`) is network-first with offline fallback; bump the `trekkopoly-vN` cache name on content changes to flush stale LFS pointers from cache.
- `TREKPOLOGY/` is the original reference codebase — deferred cleanup, don't build new features there.
- `.internal/TODO.md` tracks outstanding work items by priority tier.

### Reference docs

- `ARCHITECTURE.md` — fuller architecture notes (CI/CD workflows, design decisions)
- `TYPES.md` — type reference for shared types, state slices, and the WebSocket message protocol
- `docs/game-logic-design.md` — source of truth for game rules
