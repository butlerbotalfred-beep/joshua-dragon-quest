# Level 2: Treetop Canopy, the green egg

High walkways and swinging platforms among the giant trees. The guardian is the Old Vine, tangled up in the spell. The egg is green, and it is Joshua's: this is where Speedy hatches.

- Level data: `src/levels/level2.js`. This file describes it; the data is what the game runs.
- Music: `assets/audio/level2_treetop_canopy.mp3` for the level, `guardian_encounter.mp3` for the Old Vine, `hatching.mp3` for the hatching.
- One sitting: about 9 minutes for a six-year-old (see "How long it takes").

## The map

The family walks one way, from the start to the nest. Distances are in steps of the game's own measure; Joshua runs about 10 of them in a second, the others about 7.

The table below is printed from the level data by `node tools/level-map.mjs 2 --write`, so it cannot drift from the game.

<!-- map:start -->
Length 718 units. 4 gates, 14 berry bushes, 3 gold berries, 12 creatures, 4 webs.

| Distance from the start | What is there | Along the way |
| --- | --- | --- |
| 0 to 64 | Walkway | a friendly owl, a berry bush, gold berry 1, a spellbound spider, a berry bush |
| 64 to 76 | **Gate 1: Daniel, fire.** A wall across the path. Hint: "Daniel, burn away the overgrowth with your fire." |  |
| 76 to 112 | Walkway | a berry bush, a spider web, a spellbound sprout |
| 112 to 126 | Ramp up |  |
| 126 to 160 | Walkway | a friendly rabbit, a berry bush, a spellbound spider |
| 160 to 164 | A small gap anyone can jump |  |
| 164 to 194 | Walkway | a spider web, a spellbound sprout, a berry bush |
| 194 to 212 | A moving platform across a drop |  |
| 212 to 248 | Walkway | a berry bush, a friendly rabbit, a spellbound spider |
| 248 to 252 | A small gap anyone can jump |  |
| 252 to 282 | Walkway | a spider web, a berry bush |
| 282 to 298 | **Gate 2: Michael, strength.** A gap far too wide to jump. Hint: "Michael, hold the bridge steady with your strength." |  |
| 298 to 358 | Walkway | gold berry 2, a spellbound spider, a spellbound sprout, a berry bush |
| 358 to 374 | A moving platform across a drop |  |
| 374 to 404 | Walkway | a berry bush, a spellbound sprout |
| 404 to 408 | A small gap anyone can jump |  |
| 408 to 442 | Walkway | a friendly owl, a berry bush, a spellbound spider |
| 442 to 463 | **Gate 3: Vanessa, ice.** A gap far too wide to jump. Hint: "Vanessa, freeze the waterfall into steps." |  |
| 463 to 501 | Walkway | a berry bush, a spellbound sprout |
| 501 to 517 | A moving platform across a drop |  |
| 517 to 557 | Walkway | a spider web, gold berry 3, a berry bush, a spellbound spider |
| 557 to 561 | A small gap anyone can jump |  |
| 561 to 595 | Walkway | a friendly deer, a berry bush, a spellbound sprout |
| 595 to 607 | Ramp up |  |
| 607 to 627 | Walkway | a berry bush |
| 627 to 663 | **Guardian's arena:** Old Vine, 30 wide |  |
| 663 to 679 | Walkway | a friendly owl |
| 679 to 690 | **Gate 4: Joshua, speed.** A gap only the longest leap clears. Hint: "Joshua, run fast and leap to the nest." |  |
| 690 to 720 | **The nest** and the egg (Joshua's) | the Keeper speaks: "See how it glows? It can hear you coming, Joshua." |
<!-- map:end -->

## The four gates, in order

Each gate is something only one member of the family can do. It cannot be walked around, jumped over or skipped: the walkway has an edge on both sides, and each gate fills it from edge to edge. Until a gate is open the other three wait in front of it and never open it themselves.

1. **Daniel clears the overgrowth (fire).** A wall of thorny growth blocks the first walkway from edge to edge. Daniel's fire burns its three thick roots, and the wall shrinks away. Hint line: "Daniel, burn away the overgrowth with your fire."
2. **Michael holds a bridge steady (strength).** A rope bridge swings over a drop far too wide to jump, and a rail keeps everyone off it while it swings. Michael pushes its two posts firm, and the bridge holds still. Hint line: "Michael, hold the bridge steady with your strength."
3. **Vanessa freezes a waterfall into steps (ice).** Water tumbles down from a higher bank across a wide drop. Vanessa freezes it one piece at a time, nearest first, and each piece becomes a step up to the high bank. Hint line: "Vanessa, freeze the waterfall into steps."
4. **Joshua makes the last long leap (speed).** After the Old Vine is freed, one last gap lies before the nest. Only Joshua's running leap clears it. When he lands, a bridge drops for the others. Hint line: "Joshua, run fast and leap to the nest."

If nothing has moved forward for 20 seconds, the Keeper speaks the hint for the gate the family is standing at. Falling into the same gap twice brings the hint at once.

## Berries

- **14 berry bushes** beside the walkway, one or two in every stretch. Picking one heals the family a little and makes a happy sound.
- **3 gold berries**, each in a side nook off the walkway: one before the first gate (on the right), one just past the rope bridge (on the left), one above the waterfall (on the right). They are the festival's lanterns at the end of the game.

## Creatures and webs

Twelve small spellbound creatures (six spiders and six sprouts) and four spider webs. On Easy a creature is freed with one or two uses of any gift, and nobody can lose. A hero caught in a web is freed when anyone else stands beside them for a second, or by calling the family with B. Freed creatures scamper away happily. Friendly owls, rabbits and a deer watch from the edges.

Between the gates there are four small gaps anyone can jump (on Easy the hero hops them without a button) and three moving platforms to ride.

## The guardian's arena

A ring of branches 30 wide and 36 long, just before the last gate. The way out is sealed until the Old Vine is freed.

- **The Old Vine** is tangled in twelve knots of the spell on Easy. Every gift loosens a knot; fire works best.
- It warns before everything it does: glowing spots where roots will come up, and a ring where it will slam the ground.
- On Easy nobody can be defeated. A hero who is hit is dizzy for a moment and then up again.
- When the last knot comes loose the vine is free and friendly, and the seal lifts.

## The nest and the hatching

The egg glows from far off and glows brighter the nearer Joshua comes. The scene, from "Level 2" in `docs/STORY.md`:

1. As the family steps onto the nest walkway, the Keeper says: "See how it glows? It can hear you coming, Joshua."
2. Joshua walks up to the egg. The hatching music begins. Joshua: "Hi. I'm Joshua. I'll look after you. I promise."
3. The egg hatches. Speedy gives a happy chirp and zooms around Joshua's head.
4. Michael: "I think you have a friend for life, son."

Speedy is bonded to Joshua and saved the moment the scene begins to end, and also if the scene is skipped at any moment (milestone 1.1).

## How long it takes

The plan asks that the bot finish on Easy in 8 to 12 minutes. The bot that is timed stands in for a six-year-old on a first play (`CHILD` in `tests/harness/botcore.js`):

- it stops for 2 seconds to think before every new thing it does;
- about a quarter of the time its mind is elsewhere and it does nothing;
- it ambles (stick pushed 70% of the way) instead of running;
- it picks every berry and gold berry near the path;
- at each gate it tries the hero it has, and only swaps when the Keeper's hint names who is needed.

In the automated check that bot takes about 9 minutes from the start to the end of the hatching scene (8.9 to 9.2 over three runs). A quick bot that never waits takes about 4.4 minutes on Medium and 4.2 on Hard. The real answer is Joshua's first play (milestone 3.4).

## Choices the plan did not specify

- The order of things between the gates, the number of creatures, berries, platforms and gaps, and the two ramps (the walkway climbs from the forest floor to the high boughs as the level goes on).
- The rope bridge and the waterfall cross drops, not rivers, because the whole level is up in the trees.
- The Old Vine comes before Joshua's leap, so that the leap is "the last long leap" and lands him at the nest.
