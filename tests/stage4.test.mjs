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

  return results;
}
