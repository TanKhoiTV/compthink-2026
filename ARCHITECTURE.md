# Trekkopoly Architecture

> **Reference:** [`docs/ARCHITECTURE-REFERENCE.md`](docs/ARCHITECTURE-REFERENCE.md) for game loop details, state management, server/client architecture, animations, audio, auth, and key technical decisions.

> Current architecture as of June 2026.

---

## Overview

Trekkopoly is a location-based travel strategy board game delivered as a Progressive Web App. Players draft Location Cards, manage resources (Xu, Stamina), arrange cards on a 5×5 grid board, and score Victory Points (VP). The final board layout can be exported as a real-world travel plan: *Play to Plan.*

### Game Loop

```
LOBBY ──START──▶ CINEMATIC ──▶ DRAFT (5 rounds) ──▶ PLANNING ──endDay──▶ SIMULATION ──▶ RESULT ──▶ DRAFT
                                                                                              │
                                                                                       (after Day 5)
                                                                                              ▼
                                                                                           GAMEOVER
```

**Draft phase:** 7 cards dealt, pick 1 per round, 5 rounds — remaining cards pass clockwise. No rotation in single-player (4 bots each get their own pool from the shared deck).

**Planning phase:** Place drafted cards onto a 5 time slots × 5 days board grid. Each slot costs Xu and Stamina. Empty slots incur debt tokens.

**Simulation (scoring):** Debt scan → random events → combo scan → distance scan → final tally.

---

## Directory Structure

```
├── src/               # Client TypeScript source
│   ├── app.ts         # Monolithic controller (state, render, AI, drag-and-drop, online sync)
│   ├── game/          # Pure game logic (board, deck, draft, scoring, resources)
│   ├── online/        # Socket.IO client (socketClient.ts)
│   ├── data/          # Card definitions (103 phase 1 cards) + mapping
│   ├── ui/            # UI components (dashboard, help, onboarding)
│   ├── audio/         # Web Audio API + <audio> BGM
│   ├── export/        # Travel certificate & timeline export
│   └── styles/        # Less stylesheets
├── server/            # Node.js + Socket.IO backend
│   ├── index.ts       # HTTP + Socket.IO entry, /health endpoint
│   ├── rooms.ts       # Room lifecycle (create, join, leave, card placement, auth)
│   ├── gameEngine.ts  # Game state factories (board, deck, player, view projections)
│   ├── draftEngine.ts # Draft state machine (pool creation, rotation, pick/confirm)
│   ├── timerEngine.ts # Simulation tick (scoring, events, day transitions)
│   ├── auth.ts        # PBKDF2 + JWT (crypto.subtle, no external deps)
│   └── types.ts       # Socket.IO wire event types (client ↔ server contract)
├── assets/            # Static assets (sounds, card images, backgrounds, videos)
├── build/             # Compiled output (tsc + lessc)
├── dist/              # Deployable frontend bundle
├── docs/              # Documentation, ADRs, meeting notes, POC
└── .github/workflows/ # CI/CD workflows
```

---

## Build Pipeline

The project uses a minimal toolchain — no bundler, no framework:

| Step | Tool | Input | Output |
|------|------|-------|--------|
| TypeScript compilation | `tsc` | `src/**/*.ts` | `build/**/*.js` |
| Less compilation | `lessc` | `src/styles/client.less` | `build/client.css` |

```bash
npm run build   # Runs: tsc && lessc src/styles/client.less build/client.css
npm run dev:tsc # Watch mode for TypeScript
npm run dev:css # Watch mode for Less
```

---

## Game State Management

No framework. All game state lives in **module-level variables** in `src/app.ts`:

- Game phase, board grid, hand cards, draft pool, resources, simulation results
- UI interaction state (selected card, drag state, timer state)
- Render functions read these variables and produce DOM

---

## Event Delegation

A single **capture-phase click delegation** handles all game interactions:

```typescript
document.addEventListener("click", handler, true);
```

Elements use `data-*` attributes to signal intent. This eliminates double-fire bugs and keeps event wiring in one place.

---

## Server Architecture

| Module | Responsibility |
|--------|---------------|
| `server/index.ts` | HTTP + Socket.IO entry, /health endpoint, socket binding |
| `server/rooms.ts` | Room lifecycle: create, join, leave, card placement, auth |
| `server/gameEngine.ts` | Game state factories: board, deck, player, view projections |
| `server/draftEngine.ts` | Draft state machine: pool creation, rotation, pick/confirm |
| `server/timerEngine.ts` | Simulation tick: scoring, events, day transitions |
| `server/auth.ts` | PBKDF2 + JWT (crypto.subtle, no external deps) |
| `server/types.ts` | Socket.IO wire event types (client ↔ server contract) |

**Cross-layer dependency:** `server/gameEngine.ts` imports `src/data/cards.phase1.ts` and `src/data/cardMapper.ts` — the server depends on client directory files to avoid duplicating card definitions. Other server modules stay within `server/`.

---

## Deployment

| Target | Platform | Method | Auto-deploy |
|--------|----------|--------|-------------|
| Frontend (static PWA) | GitHub Pages | deploy-pages.yml: build → _site/ → upload-pages-artifact | Push to main |
| Server (Socket.IO) | Hugging Face Spaces | deploy-server.yml: git push to HF Space repo | Push to main touching server/, src/data/, src/types.ts, or Dockerfile |

> See [`docs/ARCHITECTURE-REFERENCE.md`](docs/ARCHITECTURE-REFERENCE.md) for Dockerfile details, server sync workflow, and deployment deep dive.

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | Outcome |
|----------|---------|---------|
| `ci.yml` | PR / push to main | `npm ci` + `npm run build` (single job) |
| `deploy-pages.yml` | Push to main | Build + deploy to GH Pages |
| `deploy-server.yml` | Push to main, paths: server/**, src/data/**, src/types.ts, Dockerfile | Sync to HF Space |

> See [`docs/ARCHITECTURE-REFERENCE.md`](docs/ARCHITECTURE-REFERENCE.md) for CI/CD workflow status and historical context.

---

> Design decisions, game loop, animations, audio, and auth details are
> documented in [`docs/ARCHITECTURE-REFERENCE.md`](docs/ARCHITECTURE-REFERENCE.md).

## Architectural Invariants

These rules must hold across all changes to the codebase:

- **No framework.** The client uses vanilla DOM manipulation. No React, Vue, Preact, or Svelte. The bundle stays self-contained without framework dependencies.
- **Capture-phase delegation.** All click interactions route through a single `document.addEventListener("click", handler, true)`. Elements signal intent via `data-*` attributes.
- **Shared module scope.** Game state lives in module-level variables in `src/app.ts`. No class instances or state management libraries.
- **Cross-layer dependency tolerated.** The server imports card definitions from `src/data/` to avoid duplication. All other server modules stay within `server/`.
- **Socket.IO only.** The sole client-server transport is Socket.IO. No REST, no GraphQL, no WebRTC.
- **No database.** Auth users persist in a JSON file (`server/data/users.json`). No SQL, no ORM.
