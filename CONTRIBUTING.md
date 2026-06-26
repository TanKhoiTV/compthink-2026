# Contributing to TREKPOLOGY (Traveling Game)

Thanks for helping build TREKPOLOGY. This is a **documentation-first** repo — we plan and agree on architecture before writing code. All contributions are welcome: docs, ADRs, diagrams, meeting notes, and source code.

## Repository Overview

```
compthink-2026/
├── src/                # Client TypeScript source
│   ├── game/           # Pure game logic (board, deck, draft, scoring, queries, resources)
│   ├── actions/        # State-mutation actions (cardPlacement, debtTokens, utilityEffects)
│   ├── ui/             # DOM rendering (arena, screens, cards, dashboard, help)
│   ├── audio/          # Web Audio API BGM + sound effects
│   ├── data/           # Card definitions + images constant
│   ├── online/         # Socket.IO client
│   ├── state/          # GameState singleton
│   ├── export/         # Travel certificate export
│   └── styles/         # Less stylesheets
├── server/             # Node.js + Socket.IO backend
├── assets/             # Card images (LFS), sounds, backgrounds, videos
├── docs/               # Documentation
│   ├── adr/            # Architecture Decision Records
│   ├── ARCHITECTURE-REFERENCE.md
│   └── game-logic-design.md
├── build/              # Compiled output (gitignored)
├── Dockerfile          # Server container
└── .github/workflows/  # CI/CD
```

## Development Setup

### Prerequisites

- **Node.js 22+** — check with `node --version`
- **npm** (ships with Node.js)
- **Git LFS** for card images: `git lfs install`

### One-Time Setup

```bash
git clone https://github.com/TanKhoiTV/compthink-2026.git
cd compthink-2026
npm install                  # Client dependencies (TypeScript, Less, Vitest)
cd server && npm install     # Server dependencies (Socket.IO, tsx)
cd ..
```

### Build the Client

```bash
npm run build
```

This runs:

1. **tsc** — compiles `src/` TypeScript to `build/` (no bundler, vanilla JS)
2. **lessc** — compiles `src/styles/client.less` to `build/client.css`
3. **postbuild** — copies `build/*` to the project root so `npx serve .` and similar static servers can serve files

After build, compiled files live in both `build/` (for CI deployment) and the project root (for local dev). Root-level artifacts are gitignored — `git status` stays clean.

### Run Tests

```bash
npm test                     # vitest run (112 tests, 8 test files)
npm run test:watch           # vitest --watch
```

Tests cover all pure game logic (board, deck, draft, scoring, resources, queries) and action modules. See `vitest.config.ts` and `vitest.setup.ts` for configuration.

### Run Locally (Single-Player, No Server)

```bash
npm run build                # One-time build (output is flattened to root)
npx serve . -l 5174          # Any static HTTP server works
```

