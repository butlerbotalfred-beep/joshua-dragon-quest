# Level 2: Treetop Canopy — The Green Egg

- **Biome:** Treetop Canopy (elevated wooden walkways, giant pine trunks, swaying bridges, sunlit waterfall cliff)
- **Music:** `assets/audio/level2_treetop_canopy.mp3` (guardian: `guardian_encounter.mp3`, hatching: `hatching.mp3`)
- **Guardian:** The Old Vine (`vine`, freed and blooming friendly when spell breaks)
- **Egg & Bond:** Green Egg → **Speedy** bonds with **Joshua** (`heroIdx: 0`)
- **Target Easy Playtime:** 8 to 12 minutes (including exploration, berry harvesting, playful enemy encounters, all 4 gates, ~65s Old Vine fight, and the hatching scene)

## Top-Down Map (`+Z` Start → `-Z` Nest)

```text
                    [ N (-Z) : GREEN EGG NEST (z=-336, y=8) ]
                          (Gold Berry #3 at x=-11, z=-334)
                    +---------------------------------------+
                    |         THE OLD VINE ARENA            |
                    |     (x: -17..17, z: -282..-342, y=8)  |
                    |  [Red Bush]   (Old Vine)   [Grn Bush] |
                    +------------------===------------------+
                                       |||  <-- Vine Bridge lowered after Gate 4
        ======== GATE 4: THE LAST LONG LEAP (z=-260, y=8, Joshua's Speed) ========
                    +------------------+ +------------------+
                    |     UPPER CANOPY APPROACH (y=8)       |
                    |  (z: -206..-250, vine sprouts + wolf) |
                    |     [Red Bush]        [Grn Bush]      |
                    +------------------===------------------+
                                       |||  <-- Frozen Ice Steps (y=2 -> y=8)
        ======== GATE 3: WATERFALL STEPS (z=-182, y=2->8, Vanessa's Ice) =========
                    +---------------------------------------+
                    |       CASCADE OVERLOOK (y=2)          |
                    |    (z: -124..-174, spider web + wolf) |
    +-----------+   |                                       |
    | WEST DECK |---+  [Red Bush]             [Grn Bush]    |
    | Push Block|   |  (Gold Berry #2 via Michael switch)   |
    +-----------+   +------------------===------------------+
                                       |||  <-- Timber Bridge steadied by Gate 2
        ======== GATE 2: SWAYING BRIDGE (z=-108, y=0->2, Michael's Strength) =====
                    +---------------------------------------+
                    |      TIMBER BRIDGE LANDING (y=0)      |
                    |    (z: -62..-100, vine sprout + wolf) |
                    +---------------------------------------+
        ======== GATE 1: TANGLED OVERGROWTH (z=-58, y=0, Daniel's Fire) ==========
                    +---------------------------------------+
                    |       CANOPY ENTRANCE (y=0)           |
                    |  (z: +12..-56, spider web + peaceful  |
                    |   owls/deer, Red + Green Bushes)      |
                    |  [East Alcove: Gold Berry #1 z=-26]   |
                    +---------------------------------------+
                            [ S (+Z) : FAMILY START (z=+4) ]
```

## The Four Gates (In Order)

Every gate spans the full corridor width with solid side boundaries so no wrong hero can walk around, jump over, or skip it.

