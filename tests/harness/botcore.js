// A player made of code. It looks at the world and decides which way to push
// the stick and which buttons to hold, exactly as a person would. It never
// changes the world itself: everything it does goes through controller input.
//
// Options:
//   hero       play as this hero only (0 Joshua, 1 Daniel, 2 Vanessa, 3 Michael) and never swap
//   idle       do nothing at all
//   react      seconds of thinking time before each new job (a child's pace)
//   collect    walk to berries and gold berries near the path
//   noGates    do not try to open gates
//   wander     try to get past a closed gate without its gift (for the bypass checks)
//   lapse      { every, for, seed }: now and then the bot's mind wanders for a moment, as a person's does
//   pace       how hard the stick is pushed when simply walking along (1 is flat out)
//   needsHint  at a gate, keep trying with the hero in hand until the Keeper's hint names the right one
//
// CHILD is the bot that stands in for a six-year-old on a first play: it stops
// to think before every new thing, drifts off for a moment every few seconds,
// ambles instead of running, picks every berry near the path, and at each gate
// tries the hero it has until the Keeper tells it who is needed.

export const CHILD = { react: 2.0, collect: true, pace: 0.7, needsHint: true, lapse: { every: 8, for: 2.0, seed: 1 } };

const blank = () => ({ mx: 0, mz: 0, jump: false, gift: false, next: false, prev: false, call: false });

export class Bot {
  constructor(world, opts = {}) {
    this.w = world;
    this.o = { react: 0, collect: false, ...opts };
    this.pi = opts.player || 0;
    this.t = 0;
    this.job = '';
    this.jobT = 0;
    this.wait = 0;
    this.tap = {};          // button -> time left held
    this.gap = {};          // button -> time until it may be pressed again
    this.phase = 0;
    this.log = [];
    this.seed = ((opts.lapse && opts.lapse.seed) || 1) >>> 0;
    this.lapseIn = opts.lapse ? opts.lapse.every * (0.5 + this.rnd()) : Infinity;
    this.lapseT = 0;
  }

