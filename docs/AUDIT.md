# Joshua & The Dragon Quest: Full Audit

Nov 23, 2026 · @Michael Buck

## Verdict

Your instinct is right. The plan is loose, and the looseness shows up in the game. What you have is a charming prototype that runs start to finish, but it is not yet the game the spec describes.

Three things matter most:

1. **The spec is a pitch, not a plan.** It is 74 lines of lore and feature names. It never says who the game is for, what device it runs on, how hard it should be, or what each level asks the player to do. Gemini filled those gaps by building the same level six times.
2. **The core promise is not enforced.** The game is about four heroes whose powers must combine. In play, every gate can be walked around or jumped, so no power is ever required.
3. **The fights are over before they start.** Every bonded hero killed the final boss in 3.5 to 7.3 seconds in my tests. It launched one attack at most.

There is also one real progression bug: pressing the jump key as an egg starts hatching skips the scene, and the dragon never bonds.

| Area | Rating | In one line |
| --- | --- | --- |
| Idea | Strong | Your family as heroes, each bonding with a baby dragon. Worth finishing. |
| Planning | Loose | No audience, no level designs, no numbers, no definition of done. |
| Gameplay | Thin | One lane, one attack button, bosses that melt, gates that do not gate. |
| Plot | Good bones | Clear fairy-tale shape, but the premise contradicts itself and nobody speaks. |
| Implementation | Works, fragile | Loads and runs cleanly. One 4,032-line file, a 168 MB download, a memory leak. |

**How I checked.** I read the spec, the README and all of `game.js`. I then ran the game in a headless browser and scripted the tests quoted below. I could not judge frame rate on real hardware, how the controls feel in the hand, or the music. Antigravity's own plan and task files are not in the repository, so I did not see them.

## The idea

The idea is the strongest part and it is worth finishing. A family plays as itself, each member bonds with a baby dragon, and each bond unlocks a power. That is personal, easy to explain to a child, and gives the game a natural shape: six levels, four bonding moments, one finale.

Several choices show real taste for a young audience:

- Spiders that tickle instead of bite.
- A written rule that deer, rabbits, owls, horses and dogs are never enemies. The build honors it.
- A chain where each dragon's power opens the next level: Speedy's speed climbs the ramp in Level 3, Ember's fire melts the ice in Level 4, and so on.

Where the idea is loose:

- **No stated player.** The spec never gives an age. That one fact decides difficulty, how much reading is acceptable, how many buttons a player can manage, and how long a level should last. Solo play currently uses about twelve keys, and each story card is roughly 70 words.
- **No stated device.** The game needs a keyboard or a gamepad. It has on-screen attack buttons but no touch movement, so it cannot be played on a tablet or phone.
- **The genre label does not match.** The spec says puzzle platformer. The build is a top-down brawler in a lane. Either is fine, but pick one, because they need different level design.
- **The name.** "Dragon Quest" is a Square Enix trademark. That is harmless at home. Rename it before any public release beyond family and friends. Separately, only Joshua is in the title while Daniel is an equal hero, which may matter in your house.

## Planning

The only planning document in the repository is `docs/game-design-spec.md`, and it describes what the game contains without saying how it should play. Where the spec was specific, Gemini built what it said. Where it was vague, Gemini built the cheapest thing that fits the words.

| The spec says | What was built |
| --- | --- |
| Action-adventure puzzle platformer | A straight lane brawler. Two moving platforms and two optional push-block puzzles in the whole game. |
| Race the monsters to each egg before it hatches | No race and no timer. Each egg waits behind a boss for as long as you like. |
| Canopy bridges, snowstorms and icy rivers, ruins guarded by traps | The same flat lane six times, about 26 units wide and 100 long, with a new ground texture and sky color. No traps. |
| Level 6 is a multi-floor descent that needs all four heroes | Two short ramps down. Both gates can be walked around. |
| Berries are scarce and used strategically | Four bushes per level and a pouch of 12. One red berry heals all four heroes and revives everyone who is down. Restarting a level regrows the bushes. |
| Webs trap the active hero and another family member frees them | Built as written. This is the one mechanic that makes swapping matter. |
| Friendly animals are never enemies | Honored. |
| Gold berries decorate the festival | Built. 18 berries, two extra lanterns for each one found. |
| One or two players with instant hero swap | Built, with gamepad support and drop-in co-op. |

