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

## Stage 2: milestones 2.1 to 2.8

- Started: 2026-11-24 16:35
- Finished: 2026-11-24 17:59
- Time note: the eight systems lean on each other (a gate check needs heroes, gifts, companions and hints to exist), so I built them together and then checked them one milestone at a time. They share one start and one finish. The first run of the Stage 2 checks was at 17:07: 11 of 17 passed. What the six failures were, and what I did about each, is under "What the checks found" below. A full run of every test passed at 17:59 (31 of 31: 1 for Stage 0, 6 for Stage 1 and 24 for Stage 2).

### The biggest choice: a new game, with the prototype kept as a record

The plan asks for things the prototype could not give without being rewritten piece by piece: gates nobody can get around, fights whose length can be set, bots that can play through controller input, and checks that give the same answer every time. I wrote the game again in small files and moved the prototype to `tests/archive/prototype/`. Nothing of the family's was deleted: every model, texture and music track is where it was.

- `src/sim.js` is the world: heroes, gifts, gates, creatures, guardians, companions, hints. It moves in fixed steps of 1/60 of a second and draws nothing, so a check can run it fast and get the same result every time.
- `src/view.js` draws the world with three.js 0.170.0. `src/ui.js` is the menus and the display during play. `src/input.js` reads controllers. `src/audio.js`, `src/dialogue.js` and `src/cutscenes.js` are sound, speech and story scenes. `game.js` ties them together. There is still no build step and no framework.
- A level is a list of sections laid end to end (`src/levels.js`): path, ramp, gate, hop, ferry, arena, nest, exit. Stage 3 onward writes the six levels in this form.
- Two hooks exist for the checks: `game.advance(seconds)` steps time, and `game.botHook` lets a bot set the virtual controller before each step. Bots never change the world directly.
- Because no real level exists until Stage 3, the Stage 2 checks run on practice levels in `tests/fixtures/yard.js`. They are not part of the game. One has every kind of gate, one is a guardian arena, one is a short level with a creature, a web, a gate, a guardian and an egg, one is a long open walk, and one is a nest with a hatching scene.

### Milestone 2.1 Difficulty

- What I built: Easy, Medium and Hard, shown as one, two and three stars. It is the first thing asked after Play, it is saved, and the pause menu has a button that steps through the three.
- Easy cannot be lost: a hero whose hearts run out is dizzy for a moment and then carries on with full hearts, and nobody takes harm from falling. Medium and Hard can be lost and offer "Try again" from the last gate passed.
- Hard, pitched at an early teen: the family takes 1.7 times the harm, guardians warn for 0.85 seconds (1.6 on Easy), strike every 3.4 seconds (5.0 on Easy), walk right up to a hero and hurt on touch, gifts must be aimed (a narrow cone, where Easy aims for the player), Joshua's long leap is a real running jump with no help, falls cost hearts, and companions do not revive a fallen player.
- What I checked: (a) a bot picks Hard with the controller, the game is reloaded and Hard is still chosen, the level starts on Hard, the pause menu changes it to Easy and then Medium, both in the save and in the running level, and it is still Medium after another reload. (b) An idle bot stands beside each of the six guardians. On Easy, five minutes each: never defeated, never even knocked down, and each guardian attacked at least 50 times, so the check is not passing because nothing happened. On Hard the same idle bot is defeated in 7.5 to 12.5 seconds (limit 30). Result: pass.

### Milestone 2.2 Controller first

- What I built: an Xbox controller does everything. Left stick or D-pad moves. A jumps and confirms. X or the right trigger uses the gift. Y and RB swap to the next hero, LB to the one before. B calls the family, and goes back in menus. The Menu button pauses, resumes, and skips a scene. Every menu is a row of big picture buttons moved through with the stick or D-pad.
- What I checked: a bot holding only a virtual controller goes from the title through difficulty, back, forward again, one player, a hero chosen with the D-pad, the map, into a level, skips the opening scene, walks, jumps, uses a gift, swaps hero three ways, calls the family, pauses (the world stops), resumes, pauses again and returns to the map. The check also confirms no keyboard key was touched. Result: pass.
- Choice: a keyboard works too, for testing on a Mac without a pad: arrows or WASD, Space jumps, J is the gift, E and Q swap, C calls, P pauses or skips, Enter chooses, Escape goes back.

