
# Architecture Overview

The game follows a **fetch-once, run-local** pattern: a single bootstrap pull from the server populates a local data store, and all game logic, state, and progress live on the device thereafter.

---

## Backend (your backend dev)

**Bootstrap API** — a single endpoint (or small set) that delivers the game's initial data bundle: world map, location metadata, quest definitions, item tables, etc. This is the only required network dependency after install. Keep it versioned so updates can be detected.

**Auth / Session service** — lightweight identity if you need save-state sync or leaderboards across devices. Could be as simple as a device-token or anonymous session.

**Optional sync endpoint** — if you ever want cloud saves or analytics events, a write endpoint accepts structured payloads from the client on demand (not required for the core loop).

---

## Data Layer (your data dev + analysts)

**Game content database** — the source-of-truth that the bootstrap API serves from. Locations, quests, NPCs, items, events — all authored here.

**Analytics event pipeline** — collects opt-in telemetry (session length, location visits, quest completion rates) for the analysts. Entirely decoupled from the game loop; fire-and-forget from the client.

**Content versioning / CMS** — a way for the game designer to update content without a full redeploy. The bootstrap payload includes a version hash; the client checks this on launch and re-pulls if stale.

---

## Client (frontend dev + UI/UX designers + QA)

### PWA Shell
**Service Worker** — intercepts network requests, serves the app from cache, and handles the offline-first guarantee. This is load-bearing; the game must work with zero connectivity after first install.

**App Manifest** — defines install behavior, splash screen, icons, display mode (`standalone`), orientation lock if needed.

**Install / Onboarding flow** — the first-launch experience: downloads the game bundle, shows progress, then gates entry to the main shell. This is the only moment real network traffic happens per session.

### Local Storage Layer
**IndexedDB store** — the on-device database. Holds the full game content bundle (locations, items, quests), player state (inventory, progress flags, journal), and cached map tiles or assets. Structure this with named object stores so different subsystems access their own slice cleanly.

**State manager** — a client-side singleton (Zustand, Redux, or a hand-rolled store) that holds the in-memory working copy of player state, syncs writes through to IndexedDB, and exposes reactive subscriptions to the UI.

**Save / checkpoint system** — serializes player state snapshots into IndexedDB with timestamps. Lets you implement manual saves, autosaves, and rollback.

### Game Modules
**Location engine** — resolves the player's current position (GPS, manual selection, or QR trigger depending on your mechanic) against the location dataset, fires arrival/departure events.

**Quest / event system** — a lightweight finite-state machine that evaluates conditions (visited location X, has item Y, flag Z is set) and advances quest state. This is the core game logic; keep it pure and testable.

**Inventory / item system** — CRUD over the player's item collection in the state manager. Handles item acquisition, consumption, and capacity rules.

**Travel / map module** — renders the world map, marks visited and discoverable locations, and feeds input into the location engine.

### UI Layer
**Design system / component library** — shared tokens (color, type, spacing), base components, and interaction patterns. This is the primary deliverable for your UI/UX designers and the contract your frontend dev builds against.

**Map view** — the main game screen. Likely the most complex UI component; needs to handle pan/zoom, location markers, and state-driven overlays.

**HUD / overlay system** — quest tracker, inventory panel, notification toasts, modal dialogs. Rendered above the map.

**Onboarding / tutorial overlay** — first-play guidance, separate from the install flow.

---

## Cross-Cutting

**Error boundary + offline indicator** — surfaces network failures gracefully; since the game is offline-first, most errors should be silent but the install-phase failure needs a clear recovery path.

**Feature flags** — lets you ship and toggle features between the game designer, QA, and production without branching. Stored in the bootstrap payload or a lightweight local config.

**QA / testing harness** — unit tests on the quest FSM and item system (pure logic, easy to test), integration tests on the IndexedDB layer, and E2E tests on the install and onboarding flow. Your QA engineer should own the test plan and gate releases here.

---

## Team → Component Mapping (quick reference)

| Role | Primary ownership |
|---|---|
| PO (you) | Bootstrap API contract, feature flags, release gates |
| Game designer | Quest/event system spec, content DB schema, location data |
| Backend dev | Bootstrap API, auth/session, sync endpoint |
| Data dev | Content DB, versioning/CMS pipeline |
| Analysts | Analytics event schema, pipeline, dashboards |
| UI/UX designers | Design system, map view wireframes, onboarding flow |
| Frontend dev | PWA shell, service worker, all client modules, UI implementation |
| QA | Test harness, E2E coverage, offline regression suite |

The most technically risky components are the **service worker** (cache invalidation is notoriously subtle) and the **IndexedDB layer** (schema migrations as content evolves). Flag those for early prototyping and dedicated QA attention before the rest of the game loop is built on top of them.