What a plan needs that this spec does not have:

- **Player and device.** Age, reading level, keyboard or gamepad or tablet, session length.
- **Pillars.** Three sentences that settle arguments, such as "every level needs every family member."
- **The core loop.** What the player does minute to minute and why it stays fun.
- **A page per level.** The beats in order, what the level teaches, and which power it requires at which gate.
- **Numbers.** Hero damage, boss health and how long a boss fight should last.
- **Rules for failure and co-op.** What a knockout costs, how the camera handles two players, who the boss targets.
- **A budget.** Download size and the weakest machine it must run on.
- **A definition of done and a cut list.** What ships first, and what is dropped if time runs out.

Two process observations. First, polish came before proof. The asset files are dated November 21 and the single commit is November 22, so 32 models and a soundtrack were generated around a loop that had not yet been shown to be fun. Second, there is no history to learn from. The repository is one commit labelled "v4", and the code comments disagree about the asset count (12 plus 10, then 22, then 32), which is what several fast generation passes look like when nobody reviews between them.

## Gameplay

The loop as built is: walk up a lane, press attack until the boss falls, touch the egg. Nothing in a level requires more than that. A level is about 100 units long and heroes move 8 to 15 units a second, so each level is roughly ten seconds of walking plus fights. My estimate is that the whole game takes 10 to 15 minutes.

Each finding below was confirmed by a scripted test in the running game.

| Finding | What the test showed |
| --- | --- |
| Gates do not gate | Brambles, boulders, ice barriers and the obsidian gate are round blockers in the middle of a wide lane. I walked around the Level 4 ice barrier and the Level 6 obsidian gate with no hero able to break either. |
| Chasms do not need bridges | Joshua with Speedy jumped the 12-unit Level 5 chasm with no ice bridge. The rest of the family then teleported to him, because followers snap to the leader when they fall 14 units behind. Vanessa's Ice Bridge is never required. |
| The steep ramp can be skipped | Daniel, with no dragon, jumped the gap beside the Level 5 ramp and was lifted onto the upper ledge. |
| Bosses melt | The final boss has 520 health. Michael killed it in 3.5 seconds, Joshua in 3.7, Vanessa in 5.1, pressing attack as fast as the cooldown allows. It launched one attack at most. |
| Vanessa freezes bosses forever | Each ice hit freezes a boss for 1.6 seconds and her attack recharges in 0.38. Her free fallback attack freezes too. With zero magic, the final boss never moved or attacked and died in 7.3 seconds. |
| Magic barely matters | Joshua and Michael attack for free and out-damage both casters. Daniel and Vanessa get free fallback attacks when magic runs out. The berry and magic economy, the spec's main system, holds almost no decisions. |
| Losing is nearly impossible | I stood still beside the final boss for 30 seconds without a game over. One red berry revives everyone, and standing beside a downed hero for 1.5 seconds revives them for free. |
| The lane has no walls | Walking sideways into the hillside drops the hero through it. Joshua lost 20 health and the game told him to freeze the water with Vanessa. |

Other things I saw in the code but did not test:

- In solo play the three companions follow but never attack. They stand in the boss's area attacks and take the damage.
- No enemy has to be defeated. You can run past all of them.
- In co-op the boss only ever targets player one, and the camera has no tether, so two players can walk off each other's screen.

What already works and should be kept:

