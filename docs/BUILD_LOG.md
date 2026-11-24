# Build log: Claude build

Branch `build/claude`. All times are UTC. This log follows `docs/BUILD_PLAN.md`.

## Milestone 0.1 Set up

- Started: 2026-11-24 14:08
- Finished: 2026-11-24 15:55
- What I checked: the branch exists and holds `docs/BUILD_PLAN.md`, `docs/STORY.md` and `docs/AUDIT.md`. Result: pass.
- Start point: `build/claude` starts at commit `db7f6b9` on `main`, the merge of the pull request that added the three documents and the ten music tracks. Its files are identical to commit `deba559`, where I first branched before the merge landed.
- Time note: I read the plan, the story, the audit and all of `game.js` between 14:08 and 14:15. The session then stopped and was restarted at 15:50, so about 95 minutes of this milestone were not working time.

### Choices the plan did not specify

- `three.js` 0.170.0 is loaded from a public CDN in the prototype. The test machine cannot reach that CDN, and the audit notes the game fails offline. I will copy the same version into `vendor/` and load it from there. It is the same library, not a new dependency.
- The download host for Fish Audio files (`platform.r2.fish.audio`) is refused from this workspace. I asked Michael once for network access. Until audio can be fetched, speech lines are generated at Fish Audio and their links are kept in the log.

## Milestone 0.2 Test harness

- Started: 2026-11-24 15:55
- Finished: 2026-11-24 16:02
- What I built: `npm test` runs `tests/harness/run.js`, which runs every `tests/*.test.js` file with Node's built-in test runner. Each test starts a local file server (`tests/harness/server.js`), opens the game in headless Chromium through Playwright (`tests/harness/browser.js`) and steps the game with `game.advance(seconds)`. The harness also gives the page two virtual Xbox controllers.
- What I checked: `tests/01-smoke.test.js` starts Level 1, runs 60 seconds of game time and asserts there are no console errors, page errors or failed requests. Result: pass.

### Choices the plan did not specify

- The harness is Playwright (`playwright`), the only entry in `package.json`. Tests use Node's own test runner, so nothing else is installed.
- `three.js` 0.170.0 and the two fonts the prototype loaded from Google (Cinzel and Fredoka, both under the Open Font License) are now in `vendor/`. The game makes no request outside its own folder.
- I added one small hook to the game for tests, `advance(seconds)`, which steps game time without waiting for real time.

## Milestone 0.3 Baseline

- Started: 2026-11-24 16:02
- Finished: 2026-11-24 16:08
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

## Waiting on Michael

- Network access to `platform.r2.fish.audio` so finished Fish Audio files can be downloaded (asked 14:14). Work that does not need the files continues.
