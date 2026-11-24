// Controllers first, keyboard as a spare. Every frame this turns whatever is
// plugged in into the same small set of game and menu inputs.
//
// Xbox layout: left stick or D-pad moves, A jumps, X (or right trigger) uses
// the gift, Y (or right bumper) is the next hero, left bumper the one before,
// B calls the family, and the Menu button pauses or skips a story scene.
// On a keyboard: arrows or WASD, Space jumps, J uses the gift, E and Q swap,
// C calls, P pauses or skips, Enter chooses in menus and Escape goes back.

import { blankInput } from './sim.js';

const DEAD = 0.22;
const pressed = (pad, i) => !!(pad.buttons[i] && pad.buttons[i].pressed);

export class Input {
  constructor() {
    this.keys = new Set();
    this.players = [blankInput(), blankInput()];
    this.prev = [{}, {}];
    this.repeat = [{}, {}];
    this.padCount = 0;
    this.anyPress = false;
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  // Reads the devices. Returns the menu presses that began this step, one list per player.
  poll(dt) {
    const pads = [];
    const raw = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of raw) if (p && p.connected) pads.push(p);
    this.padCount = pads.length;
    const out = [];
    this.anyPress = false;
    for (let pi = 0; pi < 2; pi++) {
      const pad = pads[pi] || null;
      const k = pi === 0 ? this.keys : null;
      const s = { mx: 0, mz: 0, jump: false, gift: false, next: false, prev: false, call: false, start: false, back: false };
      if (pad) {
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
        if (Math.hypot(ax, ay) > DEAD) { s.mx = ax; s.mz = ay; }
        if (pressed(pad, 14)) s.mx = -1;
        if (pressed(pad, 15)) s.mx = 1;
        if (pressed(pad, 12)) s.mz = -1;
        if (pressed(pad, 13)) s.mz = 1;
        s.jump = pressed(pad, 0);
        s.gift = pressed(pad, 2) || pressed(pad, 7);
        s.next = pressed(pad, 3) || pressed(pad, 5);
        s.prev = pressed(pad, 4);
        s.call = pressed(pad, 1);
        s.start = pressed(pad, 9);
        s.back = pressed(pad, 1) || pressed(pad, 8);
      }
      if (k) {
        if (k.has('ArrowLeft') || k.has('KeyA')) s.mx = -1;
        if (k.has('ArrowRight') || k.has('KeyD')) s.mx = 1;
        if (k.has('ArrowUp') || k.has('KeyW')) s.mz = -1;
        if (k.has('ArrowDown') || k.has('KeyS')) s.mz = 1;
        s.jump = s.jump || k.has('Space');
        s.gift = s.gift || k.has('KeyJ') || k.has('KeyX');
        s.next = s.next || k.has('KeyE') || k.has('Tab');
        s.prev = s.prev || k.has('KeyQ');
        s.call = s.call || k.has('KeyC');
        s.start = s.start || k.has('KeyP');          // not Enter or Space: a child mashing jump must not skip a scene
        s.back = s.back || k.has('Escape') || k.has('Backspace');
      }
      const g = this.players[pi];
      g.mx = s.mx; g.mz = s.mz; g.jump = s.jump; g.gift = s.gift; g.next = s.next; g.prev = s.prev; g.call = s.call;

      // Menu presses: a fresh press, or a held direction repeating.
      const now = {
        up: s.mz < -0.5, down: s.mz > 0.5, left: s.mx < -0.5, right: s.mx > 0.5,
        confirm: s.jump || (k ? k.has('Enter') : false), back: s.back, start: s.start, swap: s.next, gift: s.gift,
      };
      const was = this.prev[pi], rep = this.repeat[pi], menu = {};
      for (const name of Object.keys(now)) {
        if (now[name] && !was[name]) { menu[name] = true; rep[name] = 0.4; this.anyPress = true; }
        else if (now[name] && ['up', 'down', 'left', 'right'].includes(name)) {
          rep[name] -= dt;
          if (rep[name] <= 0) { menu[name] = true; rep[name] = 0.16; }
        }
      }
      this.prev[pi] = now;
      out.push(menu);
    }
    return out;
  }
}
