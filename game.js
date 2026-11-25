import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { DIFFICULTIES, DIFFICULTY_ORDER, GUARDIAN_HP, HERO_COMBAT, TUNING } from './src/config.js';
import { DialogueSystem } from './src/dialogue.js';
import { buildLevel2 } from './src/levels/level2.js';

// ============================================================================
// JOSHUA & THE DRAGON QUEST — Wave 2 Enhanced 3D Action-Adventure
// Three.js + 12 Meshy Rigged/Textured Models + 10 Tripo3D Props + Suno OST
// ============================================================================

const HERO_DEFS = [
  {
    id: 'joshua',
    name: 'Prince Joshua',
    color: 0x2ecc71,
    accent: 0xf5c953,
    baseAbility: 'Super Speed',
    upgradedAbility: 'Hyper-Speed + Speedy',
    dragonKey: 'speedy',
    dragonName: 'Speedy',
    dragonColor: 0x39e58c,
    dragonEmoji: '🐉',
    height: 1.66,
    speed: 10.6,
    hyperSpeed: 15.2,
    jumpPower: 13.8,
    hyperJump: 16.4,
    maxHp: 100,
  },
  {
    id: 'daniel',
    name: 'Prince Daniel',
    color: 0xe74c3c,
    accent: 0xffa726,
    baseAbility: 'Fireballs',
    upgradedAbility: 'Inferno Blasts + Ember',
    dragonKey: 'ember',
    dragonName: 'Ember',
    dragonColor: 0xff5238,
    dragonEmoji: '🔥',
    height: 1.66,
    speed: 8.6,
    jumpPower: 11.4,
    maxHp: 105,
  },
  {
    id: 'vanessa',
    name: 'Queen Vanessa',
    color: 0x38b6ff,
    accent: 0xdff6ff,
    baseAbility: 'Ice Blasts',
    upgradedAbility: 'Glacial Surge & Ice Bridges',
    dragonKey: 'frosty',
    dragonName: 'Frosty',
    dragonColor: 0x5ce1ff,
    dragonEmoji: '❄️',
    height: 1.82,
    speed: 8.4,
    jumpPower: 11.2,
    maxHp: 110,
  },
  {
    id: 'michael',
    name: 'King Michael',
    color: 0x9b59b6,
    accent: 0xf7d060,
    baseAbility: 'Super Strength',
    upgradedAbility: 'Titan Strength & Armor',
    dragonKey: 'samson',
    dragonName: 'Samson',
    dragonColor: 0xb76eff,
    dragonEmoji: '🛡️',
    height: 1.98,
    speed: 7.7,
    jumpPower: 10.6,
    maxHp: 135,
  },
];

const LEVEL_DEFS = [
  {
    index: 0,
    badge: 'LEVEL 1',
    name: 'The Great Woods',
    subtitle: 'Escape & Tutorial • Boss: Giant Grizzly Bear',
    eggHeroIndex: null,
    biome: 'woods',
    skyTop: 0x4aa9e6,
    skyBottom: 0xd4f1d4,
    fogColor: 0x9fd8c4,
    cliffColor: 0x3b6e3c,
    ambientParticleColor: 0xfff59d,
    bossType: 'bear',
    bossName: 'GIANT GRIZZLY BEAR',
    objective: 'Escape The Great Woods, rescue webbed heroes & defeat the Giant Grizzly Bear!',
    introStory: {
      badge: 'PROLOGUE — SPRING MOUNTAIN FESTIVAL MORNING',
      art: '🐉🔥🏰',
      title: 'The Great Black Dragon Returns!',
      body: 'On the bright morning of the Spring Mountain Festival, Prince Joshua, Prince Daniel, Queen Vanessa, and King Michael head into The Great Woods to gather berries. Suddenly, a monstrous Great Black Dragon lands on the distant Royal Castle! With a thunderous roar, she launches four glowing dragon eggs across the kingdom before breathing fire and burrowing beneath the castle. Escape the woods and beware of Tickling Spiders!',
      extra: '💡 Tip: If a hero gets stuck in a Spider Web, instantly swap [1–4 or Q] to another family member and attack the web to break them free!',
    },
    outroStory: {
      badge: 'THE KEEPER OF THE FOREST',
      art: '🌿✨🧙',
      title: 'The Egg-Imprinting Race Begins',
      body: 'At the edge of the woods, the ancient Keeper of the Forest greets the royal family: "Years ago I defeated the Great Black Dragon. Her four baby dragons are pure of heart, but baby dragons imprint on the very first creature they see upon hatching! Monsters are racing to corrupt the eggs. Hurry to each biome and have the matching hero hold each egg as it hatches!"',
      extra: '🥚 Next Stop: Treetop Canopy — Rescue Speedy (Green Egg) for Prince Joshua!',
    },
  },
  {
    index: 1,
    badge: 'LEVEL 2',
    name: 'Treetop Canopy',
    subtitle: 'Rescue Speedy (Green Egg) • Boss: Giant Vine Monster',
    eggHeroIndex: 0,
    eggPropKey: 'egg_green',
    biome: 'canopy',
    skyTop: 0x45b7d1,
    skyBottom: 0xdff5c6,
    fogColor: 0x99d9b4,
    cliffColor: 0x2f6b3a,
    ambientParticleColor: 0xb9f6ca,
    bossType: 'vine',
    bossName: 'THE OLD VINE',
    objective: 'Free the Old Vine and hatch Speedy!',
    introStory: {
      badge: 'LEVEL 2 — TREETOP CANOPY',
      art: '🌳🟢🥚',
      title: 'High Above the Woods',
      body: 'The glowing Green Egg tumbled onto the high wooden walkways of the Treetop Canopy! Tangled vines, prowling wolves, and a colossal Giant Vine Monster guard the nest. Use Daniel’s Fireballs to burn through overgrown brambles and Joshua’s Super Speed to leap canopy gaps.',
      extra: '🥚 Egg Bond: Guide Prince Joshua [1] to hold the Green Egg after the boss falls!',
    },
    outroStory: {
      badge: 'DRAGON BOND FORGED!',
      art: '🐉💚⚡',
      title: 'Joshua & Speedy Bonded!',
      body: 'The Green Egg cracks open in Prince Joshua’s hands! Little Speedy flaps emerald wings and zips joyfully around Joshua. Together they unlock HYPER-SPEED — blazing movement, higher leaps, and the power to sprint right up steep slopes!',
      extra: '⚡ Unlocked: Joshua’s Hyper-Speed (Hold Shift / K to zip up steep slopes!)',
    },
  },
  {
    index: 2,
    badge: 'LEVEL 3',
    name: 'Scorched Caverns',
    subtitle: 'Rescue Ember (Red Egg) • Boss: Magma Golem',
    eggHeroIndex: 1,
    eggPropKey: 'egg_red',
    biome: 'cavern',
    skyTop: 0x1e0b10,
    skyBottom: 0x5c1f14,
    fogColor: 0x3b1615,
    cliffColor: 0x2d1c1c,
    ambientParticleColor: 0xff7043,
    bossType: 'magma',
    bossName: 'MAGMA GOLEM',
    objective: 'Use Hyper-Speed & Ice Blasts through the volcanic caves to rescue Ember for Daniel!',
    introStory: {
      badge: 'LEVEL 3 — SCORCHED CAVERNS',
      art: '🌋🔴🥚',
      title: 'Into the Volcanic Depths',
      body: 'The glowing Red Egg lies deep inside the Scorched Caverns! Use Joshua & Speedy’s Hyper-Speed to charge up the steep ash slope, cool fiery magma vents with Queen Vanessa’s Ice Blasts, and topple the towering Magma Golem.',
      extra: '🥚 Egg Bond: Guide Prince Daniel [2] to hold the Red Egg after the boss falls!',
    },
    outroStory: {
      badge: 'DRAGON BOND FORGED!',
      art: '🐉❤️🔥',
      title: 'Daniel & Ember Bonded!',
      body: 'Warm golden sparks shower the cavern as Ember hatches into Prince Daniel’s arms! Their combined magic unlocks INFERNO BLASTS — massive fiery bursts that deal fierce damage and melt Heavy Ice Barriers!',
      extra: '🔥 Unlocked: Daniel’s Inferno Blasts (Press J or K to melt Heavy Ice Barriers!)',
    },
  },
  {
    index: 3,
    badge: 'LEVEL 4',
    name: 'Frostpeak Ridge',
    subtitle: 'Rescue Frosty (Blue Egg) • Boss: The Yeti',
    eggHeroIndex: 2,
    eggPropKey: 'egg_blue',
    biome: 'frost',
    skyTop: 0x5fa8e6,
    skyBottom: 0xeaf6ff,
    fogColor: 0xcbe8ff,
    cliffColor: 0x8fb9d6,
    ambientParticleColor: 0xffffff,
    bossType: 'yeti',
    bossName: 'THE YETI',
    objective: 'Melt Heavy Ice Barriers with Inferno Blasts, defeat The Yeti & hatch Frosty with Vanessa!',
    introStory: {
      badge: 'LEVEL 4 — FROSTPEAK RIDGE',
      art: '❄️🔵🥚',
      title: 'Frozen Mountain Cliffs',
      body: 'Howling snowstorms whip across Frostpeak Ridge, where the glowing Blue Egg rests beyond frozen rivers and Heavy Ice Barriers. Let Daniel & Ember melt the giant ice walls, and brace for the mighty Yeti!',
      extra: '🥚 Egg Bond: Guide Queen Vanessa [3] to hold the Blue Egg after the boss falls!',
    },
    outroStory: {
      badge: 'DRAGON BOND FORGED!',
      art: '🐉💙❄️',
      title: 'Vanessa & Frosty Bonded!',
      body: 'Crystalline snowflakes dance as Frosty hatches and curls happily beside Queen Vanessa! Together they unlock GLACIAL SURGE & ICE BRIDGES — allowing Vanessa to freeze rushing rivers and icy chasms into solid sparkling Ice Bridges!',
      extra: '❄️ Unlocked: Vanessa’s Glacial Surge & Ice Bridges (Press K / Shift near water chasms!)',
    },
  },
  {
    index: 4,
    badge: 'LEVEL 5',
    name: 'The Craglands',
    subtitle: 'Rescue Samson (Purple Egg) • Boss: Stone Gargoyle',
    eggHeroIndex: 3,
    eggPropKey: 'egg_purple',
    biome: 'craglands',
    skyTop: 0x1c1433,
    skyBottom: 0x4f3575,
    fogColor: 0x352552,
    cliffColor: 0x3c3452,
    ambientParticleColor: 0xd8b4fe,
    bossType: 'gargoyle',
    bossName: 'STONE GARGOYLE',
    objective: 'Freeze chasms, climb stone ramps, defeat the Stone Gargoyle & hatch Samson with Michael!',
    introStory: {
      badge: 'LEVEL 5 — THE CRAGLANDS',
      art: '🏛️🟣🥚',
      title: 'Ancient Stone Fortifications',
      body: 'The final glowing Purple Egg fell into the ancient ruins of The Craglands. Combine Vanessa’s Ice Bridges, Joshua’s Hyper-Speed, and Daniel’s Inferno Blasts to breach the fortress and challenge the swooping Stone Gargoyle!',
      extra: '🥚 Egg Bond: Guide King Michael [4] to hold the Purple Egg after the boss falls!',
    },
    outroStory: {
      badge: 'ALL FOUR DRAGONS UNITED!',
      art: '🐉💜🛡️',
      title: 'Michael & Samson Bonded!',
      body: 'With a cheerful rumble, sturdy little Samson bursts from the Purple Egg and salutes King Michael! Together they unlock TITAN STRENGTH & INVINCIBLE ARMOR — crushing massive obsidian gates and shielding Michael completely from dragonfire!',
      extra: '🛡️ Unlocked: Michael’s Titan Strength & Invincible Armor (Press K / Shift for temporary invincibility!)',
    },
  },
  {
    index: 5,
    badge: 'LEVEL 6',
    name: 'Castle & Deep Under-Cavern',
    subtitle: 'Final Battle • Boss: The Great Black Dragon',
    eggHeroIndex: null,
    biome: 'castle_cavern',
    skyTop: 0x0e0817,
    skyBottom: 0x38152a,
    fogColor: 0x241024,
    cliffColor: 0x261d30,
    ambientParticleColor: 0xff5252,
    bossType: 'black_dragon',
    bossName: 'THE GREAT BLACK DRAGON',
    objective: 'Unite all 4 heroes & bonded dragons through the Under-Cavern and defeat the Great Black Dragon!',
    introStory: {
      badge: 'FINAL CHAPTER — BENEATH THE ROYAL CASTLE',
      art: '🏰🐉🔥',
      title: 'The Deep Under-Cavern',
      body: 'With Speedy, Ember, Frosty, and Samson flying beside them, the royal family descends beneath their castle! Every single power — Hyper-Speed, Titan Strength, Ice Bridges, Inferno Blasts, and Invincible Armor — will be needed to topple the Great Black Dragon in time for the Spring Mountain Festival!',
      extra: '🛡️ Final Boss Tip: Use King Michael’s Invincible Armor [K/Shift] to block the Great Black Dragon’s fire breath, then strike with all four bonded heroes!',
    },
    outroStory: {
      badge: 'VICTORY — SPRING MOUNTAIN FESTIVAL!',
      art: '🎉👑🐉✨',
      title: 'The Kingdom Celebrates!',
      body: 'With a final dazzling combo from Joshua, Daniel, Vanessa, Michael, and their four beloved dragons, the Great Black Dragon is defeated and driven far from the kingdom forever! Speedy, Ember, Frosty, and Samson stay with the royal family as the Spring Mountain Festival lights up the castle courtyard!',
      extra: '🌟 Welcome to the playable Festival Courtyard — decorated with all your collected Gold Berries!',
    },
  },
];

// ============================================================================
// HAND-PAINTED PROCEDURAL CANVAS TEXTURES (Gives Every Biome Rich Surface Detail)
// ============================================================================
class TextureFactory {
  constructor(sharedResources) {
    this.cache = {};
    this.sharedResources = sharedResources || new WeakSet();
  }

  getBiomeGround(biome) {
    if (this.cache[biome]) return this.cache[biome];
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    if (biome === 'woods' || biome === 'festival') {
      // Lush meadow grass with warm winding dirt/cobble trail down the middle
      ctx.fillStyle = biome === 'festival' ? '#4fa85a' : '#3e8c47';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 3 === 0 ? '#4ca355' : i % 3 === 1 ? '#32783b' : '#61b559';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 6 + Math.random() * 14, 6 + Math.random() * 14);
      }
      // Winding warm trail down the center band
      const grad = ctx.createLinearGradient(165, 0, 347, 0);
      grad.addColorStop(0, 'rgba(182, 143, 94, 0)');
      grad.addColorStop(0.22, 'rgba(182, 143, 94, 0.88)');
      grad.addColorStop(0.5, 'rgba(205, 169, 118, 0.96)');
      grad.addColorStop(0.78, 'rgba(182, 143, 94, 0.88)');
      grad.addColorStop(1, 'rgba(182, 143, 94, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(150, 0, 212, 512);
      // Stepping stones & tiny flower dots
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = 'rgba(145, 112, 74, 0.5)';
        ctx.beginPath();
        ctx.ellipse(195 + Math.random() * 122, Math.random() * 512, 8 + Math.random() * 10, 5 + Math.random() * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 55; i++) {
        const fx = i % 2 === 0 ? Math.random() * 145 : 367 + Math.random() * 145;
        ctx.fillStyle = i % 3 === 0 ? '#ffe57f' : i % 3 === 1 ? '#ffffff' : '#ff8a80';
        ctx.beginPath();
        ctx.arc(fx, Math.random() * 512, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (biome === 'canopy') {
      // Warm hand-painted wooden planks
      ctx.fillStyle = '#7c532f';
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 32) {
        ctx.fillStyle = (y / 32) % 2 === 0 ? '#8a5d36' : '#6e4727';
        ctx.fillRect(0, y, 512, 30);
        ctx.fillStyle = '#472c16';
        ctx.fillRect(0, y + 30, 512, 2);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = 'rgba(255, 224, 178, 0.08)';
          ctx.fillRect(Math.random() * 512, y + Math.random() * 26, 40 + Math.random() * 60, 2);
        }
      }
      // Mossy canopy borders
      ctx.fillStyle = 'rgba(56, 152, 74, 0.45)';
      ctx.fillRect(0, 0, 42, 512);
      ctx.fillRect(470, 0, 42, 512);
    } else if (biome === 'cavern') {
      // Dark volcanic basalt with glowing orange magma veins
      ctx.fillStyle = '#382626';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 450; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#4a3333' : '#291a1a';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 16 + Math.random() * 28, 16 + Math.random() * 28);
      }
      ctx.strokeStyle = 'rgba(255, 94, 26, 0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        let x = Math.random() * 512, y = Math.random() * 512;
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (Math.random() - 0.5) * 90;
          y += (Math.random() - 0.5) * 90;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (biome === 'frost') {
      // Shimmering snowdrifts with icy blue contours
      ctx.fillStyle = '#e8f5ff';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 180; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(176, 224, 255, 0.42)' : 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 512, 30 + Math.random() * 55, 10 + Math.random() * 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Packed ice trail down center
      ctx.fillStyle = 'rgba(140, 210, 250, 0.35)';
      ctx.fillRect(190, 0, 132, 512);
    } else {
      // Craglands & Castle Under-Cavern: Ancient stone flagstones
      const base = biome === 'craglands' ? '#524b66' : '#3d3448';
      const alt = biome === 'craglands' ? '#62597a' : '#4d415c';
      ctx.fillStyle = '#241e2e';
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 64) {
        const offset = ((y / 64) % 2) * 32;
        for (let x = -32; x < 512; x += 64) {
          ctx.fillStyle = Math.random() > 0.45 ? base : alt;
          ctx.fillRect(x + offset + 3, y + 3, 58, 58);
        }
      }
      // Subtle royal carpet/runic center runner
      ctx.fillStyle = biome === 'castle_cavern' ? 'rgba(180, 42, 62, 0.38)' : 'rgba(155, 102, 232, 0.25)';
      ctx.fillRect(200, 0, 112, 512);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.sharedResources.add(tex);
    this.cache[biome] = tex;
    return tex;
  }

  getWaterTexture(kind) {
    const key = `liquid_${kind}`;
    if (this.cache[key]) return this.cache[key];
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (kind === 'lava') {
      ctx.fillStyle = '#d83200';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ff9100' : '#ffea00';
        ctx.beginPath();
        ctx.ellipse(Math.random() * 256, Math.random() * 256, 14 + Math.random() * 24, 6 + Math.random() * 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#1b82d4';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = 'rgba(180, 240, 255, 0.42)';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 26 + Math.random() * 34, 4);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.sharedResources.add(tex);
    this.cache[key] = tex;
    return tex;
  }
}

// ============================================================================
// AUDIO ENGINE (Supplied Suno Streaming Music + Fish Audio SFX)
// ============================================================================
const MUSIC_TRACKS = {
  title: { url: 'assets/audio/main_theme.mp3', loop: true },
  prologue: { url: 'assets/audio/prologue_festival_morning.mp3', loop: true },
  level0: { url: 'assets/audio/level1_great_woods.mp3', loop: true },
  level1: { url: 'assets/audio/level2_treetop_canopy.mp3', loop: true },
  level2: { url: 'assets/audio/level3_scorched_caverns.mp3', loop: true },
  level3: { url: 'assets/audio/level4_frostpeak_ridge.mp3', loop: true },
  level4: { url: 'assets/audio/level5_craglands.mp3', loop: true },
  level5: { url: 'assets/audio/level6_beneath_the_castle.mp3', loop: true },
  boss: { url: 'assets/audio/guardian_encounter.mp3', loop: true },
  hatching: { url: 'assets/audio/hatching.mp3', loop: false },
  festival: { url: 'assets/audio/ending_festival.mp3', loop: true },
};

const SFX_FILES = {
  jump: 'assets/audio/sfx/sfx_jump.mp3',
  speed: 'assets/audio/sfx/sfx_speed.mp3',
  fire: 'assets/audio/sfx/sfx_fire.mp3',
  inferno: 'assets/audio/sfx/sfx_inferno.mp3',
  ice: 'assets/audio/sfx/sfx_ice.mp3',
  bridge: 'assets/audio/sfx/sfx_bridge.mp3',
  smash: 'assets/audio/sfx/sfx_smash.mp3',
  armor: 'assets/audio/sfx/sfx_armor.mp3',
  swap: 'assets/audio/sfx/sfx_swap.mp3',
  berry: 'assets/audio/sfx/sfx_berry.mp3',
  gold_berry: 'assets/audio/sfx/sfx_gold_berry.mp3',
  web_trap: 'assets/audio/sfx/sfx_web_trap.mp3',
  hit: 'assets/audio/sfx/sfx_hit.mp3',
  hurt: 'assets/audio/sfx/sfx_hurt.mp3',
  victory: 'assets/audio/sfx/sfx_victory.mp3',
  dragon_chirp: 'assets/audio/sfx/dragon_chirp.mp3',
  dragon_chorus: 'assets/audio/sfx/dragon_chorus.mp3',
};

class AudioSystem {
  constructor() {
    this.muted = false;
    this.initialized = false;
    this.currentTrackKey = null;
    this.activeMusicEl = null;
    this.musicMode = 'title';
    this.levelTrackKey = 'level0';
    this.sfxCache = new Map();
    this.targetVolume = 0.34;
    this.fadeInterval = null;
  }

  init() {
    this.initialized = true;
    if (!this.currentTrackKey) {
      this.playTrack('title');
    } else if (this.activeMusicEl && !this.muted && this.activeMusicEl.paused) {
      this.activeMusicEl.play().catch(() => {});
    }
  }

  playTrack(trackKey) {
    const spec = MUSIC_TRACKS[trackKey];
    if (!spec) return;
    if (this.currentTrackKey === trackKey && this.activeMusicEl) {
      if (!this.muted && this.activeMusicEl.paused && this.initialized) {
        this.activeMusicEl.play().catch(() => {});
      }
      return;
    }
    this.currentTrackKey = trackKey;
    if (!this.initialized) return;

    const outgoing = this.activeMusicEl;
    const incoming = new Audio(spec.url);
    incoming.loop = spec.loop;
    incoming.preload = 'auto';
    incoming.muted = this.muted;
    incoming.volume = 0.01;
    this.activeMusicEl = incoming;
    if (!this.muted) incoming.play().catch(() => {});

    // Smooth 600ms cross-fade between Suno tracks
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    let step = 0;
    const steps = 12;
    this.fadeInterval = setInterval(() => {
      step++;
      const t = Math.min(1, step / steps);
      if (this.activeMusicEl === incoming) {
        incoming.volume = this.targetVolume * t;
      }
      if (outgoing) {
        outgoing.volume = Math.max(0, this.targetVolume * (1 - t));
      }
      if (step >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        if (outgoing) {
          try { outgoing.pause(); outgoing.src = ''; } catch (_) {}
        }
      }
    }, 50);
  }

  setLevelTrack(levelIdx) {
    this.levelTrackKey = `level${Math.max(0, Math.min(5, levelIdx))}`;
    this.playTrack(this.levelTrackKey);
  }

  setMusicMode(mode) {
    this.musicMode = mode;
    if (mode === 'boss') this.playTrack('boss');
    else if (mode === 'festival') this.playTrack('festival');
    else if (mode === 'prologue') this.playTrack('prologue');
    else if (mode === 'hatching') this.playTrack('hatching');
    else if (mode === 'title') this.playTrack('title');
    else this.playTrack(this.levelTrackKey || 'title');
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.activeMusicEl) this.activeMusicEl.muted = this.muted;
    return this.muted;
  }

  playSfx(key, vol = 0.55) {
    if (this.muted || !this.initialized) return;
    const url = SFX_FILES[key];
    if (!url) return;
    try {
      let base = this.sfxCache.get(key);
      if (!base) {
        base = new Audio(url);
        base.preload = 'auto';
        this.sfxCache.set(key, base);
      }
      const inst = base.cloneNode(true);
      inst.volume = vol;
      inst.play().catch(() => {});
    } catch (_) {}
  }

  sfxJump() { this.playSfx('jump', 0.45); }
  sfxSpeed() { this.playSfx('speed', 0.5); }
  sfxFire() { this.playSfx('fire', 0.52); }
  sfxInferno() { this.playSfx('inferno', 0.62); }
  sfxIce() { this.playSfx('ice', 0.5); }
  sfxBridge() { this.playSfx('bridge', 0.58); }
  sfxSmash() { this.playSfx('smash', 0.58); }
  sfxArmor() { this.playSfx('armor', 0.55); }
  sfxSwap() { this.playSfx('swap', 0.42); }
  sfxBerry() { this.playSfx('berry', 0.52); }
  sfxGoldBerry() { this.playSfx('gold_berry', 0.6); }
  sfxWebTrap() { this.playSfx('web_trap', 0.5); }
  sfxHit() { this.playSfx('hit', 0.45); }
  sfxHurt() { this.playSfx('hurt', 0.5); }
  sfxHatch() { this.playTrack('hatching'); }
  sfxVictory() { this.playSfx('victory', 0.6); }
  sfxDragonChirp() { this.playSfx('dragon_chirp', 0.65); }
  sfxDragonChorus() { this.playSfx('dragon_chorus', 0.7); }
}

// ============================================================================
// ASSET LIBRARY — Loads All 22 Wave 1 + Wave 2 Meshy & Tripo3D GLBs!
// ============================================================================
class AssetLibrary {
  constructor(sharedResources, heroTextures) {
    this.loader = new GLTFLoader();
    this.sharedResources = sharedResources || new WeakSet();
    this.heroTextures = heroTextures || new WeakSet();
    this.heroes = {};    // id -> { scene, walkClip, runClip }
    this.models = {};    // key -> scene (dragons, enemies, props)
    this.loadedCount = 0;
    this.totalExpected = 32; // 4 Heroes + Keeper + 5 Dragons + 7 Enemies/Bosses + 15 Tripo Props
    this.onProgress = null;
  }

