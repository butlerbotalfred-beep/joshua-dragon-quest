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

  return results;
}