| Order | Gate ID | Position | Required Family Member & Gift | Mechanic | Keeper Hint Dialogue ID & Line |
| --- | --- | --- | --- | --- | --- |
| 1 | `l2_gate_overgrowth` | `z = -58, y = 0` | **Daniel** — Fire (`heroIdx: 1`) | Full-span tangled thorn & vine overgrowth across the deck. Daniel burns it away with Fireball or Flame Swipe. | `hint_daniel_fire`: *"Let Daniel burn away that tangle."* |
| 2 | `l2_gate_bridge` | `z = -108, y = 0 → 2` | **Michael** — Strength (`heroIdx: 3`) | Wide canopy gap with a heavy swaying timber bridge tilted off-kilter. Michael uses Strength at the timber counterweight wheel to steady and lock the bridge flat for the family. | `hint_michael_strength`: *"Michael is strong enough for that."* |
| 3 | `l2_gate_waterfall` | `z = -182, y = 2 → 8` | **Vanessa** — Ice (`heroIdx: 2`) | Rushing waterfall tumbling down a 6-unit cliff from the upper canopy. Vanessa uses Ice to freeze the waterfall into solid sparkling ice steps climbing smoothly from `y = 2` to `y = 8`. | `hint_vanessa_ice`: *"Vanessa can freeze a path here."* |
| 4 | `l2_gate_leap` | `z = -260, y = 8` | **Joshua** — Speed (`heroIdx: 0`) | Wide sunlit canopy chasm before the Old Vine's sanctuary. Joshua uses Speed on the green wind-runway to make the long leap across and release a hanging vine bridge for the rest of the family. | `hint_joshua_speed`: *"Joshua is fast enough to make it."* |

## Berries & Collectibles

### Red & Green Berry Bushes (6 total)
1. `(-8.5, -10, y=0)` — Green Berry Bush (Entrance)
2. `(8.5, -36, y=0)` — Red Berry Bush (Before Gate 1)
3. `(-8.5, -82, y=0)` — Red Berry Bush (Before Gate 2)
4. `(8.5, -148, y=2)` — Green Berry Bush (Cascade Overlook)
5. `(-8.5, -228, y=8)` — Red Berry Bush (Upper Canopy)
6. `(11.5, -296, y=8)` — Green Berry Bush (Old Vine Arena)
7. `(-11.5, -296, y=8)` — Red Berry Bush (Old Vine Arena)

### Gold Berries (3 total, for Festival Lanterns)
1. `l2_g1` at `(15.5, -26, y=0)` — East Canopy Lookout alcove (before Gate 1)
2. `l2_g2` at `(-16.5, -144, y=2)` — West Deck reward from Michael's Rune Push-Block puzzle (`block: -14, -140` → `switch: -18, -146`)
3. `l2_g3` at `(-11.5, -334, y=8)` — Sunlit alcove beside the Green Egg Nest

## Encounters & Peaceful Wildlife

- **Peaceful Wildlife (never enemies):** Perched owls at `(-12, -16)`, `(12, -135)`, `(-13, -235)`; friendly deer at `(14, -22)` and `(-15, -138)`; rabbits at `(-7, -74)` and `(8, -218)`.
- **Playful Hazards & Minions:**
  - Tickling Spider + Web at `(-1.5, -24, y=0)` (teaches swap & rescue)
  - Wild Wolf at `(4, -44, y=0)`
  - Vine Sprout at `(-4, -76, y=0)` and Wild Wolf at `(4.5, -90, y=0)`
  - Tickling Spider + Web at `(1.5, -136, y=2)` and Vine Sprout at `(-4.5, -158, y=2)`
  - Vine Sprout at `(-4, -222, y=8)` and Wild Wolf at `(4, -236, y=8)`

## Guardian Arena & Hatching Scene

- **Arena:** Circular sunlit canopy terrace centered at `(0, 8, -312)`, radius ~17 units (`34 × 60` platform), solid railing edges, two berry bushes on the perimeter.
- **Guardian:** The Old Vine (`vine`, 1280 HP on Easy). Attacks every 2.4–3.4s with telegraphed erupting root rings and vine lashing. Freed and friendly when spell breaks (~55–80s on Easy).
- **Green Egg Nest (`(0, 8, -336)`):**
  - Glows brighter and wobbles faster as Joshua nears (`dist < 14`).
  - Keeper speaks `l2_keeper_near_egg`: *"See how it glows? It can hear you coming, Joshua."*
  - Hatching scene plays `assets/audio/hatching.mp3`, Joshua speaks `l2_joshua_hatch` (*"Hi. I'm Joshua. I'll look after you. I promise."*), Speedy hatches with a happy Fish Audio chirp (`dragon_chirp.mp3`) and zooms around Joshua's head, and Michael speaks `l2_michael_friend` (*"I think you have a friend for life, son."*).
  - Speedy bonds with Joshua (`bondedDragons[0] = true`) and persists to save immediately.
