# Joshua & The Dragon Quest — Game Design Specification

## 1. High-Level Overview
* **Title:** Joshua & The Dragon Quest
* **Genre:** Action-Adventure / Puzzle Platformer
* **Players:** 1–2 Players (Instant solo hot-swap between 4 heroes, or 2-player local co-op splitting control of the roster)
* **Visual & Audio Pipeline:** Stylized retro-inspired 3D/mid-overhead adventure built in modular web code (`index.html`, `styles.css`, `game.js`), with props/environments generated via **Tripo3D MCP**, rigged/animated characters and creatures generated via **Meshy**, and original music generated via **Suno MCP** plus synthesized Web Audio SFX.

---

## 2. Story & World Lore
* **The Inciting Incident:** On the morning of the **Spring Mountain Festival**, the royal family wakes up early and heads into **The Great Woods** to hunt and gather berries for the celebration. Suddenly, a giant **Great Black Dragon** descends from the sky and lands on their castle in the distance.
* **The Dragon's Grudge & Scattering:** Years ago, the **Keeper of the Forest** fought and defeated the Great Black Dragon. Now returned for revenge, she spreads her wings and roars—launching four glowing dragon eggs (Green, Red, Blue, and Purple) across distant regions of the kingdom before breathing fire and burrowing beneath the castle.
* **The Egg-Imprinting Race (Merged Canon):**
  * The four baby dragons inside the eggs are inherently good and reject their mother's evil.
  * Because baby dragons imprint on the *very first creature they see* upon hatching and obey their commands, the Great Black Dragon floods the realm with monsters to find and corrupt the eggs before they hatch.
  * After escaping the Great Woods, the **Keeper of the Forest** instructs the family to race to each biome, rescue the eggs before the monsters do, and have the matching hero hold each egg as it hatches—forging a lifelong bond and combining their powers to defeat the Great Black Dragon in time for the Spring Mountain Festival.

---

## 3. Playable Heroes & Baby Dragon Bonds

| Hero | Base Ability | Dragon Partner (Color) | Post-Hatching Upgrade & Utility |
| :--- | :--- | :--- | :--- |
| **Prince Joshua** | **Super Speed:** Fast sprint and long-distance jumps | **Speedy** (Green) | **Hyper-Speed:** Faster movement, steep-slope sprints, and rapid traversal |
| **Prince Daniel** | **Fireballs:** Ranged fire projectiles | **Ember** (Red) | **Inferno Blasts:** Larger, faster fireballs that melt heavy ice barriers |
| **Queen Vanessa** | **Ice Blasts:** Freezes enemies and hazards | **Frosty** (Blue) | **Glacial Surge & Ice Bridges:** Wider ice blasts plus freezing water/gaps into crossable ice bridges |
| **King Michael** | **Super Strength:** Heavy melee attacks and pushing large objects | **Samson** (Purple) | **Titan Strength & Invincible Armor:** Crushes massive obstacles and activates temporary invincibility armor |

---

## 4. Core Gameplay Systems

### Magic & Berry Inventory Loop
* **Passive Magic Recharge:** Elemental magic slowly regenerates automatically over time so players never become permanently stuck.
* **Inventory Storage:** Harvested berries are stored in a limited shared inventory pouch rather than consumed automatically on pickup, allowing players to trigger them strategically during tough fights or puzzles.
* **Scarcity & Multi-Bush Rule:** Berry bushes are scarce throughout the levels. Although a single bush yields multiple berries, it requires harvesting **multiple bushes** to accumulate enough berries for a full magic recharge.
* **Berry Types:**
  * **Green Berries:** Accelerate magic regeneration when used from inventory.
  * **Red Berries:** Restore hero health during levels.
  * **Gold Berries:** Rare secret collectibles hidden across levels that unlock and decorate the castle courtyard for the Spring Mountain Festival finale.

### World & Enemy Design Guardrails
* **Friendly/Neutral Woodland Animals:** Do **not** use owls, deer, rabbits, horses, or domesticated dogs as enemies or scary hazards. Woodland wildlife remains peaceful background life.
* **Approved Enemy Archetypes:** Wild wolves, Tickling Spiders, bears, animated plants/vines, elemental golems, yetis, stone gargoyles, and the Great Black Dragon.

---

## 5. Six-Level Progression

1. **Level 1: The Great Woods (Escape & Tutorial)**
   * *Enemies & Hazards:* **Tickling Spiders** (walking into webs traps the active hero; as spiders approach to tickle them, players must swap to another family member to break the web and free them) and prowling **wild wolves**.
   * *Boss:* **Giant Grizzly Bear**.
   * *Story Beat:* Meet the **Keeper of the Forest** upon escaping the woods.
2. **Level 2: Treetop Canopy (Rescue Speedy — Green Egg)**
   * *Setting:* Elevated forest canopy, wooden bridges, and tangled overgrowth.
   * *Boss:* **Giant Vine Monster**.
   * *Reward:* Joshua hatches and bonds with **Speedy**.
3. **Level 3: Scorched Caverns (Rescue Ember — Red Egg)**
   * *Setting:* Volcanic subterranean caves with magma vents and obsidian obstacles.
   * *Boss:* **Magma Golem**.
   * *Reward:* Daniel hatches and bonds with **Ember**.
4. **Level 4: Frostpeak Ridge (Rescue Frosty — Blue Egg)**
   * *Setting:* Frozen mountain cliffs, icy rivers, and snowstorms.
   * *Boss:* **The Yeti**.
   * *Reward:* Vanessa hatches and bonds with **Frosty**, unlocking **Ice Bridges**.
5. **Level 5: The Craglands (Rescue Samson — Purple Egg)**
   * *Setting:* Ancient stone ruins guarded by traps and heavy fortifications.
   * *Boss:* **Stone Gargoyle**.
   * *Reward:* Michael hatches and bonds with **Samson**, unlocking **Invincible Armor**.
6. **Level 6: The Castle & Deep Under-Cavern (Final Battle)**
   * *Structure:* Multi-floor descent beneath the royal castle requiring combined use of all four heroes and their bonded dragons.
   * *Final Boss:* **The Great Black Dragon**.
   * *Ending:* With the Great Black Dragon defeated, the four baby dragons stay with the royal family forever, and the kingdom celebrates the Spring Mountain Festival decorated with collected Gold Berries.
