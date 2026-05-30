# Trekkopoly — Type Reference

---

## Shared Types (`src/shared/types.ts`)

These types are compiled into both the **client** (Rollup) and **server** (Deno).

### TravelCard

The core data unit — represents one destination/activity card.

```typescript
type TravelCard = {
  id: string;
  name: string;
  description?: string;
  phase_pool?: string;
  tags: Tag[];
  tag: Tag;                // Primary tag (legacy, same as tags[0])
  coin: number;
  stamina: number;
  vp: number;
  image: string;
  icon?: string;
  rarity?: Rarity;
  // Backward-compat aliases (server references old names):
  card_id: string;         // Same as id
  cost: number;            // Same as coin
  on_play_effect: string;  // Derived from onPlayEffect
  victory_point: number;   // Same as vp
  city: string;
  onPlayEffect?: GameCardEffect;
  coordinates: Coordinates;
  is_virtual?: boolean;
  // Board token fields (lock/debt pseudo-cards placed on the board):
  boardTokenType?: "debt" | "lock";
  lockedReason?: string;
  sourceCardName?: string;
  debtAmount?: number;
  bonusText?: string;
  shortName?: string;
  shortCity?: string;
  tagLabel?: string;
  rarityLabel?: string;
};
```

### Tag

```typescript
type Tag = 'FOOD' | 'CULTURE' | 'ACTION' | 'UTILITY' | 'TRANSIT' | 'REST' | 'OUTDOOR' | 'INDOOR';
```

4 core tags drive combos: FOOD, CULTURE, ACTION, UTILITY.  
2 weather tags: OUTDOOR, INDOOR (event immunity).  
TRANSIT and REST are reserved.

### GamePhase

```typescript
type GamePhase = 'lobby' | 'draft' | 'placement' | 'scoring' | 'finished';
```

### Rarity

```typescript
type Rarity = 'common' | 'uncommon' | 'epic' | 'legendary';
```

### Coordinates

```typescript
type Coordinates = {
  lat: number;
  lng: number;
};
```

Used for Haversine distance calculation between consecutive cards in the same day.

### GameCardEffect

```typescript
type CardEffectType = 'NONE' | 'RECOVER_XU' | 'RECOVER_LA' | 'GAIN_VP' | 'DEDUCT_LA' | 'IGNORE_DISTANCE_NEXT' | 'DISCOUNT_XU_NEXT' | 'DOUBLE_VP_NEXT';

type GameCardEffect = {
  has_effect: boolean;
  effect_type: CardEffectType;
  effect_value: number;
};
```

### BoardCell & GridPosition (server-side flat model)

```typescript
type GridPosition = {
  day: number;
  slot: TimeSlot;           // "early_morning" | "morning" | "afternoon" | "evening" | "night"
};

type BoardCell = GridPosition & {
  card_id?: string;
  skipped?: boolean;
  locked?: boolean;
};
```

### PlayerResources

```typescript
type PlayerResources = {
  xu: number;
  stamina: number;
  debtToken: number;
  vp: number;
};
```

### PlayerState (server model)

```typescript
type PlayerState = {
  playerId: string;
  name: string;
  board: BoardCell[];
  hand: string[];
  chosen: string[];
  storage: string[];
  draftChoice?: {
    cardId: string;
    mode: 'store' | 'rest';
  };
  resources: PlayerResources;
  ready: boolean;
};
```

### RoomSnapshot

```typescript
type RoomSnapshot = {
  roomId: string;
  phase: GamePhase;
  day: number;
  pickIndex: number;
  maxPlayers: number;
  players: PlayerState[];
  winnerId?: string;
  timeline?: ItineraryEntry[];
  log: string[];
};
```

### ItineraryEntry

```typescript
type ItineraryEntry = {
  day: number;
  slot: TimeSlot;
  title: string;
  coordinates: Coordinates;
  estimatedCost: number;
  note: string;
};
```

### ValidationResult

```typescript
type ValidationResult = {
  ok: boolean;
  reason?: string;
};
```

---

## Client Types (`src/shared/client-types.ts`)

### PlayerId

