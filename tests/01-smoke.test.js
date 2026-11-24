// Milestone 0.2: the game opens in a headless browser, a level starts, and
// 60 seconds of game time pass with no console errors.
//
// It runs for every real level that exists. Until Level 1 exists, a practice
// level stands in for it, so the check never goes quiet.
const test = require('node:test');
const assert = require('node:assert');
const { openReady } = require('./harness/kit');

test('0.2 each level runs for 60 seconds of game time with no console errors', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      const numbers = K.realLevels();
      if (!numbers.includes(1)) { game.registerLevel({ ...K.YARD_PLAY, number: 1 }); numbers.unshift(1); }
      for (const n of numbers) {
        await game.startLevel(n);                       // with its opening scene, as a player sees it
        const w = game.world;
        const t0 = w.time;
        let stepped = 0;
        // The world stands still during a scene, so count game time, and skip a scene that runs long.
        for (let i = 0; i < 60 * 60; i++) { game.advance(1 / 60, 1 / 60); stepped += 1 / 60; }
        game.drawNow();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        out.push({
          n, real: !!K.LEVELS[n] && K.LEVELS[n].key !== 'yard_play', state: game.state, stepped,
          worldTime: w.time - t0, heroes: w.heroes.length, drawn: game.view.info().geometries,
        });
      }
      return out;
    });
    assert.ok(rows.length >= 1);
    assert.strictEqual(rows[0].n, 1);
    for (const r of rows) {
      assert.ok(['play', 'cutscene'].includes(r.state), `level ${r.n} ended in state ${r.state}`);
      assert.strictEqual(r.heroes, 4);
      assert.ok(Math.abs(r.stepped - 60) < 0.01, `stepped ${r.stepped}s`);
      assert.ok(r.worldTime > 20, `level ${r.n}: the world only moved for ${r.worldTime}s of the 60`);
      assert.ok(r.drawn > 0, `level ${r.n}: nothing was drawn`);
    }
    console.log(`0.2 ran ${rows.map((r) => `level ${r.n}${r.real ? '' : ' (practice level standing in)'}`).join(', ')}`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});