### Milestone 2.3 Gates

- What I built: four kinds of gate, each opened only by its gift, and only when a player is controlling that hero.
  - Wall (fire, ice or strength): a barrier across the whole path with marks on it. The right gift clears the marks.
  - Bridge (ice, or strength): a gap far wider than any jump. Vanessa freezes it piece by piece, flat or as steps. Michael steadies a rope bridge from the near bank.
  - Run (speed): a chase, a steep slope or a closing door that only Joshua is fast enough for.
  - Leap (speed): a gap wider than anyone else can jump.
- A gate can also need the hero's dragon (`dragon: true`). Then the gift does nothing until that hero is bonded.
- What I checked: for each of the ten practice gates, on Easy and on Hard, with and without dragons (160 runs): a bot as each of the three wrong heroes spends 60 seconds walking at it, jumping at it, hugging both edges and using its own gift. It never opens the gate and never stands on ground past it, and no companion gets past either. Then the right hero opens it. Result: pass.

### Milestone 2.4 Guardian fights

- What I built: a guardian is not hurt. It is wrapped in spell knots, shown as a ring of lights, and the family's gifts undo them one at a time. When the last knot goes, the spell is gone and the guardian is a friend: it stops attacking for good and the family's hearts are refilled.
- The length of a fight is set by design, not by how hard anyone hits: at most one knot can come undone between two of the guardian's attacks. On Easy a guardian has 12 knots and attacks every 5 seconds, which makes a fight about a minute.
- Every attack is shown on the ground before it lands.
- Ice: a hit can hold a guardian still for 0.8 seconds, and then it cannot be held again for 5 seconds. Ice also slows it for 2.5 seconds.
- What I checked: a competent bot fights each of the five guardians ten times with each of the four heroes (200 fights), with different random numbers, with and without dragons, and with a player whose attention wanders. Every fight lasted between 53.4 and 61.9 seconds (the range is 45 to 90). The longest any guardian went without acting was 5.0 seconds (limit 6). The longest ice hold was 0.80 seconds (limit 1.5). Every fight ended with the guardian freed, and ten more seconds standing beside it brought no attack and no harm. A separate check has Vanessa do nothing but throw ice at each guardian: it is never held longer than 1.5 seconds and spends less than a quarter of the time held. Result: pass.
- The Great Black Dragon uses the same system with more knots. Her 60 to 120 second meeting is checked in Stage 5 with Level 6.

### Milestone 2.5 Companions

- What I built: the three heroes nobody is controlling follow the leader, pop to the leader's side when B is pressed, help a hero out of a web, revive a fallen player on Easy and Medium, and throw a gentle gift at a guardian every 2.5 seconds. A companion can never open a gate, and can do at most a fifth of any one knot, never the finishing touch.
- What I checked: (a) at each of the ten practice gates the bot stands still for two minutes as a hero whose gift does not fit, so the right hero is always a companion. No gate opened, no mark on a gate was touched, nobody got past, and the family stayed together. (b) On a long winding walk no companion fell more than 16 units behind and all were within 6 at rest. After Joshua dashes ahead and calls, all three are within 4 units at once and still there a moment later. (c) In 24 fights, one for each guardian with each hero, companions did between 8 and 15 percent of the work, and never more than 18 percent in the 200 fights of milestone 2.4 (limit 25). Result: pass.

### Milestone 2.6 Two players

- What I built: a second controller takes a second hero. Each player can swap to any hero the other is not using. The two cannot walk more than 17 units apart sideways or 11 along the path, and the camera frames both.
- What I checked: two bots walk in opposite directions for 30 seconds, four pairs of directions at two screen shapes. Twice a second the check asks the picture where each hero's head and feet are. Both were on screen every time. Result: pass.

### Milestone 2.7 Hints

- What I built: after 20 seconds without progress the Keeper speaks a hint. At a gate, the hint names the family member needed and that hero's picture bounces. Falling into the same gap twice brings the hint at once. There are also hints for a web, a creature, a guardian, the egg, a jump and a moving platform.
- What I checked: a bot waits at each practice gate. The first line spoken is that gate's hint, it comes between 19.5 and 21.5 seconds, the Keeper is the speaker, it names the hero needed and none of the other three, and the right picture is marked. Result: pass.

