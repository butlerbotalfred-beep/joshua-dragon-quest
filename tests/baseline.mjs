import { startStaticServer, launchBrowser, openGame } from './harness.mjs';

async function measureBaseline() {
  const server = await startStaticServer();
  const browser = await launchBrowser();
  try {
    // 1. First-load size (waiting for all assets to load)
    const s1 = await openGame(browser, server.baseUrl, { waitForAssets: true });
    const firstLoadBytes = s1.getLocalBytes();
    const firstLoadMB = (firstLoadBytes / (1024 * 1024)).toFixed(2);
    const localReqs = s1.requests.filter((r) => r.local);
    console.log(`FIRST_LOAD_MB=${firstLoadMB} (${localReqs.length} local files)`);

    // 2. Memory counts after 1 level load vs 11 level loads
    await s1.page.evaluate(() => {
      window.game.startLevel(0, false);
      window.game.step(0.1, 1 / 60, true);
    });
    const mem1 = await s1.page.evaluate(() => ({
      geometries: window.game.renderer.info.memory.geometries,
      textures: window.game.renderer.info.memory.textures,
      programs: window.game.renderer.info.programs?.length || 0,
    }));

    for (let i = 1; i < 11; i++) {
      await s1.page.evaluate((lvl) => {
        window.game.startLevel(lvl % 6, false);
        window.game.step(0.1, 1 / 60, true);
      }, i);
    }
    const mem11 = await s1.page.evaluate(() => ({
      geometries: window.game.renderer.info.memory.geometries,
      textures: window.game.renderer.info.memory.textures,
      programs: window.game.renderer.info.programs?.length || 0,
    }));
    console.log('MEM_AFTER_1_LOAD=', JSON.stringify(mem1));
    console.log('MEM_AFTER_11_LOADS=', JSON.stringify(mem11));
    await s1.close();

    // 3. Time to beat each guardian (bonded heroes, spamming primary attack)
    const s2 = await openGame(browser, server.baseUrl, { waitForAssets: false });
    const bossTimes = [];
    for (let lvl = 0; lvl < 6; lvl++) {
      for (let heroIdx = 0; heroIdx < 4; heroIdx++) {
        const res = await s2.page.evaluate(({ lvl, heroIdx }) => {
          const g = window.game;
          g.bondedDragons = [true, true, true, true];
          g.startLevel(lvl, false);
          g.p1Hero = heroIdx;
          const hero = g.heroes[heroIdx];
          // Move hero right next to boss
          hero.pos.set(g.boss.pos.x, g.boss.pos.y, g.boss.pos.z + 3.0);
          g.step(0.1, 1 / 60, false);
          let elapsed = 0;
          const dt = 1 / 60;
          while (!g.boss.dead && elapsed < 120) {
            // Keep hero near boss and spam primary attack
            hero.pos.set(g.boss.pos.x, g.boss.pos.y, g.boss.pos.z + 2.8);
            hero.hp = hero.maxHp;
            hero.downed = false;
            g.heroPrimaryAbility(hero);
            g.step(dt, dt, false);
            elapsed += dt;
          }
          return {
            level: lvl + 1,
            boss: g.boss.name,
            hero: hero.def.id,
            seconds: Number(elapsed.toFixed(2)),
            dead: g.boss.dead,
          };
        }, { lvl, heroIdx });
        bossTimes.push(res);
      }
    }
    console.log('BOSS_TIMES=', JSON.stringify(bossTimes, null, 2));
    await s2.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

measureBaseline();
