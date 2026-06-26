# TREKPOLOGY — Lữ Khách Bàn Cờ

A location-based travel strategy board game — delivered as a Progressive Web App.

Plan a virtual travel itinerary by drafting Location Cards, managing resources (Xu, Stamina), arranging cards on a 5×5 grid board, and scoring Victory Points (VP). Export your final board layout as a real-world travel plan: *Play to Plan.*

Built by a university team for the Computational Thinking course.

## Game Loop

```
LOBBY ──START──▶ CINEMATIC ──▶ DRAFT (5 rounds) ──▶ PLANNING ──endDay──▶ SIMULATION ──▶ RESULT ──▶ DRAFT
                                                                                              │
                                                                                       (after Day 5)
                                                                                              ▼
                                                                                           GAMEOVER
```

| Phase | What happens |
|---|---|
| **Cinematic** | Opening sequence |
| **Draft** | 7 cards dealt, pick 1 per round, 5 rounds — remaining cards pass clockwise (online) or bots draft from shared deck (single-player) |
| **Planning** | Place drafted cards on a 5 time slots × 5 days board grid. Each slot costs Xu and Stamina. Empty slots incur debt tokens. |
| **Simulation** | Debt scan → random events → combo scan → distance penalty → final VP tally |
| **Result** | Board export as real travel plan — *Play to Plan* |
| **GameOver** | Final ranking and summary |

After Day 5, the game ends. Scores are tallied and the player with the most VP wins.

## Tech Stack

| Layer | Choice |
|---|---|
| **Frontend** | Vanilla TypeScript + Less + DOM (no framework) |
| **Backend** | Node.js + Socket.IO + tsx |
| **Database** | None — auth via JSON file (PBKDF2 + JWT) |
| **Build** | tsc (no bundler) + lessc |
| **Offline** | Service Worker (network-first) |
| **Deployment** | Hugging Face Spaces Docker (server), GitHub Pages (frontend) |
| **Testing** | Vitest (112 unit tests across 8 files) |
| **Assets** | Card images via Git LFS (103 Saigon phase-1 cards) |

## Repository Structure

```
compthink-2026/
├── src/                # Client TypeScript source
│   ├── app.ts          # Main orchestration (~5K lines)
│   ├── game/           # Pure game logic: board, deck, draft, scoring, resources, queries
│   ├── actions/        # State-mutation actions: cardPlacement, debtTokens, utilityEffects
│   ├── ui/             # DOM rendering: arena, screens, cards, dashboard
│   ├── audio/          # Web Audio API + <audio> BGM
│   ├── data/           # Card definitions (103 phase-1 Saigon cards) + images
│   ├── online/         # Socket.IO client
│   ├── state/          # GameState singleton (96-field flat interface)
│   ├── styles/         # Less stylesheets (client.less, dashboard.less, mapSelection.less)
│   ├── export/         # Travel certificate & timeline export
│   └── types.ts        # Shared type definitions
├── server/             # Node.js + Socket.IO backend
│   ├── index.ts        # HTTP + Socket.IO entry, /health endpoint
│   ├── rooms.ts        # Room lifecycle (create, join, leave, card placement)
│   ├── gameEngine.ts   # Game state factories (board, deck, player, view projections)
│   ├── draftEngine.ts  # Draft state machine (pool creation, rotation, pick/confirm)
│   ├── timerEngine.ts  # Simulation tick (scoring, events, day transitions)
│   ├── auth.ts         # PBKDF2 + JWT auth
│   └── types.ts        # Socket.IO wire event types
├── assets/             # Card images (LFS), sounds, backgrounds, videos
├── build/              # Compiled output (gitignored)
├── docs/               # ADRs, architecture docs, meeting notes, POCs
│   ├── ARCHITECTURE-REFERENCE.md  # Deep-dive architecture notes
│   ├── adr/            # Architecture Decision Records
│   └── game-logic-design.md      # Game rules (source of truth)
├── Dockerfile          # Server container for Hugging Face Spaces
├── .github/workflows/  # CI/CD (ci.yml, deploy-pages.yml, deploy-server.yml)
└── vitest.config.ts    # Test configuration
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 22
- **npm** (ships with Node.js)
- **Git LFS** for card image assets (`git lfs install`)

### Build the Client

```bash
git clone https://github.com/TanKhoiTV/compthink-2026.git
cd compthink-2026
npm install
npm run build       # tsc + lessc → build/
```

### Run Tests

```bash
npm test            # vitest run (112 tests)
npm run test:watch  # vitest --watch
```

### Run Locally (Frontend Only)

```bash
# Terminal 1: Build + watch TypeScript
npm run dev:tsc

# Terminal 2: Build + watch CSS
npm run dev:css

# Terminal 3: Serve the app
npm run dev:serve   # npx serve . -l 5174
```

Open [http://localhost:5174](http://localhost:5174) in a browser. The app runs in single-player offline mode by default — no server needed.

### Run with Server (Multiplayer)

```bash
# Terminal 1: Build the client
npm run build

# Terminal 2: Start the server
cd server
npm install
npm start           # → localhost:3001

# Terminal 3: Serve the client
cd ..
npx serve . -l 5174
```

Open [http://localhost:5174](http://localhost:5174). The app connects to the local Socket.IO server for multiplayer draft + real-time play.

## Project Status

| Milestone | Target | Status |
|---|---|---|
| Proof of Concept | 16 May 2026 | ✅ Complete |
| MVP | 30 May 2026 | ✅ Complete |
| Final Delivery | 27 June 2026 | ✅ Delivered |

## Documentation

Start with:

1. [ARCHITECTURE.md](ARCHITECTURE.md) — high-level architecture overview
2. [docs/ARCHITECTURE-REFERENCE.md](docs/ARCHITECTURE-REFERENCE.md) — deep-dive: dual game loop, animations, online/single-player split
3. [docs/game-logic-design.md](docs/game-logic-design.md) — game rules, card system, scoring, campaign structure
4. [docs/adr/](docs/adr/) — Architecture Decision Records

## License

MIT — see [LICENSE](LICENSE).
