# Game Logic Design

Source of truth for game mechanics, rules, and data schemas.
Derived from the team's design document (Google Docs).

---

## Overview

- **Genre:** Strategy Board Game / Itinerary Simulation
- **Objective:** Optimise Victory Points (VP) through resource management and schedule arrangement on a 5×5 grid board.
- **Unique value:** The final board layout is a real, feasible travel itinerary. *Play to Plan.*

## Board

A 5×5 grid: **5 days × 5 time slots** = 25 cells.

| | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| **Early Morning** | | | | | |
| **Morning** | | | | | |
| **Afternoon** | | | | | |
| **Evening** | | | | | |
| **Night** | | | | | |

Time slots represent a natural travel-day progression:
1. `early_morning` — dawn / breakfast / early start
2. `morning` — main morning activity
3. `afternoon` — post-lunch activity
4. `evening` — dinner / sunset
5. `night` — nightlife / late

## Game Phases

A game proceeds through 5 days. Each day has 2 interactive phases followed by an automatic end-of-day phase.

### Phase 1: Daily Drafting (5 rounds)

Each player receives 5 cards. A clockwise passing draft runs for 3 picks:

1. **Pick 1:** Hold 5 cards. Choose 1 card, place it face-down. Pass remaining 4 cards to the neighbour.
2. **Pick 2:** Receive 4 cards from the other neighbour. Choose 1. Pass remaining 3.
3. **Pick 3:** Receive 3 cards. Choose 1. Pass remaining 2 (discarded).

Three options when picking a card:

| If | Mechanism | Effect |
|---|---|---|
| **Enough Xu & Stamina** | Pay normally | Card added to storage |
| **Short on Xu** | Borrow (Debt Token) | Card added; Debt Token in inventory (not counted toward storage limit) |
| **Short on Stamina** | Overexert | Card added; system randomly **locks** 1 time slot the next day |
| **Want to discard** | Dump for resources | Gain +1 Xu or +1 Stamina; slot left empty (acts as travel time — breaks distance chain) |

### Phase 2: Planning (Placement)

Drag & drop cards from storage onto the 5 time slots of the current day. Empty slots are allowed and function as travel/rest time.

### Phase 3: End of Day

- Cards remaining in storage are discarded.
- Advance to the next day. On Day 5, proceed directly to Simulation.

## Scoring — 5-Step Simulation

Run once after Day 5 (or as configured per campaign phase):

### Step 1: Debt Scan
Each leftover Debt Token deducts **3 VP**.

### Step 2: Random Events (15% chance per outdoor card)
For each non-INDOOR card on the board, roll a deterministic check (15% activation).
- **Weather event:** triggers VP penalty or bonus based on card tags.
- **Risky tags** (OUTDOOR, ACTION): penalty of 3 VP.
- **Safe tags**: penalty of 1 VP.
- INDOOR cards are immune.

### Step 3: Combo Scan
Scan the board along **two axes**:
- **Horizontal:** Adjacent slots within the same day.
- **Vertical:** Same slot position across consecutive days.
For each pair sharing a **common tag**, award **2 VP per shared tag**.

### Step 4: Distance Scan
Scan the board in chronological order (Day 1 early_morning → Day 1 morning → ... → Day 5 night).
- Use the **Haversine formula** to compute distance between consecutive cards (same day only).
- Penalty: **–2 VP** if distance > 20 km.
- **Empty slots break the distance chain** — cards before and after are not compared.
- Virtual cards (`is_virtual = true`) are skipped.

### Step 5: Final Tally
```
Total VP = Base VP (sum of card base_vp)
         + Combo VP
         - Debt Penalty
         - Distance Penalty
         - Event Penalty
```

### Export
The game ends with a **Timeline Report**: ordered list of placed cards with coordinates, estimated cost, and notes — ready to use as a real travel plan.

## Campaign Structure

The game is divided into **Phases**, each corresponding to a geographic region with its own card pool.

| Phase | Region | Days | Description |
|---|---|---|---|
| Phase 1 | Sài Gòn (Saigon) | 5 days | The starting region |
| Phase 2+ | Da Lat / Da Nang / ... | 5 days per phase | Unlocked after completing Phase 1 |

After completing Phase 1 (Day 5), players choose which region to unlock for Phase 2.

---

## Card System

### JSON Schema

