// Stage 3: Level 2, the Treetop Canopy and the green egg.
//
//   3.1 The layout file exists and names every gate's gift and hint line.
//   3.2 The level runs from start to egg: the bot finishes on Easy in 8 to 12
//       minutes using all four gifts, and no gate can be got past without its gift.
//   3.3 The egg glows brighter as Joshua nears, the hatching plays with its
//       lines from the story draft, Speedy bonds, and the bond is saved.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { openReady } = require('./harness/kit');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const lines = JSON.parse(read('data/dialogue.json')).lines;
const text = (id) => (lines.find((l) => l.id === id) || {}).text;

// The four gates of Level 2, from "Each one's moment" in docs/STORY.md.
const STORY_GATES = [
  { hero: 'Daniel', gift: 'fire', does: 'Daniel clears the overgrowth' },
  { hero: 'Michael', gift: 'strength', does: 'Michael holds a bridge steady' },
  { hero: 'Vanessa', gift: 'ice', does: 'Vanessa freezes a waterfall into steps' },
  { hero: 'Joshua', gift: 'speed', does: 'Joshua makes the last long leap' },
];

async function layout() {
  const { buildLayout } = await import('../src/levels.js');
  const { LEVEL2 } = await import('../src/levels/level2.js');
  const { HEROES, GUARDIANS } = await import('../src/config.js');
  return { L: buildLayout(LEVEL2), def: LEVEL2, HEROES, GUARDIANS };
}

test('3.1 docs/levels/level-2.md holds the map, the four gates in order, the berries and the arena', async () => {
  const file = path.join(root, 'docs/levels/level-2.md');
  assert.ok(fs.existsSync(file), 'docs/levels/level-2.md does not exist');
  const doc = read('docs/levels/level-2.md');
  const { L, def, HEROES, GUARDIANS } = await layout();

  // The story's own sentence about the gates is still what the story draft says.
  const story = read('docs/STORY.md');
  const moment = 'Daniel clears the overgrowth. Michael holds a bridge steady. Vanessa freezes a waterfall into steps. Joshua makes the last long leap';
  assert.ok(story.includes(moment), 'the story draft no longer lists these four gates for Level 2');

  // The level itself has exactly those gates, in that order.
  assert.strictEqual(L.gates.length, 4);
  L.gates.forEach((g, i) => {
    assert.strictEqual(HEROES[g.hero].name, STORY_GATES[i].hero, `gate ${i + 1} belongs to the wrong hero`);
    assert.strictEqual(g.gift, STORY_GATES[i].gift);
    assert.ok(text(g.hint), `gate ${i + 1} has no hint line in data/dialogue.json`);
    assert.ok(text(g.hint).startsWith(STORY_GATES[i].hero + ','), `the hint for gate ${i + 1} does not name ${STORY_GATES[i].hero}: "${text(g.hint)}"`);
  });

  // The map in the file is the level's own map, to the letter.
  const map = execFileSync('node', ['tools/level-map.mjs', '2'], { cwd: root, env: { ...process.env, NODE_NO_WARNINGS: '1' } }).toString().trim();
  const a = doc.indexOf('<!-- map:start -->'), b = doc.indexOf('<!-- map:end -->');
  assert.ok(a > 0 && b > a, 'the map markers are missing');
  assert.strictEqual(doc.slice(a + '<!-- map:start -->'.length, b).trim(), map, 'the map in the file is not the map of the level (run: node tools/level-map.mjs 2 --write)');

  // Every gate names its gift and its hint line, in order, in the map and again in the gate list.
  for (const part of [doc.slice(a, b), doc.slice(doc.indexOf('## The four gates, in order'), doc.indexOf('## Berries'))]) {
    let at = 0;
    L.gates.forEach((g, i) => {
      const s = STORY_GATES[i];
      const hint = `"${text(g.hint)}"`;
      const iHero = part.indexOf(s.hero, at);
      assert.ok(iHero >= 0, `gate ${i + 1}: ${s.hero} is not named, or is out of order`);
      const iGift = part.indexOf(s.gift, iHero);
      assert.ok(iGift >= 0 && iGift - iHero < 200, `gate ${i + 1}: the gift "${s.gift}" is not named beside ${s.hero}`);
      const iHint = part.indexOf(hint, iHero);
      assert.ok(iHint >= 0, `gate ${i + 1}: the hint line ${hint} is missing or out of order`);
      at = iHint + hint.length;
    });
  }
  for (const s of STORY_GATES) assert.ok(doc.includes(`**${s.does} (${s.gift}).**`), `the gate list does not say "${s.does} (${s.gift})"`);

  // Berries and the arena, with the numbers the level really has.
  assert.ok(L.bushes.length >= 8);
  assert.strictEqual(L.gold.length, 3);
  assert.ok(doc.includes(`**${L.bushes.length} berry bushes**`), `the file does not say there are ${L.bushes.length} berry bushes`);
  assert.ok(doc.includes('**3 gold berries**'));
  const A = L.arena;
  assert.ok(A, 'the level has no arena');
  assert.strictEqual(GUARDIANS[def.guardian].name, 'Old Vine');
  const arenaPart = doc.slice(doc.indexOf("## The guardian's arena"), doc.indexOf('## The nest and the hatching'));
  assert.ok(arenaPart.includes('Old Vine'));
  assert.ok(arenaPart.includes(`${Math.round(A.x1 - A.x0)} wide and ${Math.round(A.z1 - A.z0)} long`), 'the arena size in the file is not the arena size in the level');
  // The egg is the green one and it is Joshua's.
  assert.strictEqual(def.eggProp, 'egg_green');
  assert.strictEqual(HEROES[def.eggHero].name, 'Joshua');
  // The order of the big moments: gates 1 to 3, the Old Vine, Joshua's leap, the nest.
  const order = [L.gates[0].zNear, L.gates[1].zNear, L.gates[2].zNear, A.z1, L.gates[3].zNear, L.egg.z];
  for (let i = 1; i < order.length; i++) assert.ok(order[i] < order[i - 1], 'the big moments are out of order');
});

