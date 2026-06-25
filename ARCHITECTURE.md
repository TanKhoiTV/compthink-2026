# Trekkopoly — Architecture

## Overview

Trekkopoly is a travel itinerary board game built as a **single-page web app** with a **Node.js/Socket.IO multiplayer server**. The client is vanilla TypeScript with no framework — plain DOM manipulation. Single-player runs entirely client-side. Online mode uses Socket.IO for real-time sync.

**Live:** <https://tankhoitv.github.io/compthink-2026/>  
**Server:** <https://khoinguyentran-trekkopoly-old-server.hf.space>  
**Source:** <https://github.com/TanKhoiTV/compthink-2026>

---

## Directory Structure

```
.
├── index.html            # SPA entry point (minimal shell, loads app.js)
├── sw.js                 # Service worker (network-first, offline fallback)
├── manifest.json         # PWA manifest (icons, display mode)
│
├── src/                  # Client source (TypeScript, compiled by tsc)
│   ├── app.ts            # Application controller (monolithic, 321 functions)
│   │                     # State, rendering, bot AI, drag-and-drop, animations
│   ├── types.ts          # Shared types (18 importers across both layers)
│   │
│   ├── game/             # Pure game logic
│   │   ├── board.ts      # BoardSlots, position helpers, tag counting
│   │   ├── deck.ts       # Deck creation, shuffle, daily hand draw
│   │   ├── draft.ts      # Draft pool, rotation, pick logic
│   │   ├── scoring.ts    # 5-step simulation engine
│   │   ├── resources.ts  # Resource/affordability calculations
│   │   └── constants.ts  # STARTING_*, HAND_SIZE, PHASE_DAYS
│   │
│   ├── online/           # WebSocket client (multiplayer)
│   │   └── socketClient.ts  # Socket.IO connection lifecycle, RPC dispatch
│   │
│   ├── data/             # Card definitions and mapping
│   │   ├── cards.phase1.ts  # 103 Saigon phase 1 card objects
│   │   ├── cards.all.ts    # Query helpers (by phase pool, tag, id)
│   │   └── cardMapper.ts   # GameCardData → UI display data
│   │
│   ├── ui/               # UI components
│   │   ├── dashboard.ts     # Lobby/dashboard screen
│   │   ├── mapSelection.ts  # Region selection screen
│   │   ├── HelpBubble.ts    # Contextual help overlay
│   │   └── OnboardingModal.ts  # First-time tutorial
│   │
│   ├── audio/            # Audio engine
│   │   └── gameAudio.ts  # Web Audio API + <audio> element, BGM
│   │
│   ├── export/           # Travel certificate export
│   │   └── certificate.ts  # HTML certificate + timeline text export
│   │
│   └── styles/           # Less stylesheets
│       ├── client.less      # Main game styles (board, cards, draft)
│       ├── dashboard.less   # Lobby/dashboard layout
│       └── mapSelection.less # Map selection screen
│
├── server/               # Node.js server (Socket.IO)
│   ├── index.ts          # Entry point: HTTP server + Socket.IO binding, /health
│   ├── types.ts          # Socket.IO wire event types
│   ├── gameEngine.ts     # Game state factories (board, deck, player)
│   ├── draftEngine.ts    # Draft state machine (create, rotate, select, confirm)
│   ├── timerEngine.ts    # Simulation tick + scoring + day transition
│   ├── rooms.ts          # Room lifecycle (create, join, leave, card ops)
│   ├── auth.ts           # PBKDF2 + JWT auth (no external deps)
│   ├── package.json      # Server dependencies (socket.io, tsx, typescript)
│   ├── tsconfig.json     # Server TypeScript config
│   └── hf-readme.md      # HF Space metadata README (copied to root on deploy)
│
├── assets/               # Static assets (Git LFS-tracked)
│   ├── cards/saigon/     # 117 card JPEGs (action, culture, food)
│   ├── backgrounds/      # Lobby/game backgrounds
│   ├── sounds/           # 12 MP3 sound effects + BGM
│   ├── videos/           # Cinematic transition videos
│   ├── chuyencanh.mp4    # Cinematic intro
│   └── chuyencanh2.mp4   # Cinematic outro
│
├── TREKPOLOGY/           # Brand assets only (card frame templates)
│   └── assets/cardFrames/  # Per-tag frame overlays (action, culture, food, utility)
│
├── .archive/             # Archived v1 refactor code
│   └── TREKKOPOLY-v1-refactor/  # Pre-restructure Deno + Rollup + PocketBase code
│
├── docs/                 # Design docs, decisions, notes
│   ├── game-logic-design.md  # Source of truth for game rules
│   ├── adr/              # Architecture Decision Records
│   └── ...               # Meeting notes, POC docs
│
├── Dockerfile            # HF Space container (Node 22 Alpine)
├── package.json          # npm scripts: build (tsc + lessc)
├── tsconfig.json         # TypeScript config
└── .github/workflows/    # CI/CD
    ├── ci.yml            # Build check (on push/PR)
    ├── deploy-pages.yml  # Deploy frontend to GitHub Pages
    └── deploy-server.yml # Deploy server to HF Space
```

