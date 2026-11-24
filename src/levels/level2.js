// Level 2: Treetop Canopy, the green egg.
//
// High walkways and swinging platforms. The guardian is the Old Vine, tangled
// up in the spell. The map and the reasons are in docs/levels/level-2.md.
//
// Gates, in order (from "Each one's moment" in docs/STORY.md):
//   1. Daniel clears the overgrowth            fire
//   2. Michael holds a bridge steady           strength
//   3. Vanessa freezes a waterfall into steps  ice
//   4. Joshua makes the last long leap         speed

export const LEVEL2 = {
  number: 2, key: 'treetop_canopy', name: 'Treetop Canopy', biome: 'canopy', music: 'level2_treetop_canopy',
  guardian: 'vine', eggHero: 0, eggProp: 'egg_green', next: 3,
  course: [
    // The first walkway: a quiet start, berries, and the first little spider.
    { t: 'path', len: 64, items: [
      { k: 'animal', type: 'owl', u: 8, x: 6 },
      { k: 'bush', u: 14, x: -5 },
      { k: 'alcove', u: 24, side: 1, depth: 9, len: 10 },
      { k: 'gold', n: 1, u: 29, x: 13 },
      { k: 'enemy', type: 'spider', u: 40, x: 2 },
      { k: 'bush', u: 52, x: 5 },
    ] },
    { t: 'gate', id: 'l2_overgrowth', mech: 'wall', gift: 'fire', theme: 'overgrowth', hint: 'hint_l2_overgrowth' },

    // Up into the branches.
    { t: 'path', len: 36, items: [
      { k: 'bush', u: 8, x: 5 },
      { k: 'web', u: 18, x: 0 },
      { k: 'enemy', type: 'sprout', u: 28, x: -3 },
    ] },
    { t: 'ramp', len: 14, y1: 3 },
    { t: 'path', len: 34, items: [
      { k: 'animal', type: 'rabbit', u: 6, x: 5 },
      { k: 'bush', u: 14, x: -5 },
      { k: 'enemy', type: 'spider', u: 24, x: 2 },
    ] },

    // The swinging platforms.
    { t: 'hop' },
    { t: 'path', len: 30, items: [
      { k: 'web', u: 9, x: 0 },
      { k: 'enemy', type: 'sprout', u: 16, x: -3 },
      { k: 'bush', u: 24, x: 5 },
    ] },
    { t: 'ferry', len: 18 },
    { t: 'path', len: 36, items: [
      { k: 'bush', u: 10, x: -5 },
      { k: 'animal', type: 'rabbit', u: 20, x: 5 },
      { k: 'enemy', type: 'spider', u: 28, x: 2 },
    ] },
    { t: 'hop' },
    { t: 'path', len: 30, items: [
      { k: 'web', u: 9, x: 0 },
      { k: 'bush', u: 18, x: 5 },
    ] },
    { t: 'gate', id: 'l2_bridge', mech: 'bridge', gift: 'strength', anchors: true, kind: 'drop', theme: 'ropebridge', hint: 'hint_l2_bridge' },

    // The high boughs: a hidden gold berry, and creatures near the waterfall.
    { t: 'path', len: 60, items: [
      { k: 'alcove', u: 14, side: -1, depth: 9, len: 10 },
      { k: 'gold', n: 2, u: 19, x: -13 },
      { k: 'enemy', type: 'spider', u: 30, x: -2 },
      { k: 'enemy', type: 'sprout', u: 42, x: 3 },
      { k: 'bush', u: 52, x: 5 },
    ] },
    { t: 'ferry', len: 16 },
    { t: 'path', len: 30, items: [
      { k: 'bush', u: 10, x: -5 },
      { k: 'enemy', type: 'sprout', u: 20, x: 3 },
    ] },
    { t: 'hop' },
    { t: 'path', len: 34, items: [
      { k: 'animal', type: 'owl', u: 8, x: -6 },
      { k: 'bush', u: 16, x: 5 },
      { k: 'enemy', type: 'spider', u: 26, x: 0 },
    ] },
    { t: 'gate', id: 'l2_waterfall', mech: 'bridge', gift: 'ice', kind: 'drop', theme: 'waterfall', targets: 4, rise: 2, hint: 'hint_l2_waterfall' },

    // Above the waterfall: the last berries, a ride, and the climb to the Old Vine's ring of branches.
    { t: 'path', len: 38, items: [
      { k: 'bush', u: 10, x: -5 },
      { k: 'enemy', type: 'sprout', u: 26, x: 3 },
    ] },
    { t: 'ferry', len: 16 },
    { t: 'path', len: 40, items: [
      { k: 'web', u: 8, x: 0 },
      { k: 'alcove', u: 14, side: 1, depth: 9, len: 10 },
      { k: 'gold', n: 3, u: 19, x: 13 },
      { k: 'bush', u: 28, x: -5 },
      { k: 'enemy', type: 'spider', u: 34, x: 2 },
    ] },
    { t: 'hop' },
    { t: 'path', len: 34, items: [
      { k: 'animal', type: 'deer', u: 8, x: 5 },
      { k: 'bush', u: 16, x: -5 },
      { k: 'enemy', type: 'sprout', u: 26, x: 0 },
    ] },
    { t: 'ramp', len: 12, y1: 7 },
    { t: 'path', len: 20, items: [
      { k: 'bush', u: 10, x: 5 },
    ] },
    { t: 'arena', w: 30 },
    { t: 'path', len: 16, items: [
      { k: 'animal', type: 'owl', u: 6, x: -6 },
    ] },
    { t: 'gate', id: 'l2_leap', mech: 'leap', gift: 'speed', theme: 'leap', hint: 'hint_l2_leap' },

    // The nest.
    { t: 'nest', len: 30, items: [
      { k: 'line', id: 'l2_keeper_glow', u: 2 },
    ] },
  ],

  story: {
    // The hatching. Whatever happens in it, Speedy is bonded when it ends (see game.js).
    egg: (game) => {
      const egg = game.world.L.egg;
      return [
        { music: 'hatching' },
        { cam: { px: egg.x + 5.5, py: egg.y + 4.2, pz: egg.z + 9, lx: egg.x, ly: egg.y + 1.2, lz: egg.z } },
        { move: 0, to: { x: egg.x - 1.3, z: egg.z + 2.0 }, t: 1.2 },
        { say: 'l2_joshua_hatch' },
        { sfx: 'hatch' },
        { always: (g) => g.grantBond(0) },
        { wait: 1.6 },
        { sfx: 'chirp' },
        { do: (g) => g.view.zoomDragon(0, 2.4) },      // Speedy zooms around Joshua's head
        { wait: 2.6 },
        { say: 'l2_michael_friend' },
        { wait: 0.8 },
      ];
    },
  },
};