### Milestone 2.8 Spoken, not read

- What I built: `data/dialogue.json` holds every spoken line with its speaker, its sound file and its length. It is made by `node tools/make-dialogue.mjs` from `tools/dialogue-source.mjs`, where the words are typed once. Menus are pictures, stars and numbers, with no sentences. A spoken line shows as a caption of at most eight words at a time, in step with the voice.
- 79 lines: the 47 spoken lines of the story draft word for word (the web line counted once for each of the four heroes), and 32 Keeper hints the plan asks for and the story does not give.
- Voices, each chosen once from the Fish Audio voice library:

| Who | Fish Audio voice | Voice id |
| --- | --- | --- |
| The Keeper of the Forest | story teller old grandfather | `86d2e997840443a1832c999ee71468b2` |
| Narrator | the same voice as the Keeper, as the family chose | `86d2e997840443a1832c999ee71468b2` |
| Renee | Grandma | `fb4f0464f53e4f939d00a7c20d17d143` |
| The Great Black Dragon | Yuji | `6e294c216f1e4b4c94449341a5db5da9` |
| Joshua (stand-in) | Energetic Child | `4fcb3a423c61415fb35604eba567d95f` |
| Daniel (stand-in) | Kid | `b9011feb3c6f46ddaeb90043fab0eb4a` |
| Vanessa (stand-in) | Laura | `e3cd384158934cc9a01029cd7d278634` |
| Michael (stand-in) | Warm Male Friend | `f292c81d563f47799b7e411f1c1e68a9` |

- I cannot hear. I chose voices by their descriptions and checked the files by measurement: length against the number of words, loudness, and silence. A person should listen to them. That is on the list for the final handover.
- Sound effects: 32, all from Fish Audio. 21 are clips from its sound library and 11 were made with its sound effect generator. `tools/sounds.json` records the library id or the prompt for each one.
- Every file is trimmed of silence and levelled by `tools/make-audio.mjs` (speech to an average of minus 20 dB, effects to a peak of minus 3 dB). Speech is 2.7 MB and effects are 0.5 MB.
- What I checked (`tests/21-stage2-speech.test.js`): every spoken line in `docs/STORY.md` is in the data file word for word with the right speaker, and nothing else claims to come from the story. Every line has a sound file whose real length matches the data file and suits its number of words, and a Fish Audio task id on record. The Keeper, Renee, the Dragon and the Narrator have one voice each, and the family are marked as stand-ins. No caption is over eight words, and the captions of a line joined together are exactly the line. In the running game every line starts its own sound file once, and with the display and a caption on screen together the most words visible at any moment is eight. Every menu screen is under eight words. Result: pass.

### The Stage 1 checks, carried over

The five Stage 1 fixes were made in the prototype. The new game has to pass the same checks, so I rewrote `tests/01-smoke.test.js` and `tests/10-stage1-fixes.test.js` for it, asserting what they asserted before. The old versions are in `tests/archive/prototype/`. They run on the practice levels now and on every real level as it is added.

- 0.2: a level runs 60 seconds with no console errors. A practice level stands in as Level 1 until Stage 5. Result: pass.
- 1.1: the practice hatching scene lasts 11.8 seconds. It was skipped at every tenth of a second from start to end, once with the controller's Menu button and once with the skip sign (242 skips). Every time the dragon was bonded in the game and in the save, the level finished, and the dragon was there in the next level. A second check presses Space, Enter and four other keys, and every controller button except Menu, during the scene: none skips it. Result: pass.
- 1.2: with all four dragons saved, each of levels 1 to 6 is opened from the map with the controller. All four dragons are bonded, visible and still saved every time. All six are practice levels standing in for now. Result: pass.
- 1.3: 72 runs at the six gaps of the practice level (walking in, jumping, jumping late, with each hero). 45 ended in a fall. Nobody ever came up on the far side, every hero who fell was put back on the near side within 9 units, nobody crossed the gap of a shut gate, and after a second fall the Keeper's hint named the right family member (15 checked). Result: pass.
- 1.4: at the two strength gates, two minutes as Joshua circling in front with Michael following close: the gate stays shut and untouched. Then the player swaps to Michael and opens it. Result: pass.
- 1.5: eleven level loads. First: 52 shapes, 41 textures, 16 shaders. Eleventh: 52, 41, 16. Result: pass.
- The 1.1 check takes about ten minutes in the test browser, because every skip loads a level twice and the test browser builds its shaders slowly.

