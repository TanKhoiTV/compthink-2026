# Code Context — compthink-2026

## Project Identity

**compthink-2026** is a **documentation-only repository** for a university-group capstone project called **"Traveling Game"** — a location-based travel strategy board game delivered as a **Progressive Web App (PWA)**.

The core concept: players plan a virtual travel itinerary by drafting Location Cards, managing resources (Gold, Stamina), arranging cards on a 3×5 grid board, and scoring Victory Points (VP). The final board layout is exported as a real-world travel plan ("Play to Plan").

**Repo:** https://github.com/TanKhoiTV/compthink-2026
**License:** MIT (copyright Tran Van Tan Khoi)
**Team:** Product Owner, Frontend Dev, Backend Dev, Data Dev, UI/UX Designers, QA, Game Designer, Analysts

---

## Files Retrieved (complete list)

1. `README.md` (line 1) — One-liner: `# compthink-2026`
2. `CONTRIBUTING.md` (lines 1-73) — Branch/commit naming conventions (Conventional Commits)
3. `LICENSE` (lines 1-21) — MIT License
4. `.internal/README.md` (lines 1-189) — **Separate project** ("Blues Estimator Project" — OLS/Ridge/Lasso from scratch, Python/uv/pytest). Template from prior coursework; not part of this codebase.
5. `.internal/CONTRIBUTING.md` (lines 1-244) — Same: setup & contribution guide for Blues Estimator project.
6. `.internal/AGENTS.md` (lines 1-30) — Agent instructions for LLM tooling (squash merge, context management, `.internal` exclusion).
7. `docs/poc/1_ProblemStatement.md` — Market gap analysis: travel apps are passive/robotic; no product combines tactical gameplay with real itinerary output.
8. `docs/poc/2_Constraints_Assumptions.md` — Simulation uses static coordinates (no GPS API dependency). POC scope: Phase 1 = Ho Chi Minh City. Single-player + hotseat multiplayer. Mobile-first PWA.
9. `docs/poc/3_SolutionProposal.md` — Three-module solution: Resource Management (Gold/Stamina), Spatial Planning (3×5 grid, drag-drop), Simulation & Verification (distance penalties, random events, itinerary export).
10. `docs/poc/4_TargetAudience_UseCases.md` — Seven user groups: Player, Moderator, Maintainer, Examiner, Data Provider, Analyst, Content Manager. MVP targets the core gameplay loop.
11. `docs/poc/5_overview.md` — System topology: **Build Pipeline** (Makefile → tsc/lessc/rollup) → **Client** (Browser) ↔ **Server** (Deno) via WebSocket + JSON-RPC 2.0, with **Shared Logic** (`src/`) running on both sides. Optimistic client / authoritative server pattern.
12. `docs/poc/5(BE)_Detailed_Infrastructure.md` — Backend modules: `server.ts` (HTTP+WS), `game.ts` (Room FSM), `player.ts` (per-socket RPC). Shared: `board.ts`, `rules.ts`, `score.ts`, `dice.ts`.
13. `docs/poc/5(FE)_Detailed_Infrastructure.md` — Frontend modules: `index.html`, `app.ts` (UI coordinator), `multi.ts` (WebSocket RPC), `client.css`, `sw.js` (Service Worker), `img/`. Build: tsc, lessc, rollup.
14. `docs/poc/6_Feasibility_Risks.md` — Risk analysis: gameplay complexity, resource balancing, itinerary realism, data accuracy, session compatibility, leaderboard cheating.
15. `docs/poc/8(BE)_TechnicalDecision.md` — Backend ADRs: Deno runtime, WebSocket+JSON-RPC 2.0, custom FSM in `game.ts`, Docker packaging.
16. `docs/poc/8(FE)_TechnicalDecision.md` — Frontend ADRs: Vanilla TypeScript (no framework), Less+CSS Grid, Optimistic UI, Service Worker cache-first.
17. `docs/poc/poc.md` — Stub (just "# Proof of Concept\n\n_Version 0.1_")
18. `docs/poc/ui-docs/5_3(UI)_UserExperience_DataFlow.md` — Detailed UX flow: login → drafting → board building → resource management → simulation → results. Color palette, card-based UI, drag-drop, real-time feedback.
19. `docs/poc/ui-docs/8(UI)_TechnicalDecisions.md` — UI tech decisions: design system (earthy travel theme), typography (Be Vietnam Pro + Inter), card-based interface, Figma.
20. `docs/adr/001-frontend-client.md` — ADR 001 (Proposed): Frontend as PWA with SvelteKit + Vite + vite-plugin-pwa + Dexie.js + Service Worker. "Fetch once, run local."
21. `docs/adr/002-backend.md` — ADR 002 (Proposed): Backend as PocketBase on VPS (Nginx + Certbot + SQLite). Covers IF-1 through IF-4.
22. `docs/architecture.html` — Full system architecture diagram (SVG) + module descriptions. Client domain (PWA Shell, Service Worker, IndexedDB, State Manager, Location Engine, Quest FSM, Scoring, Analytics Queue, Version Check) and Backend domain (Nginx, PocketBase REST API, Admin UI/CMS, SQLite, File Storage).
23. `docs/team-scoping-plan.html` — Scoping plan brief: 4 domains (Client, Backend, Data, Cross-Cutting), 3 data flows (Bootstrap, Game Loop, Analytics), 4 interfaces (IF-1..IF-4), role map with 7 roles.
24. `docs/meetings/notes/sprint02.typ` — Sprint 2 meeting notes (Vietnamese). Team roles assigned, GitHub Project setup, repo rules, user group analysis task, milestones (POC: 16/5, MVP: 30/5, Final: 27/6).
25. `docs/meetings/notes/architecture.typ` — Architecture discussion notes: Frontend (PWA), Backend (PocketBase), Game Mechanic, Testing.
26. `docs/meetings/notes/core-services.md` — Architecture overview memo: fetch-once run-local pattern, role→component mapping table.
27. `docs/proof-of-concept-draft.md` — Draft POC doc.
28. `docs/proof-of-concept-draft (1).md` — Another copy.