test('3.2 the bot finishes Level 2 on Easy in 8 to 12 minutes using all four gifts', async () => {
  const g = await openReady();
  try {
    const runs = [];
    for (const seed of [1, 2, 3]) {
      runs.push(await g.page.evaluate(async (seed) => {
        const K = await import('/tests/harness/pagekit.js');
        const { CHILD } = await import('/tests/harness/botcore.js');
        const game = window.game;
        await game.startLevel(2, { difficulty: 'easy', players: 1, p1Hero: 0, bonded: [false, false, false, false], seed });
        await K.loaded();
        const w = game.world;
        let freedEvents = 0, quiet = 0, longestQuiet = 0;
        const emit = w.emit.bind(w);
        w.emit = (type, data) => { if (type === 'enemyFreed') freedEvents++; emit(type, data); };
        const bot = new K.Bot(w, { ...CHILD, lapse: { ...CHILD.lapse, seed: 5 + seed } });
        const res = K.play(900, [bot], {
          until: () => game.state === 'complete',
          each: () => { quiet = w.progressT < quiet ? 0 : w.progressT; longestQuiet = Math.max(longestQuiet, w.progressT); },
        });
        return {
          seed, state: game.state, minutes: +(res.t / 60).toFixed(2), retries: res.retries,
          playMinutes: +(w.time / 60).toFixed(2),
          gifts: w.stats.giftsUsed, gates: w.stats.gatesOpened.map((q) => ({ id: q.id, by: q.by, gift: q.gift })),
          hints: w.stats.hints.filter((h) => h.kind === 'gate').map((h) => ({ gate: h.gate, hero: h.hero })),
          falls: w.stats.falls, freed: w.stats.enemiesFreed, freedEvents, creatures: w.enemies.length,
          fight: w.stats.fights[0] ? +w.stats.fights[0].length.toFixed(1) : null,
          gold: w.gold.filter((q) => q.taken).length, bushes: w.bushes.filter((q) => q.taken).length, bushTotal: w.bushes.length,
          bonded: w.heroes[0].bonded, saved: game.save.bonded[0], longestQuiet: +longestQuiet.toFixed(1),
          downs: w.heroes.filter((h) => h.state === 'down').length,
        };
      }, seed));
    }
    for (const r of runs) {
      console.log(`3.2 child-pace bot, seed ${r.seed}: ${r.minutes} minutes start to end of the hatching (${r.playMinutes} of play), fight ${r.fight}s, ${r.gold}/3 gold, ${r.bushes}/${r.bushTotal} bushes, ${r.freed} creatures freed, ${r.falls} falls`);
      assert.strictEqual(r.state, 'complete', `seed ${r.seed}: the level was not finished (${r.state})`);
      assert.ok(r.minutes >= 8 && r.minutes <= 12, `seed ${r.seed}: took ${r.minutes} minutes, outside 8 to 12`);
      assert.strictEqual(r.retries, 0, 'nobody can lose on Easy');
      assert.strictEqual(r.downs, 0);
      r.gifts.forEach((n, i) => assert.ok(n > 0, `seed ${r.seed}: hero ${i}'s gift was never used`));
      assert.deepStrictEqual(r.gates, [
        { id: 'l2_overgrowth', by: 1, gift: 'fire' }, { id: 'l2_bridge', by: 3, gift: 'strength' },
        { id: 'l2_waterfall', by: 2, gift: 'ice' }, { id: 'l2_leap', by: 0, gift: 'speed' },
      ]);
      // Every gate hint that played named the hero that gate needs.
      const need = { l2_overgrowth: 1, l2_bridge: 3, l2_waterfall: 2, l2_leap: 0 };
      for (const h of r.hints) assert.strictEqual(h.hero, need[h.gate]);
      // A freed creature is announced (its happy sound and sparkle hang on this).
      assert.strictEqual(r.freedEvents, r.freed);
      assert.ok(r.freed >= 6, `only ${r.freed} of ${r.creatures} creatures were met`);
      assert.ok(r.fight >= 45 && r.fight <= 90, `the Old Vine fight took ${r.fight}s`);
      assert.ok(r.bonded && r.saved, 'Speedy was not bonded and saved at the end');
      // Never stuck: something moved forward at least every 45 seconds, hints included.
      assert.ok(r.longestQuiet <= 45, `nothing moved forward for ${r.longestQuiet}s`);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

test('3.2 a quick bot also finishes Level 2 on Medium and on Hard', async () => {
  const g = await openReady();
  try {
    for (const difficulty of ['medium', 'hard']) {
      const r = await g.page.evaluate(async (difficulty) => {
        const K = await import('/tests/harness/pagekit.js');
        const game = window.game;
        await game.startLevel(2, { difficulty, players: 1, p1Hero: 0, bonded: [false, false, false, false], seed: 4 });
        await K.loaded();
        const w0 = game.world;
        let bot = new K.Bot(w0, { react: 0.3, collect: true });
        let world = w0;
        const res = K.play(900, [{ think: (dt) => { if (game.world !== world) { world = game.world; bot = new K.Bot(world, { react: 0.3, collect: true }); } return bot.think(dt); } }], { until: () => game.state === 'complete' });
        return { state: game.state, minutes: +(res.t / 60).toFixed(2), retries: res.retries, gates: game.world.stats.gatesOpened.length };
      }, difficulty);
      console.log(`3.2 quick bot on ${difficulty}: ${r.minutes} minutes, ${r.retries} tries again`);
      assert.strictEqual(r.state, 'complete', `${difficulty}: the level was not finished`);
      assert.strictEqual(r.gates, 4);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

for (const difficulty of ['easy', 'hard']) {
  test(`3.2 no gate of Level 2 can be got past without its gift (${difficulty})`, async () => {
    const g = await openReady();
    try {
      const rows = await g.page.evaluate(async (difficulty) => {
        const K = await import('/tests/harness/pagekit.js');
        return K.bypassCheck(2, { difficulty });
      }, difficulty);
      assert.strictEqual(rows.length, 16);
      for (const r of rows) {
        if (r.right) {
          assert.ok(r.open, `${r.gate}: the right hero could not open it`);
          assert.ok(r.seconds < 60, `${r.gate}: the right hero took the whole minute`);
        } else {
          assert.ok(!r.open, `${r.gate}: opened by hero ${r.hero}, who has the wrong gift`);
          assert.ok(!r.past, `${r.gate}: hero ${r.hero} got past it (reached z ${r.minZ}, the far side is ${r.zFar})`);
          assert.strictEqual(r.seconds, 60);
          assert.strictEqual(r.companionsPast, 0, `${r.gate}: a companion got past it`);
        }
      }
      console.log(`3.2 bypass on ${difficulty}: 4 gates, 12 wrong-hero minutes, none got past; the right hero opened each in ${rows.filter((r) => r.right).map((r) => r.seconds + 's').join(', ')}`);
      assert.deepStrictEqual(g.errors, []);
    } finally {
      await g.close();
    }
  });
}

test('3.3 the egg glows brighter as Joshua nears', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const w = await K.start(2, { difficulty: 'easy', p1Hero: 0 });
      const egg = w.L.egg;
      K.clearWayTo(w, egg.z);
      const out = [];
      for (const d of [70, 50, 40, 36, 23, 15, 10, 5]) {
        w.heroes.forEach((h, i) => {
          h.x = egg.x + (i ? (i - 2) * 1.5 : 0); h.z = egg.z + d + (i ? 2 : 0); h.y = egg.y; h.vy = 0;
          h.lastSafe = { x: h.x, y: h.y, z: h.z };
        });
        let scale = 0, opacity = 0, wobble = 0;
        for (let i = 0; i < 60; i++) {
          game.advance(1 / 60, 1 / 60);
          game.view.sync(w, 1 / 60);          // move the picture on without drawing it (drawing is slow in the test browser)
          const e = game.view.eggViz;
          scale += e.glow.scale.x / 60; opacity += e.glow.material.opacity / 60; wobble = Math.max(wobble, Math.abs(e.model.rotation.z));
        }
        out.push({ d, leader: w.leader().i, near: +w.eggNearness().toFixed(3), scale: +scale.toFixed(3), opacity: +opacity.toFixed(3), wobble: +wobble.toFixed(4), touched: w.eggTouched, state: game.state });
      }
      return out;
    });
    for (const r of rows) {
      assert.strictEqual(r.leader, 0, 'Joshua is not the one walking');
      assert.ok(!r.touched && r.state === 'play', `the scene began from ${r.d} away`);
    }
    // From far off it already glows a little, the same from anywhere far.
    assert.ok(rows[0].opacity > 0.1 && rows[0].scale > 1);
    assert.strictEqual(rows[0].opacity, rows[1].opacity);
    // Every step nearer, it is brighter and bigger, and it trembles more.
    for (let i = 2; i < rows.length; i++) {
      assert.ok(rows[i].opacity > rows[i - 1].opacity, `not brighter at ${rows[i].d} than at ${rows[i - 1].d}`);
      assert.ok(rows[i].scale > rows[i - 1].scale, `not bigger at ${rows[i].d} than at ${rows[i - 1].d}`);
      assert.ok(rows[i].wobble > rows[i - 1].wobble, `not trembling more at ${rows[i].d} than at ${rows[i - 1].d}`);
    }
    const last = rows[rows.length - 1];
    assert.ok(last.opacity > rows[0].opacity * 3, 'the glow close up is not much brighter than far off');
    console.log(`3.3 glow from far to near: ${rows.map((r) => `${r.d}: ${r.opacity}`).join(', ')}`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

test('3.3 the hatching plays with its lines, Speedy bonds, and after a reload Speedy is there', async () => {
  const g = await openReady();
  try {
    await g.page.evaluate(() => { localStorage.clear(); });
    await g.page.reload();
    await g.page.waitForFunction(() => window.game && window.game.state === 'menu', null, { timeout: 180000 });
    const r = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const before = { bonded: [...game.save.bonded] };
      await game.startLevel(2, { difficulty: 'easy', players: 1, p1Hero: 0, seed: 2 });
      await K.loaded();
      const w = game.world;
      // Everything before the last gate is done; the bot makes Joshua's leap and walks to the egg.
      const last = w.gates[3];
      K.clearWayTo(w, last.zNear + 2);
      K.placeAtGate(w, last);
      const heard = [];                      // sounds, music and lines, in the order they happen
      const sfx = game.audio.sfx.bind(game.audio), music = game.audio.playMusic.bind(game.audio);
      game.audio.sfx = (name, v) => { heard.push('sfx:' + name); return sfx(name, v); };
      game.audio.playMusic = (track, o) => { heard.push('music:' + track); return music(track, o); };
      let said = game.dialogue.history.length;
      let mostWords = 0, sawCutscene = false, zoomStarted = false, bondedDuring = null, laps = 0, lastA = null;
      let dragonBeforeScene = !!game.view.heroViz[0].dragon;
      const bot = new K.Bot(w, { react: 0.5 });
      const res = K.play(240, [bot], {
        until: () => game.state === 'complete',
        each: () => {
          for (; said < game.dialogue.history.length; said++) heard.push('line:' + game.dialogue.history[said]);
          mostWords = Math.max(mostWords, game.words().length);
          if (game.state === 'cutscene') {
            sawCutscene = true;
            game.view.sync(w, 1 / 60);        // the picture moves on with the scene
            const viz = game.view.heroViz[0];
            if (viz.zoom) zoomStarted = true;
            if (viz.dragon && zoomStarted) {
              const h = w.heroes[0];
              const a = Math.atan2(viz.dragon.position.x - h.x, viz.dragon.position.z - h.z);
              if (lastA !== null) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; laps += d / (2 * Math.PI); }
              lastA = a;
            }
          }
        },
      });
      const egg = w.L.egg, j = w.heroes[0];
      return {
        before, state: game.state, seconds: +res.t.toFixed(1), heard, mostWords, sawCutscene, zoomStarted, laps: +Math.abs(laps).toFixed(2),
        dragonBeforeScene, bondedWorld: j.bonded, bondedSave: game.save.bonded[0], others: game.save.bonded.slice(1),
        dragonShown: !!game.view.heroViz[0].dragon, eggGone: game.view.eggViz.hatched && !game.view.eggViz.model.visible,
        joshuaAtEgg: +Math.hypot(j.x - egg.x, j.z - egg.z).toFixed(2), leapBy: w.stats.gatesOpened.find((q) => q.id === 'l2_leap'),
        highest: game.save.highest, stored: JSON.parse(localStorage.getItem(Object.keys(localStorage)[0])).bonded,
      };
    });
    assert.deepStrictEqual(r.before.bonded, [false, false, false, false], 'the save did not start empty');
    assert.ok(!r.dragonBeforeScene, 'Speedy was there before the egg hatched');
    assert.strictEqual(r.state, 'complete');
    assert.ok(r.sawCutscene, 'no scene played');
    assert.strictEqual(r.leapBy.by, 0, 'the last leap was not Joshua\'s');
    // The lines of the story draft, in order, with the music and the sounds around them.
    const order = ['line:l2_keeper_glow', 'music:hatching', 'line:l2_joshua_hatch', 'sfx:hatch', 'sfx:chirp', 'line:l2_michael_friend'];
    let at = -1;
    for (const what of order) {
      const i = r.heard.indexOf(what, at + 1);
      assert.ok(i > at, `"${what}" did not happen, or happened out of order: ${r.heard.join(' ')}`);
      at = i;
    }
    for (const id of ['l2_keeper_glow', 'l2_joshua_hatch', 'l2_michael_friend']) {
      assert.strictEqual(r.heard.filter((h) => h === 'line:' + id).length, 1, `${id} played more than once`);
    }
    assert.strictEqual(text('l2_keeper_glow'), 'See how it glows? It can hear you coming, Joshua.');
    assert.strictEqual(text('l2_joshua_hatch'), "Hi. I'm Joshua. I'll look after you. I promise.");
    assert.strictEqual(text('l2_michael_friend'), 'I think you have a friend for life, son.');
    assert.ok(r.mostWords <= 8, `${r.mostWords} words were on screen at once`);
    // Speedy: out of the egg, a zoom around Joshua's head, bonded and saved.
    assert.ok(r.eggGone && r.dragonShown, 'the egg did not hatch into Speedy');
    assert.ok(r.zoomStarted && r.laps >= 2, `Speedy flew ${r.laps} times around Joshua's head`);
    assert.ok(r.joshuaAtEgg < 4, `Joshua was ${r.joshuaAtEgg} from the egg`);
    assert.ok(r.bondedWorld && r.bondedSave && r.stored[0], 'Speedy is not bonded in play and in the save');
    assert.deepStrictEqual(r.others, [false, false, false], 'another dragon was bonded too');
    assert.ok(r.highest >= 2);

    // Close the game and come back: Speedy is there.
    await g.page.reload();
    await g.page.waitForFunction(() => window.game && window.game.state === 'menu', null, { timeout: 180000 });
    const after = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const saved = [...game.save.bonded];
      await game.startLevel(2, { players: 1, p1Hero: 0 });
      await K.loaded();
      game.advance(1, 1 / 60); game.drawNow();
      const viz = game.view.heroViz[0];
      const h = game.world.heroes[0];
      return {
        saved, bonded: h.bonded, dragon: !!viz.dragon && viz.dragon.visible,
        near: viz.dragon ? +Math.hypot(viz.dragon.position.x - h.x, viz.dragon.position.z - h.z).toFixed(2) : null,
        others: game.world.heroes.slice(1).map((o) => o.bonded),
      };
    });
    assert.deepStrictEqual(after.saved, [true, false, false, false]);
    assert.ok(after.bonded && after.dragon, 'after a reload Speedy is not with Joshua');
    assert.ok(after.near < 3, `Speedy is ${after.near} away from Joshua`);
    assert.deepStrictEqual(after.others, [false, false, false]);
    console.log(`3.3 hatching: ${r.heard.filter((h) => !h.startsWith('sfx:') || /hatch|chirp/.test(h)).join(', ')}; Speedy flew ${r.laps} laps; still there after a reload`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});
