// The festival: the ending.
//
// From docs/STORY.md: the courtyard fills with lanterns, one pair for every
// gold berry found. The bear, the yeti and the other guardians are there, and
// so is she. The Keeper makes the gifts permanent, Renee and the Keeper are
// reunited and embrace, the dragon stays, and the Narrator closes.
//
// Like the prologue, this is a place with a scene and no play.

const CASTLE = { x: 0, z: -58, height: 28 };
const DOOR = { x: 0, z: CASTLE.z + 9 };
const FAMILY = [{ x: -1.2, z: -6.5 }, { x: 1.2, z: -6.5 }, { x: 3.4, z: -5.4 }, { x: -3.4, z: -5.4 }];
const KEEPER = { x: -1.5, z: -13.5 };
const DRAGON = { x: 12.5, z: -22 };

// The freed guardians, come to the party: [name, model, height, x, z].
const GUESTS = [
  ['bear', 'grizzly_bear', 3.4, -11.5, -9],
  ['vine', 'vine_monster', 4.0, -12.5, -17],
  ['golem', 'magma_golem', 3.8, -11, -25],
  ['yeti', 'yeti', 4.1, 11, -9],
  ['gargoyle', 'stone_gargoyle', 3.6, 10.5, -31],
];

export const FESTIVAL = {
  number: 7, key: 'festival', name: 'The Festival', biome: 'festival', music: 'ending_festival',
  sceneOnly: true, ending: true, width: 30,
  models: ['royal_castle', 'great_black_dragon', 'keeper', ...GUESTS.map((g) => g[1])],
  course: [
    { t: 'path', len: 76, items: [] },
  ],

  story: {
    start: (game) => {
      const w = game.world, v = game.view;
      const face = (m, x, z) => { m.rotation.y = Math.atan2(x - m.position.x, z - m.position.z); };
      return [
        { always: (g) => g.ui.showHud(false) },
        { do: (g) => {
          w.heroes.forEach((h, i) => { h.x = FAMILY[i].x; h.z = FAMILY[i].z; h.fx = 0; h.fz = -1; });
          v.addActor('castle', 'royal_castle', CASTLE.height, CASTLE.x, 0, CASTLE.z);
          for (const [name, model, height, x, z] of GUESTS) face(v.addActor(name, model, height, x, 0, z), 0, -14);
          face(v.addActor('dragon', 'great_black_dragon', 8, DRAGON.x, 0, DRAGON.z), 0, -10);
          face(v.addActor('keeper', 'keeper', 2.6, KEEPER.x, 0, KEEPER.z), 0, 0);
          face(v.addActor('renee', null, 2.3, DOOR.x, 0, DOOR.z), 0, 0);
          // One pair of lanterns for every gold berry found.
          v.addLanterns(g.save.gold.length, { x: 0, z0: -3, z1: CASTLE.z + 12, half: 8.2 });
        } },
        { cam: { px: 0, py: 9, pz: 12, lx: 0, ly: 2.2, lz: -16 }, snap: true },
        { wait: 1.6 },

        // The Keeper makes the gifts permanent.
        { cam: { px: 2.5, py: 4.6, pz: 3.5, lx: -0.6, ly: 1.8, lz: -11 } },
        { later: [0, 1, 2, 3].map((i) => [2.6 + i * 0.5, (g) => g.giveGift(i)]) },
        { say: 'fest_keeper_worthy' },
        { always: (g) => { for (let i = 0; i < 4; i++) g.giveGift(i); } },
        { say: 'fest_daniel_stay' },
        { say: 'fest_keeper_ask' },
        // All four dragons: a chorus of chirps.
        { do: () => { for (let i = 0; i < 4; i++) v.zoomDragon(i, 2.2, 2); }, sfx: 'chirps', volume: 0.8 },
        { wait: 2.4 },

        // Renee comes home.
        { cam: { px: 5, py: 4.4, pz: -4, lx: -0.5, ly: 1.7, lz: -16 } },
        { move: 'renee', to: { x: KEEPER.x + 2.4, z: KEEPER.z - 2.2 }, t: 4.2 },
        { do: () => { face(v.actors.keeper, v.actors.renee.position.x, v.actors.renee.position.z); face(v.actors.renee, KEEPER.x, KEEPER.z); } },
        { say: 'fest_renee_home' },
        { say: 'fest_keeper_missed' },
        // They embrace.
        { move: 'renee', to: { x: KEEPER.x + 0.75, z: KEEPER.z - 0.7 }, t: 1.1 },
        { do: (g) => { face(v.actors.renee, KEEPER.x, KEEPER.z); v.burst(KEEPER.x + 0.4, 2.4, KEEPER.z - 0.4, 0xff9ac1, 24, 3, 1.4); g.log.push({ embrace: true }); } },
        { wait: 1.8 },

        // The dragon stays.
        { cam: { px: 3, py: 4.2, pz: -9, lx: DRAGON.x - 1, ly: 3.6, lz: DRAGON.z } },
        { say: 'fest_dragon_hmph' },

        // The Narrator closes.
        { cam: { px: 0, py: 13, pz: 16, lx: 0, ly: 3, lz: -20 } },
        { say: 'fest_narrator' },
        { wait: 1.0 },
      ];
    },
  },
};
