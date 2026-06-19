# Contributing to Traveling Game

Thanks for helping build the Traveling Game. This is a **documentation-first** repo — we plan and agree on architecture before writing code. All contributions are welcome: docs, ADRs, diagrams, meeting notes, and eventually source code.

## Repository Overview

```
compthink-2026/
├── docs/
│   ├── adr/               # Architecture Decision Records
│   ├── poc/               # Proof-of-concept documents
│   │   └── ui-docs/       # UX/UI specifications
│   ├── meetings/notes/    # Sprint notes and discussion records
│   ├── architecture.html  # System architecture diagram
│   └── team-scoping-plan.html  # Domain & interface breakdown
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

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
