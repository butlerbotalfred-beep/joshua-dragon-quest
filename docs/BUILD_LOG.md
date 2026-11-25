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

### 1.5 Memory is released
- **Started:** 2026-11-24T16:08:30Z
- **Finished:** 2026-11-24T16:16:20Z
- **Checks:** `npm test` — loaded all 32 GLBs, then ran 11 level loads across all 6 biomes; verified WebGL counts stayed within 10% of the 1st load:
  - 1st load: 57 geometries, 34 textures, 12 shader programs
  - 11th load: 60 geometries, 33 textures, 12 shader programs
- **Result:** PASS (6 passed, 0 failed)
- **Choices:** Added `disposeObject3D()` in `clearWorld()` and on expiring VFX/projectiles/danger zones; called `o.skeleton.dispose()` on `SkinnedMesh` clones to free `boneTexture`s; replaced per-prop `PointLight`s with two fixed scene-level accent lights (`goalAccentLight`, `bossAccentLight`) and unified fog to `THREE.Fog` so WebGL shader program count stays constant; pooled shared particle geometry and cached particle materials.

### 2.1 Difficulty
- **Started:** 2026-11-24T16:17:15Z
- **Finished:** 2026-11-24T16:20:30Z
- **Checks:** `npm test` — selected difficulty on Title screen, verified saved to localStorage, cycled difficulty from Pause menu, verified idle bot beside a guardian on Easy never loses over 5 minutes (300s), and verified idle bot on Hard is defeated in 5.8s (< 30s).
- **Result:** PASS (7 passed, 0 failed)
- **Choices:** Centralized difficulty presets and core tuning constants in `src/config.js`; updated title to "The Royal Dragon Rescue" per `STORY.md`. On Easy, knocked-down heroes bounce back up automatically after 1.8s and never trigger Game Over.

### 2.2 Controller
- **Started:** 2026-11-24T16:21:30Z
- **Finished:** 2026-11-24T16:22:45Z
- **Checks:** `npm test stage2` — bot navigated Title screen, picked Medium difficulty, launched game, entered Level 1, moved forward with Left Stick, attacked with X, jumped with A, swapped hero with Y, paused with Start, cycled difficulty to Hard in Pause menu, and resumed with B using ONLY Xbox controller inputs.
- **Result:** PASS (2 passed, 0 failed in stage2)
- **Choices:** Added unified gamepad menu focus manager (`.gp-focus` golden ring) covering Title, Level Select, Pause, Story, and Game Over overlays with D-Pad/Left Stick navigation, A confirm, B back/resume, and Start quick action.

### 2.3 Gates
- **Started:** 2026-11-24T16:23:35Z
- **Finished:** 2026-11-24T16:28:35Z
- **Checks:** `npm test stage2` (plus full stage0+stage1 verification) — for every gate in Level 1 (bramble, boulder, stream), each of the three wrong heroes walked, jumped, hugged both corridor edges, and used abilities for 60 seconds without opening or getting past the gate; the matching hero then opened and crossed each gate cleanly.
- **Result:** PASS (3 passed, 0 failed in stage2)
- **Choices:** Added `getCorridorXBounds(z)` solid corridor clamping from platform/slope/chasm geometry, full-span visual gate flanks + `this.gates` barrier enforcement (preventing walking around or jumping over), and nearest-closed-gate gating so abilities cannot open downstream gates through an earlier shut gate.

### 2.4 Guardian fights
- **Started:** 2026-11-24T16:29:15Z
- **Finished:** 2026-11-24T16:32:45Z
- **Checks:** `npm test stage2` — competent bot fought all 6 guardians × 4 heroes × 10 trials (240 total fights) on Easy:
  - All 240 fights landed in target duration (50.43s–98.30s; forest guardians 45–90s, Level 6 Great Black Dragon 60–120s).
  - Max continuous ice hold across all 240 fights: 1.20s (<= 1.5s limit).
  - Max gap between guardian actions: 4.63s (<= 6.0s limit).
  - Every guardian ended freed, friendly, and visible in the arena with spell broken.