  markSharedTree(root, isHero = false) {
    const texKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'bumpMap'];
    root.traverse((obj) => {
      if (obj.geometry) this.sharedResources.add(obj.geometry);
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          this.sharedResources.add(m);
          for (const k of texKeys) {
            if (m[k]) {
              this.sharedResources.add(m[k]);
              if (isHero) this.heroTextures.add(m[k]);
            }
          }
        }
      }
    });
  }

  async loadAll(onProgress) {
    this.onProgress = onProgress;
    const staticModels = [
      // Wave 1 Tripo3D Props
      ['egg_green', 'assets/3d/props/egg_green/model.glb'],
      ['egg_red', 'assets/3d/props/egg_red/model.glb'],
      ['egg_blue', 'assets/3d/props/egg_blue/model.glb'],
      ['egg_purple', 'assets/3d/props/egg_purple/model.glb'],
      ['berry_bush', 'assets/3d/props/berry_bush/model.glb'],
      // Wave 2 Tripo3D Environment & Wildlife Props
      ['pine_tree', 'assets/3d/props/pine_tree/model.glb'],
      ['spider_web', 'assets/3d/props/spider_web/model.glb'],
      ['thorn_bramble', 'assets/3d/props/thorn_bramble/model.glb'],
      ['royal_castle', 'assets/3d/props/royal_castle/model.glb'],
      ['friendly_deer', 'assets/3d/props/friendly_deer/model.glb'],
      // Wave 3 Tripo3D Biome Obstacles & Peaceful Wildlife
      ['ice_barrier', 'assets/3d/props/ice_barrier/model.glb'],
      ['obsidian_gate', 'assets/3d/props/obsidian_gate/model.glb'],
      ['heavy_boulder', 'assets/3d/props/heavy_boulder/model.glb'],
      ['friendly_rabbit', 'assets/3d/props/friendly_rabbit/model.glb'],
      ['friendly_owl', 'assets/3d/props/friendly_owl/model.glb'],
      // Wave 2 Meshy Baby Dragons & Great Black Dragon
      ['speedy', 'assets/3d/dragons/speedy.glb'],
      ['ember', 'assets/3d/dragons/ember.glb'],
      ['frosty', 'assets/3d/dragons/frosty.glb'],
      ['samson', 'assets/3d/dragons/samson.glb'],
      ['great_black_dragon', 'assets/3d/dragons/great_black_dragon.glb'],
      // Wave 2 & 3 Meshy Enemies, Bosses & Keeper NPC
      ['tickling_spider', 'assets/3d/enemies/tickling_spider.glb'],
      ['wild_wolf', 'assets/3d/enemies/wild_wolf.glb'],
      ['grizzly_bear', 'assets/3d/enemies/grizzly_bear.glb'],
      ['vine_monster', 'assets/3d/enemies/vine_monster.glb'],
      ['magma_golem', 'assets/3d/enemies/magma_golem.glb'],
      ['yeti', 'assets/3d/enemies/yeti.glb'],
      ['stone_gargoyle', 'assets/3d/enemies/stone_gargoyle.glb'],
      ['keeper_of_the_forest', 'assets/3d/characters/keeper_of_the_forest.glb'],
    ];
    const tasks = [
      ...HERO_DEFS.map((h) => () => this.loadHero(h)),
      ...staticModels.map(([key, url]) => () => this.loadModel(key, url)),
    ];
    // Load in tidy batches of 4 so local HTTP servers never drop connections on cold load
    const BATCH_SIZE = 4;
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      await Promise.allSettled(tasks.slice(i, i + BATCH_SIZE).map((fn) => fn()));
    }
  }

  async loadGLB(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    });
  }

  async loadHero(heroDef) {
    const id = heroDef.id;
    let mainGltf = null;
    let walkClip = null;
    let runClip = null;

    for (const candidate of [
      `assets/3d/characters/${id}_walk.glb`,
      `assets/3d/characters/${id}_rigged.glb`,
      `assets/3d/characters/${id}.glb`,
    ]) {
      try {
        mainGltf = await this.loadGLB(candidate);
        if (mainGltf.animations && mainGltf.animations.length > 0) walkClip = mainGltf.animations[0];
        break;
      } catch (_) {}
    }

    try {
      const runGltf = await this.loadGLB(`assets/3d/characters/${id}_run.glb`);
      if (runGltf.animations && runGltf.animations.length > 0) runClip = runGltf.animations[0];
    } catch (_) {}

    if (mainGltf) {
      mainGltf.scene.traverse((obj) => {
        if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
      });
      this.markSharedTree(mainGltf.scene, true);
      this.heroes[id] = { scene: mainGltf.scene, walkClip, runClip };
      this.loadedCount++;
      this.onProgress?.(this.loadedCount, this.totalExpected);
    }
  }

  async loadModel(key, url) {
    try {
      const gltf = await this.loadGLB(url);
      gltf.scene.traverse((obj) => {
        if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
      });
      this.markSharedTree(gltf.scene);
      this.models[key] = gltf.scene;
      this.loadedCount++;
      this.onProgress?.(this.loadedCount, this.totalExpected);
    } catch (_) {}
  }

  instantiateNormalized(sourceScene, targetHeight, isSkinned = false, alignBottom = true) {
    const clone = isSkinned ? SkeletonUtils.clone(sourceScene) : sourceScene.clone(true);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const h = Math.max(0.01, size.y);
    const s = targetHeight / h;
    clone.scale.setScalar(s);
    clone.position.set(
      -center.x * s,
      alignBottom ? -box.min.y * s : -center.y * s,
      -center.z * s
    );
    return { wrapper, clone };
  }

  instantiateByWidth(sourceScene, targetWidth) {
    const clone = sourceScene.clone(true);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const w = Math.max(0.01, Math.max(size.x, size.z));
    const s = targetWidth / w;
    clone.scale.setScalar(s);
    clone.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    return { wrapper, clone };
  }
}

// ============================================================================
// PROCEDURAL FALLBACK BUILDERS (For Wave 3 Bosses/Minions Not Yet Generated)
// ============================================================================
function createHeroProceduralMesh(heroDef) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: heroDef.color, roughness: 0.45 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd7b5, roughness: 0.6 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, heroDef.height * 0.35, 6, 10), bodyMat);
  torso.position.y = heroDef.height * 0.48;
  torso.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
  head.position.y = heroDef.height * 0.8;
  g.add(torso, head);
  return g;
}

function createProceduralMinion(type) {
  const g = new THREE.Group();
  if (type === 'vine_minion') {
    const mat = new THREE.MeshStandardMaterial({ color: 0x267339, roughness: 0.6 });
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0x9c27b0, emissive: 0x4a148c, emissiveIntensity: 0.35 });
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 1.6, 8), mat);
    stalk.position.y = 0.8;
    stalk.castShadow = true;
    const bulb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52), bulbMat);
    bulb.position.y = 1.65;
    g.add(stalk, bulb);
  } else if (type === 'golem_minion') {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x3e2d2d, roughness: 0.85 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xff6d00, emissive: 0xff3d00, emissiveIntensity: 0.85 });
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), rockMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36), glowMat);
    core.position.set(0, 1.1, 0.5);
    g.add(torso, core);
  } else {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x67617a, roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.15, 0.52), stoneMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.1), stoneMat);
    wingL.position.set(-0.78, 1.35, -0.15);
    const wingR = wingL.clone(); wingR.position.x = 0.78;
    g.add(torso, wingL, wingR);
  }
  return g;
}

function createProceduralBoss(bossType) {
  const g = new THREE.Group();
  if (bossType === 'vine') {
    const vineM = new THREE.MeshStandardMaterial({ color: 0x1e6b34, roughness: 0.65 });
    const flowerM = new THREE.MeshStandardMaterial({ color: 0xab47bc, emissive: 0x4a148c, emissiveIntensity: 0.45 });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.6, 3.4, 10), vineM);
    core.position.y = 1.7;
    core.castShadow = true;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4), flowerM);
    crown.position.y = 3.5;
    g.add(core, crown);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 2.2, 6, 8), vineM);
      arm.position.set(Math.cos(a) * 1.8, 1.9, Math.sin(a) * 1.8);
      arm.rotation.z = Math.cos(a) * 0.75;
      arm.rotation.x = Math.sin(a) * 0.75;
      g.add(arm);
    }
  } else if (bossType === 'magma') {
    const rock = new THREE.MeshStandardMaterial({ color: 0x2c1e1e, roughness: 0.9 });
    const lava = new THREE.MeshStandardMaterial({ color: 0xff6d00, emissive: 0xff3d00, emissiveIntensity: 0.95 });
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(1.85), rock);
    torso.position.y = 2.2;
    torso.castShadow = true;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.0), lava);
    core.position.set(0, 2.2, 1.15);
    g.add(torso, core);
    [-2.1, 2.1].forEach((ox) => {
      const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.92), rock);
      fist.position.set(ox, 1.8, 0.6);
      fist.castShadow = true;
      g.add(fist);
    });
  } else if (bossType === 'yeti') {
    const fur = new THREE.MeshStandardMaterial({ color: 0xeaf6ff, roughness: 0.75 });
    const ice = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x0288d1, emissiveIntensity: 0.35 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.75, 16, 16), fur);
    body.scale.set(1.15, 1.25, 0.95);
    body.position.y = 2.2;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 14), fur);
    head.position.set(0, 3.85, 0.35);
    g.add(body, head);
    [-0.55, 0.55].forEach((ox) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 8), ice);
      horn.position.set(ox, 4.55, 0.35);
      horn.rotation.z = -ox * 0.5;
      g.add(horn);
    });
  } else {
    const stone = new THREE.MeshStandardMaterial({ color: 0x5b5570, roughness: 0.75 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xd580ff });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.5, 1.25), stone);
    body.position.y = 2.05;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85), stone);
    head.position.set(0, 3.65, 0.35);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.65, 0.22), stone);
    wingL.position.set(-2.1, 2.8, -0.35);
    const wingR = wingL.clone(); wingR.position.x = 2.1;
    g.add(body, head, wingL, wingR);
    [-0.25, 0.25].forEach((ox) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eye);
      e.position.set(ox, 3.75, 1.02);
      g.add(e);
    });
    g.userData = { wingL, wingR };
  }
  return g;
}

function createProceduralWildlife(kind) {
  const g = new THREE.Group();
  if (kind === 'rabbit') {
    const fur = new THREE.MeshStandardMaterial({ color: 0xf7f1e3, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), fur);
    body.position.y = 0.28;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), fur);
    head.position.set(0, 0.48, 0.2);
    g.add(body, head);
    [-0.07, 0.07].forEach((ox) => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.22, 4, 6), fur);
      ear.position.set(ox, 0.74, 0.18);
      g.add(ear);
    });
  } else {
    const feather = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), feather);
    body.position.y = 0.35;
    const eyeM = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    g.add(body);
    [-0.09, 0.09].forEach((ox) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeM);
      e.position.set(ox, 0.44, 0.26);
      g.add(e);
    });
  }
  return g;
}

