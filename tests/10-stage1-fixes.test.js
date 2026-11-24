// Stage 1: every bug the audit confirmed stays fixed.
//
// These are the Stage 1 checks, carried over to the new game that replaced the
// prototype in Stage 2. Each one asserts what it asserted before. They run on
// every real level that exists and on the practice levels in tests/fixtures,
// so they keep watching as the levels are built.
const test = require('node:test');
const assert = require('node:assert');
const { openReady } = require('./harness/kit');

const SAVE_KEY = 'royal_dragon_rescue_save_v1';
const HERO_NAMES = ['Joshua', 'Daniel', 'Vanessa', 'Michael'];

// ---------------------------------------------------------------------------------------------
// 1.1 Skipping a hatching scene
// ---------------------------------------------------------------------------------------------

test('1.1 skipping the hatching scene at any moment still bonds the dragon', async () => {
  const g = await openReady();
  try {
    const res = await g.page.evaluate(async (SAVE_KEY) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      const scenes = [];
      // Every level with an egg: the real ones, and the practice nest.
      const defs = [K.YARD_NEST, ...K.realLevels().map((n) => K.LEVELS[n]).filter((d) => d.course.some((s) => s.t === 'nest'))];
      const touchEgg = async (def) => {
        game.save.bonded = [false, false, false, false];
        game.save.highest = 0;
        game.saveNow();
        const w = await K.start(def, { p1Hero: def.eggHero });
        const egg = w.L.egg;
        K.clearWayTo(w, egg.z);
        const h = w.playerHero(0);
        h.x = egg.x; h.z = egg.z + 2.2; h.y = egg.y; h.vy = 0; h.lastSafe = { x: h.x, y: h.y, z: h.z };
        w.heroes.forEach((o) => { if (o !== h) { o.x = egg.x + (o.i - 1.5) * 1.4; o.z = egg.z + 5; o.y = egg.y; o.vy = 0; } });
        game.advance(0.1);                               // the hero touches the egg and the scene starts
        return w;
      };
      for (const def of defs) {
        const eh = def.eggHero;
        // How long is the scene when nobody skips it?
        await touchEgg(def);
        let length = 0;
        while (game.state === 'cutscene' && length < 180) { game.advance(0.1); length += 0.1; }
        scenes.push({ level: def.number, length: +length.toFixed(1), endState: game.state });
        const moments = [];
        for (let t = 0; t <= length + 0.25; t += 0.1) moments.push(+t.toFixed(2));
        for (const how of ['start-button', 'skip-sign']) {
          for (const t of moments) {
            const w = await touchEgg(def);
            const started = game.state === 'cutscene';
            const sceneName = game.scene ? game.scene.name : '';
            game.advance(t);
            let skipped = false;
            if (game.state === 'cutscene') {
              skipped = true;
              if (how === 'start-button') K.tap(K.BUTTON.START);          // the controller's Menu button
              else { document.querySelector('#ui .skip').click(); game.advance(2 / 60); }
            }
            const save = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
            const row = {
              level: def.number, how, t, started, sceneName, skipped,
              bondedNow: w.heroes[eh].bonded && game.save.bonded[eh],
              savedBond: !!(save.bonded && save.bonded[eh]),
              dragonNow: !!(game.view.heroViz[eh] && game.view.heroViz[eh].dragon),
              stateAfter: game.state, screen: game.ui.screen,
            };
            // Carry on as the player would: A on the "level complete" screen.
            K.tap(K.BUTTON.A);
            await K.loaded();
            let next = game.world;
            if (!next) next = await K.start(def, {});                       // no next level yet: open this one again
            for (let i = 0; i < 6 && game.state === 'cutscene'; i++) K.tap(K.BUTTON.START);
            game.advance(0.2);
            game.drawNow();
            const viz = game.view.heroViz[eh];
            row.nextLevel = game.level ? game.level.number : null;
            row.bondedInNext = next.heroes[eh].bonded;
            row.dragonVisibleInNext = !!(viz && viz.dragon && viz.dragon.visible && viz.dragon.parent);
            out.push(row);
          }
        }
      }
      return { out, scenes };
    }, SAVE_KEY);
    assert.ok(res.out.length >= 100, `only ${res.out.length} skips tried`);
    for (const s of res.scenes) {
      assert.ok(s.length >= 5, `the hatching scene of level ${s.level} lasts only ${s.length}s`);
      assert.strictEqual(s.endState, 'complete');
    }
    for (const r of res.out) {
      const tag = `level ${r.level}, ${r.how}, t=${r.t}`;
      assert.ok(r.started, `scene did not start (${tag})`);
      assert.strictEqual(r.sceneName, 'egg', tag);
      assert.ok(r.bondedNow, `not bonded after the skip (${tag})`);
      assert.ok(r.savedBond, `bond not in the save (${tag})`);
      assert.ok(r.dragonNow, `the dragon did not appear (${tag})`);
      assert.strictEqual(r.stateAfter, 'complete', `the level did not finish (${tag})`);
      assert.notStrictEqual(r.nextLevel, null, `no level after it (${tag})`);
      assert.ok(r.bondedInNext, `the bond was lost in the next level (${tag})`);
      assert.ok(r.dragonVisibleInNext, `the dragon is missing in play (${tag})`);
    }
    assert.ok(res.out.some((r) => !r.skipped), 'no run reached the natural end of the scene');
    console.log(`1.1 ${res.out.length} skips, scenes: ${res.scenes.map((s) => `level ${s.level} ${s.length}s`).join(', ')}`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

test('1.1 only the Menu button skips a scene: jump, confirm and the other buttons do not', async () => {
  const g = await openReady();
  try {
    await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const w = await K.start(K.YARD_NEST, { p1Hero: 0 });
      const h = w.playerHero(0);
      h.x = w.L.egg.x; h.z = w.L.egg.z + 2.2;
      game.advance(0.5);
    });
    const state = () => g.page.evaluate(() => window.game.state);
    assert.strictEqual(await state(), 'cutscene');
    for (const key of ['Space', 'Enter', 'KeyJ', 'KeyE', 'KeyC', 'Escape']) {
      await g.page.keyboard.down(key);
      await g.page.evaluate(() => window.game.advance(0.1));
      await g.page.keyboard.up(key);
      await g.page.evaluate(() => window.game.advance(0.05));
      assert.strictEqual(await state(), 'cutscene', `${key} skipped the scene`);
    }
    const pad = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const out = {};
      for (const [name, b] of Object.entries(K.BUTTON)) {
        if (name === 'START') continue;
        K.tap(b);
        out[name] = window.game.state;
      }
      return out;
    });
    for (const [name, st] of Object.entries(pad)) assert.strictEqual(st, 'cutscene', `controller ${name} skipped the scene`);
    // The keyboard's own Menu key does skip, which shows the key presses above were being read.
    await g.page.keyboard.down('KeyP');
    await g.page.evaluate(() => window.game.advance(0.1));
    await g.page.keyboard.up('KeyP');
    assert.strictEqual(await state(), 'complete');
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 1.2 Choosing a level from the map
// ---------------------------------------------------------------------------------------------

test('1.2 choosing any level from the map keeps all four dragons', async () => {
  const g = await openReady();
  try {
    // Bond all four and save, then reload so the bonds come from the save.
    await g.page.evaluate(() => {
      const game = window.game;
      Object.assign(game.save, { bonded: [true, true, true, true], highest: 5, setupDone: true, players: 1, heroes: [0, 1] });
      game.saveNow();
    });
    await g.page.reload();
    await g.page.waitForFunction(() => window.game && window.game.state === 'menu');
    const rows = await g.page.evaluate(async (SAVE_KEY) => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      // Level numbers that do not exist yet are filled with the practice level, so all six can be opened.
      const standIns = [];
      for (let n = 1; n <= 6; n++) if (!K.LEVELS[n]) { game.registerLevel({ ...K.YARD_PLAY, number: n, key: `yard_play_${n}` }); standIns.push(n); }
      K.tap(K.BUTTON.A);                                   // title: Play goes to the map
      const out = [];
      for (let n = 1; n <= 6; n++) {
        const row = { n, standIn: standIns.includes(n), screen: game.ui.screen };
        const want = `level:${n}`;
        for (let i = 0; i < 12 && game.ui.items[game.ui.focus].act !== want; i++) {
          const idx = game.ui.items.findIndex((it) => it.act === want);
          K.nudge(idx > game.ui.focus ? 1 : -1, 0);
        }
        row.focused = game.ui.items[game.ui.focus].act;
        K.tap(K.BUTTON.A);
        await K.loaded();
        for (let i = 0; i < 6 && game.state === 'cutscene'; i++) K.tap(K.BUTTON.START);
        game.advance(0.5);
        game.drawNow();
        game.saveNow();
        const save = JSON.parse(localStorage.getItem(SAVE_KEY));
        row.level = game.level ? game.level.number : null;
        row.state = game.state;
        row.bonded = game.world.heroes.map((h) => h.bonded);
        row.visible = game.world.heroes.map((h) => { const v = game.view.heroViz[h.i]; return !!(v && v.dragon && v.dragon.visible && v.dragon.parent); });
        row.saved = save.bonded;
        row.highest = save.highest;
        // Back to the map through the pause menu, with the controller.
        K.tap(K.BUTTON.START);
        for (let i = 0; i < 6 && game.ui.items[game.ui.focus].act !== 'map'; i++) K.nudge(1, 0);
        K.tap(K.BUTTON.A);
        row.back = game.ui.screen;
        out.push(row);
      }
      return out;
    }, SAVE_KEY);
    assert.strictEqual(rows.length, 6);
    for (const r of rows) {
      const tag = `level ${r.n}`;
      assert.strictEqual(r.screen, 'map', tag);
      assert.strictEqual(r.focused, `level:${r.n}`, `${tag} could not be chosen on the map`);
      assert.strictEqual(r.level, r.n, tag);
      assert.strictEqual(r.state, 'play', tag);
      assert.deepStrictEqual(r.bonded, [true, true, true, true], tag);
      assert.deepStrictEqual(r.visible, [true, true, true, true], tag);
      assert.deepStrictEqual(r.saved, [true, true, true, true], tag);
      assert.strictEqual(r.highest, 5, tag);
      assert.strictEqual(r.back, 'map', tag);
    }
    console.log(`1.2 opened levels 1 to 6 from the map (${rows.filter((r) => r.standIn).length} of them practice levels standing in)`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 1.3 Falling into a gap
// ---------------------------------------------------------------------------------------------

test('1.3 a hero who falls into a gap returns to the last safe spot, never the far side', async () => {
  const g = await openReady();
  try {
    const results = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const pads = window.__pads;
      const out = [];
      const dt = 1 / 60;
      const defs = [K.YARD_GATES, ...K.realLevels().map((n) => K.LEVELS[n])];
      for (const def of defs) {
        const probe = await K.start(def, {});
        const count = probe.L.gaps.length;
        for (let gi = 0; gi < count; gi++) {
          for (let hero = 0; hero < 4; hero++) {
            for (const style of ['walk', 'jump', 'late-jump']) {
              const w = await K.start(def, { p1Hero: hero, difficulty: 'easy' });
              const gap = w.L.gaps[gi];
              const gate = gap.gate ? w.gateById(gap.gate) : null;
              K.clearWayTo(w, gap.z1 + 0.1);
              const nearEdge = gap.z1, farEdge = gap.z0;
              const cx = (gap.x0 + gap.x1) / 2, half = (gap.x1 - gap.x0) / 2;
              const side = gi % 2 === 0 ? 1 : -1;
              const ferry = !gate && gap.kind2 !== 'hop';
              // At a ferry, stand at the lane's edge where the moving platform never reaches.
              const cands = ferry ? [cx + side * (half - 1.2), cx - side * (half - 1.2)] : [cx + side * Math.min(2, half - 1.2), cx];
              const startZ = nearEdge + 3;
              const x = cands.find((c) => w.floorAt(c, startZ) && (!ferry || Math.abs(c - cx) > 3.2 + 0.8));
              if (x === undefined) { out.push({ level: def.number, gap: gap.id, hero, style, skipped: true }); continue; }
              const h = w.playerHero(0);
              h.x = x; h.z = startZ; h.y = gap.y; h.vy = 0; h.lastSafe = { x, y: gap.y, z: startZ };
              w.heroes.forEach((o) => { if (o !== h) { o.x = x; o.z = startZ + 3; o.y = gap.y; o.vy = 0; o.lastSafe = { x, y: gap.y, z: startZ + 3 }; } });
              w.farthestZ = startZ; w.progressT = 0;
              game.advance(0.3);
              const floorY = h.y;
              const safeBefore = { x: h.x, z: h.z };
              const walkIn = () => {
                let minY = h.y, fell = false, poppedUp = false, crossed = false, jumped = false;
                const falls0 = w.stats.falls;
                pads.stick(0, 0, -1);                     // push the stick forward
                for (let i = 0; i < 60 * 8; i++) {
                  const toEdge = h.z - nearEdge;
                  if (!jumped && ((style === 'jump' && toEdge < 1.2) || (style === 'late-jump' && toEdge < -0.4))) { pads.button(0, 0, true); jumped = true; } else pads.button(0, 0, false);
                  game.advance(dt, dt);
                  minY = Math.min(minY, h.y);
                  if (w.stats.falls > falls0) { fell = true; break; }
                  // Standing on the far side after having dropped below the path = popped up.
                  if (h.z < farEdge - 0.2 && h.onGround) { crossed = true; if (minY < floorY - 0.7) poppedUp = true; break; }
                }
                pads.release(0);
                game.advance(0.2);
                return { minY, fell, poppedUp, crossed };
              };
              const first = walkIn();
              const row = {
                level: def.number, gap: gap.id, kind: gate ? `gate:${gate.mech}` : (gap.kind2 === 'hop' ? 'hop' : 'ferry'), hero, style,
                fell: first.fell, poppedUp: first.poppedUp, crossed: first.crossed, gateOpen: gate ? gate.open : null,
                z: +h.z.toFixed(2), nearEdge, farEdge, minY: +first.minY.toFixed(2),
                backOnNearSide: h.z > nearEdge, movedFromSafe: +Math.hypot(h.x - safeBefore.x, h.z - safeBefore.z).toFixed(2),
              };
              // A second fall in the same place brings the Keeper's hint for this gap.
              if (first.fell && style === 'walk') {
                const second = walkIn();
                const last = w.stats.hints[w.stats.hints.length - 1] || null;
                row.secondFell = second.fell;
                row.hint = last && last.early ? last.line : null;
                row.hintText = row.hint && game.dialogue.lines[row.hint] ? game.dialogue.lines[row.hint].text : '';
                row.gateHint = gate ? gate.hint : null;
                row.need = gate ? gate.hero : null;
                row.zAfterSecond = +h.z.toFixed(2);
              }
              out.push(row);
            }
          }
        }
      }
      return out;
    });
    const runs = results.filter((r) => !r.skipped);
    assert.ok(runs.length > 50, `only ${runs.length} gap runs`);
    let fellCount = 0, hintCount = 0;
    for (const r of runs) {
      const tag = `level ${r.level} gap ${r.gap} (${r.kind}) ${HERO_NAMES[r.hero]} ${r.style}`;
      assert.ok(!r.poppedUp, `${tag}: popped up on the far side (z=${r.z}, lowest y=${r.minY})`);
      if (r.crossed && r.kind.startsWith('gate:')) assert.ok(r.gateOpen, `${tag}: crossed the gap of a gate that is still shut`);
      if (r.fell) {
        fellCount++;
        assert.ok(r.backOnNearSide, `${tag}: after a fall the hero is at z=${r.z}, past the near edge ${r.nearEdge}`);
        assert.ok(r.z <= r.nearEdge + 9, `${tag}: put back too far from the gap (z=${r.z})`);
      }
      if (r.fell && r.style === 'walk') {
        hintCount++;
        assert.ok(r.secondFell, `${tag}: could not fall in a second time`);
        assert.ok(r.zAfterSecond > r.nearEdge && r.zAfterSecond <= r.nearEdge + 9, `${tag}: after the second fall z=${r.zAfterSecond}`);
        assert.ok(r.hint, `${tag}: no hint after falling in twice`);
        if (r.kind.startsWith('gate:')) {
          // The hint names the family member whose gift this gap needs, and nobody else.
          assert.strictEqual(r.hint, r.gateHint, tag);
          for (let i = 0; i < 4; i++) {
            if (i === r.need) assert.ok(r.hintText.includes(HERO_NAMES[i]), `${tag}: the hint "${r.hintText}" does not name ${HERO_NAMES[i]}`);
            else assert.ok(!r.hintText.includes(HERO_NAMES[i]), `${tag}: the hint "${r.hintText}" names ${HERO_NAMES[i]}`);
          }
        } else if (r.kind === 'hop') assert.match(r.hintText, /jump/, tag);
        else assert.match(r.hintText, /platform/, tag);
      }
    }
    assert.ok(fellCount > 30, `only ${fellCount} runs ended in a fall`);
    assert.ok(hintCount >= 12, `only ${hintCount} hints checked`);
    console.log(`1.3 ${runs.length} gap runs, ${fellCount} falls, ${hintCount} hints checked, ${results.length - runs.length} skipped for lack of a bank`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 1.4 A computer-controlled Michael
// ---------------------------------------------------------------------------------------------

test('1.4 a computer-controlled Michael never opens a strength gate', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      const dt = 1 / 60;
      const defs = [K.YARD_GATES, ...K.realLevels().map((n) => K.LEVELS[n])];
      for (const def of defs) {
        const probe = await K.start(def, {});
        const idx = probe.gates.map((q, i) => (q.gift === 'strength' ? i : -1)).filter((i) => i >= 0);
        for (const gi of idx) {
          const w = await K.start(def, { p1Hero: 0, difficulty: 'easy', bonded: [true, true, true, true] });   // play as Joshua
          const gate = w.gates[gi];
          K.placeAtGate(w, gate);
          const j = w.playerHero(0);
          // Two minutes as Joshua, circling in front of the gate so the family mills around it.
          const c = { x: gate.useSpot.x, z: Math.max(gate.useSpot.z, w.holdZ(gate) + 2.5) };
          let t = 0;
          game.botHook = () => {
            const a = t * 0.8;
            const tx = c.x + Math.cos(a) * 2.6, tz = c.z + Math.sin(a) * 1.6;
            const dx = tx - j.x, dz = tz - j.z, len = Math.hypot(dx, dz) || 1;
            window.__pads.stick(0, dx / len, dz / len);
          };
          let nearest = Infinity;
          while (t < 120) {
            game.advance(dt, dt); t += dt;
            nearest = Math.min(nearest, Math.min(...gate.targets.map((q) => Math.hypot(q.x - w.heroes[3].x, q.z - w.heroes[3].z))));
          }
          game.botHook = null; window.__pads.release(0); game.advance(0.1);
          const row = {
            level: def.number, gate: gate.id, mech: gate.mech, openAfterJoshua: gate.open,
            targetsTouched: gate.targets.filter((q) => q.hp < q.hits || q.done).length,
            michaelCameWithin: +nearest.toFixed(1), player: w.playerHero(0).i,
          };
          // Control: with the player as Michael, the same gate opens.
          for (let i = 0; i < 4 && w.playerHero(0).i !== 3; i++) K.tap(K.BUTTON.Y);
          row.swappedTo = w.playerHero(0).i;
          const res = K.play(60, [new K.Bot(w, { hero: 3 })], { until: () => gate.open });
          const opened = w.stats.gatesOpened.find((q) => q.id === gate.id);
          row.openAfterMichael = gate.open;
          row.openedBy = opened ? opened.by : null;
          row.seconds = +res.t.toFixed(1);
          out.push(row);
        }
      }
      return out;
    });
    assert.ok(rows.length >= 2, 'no strength gates were tried');
    for (const r of rows) {
      const tag = `level ${r.level} gate ${r.gate} (${r.mech})`;
      assert.strictEqual(r.player, 0, tag);
      assert.ok(!r.openAfterJoshua, `${tag}: opened while Joshua was the player`);
      assert.strictEqual(r.targetsTouched, 0, `${tag}: a companion worked on it`);
      assert.ok(r.michaelCameWithin < 8, `${tag}: Michael never came near it (${r.michaelCameWithin}), so the check proves nothing`);
      assert.strictEqual(r.swappedTo, 3, `${tag}: could not swap to Michael`);
      assert.ok(r.openAfterMichael, `${tag}: Michael as the player could not open it in ${r.seconds}s`);
      assert.strictEqual(r.openedBy, 3, tag);
    }
    console.log(`1.4 ${rows.length} strength gates: ${rows.map((r) => r.gate).join(', ')}`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

// ---------------------------------------------------------------------------------------------
// 1.5 Memory
// ---------------------------------------------------------------------------------------------

test('1.5 leaving a level frees what it loaded', async () => {
  const g = await openReady();
  try {
    const mem = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      // Six different levels: the real ones first, then practice levels to make up the number.
      const spare = [K.YARD_PLAY, K.YARD_GATES, K.yardFight('magma', 95), K.YARD_WALK, K.yardFight('yeti', 96), K.yardFight('black_dragon', 97)];
      const six = [...K.realLevels().map((n) => K.LEVELS[n]), ...spare].slice(0, 6);
      // Eleven level loads. The first and the eleventh are the same level so
      // the two counts compare like with like.
      const order = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 0];
      const out = [];
      // The same level is played the same way each time it is loaded, so the
      // first and the eleventh counts differ only by what was not freed.
      const random = Math.random;
      const seed = (s) => { Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
      for (const k of order) {
        seed(1000 + k);
        const def = six[k];
        const w = await K.start(def, { difficulty: 'easy', bonded: [true, true, true, true], seed: 50 + k });
        // Play a little so gifts, sparks and guardian rings come and go.
        const bot = new K.Bot(w, {});
        let i = 0;
        K.play(6, [bot], { each: () => { i++; if (i % 20 === 0) window.__pads.button(0, 2, true); if (i % 30 === 0) game.draw(1 / 30); } });
        game.drawNow();
        await frame();
        game.advance(2);
        game.drawNow();
        await frame();
        out.push({ level: def.number, key: def.key, ...game.view.info() });
      }
      Math.random = random;
      return out;
    });
    const first = mem[0], last = mem[10];
    assert.strictEqual(first.key, last.key);
    for (const key of ['geometries', 'textures', 'programs']) {
      assert.ok(first[key] > 0, `${key} was not counted`);
      const limit = first[key] * 1.1;
      assert.ok(last[key] <= limit, `${key}: ${first[key]} after the first load, ${last[key]} after the eleventh (limit ${limit.toFixed(1)})`);
    }
    console.log('1.5 memory first', JSON.stringify(first), 'eleventh', JSON.stringify(last));
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});
