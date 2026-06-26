# Playtester Diagnostic Playbook

**For:** `chore/decompose-app-ts` branch preview
**URL:** <https://tankhoitv.github.io/compthink-2026-preview/>
**Report to:** The dev team in the `#chore/decompose-app-ts` thread

Use this guide to systematically identify why the preview renders incorrectly
(no animations, visual breakage). Each section builds on the previous — start
with A, only go deeper if needed.

---

## Section A: Quick Check (30 seconds)

Open the browser's DevTools by pressing **F12** (or Cmd+Option+I on Mac).

### Step A1: Open the Console tab

Click **Console** at the top of DevTools.

### Step A2: Check for red error text

Look for lines in red. Ignore yellow warnings (they're usually harmless).

**What you're looking for:**

```
❌ Uncaught TypeError: X is not a function
❌ Uncaught ReferenceError: X is not defined
❌ Failed to load module script: Expected a JavaScript module script but...
❌ GET https://... 404 (Not Found)
```

**How to count errors:**

- Chrome shows a red badge with a number on the Console tab icon
- Click the gear icon ⚙ and check "Show timestamp" to see when errors fire

### Step A3: Try the main flow (30 seconds)

Play as usual — click "Chơi Ngay", start a game, go through draft/planning.
Watch the Console tab as you go. New red errors appearing = relevant.

### If you saw errors → go to Section B

### If you saw NO errors → tell the dev team: "Quick check: 0 JS errors in console"

---

## Section B: Deep Check (2 minutes)

You need to find the **root cause error** — the first error that fires, not the
avalanche of errors it causes downstream.

### Step B1: Reload the page with console open

Press **Ctrl+R** (or Cmd+R) while the Console tab is selected.
Watch the first lines that appear. The very first error is your culprit.

### Step B2: Identify the first error

Errors usually look like:

```
Uncaught TypeError: images is not defined
    at Module.<anonymous> (https://.../app.js:123:45)
```

**Important:** Look for errors at module top-level (like `at Module.<anonymous>`)
not inside event handlers. A top-level error means the module couldn't load.

### Step B3: Find the file and line

Click the source link on the right side of the error (e.g. `app.js:123:45`).
This opens the **Sources** tab. The line is highlighted.

### Step B4: Check the Network tab for missing files

Open the **Network** tab, reload the page (Ctrl+R), and look for:

- Red rows → failed requests
- Files with status **404** or **403**
- Files with status **(failed)** or **blocked**
- Filter by "JS" to see only script files

**Known good files (must all return 200):**

```
build/app.js
build/data/images.js
build/ui/dashboard.js
build/ui/cardDisplay.js
build/ui/boardArena.js
build/ui/draftArena.js
build/ui/arena.js
build/ui/arenaRenderer.js
build/ui/screens.js
build/ui/cardRender.js
build/ui/renderHelpers.js
build/ui/sidePlayerBoards.js
build/ui/HelpBubble.js
build/ui/OnboardingModal.js
build/ui/mapSelection.js
build/actions/debtTokens.js
build/actions/cardPlacement.js
build/actions/utilityEffects.js
build/data/cards.phase1.js
build/data/cardMapper.js
build/game/constants.js
build/game/draft.js
build/game/board.js
build/game/scoring.js
build/game/resources.js
build/game/botPlacement.js
build/game/queries.js
build/online/socketClient.js
build/state/gameState.js
build/export/certificate.js
build/audio/gameAudio.js
```

### Step B5: Check the Elements tab

Open **Elements** tab. Look at the `<div id="app">` element:

- **Empty** `<div id="app"></div>` → JS failed to run at all. 100% a JS error.
- **Has content** → JS started but may have failed later. The visible content is
  what rendered before the error.
- **Incomplete** (e.g. dashboard shows but game board doesn't) → error happens
  when transitioning between screens.

**Collapse/expand trick:** Click the triangle ▶ next to `<div id="app">` to see
its full child structure. Does it look complete?

### Step B6: Check for partial rendering

Navigate through the game screens while watching the Elements tab. At each step:

1. Does the `<div id="app">` get replaced with new content?
2. Are CSS classes present that should trigger animations? Look for class names
   like `*--dealing`, `is-passing`, `*--selected`, `*--active`.
3. Right-click the rendered elements → **Inspect** to see their computed styles.

---

## Section C: Reporting

Copy-paste this template and fill it in. Attach a screenshot of the **Console**
tab (full width, showing errors and timestamps).

```
## Playtester Report

**Browser:** Chrome / Firefox / Edge  (version: _____)
**OS:** Windows / Mac / Linux / Android / iOS
**Tested URL:** https://tankhoitv.github.io/compthink-2026-preview/

### Quick Check
- [ ] Red errors in Console on page load
- [ ] Red errors appear during gameplay
- Count: _____ errors total

### First Error
- Error message: ________________________________
- File: _________________________________________
- Line & column: _________:_________
- Stack trace (first 3 lines):
  ```
  
  ```

### Network Check
- [ ] All JS files returned 200
- [ ] One or more JS files returned 404
- Missing files: _________________________________

### What I Was Doing
- [ ] Just loaded the page (no interaction yet)
- [ ] Clicked "Chơi Ngay" / "Đăng nhập"
- [ ] Started a game (single player / online)
- [ ] Draft phase
- [ ] Planning phase
- [ ] Simulation / scoring
- [ ] Something else: ____________________________

### Screenshots
- Console tab (full width): [attached]
- App content (Elements tab > div#app): [attached]

### Description
What looks wrong? Be specific about what you expected vs what you see:
```

### Screenshot tips

| What | How |
|------|-----|
| Console errors | F12 → Console → right-click → "Save as..." or screenshot |
| Network 404s | F12 → Network → filter: JS → screenshot |
| App content | F12 → Elements → find `<div id="app">` → expand → screenshot |
| Missing animation | Capture the moment the animation should fire, with Console visible |

---

## Common patterns to look for

| Pattern | What it means |
|---------|---------------|
| `Uncaught TypeError: X is not a function` | Module imported `X` but it wasn't exported from its module |
| `Uncaught ReferenceError: X is not defined` | Variable used before declaration, or missing import |
| `Failed to load module script` | Import path resolves to a 404 |
| `404` on `*.js` files in the Network tab | Build didn't copy the file to the right directory |
| Multiple identical errors on each interaction | Event handler attached but function doesn't exist |
| Animation classes not applied (Elements tab) | JS runs but the animation-triggering logic never fires |
| Empty `<div id="app">` with no errors in Console | CSS might be blocking, or browser extension interfering |

---

## Last resort

If the Console shows zero errors and all files load OK, but the page still
looks broken:

1. **Hard refresh:** Ctrl+Shift+R (bypasses cache)
2. **Try incognito/private window** (rules out extensions)
3. **Take a screenshot** and send it anyway — a visual diff helps spot issues
   the Console can't catch (wrong asset URL, missing background image, etc.)
4. **Note the browser make and version** — some features may differ
