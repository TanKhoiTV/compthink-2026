# Trekkopoly Architecture Notes

> Current architecture as of June 2026. Supersedes the Room FSM refactor
> (archived to `.archive/TREKKOPOLY-v1-refactor/`).

> **Quick overview:** [`ARCHITECTURE.md`](../ARCHITECTURE.md) for directory structure, build pipeline, deployment/CI/CD tables, and architectural invariants.

---

## Game Loop

```
LOBBY ──START──▶ CINEMATIC ──▶ DRAFT (5 rounds) ──▶ PLANNING ──endDay──▶ SIMULATION ──▶ RESULT ──▶ DRAFT
                                                                                              │
                                                                                       (after Day 5)
                                                                                              ▼
                                                                                           GAMEOVER
```

**Draft phase:** 7 cards dealt, pick 1 per round, 5 rounds. Sushi Go style — remaining cards pass clockwise. No rotation in single-player (4 bots each get their own pool from the shared deck).

**Planning phase:** Place drafted cards onto a 5 time slots × 5 days board grid. Each slot costs Xu and Stamina. Empty slots take debt tokens.

**Simulation (scoring):** 5-step algorithm runs per player per day:

1. **Debt scan** — each unpaid debt token = -20 VP
2. **Random events** — 15% chance per outdoor card: promo (+10 VP), traffic (-8 stamina), storm (-10 VP)
3. **Combo scan** — per day: FOOD≥2 → +5 VP, CULTURE≥2 → +8 VP, ACTION≥2 → +10 VP
4. **Distance scan** — consecutive outdoor cards >20km apart → -30 VP penalty
5. **Final tally** — sum base VP + events + combos − penalties

---

## State Management

No framework. All game state lives in **module-level variables** in `src/app.ts`:

- Game phase, board grid, hand cards, draft pool, resources, simulation results
- UI interaction state (selected card, drag state, timer state)
- Render functions read these variables and produce DOM

Event handling uses a single **capture-phase click delegation**:

```typescript
document.addEventListener("click", handler, true);
```

---

## Server Architecture

```
server/index.ts          — HTTP + Socket.IO entry, /health endpoint, socket binding
  ├── server/rooms.ts    — Room lifecycle: create, join, leave, card placement, auth
  ├── server/gameEngine.ts — Game state factories: board, deck, player, view projections
  ├── server/draftEngine.ts — Draft state machine: pool creation, rotation, pick/confirm
  ├── server/timerEngine.ts — Simulation tick: scoring, events, day transitions
  ├── server/auth.ts     — PBKDF2 + JWT (crypto.subtle, no external deps)
  └── server/types.ts    — Socket.IO wire event types (client ↔ server contract)
```

**Cross-layer dependencies (server imports from client directory):**

- `server/gameEngine.ts` → `src/data/cards.phase1.ts` (103 card definitions)
- `server/gameEngine.ts` → `src/data/cardMapper.ts` (card UI mapping)
  → Both reach `src/types.ts` transitively through `src/data/` imports

All other server modules (`rooms.ts`, `draftEngine.ts`, `timerEngine.ts`, `index.ts`) use `server/types.ts` for their types — they do not cross the layer boundary. The server has its own Socket.IO wire type definitions separate from client types.

---

## Client Architecture

```
src/app.ts (monolithic controller, 321 functions)
  ├── src/game/          — Pure game logic (board, deck, draft, scoring, resources)
  ├── src/online/        — Socket.IO client (socketClient.ts)
  ├── src/data/          — Card definitions (103 phase 1 cards) + mapping
  ├── src/ui/            — UI components (dashboard, help, onboarding)
  ├── src/audio/         — Web Audio API + <audio> BGM
  ├── src/export/        — Travel certificate & timeline export
  └── src/styles/        — Less stylesheets
```

**Key characteristics:**

- No framework — vanilla DOM manipulation
- `src/app.ts` is 321 functions (state, render, bot AI, drag-and-drop, animations, online sync)
- No bundler — compiled by `tsc` + `lessc`

---

## Animations

| Animation | CSS | Timing | Trigger |
|-----------|-----|--------|---------|
| Draft deal (cards fly in) | `.player-hand--dealing .deal-active` + staggered `.daily-draft-card--N` | 1.32s | After draft pool created |
| Draft pass (cards fly out) | `.player-hand__cards.is-passing` + `draftPassToDeckClean` keyframes | 940ms | After card picked |
| Draft chosen card | `.daily-draft-card--selected` | Instant | On card click |

---

## Audio

- **SFX:** `playGameSound(name)` — 15+ named sounds, throttled per-sound (100ms debounce)
- **BGM:** Singleton `<audio>` element with `loop=true`, 50% default volume
- **Autoplay unlock:** PointerDown/KeyDown delegation on document
- **Files:** 12 MP3 files in `assets/sounds/` + procedural card paper sounds via Web Audio API
- **Source:** `src/audio/gameAudio.ts`

---

## Auth

- **Server:** `server/auth.ts` — PBKDF2 password hashing, JWT creation/verification (crypto.subtle, no deps)
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Client:** `src/online/socketClient.ts` — JWT stored in localStorage, appended as `?token=` to socket connection
- **Persistence:** `server/data/users.json` (JSON file, not a database)
- **Secret:** `AUTH_SECRET` env var (set in HF Space)

---

## Key Technical Decisions

### No framework

The client uses vanilla DOM manipulation. No React, Vue, or Preact. This keeps the bundle small (~290 KB app.js) and avoids framework-specific patterns. All 321 functions in `app.ts` share a single module scope.

### Capture-phase delegation

A single `document.addEventListener("click", handler, true)` handles all game interactions. Elements use `data-*` attributes to signal intent. This eliminates double-fire bugs and keeps event wiring in one place.

### Cross-layer dependency

The server imports `src/data/cards.phase1.ts` and `src/data/cardMapper.ts` directly. This isn't clean separation — the server depends on client directory files — but avoids duplicating 103 card definitions and 30+ type definitions. Works because tsx resolves relative paths at runtime.

### Squash merge on main

Per project policy: all merges to main use squash merge for clean linear history. Admin bypass used for critical merges when remote main is protected.

### No database

Auth users stored in a JSON file (`server/data/users.json`). Acceptable for the scope of this project. A real database would be needed for production scale.