### What the checks found

- Pressing the Menu button on the pause screen resumed and then paused again in the same instant. Fix: a press that works a menu is used up.
- A guardian's spell already in the air when it was freed could still hit someone. Found by the "friendly afterwards" check with the Yeti. Fix: a freed guardian's spells vanish with it.
- On Hard, a wrong hero who kept walking into the stream was knocked down, the game handed the bot the next hero, and that happened to be Vanessa, who froze the stream. The gate was opened by the right gift, so the game was right and the bot was wrong. The bot now stays the hero it was told to be: if the game hands it another, it only swaps back. The check is unchanged.
- The "comes when called" check pressed B while Joshua was still sliding out of a dash, so he ran on from the family as they arrived. The check now waits for the dash to end, and also checks again a moment later.

### Choices the plan did not specify (Stage 2)

- No magic meter. Gifts are always ready, with a short pause between uses. A six-year-old never runs out.
- The on-screen "skip" sign in a scene can also be tapped, for an iPad without a controller in hand.
- The map opens the first level that exists, and after that each level opens when the one before is finished. This lets Level 2 be played before Level 1 is built, as the plan's order needs.
- Hint lines I wrote (the story draft has two hints, the plan needs one for each of the 24 gates): each is a short sentence that starts with the name of the family member needed, such as "Daniel, your fire can burn those brambles away." The eight general hints are "Keep going along the path.", "Take a little run, and jump across the gap.", "Wait for the platform, then ride it across.", "Use your gift to free that creature.", "The guardian is waiting just ahead.", "Use your gift to break the spell.", "Keep using your gifts until her anger runs out." and "The egg is waiting. Go and say hello." All are in the Keeper's voice and are listed in `tools/dialogue-source.mjs` marked `added`.
- The story's Level 4 hint, "That ice is too thick for a small flame. Ask Ember to help.", does not name a family member. It will be spoken as the family reaches that ice wall, and the 20 second hint there is "Daniel, melt the ice wall with Ember."
- Some lines were made with a delivery note in front of the words, such as excited, sad or sighing. The note is not spoken and the words are exactly the story's.
- Fish Audio allowance: 250,000 credits at the start, 170,154 left. Speech used about 4,900. Sound effects used 75,000: fifteen were generated at 5,000 each. Four of those came back silent or as hiss (the first ice, the first jump and two tries at an egg hatching) and are not used. The hatching sound is now a library clip.
- Audio reaches the build by being downloaded on Michael's Mac into `Worlds Beyond/_rdr_audio/` and read from there. Those raw downloads can be deleted once the build is merged. I have not deleted anything.
- Still to be judged by a person: whether a browser lets sound start from a controller press alone. If it does not, the title screen shows a small "tap" sign and one tap or key press starts the sound.

## Stage 3: Level 2, the Treetop Canopy (milestones 3.1 to 3.3, and the pause at 3.4)

- Started: 2026-11-24 18:00
- Finished 3.1 to 3.3: 2026-11-24 18:52
- Time note: the layout file, the level and the hatching were built together, because the file is printed from the level and the level was reshaped until the timing check passed. They share one start and one finish.

### Milestone 3.1 Layout

- What I built: `docs/levels/level-2.md`. It holds the map (a table of every stretch of the level from the start to the nest), the four gates in order with the gift and the Keeper's hint line for each, the berries, the creatures, the guardian's arena, the hatching scene and how long the level takes. The map table is printed from the level's own data by `node tools/level-map.mjs 2 --write`, so the file and the game cannot say different things.
- The gates are the story draft's: Daniel clears the overgrowth (fire), Michael holds a bridge steady (strength), Vanessa freezes a waterfall into steps (ice), Joshua makes the last long leap to the nest (speed).
- What I checked: the file exists; the level has exactly those four gates in that order; each gate's hero, gift and hint line (word for word from `data/dialogue.json`) appear in order in the map and again in the gate list; the map in the file is identical to the map printed from the level; the berry counts and the arena size in the file are the level's own; the egg is the green one and Joshua's. Result: pass.

