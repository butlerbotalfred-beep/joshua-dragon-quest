// The Royal Dragon Rescue: every tuning number lives in this file.
// Nothing here draws or moves anything. Change a number here and the whole
// game follows it.

export const GRAVITY = 32;
export const STEP = 1 / 60;          // fixed game step, in seconds
export const STEP_UP = 0.6;          // tallest ledge a hero can walk up
export const FALL_DEPTH = 6;         // how far below the path a hero falls before being put back

// The four family members. Index order is fixed: 0 Joshua, 1 Daniel, 2 Vanessa, 3 Michael.
export const HEROES = [
  {
    id: 'joshua', name: 'Joshua', gift: 'speed', icon: '⚡', color: 0x2ecc71, css: '#2ecc71',
    dragon: { key: 'speedy', name: 'Speedy', color: 0x39e58c },
    height: 1.5, speed: 10.5, jump: 11.2, maxHp: 100,
    giftCooldown: 0.7, giftDamage: 34,
    dash: { speed: 20, time: 0.5, bondedSpeed: 24, bondedTime: 0.5, hitRadius: 2.2 },
  },
  {
    id: 'daniel', name: 'Daniel', gift: 'fire', icon: '🔥', color: 0xe74c3c, css: '#e74c3c',
    dragon: { key: 'ember', name: 'Ember', color: 0xff5238 },
    height: 1.3, speed: 7.2, jump: 11.2, maxHp: 100,
    giftCooldown: 0.5, giftDamage: 22,
    bolt: { speed: 20, radius: 0.6, bondedRadius: 0.95, life: 1.1 },
  },
  {
    id: 'vanessa', name: 'Vanessa', gift: 'ice', icon: '❄️', color: 0x38b6ff, css: '#38b6ff',
    dragon: { key: 'frosty', name: 'Frosty', color: 0x5ce1ff },
    height: 1.82, speed: 7.6, jump: 11.2, maxHp: 100,
    giftCooldown: 0.55, giftDamage: 22,
    bolt: { speed: 20, radius: 0.6, bondedRadius: 0.95, life: 1.1 },
  },
  {
    id: 'michael', name: 'Michael', gift: 'strength', icon: '💪', color: 0x9b59b6, css: '#9b59b6',
    dragon: { key: 'samson', name: 'Samson', color: 0xb76eff },
    height: 1.98, speed: 7.0, jump: 11.2, maxHp: 100,
    giftCooldown: 0.7, giftDamage: 32,
    slam: { reach: 2.2, radius: 3.3, bondedRadius: 4.0 },
  },
];

export const GIFT_OF_HERO = HEROES.map((h) => h.gift);
export const HERO_OF_GIFT = { speed: 0, fire: 1, ice: 2, strength: 3 };

// Difficulty. Easy is for a six-year-old: nobody can lose. Hard is for an early teen.
export const DIFFICULTY = {
  easy: {
    label: 'Easy', stars: 1,
    canLose: false,              // heroes always get back up
    damageTaken: 0.35,           // multiplier on every hit a hero takes
    dizzyTime: 1.6,              // a knocked hero sits dizzy this long, then is up with full health
    guardianKnots: 12,           // spell knots to break in a guardian fight
    guardianCycle: 5.0,          // seconds from one guardian attack to the next
    guardianTelegraph: 1.6,      // warning time before an attack lands
    guardianContact: 0,          // damage per second for standing against a guardian
    finalKnots: 17,              // the meeting with the Great Black Dragon
    enemyHp: 1.0, enemySpeed: 0.8, enemyWindup: 0.8,
    hintDelay: 20,
    leapAssist: 'auto',          // Joshua's long leap happens by itself when he runs at the edge
    autoHop: true,               // small gaps are hopped by themselves too
    aimCone: 1.1,                // how far off a hero may face and still hit (radians)
    giftPower: 1.3,              // multiplier on gift damage
    chaserSpeed: 8.6,            // the thing Joshua must outrun
    guardianKeepAway: 5.0,       // a guardian stops this far from a hero
    guardianSpeed: 1.0,
    fallDamage: 0,
    webAutoFree: 45,             // a webbed hero is freed by the family after this long
    companionsRevive: true,
  },
  medium: {
    label: 'Medium', stars: 2,
    canLose: true,
    damageTaken: 0.9,
    dizzyTime: 0,
    guardianKnots: 14,
    guardianCycle: 4.2,
    guardianTelegraph: 1.2,
    guardianContact: 8,
    finalKnots: 20,
    enemyHp: 1.4, enemySpeed: 1.0, enemyWindup: 0.6,
    hintDelay: 20,
    leapAssist: 'press',         // Joshua's long leap needs a jump or gift press near the edge
    autoHop: false,
    aimCone: 0.7,
    giftPower: 1.0,
    chaserSpeed: 9.0,
    guardianKeepAway: 3.6,
    guardianSpeed: 1.0,
    fallDamage: 5,
    webAutoFree: 0,
    companionsRevive: true,
  },
  hard: {
    label: 'Hard', stars: 3,
    canLose: true,
    damageTaken: 1.7,
    dizzyTime: 0,
    guardianKnots: 16,
    guardianCycle: 3.4,
    guardianTelegraph: 0.85,
    guardianContact: 40,
    finalKnots: 24,
    enemyHp: 1.9, enemySpeed: 1.2, enemyWindup: 0.45,
    hintDelay: 20,
    leapAssist: 'none',          // a real running jump
    autoHop: false,
    aimCone: 0.3,
    giftPower: 1.0,
    chaserSpeed: 9.2,
    guardianKeepAway: 0,         // walks right up to a hero
    guardianSpeed: 1.6,
    fallDamage: 12,
    webAutoFree: 0,
    companionsRevive: false,
  },
};
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

