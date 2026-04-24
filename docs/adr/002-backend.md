# ADR 002: Backend — PocketBase as the Server Platform

## Status

Proposed

---

## Terminology

This section defines key terms used in this document. If you are already familiar with backend development, you can skip ahead to Context.

**Backend / Server**: The part of the system that runs on a remote computer — not on the player's device. In this project, the backend's job is limited: it stores and serves the game content bundle, responds to version checks, and optionally receives analytics events. It does not run game logic.

**PocketBase**: A single-file application written in the Go programming language that bundles a database, a web API, file storage, and an admin interface into one downloadable program. Rather than assembling these pieces separately, you run one file and get all of them at once.

**Database**: An organised store of information. PocketBase uses SQLite as its database — a file-based database that lives on the same machine as the application, requiring no separate database server to install or manage.

**SQLite**: A lightweight, file-based database. Unlike larger database systems (PostgreSQL, MySQL) that run as separate services and require dedicated configuration, SQLite stores everything in a single file on disk. This makes it simple to set up and back up, but it means only one process can write to it at a time, and it cannot be distributed across multiple machines.

**API (Application Programming Interface)**: A defined set of URLs (called endpoints) that the frontend app can call to exchange data with the server. The frontend doesn't need to know how the server works internally — it just knows which URL to call and what data to send or expect back.

**REST API**: A common style of API where each URL represents a resource (e.g. `/api/bundle`, `/api/version`) and standard HTTP methods (GET, POST) are used to read or write data.

**Admin UI**: A web-based control panel built into PocketBase. It lets authorised team members create and edit database records, manage files, configure collections, and view data — through a browser, without writing any code.

**CMS (Content Management System)**: A tool for creating and editing content without technical knowledge. In this project, PocketBase's admin UI effectively serves as the CMS — the game designer and data dev can author and update game content through it.

**VPS (Virtual Private Server)**: A rented virtual machine running in a data centre. It behaves like a dedicated computer that is always online. For this project, PocketBase runs on a VPS. Common providers include Hetzner, DigitalOcean, and Fly.io.

**Nginx**: A widely used web server and reverse proxy. In this setup, Nginx sits in front of PocketBase and handles incoming web traffic — managing HTTPS connections, forwarding requests to PocketBase, and providing a layer of control over what is publicly accessible.

**TLS / HTTPS**: TLS (Transport Layer Security) is the technology that encrypts data in transit between the player's device and the server. HTTPS is the result of applying TLS to a standard web connection — the padlock in the browser bar. Service workers (used by the PWA frontend) require HTTPS and will not work on plain HTTP connections.

**Certbot**: A free, automated tool that obtains and renews TLS certificates from Let's Encrypt, a free certificate authority. It is the standard way to enable HTTPS on a self-hosted VPS without a recurring cost.

**Horizontal scaling**: Running multiple copies of an application across multiple machines to handle more users simultaneously. PocketBase does not support this — it is designed to run as a single instance. This is not a problem for a demo, but it is a ceiling to be aware of.

**Interfaces (IF-1 through IF-4)**: The four agreed exchange points between the frontend client and the backend server, as defined in the Architecture Scoping Plan §04. The backend is responsible for implementing and maintaining all four. See the Interfaces section below.

---

## Context

ADR 001 established that the frontend will operate as a PWA with an offline-first model. That model requires a backend that performs a specific, limited set of jobs:

1. Serve a versioned game content bundle to the client on first install (IF-1).
2. Accept content from the game designer and data dev, and transform it into that bundle format (IF-2).
3. Receive optional analytics events from clients during gameplay (IF-3).
4. Respond to a lightweight version check on each app launch (IF-4).

That is the complete scope of the backend for this demo. The backend does not run game logic, manage sessions, or authenticate players. It is essentially a content delivery and data collection service.

Given this narrow scope, the backend platform should be as simple to set up and operate as possible. The team has no dedicated backend engineer and no DevOps specialist. Whoever takes backend responsibility needs to be productive quickly, without extensive infrastructure knowledge.

---

## Interfaces the Backend is Responsible For

The backend “owns” the server-side endpoint implementation for all four interfaces (IF-1..IF-4). The frontend is directly responsible for the client-side behavior and failure handling for IF-1, IF-3, and IF-4 (downloading/storing, emitting events, and performing launch-time version checks). The data platform owns the content that powers IF-2.

**IF-1 — Bootstrap Endpoint** *(Backend serves → Frontend consumes)*
The primary data delivery interface. The backend exposes a URL that the frontend calls on first install to download the complete game content bundle. The bundle is a structured JSON file (or set of files) containing all locations, quests, items, and events. It must include a `bundle_version` field — a hash or identifier that uniquely identifies this version of the content. The backend dev and data dev must agree on the exact bundle structure (the schema) before either side begins implementation. Changes to this structure after implementation require coordinated updates on both sides.

**IF-2 — Content Schema** *(Data Platform → Backend)*
The internal contract between the data dev and backend dev. The game designer and data dev author content in PocketBase's admin UI (acting as the CMS). The backend is responsible for taking that raw content and producing the correctly formatted bundle that IF-1 serves to the frontend. IF-2 is invisible to the frontend — it describes the internal transformation, not a public endpoint. The backend dev and data dev own this contract jointly.

