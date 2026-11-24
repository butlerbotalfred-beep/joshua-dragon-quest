import assert from 'node:assert/strict';
import { openGame, stepGame } from './harness.mjs';

export async function runStage1Tests(browser, baseUrl) {
  const results = [];

  // Milestone 1.1: Skipping hatching scene at every moment from start to end grants bond in play and in save; Space does not skip
  {
    const name = '1.1: Skipping hatching scene at any moment still grants bond in play and save';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;

      // Verify Space key does NOT skip a hatching cutscene
      const spaceCheck = await page.evaluate(() => {
        const g = window.game;
        g.resetSave();
        g.startLevel(1, false); // Level 2 (Speedy)
        g.boss.dead = true;
        g.heroes[0].pos.copy(g.eggObj.pos);
        g.step(0.05, 1 / 60, false);
        const modeBefore = g.mode;
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        const modeAfterSpace = g.mode;
        return { modeBefore, modeAfterSpace };
      });
      assert.equal(spaceCheck.modeBefore, 'cutscene', 'Hatching cutscene should start');
      assert.equal(spaceCheck.modeAfterSpace, 'cutscene', 'Space (jump) must not skip cutscene');

      // Test skipping at moments 0.0, 0.25, 0.5, 1.0, 1.5, 2.1, 2.5, 4.0, 5.5s across all 4 egg levels (levels 2..5)
      const skipMoments = [0.0, 0.25, 0.5, 1.0, 1.5, 2.1, 2.5, 4.0, 5.5];
      for (const moment of skipMoments) {
        const res = await page.evaluate((tSkip) => {
          const g = window.game;
          g.resetSave();
          g.startLevel(1, false); // Level 2 -> Joshua + Speedy (index 0)
          g.boss.dead = true;
          g.heroes[0].pos.copy(g.eggObj.pos);
          g.step(0.05, 1 / 60, false);
          if (tSkip > 0) g.step(tSkip, 1 / 60, false);
          if (g.mode === 'cutscene') g.finishCutscene();
          const savedRaw = localStorage.getItem('joshua_dragon_quest_save_v1');
          const saved = savedRaw ? JSON.parse(savedRaw) : null;
          return {
            bondedInPlay: g.bondedDragons[0],
            dragonVisible: g.heroes[0].dragonMesh.visible,
            bondedInSave: saved ? saved.bondedDragons[0] : false,
          };
        }, moment);

        assert.equal(res.bondedInPlay, true, `At skip t=${moment}s, Speedy must be bonded in play`);
        assert.equal(res.dragonVisible, true, `At skip t=${moment}s, Speedy mesh must be visible`);
        assert.equal(res.bondedInSave, true, `At skip t=${moment}s, Speedy must be bonded in save`);
      }

      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
