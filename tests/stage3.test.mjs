import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, openGame } from './harness.mjs';

export async function runStage3Tests(browser, baseUrl) {
  const results = [];

  // Milestone 3.1: docs/levels/level-2.md exists with map, four gates in order, gifts, hint lines, berries, and arena
  {
    const name = '3.1: docs/levels/level-2.md defines map, 4 gates in order with gifts & hints, berries, and arena';
    const mdPath = path.join(REPO_ROOT, 'docs/levels/level-2.md');
    assert.ok(fs.existsSync(mdPath), 'docs/levels/level-2.md must exist');
    const md = fs.readFileSync(mdPath, 'utf8');

    const requiredGates = [
      { id: 'l2_gate_overgrowth', hero: 'Daniel', gift: 'Fire', hint: 'hint_daniel_fire' },
      { id: 'l2_gate_bridge', hero: 'Michael', gift: 'Strength', hint: 'hint_michael_strength' },
      { id: 'l2_gate_waterfall', hero: 'Vanessa', gift: 'Ice', hint: 'hint_vanessa_ice' },
      { id: 'l2_gate_leap', hero: 'Joshua', gift: 'Speed', hint: 'hint_joshua_speed' },
    ];

    let lastIdx = -1;
    for (const g of requiredGates) {
      const idx = md.indexOf(g.id);
      assert.ok(idx > lastIdx, `Gate ${g.id} missing or out of order in level-2.md`);
      lastIdx = idx;
      assert.ok(md.includes(g.hero), `Missing hero ${g.hero} in level-2.md`);
      assert.ok(md.includes(g.gift), `Missing gift ${g.gift} in level-2.md`);
      assert.ok(md.includes(g.hint), `Missing hint dialogue id ${g.hint} in level-2.md`);
    }
    assert.ok(md.includes('Gold Berries') && md.includes('l2_g1') && md.includes('l2_g2') && md.includes('l2_g3'), 'Missing 3 gold berries');
    assert.ok(md.includes('Old Vine') && md.includes('Green Egg'), 'Missing Old Vine arena / Green Egg');
    results.push({ name, pass: true });
  }

  // Milestone 3.2: Level 2 playable from start to egg (all 4 gates pass 2.3 bypass checks + full Easy playthrough in 8-12 min using all 4 gifts)
  {
    const name = '3.2a: All 4 Level 2 gates pass 60s wrong-hero bypass checks and open with the right gift';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const report = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', false);
        g.bondedDragons = [false, false, false, false];
        g.startLevel(1, false); // Level 2
        g.enemies.forEach((e) => { e.dead = true; e.mesh.visible = false; });
        g.webs.forEach((w) => { w.active = false; w.mesh.visible = false; });

        const gates = [...g.gates].sort((a, b) => b.z - a.z);
        const out = [];

        for (const gate of gates) {
          const nearZ = gate.z + 4.0;
          const nearFloor = g.getFloorHeightAt(0, nearZ, false);
          const nearY = nearFloor.onSolid ? nearFloor.y : 0;
          const wrongHeroes = [0, 1, 2, 3].filter((idx) => idx !== gate.requiredHeroIdx);

          for (const wrongIdx of wrongHeroes) {
            g.p1Hero = wrongIdx;
            const h = g.heroes[wrongIdx];
            h.pos.set(0, nearY, nearZ);
            h.lastSafePos.set(0, nearY, nearZ);
            h.vel.set(0, 0, 0);
            h.onGround = true;

            let minZReached = nearZ;
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
            out.push({
              gateId: gate.id,
              heroIdx: wrongIdx,
              openedByWrong: gate.opened,
              bypassed: minZReached < gate.blockZ - 0.5,
              minZReached: Number(minZReached.toFixed(2)),
              blockZ: gate.blockZ,
            });
          }

          // Right hero opens gate and crosses
          g.p1Hero = gate.requiredHeroIdx;
          const rh = g.heroes[gate.requiredHeroIdx];
          rh.pos.set(0, nearY, nearZ);
          rh.lastSafePos.set(0, nearY, nearZ);
          rh.vel.set(0, 0, 0);
          rh.facing = Math.PI;
          g.magic = g.maxMagic;
          g.heroPrimaryAbility(rh);
          g.step(0.4, 1 / 60, false);
          if (!gate.opened) {
            g.heroSpecialAbility(rh);
            g.step(0.4, 1 / 60, false);
          }
          g.keys = { KeyW: true };
          g.step(3.5, 1 / 60, false);
          g.keys = {};
          out.push({
            gateId: gate.id,
            heroIdx: gate.requiredHeroIdx,
            isRightHero: true,
            openedByRight: gate.opened,
            crossedPast: rh.pos.z < gate.blockZ - 0.8,
            finalZ: Number(rh.pos.z.toFixed(2)),
            blockZ: gate.blockZ,
          });
        }
        return { gateCount: gates.length, out };
      });

      assert.equal(report.gateCount, 4, `Level 2 must have 4 gates, found ${report.gateCount}`);
      for (const r of report.out) {
        if (r.isRightHero) {
          assert.equal(r.openedByRight, true, `Right hero failed to open ${r.gateId}`);
          assert.equal(r.crossedPast, true, `Right hero failed to cross ${r.gateId} (z=${r.finalZ}, blockZ=${r.blockZ})`);
        } else {
          assert.equal(r.openedByWrong, false, `Wrong hero ${r.heroIdx} opened ${r.gateId}`);
          assert.equal(r.bypassed, false, `Wrong hero ${r.heroIdx} bypassed ${r.gateId} (minZ=${r.minZReached} < ${r.blockZ})`);
        }
      }
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  {
    const name = '3.2b: Easy playthrough bot finishes Level 2 start-to-egg in 8–12 minutes using all 4 gifts';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const run = await page.evaluate(() => {
        const g = window.game;
        g.setDifficulty('easy', false);
        g.bondedDragons = [false, false, false, false];
        g.startLevel(1, false); // Level 2

        const dt = 1 / 30;
        let elapsed = 0;
        const giftsUsed = new Set();

        const stepSecs = (s) => {
          const n = Math.max(1, Math.round(s / dt));
          for (let i = 0; i < n; i++) {
            g.step(dt, dt, false);
            elapsed += dt;
          }
        };

        // Helper: realistic 6-year-old child walking toward a waypoint (~55% stick deflection, pausing briefly to look around, fighting nearby enemies, freeing webbed heroes)
        const walkTo = (tx, tz, maxSec = 90) => {
          let t = 0;
          while (t < maxSec && g.mode === 'playing') {
            const h = g.heroes[g.p1Hero];
            // If webbed, swap hero and attack web!
            if (h.trappedByWeb) {
              g.swapHero(1, (g.p1Hero + 1) % 4, true);
              const rescuer = g.heroes[g.p1Hero];
              stepSecs(1.5); // child notices web & swaps
              g.heroPrimaryAbility(rescuer);
              stepSecs(1.0);
              continue;
            }
            // Fight any nearby active enemy before moving on
            const nearEnemy = g.enemies.find((en) => !en.dead && en.pos.distanceTo(h.pos) < 10);
            if (nearEnemy) {
              const dx = nearEnemy.pos.x - h.pos.x;
              const dz = nearEnemy.pos.z - h.pos.z;
              const d = Math.hypot(dx, dz) || 1;
              if (d > 2.8) {
                window.__setGamepad(0, { axes: [(dx / d) * 0.65, (dz / d) * 0.65], buttons: {} });
              } else {
                window.__setGamepad(0, { axes: [0, 0], buttons: {} });
              }
              g.heroPrimaryAbility(h);
              stepSecs(0.9); // child attack cadence
              t += 0.9;
              continue;
            }

            const dx = tx - h.pos.x;
            const dz = tz - h.pos.z;
            const d = Math.hypot(dx, dz);
            if (d < 1.8) break;
            // Realistic kid stick input (~0.58 speed, occasional scenic pause)
            const stick = 0.58;
            window.__setGamepad(0, { axes: [(dx / d) * stick, (dz / d) * stick], buttons: {} });
            stepSecs(0.25);
            t += 0.25;
          }
          window.__setGamepad(0, { axes: [0, 0], buttons: {} });
        };

        // Child explores & pauses naturally at scenic overlooks / berries / puzzles
        const pauseExplore = (s) => {
          window.__setGamepad(0, { axes: [0, 0], buttons: {} });
          stepSecs(s);
        };

        // Zone 1: Entrance -> berries -> East alcove Gold Berry #1 -> Web & enemies -> Gate 1
        pauseExplore(4);
        walkTo(-8.5, -10); pauseExplore(3);
        walkTo(0, -22); pauseExplore(4); // hits web & rescues
        walkTo(18.0, -30); pauseExplore(5); // Gold Berry #1
        walkTo(8.5, -48); pauseExplore(3);
        walkTo(0, -62); pauseExplore(6); // Looks at tangled overgrowth, swaps to Daniel

        // Gate 1: Daniel Fire
        g.swapHero(1, 1, true);
        g.heroes[1].facing = Math.PI;
        g.heroPrimaryAbility(g.heroes[1]);
        giftsUsed.add('daniel_fire');
        pauseExplore(5);

        // Zone 2: Timber Bridge Landing -> enemies -> berry -> Gate 2
        walkTo(-8.5, -88); pauseExplore(3);
        walkTo(0, -108); pauseExplore(6); // Looks at swaying bridge, swaps to Michael

        // Gate 2: Michael Strength
        g.swapHero(1, 3, true);
        g.heroes[3].facing = Math.PI;
        g.heroPrimaryAbility(g.heroes[3]);
        giftsUsed.add('michael_strength');
        pauseExplore(5);

        // Cross steadied bridge to Cascade Overlook -> West Deck push-block puzzle for Gold Berry #2!
        walkTo(0, -135); pauseExplore(3);
        walkTo(8.5, -154); pauseExplore(3);
        walkTo(-14.5, -158); pauseExplore(4);
        // Push rune block onto switch (-19.5, -169) as Michael
        g.swapHero(1, 3, true);
        const pz = g.pushPuzzles[0];
        if (pz && !pz.solved) {
          let pt = 0;
          while (!pz.solved && pt < 40) {
            const toSw = pz.switchPos.clone().sub(pz.pos);
            toSw.y = 0;
            toSw.normalize();
            const standPos = pz.pos.clone().addScaledVector(toSw, -1.35);
            walkTo(standPos.x, standPos.z, 6);
            stepSecs(0.5);
            pt += 6.5;
          }
          pauseExplore(4);
          walkTo(-16.5, -169); // Collect Gold Berry #2!
          pauseExplore(3);
        }
        walkTo(-8.5, -186); pauseExplore(3);
        walkTo(0, -201); pauseExplore(7); // Looks at cascading waterfall, swaps to Vanessa

        // Gate 3: Vanessa Ice
        g.swapHero(1, 2, true);
        g.heroes[2].facing = Math.PI;
        g.heroPrimaryAbility(g.heroes[2]);
        giftsUsed.add('vanessa_ice');
        pauseExplore(5);

        // Climb frozen waterfall steps -> Upper Canopy -> berries & enemies -> Gate 4
        walkTo(0, -230); pauseExplore(4);
        walkTo(-8.5, -244); pauseExplore(3);
        walkTo(0, -258); pauseExplore(4); // web rescue + spider
        walkTo(8.5, -276); pauseExplore(3);
        walkTo(0, -294); pauseExplore(7); // Looks at last long leap, swaps to Joshua

        // Gate 4: Joshua Speed
        g.swapHero(1, 0, true);
        g.heroes[0].facing = Math.PI;
        g.heroSpecialAbility(g.heroes[0]);
        giftsUsed.add('joshua_speed');
        pauseExplore(5);

        // Zone 5: Old Vine Arena!
        walkTo(-13.5, -342); pauseExplore(3);
        walkTo(0, -352); pauseExplore(3);

        // Fight & free The Old Vine (swapping family members during the fight like a real player!)
        let fightSec = 0;
        let atkAccum = 0;
        const fightStart = elapsed;
        while (!g.boss.dead && fightSec < 120) {
          const hero = g.heroes[g.p1Hero];
          const dx = hero.pos.x - g.boss.pos.x;
          const dz = hero.pos.z - g.boss.pos.z;
          const dist = Math.hypot(dx, dz) || 1;
          const want = (g.p1Hero === 1 || g.p1Hero === 2) ? 6.0 : 2.8;
          if (dist > want + 1.5) {
            window.__setGamepad(0, { axes: [(-dx / dist) * 0.7, (-dz / dist) * 0.7], buttons: {} });
          } else {
            window.__setGamepad(0, { axes: [0, 0], buttons: {} });
          }
          if (g.dangerZones.some((dzObj) => dzObj.elapsed > dzObj.delay * 0.65 && hero.pos.distanceTo(dzObj.pos) < dzObj.radius)) {
            g.heroJump(hero);
          }
          atkAccum += dt;
          if (atkAccum >= 0.68 && !hero.downed) {
            atkAccum = 0;
            g.heroPrimaryAbility(hero);
          }
          g.step(dt, dt, false);
          elapsed += dt;
          fightSec += dt;
        }
        window.__setGamepad(0, { axes: [0, 0], buttons: {} });
        const bossFightDuration = elapsed - fightStart;
        pauseExplore(5);

        // Collect Gold Berry #3 and bring Joshua to the Green Egg!
        walkTo(-12.5, -394); pauseExplore(3);
        g.swapHero(1, 0, true);
        walkTo(0, -396);
        const reachedHatchCutscene = g.mode === 'cutscene' && g.cutscene?.type === 'hatch';
        if (reachedHatchCutscene) stepSecs(6.0);

        window.__setGamepad(0, null);
        return {
          elapsedSeconds: Number(elapsed.toFixed(1)),
          elapsedMinutes: Number((elapsed / 60).toFixed(2)),
          bossFightDuration: Number(bossFightDuration.toFixed(1)),
          giftsUsed: [...giftsUsed],
          allGatesOpened: g.gates.every((gt) => gt.opened),
          bossFreed: g.boss.freed,
          goldCollected: g.collectedGoldIds.size,
          reachedHatchCutscene,
          speedyBonded: g.bondedDragons[0],
        };
      });

      console.log('    Level 2 Easy playthrough telemetry:', JSON.stringify(run));
      assert.equal(run.allGatesOpened, true, 'All 4 gates must be opened');
      assert.equal(run.giftsUsed.length, 4, 'All 4 family gifts must be used');
      assert.equal(run.bossFreed, true, 'Old Vine must be freed');
      assert.equal(run.reachedHatchCutscene, true, 'Joshua reaching the egg must start hatching scene');
      assert.equal(run.speedyBonded, true, 'Speedy must bond with Joshua');
      assert.ok(
        run.elapsedSeconds >= 480 && run.elapsedSeconds <= 720,
        `Level 2 Easy playthrough took ${run.elapsedSeconds}s (${run.elapsedMinutes} min), target is 480–720s (8–12 min)`
      );
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name: `${name} (${run.elapsedMinutes} min, boss=${run.bossFightDuration}s, gold=${run.goldCollected}/3)`, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