```typescript
type PlayerId = "p1" | "p2" | "p3" | "p4";
```

The game supports 4 players. In local mode: p1 = human, p2-p4 = AI bots.

### LobbyPlayer

```typescript
type LobbyPlayer = {
  id: PlayerId;
  name: string;
  ready: boolean;
};
```

---

## Board Types (`src/shared/board.ts`)

### BoardSlots

```typescript
type BoardSlots = (TravelCard | null)[][];
```

A 5×5 jagged array: `board[row][col]`.  
- `rows = [0..4]` (time slots: early_morning → night)  
- `days = [0..4]` (Day 1 → Day 5)  
- `null` = empty cell; `TravelCard` = placed card; `TravelCard & { boardTokenType: "lock" }` = locked cell

### BoardPosition

```typescript
type BoardPosition = {
  rowIndex: number;
  colIndex: number;
};
```

### BoardTotals

```typescript
type BoardTotals = {
  vp: number;
  coin: number;
  stamina: number;
  usedSlots: number;
};
```

Calculated by `calculateBoardTotals(boardSlots)` — sums all placed cards.

### GridPosition & Validation Types

```typescript
type GridPosition = {
  day: number;
  slot: string;     // "early_morning" | "morning" | "afternoon" | "evening" | "night"
};
```

Constants: `DAYS = [1, 2, 3, 4, 5]`, `TIME_SLOTS = [...]`, `DISTANCE_LIMIT_KM = 20`.

---

## Resource Types (`src/shared/resources.ts`)

```typescript
type ResourceState = {
  coin: number;
  stamina: number;
};

type CardAffordability = {
  canAfford: boolean;
  missingCoin: number;
  missingStamina: number;
};

type GetRemainingResourcesParams = {
  totals: BoardTotals;
  startingCoin: number;
  startingStamina: number;
};

type GetCardAffordabilityParams = {
  card: TravelCard;
  remaining: ResourceState;
};
```

Calculated as `remaining = start - totalSpent` (clamped to 0).

---

## Scoring Types (`src/shared/scoring.ts`)

### SimulationReplayStep

```typescript
type SimulationReplayStep = {
  stepIndex: number;
  dayIndex: number;
  dayLabel: string;
  
  // Debt scan
  debtPenalty?: number;
  
  // Random events
  eventType?: string;       // "weather" | "combo" | "distance"
  eventDescription?: string;
  eventPenalty?: number;
  
  // Combo scan
  comboDescription?: string;
  comboPoints?: number;
  
  // Distance scan
  distanceKm?: number;
  distancePenalty?: number;
  
  // Running total
  currentTotalVP: number;
  
  // Board cell highlight
  cellRowIndex?: number;
  cellColIndex?: number;
  cellHighlight?: "current" | "done";
  
  // Step type
  type: "debt" | "event" | "combo" | "distance" | "final";
};
```

### SimulationResult

```typescript
type SimulationResult = {
  totalVP: number;
  baseVP: number;
  comboVP: number;
  distancePenalty: number;
  eventPenalty: number;
  debtPenalty: number;
  replaySteps: SimulationReplayStep[];
};
```

### CalculateSimulationResultParams

```typescript
type CalculateSimulationResultParams = {
  boardSlots: BoardSlots;
  currentDayIndex: number;
  dayLabel: string;
  rows: string[];
  getBoardDisplayName: (card: TravelCard) => string;
  getCardTagKeys: (card: TravelCard) => string[];
  countCardsWithTag: (cards: TravelCard[], tag: string) => number;
  getCurrentDayPlacedCards: () => TravelCard[];
};
```

### ScoreBreakdown

```typescript
type ScoreBreakdown = {
  baseVP: number;
  bonusVP: number;
  totalVP: number;
  usedSlots: number;
  spentCoin: number;
  spentStamina: number;
  currentDay: number;
};
```

---

## Audio Types (`src/audio/gameAudio.ts`)

```typescript
type GameSoundName = 
  | "cardSelect"
  | "cardPlace"
  | "deal"
  | "returnDeck"
  | "scanCell"
  | "scanBad"
  | "eventTraffic"
  | "eventStorm"
  | "eventDistance"
  | "eventPromo"
  | "bgm";
```