```json
{
  "card_id": "SG_FOOD_001",
  "name": "Cà Phê Bệt Nhà Thờ Đức Bà",
  "description": "Trải nghiệm vỉa hè chuẩn Sài Gòn.",
  "image_url": "/cards/sg_food_001.png",
  "phase_pool": "SAIGON",
  "tags": ["FOOD", "OUTDOOR"],
  "cost": { "xu": 1, "stamina": 0 },
  "base_vp": 5,
  "location": {
    "lat": 10.7798,
    "lng": 106.6990,
    "is_virtual": false
  },
  "on_play_effect": {
    "has_effect": false,
    "effect_type": null,
    "effect_value": 0
  }
}
```

### Fields

| Group | Field | Type | Description |
|---|---|---|---|
| **Identity** | `card_id` | string | Unique identifier |
| | `name` | string | Display name |
| | `description` | string | Flavour text |
| | `image_url` | string | Card art path |
| | `phase_pool` | enum | `SAIGON`, `DALAT`, `DANANG`, ... |
| **Tactical** | `tags` | string[] | See Tags below |
| | `cost.xu` | integer | Xu price to draft |
| | `cost.stamina` | integer | Stamina cost to draft |
| | `base_vp` | integer | Base victory points |
| **Geography** | `location.lat` | float | Latitude |
| | `location.lng` | float | Longitude |
| | `location.is_virtual` | bool | Skip distance check if true (utility station) |
| **Effects** | `on_play_effect.has_effect` | bool | Whether card triggers an immediate effect |
| | `on_play_effect.effect_type` | string | `RECOVER_XU`, `RECOVER_STAMINA`, `DEDUCT_STAMINA`, etc. |
| | `on_play_effect.effect_value` | integer | Magnitude of the effect |

### Tags

**4 Core Tags** (strategy / combo):

| Tag | Vietnamese | Description |
|---|---|---|
| `FOOD` | Ẩm thực | Food & dining experiences |
| `CULTURE` | Văn hóa | Historical sites, museums, photo spots |
| `ACTION` | Vận động | Physical activities, adventure |
| `UTILITY` | Tiện ích | Rest stops, recovery (large on-play effect) |

**2 Weather Tags** (event immunity):

| Tag | Effect |
|---|---|
| `OUTDOOR` | 100% susceptible to weather events |
| `INDOOR` | Immune to all weather events |

A card may have multiple tags (e.g. `["FOOD", "OUTDOOR"]`).

### Cost Tiers

| Cost | Real-world equivalent |
|---|---|
| 1 🟡 Xu | ~50,000 VND (budget) |
| 2 🟡 Xu | ~100,000–150,000 VND (mid-range) |
| 3 🟡 Xu | ~200,000–300,000 VND (premium) |
| 4+ 🟡 Xu | 500,000+ VND (luxury) |

---

## State Transitions (FSM)

```
┌─────────┐
│  LOBBY  │
└────┬────┘
     │ START_GAME
     ▼
┌─────────┐     ┌──────────┐
│  DRAFT  │────▶│PLACEMENT │
└─────────┘     └────┬─────┘
                     │ CONFIRM_DAY
                     ▼
┌──────────┐     ┌──────────┐
│ SCORING  │────▶│  DRAFT   │  (next day)
└──────────┘     └──────────┘
     │
     │ (after Day 5)
     ▼
┌──────────┐
│ FINISHED │
└──────────┘
```

- `LOBBY` → `DRAFT` on game start
- `DRAFT` → `PLACEMENT` after all picks made
- `PLACEMENT` → `SCORING` on day confirm
- `SCORING` → `DRAFT` (next day) or `FINISHED` (after 5 days)

---

## Card Pool — Phase 1: Saigon

The full Saigon Phase 1 card catalogue is maintained separately as structured data
(location: TBD — JSON dataset, PocketBase collection, or both).
Refer to the designer docs for the complete tiered list of 35+ food, culture, action,
and utility cards with specific coordinates and flavour text.

Key card sets defined in the design doc:

- **Tier 1 Street Food** (1 Xu, VP 5–8, mostly OUTDOOR)
- **Tier 2 Specialties** (2 Xu, VP 10–15, mixed INDOOR/OUTDOOR)
- **Tier 3 Premium** (3–4 Xu, VP 15–25, mostly INDOOR)
- **Tier 4 Luxury** (5–6 Xu, VP 35–45, INDOOR)
- **Culture & Action cards** — museums, historic sites, walks, rides
- **Utility cards** — ATMs, convenience stores, rest stops (virtual, no distance check)