  rnd() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }

  me() { return this.w.playerHero(this.pi); }

  setJob(name) {
    if (name !== this.job) {
      this.job = name; this.jobT = 0; this.wait = this.o.react; this.phase = 0;
      this.log.push({ t: +this.w.time.toFixed(2), job: name });
    }
  }

  // Press a button for a moment (so it is seen as a fresh press).
  press(input, name, hold = 0.08, rest = 0.25) {
    if ((this.gap[name] || 0) <= 0 && (this.tap[name] || 0) <= 0) { this.tap[name] = hold; this.gap[name] = hold + rest; }
  }

  think(dt) {
    const w = this.w, inp = blank();
    this.t += dt; this.jobT += dt;
    for (const k of Object.keys(this.gap)) this.gap[k] -= dt;
    if (this.o.idle || w.paused || w.lost) return inp;
    const h = this.me();

    if (this.o.lapse) {
      this.lapseIn -= dt;
      if (this.lapseIn <= 0) { this.lapseT = this.o.lapse.for * (0.5 + this.rnd()); this.lapseIn = this.o.lapse.every * (0.5 + this.rnd()); }
      if (this.lapseT > 0) { this.lapseT -= dt; return inp; }
    }

    // A bot told to be one hero stays that hero. If the game hands it another
    // (its own was knocked down), it only waits and swaps back: it never plays
    // on with the borrowed hero's gift.
    if (this.o.hero !== undefined && this.o.wander && h.i !== this.o.hero) {
      this.borrowed = (this.borrowed || 0) + dt;
      if (w.heroes[this.o.hero].state === 'ok') this.press(inp, 'next', 0.08, 0.3);
    } else {
      this.careful = false;
      this.decide(h, inp, dt);
      // Ambling: only when simply walking, and never on the run-up to a jump or a ride.
      if (this.o.pace && !this.careful && (this.job === 'walk' || this.job === 'berry')) { inp.mx *= this.o.pace; inp.mz *= this.o.pace; }
    }

    // Thinking time. Nobody stops to think in the middle of a jump.
    if (this.wait > 0) { this.wait -= dt; if (h.onGround || h.state !== 'ok') { inp.mx = 0; inp.mz = 0; inp.gift = false; inp.jump = false; } }
    for (const k of Object.keys(this.tap)) {
      if (this.tap[k] > 0) { this.tap[k] -= dt; inp[k] = true; }
    }
    return inp;
  }

  decide(h, inp, dt) {
    const w = this.w;
    if (h.state === 'webbed') { this.setJob('webbed'); this.press(inp, 'call', 0.1, 1.0); return; }
    if (h.state !== 'ok' || h.leap) return;

    const g = w.guardian;
    if (g && g.state === 'fight') { this.setJob('fight'); this.fight(h, g, inp); return; }

    // A creature is awake nearby.
    let foe = null, fd = 13;
    for (const e of w.enemies) {
      if (e.state === 'freed' || e.state === 'gone' || e.state === 'idle') continue;
      const d = Math.hypot(e.x - h.x, e.z - h.z);
      if (d < fd) { fd = d; foe = e; }
    }
    if (foe) { this.setJob('creature'); this.attack(h, foe, 0.8, inp, false); return; }

    // Someone is stuck in a web.
    const stuck = w.heroes.find((o) => o.state === 'webbed');
    if (stuck) { this.setJob('free'); this.walkTo(h, stuck.x, stuck.z + 1.2, inp, 1.0); return; }

    const gate = w.firstClosedGate();
    const goal = this.goal();

    // Berries close to the way.
    if (this.o.collect) {
      const limitZ = gate ? w.holdZ(gate) : -Infinity;
      let pick = null, pd = 26;
      for (const b of [...w.gold, ...w.bushes]) {
        if (b.taken || b.z < limitZ || b.z < goal.z - 2) continue;
        if (!w.floorAt(b.x, b.z)) continue;
        const d = Math.hypot(b.x - h.x, b.z - h.z);
        if (d < pd && b.z < h.z + 12) { pd = d; pick = b; }
      }
      if (pick) { this.setJob('berry'); this.travel(h, pick.x, pick.z, inp, 0.6); return; }
    }

    if (gate && !this.o.noGates && h.z - gate.zNear < 16 && this.clearTo(h, gate.zNear + 0.5)) {
      this.setJob('gate:' + gate.id);
      this.doGate(h, gate, inp);
      return;
    }
    this.setJob('walk');
    this.travel(h, goal.x, goal.z, inp, 1.2);
  }

  // Where the level wants us next.
  goal() {
    const w = this.w, L = w.L;
    const gate = w.firstClosedGate();
    const cands = [];
    if (gate) cands.push({ x: gate.useSpot.x, z: gate.useSpot.z });
    if (w.guardian && w.guardian.state === 'asleep') cands.push({ x: L.arena.cx, z: L.arena.startLine - 3 });
    if (L.egg && !w.eggTouched) cands.push({ x: L.egg.x, z: L.egg.z + 1.5 });
    if (L.exit && !w.exitReached) cands.push({ x: L.exit.x, z: L.exit.z + 1.5 });
    // The nearest of these along the way (largest z) comes first.
    cands.sort((a, b) => b.z - a.z);
    return cands[0] || { x: L.sections[L.sections.length - 1].cx, z: L.zEnd + 4 };
  }

  // Is there a ferry or hop between here and there?
  clearTo(h, z) {
    for (const s of this.w.L.sections) {
      if ((s.t === 'ferry' || s.t === 'hop') && s.zNear < h.z + 0.5 && s.zFar > z - 0.5 && h.z > s.zFar) return false;
    }
    return true;
  }

  walkTo(h, x, z, inp, stop = 0.4) {
    const dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz);
    if (d > stop) { inp.mx = dx / d; inp.mz = dz / d; return false; }
    return true;
  }

  // Walk along the level to a place, taking ferries and hopping gaps on the way.
  travel(h, x, z, inp, stop = 0.5) {
    const L = this.w.L;
    if (z < h.z) {
      let i = L.sections.findIndex((s) => h.z <= s.zNear + 0.01 && h.z > s.zFar);
      if (i < 0) i = 0;
      const cur = L.sections[i], next = L.sections[i + 1];
      for (const s of [cur, next]) {
        if (!s || s.zNear <= z) continue;                        // the target comes first
        if (s.t === 'ferry' && h.z - s.zNear < 4) { this.careful = true; return this.rideFerry(h, s, inp); }
        if (s.t === 'hop' && h.z - s.zNear < 4) {
          this.careful = true;
          if (h.z > s.zNear + 2 && Math.abs(h.x - s.cx) > 2) { this.walkTo(h, s.cx, s.zNear + 2, inp, 0.5); return false; }
          inp.mx = 0; inp.mz = -1;
          if (h.z - s.zNear < 0.6 && h.onGround) this.press(inp, 'jump', 0.1, 0.3);
          return false;
        }
      }
      // Pass through the middle of the place where two stretches of path meet.
      if (next && next.zNear > z && h.z - cur.zFar < 6) {
        const jx = this.jointX(cur, next);
        if (Math.abs(h.x - jx) > 1.0) { this.walkTo(h, jx, cur.zFar - 0.5, inp, 0.3); return false; }
      }
    }
    return this.walkTo(h, x, z, inp, stop);
  }

  rideFerry(h, s, inp) {
    const p = this.w.L.platforms.find((q) => q.travel.zA <= s.zNear + 0.5 && q.travel.zB >= s.zFar - 0.5);
    const pcz = (p.z0 + p.z1) / 2;
    if (h.onGround && h.floor === p) {
      if (Math.abs(pcz - p.travel.zB) < 0.25) { this.walkTo(h, s.cx, s.zFar - 1.6, inp, 0.3); return false; }
      this.walkTo(h, s.cx, pcz, inp, 0.5);
      return false;
    }
    if (h.z <= s.zFar) return true;
    if (Math.abs(pcz - p.travel.zA) < 0.25 && p.travel.pause > 0.6) { this.walkTo(h, s.cx, pcz, inp, 0.3); return false; }
    this.walkTo(h, s.cx, s.zNear + 1.2, inp, 0.4);
    return false;
  }

  jointX(a, b) { return (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2; }

  wantHero(idx, inp) {
    const h = this.me();
    if (h.i === idx) return true;
    if (this.o.hero !== undefined) return false;                 // sworn to one hero
    this.press(inp, 'next', 0.08, 0.3);
    return false;
  }

  doGate(h, gate, inp) {
    const w = this.w;
    if (this.o.wander) { this.wander(h, gate, inp); return; }
    if (this.o.needsHint && h.i !== gate.hero && !w.stats.hints.some((q) => q.gate === gate.id)) {
      // Not told yet: walk up and try the gift this hero has.
      if (this.walkTo(h, gate.useSpot.x, gate.useSpot.z, inp, 1.5) && Math.floor(this.jobT / 2) % 2 === 1) inp.gift = true;
      return;
    }
    if (!this.wantHero(gate.hero, inp)) {
      if (this.o.hero !== undefined) this.walkTo(h, gate.useSpot.x, gate.useSpot.z, inp, 1.0);
      return;
    }
    if (gate.mech === 'wall' || (gate.mech === 'bridge' && !gate.slices.length)) {
      const t = gate.targets.find((q) => !q.done);
      if (!t) return;
      const reach = gate.gift === 'strength' ? 2.6 : 6.5;
      const dx = t.x - h.x, dz = t.z - h.z, d = Math.hypot(dx, dz);
      if (d > reach) { inp.mx = dx / d; inp.mz = dz / d; }
      else { this.face(h, dx / d, dz / d, inp); inp.gift = true; }
    } else if (gate.mech === 'bridge') {
      const t = w.nextTarget(gate);
      if (!t) return;
      const dx = t.x - h.x, dz = t.z - h.z, d = Math.hypot(dx, dz);
      if (d > 13) { inp.mx = dx / d; inp.mz = dz / d; }
      else { this.face(h, dx / d, dz / d, inp); inp.gift = true; }
    } else if (gate.mech === 'run') {
      if (this.phase === 0) {
        if (this.walkTo(h, gate.cx, gate.zNear + 1.5, inp, 0.5) && (gate.style !== 'door' || !gate.door.active)) this.phase = 1;
      } else {
        inp.mx = (gate.cx - h.x) * 0.3; inp.mz = -1;
        if (gate.style === 'slope') inp.gift = true;
        if (h.z > gate.zNear + 2.5) this.phase = 0;                 // carried back: line up again
      }
    } else if (gate.mech === 'leap') {
      if (this.phase === 0) {
        if (this.walkTo(h, gate.cx, gate.zNear + 5, inp, 0.5)) this.phase = 1;
      } else {
        inp.mx = (gate.cx - h.x) * 0.3; inp.mz = -1;
        const d = h.z - gate.zNear;
        if (w.diff.leapAssist === 'none') {
          if (d < 1.2 && h.onGround && h.dashT <= 0) inp.gift = true;
          if (h.dashT > 0 && h.onGround) this.press(inp, 'jump', 0.1, 0.4);
        } else if (d < 2.5) this.press(inp, 'jump', 0.1, 0.4);
        if (h.z > gate.zNear + 6) this.phase = 0;
      }
    }
  }

  // Turn to face a direction with the smallest touch of the stick.
  face(h, ux, uz, inp) {
    if (h.fx * ux + h.fz * uz < 0.97) { inp.mx = ux * 0.3; inp.mz = uz * 0.3; }
  }

  // Try everything except the right gift: walk at it, jump at it, hug both edges, use this hero's own gift.
  wander(h, gate, inp) {
    const t = this.jobT;
    const lane = (gate.x1 - gate.x0) / 2;
    const beat = Math.floor(t / 2.5) % 6;
    const side = [0, -1, 1, -0.5, 0.5, 0][beat];
    const tx = gate.cx + side * (lane - 0.4);
    inp.mx = Math.max(-1, Math.min(1, (tx - h.x) * 0.8)); inp.mz = -1;
    if (Math.floor(t / 0.6) % 2 === 0) this.press(inp, 'jump', 0.1, 0.5);
    if (Math.floor(t / 1.7) % 2 === 1) inp.gift = true;
    if (beat === 5 && h.z > gate.zNear + 8) { inp.mz = -1; }
    if (Math.floor(t / 7) % 3 === 2 && h.z < gate.zNear + 1) inp.mz = 1;      // step back for a run-up
  }

  // Use the gift on a creature or the guardian.
  attack(h, foe, radius, inp, locked) {
    const dx = foe.x - h.x, dz = foe.z - h.z, d = Math.hypot(dx, dz) || 1;
    const gift = h.def.gift;
    const ranged = gift === 'fire' || gift === 'ice';
    const want = radius + (ranged ? 7 : gift === 'speed' ? 4.5 : 1.6);
    if (d > want + 1.0) { inp.mx = dx / d; inp.mz = dz / d; }
    else if (ranged && d < want - 3) { inp.mx = -dx / d; inp.mz = -dz / d; }
    else this.face(h, dx / d, dz / d, inp);
    if (!locked && d < want + (ranged ? 6 : gift === 'speed' ? 3.5 : 1.4)) inp.gift = true;
  }

  fight(h, g, inp) {
    const w = this.w;
    // Get out of the way of a warning on the ground.
    if (g.attack && !g.attack.fired && g.attack.shapes.length) {
      const left = Math.max(0.1, g.attack.tele - g.attack.t);
      if (this.inShapes(h.x, h.z, g.attack.shapes, 0.9)) {
        const reach = h.def.speed * Math.min(left, 1.2);
        let best = null, bestScore = Infinity;
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2, vx = Math.sin(a), vz = Math.cos(a);
          const px = h.x + vx * reach, pz = h.z + vz * reach;
          const A = w.L.arena;
          if (A && (px < A.x0 + 1 || px > A.x1 - 1 || pz < A.z0 + 1.5 || pz > A.z1 - 1)) continue;
          let score = this.inShapes(px, pz, g.attack.shapes, 0.6) ? 100 : 0;
          score += this.inShapes(h.x + vx * reach * 0.5, h.z + vz * reach * 0.5, g.attack.shapes, 0) ? 1 : 0;
          const gd = Math.hypot(px - g.x, pz - g.z);
          if (gd < g.def.radius + 2) score += 50;                   // not into the guardian
          score += Math.abs(gd - (g.def.radius + 7)) * 0.05;
          if (score < bestScore) { bestScore = score; best = { x: vx, z: vz }; }
        }
        if (best) { inp.mx = best.x; inp.mz = best.z; return; }
      }
    }
    // Something is rolling at us: step aside if there is time, or jump over it.
    for (const p of w.projectiles) {
      if (p.from !== 'guardian') continue;
      const rx = h.x - p.x, rz = h.z - p.z;
      const sp = Math.hypot(p.vx, p.vz) || 1, ux = p.vx / sp, uz = p.vz / sp;
      const along = rx * ux + rz * uz, side = rx * -uz + rz * ux;
      if (along < -1 || along > 10 || Math.abs(side) > p.r + 1.3) continue;
      const tc = (along - p.r - 0.5) / sp;
      if (tc < 0.2) { if (h.onGround) this.press(inp, 'jump', 0.1, 0.2); }
      else if (tc > 0.5) {
        const sg = side >= 0 ? 1 : -1;
        const v = this.insideArena(h, -uz * sg, ux * sg); inp.mx = v.x; inp.mz = v.z; return;
      }
    }
    // Where touching the guardian hurts, never let it come close.
    const d = Math.hypot(g.x - h.x, g.z - h.z);
    if (w.diff.guardianContact > 0 && d < g.def.radius + 2.6) {
      const v = this.insideArena(h, (h.x - g.x) / (d || 1), (h.z - g.z) / (d || 1));
      inp.mx = v.x; inp.mz = v.z;
      return;
    }
    this.attack(h, g, g.def.radius, inp, g.knotLocked);
  }

  inShapes(x, z, shapes, margin) {
    for (const s of shapes) {
      if (s.kind === 'ring') { if (Math.hypot(x - s.x, z - s.z) < s.r + margin) return true; }
      else {
        const rx = x - s.x, rz = z - s.z;
        const along = rx * s.dx + rz * s.dz, side = rx * -s.dz + rz * s.dx;
        if (along > -margin && along < s.len + margin && Math.abs(side) < s.w / 2 + margin) return true;
      }
    }
    return false;
  }

  // Do not dodge out of the arena or into its edge.
  insideArena(h, vx, vz) {
    const A = this.w.L.arena;
    if (!A) return { x: vx, z: vz };
    const nx = h.x + vx * 2.5, nz = h.z + vz * 2.5;
    if (nx < A.x0 + 1 || nx > A.x1 - 1) vx = -vx;
    if (nz < A.z0 + 1.5 || nz > A.z1 - 1) vz = -vz;
    return { x: vx, z: vz };
  }
}
