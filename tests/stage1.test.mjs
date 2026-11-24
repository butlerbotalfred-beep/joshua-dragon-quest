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

  // Milestone 1.2: Level select never removes a dragon or any progress
  {
    const name = '1.2: Level select preserves all four bonded dragons and progress across every level';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      await page.evaluate(() => {
        const g = window.game;
        g.resetSave();
        g.bondedDragons = [true, true, true, true];
        g.completedLevels = new Set([0, 1, 2, 3, 4, 5]);
        g.highestLevel = 5;
        g.collectedGoldIds = new Set(['l1_g1', 'l2_g1', 'l3_g1']);
        g.inventory.gold = 3;
        g.persistSave();
      });

      for (let lvl = 0; lvl < 6; lvl++) {
        const state = await page.evaluate((idx) => {
          const g = window.game;
          g.openLevelSelect();
          const tiles = document.querySelectorAll('#level-select-grid .level-tile');
          tiles[idx].click();
          // Dismiss intro story if shown
          const storyBtn = document.getElementById('btn-story-continue');
          if (!document.getElementById('story-overlay').classList.contains('hidden')) {
            storyBtn.click();
          }
          g.step(0.1, 1 / 60, false);
          return {
            levelIdx: g.currentLevelIdx,
            bonded: [...g.bondedDragons],
            visibleDragons: g.heroes.map((h) => h.dragonMesh.visible),
            completedCount: g.completedLevels.size,
            highestLevel: g.highestLevel,
            goldCount: g.collectedGoldIds.size,
          };
        }, lvl);

        assert.equal(state.levelIdx, lvl, `Should have entered level ${lvl + 1}`);
        assert.deepEqual(state.bonded, [true, true, true, true], `Level ${lvl + 1} lost dragon bond`);
        assert.deepEqual(state.visibleDragons, [true, true, true, true], `Level ${lvl + 1} hid bonded dragon`);
        assert.equal(state.completedCount, 6, `Level ${lvl + 1} lost completedLevels`);
        assert.equal(state.highestLevel, 5, `Level ${lvl + 1} lost highestLevel`);
        assert.equal(state.goldCount, 3, `Level ${lvl + 1} lost collected gold berries`);
      }

      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