- **Result:** PASS (4 passed, 0 failed in stage2)
- **Choices:** Centralized hero combat damage/cooldowns and guardian HP in `src/config.js`; added ice slow (`0.55x`) + capped chill hold (`1.2s`) + `5.5s` ice-hold immunity cooldown; kept freed guardians visible with a warm green-gold friendly aura ring; fixed a re-entrant projectile splice bug when a projectile lands the freeing blow.

### 2.5 Companions
- **Started:** 2026-11-24T16:33:20Z
- **Finished:** 2026-11-24T16:35:45Z
- **Checks:** `npm test stage2` — verified companions hurry to leader when called (`callCompanions` via `C` or Controller L3), stood still at every gate for 2 minutes (120s) verifying all gates stayed shut, and verified companions contributed gently (`20.8%` < 25%) in a guardian fight while all 240 fights in 2.4 stayed in range (`49.87s–89.97s`).
- **Result:** PASS (5 passed, 0 failed in stage2)
- **Choices:** Added danger-zone avoidance, rally call (`callCompanions()`), and gentle `companionGentleAssist()` with strict `fromPlayer: false` gate exclusion and dynamic damage share cap (`0.22`) in `damageBoss()`. Adjusted `GUARDIAN_HP` slightly upward to keep 45–90s / 60–120s targets centered with companion assistance.

### 2.6 Two players
- **Started:** 2026-11-24T16:36:15Z
- **Finished:** 2026-11-24T16:37:28Z
- **Checks:** `npm test stage2` — two virtual Xbox controllers activated 2P Co-Op and walked in opposite directions (left/right for 15s, forward/back for 15s); both players stayed comfortably on screen throughout (`maxNDC = [0.276, 0.474]`, `maxDist = 13.5u`).
- **Result:** PASS (6 passed, 0 failed in stage2)
- **Choices:** Added horizontal shared-screen tether (`coopMaxDistance = 13.5u`), zoomed co-op camera framing (`0.85x` separation factor), and updated guardian targeting to pick the closer standing player in co-op.

### 2.7 Hints
- **Started:** 2026-11-24T16:38:05Z
- **Finished:** 2026-11-24T16:39:40Z
- **Checks:** `npm test stage2` — waited at each gate in Level 1; verified no hint fired before 20s, and after 20s without progress the Keeper spoke a hint naming the required family member (`Daniel`, `Michael`, `Vanessa`) with captions strictly <= 8 words.
- **Result:** PASS (7 passed, 0 failed in stage2)
- **Choices:** Added `#speech-caption` HUD bar with automatic <= 8-word chunking (`chunkCaptionWords`), progress tracking via `furthestZ`/gate opens/boss frees, and `updateKeeperHints()` triggering after 20s without progress.

### 2.8 Speech
- **Started:** 2026-11-24T16:40:25Z
- **Finished:** 2026-11-25T02:33:40Z
- **Fish Audio Voices Chosen (locked once for the entire build):**
  - **Keeper:** `5e79e8f5d2b345f98baa8c83c947532d` (*Paddington—British narrator, deep and warm*)
  - **Narrator:** `5e79e8f5d2b345f98baa8c83c947532d` (*Paddington—British narrator, deep and warm* — same voice as Keeper per `STORY.md` decision: "Narrator: The Keeper of the Forest")
  - **Renee:** `fb4f0464f53e4f939d00a7c20d17d143` (*Grandma* — kindly older British female voice)
  - **Great Black Dragon:** `e3cd384158934cc9a01029cd7d278634` (*Laura*, Fish Official — directed with `drama-3` grand & grumpy / lonely tags)
  - **Joshua (stand-in until Stage 7.2):** `51987d6290b54b299b3feba6a92c664d` (*Bluey*)
  - **Daniel (stand-in until Stage 7.2):** `b9011feb3c6f46ddaeb90043fab0eb4a` (*Kid*)
  - **Vanessa (stand-in until Stage 7.2):** `933563129e564b19a115bedd57b7406a` (*Sarah*, Fish Official)
  - **Michael (stand-in until Stage 7.2):** `e686ae649ee44f219a108aacba206c1a` (*calm storyteller male*)
