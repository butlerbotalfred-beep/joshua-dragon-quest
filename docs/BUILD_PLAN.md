# Royal Dragon Rescue Build Plan

Nov 23, 2026 · @Michael Buck

## Read this first

This plan is written for an AI builder working alone. Two builders will follow it separately, Claude and Gemini 4 Neon, so that Michael can compare the results. It names no tool or model on purpose. Follow it in order.

### What you are building

The Royal Dragon Rescue is a family adventure game for a six-year-old, played in ten-minute sittings on a Mac mini or an iPad with an Xbox controller. A royal family of four, Joshua, Daniel, Vanessa and Michael, rescues four dragon eggs. Each has one gift: speed, fire, ice and strength. Every level needs all four.

You are not starting from nothing. The repository holds a working prototype: a static three.js 0.170.0 site with no build step (`index.html`, `styles.css`, `game.js`), 32 GLB models and a music track. Keep that shape. Do not add a framework or a bundler.

### Fixed inputs

These are decided. Do not reopen them. All three are in `docs/` in this repository. Where the older `docs/game-design-spec.md` disagrees with them, these win.

| Input | What it settles |
| --- | --- |
| [Story and Dialogue Draft](STORY.md) | The story, every spoken line, and the 24 design decisions. Lines Michael wrote are used word for word. |
| [Full Audit](AUDIT.md) | Every known bug and weakness in the prototype, with line numbers. |
| This plan (`BUILD_PLAN.md`) | The order of work and what finished means. |

### Rules that never bend

- **Content.** Nothing sexual, nothing blasphemous, no gore. Nobody is hurt for real: heroes get back up, and beaten guardians are freed, not killed.
- **Every level needs every family member.** Each level has four gates, one per gift, and no gate can be walked around, jumped over or skipped.
- **A six-year-old is never stuck.** On Easy nobody can lose, and a spoken hint plays after 20 seconds without progress.
- **Spoken, not read.** Story is heard. No screen shows more than eight words of text at once. All speech and sound effects are made with Fish Audio and nothing else. Music is different: it is made with Suno and supplied to you in `assets/audio/`, the same tracks for both builds. Use those tracks, one per place or moment as their file names say, and do not make or replace music.
- **Controller first.** Everything works with an Xbox controller alone, including menus.

### How to work

- Work on your own branch, named in the comparison section. Never push to `main`.
- Finish a milestone before starting the next. A milestone is finished only when its checks pass in an automated run, not when the code looks right.
- Commit at every milestone with the milestone number in the message. Push after every commit.
- Keep `docs/BUILD_LOG.md`. For each milestone record the time started and finished, what you checked and the result, and anything you chose that this plan did not specify.
- When this plan is silent, choose the simplest thing that obeys the rules above, write the choice in the log, and keep going. Do not stop to ask.
- If a check fails three times after three different fixes, write what you tried in the log, mark the milestone blocked, and move to the next milestone that does not depend on it.
- Never weaken, skip or delete a check to make it pass.

## When to pause

Pause only for the six things below. For each, write the question in `docs/BUILD_LOG.md` under a heading "Waiting on Michael", ask him once, and carry on with every milestone that does not depend on the answer. Nothing else is a reason to stop.

| Pause | Why a human is needed | What to do meanwhile |
| --- | --- | --- |
| The family's own voices | Only the family can record or approve their own voices | Use a Fish Audio stand-in voice for each family member and keep building |
| Spending outside Fish Audio | Michael has approved Fish Audio use up to his monthly allowance, so that needs no pause. Anything else that costs him money does, and so does running out of that allowance | Use what Fish Audio and the repository already provide |
| The Level 2 playtest (milestone 3.4) | Only a real six-year-old can say whether it is fun | Continue to Stage 4. Do not start Stage 5 until the result is in |
| A content-rule doubt | You are unsure whether something is sexual, blasphemous or gory | Leave it out and continue |
| Deleting or replacing a family asset | Models, music and recordings the family made or chose | Keep the original and work beside it |
| Merging to `main` or publishing | The comparison needs both branches untouched | Stop at the open pull request |

