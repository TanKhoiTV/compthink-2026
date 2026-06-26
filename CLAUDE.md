# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Read this first — where the real game lives

**The live, actively-developed game is `TREKPOLOGY/`.** Everything in the repo root (`src/`, `server/`, `css/`, `rollup.config.js`, root `ARCHITECTURE.md`, etc.) is an **older, non-deployed codebase** — do **not** treat it as the source of truth and do not develop against it unless explicitly asked.

Evidence this is the case (so future instances don't get misled again):
- `.github/workflows/deploy-pages.yml` builds from `working-directory: TREKPOLOGY` and ships it: `cp -r TREKPOLOGY/* _site/`. **That is the deployed site.**
- The actual game content (5,900-line `TREKPOLOGY/src/data/cards.phase1.ts`, card images, card frames, draft/timer engines) and the most recent commits live under `TREKPOLOGY/`.
- The root `ARCHITECTURE.md` describes a *different* stack (Rollup + Deno + raw WebSocket/JSON-RPC) that is **not what runs**. It is stale; trust the deploy workflow and git history over it.

The two stacks are easy to confuse because both have `src/`, `server/`, and `app.ts`. The table below disambiguates.

| | **`TREKPOLOGY/` (LIVE)** | root (legacy, non-deployed) |
|---|---|---|
| Frontend build | `tsc` → `build/` + `lessc` + **Vite** | **Rollup** IIFE bundle |
| Client entry | `TREKPOLOGY/src/app.ts` → `build/app.js` (ESM module) | `src/app.ts` → `build/client.js` (IIFE) |
| Server | **Node.js + Socket.IO** (`tsx`) | Deno + raw WebSocket + JSON-RPC |
| Deployed by CI | ✅ yes | ❌ no |

---

## Commands (all paths under `TREKPOLOGY/`)

### Frontend
```bash
cd TREKPOLOGY
npm install                 # first time only
npm run build               # tsc && lessc src/styles/client.less build/client.css && vite build
npm run dev                 # vite dev server (default :5173)
npm run dev:tsc             # tsc --watch → build/  (use with dev:css + dev:serve)
npm run dev:css             # watch Less → build/client.css
npm run dev:serve           # npx serve . -l 5174  (static serve of the folder)
```

`TREKPOLOGY/index.html` loads `./build/app.js` (a `type="module"` script) and `./build/client.css` directly, and pulls Socket.IO from a CDN. So the simplest reliable way to *run* it:
```bash
cd TREKPOLOGY
npm install && npm run build
npx serve . -l 5174         # then open http://localhost:5174
```
For iterative work, run `dev:tsc`, `dev:css`, and `dev:serve` in three terminals (edits to `src/*.ts` or `src/styles/*.less` rebuild into `build/`, then refresh the browser).

### Online server (Node + Socket.IO)
```bash
cd TREKPOLOGY/server
npm install                 # first time only
npm run dev                 # tsx index.ts  → Socket.IO server on http://localhost:3001
```
- Server listens on `PORT` env or **3001**; CORS origin is `*`.
- The client connects to a hard-coded `io("http://localhost:3001")` in `src/online/socketClient.ts`. In CI, `deploy-pages.yml` rewrites that URL to the production server before deploying.

There are no automated tests or lint scripts wired into `TREKPOLOGY/package.json`.

## Architecture (TREKPOLOGY)

- **No framework** — vanilla TypeScript with direct DOM manipulation. Frontend entry is `src/app.ts`; subsystems are split into `src/game/` (rules/state/loop), `src/ui/` (renderers, modals, HelpBubble/OnboardingModal), `src/online/` (Socket.IO client), `src/audio/`, `src/export/` (final board → travel itinerary), `src/data/` (card pool, mappers).
- **Authoritative server, optimistic client.** The Node/Socket.IO server (`server/`) owns multiplayer truth: `gameEngine.ts` (state machine), `draftEngine.ts` (draft round logic), `timerEngine.ts` (turn/draft timers), `rooms.ts` (room CRUD), `auth.ts` (login/accounts). Single-player runs entirely client-side.
- **Game flow:** draft location cards (clockwise passing, 3 picks/round) → place on a 5×5 grid (time slots × days) → manage resources (Xu, Stamina) → simulate & score Victory Points → export the board as a real travel itinerary.
- **Card data** is the bulk of the content: `src/data/cards.phase1.ts` (Saigon set) plus `cardMapper.ts` mapping card ids to image assets under `assets/cards/saigon/<category>/`.

## Assets & deploy notes

- Card images, backgrounds, videos, and audio live in `TREKPOLOGY/assets/` and are **Git LFS-tracked** — CI checkout needs `lfs: true` or LFS pointer files get served instead of real media.
- `index.html` references `assets/backgrounds/lobby-background.jpg`, `assets/chuyencanh2.mp4` (cinematic transition), and the CDN Socket.IO script. Missing assets surface as 404s in the console but don't block the splash screen.
- `sw.js` is a service worker (PWA/offline). Bump its cache version on content changes to avoid serving stale/poisoned cached files.

## Conventions

- **Conventional Commits**, lowercase imperative, no trailing period: `feat(cards): ...`, `fix(trekpology): ...`, `docs: ...`. Common scopes: `cards, game, trekpology, deploy, media, ui, data`.
- `main` is protected; **squash-merge** PRs (one commit per PR); delete feature branches after merge. See `CONTRIBUTING.md`.

## When the root (legacy) codebase matters

Only touch the repo-root `src/`, `server/`, `rollup.config.js`, `vitest.config.ts`, etc. if the user explicitly asks about the old stack. Its commands (`npm run build`/`lint`/`test` at root, `deno task` in root `server/`) are documented in the root `ARCHITECTURE.md`, but that code is **not deployed**.
