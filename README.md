# Traveling Game

A location-based travel strategy board game — delivered as a **Progressive Web App**.

Plan a virtual travel itinerary by drafting Location Cards, managing resources (Gold, Stamina), arranging cards on a 3×5 grid board, and scoring Victory Points (VP). Export your final board layout as a real-world travel plan: *Play to Plan.*

Built by a university team for the Computational Thinking course.

## Concept

| What | How |
|---|---|
| **Drafting** | Pick from random Location Cards, build your hand |
| **Board Building** | Arrange cards on a 3×5 grid (3 time slots × 5 days) |
| **Resource Management** | Balance Gold and Stamina as you play |
| **Simulation** | Distance checks, random events, combo multipliers |
| **Scoring** | Maximise VP through clever placement |
| **Export** | Your final board becomes a real travel itinerary |

## Tech Stack

| Layer | Choice |
|---|---|
| **Frontend** | Vanilla TypeScript + Less + CSS Grid + Rollup |
| **Backend** | Deno + WebSocket + JSON-RPC 2.0 |
| **Database** | PocketBase (SQLite) |
| **Offline** | Service Worker (cache-first) + IndexedDB (Dexie.js) |
| **Deployment** | Docker (backend), static host (frontend PWA) |

**Shared logic** (`src/`) — board, rules, scoring, dice — runs on both client and server. Optimistic client with authoritative server validation.

## Project Status

This repository is in the **planning and documentation** phase. No source code yet.

| Milestone | Target |
|---|---|
| Proof of Concept | 16 May 2026 |
| MVP | 30 May 2026 |
| Final Delivery | 27 June 2026 |

## Team

| Role | Focus |
|---|---|
| Product Owner | Vision & prioritisation |
| Frontend Dev | Client app, Service Worker, UI |
| Backend Dev | Server, game logic, PocketBase |
| Data Dev | Content bundles, analytics |
| UI/UX Designers | Visual design, experience flow |
| QA | Testing & validation |
| Game Designer | Mechanics & balancing |
| Analysts | Domain research & scoping |

## Getting Started

This is a documentation-phase repository. To explore the project:

```
docs/
├── adr/               # Architecture Decision Records
│   ├── 001-frontend-client.md
│   └── 002-backend.md
├── poc/               # Proof-of-concept docs
│   ├── 1_ProblemStatement.md
│   ├── 2_Constraints_Assumptions.md
│   ├── 3_SolutionProposal.md
│   ├── ...
│   └── ui-docs/       # UX/UI specifications
├── architecture.html  # System architecture diagram
├── team-scoping-plan.html  # Domain & interface breakdown
└── meetings/notes/    # Sprint notes and discussions
```

Start with:
1. [`docs/team-scoping-plan.html`](docs/team-scoping-plan.html) — top-down view of domains, data flows, interfaces, and deliverables
2. [`docs/architecture.html`](docs/architecture.html) — system diagram with module descriptions
3. [`docs/adr/001-frontend-client.md`](docs/adr/001-frontend-client.md) — frontend architecture decision
4. [`docs/adr/002-backend.md`](docs/adr/002-backend.md) — backend architecture decision
5. [`docs/poc/3_SolutionProposal.md`](docs/poc/3_SolutionProposal.md) — game mechanics in plain language

## License

MIT — see [LICENSE](LICENSE).
