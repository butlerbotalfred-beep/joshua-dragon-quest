// Stage 1: every bug the audit confirmed stays fixed.
const test = require('node:test');
const assert = require('node:assert');
const { openGame } = require('./harness/browser');

const SAVE_KEY = 'joshua_dragon_quest_save_v1';

async function ready(g) {
  await g.page.waitForFunction(() => window.game && window.game.assetsReady, null, { timeout: 180000 });
  await g.page.evaluate(() => window.game.assetsReady);
}

test('1.1 skipping the hatching scene at any moment still bonds the dragon', async () => {
  const g = await openGame();
  try {
    await ready(g);
    const results = await g.page.evaluate((SAVE_KEY) => {
      const game = window.game;
      const out = [];
      // Skip at every moment from the first frame to the natural end (5.5 s).
      const moments = [];
      for (let t = 0; t <= 5.6; t += 0.1) moments.push(+t.toFixed(2));
      for (const how of ['start-button', 'skip-button']) {
        for (const t of moments) {
          localStorage.removeItem(SAVE_KEY);
          game.bondedDragons = [false, false, false, false];
          game.startLevel(1, false);
          game.boss.dead = true;                       // the guardian is already beaten
          game.swapHero(1, 0, true);
          const joshua = game.heroes[0];
          joshua.pos.copy(game.eggObj.pos).add({ x: 0, y: 0, z: 2 });
          game.advance(0.1);                           // Joshua touches the egg, scene starts
          const started = game.mode === 'cutscene';
          game.advance(t);
          if (game.mode === 'cutscene') {
            if (how === 'start-button') {
              window.__pads.button(0, 9, true);        // controller Start
              game.advance(1 / 60);
              window.__pads.button(0, 9, false);
              game.advance(1 / 60);
            } else {
              document.getElementById('btn-cutscene-skip').click();
            }
          }
          const bondedNow = game.bondedDragons[0];
          const save = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
          // Carry on into the next level, as the player would.
          if (game.mode === 'story') document.getElementById('btn-story-continue').click();
          if (game.mode === 'story') document.getElementById('btn-story-continue').click();
          game.advance(0.2);
          out.push({
            how, t, started, bondedNow,
            savedBond: !!(save.bondedDragons && save.bondedDragons[0]),
            level: game.currentLevelIdx,
            dragonVisibleInPlay: !!(game.heroes[0] && game.heroes[0].dragonMesh.visible),
          });
        }
      }
      return out;
    }, SAVE_KEY);
    assert.ok(results.length >= 100);
    for (const r of results) {
      assert.ok(r.started, `scene did not start (${r.how} t=${r.t})`);
      assert.ok(r.bondedNow, `not bonded after skip (${r.how} t=${r.t})`);
      assert.ok(r.savedBond, `bond not in the save (${r.how} t=${r.t})`);
      assert.strictEqual(r.level, 2, `did not reach Level 3 (${r.how} t=${r.t})`);
      assert.ok(r.dragonVisibleInPlay, `Speedy missing in play (${r.how} t=${r.t})`);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

test('1.1 the jump key no longer skips a cutscene', async () => {
  const g = await openGame();
  try {
    await ready(g);
    await g.page.evaluate(() => {
      const game = window.game;
      game.bondedDragons = [false, false, false, false];
      game.startLevel(1, false);
      game.boss.dead = true;
      game.heroes[0].pos.copy(game.eggObj.pos).add({ x: 0, y: 0, z: 2 });
      game.advance(0.5);
    });
    await g.page.keyboard.press('Space');
    await g.page.keyboard.press('Enter');
    const mode = await g.page.evaluate(() => window.game.mode);
    assert.strictEqual(mode, 'cutscene');
  } finally { await g.close(); }
});

test('1.2 choosing any level from the menu keeps all four dragons', async () => {
  const g = await openGame();
  try {
    await ready(g);
    // Bond all four and save, then reload so the bonds come from the save.
    await g.page.evaluate(() => {
      const game = window.game;
      game.bondedDragons = [true, true, true, true];
      game.highestLevel = 5;
      game.persistSave();
    });
    await g.page.reload();
    await ready(g);
    for (let lvl = 0; lvl < 6; lvl++) {
      await g.page.click('#btn-open-levels', { force: true }).catch(() => {});
      await g.page.evaluate(() => window.game.openLevelSelect());
      await g.page.locator('#level-select-grid .level-tile').nth(lvl).click();
      const st = await g.page.evaluate((SAVE_KEY) => {
        const game = window.game;
        if (game.mode === 'story') document.getElementById('btn-story-continue').click();
        game.advance(0.5);
        game.persistSave();
        const save = JSON.parse(localStorage.getItem(SAVE_KEY));
        return {
          level: game.currentLevelIdx,
          bonded: game.bondedDragons.slice(),
          visible: game.heroes.map((h) => h.dragonMesh.visible),
          saved: save.bondedDragons, highest: save.highestLevel,
        };
      }, SAVE_KEY);
      assert.strictEqual(st.level, lvl);
      assert.deepStrictEqual(st.bonded, [true, true, true, true], `level ${lvl + 1}`);
      assert.deepStrictEqual(st.visible, [true, true, true, true], `level ${lvl + 1}`);
      assert.deepStrictEqual(st.saved, [true, true, true, true], `level ${lvl + 1}`);
      assert.strictEqual(st.highest, 5);
      await g.page.evaluate(() => window.game.returnToTitle());
    }
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

test('1.3 a hero who falls into a gap returns to the last safe spot, never the far side', async () => {
  const g = await openGame();
  try {
    await ready(g);
    const results = await g.page.evaluate(() => {
      const game = window.game;
      const out = [];
      const dt = 1 / 60;
      for (let lvl = 0; lvl < 6; lvl++) {
        game.bondedDragons = [false, false, false, false];
        game.startLevel(lvl, false);
        const gaps = game.chasmZones.map((z) => ({ x: z.x, z: z.z, w: z.w, d: z.d, hazard: z.hazardType }));
        for (let gi = 0; gi < gaps.length; gi++) {
          for (let hero = 0; hero < 4; hero++) {
            for (const style of ['walk', 'jump', 'late-jump']) {
              game.startLevel(lvl, false);
              game.enemies.forEach((e) => { e.dead = true; e.mesh.visible = false; });
              game.obstacles.forEach((o) => { o.active = false; });
              game.webs.forEach((w) => { w.active = false; });
              if (game.boss) game.boss.dead = true;
              game.swapHero(1, hero, true);
              const gap = game.chasmZones[gi];
              const nearEdge = gap.z + gap.d / 2;      // the side the family arrives from
              const farEdge = gap.z - gap.d / 2;
              const h = game.heroes[hero];
              // Stand on the near bank at the lane's edge of the gap, where no
              // moving platform reaches, and face the gap.
              const side = gi % 2 === 0 ? 1 : -1;
              const startZ = nearEdge + 5;
              let x = null, startFloor = null;
              for (const cand of [gap.x + side * (gap.w / 2 - 3.2), gap.x + side * (gap.w / 2 - 4.6), gap.x]) {
                const f = game.getFloorHeightAt(cand, startZ, true);
                if (f.onSolid && game.isSafeSpot(cand, startZ, f.y)) { x = cand; startFloor = f; break; }
              }
              if (x === null) continue;                // side pit with no bank in front
              h.pos.set(x, startFloor.y, startZ);
              h.vel.set(0, 0, 0);
              game.heroes.forEach((o) => { if (o !== h) { o.pos.set(x, startFloor.y, startZ + 3); o.vel.set(0, 0, 0); } });
              game.advance(0.3);
              const floorY = h.pos.y;
              const safeBefore = { x: h.pos.x, z: h.pos.z };
              let minY = h.pos.y, fell = false, poppedUp = false, jumped = false;
              const falls0 = h.fallCount || 0;
              window.__pads.stick(0, 0, -1);            // push the stick forward
              for (let i = 0; i < 60 * 8; i++) {
                const distToEdge = h.pos.z - nearEdge;
                if (!jumped && ((style === 'jump' && distToEdge < 1.2) || (style === 'late-jump' && distToEdge < -0.4))) {
                  window.__pads.button(0, 0, true); jumped = true;
                } else window.__pads.button(0, 0, false);
                game.advance(dt, dt);
                minY = Math.min(minY, h.pos.y);
                if ((h.fallCount || 0) > falls0) { fell = true; break; }
                // On the far side while having dropped below the floor = popped up.
                if (h.pos.z < farEdge - 0.2 && h.onGround) { if (minY < floorY - 0.7) poppedUp = true; break; }
              }
              window.__pads.release(0);
              game.advance(0.2);
              out.push({
                lvl: lvl + 1, gap: gi, hazard: gap.hazardType, hero: h.def.id, style, fell, poppedUp,
                backOnNearSide: h.pos.z > nearEdge, z: +h.pos.z.toFixed(2), nearEdge, farEdge,
                hint: h.lastFallHint || '', minY: +minY.toFixed(2),
                movedFromSafe: +Math.hypot(h.pos.x - safeBefore.x, h.pos.z - safeBefore.z).toFixed(2),
              });
            }
          }
        }
      }
      return out;
    });
    assert.ok(results.length > 50, `only ${results.length} gap runs`);
    let fellCount = 0;
    for (const r of results) {
      const tag = `L${r.lvl} gap ${r.gap} ${r.hero} ${r.style}`;
      assert.ok(!r.poppedUp, `${tag}: popped up on the far side (z=${r.z}, minY=${r.minY})`);
      if (r.fell) {
        fellCount++;
        assert.ok(r.backOnNearSide, `${tag}: after a fall the hero is at z=${r.z}, past the near edge ${r.nearEdge}`);
        assert.ok(r.z <= r.nearEdge + 9, `${tag}: put back too far from the gap (z=${r.z})`);
        // The hint names the right gift for this gap.
        if (r.hazard === 'lava') assert.match(r.hint, /Joshua/, tag);
        else if (/Vanessa/.test(r.hint) === false) assert.match(r.hint, /platform|jump/, tag);
        assert.doesNotMatch(r.hint, r.hazard === 'lava' ? /freeze/ : /slope/, tag);
      }
    }
    assert.ok(fellCount > 30, `only ${fellCount} runs ended in a fall`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});

test('1.4 a computer-controlled Michael never moves a block', async () => {
  const g = await openGame();
  try {
    await ready(g);
    const res = await g.page.evaluate(() => {
      const game = window.game;
      game.startLevel(0, false);
      game.swapHero(1, 0, true);                       // play as Joshua
      const before = game.pushPuzzles.map((p) => ({ x: p.pos.x, z: p.pos.z }));
      const block = game.pushPuzzles[0];
      const j = game.heroes[0];
      // Two minutes as Joshua, circling the block so the family mills around it.
      const dt = 1 / 60;
      for (let i = 0; i < 120 * 60; i++) {
        const a = i * dt * 0.8;
        const tx = block.pos.x + Math.cos(a) * 2.6, tz = block.pos.z + Math.sin(a) * 2.6;
        const dx = tx - j.pos.x, dz = tz - j.pos.z, len = Math.hypot(dx, dz) || 1;
        window.__pads.stick(0, dx / len, dz / len);
        game.advance(dt, dt);
      }
      window.__pads.release(0);
      const after = game.pushPuzzles.map((p) => ({ x: p.pos.x, z: p.pos.z }));
      const michaelNear = game.heroes[3].pos.distanceTo(block.pos);
      // Control: the player as Michael can still push it.
      game.swapHero(1, 3, true);
      const m = game.heroes[3];
      m.pos.set(block.pos.x + 1.6, 0, block.pos.z);
      game.advance(0.5);
      const pushed = Math.hypot(block.pos.x - after[0].x, block.pos.z - after[0].z);
      return { before, after, michaelNear, pushed, solved: game.pushPuzzles[0].solved };
    });
    assert.deepStrictEqual(res.after, res.before, 'the block moved while Joshua was the player');
    assert.ok(res.pushed > 0.5 || res.solved, 'Michael as the player could not push the block');
  } finally { await g.close(); }
});

test('1.5 leaving a level frees what it loaded', async () => {
  const g = await openGame();
  try {
    await ready(g);
    const mem = await g.page.evaluate(async () => {
      const game = window.game;
      const snap = () => ({
        geometries: game.renderer.info.memory.geometries,
        textures: game.renderer.info.memory.textures,
        programs: game.renderer.info.programs.length,
      });
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      // Eleven level loads. The first and the eleventh are the same level so
      // the two counts compare like with like.
      const order = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 0];
      const out = [];
      // The same level is played the same way each time it is loaded, so the
      // first and the eleventh counts differ only by what was not freed.
      const seed = (s) => { Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
      for (const lvl of order) {
        seed(1000 + lvl);
        game.startLevel(lvl, false);
        // Play a little so attacks, particles and guardian rings come and go.
        for (let i = 0; i < 60; i++) {
          game.heroPrimaryAbility(game.heroes[i % 4]);
          game.advance(1 / 30, 1 / 30);
        }
        await frame();
        game.advance(2);
        await frame();
        out.push({ lvl, ...snap() });
      }
      return out;
    });
    const first = mem[0], last = mem[10];
    for (const key of ['geometries', 'textures', 'programs']) {
      const limit = first[key] * 1.1;
      assert.ok(last[key] <= limit, `${key}: ${first[key]} after the first load, ${last[key]} after the eleventh (limit ${limit.toFixed(1)})`);
    }
    console.log('memory first', JSON.stringify(first), 'eleventh', JSON.stringify(last));
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});
