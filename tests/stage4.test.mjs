import assert from 'node:assert/strict';
import { openGame } from './harness.mjs';

export async function runStage4Tests(browser, baseUrl) {
  const results = [];

  // Milestone 4.1: Prologue plays all 9 story-draft lines, Keeper steps out & grants gifts, Level 1 begins with all 4 gifts working
  {
    const name = '4.1: Watching prologue plays all 9 lines, Keeper grants gifts, and Level 1 starts with all 4 gifts working';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const res = await page.evaluate(async () => {
        const g = window.game;
        await g.dialogue.load();
        g.startPrologueCutscene();

        // Watch prologue all the way to the end (42s)
        g.step(42.5, 1 / 30, false);

        const playedIds = g.dialogue.playedHistory.map((p) => p.id);
        const modeAfterPrologue = g.mode;
        const levelAfterPrologue = g.currentLevelIdx;
        const giftsGranted = g.giftsGranted;

        // Verify all 4 gifts work in Level 1 (Joshua speed, Daniel fire, Vanessa ice, Michael strength)
        const giftChecks = {};
        for (let hi = 0; hi < 4; hi++) {
          g.p1Hero = hi;
          const h = g.heroes[hi];
          g.magic = g.maxMagic;
          h.attackCd = 0;
          g.heroPrimaryAbility(h);
          giftChecks[h.def.id] = h.attackCd > 0;
        }

        return {
          playedIds,
          modeAfterPrologue,
          levelAfterPrologue,
          giftsGranted,
          giftChecks,
        };
      });

      const expectedPrologueLines = [
        'prologue_joshua_stars',
        'prologue_dragon_eggs',
        'prologue_keeper_intro_1',
        'prologue_keeper_intro_2',
        'prologue_keeper_intro_3',
        'prologue_daniel_teacher',
        'prologue_keeper_gifts',
        'prologue_keeper_task',
        'prologue_michael_start',
      ];
      for (const id of expectedPrologueLines) {
        assert.ok(res.playedIds.includes(id), `Prologue missed line ${id}`);
      }
      assert.equal(res.giftsGranted, true, 'Keeper must grant the four gifts');
      assert.equal(res.modeAfterPrologue, 'playing', 'Level 1 should begin after prologue');
      assert.equal(res.levelAfterPrologue, 0, 'Should be on Level 1 (index 0)');
      assert.deepEqual(res.giftChecks, { joshua: true, daniel: true, vanessa: true, michael: true }, 'All 4 gifts must work in Level 1');
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  // Milestone 4.2: Keeper updates spoken as news from Renee, and Renee meets the family at Level 6 castle door
  {
    const name = '4.2: Renee news updates play at Level 1 reunion & Level 3 golem, and Renee greets family at Level 6 door';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;
      const res = await page.evaluate(async () => {
        const g = window.game;
        await g.dialogue.load();

        // 1. Level 1: Free Bear -> meet Keeper -> l1_keeper_reunion ("Renee sends word from the castle...")
        g.dialogue.playedHistory = [];
        g.startLevel(0, false);
        g.boss.hp = 1;
        g.damageBoss(10, 'wind', true);
        g.heroes[0].pos.copy(g.keeperObj.pos);
        g.step(0.1, 1 / 60, false);
        const l1Played = g.dialogue.playedHistory.map((p) => p.id);

        // 2. Level 3: Enter & free Ember Golem -> l3_keeper_golem_freed ("Renee tells me the dragon knows...")
        g.dialogue.playedHistory = [];
        g.startLevel(2, false);
        g.boss.hp = 1;
        g.damageBoss(10, 'ice', true);
        g.step(0.1, 1 / 60, false);
        const l3Played = g.dialogue.playedHistory.map((p) => p.id);

        // 3. Level 6: Renee is present at the castle door and greets the family!
        g.dialogue.playedHistory = [];
        g.bondedDragons = [true, true, true, true];
        g.startLevel(5, false);
        g.step(0.1, 1 / 60, false);
        const l6Played = g.dialogue.playedHistory.map((p) => p.id);
        const reneePresent = !!g.reneeObj && !!g.reneeObj.mesh;

        return { l1Played, l3Played, l6Played, reneePresent };
      });

      assert.ok(res.l1Played.includes('l1_keeper_bear_freed'), `Level 1 missing bear freed line: ${res.l1Played}`);
      assert.ok(res.l1Played.includes('l1_keeper_reunion'), `Level 1 missing Renee news reunion line: ${res.l1Played}`);
      assert.ok(res.l3Played.includes('l3_daniel_hot'), `Level 3 missing Daniel line: ${res.l3Played}`);
      assert.ok(res.l3Played.includes('l3_keeper_golem_freed'), `Level 3 missing Renee news golem line: ${res.l3Played}`);
      assert.equal(res.reneePresent, true, 'Renee must appear at the castle door in Level 6');
      assert.ok(res.l6Played.includes('l6_renee_welcome'), `Level 6 missing Renee greeting: ${res.l6Played}`);
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name, pass: true });
    } finally {
      await session.close();
    }
  }

  // Milestone 4.3: Festival ending plays in story-draft order & lantern pairs match gold berries found (3 -> 6 lanterns, 18 -> 36 lanterns)
  {
    const name = '4.3: Festival ending plays in story order (permanent gifts, embrace, dragon stays, narrator) & lanterns match gold berries (3->6, 18->36)';
    const session = await openGame(browser, baseUrl, { waitForAssets: false });
    try {
      const { page } = session;

      const runWithBerries = async (berryCount) => {
        return page.evaluate(async (count) => {
          const g = window.game;
          await g.dialogue.load();
          g.resetSave();
          g.bondedDragons = [true, true, true, true];
          const ids = [];
          for (let i = 1; i <= count; i++) ids.push(`g_${i}`);
          g.collectedGoldIds = new Set(ids);
          g.inventory.gold = count;

          g.startLevel(5, false); // Level 6
          g.dialogue.playedHistory = [];
          // Complete Level 6 encounter -> triggers dragon conversation -> Festival ending!
          g.boss.hp = 1;
          g.damageBoss(10, 'titan', true);
          // Watch Level 6 dragon conversation (44s) -> enters Festival ending
          g.step(44.0, 1 / 30, false);
          // Watch Festival ending to completion (45s)
          g.step(45.0, 1 / 30, false);

          const playedIds = g.dialogue.playedHistory.map((p) => p.id);
          return {
            playedIds,
            lanternCount: g.festivalLanterns.length,
            lanternPairs: g.festivalLanterns.length / 2,
            giftsPermanent: g.giftsPermanent,
            festivalEmbraced: g.festivalEmbraced,
            festivalDragonStayed: g.festivalDragonStayed,
            modeAfter: g.mode,
          };
        }, berryCount);
      };

      const run3 = await runWithBerries(3);
      assert.equal(run3.lanternCount, 6, `With 3 gold berries expected 6 lanterns (3 pairs), got ${run3.lanternCount}`);
      assert.equal(run3.giftsPermanent, true, 'Keeper must make gifts permanent');
      assert.equal(run3.festivalEmbraced, true, 'Renee and Keeper must reunite and embrace');
      assert.equal(run3.festivalDragonStayed, true, 'Great Black Dragon must stay for the festival');
      assert.equal(run3.modeAfter, 'festival', 'Ending should transition into playable festival courtyard');

      // Verify exact story-draft sequence order for both Level 6 conversation and Festival ending!
      const expectedOrder = [
        'l6_dragon_my_dragons',
        'l6_joshua_friends',
        'l6_keeper_not_afraid',
        'l6_dragon_wanted_family',
        'l6_vanessa_kindness_1',
        'l6_dragon_no_one',
        'l6_vanessa_kindness_2',
        'fest_keeper_worthy',
        'fest_daniel_stay',
        'fest_keeper_ask',
        'fest_renee_home',
        'fest_keeper_missed',
        'fest_dragon_nice',
        'fest_narrator_close',
      ];
      let prevPos = -1;
      for (const id of expectedOrder) {
        const pos = run3.playedIds.indexOf(id);
        assert.ok(pos > prevPos, `Line ${id} missing or out of order in [${run3.playedIds.join(', ')}]`);
        prevPos = pos;
      }

      const run18 = await runWithBerries(18);
      assert.equal(run18.lanternCount, 36, `With 18 gold berries expected 36 lanterns (18 pairs), got ${run18.lanternCount}`);
      assert.equal(session.getErrors().length, 0, `Errors: ${session.getErrors().join('; ')}`);
      results.push({ name: `${name} (3->${run3.lanternCount}, 18->${run18.lanternCount})`, pass: true });
    } finally {
      await session.close();
    }
  }

  return results;
}
