# Virtual Travel Game — Backend Architecture Guide

> **Tech Stack · Backend Roles · Architecture Decision Records · Detailed Infrastructure**

---

## Table of Contents

1. [Realized Tech Stack](#1-realized-tech-stack)
2. [Backend Developer Roles by Module](#2-backend-developer-roles-by-module)
3. [Architecture Decision Records](#3-architecture-decision-records)
4. [Detailed Infrastructure](#4-detailed-infrastructure)
   - 4.1 [Module Map & Responsibilities](#41-module-map--responsibilities)
   - 4.2 [Service Interaction Diagram](#42-service-interaction-diagram)
   - 4.3 [Data Flow per Game Phase](#43-data-flow-per-game-phase)
   - 4.4 [Inter-Module Contracts](#44-inter-module-contracts)
   - 4.5 [Runtime Dependency Graph](#45-runtime-dependency-graph)
   - 4.6 [Error & Penalty Propagation](#46-error--penalty-propagation)
5. [Key Backend Constraints](#5-key-backend-constraints)

---

## 1. Realized Tech Stack

The architecture follows the diagram's three-panel separation: **Build pipeline (Makefile)**, **Client (Browser)**, and **Server (Deno)**, with **Shared logic (`src/`)** as the domain kernel.

| Layer | Technology | Role in Backend | Why Chosen | Maps to Diagram |
|---|---|---|---|---|
| **Runtime** | Deno | Hosts `server.ts` — HTTP + WebSocket listener entry point | Native TypeScript, built-in security sandbox, no `node_modules` sprawl | Server (Deno) box |
| **Language** | TypeScript | Shared type definitions across client + server; compile-time safety for game state | Single language full-stack; shared logic in `src/` compiles to both targets | `tsc` build pipeline; `board.ts`, `rules.ts`, `score.ts`, `dice.ts` |
| **Transport** | WebSocket (native Deno) | Bi-directional real-time channel from `multi.ts` (client) to `server.ts` | Drafting phase card passing, dice rolls, VP updates need sub-100ms push; HTTP polling is too slow | WS arrow between Client and Server |
| **Messaging** | JSON-RPC 2.0 | Typed request/response protocol over WS — `player.ts` handles one RPC stream per socket | Stateless, version-able, easy to mock in unit tests; avoids custom binary protocol overhead | `multi.ts` WebSocket/JSON-RPC; `player.ts` JSON-RPC per socket |
| **State Machine** | `game.ts` (custom FSM) | Room state machine — tracks phase (Drafting → Grid Assembly → Simulation → Scoring), day index, player resources | Game loop has strict phase sequencing (3 days × 3 phases) that maps naturally to FSM transitions; prevents illegal state jumps | `game.ts` Room state machine |
| **Domain Logic** | `board.ts` · `rules.ts` · `score.ts` · `dice.ts` | Pure TS modules: 7×7 grid state, tile/GameType enums, VP scoring (`sum()`), die face rotations and random event resolution | Shared `src/` means the same validation runs on client (preview) and server (authoritative) — no duplicated rule code | Shared logic (`src/`) panel |
| **Build Tool** | Rollup + lessc + tsc | Bundles `.build/` → `client.js`; compiles `css/*.less` → `client.css`; type-checks `src/**/*.ts` | Rollup produces a single optimised bundle (tree-shaking); lessc keeps CSS modular without runtime cost | Build pipeline (Makefile) top row |
| **Offline / PWA** | `sw.js` (Service Worker) | Caches static assets for offline play; intercepts fetch for tile images in `img/` | Tile images and game assets are large but rarely change — SW caching cuts re-load times significantly | `sw.js` Service Worker/PWA node |
| **Deployment** | Docker (`Dockerfile`) | Packages Deno runtime + compiled assets into a single reproducible container image | Eliminates environment drift; enables horizontal scaling for multi-room deployments | `Dockerfile` node in Server panel |

---

## 2. Backend Developer Roles by Module

Each file in the **Server (Deno)** and **Shared logic** panels owns a distinct backend concern.

| File / Module | Backend Developer Responsibility | Key Functions / Methods | Interfaces With |
|---|---|---|---|
| `server.ts` | Bootstrap HTTP + WS server; route upgrade handshakes; health check endpoint | `Deno.serve()`, `upgradeWebSocket()`, `onopen/onmessage/onclose` handlers | `game.ts` (creates room), `player.ts` (one per socket) |
| `game.ts` | Own the room FSM: phase transitions, timer ticks, broadcast state snapshots to all players in room | `createRoom()`, `transition(event)`, `broadcastSnapshot()`, `resolveDay()` | `player.ts` (receives actions), `board.ts` (mutates grid), `score.ts` (final tally) |
| `player.ts` | Per-socket JSON-RPC dispatcher; validate and forward player actions; manage per-player resource state (Xu, Stamina, Debt) | `dispatch(method, params)`, `validateResources()`, `applyDebt()`, `applyStaminaLock()` | `game.ts` (emits validated actions), `rules.ts` (constraint checks) |
| `board.ts` | Authoritative 7×7 grid — place/remove tiles, enforce slot constraints, return grid snapshot | `placeTile(day, slot, tile)`, `removeTile()`, `getNeighbour()`, `exportGrid()` | `rules.ts` (time-slot tag checks), `score.ts` (reads placed tiles) |
| `rules.ts` | Pure validation layer: tile tag compatibility per time slot, distance penalty thresholds, stamina-lock eligibility | `isTagCompatible(slot, tags)`, `calcDistancePenalty(coordA, coordB, gap)`, `canPlaceTile(state, tile)` | `board.ts`, `player.ts`, `score.ts` — called before any mutation |
| `score.ts` | End-of-day and end-of-phase VP aggregation; apply combo multipliers, debt penalties, stamina-lock zeroing | `calcDayVP(grid, day)`, `applyPenalties(playerState)`, `finalScore(allDays)` | `board.ts` (grid snapshot), `player.ts` (debt / stamina state) |
| `dice.ts` / `tile.ts` | Random event resolution: seed PRNG per phase for replay, check tile tags, return `Event` enum + effect payload | `rollEvent(tile, phaseRng)`, `getTileRotation(face)`, `EventEffect` type | `game.ts` (triggers roll during simulation), `rules.ts` (tag lookup) |

---

## 3. Architecture Decision Records

Each ADR documents a significant backend decision: what problem prompted it, which options were on the table, what was chosen, and the trade-offs.

---

### ADR-001 · Use Deno Instead of Node.js as the Server Runtime `[Accepted]`

**Context**

The game server needs to run TypeScript natively, expose both HTTP and WebSocket endpoints, and be deployable in a Docker container. Node.js requires a build step (`tsc`) and separate type-stripping tooling. The team wants to keep the runtime stack minimal.

**Options Considered**

| Option | Pros | Cons |
|---|---|---|
| Node.js + ts-node | Massive ecosystem, well-known; ts-node gives near-native TS | Extra dependency; ts-node has known perf edge cases; tsconfig divergence between client and server |
| **Deno** ✓ | First-class TypeScript, built-in security sandbox, `std/http` includes WS upgrade, single binary | Smaller ecosystem; some npm packages need compat shim |
| Bun | Fast startup, node-compatible | Less mature; WS API changes between releases; Docker image size larger |

**Decision:** Use Deno as the primary server runtime.

**Rationale:** Deno's first-class TypeScript support eliminates the need for a separate `tsc` watch process on the server side. The built-in WebSocket upgrade in `Deno.serve()` maps directly to the `server.ts` design. Security sandbox prevents accidental file system leakage from game logic bugs.

**Consequences:** No tsconfig mismatch between client and server. Some npm packages (particularly ORMs) need explicit `npm:` specifiers. Team must be trained on Deno permission flags for the Dockerfile entrypoint.

---

### ADR-002 · Use WebSocket + JSON-RPC 2.0 for Client–Server Messaging `[Accepted]`

**Context**

The Drafting Phase requires simultaneous card reveal and card passing between two players with latency under 200 ms. The Simulation phase needs the server to push dice-roll events to all clients without the client polling.

**Options Considered**

| Option | Pros | Cons |
|---|---|---|
| REST (HTTP polling) | Simple; no connection state | High latency for game events; cannot push from server; wastes bandwidth |
| Server-Sent Events (SSE) | Server push; no special protocol | Unidirectional only; client actions still need REST; two connections per player |
| WebSocket + raw JSON | Low latency, bidirectional | No standardised request/response; client must implement own correlation IDs |
| **WebSocket + JSON-RPC 2.0** ✓ | Low latency + structured method calls with `id` correlation; easy to unit-test | Slightly more envelope bytes per message than binary protocols |

**Decision:** WebSocket transport with JSON-RPC 2.0 message framing.

**Rationale:** JSON-RPC 2.0 handles both request/response (method calls with `id`) and server-push (notifications with no `id`) patterns. The protocol is human-readable, trivially mockable in tests, and adds < 50 bytes of overhead per message — acceptable for this game's throughput.

**Consequences:** Each `player.ts` instance maintains a JSON-RPC dispatcher. Developers must ensure that notification broadcasts (`game.broadcastSnapshot()`) never accidentally include a request `id`, or clients will treat them as RPC responses.

---

### ADR-003 · Implement Game Loop as an Explicit Finite State Machine in `game.ts` `[Accepted]`

**Context**

The game has a strict ordered loop: Drafting Phase → Grid Assembly → Simulation (dice rolls) → Scoring, repeated over 3 days, then a Phase transition (Saigon → Da Nang or Da Lat → final city). Handling this with ad-hoc boolean flags risks illegal state combinations.

**Options Considered**

| Option | Pros | Cons |
|---|---|---|
| Ad-hoc flag variables | Quick to prototype | Combinatorial explosion of invalid states; hard to audit |
| XState (library) | Battle-tested, visualisable | Adds a dependency; overkill for a deterministic turn-based loop; Deno compat layer needed |
| **Custom FSM in `game.ts`** ✓ | Zero deps; states are explicit enums; `transition()` is a pure function testable in isolation | Must maintain the transition table manually |

**Decision:** Implement a custom FSM inside `game.ts` with an explicit `GamePhase` enum and a `transition(event)` function.

**Rationale:** The game loop has a small, bounded set of states (≈8) and a well-defined transition table. A custom FSM is < 150 lines and can be unit-tested by feeding events to `transition()`. It prevents tile placement during Simulation and enforces the 3-day limit before Phase transition.

**Consequences:** Every new game mechanic must update the FSM transition table — deliberate friction that prevents accidental state leakage. `player.ts` and `score.ts` must query `game.ts` for the current phase before executing any logic.

---

### ADR-004 · Keep Domain Logic in Shared `src/` Compiled to Both Client and Server `[Accepted]`

**Context**

Rules such as tag-slot compatibility, distance penalty calculation, and VP scoring are needed both on the client (real-time preview) and on the server (authoritative validation). Duplicating rule code creates drift risk.

**Options Considered**

| Option | Pros | Cons |
|---|---|---|
| Server-only rules; client calls server to preview | Single source of truth | Round-trip latency on every tile hover; poor UX; server load increases |
| Client-only rules; server trusts client | Zero latency preview | Trivially exploitable; client bugs silently pass invalid states to server |
| **Shared `src/` compiled by tsc to both targets** ✓ | One source of truth; zero extra RPC calls for preview; server re-validates authoritatively | Shared code must be pure (no DOM, no Deno APIs); increases bundle size slightly |

**Decision:** Place all rule logic (`board.ts`, `rules.ts`, `score.ts`, `dice.ts`) in `src/` and compile it into both the client bundle (via Rollup) and the Deno server import graph.

**Rationale:** Optimistic UI with server authority — fast UX + cheat prevention. Pure TypeScript modules with no side effects can be imported by both targets.

**Consequences:** All shared modules must remain free of platform-specific APIs. Any module that needs Deno (file I/O, crypto) or DOM (`window`, `document`) must be split into a platform adapter.

---

### ADR-005 · Use Seeded PRNG in `dice.ts` for Deterministic Replay `[Accepted]`

**Context**

The Simulation phase rolls random events per tile per player. If the server uses `Math.random()` (unseeded), it is impossible to replay a game session for debugging. Two clients in the same room would also produce different event sequences if they ever ran the simulation locally.

**Options Considered**

| Option | Pros | Cons |
|---|---|---|
| `Math.random()` (unseeded) | Zero effort | Non-reproducible; cannot replay; client and server diverge |
| **Seeded PRNG (Mulberry32)** ✓ | Reproducible with seed; pure JS; tiny implementation | Seed must be agreed before Simulation phase begins |
| Server-only RNG, push results to client | No divergence risk | Requires RPC round-trip per tile event; adds latency |

**Decision:** Use a seeded Mulberry32 PRNG in `dice.ts`. The server generates a random seed at the start of each Simulation phase and broadcasts it to all clients before simulation begins.

**Rationale:** A seeded PRNG makes the simulation deterministic given the seed. Both the server (authoritative) and the client (preview animations) can run the same event sequence without additional RPC calls. The seed is stored in the game state snapshot, enabling full session replay.

**Consequences:** The seed must be broadcast before any tile is processed in Simulation — if a client starts simulation before receiving the seed, it will diverge. The server must treat its own PRNG output as authoritative and ignore any client-reported event outcomes.

---

### ADR-006 · Use Docker for Server Packaging Instead of Bare VM `[Accepted]`

**Context**

The Deno server must be deployable to cloud infrastructure. The team considered three deployment models for initial launch.

**Options Considered**

| Option | Pros | Cons |
|---|---|---|
| Bare metal / VM with Deno installed | Simple, no container overhead | Environment drift between dev and prod; hard to scale horizontally |
| **Docker container (`Dockerfile` in repo)** ✓ | Reproducible; portable; easy horizontal scaling | Docker daemon required on host; image build step in CI |
| Serverless (e.g., Deno Deploy) | Zero ops; automatic scaling | WebSocket persistence model differs; room state cannot be held in memory across invocations without external store |

**Decision:** Package the server as a Docker image using the `Dockerfile` in the Server panel.

**Rationale:** WebSocket sessions are stateful — a room's `game.ts` FSM lives in server memory for the duration of the session. Serverless functions cannot hold in-memory state across invocations without an external store (Redis, etc.), which adds latency and cost at the MVP stage.

**Consequences:** Horizontal scaling requires sticky sessions (route each WebSocket by room ID to the same container) or migrating room state to an external store. This is the primary scaling bottleneck to revisit if concurrent room count exceeds a single container's capacity.

---

## 4. Detailed Infrastructure

### 4.1 Module Map & Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BUILD PIPELINE  (Makefile orchestrates all steps)                      │
│                                                                          │
│  tsc ──► .build/      lessc ──► client.css      rollup ──► client.js   │
│  (type-check + emit)  (Less → CSS)               (bundle .build/)       │
│                                         sw.js ──► Service Worker / PWA  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  compiled outputs
              ┌─────────────────▼──────────────┐
              │           CLIENT (Browser)      │
              │                                 │
              │  index.html  ──►  client.js     │
              │  (shell/entry)    (app bundle)  │
              │       │               │         │
              │  app.ts         multi.ts        │
              │  (Game UI       (WebSocket /    │
              │   controller)    JSON-RPC hub)  │
              │                      │  WS      │
              │  client.css   img/   │          │
              │  (compiled   (tiles, ▼          │
              │   from Less)  icons) │          │
              └──────────────────────┼──────────┘
                                     │  WebSocket (JSON-RPC 2.0)
              ┌──────────────────────▼──────────┐
              │          SERVER (Deno)           │
              │                                 │
              │  server.ts                      │
              │  HTTP listener + WS upgrade     │
              │       │         │               │
              │       │    player.ts            │
              │       │    (1 per socket)       │
              │       │    JSON-RPC dispatcher  │
              │       │    resource manager     │
              │       ▼         │               │
              │  game.ts  ◄─────┘               │
              │  Room FSM                       │
              │  Phase sequencer                │
              │  Broadcaster                   │
              │       │                         │
              │  Dockerfile                     │
              │  (container image)              │
              └──────────────────────┬──────────┘
                                     │  imports (shared src/)
              ┌──────────────────────▼──────────┐
              │        SHARED LOGIC (src/)       │
              │                                 │
              │  board.ts       rules.ts        │
              │  7×7 grid       tag compat      │
              │  tile CRUD      dist penalty    │
              │                 stamina logic   │
              │  score.ts       dice.ts/tile.ts │
              │  VP aggregator  Seeded PRNG     │
              │  penalty apply  event resolver  │
              └─────────────────────────────────┘
```

#### Module Responsibilities — Detailed

| Module | Type | Owns | Does NOT own |
|---|---|---|---|
| `server.ts` | **Entry point** | HTTP listener, WS handshake, room registry `Map<roomId, Room>` | Business logic, player state, scoring |
| `game.ts` | **Orchestrator** | Room FSM, phase timer, broadcast loop, day counter | Individual player resources, grid mutation, VP math |
| `player.ts` | **Session handler** | Per-socket RPC dispatch, Xu/Stamina/Debt state, stamina-lock bitmask | Room-level events, grid state, scoring |
| `board.ts` | **Data structure** | 3×5 grid (3 days × 5 time slots), tile placement/removal, locked-slot enforcement | Why a tile is invalid (delegates to `rules.ts`) |
| `rules.ts` | **Pure validator** | Tag–slot compatibility table, distance penalty curve, debt/stamina constraint logic | State mutation of any kind |
| `score.ts` | **Calculator** | Base VP read, combo multiplier application, penalty deduction, phase total, final sum | Reading player state directly (receives it as parameter) |
| `dice.ts` | **Randomness** | Mulberry32 PRNG, per-phase seed lifecycle, tag→event probability table | Applying event effects (returns `EventEffect`, `game.ts` applies) |
| `tile.ts` | **Enum / config** | `TileType`, `TagSet`, `GameType` enums, base VP values, tile metadata | Runtime state |

---

### 4.2 Service Interaction Diagram

```
Client (multi.ts)                   Server
        │                              │
        │── WS connect ──────────────► server.ts
        │                              │── createRoom() ──► game.ts
        │                              │── new Player() ──► player.ts
        │                              │
        │── JSON-RPC: selectCard ───► player.ts
        │                              │── validateResources()
        │                              │── rules.canPlaceTile()  ──► rules.ts
        │                              │── game.transition(CARD_SELECTED) ─► game.ts
        │                              │
        │◄── notification: draftState ─ game.broadcastSnapshot()
        │                              │
        │── JSON-RPC: placeTile ─────► player.ts
        │                              │── board.placeTile() ──────────────► board.ts
        │                              │        └── rules.isTagCompatible() ► rules.ts
        │                              │
        │◄── notification: gridUpdate ─ game.broadcastSnapshot()
        │                              │
        │── JSON-RPC: endDay ────────► player.ts
        │                              │── game.transition(DAY_END) ──────► game.ts
        │                              │── score.calcDayVP() ─────────────► score.ts
        │                              │        └── board.exportGrid()  ──► board.ts
        │                              │── dice.rollEvent() (per tile) ───► dice.ts
        │                              │        └── rules.ts (tag lookup)
        │                              │
        │◄── notification: dayResult ── game.broadcastSnapshot()
        │                              │
        │── JSON-RPC: endPhase ──────► player.ts
        │                              │── score.finalScore() ────────────► score.ts
        │                              │── score.applyPenalties() ────────► score.ts
        │                              │── game.transition(PHASE_END) ───► game.ts
        │                              │
        │◄── notification: phaseResult  game.broadcastSnapshot()
```

---

### 4.3 Data Flow per Game Phase

#### Phase: Drafting

```
game.ts enters DRAFTING state
    │
    └─► server distributes 5 cards to each player.ts instance
              │
              └─► player.ts stores hand[], validates Xu cost on selection
                        │
                        └─► game.ts collects selections (simultaneous reveal)
                                  │
                                  └─► game.ts swaps remaining hands between players
                                            │
                                            └─► repeat until hand exhausted (5 rounds)
                                                      │
                                                      └─► game.transition(DRAFTING_DONE)
```

#### Phase: Grid Assembly

```
game.ts enters ASSEMBLY state
    │
    └─► player.ts receives placeTile(day, slot, tileId) RPC calls
              │
              ├─► rules.isTagCompatible(slot, tile.tags)     [pure check]
              ├─► rules.canPlaceTile(playerState, tile)      [resource check]
              ├─► board.placeTile(day, slot, tile)           [mutates grid]
              └─► game.broadcastSnapshot()                   [push to all clients]
```

#### Phase: Simulation (Dice Rolls)

```
game.ts enters SIMULATION state
    │
    ├─► dice.ts seeds PRNG with phaseRng, broadcasts seed
    │
    └─► for each placed tile (left→right, top→bottom):
              │
              ├─► dice.rollEvent(tile, phaseRng)
              │         └─► checks tile.tags against event probability table
              │         └─► returns EventEffect | null
              │
              └─► game.ts applies EventEffect:
                        ├─► RAIN      → tile VP ×0.5 (Outdoor tiles)
                        ├─► TRAFFIC   → drain Stamina; if <0 cancel tile
                        ├─► OVERCHARGE→ drain Xu; if empty -20 VP
                        └─► FLASH_SALE→ tile VP ×1.5
```

#### Phase: Scoring

```
game.ts enters SCORING state
    │
    └─► score.calcDayVP(board.exportGrid(), day)
              │
              ├─► reads base VP per tile
              ├─► applies combo multipliers
              ├─► runs rules.calcDistancePenalty() between adjacent tiles
              └─► returns DayScore
                        │
                        └─► score.applyPenalties(playerState)
                                  ├─► -50 VP per unresolved Debt token
                                  ├─► 0 VP for stamina-locked slots
                                  └─► returns FinalScore
                                            │
                                            └─► game.broadcastSnapshot(PHASE_RESULT)
```

---

### 4.4 Inter-Module Contracts

These are the TypeScript interface boundaries that each module must honour.

#### `game.ts` ↔ `player.ts`

```typescript
// player.ts emits this after validating an action
interface PlayerAction {
  playerId: string;
  type: 'SELECT_CARD' | 'PLACE_TILE' | 'END_DAY' | 'BORROW_XU' | 'BORROW_STAMINA';
  payload: unknown;
  timestamp: number;
}

// game.ts pushes this to all sockets via broadcastSnapshot()
interface RoomSnapshot {
  phase: GamePhase;
  day: number;          // 1–3
  players: PlayerSnapshot[];
  grid: GridSnapshot;   // board.exportGrid() output
  seed?: number;        // present during SIMULATION phase only
}
```

#### `board.ts` ↔ `rules.ts`

```typescript
// rules.ts only reads; never mutates board state
interface PlacementRequest {
  day: number;          // 0–2
  slot: TimeSlot;       // MORNING | NOON | AFTERNOON | EVENING | NIGHT
  tile: Tile;
  playerState: PlayerState;
}

// returned by rules.canPlaceTile()
type ValidationResult =
  | { ok: true }
  | { ok: false; reason: 'WRONG_TAG' | 'INSUFFICIENT_XU' | 'INSUFFICIENT_STAMINA' | 'SLOT_LOCKED' | 'SLOT_OCCUPIED' };
```

#### `score.ts` ↔ `board.ts` / `player.ts`

```typescript
// score.ts receives these; never imports player.ts or board.ts directly
interface ScoringInput {
  grid: GridSnapshot;       // from board.exportGrid()
  playerState: PlayerState; // from player.ts snapshot
  day: number;
}

interface DayScore {
  baseVP: number;
  comboBonus: number;
  distancePenalty: number;
  eventAdjustments: number;
  subtotal: number;
}
```

#### `dice.ts` ↔ `game.ts`

```typescript
// game.ts calls this for each tile during SIMULATION
function rollEvent(tile: Tile, rng: () => number): EventEffect | null;

interface EventEffect {
  eventType: 'RAIN' | 'TRAFFIC' | 'OVERCHARGE' | 'FLASH_SALE';
  vpMultiplier?: number;     // RAIN: 0.5, FLASH_SALE: 1.5
  staminaDrain?: number;     // TRAFFIC
  xuDrain?: number;          // OVERCHARGE
  cancelTile?: boolean;      // TRAFFIC when stamina < 0
}
```

---

### 4.5 Runtime Dependency Graph

```
server.ts
├── game.ts
│   ├── board.ts
│   │   └── rules.ts
│   │       └── tile.ts  (enums only)
│   ├── score.ts
│   │   ├── board.ts  (via exportGrid snapshot)
│   │   └── rules.ts  (calcDistancePenalty)
│   └── dice.ts
│       ├── tile.ts   (TagSet enum)
│       └── rules.ts  (isTagCompatible)
└── player.ts
    ├── game.ts   (transition, broadcastSnapshot)
    └── rules.ts  (canPlaceTile)

─── Compiled into client bundle (Rollup) ───────────────
app.ts / multi.ts
├── board.ts    (preview grid state)
├── rules.ts    (client-side validation preview)
├── score.ts    (live VP estimate)
└── dice.ts     (replay simulation animations)
```

**Dependency rules:**

- `rules.ts`, `tile.ts`, `dice.ts` → **no imports** from other game modules (pure leaf nodes)
- `board.ts` → may import `rules.ts` and `tile.ts` only
- `score.ts` → may import `rules.ts` and `tile.ts` only; receives board data as plain objects
- `game.ts` → may import everything except `server.ts`
- `player.ts` → may import `game.ts` and `rules.ts` only
- `server.ts` → may import `game.ts` and `player.ts` only

---

### 4.6 Error & Penalty Propagation

```
Player action arrives at player.ts
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │  Resource gate (player.ts)                          │
  │                                                     │
  │  Xu < cost?        ──► BORROW_XU path               │
  │    └─► create DebtToken, add to playerState.debt[]  │
  │    └─► continue with action                         │
  │                                                     │
  │  Stamina < cost?   ──► BORROW_STAMINA path          │
  │    └─► set staminaLock on next day's first 1–2 slots │
  │    └─► continue with action                         │
  └─────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │  Validation gate (rules.ts)                         │
  │                                                     │
  │  isTagCompatible?  ──► false → RPC error response   │
  │  isSlotLocked?     ──► true  → RPC error response   │
  │  isSlotOccupied?   ──► true  → RPC error response   │
  └─────────────────────────────────────────────────────┘
         │ passes
         ▼
  board.ts mutates grid
         │
         ▼ (at SIMULATION phase)
  dice.ts rolls event
  ├── RAIN       → tile.vpMultiplier = 0.5   (applied in score.ts)
  ├── TRAFFIC    → playerState.stamina -= N
  │                if stamina < 0: tile.cancelled = true
  ├── OVERCHARGE → playerState.xu -= N
  │                if xu <= 0: vpPenalty += 20
  └── FLASH_SALE → tile.vpMultiplier = 1.5
         │
         ▼ (at SCORING phase)
  score.ts aggregates
  ├── base VP × tile.vpMultiplier (event adjustments)
  ├── − distance penalty (rules.calcDistancePenalty)
  ├── − 50 VP × playerState.debt.length   (unresolved Debt tokens)
  └── 0 VP for all stamina-locked slots (regardless of tile placed)
         │
         ▼
  game.broadcastSnapshot(PHASE_RESULT)
  └── final scores sent to both clients
```

---

## 5. Key Backend Constraints

These constraints flow directly from the game logic document and must be enforced server-side at all times.

| Constraint | Enforced In | Rule |
|---|---|---|
| **Resource caps** | `player.ts` | Xu ≤ 15 tokens; Stamina ≤ 20. Any action that would push beyond the cap must be blocked before `game.ts` processes it. |
| **Debt penalty** | `score.ts` | Each unresolved Debt Token at end of Phase = −50 VP. Applied after `game.ts` transitions to `SCORING` state. |
| **Stamina lock** | `board.ts` + `player.ts` | Borrowing stamina locks the first 1–2 slots of the next day. Stored as a locked-slot bitmask; `board.ts` rejects placements on locked slots. |
| **Distance penalty — adjacent** | `rules.ts` | Tiles with gap = 0 (e.g., Morning → Noon): threshold 10 km. Escalating penalty above threshold. |
| **Distance penalty — gap** | `rules.ts` | One empty slot between tiles (gap = 1, e.g., Morning → Afternoon): threshold relaxed to 30 km. |
| **Tag-driven events** | `dice.ts` | Mưa Giông fires only on Outdoor-tagged tiles; Kẹt Xe on City-tagged; Chặt Chém on Food/Market; Flash Sale is universal. |
| **Phase map branching** | `game.ts` | Phase 2A (Da Nang) costs Xu; Phase 2B (Da Lat) costs 5 Xu + 10 Stamina. `game.ts` gate-checks resources before committing the branch. |
| **Grid dimensions** | `board.ts` | Board is exactly 3 days × 5 time slots. No tile may be placed outside this boundary. |
| **PRNG authority** | `dice.ts` + `game.ts` | Server PRNG output is authoritative. Client-reported event outcomes are ignored. Seed is broadcast before simulation starts. |
| **Phase sequencing** | `game.ts` FSM | Illegal transitions (e.g., placing a tile during SCORING) are rejected. `player.ts` and `score.ts` must check current phase before acting. |
