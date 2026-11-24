// Helpers that run inside the game page during the automated checks.
// Everything a bot does here goes through the virtual Xbox controllers
// (window.__pads), exactly as a real pad would.

import { Bot } from './botcore.js';
import { YARD_GATES, YARD_PLAY, YARD_WALK, YARD_NEST, yardFight } from '../fixtures/yard.js';
import { LEVELS } from '../../src/leveldata.js';

export { Bot, YARD_GATES, YARD_PLAY, YARD_WALK, YARD_NEST, yardFight, LEVELS };

// The numbers of the real levels that exist so far.
export const realLevels = () => [1, 2, 3, 4, 5, 6].filter((n) => LEVELS[n]);

// Wait (in real time) for a level that is loading its models.
export async function loaded() {
  for (let i = 0; i < 1200 && game().state === 'loading'; i++) await new Promise((r) => setTimeout(r, 25));
  return game().state;
}

// Clear the way to a spot far into a level: gates before it open, creatures and webs gone, guardian freed.
export function clearWayTo(world, z) {
  for (const g of world.gates) if (g.zFar >= z && !g.open) world.openGate(g, g.hero);
  for (const e of world.enemies) e.state = 'gone';
  for (const wb of world.webs) wb.used = true;
  const A = world.L.arena;
  if (world.guardian && A && A.z0 >= z) {
    world.guardian.state = 'freed';
    for (const wl of world.L.walls) if (wl.seal) wl.active = false;
  }
  world.drain();
}

const DT = 1 / 60;
const game = () => window.game;
const pads = () => window.__pads;

export const BUTTON = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

// Put a bot's wishes on a controller.
export function drive(pad, inp) {
  const p = pads();
  p.stick(pad, inp.mx, inp.mz);
  p.button(pad, BUTTON.A, inp.jump);
  p.button(pad, BUTTON.X, inp.gift);
  p.button(pad, BUTTON.Y, inp.next);
  p.button(pad, BUTTON.LB, inp.prev);
  p.button(pad, BUTTON.B, inp.call);
}

// Press and let go of one button.
export function tap(button, pad = 0, frames = 2) {
  const p = pads();
  p.button(pad, button, true);
  game().advance(frames * DT, DT);
  p.button(pad, button, false);
  game().advance(frames * DT, DT);
}

// Push the stick one way for a moment (one menu move).
export function nudge(x, y, pad = 0) {
  const p = pads();
  p.stick(pad, x, y);
  game().advance(2 * DT, DT);
  p.stick(pad, 0, 0);
  game().advance(2 * DT, DT);
}

// Let bots play for `seconds` of game time. `bots` is a list, one per controller.
// On a lost screen the first controller presses A to try again.
export function play(seconds, bots = [], { until = null, each = null } = {}) {
  const g = game();
  let t = 0, retries = 0;
  g.botHook = () => { bots.forEach((b, i) => { if (b) drive(i, b.think(DT)); }); };
  while (t < seconds) {
    if (g.state === 'lost') { pads().release(0); tap(BUTTON.A); retries++; continue; }
    g.advance(DT, DT);
    t += DT;
    if (each) each(t);
    if (until && until()) break;
  }
  g.botHook = null;
  pads().release(0); pads().release(1);
  g.advance(2 * DT, DT);
  return { t, retries };
}

export async function start(def, opts = {}) {
  const g = game();
  if (typeof def === 'object') g.registerLevel(def);
  const number = typeof def === 'object' ? def.number : def;
  await g.startLevel(number, { noStory: true, ...opts });
  g.advance(2 * DT, DT);
  return g.world;
}

// Stand the family in front of one gate, with every gate before it already open.
export function placeAtGate(world, gate) {
  for (const g of world.gates) { if (g === gate) break; world.openGate(g, g.hero); }
  world.drain();
  const spots = [[0, 0], [-1.8, 2], [1.8, 2], [0, 3.6]];
  const z = world.holdZ(gate) + 1.5;
  const order = [world.playerHero(0), ...world.heroes.filter((h) => h !== world.playerHero(0))];
  order.forEach((h, k) => {
    h.x = gate.cx + spots[k][0]; h.z = z + spots[k][1]; h.y = gate.y; h.vy = 0;
    h.lastSafe = { x: h.x, y: h.y, z: h.z };
  });
  world.checkpoint = { x: gate.cx, y: gate.y, z };
  world.farthestZ = z;
  world.progressT = 0;
}