- **Checks:** `npm test stage2` — compared `data/dialogue.json` against every quoted line in `docs/STORY.md` (all 44 story lines matched word for word), verified all 52 Fish Audio speech MP3 files and 17 Fish Audio SFX MP3 files exist on disk, verified all caption chunks and live `#caption-words` never exceed 8 words.
- **Result:** PASS (8 passed, 0 failed in stage2)
- **Choices:** Replaced all Web Audio synth SFX oscillators with trimmed Fish Audio sound effects (`assets/audio/sfx/`), switched music engine to on-demand streaming Suno tracks with 600ms cross-fades per `assets/audio/README.md`, and trimmed modal/HUD text to obey the <=8-word rule.

### 3.1 Layout on paper (Level 2)
- **Started:** 2026-11-25T02:34:45Z
- **Finished:** 2026-11-25T02:35:35Z
- **Checks:** `npm test stage3` — verified `docs/levels/level-2.md` exists and defines the top-down map, all four gates from `STORY.md` in order (`l2_gate_overgrowth` Daniel/Fire, `l2_gate_bridge` Michael/Strength, `l2_gate_waterfall` Vanessa/Ice, `l2_gate_leap` Joshua/Speed) with Keeper hint IDs, berry bushes, 3 gold berries, peaceful wildlife, and the Old Vine arena + Green Egg nest.
- **Result:** PASS (1 passed, 0 failed in stage3)
- **Choices:** Designed Level 2 as a rising multi-elevation treetop canopy journey (`z = +12` to `-342`, `y = 0` → `y = 2` → `y = 8`) so a six-year-old experiences genuine vertical ascent above the forest canopy across four distinct set-pieces.

### 3.2 Playable (Level 2)
- **Started:** 2026-11-25T02:36:15Z
- **Finished:** 2026-11-25T02:40:05Z
- **Checks:** `npm test stage3 && npm test stage1`
  - All 4 Level 2 gates (`l2_gate_overgrowth`, `l2_gate_bridge`, `l2_gate_waterfall`, `l2_gate_leap`) passed 60s wrong-hero edge-hugging/jumping bypass checks (12 wrong-hero runs blocked) and opened cleanly with the matching hero's gift.
  - Full Easy playthrough bot ran start-to-egg in **9.03 minutes** (542.1s, inside 8–12 min target), using all 4 gifts, freeing The Old Vine in **66.5s**, and reaching the Green Egg to bond Speedy.
  - All Stage 1 regression tests (including 1.3 gap respawn on the new Level 2 chasms and 1.5 memory release) passed.
- **Result:** PASS (3 passed in stage3, 5 passed in stage1)
- **Choices:** Implemented Level 2 in modular `src/levels/level2.js` with wooden deck railings + lanterns, animated swaying bridge steadied by Michael, animated cascading waterfall frozen into 10 glittering ice steps by Vanessa, wind-runway leap + vine bridge drop by Joshua, woven twig Green Egg nest, and camera-following sky dome.

### 3.3 The hatching (Level 2)
- **Started:** 2026-11-25T02:40:30Z
- **Finished:** 2026-11-25T02:42:10Z
- **Checks:** `npm test stage3` — verified Green Egg glows brighter and wobbles faster as Joshua nears (`glowIntensity` increases), Keeper speaks `l2_keeper_near_egg` when Joshua enters 16u, hatching scene plays `assets/audio/hatching.mp3` with `l2_joshua_hatch`, Fish Audio `dragon_chirp.mp3`, Speedy zooming around Joshua's head, and `l2_michael_friend`; reloaded browser cleanly and verified Speedy remains bonded and visible beside Joshua.
- **Result:** PASS (4 passed, 0 failed in stage3)
- **Choices:** Scaled `eggObj.glowIntensity`, halo scale/opacity, `goalAccentLight.intensity`, and egg wobble frequency continuously with proximity (`dist < 22u`).

### 3.4 Playtest (Level 2) — PAUSED (Waiting on Michael)
- **Started:** 2026-11-25T02:42:15Z
- **Status:** PAUSED — continuing to Stage 4 (and 7.1 recording script); Stage 5 will not start until Michael's playtest report is in.

