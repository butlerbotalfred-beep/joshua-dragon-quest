// Milestone 0.3: measure the prototype's starting numbers.
// Run once against the prototype (commit of milestone 0.2). Kept for the record;
// it reads prototype internals and is not part of `npm test`.
const { openGame } = require('../harness/browser');

(async () => {
  const g = await openGame();
  const { page, server } = g;
  await page.waitForFunction(() => window.game && window.game.assetsReady, null, { timeout: 180000 });
  await page.evaluate(() => window.game.assetsReady);
  await page.waitForTimeout(500);
  const glb = server.log.filter((e) => e.url.endsWith('.glb'));
  console.log('FIRST LOAD: total bytes', server.totalBytes(), '=', (server.totalBytes() / 1048576).toFixed(1), 'MB;',
    'model files', glb.length, '=', (glb.reduce((s, e) => s + e.bytes, 0) / 1048576).toFixed(1), 'MB');

  // Guardian fights: each hero stands beside the boss and presses attack as
  // fast as the cooldown allows. Time runs from activation to defeat.
  const fights = await page.evaluate(() => {
    const game = window.game;
    const out = [];
    for (let lvl = 0; lvl < 6; lvl++) {
      for (let hero = 0; hero < 4; hero++) {
        for (const bonded of [false, true]) {
          game.bondedDragons = [bonded, bonded, bonded, bonded];
          game.startLevel(lvl, false);
          game.mode = 'playing';
          game.swapHero(1, hero, true);
          const b = game.boss;
          const h = game.heroes[hero];
          h.pos.set(b.pos.x, b.pos.y, b.pos.z + 4.5);
          game.heroes.forEach((o) => { if (o !== h) o.pos.set(b.pos.x + 2, b.pos.y, b.pos.z + 7); });
          let t = 0, attacks = 0;
          const dt = 1 / 60;
          let lastTimer = b.attackTimer;
          while (!b.dead && t < 120) {
            game.heroPrimaryAbility(h);
            game.advance(dt, dt);
            if (b.attackTimer > lastTimer) attacks++;
            lastTimer = b.attackTimer;
            t += dt;
            if (game.mode !== 'playing') break;
          }
          out.push({ level: lvl + 1, boss: b.type, hero: h.def.id, bonded, seconds: +t.toFixed(2), bossAttacks: attacks, dead: b.dead, mode: game.mode });
        }
      }
    }
    return out;
  });
  for (const f of fights) console.log('FIGHT', JSON.stringify(f));
  const byBoss = {};
  for (const f of fights) { (byBoss[f.boss] = byBoss[f.boss] || []).push(f.seconds); }
  for (const [k, v] of Object.entries(byBoss)) console.log('FIGHT RANGE', k, Math.min(...v), 'to', Math.max(...v));

  // Memory: counts after the first level load and after 11 loads.
  await page.reload();
  await page.waitForFunction(() => window.game && window.game.assetsReady, null, { timeout: 180000 });
  await page.evaluate(() => window.game.assetsReady);
  const mem = await page.evaluate(async () => {
    const game = window.game;
    const snap = () => ({
      geometries: game.renderer.info.memory.geometries,
      textures: game.renderer.info.memory.textures,
      programs: game.renderer.info.programs.length,
    });
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const out = [];
    for (let i = 0; i < 11; i++) {
      game.startLevel(i % 6, false);
      game.advance(0.5);
      await frame();
      out.push(snap());
    }
    return out;
  });
  console.log('MEMORY after load 1', JSON.stringify(mem[0]));
  console.log('MEMORY after load 11', JSON.stringify(mem[10]));
  console.log('ERRORS', JSON.stringify(g.errors));
  await g.close();
})().catch((e) => { console.error(e); process.exit(1); });