---

## Build Pipeline

No bundler. Two sequential compilation steps:

```
npm run build
  ├── tsc                   → src/*.ts  → build/app.js + build/types.js
  └── npx lessc ...         → src/styles/client.less → build/client.css
```

- TypeScript compiles from `src/` to `build/` (folder-to-folder, `tsconfig.json`).
- Less compiles only `client.less` (which imports `dashboard.less`, `mapSelection.less`).
- Build output: `build/app.js` (288 KB), `build/types.js` (11 B), `build/client.css` (376 KB).
- No Rollup, no Vite, no Webpack — plain `tsc` + `lessc`.

---

## Game State Management

State is managed via **module-level variables** in `src/app.ts`:

```
Key state slices (module-level variables in app.ts):
  ├── Game phase           → "lobby" | "cinematic" | "draft" | "planning" | "simulation" | "result" | "gameover"
  ├── Board                → 5×5 grid of (TravelCard | null) per player
  ├── Hand                 → Array of TravelCard (5 cards after draft)
  ├── Draft pool           → 7→6→5→4→3 cards per round
  ├── Simulation result    → { replaySteps, totalVP, ... }
  ├── Resources            → Xu, Stamina scores
  └── UI interaction       → Selected/focused card ids, hold timer, drag state
```

No state management framework — module-level `let` variables with direct mutation. The render layer reads these variables to build DOM, never mutates state directly.

---

## Event Delegation

Click handling uses **capture-phase** delegation:

```typescript
document.addEventListener("click", handler, true);
```

This single handler:

1. Checks for `[data-draft-card-id]` → draft card selection
2. Checks for `[data-hand-card-id]` → hand card selection (placement)
3. Checks for `[data-board-cell]` → board cell click (place card)
4. Checks for `[data-discard]` → discard card

No per-element `addEventListener("click")`. This eliminates double-fire bugs.

---

## Server Architecture

```
server/index.ts
  ├── HTTP server (http.createServer) + /health endpoint
  └── Socket.IO server (io() on the same HTTP server)
        ├── connection → bindSocketPlayer() — wires socket events
        │     ├── rooms.ts:  createRoom, joinRoom, leaveRoom, startGame
        │     ├── draftEngine.ts:  selectDraftCard, confirmDraftPick
        │     ├── rooms.ts:  placeCard, discardCard, payDebt, confirmPlanning
        │     └── timerEngine.ts:  simulation, scoring, day transitions
        └── emitRoomState() — broadcasts state to all players
```

**Cross-layer dependency:** `server/gameEngine.ts` imports `src/data/cards.phase1.ts` (which reaches `src/types.ts` through its imports). This works because `tsx` resolves relative paths at runtime.

**Auth:** HTTP-only, separate from Socket.IO. PBKDF2 password hashing + JWT-style tokens via `crypto.subtle`. Users stored in `server/data/users.json`.

---

## Deployment

| Target | Platform | Method | Auto-deploy |
|--------|----------|--------|-------------|
| Frontend (static PWA) | GitHub Pages | `deploy-pages.yml`: build → `_site/` → `upload-pages-artifact` | Push to `main` |
| Server (Socket.IO) | Hugging Face Spaces | `deploy-server.yml`: git push to HF Space repo | Push to `main` touching `server/`, `src/data/`, `src/types.ts`, or `Dockerfile` |

**HF Space details:**

- SDK: Docker (Node 22 Alpine)
- `app_port: 7860`
- Health endpoint: `/health` (returns 200 "ok")
- Auth: `HF_TOKEN` secret in GitHub

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | Outcome |
|----------|---------|---------|
| `ci.yml` | PR / push to main | `npm ci` + `npm run build` (single job) |
| `deploy-pages.yml` | Push to main | Build + deploy to GH Pages |
| `deploy-server.yml` | Push to main, paths: server/**, src/data/**, src/types.ts, Dockerfile | Sync to HF Space |

---

## Key Design Decisions

- **No framework** — pure TypeScript DOM manipulation, minimal dependencies
- **Capture-phase event delegation** — prevents double-fire from per-element listeners
- **Cross-layer server/client types** — `src/data/cards.phase1.ts` and `src/types.ts` shared by both via tsx path resolution
- **Monolithic app.ts** — single controller handles all screens (not separate router/screens). Known area for improvement.
- **Card data as TypeScript** — 103 card objects as const arrays, compiled into both client and server bundles
- **No database** — auth users stored as JSON file
- **Squash merge policy** — clean linear history, admin bypass for critical merges

---

## Architectural Invariants

1. **State flows one direction:** Parse → mutate app.ts variables → render. Render never mutates state.
2. **Socket.IO is the sole transport:** No REST API, no HTTP polling.
3. **Single-player is entirely client-side:** No local server process. The server is only needed for online multiplayer.
4. **No bundler:** tsc + lessc. Build output mirrors source structure under `build/`.
5. **Server is not self-contained:** Depends on `src/data/` and `src/types.ts` (client directory).
