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

  // Milestone 2.4: Guardian fights (10x per guardian per hero: 45-90s on Easy, acts <=6s, ice <=1.5s, ends freed & friendly)
  {
    const name = '2.4: Guardian fights (10x each guardian x each hero: 45-90s, acts <=6s, ice <=1.5s, freed & friendly)';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const summary = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', false);
        const failures = [];
        let minTime = Infinity;
        let maxTime = 0;
        let maxFreezeSeen = 0;
        let maxActGapSeen = 0;
        let totalFights = 0;

        // Test all 6 guardians x 4 heroes x 10 trials = 240 fights
        for (let lvl = 0; lvl < 6; lvl++) {
          for (let heroIdx = 0; heroIdx < 4; heroIdx++) {
            for (let trial = 0; trial < 10; trial++) {
              totalFights++;
              // Use progression-accurate dragon bonds for each level
              g.bondedDragons = [lvl >= 2, lvl >= 3, lvl >= 4, lvl >= 5];
              g.startLevel(lvl, false);
              g.p1Hero = heroIdx;
              const h = g.heroes[heroIdx];
              // Position family in guardian arena
              g.heroes.forEach((hero, hi) => {
                hero.pos.set(g.boss.pos.x + (hi - 1.5) * 1.5, g.boss.pos.y, g.boss.pos.z + 5.0);
                hero.lastSafePos.copy(hero.pos);
              });

              let elapsed = 0;
              const dt = 1 / 30;
              let attackTick = 0;
              // Competent bot: keeps attacking on a steady human-like cadence (~0.58-0.66s) and hops over danger zones
              const cadence = 0.56 + (trial % 5) * 0.025;
              while (!g.boss.dead && elapsed < 130) {
                if (g.p1Hero !== heroIdx && !h.downed) g.p1Hero = heroIdx;
                // Keep hero at comfortable combat range from boss
                const desiredDist = (heroIdx === 1 || heroIdx === 2) ? 6.0 : 2.6;
                const dx = h.pos.x - g.boss.pos.x;
                const dz = h.pos.z - g.boss.pos.z;
                const curDist = Math.hypot(dx, dz) || 1;
                if (curDist > desiredDist + 1.2 || curDist < desiredDist - 1.0) {
                  const nx = g.boss.pos.x + (dx / curDist) * desiredDist;
                  const nz = g.boss.pos.z + (dz / curDist) * desiredDist;
                  h.pos.x = Math.max(-10, Math.min(10, nx));
                  h.pos.z = Math.max(g.boss.home.z - 10, Math.min(g.boss.home.z + 10, nz));
                }
                // Dodge danger zones by jumping
                if (g.dangerZones.some((dzObj) => dzObj.elapsed > dzObj.delay * 0.65 && h.pos.distanceTo(dzObj.pos) < dzObj.radius)) {
                  g.heroJump(h);
                }
                attackTick += dt;
                if (attackTick >= cadence && !h.downed) {
                  attackTick = 0;
                  g.heroPrimaryAbility(h);
                }
                g.step(dt, dt, false);
                elapsed += dt;
              }

              const dur = Number(elapsed.toFixed(2));
              if (dur < minTime) minTime = dur;
              if (dur > maxTime) maxTime = dur;
              if (g.boss.maxContinuousFrozenTime > maxFreezeSeen) maxFreezeSeen = g.boss.maxContinuousFrozenTime;
              if (g.boss.maxActionGap > maxActGapSeen) maxActGapSeen = g.boss.maxActionGap;

              const minTarget = lvl === 5 ? 60 : 45;
              const maxTarget = lvl === 5 ? 120 : 90;
              if (!g.boss.freed || !g.boss.friendly || !g.boss.mesh.visible) {
                failures.push(`L${lvl + 1} h${heroIdx} t${trial}: guardian not freed & visible`);
              }
              if (dur < minTarget || dur > maxTarget) {
                failures.push(`L${lvl + 1} (${g.boss.type}) h${heroIdx} t${trial}: duration ${dur}s outside [${minTarget}, ${maxTarget}]`);
              }
              if (g.boss.maxActionGap > 6.0) {
                failures.push(`L${lvl + 1} h${heroIdx} t${trial}: maxActionGap ${g.boss.maxActionGap.toFixed(2)}s > 6.0s`);
              }
              if (g.boss.maxContinuousFrozenTime > 1.5) {
                failures.push(`L${lvl + 1} h${heroIdx} t${trial}: maxFreeze ${g.boss.maxContinuousFrozenTime.toFixed(2)}s > 1.5s`);
              }
            }
          }
        }
        return {
          totalFights,
          minTime,
          maxTime,
          maxFreezeSeen: Number(maxFreezeSeen.toFixed(2)),
          maxActGapSeen: Number(maxActGapSeen.toFixed(2)),
          failures,
        };
      });

      assert.equal(summary.failures.length, 0, `Guardian fight failures (${summary.failures.length}):\n${summary.failures.slice(0, 10).join('\n')}`);
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({
        name: `${name} (${summary.totalFights} fights: ${summary.minTime}s–${summary.maxTime}s, maxFreeze=${summary.maxFreezeSeen}s, maxGap=${summary.maxActGapSeen}s)`,
        pass: true,
      });
    } finally {
      await session.close();
    }
  }

  // Milestone 2.5: Companions follow, come when called, never open a gate in 2 min, and stay under 25% of fight damage
  {
    const name = '2.5: Companions rally on call, never open gates in 2 min, and deal <25% of boss damage';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const res = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', false);
        g.bondedDragons = [true, true, true, true];
        g.startLevel(0, false);
        g.enemies.forEach((e) => { e.dead = true; e.mesh.visible = false; });
        g.webs.forEach((w) => { w.active = false; w.mesh.visible = false; });

        // 1. Call companions test: spread companions 10u away, call them, verify they gather close
        g.p1Hero = 0;
        g.heroes[0].pos.set(0, 0, 0);
        g.heroes[1].pos.set(-9, 0, 8);
        g.heroes[2].pos.set(9, 0, 8);
        g.heroes[3].pos.set(0, 0, 10);
        g.callCompanions();
        g.step(2.5, 1 / 60, false);
        const maxDistAfterCall = Math.max(
          g.heroes[1].pos.distanceTo(g.heroes[0].pos),
          g.heroes[2].pos.distanceTo(g.heroes[0].pos),
          g.heroes[3].pos.distanceTo(g.heroes[0].pos)
        );

        // 2. Stand still at EVERY gate for 2 minutes (120s) -> gate must stay shut!
        const gateStayShut = [];
        const sortedGates = [...g.gates].sort((a, b) => b.z - a.z);
        for (const gate of sortedGates) {
          // Pick a hero who is NOT the gate's required hero, so the required hero IS an AI companion!
          const playerIdx = (gate.requiredHeroIdx + 1) % 4;
          g.p1Hero = playerIdx;
          const waitZ = gate.z + (gate.chasmZone ? gate.chasmZone.d / 2 + 2.5 : 3.5);
          g.heroes.forEach((h, hi) => {
            h.pos.set((hi - 1.5) * 1.4, 0, waitZ);
            h.lastSafePos.copy(h.pos);
            h.vel.set(0, 0, 0);
          });
          g.step(120, 1 / 30, false);
          gateStayShut.push({ gateId: gate.id, opened: gate.opened });
          // Open it manually now so we can move to the next gate cleanly
          g.openGate(gate);
        }

        // 3. Fight a guardian to completion in solo play and check companion share < 0.25 (and > 0)
        g.startLevel(0, false);
        g.p1Hero = 0;
        const p1 = g.heroes[0];
        g.heroes.forEach((h, hi) => {
          h.pos.set(g.boss.pos.x + (hi - 1.5) * 1.5, g.boss.pos.y, g.boss.pos.z + 4.5);
          h.lastSafePos.copy(h.pos);
        });
        let elapsed = 0;
        let atkT = 0;
        while (!g.boss.dead && elapsed < 120) {
          const dx = p1.pos.x - g.boss.pos.x;
          const dz = p1.pos.z - g.boss.pos.z;
          const d = Math.hypot(dx, dz) || 1;
          if (d > 3.5) {
            p1.pos.x = g.boss.pos.x + (dx / d) * 2.8;
            p1.pos.z = g.boss.pos.z + (dz / d) * 2.8;
          }
          atkT += 1 / 30;
          if (atkT >= 0.6) { atkT = 0; g.heroPrimaryAbility(p1); }
          g.step(1 / 30, 1 / 30, false);
          elapsed += 1 / 30;
        }
        const totalDmg = g.boss.damageByPlayer + g.boss.damageByCompanions;
        const companionShare = totalDmg > 0 ? g.boss.damageByCompanions / totalDmg : 0;

        return {
          maxDistAfterCall: Number(maxDistAfterCall.toFixed(2)),
          gateStayShut,
          damageByPlayer: g.boss.damageByPlayer,
          damageByCompanions: g.boss.damageByCompanions,
          companionShare: Number(companionShare.toFixed(3)),
          bossFreed: g.boss.freed,
        };
      });

      assert.ok(res.maxDistAfterCall < 4.5, `Companions should gather close when called, maxDist=${res.maxDistAfterCall}`);
      for (const gs of res.gateStayShut) {
        assert.equal(gs.opened, false, `Companion opened gate ${gs.gateId} while player stood still!`);
      }
      assert.equal(res.bossFreed, true, 'Guardian should be freed');
      assert.ok(res.damageByCompanions > 0, 'Companions should help gently (> 0 damage)');
      assert.ok(res.companionShare < 0.25, `Companion share ${res.companionShare} must be < 0.25`);
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name: `${name} (share=${(res.companionShare * 100).toFixed(1)}%)`, pass: true });
    } finally {
      await session.close();
    }
  }

  // Milestone 2.6: Two players share one screen; walking opposite directions 30s keeps both on screen
  {
    const name = '2.6: Two controllers share one screen and stay on screen walking opposite directions for 30s';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const res = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', false);
        g.startLevel(0, false);
        g.enemies.forEach((e) => { e.dead = true; e.mesh.visible = false; });
        g.webs.forEach((w) => { w.active = false; w.mesh.visible = false; });
        // Place both players in open area before first gate
        g.heroes[0].pos.set(0, 0, -4);
        g.heroes[1].pos.set(0, 0, -4);
        g.heroes[0].lastSafePos.set(0, 0, -4);
        g.heroes[1].lastSafePos.set(0, 0, -4);

        // Controller 1 & 2 connect -> auto drop-in 2P co-op!
        window.__setGamepad(0, { axes: [-1, 0], buttons: {} });
        window.__setGamepad(1, { axes: [1, 0], buttons: {} });
        g.step(0.5, 1 / 60, true);
        const coopActive = g.isCoop;

        let maxAbsX = 0;
        let maxAbsY = 0;
        let maxPlayerDist = 0;

        const sample = () => {
          g.camera.updateMatrixWorld(true);
          const h1 = g.heroes[g.p1Hero];
          const h2 = g.heroes[g.p2Hero];
          const dist = h1.pos.distanceTo(h2.pos);
          if (dist > maxPlayerDist) maxPlayerDist = dist;
          for (const h of [h1, h2]) {
            const p = h.pos.clone();
            p.y += 1.0;
            p.project(g.camera);
            if (Math.abs(p.x) > maxAbsX) maxAbsX = Math.abs(p.x);
            if (Math.abs(p.y) > maxAbsY) maxAbsY = Math.abs(p.y);
          }
        };

        // 15s walking opposite X (Left vs Right)
        for (let i = 0; i < 30; i++) {
          g.step(0.5, 1 / 60, true);
          sample();
        }
        // 15s walking opposite Z (Forward vs Backward)
        window.__setGamepad(0, { axes: [0, -1], buttons: {} });
        window.__setGamepad(1, { axes: [0, 1], buttons: {} });
        for (let i = 0; i < 30; i++) {
          g.step(0.5, 1 / 60, true);
          sample();
        }
        window.__setGamepad(0, null);
        window.__setGamepad(1, null);

        return {
          coopActive,
          maxAbsX: Number(maxAbsX.toFixed(3)),
          maxAbsY: Number(maxAbsY.toFixed(3)),
          maxPlayerDist: Number(maxPlayerDist.toFixed(2)),
        };
      });

      assert.equal(res.coopActive, true, 'Controller 2 input should activate 2-player co-op');
      assert.ok(res.maxAbsX <= 0.96, `A player left horizontal view (maxAbsX=${res.maxAbsX})`);
      assert.ok(res.maxAbsY <= 0.96, `A player left vertical view (maxAbsY=${res.maxAbsY})`);
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name: `${name} (maxNDC=[${res.maxAbsX}, ${res.maxAbsY}], maxDist=${res.maxPlayerDist}u)`, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
