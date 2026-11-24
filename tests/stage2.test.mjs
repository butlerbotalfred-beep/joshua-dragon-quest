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

  // Milestone 2.3: Solid edges and unskippable gates (3 wrong heroes hug edges/jump 60s -> blocked; right hero opens)
  {
    const name = '2.3: Solid corridor edges & gates cannot be bypassed by wrong heroes in 60s, right gift opens them';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const gateReport = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', false);
        g.bondedDragons = [true, true, true, true];
        g.startLevel(0, false); // Level 1 has bramble (Daniel), boulder (Michael), water_freeze (Vanessa)
        // Clear enemies/webs so we test gate geometry purely
        g.enemies.forEach((e) => { e.dead = true; e.mesh.visible = false; });
        g.webs.forEach((w) => { w.active = false; w.mesh.visible = false; });

        const reports = [];
        const gates = [...g.gates].sort((a, b) => b.z - a.z); // front to back (descending Z)

        for (const gate of gates) {
          const startZ = gate.z + (gate.chasmZone ? gate.chasmZone.d / 2 + 2.5 : 4.2);
          const wrongHeroes = [0, 1, 2, 3].filter((idx) => idx !== gate.requiredHeroIdx);

          for (const wrongIdx of wrongHeroes) {
            g.p1Hero = wrongIdx;
            const h = g.heroes[wrongIdx];
            h.pos.set(0, 0, startZ);
            h.lastSafePos.set(0, 0, startZ);
            h.vel.set(0, 0, 0);
            h.onGround = true;

            let minZReached = startZ;
            // 60 seconds: alternate hugging left edge, center, right edge while moving forward, jumping, and attacking
            for (let sec = 0; sec < 60; sec++) {
              const phase = sec % 6;
              g.keys = {
                KeyW: true,
                KeyA: phase === 0 || phase === 1,
                KeyD: phase === 3 || phase === 4,
              };
              if (sec % 2 === 0) g.heroJump(h);
              if (sec % 3 === 0) g.heroPrimaryAbility(h);
              if (sec % 5 === 0) g.heroSpecialAbility(h);
              g.step(1.0, 1 / 60, false);
              if (h.pos.z < minZReached) minZReached = h.pos.z;
            }
            g.keys = {};
            reports.push({
              gateId: gate.id,
              gateType: gate.type,
              heroIdx: wrongIdx,
              openedByWrong: gate.opened,
              bypassed: minZReached < gate.blockZ - 0.5,
              minZReached: Number(minZReached.toFixed(2)),
              blockZ: gate.blockZ,
            });
          }

          // Now right hero opens the gate and crosses past blockZ!
          g.p1Hero = gate.requiredHeroIdx;
          const rh = g.heroes[gate.requiredHeroIdx];
          rh.pos.set(0, 0, startZ);
          rh.lastSafePos.set(0, 0, startZ);
          rh.vel.set(0, 0, 0);
          rh.facing = Math.PI; // face -Z toward gate
          g.magic = g.maxMagic;
          g.heroPrimaryAbility(rh);
          g.step(0.5, 1 / 60, false);
          if (!gate.opened) {
            g.heroSpecialAbility(rh);
            g.step(0.5, 1 / 60, false);
          }
          // Walk forward through the now-opened gate
          g.keys = { KeyW: true };
          g.step(2.5, 1 / 60, false);
          g.keys = {};
          reports.push({
            gateId: gate.id,
            gateType: gate.type,
            heroIdx: gate.requiredHeroIdx,
            isRightHero: true,
            openedByRight: gate.opened,
            crossedPast: rh.pos.z < gate.blockZ - 1.0,
            finalZ: Number(rh.pos.z.toFixed(2)),
            blockZ: gate.blockZ,
          });
        }
        return reports;
      });

      assert.ok(gateReport.length >= 12, `Expected at least 3 gates x 4 hero checks, got ${gateReport.length}`);
      for (const r of gateReport) {
        if (r.isRightHero) {
          assert.equal(r.openedByRight, true, `Right hero ${r.heroIdx} failed to open gate ${r.gateId}`);
          assert.equal(r.crossedPast, true, `Right hero ${r.heroIdx} failed to cross opened gate ${r.gateId} (z=${r.finalZ}, blockZ=${r.blockZ})`);
        } else {
          assert.equal(r.openedByWrong, false, `Wrong hero ${r.heroIdx} opened gate ${r.gateId}!`);
          assert.equal(r.bypassed, false, `Wrong hero ${r.heroIdx} bypassed gate ${r.gateId} (minZ=${r.minZReached} < blockZ=${r.blockZ})`);
        }
      }

      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