Things that are not a reason to pause: a failing check, a missing number, an unclear line in this plan, a choice between two reasonable designs, or wanting approval for finished work. Decide, log it and continue.

## Stages and milestones

There are nine stages. Each milestone says what finished looks like and how to prove it. "The bot" means a scripted player in the automated tests. Numbers marked with a star are proposed targets, listed at the end for Michael to confirm.

### Stage 0: Foundations

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 0.1 Set up | Your branch exists, the three input documents are in `docs/`, and `docs/BUILD_LOG.md` has its first entry | The files are in the pushed branch |
| 0.2 Test harness | One command, `npm test`, opens the game in a headless browser, serves the files locally and can step the game forward. A test harness is the only new dependency allowed | The first test starts Level 1, runs 60 seconds of game time and passes with no console errors |
| 0.3 Baseline | The prototype's starting numbers are in the log: first-load size, time to beat each guardian, and memory counts after 11 level loads | The log shows numbers close to the audit's (about 168 MB, guardians beaten in 3.5 to 7.3 seconds) |

### Stage 1: Fix what is broken

Every item here is a bug the audit confirmed.

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 1.1 Skipping is safe | Skipping any cutscene still gives everything the cutscene would have given | The bot skips the hatching scene at every moment from start to end. The dragon is bonded in play and in the save every time |
| 1.2 Level select is safe | Choosing a level never removes a dragon or any progress | The bot bonds all four dragons, opens each level from the menu, and still has all four |
| 1.3 Falling is fair | A hero who falls into a gap returns to the last safe spot. The hero never pops up on the far side, and the hint names the right gift | The bot jumps into every gap in every level and never ends up past it |
| 1.4 Only the player pushes | A computer-controlled Michael never moves a block | The bot plays Level 1 as Joshua for two minutes and the block has not moved |
| 1.5 Memory is released | Leaving a level frees what it loaded | After 11 level loads, the counts of shapes, textures and shaders are within 10 percent of the counts after the first load |

### Stage 2: The systems every level uses

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 2.1 Difficulty | Easy, Medium and Hard are chosen at the start, saved, and changeable from the pause menu. On Easy nobody can lose. Hard is pitched at an early teen | On Easy an idle bot beside a guardian is never defeated in five minutes. On Hard the same idle bot is defeated within 30 seconds\* |
| 2.2 Controller | The whole game, menus included, works from an Xbox controller | The bot starts a game, picks a difficulty, plays, swaps hero and pauses using controller input only |
| 2.3 Gates | Levels have solid edges, and a gate stays shut until the right gift is used on it | For each gate, a bot with each of the three wrong heroes walks, jumps and hugs the edges for 60 seconds and does not get past. The right gift opens it |
| 2.4 Guardian fights | A fight on Easy lasts 45 to 90 seconds\*. The guardian acts at least every 6 seconds\*. Ice slows a guardian and cannot hold it still for more than 1.5 seconds\*. The fight ends with the guardian freed and friendly | A competent bot fights each guardian ten times with each hero. Every fight lands in the time range, and no guardian is ever frozen in place for good |
| 2.5 Companions | In solo play the other three follow, come when called and help gently. They never open a gate by themselves and never do more than a quarter of the work in a fight\* | The bot stands still at each gate for two minutes and the gate stays shut. Fight logs show companions under a quarter of the total |
| 2.6 Two players | Two controllers share one screen, and neither player can leave the other's view | Two bots walk in opposite directions for 30 seconds and both are still on screen |
| 2.7 Hints | After 20 seconds\* without progress, the Keeper speaks a hint that names the family member needed | The bot waits at each gate and the correct hint plays |
| 2.8 Speech | Every spoken line lives in one data file, `data/dialogue.json`, with its speaker and its sound file. Every line has a sound file made with Fish Audio. The Keeper, Renee, the Great Black Dragon and the Narrator each get one voice, chosen once and written in the log. Family members use stand-in voices until their own arrive. Captions show at most eight words at a time | A test compares the file with the story draft: every line is present, word for word, and no caption is over eight words |

### Stage 3: Level 2, made right