// Milestone 2.3. For every gate of a level: each of the three wrong heroes
// walks, jumps and hugs the edges for 60 seconds, and then the right hero opens it.
export async function bypassCheck(def, { difficulty = 'easy', bonded = [false, false, false, false], seconds = 60 } = {}) {
  const g = game();
  const out = [];
  const probe = await start(def, { difficulty, bonded });
  const count = probe.gates.length;
  for (let gi = 0; gi < count; gi++) {
    for (let hero = 0; hero < 4; hero++) {
      const w = await start(def, { difficulty, bonded, p1Hero: hero, seed: 7 + hero + gi * 31 });
      const gate = w.gates[gi];
      const right = hero === gate.hero;
      placeAtGate(w, gate);
      const bot = new Bot(w, right ? { hero } : { hero, wander: true });
      let minZ = Infinity, playerPast = false;
      const res = play(seconds, [bot], {
        until: () => right && gate.open,
        each: () => {
          const h = w.playerHero(0);
          if (h.z < minZ) minZ = h.z;
          // Past the gate while it is shut, standing on ground beyond it.
          if (!gate.open && h.onGround && h.z < gate.zFar - 0.5) playerPast = true;
        },
      });
      const opened = w.stats.gatesOpened.find((q) => q.id === gate.id);
      out.push({
        gate: gate.id, mech: gate.mech, gift: gate.gift, hero, right, open: gate.open,
        openedBy: opened ? opened.by : null, seconds: +res.t.toFixed(1),
        past: playerPast, minZ: +minZ.toFixed(2), zFar: gate.zFar,
        companionsPast: w.heroes.filter((h) => h.control === null && !gate.open && h.z < gate.zFar - 0.5).length,
      });
    }
  }
  return out;
}

// One fight from walking into the arena to the guardian being freed.
export async function fight(guardian, { hero = 0, difficulty = 'easy', seed = 1, bonded = [false, false, false, false], lapse = null, def = null, limit = 400 } = {}) {
  const w = await start(def || yardFight(guardian), { difficulty, p1Hero: hero, seed, bonded });
  const bot = new Bot(w, { hero, lapse });
  let hurtAfter = 0, attacksAfter = 0;
  const res = play(limit, [bot], { until: () => w.guardian.state === 'freed' });
  const f = w.stats.fights[0] || null;
  // After the guardian is freed it must stay friendly: ten more seconds beside it.
  let friendly = null;
  if (f) {
    const hp0 = w.heroes.map((h) => h.hp);
    const acts0 = f.acts.length;
    const lead = w.playerHero(0);
    lead.x = w.guardian.x + w.guardian.def.radius + 1.2; lead.z = w.guardian.z;
    play(10, [new Bot(w, { idle: true })]);
    hurtAfter = w.heroes.filter((h, i) => h.hp < hp0[i]).length;
    attacksAfter = (w.stats.fights[0].acts.length - acts0) + (w.guardian.attack ? 1 : 0) + w.projectiles.filter((p) => p.from === 'guardian').length;
    friendly = hurtAfter === 0 && attacksAfter === 0 && w.guardian.state === 'freed' && !!game().view.guardianViz;
  }
  let gap = 0;
  if (f) {
    gap = f.acts.length ? f.acts[0] - f.start : f.length;
    for (let i = 1; i < f.acts.length; i++) gap = Math.max(gap, f.acts[i] - f.acts[i - 1]);
    gap = Math.max(gap, f.end - f.acts[f.acts.length - 1]);
  }
  return {
    guardian, hero, difficulty, seed, freed: !!f, length: f ? +f.length.toFixed(2) : null,
    share: f ? +(f.companionDamage / Math.max(1, f.companionDamage + f.playerDamage)).toFixed(3) : null,
    maxHold: f ? +f.maxHold.toFixed(2) : null, longestQuiet: +gap.toFixed(2), retries: res.retries, friendly,
    state: game().state,
  };
}

// Is a spot in the world on the screen right now?
export function onScreen(h) {
  const v = game().view;
  const feet = v.project(h.x, h.y, h.z), head = v.project(h.x, h.y + h.def.height, h.z);
  const inside = (p) => p.x > -1 && p.x < 1 && p.y > -1 && p.y < 1 && p.z < 1;
  return { feet, head, ok: inside(feet) && inside(head) };
}