---

## Key Architecture Points

### Frontend (per ADR 001 and FE docs)
- **Stack:** Vanilla TypeScript + Less + CSS Grid + Rollup + Service Worker
- **State:** Vanilla TS (`app.ts`), no framework — but separate notes mention SvelteKit in the ADR
- **Offline:** Service Worker (cache-first), IndexedDB via Dexie.js
- **Build pipeline:** tsc → lessc → rollup → client.js + client.css + sw.js
- **Key modules:** `app.ts` (UI coordinator), `multi.ts` (WebSocket RPC), `board.ts`/`rules.ts`/`score.ts`/`dice.ts` (shared logic)

### Backend (per ADR 002 and BE docs)
- **Stack:** Deno (TypeScript runtime) + WebSocket + JSON-RPC 2.0
- **Key modules:** `server.ts` (HTTP+WS listener), `game.ts` (Room FSM), `player.ts` (per-socket handler)
- **Deployment:** Docker container
- **Shared logic:** Same `src/` directory (`board.ts`, `rules.ts`, `score.ts`, `dice.ts`) runs on both client and server

### Four Interfaces (IF-1 through IF-4)
| IF | Direction | Purpose |
|----|-----------|---------|
| IF-1 | Backend → Client | Versioned game content bundle download (bootstrap) |
| IF-2 | Data Platform → Backend | Internal content schema & bundle transformation |
| IF-3 | Client → Backend | Optional analytics events (fire-and-forget) |
| IF-4 | Client → Backend → Client | Bundle version check on launch |

### Game Loop
1. **Setup:** Choose destination, trip duration
2. **Drafting Phase:** 5 random location cards, keep 1 pass rest (repeat)
3. **Board Building:** Drag-drop cards onto 3×5 grid (3 time slots × 5 days), manage Gold & Stamina
4. **Simulation:** Distance checks, random events, combo multipliers → VP score
5. **Export:** Board layout becomes a real travel itinerary

### Development Status
- **Status:** Documentation/planning phase
- **ADRs:** Proposed (not yet decided)
- **Milestones:** POC 16/5, MVP 30/5, Final 27/6 (dates are in 2026)
- **Team:** University group with ~7 members

---

## What is NOT in this repo

- **No source code** — no `.py`, `.ts`, `.js`, `.html`, `.css` files (only documentation)
- **No `pyproject.toml`**, `requirements.txt`, or any package config
- **No notebooks** (`.ipynb`)
- **No `tests/` directory**
- **No `report/` directory**
- **No `part2/data/` directory**
- `.internal/README.md` describes a *different* project ("Blues Estimator Project" — Python OLS regression). It was likely a template from a prior course assignment and is not part of this codebase.

---

## Start Here

To contribute documentation or understand the project vision, begin with:

1. **`docs/team-scoping-plan.html`** — top-down: domains, data flows, interfaces, deliverables, role map
2. **`docs/architecture.html`** — system diagram, all modules on both sides, interface contracts
3. **`docs/adr/001-frontend-client.md`** — frontend architecture decision (PWA with SvelteKit)
4. **`docs/adr/002-backend.md`** — backend architecture decision (PocketBase)
5. **`docs/poc/3_SolutionProposal.md`** — game mechanics in plain language
6. **`docs/poc/ui-docs/5_3(UI)_UserExperience_DataFlow.md`** — UX flow and data flow

For README.md: describe the Traveling Game concept, list the team's chosen stack (Deno backend, Vanilla TS frontend, Service Worker PWA, PocketBase), link to the architecture docs, and note the milestone dates.

For CONTRIBUTING.md: the existing `CONTRIBUTING.md` at root is a generic branch/commit naming guide. The detailed contribution guide in `.internal/CONTRIBUTING.md` (with uv setup, black/ruff linting, pytest, docstrings) belongs to the *other* project and should not be copied. A fitting CONTRIBUTING.md for this project would cover: documentation PR workflow, ADR change process, and interface contract modification protocol.