Level 2 is built first and finished completely before any other level, as the family decided. It is the Treetop Canopy and the green egg. The guardian is the Old Vine.

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 3.1 Layout on paper | `docs/levels/level-2.md` holds a map, the four gates in order, the berries and the guardian's arena. The gates are the ones in the story draft: Daniel clears the overgrowth, Michael holds a bridge steady, Vanessa freezes a waterfall into steps, Joshua makes the last long leap | The file exists and every gate names its gift and the hint line |
| 3.2 Playable | The level runs from start to egg | The bot finishes on Easy in 8 to 12 minutes\* using all four gifts. The bypass checks from 2.3 pass |
| 3.3 The hatching | The egg glows brighter as Joshua nears, the scene plays with its lines from the story draft, Speedy bonds and the bond is saved | The bot completes the scene, reloads the save, and Speedy is there |
| 3.4 Playtest | Michael has watched Joshua play Level 2 | **Pause.** Ask Michael three things: did Joshua finish without help, where did he get stuck, and did he ask to play again. Fix what he reports before Stage 5 |

### Stage 4: The story frame

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 4.1 Prologue | The family picks berries, the dragon lands, the eggs streak away, and the Keeper steps out of the trees in person. He tells the dragon's story, names Renee as his Ward and his wife, gives the four gifts and sends the family to free the Great Bear. Use models already in the repository. If none fits Renee, use a simple stand-in and log it | The bot watches the prologue to the end and Level 1 begins with all four gifts working |
| 4.2 Renee's news | The Keeper's updates about the dragon are spoken as news from Renee, and Renee meets the family at the castle door in Level 6 | Each update line in the story draft plays at its place |
| 4.3 The festival | The ending plays in the story draft's order: the Keeper makes the gifts permanent, Renee and the Keeper are reunited and embrace, the dragon stays, and the Narrator closes. The courtyard shows one pair of lanterns for every gold berry found | The bot finishes Level 6 with 3 berries and with all of them, and the lantern count matches each time |

### Stage 5: The other five levels

Build them in this order: Level 1, 3, 4, 5, then 6. Each level repeats the first three milestones of Stage 3: a layout file, a playable level that passes the bot and bypass checks in 8 to 12 minutes\* on Easy, and its story scene. The gates for each level are listed under "Each one's moment" in the story draft.

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 5.1 Level 1, the Great Woods | Teaches each gift once. The Great Bear is freed and the Keeper meets the family again | As Stage 3 |
| 5.2 Level 3, Scorched Caverns | Red egg, the Ember Golem, Daniel bonds with Ember | As Stage 3 |
| 5.3 Level 4, Frostpeak Ridge | Blue egg, the Yeti, Vanessa bonds with Frosty. Some gates now need a hero and a dragon together | As Stage 3 |
| 5.4 Level 5, the Craglands | Purple egg, the Stone Gargoyle, Michael bonds with Samson | As Stage 3 |
| 5.5 Level 6, beneath the castle | Four gates in a row, each needing a hero with a dragon. The meeting with the Great Black Dragon lasts 60 to 120 seconds\* and ends in the conversation Michael wrote, not in her defeat | As Stage 3, and the closing conversation plays word for word |

### Stage 6: Small and smooth

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 6.1 Light first load | The game starts after downloading 25 MB or less\*. Each level loads its own files when entered, 20 MB or less\* per level. No texture is larger than 1024 pixels on a side\* | The harness adds up the bytes requested before the title screen and on entering each level |
| 6.2 Nothing unused is shipped | Files the game never asks for are moved out of the shipped folder, not deleted | A full bot playthrough requests every shipped file at least once |
| 6.3 Smooth | The game holds its frame rate on modest hardware | With the processor slowed four times in the harness, the average frame takes under 33 milliseconds\* in every level |

### Stage 7: Voices

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 7.1 Recording script | `docs/recording-script.md` lists every line by speaker, with the file name each recording must have | The line count per speaker matches `data/dialogue.json` |
| 7.2 Voices in | **Pause** for a recording of each family member. When they arrive, clone each voice in Fish Audio and remake that person's lines. Every file is trimmed and set to an even loudness | Every line in the data file has a sound file that plays, and no family line still uses a stand-in voice |

