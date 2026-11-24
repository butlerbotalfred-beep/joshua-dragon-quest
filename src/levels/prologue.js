// The prologue: festival morning.
//
// From docs/STORY.md: the family is picking berries when the dragon lands on
// the castle and the eggs streak across the sky. The Keeper steps out of the
// trees, tells them the story of the dragon, gives the four gifts and sets the
// first task.
//
// This is a place with a scene and no play: nothing here can be won or lost.
// When it ends (or is skipped) the game goes on to Level 1.

const GIFTS_LINE = 'pro_keeper_gifts';

// Where things stand in the meadow.
const CASTLE = { x: 0, z: -52, height: 26 };
const BUSHES = [{ x: -7, u: 14 }, { x: -2.5, u: 17 }, { x: 3, u: 16 }, { x: 8, u: 13 }];   // one for each of the family
const FAMILY_HOME = [{ x: -3.2, z: -7.5 }, { x: -1, z: -8.2 }, { x: 1.4, z: -8.2 }, { x: 3.6, z: -7.5 }];

export const PROLOGUE = {
  number: 0, key: 'prologue', name: 'Festival Morning', biome: 'meadow', music: 'prologue_festival_morning',
  sceneOnly: true, noDragons: true, next: 1, width: 34,
  models: ['royal_castle', 'great_black_dragon', 'keeper'],
  course: [
    { t: 'path', len: 70, items: [
      ...BUSHES.map((b) => ({ k: 'bush', u: b.u, x: b.x })),
      { k: 'animal', type: 'rabbit', u: 9, x: 11 },
      { k: 'animal', type: 'deer', u: 24, x: -12 },
    ] },
  ],

  story: {
    start: (game) => {
      const w = game.world, v = game.view;
      const bush = (i) => w.bushes[i];
      const giftsFor = game.dialogue.lines[GIFTS_LINE] ? game.dialogue.lines[GIFTS_LINE].duration : 7.6;
      const top = CASTLE.height * 0.86;
      const pick = (i) => ({ do: () => { bush(i).taken = true; v.burst(bush(i).x, 1.2, bush(i).z, 0xff4d6d, 12, 3, 0.7); }, sfx: 'berry', volume: 0.6 });
      return [
        // The family in the meadow, the castle beyond.
        { always: (g) => g.ui.showHud(false) },
        { do: () => {
          w.heroes.forEach((h, i) => { h.x = -4.5 + i * 3; h.z = 1 + (i % 2) * 1.2; h.fx = 0; h.fz = -1; });
          v.addActor('castle', 'royal_castle', CASTLE.height, CASTLE.x, 0, CASTLE.z);
          const k = v.addActor('keeper', 'keeper', 2.6, 27, 0, -9);            // still among the trees
          k.rotation.y = -Math.PI / 2;
        } },
        { cam: { px: 0, py: 6.5, pz: 15, lx: 0, ly: 1.6, lz: -8 }, snap: true },
        { wait: 0.8 },

        // Picking berries.
        { move: 0, to: { x: bush(0).x + 0.9, z: bush(0).z + 1.1 }, t: 1.8, together: true },
        { move: 1, to: { x: bush(1).x + 0.9, z: bush(1).z + 1.1 }, t: 2.4, together: true },
        { move: 2, to: { x: bush(2).x - 0.9, z: bush(2).z + 1.1 }, t: 2.2, together: true },
        { move: 3, to: { x: bush(3).x - 0.9, z: bush(3).z + 1.1 }, t: 2.0 },
        pick(0), { wait: 0.45 }, pick(3), { wait: 0.45 }, pick(2), { wait: 0.45 }, pick(1), { wait: 0.7 },

        // The dragon lands on the castle.
        { do: () => { const d = v.addActor('dragon', 'great_black_dragon', 9, -46, 46, CASTLE.z - 30); d.rotation.y = Math.PI / 3; } },
        { cam: { px: 2, py: 5, pz: 14, lx: 0, ly: 13, lz: CASTLE.z } },
        { move: 'dragon', to: { x: CASTLE.x, y: top, z: CASTLE.z + 1 }, t: 2.6 },
        { do: () => { v.actors.dragon.rotation.y = 0; }, sfx: 'roar', volume: 0.5 },
        { wait: 0.9 },

        // The eggs streak away across the sky.
        { do: () => v.eggStreaks(CASTLE.x, top - 3, CASTLE.z + 2), sfx: 'whoosh', volume: 0.7 },
        { wait: 1.3 },
        { say: 'pro_joshua_stars' },
        { say: 'pro_dragon_eggs' },

        // The Keeper steps out of the trees, in person.
        { cam: { px: -2, py: 5.2, pz: 9, lx: 2.5, ly: 1.7, lz: -9 } },
        { move: 0, to: FAMILY_HOME[0], t: 1.6, together: true },
        { move: 1, to: FAMILY_HOME[1], t: 1.6, together: true },
        { move: 2, to: FAMILY_HOME[2], t: 1.6, together: true },
        { move: 3, to: FAMILY_HOME[3], t: 1.6, together: true },
        { move: 'keeper', to: { x: 8.5, z: -10 }, t: 3.2 },
        { do: () => { w.heroes.forEach((h) => { h.fx = 0.97; h.fz = -0.24; }); v.actors.keeper.rotation.y = -Math.PI / 2; } },
        { say: 'pro_keeper_hello' },
        { say: 'pro_keeper_dragon' },
        { say: 'pro_keeper_renee' },
        { say: 'pro_daniel_teacher' },

        // The four gifts, one as each is named.
        { later: [0, 1, 2, 3].map((i) => [giftsFor * (0.27 + i * 0.185), (g) => g.giveGift(i)]) },
        { say: GIFTS_LINE },
        { always: (g) => { for (let i = 0; i < 4; i++) g.giveGift(i); g.ui.showHud(true); } },
        { say: 'pro_keeper_task' },
        { say: 'pro_michael_day' },
        { wait: 0.6 },
      ];
    },
  },
};
