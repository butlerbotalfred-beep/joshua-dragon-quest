// Milestone 0.2: the game opens in a headless browser, Level 1 starts, and
// 60 seconds of game time pass with no console errors.
const test = require('node:test');
const assert = require('node:assert');
const { openGame } = require('./harness/browser');

test('0.2 Level 1 runs for 60 seconds of game time with no console errors', async () => {
  const g = await openGame();
  try {
    await g.page.waitForFunction(() => window.game && window.game.assetsReady, null, { timeout: 120000 });
    await g.page.evaluate(() => window.game.assetsReady);
    const out = await g.page.evaluate(() => {
      const game = window.game;
      game.startLevel(0, false);
      const t0 = game.clock.elapsedTime;
      game.advance(60);
      return { mode: game.mode, level: game.currentLevelIdx, elapsed: game.clock.elapsedTime - t0, heroes: game.heroes.length };
    });
    assert.strictEqual(out.mode, 'playing');
    assert.strictEqual(out.level, 0);
    assert.strictEqual(out.heroes, 4);
    assert.ok(Math.abs(out.elapsed - 60) < 0.01, `stepped ${out.elapsed}s`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});