Open [http://localhost:5174](http://localhost:5174). You should see the TREKPOLOGY lobby screen.
The app runs in offline single-player mode — drafting uses simulated bots, no server needed.

### Run Locally (Multiplayer, With Server)

You need three terminals for the full E2E experience:

```bash
# Terminal 1 — Build the client
npm run build

# Terminal 2 — Start the Socket.IO server
cd server
npm start                     # Listens on port 3001

# Terminal 3 — Serve the client
cd ..
npx serve . -l 5174           # Or use python3 -m http.server 5174
```

Open **two browser tabs** at [http://localhost:5174](http://localhost:5174):

1. Click **Chơi Online** (Play Online) → enter a room name → **Tạo Phòng** (Create Room)
2. In the second tab, enter the same room name → **Vào Phòng** (Join Room)
3. Both players join the lobby and the host starts the game

The client (`socketClient.ts`) connects to `http://localhost:3001` (Socket.IO server). To connect to a different server, edit the URL in `src/online/socketClient.ts` and rebuild.

### Watching for Changes (Development)

```bash
# Terminal 1 — Auto-rebuild TypeScript on save
npm run dev:tsc

# Terminal 2 — Auto-rebuild CSS on save
npm run dev:css

# Terminal 3 — Static server (reload browser on changes)
npx serve . -l 5174
```

TypeScript and Less compile on every file save. Refresh the browser to see changes. No hot reload — it's vanilla DOM.

### CI/CD

Three GitHub Actions workflows run automatically:

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | Any push to `main` or PR | deno fmt --check → Node.js setup → npm ci → npx tsc --noEmit → npx vitest run → npm run build |
| `deploy-pages.yml` | Push to `main` | Build frontend → patch socket URL to production HF Space → copy to `_site/` → deploy to GitHub Pages |
| `deploy-server.yml` | Push to `main` (server/ or src/data/ or Dockerfile) | Clone HF Space repo → replace server files → commit and push via HF_TOKEN secret |

> The `ci.yml` workflow enforces formatting via `deno fmt --check` (Deno is installed in CI separately) and runs full type checking + tests before building. The deployed GitHub Pages URL uses a patched socket URL pointing to the production HF Space instead of `localhost:3001`.

## Working with Branches

The `main` branch is protected. All work goes through feature branches.

### Branch Naming

```
<type>/<short-description>
```

Examples:

```
feat/game-loop-flow
docs/adr-scoring-module
fix/typo-architecture-diagram
chore/meeting-notes-sprint-3
```

| Type | Use for |
|---|---|
| `feat` | New feature, capability, or design document |
| `fix` | Correction to an existing doc or spec |
| `docs` | Documentation-only changes |
| `refactor` | Restructuring docs with no content change |
| `test` | Test plans or acceptance criteria |
| `chore` | Repo maintenance (templates, config, tooling) |
| `ci` | CI/CD or automation changes |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

Keep the description lowercase, imperative mood, no trailing period.

```
docs(adr): add ADR for location card scoring
feat(game): outline game-loop state machine
docs(meeting): add sprint-3 notes
fix(architecture): correct interface IF-2 arrow direction
```

**Scopes** we use:

| Scope | Use for |
|---|---|
| `adr` | Architecture Decision Records |
| `poc` | Proof-of-concept documents |
| `ui` | UI/UX specifications |
| `meeting` | Sprint notes and meeting minutes |
| `infra` | Infrastructure and deployment docs |
| `game` | Game mechanics and rules docs |
| `data` | Data pipeline and content bundles |

## Workflow

1. Sync your local `main`:

   ```bash
   git checkout main
   git pull origin main --rebase
   ```

2. Create a working branch:

   ```bash
   git checkout -b <type>/<short-description>
   ```

3. Make your changes. For docs, we prefer **plain Markdown** where possible. Use `.html` only when the content benefits from embedded SVG diagrams or interactive elements.

4. Commit and push:

   ```bash
   git add <files>
   git commit -m "<type>(<scope>): <description>"
   git push -u origin <branch>
   ```

5. Open a Pull Request against `main`. Reference any related issues. Use the PR template:
   - What this change does
   - Related issue(s) or ADR(s)
   - Any decisions or trade-offs made

### Merge Strategy

Always **squash merge** PRs into `main`. Every merged PR becomes one clean commit. No merge commits or rebase merges for feature branches.

### Branch Cleanup

Delete feature branches after their PR is merged or closed:

```bash
# Delete remote branch after merge/close
git push origin --delete <branch-name>

# Prune stale local tracking references
git fetch origin --prune
```

Branches left behind after merge clutter the remote and can cause confusion (e.g., being mistaken for active work or accidentally rebased and re-PR'd). Delete them promptly.

## Working with ADRs

Architecture Decision Records live in `docs/adr/`. Each ADR is a Markdown file following the standard template:

```markdown
# ADR-<number>: <Title>

**Status:** Proposed | Accepted | Deprecated | Superseded

**Context:** ...what is the problem or decision to be made?

**Decision:** ...what did we decide and why?

**Consequences:** ...what trade-offs, risks, or follow-ups arise?
```

- To propose a new ADR, create a file with **Status: Proposed** and open a PR.
- To change an existing ADR, update the file and note the reason in the commit body.
- Superseded ADRs remain in the repo for history — update their status, don't delete them.

## Documentation Style

- Use **clear, plain English**. Avoid jargon unless it's defined.
- Prefer **tables and lists** over dense paragraphs for specifications.
- Diagrams should be embedded as **SVG** or **Mermaid** when possible.
- All docs live under `docs/` — keep the root clean.
- When updating an existing doc, preserve the original author's intent unless a formal decision changed it.

## Need Help?

Open an issue with the appropriate template (task or question). Assign it to the relevant team member. If it's a quick question, bring it up in the team channel.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
