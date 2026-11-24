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

## Waiting on Michael

- Network access to `platform.r2.fish.audio` so finished Fish Audio files can be downloaded (asked 14:14). Work that does not need the files continues.
