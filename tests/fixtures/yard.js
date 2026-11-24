// Practice levels used only by the automated checks. They are not part of the
// game and are not shipped. Each one puts a system on its own so it can be
// tested before any real level exists.

// Each practice gate borrows the spoken hint of a real gate of the same kind.

export const YARD_GATES = {
  number: 90, key: 'yard_gates', name: 'Yard', biome: 'woods', music: 'level1_great_woods', guardian: null,
  course: [
    { t: 'path', len: 20 },
    { t: 'gate', id: 'y_fire', mech: 'wall', gift: 'fire', theme: 'brambles', hint: 'hint_l1_brambles' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_boulder', mech: 'wall', gift: 'strength', theme: 'boulder', targets: 1, hits: 4, hint: 'hint_l1_boulder' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_ice', mech: 'bridge', gift: 'ice', theme: 'stream', hint: 'hint_l1_stream' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_anchor', mech: 'bridge', gift: 'strength', anchors: true, theme: 'ropebridge', hint: 'hint_l2_bridge' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_steps', mech: 'bridge', gift: 'ice', theme: 'waterfall', targets: 4, rise: 2, hint: 'hint_l2_waterfall' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_icewall', mech: 'wall', gift: 'ice', theme: 'vents', hint: 'hint_l3_vents' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_chase', mech: 'run', gift: 'speed', style: 'chase', theme: 'bear', hint: 'hint_l1_charge' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_slope', mech: 'run', gift: 'speed', style: 'slope', rise: 5, theme: 'ash', hint: 'hint_l3_slope' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_door', mech: 'run', gift: 'speed', style: 'door', theme: 'door', hint: 'hint_l6_door' },
    { t: 'path', len: 16 },
    { t: 'gate', id: 'y_leap', mech: 'leap', gift: 'speed', theme: 'leap', hint: 'hint_l2_leap' },
    { t: 'path', len: 16 },
    { t: 'hop' },
    { t: 'path', len: 12 },
    { t: 'ferry' },
    { t: 'path', len: 12, x: 5 },
    { t: 'exit' , x: 5 },
  ],
};

export function yardFight(guardian, number = 91) {
  return {
    number, key: `yard_fight_${guardian}`, name: 'Yard', biome: 'woods', music: 'level1_great_woods', guardian,
    course: [
      { t: 'path', len: 16 },
      { t: 'arena', w: 30 },
      { t: 'exit' },
    ],
  };
}

export const YARD_PLAY = {
  number: 92, key: 'yard_play', name: 'Yard', biome: 'woods', music: 'level1_great_woods', guardian: 'bear',
  eggHero: 0, eggProp: 'egg_green',
  course: [
    { t: 'path', len: 40, items: [
      { k: 'bush', u: 10, x: -5 }, { k: 'gold', n: 1, u: 14, x: 5 }, { k: 'enemy', type: 'wolf', u: 28, x: 2 },
      { k: 'web', u: 20, x: 0 },
    ] },
    { t: 'gate', id: 'p_fire', mech: 'wall', gift: 'fire', theme: 'brambles', hint: 'hint_l1_brambles' },
    { t: 'path', len: 20 },
    { t: 'arena', w: 30 },
    { t: 'nest' },
  ],
};

// A long plain walk, wide enough for two players to pull apart.
export const YARD_WALK = {
  number: 93, key: 'yard_walk', name: 'Yard', biome: 'woods', music: 'level1_great_woods', guardian: null,
  course: [
    { t: 'path', len: 70, w: 60 },
    { t: 'path', len: 70, w: 60 },
    { t: 'exit', w: 60 },
  ],
};

// A nest with nothing in the way, and a hatching scene of the same shape as a
// real one, for checking that a scene can be skipped at any moment.
export const YARD_NEST = {
  number: 94, key: 'yard_nest', name: 'Yard', biome: 'woods', music: 'level1_great_woods', guardian: null,
  eggHero: 0, eggProp: 'egg_green',
  course: [
    { t: 'path', len: 14 },
    { t: 'nest' },
  ],
  story: {
    egg: () => [
      { say: 'l2_keeper_glow' },
      { wait: 0.4 },
      { sfx: 'hatch' },
      { always: (game) => game.grantBond(0) },
      { wait: 0.8 },
      { say: 'l2_joshua_hatch' },
      { sfx: 'chirp' },
      { say: 'l2_michael_friend' },
    ],
  },
};