---

## State (`src/state.ts` — module-level variables)

All state is module-level with getter/setter functions. No reactivity — manual `rerenderGameShell()` triggers DOM rebuild.

| Slice | Variables | Phases |
|-------|-----------|--------|
| **Deck** | `deck: TravelCard[]` | draft |
| **Player hand** | `playerHand: TravelCard[]` | draft → placement |
| **Draft** | `draftPool`, `draftRound`, `draftSelectedCardId`, `draftPickSecondsLeft`, `draftTimerId` | draft |
| **Board** | `playerBoards: Record<PlayerId, BoardSlots>` | placement → scoring |
| **Phase** | `gamePhase: GamePhase` | all |
| **Day** | `currentDayIndex: number`, `phaseNumber: number` | all |
| **VP** | `accumulatedVP: number` | scoring |
| **Simulation** | `simulationResult`, `simulationReplayIndex`, `simulationTimerId`, `isReplayComplete`, `isSimulationMode` | scoring |
| **Timers** | `remainingTurnSeconds`, `turnTimerId`, `dayAdvanceTimerId` | placement |
| **Debt** | `localCoinDebt: number` | placement |
| **Audio** | BGM instance, mute/volume (via localStorage) | all |
| **UI** | `selectedHandCardId`, `focusedHandCardId`, `focusedBoardCard`, `suppressNextClick`, `holdTimerId`, `isPassingDraftCards`, `isInitialDealInProgress`, `showFocusedPopup` | all |
| **Online** | `onlinePlayerId`, `onlineRoomId`, `onlinePlayers` | multiplayer |

---

## WebSocket Protocol (`server/`)

### Message Types

Incoming (client → server) and outgoing (server → client) messages are JSON with a `type` field:

```typescript
type ClientMessage =
  | { type: "join_room"; roomId: string; playerId: string }
  | { type: "leave_room" }
  | { type: "ready" }
  | { type: "draft_pick"; cardId: string }
  | { type: "place_card"; cardId: string; rowIndex: number; colIndex: number; tag: string; icon: string; vp: number; coin: number; stamina: number; name: string }
  | { type: "confirm_day" }
  | { type: "chat"; message: string };

type ServerMessage =
  | { type: "room_joined"; room: RoomSnapshot }
  | { type: "player_joined"; playerId: string }
  | { type: "player_left"; playerId: string }
  | { type: "draft_start"; pool: string[]; round: number }
  | { type: "draft_pick"; playerId: string; cardId: string }
  | { type: "placement_phase"; day: number; hand: string[] }
  | { type: "card_placed"; playerId: string; cardId: string; rowIndex: number; colIndex: number; tag: string; icon: string; vp: number }
  | { type: "simulation_result"; result: SimulationResult }
  | { type: "game_over"; winnerId: string; scores: Record<string, number> }
  | { type: "chat"; playerId: string; message: string }
  | { type: "error"; reason: string };
```

---

## Card Data Model

Cards are stored in `src/shared/data/index.ts` as arrays of `TravelCard` objects representing the Saigon (Phase 1) card pool. Each card has:

| Field | Example |
|-------|---------|
| `id` | `"SG_FOOD_001"` |
| `name` | `"Cà Phê Bệt Nhà Thờ Đức Bà"` |
| `tags` | `["FOOD", "OUTDOOR"]` |
| `coin` | `1` |
| `stamina` | `0` |
| `vp` | `5` |
| `image` | `"assets/images/card-food.png"` |
| `coordinates` | `{ lat: 10.7798, lng: 106.6990 }` |
| `onPlayEffect` | `{ has_effect: false, ... }` |

### Deck Structure

| Step | Cards | Action |
|------|-------|--------|
| Create initial deck | 30+ shuffled cards | `createInitialDeck()` |
| Deal daily draft | 7 cards from deck | 5 rounds: pick 1, pass rest |
| After draft | 5 cards in hand, 2 discarded | Picked cards move to hand |
| Placement | Cards placed on 5×5 board | Each day column = current day |
| End of day | Hand cleared, next day draft | Or game over if day 5 |
