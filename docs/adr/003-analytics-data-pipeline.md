# ADR 003: Analytics Data Pipeline

## Status

Proposed

---

## Terminology

This section defines key terms used in this document. If you are already familiar with data engineering, you can skip ahead to Context.

**Event-driven Analytics**: A method of tracking user behavior by logging specific actions (events) rather than just page views. Each event contains a name (e.g., "quest_completed") and properties (e.g., "quest_id: 42").

**Batching**: The process of grouping multiple analytics events together and sending them to the server in a single network request. This is more efficient than sending a request for every individual action, especially on mobile data.

**PII (Personally Identifiable Information)**: Any data that could be used to identify a specific individual (names, emails, precise GPS coordinates). This pipeline is designed to avoid collecting PII.

**Ingestion**: The process of receiving and importing data from the frontend into the backend storage system.

**Payload**: The actual data content sent in an HTTP request, typically formatted as JSON in this project.

**JSON (JavaScript Object Notation)**: A lightweight format for storing and transporting data. It is easy for the frontend to generate and for the backend to store in a flexible way.

---

## Context

As established in ADR 001 and ADR 002, the "Traveling Game" follows a "fetch once, run local" architecture. While the core gameplay is offline-first, we require visibility into how players interact with the game world to inform future design decisions.

We have a designated interface, IF-3, for analytics instrumentation. The primary challenge is bridging the gap between client-side event generation and a reliable storage solution without violating the project's goal of minimal backend complexity. Because players are often offline, the pipeline must handle intermittent connectivity gracefully without interrupting the player experience.

---

## Interfaces Relevant to Analytics

**IF-3 — Analytics Events (Frontend produces → Backend receives)**

This is the primary exchange point for data collection.

- Frontend Responsibility: The client instruments gameplay milestones (e.g., location discovery, quest completion). These are stored in IndexedDB if the device is offline and dispatched to the backend when a connection is available.

- Backend Responsibility: The backend must provide a robust endpoint to receive these JSON payloads and commit them to the database without performing complex processing that could slow down the response.

---

## Decision

We will implement a lightweight, event-based analytics collection point using the existing infrastructure stack.

### 1. Ingestion (Frontend)

The frontend will use a batch-and-forward strategy. Rather than firing a request for every event, the app will collect events in the local Dexie.js store. At logical intervals (e.g., every 5 minutes or upon app launch/close), the client will attempt to send the batch to the PocketBase IF-3 endpoint.

### 2. Storage (Backend)

We will use a dedicated PocketBase collection named analytics_events.

- Schema: To maintain flexibility during the demo phase, the collection will use a "JSON" field type for the event properties. This allows the data dev and analysts to add new event types without requiring immediate database migrations on the backend.

- Security: The collection will be "Create Only" for API users to prevent players from viewing or deleting existing analytics data.

### 3. Processing & Visualization

For the duration of the demo, we will prioritize simplicity over real-time dashboards. The data analyst will perform manual exports of the SQLite collection via the PocketBase Admin UI. This data can then be imported into local tools (Excel, Python/Pandas, or Tableau) for analysis.

---

## Alternatives Considered

**Third-Party Services (Google Analytics / Mixpanel)**: Rejected. These services often require heavy client-side SDKs and can be difficult to configure for purely offline-first environments. Keeping data on our own VPS ensures total privacy and no external costs.

**Dedicated Time-Series Database (InfluxDB)**: Rejected. While superior for high-volume analytics, it would require a second server process and significantly increase the DevOps overhead. PocketBase’s SQLite-backed storage is sufficient for the expected scale of this demo.

---

## Consequences

### Positive

* **Zero Additional Infrastructure**: We leverage the existing PocketBase and Nginx setup, adding no new technical debt to the deployment.

* **Privacy by Design**: No PII is collected or sent to third-party servers.

* **Schema Flexibility**: Using JSON fields in SQLite allows the analytics to evolve quickly as new quests or features are added.

### Negative

* **Manual Effort**: There is no automated dashboarding; visualization is a manual "export and analyze" process.

* **Database Growth**: High-frequency event tracking could significantly increase the size of the pb_data file. The team must monitor the VPS disk space if the player base grows.

* **Frontend Logic Complexity**: The frontend developer is responsible for the logic to queue, batch, and retry event uploads, which is more complex than simple "fire-and-forget" tracking.
