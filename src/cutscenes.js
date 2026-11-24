// Story scenes. A scene is a list of small steps: say a line, wait, move the
// camera, do something. The game world stands still while a scene plays.
//
// A scene can be skipped with the Menu button, and only with that button.
// Whatever a scene is meant to change (a dragon bonded, a level finished) is
// done in its `onEnd`, which runs exactly once whether the scene plays to the
// end or is skipped at any moment.
//
// Steps:
//   { say: 'line_id' }            say a line and wait for it to finish
//   { wait: 1.5 }                 wait
//   { cam: { px, py, pz, lx, ly, lz }, snap: true }   move the camera
//   { do: (game) => { ... } }     do something now
//   { always: (game) => { ... } } like `do`, and also done if the scene is skipped
//   { music: 'track' }, { sfx: 'name' }
//   { move: 'actor' | heroIndex, to: { x, z }, t: 2 }  walk someone somewhere
//       (an actor can be given a height too, to: { x, y, z }, and `together: true` does not wait)
//   { later: [[seconds, (game) => { ... }], ...] }     small things timed against what follows,
//       such as a glow as each name is spoken. A skipped scene drops them, so pair with `always`.

export class Scene {
  constructor(game, steps, { onEnd = null, name = '' } = {}) {
    this.game = game;
    this.steps = steps;
    this.name = name;
    this.i = -1;
    this.t = 0;
    this.waiting = null;       // 'time' | 'line' | 'move'
    this.done = false;
    this.onEnd = onEnd;
    this.moves = [];
    this.timers = [];
    this.advance();
  }

  advance() {
    const game = this.game;
    while (!this.done) {
      this.i++;
      if (this.i >= this.steps.length) { this.finish(); return; }
      const s = this.steps[this.i];
      if (s.do) s.do(game);
      if (s.always) s.always(game);
      if (s.music) game.audio.playMusic(s.music, { loop: s.loop !== false });
      if (s.sfx) game.audio.sfx(s.sfx, s.volume ?? 0.8);
      if (s.cam) game.view.camOverride = { ...s.cam, snap: !!s.snap };
      if (s.later) for (const [after, fn] of s.later) this.timers.push({ t: after, fn });
      if (s.move !== undefined) {
        const who = this.subject(s.move);
        const hero = typeof s.move === 'number';
        if (who) this.moves.push({ who, x0: who.x ?? who.position.x, z0: who.z ?? who.position.z, x1: s.to.x, z1: s.to.z, y0: hero ? 0 : who.position.y, y1: hero ? undefined : s.to.y, t: 0, T: s.t || 1, hero });
        if (s.wait === undefined && !s.together) { this.waiting = 'time'; this.t = s.t || 1; return; }
      }
      if (s.say) {
        let finished = false;
        const ok = game.dialogue.say(s.say, { then: () => { finished = true; if (this.waiting === 'line' && this.lineStep === this.i) { this.waiting = null; this.advance(); } } });
        if (ok && !finished) { this.waiting = 'line'; this.lineStep = this.i; return; }
      }
      if (s.wait !== undefined) { this.waiting = 'time'; this.t = s.wait; return; }
    }
  }

  subject(who) {
    if (typeof who === 'number') return this.game.world.heroes[who];
    return this.game.view.actors[who] || null;
  }

  update(dt) {
    if (this.done) return;
    for (const m of this.moves) {
      if (m.t >= m.T) continue;
      m.t = Math.min(m.T, m.t + dt);
      const k = m.t / m.T, x = m.x0 + (m.x1 - m.x0) * k, z = m.z0 + (m.z1 - m.z0) * k;
      if (m.hero) {
        const h = m.who, dx = m.x1 - m.x0, dz = m.z1 - m.z0, d = Math.hypot(dx, dz) || 1;
        h.x = x; h.z = z; h.fx = dx / d; h.fz = dz / d; h.speedNow = k < 1 ? d / m.T : 0;
      } else {
        m.who.position.x = x; m.who.position.z = z;
        if (m.y1 !== undefined) m.who.position.y = m.y0 + (m.y1 - m.y0) * k * (2 - k);      // settles gently
        if (k < 1) m.who.rotation.y = Math.atan2(m.x1 - m.x0, m.z1 - m.z0);
      }
    }
    for (const tm of this.timers) {
      if (tm.done) continue;
      tm.t -= dt;
      if (tm.t <= 0) { tm.done = true; tm.fn(this.game); }
    }
    if (this.waiting === 'time') {
      this.t -= dt;
      if (this.t <= 0) { this.waiting = null; this.advance(); }
    }
  }

  skip() {
    if (this.done) return;
    const game = this.game;
    this.done = true;                      // stops any line callback from advancing
    game.dialogue.stop();
    for (const m of this.moves) {
      if (m.hero) { m.who.x = m.x1; m.who.z = m.z1; m.who.speedNow = 0; } else { m.who.position.x = m.x1; m.who.position.z = m.z1; if (m.y1 !== undefined) m.who.position.y = m.y1; }
    }
    this.timers = [];
    for (let k = this.i + 1; k < this.steps.length; k++) {
      const s = this.steps[k];
      if (s.always) s.always(game);
      if (s.music) game.audio.playMusic(s.music, { loop: s.loop !== false });
    }
    this.done = false;
    this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    for (const h of this.game.world ? this.game.world.heroes : []) h.speedNow = 0;
    this.game.view.camOverride = null;
    const f = this.onEnd;
    this.onEnd = null;
    if (f) f(this.game);
  }
}
