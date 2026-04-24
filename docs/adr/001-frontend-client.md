# ADR 001: Frontend — Progressive Web App (PWA) Architecture

## Status

Proposed

---

## Terminology

This section defines key terms used in this document. If you are already familiar with web development, you can skip ahead to Context.

**PWA (Progressive Web App)**: A website that has been built to behave like a mobile or desktop app. It can be installed on a device directly from the browser, works offline, and loads instantly after the first visit — without going through an app store.

**Service Worker**: A small background script that runs separately from the main app. Think of it as a smart cache manager sitting between the app and the internet. It intercepts network requests and can serve saved content when there is no connection, so the player never sees a blank screen just because they lost signal.

**IndexedDB**: A built-in storage system available in every modern browser. Unlike a cookie or simple local storage, it can hold large amounts of structured data. In this project, it stores the entire game world, the player's progress, and all runtime state. Everything lives on the player's device.

**Dexie.js**: A library that makes IndexedDB easier and safer to work with. Raw IndexedDB has a complex programming interface; Dexie wraps it in simpler, more readable code and provides a controlled process for updating the stored data structure over time (called migrations — see below).

**Bundle**: A single packaged file (or small set of files) that contains everything the app needs to run — code, game content, and assets. The player downloads this once at install. After that, the game runs from this local copy.

**Vite**: A build tool used by the developer. It takes the developer's source code and compiles, optimises, and packages it into the files the browser actually runs. It also runs a local development server so the team can test the app during development.

**vite-plugin-pwa**: A plugin for Vite that automates the most complex parts of PWA setup — generating the service worker, writing the Web App Manifest (the file that tells browsers how to display and install the app), and managing which files get cached and when.

**Framework (Svelte / Vue / React)**: A structured toolkit for building user interfaces. Rather than writing raw HTML and JavaScript for every screen and interaction, a framework provides ready-made patterns and tools. Svelte, Vue, and React are three popular choices. They are interchangeable from an architectural standpoint but differ in syntax, learning curve, and the size of code they add to the final bundle.

**HTTPS / TLS**: HTTPS is the secure version of the web protocol — the padlock you see in the browser address bar. TLS is the underlying technology that encrypts the connection. Service workers are a powerful feature and browsers only permit them on secure (HTTPS) connections. This means TLS must be set up on the server before any live testing of the app's offline behaviour can take place.

**Schema / Migration**: A schema is the defined structure of stored data — which fields exist and what type of information each holds. A migration is a controlled, versioned update to that structure when something needs to change. Without properly managed migrations, updating the app can corrupt or delete existing player data.

**FSM (Finite State Machine)**: A programming pattern used for game logic. Rather than writing complex chains of conditions, an FSM defines a fixed set of states (e.g. "quest available", "quest active", "quest complete") and the exact transitions allowed between them. It makes game behaviour predictable and easy to test.

**Interfaces (IF-1 through IF-4)**: The four agreed exchange points between the frontend and the backend, as defined in the Architecture Scoping Plan §04. Each interface describes *what* data crosses the boundary between the two sides, not how either side implements it internally. The frontend is directly involved in three of them; see the Interfaces section below.

---

## Context

The "Traveling Game" is a location-based game played on a player's own device — phone or tablet. The core design requirement is that gameplay must work entirely offline after an initial setup. A player should be able to walk through a city, trigger quests, and track their progress without needing an active internet connection at any point during play.

This rules out the typical web application model, where a server does the heavy lifting and the browser is simply a display window. Every request to the server for content or game logic would require a live connection — which the player may not always have.

Instead, the model is **"fetch once, run local"**:

1. On first install, the app downloads a complete bundle of game content from the server (via IF-1).
2. From that point forward, all game logic runs entirely on the player's device.
3. On each subsequent launch, the app checks whether the content bundle has been updated (via IF-4). If yes, it downloads the new bundle before starting. If no, it runs from the local copy.
4. Optionally, gameplay events are sent back to the server for analytics (via IF-3). This never affects gameplay — if the network is unavailable, events are queued or dropped silently, and the game continues.

---

## Interfaces Relevant to the Frontend

The Architecture Scoping Plan defines four interfaces (IF-1 through IF-4) — the only permitted communication points between the frontend client and the backend server. The frontend is directly responsible for three of them and must handle every failure case gracefully, because players may be offline or on an unreliable connection at any time.

**IF-1 — Bootstrap Endpoint** *(Frontend consumes)*
The server provides a single versioned bundle containing the entire game world: all locations, quests, items, and events. The client downloads this once at install and stores it in IndexedDB. The bundle includes a `bundle_version` identifier, which the client stores alongside the content. The frontend is responsible for: requesting the bundle on first install, storing it correctly in IndexedDB, and showing the player meaningful feedback during the download (a progress indicator or loading screen). If the download fails halfway, the app should not be left in a broken state.