### Milestone 3.2 Playable

- What I built: `src/levels/level2.js`, 718 steps long from the start to the nest. Fourteen berry bushes, three gold berries in side nooks, twelve small creatures, four webs, four small gaps, three moving platforms, two ramps up, the four gates, the Old Vine's arena and the nest.
- The waterfall is drawn as water tumbling from the high bank across a drop, and it turns pale and still as Vanessa freezes it into steps. The rope bridge swings over a drop.
- What I checked, all through controller input in the test browser:
  - **Time on Easy.** The timed bot stands in for a six-year-old on a first play (its rules are below). Three runs: 9.15, 8.93 and 8.94 minutes from the first step to the end of the hatching scene. All four gifts used in every run; each gate opened by its own hero with its own gift; all 12 creatures freed; 3 of 3 gold berries and 14 of 14 bushes found; the Old Vine fight took 60 to 65 seconds; nobody was ever defeated; and something moved forward at least every 45 seconds. Result: pass (target 8 to 12 minutes).
  - **Medium and Hard.** A quick bot finishes the level on Medium (4.4 minutes) and Hard (4.2 minutes) without needing "Try again". Result: pass.
  - **Bypass (the 2.3 check on the real level).** For each of the four gates, on Easy and on Hard, each of the three wrong heroes spends 60 seconds walking at it, jumping at it, hugging both edges and using their own gift. None opened a gate or stood on ground past one, and no companion got past. The right hero then opened each (in 1.3 to 7.7 seconds). 4 of 4 gates pass on both difficulties. Result: pass.

### Milestone 3.3 The hatching

- What I built: the egg's glow grows with every step Joshua takes toward it (brighter, larger, and the egg trembles more). The scene is the story draft's: the Keeper's line as the family reaches the nest, then the hatching music, Joshua's promise, the egg hatching, Speedy's chirp and three quick circles around Joshua's head, and Michael's line. Speedy is bonded and saved.
- What I checked: (a) with Joshua standing 70, 50, 40, 36, 23, 15, 10 and 5 steps from the egg, the glow is the same faint glow from 70 and 50 and then brighter, bigger and more trembling at every step nearer (brightness 0.25 far off, 0.92 close). (b) Starting from an empty save, a bot makes Joshua's leap and walks to the egg. The Keeper's line, the hatching music, Joshua's line, the hatch sound, the chirp and Michael's line happen in that order, each line once, never more than eight words on screen; Speedy comes out of the egg and flies 3 laps around Joshua's head; Speedy is bonded in play and in the save, and nobody else's dragon is. (c) The game is closed and opened again, Level 2 is started, and Speedy is beside Joshua. Result: pass.
- The Stage 1 check for skipping (1.1) now also runs on this real scene: skipped at every tenth of a second with the Menu button and with the on-screen skip sign, Speedy is bonded every time.

### The bot that is timed

The plan says "the bot finishes on Easy in 8 to 12 minutes". A bot that never hesitates finishes this level in about 4 minutes, which says little about a six-year-old. So the timed bot (`CHILD` in `tests/harness/botcore.js`) plays the way a small child might on a first go. I set these rules before measuring and did not change them afterwards; I changed the level until it fitted:

- it stops for 2 seconds to think before every new thing it does;
- about a quarter of the time its mind is elsewhere and it does nothing;
- it ambles (the stick pushed 70% of the way) instead of running;
- it picks every berry near the path;
- at each gate it tries the hero it has, and swaps only when the Keeper's hint names who is needed.

This is my guess at a six-year-old, not a measurement of one. The first real measurement is Joshua's own play (3.4, below). If he is much quicker or slower, the level's length is easy to change: it is a list of sections.

### What the checks found

