// Level data and the layout builder.
//
// A level is a "course": a list of sections laid end to end, heading away from
// the camera (toward negative z). The builder turns a course into plain
// rectangles: floors to stand on, gaps to fall into, walls, gates and things to
// find. Nothing in this file draws anything, so tests and docs can use it too.
//
// Rectangles always have x0 < x1 and z0 < z1. "Near" is the larger z (where
// the family comes from) and "far" is the smaller z (where they are going).

import { HERO_OF_GIFT, LEAP_GATE, BRIDGE_GATE, HOP_GAP } from './config.js';

export const LEVELS = {};       // number -> level definition

export function registerLevel(def) {
  LEVELS[def.number] = def;
  return def;
}

const rect = (x0, x1, z0, z1, extra = {}) => ({ x0, x1, z0, z1, ...extra });

export function buildLayout(def) {
  const L = {
    number: def.number, key: def.key, name: def.name, biome: def.biome, music: def.music,
    floors: [], gaps: [], walls: [], gates: [], enemies: [], webs: [], bushes: [], gold: [],
    triggers: [], animals: [], platforms: [], sections: [], waypoints: [],
    arena: null, nest: null, exit: null, guardian: null, egg: null,
    spawn: { x: 0, z: 0, y: 0 }, zStart: 8, zEnd: 0,
  };
  let z = L.zStart;              // near edge of the next section
  let y = def.startY || 0;
  let prevSec = null;
  let gateCount = 0;

  const addFloor = (f) => { f.active = f.active !== false; L.floors.push(f); return f; };

  for (const sec of def.course) {
    const w = sec.w || def.width || 16;
    const cx = sec.x || 0;
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const zNear = z;
    let len = sec.len || 0;
    const info = { t: sec.t, cx, w, x0, x1, zNear, zFar: 0, y, id: sec.id || null };

    // A waypoint where this section meets the previous one, inside both.
    if (prevSec) {
      const ox0 = Math.max(prevSec.x0, x0), ox1 = Math.min(prevSec.x1, x1);
      if (ox1 - ox0 < 4) throw new Error(`Level ${def.number}: sections do not overlap enough near z=${zNear}`);
      L.waypoints.push({ x: (ox0 + ox1) / 2, z: zNear });
    }

    if (sec.t === 'path' || sec.t === 'arena' || sec.t === 'nest' || sec.t === 'exit') {
      if (sec.t === 'arena') len = len || 36;
      if (sec.t === 'nest' || sec.t === 'exit') len = len || 18;
      addFloor(rect(x0, x1, z - len, z, { y, kind: sec.t }));
      for (const it of sec.items || []) placeItem(L, def, it, cx, x0, x1, z, y, addFloor);
      if (sec.t === 'arena') {
        L.arena = rect(x0, x1, z - len, z, { y, cx, cz: z - len / 2, startLine: z - 7 });
        L.guardian = { type: def.guardian, x: cx, z: z - len / 2 - 3, y };
        // A seal across the way out, lifted when the guardian is freed.
        L.walls.push(rect(x0 - 1, x1 + 1, z - len - 0.8, z - len + 0.8, { id: 'arena-seal', active: true, y, seal: true }));
      }
      if (sec.t === 'nest') {
        L.nest = rect(x0, x1, z - len, z, { y, cx });
        L.egg = { x: cx, z: z - len + 6, y, hero: def.eggHero, prop: def.eggProp, color: def.eggColor };
      }
      if (sec.t === 'exit') {
        L.exit = { x: cx, z: z - len + 6, y, who: sec.who || 'keeper' };
      }
      if (L.sections.length === 0) L.spawn = { x: cx, z: z - 6, y };
    } else if (sec.t === 'ramp') {
      const y1 = sec.y1;
      addFloor(rect(x0, x1, z - len, z, { y, y1, kind: 'ramp' }));   // y at near edge, y1 at far edge
      y = y1;
    } else if (sec.t === 'ferry') {
      len = len || 16;
      L.gaps.push(rect(x0, x1, z - len, z, { kind: sec.kind || 'drop', y, id: sec.id || `ferry-${L.gaps.length}` }));
      const half = 3.2;
      // The platform overlaps each bank a little when it docks, so nobody trips boarding.
      const p = addFloor(rect(cx - half, cx + half, z - 2 * half + 0.3, z + 0.3, { y, kind: 'platform', moving: true }));
      p.travel = { zA: z - half + 0.3, zB: z - len + half - 0.3, speed: sec.speed || 3.2, wait: sec.wait || 2.2, dir: 1, pause: 1.5, half };
      L.platforms.push(p);
    } else if (sec.t === 'hop') {
      len = len || HOP_GAP.length;
      L.gaps.push(rect(x0, x1, z - len, z, { kind: sec.kind || 'drop', kind2: 'hop', y, id: `hop-${L.gaps.length}` }));
    } else if (sec.t === 'gate') {
      const g = buildGate(L, sec, { cx, w, x0, x1, zNear: z, y, index: gateCount++ }, addFloor);
      len = g.zNear - g.zFar;
      y = g.yFar;
    } else {
      throw new Error(`Unknown section type ${sec.t}`);
    }
    info.zFar = z - len;
    info.y1 = y;
    L.sections.push(info);
    z -= len;
    prevSec = info;
  }
  L.zEnd = z;
  L.waypoints.push({ x: prevSec.cx, z: z + 4 });
  // A back wall so nobody can walk off the start or the end of a level.
  L.length = L.zStart - L.zEnd;
  return L;
}