- Boss attacks are telegraphed with a filling ring on the ground, and jumping dodges the shockwave. That is readable for a child.
- Bosses have sensible weaknesses: fire against the vine monster and yeti, ice against the magma golem.
- Auto-aim, free fallback attacks and revive-by-standing-close mean a young player is never stuck.
- The web trap forces a hero swap in the first minute, which teaches the core idea early.

Near-impossible failure may be exactly right for a young child. The problem is that it was not chosen. Decide who the player is, then set the numbers on purpose.

## Plot

The story has a good fairy-tale shape, but its premise contradicts itself and the characters never speak. The shape is right: a festival morning interrupted, four rescues that each give one family member a moment, a final battle, and the festival restored.

The loose threads, in order of how much they matter:

1. **The dragon creates her own problem.** She launches her four eggs across the kingdom, then floods the realm with monsters to find them. The spec gives no reason for the first act.
2. **The babies are both good and blank.** They are "inherently good and reject their mother's evil", yet they obey whoever they see first. If they are good, corruption is no threat. If they obey anyone, their goodness means nothing. The spec heading says "Merged Canon", and this reads like two drafts joined without reconciling them.
3. **The grudge points the wrong way.** Her revenge is against the Keeper of the Forest, but she attacks the castle. The Keeper, who beat her once, sends a family with children to do it this time.
4. **The family already has magic.** Speed, fire, ice and strength exist before any dragon appears, and nothing explains them.
5. **The urgency is only in the text.** "Race" and "in time for the festival" are never felt in play.
6. **The ending is colder than the game.** The mother is driven away forever and the family keeps her four babies. For a game about parents and children, that is an odd last note.

How the story is told matters as much as what it says:

- All of it arrives as narration cards before and after each level. Only the Keeper has a line, and only once.
- Nobody in the family ever speaks. For a game starring your family, that is the biggest missed chance. One short line each per level, in their own voice, would do more than any cutscene.
- The six bosses have no link to the story. They are guards.
- The hatching scene is the emotional peak, it is 5.5 seconds long, and it can be skipped by accident.

One way to close most of these at once, offered as a suggestion: the eggs were never hers. She stole them from the Keeper's grove to raise an army, because hatchlings follow the first face they see, and the Keeper's old spell scattered them when she landed. The family's powers are gifts the Keeper gives at the end of Level 1. At the end, the hatchlings choose the family and the dragon loses her hold on them, so nobody has to take a mother's children.

## Implementation

The game loads and runs cleanly, which is more than many AI-built prototypes manage. All 32 models loaded, the browser console showed no errors, saving works, and every model has a simple fallback shape if its file fails. It also looks good: the models, lighting and interface are consistent and appealing.

The weaknesses are one progression bug, a very heavy download, a memory leak, and a structure that makes level design hard to get right.

| Severity | Problem | Evidence |
| --- | --- | --- |
| High | The jump key skips the hatching scene and the bond is lost. Space and Enter skip any cutscene, but the bond is only granted 2.2 seconds into the scene. | Tested on Level 2. The card said "Joshua & Speedy Bonded!" while Joshua stayed unbonded in play and in the save, and Level 3 began without Speedy. `game.js:1627` and `game.js:2062`. |
| High | First load downloads 168 MB. | Measured: 36 model files. Each character carries three 2048 by 2048 textures. Each hero is downloaded twice, once for the walk file and once for the run file, with full textures in both. |
| Medium | Memory grows with every level load because nothing is released. | After 11 level loads, geometries went from 89 to 426, textures from 55 to 124, and shader programs from 25 to 64. A long session on a modest machine will slow down. |
| Medium | A falling hero is lifted onto any floor they reach. This causes the ramp skip. | `game.js:3476`. |
| Medium | Obstacles are circles and lanes have no side walls. This causes every walk-around. | `game.js:3459`. |
| Medium | 65 MB of the 236 MB assets folder is never loaded. | Unused base and rigged copies of each hero, plus preview images from the generators. |
| Low | Michael pushes puzzle blocks even when the computer is steering him. | Tested. Playing as Joshua, the Level 1 block moved 3 units out of place by itself. `game.js:3157`. |
| Low | Level Select opens all six levels from the first launch and overwrites the dragon bonds. | `game.js:1540`. |
| Low | Wrong hint text. Falling anywhere says to freeze water, including in lava and off the side of a path. | Tested. `game.js:3487`. |