- **A freed creature made no sound.** The event that announces a freed creature was being sent under the creature's name instead of as "freed", so its happy sound and sparkle never played. Fixed in `src/sim.js`; the Level 2 check now counts those events.
- **The first draft of the level was far too short.** The child-pace bot finished the first layout (437 steps) in under 6 minutes. I added stretches until it took about 9, and kept the walking broken up with things to do.
- **The bot stopped to think in mid-air.** When a berry came into view during a jump, the bot paused and dropped into the gap, over and over. That was the bot's mistake, not the game's: nobody stops to think in the middle of a jump. The bot now thinks only with its feet on the ground.
- **Drawing many frames in a row stalls the test browser.** A check that drew the picture on every step of the scene made the next page load wait almost a minute. The checks now move the picture on without drawing it.
- **The skip check outgrew its half hour.** On the real hatching scene the 1.1 check makes 560 skips (one every tenth of a second through both scenes, by the Menu button and by the on-screen sign). It drew the picture after every skip, and a drawn frame takes two to three seconds in the test browser, so the check took 28 minutes and its file ran out of its 30 before the last check in it (1.5) could start. Nothing failed; 1.5 was cancelled. The check now draws one skip in ten and moves the picture on without drawing for the rest. Every skip is still made and every assertion is still made on every skip. It takes under 3 minutes.

### The automated run

- The whole suite, 18:15 to 18:45: 38 checks, 37 passed, none failed, 1 cancelled (1.5, for the reason above).
- The Stage 1 file again after the change to its skip check, 18:48 to 18:52: 6 of 6 passed, 1.5 among them (Level 2 loaded and left ten times: 42 geometries, 42 textures and 16 programs the first time and the eleventh).
- So every one of the 38 checks has passed on this code: 31 from Stages 0 to 2, and 7 new ones for Stage 3. The Stage 0 to 2 checks that work on levels (0.2, 1.1, 1.3, 1.4, 1.5) now run on the real Level 2 as well as the practice levels.

### Choices the plan did not specify (Stage 3)

