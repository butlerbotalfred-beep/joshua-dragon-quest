import assert from 'node:assert/strict';
import { openGame, stepGame } from './harness.mjs';

export async function runStage0Tests(browser, baseUrl) {
  const results = [];

  // Milestone 0.2: Start Level 1, run 60 seconds of game time, pass with no console errors
  {
    const name = '0.2: Level 1 runs 60 seconds with zero console errors';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      await page.evaluate(() => {
        window.game.startLevel(0, false);
      });
      await stepGame(page, 60, 1 / 60, true);

      const state = await page.evaluate(() => ({
        mode: window.game.mode,
        simTime: window.game.simTime,
        heroCount: window.game.heroes.length,
        levelIdx: window.game.currentLevelIdx,
      }));

      assert.equal(state.levelIdx, 0, 'Should be on Level 1');
      assert.equal(state.heroCount, 4, 'All 4 heroes should be spawned');
      assert.ok(state.simTime >= 59.9, `simTime should advance >= 60s, got ${state.simTime}`);
      const errors = session.getErrors();
      assert.equal(errors.length, 0, `Expected 0 console/page errors, got: ${errors.join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