// ============================================================================
// MAIN GAME CLASS
// ============================================================================
class DragonQuestGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.popupLayer = document.getElementById('floating-popups');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.5, 320);
    this.camera.position.set(0, 18, 22);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.shakeTime = 0;
    this.shakeIntensity = 0;

    this.sharedResources = new WeakSet();
    this.heroTextures = new WeakSet();
    this.sharedParticleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.sharedResources.add(this.sharedParticleGeo);
    this.particleMatCache = new Map();

    this.audio = new AudioSystem();
    this.dialogue = new DialogueSystem(this);
    this.dialogue.load();
    this.assets = new AssetLibrary(this.sharedResources, this.heroTextures);
    this.textures = new TextureFactory(this.sharedResources);

    // Game state
    this.mode = 'title';
    this.isCoop = false;
    this.difficulty = 'easy';
    this.currentLevelIdx = 0;
    this.highestLevel = 0;
    this.completedLevels = new Set();
    this.bondedDragons = [false, false, false, false];
    this.giftsGranted = true;
    this.giftsPermanent = false;
    this.magic = 100;
    this.maxMagic = 100;
    this.magicBoostTimer = 0;
    this.inventory = { red: 2, green: 2, gold: 0, maxRed: 12, maxGreen: 12 };
    this.collectedGoldIds = new Set();

    this.p1Hero = 0;
    this.p2Hero = 1;
    this.gamepadPrevButtons = [{}, {}];
    this.gamepadAxes = [new THREE.Vector2(), new THREE.Vector2()];
    this.menuFocusIdx = 0;
    this.menuFocusScreen = null;
    this.menuNavCd = 0;
    this.gamepadPrevNavDir = { x: 0, y: 0 };

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.heroes = [];
    this.enemies = [];
    this.boss = null;
    this.webs = [];
    this.bushes = [];
    this.goldBerries = [];
    this.obstacles = [];
    this.gates = [];
    this.chasmZones = [];
    this.slopeZones = [];
    this.platforms = [];
    this.movingPlatforms = [];
    this.pushPuzzles = [];
    this.dangerZones = [];
    this.projectiles = [];
    this.particles = [];
    this.vfxMeshes = [];
    this.ambientMotes = [];
    this.levelAnimators = [];
    this.levelMinZ = -120;
    this.levelMaxZ = 16;
    this.floatingPopups = [];
    this.wildlife = [];
    this.eggObj = null;
    this.keeperObj = null;
    this.reneeObj = null;
    this.reneeObj = null;
    this.cutscene = null;
    this.levelGoalTriggered = false;
    this.alertTimer = 0;
    this.companionRallyTimer = 0;
    this.lastProgressTime = 0;
    this.lastHintTime = -999;
    this.furthestZ = 10;
    this.lastPlayedHint = null;
    this.hintHistory = [];
    this.captionQueue = [];
    this.captionTimer = 0;
    this.activeCaptionText = '';
    this.clock = new THREE.Clock();
    this.simTime = 0;
    this.manualStepping = false;
    this.keys = {};
    this.storyCallback = null;

    this.loadSave();
    this.setupLights();
    this.buildTitleDiorama();
    this.bindUI();
    this.bindInput();
    this.refreshDifficultyUI();
    this.refreshSaveUI();
    this.loadAllAssets();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  // ============================================================================
  // PERSISTENT SAVE SYSTEM (localStorage)
  // ============================================================================
  loadSave() {
    try {
      const raw = localStorage.getItem('joshua_dragon_quest_save_v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.highestLevel = Math.min(5, Math.max(0, data.highestLevel || 0));
      this.completedLevels = new Set(data.completedLevels || []);
      this.collectedGoldIds = new Set(data.collectedGoldIds || []);
      this.inventory.gold = this.collectedGoldIds.size;
      if (Array.isArray(data.bondedDragons) && data.bondedDragons.length === 4) {
        this.bondedDragons = data.bondedDragons.map(Boolean);
      }
      if (typeof data.red === 'number') this.inventory.red = data.red;
      if (typeof data.green === 'number') this.inventory.green = data.green;
      if (data.difficulty && DIFFICULTIES[data.difficulty]) this.difficulty = data.difficulty;
    } catch (_) {}
  }

  getDifficultyConfig() {
    return DIFFICULTIES[this.difficulty] || DIFFICULTIES.easy;
  }

  setDifficulty(diffId, save = true) {
    if (!DIFFICULTIES[diffId]) return;
    this.difficulty = diffId;
    this.refreshDifficultyUI();
    if (save) this.persistSave();
  }

  cycleDifficulty() {
    const idx = DIFFICULTY_ORDER.indexOf(this.difficulty);
    const next = DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length];
    this.setDifficulty(next, true);
    this.showAlert(`Difficulty: ${DIFFICULTIES[next].label}`, 1.8);
  }

  refreshDifficultyUI() {
    const cfg = this.getDifficultyConfig();
    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.diff === this.difficulty);
    });
    const pauseDiffBtn = document.getElementById('btn-pause-difficulty');
    if (pauseDiffBtn) {
      pauseDiffBtn.textContent = `⚔️ Difficulty: ${cfg.label}`;
    }
  }

  persistSave() {
    try {
      const payload = {
        highestLevel: this.highestLevel,
        completedLevels: [...this.completedLevels],
        collectedGoldIds: [...this.collectedGoldIds],
        bondedDragons: this.bondedDragons,
        red: this.inventory.red,
        green: this.inventory.green,
        difficulty: this.difficulty,
      };
      localStorage.setItem('joshua_dragon_quest_save_v1', JSON.stringify(payload));
      this.refreshSaveUI();
    } catch (_) {}
  }

  resetSave() {
    try { localStorage.removeItem('joshua_dragon_quest_save_v1'); } catch (_) {}
    this.highestLevel = 0;
    this.completedLevels.clear();
    this.collectedGoldIds.clear();
    this.bondedDragons = [false, false, false, false];
    this.inventory = { red: 2, green: 2, gold: 0, maxRed: 12, maxGreen: 12 };
    this.refreshSaveUI();
    this.showAlert('🗑️ Saved progress reset!', 2.0);
  }

  refreshSaveUI() {
    const hasSave = this.highestLevel > 0 || this.completedLevels.size > 0 || this.collectedGoldIds.size > 0;
    const contBtn = document.getElementById('btn-continue-save');
    const summary = document.getElementById('save-summary-pill');
    if (contBtn) {
      contBtn.classList.toggle('hidden', !hasSave);
      if (hasSave) {
        contBtn.textContent = `▶ Continue Quest (Level ${this.highestLevel + 1})`;
      }
    }
    if (summary) {
      summary.classList.toggle('hidden', !hasSave);
      if (hasSave) {
        summary.textContent = `💾 Saved Progress: ${this.completedLevels.size}/6 Levels Cleared • 🌟 ${this.collectedGoldIds.size}/18 Gold Berries`;
      }
    }
    // Update gold berry counts on level select tiles
    LEVEL_DEFS.forEach((lvl) => {
      const el = document.getElementById(`lt-gold-${lvl.index}`);
      if (!el) return;
      const prefix = `l${lvl.index + 1}_g`;
      let found = 0;
      for (const id of this.collectedGoldIds) if (id.startsWith(prefix)) found++;
      const cleared = this.completedLevels.has(lvl.index) ? '✅ Cleared • ' : '';
      el.textContent = `${cleared}🌟 ${found}/3 Gold Berries`;
    });
  }

  setupLights() {
    this.hemiLight = new THREE.HemisphereLight(0xdef4ff, 0x3b4d32, 1.05);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff4d2, 1.55);
    this.dirLight.position.set(22, 40, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.dirLight.shadow.camera.near = 4;
    this.dirLight.shadow.camera.far = 150;
    const d = 48;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Fixed scene-level accent lights (constant light count prevents Three.js shader program growth)
    this.goalAccentLight = new THREE.PointLight(0xffe066, 0, 14);
    this.bossAccentLight = new THREE.PointLight(0xff3d00, 0, 16);
    this.scene.add(this.goalAccentLight, this.bossAccentLight);
  }

  async loadAllAssets() {
    const pill = document.getElementById('asset-status-pill');
    await this.assets.loadAll((loaded, total) => {
      pill.textContent = `✨ Loading Wave 2 3D World: ${loaded}/${total} Models (Meshy + Tripo3D)...`;
    });
    const count = this.assets.loadedCount;
    pill.textContent = `✅ World Ready!`;
    if (this.mode === 'title') this.buildTitleDiorama();
  }

  // Stylized gradient sky dome so outdoor biomes feel bright & painterly!
  addSkyBackdrop(topHex, bottomHex, includeClouds = true) {
    const skyGeo = new THREE.SphereGeometry(180, 20, 14);
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#' + topHex.toString(16).padStart(6, '0'));
    g.addColorStop(0.55, '#' + bottomHex.toString(16).padStart(6, '0'));
    g.addColorStop(1, '#' + bottomHex.toString(16).padStart(6, '0'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const skyMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh = sky;
    this.worldGroup.add(sky);

    if (includeClouds) {
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.25 });
      for (let i = 0; i < 12; i++) {
        const cg = new THREE.Group();
        cg.position.set((Math.random() - 0.5) * 140, 26 + Math.random() * 14, -10 - Math.random() * 130);
        for (let p = 0; p < 3; p++) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(2.6 + Math.random() * 1.8, 8, 8), cloudMat);
          puff.position.set((p - 1) * 2.8, Math.random() * 0.9, Math.random() * 1.4);
          puff.scale.set(1.3, 0.72, 1.0);
          cg.add(puff);
        }
        this.worldGroup.add(cg);
      }
    }
  }

  // Grounded border cliffs & distant mountain horizon so no world floats in empty sky!
  addSurroundingScenery(def) {
    const cliffMat = new THREE.MeshStandardMaterial({ color: def.cliffColor, roughness: 0.92 });
    const rockMat = new THREE.MeshStandardMaterial({ color: def.biome === 'frost' ? 0xd9eefc : def.cliffColor, roughness: 0.88 });

    const minZ = Math.min(-112, this.levelMinZ || -120);
    const totalDepth = Math.abs(minZ) + 45;
    const centerZ = (20 + minZ) / 2;

    // Side grassy banks / cliff ledges bordering the playable corridor
    for (const side of [-1, 1]) {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(34, 8, totalDepth), cliffMat);
      bank.position.set(side * 34.5, -3.2, centerZ);
      bank.receiveShadow = true;
      this.worldGroup.add(bank);

      // Rolling hills / cliff outcrops along the sides
      const hillStep = Math.max(13, Math.round(totalDepth / 14));
      for (let z = 14; z >= minZ; z -= hillStep) {
        const h = 4 + (Math.abs(Math.sin(z * 0.3)) * 5);
        const hill = new THREE.Mesh(new THREE.DodecahedronGeometry(h * 0.72), rockMat);
        hill.scale.set(1.4, 0.85, 1.3);
        hill.position.set(side * (23.5 + (Math.abs(Math.cos(z)) * 5)), h * 0.25, z);
        hill.receiveShadow = true;
        this.worldGroup.add(hill);
      }
    }

    // Distant mountain range behind the level horizon
    for (let i = -5; i <= 5; i++) {
      const mh = 18 + Math.abs(Math.sin(i * 1.4)) * 18;
      const peak = new THREE.Mesh(new THREE.ConeGeometry(16, mh, 6), rockMat);
      peak.position.set(i * 22, mh * 0.4 - 4, minZ - 26 - Math.abs(i) * 4);
      this.worldGroup.add(peak);
    }

    // Ambient floating biome particles (fireflies / snow / embers / arcane motes)
    const moteGeo = new THREE.SphereGeometry(0.11, 5, 5);
    const moteMat = new THREE.MeshBasicMaterial({ color: def.ambientParticleColor, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(moteGeo, moteMat);
      m.position.set((Math.random() - 0.5) * 32, 0.8 + Math.random() * 7.5, 10 - Math.random() * 105);
      this.worldGroup.add(m);
      this.ambientMotes.push({
        mesh: m,
        baseX: m.position.x,
        baseY: m.position.y,
        phase: Math.random() * 6.28,
        mode: def.biome === 'frost' ? 'snow' : def.biome === 'cavern' || def.biome === 'castle_cavern' ? 'ember' : 'firefly',
      });
    }
  }

  // Title Screen Diorama featuring real Meshy Heroes, Great Black Dragon, Tripo Royal Castle & 4 Eggs!
  buildTitleDiorama() {
    this.clearWorld();
    this.scene.background = new THREE.Color(0x1b2b4a);
    this.scene.fog = new THREE.Fog(0x1b2b4a, 35, 130);
    this.addSkyBackdrop(0x142240, 0x3b4d7a, true);

    const grassTex = this.textures.getBiomeGround('woods');
    grassTex.repeat.set(3, 3);
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 11.5, 2.4, 28),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.85 })
    );
    island.position.y = -1.2;
    island.receiveShadow = true;
    this.worldGroup.add(island);

    // Real Tripo3D Royal Castle!
    this.addCastleStructure(0, 0, -6.5, 1.0);

    // Framing Tripo3D Pine Trees
    this.addStylizedTrees([[-8.8, -3.5, 1.15], [8.8, -3.5, 1.15], [-7.2, 3.2, 0.95], [7.2, 3.2, 0.95]]);

    // All 4 Rigged Meshy Heroes!
    HERO_DEFS.forEach((hd, i) => {
      const x = -4.2 + i * 2.8;
      const model = this.createHeroRenderable(hd);
      model.root.position.set(x, 0, 3.2);
      this.worldGroup.add(model.root);
    });

    // All 4 Glowing Tripo3D Dragon Eggs + Baby Dragons!
    ['egg_green', 'egg_red', 'egg_blue', 'egg_purple'].forEach((key, i) => {
      const colors = [0x39e58c, 0xff5238, 0x5ce1ff, 0xb76eff];
      const egg = this.createEggRenderable(key, colors[i]);
      egg.position.set(-4.5 + i * 3.0, 0.5, -0.8);
      egg.userData.spin = true;
      this.worldGroup.add(egg);

      const baby = this.createBabyDragonRenderable(HERO_DEFS[i].dragonKey, colors[i]);
      baby.position.set(-4.5 + i * 3.0, 2.8, -0.8);
      baby.userData.bob = i + 1;
      this.worldGroup.add(baby);
    });

    // Real Meshy Great Black Dragon soaring overhead!
    const dragon = this.createBossRenderable('black_dragon');
    dragon.scale.setScalar(0.62);
    dragon.position.set(0, 8.2, -5.5);
    dragon.userData.orbit = true;
    this.worldGroup.add(dragon);
  }

  createHeroRenderable(heroDef) {
    const root = new THREE.Group();
    let mixer = null, walkAction = null, runAction = null, procedural = null;

    const loaded = this.assets.heroes[heroDef.id];
    if (loaded) {
      const { wrapper, clone } = this.assets.instantiateNormalized(loaded.scene, heroDef.height, true);
      root.add(wrapper);
      if (loaded.walkClip || loaded.runClip) {
        mixer = new THREE.AnimationMixer(clone);
        if (loaded.walkClip) {
          walkAction = mixer.clipAction(loaded.walkClip);
          walkAction.play();
          walkAction.setEffectiveWeight(0);
        }
        if (loaded.runClip) {
          runAction = mixer.clipAction(loaded.runClip);
          runAction.play();
          runAction.setEffectiveWeight(0);
        }
      }
    } else {
      procedural = createHeroProceduralMesh(heroDef);
      root.add(procedural);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.9, 28),
      new THREE.MeshBasicMaterial({ color: heroDef.color, side: THREE.DoubleSide, transparent: true, opacity: 0.82 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    root.add(ring);

    const armorBubble = new THREE.Mesh(
      new THREE.SphereGeometry(1.36, 18, 18),
      new THREE.MeshStandardMaterial({
        color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 0.72, transparent: true, opacity: 0.35,
      })
    );
    armorBubble.position.y = 1.0;
    armorBubble.visible = false;
    root.add(armorBubble);

    const webCocoon = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.96, 1),
      new THREE.MeshStandardMaterial({ color: 0xf4f8ff, wireframe: true, transparent: true, opacity: 0.88 })
    );
    webCocoon.position.y = 0.92;
    webCocoon.visible = false;
    root.add(webCocoon);

    return { root, mixer, walkAction, runAction, procedural, ring, armorBubble, webCocoon };
  }

  createBabyDragonRenderable(dragonKey, glowColor) {
    const g = new THREE.Group();
    const src = this.assets.models[dragonKey];
    if (src) {
      const { wrapper } = this.assets.instantiateNormalized(src, 1.15, false, false);
      g.add(wrapper);
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.25 });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), mat);
      g.add(orb);
    }
    return g;
  }

  createEnemyRenderable(type) {
    const g = new THREE.Group();
    const keyMap = {
      spider: 'tickling_spider',
      wolf: 'wild_wolf',
      vine_minion: 'vine_monster',
      golem_minion: 'magma_golem',
      gargoyle_minion: 'stone_gargoyle',
    };
    const heightMap = {
      spider: 1.25,
      wolf: 1.45,
      vine_minion: 1.9,
      golem_minion: 1.85,
      gargoyle_minion: 1.8,
    };
    const src = keyMap[type] ? this.assets.models[keyMap[type]] : null;
    if (src) {
      const { wrapper } = this.assets.instantiateNormalized(src, heightMap[type], false, true);
      g.add(wrapper);
    } else {
      g.add(createProceduralMinion(type));
    }
    return g;
  }

  createBossRenderable(bossType) {
    const g = new THREE.Group();
    const keyMap = {
      bear: 'grizzly_bear',
      vine: 'vine_monster',
      magma: 'magma_golem',
      yeti: 'yeti',
      gargoyle: 'stone_gargoyle',
      black_dragon: 'great_black_dragon',
    };
    const heightMap = {
      bear: 3.6,
      vine: 4.4,
      magma: 4.2,
      yeti: 4.5,
      gargoyle: 4.3,
      black_dragon: 6.4,
    };
    const src = keyMap[bossType] ? this.assets.models[keyMap[bossType]] : null;
    if (src) {
      const { wrapper } = this.assets.instantiateNormalized(src, heightMap[bossType], false, true);
      g.add(wrapper);
    } else {
      g.add(createProceduralBoss(bossType));
    }
    return g;
  }

  createEggRenderable(propKey, glowColor) {
    const group = new THREE.Group();
    const propScene = this.assets.models[propKey];
    if (propScene) {
      const { wrapper } = this.assets.instantiateNormalized(propScene, 1.65, false);
      group.add(wrapper);
    } else {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 16, 16),
        new THREE.MeshStandardMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.45 })
      );
      mesh.scale.set(0.85, 1.25, 0.85);
      mesh.position.y = 0.75;
      group.add(mesh);
    }
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.32, 28),
      new THREE.MeshBasicMaterial({ color: glowColor, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.08;
    group.add(halo);
    group.userData.halo = halo;
    return group;
  }

  createBerryBushRenderable(berryType) {
    const group = new THREE.Group();
    const bushProp = this.assets.models['berry_bush'];
    if (bushProp) {
      const { wrapper } = this.assets.instantiateNormalized(bushProp, 1.65, false);
      group.add(wrapper);
    } else {
      const base = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85), new THREE.MeshStandardMaterial({ color: 0x2c8c42 }));
      base.position.y = 0.7;
      group.add(base);
    }
    const berryColor = berryType === 'red' ? 0xff2e4c : 0x3dff8b;
    const berryMat = new THREE.MeshStandardMaterial({
      color: berryColor, emissive: berryColor, emissiveIntensity: 0.7, roughness: 0.2,
    });
    const berryGroup = new THREE.Group();
    [[0.44, 0.9, 0.48], [-0.42, 0.98, 0.44], [0.05, 1.28, 0.36], [0.5, 0.78, -0.35], [-0.46, 0.84, -0.38], [0, 1.32, -0.15]].forEach(([ox, oy, oz]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), berryMat);
      b.position.set(ox, oy, oz);
      berryGroup.add(b);
    });
    group.add(berryGroup);
    group.userData.berryGroup = berryGroup;
    return group;
  }

  createReneeRenderable() {
    // Simple stand-in for Renee (the Ward, kindly older tutor & Keeper's wife) since no repository GLB fits her
    const g = new THREE.Group();
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x2c5282, roughness: 0.65 });
    const shawlMat = new THREE.MeshStandardMaterial({ color: 0xf5c953, roughness: 0.55 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbe5c8, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });

    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.55, 12), robeMat);
    dress.position.y = 0.78;
    dress.castShadow = true;
    const shawl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.5, 0.36, 12), shawlMat);
    shawl.position.y = 1.32;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), skinMat);
    head.position.y = 1.72;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), hairMat);
    bun.position.set(0, 1.9, -0.18);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.95, 22),
      new THREE.MeshBasicMaterial({ color: 0xffe082, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.06;
    g.add(dress, shawl, head, bun, halo);
    return g;
  }

  addCastleStructure(x, y, z, scale = 1) {
    const src = this.assets.models['royal_castle'];
    if (src) {
      const { wrapper } = this.assets.instantiateNormalized(src, 13.5 * scale, false, true);
      wrapper.position.set(x, y, z);
      this.worldGroup.add(wrapper);
      return wrapper;
    }
    // Fallback castle
    const castle = new THREE.Group();
    castle.position.set(x, y, z);
    castle.scale.setScalar(scale);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 6), new THREE.MeshStandardMaterial({ color: 0x9aa4b8 }));
    keep.position.y = 3.5;
    castle.add(keep);
    this.worldGroup.add(castle);
    return castle;
  }

  // ============================================================================
  // FLOATING COMBAT / PICKUP POPUPS & CAMERA SHAKE
  // ============================================================================
  triggerShake(intensity = 0.35, duration = 0.22) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  spawnFloatingText(worldPos, text, color = '#ffe999') {
    const el = document.createElement('div');
    el.className = 'float-pop';
    el.textContent = text;
    el.style.color = color;
    this.popupLayer.appendChild(el);
    this.floatingPopups.push({
      el,
      pos: worldPos.clone(),
      life: 1.05,
      maxLife: 1.05,
    });
  }

  updateFloatingPopups(dt) {
    for (let i = this.floatingPopups.length - 1; i >= 0; i--) {
      const fp = this.floatingPopups[i];
      fp.life -= dt;
      fp.pos.y += dt * 1.9;
      if (fp.life <= 0) {
        fp.el.remove();
        this.floatingPopups.splice(i, 1);
        continue;
      }
      const proj = fp.pos.clone().project(this.camera);
      const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
      fp.el.style.left = `${sx}px`;
      fp.el.style.top = `${sy}px`;
      fp.el.style.opacity = Math.min(1, fp.life * 2.2);
    }
  }

  // ============================================================================
  // UI BINDINGS & STORY MODAL
  // ============================================================================
  bindUI() {
    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setDifficulty(btn.dataset.diff, true);
      });
    });

    const mode1p = document.getElementById('mode-1p');
    const mode2p = document.getElementById('mode-2p');
    mode1p.addEventListener('click', () => {
      this.isCoop = false;
      mode1p.classList.add('active');
      mode2p.classList.remove('active');
    });
    mode2p.addEventListener('click', () => {
      this.isCoop = true;
      mode2p.classList.add('active');
      mode1p.classList.remove('active');
    });

    document.getElementById('btn-continue-save').addEventListener('click', () => {
      this.audio.init();
      this.bondedDragons = [
        this.highestLevel >= 2 || this.bondedDragons[0],
        this.highestLevel >= 3 || this.bondedDragons[1],
        this.highestLevel >= 4 || this.bondedDragons[2],
        this.highestLevel >= 5 || this.bondedDragons[3],
      ];
      this.startLevel(this.highestLevel, false);
    });

    document.getElementById('btn-start-story').addEventListener('click', () => {
      this.audio.init();
      this.bondedDragons = [false, false, false, false];
      this.inventory = { red: 2, green: 2, gold: this.collectedGoldIds.size, maxRed: 12, maxGreen: 12 };
      this.startPrologueCutscene();
    });

    document.getElementById('btn-cutscene-skip').addEventListener('click', () => {
      this.finishCutscene();
    });

    document.getElementById('btn-reset-save').addEventListener('click', () => {
      this.resetSave();
    });

    document.getElementById('btn-open-levels').addEventListener('click', () => this.openLevelSelect());
    document.getElementById('btn-close-levels').addEventListener('click', () => {
      document.getElementById('level-select-screen').classList.add('hidden');
      if (this.mode === 'title') document.getElementById('title-screen').classList.remove('hidden');
      else document.getElementById('pause-overlay').classList.remove('hidden');
    });

    document.getElementById('btn-story-continue').addEventListener('click', () => {
      document.getElementById('story-overlay').classList.add('hidden');
      const cb = this.storyCallback;
      this.storyCallback = null;
      if (cb) cb();
    });

    document.getElementById('btn-use-red').addEventListener('click', () => this.useRedBerry());
    document.getElementById('btn-use-green').addEventListener('click', () => this.useGreenBerry());
    document.getElementById('btn-primary-attack').addEventListener('click', () => {
      this.audio.init();
      if (this.mode === 'playing' || this.mode === 'festival') this.heroPrimaryAbility(this.heroes[this.p1Hero]);
    });
    document.getElementById('btn-special-attack').addEventListener('click', () => {
      this.audio.init();
      if (this.mode === 'playing' || this.mode === 'festival') this.heroSpecialAbility(this.heroes[this.p1Hero]);
    });
    document.getElementById('btn-jump-action').addEventListener('click', () => {
      this.audio.init();
      if (this.mode === 'playing' || this.mode === 'festival') this.heroJump(this.heroes[this.p1Hero]);
    });
    document.getElementById('btn-retry-gameover').addEventListener('click', () => {
      document.getElementById('gameover-overlay').classList.add('hidden');
      this.startLevel(this.currentLevelIdx, false);
    });
    document.getElementById('btn-levels-gameover').addEventListener('click', () => {
      document.getElementById('gameover-overlay').classList.add('hidden');
      this.openLevelSelect();
    });

    document.getElementById('btn-audio-toggle').addEventListener('click', () => {
      const m = this.audio.toggleMute();
      document.getElementById('btn-audio-toggle').textContent = m ? '🔇' : '🔊';
    });

    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-pause-difficulty').addEventListener('click', () => this.cycleDifficulty());
    document.getElementById('btn-toggle-coop-live').addEventListener('click', () => {
      this.isCoop = !this.isCoop;
      if (this.isCoop && this.p2Hero === this.p1Hero) this.p2Hero = (this.p1Hero + 1) % 4;
      this.updateHUD();
      this.showAlert(this.isCoop ? '👥 Switched to 2-Player Local Co-Op!' : '👑 Switched to 1-Player Solo Hot-Swap!');
      this.togglePause(false);
    });
    document.getElementById('btn-restart-level').addEventListener('click', () => {
      this.togglePause(false);
      this.startLevel(this.currentLevelIdx, false);
    });
    document.getElementById('btn-pause-levels').addEventListener('click', () => {
      document.getElementById('pause-overlay').classList.add('hidden');
      this.openLevelSelect();
    });
    document.getElementById('btn-back-title').addEventListener('click', () => this.returnToTitle());

    for (let i = 0; i < 4; i++) {
      document.getElementById(`card-hero-${i}`).addEventListener('click', () => {
        if (this.mode === 'playing' || this.mode === 'festival') this.swapHero(1, i);
      });
    }

    const grid = document.getElementById('level-select-grid');
    LEVEL_DEFS.forEach((lvl) => {
      const btn = document.createElement('button');
      btn.className = 'level-tile';
      btn.innerHTML = `<div class="lt-num">${lvl.badge}</div><h3>${lvl.name}</h3><p>${lvl.subtitle}</p><div class="lt-gold" id="lt-gold-${lvl.index}">🌟 0/3 Gold Berries</div>`;
      btn.addEventListener('click', () => {
        this.audio.init();
        document.getElementById('level-select-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.add('hidden');
        this.bondedDragons = [
          this.bondedDragons[0] || lvl.index >= 2,
          this.bondedDragons[1] || lvl.index >= 3,
          this.bondedDragons[2] || lvl.index >= 4,
          this.bondedDragons[3] || lvl.index >= 5,
        ];
        this.inventory.red = Math.max(this.inventory.red, 2);
        this.inventory.green = Math.max(this.inventory.green, 2);
        this.startLevel(lvl.index, true);
      });
      grid.appendChild(btn);
    });
  }

  openLevelSelect() {
    this.refreshSaveUI();
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('level-select-screen').classList.remove('hidden');
  }

  returnToTitle() {
    this.mode = 'title';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('hero-dock').classList.add('hidden');
    document.getElementById('combat-bar').classList.add('hidden');
    document.getElementById('boss-hud').classList.add('hidden');
    document.getElementById('controls-strip').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('cutscene-ui').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    this.cutscene = null;
    this.refreshSaveUI();
    this.audio.setMusicMode('title');
    this.buildTitleDiorama();
  }

  showStoryModal(story, callback) {
    this.mode = 'story';
    const trim8 = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).slice(0, TUNING.maxCaptionWords).join(' ');
    document.getElementById('story-badge').textContent = trim8(story.badge);
    document.getElementById('story-art').textContent = story.art;
    document.getElementById('story-title').textContent = trim8(story.title);
    document.getElementById('story-body').textContent = trim8(story.shortBody || story.body);
    const extraEl = document.getElementById('story-extra');
    if (story.shortExtra) {
      extraEl.textContent = trim8(story.shortExtra);
      extraEl.classList.remove('hidden');
    } else extraEl.classList.add('hidden');
    this.storyCallback = callback;
    document.getElementById('story-overlay').classList.remove('hidden');
  }

  togglePause(force) {
    if (this.mode !== 'playing' && this.mode !== 'paused' && this.mode !== 'festival') return;
    const pause = force !== undefined ? force : this.mode !== 'paused';
    if (pause) {
      this._prePauseMode = this.mode;
      this.mode = 'paused';
      document.getElementById('pause-controls-text').innerHTML = this.isCoop
        ? `<strong>2P Co-Op Active</strong><br>P1: WASD Move • Space Jump • F Ability • Shift Special • Q Swap<br>P2: Arrows Move • / Jump • L Ability • ; Special • P Swap<br>Shared Berries: R (Heal) • T (Magic Surge)`
        : `<strong>1P Solo Hot-Swap</strong><br>WASD / Arrows: Move • Space: Jump • J / Click: Primary Ability • K / Shift: Dragon Special<br>1–4 or Q/E: Swap Hero • R: Red Berry (Heal) • G: Green Berry (Magic Surge)`;
      document.getElementById('pause-overlay').classList.remove('hidden');
    } else {
      this.mode = this._prePauseMode || 'playing';
      document.getElementById('pause-overlay').classList.add('hidden');
    }
  }

  chunkCaptionWords(text, maxWords = TUNING.maxCaptionWords) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    return chunks.length ? chunks : [''];
  }

  showCaption(speaker, text, totalDuration = null) {
    const chunks = this.chunkCaptionWords(text, TUNING.maxCaptionWords);
    const perChunk = totalDuration
      ? Math.max(1.2, totalDuration / chunks.length)
      : Math.max(1.8, Math.min(3.0, chunks[0].split(/\s+/).length * 0.35 + 1.0));
    this.captionQueue = chunks.map((chunk) => ({ speaker, text: chunk, duration: perChunk }));
    this.advanceCaption();
  }

  advanceCaption() {
    const el = document.getElementById('speech-caption');
    const spkEl = document.getElementById('caption-speaker');
    const txtEl = document.getElementById('caption-words');
    if (!el || !spkEl || !txtEl) return;
    if (this.captionQueue.length === 0) {
      el.classList.add('hidden');
      this.captionTimer = 0;
      this.activeCaptionText = '';
      return;
    }
    const item = this.captionQueue.shift();
    spkEl.textContent = item.speaker || 'Keeper';
    txtEl.textContent = item.text;
    this.activeCaptionText = item.text;
    this.captionTimer = item.duration;
    el.classList.remove('hidden');
  }

  updateCaptions(dt) {
    if (this.captionTimer > 0) {
      this.captionTimer -= dt;
      if (this.captionTimer <= 0) this.advanceCaption();
    }
  }

  markProgress() {
    this.lastProgressTime = this.simTime;
  }

  getCurrentKeeperHint() {
    // 1. Webbed hero?
    const trapped = this.heroes.find((h) => h.trappedByWeb);
    if (trapped) {
      return {
        gateId: 'web_trap',
        dialogueId: 'l1_keeper_web_hint',
        text: 'A web is too sticky for one. Call your family.',
        heroName: 'family',
      };
    }
    const p1 = this.heroes[this.p1Hero];
    // 2. Unopened gate ahead?
    if (p1) {
      const nextGate = this.gates
        .filter((gt) => !gt.opened && p1.pos.z >= gt.z - 3.0)
        .sort((a, b) => b.z - a.z)[0];
      if (nextGate) {
        const heroNames = ['Joshua', 'Daniel', 'Vanessa', 'Michael'];
        const heroName = heroNames[nextGate.requiredHeroIdx] || 'family';
        return {
          gateId: nextGate.id,
          dialogueId: nextGate.hintDialogueId || `hint_${nextGate.type}`,
          text: nextGate.hintText || `Try ${heroName}'s gift here!`,
          heroName,
        };
      }
    }
    // 3. Boss freed, egg waiting?
    const def = LEVEL_DEFS[this.currentLevelIdx];
    if (this.boss && this.boss.freed && this.eggObj && !this.eggObj.hatched && def && def.eggHeroIndex !== null) {
      const heroNames = ['Joshua', 'Daniel', 'Vanessa', 'Michael'];
      const heroName = heroNames[def.eggHeroIndex];
      return {
        gateId: 'egg_bond',
        dialogueId: `hint_egg_${heroName.toLowerCase()}`,
        text: `Bring ${heroName} to the glowing egg!`,
        heroName,
      };
    }
    return null;
  }

  updateKeeperHints() {
    if (this.mode !== 'playing') return;
    const p1 = this.heroes[this.p1Hero];
    if (p1 && p1.pos.z < this.furthestZ - 2.0) {
      this.furthestZ = p1.pos.z;
      this.markProgress();
    }
    const idleTime = this.simTime - this.lastProgressTime;
    const sinceLastHint = this.simTime - this.lastHintTime;
    if (idleTime >= TUNING.hintDelaySeconds && sinceLastHint >= TUNING.hintDelaySeconds) {
      const hint = this.getCurrentKeeperHint();
      if (hint) {
        this.lastHintTime = this.simTime;
        this.lastPlayedHint = { ...hint, speaker: 'Keeper', time: this.simTime };
        this.hintHistory.push(this.lastPlayedHint);
        this.showCaption('Keeper', hint.text);
        if (this.dialogue && hint.dialogueId) {
          this.dialogue.play(hint.dialogueId).catch(() => {});
        }
      }
    }
  }

  showAlert(msg, duration = 3.2) {
    const el = document.getElementById('alert-banner');
    const words = String(msg || '').trim().split(/\s+/).filter(Boolean);
    el.textContent = words.slice(0, TUNING.maxCaptionWords).join(' ');
    el.classList.remove('hidden');
    this.alertTimer = duration;
  }

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================
  bindInput() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;

      if (code === 'Escape') {
        if (this.mode === 'playing' || this.mode === 'paused' || this.mode === 'festival') this.togglePause();
        return;
      }
      if (code === 'KeyM') {
        const m = this.audio.toggleMute();
        document.getElementById('btn-audio-toggle').textContent = m ? '🔇' : '🔊';
        return;
      }
      if (this.mode === 'cutscene' && code === 'Enter') {
        e.preventDefault();
        this.finishCutscene();
        return;
      }
      if (this.mode === 'cutscene' && code === 'Space') {
        // Jump key must never skip a cutscene!
        e.preventDefault();
        return;
      }
      if (this.mode === 'story' && code === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-story-continue').click();
        return;
      }
      if (this.mode !== 'playing' && this.mode !== 'festival') return;

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();

      if (code === 'KeyR') this.useRedBerry();
      if (code === 'KeyG' && !this.isCoop) this.useGreenBerry();
      if (code === 'KeyT' && this.isCoop) this.useGreenBerry();
      if (code === 'KeyC' && !this.isCoop) this.callCompanions();

      if (!this.isCoop) {
        if (code === 'Digit1') this.swapHero(1, 0);
        if (code === 'Digit2') this.swapHero(1, 1);
        if (code === 'Digit3') this.swapHero(1, 2);
        if (code === 'Digit4') this.swapHero(1, 3);
        if (code === 'KeyQ' || code === 'Tab') { e.preventDefault(); this.swapHero(1, (this.p1Hero + 1) % 4); }
        if (code === 'KeyE') this.swapHero(1, (this.p1Hero + 3) % 4);
        if (code === 'Space') this.heroJump(this.heroes[this.p1Hero]);
        if (code === 'KeyJ' || code === 'KeyF' || code === 'Enter') this.heroPrimaryAbility(this.heroes[this.p1Hero]);
        if (code === 'KeyK' || code === 'ShiftLeft' || code === 'ShiftRight') this.heroSpecialAbility(this.heroes[this.p1Hero]);
      } else {
        if (code === 'KeyQ') this.cycleCoopHero(1);
        if (code === 'Space') this.heroJump(this.heroes[this.p1Hero]);
        if (code === 'KeyF') this.heroPrimaryAbility(this.heroes[this.p1Hero]);
        if (code === 'ShiftLeft' || code === 'KeyG') this.heroSpecialAbility(this.heroes[this.p1Hero]);

        if (code === 'KeyP' || code === 'KeyO') this.cycleCoopHero(2);
        if (code === 'Slash') this.heroJump(this.heroes[this.p2Hero]);
        if (code === 'KeyL') this.heroPrimaryAbility(this.heroes[this.p2Hero]);
        if (code === 'Semicolon' || code === 'ShiftRight') this.heroSpecialAbility(this.heroes[this.p2Hero]);
      }
    });

    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.mode !== 'playing' && this.mode !== 'festival') return;
      this.audio.init();
      // Aim toward mouse click point on ground plane!
      const h = this.heroes[this.p1Hero];
      if (h && !h.downed && !h.trappedByWeb) {
        const rect = this.canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, this.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -h.pos.y);
        const hitPt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, hitPt)) {
          const dx = hitPt.x - h.pos.x;
          const dz = hitPt.z - h.pos.z;
          if (dx * dx + dz * dz > 0.25) h.facing = Math.atan2(dx, dz);
        }
      }
      if (e.button === 0) this.heroPrimaryAbility(this.heroes[this.p1Hero]);
      if (e.button === 2) this.heroSpecialAbility(this.heroes[this.p1Hero]);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  swapHero(playerNum, targetIdx, silent = false) {
    if (!this.heroes[targetIdx] || this.heroes[targetIdx].downed) {
      if (!silent && this.heroes[targetIdx]) {
        this.showAlert(`💔 ${this.heroes[targetIdx].def.name} is downed! Stand beside them or eat a Red Berry [R] to revive!`, 2.2);
      }
      return false;
    }
    if (this.isCoop) {
      if (playerNum === 1 && targetIdx === this.p2Hero) return false;
      if (playerNum === 2 && targetIdx === this.p1Hero) return false;
    }
    if (playerNum === 1) this.p1Hero = targetIdx;
    else this.p2Hero = targetIdx;
    if (!silent) {
      this.audio.sfxSwap();
      this.spawnParticles(this.heroes[targetIdx].pos.clone().add(new THREE.Vector3(0, 1, 0)), HERO_DEFS[targetIdx].color, 10);
    }
    this.updateHUD();
    return true;
  }

  cycleCoopHero(playerNum) {
    const cur = playerNum === 1 ? this.p1Hero : this.p2Hero;
    const other = playerNum === 1 ? this.p2Hero : this.p1Hero;
    for (let step = 1; step <= 4; step++) {
      const next = (cur + step) % 4;
      if (next !== other && this.heroes[next] && !this.heroes[next].downed) {
        this.swapHero(playerNum, next);
        return;
      }
    }
  }

  // ============================================================================
  // LEVEL CONSTRUCTION
  // ============================================================================
  disposeObject3D(obj, releaseLevelGpuTextures = false) {
    if (!obj) return;
    const disposedGeos = new Set();
    const disposedMats = new Set();
    const disposedTex = new Set();
    const disposedSkeletons = new Set();

    obj.traverse((o) => {
      if (o.isSkinnedMesh && o.skeleton && !disposedSkeletons.has(o.skeleton)) {
        disposedSkeletons.add(o.skeleton);
        o.skeleton.dispose();
      }
      if (o.geometry && !disposedGeos.has(o.geometry)) {
        if (!this.sharedResources.has(o.geometry)) {
          disposedGeos.add(o.geometry);
          o.geometry.dispose();
        }
      }
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          // Release GPU textures for level-specific models & procedural maps when unloading a level
          for (const val of Object.values(m)) {
            if (!val || !val.isTexture || disposedTex.has(val)) continue;
            if (!this.sharedResources.has(val) || (releaseLevelGpuTextures && !this.heroTextures.has(val))) {
              disposedTex.add(val);
              val.dispose();
            }
          }
          if (!this.sharedResources.has(m) && !disposedMats.has(m)) {
            disposedMats.add(m);
            m.dispose();
          }
        }
      }
    });
  }

  clearWorld() {
    this.heroes.forEach((h) => {
      if (h.mixer) {
        h.mixer.stopAllAction();
        h.mixer.uncacheRoot(h.mixer.getRoot());
      }
    });
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children[0];
      this.worldGroup.remove(child);
      this.disposeObject3D(child, true);
    }
    if (this.textures && this.textures.cache) {
      Object.values(this.textures.cache).forEach((tex) => tex.dispose());
    }
    if (this.goalAccentLight) this.goalAccentLight.intensity = 0;
    if (this.bossAccentLight) this.bossAccentLight.intensity = 0;
    if (this.renderer && this.renderer.renderLists) this.renderer.renderLists.dispose();
    this.floatingPopups.forEach((p) => p.el.remove());
    this.floatingPopups = [];
    this.heroes = [];
    this.enemies = [];
    this.boss = null;
    this.webs = [];
    this.bushes = [];
    this.goldBerries = [];
    this.obstacles = [];
    this.gates = [];
    this.chasmZones = [];
    this.slopeZones = [];
    this.platforms = [];
    this.movingPlatforms = [];
    this.pushPuzzles = [];
    this.dangerZones = [];
    this.projectiles = [];
    this.particles = [];
    this.vfxMeshes = [];
    this.ambientMotes = [];
    this.levelAnimators = [];
    this.levelMinZ = -120;
    this.levelMaxZ = 16;
    this.wildlife = [];
    this.eggObj = null;
    this.keeperObj = null;
    this.reneeObj = null;
    this.reneeObj = null;
    this.levelGoalTriggered = false;
  }

  startLevel(idx, showIntro = true) {
    this.currentLevelIdx = idx;
    const def = LEVEL_DEFS[idx];
    this.clearWorld();

    this.scene.background = new THREE.Color(def.skyBottom);
    this.scene.fog = new THREE.Fog(def.fogColor, 42, 128);
    this.audio.setLevelTrack(idx);

    this.addSkyBackdrop(def.skyTop, def.skyBottom, def.biome !== 'cavern' && def.biome !== 'castle_cavern');

    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('hero-dock').classList.remove('hidden');
    document.getElementById('combat-bar').classList.remove('hidden');
    document.getElementById('controls-strip').classList.remove('hidden');
    document.getElementById('boss-hud').classList.add('hidden');
    document.getElementById('hud-level-badge').textContent = def.badge;
    document.getElementById('hud-level-name').textContent = def.name;
    document.getElementById('hud-objective').textContent = def.objective.split(/\s+/).slice(0, TUNING.maxCaptionWords).join(' ');

    this.magic = this.maxMagic;
    this.magicBoostTimer = 0;

    this.buildBiomeGeometry(def);
    this.addSurroundingScenery(def);
    this.spawnHeroes();
    this.p1Hero = 0;
    this.p2Hero = 1;
    this.lastProgressTime = this.simTime;
    this.lastHintTime = -999;
    this.furthestZ = this.heroes[0] ? this.heroes[0].pos.z : 4;
    this.lastPlayedHint = null;
    this.hintHistory = [];
    this.updateHUD();

    if (showIntro && def.introStory) {
      this.showStoryModal(def.introStory, () => {
        this.mode = 'playing';
        this.playLevelStartDialogue(idx);
      });
    } else {
      this.mode = 'playing';
      this.playLevelStartDialogue(idx);
    }
  }

  playLevelStartDialogue(idx) {
    if (idx === 2) this.dialogue?.play('l3_daniel_hot').catch(() => {});
    else if (idx === 3) this.dialogue?.play('l4_michael_warm').catch(() => {});
    else if (idx === 4) this.dialogue?.play('l5_joshua_turn').catch(() => {});
    else if (idx === 5 && this.reneeObj && !this.reneeObj.greeted) {
      this.reneeObj.greeted = true;
      this.dialogue?.play('l6_renee_welcome').catch(() => {});
    }
  }

  getCorridorXBounds(z) {
    let minX = Infinity;
    let maxX = -Infinity;
    const padZ = 1.2;
    for (const p of this.platforms) {
      if (z >= p.minZ - padZ && z <= p.maxZ + padZ) {
        if (p.minX < minX) minX = p.minX;
        if (p.maxX > maxX) maxX = p.maxX;
      }
    }
    for (const s of this.slopeZones) {
      if (z >= s.minZ - padZ && z <= s.maxZ + padZ) {
        if (s.minX < minX) minX = s.minX;
        if (s.maxX > maxX) maxX = s.maxX;
      }
    }
    for (const cz of this.chasmZones) {
      if (z >= cz.z - cz.d / 2 - padZ && z <= cz.z + cz.d / 2 + padZ) {
        if (cz.x - cz.w / 2 < minX) minX = cz.x - cz.w / 2;
        if (cz.x + cz.w / 2 > maxX) maxX = cz.x + cz.w / 2;
      }
    }
    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
      return { minX: -11.5, maxX: 11.5 };
    }
    const wallInset = 0.8;
    return { minX: minX + wallInset, maxX: maxX - wallInset };
  }

  addGate(cfg) {
    const gate = {
      id: cfg.id || `gate_${this.gates.length}`,
      type: cfg.type,
      z: cfg.z,
      blockZ: cfg.blockZ !== undefined ? cfg.blockZ : cfg.z + (cfg.halfDepth || 1.8),
      minX: cfg.minX !== undefined ? cfg.minX : -50,
      maxX: cfg.maxX !== undefined ? cfg.maxX : 50,
      requiredHeroIdx: cfg.requiredHeroIdx,
      requiresDragon: !!cfg.requiresDragon,
      hintText: cfg.hintText || 'Try another family member!',
      hintDialogueId: cfg.hintDialogueId || null,
      opened: false,
      meshes: cfg.meshes || [],
      obstacles: cfg.obstacles || [],
      chasmZone: cfg.chasmZone || null,
      slopeZone: cfg.slopeZone || null,
      onOpen: cfg.onOpen || null,
    };
    this.gates.push(gate);
    return gate;
  }

  openGate(gate, alertMsg = null) {
    if (!gate || gate.opened) return;
    gate.opened = true;
    gate.meshes.forEach((m) => { if (m) m.visible = false; });
    gate.obstacles.forEach((ob) => {
      ob.active = false;
      if (ob.mesh) ob.mesh.visible = false;
    });
    if (typeof gate.onOpen === 'function') gate.onOpen(gate);
    this.lastProgressTime = this.simTime;
    if (alertMsg) this.showAlert(alertMsg, 2.4);
  }

  isHeroPlayerControlled(hero) {
    if (!hero) return false;
    return hero.index === this.p1Hero || (this.isCoop && hero.index === this.p2Hero);
  }

  tryOpenNearbyGateByHeroAction(hero, actionKind, originPos, range = 5.5) {
    if (!this.isHeroPlayerControlled(hero)) return false;
    // Only allow interacting with the closest unopened gate ahead of the hero (never through an earlier closed gate!)
    const closedAhead = this.gates
      .filter((gt) => !gt.opened && hero.pos.z >= gt.z - 2.0)
      .sort((a, b) => b.z - a.z);
    if (closedAhead.length === 0) return false;
    const gate = closedAhead[0];

    const nearGate = Math.abs(originPos.z - gate.z) <= range
      || Math.abs(hero.pos.z - gate.blockZ) <= range
      || (gate.chasmZone && Math.abs(hero.pos.z - (gate.chasmZone.z + gate.chasmZone.d / 2)) <= Math.min(range, 6.0));
    if (!nearGate) return false;

    if (hero.index !== gate.requiredHeroIdx) {
      if (Math.abs(hero.pos.z - gate.blockZ) < 3.6) {
        this.showAlert(gate.hintText, 2.0);
      }
      return false;
    }
    if (gate.requiresDragon && !this.bondedDragons[hero.index]) {
      this.showAlert(gate.hintText, 2.2);
      return false;
    }

    const okFire = (gate.type === 'bramble' || gate.type === 'overgrowth' || gate.type === 'dark_tunnel' || gate.type === 'lamps_door')
      && (actionKind === 'fire' || actionKind === 'inferno');
    const okInferno = gate.type === 'ice_barrier' && actionKind === 'inferno';
    const okStrength = (gate.type === 'boulder' || gate.type === 'snowdrift' || gate.type === 'heavy_block' || gate.type === 'bridge_hold')
      && (actionKind === 'strength' || actionKind === 'titan');
    const okTitan = gate.type === 'obsidian_gate' && actionKind === 'titan';
    const okIce = (gate.type === 'water_freeze' || gate.type === 'waterfall_freeze' || gate.type === 'magma_vent' || gate.type === 'storm_calm')
      && (actionKind === 'ice' || actionKind === 'glacial' || actionKind === 'ice_bridge');
    const okSpeed = (gate.type === 'speed_leap' || gate.type === 'steep_slope' || gate.type === 'thin_ice_key' || gate.type === 'closing_door')
      && (actionKind === 'wind' || actionKind === 'speed');

    if (okFire || okInferno || okStrength || okTitan || okIce || okSpeed) {
      this.openGate(gate);
      return true;
    }
    return false;
  }

  addGroundSegment(x, z, w, d, biome, y = 0) {
    const tex = this.textures.getBiomeGround(biome).clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, w / 24), Math.max(1, d / 24));
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, 3, d),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 })
    );
    mesh.position.set(x, y - 1.5, z);
    mesh.receiveShadow = true;
    this.worldGroup.add(mesh);
    this.platforms.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, topY: y });
    return mesh;
  }

  freezeChasmBridge(cz, width = 12) {
    if (!cz || cz.frozen) return false;
    cz.frozen = true;
    const bridgeW = Math.max(width, Math.min(cz.w, 14));
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeW, 0.55, cz.d + 1.8),
      new THREE.MeshStandardMaterial({
        color: 0xa6f0ff, emissive: 0x29b6f6, emissiveIntensity: 0.48, roughness: 0.12, transparent: true, opacity: 0.92,
      })
    );
    bridge.position.set(cz.x, (cz.y || 0) - 0.22, cz.z);
    bridge.receiveShadow = true;
    this.worldGroup.add(bridge);
    cz.bridgeMesh = bridge;
    this.platforms.push({
      minX: cz.x - bridgeW / 2,
      maxX: cz.x + bridgeW / 2,
      minZ: cz.z - cz.d / 2 - 0.9,
      maxZ: cz.z + cz.d / 2 + 0.9,
      topY: cz.y || 0,
    });
    this.spawnParticles(new THREE.Vector3(cz.x, (cz.y || 0) + 0.5, cz.z), 0x80e8ff, 30);
    this.spawnFloatingText(new THREE.Vector3(cz.x, (cz.y || 0) + 2.0, cz.z), '❄️ ICE BRIDGE!', '#80e8ff');
    this.audio.sfxBridge();
    return true;
  }

  addChasmZone(x, z, w, d, hazardType = 'water', opts = {}) {
    const tex = this.textures.getWaterTexture(hazardType === 'lava' ? 'lava' : 'water');
    const y = opts.y || 0;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: hazardType === 'lava' ? 0xff3d00 : 0x0b355c,
      emissiveIntensity: hazardType === 'lava' ? 0.65 : 0.25,
      roughness: 0.18,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w + 16, 0.8, d), mat);
    mesh.position.set(x, y - 1.35, z);
    this.worldGroup.add(mesh);
    const zone = {
      x, z, y, w, d, hazardType, frozen: false, bridgeMesh: null, liquidMesh: mesh,
      hintText: opts.hintText || null,
    };
    this.chasmZones.push(zone);
    if (opts.freezeGate) {
      this.addGate({
        id: opts.gateId || `water_gate_${this.gates.length}`,
        type: opts.gateType || 'water_freeze',
        z,
        // Placed on far edge inside the gap: heroes can fall into water, but cannot jump across without freezing!
        blockZ: z - d / 2 + 0.9,
        requiredHeroIdx: 2,
        requiresDragon: !!opts.requiresDragon,
        hintText: opts.hintText || (opts.requiresDragon ? 'Vanessa and Frosty can bridge this water.' : 'Vanessa can freeze a path here.'),
        hintDialogueId: opts.hintDialogueId || (opts.requiresDragon ? 'hint_vanessa_frosty' : 'hint_vanessa_ice'),
        chasmZone: zone,
        onOpen: () => {
          this.freezeChasmBridge(zone);
          this.showAlert('Vanessa froze an ice bridge!', 2.4);
        },
      });
    }
    return zone;
  }

  addSteepSlope(x, z, w, d, baseY, topY) {
    const slope = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.8, d + 1.0),
      new THREE.MeshStandardMaterial({ color: 0x7a5b42, roughness: 0.9 })
    );
    const midY = (baseY + topY) / 2;
    const angle = Math.atan2(topY - baseY, d);
    slope.position.set(x, midY - 0.4, z);
    slope.rotation.x = angle;
    slope.receiveShadow = true;
    this.worldGroup.add(slope);
    this.slopeZones.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, baseY, topY, requiresSpeed: topY > baseY });
  }

  addMovingPlatform(x, z, w, d, biome, y = 0, axis = 'x', range = 5.5, speed = 1.4) {
    const tex = this.textures.getBiomeGround(biome).clone();
    tex.needsUpdate = true;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.8, d),
      new THREE.MeshStandardMaterial({ map: tex, color: 0xffe4b5, roughness: 0.7 })
    );
    mesh.position.set(x, y - 0.4, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.worldGroup.add(mesh);
    this.movingPlatforms.push({
      mesh, baseX: x, baseZ: z, x, z, prevX: x, prevZ: z, w, d, topY: y, axis, range, speed, phase: Math.random() * 3,
    });
  }

  // King Michael Super Strength Pushable Rune Block + Golden Pressure Switch!
  addPushSwitchPuzzle(blockX, blockZ, switchX, switchZ, rewardGoldId, rewardX, rewardZ, y = 0) {
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x6c5ce7, emissive: 0x2d1b69, emissiveIntensity: 0.35, roughness: 0.6 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), blockMat);
    block.position.set(blockX, y + 1.0, blockZ);
    block.castShadow = true;
    block.receiveShadow = true;
    this.worldGroup.add(block);

    const sw = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.55, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5c953, emissive: 0xd48c1c, emissiveIntensity: 0.5 })
    );
    sw.position.set(switchX, y + 0.08, switchZ);
    this.worldGroup.add(sw);

    this.pushPuzzles.push({
      block, sw,
      pos: new THREE.Vector3(blockX, y, blockZ),
      switchPos: new THREE.Vector3(switchX, y, switchZ),
      solved: false,
      rewardGoldId, rewardX, rewardZ, y,
    });
  }

  // Telegraphed 3D Boss Ground Warning Ring (fills up -> detonates!)
  spawnDangerZone(x, z, y, radius, delay, damage, color = 0xff3b30, label = '') {
    const g = new THREE.Group();
    g.position.set(x, y + 0.09, z);
    const outer = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.18, radius, 28),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    outer.rotation.x = -Math.PI / 2;
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 28),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.32 })
    );
    inner.rotation.x = -Math.PI / 2;
    inner.scale.setScalar(0.05);
    g.add(outer, inner);
    this.worldGroup.add(g);
    this.dangerZones.push({
      mesh: g, inner, pos: new THREE.Vector3(x, y, z), radius, delay, elapsed: 0, damage, color, label,
    });
  }

  // ============================================================================
  // LIVE 3D IN-ENGINE CUTSCENES (Prologue Castle Attack & Egg-Hatching!)
  // ============================================================================
  startPrologueCutscene() {
    this.clearWorld();
    this.mode = 'cutscene';
    this.giftsGranted = false;
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('hero-dock').classList.add('hidden');
    document.getElementById('combat-bar').classList.add('hidden');
    document.getElementById('controls-strip').classList.add('hidden');
    document.getElementById('cutscene-ui').classList.remove('hidden');
    document.getElementById('cutscene-tag').textContent = 'FESTIVAL MORNING';
    document.getElementById('cutscene-text').textContent = 'Picking berries in the woods.';

    this.scene.background = new THREE.Color(0x90caf9);
    this.scene.fog = new THREE.Fog(0xa8d8e8, 35, 130);
    this.addSkyBackdrop(0x3a8ee6, 0xd4f1d4, true);
    this.addGroundSegment(0, -10, 44, 64, 'woods', 0);
    this.addCastleStructure(0, 0, -24, 1.35);
    this.addStylizedTrees([[-14, -4, 1.2], [14, -4, 1.2], [-15, -16, 1.3], [15, -16, 1.3], [-9, 4, 1.15]]);

    // Berry bushes the family is picking from!
    this.addBerryBush(-5.2, 6.2, 'red', 0);
    this.addBerryBush(5.2, 6.2, 'green', 0);

    // Royal family picking berries in the clearing
    const familyMeshes = HERO_DEFS.map((hd, i) => {
      const m = this.createHeroRenderable(hd);
      m.root.position.set(-3 + i * 2, 0, 8);
      m.root.rotation.y = Math.PI;
      this.worldGroup.add(m.root);
      return m.root;
    });

    // Renee (the Ward) on the distant castle tower balcony flinging the eggs to safety!
    const reneeMesh = this.createReneeRenderable();
    reneeMesh.position.set(1.8, 6.5, -20.5);
    this.worldGroup.add(reneeMesh);

    // The Keeper waiting in the tree line, ready to step out in person!
    const keeperMesh = new THREE.Group();
    const kSrc = this.assets.models['keeper_of_the_forest'];
    if (kSrc) {
      keeperMesh.add(this.assets.instantiateNormalized(kSrc, 2.35, false, true).wrapper);
    } else {
      const robe = new THREE.Mesh(
        new THREE.ConeGeometry(0.78, 2.3, 10),
        new THREE.MeshStandardMaterial({ color: 0x1b8a5a, emissive: 0x0d472e, emissiveIntensity: 0.45 })
      );
      robe.position.y = 1.15;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbe5c8 }));
      head.position.y = 2.45;
      keeperMesh.add(robe, head);
    }
    keeperMesh.position.set(-12.5, 0, 2.5);
    this.worldGroup.add(keeperMesh);

    const dragon = this.createBossRenderable('black_dragon');
    dragon.position.set(-22, 22, -40);
    this.worldGroup.add(dragon);

    // 4 Glowing Eggs flung to the four corners of the kingdom!
    const eggKeys = ['egg_green', 'egg_red', 'egg_blue', 'egg_purple'];
    const eggColors = [0x39e58c, 0xff5238, 0x5ce1ff, 0xb76eff];
    const meteors = eggKeys.map((k, i) => {
      const e = this.createEggRenderable(k, eggColors[i]);
      e.visible = false;
      e.position.set(0, 11, -22);
      this.worldGroup.add(e);
      return { mesh: e, dir: new THREE.Vector3((i - 1.5) * 14, 18 + (i % 2) * 5, -18 - i * 4), color: eggColors[i] };
    });

    // 4 Gift orbs that fly from Keeper's staff into each family member's hands!
    const giftOrbs = HERO_DEFS.map((hd) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 10, 10),
        new THREE.MeshStandardMaterial({ color: hd.color, emissive: hd.color, emissiveIntensity: 0.95 })
      );
      orb.visible = false;
      this.worldGroup.add(orb);
      return orb;
    });

    const beats = [
      { t: 0.4, id: 'prologue_joshua_stars', tag: 'FESTIVAL MORNING', short: 'Shooting stars in the daytime!' },
      { t: 3.6, id: 'prologue_dragon_eggs', tag: 'THE GREAT BLACK DRAGON', short: 'Four eggs streak across the sky!' },
      { t: 7.4, id: 'prologue_keeper_intro_1', tag: 'THE KEEPER OF THE FOREST', short: 'The Keeper steps from the trees.' },
      { t: 11.4, id: 'prologue_keeper_intro_2', tag: 'THE KEEPER OF THE FOREST', short: 'A lonely dragon took four eggs.' },
      { t: 16.6, id: 'prologue_keeper_intro_3', tag: 'RENEE THE WARD', short: 'Renee kept the eggs safe.' },
      { t: 22.6, id: 'prologue_daniel_teacher', tag: 'PRINCE DANIEL', short: 'Our teacher did that?' },
      { t: 25.0, id: 'prologue_keeper_gifts', tag: 'FOUR GIFTS', short: 'Speed, Fire, Ice, and Strength!' },
      { t: 30.8, id: 'prologue_keeper_task', tag: 'THE FIRST TASK', short: 'Free the Great Bear first!' },
      { t: 37.6, id: 'prologue_michael_start', tag: 'KING MICHAEL', short: 'Stay close, boys!' },
    ];

    this.audio.setMusicMode('prologue');
    const grantPrologueGifts = () => {
      this.giftsGranted = true;
    };
    this.cutscene = {
      type: 'prologue',
      elapsed: 0,
      duration: 41.5,
      dragon,
      meteors,
      keeperMesh,
      reneeMesh,
      familyMeshes,
      giftOrbs,
      beats,
      nextBeatIdx: 0,
      roared: false,
      giftsTriggered: false,
      grantRewards: grantPrologueGifts,
      onDone: () => {
        grantPrologueGifts();
        this.startLevel(0, false);
      },
    };
  }

  startEggHatchCutscene(heroIdx, def) {
    this.mode = 'cutscene';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('hero-dock').classList.add('hidden');
    document.getElementById('combat-bar').classList.add('hidden');
    document.getElementById('controls-strip').classList.add('hidden');
    document.getElementById('cutscene-ui').classList.remove('hidden');

    const hero = this.heroes[heroIdx];
    const hd = HERO_DEFS[heroIdx];
    document.getElementById('cutscene-tag').textContent = `${hd.dragonName.toUpperCase()} HATCHES!`;
    document.getElementById('cutscene-text').textContent = `${hd.dragonName} meets ${hd.name}!`;

    const hatchDialogueByHero = [
      { hatch: 'l2_joshua_hatch', reaction: 'l2_michael_friend' },
      { hatch: 'l3_daniel_hatch', reaction: 'l3_joshua_both' },
      { hatch: 'l4_vanessa_hatch', reaction: 'l4_daniel_mommy_dragon' },
      { hatch: 'l5_michael_hatch', reaction: 'l5_vanessa_home' },
    ];
    const lineIds = hatchDialogueByHero[heroIdx] || hatchDialogueByHero[0];

    // Towering golden light beam at the egg!
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 2.2, 18, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: hd.dragonColor, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    beam.position.set(this.eggObj.pos.x, this.eggObj.pos.y + 9, this.eggObj.pos.z);
    this.worldGroup.add(beam);

    this.audio.sfxHatch();
    if (lineIds.hatch) this.dialogue?.play(lineIds.hatch).catch(() => {});

    const eggPos = this.eggObj.pos.clone();
    const grantHatchReward = () => {
      if (this.eggObj) {
        this.eggObj.hatched = true;
        this.eggObj.mesh.visible = false;
      }
      this.bondedDragons[heroIdx] = true;
      if (hero && hero.dragonMesh) {
        hero.dragonMesh.visible = true;
        hero.dragonMesh.position.copy(eggPos).add(new THREE.Vector3(0, 1.4, 0));
      }
      this.completedLevels.add(this.currentLevelIdx);
      this.highestLevel = Math.max(this.highestLevel, Math.min(5, this.currentLevelIdx + 1));
      this.persistSave();
      this.updateHUD();
    };
    this.cutscene = {
      type: 'hatch',
      elapsed: 0,
      duration: 8.8,
      hero,
      heroIdx,
      eggPos,
      beam,
      lineIds,
      hatchedBurst: false,
      reactionSpoken: false,
      def,
      grantRewards: grantHatchReward,
      onDone: () => {
        this.worldGroup.remove(beam);
        this.disposeObject3D(beam);
        grantHatchReward();
        this.showStoryModal(def.outroStory, () => this.startLevel(this.currentLevelIdx + 1, true));
      },
    };
  }

  updateCutscene(dt) {
    const cs = this.cutscene;
    if (!cs) return;
    cs.elapsed += dt;

    if (cs.type === 'prologue') {
      const t = cs.elapsed;
      // Trigger story-draft spoken dialogue beats in exact order
      while (cs.beats && cs.nextBeatIdx < cs.beats.length && t >= cs.beats[cs.nextBeatIdx].t) {
        const beat = cs.beats[cs.nextBeatIdx++];
        document.getElementById('cutscene-tag').textContent = beat.tag;
        document.getElementById('cutscene-text').textContent = beat.short;
        this.dialogue?.play(beat.id).catch(() => {});
      }

      if (t < 3.4) {
        // Dragon swoops onto the castle while family picks berries
        const k = t / 3.4;
        cs.dragon.position.set(THREE.MathUtils.lerp(-22, 0, k), THREE.MathUtils.lerp(22, 11.5, k), THREE.MathUtils.lerp(-40, -22, k));
        cs.dragon.rotation.y = 0.2;
        this.camera.position.set(THREE.MathUtils.lerp(0, 6, k), THREE.MathUtils.lerp(11, 14, k), THREE.MathUtils.lerp(18, 6, k));
        this.camera.lookAt(0, 7, -22);
      } else if (t < 7.4) {
        // Renee flings the four eggs across the sky; dragon roars and dives beneath castle!
        if (!cs.roared) {
          cs.roared = true;
          this.audio.sfxInferno();
          this.triggerShake(0.5, 0.45);
          this.spawnParticles(new THREE.Vector3(0, 11, -22), 0xff4500, 32);
          cs.meteors.forEach((m) => { m.mesh.visible = true; });
        }
        const k = Math.min(1, (t - 3.4) / 4.0);
        cs.dragon.position.y = 11.5 - Math.max(0, (k - 0.35) * 20);
        cs.meteors.forEach((m) => {
          m.mesh.position.set(
            m.dir.x * k * 2.1,
            11 + Math.sin(k * Math.PI) * m.dir.y,
            -22 + m.dir.z * k * 1.4
          );
          m.mesh.rotation.y += dt * 4;
          if (Math.random() < 0.3) this.spawnParticles(m.mesh.position, m.color, 1);
        });
        this.camera.position.set(6 - k * 6, 14 - k * 5, 6 + k * 10);
        this.camera.lookAt(0, 5 - k * 3, -10 + k * 14);
      } else {
        // Keeper steps out of the trees in person, tells the story, and grants the 4 gifts!
        cs.dragon.visible = false;
        cs.meteors.forEach((m) => { m.mesh.visible = false; });
        const stepK = Math.min(1, (t - 7.4) / 3.0);
        if (cs.keeperMesh) {
          cs.keeperMesh.position.set(
            THREE.MathUtils.lerp(-12.5, 0, stepK),
            0,
            THREE.MathUtils.lerp(2.5, 3.2, stepK)
          );
          cs.keeperMesh.rotation.y = 0; // Face the family at z=8
        }
        if (t >= 25.0 && cs.giftOrbs && cs.familyMeshes) {
          if (!cs.giftsTriggered) {
            cs.giftsTriggered = true;
            this.giftsGranted = true;
            this.audio.sfxVictory();
          }
          const gk = Math.min(1, (t - 25.0) / 3.2);
          cs.giftOrbs.forEach((orb, i) => {
            orb.visible = gk < 1.0;
            const target = cs.familyMeshes[i].position;
            orb.position.set(
              THREE.MathUtils.lerp(0, target.x, gk),
              THREE.MathUtils.lerp(1.8, 1.2, gk) + Math.sin(gk * Math.PI) * 1.8,
              THREE.MathUtils.lerp(3.2, target.z, gk)
            );
          });
        }
        this.camera.position.set(Math.sin((t - 7.4) * 0.18) * 3.5, 6.2, 16.5);
        this.camera.lookAt(0, 1.5, 5.2);
      }
    } else if (cs.type === 'hatch') {
      const t = cs.elapsed;
      const angle = t * 0.9;
      this.camera.position.set(
        cs.eggPos.x + Math.sin(angle) * 6.8,
        cs.eggPos.y + 3.4,
        cs.eggPos.z + Math.cos(angle) * 6.8
      );
      this.camera.lookAt(cs.eggPos.x, cs.eggPos.y + 1.5, cs.eggPos.z);

      if (t < 3.0) {
        this.eggObj.mesh.rotation.y += dt * 10;
        this.eggObj.mesh.position.x = cs.eggPos.x + Math.sin(t * 40) * 0.14;
      } else if (!cs.hatchedBurst) {
        cs.hatchedBurst = true;
        this.eggObj.hatched = true;
        this.eggObj.mesh.visible = false;
        this.bondedDragons[cs.heroIdx] = true;
        cs.hero.dragonMesh.visible = true;
        cs.hero.dragonMesh.position.copy(cs.eggPos).add(new THREE.Vector3(0, 1.4, 0));
        this.audio.sfxDragonChirp();
        this.spawnParticles(cs.eggPos.clone().add(new THREE.Vector3(0, 1.3, 0)), HERO_DEFS[cs.heroIdx].dragonColor, 55);
      } else {
        // Baby dragon zooms joyfully around its bonded hero's head!
        const centerPos = cs.hero ? cs.hero.pos : cs.eggPos;
        cs.hero.dragonMesh.position.set(
          centerPos.x + Math.cos(t * 5.2) * 1.7,
          centerPos.y + 2.3 + Math.sin(t * 7.5) * 0.35,
          centerPos.z + Math.sin(t * 5.2) * 1.7
        );
        cs.hero.dragonMesh.rotation.y = -t * 5.2;
        if (t >= 5.0 && !cs.reactionSpoken) {
          cs.reactionSpoken = true;
          if (cs.lineIds?.reaction) this.dialogue?.play(cs.lineIds.reaction).catch(() => {});
        }
      }
      cs.beam.rotation.y += dt * 2.5;
    }

    // Update particles during cutscene too!
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vel.y -= 14 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.life <= 0) { this.worldGroup.remove(p.mesh); this.particles.splice(i, 1); }
    }

    if (cs.elapsed >= cs.duration) this.finishCutscene();
  }

  finishCutscene() {
    if (!this.cutscene) return;
    const cs = this.cutscene;
    this.cutscene = null;
    document.getElementById('cutscene-ui').classList.add('hidden');
    if (typeof cs.grantRewards === 'function') cs.grantRewards();
    if (cs.onDone) cs.onDone();
  }

  addObstacle(type, x, z, y = 0, opts = {}) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    let radius = 1.65;
    let label = '';
    const extraMeshes = [g];

    const addWallFlanks = (color, emissive = 0x000000, height = 3.2) => {
      const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 0.25 : 0, roughness: 0.85 });
      for (const sx of [-9.5, 9.5]) {
        const flank = new THREE.Mesh(new THREE.BoxGeometry(8.5, height, 1.6), mat);
        flank.position.set(x + sx, y + height / 2, z);
        flank.castShadow = true;
        flank.receiveShadow = true;
        this.worldGroup.add(flank);
        extraMeshes.push(flank);
      }
    };

    if (type === 'boulder') {
      const src = this.assets.models['heavy_boulder'];
      if (src) {
        const { wrapper } = this.assets.instantiateNormalized(src, 3.2, false, true);
        g.add(wrapper);
      } else {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7), new THREE.MeshStandardMaterial({ color: 0x7e838c, roughness: 0.9 }));
        m.position.y = 1.4;
        m.castShadow = true;
        g.add(m);
      }
      if (opts.spanGate !== false) addWallFlanks(0x636870, 0x000000, 3.0);
      label = 'Michael can move this boulder!';
    } else if (type === 'bramble') {
      const src = this.assets.models['thorn_bramble'];
      if (src) {
        const { wrapper } = this.assets.instantiateByWidth(src, 8.0);
        wrapper.rotation.y = Math.PI / 2;
        g.add(wrapper);
      } else {
        const mat = new THREE.MeshStandardMaterial({ color: 0x4d3423, roughness: 0.9 });
        for (let i = -3; i <= 3; i++) {
          const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05), mat);
          b.position.set(i * 1.15, 1.0, 0);
          g.add(b);
        }
      }
      if (opts.spanGate !== false) addWallFlanks(0x3a4d2c, 0x000000, 3.1);
      radius = 2.8;
      label = 'Daniel can burn these thorns!';
    } else if (type === 'ice_barrier') {
      const src = this.assets.models['ice_barrier'];
      if (src) {
        const { wrapper } = this.assets.instantiateByWidth(src, 8.6);
        g.add(wrapper);
      } else {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x8be6ff, emissive: 0x1e88e5, emissiveIntensity: 0.35, transparent: true, opacity: 0.86, roughness: 0.12,
        });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.8, 1.6), mat);
        wall.position.y = 1.9;
        wall.castShadow = true;
        g.add(wall);
      }
      if (opts.spanGate !== false) addWallFlanks(0x74d4f7, 0x1565c0, 3.6);
      radius = 3.4;
      label = 'Daniel and Ember melt this ice!';
    } else if (type === 'obsidian_gate') {
      const src = this.assets.models['obsidian_gate'];
      if (src) {
        const { wrapper } = this.assets.instantiateByWidth(src, 8.6);
        g.add(wrapper);
      } else {
        const mat = new THREE.MeshStandardMaterial({ color: 0x251a30, metalness: 0.4, roughness: 0.5 });
        const glow = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.85 });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8.4, 4.0, 1.6), mat);
        wall.position.y = 2.0;
        wall.castShadow = true;
        const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), glow);
        rune.position.set(0, 2.2, 0.9);
        g.add(wall, rune);
      }
      if (opts.spanGate !== false) addWallFlanks(0x281e36, 0x4c1d95, 3.8);
      radius = 3.4;
      label = 'Michael and Samson open this gate!';
    } else if (type === 'magma_vent') {
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.45, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0x3a2420, roughness: 0.9 }));
      rim.position.y = 0.35;
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6d00, emissive: 0xff3d00, emissiveIntensity: 0.95, transparent: true, opacity: 0.88 })
      );
      flame.position.y = 1.5;
      g.add(rim, flame);
      g.userData.flame = flame;
      radius = 1.6;
      label = 'Vanessa can cool these vents!';
    }

    this.worldGroup.add(g);
    const ob = { type, mesh: g, pos: new THREE.Vector3(x, y, z), radius, active: true, cooledTimer: 0, label };
    this.obstacles.push(ob);

    if (opts.spanGate !== false) {
      const gateMap = {
        bramble: { requiredHeroIdx: 1, requiresDragon: false, hintText: opts.hintText || 'Let Daniel burn away that tangle.', hintDialogueId: 'hint_daniel_fire' },
        boulder: { requiredHeroIdx: 3, requiresDragon: false, hintText: opts.hintText || 'Michael is strong enough for that.', hintDialogueId: 'hint_michael_strength' },
        ice_barrier: { requiredHeroIdx: 1, requiresDragon: true, hintText: opts.hintText || 'Ask Ember to help Daniel melt it.', hintDialogueId: 'l4_keeper_ice_hint' },
        obsidian_gate: { requiredHeroIdx: 3, requiresDragon: true, hintText: opts.hintText || 'Michael and Samson can open that gate.', hintDialogueId: 'hint_michael_samson' },
        magma_vent: { requiredHeroIdx: 2, requiresDragon: false, hintText: opts.hintText || 'Vanessa can freeze a path here.', hintDialogueId: 'hint_vanessa_ice' },
      };
      const cfg = gateMap[type];
      if (cfg) {
        const existingSameZ = type === 'magma_vent'
          ? this.gates.find((gt) => gt.type === 'magma_vent' && Math.abs(gt.z - z) < 2.0)
          : null;
        if (existingSameZ) {
          existingSameZ.obstacles.push(ob);
          existingSameZ.meshes.push(...extraMeshes);
        } else {
          this.addGate({
            id: opts.gateId || `${type}_gate_${this.gates.length}`,
            type,
            z,
            blockZ: z + 2.0,
            requiredHeroIdx: cfg.requiredHeroIdx,
            requiresDragon: cfg.requiresDragon,
            hintText: cfg.hintText,
            hintDialogueId: opts.hintDialogueId || cfg.hintDialogueId || null,
            meshes: type === 'magma_vent' ? [] : extraMeshes,
            obstacles: [ob],
            onOpen: (gate) => {
              this.spawnParticles(new THREE.Vector3(x, y + 1.4, z), 0xffd54f, 26);
              if (type === 'magma_vent') {
                gate.obstacles.forEach((o) => {
                  o.cooledTimer = 9999;
                  o.active = false;
                  if (o.mesh.userData.flame) o.mesh.userData.flame.visible = false;
                });
              }
            },
          });
        }
      }
    }
    return ob;
  }

  addSpiderWeb(x, z, y = 0) {
    const g = new THREE.Group();
    g.position.set(x, y + 0.04, z);
    const src = this.assets.models['spider_web'];
    if (src) {
      const { wrapper } = this.assets.instantiateByWidth(src, 4.2);
      wrapper.scale.y *= 0.28; // Flatten neatly onto the forest floor!
      g.add(wrapper);
    } else {
      const mat = new THREE.MeshBasicMaterial({ color: 0xf4f7ff, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 2.0, 10), mat);
      ring.rotation.x = -Math.PI / 2;
      g.add(ring);
    }
    this.worldGroup.add(g);
    this.webs.push({ mesh: g, pos: new THREE.Vector3(x, y, z), radius: 2.0, active: true, trappedHeroIdx: -1 });
  }

  addBerryBush(x, z, berryType, y = 0) {
    const mesh = this.createBerryBushRenderable(berryType);
    mesh.position.set(x, y, z);
    this.worldGroup.add(mesh);
    this.bushes.push({ mesh, pos: new THREE.Vector3(x, y, z), berryType, berriesLeft: 2, harvested: false });
  }

  addGoldBerry(id, x, z, y = 1.1) {
    if (this.collectedGoldIds.has(id)) return;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa000, emissiveIntensity: 0.9, metalness: 0.65, roughness: 0.2 })
    );
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 20), new THREE.MeshBasicMaterial({ color: 0xffe880 }));
    g.add(orb, halo);
    this.worldGroup.add(g);
    this.goldBerries.push({ id, mesh: g, pos: new THREE.Vector3(x, y, z), collected: false });
  }

  addEnemy(type, x, z, y = 0) {
    const mesh = this.createEnemyRenderable(type);
    mesh.position.set(x, y, z);

    // Floating 3D enemy HP bar + translucent Ice Cube when frozen!
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x1a0b12, side: THREE.DoubleSide })
    );
    hpBg.position.set(0, 2.35, 0);
    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.13),
      new THREE.MeshBasicMaterial({ color: 0xff4d5a, side: THREE.DoubleSide })
    );
    hpFill.position.set(0, 2.35, 0.02);
    hpBg.visible = false;
    hpFill.visible = false;
    mesh.add(hpBg, hpFill);

    const iceCube = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 1.85, 1.85),
      new THREE.MeshStandardMaterial({
        color: 0x7be8ff, emissive: 0x29b6f6, emissiveIntensity: 0.45, transparent: true, opacity: 0.52, roughness: 0.1,
      })
    );
    iceCube.position.y = 0.95;
    iceCube.visible = false;
    mesh.add(iceCube);

    this.worldGroup.add(mesh);
    const hpMap = { spider: 65, wolf: 80, vine_minion: 90, golem_minion: 100, gargoyle_minion: 95 };
    const speedMap = { spider: 4.5, wolf: 6.2, vine_minion: 2.2, golem_minion: 3.4, gargoyle_minion: 5.5 };
    this.enemies.push({
      type, mesh, hpBg, hpFill, iceCube, pos: new THREE.Vector3(x, y, z), home: new THREE.Vector3(x, y, z),
      hp: hpMap[type] || 40, maxHp: hpMap[type] || 40, speed: speedMap[type] || 4.0,
      frozenTimer: 0, hitFlash: 0, attackCd: 0, dead: false, phase: Math.random() * 6,
    });
  }

  addBoss(bossType, bossName, x, z, y = 0) {
    const mesh = this.createBossRenderable(bossType);
    mesh.position.set(x, y, z);

    // Spell aura ring (purple while under dragon's spell; turns warm gold-green when freed & friendly!)
    const auraRing = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.75, 28),
      new THREE.MeshBasicMaterial({ color: 0x9b59b6, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    auraRing.rotation.x = -Math.PI / 2;
    auraRing.position.y = 0.09;
    mesh.add(auraRing);

    this.worldGroup.add(mesh);
    const diffCfg = this.getDifficultyConfig();
    const baseHp = GUARDIAN_HP[bossType] || 1150;
    const maxHp = Math.round(baseHp * diffCfg.bossHpMult);
    this.boss = {
      type: bossType, name: bossName, mesh, auraRing,
      pos: new THREE.Vector3(x, y, z), home: new THREE.Vector3(x, y, z),
      hp: maxHp, maxHp,
      activated: false,
      frozenTimer: 0,
      slowTimer: 0,
      iceImmunityTimer: 0,
      continuousFrozenTime: 0,
      maxContinuousFrozenTime: 0,
      timeSinceLastAction: 0,
      maxActionGap: 0,
      actionCount: 0,
      hitFlash: 0,
      attackTimer: 1.8,
      chargeVec: new THREE.Vector3(),
      charging: 0,
      dead: false,
      freed: false,
      friendly: false,
      damageByPlayer: 0,
      damageByCompanions: 0,
    };
  }

  addPeacefulAnimal(kind, wx, wz) {
    let mesh;
    if (kind === 'deer' && this.assets.models['friendly_deer']) {
      mesh = this.assets.instantiateNormalized(this.assets.models['friendly_deer'], 1.75, false, true).wrapper;
    } else if (kind === 'rabbit' && this.assets.models['friendly_rabbit']) {
      mesh = this.assets.instantiateNormalized(this.assets.models['friendly_rabbit'], 0.82, false, true).wrapper;
    } else if (kind === 'owl' && this.assets.models['friendly_owl']) {
      mesh = this.assets.instantiateNormalized(this.assets.models['friendly_owl'], 1.0, false, true).wrapper;
    } else {
      mesh = createProceduralWildlife(kind);
    }
    mesh.position.set(wx, kind === 'owl' ? 3.8 : 0, wz);
    this.worldGroup.add(mesh);
    this.wildlife.push({ mesh, base: mesh.position.clone(), kind, phase: Math.random() * 6 });
  }

  addStylizedTrees(positions, snowTint = false) {
    const src = this.assets.models['pine_tree'];
    positions.forEach(([x, z, s = 1]) => {
      if (src) {
        const { wrapper } = this.assets.instantiateNormalized(src, 6.2 * s, false, true);
        wrapper.position.set(x, 0, z);
        wrapper.rotation.y = (x * 1.3 + z * 0.7) % (Math.PI * 2);
        if (snowTint) {
          wrapper.traverse((o) => {
            if (o.isMesh && o.material) {
              o.material = o.material.clone();
              o.material.color.lerp(new THREE.Color(0xd8f3ff), 0.55);
            }
          });
        }
        this.worldGroup.add(wrapper);
      } else {
        const t = new THREE.Group();
        t.position.set(x, 0, z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.55 * s, 2.6 * s, 7), new THREE.MeshStandardMaterial({ color: 0x5c3a21 }));
        trunk.position.y = 1.3 * s;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.0 * s, 4.2 * s, 7), new THREE.MeshStandardMaterial({ color: snowTint ? 0xd8f1ff : 0x267339 }));
        cone.position.y = 3.8 * s;
        t.add(trunk, cone);
        this.worldGroup.add(t);
      }
    });
  }

  buildBiomeGeometry(def) {
    const idx = def.index;
    if (idx === 0) {
      // LEVEL 1: THE GREAT WOODS (Branching Gold Alcove + Pushable Switch Puzzle!)
      this.addGroundSegment(0, -14, 26, 52, def.biome, 0);
      this.addGroundSegment(16, -24, 12, 14, def.biome, 0); // Secret East Glade Alcove!
      this.addChasmZone(0, -43, 26, 6, 'water', { freezeGate: true, requiresDragon: false, hintText: 'Vanessa can freeze the stream!' });
      this.addGroundSegment(0, -68, 28, 44, def.biome, 0);

      const trees = [];
      for (let z = 10; z >= -88; z -= 8.5) {
        if (z < -16 && z > -32) trees.push([-13.2, z, 1.15]); // Leave opening into East Glade!
        else trees.push([-13.2, z, 1.15], [13.2, z, 1.12]);
      }
      this.addStylizedTrees(trees);

      [['deer', -8.5, -3], ['rabbit', 7.5, -10], ['owl', -11.5, -22], ['deer', 9.2, -52], ['rabbit', -8.5, -58]].forEach(
        ([k, wx, wz]) => this.addPeacefulAnimal(k, wx, wz)
      );

      this.addCastleStructure(0, 0, -104, 1.25);

      this.addSpiderWeb(-1.5, -10);
      this.addEnemy('spider', -5, -13);
      this.addSpiderWeb(2.5, -24);
      this.addEnemy('spider', 6, -26);
      this.addEnemy('wolf', -4, -33);
      this.addEnemy('wolf', 5, -52);

      this.addObstacle('bramble', 0, -18);
      this.addObstacle('boulder', 0, -37);
      // Pushable Rune Block Puzzle in the East Glade -> spawns secret Gold Berry!
      this.addPushSwitchPuzzle(14.5, -21, 18.5, -26, 'l1_g1', 18.5, -22, 0);

      this.addBerryBush(-8.5, -7, 'green');
      this.addBerryBush(8.5, -28, 'red');
      this.addBerryBush(-9, -50, 'green');
      this.addBerryBush(9, -56, 'red');

      this.addGoldBerry('l1_g2', -9.5, -34);
      this.addGoldBerry('l1_g3', 10.5, -78);

      this.addBoss(def.bossType, def.bossName, 0, -72);
      this.spawnKeeperOfTheForest(0, -84);
    } else if (idx === 1) {
      buildLevel2(this, def);
    } else if (idx === 2) {
      // LEVEL 3: SCORCHED CAVERNS
      this.addGroundSegment(0, -10, 24, 42, def.biome, 0);
      this.addGroundSegment(15, -12, 10, 12, def.biome, 0); // Volcanic Side Ledge!
      this.addSteepSlope(0, -37, 10, 12, 0, 3.5);
      this.addChasmZone(-9, -37, 8, 12, 'lava');
      this.addChasmZone(9, -37, 8, 12, 'lava');
      this.addGroundSegment(0, -66, 26, 46, def.biome, 3.5);

      this.addObstacle('magma_vent', -3, -15, 0);
      this.addObstacle('magma_vent', 3, -15, 0);
      this.addObstacle('boulder', 0, -25, 0);
      this.addEnemy('golem_minion', -5, -20, 0);
      this.addSpiderWeb(0, -49, 3.5);
      this.addEnemy('spider', 5, -51, 3.5);
      this.addEnemy('golem_minion', -5, -56, 3.5);

      this.addBerryBush(-8, -5, 'green', 0);
      this.addBerryBush(8, -22, 'red', 0);
      this.addBerryBush(-9, -54, 'green', 3.5);
      this.addBerryBush(9, -62, 'red', 3.5);

      this.addGoldBerry('l3_g1', 16.5, -12, 1.1);
      this.addGoldBerry('l3_g2', -10, -48, 4.6);
      this.addGoldBerry('l3_g3', 10, -82, 4.6);

      this.addBoss(def.bossType, def.bossName, 0, -72, 3.5);
      this.spawnDragonEgg(def.eggPropKey, 0xff5238, 0, -84, 3.5);
    } else if (idx === 3) {
      // LEVEL 4: FROSTPEAK RIDGE
      this.addGroundSegment(0, -14, 24, 48, def.biome, 0);
      this.addGroundSegment(-15, -24, 10, 12, def.biome, 0); // Frozen Side Ridge!
      this.addChasmZone(0, -42, 24, 8, 'water', { freezeGate: true, requiresDragon: false, hintText: 'Vanessa can freeze the river!' });
      this.addGroundSegment(0, -68, 26, 44, def.biome, 0);

      const trees = [];
      for (let z = 8; z >= -86; z -= 9) trees.push([-13.2, z, 1.2], [13.2, z, 1.15]);
      this.addStylizedTrees(trees, true);

      this.addObstacle('ice_barrier', 0, -18, 0);
      this.addEnemy('wolf', -5, -10);
      this.addEnemy('wolf', 5, -28);
      this.addSpiderWeb(-2, -32);
      this.addEnemy('spider', 4, -33);
      this.addObstacle('ice_barrier', 0, -54, 0);
      this.addEnemy('wolf', -5, -60);

      this.addBerryBush(-8, -7, 'green');
      this.addBerryBush(8, -25, 'red');
      this.addBerryBush(-9, -58, 'green');
      this.addBerryBush(9, -63, 'red');

      this.addGoldBerry('l4_g1', -16.5, -24);
      this.addGoldBerry('l4_g2', 9.5, -34);
      this.addGoldBerry('l4_g3', -10, -82);

      this.addBoss(def.bossType, def.bossName, 0, -72);
      this.spawnDragonEgg(def.eggPropKey, 0x5ce1ff, 0, -84, 0);
    } else if (idx === 4) {
      // LEVEL 5: THE CRAGLANDS (Pushable Rune Switch + Ice Bridge + Steep Ramp!)
      this.addGroundSegment(0, -8, 24, 36, def.biome, 0);
      this.addChasmZone(0, -32, 24, 12, 'water', { freezeGate: true, requiresDragon: true, hintText: 'Vanessa and Frosty can bridge it!' });
      this.addGroundSegment(0, -52, 24, 28, def.biome, 0);
      this.addSteepSlope(0, -70, 10, 8, 0, 2.5);
      this.addGroundSegment(0, -86, 28, 26, def.biome, 2.5);

      this.addObstacle('ice_barrier', 0, -15, 0);
      this.addPushSwitchPuzzle(-8, -46, -8, -54, 'l5_g2', -4, -54, 0);
      this.addEnemy('gargoyle_minion', -5, -10, 0);
      this.addEnemy('wolf', 5, -21, 0);
      this.addEnemy('gargoyle_minion', 0, -48, 0);
      this.addSpiderWeb(-3, -55, 0);
      this.addEnemy('spider', 4, -56, 0);
      this.addObstacle('boulder', 0, -61, 0);

      this.addBerryBush(-8, -5, 'green', 0);
      this.addBerryBush(8, -22, 'red', 0);
      this.addBerryBush(-8, -50, 'green', 0);
      this.addBerryBush(8, -58, 'red', 0);

      this.addGoldBerry('l5_g1', 9.5, -10, 1.1);
      this.addGoldBerry('l5_g3', 10.5, -93, 3.6);

      this.addBoss(def.bossType, def.bossName, 0, -84, 2.5);
      this.spawnDragonEgg(def.eggPropKey, 0xb76eff, 0, -94, 2.5);
    } else {
      // LEVEL 6: MULTI-FLOOR DESCENT BENEATH THE ROYAL CASTLE!
      // Tier 1: Castle Courtyard (y = 2.0) — Renee meets the family at the castle door!
      this.addCastleStructure(0, 2.0, 17, 1.15);
      this.spawnReneeAtDoor(0, 2.0, 8.8);
      this.addGroundSegment(0, 2, 24, 16, def.biome, 2.0);
      this.addSteepSlope(0, -9, 14, 6, 2.0, 0.0); // Descending stairs to Tier 2!
      // Tier 2: Obsidian Vault (y = 0.0)
      this.addGroundSegment(0, -18, 24, 14, def.biome, 0.0);
      this.addObstacle('obsidian_gate', 0, -16, 0.0);
      this.addChasmZone(0, -31, 24, 12, 'water', { freezeGate: true, requiresDragon: true, hintText: 'Vanessa and Frosty can bridge it!' }); // Subterranean River for Vanessa + Frosty!
      // Tier 3: Ice Seal Chamber (y = 0.0) -> Descending Ramp to Deep Under-Cavern (y = -2.0)!
      this.addGroundSegment(0, -50, 24, 26, def.biome, 0.0);
      this.addObstacle('ice_barrier', 0, -47, 0.0);
      this.addSteepSlope(0, -67, 14, 8, 0.0, -2.0);
      // Tier 4: Deep Under-Cavern Boss Lair (y = -2.0)
      this.addGroundSegment(0, -89, 34, 38, def.biome, -2.0);

      this.addEnemy('golem_minion', -5, -14, 0.0);
      this.addEnemy('gargoyle_minion', 5, -22, 0.0);
      this.addEnemy('golem_minion', -5, -55, 0.0);
      this.addEnemy('gargoyle_minion', 5, -55, 0.0);

      this.addBerryBush(-8, -1, 'green', 2.0);
      this.addBerryBush(8, -21, 'red', 0.0);
      this.addBerryBush(-9, -58, 'green', 0.0);
      this.addBerryBush(9, -59, 'red', 0.0);
      this.addBerryBush(-13, -82, 'red', -2.0);
      this.addBerryBush(13, -82, 'green', -2.0);

      this.addGoldBerry('l6_g1', -9.5, -20, 1.1);
      this.addGoldBerry('l6_g2', 9.5, -53, 1.1);
      this.addGoldBerry('l6_g3', 0, -103, -0.9);

      this.addBoss(def.bossType, def.bossName, 0, -90, -2.0);
    }
  }

  spawnReneeAtDoor(x, y, z) {
    const mesh = this.createReneeRenderable();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.PI; // Facing into the courtyard toward the stairs
    this.worldGroup.add(mesh);
    this.reneeObj = { mesh, pos: new THREE.Vector3(x, y, z), greeted: false };
  }

  spawnKeeperOfTheForest(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const src = this.assets.models['keeper_of_the_forest'];
    if (src) {
      const { wrapper } = this.assets.instantiateNormalized(src, 2.35, false, true);
      g.add(wrapper);
    } else {
      const robe = new THREE.Mesh(
        new THREE.ConeGeometry(0.78, 2.3, 10),
        new THREE.MeshStandardMaterial({ color: 0x1b8a5a, emissive: 0x0d472e, emissiveIntensity: 0.45 })
      );
      robe.position.y = 1.15;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbe5c8 }));
      head.position.y = 2.45;
      g.add(robe, head);
    }
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.55, 28),
      new THREE.MeshBasicMaterial({ color: 0x7effb2, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.08;
    g.add(halo);
    if (this.goalAccentLight) {
      this.goalAccentLight.color.setHex(0x69f0ae);
      this.goalAccentLight.intensity = 2.6;
      this.goalAccentLight.position.set(x, 2.0, z);
    }
    this.worldGroup.add(g);
    this.keeperObj = { mesh: g, pos: new THREE.Vector3(x, 0, z) };
  }

  spawnDragonEgg(propKey, colorHex, x, z, y = 0) {
    const mesh = this.createEggRenderable(propKey, colorHex);
    mesh.position.set(x, y, z);
    this.worldGroup.add(mesh);
    if (this.goalAccentLight) {
      this.goalAccentLight.color.setHex(colorHex);
      this.goalAccentLight.intensity = 2.0;
      this.goalAccentLight.position.set(x, y + 1.4, z);
    }
    this.eggObj = {
      mesh,
      halo: mesh.userData.halo || null,
      pos: new THREE.Vector3(x, y, z),
      colorHex,
      hatched: false,
      glowIntensity: 1.0,
      nearLineSpoken: false,
    };
  }

  spawnHeroes() {
    this.heroes = HERO_DEFS.map((def, i) => {
      const render = this.createHeroRenderable(def);
      const startX = -3 + i * 2;
      const startZ = 4;
      const startFloor = this.getFloorHeightAt(startX, startZ, true);
      const startY = startFloor.onSolid ? startFloor.y : 0;
      render.root.position.set(startX, startY, startZ);
      this.worldGroup.add(render.root);

      const dragonMesh = this.createBabyDragonRenderable(def.dragonKey, def.dragonColor);
      dragonMesh.visible = this.bondedDragons[i];
      dragonMesh.position.set(startX + 1.1, startY + 2.0, startZ - 0.8);
      this.worldGroup.add(dragonMesh);

      const reviveRing = new THREE.Mesh(
        new THREE.RingGeometry(1.05, 1.38, 28),
        new THREE.MeshBasicMaterial({ color: 0xff5252, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
      );
      reviveRing.rotation.x = -Math.PI / 2;
      reviveRing.position.y = 0.08;
      reviveRing.visible = false;
      render.root.add(reviveRing);

      return {
        index: i, def, ...render, dragonMesh, reviveRing,
        pos: new THREE.Vector3(startX, startY, startZ),
        lastSafePos: new THREE.Vector3(startX, startY, startZ),
        vel: new THREE.Vector3(),
        facing: Math.PI,
        hp: def.maxHp, maxHp: def.maxHp,
        onGround: true, trappedByWeb: null,
        downed: false, reviveProgress: 0,
        armorTimer: 0, attackCd: 0, hurtCd: 0, sprintBoostTimer: 0, dragonAssistCd: 0,
        companionAtkCd: 2.0 + i * 0.65,
      };
    });
  }

  startFestivalFinale() {
    this.clearWorld();
    this.mode = 'festival';
    this.scene.background = new THREE.Color(0x9bd7ff);
    this.scene.fog = new THREE.Fog(0xb6e3ff, 50, 140);
    this.addSkyBackdrop(0x47a0eb, 0xd8f3ff, true);
    this.audio.setMusicMode('festival');
    this.audio.sfxVictory();

    document.getElementById('boss-hud').classList.add('hidden');
    document.getElementById('hud-level-badge').textContent = 'FINALE';
    document.getElementById('hud-level-name').textContent = 'Spring Mountain Festival';
    document.getElementById('hud-objective').textContent =
      `🎉 Celebration! ${this.inventory.gold} Gold Berries decorating the Castle Courtyard! (Esc for Level Select)`;

    this.addGroundSegment(0, 0, 48, 48, 'festival', 0);
    this.addCastleStructure(0, 0, -15, 1.45);
    this.addStylizedTrees([[-18, -12, 1.2], [18, -12, 1.2], [-19, 4, 1.1], [19, 4, 1.1]]);
    [['deer', -11, 4], ['rabbit', 10, 6], ['rabbit', -8, -4], ['deer', 12, -5]].forEach(([k, wx, wz]) =>
      this.addPeacefulAnimal(k, wx, wz)
    );

    const decoCount = Math.max(6, this.inventory.gold * 2 + 6);
    const colors = [0xff5252, 0xffd740, 0x40c4ff, 0x69f0ae, 0xe040fb];
    for (let i = 0; i < decoCount; i++) {
      const angle = (i / decoCount) * Math.PI * 2;
      const dist = 10.5 + (i % 3) * 3.8;
      const dx = Math.cos(angle) * dist;
      const dz = Math.sin(angle) * dist * 0.8 + 2;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 4.4, 6),
        new THREE.MeshStandardMaterial({ color: 0xf5c953, metalness: 0.55 })
      );
      pole.position.set(dx, 2.2, dz);
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 10, 10),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], emissive: colors[i % colors.length], emissiveIntensity: 0.8 })
      );
      lantern.position.set(dx, 4.5, dz);
      this.worldGroup.add(pole, lantern);
    }

    this.bondedDragons = [true, true, true, true];
    this.spawnHeroes();
    this.updateHUD();
    this.showAlert(`🎉 Welcome to the Spring Mountain Festival! (${this.inventory.gold} Gold Berries Collected!)`, 6.0);
  }

  // ============================================================================
  // ABILITIES & BERRY LOOP
  // ============================================================================
  useRedBerry() {
    if (this.inventory.red <= 0) {
      this.showAlert('🍒 No Red Berries in pouch! Harvest bushes to store more.', 1.8);
      return;
    }
    const target = this.heroes[this.p1Hero];
    if (!target) return;
    this.inventory.red--;
    let revivedAny = false;
    this.heroes.forEach((h, i) => {
      if (h.downed) {
        h.downed = false;
        h.reviveProgress = 0;
        h.reviveRing.visible = false;
        h.hp = Math.round(h.maxHp * 0.5);
        revivedAny = true;
        this.spawnParticles(h.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffe066, 20);
        this.spawnFloatingText(h.pos.clone().add(new THREE.Vector3(0, 2.3, 0)), '💖 REVIVED!', '#ffe999');
      } else {
        const amt = i === this.p1Hero || (this.isCoop && i === this.p2Hero) ? 45 : 22;
        h.hp = Math.min(h.maxHp, h.hp + amt);
      }
    });
    this.audio.sfxBerry();
    this.spawnParticles(target.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff4d6d, 16);
    this.spawnFloatingText(target.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), revivedAny ? '🍒 HEALED & REVIVED!' : '+45 HP 🍒', '#ff758f');
    this.updateHUD();
  }

  useGreenBerry() {
    if (this.inventory.green <= 0) {
      this.showAlert('🫐 No Green Berries in pouch! Harvest multiple bushes to recharge.', 1.8);
      return;
    }
    this.inventory.green--;
    this.magic = Math.min(this.maxMagic, this.magic + 12);
    this.magicBoostTimer = Math.min(12, this.magicBoostTimer + 3.0);
    this.audio.sfxBerry();
    const target = this.heroes[this.p1Hero];
    if (target) {
      this.spawnParticles(target.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x4cff88, 16);
      this.spawnFloatingText(target.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 'MAGIC SURGE 🫐', '#6effa1');
    }
    this.updateHUD();
  }

  heroJump(hero) {
    if (!hero || !hero.onGround || hero.trappedByWeb || hero.downed) return;
    const isJoshuaHyper = hero.index === 0 && this.bondedDragons[0];
    hero.vel.y = isJoshuaHyper ? hero.def.hyperJump : hero.def.jumpPower;
    hero.onGround = false;
    this.audio.sfxJump();
  }

  // Soft auto-aim toward the closest enemy, boss, or web so every hero's attacks feel crisp & reliable!
  getCombatAimDir(hero, range = 11) {
    let bestPos = null;
    let bestDist = range;
    for (const en of this.enemies) {
      if (en.dead) continue;
      const d = hero.pos.distanceTo(en.pos);
      if (d < bestDist) { bestDist = d; bestPos = en.pos; }
    }
    if (this.boss && !this.boss.dead) {
      const d = hero.pos.distanceTo(this.boss.pos);
      if (d < bestDist + 2) { bestDist = d; bestPos = this.boss.pos; }
    }
    for (const w of this.webs) {
      if (!w.active) continue;
      const d = hero.pos.distanceTo(w.pos);
      if (d < Math.min(bestDist, 6.5)) { bestDist = d; bestPos = w.pos; }
    }
    if (bestPos) {
      const dx = bestPos.x - hero.pos.x;
      const dz = bestPos.z - hero.pos.z;
      if (dx * dx + dz * dz > 0.04) {
        hero.facing = Math.atan2(dx, dz);
      }
    }
    return new THREE.Vector3(Math.sin(hero.facing), 0, Math.cos(hero.facing)).normalize();
  }

  spawnSlashVfx(pos, facing, color, radius = 2.2) {
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.45, radius, 16, 1, -Math.PI * 0.45, Math.PI * 0.9),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = -facing + Math.PI / 2;
    arc.position.copy(pos).add(new THREE.Vector3(0, 0.95, 0));
    this.worldGroup.add(arc);
    this.vfxMeshes.push({ mesh: arc, life: 0.24, maxLife: 0.24, grow: 2.2 });
  }

  spawnShockwaveVfx(pos, color, startR = 0.8) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(startR * 0.65, startR, 24),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos).add(new THREE.Vector3(0, 0.14, 0));
    this.worldGroup.add(ring);
    this.vfxMeshes.push({ mesh: ring, life: 0.34, maxLife: 0.34, grow: 9.5 });
  }

  heroPrimaryAbility(hero) {
    if (!hero || hero.downed || hero.trappedByWeb || hero.attackCd > 0) return;
    const bonded = this.bondedDragons[hero.index];
    const dir = this.getCombatAimDir(hero, hero.index === 1 || hero.index === 2 ? 15 : 8.5);

    // Every hero's attack also frees nearby family members trapped in spider webs!
    this.tryBreakNearbyWebs(hero.pos, 4.8);

    const combat = HERO_COMBAT[hero.index];
    const fromPlayer = this.isHeroPlayerControlled(hero);

    if (hero.index === 0) {
      // PRINCE JOSHUA: Wind Crescent Slash + Speed Dash Strike (0 Magic!)
      hero.attackCd = combat.cd;
      hero.sprintBoostTimer = bonded ? 1.4 : 0.7;
      hero.vel.x += dir.x * (bonded ? 15 : 11);
      hero.vel.z += dir.z * (bonded ? 15 : 11);
      this.audio.sfxSpeed();
      const strikePos = hero.pos.clone().addScaledVector(dir, 1.8);
      this.spawnSlashVfx(strikePos, hero.facing, 0x39e58c, bonded ? 3.2 : 2.3);
      this.spawnParticles(strikePos.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x39e58c, 16);
      this.dealAreaDamage(strikePos, bonded ? 3.5 : 2.8, bonded ? combat.bondedDmg : combat.dmg, 'wind', fromPlayer);
      this.tryOpenNearbyGateByHeroAction(hero, 'wind', strikePos, 7.0);
    } else if (hero.index === 1) {
      // PRINCE DANIEL: Fireball / Inferno Blast (or zero-magic Flame Swipe if low on magic!)
      const cost = combat.magicCost;
      hero.attackCd = combat.cd;
      const fireKind = bonded ? 'inferno' : 'fire';
      if (this.magic >= cost) {
        this.magic -= cost;
        bonded ? this.audio.sfxInferno() : this.audio.sfxFire();
        if (bonded) this.triggerShake(0.24, 0.16);
        this.spawnProjectile({
          kind: fireKind,
          ownerHeroIdx: hero.index,
          fromPlayer,
          pos: hero.pos.clone().add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(dir, 0.9),
          vel: dir.clone().multiplyScalar(bonded ? 24 : 20),
          radius: bonded ? 1.15 : 0.72,
          damage: bonded ? combat.bondedDmg : combat.dmg,
          color: bonded ? 0xff7b00 : 0xff4500,
          life: 2.0,
        });
        this.tryOpenNearbyGateByHeroAction(hero, fireKind, hero.pos, 7.5);
      } else {
        // Zero-magic Flame Swipe melee fallback so Daniel can ALWAYS fight!
        this.audio.sfxFire();
        const swipePos = hero.pos.clone().addScaledVector(dir, 1.7);
        this.spawnSlashVfx(swipePos, hero.facing, 0xff5722, 2.3);
        this.spawnParticles(swipePos.clone().add(new THREE.Vector3(0, 0.9, 0)), 0xff7043, 12);
        this.dealAreaDamage(swipePos, 2.8, combat.fallbackDmg, 'fire', fromPlayer);
        this.tryOpenNearbyGateByHeroAction(hero, fireKind, swipePos, 6.0);
      }
    } else if (hero.index === 2) {
      // QUEEN VANESSA: Ice Blast / Glacial Surge (or zero-magic Frost Staff Wave if low on magic!)
      const cost = combat.magicCost;
      hero.attackCd = combat.cd;
      const iceKind = bonded ? 'glacial' : 'ice';
      if (this.magic >= cost) {
        this.magic -= cost;
        this.audio.sfxIce();
        this.spawnProjectile({
          kind: iceKind,
          ownerHeroIdx: hero.index,
          fromPlayer,
          pos: hero.pos.clone().add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(dir, 0.9),
          vel: dir.clone().multiplyScalar(21),
          radius: bonded ? 1.2 : 0.75,
          damage: bonded ? combat.bondedDmg : combat.dmg,
          color: 0x5ce1ff,
          life: 2.0,
        });
        this.tryOpenNearbyGateByHeroAction(hero, iceKind, hero.pos, 9.5);
      } else {
        // Zero-magic Frost Wave melee fallback so Vanessa can ALWAYS fight!
        this.audio.sfxIce();
        const wavePos = hero.pos.clone().addScaledVector(dir, 1.6);
        this.spawnShockwaveVfx(wavePos, 0x5ce1ff, 0.7);
        this.dealAreaDamage(wavePos, 3.0, combat.fallbackDmg, 'ice', fromPlayer);
        this.tryOpenNearbyGateByHeroAction(hero, iceKind, wavePos, 8.5);
      }
    } else if (hero.index === 3) {
      // KING MICHAEL: Heavy Ground Slam / Titan Smash (0 Magic!)
      hero.attackCd = combat.cd;
      this.audio.sfxSmash();
      this.triggerShake(bonded ? 0.36 : 0.22, 0.18);
      const hitPos = hero.pos.clone().addScaledVector(dir, 1.9);
      this.spawnShockwaveVfx(hitPos, bonded ? 0xd8b4fe : 0xf5c953, bonded ? 1.0 : 0.75);
      this.spawnParticles(hitPos.clone().add(new THREE.Vector3(0, 0.7, 0)), 0xb76eff, 22);
      this.dealAreaDamage(hitPos, bonded ? 4.4 : 3.4, bonded ? combat.bondedDmg : combat.dmg, bonded ? 'titan' : 'strength', fromPlayer);
      this.tryOpenNearbyGateByHeroAction(hero, bonded ? 'titan' : 'strength', hitPos, 6.5);
      this.obstacles.forEach((ob) => {
        if (!ob.active) return;
        if (ob.pos.distanceTo(hitPos) < ob.radius + 2.5) {
          if (ob.type === 'boulder' || (ob.type === 'obsidian_gate' && bonded)) {
            ob.active = false;
            ob.mesh.visible = false;
            this.spawnParticles(ob.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xa855f7, 28);
            this.spawnFloatingText(ob.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '💥 SMASHED!', '#d8b4fe');
            this.showAlert(ob.type === 'obsidian_gate' ? '💥 Samson & Michael shattered the Obsidian Gate!' : '💥 King Michael smashed the giant boulder!');
          } else if (ob.type === 'obsidian_gate') {
            this.showAlert('🛡️ Needs Michael + Samson’s Titan Strength!');
          }
        }
      });
    }
    // Bonded Baby Dragon fires bonus assist bolt during boss fights!
    this.triggerDragonAssist(hero);
    this.updateHUD();
  }

  heroSpecialAbility(hero) {
    if (!hero || hero.downed || hero.trappedByWeb) return;
    const bonded = this.bondedDragons[hero.index];

    if (hero.index === 0) {
      hero.sprintBoostTimer = bonded ? 2.4 : 1.1;
      this.audio.sfxSpeed();
      this.spawnParticles(hero.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x39e58c, 16);
      this.tryOpenNearbyGateByHeroAction(hero, 'speed', hero.pos, 7.0);
      if (bonded) this.spawnFloatingText(hero.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '⚡ HYPER-SPEED!', '#6effa1');
    } else if (hero.index === 1) {
      this.heroPrimaryAbility(hero);
    } else if (hero.index === 2) {
      if (this.tryOpenNearbyGateByHeroAction(hero, 'ice_bridge', hero.pos, 10.0)) {
        this.magic = Math.max(0, this.magic - 10);
        this.updateHUD();
        return;
      }
      if (!bonded) { this.heroPrimaryAbility(hero); return; }
      if (this.magic < 18) { this.showAlert('✨ Need 18 Magic for Ice Bridge!', 1.8); return; }
      let frozeAny = false;
      this.chasmZones.forEach((cz) => {
        if (cz.frozen) return;
        if (Math.abs(hero.pos.z - cz.z) < cz.d / 2 + 6.5) {
          cz.frozen = true;
          frozeAny = true;
          const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(9.0, 0.55, cz.d + 1.5),
            new THREE.MeshStandardMaterial({
              color: 0xa6f0ff, emissive: 0x29b6f6, emissiveIntensity: 0.48, roughness: 0.12, transparent: true, opacity: 0.92,
            })
          );
          bridge.position.set(0, -0.22, cz.z);
          bridge.receiveShadow = true;
          this.worldGroup.add(bridge);
          cz.bridgeMesh = bridge;
          this.platforms.push({ minX: -4.5, maxX: 4.5, minZ: cz.z - cz.d / 2 - 0.75, maxZ: cz.z + cz.d / 2 + 0.75, topY: 0 });
          this.spawnParticles(new THREE.Vector3(0, 0.5, cz.z), 0x80e8ff, 30);
          this.spawnFloatingText(new THREE.Vector3(0, 2.0, cz.z), '❄️ ICE BRIDGE!', '#80e8ff');
        }
      });
      if (frozeAny) {
        this.magic -= 18;
        this.audio.sfxBridge();
        this.showAlert('❄️ Vanessa & Frosty crystallized a sparkling Ice Bridge!', 2.4);
      } else this.heroPrimaryAbility(hero);
    } else if (hero.index === 3) {
      if (!bonded) { this.heroPrimaryAbility(hero); return; }
      if (this.magic < 22) { this.showAlert('✨ Need 22 Magic for Invincible Armor!', 1.6); return; }
      this.magic -= 22;
      hero.armorTimer = 5.5;
      this.audio.sfxArmor();
      this.spawnParticles(hero.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xc084fc, 22);
      this.spawnFloatingText(hero.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), '🛡️ INVINCIBLE ARMOR!', '#d8b4fe');
    }
    this.updateHUD();
  }

  tryBreakNearbyWebs(origin, range) {
    this.webs.forEach((w) => {
      if (!w.active) return;
      if (w.pos.distanceTo(origin) <= range) {
        w.active = false;
        w.mesh.visible = false;
        if (w.trappedHeroIdx >= 0) {
          const freed = this.heroes[w.trappedHeroIdx];
          if (freed) {
            freed.trappedByWeb = null;
            freed.webCocoon.visible = false;
            this.spawnFloatingText(freed.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '✨ FREED!', '#ffe999');
            this.showAlert(`Freed ${freed.def.name}!`, 2.0);
            this.dialogue?.play('l1_vanessa_free').catch(() => {});
          }
          w.trappedHeroIdx = -1;
        }
        this.spawnParticles(w.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 0xffffff, 16);
        this.audio.sfxSwap();
      }
    });
  }

  spawnProjectile(proj) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(proj.radius * 0.58, 12, 12),
      new THREE.MeshStandardMaterial({ color: proj.color, emissive: proj.color, emissiveIntensity: 0.95 })
    );
    mesh.position.copy(proj.pos);
    this.worldGroup.add(mesh);
    proj.mesh = mesh;
    this.projectiles.push(proj);
  }

  spawnParticles(pos, color, count = 12) {
    let mat = this.particleMatCache.get(color);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color });
      this.sharedResources.add(mat);
      this.particleMatCache.set(color, mat);
    }
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.sharedParticleGeo, mat);
      m.position.copy(pos);
      this.worldGroup.add(m);
      this.particles.push({
        mesh: m,
        vel: new THREE.Vector3((Math.random() - 0.5) * 9.5, Math.random() * 7 + 2.2, (Math.random() - 0.5) * 9.5),
        life: 0.45 + Math.random() * 0.35,
      });
    }
  }

  dealAreaDamage(center, radius, dmg, element, fromPlayer = true) {
    this.enemies.forEach((en) => {
      if (!en.dead && en.pos.distanceTo(center) <= radius + 0.95) this.damageEnemy(en, dmg, element);
    });
    if (this.boss && !this.boss.dead && this.boss.pos.distanceTo(center) <= radius + 2.5) {
      this.damageBoss(dmg, element, fromPlayer);
    }
  }

  damageEnemy(en, dmg, element) {
    en.hp -= dmg;
    en.hitFlash = 0.18;
    if (element === 'ice' || element === 'glacial') {
      en.frozenTimer = element === 'glacial' ? 4.5 : 3.0;
      this.spawnFloatingText(en.pos.clone().add(new THREE.Vector3(0, 2.0, 0)), '❄️ FROZEN!', '#80e8ff');
    } else {
      this.spawnFloatingText(en.pos.clone().add(new THREE.Vector3(0, 1.9, 0)), `-${Math.round(dmg)}`, '#ffd54f');
    }
    this.audio.sfxHit();
    this.spawnParticles(en.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), element === 'ice' ? 0x5ce1ff : 0xffae42, 12);
    if (en.hp <= 0) {
      en.dead = true;
      en.mesh.visible = false;
      this.spawnParticles(en.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xffe066, 20);
    }
  }

  damageBoss(dmg, element, fromPlayer = true) {
    if (!this.boss || this.boss.dead) return;
    let mult = 1.0;
    if (this.boss.type === 'vine' && (element === 'fire' || element === 'inferno')) mult = 1.12;
    if (this.boss.type === 'magma' && (element === 'ice' || element === 'glacial')) mult = 1.12;
    if (this.boss.type === 'yeti' && (element === 'fire' || element === 'inferno')) mult = 1.12;
    if (this.boss.type === 'gargoyle' && (element === 'ice' || element === 'glacial' || element === 'titan')) mult = 1.12;

    let total = Math.max(1, Math.round(dmg * mult));

    // Enforce companion damage share cap (< 25% of total fight damage, Milestone 2.5)
    if (!fromPlayer) {
      const capRatio = this.getDifficultyConfig().companionDmgShareCap || 0.22;
      const maxCompanionTotal = Math.floor(this.boss.maxHp * capRatio);
      const remainingAllowance = Math.max(0, maxCompanionTotal - this.boss.damageByCompanions);
      // Also never let companions deal the finishing blow or exceed current player share
      const dynamicCap = Math.max(0, Math.floor((this.boss.damageByPlayer * capRatio) / (1 - capRatio)) - this.boss.damageByCompanions);
      total = Math.min(total, remainingAllowance, dynamicCap, Math.max(0, this.boss.hp - 1));
      if (total <= 0) return;
      this.boss.damageByCompanions += total;
    } else {
      this.boss.damageByPlayer += total;
    }

    this.boss.hp = Math.max(0, this.boss.hp - total);
    this.boss.hitFlash = 0.16;

    // Ice slows a guardian and cannot hold it still for more than 1.5s (with immunity cooldown!)
    if (element === 'ice' || element === 'glacial') {
      this.boss.slowTimer = 3.2;
      if (this.boss.iceImmunityTimer <= 0 && this.boss.frozenTimer <= 0) {
        this.boss.frozenTimer = Math.min(1.2, TUNING.maxBossIceHold);
        this.boss.iceImmunityTimer = TUNING.bossIceImmunityDuration;
        this.spawnFloatingText(this.boss.pos.clone().add(new THREE.Vector3(0, 4.1, 0)), '❄️ CHILLED!', '#80e8ff');
      }
    }

    this.audio.sfxHit();
    this.triggerShake(0.16, 0.11);
    this.spawnParticles(this.boss.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), 0xffc107, 10);
    this.spawnFloatingText(this.boss.pos.clone().add(new THREE.Vector3(0, 3.8, 0)), mult > 1 ? `-${total} SUPER!` : `-${total}`, mult > 1 ? '#ff7043' : '#ffe066');
    this.updateBossHUD();

    if (this.boss.hp <= 0) {
      // Guardian is FREED from the spell and becomes friendly — never killed!
      this.boss.dead = true;
      this.boss.freed = true;
      this.boss.friendly = true;
      this.boss.frozenTimer = 0;
      this.boss.slowTimer = 0;
      this.boss.charging = 0;
      this.boss.mesh.visible = true;
      if (this.boss.auraRing) {
        this.boss.auraRing.material.color.setHex(0x69f0ae);
        this.boss.auraRing.material.opacity = 0.85;
      }
      // Clear any remaining boss danger zones or projectiles immediately
      for (let i = this.dangerZones.length - 1; i >= 0; i--) {
        this.worldGroup.remove(this.dangerZones[i].mesh);
        this.disposeObject3D(this.dangerZones[i].mesh);
      }
      this.dangerZones = [];
      for (const proj of this.projectiles) {
        if (proj.fromBoss) {
          proj.life = -1;
          if (proj.mesh) proj.mesh.visible = false;
        }
      }

      this.audio.sfxVictory();
      this.triggerShake(0.45, 0.35);
      this.spawnParticles(this.boss.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), 0x69f0ae, 48);
      this.spawnFloatingText(this.boss.pos.clone().add(new THREE.Vector3(0, 4.4, 0)), '✨ SPELL BROKEN!', '#69f0ae');
      document.getElementById('boss-hud').classList.add('hidden');
      this.audio.setMusicMode('overworld');
      this.lastProgressTime = this.simTime;

      const def = LEVEL_DEFS[this.currentLevelIdx];
      if (def.index === 0) {
        this.showAlert('The Great Bear is free!', 4.0);
        this.dialogue?.play('l1_keeper_bear_freed').then(() => {
          if (this.currentLevelIdx === 0) this.dialogue?.play('l1_daniel_bear_smile').catch(() => {});
        }).catch(() => {});
      } else if (def.index === 2) {
        this.showAlert('Ember Golem cooled! Bring Daniel to the egg!', 4.5);
        this.dialogue?.play('l3_keeper_golem_freed').catch(() => {});
      } else if (def.index === 4) {
        this.showAlert('Gargoyle rests! Bring Michael to the egg!', 4.5);
        this.dialogue?.play('l5_keeper_gargoyle_freed').catch(() => {});
      } else if (def.eggHeroIndex !== null) {
        const heroName = HERO_DEFS[def.eggHeroIndex].name;
        this.showAlert(`Guardian freed! Bring ${heroName} to the egg!`, 4.5);
      } else if (def.index === 5) {
        this.completedLevels.add(5);
        this.highestLevel = 5;
        this.persistSave();
        setTimeout(() => this.showStoryModal(def.outroStory, () => this.startFestivalFinale()), 950);
      }
    }
  }

  // Bonded Baby Dragon Team Assist: during boss fights, your bonded dragon fires a periodic bonus bolt!
  triggerDragonAssist(hero) {
    if (!this.bondedDragons[hero.index] || !this.boss || this.boss.dead || !this.boss.activated) return;
    if (hero.dragonAssistCd > 0) return;
    if (this.boss.pos.distanceTo(hero.pos) > 22) return;
    hero.dragonAssistCd = TUNING.dragonAssistCd;
    const dir = this.boss.pos.clone().sub(hero.dragonMesh.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.01) return;
    dir.normalize();
    this.spawnProjectile({
      kind: ['wind', 'inferno', 'glacial', 'titan'][hero.index],
      ownerHeroIdx: hero.index,
      fromPlayer: this.isHeroPlayerControlled(hero),
      pos: hero.dragonMesh.position.clone(),
      vel: dir.multiplyScalar(22),
      radius: 0.55,
      damage: TUNING.dragonAssistDmg,
      color: hero.def.dragonColor,
      life: 1.6,
    });
  }

  // ============================================================================
  // MAIN SIMULATION LOOP + GAMEPADS + MOVING PLATFORMS + PUZZLES + DANGER ZONES
  // ============================================================================
  getActiveMenuOverlay() {
    const ids = ['level-select-screen', 'pause-overlay', 'gameover-overlay', 'story-overlay', 'title-screen'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('hidden')) return el;
    }
    return null;
  }

  getFocusableButtons(overlay) {
    if (!overlay) return [];
    return Array.from(overlay.querySelectorAll('button')).filter(
      (b) => !b.classList.contains('hidden') && !b.disabled && b.offsetParent !== null
    );
  }

  applyMenuFocus(overlay, idx) {
    document.querySelectorAll('.gp-focus').forEach((el) => el.classList.remove('gp-focus'));
    const buttons = this.getFocusableButtons(overlay);
    if (buttons.length === 0) return null;
    const clamped = ((idx % buttons.length) + buttons.length) % buttons.length;
    this.menuFocusIdx = clamped;
    this.menuFocusScreen = overlay.id;
    const btn = buttons[clamped];
    btn.classList.add('gp-focus');
    return btn;
  }

  handleGamepadMenuNav(gp, justPressed, dt) {
    const overlay = this.getActiveMenuOverlay();
    if (!overlay) {
      if (this.menuFocusScreen) {
        document.querySelectorAll('.gp-focus').forEach((el) => el.classList.remove('gp-focus'));
        this.menuFocusScreen = null;
      }
      return false;
    }

    const buttons = this.getFocusableButtons(overlay);
    if (buttons.length === 0) return true;

    if (this.menuFocusScreen !== overlay.id || this.menuFocusIdx >= buttons.length) {
      this.menuFocusIdx = 0;
      this.applyMenuFocus(overlay, 0);
    } else if (!buttons[this.menuFocusIdx]?.classList.contains('gp-focus')) {
      this.applyMenuFocus(overlay, this.menuFocusIdx);
    }

    if (this.menuNavCd > 0) this.menuNavCd = Math.max(0, this.menuNavCd - dt);

    let navX = 0;
    let navY = 0;
    if (gp.buttons[14]?.pressed || (gp.axes[0] || 0) < -0.55) navX = -1;
    else if (gp.buttons[15]?.pressed || (gp.axes[0] || 0) > 0.55) navX = 1;
    if (gp.buttons[12]?.pressed || (gp.axes[1] || 0) < -0.55) navY = -1;
    else if (gp.buttons[13]?.pressed || (gp.axes[1] || 0) > 0.55) navY = 1;

    const dirChanged = navX !== this.gamepadPrevNavDir.x || navY !== this.gamepadPrevNavDir.y;
    this.gamepadPrevNavDir.x = navX;
    this.gamepadPrevNavDir.y = navY;

    if ((navX !== 0 || navY !== 0) && (dirChanged || this.menuNavCd <= 0)) {
      const delta = navX !== 0 ? navX : navY;
      this.applyMenuFocus(overlay, this.menuFocusIdx + delta);
      this.menuNavCd = 0.22;
    }

    if (justPressed(0)) { // A -> Confirm focused button
      const target = buttons[this.menuFocusIdx] || buttons[0];
      if (target) target.click();
      return true;
    }

    if (justPressed(1)) { // B -> Back / Resume
      if (overlay.id === 'level-select-screen') {
        document.getElementById('btn-close-levels')?.click();
      } else if (overlay.id === 'pause-overlay') {
        this.togglePause(false);
      }
      return true;
    }

    if (justPressed(9)) { // Start -> Quick Resume / Continue
      if (overlay.id === 'pause-overlay') this.togglePause(false);
      else if (overlay.id === 'story-overlay') document.getElementById('btn-story-continue')?.click();
      else if (overlay.id === 'title-screen') {
        const target = buttons[this.menuFocusIdx] || document.getElementById('btn-start-story');
        target?.click();
      }
      return true;
    }

    return true;
  }

  pollGamepads(dt = 1 / 60) {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let connectedCount = 0;
    const menuActive = !!this.getActiveMenuOverlay();

    for (let slot = 0; slot < 2; slot++) {
      const gp = pads[slot];
      this.gamepadAxes[slot].set(0, 0);
      if (!gp || !gp.connected) continue;
      connectedCount++;

      const prev = this.gamepadPrevButtons[slot];
      const justPressed = (idx) => {
        const cur = !!gp.buttons[idx]?.pressed;
        const was = !!prev[idx];
        prev[idx] = cur;
        return cur && !was;
      };

      // Menu navigation (Controller 1 drives menus when any overlay is open)
      if (menuActive) {
        if (slot === 0) this.handleGamepadMenuNav(gp, justPressed, dt);
        continue;
      }

      // Auto-enable 2P Co-Op if controller 2 moves or presses any button!
      const ax = Math.abs(gp.axes[0] || 0) > 0.22 ? gp.axes[0] : 0;
      const ay = Math.abs(gp.axes[1] || 0) > 0.22 ? gp.axes[1] : 0;
      let dx = ax, dy = ay;
      if (gp.buttons[14]?.pressed) dx = -1;
      if (gp.buttons[15]?.pressed) dx = 1;
      if (gp.buttons[12]?.pressed) dy = -1;
      if (gp.buttons[13]?.pressed) dy = 1;
      this.gamepadAxes[slot].set(dx, dy);

      const anyPressed = gp.buttons.some((b) => b?.pressed) || Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3;
      if (slot === 1 && anyPressed && !this.isCoop && (this.mode === 'playing' || this.mode === 'festival')) {
        this.isCoop = true;
        if (this.p2Hero === this.p1Hero) this.p2Hero = (this.p1Hero + 1) % 4;
        this.showAlert('Player 2 joined!', 2.4);
      }

      if (justPressed(9)) { // Start button -> Pause / Skip Cutscene
        if (this.mode === 'cutscene') this.finishCutscene();
        else if (this.mode === 'story') document.getElementById('btn-story-continue').click();
        else if (this.mode === 'playing' || this.mode === 'paused' || this.mode === 'festival') this.togglePause();
        continue;
      }

      if (this.mode !== 'playing' && this.mode !== 'festival') continue;
      const hero = this.heroes[slot === 0 ? this.p1Hero : this.p2Hero];
      if (justPressed(0)) this.heroJump(hero);                             // A -> Jump
      if (justPressed(2) || justPressed(5)) this.heroPrimaryAbility(hero); // X / RB -> Attack
      if (justPressed(1) || justPressed(7)) this.heroSpecialAbility(hero); // B / RT -> Special
      if (justPressed(3) || justPressed(4)) {                              // Y / LB -> Swap Hero
        if (this.isCoop) this.cycleCoopHero(slot + 1);
        else {
          for (let step = 1; step <= 4; step++) {
            const nxt = (this.p1Hero + step) % 4;
            if (this.heroes[nxt] && !this.heroes[nxt].downed) { this.swapHero(1, nxt); break; }
          }
        }
      }
      if (justPressed(6)) this.useRedBerry();                              // LT -> Red Berry
      if (justPressed(8)) this.useGreenBerry();                            // View -> Green Berry
      if (!this.isCoop && justPressed(10)) this.callCompanions();          // L3 -> Call family
    }

    const gpPill = document.getElementById('gamepad-pill');
    if (gpPill) {
      gpPill.classList.toggle('hidden', connectedCount === 0);
      gpPill.textContent = connectedCount > 1 ? '🎮 2P' : '🎮 1P';
    }
  }

  getFloorHeightAt(x, z, canClimbSteep = false) {
    for (const s of this.slopeZones) {
      if (x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ) {
        const t = THREE.MathUtils.clamp((s.maxZ - z) / (s.maxZ - s.minZ), 0, 1);
        return { y: THREE.MathUtils.lerp(s.baseY, s.topY, t), steep: !!s.requiresSpeed && !canClimbSteep, onSolid: true, moving: false };
      }
    }
    let bestY = null;
    let isMoving = false;
    for (const mp of this.movingPlatforms) {
      if (x >= mp.x - mp.w / 2 && x <= mp.x + mp.w / 2 && z >= mp.z - mp.d / 2 && z <= mp.z + mp.d / 2) {
        if (bestY === null || mp.topY > bestY) { bestY = mp.topY; isMoving = true; }
      }
    }
    for (const p of this.platforms) {
      if (x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ) {
        if (bestY === null || p.topY > bestY) { bestY = p.topY; isMoving = false; }
      }
    }
    if (bestY !== null) return { y: bestY, steep: false, onSolid: true, moving: isMoving };
    return { y: -10, steep: false, onSolid: false, moving: false };
  }

  isSafeStandingSpot(x, z, y) {
    const pad = 0.65;
    const probes = [
      [x, z],
      [x + pad, z],
      [x - pad, z],
      [x, z + pad],
      [x, z - pad],
    ];
    for (const [px, pz] of probes) {
      const f = this.getFloorHeightAt(px, pz, false);
      if (!f.onSolid || f.moving || f.steep || Math.abs(f.y - y) > 0.45) return false;
    }
    return true;
  }

  getFallHintForPosition(x, z) {
    let matchedChasm = null;
    for (const cz of this.chasmZones) {
      if (Math.abs(x - cz.x) <= cz.w / 2 + 4 && Math.abs(z - cz.z) <= cz.d / 2 + 2.5) {
        matchedChasm = cz;
        break;
      }
    }
    if (matchedChasm) {
      if (matchedChasm.hintText) return matchedChasm.hintText;
      if (matchedChasm.hazardType === 'lava') {
        return 'Hot lava! Use Joshua on the slope.';
      }
      const hasMovingBridge = this.movingPlatforms.some(
        (mp) => Math.abs(mp.baseZ - matchedChasm.z) <= matchedChasm.d / 2 + 2.5
      );
      if (hasMovingBridge) {
        return 'Wait for the bridge or leap with Joshua.';
      }
      return 'Freeze the water with Vanessa!';
    }
    return 'Watch your step! Stay on the path.';
  }

  updateMovingPlatformsAndPuzzles(dt) {
    const t = this.simTime;
    // Gliding canopy platforms carry standing heroes!
    this.movingPlatforms.forEach((mp) => {
      mp.prevX = mp.x;
      mp.prevZ = mp.z;
      const offset = Math.sin(t * mp.speed + mp.phase) * mp.range;
      mp.x = mp.axis === 'x' ? mp.baseX + offset : mp.baseX;
      mp.z = mp.axis === 'z' ? mp.baseZ + offset : mp.baseZ;
      mp.mesh.position.set(mp.x, mp.topY - 0.4, mp.z);
      const dx = mp.x - mp.prevX;
      const dz = mp.z - mp.prevZ;
      this.heroes.forEach((h) => {
        if (h.onGround && Math.abs(h.pos.y - mp.topY) < 0.35 &&
            h.pos.x >= mp.prevX - mp.w / 2 && h.pos.x <= mp.prevX + mp.w / 2 &&
            h.pos.z >= mp.prevZ - mp.d / 2 && h.pos.z <= mp.prevZ + mp.d / 2) {
          h.pos.x += dx;
          h.pos.z += dz;
        }
      });
    });

    // King Michael Super Strength Pushable Rune Blocks -> Floor Pressure Switches!
    this.pushPuzzles.forEach((pz) => {
      if (pz.solved) return;
      const isMichaelPlayer = this.p1Hero === 3 || (this.isCoop && this.p2Hero === 3);
      const michael = this.heroes[3];
      if (isMichaelPlayer && michael && !michael.downed && !michael.trappedByWeb && michael.pos.distanceTo(pz.pos) < 2.2) {
        const pushDir = pz.pos.clone().sub(michael.pos);
        pushDir.y = 0;
        if (pushDir.lengthSq() > 0.01) {
          pushDir.normalize();
          pz.pos.addScaledVector(pushDir, dt * 4.8);
          pz.block.position.set(pz.pos.x, pz.y + 1.0, pz.pos.z);
        }
      }
      if (pz.pos.distanceTo(pz.switchPos) < 1.65) {
        pz.solved = true;
        pz.pos.copy(pz.switchPos);
        pz.block.position.set(pz.switchPos.x, pz.y + 1.0, pz.switchPos.z);
        pz.sw.material.color.setHex(0x2ecc71);
        pz.sw.material.emissive.setHex(0x1b8a5a);
        this.audio.sfxGoldBerry();
        this.spawnParticles(pz.switchPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffd700, 28);
        this.spawnFloatingText(pz.switchPos.clone().add(new THREE.Vector3(0, 2.4, 0)), '✨ SECRET UNLOCKED!', '#ffe57f');
        this.showAlert('💪 King Michael pushed the Rune Block onto the switch — a Secret Gold Berry appeared!', 3.6);
        this.addGoldBerry(pz.rewardGoldId, pz.rewardX, pz.rewardZ, pz.y + 1.15);
      }
    });
  }

  updateDangerZones(dt) {
    for (let i = this.dangerZones.length - 1; i >= 0; i--) {
      const dz = this.dangerZones[i];
      dz.elapsed += dt;
      const pct = Math.min(1, dz.elapsed / dz.delay);
      dz.inner.scale.setScalar(Math.max(0.05, pct));
      if (dz.elapsed >= dz.delay) {
        // DETONATE telegraphed attack!
        this.spawnShockwaveVfx(dz.pos, dz.color, dz.radius * 0.45);
        this.spawnParticles(dz.pos.clone().add(new THREE.Vector3(0, 0.7, 0)), dz.color, 20);
        this.triggerShake(0.28, 0.18);
        this.audio.sfxSmash();
        this.heroes.forEach((h) => {
          if (h.downed) return;
          const horiz = Math.hypot(h.pos.x - dz.pos.x, h.pos.z - dz.pos.z);
          // Jumping above shockwave or Michael's Invincible Armor dodges/blocks it!
          if (horiz <= dz.radius && h.pos.y < dz.pos.y + 1.35) {
            if (h.armorTimer > 0) {
              this.spawnFloatingText(h.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '🛡️ BLOCKED!', '#d8b4fe');
            } else {
              this.hurtHero(h, dz.damage, 'boss');
            }
          }
        });
        this.worldGroup.remove(dz.mesh);
        this.disposeObject3D(dz.mesh);
        this.dangerZones.splice(i, 1);
      }
    }
  }

  update(dt) {
    this.simTime += dt;
    this.pollGamepads(dt);
    const t = this.simTime;
    if (this.mode === 'cutscene') {
      this.updateCutscene(dt);
      this.updateCaptions(dt);
      return;
    }
    if (this.mode === 'title') {
      this.camera.position.set(Math.sin(t * 0.22) * 4.5, 8.8, 15.8);
      this.camera.lookAt(0, 2.5, -1.5);
      this.worldGroup.children.forEach((c) => {
        if (c.userData.spin) {
          c.rotation.y += dt * 1.1;
          c.position.y = 0.5 + Math.sin(t * 2.4 + c.position.x) * 0.22;
        }
        if (c.userData.bob) {
          c.position.y = 2.75 + Math.sin(t * 3.1 + c.userData.bob) * 0.3;
          c.rotation.y = Math.sin(t * 0.9 + c.userData.bob) * 0.35;
        }
        if (c.userData.orbit) {
          c.position.x = Math.sin(t * 0.65) * 9.5;
          c.position.z = -5.5 + Math.cos(t * 0.65) * 5.0;
          c.position.y = 8.4 + Math.sin(t * 2.2) * 0.6;
          c.rotation.y = Math.atan2(Math.cos(t * 0.65) * 9.5, -Math.sin(t * 0.65) * 5.0);
        }
      });
      return;
    }

    if (this.mode !== 'playing' && this.mode !== 'festival') return;

    if (this.alertTimer > 0) {
      this.alertTimer -= dt;
      if (this.alertTimer <= 0) document.getElementById('alert-banner').classList.add('hidden');
    }

    // Animate shimmering rivers & magma
    this.chasmZones.forEach((cz) => {
      if (cz.liquidMesh && cz.liquidMesh.material.map) {
        cz.liquidMesh.material.map.offset.x += dt * (cz.hazardType === 'lava' ? 0.08 : 0.22);
      }
    });

    // Ambient fireflies / snowflakes / embers
    this.ambientMotes.forEach((m) => {
      if (m.mode === 'snow') {
        m.mesh.position.y -= dt * 1.6;
        m.mesh.position.x = m.baseX + Math.sin(t * 1.4 + m.phase) * 0.8;
        if (m.mesh.position.y < 0.2) m.mesh.position.y = 8.5;
      } else if (m.mode === 'ember') {
        m.mesh.position.y += dt * 1.3;
        m.mesh.position.x = m.baseX + Math.sin(t * 2.2 + m.phase) * 0.5;
        if (m.mesh.position.y > 9.0) m.mesh.position.y = 0.5;
      } else {
        m.mesh.position.y = m.baseY + Math.sin(t * 1.8 + m.phase) * 0.65;
        m.mesh.position.x = m.baseX + Math.cos(t * 1.2 + m.phase) * 0.7;
      }
    });

    const regenRate = this.magicBoostTimer > 0 ? 12.5 : 5.5;
    if (this.magicBoostTimer > 0) this.magicBoostTimer = Math.max(0, this.magicBoostTimer - dt);
    this.magic = Math.min(this.maxMagic, this.magic + regenRate * dt);

    this.updateMovingPlatformsAndPuzzles(dt);
    if (this.levelAnimators) this.levelAnimators.forEach((fn) => fn(t, dt));
    this.updateDangerZones(dt);
    this.updateHeroes(dt);
    this.updateProjectiles(dt);

    this.obstacles.forEach((ob) => {
      if (ob.type === 'magma_vent' && ob.cooledTimer > 0) {
        ob.cooledTimer -= dt;
        if (ob.mesh.userData.flame) ob.mesh.userData.flame.visible = ob.cooledTimer <= 0;
      }
    });

    if (this.mode === 'playing') {
      this.updateEnemies(dt);
      this.updateBoss(dt);
      this.checkPickupsAndObjectives(dt);
      this.updateKeeperHints();
    }
    this.updateCaptions(dt);

    this.wildlife.forEach((w) => {
      if (w.kind === 'rabbit') w.mesh.position.y = Math.abs(Math.sin(t * 3.5 + w.phase)) * 0.35;
      else if (w.kind === 'deer') w.mesh.rotation.y = Math.sin(t * 0.55 + w.phase) * 0.55;
    });

    if (this.mode === 'festival' && Math.random() < dt * 2.4) {
      const fx = new THREE.Vector3((Math.random() - 0.5) * 28, 7.5 + Math.random() * 6, -6 + (Math.random() - 0.5) * 16);
      const cols = [0xff5252, 0xffd740, 0x40c4ff, 0x69f0ae, 0xe040fb];
      this.spawnParticles(fx, cols[Math.floor(Math.random() * cols.length)], 22);
    }

    for (let i = this.vfxMeshes.length - 1; i >= 0; i--) {
      const v = this.vfxMeshes[i];
      v.life -= dt;
      v.mesh.scale.addScalar(dt * v.grow);
      if (v.mesh.material) v.mesh.material.opacity = Math.max(0, (v.life / v.maxLife) * 0.9);
      if (v.life <= 0) {
        this.worldGroup.remove(v.mesh);
        this.disposeObject3D(v.mesh);
        this.vfxMeshes.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vel.y -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.setScalar(Math.max(0.01, p.life * 1.4));
      if (p.life <= 0) {
        this.worldGroup.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    this.updateCamera(dt);
    this.updateFloatingPopups(dt);
    this.updateHUD();
  }

  getPlayerMoveInput(playerNum) {
    let ix = 0, iz = 0;
    if (!this.isCoop) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) iz -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) iz += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
    } else if (playerNum === 1) {
      if (this.keys['KeyW']) iz -= 1;
      if (this.keys['KeyS']) iz += 1;
      if (this.keys['KeyA']) ix -= 1;
      if (this.keys['KeyD']) ix += 1;
    } else {
      if (this.keys['ArrowUp']) iz -= 1;
      if (this.keys['ArrowDown']) iz += 1;
      if (this.keys['ArrowLeft']) ix -= 1;
      if (this.keys['ArrowRight']) ix += 1;
    }
    const gp = this.gamepadAxes[playerNum - 1];
    if (gp && gp.lengthSq() > 0.04) {
      ix += gp.x;
      iz += gp.y;
    }
    const v = new THREE.Vector3(ix, 0, iz);
    if (v.lengthSq() > 0) v.normalize();
    return v;
  }

  callCompanions() {
    if (this.isCoop || (this.mode !== 'playing' && this.mode !== 'festival')) return;
    const leader = this.heroes[this.p1Hero];
    if (!leader) return;
    this.companionRallyTimer = 3.0;
    this.audio.sfxSwap();
    this.spawnParticles(leader.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xffe066, 14);
    this.showAlert('Family, gather up!', 1.8);
  }

  companionGentleAssist(h) {
    // Companions NEVER open gates and NEVER spend player magic.
    // During active fights they chip in gently (< 25% of total work).
    let targetPos = null;
    let targetEnemy = null;
    let isBoss = false;

    if (this.boss && !this.boss.dead && this.boss.activated && this.boss.damageByPlayer > 0) {
      if (h.pos.distanceTo(this.boss.pos) < 15) {
        targetPos = this.boss.pos;
        isBoss = true;
      }
    }
    if (!targetPos) {
      let bestDist = 9.5;
      for (const en of this.enemies) {
        if (en.dead) continue;
        const d = h.pos.distanceTo(en.pos);
        if (d < bestDist) {
          bestDist = d;
          targetEnemy = en;
          targetPos = en.pos;
        }
      }
    }
    if (!targetPos) return false;

    const dir = targetPos.clone().sub(h.pos);
    dir.y = 0;
    if (dir.lengthSq() < 0.04) return false;
    dir.normalize();
    h.facing = Math.atan2(dir.x, dir.z);

    if (isBoss) {
      // Gentle elemental bolt or strike (strictly fromPlayer: false, never opens gates)
      const elem = ['wind', 'fire', 'ice', 'strength'][h.index];
      const dmg = 4;
      if (h.index === 1 || h.index === 2) {
        this.spawnProjectile({
          kind: elem,
          ownerHeroIdx: h.index,
          fromPlayer: false,
          pos: h.pos.clone().add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(dir, 0.8),
          vel: dir.clone().multiplyScalar(18),
          radius: 0.55,
          damage: dmg,
          color: h.def.color,
          life: 1.5,
        });
      } else {
        const strikePos = h.pos.clone().addScaledVector(dir, 1.6);
        this.spawnSlashVfx(strikePos, h.facing, h.def.color, 1.9);
        if (h.pos.distanceTo(this.boss.pos) < 5.5) {
          this.damageBoss(dmg, elem, false);
        }
      }
      return true;
    } else if (targetEnemy) {
      const elem = ['wind', 'fire', 'ice', 'strength'][h.index];
      if (h.pos.distanceTo(targetEnemy.pos) < 3.4) {
        this.spawnSlashVfx(h.pos.clone().addScaledVector(dir, 1.4), h.facing, h.def.color, 1.8);
        this.damageEnemy(targetEnemy, 5, elem);
        return true;
      } else if (h.index === 1 || h.index === 2) {
        this.spawnProjectile({
          kind: elem,
          ownerHeroIdx: h.index,
          fromPlayer: false,
          pos: h.pos.clone().add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(dir, 0.8),
          vel: dir.clone().multiplyScalar(17),
          radius: 0.5,
          damage: 5,
          color: h.def.color,
          life: 1.3,
        });
        return true;
      }
    }
    return false;
  }

  updateHeroes(dt) {
    const t = this.simTime;
    if (this.companionRallyTimer > 0) this.companionRallyTimer = Math.max(0, this.companionRallyTimer - dt);
    const leader = this.heroes[this.p1Hero];

    this.heroes.forEach((h, idx) => {
      if (h.attackCd > 0) h.attackCd -= dt;
      if (h.hurtCd > 0) h.hurtCd -= dt;
      if (h.armorTimer > 0) h.armorTimer -= dt;
      if (h.sprintBoostTimer > 0) h.sprintBoostTimer -= dt;
      if (h.dragonAssistCd > 0) h.dragonAssistCd -= dt;
      h.armorBubble.visible = h.armorTimer > 0;

      const isP1 = idx === this.p1Hero;
      const isP2 = this.isCoop && idx === this.p2Hero;
      h.ring.visible = isP1 || isP2;
      if (isP1) h.ring.material.color.setHex(0xf5c953);
      else if (isP2) h.ring.material.color.setHex(0x4de3ff);

      let moveDir = new THREE.Vector3();
      const bonded = this.bondedDragons[idx];
      const isHyperJoshua = idx === 0 && bonded;
      let moveSpeed = isHyperJoshua ? h.def.hyperSpeed : h.def.speed;
      if (h.sprintBoostTimer > 0) moveSpeed *= 1.38;

      if (h.downed) {
        // Knocked out hero lies flat until revived by a standing family member, Red Berry, or auto-get-up on Easy!
        h.webCocoon.visible = false;
        h.reviveRing.visible = true;
        h.root.position.set(h.pos.x, h.pos.y + 0.25, h.pos.z);
        h.root.rotation.set(Math.PI / 2, h.facing, 0);
        const diffCfg = this.getDifficultyConfig();
        if (!diffCfg.canLose) {
          h.autoGetUpTimer = (h.autoGetUpTimer || 0) + dt;
          if (h.autoGetUpTimer >= (diffCfg.autoGetUpDelay || 1.8)) {
            h.downed = false;
            h.autoGetUpTimer = 0;
            h.reviveProgress = 0;
            h.reviveRing.visible = false;
            h.reviveRing.scale.setScalar(1);
            h.root.rotation.set(0, h.facing, 0);
            h.hp = Math.round(h.maxHp * 0.65);
            h.hurtCd = 2.0;
            this.spawnParticles(h.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffe066, 16);
            this.spawnFloatingText(h.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 'UP AGAIN!', '#6effa1');
            return;
          }
        }
        // Check if a standing hero is beside them to revive (1.5s)!
        const helper = this.heroes.find((other) => !other.downed && !other.trappedByWeb && other.pos.distanceTo(h.pos) < 2.6);
        if (helper) {
          h.reviveProgress += dt;
          h.reviveRing.material.color.setHex(0x6effa1);
          h.reviveRing.scale.setScalar(1.0 + h.reviveProgress * 0.35);
          if (h.reviveProgress >= 1.5) {
            h.downed = false;
            h.reviveProgress = 0;
            h.reviveRing.visible = false;
            h.reviveRing.scale.setScalar(1);
            h.root.rotation.set(0, h.facing, 0);
            h.hp = Math.round(h.maxHp * 0.45);
            this.audio.sfxBerry();
            this.spawnParticles(h.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffe066, 20);
            this.spawnFloatingText(h.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '💖 REVIVED!', '#6effa1');
            this.showAlert(`💖 ${helper.def.name} revived ${h.def.name}!`, 2.2);
          }
        } else {
          h.reviveProgress = Math.max(0, h.reviveProgress - dt * 0.5);
          h.reviveRing.material.color.setHex(0xff5252);
          h.reviveRing.scale.setScalar(1.0 + Math.sin(t * 5) * 0.08);
        }
        return;
      }

      h.root.rotation.x = 0;
      h.reviveRing.visible = false;

      if (h.trappedByWeb) {
        h.webCocoon.visible = true;
        h.root.rotation.z = Math.sin(t * 18) * 0.12;
      } else {
        h.webCocoon.visible = false;
        h.root.rotation.z = 0;

        if (isP1) moveDir = this.getPlayerMoveInput(1);
        else if (isP2) moveDir = this.getPlayerMoveInput(2);
        else if (leader) {
          if (h.companionAtkCd > 0) h.companionAtkCd -= dt;
          // 1. Dodge active danger zones smartly
          let evading = false;
          for (const dz of this.dangerZones) {
            const away = h.pos.clone().sub(dz.pos);
            away.y = 0;
            const d = away.length();
            if (d < dz.radius + 1.2) {
              if (d > 0.05) moveDir.copy(away.normalize());
              else moveDir.set(1, 0, 0);
              moveSpeed = Math.max(moveSpeed, 9.5);
              evading = true;
              break;
            }
          }

          if (!evading) {
            const rallying = this.companionRallyTimer > 0;
            const spread = rallying ? 1.7 : 2.8;
            const angle = idx * 1.55 + 1.1;
            const targetPos = leader.pos.clone().add(new THREE.Vector3(Math.cos(angle) * spread, 0, Math.sin(angle) * spread + (rallying ? 0.6 : 1.2)));
            const toTarget = targetPos.sub(h.pos);
            toTarget.y = 0;
            const distToTarget = toTarget.length();

            if (distToTarget > 14 && !this.gates.some((gt) => !gt.opened && leader.pos.z < gt.blockZ && h.pos.z >= gt.blockZ)) {
              h.pos.copy(leader.pos).add(new THREE.Vector3((idx - 1.5) * 1.4, 0.5, 1.5));
              h.vel.set(0, 0, 0);
            } else if (distToTarget > (rallying ? 0.65 : 1.2)) {
              moveDir.copy(toTarget.normalize());
              moveSpeed = rallying ? Math.max(moveSpeed, leader.def.speed * 1.35) : Math.min(moveSpeed, leader.def.speed * 1.12);
            }

            // 2. Gentle combat assist during active fights (never opens gates!)
            if (!rallying && this.mode === 'playing' && h.companionAtkCd <= 0) {
              if (this.companionGentleAssist(h)) {
                h.companionAtkCd = 3.2 + (idx % 3) * 0.45;
              } else {
                h.companionAtkCd = 0.6;
              }
            }
          }
        }
      }

      if (moveDir.lengthSq() > 0.01) {
        h.vel.x = THREE.MathUtils.lerp(h.vel.x, moveDir.x * moveSpeed, Math.min(1, dt * 11));
        h.vel.z = THREE.MathUtils.lerp(h.vel.z, moveDir.z * moveSpeed, Math.min(1, dt * 11));
        h.facing = Math.atan2(moveDir.x, moveDir.z);
      } else {
        h.vel.x *= Math.pow(0.001, dt);
        h.vel.z *= Math.pow(0.001, dt);
      }

      h.vel.y -= 32 * dt;
      let nextZ = THREE.MathUtils.clamp(h.pos.z + h.vel.z * dt, this.levelMinZ ?? -260, this.levelMaxZ ?? 20);
      const xBounds = this.getCorridorXBounds(nextZ);
      let nextX = THREE.MathUtils.clamp(h.pos.x + h.vel.x * dt, xBounds.minX, xBounds.maxX);

      // Co-op shared-screen tether: neither player can leave the other's view!
      if (this.isCoop && (isP1 || isP2)) {
        const other = this.heroes[isP1 ? this.p2Hero : this.p1Hero];
        if (other && !other.downed) {
          const dx = nextX - other.pos.x;
          const dz = nextZ - other.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist > TUNING.coopMaxDistance) {
            const scale = TUNING.coopMaxDistance / dist;
            nextX = other.pos.x + dx * scale;
            nextZ = other.pos.z + dz * scale;
            const bClamp = this.getCorridorXBounds(nextZ);
            nextX = THREE.MathUtils.clamp(nextX, bClamp.minX, bClamp.maxX);
          }
        }
      }

      // Enforce full-span unskippable gates (cannot walk around, jump over, or bypass!)
      for (const gate of this.gates) {
        if (gate.opened) continue;
        if (h.pos.z >= gate.blockZ - 0.18 && nextZ < gate.blockZ && nextX >= gate.minX && nextX <= gate.maxX) {
          nextZ = gate.blockZ;
          h.vel.z = Math.max(0, h.vel.z);
          if (isP1 || isP2) this.showAlert(gate.hintText, 1.8);
        }
      }

      let blocked = false;
      for (const ob of this.obstacles) {
        if (!ob.active) continue;
        if (ob.type === 'magma_vent' && ob.cooledTimer > 0) continue;
        if (Math.hypot(nextX - ob.pos.x, nextZ - ob.pos.z) < ob.radius + 0.65) {
          blocked = true;
          if (ob.type === 'magma_vent' && h.hurtCd <= 0 && h.armorTimer <= 0) this.hurtHero(h, 12, 'hazard');
          if (isP1 || isP2) this.showAlert(ob.label, 1.8);
          break;
        }
      }

      const curFloor = this.getFloorHeightAt(h.pos.x, h.pos.z, isHyperJoshua || h.sprintBoostTimer > 0);
      const nextFloor = this.getFloorHeightAt(nextX, nextZ, isHyperJoshua || h.sprintBoostTimer > 0);
      if (nextFloor.steep && (isP1 || isP2) && nextZ < h.pos.z) {
        blocked = true;
        this.showAlert('Too steep! Use Joshua and Speedy!', 1.8);
      }
      const stepUpTol = h.onGround ? 0.55 : 0.08;
      // Prevent walking/falling horizontally into the side of a higher platform and popping up onto it!
      if (!blocked && nextFloor.onSolid && nextFloor.y > h.pos.y + stepUpTol) {
        blocked = true;
      }

      if (!blocked) { h.pos.x = nextX; h.pos.z = nextZ; }
      const floor = blocked ? curFloor : nextFloor;
      const prevY = h.pos.y;
      h.pos.y += h.vel.y * dt;

      if (floor.onSolid && prevY >= floor.y - stepUpTol && h.pos.y <= floor.y && h.vel.y <= 0) {
        h.pos.y = floor.y;
        h.vel.y = 0;
        h.onGround = true;
        if (this.isSafeStandingSpot(h.pos.x, h.pos.z, floor.y)) {
          h.lastSafePos.copy(h.pos);
        }
      } else {
        if (!floor.onSolid || h.pos.y > floor.y + 0.05) {
          h.onGround = false;
        }
        const safeBaseY = h.lastSafePos ? h.lastSafePos.y : 0;
        if (!floor.onSolid && h.pos.y < safeBaseY - 3.0) {
          const fallX = h.pos.x;
          const fallZ = h.pos.z;
          h.pos.copy(h.lastSafePos);
          h.pos.y += 0.15;
          h.vel.set(0, 0, 0);
          h.onGround = true;
          if (isP1 || isP2) {
            this.hurtHero(h, 10);
            this.showAlert(this.getFallHintForPosition(fallX, fallZ), 2.4);
          }
        }
      }

      if ((isP1 || isP2) && !h.trappedByWeb && h.armorTimer <= 0) {
        for (const w of this.webs) {
          if (w.active && w.trappedHeroIdx < 0 && h.pos.distanceTo(w.pos) < w.radius) {
            h.trappedByWeb = w;
            w.trappedHeroIdx = idx;
            this.audio.sfxWebTrap();
            this.showAlert('Stuck in a web! Swap hero!', 3.2);
            this.dialogue?.play('l1_hero_web').catch(() => {});
            break;
          }
        }
      }

      h.root.position.copy(h.pos);
      h.root.rotation.y = h.facing;
      const horizSpeed = Math.hypot(h.vel.x, h.vel.z);

      if (h.mixer) {
        h.mixer.update(dt);
        const moving = horizSpeed > 0.8 && !h.trappedByWeb;
        const sprinting = horizSpeed > 11.2 && h.runAction;
        if (h.walkAction) h.walkAction.setEffectiveWeight(moving && !sprinting ? 1 : 0);
        if (h.runAction) h.runAction.setEffectiveWeight(moving && sprinting ? 1 : 0);
      }

      // Bonded Meshy Baby Dragon Companion flying with lively hover & banking!
      h.dragonMesh.visible = bonded;
      if (bonded) {
        const targetD = h.pos.clone().add(new THREE.Vector3(
          Math.cos(t * 2.1 + idx) * 1.45,
          2.15 + Math.sin(t * 4.2 + idx) * 0.28,
          Math.sin(t * 2.1 + idx) * 1.45
        ));
        h.dragonMesh.position.lerp(targetD, Math.min(1, dt * 6));
        h.dragonMesh.rotation.y = h.facing;
        h.dragonMesh.rotation.z = Math.sin(t * 4.2 + idx) * 0.12;
      }
    });
  }

  hurtHero(hero, dmg, source = 'enemy') {
    if (!hero || hero.downed || hero.hurtCd > 0 || hero.armorTimer > 0) return;
    const diffCfg = this.getDifficultyConfig();
    const mult = source === 'boss' ? diffCfg.bossDmgMult : source === 'hazard' ? 1.0 : diffCfg.enemyDmgMult;
    const finalDmg = Math.max(1, Math.round(dmg * mult));
    hero.hp = Math.max(0, hero.hp - finalDmg);
    hero.hurtCd = this.difficulty === 'hard' ? 0.55 : 0.85;
    this.audio.sfxHurt();
    this.triggerShake(0.22, 0.15);
    this.spawnParticles(hero.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff5252, 10);
    this.spawnFloatingText(hero.pos.clone().add(new THREE.Vector3(0, 2.1, 0)), `-${finalDmg}`, '#ff6b6b');

    if (hero.hp <= 0) {
      if (!diffCfg.canLose) {
        // On Easy, heroes NEVER cause a Game Over — they stumble briefly and get right back up!
        const otherStanding = this.heroes.filter((h) => h !== hero && !h.downed);
        if (otherStanding.length === 0) {
          hero.hp = Math.round(hero.maxHp * 0.65);
          hero.hurtCd = 2.0;
          this.spawnFloatingText(hero.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 'UP AGAIN!', '#6effa1');
          this.updateHUD();
          return;
        }
        hero.downed = true;
        hero.autoGetUpTimer = 0;
        hero.reviveProgress = 0;
        if (hero.trappedByWeb) {
          hero.trappedByWeb.trappedHeroIdx = -1;
          hero.trappedByWeb = null;
          hero.webCocoon.visible = false;
        }
        if (hero.index === this.p1Hero) {
          const next = otherStanding.find((s) => !this.isCoop || s.index !== this.p2Hero) || otherStanding[0];
          this.p1Hero = next.index;
        } else if (this.isCoop && hero.index === this.p2Hero) {
          const next = otherStanding.find((s) => s.index !== this.p1Hero) || otherStanding[0];
          this.p2Hero = next.index;
        }
        this.showAlert(`${hero.def.name} needs a breather!`, 2.0);
        this.updateHUD();
        return;
      }

      hero.downed = true;
      hero.reviveProgress = 0;
      if (hero.trappedByWeb) {
        hero.trappedByWeb.trappedHeroIdx = -1;
        hero.trappedByWeb = null;
        hero.webCocoon.visible = false;
      }
      this.spawnFloatingText(hero.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), 'DOWN!', '#ff5252');

      // Check if ALL 4 heroes are downed -> GAME OVER (Medium / Hard only)
      const standing = this.heroes.filter((h) => !h.downed);
      if (standing.length === 0) {
        this.mode = 'gameover';
        this.audio.setMusicMode('overworld');
        document.getElementById('gameover-overlay').classList.remove('hidden');
        this.updateHUD();
        return;
      }

      // Auto-swap active player to a standing family member!
      if (hero.index === this.p1Hero) {
        const next = standing.find((s) => !this.isCoop || s.index !== this.p2Hero) || standing[0];
        this.p1Hero = next.index;
      } else if (this.isCoop && hero.index === this.p2Hero) {
        const next = standing.find((s) => s.index !== this.p1Hero) || standing[0];
        this.p2Hero = next.index;
      }
      this.showAlert(`${hero.def.name} is down! Revive them!`, 3.0);
      this.updateHUD();
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p) { this.projectiles.splice(i, 1); continue; }
      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
      if (Math.random() < 0.45) this.spawnParticles(p.pos, p.color, 1);

      let hit = false;
      if (p.fromBoss) {
        for (const h of this.heroes) {
          if (!h.downed && h.pos.distanceTo(p.pos) < p.radius + 0.85) {
            if (h.armorTimer > 0) {
              this.spawnParticles(p.pos, 0xc084fc, 14);
              this.spawnFloatingText(h.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '🛡️ BLOCKED!', '#d8b4fe');
            } else this.hurtHero(h, p.damage, 'boss');
            hit = true;
            break;
          }
        }
      } else {
        this.tryBreakNearbyWebs(p.pos, p.radius + 1.8);
        if (p.fromPlayer !== false) {
          for (const ob of this.obstacles) {
            if (!ob.active) continue;
            if (ob.pos.distanceTo(p.pos) < ob.radius + p.radius + 0.6) {
              const linkedGate = this.gates.find((gt) => !gt.opened && gt.obstacles.includes(ob));
              if (ob.type === 'bramble' && (p.kind === 'fire' || p.kind === 'inferno')) {
                if (linkedGate) this.openGate(linkedGate, 'Daniel burned the brambles!');
                else { ob.active = false; ob.mesh.visible = false; }
                this.spawnParticles(ob.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xff7043, 26);
                this.spawnFloatingText(ob.pos.clone().add(new THREE.Vector3(0, 2.0, 0)), '🔥 BURNED!', '#ff9f43');
                hit = true;
              } else if (ob.type === 'ice_barrier' && p.kind === 'inferno') {
                if (linkedGate) this.openGate(linkedGate, 'Daniel and Ember melted the ice!');
                else { ob.active = false; ob.mesh.visible = false; }
                this.spawnParticles(ob.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x80e8ff, 30);
                this.spawnFloatingText(ob.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), '🔥 MELTED!', '#80e8ff');
                hit = true;
              } else if (ob.type === 'ice_barrier' && p.kind === 'fire') {
                this.showAlert('Ask Daniel and Ember to melt it!', 2.0);
                hit = true;
              } else if (ob.type === 'magma_vent' && (p.kind === 'ice' || p.kind === 'glacial')) {
                if (linkedGate) this.openGate(linkedGate, 'Vanessa cooled the vents!');
                else ob.cooledTimer = 7.5;
                this.spawnParticles(ob.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x9cecff, 16);
                this.spawnFloatingText(ob.pos.clone().add(new THREE.Vector3(0, 2.0, 0)), '❄️ COOLED!', '#80e8ff');
                hit = true;
              }
            }
          }
        }
        if (!hit) {
          for (const en of this.enemies) {
            if (!en.dead && en.pos.distanceTo(p.pos) < p.radius + 1.1) {
              this.damageEnemy(en, p.damage, p.kind);
              hit = true;
              break;
            }
          }
        }
        if (!hit && this.boss && !this.boss.dead && this.boss.pos.distanceTo(p.pos) < p.radius + 2.5) {
          this.damageBoss(p.damage, p.kind, p.fromPlayer !== false);
          hit = true;
        }
      }
      if (hit || p.life <= 0) {
        this.worldGroup.remove(p.mesh);
        this.disposeObject3D(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateEnemies(dt) {
    const t = this.simTime;
    this.enemies.forEach((en) => {
      if (en.dead) return;
      // Update 3D enemy HP bar + Ice Cube visual!
      if (en.hpBg && en.hpFill) {
        const showHp = en.hp < en.maxHp;
        en.hpBg.visible = showHp;
        en.hpFill.visible = showHp;
        if (showHp) {
          const ratio = Math.max(0.01, en.hp / en.maxHp);
          en.hpFill.scale.x = ratio;
          en.hpFill.position.x = -(1 - ratio) * 0.71;
          en.hpBg.lookAt(this.camera.position);
          en.hpFill.lookAt(this.camera.position);
        }
      }
      if (en.iceCube) en.iceCube.visible = en.frozenTimer > 0;

      if (en.frozenTimer > 0) {
        en.frozenTimer -= dt;
        en.mesh.scale.setScalar(1.0 + Math.sin(t * 25) * 0.02);
        return;
      }
      en.mesh.scale.setScalar(1.0);
      if (en.attackCd > 0) en.attackCd -= dt;

      let target = this.heroes[this.p1Hero];
      if (en.type === 'spider') {
        const trapped = this.heroes.find((h) => !h.downed && h.trappedByWeb);
        if (trapped && trapped.pos.distanceTo(en.pos) < 18) target = trapped;
      } else if (this.isCoop) {
        const h1 = this.heroes[this.p1Hero], h2 = this.heroes[this.p2Hero];
        if (!h2.downed && h2.pos.distanceTo(en.pos) < h1.pos.distanceTo(en.pos)) target = h2;
      }
      if (!target || target.downed) return;

      const dist = target.pos.distanceTo(en.pos);
      if (dist < 16 && dist > 1.35) {
        const dir = target.pos.clone().sub(en.pos);
        dir.y = 0;
        dir.normalize();
        en.pos.addScaledVector(dir, en.speed * dt);
        en.mesh.position.set(en.pos.x, en.pos.y + Math.abs(Math.sin(t * 9 + en.phase)) * 0.18, en.pos.z);
        en.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        en.mesh.rotation.z = Math.sin(t * 9 + en.phase) * 0.08;
      }

      if (dist <= 1.75 && en.attackCd <= 0) {
        en.attackCd = 1.25;
        if (en.type === 'spider' && target.trappedByWeb) {
          this.hurtHero(target, 6);
          this.spawnFloatingText(target.pos.clone().add(new THREE.Vector3(0, 2.3, 0)), 'HAHAHA! 🕷️', '#e0aaff');
          this.showAlert(`🕷️ Hehe! Tickling Spider is tickling ${target.def.name}! Swap hero to rescue!`, 1.8);
        } else {
          this.hurtHero(target, 11);
        }
      }
    });
  }

  updateBoss(dt) {
    const b = this.boss;
    if (!b) return;
    const t = this.simTime;

    // Freed guardian stays in the arena, happy and friendly!
    if (b.dead && b.freed) {
      const p1 = this.heroes[this.p1Hero];
      if (p1) {
        const dx = p1.pos.x - b.pos.x;
        const dz = p1.pos.z - b.pos.z;
        if (dx * dx + dz * dz > 0.2) b.mesh.rotation.y = Math.atan2(dx, dz);
      }
      b.mesh.position.set(b.pos.x, b.pos.y + Math.abs(Math.sin(t * 2.6)) * 0.22, b.pos.z);
      if (b.auraRing) b.auraRing.rotation.z += dt * 0.8;
      return;
    }
    if (b.dead) return;

    let target = this.heroes[this.p1Hero] && !this.heroes[this.p1Hero].downed
      ? this.heroes[this.p1Hero]
      : this.heroes.find((h) => !h.downed) || this.heroes[0];
    if (this.isCoop) {
      const h1 = this.heroes[this.p1Hero];
      const h2 = this.heroes[this.p2Hero];
      if (h2 && !h2.downed && (!h1 || h1.downed || h2.pos.distanceTo(b.pos) < h1.pos.distanceTo(b.pos))) {
        target = h2;
      }
    }
    if (!target) return;
    const dist = target.pos.distanceTo(b.pos);

    if (!b.activated && dist < 22) {
      b.activated = true;
      this.audio.setMusicMode('boss');
      document.getElementById('boss-hud').classList.remove('hidden');
      this.updateBossHUD();
      this.triggerShake(0.38, 0.35);
      this.showAlert(`Free the guardian: ${b.name}!`, 2.6);
    }
    if (!b.activated) return;

    if (b.iceImmunityTimer > 0) b.iceImmunityTimer = Math.max(0, b.iceImmunityTimer - dt);
    if (b.slowTimer > 0) b.slowTimer = Math.max(0, b.slowTimer - dt);

    b.timeSinceLastAction += dt;
    if (b.timeSinceLastAction > b.maxActionGap) b.maxActionGap = b.timeSinceLastAction;

    if (b.frozenTimer > 0) {
      b.frozenTimer = Math.max(0, b.frozenTimer - dt);
      b.continuousFrozenTime += dt;
      if (b.continuousFrozenTime > b.maxContinuousFrozenTime) {
        b.maxContinuousFrozenTime = b.continuousFrozenTime;
      }
      if (b.continuousFrozenTime >= TUNING.maxBossIceHold) {
        b.frozenTimer = 0;
      }
      // Subtle shiver visual while chilled; attackTimer still ticks slowly so action cadence stays <= 6s
      b.attackTimer -= dt * 0.5;
      b.mesh.position.set(b.pos.x + Math.sin(t * 35) * 0.08, b.pos.y, b.pos.z);
      return;
    }
    b.continuousFrozenTime = 0;

    const speedMult = b.slowTimer > 0 ? TUNING.bossIceSlowFactor : 1.0;

    const toHero = target.pos.clone().sub(b.pos);
    toHero.y = 0;
    const len = toHero.length();
    if (len > 0.1) {
      toHero.normalize();
      b.mesh.rotation.y = Math.atan2(toHero.x, toHero.z);
    }

    if (b.charging > 0) {
      b.charging -= dt;
      b.pos.addScaledVector(b.chargeVec, 11.5 * speedMult * dt);
    } else if (len > 3.2) {
      b.pos.addScaledVector(toHero, (b.type === 'black_dragon' ? 4.8 : 3.8) * speedMult * dt);
    }
    b.pos.x = THREE.MathUtils.clamp(b.pos.x, -12, 12);
    b.pos.z = THREE.MathUtils.clamp(b.pos.z, b.home.z - 12, b.home.z + 12);
    const hoverY =
      b.type === 'black_dragon'
        ? Math.sin(t * 3.0) * 0.75 + 0.65
        : b.type === 'gargoyle' && b.swoopTimer > 0
          ? 5.8
          : Math.abs(Math.sin(t * 5)) * 0.18;
    b.mesh.position.set(b.pos.x, b.pos.y + hoverY, b.pos.z);

    if (b.swoopTimer > 0) b.swoopTimer -= dt;
    if (!b.swoopTimer || b.swoopTimer <= 0) {
      for (const h of this.heroes) {
        if (!h.downed && h.pos.distanceTo(b.pos) < 3.1) {
          this.hurtHero(h, 15, 'boss');
        }
      }
    }

    const enraged = b.hp < b.maxHp * 0.5;
    const diffCfg = this.getDifficultyConfig();
    b.attackTimer -= dt;
    if (b.attackTimer <= 0) {
      b.timeSinceLastAction = 0;
      b.actionCount++;
      const baseInterval = b.type === 'black_dragon' ? (enraged ? 2.1 : 2.6) : enraged ? 2.4 : 3.0;
      b.attackTimer = Math.min(TUNING.bossMaxActInterval, baseInterval * diffCfg.bossAttackIntervalMult);
      b.attackCycle = (b.attackCycle || 0) + 1;

      if (b.type === 'bear') {
        if (b.attackCycle % 2 === 0) {
          // Telegraphed Ground-Pound Shockwave Ring (jump or dash out!)
          this.spawnDangerZone(b.pos.x, b.pos.z, b.pos.y, 5.4, 1.05, 18, 0xff5252);
          this.spawnFloatingText(b.pos.clone().add(new THREE.Vector3(0, 3.8, 0)), '⚠️ BEAR SLAM! JUMP!', '#ff8a80');
        } else {
          b.chargeVec.copy(toHero);
          b.charging = 0.9;
          this.audio.sfxSmash();
          this.triggerShake(0.28, 0.2);
        }
      } else if (b.type === 'vine') {
        // 3 Erupting Root Danger Zones beneath heroes!
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * 3.4;
          this.spawnDangerZone(target.pos.x + ox, target.pos.z + (i === 1 ? 0 : -1.8), b.pos.y, 2.5, 1.15, 15, 0x69f0ae);
        }
        this.spawnFloatingText(b.pos.clone().add(new THREE.Vector3(0, 4.0, 0)), '🌿 VINE ERUPTION!', '#69f0ae');
      } else if (b.type === 'magma') {
        // Molten Lava Pools + Fireball!
        this.spawnDangerZone(target.pos.x, target.pos.z, b.pos.y, 3.3, 1.1, 17, 0xff6d00);
        this.spawnProjectile({
          fromBoss: true, kind: 'boss_blast',
          pos: b.pos.clone().add(new THREE.Vector3(0, 2.2, 0)),
          vel: toHero.clone().multiplyScalar(13), radius: 0.95, damage: 14, color: 0xff5722, life: 2.6,
        });
      } else if (b.type === 'yeti') {
        // 3-Way Rolling Snowball Barrage + Frost Slam!
        [-0.32, 0, 0.32].forEach((ang) => {
          const d = toHero.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
          this.spawnProjectile({
            fromBoss: true, kind: 'boss_blast',
            pos: b.pos.clone().add(new THREE.Vector3(0, 2.1, 0)),
            vel: d.multiplyScalar(14), radius: 0.9, damage: 14, color: 0x9cecff, life: 2.6,
          });
        });
        if (b.attackCycle % 2 === 0) this.spawnDangerZone(b.pos.x, b.pos.z, b.pos.y, 5.2, 1.0, 16, 0x5ce1ff);
      } else if (b.type === 'gargoyle') {
        // Sky Swoop Dive! Rises into air, marks target shadow, dives!
        b.swoopTimer = 1.15;
        this.spawnDangerZone(target.pos.x, target.pos.z, b.pos.y, 3.8, 1.15, 18, 0xb388ff);
        this.spawnFloatingText(b.pos.clone().add(new THREE.Vector3(0, 4.5, 0)), '🦅 GARGOYLE SWOOP!', '#d8b4fe');
      } else if (b.type === 'black_dragon') {
        // GREAT BLACK DRAGON: 2-Phase Epic Final Boss!
        if (enraged && b.attackCycle % 2 === 0) {
          // Phase 2 Meteor Rain!
          this.showAlert('🔥 ENRAGED DRAGON METEOR RAIN! Shield with Michael [4+K] or dodge!', 2.2);
          for (let m = 0; m < 4; m++) {
            const mx = target.pos.x + (Math.random() - 0.5) * 11;
            const mz = target.pos.z + (Math.random() - 0.5) * 9;
            this.spawnDangerZone(mx, mz, b.pos.y, 3.1, 1.2, 20, 0xff3d00);
          }
        } else {
          // Sweeping Dragonfire Breath Volley!
          this.spawnDangerZone(target.pos.x, target.pos.z, b.pos.y, 3.8, 1.15, 20, 0xff3d00);
          const spread = enraged ? [-0.45, -0.22, 0, 0.22, 0.45] : [-0.32, 0, 0.32];
          spread.forEach((ang) => {
            const d = toHero.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
            this.spawnProjectile({
              fromBoss: true, kind: 'boss_blast',
              pos: b.pos.clone().add(new THREE.Vector3(0, 2.8, 0)),
              vel: d.multiplyScalar(14.5), radius: 0.9, damage: 18, color: 0xff3d00, life: 2.8,
            });
          });
        }
      }
      this.audio.sfxFire();
    }
  }

  checkPickupsAndObjectives(dt) {
    const t = this.simTime;
    const activeHeroes = this.isCoop ? [this.heroes[this.p1Hero], this.heroes[this.p2Hero]] : [this.heroes[this.p1Hero]];

    this.bushes.forEach((bush) => {
      if (bush.harvested) return;
      for (const h of activeHeroes) {
        if (h.pos.distanceTo(bush.pos) < 2.2) {
          bush.harvested = true;
          if (bush.mesh.userData.berryGroup) bush.mesh.userData.berryGroup.visible = false;
          if (bush.berryType === 'red') {
            this.inventory.red = Math.min(this.inventory.maxRed, this.inventory.red + bush.berriesLeft);
            this.spawnFloatingText(bush.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), `+${bush.berriesLeft} RED BERRIES 🍒`, '#ff758f');
            this.showAlert(`🍒 Stored +${bush.berriesLeft} Red Berries in Pouch! Press [R] to heal.`, 2.2);
          } else {
            this.inventory.green = Math.min(this.inventory.maxGreen, this.inventory.green + bush.berriesLeft);
            this.spawnFloatingText(bush.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), `+${bush.berriesLeft} GREEN BERRIES 🫐`, '#6effa1');
            this.showAlert(`🫐 Stored +${bush.berriesLeft} Green Berries in Pouch! Press [G] for Magic Surge.`, 2.2);
          }
          this.audio.sfxBerry();
          this.spawnParticles(bush.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), bush.berryType === 'red' ? 0xff4d6d : 0x4cff88, 16);
          break;
        }
      }
    });

    this.goldBerries.forEach((gb) => {
      if (gb.collected) return;
      gb.mesh.rotation.y += dt * 2.2;
      gb.mesh.position.y = gb.pos.y + Math.sin(t * 3.0) * 0.22;
      for (const h of activeHeroes) {
        if (h.pos.distanceTo(gb.pos) < 2.0) {
          gb.collected = true;
          gb.mesh.visible = false;
          this.collectedGoldIds.add(gb.id);
          this.inventory.gold = this.collectedGoldIds.size;
          this.persistSave();
          this.audio.sfxGoldBerry();
          this.spawnParticles(gb.pos, 0xffd700, 26);
          this.spawnFloatingText(gb.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '🌟 GOLD BERRY!', '#ffe57f');
          this.showAlert(`🌟 Secret Gold Berry Found! (${this.inventory.gold}/18 — Saved & decorates the Festival!)`, 3.0);
          break;
        }
      }
    });

    if (this.reneeObj && !this.reneeObj.greeted) {
      for (const h of activeHeroes) {
        if (h.pos.distanceTo(this.reneeObj.pos) < 10.0) {
          this.reneeObj.greeted = true;
          this.dialogue?.play('l6_renee_welcome').catch(() => {});
          break;
        }
      }
    }

    if (this.keeperObj && !this.levelGoalTriggered && this.boss && this.boss.dead) {
      for (const h of activeHeroes) {
        if (h.pos.distanceTo(this.keeperObj.pos) < 3.4) {
          this.levelGoalTriggered = true;
          this.completedLevels.add(0);
          this.highestLevel = Math.max(this.highestLevel, 1);
          this.persistSave();
          this.audio.sfxVictory();
          this.dialogue?.play('l1_keeper_reunion').catch(() => {});
          this.showStoryModal(LEVEL_DEFS[0].outroStory, () => this.startLevel(1, true));
          break;
        }
      }
    }

    if (this.eggObj && !this.eggObj.hatched) {
      const def = LEVEL_DEFS[this.currentLevelIdx];
      const targetHeroObj = def.eggHeroIndex !== null ? this.heroes[def.eggHeroIndex] : this.heroes[this.p1Hero];
      const heroDist = targetHeroObj ? targetHeroObj.pos.distanceTo(this.eggObj.pos) : 99;
      const prox = THREE.MathUtils.clamp(1 - heroDist / 22, 0, 1);
      this.eggObj.glowIntensity = 1.0 + prox * 3.5;

      this.eggObj.mesh.rotation.y += dt * (1.4 + prox * 3.2);
      this.eggObj.mesh.position.y = this.eggObj.pos.y + Math.sin(t * (2.8 + prox * 6.0)) * (0.22 + prox * 0.12);
      this.eggObj.mesh.position.x = this.eggObj.pos.x + (prox > 0.2 ? Math.sin(t * 22) * 0.08 * prox : 0);
      if (this.eggObj.halo) {
        this.eggObj.halo.scale.setScalar(1.0 + prox * 0.65);
        this.eggObj.halo.material.opacity = 0.55 + prox * 0.45;
      }
      if (this.goalAccentLight) {
        this.goalAccentLight.intensity = 2.0 + prox * 5.0;
      }

      if (this.boss && this.boss.dead) {
        if (def.index === 1 && !this.eggObj.nearLineSpoken && heroDist < 16) {
          this.eggObj.nearLineSpoken = true;
          this.dialogue?.play('l2_keeper_near_egg').catch(() => {});
        }
        for (const h of activeHeroes) {
          if (h.pos.distanceTo(this.eggObj.pos) < 2.8) {
            if (h.index === def.eggHeroIndex) {
              this.startEggHatchCutscene(def.eggHeroIndex, def);
            } else {
              const targetHero = HERO_DEFS[def.eggHeroIndex];
              this.showAlert(`Swap to ${targetHero.name} for this egg!`, 2.6);
            }
            break;
          }
        }
      }
    }
  }

  updateCamera(dt) {
    const h1 = this.heroes[this.p1Hero];
    if (!h1) return;
    let focus = h1.pos.clone();
    let zoomExtra = 0;

    if (this.isCoop) {
      const h2 = this.heroes[this.p2Hero];
      if (h2) {
        focus.add(h2.pos).multiplyScalar(0.5);
        zoomExtra = Math.min(16, h1.pos.distanceTo(h2.pos) * 0.85);
      }
    }

    this.cameraTarget.lerp(focus, Math.min(1, dt * 6));
    const desiredCam = new THREE.Vector3(
      this.cameraTarget.x,
      this.cameraTarget.y + 15.2 + zoomExtra * 0.75,
      this.cameraTarget.z + 15.5 + zoomExtra * 0.7
    );
    this.camera.position.lerp(desiredCam, Math.min(1, dt * 5));

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
    }

    this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y + 1.0, this.cameraTarget.z - 1.8);
    if (this.skyMesh) this.skyMesh.position.copy(this.camera.position);
    this.dirLight.position.set(this.cameraTarget.x + 22, 40, this.cameraTarget.z + 20);
    this.dirLight.target.position.copy(this.cameraTarget);
  }

  updateBossHUD() {
    if (!this.boss) return;
    document.getElementById('boss-name').textContent = this.boss.name;
    const pct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
    document.getElementById('boss-hp-fill').style.width = `${pct}%`;
    document.getElementById('boss-phase-tag').textContent = pct < 45 ? 'ENRAGED!' : 'BOSS';
  }

  updateHUD() {
    document.getElementById('hud-magic-text').textContent = `${Math.floor(this.magic)} / ${this.maxMagic}`;
    document.getElementById('hud-magic-fill').style.width = `${(this.magic / this.maxMagic) * 100}%`;
    document.getElementById('hud-magic-boost').classList.toggle('hidden', this.magicBoostTimer <= 0);

    document.getElementById('count-red').textContent = this.inventory.red;
    document.getElementById('count-green').textContent = this.inventory.green;
    document.getElementById('count-gold').textContent = this.inventory.gold;

    this.heroes.forEach((h, i) => {
      const card = document.getElementById(`card-hero-${i}`);
      const ptag = document.getElementById(`ptag-${i}`);
      const hpBar = document.getElementById(`hp-${i}`);
      const abil = document.getElementById(`ability-${i}`);
      const badge = document.getElementById(`dragon-badge-${i}`);
      const trap = document.getElementById(`trap-${i}`);

      const isP1 = i === this.p1Hero;
      const isP2 = this.isCoop && i === this.p2Hero;
      card.classList.toggle('active-p1', isP1);
      card.classList.toggle('active-p2', isP2);

      if (isP1) { ptag.textContent = 'P1'; ptag.className = 'player-tag'; }
      else if (isP2) { ptag.textContent = 'P2'; ptag.className = 'player-tag p2-tag'; }
      else ptag.className = 'player-tag hidden';

      const pct = Math.max(0, (h.hp / h.maxHp) * 100);
      hpBar.style.width = `${pct}%`;
      hpBar.classList.toggle('low', pct < 32);

      const bonded = this.bondedDragons[i];
      abil.textContent = bonded ? h.def.upgradedAbility : h.def.baseAbility;
      badge.className = bonded ? 'dragon-badge bonded' : 'dragon-badge locked';
      badge.textContent = bonded ? h.def.dragonEmoji : '🥚';
      card.classList.toggle('is-downed', h.downed);
      if (h.downed) {
        trap.textContent = '💔 DOWNED! REVIVE!';
        trap.className = 'trapped-overlay downed-state';
      } else if (h.trappedByWeb) {
        trap.textContent = '🕸️ TICKLED! SWAP!';
        trap.className = 'trapped-overlay';
      } else {
        trap.className = 'trapped-overlay hidden';
      }
    });

    // Update on-screen active hero combat action bar!
    const p1 = this.heroes[this.p1Hero];
    if (p1) {
      const b = this.bondedDragons[p1.index];
      const primaryLabels = [
        b ? '⚡ Hyper Wind Slash' : '⚡ Wind Dash Strike',
        b ? '🔥 Inferno Blast' : '🔥 Fireball / Flame Swipe',
        b ? '❄️ Glacial Surge' : '❄️ Ice Blast / Frost Wave',
        b ? '💥 Titan Ground Slam' : '💪 Heavy Ground Slam',
      ];
      const specialLabels = [
        b ? '🌪️ Hyper-Speed Burst' : '💨 Speed Sprint',
        b ? '☄️ Inferno Blast' : '🔥 Fireball',
        b ? '🌉 Freeze Ice Bridge' : '❄️ Ice Blast',
        b ? '🛡️ Invincible Armor' : '💪 Heavy Slam',
      ];
      const pEl = document.getElementById('cb-primary-name');
      const sEl = document.getElementById('cb-special-name');
      if (pEl) pEl.textContent = primaryLabels[p1.index];
      if (sEl) sEl.textContent = specialLabels[p1.index];
    }

    document.getElementById('controls-strip').textContent = this.isCoop
      ? '2P: Stick Move • A Jump • X Gift • Y Swap'
      : 'Stick Move • A Jump • X Gift • Y Swap • C Call';
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  step(seconds, dt = 1 / 60, doRender = true) {
    this.manualStepping = true;
    const steps = Math.max(1, Math.round(seconds / dt));
    for (let i = 0; i < steps; i++) {
      this.update(dt);
    }
    if (doRender) this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.manualStepping) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

window.game = new DragonQuestGame();