function placeItem(L, def, it, cx, x0, x1, zNear, y, addFloor) {
  const iz = zNear - (it.u || 0);
  const ix = cx + (it.x || 0);
  switch (it.k) {
    case 'enemy': L.enemies.push({ type: it.type, x: ix, z: iz, y, leash: rect(x0, x1, iz - 14, iz + 14) }); break;
    case 'web': L.webs.push({ x: ix, z: iz, y }); break;
    case 'bush': L.bushes.push({ x: ix, z: iz, y }); break;
    case 'gold': L.gold.push({ id: `l${def.number}_g${it.n}`, x: ix, z: iz, y }); break;
    case 'line': L.triggers.push({ kind: 'line', line: it.id, z: iz, once: true }); break;
    case 'animal': L.animals.push({ type: it.type, x: ix, z: iz, y }); break;
    case 'alcove': {
      // A side pocket off the lane, for berries and secrets.
      const side = it.side || 1;
      const depth = it.depth || 8, alen = it.len || 10;
      const ax0 = side > 0 ? x1 : x0 - depth, ax1 = side > 0 ? x1 + depth : x0;
      addFloor(rect(ax0, ax1, iz - alen, iz, { y, kind: 'alcove' }));
      break;
    }
    default: throw new Error(`Unknown item ${it.k}`);
  }
}

