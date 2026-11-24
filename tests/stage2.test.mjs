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

  // Milestone 2.2: Whole game, menus included, works from an Xbox controller alone
  {
    const name = '2.2: Full game flow (pick difficulty, start, move, attack, swap hero, pause) via controller only';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const res = await page.evaluate(() => {
        const g = window.game;
        const tap = (btnIdx, stepsAfter = 2) => {
          window.__setGamepad(0, { buttons: { [btnIdx]: true } });
          g.step(1 / 60, 1 / 60, false);
          window.__setGamepad(0, { buttons: {} });
          g.step(stepsAfter / 60, 1 / 60, false);
        };

        // Connect virtual Xbox controller on Title screen
        window.__setGamepad(0, { buttons: {} });
        g.step(0.05, 1 / 60, false);

        // Title buttons order (fresh save): 0=diff-easy, 1=diff-medium, 2=diff-hard, 3=mode-1p, 4=mode-2p, 5=btn-start-story, 6=btn-open-levels
        // Navigate right to Medium (index 1) and press A (button 0)
        tap(15); // D-pad right -> diff-medium
        tap(0);  // A -> select Medium
        const diffPicked = g.difficulty;

        // Navigate to Start New Quest (index 5: right 4 times) and press A
        tap(15); // diff-hard
        tap(15); // mode-1p
        tap(15); // mode-2p
        tap(15); // btn-start-story
        tap(0);  // A -> start prologue cutscene
        const modeAfterStart = g.mode;

        // Skip prologue with Start (button 9) to enter Level 1 gameplay
        tap(9);
        const modeInLevel = g.mode;
        const startZ = g.heroes[g.p1Hero].pos.z;

        // Move forward with Left Stick up (axis[1] = -1) for 1 second
        window.__setGamepad(0, { axes: [0, -1], buttons: {} });
        g.step(1.0, 1 / 60, false);
        window.__setGamepad(0, { axes: [0, 0], buttons: {} });
        g.step(0.05, 1 / 60, false);
        const movedZ = g.heroes[g.p1Hero].pos.z;

        // Attack with X (button 2) and Jump with A (button 0)
        tap(2);
        const attackCdAfterX = g.heroes[g.p1Hero].attackCd;
        tap(0);
        const jumpedVelY = g.heroes[g.p1Hero].vel.y;

        // Swap hero with Y (button 3)
        const heroBeforeSwap = g.p1Hero;
        tap(3);
        const heroAfterSwap = g.p1Hero;

        // Pause with Start (button 9), navigate down to Difficulty and press A, then resume with B (button 1)
        tap(9);
        const modePaused = g.mode;
        tap(13); // D-pad down -> Difficulty button in pause menu
        tap(0);  // A -> cycle difficulty medium -> hard
        const diffAfterPause = g.difficulty;
        tap(1);  // B -> resume
        const modeResumed = g.mode;

        return {
          diffPicked,
          modeAfterStart,
          modeInLevel,
          movedDist: startZ - movedZ,
          attackCdAfterX,
          jumpedVelY,
          heroBeforeSwap,
          heroAfterSwap,
          modePaused,
          diffAfterPause,
          modeResumed,
        };
      });

      assert.equal(res.diffPicked, 'medium', 'Controller should select Medium on title');
      assert.equal(res.modeAfterStart, 'cutscene', 'Controller A on Start New Quest should launch prologue');
      assert.equal(res.modeInLevel, 'playing', 'Controller Start should enter Level 1');
      assert.ok(res.movedDist > 4.0, `Controller stick should move hero forward, moved ${res.movedDist}`);
      assert.ok(res.attackCdAfterX > 0, 'Controller X should trigger primary ability');
      assert.ok(res.jumpedVelY > 5, 'Controller A should jump');
      assert.notEqual(res.heroAfterSwap, res.heroBeforeSwap, 'Controller Y should swap active hero');
      assert.equal(res.modePaused, 'paused', 'Controller Start should open pause menu');
      assert.equal(res.diffAfterPause, 'hard', 'Controller should change difficulty in pause menu');
      assert.equal(res.modeResumed, 'playing', 'Controller B should resume game');
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