### 4.1 Prologue
- **Started:** 2026-11-25T02:42:40Z
- **Finished:** 2026-11-25T02:43:58Z
- **Checks:** `npm test stage4` — bot watched the full 3D prologue from berry picking to the end (41.5s); verified all 9 story-draft lines played in order, Keeper stepped out of the trees in person, named Renee as his Ward and wife, granted the 4 gifts with flying gift orbs, and launched Level 1 with all 4 gifts active and working.
- **Result:** PASS (1 passed, 0 failed in stage4)
- **Choices:** Built `createReneeRenderable()` as a simple geometric stand-in for Renee (royal-blue gown, gold tutor shawl, silver hair bun, warm gold ground halo) because none of the repository GLBs depicts an older female tutor/ward.

### 4.2 Renee's news
- **Started:** 2026-11-25T02:44:20Z
- **Finished:** 2026-11-25T02:45:20Z
- **Checks:** `npm test stage4` — verified Level 1 Bear-freed (`l1_keeper_bear_freed`) & Keeper reunion (`l1_keeper_reunion` carrying Renee's news from the castle), Level 3 entry (`l3_daniel_hot`) & Ember Golem freed (`l3_keeper_golem_freed` carrying Renee's news), and Level 6 castle door spawning Renee (`reneeObj`) who greets the family (`l6_renee_welcome`).
- **Result:** PASS (2 passed, 0 failed in stage4)
- **Choices:** Placed Renee at `(0, 2.0, 8.8)` right in front of the Royal Castle door in Level 6; triggered level-entry family lines (`l3_daniel_hot`, `l4_michael_warm`, `l5_joshua_turn`, `l6_renee_welcome`) via `playLevelStartDialogue(idx)`.

### 4.3 The festival
- **Started:** 2026-11-25T02:45:45Z
- **Finished:** 2026-11-25T02:47:10Z
- **Checks:** `npm test stage4` — finished Level 6 with 3 gold berries (verified 6 lanterns = 3 pairs) and with all 18 gold berries (verified 36 lanterns = 18 pairs); verified the Level 6 closing conversation (7 lines) and Festival ending (7 spoken lines + baby dragon chorus) play in the exact story-draft order: Keeper makes gifts permanent, Daniel asks if dragons can stay, chorus of dragon chirps, Renee and Keeper reunite and embrace, Great Black Dragon stays, and Narrator closes.
- **Result:** PASS (3 passed, 0 failed in stage4)
- **Choices:** Built `startDragonConversationCutscene()` flowing straight into `startFestivalFinale()` with all 5 freed forest guardians + Great Black Dragon + Renee + Keeper + exact `goldFound * 2` festival lanterns, then transitioning into the playable Festival Courtyard.

### 7.1 Recording script
- **Started:** 2026-11-25T02:47:40Z
- **Finished:** 2026-11-25T02:49:30Z
- **Checks:** `npm test` — verified `docs/recording-script.md` lists all 52 lines across 8 speakers with exact file names and spoken text matching `data/dialogue.json` line counts per speaker. Full suite passed: **22 passed, 0 failed**.
- **Result:** PASS (22 passed, 0 failed across Stages 0, 1, 2, 3, 4, and 7.1)
- **Choices:** Completed 7.1 before pausing for Michael so he has the recording script ready at the same time as the Level 2 playtest.

## Waiting on Michael

1. **Milestone 3.4 — Level 2 Playtest (blocking Stage 5):**
   Level 2 (*Treetop Canopy*) is ready to play on branch `build/gemini` (serve the repo locally and open Level 2 from Level Select, or start from the Prologue). After watching Joshua play Level 2, please let me know:
   - Did Joshua finish without help?
   - Where did he get stuck?
   - Did he ask to play again?
   *(Per `docs/BUILD_PLAN.md`, I am pausing before Stage 5 so I can fix anything you report from this playtest first.)*

2. **Milestone 7.2 — Family Voice Recordings (for Stage 7.2):**
   Whenever you are ready, please share one clean 30–60 second voice sample for each family member (**Joshua**, **Daniel**, **Vanessa**, **Michael**) so I can clone each voice in Fish Audio and regenerate their lines (all lines and file names are listed in `docs/recording-script.md`). Stand-in Fish Audio voices are active in the meantime.
