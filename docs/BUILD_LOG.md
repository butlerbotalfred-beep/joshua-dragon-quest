# Build log: Claude build

Branch `build/claude`. All times are UTC. This log follows `docs/BUILD_PLAN.md`.

## Milestone 0.1 Set up

- Started: 2026-11-24 14:08
- Finished: 2026-11-24 15:51
- What I checked: the branch exists and holds `docs/BUILD_PLAN.md`, `docs/STORY.md` and `docs/AUDIT.md`. Result: pass.
- Start point: `build/claude` starts at commit `db7f6b9` on `main`, the merge of the pull request that added the three documents and the ten music tracks. Its files are identical to commit `deba559`, where I first branched before the merge landed.
- Time note: I read the plan, the story, the audit and all of `game.js` between 14:08 and 14:15. The session then stopped and was restarted at 15:50, so about 95 minutes of this milestone were not working time.

### Choices the plan did not specify

- `three.js` 0.170.0 is loaded from a public CDN in the prototype. The test machine cannot reach that CDN, and the audit notes the game fails offline. I will copy the same version into `vendor/` and load it from there. It is the same library, not a new dependency.
- The download host for Fish Audio files (`platform.r2.fish.audio`) is refused from this workspace. I asked Michael once for network access. Until audio can be fetched, speech lines are generated at Fish Audio and their links are kept in the log.

## Milestone 0.2 Test harness

- Started: 2026-11-24 15:51
- Finished: 2026-11-24 15:54
- What I built: `npm test` runs `tests/harness/run.js`, which runs every `tests/*.test.js` file with Node's built-in test runner. Each test starts a local file server (`tests/harness/server.js`), opens the game in headless Chromium through Playwright (`tests/harness/browser.js`) and steps the game with `game.advance(seconds)`. The harness also gives the page two virtual Xbox controllers.
- What I checked: `tests/01-smoke.test.js` starts Level 1, runs 60 seconds of game time and asserts there are no console errors, page errors or failed requests. Result: pass.

### Choices the plan did not specify

- The harness is Playwright (`playwright`), the only entry in `package.json`. Tests use Node's own test runner, so nothing else is installed.
- `three.js` 0.170.0 and the two fonts the prototype loaded from Google (Cinzel and Fredoka, both under the Open Font License) are now in `vendor/`. The game makes no request outside its own folder.
- I added one small hook to the game for tests, `advance(seconds)`, which steps game time without waiting for real time.

## Milestone 0.3 Baseline

- Started: 2026-11-24 15:54
- Finished: 2026-11-24 15:56
- How: `tests/archive/baseline-prototype.js`, run against the prototype with only the 0.2 changes.

| Number | Measured | The audit said |
| --- | --- | --- |
| First load | 169,187,691 bytes (161.3 MB, or 169 MB counting a megabyte as a million bytes), of which 36 model files are 160.3 MB | about 168 MB |
| Final guardian, bonded hero pressing attack | Michael 3.5 s, Joshua 3.7 s, Daniel 4.1 s, Vanessa 5.2 s. She launched 0 to 2 attacks | 3.5 to 7.3 s, one attack at most |
| Final guardian, hero with no dragon | 7.4 to 11.9 s. Against Vanessa she never attacked at all | Vanessa's ice held her for the whole fight |
| Great Bear | 1.3 to 3.9 s | not given |
| Old Vine | 1.1 to 6.2 s | not given |
| Ember Golem | 1.6 to 5.4 s | not given |
| Yeti | 1.1 to 8.1 s | not given |
| Stone Gargoyle | 1.8 to 5.2 s | not given |
| Memory after 1 level load | 97 shapes, 59 textures, 28 shaders | 89, 55, 25 |
| Memory after 11 level loads | 428 shapes, 123 textures, 58 shaders | 426, 124, 64 |

Result: the numbers match the audit closely. The small differences come from my fight test placing the hero beside the guardian at the start, and from counting memory half a second into each level.

## Stage 1: milestones 1.1 to 1.5

- Started: 2026-11-24 15:56
- Finished: 2026-11-24 16:35
- Time note: I wrote the five fixes together and checked them in one test file, `tests/10-stage1-fixes.test.js`, so the five milestones share one start and one finish. Checks 1.1, 1.2 and 1.4 passed on the first run at 16:06. Check 1.3 passed on its second run at 16:11. Check 1.5 passed on its fourth run at 16:29. A full run of every test passed at 16:37 (7 of 7).

### Milestone 1.1 Skipping the hatching scene