// Guardian fights. A guardian is wrapped in spell knots. Each knot takes
// `knotHp` of gift damage to break, and at most one knot can break between two
// guardian attacks. That makes the length of a fight follow the number of
// knots and the attack cycle, not how hard a hero hits.
export const FIGHT = {
  knotHp: 100,
  companionShareCap: 0.2,        // companions can do at most this share of any one knot
  strikeDamage: 30,              // before the difficulty multiplier
  iceSlow: 0.55,                 // guardian walks at this share of its speed while chilled
  iceSlowTime: 2.5,
  iceHold: 0.8,                  // an ice hit can hold a guardian still this long...
  iceHoldImmunity: 5.0,          // ...and then not again for this long
  jumpClears: 0.9,               // a hero this high off the ground is over a ground attack
  startDelay: 2.0,               // seconds between entering the arena and the first warning
  weaknessBonus: 1.25,
};

export const GUARDIANS = {
  bear: {
    name: 'Great Bear', model: 'grizzly_bear', height: 3.6, radius: 2.2, speed: 4.0, color: 0x8d5a2b,
    icon: '🐻', weak: null, attacks: ['slam', 'charge'],
  },
  vine: {
    name: 'Old Vine', model: 'vine_monster', height: 4.4, radius: 2.3, speed: 2.2, color: 0x2e8b3d,
    icon: '🌿', weak: 'fire', attacks: ['spots', 'slam'],
  },
  magma: {
    name: 'Ember Golem', model: 'magma_golem', height: 4.2, radius: 2.3, speed: 3.2, color: 0xff6d00,
    icon: '🌋', weak: 'ice', attacks: ['spots', 'shots'],
  },
  yeti: {
    name: 'Yeti', model: 'yeti', height: 4.5, radius: 2.3, speed: 3.6, color: 0x9cecff,
    icon: '⛄', weak: 'fire', attacks: ['shots', 'slam'],
  },
  gargoyle: {
    name: 'Stone Gargoyle', model: 'stone_gargoyle', height: 4.3, radius: 2.2, speed: 4.2, color: 0xb388ff,
    icon: '🗿', weak: 'strength', attacks: ['swoop', 'spots'],
  },
  black_dragon: {
    name: 'Great Black Dragon', model: 'great_black_dragon', height: 6.4, radius: 3.0, speed: 3.4, color: 0xff3d00,
    icon: '🐉', weak: null, attacks: ['shots', 'spots', 'slam'], final: true,
  },
};

// Guardian attack shapes. Every one is shown on the ground before it lands.
export const ATTACKS = {
  slam: { kind: 'ring', radius: 6.5, at: 'self' },
  spots: { kind: 'ring', radius: 3.0, at: 'heroes', count: 3 },
  swoop: { kind: 'ring', radius: 4.0, at: 'target', moveTo: true },
  charge: { kind: 'line', length: 15, width: 4.0 },
  shots: { kind: 'shots', count: 3, spread: 0.5, speed: 9, radius: 0.8 },     // they roll along the ground: step aside or jump
};

// Small spellbound creatures. Beaten ones are freed and scamper off.
export const ENEMIES = {
  wolf: { model: 'wild_wolf', height: 1.3, hp: 60, speed: 5.4, damage: 12, aggro: 12, icon: '🐺' },
  spider: { model: 'tickling_spider', height: 1.1, hp: 44, speed: 4.2, damage: 6, aggro: 11, icon: '🕷️' },
  sprout: { model: 'vine_monster', height: 1.7, hp: 66, speed: 2.6, damage: 12, aggro: 10, icon: '🌱' },
  pebble: { model: 'magma_golem', height: 1.7, hp: 80, speed: 3.2, damage: 14, aggro: 10, icon: '🪨' },
  imp: { model: 'stone_gargoyle', height: 1.6, hp: 70, speed: 4.8, damage: 13, aggro: 12, icon: '🦇' },
};

export const COMPANIONS = {
  followDistance: 3.0,
  catchUpDistance: 13,           // farther than this, a companion pops to the leader
  attackEvery: 2.5,              // seconds between a companion's gentle attacks
  attackDamage: 5,
  enemyDamage: 8,
  damageTaken: 0.5,              // companions are sturdier than the player
};

export const RUN_GATE = {
  triggerDepth: 2.0,             // the chase starts when a hero is this far in
  slideSpeed: 8.6,               // a steep slope pushes everyone back this fast: only Joshua gains ground
  doorSpeed: 8.9,                // the closing door allows for a runner this fast, and no slower
};
export const LEAP_GATE = { length: 10.5 };     // wider than a normal jump, narrower than a running leap
export const HOP_GAP = { length: 3.5 };        // a gap anyone can jump
export const BRIDGE_GATE = { length: 21 };     // wider than any leap

export const CO_OP = { maxApartX: 17, maxApartZ: 11 };   // two players never leave each other's view

export const PICKUPS = { bushHeal: 30, reach: 2.0 };
export const WEB = { radius: 1.5, freeReach: 2.2, freeTime: 1.0 };
export const REVIVE = { reach: 2.5, time: 2.5 };

export const SAVE_KEY = 'royal_dragon_rescue_save_v1';

// Level order and names. Level 0 is the prologue, 7 is the festival.
export const LEVEL_NAMES = ['Festival Morning', 'The Great Woods', 'Treetop Canopy', 'Scorched Caverns', 'Frostpeak Ridge', 'The Craglands', 'Beneath the Castle', 'The Festival'];
