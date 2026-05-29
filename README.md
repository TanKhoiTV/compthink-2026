# Traveling Game

A location-based travel strategy board game — delivered as a **Progressive Web App**.

Plan a virtual travel itinerary by drafting Location Cards, managing resources (Xu, Stamina), arranging cards on a 5×5 grid board, and scoring Victory Points (VP). Export your final board layout as a real-world travel plan: *Play to Plan.*

Built by a university team for the Computational Thinking course.

## Concept

| What | How |
|---|---|
| **Drafting** | 5 rounds of clockwise passing, 3 options per pick |
| **Board Building** | Arrange cards on a 5×5 grid (5 time slots × 5 days) |
| **Resource Management** | Balance Xu and Stamina; borrow Xu with Debt Tokens |
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

**Shared logic** (`scr/shared/`) — board, rules, scoring, dice — runs on both client and server. Optimistic client with authoritative server validation.

## Project Status

| Milestone | Target |
|---|---|
| Proof of Concept | 16 May 2026 |
| MVP | 30 May 2026 |
| Final Delivery | 27 June 2026 |

## Getting Started

```
docs/
├── adr/                  # Architecture Decision Records
├── poc/                  # Proof-of-concept docs
│   └── ui-docs/          # UX/UI specifications
├── game-logic-design.md  # Game mechanics & rules (source of truth)
├── architecture.html     # System architecture diagram
└── meetings/notes/       # Sprint notes and discussions
```

Start with:
1. [`docs/game-logic-design.md`](docs/game-logic-design.md) — game rules, card system, scoring, campaign structure
2. [`docs/team-scoping-plan.html`](docs/team-scoping-plan.html) — top-down view of domains and deliverables
3. [`docs/architecture.html`](docs/architecture.html) — system diagram with module descriptions
4. [`docs/adr/001-frontend-client.md`](docs/adr/001-frontend-client.md) — frontend architecture decision
5. [`docs/adr/002-backend.md`](docs/adr/002-backend.md) — backend architecture decision

## License

MIT — see [LICENSE](LICENSE).