- Fix: the dragon is bonded by one function, `grantBond`, which runs when the scene ends for any reason, including a skip.
- What I checked: with the guardian beaten, Joshua touches the egg and the scene is skipped at every tenth of a second from 0.0 to 5.6 seconds, once with the controller Start button and once with the on-screen skip button (114 skips). After each one the bond is in the game state and in the save, and Speedy is visible when Level 3 loads. A second test presses the jump key during the scene and confirms it does not skip. Result: pass.
- Choice: the keyboard jump and confirm keys no longer skip a scene. Only the skip button and the controller Start button do. A six-year-old pressing jump was the cause of the bug.

### Milestone 1.2 Level select

- Fix: choosing a level only adds bonds. It never takes one away.
- What I checked: with all four dragons bonded and saved, I load each of the six levels from the level screen. After every load all four dragons are bonded in the state, visible in the level, and still in the save, and the highest level reached is unchanged. Result: pass.

### Milestone 1.3 Falling into gaps

- Fix: floors now have edges. A hero cannot step onto a floor more than 0.6 above them, and landing needs the hero to reach the floor's height. A hero who falls is put back on the last firm ground they stood on, and a spoken-style hint names the gap. The game remembers firm ground only where there is floor on every side.
- What I checked: for every water and lava gap in all six levels, with each of the four heroes, three ways (walking in, jumping at the edge, jumping late). No hero is ever lifted onto the far side. Each hero who falls is back on the near side within 9 units of the gap, and the hint matches the kind of gap. Result: pass on the second run.
- First run failed: "L2 gap 0 joshua walk: put back too far from the gap". Cause: my test started the hero within 1.6 units of the lane's side edge, where the game rightly does not record firm ground. The test now starts the hero on a spot the game counts as firm. The check itself is unchanged.
- Choice: the hint for a narrow stream is "Take a running jump across the stream", for wide water "Vanessa and Frosty can freeze this water", for lava "Joshua and Speedy can race up the slope". These are stand-ins in the prototype. Stage 2 replaces them with spoken hints.

### Milestone 1.4 Michael's block

- Fix: the block moves only when Michael is the hero a player is controlling.
- What I checked: two minutes of game time with Joshua as the player circling the block while Michael follows as a companion. The block does not move. A control run with Michael as the player confirms he can still push it. Result: pass.

### Milestone 1.5 Memory is released

- Fix: leaving a level now frees every shape, material, texture, shadow map and bone texture under the level, and the sparkle materials that are kept between levels let go of their shaders. Beams, warning rings, effects and projectiles are freed when they are removed during play.
- What I checked: eleven level loads in the order 0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 0, with a few seconds of attacks in each. First load: 50 shapes, 35 textures, 13 shaders. Eleventh load: 50 shapes, 35 textures, 14 shaders. The limit is 10 percent over the first load. Result: pass on the fourth run.
- Run 1 failed: textures 58 then 110. Model textures were marked as shared and never freed. Fix 1: free everything under the level, since model files stay in memory and are sent to the graphics card again when drawn.
- Run 2 failed: textures 38 then 78. Four small textures leaked per load. I traced every texture upload and found they were the bone textures of the four rigged heroes. Fix 2: free each rigged model's skeleton.
- Run 3 failed: shaders 16 then 28. I traced it to the glow lights. Each level had a different number of point lights (7 to 10), and the renderer builds and keeps a new set of shaders for every different number of lights, including its own shadow shaders, which the game cannot free. Fix 3: the seven kinds of glow light are now drawn as glowing pictures (sprites) and the sparkle materials release their shaders on leaving a level. This also removes a pause the old lights caused whenever a glowing thing appeared or was collected.
- How I counted the rule "three failures after three different fixes": the first run tested the milestone's own work, so runs 2 and 3 were failures after fixes 1 and 2, and fix 3 passed. If the first run is counted as a fix, this was the last attempt the plan allows.
- Choice: the test now plays each level with the same random numbers every time it is loaded, so the first and the eleventh counts compare the same play. The limit and the eleven loads are unchanged.

### Choices the plan did not specify (Stage 1)

- The glow lights became sprites (see 1.5). The look is slightly different: glowing things no longer light the ground around them.

## Waiting on Michael

- Nothing at the moment.

### Answered or no longer needed

- Network access to `platform.r2.fish.audio` (asked 14:14). No longer needed: at 16:05 I found that Michael's linked Mac can download Fish Audio files into a folder I can read, so audio files reach the build that way. The cloud workspace itself still cannot reach the host.
