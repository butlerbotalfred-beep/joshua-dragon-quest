// The game world: everything that moves, with no drawing in it.
//
// The world advances in fixed steps. The same inputs always give the same
// result, so the automated checks can play hours of the game in seconds.

import {
  GRAVITY, STEP_UP, FALL_DEPTH, HEROES, DIFFICULTY, FIGHT, GUARDIANS, ATTACKS, ENEMIES,
  COMPANIONS, RUN_GATE, CO_OP, PICKUPS, WEB, REVIVE,
} from './config.js';
import { buildLayout, floorHeight, inRect } from './levels.js';

export const blankInput = () => ({ mx: 0, mz: 0, jump: false, gift: false, next: false, prev: false, call: false });

const HERO_RADIUS = 0.45;
const SAFE_KINDS = new Set(['path', 'arena', 'nest', 'exit', 'gate', 'alcove', 'corridor']);

export class World {
  constructor(def, opts = {}) {
    this.def = def;
    this.L = buildLayout(def);
    this.diffKey = opts.difficulty || 'easy';
    this.diff = DIFFICULTY[this.diffKey];
    this.seed = (opts.seed || 20261124) >>> 0;
    this.time = 0;
    this.events = [];
    this.coop = !!opts.coop;
    this.goldFound = new Set(opts.goldFound || []);
    this.goldThisRun = [];
    const bonded = opts.bonded || [false, false, false, false];

    const p1 = opts.p1Hero ?? 0;
    let p2 = opts.p2Hero ?? (p1 === 0 ? 1 : 0);
    if (p2 === p1) p2 = (p1 + 1) % 4;
    this.players = [{ hero: p1, in: blankInput(), prev: blankInput() }];
    if (this.coop) this.players.push({ hero: p2, in: blankInput(), prev: blankInput() });

    const s = this.L.spawn;
    const spots = [[0, 0], [-1.8, 2.2], [1.8, 2.2], [0, 4.0]];
    const order = [p1, ...[0, 1, 2, 3].filter((i) => i !== p1)];
    this.heroes = HEROES.map((d, i) => {
      const sp = spots[order.indexOf(i)];
      return {
        i, def: d, x: s.x + sp[0], y: s.y, z: s.z + sp[1], vy: 0, fx: 0, fz: -1,
        onGround: true, floor: null, hp: d.maxHp, state: 'ok', stateT: 0,
        control: null, in: blankInput(), prevJump: false, cd: 0,
        dashT: 0, dashX: 0, dashZ: 0, dashHit: null, invuln: 0,
        lastSafe: { x: s.x + sp[0], y: s.y, z: s.z + sp[1] },
        speedNow: 0, bonded: !!bonded[i], leap: null, stuckT: 0, aiAttackT: 1 + i * 0.6,
        reviveT: 0, webFreeT: 0, calledT: 0, fallsAt: {},
      };
    });
    this.players.forEach((p, pi) => { this.heroes[p.hero].control = pi; });

    this.gates = this.L.gates;
    this.enemies = this.L.enemies.map((e, i) => ({
      id: i, type: e.type, def: ENEMIES[e.type], x: e.x, y: e.y, z: e.z, home: { x: e.x, z: e.z },
      hp: ENEMIES[e.type].hp * this.diff.enemyHp, maxHp: ENEMIES[e.type].hp * this.diff.enemyHp,
      state: 'idle', t: 0, slowT: 0, fx: 0, fz: 1, target: null, leash: e.leash, flash: 0,
    }));
    this.webs = this.L.webs.map((w, i) => ({ id: i, x: w.x, y: w.y, z: w.z, used: false, hero: null }));
    this.bushes = this.L.bushes.map((b, i) => ({ id: i, x: b.x, y: b.y, z: b.z, taken: false }));
    this.gold = this.L.gold.map((g) => ({ ...g, taken: this.goldFound.has(g.id) }));
    this.triggers = this.L.triggers.map((t) => ({ ...t, fired: false }));
    this.projectiles = [];
    this.guardian = this.L.guardian ? this.makeGuardian(this.L.guardian) : null;
    this.eggTouched = false;
    this.exitReached = false;
    this.lost = false;
    this.paused = false;
    this.checkpoint = { x: s.x, y: s.y, z: s.z };
    this.progressT = 0;
    this.hintCount = 0;
    this.farthestZ = s.z;
    this.stats = {
      gatesOpened: [], hints: [], falls: 0, caught: 0, wrongGift: 0, enemiesFreed: 0, giftsUsed: [0, 0, 0, 0],
      fight: null, fights: [],
    };
  }

  // ---- small helpers -------------------------------------------------------

  rand() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  emit(type, data = {}) { this.events.push({ type, t: this.time, ...data }); }

  drain() { const e = this.events; this.events = []; return e; }

  progress() { this.progressT = 0; }

  playerHero(pi = 0) { return this.heroes[this.players[pi].hero]; }

  leader() { return this.playerHero(0); }

  isUp(h) { return h.state === 'ok'; }

  setInput(pi, input) { if (this.players[pi]) Object.assign(this.players[pi].in, input); }

