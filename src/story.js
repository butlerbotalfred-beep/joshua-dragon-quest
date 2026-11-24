// Story beats that belong to a place in the story, not to a level's layout.
//
// Renee, the Keeper's wife, stays at the castle to keep an eye on the dragon
// and sends word to the Keeper. Every update he gives the family about the
// dragon is her news (docs/STORY.md). These beats play at the same place in
// the story whatever the level around them looks like:
//
//   Level 1, when the family meets the Keeper again:  "Renee sends word from the castle..."
//   Level 3, when the golem is freed:                 "Renee tells me the dragon knows..."
//   Level 6, at the start:  Renee meets the family at the castle door and shows them the way down.
//
// A beat is added after the level's own scene at the same moment.

// Renee's news arrives the way news does in a forest: her owl brings it.
// The Keeper is there in person, the owl flies down to him, and he speaks.
function news(game, line, at, from = null) {
  const v = game.view;
  const k = at;
  // If the Keeper is waiting somewhere else in the level, he walks over from `from` and goes back afterwards.
  const there = v.actors.keeper ? v.actors.keeper.position : null;
  const walks = !!(from && there && Math.hypot(there.x - k.x, there.z - k.z) > 3);
  const home = walks ? { x: there.x, y: there.y, z: there.z, turn: v.actors.keeper.rotation.y } : null;
  const far = walks ? Math.hypot(from.x - k.x, from.z - k.z) : 0;
  const walkT = Math.max(1.4, Math.min(3.2, far / 7));
  return [
    { do: (g) => {
      if (!v.actors.keeper) v.addActor('keeper', 'keeper', 2.6, k.x, k.y, k.z);
      if (walks) v.actors.keeper.position.set(from.x, from.y, from.z);
      const owl = v.addActor('owl', 'friendly_owl', 0.8, k.x + 13, k.y + 11, k.z - 7);
      owl.rotation.y = -Math.PI / 2;
    } },
    { cam: { px: k.x - 1.5, py: k.y + 3.6, pz: k.z + 8.5, lx: k.x + 0.4, ly: k.y + 1.9, lz: k.z } },
    ...(walks ? [{ move: 'keeper', to: { x: k.x, z: k.z }, t: walkT }] : []),
    { do: (g) => {
      v.actors.keeper.rotation.y = 0;
      g.log.push({ news: line, keeper: { x: v.actors.keeper.position.x, z: v.actors.keeper.position.z } });
    } },
    { move: 'owl', to: { x: k.x + 0.75, y: k.y + 2.35, z: k.z + 0.1 }, t: 1.7 },
    { do: () => { v.actors.owl.rotation.y = 0; } },
    { wait: 0.4 },
    { say: line },
    { wait: 0.3 },
    { always: () => v.removeActor('owl') },
    ...(walks ? [
      { move: 'keeper', to: { x: from.x, z: from.z }, t: walkT },
      { always: () => { const a = v.actors.keeper; a.position.set(home.x, home.y, home.z); a.rotation.y = home.turn; } },
    ] : []),
  ];
}

// Where the Keeper stands for a beat.
const atExit = (game) => { const e = game.world.L.exit; return { x: e.x, y: e.y, z: e.z - 1.5 }; };
// In the arena he steps up a few paces from whoever is leading, on the side with more room, and not on top of the guardian.
const besideArena = (game) => {
  const w = game.world, A = w.L.arena, h = w.leader(), gd = w.guardian;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const spot = (side) => ({ x: clamp(h.x + side * 5.5, A.x0 + 3, A.x1 - 3), y: A.y, z: clamp(h.z - 1.5, A.z0 + 3, A.z1 - 3) });
  const clear = (p) => (gd ? Math.hypot(p.x - gd.x, p.z - gd.z) - gd.def.radius : 99);
  const first = spot(h.x > A.cx ? -1 : 1), other = spot(h.x > A.cx ? 1 : -1);
  return clear(first) >= 2.5 || clear(first) >= clear(other) ? first : other;
};

// The way on out of the arena, which has just opened.
const farGate = (game) => { const A = game.world.L.arena; return { x: A.cx, y: A.y, z: A.z0 + 1.2 }; };

// The castle door: Renee is waiting there, and walks ahead to show the way down.
function reneeAtTheDoor(game) {
  const v = game.view, w = game.world, s = w.L.spawn;
  const door = { x: s.x, y: s.y, z: s.z - 11 };
  return [
    { do: (g) => {
      v.addDoor('castle-door', door.x, door.y, door.z);
      const r = v.addActor('renee', null, 2.3, door.x + 2.6, door.y, door.z + 2.5);
      r.rotation.y = 0;
      g.log.push({ renee: 'door', at: { x: r.position.x, z: r.position.z } });
    } },
    { cam: { px: s.x - 3.5, py: s.y + 4.2, pz: s.z + 7, lx: door.x + 1, ly: s.y + 1.8, lz: door.z } },
    { wait: 1.4 },
    // A wave: a little sparkle, then she leads the way through the door.
    { do: () => v.burst(door.x + 2.6, door.y + 2.6, door.z + 2.5, 0xd9b8ff, 14, 2.5, 0.9), sfx: 'menu_ok', volume: 0.5 },
    { wait: 0.9 },
    { move: 'renee', to: { x: door.x, z: door.z + 1 }, t: 1.4 },
    { move: 'renee', to: { x: door.x, z: door.z - 5 }, t: 2.0 },
    { move: 'renee', to: { x: door.x + 5.5, z: door.z - 7 }, t: 1.6 },
    // Where she ends up, whether the scene was watched or skipped: just inside, off to one side, looking back.
    { always: (g) => {
      const r = v.actors.renee;
      r.position.set(door.x + 5.5, door.y, door.z - 7);
      r.rotation.y = -Math.PI / 2;
      g.log.push({ renee: 'led the way' });
    } },
    { wait: 0.6 },
  ];
}

export const BEATS = {
  1: { exit: (game) => news(game, 'l1_keeper_news', atExit(game)), models: ['friendly_owl', 'keeper'] },
  3: { freed: (game) => news(game, 'l3_keeper_freed', besideArena(game), farGate(game)), models: ['friendly_owl', 'keeper'] },
  6: { start: (game) => reneeAtTheDoor(game), models: [] },
};

// The update lines and where each belongs, for the checks and the docs.
export const NEWS = [
  { line: 'l1_keeper_news', level: 1, at: 'exit', when: 'when they meet again' },
  { line: 'l3_keeper_freed', level: 3, at: 'freed', when: 'when the golem is freed' },
];

export function beat(def, hook, game) {
  const b = BEATS[def.number];
  return b && b[hook] ? b[hook](game) : [];
}

export function beatModels(def) {
  const b = BEATS[def.number];
  return b ? b.models : [];
}
