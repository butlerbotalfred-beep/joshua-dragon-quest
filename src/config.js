// ============================================================================
// Centralized Difficulty & Gameplay Tuning Configuration
// ============================================================================

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    shortDesc: 'Never lose',
    canLose: false,           // On Easy nobody can lose; heroes always get back up
    enemyDmgMult: 0.45,
    bossDmgMult: 0.45,
    bossHpMult: 1.0,
    bossAttackIntervalMult: 1.15,
    autoGetUpDelay: 1.8,      // Downed hero bounces back up automatically on Easy
    hintDelaySeconds: 20,
    companionDmgShareCap: 0.22,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    shortDesc: 'Balanced adventure',
    canLose: true,
    enemyDmgMult: 1.0,
    bossDmgMult: 1.0,
    bossHpMult: 1.15,
    bossAttackIntervalMult: 0.95,
    autoGetUpDelay: 0,
    hintDelaySeconds: 20,
    companionDmgShareCap: 0.22,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    shortDesc: 'Teen challenge',
    canLose: true,
    enemyDmgMult: 2.0,
    bossDmgMult: 2.6,         // Idle player beside a guardian is defeated within 30s
    bossHpMult: 1.3,
    bossAttackIntervalMult: 0.72,
    autoGetUpDelay: 0,
    hintDelaySeconds: 20,
    companionDmgShareCap: 0.20,
  },
};

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export const GUARDIAN_HP = {
  bear: 1220,
  vine: 1280,
  magma: 1320,
  yeti: 1360,
  gargoyle: 1400,
  black_dragon: 1780,
};

export const HERO_COMBAT = [
  // 0: Joshua
  { cd: 0.50, dmg: 10.5, bondedDmg: 12.0, magicCost: 0, fallbackDmg: 10.5 },
  // 1: Daniel
  { cd: 0.52, dmg: 11.5, bondedDmg: 13.0, magicCost: 6, fallbackDmg: 9.5 },
  // 2: Vanessa
  { cd: 0.52, dmg: 11.0, bondedDmg: 12.5, magicCost: 6, fallbackDmg: 9.5 },
  // 3: Michael
  { cd: 0.56, dmg: 12.0, bondedDmg: 13.5, magicCost: 0, fallbackDmg: 12.0 },
];

export const TUNING = {
  // Guardian fight targets (Easy: 45-90s, guardian acts <= every 6s, ice hold <= 1.5s)
  maxBossIceHold: 1.25,
  bossIceSlowFactor: 0.55,
  bossIceImmunityDuration: 5.5,
  bossMaxActInterval: 5.0,
  dragonAssistCd: 2.8,
  dragonAssistDmg: 5,
  companionMaxShare: 0.24,
  coopMaxDistance: 13.5,
  hintDelaySeconds: 20,
  maxCaptionWords: 8,
};
