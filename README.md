# 🐉 Joshua & The Dragon Quest

A stylized retro-inspired 3D action-adventure & puzzle platformer starring the royal family (**Prince Joshua, Prince Daniel, Queen Vanessa, and King Michael**) and their four bonded baby dragons (**Speedy, Ember, Frosty, and Samson**) in a 6-level quest to save the kingdom in time for the **Spring Mountain Festival**!

## 🎮 Play Online
Once GitHub Pages finishes deploying, play directly in your browser at:
**https://butlerbotalfred-beep.github.io/joshua-dragon-quest/**

## ✨ Features
- **1–2 Players:** Instant solo hot-swap between all 4 heroes (`1–4` / `Q`), 2-player local keyboard co-op, or plug-and-play **1–2 Gamepad Controllers**.
- **32 Custom 3D Assets + Original Soundtrack:**
  - **Meshy 3D:** 4 rigged & animated playable heroes (walk & run animations), 4 bonded baby dragons, the Keeper of the Forest, all 6 biome bosses, and approved enemy archetypes.
  - **Tripo3D:** 4 glowing dragon eggs, woodland berry bushes, pine trees, spider webs, thorn brambles, heavy boulders, ice barriers, obsidian gates, Royal Mountain Castle, and peaceful woodland wildlife (deer, rabbits, owls).
  - **Suno:** Original orchestral fantasy adventure theme (`assets/audio/main_theme.mp3`) paired with synthesized Web Audio combat/pickup SFX.
- **Live 3D In-Engine Cutscenes:** Prologue Castle Attack and Egg-Hatching/Imprinting cinematics.
- **6 Biomes & Telegraphed Multi-Phase Bosses:** *The Great Woods* → *Treetop Canopy* → *Scorched Caverns* → *Frostpeak Ridge* → *The Craglands* → *Castle & Deep Under-Cavern* → playable *Spring Mountain Festival Courtyard* decorated by your collected **Gold Berries**.
- **Magic & Berry Inventory Loop:** Passive magic regeneration, scarce berry bushes storing Red & Green Berries in a shared pouch, hero knockouts with teamwork/Red Berry revives, and automatic `localStorage` save persistence.

## 🕹️ Controls

| Action | 1-Player Solo | 2P Co-Op (P1) | 2P Co-Op (P2) | Gamepad |
| :--- | :--- | :--- | :--- | :--- |
| **Move** | `WASD` / `Arrows` | `WASD` | `Arrow Keys` | Left Stick / D-Pad |
| **Jump** | `Space` | `Space` | `/` | `A` / Cross |
| **Primary Attack** | `J` / `Left Click` | `F` | `L` | `X` / `RB` |
| **Dragon Special** | `K` / `Shift` / `Right Click` | `Left Shift` | `;` / `Right Shift` | `B` / `RT` |
| **Swap Hero** | `1–4` / `Q` / `E` | `Q` | `P` / `O` | `Y` / `LB` |
| **Red Berry (Heal/Revive)** | `R` | `R` | `R` | `LT` |
| **Green Berry (Magic Surge)** | `G` | `T` | `T` | `Select` |
| **Pause / Mute** | `Esc` / `M` | `Esc` / `M` | `Esc` / `M` | `Start` |

## 🚀 Run Locally
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080/` in your browser.