On structure:

- **One file, one class.** A single class of about 3,200 lines holds rendering, input, physics, enemy behavior, interface, saving and all level data.
- **Levels are typed-in coordinates.** Each level is a block of hand-placed numbers inside one long if-else (`game.js:2327` to `2524`). Nothing can express or check "this gate must span the lane", which is why none of them do.
- **Tuning numbers are scattered.** Health, damage and cooldowns live in a dozen places, so balancing means hunting.
- **No tests and no build step.** No build step is a fair choice for a small game. No tests means every change is checked by hand.
- **It needs the internet.** Three.js loads from a public CDN at a pinned version. That is fine online and fails offline.

Two smaller notes. The model folders include metadata files with long-lived download links to the generator services, which should not sit in a public repository. And I could not measure frame rate, because my test browser has no graphics card. The game keeps about nine point lights per level and rewrites the whole interface every frame, so test it on the weakest machine your family will actually use.

## What to tighten

Do these in order. The first three change the most for the least work.

1. **Write a one-page brief with your wife before any more building.** Answer five questions: how old is the player, what device, how long is one sitting, how hard should it be, and what three rules must every level obey. Everything below gets easier once this exists.
2. **Fix the hatching bug.** Grant the bond when the scene ends, however it ends, and stop the jump key from skipping cutscenes.
3. **Make one level right before touching the other five.** Take Level 2 and build it until it is fun: side walls on the lane, gates that span it, a required use of each available power, and a boss that lasts 45 to 90 seconds and shows two or three attack patterns. Then copy the pattern.
4. **Rebalance on purpose.** Raise boss health roughly tenfold or cut hero damage, give bosses a short freeze immunity after each freeze, and give magic a real job by making the free attacks clearly weaker.
5. **Give the companions something to do.** In solo play, let the three followers attack weakly or stay out of area attacks, so they read as family and not as baggage.
6. **Settle the story in one paragraph and give the family voices.** Resolve the six contradictions in the Plot section, then add one spoken line per hero per level.
7. **Move levels into data.** Describe each level as a table of pieces, split the one file into a few, and add a small automatic check that each level can only be finished with the intended powers.
8. **Shrink the download to under 30 MB.** Halve the texture sizes, compress them, load each hero once with separate animation clips, and delete the 65 MB of unused files.
9. **Release memory on level change.**
10. **Decide the public name** before sharing the link beyond family.

## The brief so far

Michael answered four of the five brief questions on November 22. These answers now set the direction for every step above.

| Question | Answer | What it changes |
| --- | --- | --- |
| Player | 6 years old | A six-year-old cannot read 70-word story cards or on-screen hints. Story and hints need to be spoken aloud, with a few words on screen at most. |
| Device | Mac mini or iPad, both with an Xbox controller | Design for the controller first and treat the keyboard as a backup. The iPad makes the 168 MB download and the memory leak urgent, because Safari on a tablet closes heavy pages. |
| Difficulty | Easy, medium and hard, with hard pitched at an early teen | Today's tuning is close to the easy setting. Medium and hard need bosses that survive long enough to show their attacks, which the current numbers do not allow. |
| Content rules | Nothing sexual, nothing blasphemous, no gore | The build already complies. Keep the rule in the brief so later generation passes inherit it. |
| Session length | Not answered yet | Decides how long a level should run and how often the game must save. |

Two consequences for the order of work. The controller already works on a Mac, but it should be tested on the iPad before anything else is built for it. And three difficulty levels need the tuning numbers gathered in one place first, which moves that part of step 7 ahead of step 4.
