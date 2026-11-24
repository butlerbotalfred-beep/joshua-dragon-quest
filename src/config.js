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

export const TUNING = {
  // Guardian fight targets (Easy: 45-90s, guardian acts <= every 6s, ice hold <= 1.5s)
  maxBossIceHold: 1.4,
  bossIceSlowFactor: 0.55,
  bossIceImmunityDuration: 4.5,
  bossMaxActInterval: 5.2,
  companionMaxShare: 0.24,
  coopMaxDistance: 13.5,
  hintDelaySeconds: 20,
  maxCaptionWords: 8,
};