### Stage 8: Final acceptance

| Milestone | Finished looks like | How it is checked |
| --- | --- | --- |
| 8.1 Whole game | A new save plays from the prologue to the festival on each difficulty | Three full bot playthroughs, one per difficulty, with no console errors |
| 8.2 Saves | Quitting at any level and returning puts the player back with everything kept | The bot quits and reloads at the start of each level |
| 8.3 Content | Nothing breaks the three content rules | Read every line in the data file and every piece of on-screen text against the rules, and log that you did |
| 8.4 Handover | A draft pull request is open with the filled scorecard and a short list of what only a person can check: a real controller, a real iPad, and whether it is fun | The pull request exists and `main` is untouched |

## Comparing the two builds

The comparison is only fair if both builders start from the same place with the same words.

- **Same start.** Both branch from the same commit on `main`, the prototype at `306d61d` plus one commit that adds the three documents to `docs/`.
- **Separate branches.** The Claude build works on `build/claude` and the Gemini 4 Neon build on `build/gemini`. Neither reads the other's branch.
- **Same instructions.** Each builder is started with one sentence: "Read docs/BUILD\_PLAN.md and build the game by following it." Nothing more is added for either.
- **Fresh sessions.** The Claude build should run in a new session that has only the repository, not this project's history. Claude wrote this plan and the audit, and a builder that remembers writing them would have an unfair head start.
- **Same answers.** When a builder pauses with a question, Michael gives both builders the same answer, even if only one asked.
- **Same stop.** Each build ends at milestone 8.4 with a draft pull request.

### Scorecard

Each builder fills in its own column in the pull request. The first six rows come straight from the automated checks, so they can be verified by running `npm test` on each branch.

| Measure | How it is counted |
| --- | --- |
| Milestones finished | Out of 37, with every check passing |
| Milestones blocked | Count, with the reason for each |
| Times it paused | Count, and how many were on the allowed list |
| First-load size | MB before the title screen |
| Guardian fight length on Easy | Shortest and longest across all guardians |
| Bypass checks passing | Out of 24 gates |
| Working time | From the first log entry to the last, less time spent waiting on Michael |
| Joshua's verdict | After playing Level 2 on each build: which one he asks to play again |

The last row matters most. A build that passes every check and bores a six-year-old has lost.

## Numbers I proposed

The story draft and the decision cards settle what the game is. They do not give a builder numbers to test against, so I chose the ones below. They are my judgment, not the family's decisions. Change any of them here before the builds start and both builders will follow the new value.

| Number | Proposed | Where it came from |
| --- | --- | --- |
| Guardian fight on Easy | 45 to 90 seconds | The family chose "about a minute" |
| Final meeting with the dragon | 60 to 120 seconds | A little longer than a guardian, since it is the finale |
| Level length on Easy | 8 to 12 minutes | The family chose ten-minute sittings, one level each |
| Hint delay | 20 seconds without progress | Short enough that a six-year-old does not give up |
| Guardian acts at least every | 6 seconds | In the audit, one guardian never attacked at all |
| Longest ice hold on a guardian | 1.5 seconds | In the audit, ice could hold a guardian still for the whole fight |
| Companions' share of a fight | Under a quarter | "They fight alongside, gently" |
| Idle player loses on Hard within | 30 seconds | Hard should punish standing still. Easy never does |
| First load | 25 MB or less | The prototype loads 168 MB, which is heavy for an iPad |
| Each level's files | 20 MB or less | So a level starts quickly |
| Largest texture | 1024 pixels a side | The prototype uses 2048 |
| Frame time with a slowed processor | Under 33 milliseconds | A stand-in for an iPad, which the tests cannot run on |

### Still needed from the family

None of these stops the builds from starting.

- How Joshua, Daniel, Vanessa and Michael each talk. Until then the placeholder lines in the story draft are used.
- A clean recording of each family member, so Fish Audio can clone their voices for Stage 7.
- A session with Joshua for the Level 2 playtest on each build.
