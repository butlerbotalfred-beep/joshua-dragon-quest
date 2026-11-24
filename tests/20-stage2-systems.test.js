// Stage 2: the systems every level uses. One test (or a few) per milestone.
// Bots play through virtual Xbox controllers; see tests/harness/pagekit.js.
const test = require('node:test');
const assert = require('node:assert');
const { openReady } = require('./harness/kit');

const SAVE_KEY = 'royal_dragon_rescue_save_v1';
const GUARDIANS = ['bear', 'vine', 'magma', 'yeti', 'gargoyle'];
const HERO_NAMES = ['Joshua', 'Daniel', 'Vanessa', 'Michael'];

// ---------------------------------------------------------------------------------------------
// 2.1 Difficulty
// ---------------------------------------------------------------------------------------------

test('2.1 difficulty is chosen at the start, saved, and changeable from the pause menu', async () => {
  const g = await openReady();
  try {
    const first = await g.page.evaluate(async (SAVE_KEY) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = { screens: [] };
      out.screens.push(game.ui.screen);                       // title
      K.tap(K.BUTTON.A);
      out.screens.push(game.ui.screen);                       // difficulty, the first thing asked
      out.choices = game.ui.items.map((i) => i.act);
      K.nudge(1, 0); K.nudge(1, 0);                           // Easy -> Medium -> Hard
      K.tap(K.BUTTON.A);
      out.afterPick = JSON.parse(localStorage.getItem(SAVE_KEY)).difficulty;
      K.tap(K.BUTTON.A);                                      // one player
      K.tap(K.BUTTON.A);                                      // first hero
      await K.loaded();
      out.then = { level: game.level && game.level.number, state: game.state, difficulty: game.world && game.world.diffKey };   // a new game opens on the prologue
      return out;
    }, SAVE_KEY);
    assert.deepStrictEqual(first.screens, ['title', 'difficulty']);
    assert.deepStrictEqual(first.then, { level: 0, state: 'cutscene', difficulty: 'hard' });
    assert.deepStrictEqual(first.choices, ['difficulty:easy', 'difficulty:medium', 'difficulty:hard']);
    assert.strictEqual(first.afterPick, 'hard');

    // Close the game and open it again: the choice is still there.
    await g.page.reload();
    await g.page.waitForFunction(() => window.game && window.game.state === 'menu');
    const second = await g.page.evaluate(async (SAVE_KEY) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = { loaded: game.save.difficulty };
      const w = await K.start(K.YARD_PLAY, {});
      out.worldStart = w.diffKey;
      K.tap(K.BUTTON.START);
      out.pauseScreen = game.ui.screen;
      out.pauseItems = game.ui.items.map((i) => i.act);
      K.nudge(1, 0);                                          // to the difficulty button
      K.tap(K.BUTTON.A);                                      // Hard -> Easy
      out.afterCycle = { save: JSON.parse(localStorage.getItem(SAVE_KEY)).difficulty, world: w.diffKey, canLose: w.diff.canLose };
      K.tap(K.BUTTON.A);                                      // Easy -> Medium
      out.afterCycle2 = { save: JSON.parse(localStorage.getItem(SAVE_KEY)).difficulty, world: w.diffKey };
      K.tap(K.BUTTON.START);
      out.resumed = game.state;
      return out;
    }, SAVE_KEY);
    assert.strictEqual(second.loaded, 'hard');
    assert.strictEqual(second.worldStart, 'hard');
    assert.strictEqual(second.pauseScreen, 'pause');
    assert.ok(second.pauseItems.includes('cycle-difficulty'));
    assert.deepStrictEqual(second.afterCycle, { save: 'easy', world: 'easy', canLose: false });
    assert.deepStrictEqual(second.afterCycle2, { save: 'medium', world: 'medium' });
    assert.strictEqual(second.resumed, 'play');

    await g.page.reload();
    await g.page.waitForFunction(() => window.game && window.game.state === 'menu');
    assert.strictEqual(await g.page.evaluate(() => window.game.save.difficulty), 'medium');
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

test('2.1 an idle player beside a guardian never loses on Easy and loses within 30 seconds on Hard', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async (GUARDIANS) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      for (const diff of ['easy', 'hard']) {
        for (const name of [...GUARDIANS, 'black_dragon']) {
          const w = await K.start(K.yardFight(name), { difficulty: diff, seed: 5 });
          // Stand the family beside the guardian and put the controller down.
          w.heroes.forEach((h, k) => { h.x = w.guardian.x + 3 + k * 0.8; h.z = w.guardian.z + 1 + k; });
          const limit = diff === 'easy' ? 300 : 60;
          let lostAt = null, everDown = false;
          const idle = new K.Bot(w, { idle: true });
          let t = 0;
          game.botHook = () => K.drive(0, idle.think(1 / 60));
          while (t < limit) {
            game.advance(1 / 60, 1 / 60);
            t += 1 / 60;
            if (w.heroes.some((h) => h.state === 'down')) everDown = true;
            if (game.state === 'lost' || w.lost) { lostAt = t; break; }
          }
          game.botHook = null;
          out.push({
            diff, name, lostAt, everDown, seconds: +t.toFixed(1), attacks: w.stats.fight ? w.stats.fight.acts.length : 0,
            guardian: w.guardian.state, screen: game.ui.screen,
          });
        }
      }
      return out;
    }, GUARDIANS);
    for (const r of rows) {
      const tag = `${r.diff} ${r.name}`;
      assert.ok(r.attacks > 0, `${tag}: the guardian never attacked, so the check proves nothing`);
      if (r.diff === 'easy') {
        assert.strictEqual(r.lostAt, null, `${tag}: lost at ${r.lostAt}s`);
        assert.strictEqual(r.everDown, false, `${tag}: a hero was knocked out for good`);
        assert.ok(r.seconds >= 299.9, `${tag}: only ran ${r.seconds}s`);
        assert.ok(r.attacks >= 50, `${tag}: only ${r.attacks} attacks in five minutes`);
      } else {
        assert.ok(r.lostAt !== null && r.lostAt <= 30, `${tag}: not defeated within 30 seconds (${r.lostAt})`);
        assert.strictEqual(r.screen, 'lost', `${tag}: no try-again screen`);
      }
    }
    console.log('2.1 idle:', rows.map((r) => `${r.diff} ${r.name} ${r.lostAt === null ? 'never lost' : 'lost at ' + r.lostAt.toFixed(1) + 's'}`).join('; '));
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 2.2 Controller
// ---------------------------------------------------------------------------------------------

