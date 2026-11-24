// The Royal Dragon Rescue.
//
// This file ties the parts together: the world (src/sim.js), the picture
// (src/view.js), menus (src/ui.js), controllers (src/input.js), sound
// (src/audio.js), speech (src/dialogue.js) and story scenes (src/cutscenes.js).

import { STEP, DIFFICULTY, DIFFICULTY_ORDER, SAVE_KEY, HEROES } from './src/config.js';
import { World } from './src/sim.js';
import { View } from './src/view.js';
import { UI, visibleWords } from './src/ui.js';
import { Input } from './src/input.js';
import { AudioBox } from './src/audio.js';
import { Dialogue } from './src/dialogue.js';
import { Scene } from './src/cutscenes.js';
import { Assets, modelsForLevel } from './src/assets.js';
import { LEVELS, registerLevel } from './src/leveldata.js';

const freshSave = () => ({
  v: 1, difficulty: 'easy', players: 1, heroes: [0, 1], setupDone: false,
  highest: 0, bonded: [false, false, false, false], gold: [], muted: false, prologueSeen: false,
});

class Game {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.view = new View(this.canvas);
    this.ui = new UI(document.getElementById('ui'));
    this.input = new Input();
    this.audio = new AudioBox();
    this.dialogue = new Dialogue(this.audio);
    this.assets = new Assets();
    this.save = this.loadSave();
    this.audio.setMuted(this.save.muted);
    this.state = 'boot';
    this.world = null;
    this.scene = null;
    this.level = null;
    this.manualStepping = false;
    this.acc = 0;
    this.last = performance.now();
    this.botHook = null;
    this.picking = 0;
    this.log = [];                     // what happened, for the checks
    this.ui.onAction = (act) => this.act(act, 0);
    this.dialogue.onCaption = (c) => this.ui.setCaption(c);
    window.addEventListener('resize', () => this.view.resize());
    this.ready = this.boot();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ---- saving -------------------------------------------------------------------------

  loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (raw && raw.v === 1) return { ...freshSave(), ...raw };
    } catch (_) { /* a broken save is treated as no save */ }
    return freshSave();
  }

  saveNow() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (_) { /* private mode: play on without saving */ }
  }

  // ---- starting up ----------------------------------------------------------------------

  async boot() {
    this.ui.setLoading(true, 0.3);
    await this.dialogue.load();
    this.audio.registerSounds(this.dialogue.sounds);
    this.ui.setLoading(false);
    this.toTitle();
  }

  toTitle() {
    this.leaveLevel();
    this.state = 'menu';
    this.audio.playMusic('main_theme');
    this.ui.onFocus = null;
    this.ui.showTitle(this.audio.blocked);
  }

  levelList() {
    // A level opens when the one before it is finished. The first level that exists is always open.
    const have = [1, 2, 3, 4, 5, 6].filter((n) => LEVELS[n]);
    return have.map((n) => ({
      number: n, locked: n !== have[0] && n > this.save.highest + 1,
      gold: (LEVELS[n].course || []).flatMap((s) => (s.items || []).filter((i) => i.k === 'gold').map((i) => `l${n}_g${i.n}`)),
    }));
  }

  toMap(focusLevel) {
    this.leaveLevel();
    this.state = 'menu';
    this.audio.playMusic('main_theme');
    const levels = this.levelList();
    this.ui.showMap(levels, this.save, focusLevel || Math.min(6, this.save.highest + 1));
  }

  leaveLevel() {
    if (this.scene) this.scene = null;
    this.dialogue.stop();
    this.world = null;
    this.level = null;
    this.view.camOverride = null;
    this.view.clear();
    this.view.world = null;
    this.ui.showHud(false);
    this.ui.setSkip(false);
  }

  // ---- menus -------------------------------------------------------------------------------

  act(act, player) {
    const [name, arg] = act.split(':');
    this.audio.sfx(name === 'back' ? 'menu_back' : 'menu_ok', 0.5);
    this.log.push({ act, screen: this.ui.screen });
    const s = this.save;
    switch (name) {
      case 'play':
        if (s.setupDone) this.toMap(); else this.ui.showDifficulty(s.difficulty);
        break;
      case 'difficulty':
        s.difficulty = arg; this.saveNow();
        this.ui.showPlayers(s.players);
        break;
      case 'players':
        s.players = +arg; this.saveNow();
        this.picking = 0;
        this.ui.showHeroes(0, s.players, -1, s.heroes[0]);
        break;
      case 'hero':
        s.heroes[this.picking] = +arg;
        if (s.players === 2 && this.picking === 0) { this.picking = 1; this.ui.showHeroes(1, 2, s.heroes[0], s.heroes[1]); break; }
        if (s.heroes[1] === s.heroes[0]) s.heroes[1] = (s.heroes[0] + 1) % 4;
        s.setupDone = true; this.saveNow();
        this.toMap();
        break;
      case 'level': this.startLevel(+arg); break;
      case 'back':
        if (this.ui.screen === 'difficulty') this.toTitle();
        else if (this.ui.screen === 'players') this.ui.showDifficulty(s.difficulty);
        else if (this.ui.screen === 'heroes') this.ui.showPlayers(s.players);
        else if (this.ui.screen === 'map') this.ui.showDifficulty(s.difficulty);
        else if (this.ui.screen === 'pause') this.resume();
        break;
      case 'resume': this.resume(); break;
      case 'skip': if (this.state === 'cutscene' && this.scene) this.scene.skip(); break;
      case 'cycle-difficulty': {
        const k = DIFFICULTY_ORDER[(DIFFICULTY_ORDER.indexOf(s.difficulty) + 1) % DIFFICULTY_ORDER.length];
        this.setDifficulty(k);
        this.ui.showPause(s.difficulty, s.muted);
        this.ui.setFocus(1);
        break;
      }
      case 'mute':
        s.muted = !s.muted; this.audio.setMuted(s.muted); this.saveNow();
        this.ui.showPause(s.difficulty, s.muted);
        this.ui.setFocus(2);
        break;
      case 'map': this.toMap(this.level ? this.level.number : undefined); break;
      case 'next': this.afterLevel(); break;
      case 'retry':
        this.ui.close();
        this.world.retry();
        this.state = 'play';
        break;
      default: break;
    }
  }

  setDifficulty(key) {
    this.save.difficulty = key;
    this.saveNow();
    if (this.world) { this.world.diffKey = key; this.world.diff = DIFFICULTY[key]; }
  }

  pause() {
    if (this.state !== 'play') return;
    this.state = 'paused';
    this.ui.onFocus = null;
    this.ui.showPause(this.save.difficulty, this.save.muted);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.ui.close();
    this.state = 'play';
  }

  // ---- levels ---------------------------------------------------------------------------------

  // Start a level. Options are for the checks: difficulty, players, p1Hero, p2Hero, bonded, seed.
  async startLevel(number, opts = {}) {
    const def = LEVELS[number];
    if (!def) return false;
    this.leaveLevel();
    this.ui.close();
    this.state = 'loading';
    this.ui.setLoading(true, 0);
    const s = this.save;
    const players = opts.players || s.players;
    const world = new World(def, {
      difficulty: opts.difficulty || s.difficulty,
      coop: players === 2,
      p1Hero: opts.p1Hero ?? s.heroes[0],
      p2Hero: opts.p2Hero ?? s.heroes[1],
      bonded: opts.bonded || s.bonded,
      goldFound: s.gold,
      seed: opts.seed,
    });
    const keys = modelsForLevel(world);
    this.assets.keepOnly(keys);
    const turn = (this.loadTurn = (this.loadTurn || 0) + 1);
    await this.assets.load(keys, (f) => this.ui.setLoading(true, f));
    if (turn !== this.loadTurn) return false;          // another level was asked for while this one loaded
    this.world = world;
    this.level = def;
    this.view.build(world, this.assets);
    this.audio.playMusic(def.music);
    this.ui.setLoading(false);
    this.ui.showHud(true);
    this.state = 'play';
    this.log.push({ level: number, t: 0 });
    const story = def.story || {};
    if (story.start && !opts.noStory) this.playScene(story.start(this), { name: 'start' });
    return true;
  }

  playScene(steps, { onEnd = null, name = '' } = {}) {
    this.state = 'cutscene';
    this.ui.setSkip(true);
    this.scene = new Scene(this, steps, {
      name,
      onEnd: (game) => {
        game.scene = null;
        game.ui.setSkip(false);
        if (game.state === 'cutscene') game.state = 'play';
        if (onEnd) onEnd(game);
      },
    });
    if (this.scene && this.scene.done) this.scene = null;
  }

  // The egg has hatched for its hero: remember it, in the world and in the save.
  grantBond(heroIndex) {
    if (this.world) this.world.heroes[heroIndex].bonded = true;
    if (!this.save.bonded[heroIndex]) { this.save.bonded[heroIndex] = true; this.saveNow(); }
    if (this.world && this.view.eggViz && !this.view.eggViz.hatched) this.view.hatch(this.world);
  }

  completeLevel() {
    const n = this.level.number;
    const s = this.save;
    if (n >= 1 && n <= 6) s.highest = Math.max(s.highest, n);
    for (const id of this.world.goldFound) if (!s.gold.includes(id)) s.gold.push(id);
    this.saveNow();
    this.state = 'complete';
    this.audio.sfx('level_done', 0.8);
    const total = this.world.gold.length;
    const found = this.world.gold.filter((g) => g.taken).length;
    this.log.push({ complete: n });
    this.ui.showComplete(found, total);
  }

  afterLevel() {
    const n = this.level ? this.level.number : 0;
    const next = LEVELS[n] && LEVELS[n].next;
    if (next !== undefined && LEVELS[next]) this.startLevel(next);
    else this.toMap(Math.min(6, n + 1));
  }

  // ---- what the world tells us --------------------------------------------------------------------

  handle(e) {
    const w = this.world, a = this.audio, story = this.level.story || {};
    this.view.onEvent(e, w);
    switch (e.type) {
      case 'jump': a.sfx('jump', 0.35); break;
      case 'leap': a.sfx('dash', 0.6); break;
      case 'gift': a.sfx({ speed: 'dash', fire: 'fire', ice: 'ice', strength: 'slam' }[e.gift], 0.5); break;
      case 'boltHit': a.sfx('hit', 0.35); break;
      case 'targetHit': a.sfx('target', 0.6); break;
      case 'wrongGift': a.sfx('wrong', 0.45); break;
      case 'gateOpen': {
        a.sfx('gate_open', 0.8);
        const g = w.gateById(e.gate);
        if (g.cheer) this.dialogue.say(g.cheer);
        break;
      }
      case 'hurt': a.sfx('hurt', 0.5); break;
      case 'dizzy': case 'down': a.sfx('dizzy', 0.6); break;
      case 'fell': a.sfx('fall', 0.5); break;
      case 'caught': a.sfx('caught', 0.6); break;
      case 'pop': a.sfx('pop', 0.3); break;
      case 'call': a.sfx('call', 0.6); break;
      case 'swap': a.sfx('swap', 0.5); break;
      case 'berry': a.sfx('berry', 0.6); break;
      case 'gold': a.sfx('gold', 0.8); break;
      case 'enemyFreed': a.sfx('creature_freed', 0.6); break;
      case 'enemyHit': case 'guardianHit': a.sfx('hit', 0.4); break;
      case 'knot': a.sfx('knot', 0.8); break;
      case 'telegraph': a.sfx('warning', 0.5); break;
      case 'strike': a.sfx('strike', 0.6); break;
      case 'webbed':
        a.sfx('web', 0.6);
        this.dialogue.say(`web_${HEROES[e.hero].id}`);
        break;
      case 'webFreed':
        a.sfx('pop', 0.5);
        if (e.by === 2 && e.hero !== 2) this.dialogue.say('vanessa_freeing');
        break;
      case 'line': this.dialogue.say(e.line); break;
      case 'hint':
        if (this.dialogue.say(e.line, { hint: true })) { if (e.hero !== undefined) this.ui.want(e.hero); }
        break;
      case 'fightStart':
        a.playMusic('guardian_encounter');
        if (story.fight) this.playScene(story.fight(this), { name: 'fight' });
        break;
      case 'guardianFreed':
        a.sfx('guardian_freed', 0.9);
        a.playMusic(this.level.music);
        if (story.freed) this.playScene(story.freed(this), { name: 'freed', onEnd: story.afterFreed ? (g) => story.afterFreed(g) : null });
        else if (story.afterFreed) story.afterFreed(this);
        break;
      case 'egg': {
        const hero = e.eggHero;
        const steps = story.egg ? story.egg(this) : [{ wait: 0.6 }];
        this.playScene(steps, { name: 'egg', onEnd: (g) => { g.grantBond(hero); g.completeLevel(); } });
        break;
      }
      case 'exit': {
        const steps = story.exit ? story.exit(this) : [{ wait: 0.3 }];
        this.playScene(steps, { name: 'exit', onEnd: (g) => g.completeLevel() });
        break;
      }
      case 'lost':
        this.state = 'lost';
        this.ui.showLost();
        break;
      default: break;
    }
  }

  // ---- time ---------------------------------------------------------------------------------------

  step(dt) {
    const menus = this.input.poll(dt);
    if (this.input.anyPress) this.audio.unlock();
    const menu = { ...menus[1], ...menus[0] };
    if (this.ui.screen) {
      const act = this.ui.nav(menu);
      // A press that worked a menu is used up: it must not also pause or jump.
      if (act) { this.act(act, 0); return; }
      if (this.state === 'menu' || this.state === 'paused' || this.state === 'lost' || this.state === 'complete') return;
    }
    if (this.state === 'play') {
      if (menu.start) { this.pause(); return; }
      if (this.botHook) this.botHook(this);
      const w = this.world;
      w.setInput(0, this.input.players[0]);
      if (w.coop) w.setInput(1, this.input.players[1]);
      w.step(dt);
      for (const e of w.drain()) { this.handle(e); if (this.world !== w) return; }
      this.dialogue.update(dt);
    } else if (this.state === 'cutscene') {
      if (menu.start && this.scene) { this.scene.skip(); return; }
      if (this.scene) this.scene.update(dt);
      this.dialogue.update(dt);
    }
  }

  frame(now) {
    requestAnimationFrame((t) => this.frame(t));
    const real = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.manualStepping) {
      this.acc += real;
      let n = 0;
      while (this.acc >= STEP && n < 5) { this.step(STEP); this.acc -= STEP; n++; }
      if (n === 5) this.acc = 0;
    }
    this.audio.update(real);
    this.draw(real);
  }

  draw(dt) {
    if (this.world && this.view.root) {
      this.view.sync(this.world, dt);
      this.ui.updateHud(this.world, dt);
    }
    this.view.render();
  }

  // ---- for the automated checks ----------------------------------------------------------------------

  // Run the game forward without waiting for real time.
  advance(seconds, dt = STEP) {
    this.manualStepping = true;
    this.audio.quiet = true;
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i++) this.step(dt);
    return this.state;
  }

  // Draw the present moment with the camera settled, and say where things are on screen.
  drawNow() {
    if (this.world && this.view.root) { this.view.sync(this.world, 0); this.view.snapCamera(); this.ui.updateHud(this.world, 0); }
    this.view.render();
  }

  registerLevel(def) { return registerLevel(def); }

  words() { return visibleWords(document.getElementById('ui')); }
}

window.game = new Game();