function buildGate(L, sec, at, addFloor) {
  const { cx, w, x0, x1, zNear, y, index } = at;
  const g = {
    id: sec.id, index, mech: sec.mech, gift: sec.gift, hero: HERO_OF_GIFT[sec.gift], dragon: !!sec.dragon,
    theme: sec.theme || sec.mech, hint: sec.hint || null, approach: sec.approach || null, cheer: sec.cheer || null,
    cx, x0, x1, y, yFar: y, zNear, zFar: zNear, open: false, style: sec.style || null, door: null,
    targets: [], wall: null, gap: null, slices: [], corridor: null, bridge: null,
    useSpot: { x: cx, z: zNear + 2 }, farSpot: null,
  };
  const hits = sec.hits || 3;
  if (sec.mech === 'wall') {
    const len = 12;
    addFloor(rect(x0, x1, zNear - len, zNear, { y, kind: 'gate' }));
    g.wall = rect(x0 - 1, x1 + 1, zNear - 7, zNear - 5.4, { id: g.id, active: true, y, gate: g.id });
    L.walls.push(g.wall);
    const n = sec.targets || 3;
    for (let i = 0; i < n; i++) {
      const tx = n === 1 ? cx : x0 + 2.8 + (i * (w - 5.6)) / (n - 1);
      g.targets.push({ x: tx, z: zNear - 5.0, y, hits, hp: hits, done: false });
    }
    g.zFar = zNear - len;
    g.useSpot = { x: cx, z: zNear - 1.0 };
  } else if (sec.mech === 'bridge') {
    const len = sec.len || (sec.anchors ? 16 : BRIDGE_GATE.length);
    g.gap = rect(x0, x1, zNear - len, zNear, { kind: sec.kind || 'water', y, id: g.id, gate: g.id });
    L.gaps.push(g.gap);
    if (sec.anchors) {
      // Michael-style: steady the bridge from the near bank.
      g.wall = rect(x0 - 1, x1 + 1, zNear - 1.0, zNear + 0.2, { id: g.id, active: true, y, gate: g.id });
      L.walls.push(g.wall);
      for (const sx of [-4.2, 4.2]) g.targets.push({ x: cx + sx, z: zNear + 1.6, y, hits, hp: hits, done: false });
      g.bridge = addFloor(rect(cx - 3.2, cx + 3.2, zNear - len, zNear, { y, kind: 'bridge', active: false }));
    } else {
      // Vanessa-style: freeze it one piece at a time. With a rise, the pieces are steps.
      const n = sec.targets || 3;
      const rise = sec.rise || 0;
      if (rise / n > 0.55) throw new Error(`Gate ${sec.id}: steps too tall to walk up`);
      g.yFar = y + rise;
      for (let i = 0; i < n; i++) {
        const s0 = zNear - ((i + 1) * len) / n, s1 = zNear - (i * len) / n;
        const slice = addFloor(rect(cx - 4, cx + 4, s0, s1, { y: y + ((i + 1) * rise) / n, kind: 'ice', active: false }));
        g.slices.push(slice);
        g.targets.push({ x: cx, z: (s0 + s1) / 2, y: y + ((i + 1) * rise) / n, hits: sec.hits || 2, hp: sec.hits || 2, done: false, slice: i });
      }
    }
    g.zFar = zNear - len;
    g.useSpot = { x: cx, z: zNear + 2.5 };
  } else if (sec.mech === 'run') {
    g.style = sec.style || 'chase';
    const len = sec.len || (g.style === 'slope' ? 18 : g.style === 'door' ? 30 : 34);
    const cw = sec.cw || 8;
    const rise = sec.rise || 0;
    const floor = { y, kind: 'corridor' };
    if (rise) floor.y1 = y + rise;
    addFloor(rect(cx - cw / 2, cx + cw / 2, zNear - len, zNear, floor));
    g.corridor = rect(cx - cw / 2, cx + cw / 2, zNear - len, zNear);
    g.chaser = { active: false, z: zNear, t: 0 };
    g.yFar = y + rise;
    if (g.style === 'door') {
      g.door = rect(cx - cw / 2 - 1, cx + cw / 2 + 1, zNear - len + 0.4, zNear - len + 1.4, { id: `${g.id}-door`, active: false, y, gate: g.id, door: true });
      L.walls.push(g.door);
    }
    g.zFar = zNear - len;
    g.useSpot = { x: cx, z: zNear + 2 };
  } else if (sec.mech === 'leap') {
    const len = sec.len || LEAP_GATE.length;
    g.gap = rect(x0, x1, zNear - len, zNear, { kind: sec.kind || 'drop', y, id: g.id, gate: g.id });
    L.gaps.push(g.gap);
    g.bridge = addFloor(rect(cx - 3, cx + 3, zNear - len, zNear, { y, kind: 'bridge', active: false }));
    g.zFar = zNear - len;
    g.useSpot = { x: cx, z: zNear + 5 };
  } else {
    throw new Error(`Unknown gate mechanism ${sec.mech}`);
  }
  g.farSpot = { x: cx, z: g.zFar - 3 };
  L.gates.push(g);
  return g;
}

// ---------------------------------------------------------------------------
// Queries used by the game, the bot and the tests.
// ---------------------------------------------------------------------------

export function floorHeight(f, z) {
  if (f.y1 === undefined) return f.y;
  const t = (f.z1 - z) / (f.z1 - f.z0);          // 0 at the near edge, 1 at the far edge
  return f.y + (f.y1 - f.y) * Math.min(1, Math.max(0, t));
}

export function inRect(r, x, z) {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}