**IF-3 — Analytics Events** *(Frontend produces, optional)*
As the player progresses — visiting a location, completing a quest, starting a session — the client fires structured event payloads to the backend analytics endpoint. These events must never block or interrupt gameplay. If the network is unavailable, events are either queued locally for later delivery or silently dropped; the game continues regardless. The event structure (which fields, which names, which types) must be agreed between the frontend dev and the analysts before instrumentation work begins.

**IF-4 — Version Check** *(Frontend initiates)*
Each time the app launches, before loading the game, the client sends its stored `bundle_version` to the server. The server replies with one of two answers: "you are up to date" or "a new version is available." If a new version is available, the client re-downloads the bundle via IF-1 before starting. Critically: if the network is unreachable at launch, the client must still start the game using the locally stored bundle. The app should never refuse to launch simply because the version check could not reach the server.

**IF-2 — Content Schema** *(Frontend does not own, but depends on)*
IF-2 is the internal contract between the backend dev and data dev, describing how raw content is transformed into the bundle format the client receives. The frontend does not implement this, but the shape of the IF-1 bundle is its direct output. The bundle structure must be agreed and stable before the frontend dev begins building the local data layer — any later changes to the bundle shape require coordinated updates on both sides.

---

## Decision

We will implement the frontend as a Progressive Web App using the following stack:

**Svelte via SvelteKit** as the frontend framework. Svelte compiles to plain JavaScript with no framework runtime bundled into the final output — this produces smaller downloads, which matters directly given the IF-1 bundle size constraint. SvelteKit provides project structure, routing, and has first-class PWA support when paired with `vite-plugin-pwa`. If the assigned frontend developer has strong existing experience with Vue or React, that is a valid reason to revisit this choice — the architecture does not depend on which framework is selected.

**Vite with vite-plugin-pwa** as the build toolchain. `vite-plugin-pwa` generates the service worker, injects the Web App Manifest, and manages cache versioning automatically using Workbox. This handles the most complex and error-prone parts of service worker setup, reducing the risk of subtle caching bugs that are difficult to reproduce and diagnose.

**Dexie.js over IndexedDB** as the local data layer. All game content received via IF-1, and all player progress generated during gameplay, is stored in IndexedDB through Dexie. Dexie's migration system ensures every future change to the stored data structure is versioned, applied in order, and non-destructive to existing data.

**Service Worker (managed by vite-plugin-pwa)** for offline capability and asset caching. After the first install, the service worker ensures the app loads even with no network. It also manages cache invalidation when a new bundle version is detected via IF-4.

---

## Alternatives Considered

**Native app (iOS / Android)**: Rejected. Distributing through app stores requires platform-specific builds, developer accounts, and review processes that are incompatible with the demo timeline. A PWA installs directly from the browser with none of that overhead.

**Server-rendered SPA**: Rejected. If the server renders pages on demand, a live connection is required for every screen. This directly contradicts the offline-first requirement.

**React**: Not selected as the primary recommendation. React ships a heavier runtime than Svelte, which adds to the total download size. It remains a valid fallback if the frontend developer's existing experience strongly favours it.

**Vue**: A reasonable middle ground between Svelte and React in terms of bundle size and learning curve. Not selected as the primary recommendation but architecturally equivalent — acceptable if developer familiarity favours it.

**Raw IndexedDB without Dexie**: Rejected. Raw IndexedDB has a verbose, asynchronous API that is difficult to use correctly, especially for schema migrations. Dexie provides a clean abstraction with negligible added weight.

---

## Consequences

### Positive

* **Works offline by design**: After the first install, the game runs entirely from the device. No internet connection is required during play.
* **No app store required**: Players install via their browser. There is no submission process, review wait, or platform fee.
* **Self-contained and fast**: Because everything is stored locally, gameplay is consistent and instant regardless of network conditions.
* **Automated service worker management**: `vite-plugin-pwa` handles the most complex parts of the service worker lifecycle, reducing the risk of caching errors that are hard to debug.

### Negative

* **No native push notifications without additional infrastructure**: Browser push notifications require a separate notification service and explicit user permission. This is out of scope for the demo but limits future feature options if push is ever needed.
* **IndexedDB schema changes are the frontend dev's permanent responsibility**: There is no automated tool managing data migrations. Every future change to how data is stored must be written as an explicit, versioned migration. If done incorrectly, player data can be corrupted or silently lost on update.
* **Bundle size is a shared constraint, not just a technical one**: The content downloaded via IF-1 must stay within a size budget that does not make first install feel slow. This is not something the frontend dev can solve alone — the game designer and data dev must agree on content limits before production begins.
* **HTTPS is required before live testing can begin**: Service workers will not function on plain HTTP. TLS must be provisioned on the server before the frontend developer can test any offline behaviour against the live environment. This is a sequencing dependency the team should resolve early.
* **Svelte is less widely known than React**: If the assigned developer is unfamiliar with Svelte, there is a learning curve before they are productive. This should be confirmed before the framework choice is finalised.