  floorAt(x, z) {
    let best = null, bestY = -Infinity;
    for (const f of this.L.floors) {
      if (!f.active || x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue;
      const fy = floorHeight(f, z);
      if (fy > bestY) { bestY = fy; best = f; }
    }
    return best;
  }

  gapAt(x, z) {
    for (const g of this.L.gaps) if (inRect(g, x, z)) return g;
    return null;
  }

  wallAt(x, z, r = HERO_RADIUS) {
    for (const w of this.L.walls) {
      if (w.active && x > w.x0 - r && x < w.x1 + r && z > w.z0 - r && z < w.z1 + r) return w;
    }
    return null;
  }

  // Can a body at height y stand (or fall) at this spot?
  canEnter(x, z, y, allowGaps) {
    if (this.wallAt(x, z)) return false;
    const f = this.floorAt(x, z);
    if (f) return floorHeight(f, z) <= y + STEP_UP;
    return allowGaps && !!this.gapAt(x, z);
  }

  gateById(id) { return this.gates.find((g) => g.id === id); }

  firstClosedGate() { return this.gates.find((g) => !g.open) || null; }

  // Where the family waits in front of a closed gate.
  holdZ(g) { return g.mech === 'wall' ? g.wall.z1 + 1.6 : g.zNear + 1.6; }

  // ---- one step of the world -----------------------------------------------

  step(dt) {
    if (this.paused || this.lost) return;
    this.time += dt;
    this.updatePlayers();
    this.updatePlatforms(dt);
    for (const h of this.heroes) if (h.control === null) this.companionThink(h, dt);
    for (const h of this.heroes) this.updateHero(h, dt);
    if (this.coop) this.keepTogether();
    this.updateGates(dt);
    for (const e of this.enemies) this.updateEnemy(e, dt);
    if (this.guardian) this.updateGuardian(this.guardian, dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateHints(dt);
    this.checkLost();
  }

  // ---- players, swapping and calling ------------------------------------------

  updatePlayers() {
    this.players.forEach((p, pi) => {
      const h = this.heroes[p.hero];
      h.in = p.in;
      if (p.in.next && !p.prev.next) this.swapHero(pi, 1);
      if (p.in.prev && !p.prev.prev) this.swapHero(pi, -1);
      if (p.in.call && !p.prev.call) this.callFamily(pi);
      p.prev = { ...p.in };
    });
  }

  swapHero(pi, dir = 1, to = null) {
    const p = this.players[pi];
    const from = this.heroes[p.hero];
    let idx = p.hero;
    for (let n = 0; n < 4; n++) {
      idx = to !== null ? to : (idx + dir + 4) % 4;
      const h = this.heroes[idx];
      if (h.control === null && h.state !== 'down' && h.state !== 'webbed') {
        from.control = null;
        from.in = blankInput();
        h.control = pi;
        h.in = p.in;
        h.prevJump = true;        // a held button must be released before it counts
        p.hero = idx;
        this.emit('swap', { hero: idx, from: from.i, player: pi });
        return true;
      }
      if (to !== null) break;
    }
    return false;
  }

  canPopTo(c, lead) {
    if (!lead.onGround || (lead.floor && lead.floor.moving)) return false;
    if (this.gapAt(lead.x, lead.z) && !this.floorAt(lead.x, lead.z)) return false;
    const g = this.firstClosedGate();
    if (g && lead.z < this.holdZ(g) - 0.4) return false;       // the leader is inside a closed gate
    return true;
  }

  popTo(c, lead, slot) {
    const spots = [[-1.7, 1.9], [1.7, 1.9], [0, 3.2], [-2.6, 0.4], [2.6, 0.4]];
    for (let k = 0; k < spots.length; k++) {
      const sp = spots[(slot + k) % spots.length];
      const x = lead.x + sp[0], z = lead.z + sp[1];
      const f = this.floorAt(x, z);
      if (f && !f.moving && !this.wallAt(x, z) && Math.abs(floorHeight(f, z) - lead.y) < 1.5) {
        c.x = x; c.z = z; c.y = floorHeight(f, z); c.vy = 0; c.stuckT = 0; c.onGround = true;
        this.emit('pop', { hero: c.i });
        return true;
      }
    }
    return false;
  }

  callFamily(pi) {
    const lead = this.playerHero(pi);
    this.emit('call', { hero: lead.i });
    let slot = 0;
    for (const c of this.heroes) {
      if (c.control !== null || c.state === 'down' || c.state === 'webbed') continue;
      c.calledT = 3;
      if (this.canPopTo(c, lead)) this.popTo(c, lead, slot++);
    }
  }

  // ---- heroes ---------------------------------------------------------------

  heroSpeed(h) { return h.def.speed; }

  updateHero(h, dt) {
    if (h.cd > 0) h.cd -= dt;
    if (h.invuln > 0) h.invuln -= dt;
    if (h.calledT > 0) h.calledT -= dt;

    if (h.leap) { this.updateLeap(h, dt); return; }

    let mx = 0, mz = 0;
    const can = h.state === 'ok';
    if (h.state === 'dizzy') {
      h.stateT -= dt;
      if (h.stateT <= 0) { h.state = 'ok'; h.hp = h.def.maxHp; h.invuln = 1.5; this.emit('up', { hero: h.i }); }
    } else if (h.state === 'webbed') {
      this.updateWebbed(h, dt);
    } else if (h.state === 'down') {
      this.updateDown(h, dt);
    }

    if (can) {
      mx = h.in.mx; mz = h.in.mz;
      const mag = Math.hypot(mx, mz);
      if (mag > 1) { mx /= mag; mz /= mag; }
      if (mag > 0.15) { const m = Math.hypot(mx, mz); h.fx = mx / m; h.fz = mz / m; } else { mx = 0; mz = 0; }

      // Gift.
      if (h.in.gift && h.cd <= 0) this.useGift(h);

      // Jump.
      const jumpNow = h.in.jump && !h.prevJump;
      if (jumpNow && h.onGround) {
        if (!this.tryLeap(h, true)) { h.vy = h.def.jump; h.onGround = false; this.emit('jump', { hero: h.i }); }
      }
      // Helpful hops on Easy.
      if (h.onGround && h.control !== null && Math.hypot(mx, mz) > 0.4) this.edgeAssist(h, mx, mz);
    }
    h.prevJump = h.in.jump;
    if (h.leap) return;

    // Sideways movement.
    let vx = mx * this.heroSpeed(h), vz = mz * this.heroSpeed(h);
    if (h.dashT > 0) {
      const d = h.def.dash;
      const sp = h.bonded ? d.bondedSpeed : d.speed;
      vx = h.dashX * sp; vz = h.dashZ * sp;
      h.dashT -= dt;
      this.dashHits(h);
    }
    // A steep slope pushes everyone back down.
    const slope = this.slopeUnder(h);
    if (slope) vz += RUN_GATE.slideSpeed;
    h.speedNow = can ? Math.hypot(vx, vz) : 0;

    const allowGaps = h.control !== null;
    const nx = h.x + vx * dt;
    if (vx !== 0 && this.canEnter(nx, h.z, h.y, allowGaps) && this.heroMayGo(h, nx, h.z)) h.x = nx;
    const nz = h.z + vz * dt;
    if (vz !== 0 && this.canEnter(h.x, nz, h.y, allowGaps) && this.heroMayGo(h, h.x, nz)) h.z = nz;

    // Up and down.
    const wasOn = h.onGround;
    h.vy -= GRAVITY * dt;
    h.y += h.vy * dt;
    const f = this.floorAt(h.x, h.z);
    h.onGround = false;
    if (f) {
      const gy = floorHeight(f, h.z);
      const near = h.y <= gy && h.y >= gy - (STEP_UP + 0.45);
      const stick = wasOn && h.vy <= 0 && h.y > gy && h.y - gy < STEP_UP + 0.2;
      if ((near && h.vy <= 0) || stick) {
        h.y = gy; h.vy = 0; h.onGround = true; h.floor = f;
        if (f.moving && f.dz) {
          const cz = h.z + f.dz;
          if (!this.wallAt(h.x, cz)) h.z = cz;
        }
      }
    }
    if (!h.onGround) h.floor = null;

    if (h.onGround && h.state === 'ok' && this.isSafeSpot(h, f)) {
      h.lastSafe.x = h.x; h.lastSafe.y = h.y; h.lastSafe.z = h.z;
    }
    if (h.control !== null && h.z < this.farthestZ - 3) { this.farthestZ = h.z; this.progress(); }

    // Fallen into a gap.
    const gap = this.gapAt(h.x, h.z);
    const base = gap ? gap.y : (f ? floorHeight(f, h.z) : h.lastSafe.y);
    if (h.y < base - FALL_DEPTH) this.fellIn(h, gap);
  }

  // Firm ground: somewhere a hero can safely be put back after a fall.
  isSafeSpot(h, f) {
    if (!f || f.moving || !SAFE_KINDS.has(f.kind)) return false;
    if (f.kind === 'corridor') {
      const g = this.gates.find((q) => q.corridor && inRect(q.corridor, h.x, h.z));
      if (g && !g.open) return false;
    }
    for (const d of [-1.4, 1.4]) {
      const n = this.floorAt(h.x, h.z + d);
      if (!n || n.moving || !SAFE_KINDS.has(n.kind)) return false;
    }
    return true;
  }

  // Rules that are not about floors: two-player distance and closed-gate lines for companions.
  heroMayGo(h, x, z) {
    if (h.control === null) {
      const g = this.firstClosedGate();
      if (g && z < this.holdZ(g) && z < h.z) { h.heldByGate = true; return false; }
      for (const w of this.webs) if (!w.used && Math.hypot(x - w.x, z - w.z) < WEB.radius + 0.5 && Math.hypot(x - w.x, z - w.z) < Math.hypot(h.x - w.x, h.z - w.z)) return false;
    } else if (this.coop) {
      const o = this.playerHero(h.control === 0 ? 1 : 0);
      if (o !== h && o.state !== 'down') {
        const dx = Math.abs(x - o.x), dz = Math.abs(z - o.z);
        if (dx > CO_OP.maxApartX && dx > Math.abs(h.x - o.x)) return false;
        if (dz > CO_OP.maxApartZ && dz > Math.abs(h.z - o.z)) return false;
      }
    }
    return true;
  }

  keepTogether() {
    // If something other than walking separated the two players, bring the one behind forward.
    const a = this.playerHero(0), b = this.playerHero(1);
    if (a.state === 'down' || b.state === 'down' || a.leap || b.leap) return;
    if (Math.abs(a.z - b.z) > CO_OP.maxApartZ + 6 || Math.abs(a.x - b.x) > CO_OP.maxApartX + 6) {
      const behind = a.z > b.z ? a : b, ahead = behind === a ? b : a;
      if (this.canPopTo(behind, ahead)) this.popTo(behind, ahead, 0);
    }
  }

  slopeUnder(h) {
    for (const g of this.gates) {
      if (g.mech === 'run' && g.style === 'slope' && !g.open && inRect(g.corridor, h.x, h.z)) return g;
    }
    return null;
  }

  fellIn(h, gap) {
    this.stats.falls++;
    const gate = gap && gap.gate ? this.gateById(gap.gate) : null;
    h.x = h.lastSafe.x; h.y = h.lastSafe.y; h.z = h.lastSafe.z; h.vy = 0; h.dashT = 0;
    h.invuln = 1.5;
    if (this.diff.fallDamage && h.control !== null) this.hurt(h, this.diff.fallDamage / this.diff.damageTaken, 'fall', true);
    this.emit('fell', { hero: h.i, gap: gap ? gap.id : null, kind: gap ? gap.kind : 'drop' });
    if (gate && !gate.open && h.control !== null) {
      h.fallsAt[gate.id] = (h.fallsAt[gate.id] || 0) + 1;
      if (h.fallsAt[gate.id] === 2 || h.fallsAt[gate.id] % 4 === 0) this.giveHint(true);
    } else if (gap && !gate && h.control !== null) {
      // A plain gap, with no gift needed: say how to cross it.
      h.fallsAt[gap.id] = (h.fallsAt[gap.id] || 0) + 1;
      if (h.fallsAt[gap.id] === 2 || h.fallsAt[gap.id] % 4 === 0) this.giveHint(true, this.gapHint(gap));
    }
  }

  // Joshua's long leap, helped along on Easy and Medium.
  tryLeap(h, pressed) {
    if (h.i !== 0 || h.control === null) return false;
    const mode = this.diff.leapAssist;
    if (mode === 'none') return false;
    for (const g of this.gates) {
      if (g.mech !== 'leap' || g.open) continue;
      const d = h.z - g.zNear;
      if (d < -0.2 || d > 4.5 || h.x < g.cx - 3.2 || h.x > g.cx + 3.2) continue;
      if (h.in.mz > -0.3) continue;                               // must be heading for the gap
      if (mode === 'press' && !pressed) continue;
      if (mode === 'auto' && !pressed && d > 0.9) continue;
      h.leap = { t: 0, T: 0.95, x0: h.x, z0: h.z, y0: h.y, x1: h.x, z1: g.zFar - 2.2, y1: g.y, h: 3.0 };
      h.onGround = false; h.dashT = 0;
      this.emit('leap', { hero: h.i, gate: g.id });
      return true;
    }
    return false;
  }

  updateLeap(h, dt) {
    const l = h.leap;
    l.t += dt;
    const k = Math.min(1, l.t / l.T);
    h.x = l.x0 + (l.x1 - l.x0) * k;
    h.z = l.z0 + (l.z1 - l.z0) * k;
    h.y = l.y0 + (l.y1 - l.y0) * k + Math.sin(Math.PI * k) * l.h;
    h.fx = 0; h.fz = -1; h.speedNow = 12;
    if (k >= 1) { h.leap = null; h.vy = 0; h.onGround = true; h.y = l.y1; this.emit('land', { hero: h.i }); }
  }

  edgeAssist(h, mx, mz) {
    const ax = h.x + (mx / Math.hypot(mx, mz)) * 0.8, az = h.z + (mz / Math.hypot(mx, mz)) * 0.8;
    if (this.floorAt(ax, az)) return;
    const gap = this.gapAt(ax, az);
    if (!gap) return;
    if (this.tryLeap(h, false)) return;
    if (this.diff.autoHop && gap.kind2 === 'hop') { h.vy = h.def.jump; h.onGround = false; this.emit('jump', { hero: h.i }); }
  }

  updateWebbed(h, dt) {
    h.stateT += dt;
    let helper = null;
    for (const o of this.heroes) {
      if (o === h || o.state !== 'ok') continue;
      if (Math.hypot(o.x - h.x, o.z - h.z) < WEB.freeReach) { helper = o; break; }
    }
    if (helper) h.webFreeT += dt; else h.webFreeT = 0;
    const auto = this.diff.webAutoFree && h.stateT > this.diff.webAutoFree;
    if (h.webFreeT >= WEB.freeTime || auto) {
      h.state = 'ok'; h.invuln = 1.0;
      const web = this.webs.find((w) => w.hero === h.i && !w.used);
      if (web) web.used = true;
      this.emit('webFreed', { hero: h.i, by: helper ? helper.i : null });
      this.progress();
    }
  }

  updateDown(h, dt) {
    let helper = null;
    for (const o of this.heroes) {
      if (o === h || o.state !== 'ok') continue;
      if (o.control === null && !this.diff.companionsRevive) continue;
      if (Math.hypot(o.x - h.x, o.z - h.z) < REVIVE.reach) { helper = o; break; }
    }
    if (helper) h.reviveT += dt; else h.reviveT = Math.max(0, h.reviveT - dt);
    if (h.reviveT >= REVIVE.time) {
      h.state = 'ok'; h.hp = h.def.maxHp * 0.6; h.invuln = 2; h.reviveT = 0;
      this.emit('revived', { hero: h.i, by: helper.i });
    }
  }

  hurt(h, amount, src, force = false) {
    if (h.state !== 'ok' || h.leap) return false;
    if (!force && (h.invuln > 0 || h.dashT > 0)) return false;
    const share = h.control === null ? COMPANIONS.damageTaken : 1;
    h.hp -= amount * this.diff.damageTaken * share;
    if (!force) h.invuln = 0.8;
    this.emit('hurt', { hero: h.i, src });
    if (h.hp <= 0) {
      h.hp = 0; h.dashT = 0;
      if (!this.diff.canLose) {
        h.state = 'dizzy'; h.stateT = this.diff.dizzyTime;
        this.emit('dizzy', { hero: h.i });
      } else {
        h.state = 'down'; h.reviveT = 0;
        this.emit('down', { hero: h.i });
        if (h.control !== null) this.swapHero(h.control, 1);
      }
    }
    return true;
  }

  checkLost() {
    if (!this.diff.canLose || this.lost) return;
    if (this.heroes.every((h) => h.state === 'down')) {
      this.lost = true;
      this.emit('lost', {});
    }
  }

  // Start again from the last gate that was opened. Nothing found is lost.
  retry() {
    const c = this.checkpoint;
    const spots = [[0, 0], [-1.8, 2.0], [1.8, 2.0], [0, 3.6]];
    this.heroes.forEach((h, k) => {
      h.x = c.x + spots[k][0]; h.z = c.z + spots[k][1]; h.y = c.y; h.vy = 0;
      h.hp = h.def.maxHp; h.state = 'ok'; h.invuln = 2; h.dashT = 0; h.leap = null;
      h.lastSafe = { x: h.x, y: h.y, z: h.z };
    });
    this.projectiles = [];
    const g = this.guardian;
    if (g && g.state === 'fight') {
      g.state = 'asleep'; g.knotsLeft = g.knots; g.knotHp = FIGHT.knotHp; g.attack = null;
      g.x = g.home.x; g.z = g.home.z;
      this.stats.fight = null;
    }
    for (const e of this.enemies) if (e.state !== 'freed' && e.state !== 'gone') { e.state = 'idle'; e.x = e.home.x; e.z = e.home.z; }
    this.lost = false;
    this.progress();
    this.emit('retry', {});
  }

  // ---- gifts ------------------------------------------------------------------

  // Things a gift can be aimed at: creatures, the guardian and the right gate's targets.
  aimCandidates(h) {
    const out = [];
    for (const e of this.enemies) if (e.state !== 'freed' && e.state !== 'gone') out.push({ x: e.x, z: e.z, r: 0.9 });
    const g = this.guardian;
    if (g && g.state === 'fight') out.push({ x: g.x, z: g.z, r: g.def.radius });
    if (h.control !== null) {
      for (const gate of this.gates) {
        if (gate.open || gate.gift !== h.def.gift) continue;
        const t = this.nextTarget(gate);
        if (t) out.push({ x: t.x, z: t.z, r: 0.9 });
      }
    }
    return out;
  }

  nextTarget(gate) {
    if (gate.slices.length) return gate.targets.find((t) => !t.done) || null;   // ice is laid from the bank outward
    return null;
  }

  openTargets(gate) {
    if (gate.slices.length) { const t = this.nextTarget(gate); return t ? [t] : []; }
    return gate.targets.filter((t) => !t.done);
  }

  aim(h, range, cone) {
    let best = null, bestScore = Infinity;
    const cands = this.aimCandidates(h);
    if (h.control !== null) {
      for (const gate of this.gates) {
        if (gate.open || gate.gift !== h.def.gift || gate.slices.length) continue;
        for (const t of gate.targets) if (!t.done) cands.push({ x: t.x, z: t.z, r: 0.9 });
      }
    }
    for (const c of cands) {
      const dx = c.x - h.x, dz = c.z - h.z;
      const d = Math.hypot(dx, dz) - c.r;
      if (d > range) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * h.fx + dz * h.fz) / (Math.hypot(dx, dz) || 1))));
      if (ang > cone && d > 1.2) continue;
      const score = d + ang * 4;
      if (score < bestScore) { bestScore = score; best = c; }
    }
    if (best) {
      const dx = best.x - h.x, dz = best.z - h.z, m = Math.hypot(dx, dz) || 1;
      h.fx = dx / m; h.fz = dz / m;
    }
    return best;
  }

  useGift(h) {
    const d = h.def;
    h.cd = d.giftCooldown;
    if (h.control !== null) this.stats.giftsUsed[h.i]++;
    const cone = h.control !== null ? this.diff.aimCone : 1.2;
    if (d.gift === 'speed') {
      // Joshua's dash: aimed at a creature only if one is close ahead.
      const moving = Math.hypot(h.in.mx, h.in.mz) > 0.3;
      if (!this.slopeUnder(h) && !this.inRunGate(h)) this.aim(h, moving ? 7 : 9, moving ? Math.min(cone, 0.6) : cone);
      h.dashT = h.bonded ? d.dash.bondedTime : d.dash.time;
      h.dashX = h.fx; h.dashZ = h.fz; h.dashHit = new Set();
      this.emit('gift', { hero: h.i, gift: 'speed' });
      if (h.onGround && this.tryLeap(h, true)) return;
    } else if (d.gift === 'fire' || d.gift === 'ice') {
      this.aim(h, d.bolt.speed * d.bolt.life, cone);
      this.projectiles.push({
        kind: d.gift, from: 'hero', hero: h.i, player: h.control !== null,
        x: h.x + h.fx * 0.7, z: h.z + h.fz * 0.7, y: h.y + h.def.height * 0.6,
        vx: h.fx * d.bolt.speed, vz: h.fz * d.bolt.speed,
        r: h.bonded ? d.bolt.bondedRadius : d.bolt.radius, life: d.bolt.life, damage: d.giftDamage,
      });
      this.emit('gift', { hero: h.i, gift: d.gift });
    } else {
      // Michael's slam.
      this.aim(h, 5.5, 3.2);
      const cx = h.x + h.fx * d.slam.reach, cz = h.z + h.fz * d.slam.reach;
      const r = h.bonded ? d.slam.bondedRadius : d.slam.radius;
      this.emit('gift', { hero: h.i, gift: 'strength', x: cx, z: cz, r });
      this.areaHit(h, cx, cz, r, d.giftDamage, 'strength');
    }
  }

  inRunGate(h) {
    return this.gates.some((g) => g.mech === 'run' && !g.open && inRect(g.corridor, h.x, h.z));
  }

  dashHits(h) {
    const r = h.def.dash.hitRadius;
    this.areaHit(h, h.x + h.dashX * 0.8, h.z + h.dashZ * 0.8, r, h.def.giftDamage, 'speed', h.dashHit);
  }

  // A gift lands on everything in a circle.
  areaHit(h, x, z, r, damage, gift, once = null) {
    const player = h.control !== null;
    for (const e of this.enemies) {
      if (e.state === 'freed' || e.state === 'gone') continue;
      if (once && once.has(e)) continue;
      if (Math.hypot(e.x - x, e.z - z) < r + 0.8) { this.hitEnemy(e, damage, gift, h); if (once) once.add(e); }
    }
    const g = this.guardian;
    if (g && g.state === 'fight' && !(once && once.has(g))) {
      if (Math.hypot(g.x - x, g.z - z) < r + g.def.radius) { this.hitGuardian(g, damage, gift, h); if (once) once.add(g); }
    }
    for (const gate of this.gates) {
      if (gate.open) continue;
      for (const t of this.openTargets(gate)) {
        if (once && once.has(t)) continue;
        if (Math.hypot(t.x - x, t.z - z) < r + 0.9) { this.hitTarget(gate, t, gift, h); if (once) once.add(t); }
      }
    }
    return player;
  }

  hitTarget(gate, t, gift, h) {
    if (t.done) return;
    if (h.control === null) return;                 // companions never open a gate
    if (gift !== gate.gift || (gate.dragon && !h.bonded)) {
      this.stats.wrongGift++;
      this.emit('wrongGift', { gate: gate.id, hero: h.i, x: t.x, z: t.z });
      return;
    }
    t.hp -= 1;
    this.progress();
    this.emit('targetHit', { gate: gate.id, index: gate.targets.indexOf(t), left: t.hp, hero: h.i });
    if (t.hp <= 0) {
      t.done = true;
      if (t.slice !== undefined) gate.slices[t.slice].active = true;
      this.emit('targetDone', { gate: gate.id, index: gate.targets.indexOf(t), hero: h.i });
      if (gate.targets.every((q) => q.done)) this.openGate(gate, h.i);
    }
  }

  openGate(g, by) {
    if (g.open) return;
    g.open = true;
    if (g.wall) g.wall.active = false;
    if (g.door) g.door.active = false;
    if (g.bridge) g.bridge.active = true;
    for (const s of g.slices) s.active = true;
    this.checkpoint = { x: g.farSpot.x, y: g.yFar ?? g.y, z: g.farSpot.z };
    this.stats.gatesOpened.push({ id: g.id, t: this.time, by, gift: g.gift });
    this.progress();
    this.emit('gateOpen', { gate: g.id, hero: by, gift: g.gift });
  }

  // ---- gates that need running ----------------------------------------------

  updateGates(dt) {
    for (const g of this.gates) {
      if (g.open) continue;
      if (g.mech === 'run') this.updateRunGate(g, dt);
      else if (g.mech === 'leap') {
        const j = this.heroes[0];
        if (j.control !== null && j.onGround && !j.leap && j.z < g.zFar - 0.3 && j.z > g.zFar - 12) this.openGate(g, 0);
      }
    }
  }

  updateRunGate(g, dt) {
    const c = g.corridor;
    const inside = this.heroes.filter((h) => h.state !== 'down' && inRect(c, h.x, h.z));
    const j = this.heroes[0];
    // Joshua, with a player at the controls, comes out of the far end.
    if (j.control !== null && j.state === 'ok' && j.z < g.zFar + 0.4 && j.z > g.zFar - 6 && Math.abs(j.x - g.cx) < (c.x1 - c.x0) / 2 + 1) {
      if (g.style !== 'door' || !g.door.active) { this.openGate(g, 0); g.chaser.active = false; return; }
    }
    if (g.style === 'slope') return;                           // the push-back is in the hero's movement
    const ch = g.chaser;
    const deep = inside.some((h) => g.zNear - h.z >= RUN_GATE.triggerDepth);
    if (g.style === 'door') {
      if (!ch.active && !g.door.active && deep) { ch.active = true; ch.t = 0; this.emit('chase', { gate: g.id, style: 'door' }); }
      if (ch.active) {
        ch.t += dt;
        ch.z = g.zNear - RUN_GATE.triggerDepth - RUN_GATE.doorSpeed * ch.t;
        if (ch.z <= g.door.z1 + 0.6) { ch.active = false; g.door.active = true; this.pushOutOf(g.door); this.emit('doorShut', { gate: g.id }); }
      } else if (g.door.active && inside.length === 0) {
        g.door.active = false;
        this.emit('doorReset', { gate: g.id });
      }
      return;
    }
    // A chase: something sweeps the corridor faster than anyone but Joshua.
    if (!ch.active && deep) { ch.active = true; ch.z = g.zNear; this.emit('chase', { gate: g.id, style: g.style }); }
    if (ch.active) {
      ch.z -= this.diff.chaserSpeed * dt;
      for (const h of inside) {
        if (h.z >= ch.z - 0.3 && !h.leap) {
          h.x = g.useSpot.x + (h.i - 1.5) * 1.1; h.z = g.useSpot.z + 1.2; h.y = g.y; h.vy = 0; h.dashT = 0;
          h.invuln = 1.2;
          this.stats.caught++;
          this.emit('caught', { gate: g.id, hero: h.i });
        }
      }
      if (ch.z < g.zFar) { ch.active = false; this.emit('chaseEnd', { gate: g.id }); }
    }
  }

  pushOutOf(wall) {
    for (const h of this.heroes) {
      if (h.x > wall.x0 - HERO_RADIUS && h.x < wall.x1 + HERO_RADIUS && h.z > wall.z0 - HERO_RADIUS && h.z < wall.z1 + HERO_RADIUS) {
        h.z = wall.z1 + HERO_RADIUS + 0.05;
      }
    }
  }

  // ---- moving platforms ---------------------------------------------------------

  updatePlatforms(dt) {
    for (const p of this.L.platforms) {
      const t = p.travel;
      p.dz = 0;
      if (t.pause > 0) { t.pause -= dt; continue; }
      const cz = (p.z0 + p.z1) / 2;
      const target = t.dir > 0 ? t.zB : t.zA;
      const stepZ = Math.sign(target - cz) * Math.min(Math.abs(target - cz), t.speed * dt);
      p.z0 += stepZ; p.z1 += stepZ; p.dz = stepZ;
      if (Math.abs(target - (cz + stepZ)) < 0.001) { t.dir *= -1; t.pause = t.wait; }
    }
  }

  // ---- companions ------------------------------------------------------------------

  companionThink(c, dt) {
    const inp = c.in;
    inp.mx = 0; inp.mz = 0; inp.jump = false; inp.gift = false;
    if (c.state !== 'ok') return;
    const lead = this.nearestPlayerHero(c);
    if (!lead) return;
    const slot = this.heroes.filter((h) => h.control === null && h.i < c.i).length;

    // Someone needs a hand: a webbed hero when called, a fallen hero where the rules allow.
    let need = null;
    for (const o of this.heroes) {
      if (o === c) continue;
      if (o.state === 'webbed' && (c.calledT > 0 || o.control === null)) need = o;
      if (o.state === 'down' && this.diff.companionsRevive) need = o;
    }

    let tx, tz, stopAt = 0.5;
    const g = this.guardian;
    const fighting = g && g.state === 'fight';
    let foe = null;
    if (!need) {
      if (fighting) foe = { x: g.x, z: g.z, r: g.def.radius, guardian: true };
      else {
        let bd = 10;
        for (const e of this.enemies) {
          if (e.state === 'freed' || e.state === 'gone' || e.state === 'idle') continue;
          const d = Math.hypot(e.x - c.x, e.z - c.z);
          if (d < bd) { bd = d; foe = { x: e.x, z: e.z, r: 0.8, enemy: e }; }
        }
      }
    }

    if (need) { tx = need.x; tz = need.z + 0.2; stopAt = 1.4; }
    else if (foe) {
      // Stand at a sensible distance and help gently.
      const ranged = c.def.gift === 'fire' || c.def.gift === 'ice';
      const want = foe.r + (ranged ? 7.5 : (fighting ? 4.6 : 2.0));
      const dx = c.x - foe.x, dz = c.z - foe.z, d = Math.hypot(dx, dz) || 1;
      const side = (slot - 1) * 0.9;
      tx = foe.x + (dx / d) * want + (-dz / d) * side; tz = foe.z + (dz / d) * want + (dx / d) * side;
      stopAt = 0.8;
      c.fx = -dx / d; c.fz = -dz / d;
      c.aiAttackT -= dt;
      if (c.aiAttackT <= 0 && d - foe.r < (ranged ? 12 : 6)) {
        c.aiAttackT = COMPANIONS.attackEvery;
        if (foe.guardian) this.hitGuardian(g, COMPANIONS.attackDamage, c.def.gift, c);
        else this.hitEnemy(foe.enemy, COMPANIONS.enemyDamage, c.def.gift, c);
        this.emit('companionAttack', { hero: c.i, x: foe.x, z: foe.z });
      }
      // Step out of the way of a guardian's warning.
      if (fighting && g.attack && !g.attack.fired) {
        const away = this.dodgeVector(c, g.attack);
        if (away) { tx = c.x + away.x * 4; tz = c.z + away.z * 4; stopAt = 0.1; }
      }
    } else {
      const off = [[-1.8, 2.4], [1.8, 2.4], [0, 3.8]][slot] || [0, 3];
      tx = lead.x + off[0]; tz = lead.z + off[1];
      stopAt = Math.hypot(lead.x - c.x, lead.z - c.z) > COMPANIONS.followDistance + 1.5 ? 0.6 : 1.6;
    }

    const dx = tx - c.x, dz = tz - c.z, dist = Math.hypot(dx, dz);
    const farFromLead = Math.hypot(lead.x - c.x, lead.z - c.z);
    if (dist > stopAt) { inp.mx = dx / dist; inp.mz = dz / dist; }

    // Catch up when left behind or stuck, unless a closed gate lies between.
    const moved = Math.hypot(c.x - (c.lastX ?? c.x), c.z - (c.lastZ ?? c.z));
    c.lastX = c.x; c.lastZ = c.z;
    if (dist > stopAt + 0.5 && moved < 0.01 && !c.heldByGate) c.stuckT += dt; else c.stuckT = Math.max(0, c.stuckT - dt * 2);
    c.heldByGate = false;
    if (!foe && !need && (farFromLead > COMPANIONS.catchUpDistance || (c.stuckT > 1.2 && farFromLead > 4.5))) {
      if (this.canPopTo(c, lead)) this.popTo(c, lead, slot);
    }
  }

  nearestPlayerHero(c) {
    let best = null, bd = Infinity;
    for (const p of this.players) {
      const h = this.heroes[p.hero];
      if (h.state === 'down') continue;
      const d = Math.hypot(h.x - c.x, h.z - c.z);
      if (d < bd) { bd = d; best = h; }
    }
    return best || this.heroes[this.players[0].hero];
  }

  dodgeVector(h, attack) {
    for (const s of attack.shapes) {
      if (s.kind === 'ring') {
        const dx = h.x - s.x, dz = h.z - s.z, d = Math.hypot(dx, dz);
        if (d < s.r + 1.2) return { x: dx / (d || 1), z: dz / (d || 1) };
      } else if (s.kind === 'line') {
        const rx = h.x - s.x, rz = h.z - s.z;
        const along = rx * s.dx + rz * s.dz, side = rx * -s.dz + rz * s.dx;
        if (along > -1 && along < s.len + 1 && Math.abs(side) < s.w / 2 + 1.2) {
          const sg = side >= 0 ? 1 : -1;
          return { x: -s.dz * sg, z: s.dx * sg };
        }
      }
    }
    return null;
  }

  // ---- small creatures ---------------------------------------------------------------

  updateEnemy(e, dt) {
    if (e.state === 'gone') return;
    if (e.flash > 0) e.flash -= dt;
    if (e.slowT > 0) e.slowT -= dt;
    if (e.state === 'freed') {
      e.t += dt;
      // Freed creatures scamper off happily.
      e.x += e.fx * 5 * dt; e.z += e.fz * 5 * dt;
      if (e.t > 2.2) e.state = 'gone';
      return;
    }
    let target = null, bd = Infinity;
    for (const h of this.heroes) {
      if (h.state !== 'ok') continue;
      const d = Math.hypot(h.x - e.x, h.z - e.z) + (h.control === null ? 2.5 : 0);
      if (d < bd) { bd = d; target = h; }
    }
    const dist = target ? Math.hypot(target.x - e.x, target.z - e.z) : Infinity;
    if (e.state === 'idle') {
      if (target && dist < e.def.aggro && inRect(e.leash, target.x, target.z)) { e.state = 'chase'; this.emit('enemyWake', { id: e.id }); }
      return;
    }
    if (e.state === 'chase') {
      if (!target || !inRect(e.leash, target.x, target.z) || dist > e.def.aggro * 2.2) {
        // Go home.
        const hx = e.home.x - e.x, hz = e.home.z - e.z, hd = Math.hypot(hx, hz);
        if (hd < 0.5) { e.state = 'idle'; return; }
        this.moveEnemy(e, hx / hd, hz / hd, dt);
        return;
      }
      const dx = target.x - e.x, dz = target.z - e.z;
      e.fx = dx / (dist || 1); e.fz = dz / (dist || 1);
      if (dist > 1.7) this.moveEnemy(e, e.fx, e.fz, dt);
      else { e.state = 'windup'; e.t = this.diff.enemyWindup + 0.35; e.target = target.i; this.emit('enemyWindup', { id: e.id }); }
      return;
    }
    if (e.state === 'windup') {
      e.t -= dt;
      if (e.t <= 0) {
        const h = this.heroes[e.target];
        if (h && Math.hypot(h.x - e.x, h.z - e.z) < 2.4 && h.y - e.y < 1.2) this.hurt(h, e.def.damage, 'enemy');
        this.emit('enemyStrike', { id: e.id });
        e.state = 'recover'; e.t = 1.3;
      }
      return;
    }
    if (e.state === 'recover') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
  }

  moveEnemy(e, dx, dz, dt) {
    const sp = e.def.speed * this.diff.enemySpeed * (e.slowT > 0 ? 0.45 : 1);
    const nx = e.x + dx * sp * dt, nz = e.z + dz * sp * dt;
    if (this.canEnter(nx, e.z, e.y, false) && nx > e.leash.x0 + 0.6 && nx < e.leash.x1 - 0.6) e.x = nx;
    if (this.canEnter(e.x, nz, e.y, false) && nz > e.leash.z0 && nz < e.leash.z1) e.z = nz;
    const f = this.floorAt(e.x, e.z);
    if (f) e.y = floorHeight(f, e.z);
  }

  hitEnemy(e, damage, gift, h) {
    if (e.state === 'freed' || e.state === 'gone') return;
    const dmg = damage * (h.control !== null ? this.diff.giftPower : 1);
    e.hp -= dmg;
    e.flash = 0.2;
    if (gift === 'ice') e.slowT = 2.5;
    if (e.state === 'idle') e.state = 'chase';
    this.emit('enemyHit', { id: e.id, gift, hero: h.i });
    if (e.hp <= 0) {
      e.state = 'freed'; e.t = 0;
      const dx = e.x - h.x, dz = e.z - h.z, d = Math.hypot(dx, dz) || 1;
      e.fx = dx / d * 0.4 + (e.x >= 0 ? 0.9 : -0.9); e.fz = dz / d * 0.2;
      const m = Math.hypot(e.fx, e.fz); e.fx /= m; e.fz /= m;
      this.stats.enemiesFreed++;
      this.progress();
      this.emit('enemyFreed', { id: e.id, kind: e.type, hero: h.i });
    }
  }

  // ---- guardians -------------------------------------------------------------------

  makeGuardian(spec) {
    const def = GUARDIANS[spec.type];
    const knots = def.final ? this.diff.finalKnots : this.diff.guardianKnots;
    return {
      type: spec.type, def, x: spec.x, y: spec.y, z: spec.z, home: { x: spec.x, z: spec.z },
      fx: 0, fz: 1, state: 'asleep', knots, knotsLeft: knots, knotHp: FIGHT.knotHp, knotCompanion: 0,
      knotLocked: false, cycleT: 0, attack: null, attackIdx: 0, slowT: 0, holdT: 0, holdImmuneT: 0,
      stagger: 0, flash: 0, t: 0,
    };
  }

  updateGuardian(g, dt) {
    const A = this.L.arena;
    if (g.state === 'asleep') {
      for (const p of this.players) {
        const h = this.heroes[p.hero];
        if (h.state !== 'down' && h.z < A.startLine && h.z > A.z0 && h.x > A.x0 && h.x < A.x1) { this.startFight(g); break; }
      }
      return;
    }
    if (g.state !== 'fight') return;
    const fs = this.stats.fight;
    g.t += dt;
    if (g.flash > 0) g.flash -= dt;
    if (g.stagger > 0) g.stagger -= dt;
    if (g.slowT > 0) g.slowT -= dt;
    if (g.holdImmuneT > 0) g.holdImmuneT -= dt;
    if (g.holdT > 0) {
      g.holdT -= dt;
      fs.holdNow += dt;
      if (fs.holdNow > fs.maxHold) fs.maxHold = fs.holdNow;
    } else fs.holdNow = 0;

    // Who is she looking at?
    let target = null, bd = Infinity;
    for (const h of this.heroes) {
      if (h.state !== 'ok') continue;
      const d = Math.hypot(h.x - g.x, h.z - g.z) + (h.control === null ? 6 : 0);
      if (d < bd) { bd = d; target = h; }
    }

    // Walk toward the hero, but keep inside the arena.
    if (target && g.holdT <= 0 && g.stagger <= 0 && !(g.attack && g.attack.rooted)) {
      const dx = target.x - g.x, dz = target.z - g.z, d = Math.hypot(dx, dz) || 1;
      g.fx = dx / d; g.fz = dz / d;
      const keep = this.diff.guardianKeepAway + g.def.radius;
      if (d > keep + 0.3) {
        const sp = g.def.speed * this.diff.guardianSpeed * (g.slowT > 0 ? FIGHT.iceSlow : 1);
        g.x += g.fx * sp * dt; g.z += g.fz * sp * dt;
      }
      this.clampToArena(g);
    }

    // Standing against a guardian hurts on the harder settings.
    if (this.diff.guardianContact > 0) {
      for (const h of this.heroes) {
        if (h.state === 'ok' && h.dashT <= 0 && Math.hypot(h.x - g.x, h.z - g.z) < g.def.radius + 1.0) {
          this.hurt(h, this.diff.guardianContact * dt, 'contact', true);
        }
      }
    }

    // The attack cycle: warn, strike, rest.
    g.cycleT -= dt;
    if (g.cycleT <= 0 && !g.attack) {
      g.cycleT = this.diff.guardianCycle;
      g.knotLocked = false;
      this.startAttack(g, target);
    }
    if (g.attack) {
      const a = g.attack;
      a.t += dt;
      if (!a.fired && a.t >= a.tele) { a.fired = true; this.strike(g, a); }
      if (a.t >= a.tele + 0.7) g.attack = null;
    }
  }

  clampToArena(g) {
    const A = this.L.arena, m = g.def.radius + 0.8;
    g.x = Math.max(A.x0 + m, Math.min(A.x1 - m, g.x));
    g.z = Math.max(A.z0 + m, Math.min(A.z1 - m - 5, g.z));
  }

  startFight(g) {
    g.state = 'fight';
    g.cycleT = FIGHT.startDelay;
    g.t = 0;
    this.stats.fight = {
      guardian: g.type, start: this.time, end: null, playerDamage: 0, companionDamage: 0,
      acts: [], maxHold: 0, holdNow: 0, knots: g.knots, hero: this.leader().i,
    };
    this.progress();
    this.emit('fightStart', { guardian: g.type });
  }

  startAttack(g, target) {
    const name = g.def.attacks[g.attackIdx++ % g.def.attacks.length];
    const spec = ATTACKS[name];
    const a = { name, kind: spec.kind, t: 0, tele: this.diff.guardianTelegraph, fired: false, shapes: [], rooted: false };
    const tx = target ? target.x : g.x, tz = target ? target.z : g.z + 4;
    if (spec.kind === 'ring') {
      if (spec.at === 'self') { a.shapes.push({ kind: 'ring', x: g.x, z: g.z, r: spec.radius }); a.rooted = true; }
      else if (spec.at === 'target') { a.shapes.push({ kind: 'ring', x: tx, z: tz, r: spec.radius }); a.moveTo = { x: tx, z: tz }; a.rooted = true; }
      else {
        const hs = this.heroes.filter((h) => h.state === 'ok').sort((p, q) => (p.control === null) - (q.control === null));
        for (let i = 0; i < spec.count; i++) {
          const h = hs[i];
          if (h) a.shapes.push({ kind: 'ring', x: h.x, z: h.z, r: spec.radius });
          else a.shapes.push({ kind: 'ring', x: tx + (this.rand() - 0.5) * 12, z: tz + (this.rand() - 0.5) * 12, r: spec.radius });
        }
      }
    } else if (spec.kind === 'line') {
      const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz) || 1;
      a.shapes.push({ kind: 'line', x: g.x, z: g.z, dx: dx / d, dz: dz / d, len: spec.length, w: spec.width });
      a.rooted = true;
    } else {
      a.aim = { x: tx, z: tz };
      a.rooted = true;
    }
    g.attack = a;
    this.stats.fight.acts.push(this.time);
    this.emit('telegraph', { attack: name, kind: spec.kind, shapes: a.shapes, tele: a.tele });
  }

  strike(g, a) {
    const dmg = FIGHT.strikeDamage;
    this.emit('strike', { attack: a.name, kind: a.kind, shapes: a.shapes });
    if (a.kind === 'shots') {
      const spec = ATTACKS[a.name];
      const base = Math.atan2(a.aim.x - g.x, a.aim.z - g.z);
      for (let i = 0; i < spec.count; i++) {
        const ang = base + (i - (spec.count - 1) / 2) * spec.spread;
        this.projectiles.push({
          kind: 'spell', from: 'guardian', x: g.x + Math.sin(ang) * g.def.radius, z: g.z + Math.cos(ang) * g.def.radius,
          y: g.y + 0.7, vx: Math.sin(ang) * spec.speed, vz: Math.cos(ang) * spec.speed, r: spec.radius, life: 4, damage: dmg * 0.8,
        });
      }
      return;
    }
    for (const s of a.shapes) {
      for (const h of this.heroes) {
        if (h.state !== 'ok') continue;
        const f = this.floorAt(h.x, h.z);
        const off = f ? h.y - floorHeight(f, h.z) : 0;
        if (off > FIGHT.jumpClears) continue;                    // jumped over it
        let inside = false;
        if (s.kind === 'ring') inside = Math.hypot(h.x - s.x, h.z - s.z) < s.r;
        else {
          const rx = h.x - s.x, rz = h.z - s.z;
          const along = rx * s.dx + rz * s.dz, side = rx * -s.dz + rz * s.dx;
          inside = along > 0 && along < s.len && Math.abs(side) < s.w / 2;
        }
        if (inside) this.hurt(h, dmg, 'guardian');
      }
      if (s.kind === 'line') { g.x += s.dx * (s.len - 3); g.z += s.dz * (s.len - 3); this.clampToArena(g); }
    }
    if (a.moveTo) { g.x = a.moveTo.x; g.z = a.moveTo.z; this.clampToArena(g); }
  }

  hitGuardian(g, damage, gift, h) {
    if (g.state !== 'fight') return;
    const fs = this.stats.fight;
    const player = h.control !== null;
    g.flash = 0.15;
    if (gift === 'ice') {
      g.slowT = FIGHT.iceSlowTime;
      if (g.holdImmuneT <= 0 && player) { g.holdT = FIGHT.iceHold; g.holdImmuneT = FIGHT.iceHold + FIGHT.iceHoldImmunity; }
    }
    if (g.knotLocked) { this.emit('guardianHit', { gift, hero: h.i, locked: true }); return; }
    let dmg = damage;
    if (player) {
      dmg *= this.diff.giftPower;
      if (g.def.weak === gift) dmg *= FIGHT.weaknessBonus;
    } else {
      const room = FIGHT.knotHp * FIGHT.companionShareCap - g.knotCompanion;
      dmg = Math.max(0, Math.min(dmg, room, g.knotHp - 1));
      g.knotCompanion += dmg;
    }
    dmg = Math.min(dmg, g.knotHp);
    g.knotHp -= dmg;
    if (player) fs.playerDamage += dmg; else fs.companionDamage += dmg;
    this.emit('guardianHit', { gift, hero: h.i, locked: false });
    if (g.knotHp <= 0.0001) {
      g.knotsLeft--;
      g.knotHp = FIGHT.knotHp;
      g.knotCompanion = 0;
      g.knotLocked = true;
      g.stagger = 0.5;
      this.progress();
      this.emit('knot', { left: g.knotsLeft, of: g.knots, hero: h.i });
      if (g.knotsLeft <= 0) this.freeGuardian(g);
    }
  }

  freeGuardian(g) {
    g.state = 'freed';
    g.attack = null;
    this.projectiles = this.projectiles.filter((p) => p.from !== 'guardian');
    const fs = this.stats.fight;
    fs.end = this.time;
    fs.length = fs.end - fs.start;
    this.stats.fights.push(fs);
    for (const w of this.L.walls) if (w.seal) w.active = false;
    const A = this.L.arena;
    this.checkpoint = { x: A.cx, y: A.y, z: A.z0 + 4 };
    for (const h of this.heroes) { if (h.state === 'dizzy' || h.state === 'down') { h.state = 'ok'; } h.hp = h.def.maxHp; }
    this.progress();
    this.emit('guardianFreed', { guardian: g.type, length: fs.length });
  }

  // ---- things in flight -----------------------------------------------------------------

  updateProjectiles(dt) {
    const keep = [];
    for (const p of this.projectiles) {
      // A freed guardian's spells vanish with the spell that held it, even ones already in the air.
      if (p.from === 'guardian' && (!this.guardian || this.guardian.state !== 'fight')) continue;
      p.life -= dt;
      p.x += p.vx * dt; p.z += p.vz * dt;
      let dead = p.life <= 0;
      if (!dead && p.from === 'guardian') {
        for (const h of this.heroes) {
          if (h.state !== 'ok' || Math.hypot(h.x - p.x, h.z - p.z) >= p.r + 0.5) continue;
          const f = this.floorAt(h.x, h.z);
          if (f && h.y - floorHeight(f, h.z) > FIGHT.jumpClears) continue;      // jumped over it
          if (this.hurt(h, p.damage, 'spell')) { dead = true; break; }
        }
      } else if (!dead) {
        const h = this.heroes[p.hero];
        const shooter = { ...h, control: p.player ? 0 : null, i: h.i };
        for (const e of this.enemies) {
          if (e.state === 'freed' || e.state === 'gone') continue;
          if (Math.hypot(e.x - p.x, e.z - p.z) < p.r + 0.9) { this.hitEnemy(e, p.damage, p.kind, shooter); dead = true; break; }
        }
        const g = this.guardian;
        if (!dead && g && g.state === 'fight' && Math.hypot(g.x - p.x, g.z - p.z) < p.r + g.def.radius) {
          this.hitGuardian(g, p.damage, p.kind, shooter); dead = true;
        }
        if (!dead) {
          for (const gate of this.gates) {
            if (gate.open) continue;
            for (const t of this.openTargets(gate)) {
              if (Math.hypot(t.x - p.x, t.z - p.z) < p.r + 0.9) { this.hitTarget(gate, t, p.kind, shooter); dead = true; break; }
            }
            if (dead) break;
          }
        }
        if (dead) this.emit('boltHit', { x: p.x, y: p.y, z: p.z, kind: p.kind });
      }
      if (!dead && this.wallAt(p.x, p.z, 0)) { dead = true; this.emit('fizz', { x: p.x, y: p.y, z: p.z, kind: p.kind }); }
      if (!dead) keep.push(p);
    }
    this.projectiles = keep;
  }

  // ---- berries, webs, the egg and story lines ---------------------------------------------------

  updatePickups() {
    for (const p of this.players) {
      const h = this.heroes[p.hero];
      if (h.state !== 'ok') continue;
      for (const b of this.bushes) {
        if (!b.taken && Math.hypot(b.x - h.x, b.z - h.z) < PICKUPS.reach && Math.abs(b.y - h.y) < 2) {
          b.taken = true;
          for (const o of this.heroes) if (o.state === 'ok') o.hp = Math.min(o.def.maxHp, o.hp + PICKUPS.bushHeal);
          this.progress();
          this.emit('berry', { id: b.id, hero: h.i });
        }
      }
      for (const g of this.gold) {
        if (!g.taken && Math.hypot(g.x - h.x, g.z - h.z) < PICKUPS.reach && Math.abs(g.y - h.y) < 2.5) {
          g.taken = true;
          this.goldFound.add(g.id);
          this.goldThisRun.push(g.id);
          this.progress();
          this.emit('gold', { id: g.id, hero: h.i, count: this.goldFound.size });
        }
      }
      for (const w of this.webs) {
        if (!w.used && w.hero === null && Math.hypot(w.x - h.x, w.z - h.z) < WEB.radius && h.invuln <= 0 && !h.leap) {
          w.hero = h.i;
          h.state = 'webbed'; h.stateT = 0; h.webFreeT = 0; h.dashT = 0; h.x = w.x; h.z = w.z;
          this.emit('webbed', { hero: h.i, web: w.id });
        }
      }
      for (const t of this.triggers) {
        if (!t.fired && h.z < t.z) { t.fired = true; this.emit('line', { line: t.line }); }
      }
      const egg = this.L.egg;
      if (egg && !this.eggTouched && (!this.guardian || this.guardian.state === 'freed') && Math.hypot(egg.x - h.x, egg.z - h.z) < 3.0) {
        this.eggTouched = true;
        this.progress();
        this.emit('egg', { hero: h.i, eggHero: egg.hero });
      }
      const ex = this.L.exit;
      if (ex && !this.exitReached && (!this.guardian || this.guardian.state === 'freed') && Math.hypot(ex.x - h.x, ex.z - h.z) < 3.5) {
        this.exitReached = true;
        this.progress();
        this.emit('exit', { hero: h.i });
      }
    }
  }

  // How close the leader is to the egg, from 0 (far) to 1 (touching). The egg glows by this.
  eggNearness() {
    const egg = this.L.egg;
    if (!egg) return 0;
    const h = this.leader();
    const d = Math.hypot(egg.x - h.x, egg.z - h.z);
    return Math.max(0, Math.min(1, 1 - (d - 3) / 40));
  }

  // ---- hints ------------------------------------------------------------------------------

  updateHints(dt) {
    this.progressT += dt;
    if (this.progressT >= this.diff.hintDelay) this.giveHint(false);
  }

  currentHint() {
    const lead = this.leader();
    for (const p of this.players) if (this.heroes[p.hero].state === 'webbed') return { line: 'hint_web', kind: 'web' };
    const g = this.guardian;
    if (g && g.state === 'fight') return { line: g.def.final ? 'hint_dragon' : 'hint_fight', kind: 'fight' };
    const gate = this.firstClosedGate();
    if (gate && lead.z - gate.zNear < 45) return { line: gate.hint, kind: 'gate', gate: gate.id, hero: gate.hero };
    const foe = this.enemies.find((e) => e.state === 'chase' || e.state === 'windup' || e.state === 'recover');
    if (foe) return { line: 'hint_creature', kind: 'creature' };
    if (g && g.state === 'asleep' && lead.z - this.L.arena.z1 < 30) return { line: 'hint_guardian_near', kind: 'guardian' };
    const gap = this.L.gaps.find((q) => !q.gate && lead.z > q.z1 - 0.5 && lead.z - q.z1 < 14);
    if (gap) return this.gapHint(gap);
    if (this.L.egg && (!g || g.state === 'freed') && !this.eggTouched) return { line: 'hint_egg', kind: 'egg' };
    return { line: 'hint_path', kind: 'path' };
  }

  gapHint(gap) {
    return gap.kind2 === 'hop' ? { line: 'hint_jump', kind: 'jump', gap: gap.id } : { line: 'hint_ride', kind: 'ride', gap: gap.id };
  }

  giveHint(now, say = null) {
    const hint = say || this.currentHint();
    this.progressT = 0;
    if (!hint || !hint.line) return;
    this.hintCount++;
    this.stats.hints.push({ t: this.time, ...hint, early: !!now });
    this.emit('hint', hint);
  }
}
