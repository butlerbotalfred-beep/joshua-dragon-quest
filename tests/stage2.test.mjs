import assert from 'node:assert/strict';
import { openGame, stepGame } from './harness.mjs';

export async function runStage2Tests(browser, baseUrl) {
  const results = [];

  // Milestone 2.1: Difficulty (Easy/Medium/Hard selectable on title, persisted, changeable in pause; Easy never loses in 5 min; Hard idle loses within 30s)
  {
    const name = '2.1: Difficulty selection, persistence, pause change, Easy 5-min survival, Hard <30s defeat';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;

      // 1. Choose Medium on title screen, verify saved, reload and verify restored
      await page.click('#diff-medium');
      const savedDiff = await page.evaluate(() => {
        const raw = localStorage.getItem('joshua_dragon_quest_save_v1');
        return raw ? JSON.parse(raw).difficulty : null;
      });
      assert.equal(savedDiff, 'medium', 'Medium difficulty should be saved to localStorage');

      // 2. Verify changeable from Pause menu
      const pauseDiffCheck = await page.evaluate(() => {
        const g = window.game;
        g.startLevel(0, false);
        g.togglePause(true);
        document.getElementById('btn-pause-difficulty').click(); // medium -> hard
        const after1 = g.difficulty;
        document.getElementById('btn-pause-difficulty').click(); // hard -> easy
        const after2 = g.difficulty;
        g.togglePause(false);
        return { after1, after2 };
      });
      assert.equal(pauseDiffCheck.after1, 'hard', 'Pause menu should cycle Medium -> Hard');
      assert.equal(pauseDiffCheck.after2, 'easy', 'Pause menu should cycle Hard -> Easy');

      // 3. On Easy: idle bot beside guardian is NEVER defeated in 5 minutes (300s)
      const easyRes = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', true);
        g.startLevel(0, false); // Bear guardian
        g.heroes.forEach((h, i) => {
          h.pos.set(g.boss.pos.x + (i - 1.5) * 1.2, g.boss.pos.y, g.boss.pos.z + 2.0);
        });
        g.step(300, 1 / 60, false);
        return {
          mode: g.mode,
          standingCount: g.heroes.filter((h) => !h.downed).length,
          bossActivated: g.boss.activated,
        };
      });
      assert.equal(easyRes.bossActivated, true, 'Guardian should activate beside idle bot');
      assert.notEqual(easyRes.mode, 'gameover', 'On Easy, idle bot must NEVER get Game Over in 5 minutes');
      assert.ok(easyRes.standingCount >= 1, 'On Easy, at least one hero stays up');

      // 4. On Hard: same idle bot beside guardian IS defeated within 30 seconds
      const hardRes = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('hard', true);
        g.startLevel(0, false); // Bear guardian
        g.heroes.forEach((h, i) => {
          h.pos.set(g.boss.pos.x + (i - 1.5) * 1.2, g.boss.pos.y, g.boss.pos.z + 2.0);
        });
        let elapsed = 0;
        const dt = 1 / 60;
        while (g.mode !== 'gameover' && elapsed < 30) {
          g.step(dt, dt, false);
          elapsed += dt;
        }
        return { mode: g.mode, elapsed: Number(elapsed.toFixed(2)) };
      });
      assert.equal(hardRes.mode, 'gameover', `On Hard, idle bot must be defeated within 30s (got mode=${hardRes.mode} at ${hardRes.elapsed}s)`);
      assert.ok(hardRes.elapsed <= 30, `Defeat took ${hardRes.elapsed}s > 30s`);

      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name: `${name} (Hard defeat in ${hardRes.elapsed}s)`, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
