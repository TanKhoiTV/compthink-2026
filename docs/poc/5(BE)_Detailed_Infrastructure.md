
## 1. Detailed Infrastructure

### 1.1 Module Map & Responsibilities

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

### 1.2 Service Interaction Diagram

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

### 1.3 Data Flow per Game Phase

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

### 1.4 Inter-Module Contracts

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

### 1.5 Runtime Dependency Graph

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

### 1.6 Error & Penalty Propagation

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

## 2. Key Backend Constraints

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