**IF-3 — Analytics Events** *(Frontend produces → Backend receives)*
An optional endpoint that receives structured event payloads from the client during gameplay (e.g. "player visited location X", "quest Y completed"). The backend receives these events and stores or forwards them for the analysts to work with. This endpoint must accept events without blocking the client — if the backend is slow or temporarily unavailable, the frontend should not be affected. The analysts define the event schema; the backend dev builds the ingest endpoint; the frontend dev instruments the client.

**IF-4 — Version Check** *(Frontend initiates → Backend responds)*
A lightweight endpoint called by the frontend each time the app launches. The client sends its currently stored `bundle_version`. The backend compares it against the current version and responds with a simple signal: either "you are up to date" or "a new version is available." This endpoint must be fast — it is on the critical path of every app launch. It must also be robust: if the backend is unreachable, the frontend should still be able to start the game from its local copy.

---

## Decision

We will use **PocketBase** as the backend server platform, deployed on a single VPS behind Nginx with HTTPS provisioned via Certbot.

### PocketBase

PocketBase is a single executable file. Running it gives the team: a SQLite-backed database, a REST API, file storage, and an admin UI — immediately, with no configuration of separate services. For a demo with a small team and a fast timeline, this is the most direct path to a working backend.

In this project, PocketBase covers all four interfaces:

* **IF-1**: A collection in PocketBase holds the versioned game bundle. The endpoint is exposed as a standard REST API route. Alternatively, the bundle can be served as a static file from PocketBase's file storage if the bundle is pre-built by the data pipeline.
* **IF-2**: The PocketBase admin UI acts as the CMS. The game designer and data dev create and manage content through the browser-based interface. The backend dev configures the collections (the database tables) and the transformation logic that produces the IF-1 bundle from that raw content.
* **IF-3**: PocketBase can accept analytics event payloads via a custom API route or a dedicated collection. Records are stored in SQLite for the analysts to export or query.
* **IF-4**: A lightweight custom route that compares the client's submitted `bundle_version` against the current value and returns the appropriate response. This can be a simple read from a settings record in PocketBase.

### Hosting

PocketBase runs on a single VPS. Nginx sits in front of it as a reverse proxy, handling HTTPS termination and forwarding traffic to PocketBase on its local port. Certbot provisions and auto-renews the TLS certificate from Let's Encrypt at no cost.

**TLS must be configured before any frontend live testing can begin.** Service workers (the technology that enables offline gameplay in ADR 001) will not register without HTTPS. This is a hard sequencing dependency: the server must be reachable over HTTPS before the frontend developer can test IF-1, IF-3, or IF-4 against the live environment.

---

## Alternatives Considered

**Custom backend (Node.js / Express or similar)**: Building a backend from scratch gives full control but requires significantly more setup time for equivalent functionality. The team would need to separately choose and configure a database, write the API layer, manage database connections, and build an admin interface for content authoring. Rejected in favour of PocketBase for demo speed.

**Managed platforms (Supabase, Firebase)**: These are cloud-hosted backend services that provide similar functionality. They are faster to get started with than a custom build, but they introduce a dependency on an external service, add ongoing cost, and require internet access to administer. Rejected in favour of a self-contained, self-hosted solution.

**Separate database server (PostgreSQL / MySQL with a Node API)**: More powerful than SQLite and supports horizontal scaling, but adds significant operational complexity for a demo — a separate database server to install, configure, and keep running alongside the API. Rejected as unnecessary overhead for this scope.

---

## Consequences

### Positive

* **Single binary, minimal operational overhead**: The entire backend is one executable file. There is no database server, no separate cache layer, no process manager beyond a simple systemd service. A team member without backend experience can follow the PocketBase documentation and have a working server running quickly.
* **Built-in admin UI serves as a CMS from day one**: The game designer and data dev can create and edit content through the browser-based admin interface immediately, without waiting for a custom tool to be built.
* **All four interfaces covered without custom frameworks**: PocketBase's collections, file storage, and custom routes are sufficient to implement IF-1 through IF-4 without introducing additional backend technologies.
* **No external service dependencies**: The entire backend stack — PocketBase, Nginx, Certbot — runs on the VPS. There are no third-party services that can go down or change pricing.

### Negative

* **No horizontal scaling**: PocketBase runs as a single instance. If the demo unexpectedly needs to handle many simultaneous users, there is no straightforward way to run multiple copies. Any path to production at scale requires a full backend re-evaluation.
* **SQLite is a single-writer database**: Only one process can write to the database at a time. For the demo's expected load this is not a concern, but it is a ceiling worth recording.
* **TLS is a hard prerequisite that creates a sequencing risk**: The frontend developer cannot test live integration until HTTPS is running. If VPS setup is delayed, it blocks frontend testing. This dependency should be resolved as early as possible in the project timeline.
* **PocketBase custom logic lives outside standard frameworks**: If the team needs to write custom server-side logic (e.g. bundle generation, event validation), it must be written in Go or via PocketBase's JavaScript hook system. This may be unfamiliar to team members with a JavaScript-only background.
* **Backup and recovery is the team's responsibility**: Because PocketBase is self-hosted, database backups must be configured manually. SQLite's single-file nature makes this straightforward, but it does not happen automatically.