test('2.2 a bot starts a game, picks a difficulty, plays, swaps hero and pauses with a controller alone', async () => {
  const g = await openReady();
  try {
    const out = await g.page.evaluate(async (SAVE_KEY) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      // Until the real levels exist, a practice level stands in as Level 1.
      if (![1, 2, 3, 4, 5, 6].some((n) => K.LEVELS[n])) game.registerLevel({ ...K.YARD_PLAY, number: 1 });
      const log = [];
      const note = (what) => log.push({ what, state: game.state, screen: game.ui.screen });
      const keysBefore = game.input.keys.size;
      note('open');
      K.tap(K.BUTTON.A); note('A on title');
      K.nudge(1, 0); note('stick right');
      const focus = game.ui.items[game.ui.focus].act;
      K.tap(K.BUTTON.A); note('A on difficulty');
      const difficulty = JSON.parse(localStorage.getItem(SAVE_KEY)).difficulty;
      K.tap(K.BUTTON.B); note('B goes back');
      K.tap(K.BUTTON.A); note('A on difficulty again');
      K.tap(K.BUTTON.A); note('A on one player');
      K.tap(K.BUTTON.RIGHT); note('D-pad right');
      K.tap(K.BUTTON.A); note('A on a hero');
      const heroPicked = JSON.parse(localStorage.getItem(SAVE_KEY)).heroes[0];
      // A new game opens on the prologue. The Menu button skips it.
      for (let i = 0; i < 600 && game.state === 'loading'; i++) await new Promise((r) => setTimeout(r, 50));
      note('the prologue'); const prologueLevel = game.level && game.level.number;
      K.tap(K.BUTTON.START); note('Start skips the prologue');
      for (let i = 0; i < 600 && game.state === 'loading'; i++) await new Promise((r) => setTimeout(r, 50));
      // Level 1 follows it. Until Level 1 exists, the map does.
      const viaMap = game.ui.screen === 'map';
      if (viaMap) { note('the map'); K.tap(K.BUTTON.A); note('A on the map'); }
      // The level loads its models in real time.
      for (let i = 0; i < 600 && game.state === 'loading'; i++) await new Promise((r) => setTimeout(r, 50));
      note('loaded');
      for (let i = 0; i < 5 && game.state === 'cutscene'; i++) { K.tap(K.BUTTON.START); note('Start skips the scene'); }
      const w = game.world;
      const events = [];
      const origHandle = game.handle.bind(game);
      game.handle = (e) => { events.push(e.type); origHandle(e); };
      const h0 = w.playerHero(0);
      const z0 = h0.z;
      window.__pads.stick(0, 0, -1); game.advance(1.5); window.__pads.stick(0, 0, 0); game.advance(0.1);
      const walked = z0 - w.playerHero(0).z;
      K.tap(K.BUTTON.A); game.advance(0.6);
      const gifts0 = w.stats.giftsUsed.reduce((a, b) => a + b, 0);
      K.tap(K.BUTTON.X); game.advance(0.8);
      const gifts1 = w.stats.giftsUsed.reduce((a, b) => a + b, 0);
      const heroA = w.playerHero(0).i;
      K.tap(K.BUTTON.Y); const heroB = w.playerHero(0).i;
      K.tap(K.BUTTON.RB); const heroC = w.playerHero(0).i;
      K.tap(K.BUTTON.LB); const heroD = w.playerHero(0).i;
      K.tap(K.BUTTON.B); game.advance(0.2);
      note('played');
      K.tap(K.BUTTON.START); note('Start pauses');
      const t0 = w.time; game.advance(1); const frozen = w.time === t0;
      K.tap(K.BUTTON.START); note('Start resumes');
      K.tap(K.BUTTON.START); note('paused again');
      K.nudge(1, 0); K.nudge(1, 0); K.nudge(1, 0); K.tap(K.BUTTON.A); note('map from the pause menu');
      return {
        log, focus, difficulty, heroPicked, prologueLevel, viaMap, walked, jumped: events.includes('jump'), gifts: gifts1 - gifts0,
        heroes: [heroA, heroB, heroC, heroD], called: events.includes('call'), swapped: events.filter((e) => e === 'swap').length,
        frozen, keysUsed: game.input.keys.size - keysBefore, acts: game.log.filter((l) => l.act).map((l) => l.act),
      };
    }, SAVE_KEY);
    const at = (what) => out.log.find((l) => l.what === what);
    assert.strictEqual(at('open').screen, 'title');
    assert.strictEqual(at('A on title').screen, 'difficulty');
    assert.strictEqual(out.focus, 'difficulty:medium');
    assert.strictEqual(out.difficulty, 'medium');
    assert.strictEqual(at('A on difficulty').screen, 'players');
    assert.strictEqual(at('B goes back').screen, 'difficulty');
    assert.strictEqual(at('A on one player').screen, 'heroes');
    assert.strictEqual(out.heroPicked, 1, 'the D-pad did not move to the second hero');
    assert.strictEqual(at('the prologue').state, 'cutscene');
    assert.strictEqual(out.prologueLevel, 0);
    if (out.viaMap) assert.strictEqual(at('the map').screen, 'map');
    assert.strictEqual(at('played').state, 'play');
    assert.ok(out.walked > 5, `the stick moved the hero only ${out.walked}`);
    assert.ok(out.jumped, 'A did not jump');
    assert.strictEqual(out.gifts, 1, 'X did not use the gift');
    assert.notStrictEqual(out.heroes[1], out.heroes[0], 'Y did not swap hero');
    assert.notStrictEqual(out.heroes[2], out.heroes[1], 'RB did not swap hero');
    assert.strictEqual(out.heroes[3], out.heroes[1], 'LB did not swap back');
    assert.strictEqual(out.swapped, 3);
    assert.ok(out.called, 'B did not call the family');
    assert.strictEqual(at('Start pauses').state, 'paused');
    assert.strictEqual(at('Start pauses').screen, 'pause');
    assert.ok(out.frozen, 'the world kept moving while paused');
    assert.strictEqual(at('Start resumes').state, 'play');
    assert.strictEqual(at('map from the pause menu').screen, 'map');
    assert.strictEqual(out.keysUsed, 0, 'a keyboard key was used');
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 2.3 Gates
// ---------------------------------------------------------------------------------------------

function checkBypass(rows, tag) {
  assert.ok(rows.length > 0);
  for (const r of rows) {
    const who = `${tag} gate ${r.gate} (${r.mech}, ${r.gift}) as ${HERO_NAMES[r.hero]}`;
    if (r.right) {
      assert.ok(r.open, `${who}: the right gift did not open it in ${r.seconds}s`);
      assert.strictEqual(r.openedBy, r.hero, `${who}: opened by someone else`);
    } else {
      assert.ok(!r.open, `${who}: a wrong hero opened it`);
      assert.ok(!r.past, `${who}: got past the closed gate (z ${r.minZ}, far edge ${r.zFar})`);
      assert.strictEqual(r.companionsPast, 0, `${who}: a companion got past`);
      assert.ok(r.seconds >= 59.9, `${who}: only tried for ${r.seconds}s`);
    }
  }
}

for (const difficulty of ['easy', 'hard']) {
  for (const bonded of [false, true]) {
    test(`2.3 no wrong hero gets past any kind of gate, and the right gift opens it (${difficulty}, ${bonded ? 'with' : 'without'} dragons)`, async () => {
      const g = await openReady();
      try {
        const rows = await g.page.evaluate(async ({ difficulty, bonded }) => {
          const K = await import('/tests/harness/pagekit.js');
          return K.bypassCheck(K.YARD_GATES, { difficulty, bonded: [bonded, bonded, bonded, bonded] });
        }, { difficulty, bonded });
        assert.strictEqual(rows.length, 40);
        checkBypass(rows, difficulty);
        assert.deepStrictEqual(g.errors, []);
      } finally { await g.close(); }
    });
  }
}

// ---------------------------------------------------------------------------------------------
// 2.4 Guardian fights
// ---------------------------------------------------------------------------------------------

for (const guardian of GUARDIANS) {
  test(`2.4 ten Easy fights with each hero against the ${guardian}: 45 to 90 seconds, never quiet for 6, never held over 1.5, freed and friendly`, async () => {
    const g = await openReady();
    try {
      const rows = await g.page.evaluate(async (guardian) => {
        const K = await import('/tests/harness/pagekit.js');
        const out = [];
        for (let hero = 0; hero < 4; hero++) {
          for (let n = 0; n < 10; n++) {
            const b = n % 2 === 1;
            // Ten different fights: other random numbers, with and without dragons, and a player whose mind wanders.
            const lapse = n % 3 === 1 ? { every: 7, for: 0.6, seed: 11 + n } : n % 3 === 2 ? { every: 4, for: 1.0, seed: 23 + n } : null;
            out.push(await K.fight(guardian, { hero, seed: 100 + n * 13 + hero, bonded: [b, b, b, b], lapse }));
          }
        }
        return out;
      }, guardian);
      assert.strictEqual(rows.length, 40);
      for (const r of rows) {
        const tag = `${guardian} as ${HERO_NAMES[r.hero]} (seed ${r.seed})`;
        assert.ok(r.freed, `${tag}: the fight never ended`);
        assert.ok(r.length >= 45 && r.length <= 90, `${tag}: fight lasted ${r.length}s`);
        assert.ok(r.longestQuiet <= 6, `${tag}: the guardian did nothing for ${r.longestQuiet}s`);
        assert.ok(r.maxHold <= 1.5, `${tag}: ice held the guardian for ${r.maxHold}s`);
        assert.ok(r.friendly, `${tag}: not friendly after being freed`);
        assert.strictEqual(r.retries, 0, `${tag}: the family lost on Easy`);
        assert.ok(r.share < 0.25, `${tag}: companions did ${(r.share * 100).toFixed(0)}% of the work`);
      }
      const lens = rows.map((r) => r.length);
      console.log(`2.4 ${guardian}: fights ${Math.min(...lens).toFixed(1)} to ${Math.max(...lens).toFixed(1)} s, longest quiet ${Math.max(...rows.map((r) => r.longestQuiet)).toFixed(1)} s, longest ice hold ${Math.max(...rows.map((r) => r.maxHold)).toFixed(2)} s, companions at most ${(Math.max(...rows.map((r) => r.share)) * 100).toFixed(0)}%`);
      assert.deepStrictEqual(g.errors, []);
    } finally { await g.close(); }
  });
}

test('2.4 a player who does nothing but throw ice cannot freeze a guardian in place for good', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async (GUARDIANS) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      for (const name of GUARDIANS) {
        const w = await K.start(K.yardFight(name), { difficulty: 'easy', p1Hero: 2, seed: 9 });
        const v = w.playerHero(0);
        v.x = w.guardian.x; v.z = w.guardian.z + 12;
        let held = 0, moved = 0, lx = w.guardian.x, lz = w.guardian.z, t = 0, longest = 0, run = 0;
        game.botHook = () => {
          // Face the guardian and hold the gift button, nothing else.
          const dx = w.guardian.x - v.x, dz = w.guardian.z - v.z, d = Math.hypot(dx, dz) || 1;
          window.__pads.stick(0, (dx / d) * 0.3, (dz / d) * 0.3);
          window.__pads.button(0, 2, true);
        };
        while (t < 60) {
          game.advance(1 / 60, 1 / 60); t += 1 / 60;
          const gd = w.guardian;
          if (gd.state !== 'fight') break;
          if (gd.holdT > 0) { held += 1 / 60; run += 1 / 60; longest = Math.max(longest, run); } else run = 0;
          moved += Math.hypot(gd.x - lx, gd.z - lz); lx = gd.x; lz = gd.z;
        }
        game.botHook = null; window.__pads.release(0);
        out.push({ name, seconds: +t.toFixed(1), held: +held.toFixed(2), longest: +longest.toFixed(2), moved: +moved.toFixed(1), attacks: w.stats.fight.acts.length });
      }
      return out;
    }, GUARDIANS);
    for (const r of rows) {
      assert.ok(r.longest <= 1.5, `${r.name}: held still for ${r.longest}s at a stretch`);
      assert.ok(r.held / r.seconds < 0.25, `${r.name}: held still for ${r.held}s of ${r.seconds}s`);
      assert.ok(r.attacks >= Math.floor(r.seconds / 6), `${r.name}: only ${r.attacks} attacks in ${r.seconds}s`);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 2.5 Companions
// ---------------------------------------------------------------------------------------------

test('2.5 companions never open a gate: the player stands still at each gate for two minutes', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const out = [];
      const probe = await K.start(K.YARD_GATES, {});
      for (let gi = 0; gi < probe.gates.length; gi++) {
        // The player is a hero whose gift does not fit, so the right hero is always a companion.
        const need = probe.gates[gi].hero;
        const w = await K.start(K.YARD_GATES, { difficulty: 'easy', p1Hero: (need + 1) % 4, bonded: [true, true, true, true] });
        const gate = w.gates[gi];
        K.placeAtGate(w, gate);
        const res = K.play(120, [new K.Bot(w, { idle: true })]);
        out.push({
          gate: gate.id, seconds: +res.t.toFixed(1), open: gate.open, targetsHit: gate.targets.filter((t) => t.hp < t.hits).length,
          past: w.heroes.filter((h) => h.z < gate.zFar - 0.5).length, nearby: w.heroes.filter((h) => Math.hypot(h.x - w.playerHero(0).x, h.z - w.playerHero(0).z) < 9).length,
        });
      }
      return out;
    });
    assert.strictEqual(rows.length, 10);
    for (const r of rows) {
      assert.ok(r.seconds >= 119.9);
      assert.ok(!r.open, `gate ${r.gate} opened by itself`);
      assert.strictEqual(r.targetsHit, 0, `gate ${r.gate}: a companion worked on it`);
      assert.strictEqual(r.past, 0, `gate ${r.gate}: someone got past`);
      assert.strictEqual(r.nearby, 4, `gate ${r.gate}: the family wandered off`);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

test('2.5 companions follow, come when called, and do under a quarter of the work in a fight', async () => {
  const g = await openReady();
  try {
    const out = await g.page.evaluate(async (GUARDIANS) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      // Follow: a long walk with a few turns.
      const w = await K.start(K.YARD_WALK, { difficulty: 'easy', p1Hero: 1 });
      const lead = w.playerHero(0);
      let worst = 0, t = 0;
      game.botHook = () => { window.__pads.stick(0, Math.sin(t * 0.7) * 0.8, -1); };
      while (t < 25) {
        game.advance(1 / 60, 1 / 60); t += 1 / 60;
        for (const h of w.heroes) worst = Math.max(worst, Math.hypot(h.x - lead.x, h.z - lead.z));
      }
      game.botHook = null; window.__pads.release(0); game.advance(1.5);
      const follow = { walked: 2 - lead.z, worst, atRest: w.heroes.map((h) => Math.hypot(h.x - lead.x, h.z - lead.z)) };

      // Call: Joshua dashes off ahead, then calls.
      const w2 = await K.start(K.YARD_WALK, { difficulty: 'easy', p1Hero: 0 });
      const j = w2.playerHero(0);
      game.botHook = () => { window.__pads.stick(0, 0, -1); window.__pads.button(0, 2, true); };
      game.advance(1.6);
      game.botHook = null; window.__pads.release(0);
      for (let i = 0; i < 60 && j.dashT > 0; i++) game.advance(1 / 60, 1 / 60);   // let the last dash finish
      const apart = () => w2.heroes.filter((h) => h !== j).map((h) => Math.hypot(h.x - j.x, h.z - j.z));
      const before = apart();
      K.tap(K.BUTTON.B);
      const after = apart();
      game.advance(1.5);
      const settled = apart();

      // Fights: one for each guardian with each hero.
      const fights = [];
      for (const name of [...GUARDIANS, 'black_dragon']) {
        for (let hero = 0; hero < 4; hero++) fights.push(await K.fight(name, { hero, seed: 400 + hero, bonded: [hero % 2 === 0, true, hero > 1, false] }));
      }
      return { follow, before, after, settled, fights };
    }, GUARDIANS);
    assert.ok(out.follow.walked > 100, `the leader only walked ${out.follow.walked}`);
    assert.ok(out.follow.worst < 16, `a companion fell ${out.follow.worst.toFixed(1)} behind`);
    for (const d of out.follow.atRest) assert.ok(d < 6, `a companion stopped ${d.toFixed(1)} from the leader`);
    assert.ok(Math.max(...out.before) > 6, 'the dash did not leave the family behind, so the call proves nothing');
    for (const d of out.after) assert.ok(d < 4, `after the call a companion was still ${d.toFixed(1)} away`);
    for (const d of out.settled) assert.ok(d < 4, `a moment after the call a companion had drifted ${d.toFixed(1)} away`);
    assert.strictEqual(out.fights.length, 24);
    for (const f of out.fights) {
      assert.ok(f.freed, `${f.guardian}: fight did not end`);
      assert.ok(f.share > 0, `${f.guardian} as ${HERO_NAMES[f.hero]}: companions did not help at all`);
      assert.ok(f.share < 0.25, `${f.guardian} as ${HERO_NAMES[f.hero]}: companions did ${(f.share * 100).toFixed(0)}%`);
    }
    console.log(`2.5 companions' share of fight work: ${(Math.min(...out.fights.map((f) => f.share)) * 100).toFixed(0)}% to ${(Math.max(...out.fights.map((f) => f.share)) * 100).toFixed(0)}%`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 2.6 Two players
// ---------------------------------------------------------------------------------------------

test('2.6 two players walking opposite ways for 30 seconds both stay on screen', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      const ways = [
        { name: 'left and right', a: [-1, 0], b: [1, 0] },
        { name: 'forward and back', a: [0, -1], b: [0, 1] },
        { name: 'corner to corner', a: [-1, -1], b: [1, 1] },
        { name: 'the other corners', a: [1, -1], b: [-1, 1] },
      ];
      for (const way of ways) {
        for (const size of [[1280, 720], [1024, 768]]) {
          game.canvas.style.width = `${size[0]}px`; game.canvas.style.height = `${size[1]}px`;
          const w = await K.start(K.YARD_WALK, { difficulty: 'easy', players: 2, p1Hero: 0, p2Hero: 3 });
          game.view.resize();
          // Start in the middle of the wide field.
          w.heroes.forEach((h, k) => { h.x = (k - 1.5) * 1.5; h.z = -40; h.lastSafe = { x: h.x, y: h.y, z: h.z }; });
          let offscreen = 0, samples = 0, t = 0, n = 0, worstApart = 0;
          game.botHook = () => {
            window.__pads.stick(0, way.a[0], way.a[1]);
            window.__pads.stick(1, way.b[0], way.b[1]);
            if (Math.floor(t * 2) % 5 === 0) { window.__pads.button(0, 2, true); window.__pads.button(1, 0, true); } else { window.__pads.button(0, 2, false); window.__pads.button(1, 0, false); }
          };
          while (t < 30) {
            game.advance(1 / 60, 1 / 60); t += 1 / 60; n++;
            if (n % 30 === 0) {
              game.draw(0.5);                                     // the camera follows at its real pace
              const a = K.onScreen(w.playerHero(0)), b = K.onScreen(w.playerHero(1));
              samples++;
              if (!a.ok || !b.ok) offscreen++;
              worstApart = Math.max(worstApart, Math.hypot(w.playerHero(0).x - w.playerHero(1).x, w.playerHero(0).z - w.playerHero(1).z));
            }
          }
          game.botHook = null; window.__pads.release(0); window.__pads.release(1);
          out.push({ way: way.name, size: size.join('x'), samples, offscreen, worstApart: +worstApart.toFixed(1), p1: w.players[0].hero, p2: w.players[1].hero, controls: w.heroes.map((h) => h.control) });
        }
      }
      return out;
    });
    for (const r of rows) {
      assert.strictEqual(r.samples, 60);
      assert.strictEqual(r.offscreen, 0, `${r.way} at ${r.size}: a player was off screen in ${r.offscreen} of ${r.samples} looks`);
      assert.ok(r.worstApart > 8, `${r.way}: the players never pulled apart (${r.worstApart}), so the check proves nothing`);
      assert.notStrictEqual(r.p1, r.p2);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 2.7 Hints
// ---------------------------------------------------------------------------------------------

test('2.7 waiting at each gate, the Keeper speaks the hint that names the family member needed', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      const probe = await K.start(K.YARD_GATES, {});
      for (let gi = 0; gi < probe.gates.length; gi++) {
        const need = probe.gates[gi].hero;
        const w = await K.start(K.YARD_GATES, { difficulty: 'easy', p1Hero: (need + 2) % 4 });
        const gate = w.gates[gi];
        K.placeAtGate(w, gate);
        game.dialogue.history.length = 0;
        let spokenAt = null, caption = null, wanted = null, t = 0;
        const idle = new K.Bot(w, { idle: true });
        game.botHook = () => K.drive(0, idle.think(1 / 60));
        while (t < 30) {
          game.advance(1 / 60, 1 / 60); t += 1 / 60;
          if (spokenAt === null && game.dialogue.history.length) { spokenAt = t; wanted = game.ui.wanted; }
          if (spokenAt !== null && !caption && game.dialogue.caption) caption = { ...game.dialogue.caption };
        }
        game.botHook = null;
        const id = game.dialogue.history[0];
        const line = id ? game.dialogue.lines[id] : null;
        out.push({
          gate: gate.id, need, expected: gate.hint, spoken: id || null, spokenAt, wanted, caption,
          speaker: line && line.speaker, text: line && line.text, file: line && line.file,
          hints: w.stats.hints.map((h) => ({ t: +h.t.toFixed(1), line: h.line, hero: h.hero })),
        });
      }
      return out;
    });
    assert.strictEqual(rows.length, 10);
    for (const r of rows) {
      const tag = `gate ${r.gate}`;
      assert.strictEqual(r.spoken, r.expected, `${tag}: wrong hint`);
      assert.ok(r.spokenAt >= 19.5 && r.spokenAt <= 21.5, `${tag}: hint came at ${r.spokenAt}s`);
      assert.strictEqual(r.speaker, 'keeper', `${tag}: the hint is not the Keeper's`);
      assert.ok(r.text.includes(HERO_NAMES[r.need]), `${tag}: "${r.text}" does not name ${HERO_NAMES[r.need]}`);
      for (const other of HERO_NAMES) if (other !== HERO_NAMES[r.need]) assert.ok(!r.text.includes(other), `${tag}: "${r.text}" names ${other}`);
      assert.ok(r.file && r.file.endsWith('.mp3'), `${tag}: no sound file`);
      assert.strictEqual(r.wanted, r.need, `${tag}: the needed hero's picture does not bounce`);
      assert.ok(r.caption && r.caption.speaker === 'keeper', `${tag}: no caption`);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});
