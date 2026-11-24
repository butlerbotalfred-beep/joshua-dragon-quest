# Royal Dragon Rescue — Build Log (`build/gemini`)

Builder: Gemini 4 Neon
Branch: `build/gemini`
Base commit: `db7f6b9`

## Decisions & Notes

- Keeping static Three.js 0.170.0 site structure with no bundler or framework.
- Music uses the supplied Suno tracks in `assets/audio/` without re-encoding or replacing them; all speech and SFX will be generated with Fish Audio.
- Modular ES modules under `src/` (loaded natively by the browser with no build step) will be used where helpful to keep code maintainable while keeping `index.html`, `styles.css`, and `game.js` as the entry points.

## Milestones

### 0.1 Set up
- **Started:** 2026-11-24T15:54:00Z
- **Finished:** 2026-11-24T15:55:00Z
- **Checks:** Verified branch `build/gemini` exists and is checked out; verified `docs/BUILD_PLAN.md`, `docs/STORY.md`, and `docs/AUDIT.md` exist in `docs/`; created `docs/BUILD_LOG.md`.
- **Result:** PASS
- **Choices:** Will use Playwright (`playwright` as the single test harness devDependency) with Node's built-in `http` server for `npm test`.

### 0.2 Test harness
- **Started:** 2026-11-24T15:55:40Z
- **Finished:** 2026-11-24T15:58:50Z
- **Checks:** `npm test` starts local HTTP server, opens `index.html` in headless Playwright Chromium with WebGL (SwiftShader), starts Level 1, steps 60 seconds of game time via `game.step()`, and asserts 0 console/page errors.
- **Result:** PASS (1 passed, 0 failed)
- **Choices:** Added minimal `simTime` and `step(seconds, dt, doRender)` hook to `DragonQuestGame` without changing prototype gameplay, plus a virtual gamepad shim (`window.__setGamepad`) in `tests/harness.mjs` for upcoming controller tests. Added `playwright` as the single devDependency.

### 0.3 Baseline
- **Started:** 2026-11-24T15:59:45Z
- **Finished:** 2026-11-24T16:00:45Z
- **Checks:** Ran `node tests/baseline.mjs` against the unmodified prototype.
- **Measured Prototype Baseline:**
  - **First-load size:** 160.49 MiB (168.29 MB decimal, 39 local files) — matches audit's ~168 MB.
  - **Memory after 1 level load:** 111 geometries, 60 textures, 26 shader programs.
  - **Memory after 11 level loads:** 446 geometries, 124 textures, 62 shader programs (severe leak, matches audit's 89→426 / 55→124 / 25→64).
  - **Time to beat each guardian (bonded heroes, max attack rate):**
    - Level 1 — Giant Grizzly Bear: Joshua 1.38s, Daniel 1.48s, Vanessa 1.93s, Michael 1.32s
    - Level 2 — Giant Vine Monster: Joshua 1.68s, Daniel 1.12s, Vanessa 2.02s, Michael 1.75s
    - Level 3 — Magma Golem: Joshua 2.02s, Daniel 1.85s, Vanessa 1.55s, Michael 1.78s
    - Level 4 — The Yeti: Joshua 2.02s, Daniel 1.20s, Vanessa 2.70s, Michael 2.18s
    - Level 5 — Stone Gargoyle: Joshua 2.35s, Daniel 2.22s, Vanessa 1.98s, Michael 1.75s
    - Level 6 — Great Black Dragon: Michael 3.48s, Joshua 3.68s, Daniel 4.05s, Vanessa 5.05s (matches audit's 3.5s–5.1s).
- **Result:** PASS
- **Choices:** Kept `tests/baseline.mjs` in `tests/` as a standalone diagnostic script (not part of `npm test` regression suite).

### 1.1 Skipping is safe
- **Started:** 2026-11-24T16:01:15Z
- **Finished:** 2026-11-24T16:02:25Z
- **Checks:** `npm test` — verified Space (jump) no longer skips cutscenes, and skipping the hatching cutscene at t = 0.0, 0.25, 0.5, 1.0, 1.5, 2.1, 2.5, 4.0, 5.5s always bonds the dragon in play (flag + visible dragon mesh) and persists it to localStorage.
- **Result:** PASS (2 passed, 0 failed)
- **Choices:** Added idempotent `grantRewards` callback on cutscene objects, invoked unconditionally by `finishCutscene()` before `onDone()`.

### 1.2 Level select is safe
- **Started:** 2026-11-24T16:03:00Z
- **Finished:** 2026-11-24T16:03:40Z
- **Checks:** `npm test` — bonded all 4 dragons and recorded progress, opened every level (1–6) from the Level Select menu, and verified all 4 dragons remain bonded and visible along with completed levels, highest level, and gold berries.
- **Result:** PASS (3 passed, 0 failed)
- **Choices:** Level Select now preserves existing `bondedDragons[i]` via logical OR with level prerequisites instead of overwriting the array.

### 1.3 Falling is fair
- **Started:** 2026-11-24T16:04:20Z
- **Finished:** 2026-11-24T16:06:25Z
- **Checks:** `npm test` — jumped into every chasm gap in all 6 levels, verified hero returns to `lastSafePos` on the near side (never past the gap), verified lava gaps never show a water-freeze hint, and verified airborne heroes cannot be lifted/teleported onto higher ledges beside steep ramps.
- **Result:** PASS (4 passed, 0 failed)
- **Choices:** Track `hero.lastSafePos` only on verified solid, non-moving, non-steep ground with a 0.65-unit edge inset; tighten airborne step-up tolerance to 0.08u so falling heroes collide with cliff walls instead of snapping upward onto far ledges; generate context-aware fall hints (<=8 words) naming the right gift.

### 1.4 Only the player pushes
- **Started:** 2026-11-24T16:06:58Z
- **Finished:** 2026-11-24T16:07:42Z
- **Checks:** `npm test` — played Level 1 as Joshua for 120 seconds near the East Glade rune block while AI Michael moved beside it; verified block moved 0 units, and verified swapping to Michael still pushes the block normally.
- **Result:** PASS (5 passed, 0 failed)
- **Choices:** Gated `pushPuzzles` movement on `this.p1Hero === 3 || (this.isCoop && this.p2Hero === 3)` and `!michael.trappedByWeb`.