- Everything between the gates: the order of walkways, gaps, platforms and ramps, and how many creatures and berries there are.
- The Old Vine comes after the third gate and before Joshua's leap, so that the leap really is "the last long leap to the nest".
- The gaps under the rope bridge and the waterfall are drops, not rivers, because the level is up in the trees.
- Speedy's "zoom around Joshua's head" is three circles in 2.4 seconds.
- The other family members are not moved for the hatching scene; the camera stays on Joshua and the egg, and Michael speaks from beside them.
- Level 2 has no opening line of its own in the story draft, so it starts straight into play. (The Keeper's news between levels belongs to milestone 4.2.)

## Done ahead of their stage, because they do not wait on the playtest

The plan says to carry on with every milestone that does not depend on a pause. Stage 5 waits for Joshua's playtest of Level 2 (3.4). These two do not.

### Milestone 7.1 Recording script

- Started: 2026-11-24 18:20. Finished: 18:26 (its check passed on its own), and again in the whole-suite run at 18:59.
- What I built: `docs/recording-script.md`, written by `node tools/recording-script.mjs` from `data/dialogue.json`. One section for each speaker, the family first. Each line has its number, the file name the recording must have, where in the story it is said, the words, and how to say it where the story draft says how. A short "How to record" list is at the top.
- What I checked: the file is exactly what the tool prints today; every speaker in the game has a section and no one else does; the number of lines under each speaker equals that speaker's lines in `data/dialogue.json` (Joshua 6, Daniel 7, Vanessa 6, Michael 5, Renee 1, the Keeper 48, the Narrator 1, the Great Black Dragon 5; 79 in all); each row's words and file name are the data file's; every named file exists; the four family voices are marked as stand-ins and nobody else is. Result: pass.
- Choice the plan did not specify: for a grown-up, one recording of their whole list is enough to copy the voice in Fish Audio, so the script says so. Line-by-line recordings work too.

### Milestone 6.1 Light first load (for everything built so far)

- Started: 2026-11-24 18:27. Finished: 18:59.
- Why now: every model came with pictures 2048 pixels on a side, 5 to 8 MB a model. Level 2 asked for about 100 MB of models. That is slow over home Wi-Fi and may be more than an iPad's browser will hold, and Joshua is about to play it on one.
- What I built: `tools/shrink-models.mjs`. For every model the game uses it keeps the original, untouched, in `originals/3d/` and writes a lighter copy where the game loads it from, in `assets/3d/`:
  - no picture on a model is larger than 1024 by 1024;
  - each hero's "run" file keeps only the running movement, because the game takes the body and its pictures from the "walk" file and was downloading them twice;
  - the 85 files beside the models that the game never asks for (preview pictures, the model makers' notes, bodies without movements) are moved to `originals/3d/` as well. Moved, not deleted. This is part of 6.2, done here because those files held the largest pictures.
- The models went from 160.3 MB to 18.0 MB. Nothing was redrawn or deleted.
- What I checked (`tests/60-small-smooth.test.js`):
  - **Textures.** Every picture in the shipped game, inside models or beside them, is measured: 66 pictures in 36 models, the largest 1024 pixels on a side. Result: pass.
  - **Nothing but the pictures changed.** Each lighter model is compared with its original in `originals/3d/`: the same bones, the same meshes byte for byte (412 pieces of shape data), the same movements byte for byte (528 movement tracks). A run file has its movement and no body. Result: pass.
  - **First load.** The server adds up what it sends before the title screen: 3.15 MB in 24 requests (the title music is 2.07 MB of it). Target 25 MB. Result: pass.
  - **Entering a level.** A new visit, then into the level and five seconds of play: Treetop Canopy asks for 11.59 MB in 20 files, 19 of them models. Target 20 MB. Result: pass.
  - I also looked at the same three views of Level 2 before and after. At the size the game draws them I could not tell the pictures apart.
- The whole suite on the lighter models, 18:55 to 18:59: 43 checks, 43 passed.
- This milestone is finished for the places that exist today. Its checks run on every place there is, so they will measure the prologue, the festival and Levels 1, 3, 4, 5 and 6 as each arrives. I will write the final numbers here after Stage 5.
- Choices the plan did not specify: "the shipped folder" means what a player's device is sent: `index.html`, `game.js`, `styles.css`, `src/`, `data/`, `vendor/` and `assets/`. JPEG pictures are saved at ffmpeg quality 3 (near the top of its scale). The old prototype in `tests/archive/prototype/` loaded some of the moved files; it is kept as a record and is not meant to run.

## Waiting on Michael

- **3.4 Level 2 playtest (asked 2026-11-24 19:10).** After Joshua has played Level 2, Treetop Canopy, on Easy: did he finish without help, where did he get stuck, and did he ask to play again? Stage 5 (Levels 1, 3, 4, 5 and 6) does not start until this is answered, and what he reports is fixed first. Meanwhile I am doing Stage 4 and the parts of Stages 6 and 7 that do not depend on the answer.
  - How to play it: on the Mac Studio, double-click `Play The Royal Dragon Rescue.command` in `Worlds Beyond/_rdr_play`. It fetches the newest build of this branch, serves it, and opens it in the browser. An iPad on the same Wi-Fi can open `http://Alfreds-Mac-Studio.local:8080` while that window is open. I tested the Mac side (the page, a model and a music file all arrive). I could not test from an iPad.
  - The launcher lives only on that Mac, not in the repository. In the repository, `npm start` now accepts `HOST=0.0.0.0` so that an iPad can reach it; without it nothing changes.
- **Lighter copies of the family's models (asked 2026-11-24 19:10).** The plan says to ask before replacing a family asset, and to keep the original and work beside it meanwhile. The game now loads lighter copies of the 36 models (pictures 1024 pixels on a side instead of 2048; 18 MB instead of 160 MB), because Level 2 would otherwise ask an iPad for about 100 MB. Every original is untouched in `originals/3d/`, and a check compares each lighter model with its original. Is that all right? If not, copying `originals/3d/` back over `assets/3d/` restores them exactly, and only milestone 6.1 is affected.

### Answered or no longer needed

- Network access to `platform.r2.fish.audio` (asked 14:14). No longer needed: at 16:05 I found that Michael's linked Mac can download Fish Audio files into a folder I can read, so audio files reach the build that way. The cloud workspace itself still cannot reach the host.
