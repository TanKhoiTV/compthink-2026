## Branch and Commit Naming

### Branches

Branch names follow the pattern `<type>/<short-description>`, where words
are separated by hyphens.

```
feat/sql-parser
fix/crc32-overflow
chore/pr-templates
ci/release-workflow
```

**Types:**

| Type | Use for |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring with no behavior change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Repo/project maintenance (config, templates, tooling) |
| `ci` | CI/CD pipeline and automation changes |

---

### Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <short description>
```

The description is lowercase, imperative mood, and has no trailing period.

```
feat(sql): add recursive descent parser for SELECT
fix(kv): handle CRC-32 overflow on large entries
docs: document Schema::compute_metadata contract
chore(github): add issue and PR templates
ci(build): pin actions/checkout to SHA
```

**Scopes** are optional but encouraged for larger codebases. Use the
module or subsystem name: `core`, `kv`, `table`, `sql`, `ci`, `github`.

**Breaking changes** are marked with a `!` before the colon and explained
in the commit body:

```
feat(sql)!: replace token enum with std::variant

BREAKING CHANGE: TokenKind is no longer a plain enum.
Callers must update match arms to use the new variant types.
```
