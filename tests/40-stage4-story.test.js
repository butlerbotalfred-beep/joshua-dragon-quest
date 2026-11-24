// Stage 4: the story around the levels.
//
//   4.1 The prologue: berries, the dragon, the eggs, the Keeper in person, the
//       four gifts, the first task. Then Level 1 begins with all four gifts working.
//   4.2 Renee's news: each update line in the story draft plays at its place,
//       and Renee meets the family at the castle door in Level 6.
//   4.3 The festival: the ending in the story draft's order, with one pair of
//       lanterns for every gold berry found.
//
// Levels 1, 3 and 6 are built in Stage 5. Until each exists, a practice level
// stands in for it here, so these checks never go quiet, and each check says
// when it used one. The same checks run on the real levels once they exist.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { openReady } = require('./harness/kit');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const data = JSON.parse(read('data/dialogue.json'));
const idOf = (speaker, text) => { const l = data.lines.find((q) => q.text === text && q.speaker === speaker); return l ? l.id : null; };
const SPEAKERS = ['keeper', 'renee', 'narrator', 'joshua', 'daniel', 'vanessa', 'michael'];
const speakerOf = (label) => {
  const l = label.toLowerCase();
  if (l.startsWith('great black dragon')) return 'dragon';
  return SPEAKERS.find((k) => l.startsWith(k)) || null;
};

// The spoken lines under one heading of the story draft, in order: [{ label, speaker, text, id }].
function storySection(heading) {
  const rows = read('docs/STORY.md').split('\n');
  const start = rows.findIndex((r) => r.startsWith('### ' + heading));
  assert.ok(start >= 0, `the story draft has no section "${heading}"`);
  const out = [];
  for (let i = start + 1; i < rows.length && !rows[i].startsWith('#'); i++) {
    const m = rows[i].match(/^- \*\*([^*]+?):\*\* "(.+?)"(?: .*)?$/);
    if (!m) continue;
    const speaker = speakerOf(m[1]);
    if (!speaker) continue;
    out.push({ label: m[1], speaker, text: m[2], id: idOf(speaker, m[2]) });
  }
  return out;
}

// Must appear in this order (other things may come between).
function assertOrder(heard, order, what) {
  let at = -1;
  for (const o of order) {
    const i = heard.indexOf(o, at + 1);
    assert.ok(i > at, `${what}: "${o}" did not happen, or happened out of order.\n${heard.join(' | ')}`);
    at = i;
  }
}

// ---------------------------------------------------------------------------------------------
// 4.1 The prologue
// ---------------------------------------------------------------------------------------------

test('4.1 the bot watches the prologue to the end and Level 1 begins with all four gifts working', async () => {
  const story = storySection('Prologue');
  assert.strictEqual(story.length, 9, 'the story draft\'s prologue no longer has nine spoken lines');
  for (const s of story) assert.ok(s.id, `not in data/dialogue.json: ${s.speaker}: "${s.text}"`);
  const g = await openReady();
  try {
    const r = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const standIn = K.standIn(1, K.YARD_PLAY);
      const heard = [];
      const sfx = game.audio.sfx.bind(game.audio), music = game.audio.playMusic.bind(game.audio);
      game.audio.sfx = (name, v) => { heard.push('sfx:' + name); return sfx(name, v); };
      game.audio.playMusic = (track, o) => { if (heard[heard.length - 1] !== 'music:' + track) heard.push('music:' + track); return music(track, o); };
      const fresh = { prologueSeen: game.save.prologueSeen, setupDone: game.save.setupDone };
      // A new game, by controller: Play, a difficulty, one player, a hero.
      K.tap(K.BUTTON.A); K.tap(K.BUTTON.A); K.tap(K.BUTTON.A); K.tap(K.BUTTON.A);
      await K.loaded();
      const at = { level: game.level && game.level.number, state: game.state, hud: !game.ui.hud.classList.contains('hidden'), scene: game.scene && game.scene.name };
      const w = game.world, v = game.view;
      let said = 0, mostWords = 0, mostAt = '';
      const seen = { bushesBeforeDragon: null, dragonFrom: null, dragonTo: null, castle: null, streaks: 0, keeperFrom: null, keeperTo: null, keeperWhenHello: null, gifts: [], giftsDuring: [], pressed: 0 };
      const idle = new K.Bot(w, { idle: true });
      const res = K.play(240, [idle], {
        until: () => (game.level && game.level.number !== at.level) || game.state === 'loading' || game.state === 'menu',
        each: () => {
          for (; said < game.dialogue.history.length; said++) heard.push('line:' + game.dialogue.history[said]);
          if (game.world === w) v.sync(w, 1 / 60);
          const words = game.words().length;
          if (words > mostWords) { mostWords = words; mostAt = game.words().join(' '); }
          const d = v.actors.dragon, k = v.actors.keeper;
          if (v.actors.castle && !seen.castle) seen.castle = { x: v.actors.castle.position.x, z: v.actors.castle.position.z };
          if (d) {
            if (!seen.dragonFrom) { seen.dragonFrom = { x: d.position.x, y: d.position.y, z: d.position.z }; seen.bushesBeforeDragon = w.bushes.filter((b) => b.taken).length; }
            seen.dragonTo = { x: d.position.x, y: d.position.y, z: d.position.z };
          }
          if (k) { if (!seen.keeperFrom) seen.keeperFrom = { x: k.position.x, z: k.position.z }; seen.keeperTo = { x: k.position.x, z: k.position.z }; }
          if (heard.includes('line:pro_keeper_hello') && !seen.keeperWhenHello) seen.keeperWhenHello = { x: k.position.x, z: k.position.z, family: w.heroes.map((h) => +Math.hypot(h.x - k.position.x, h.z - k.position.z).toFixed(1)) };
          seen.streaks = Math.max(seen.streaks, v.streakCount || 0);
          const given = game.log.filter((e) => e.gift !== undefined).map((e) => e.gift);
          while (seen.gifts.length < given.length) { seen.gifts.push(given[seen.gifts.length]); seen.giftsDuring.push(heard.filter((h) => h.startsWith('line:')).pop()); }
        },
      });
      await K.loaded();
      const lane = w.L.sections[0];
      const out = {
        standIn, fresh, at, heard, mostWords, mostAt, seen, seconds: +res.t.toFixed(1), laneHalf: (lane.x1 - lane.x0) / 2,
        after: { level: game.level && game.level.number, state: game.state, hud: !game.ui.hud.classList.contains('hidden'), prologueSeen: game.save.prologueSeen },
        stored: JSON.parse(localStorage.getItem(Object.keys(localStorage)[0])).prologueSeen,
      };
      // Level 1 has begun. Skip its own opening scene, if it has one, and try every gift.
      for (let i = 0; i < 5 && game.state === 'cutscene'; i++) K.tap(K.BUTTON.START);
      const w1 = game.world;
      const events = [];
      const emit = w1.emit.bind(w1);
      w1.emit = (type, d) => { if (type === 'gift') events.push({ hero: d.hero, gift: d.gift, byPlayer: w1.heroes[d.hero].control !== null }); emit(type, d); };
      out.gifts = [];
      for (let i = 0; i < 4; i++) {
        for (let k = 0; k < 6 && w1.playerHero(0).i !== i; k++) { K.tap(K.BUTTON.Y); game.advance(0.3); }
        const before = w1.stats.giftsUsed[i];
        K.tap(K.BUTTON.X, 0, 6); game.advance(1.2);
        const e = events.filter((q) => q.hero === i && q.byPlayer).pop();
        out.gifts.push({ hero: i, playing: w1.playerHero(0).i, used: w1.stats.giftsUsed[i] - before, gift: e ? e.gift : null });
      }
      out.playState = game.state;
      return out;
    });

    assert.deepStrictEqual(r.fresh, { prologueSeen: false, setupDone: false }, 'this was not a new game');
    assert.deepStrictEqual(r.at, { level: 0, state: 'cutscene', hud: false, scene: 'start' }, 'a new game did not open on the prologue');
    // Every line of the story draft's prologue, in its order, once each, and nothing else spoken.
    const spoken = r.heard.filter((h) => h.startsWith('line:')).map((h) => h.slice(5));
    assert.deepStrictEqual(spoken, story.map((s) => s.id));
    // What happens, in order: berries, the dragon lands, the eggs streak away, the Keeper, the gifts, the task.
    assertOrder(r.heard, ['music:prologue_festival_morning', 'sfx:berry', 'sfx:berry', 'sfx:berry', 'sfx:berry', 'sfx:roar', 'sfx:whoosh',
      'line:pro_joshua_stars', 'line:pro_dragon_eggs', 'line:pro_keeper_hello', 'line:pro_keeper_dragon', 'line:pro_keeper_renee',
      'line:pro_daniel_teacher', 'line:pro_keeper_gifts', 'line:pro_keeper_task', 'line:pro_michael_day'], 'prologue');
    const s = r.seen;
    assert.strictEqual(s.bushesBeforeDragon, 4, 'the family had not picked the berries when the dragon came');
    assert.ok(s.dragonFrom.y > s.dragonTo.y + 10, 'the dragon did not come down from the sky');
    assert.ok(Math.hypot(s.dragonTo.x - s.castle.x, s.dragonTo.z - s.castle.z) < 3 && s.dragonTo.y > 10, 'the dragon did not land on the castle');
    assert.strictEqual(s.streaks, 4, 'four eggs did not streak away');
    // The Keeper in person: out from beyond the edge of the path, to within a few steps of the family.
    assert.ok(Math.abs(s.keeperFrom.x) > r.laneHalf + 5, 'the Keeper did not start among the trees');
    assert.ok(Math.abs(s.keeperTo.x) < r.laneHalf - 3, 'the Keeper did not step out onto the path');
    assert.deepStrictEqual(s.keeperWhenHello && { x: s.keeperWhenHello.x, z: s.keeperWhenHello.z }, s.keeperTo, 'the Keeper spoke before he had stepped out');
    for (const d of s.keeperWhenHello.family) assert.ok(d < 14, `the Keeper spoke from ${d} away`);
    // The four gifts, one for each, given as the Keeper names them.
    assert.deepStrictEqual(s.gifts, [0, 1, 2, 3]);
    assert.deepStrictEqual(s.giftsDuring, Array(4).fill('line:pro_keeper_gifts'));
    assert.ok(r.mostWords <= 8, `${r.mostWords} words on screen at once: ${r.mostAt}`);
    assert.ok(r.seconds > 60 && r.seconds < 150, `the prologue took ${r.seconds}s`);
    // Then Level 1 begins, and it is remembered that the prologue has been seen.
    assert.strictEqual(r.after.level, 1);
    assert.ok(['play', 'cutscene'].includes(r.after.state), `Level 1 did not begin (${r.after.state})`);
    assert.ok(r.after.prologueSeen && r.stored, 'the prologue was not saved as seen');
    assert.ok(r.after.hud, 'the gifts are not on show in Level 1');
    const names = ['speed', 'fire', 'ice', 'strength'];
    r.gifts.forEach((q, i) => {
      assert.strictEqual(q.playing, i, `could not swap to hero ${i}`);
      assert.ok(q.used >= 1, `hero ${i}'s gift did nothing`);
      assert.strictEqual(q.gift, names[i]);
    });
    assert.strictEqual(r.playState, 'play');
    console.log(`4.1 prologue watched to the end in ${r.seconds}s; Level 1${r.standIn ? ' (a practice level standing in until Stage 5)' : ''} began with speed, fire, ice and strength all working`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

test('4.1 skipping the prologue at any moment still gives the four gifts and Level 1, and it plays only once', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      K.standIn(1, K.YARD_PLAY);
      const out = [];
      for (const after of [0.2, 3, 7.5, 12, 18, 26, 34, 47, 58, 65]) {
        game.save.prologueSeen = false; game.saveNow();
        await game.startLevel(0);
        await K.loaded();
        const start = { level: game.level.number, state: game.state };
        game.advance(after, 1 / 60);
        const before = { state: game.state, level: game.level.number, gifts: game.log.filter((e) => e.gift !== undefined).length };
        K.tap(K.BUTTON.START);
        const gifts = game.giftsGiven ? [...game.giftsGiven] : null;
        await K.loaded();
        out.push({ after, start, before, level: game.level && game.level.number, state: game.state, seen: game.save.prologueSeen, hud: !game.ui.hud.classList.contains('hidden') });
        game.toTitle();
      }
      // The next time Play is pressed, the game goes to the map, not the prologue.
      Object.assign(game.save, { setupDone: true });
      game.saveNow();
      game.toTitle();
      K.tap(K.BUTTON.A);
      await K.loaded();
      return { out, again: { screen: game.ui.screen, state: game.state, level: game.level && game.level.number } };
    });
    for (const r of rows.out) {
      assert.deepStrictEqual(r.start, { level: 0, state: 'cutscene' });
      assert.strictEqual(r.before.state, 'cutscene', `at ${r.after}s the prologue had already ended`);
      assert.strictEqual(r.level, 1, `skipped at ${r.after}s: Level 1 did not begin`);
      assert.ok(['play', 'cutscene'].includes(r.state));
      assert.ok(r.seen, `skipped at ${r.after}s: not saved as seen`);
      assert.ok(r.hud, `skipped at ${r.after}s: the gifts are not on show`);
    }
    assert.deepStrictEqual(rows.again, { screen: 'map', state: 'menu', level: null });
    console.log(`4.1 skipped at ${rows.out.map((r) => r.after + 's').join(', ')}: Level 1 began every time`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

// ---------------------------------------------------------------------------------------------
// 4.2 Renee's news
// ---------------------------------------------------------------------------------------------

test('4.2 the update lines in the story draft are exactly the ones the game gives as Renee\'s news', async () => {
  const { NEWS, BEATS } = await import('../src/story.js');
  // In the story draft, an update about the dragon is a Keeper line in a level that speaks of Renee.
  const found = [];
  const headings = read('docs/STORY.md').split('\n').filter((r) => /^### Level \d/.test(r)).map((r) => r.slice(4));
  assert.strictEqual(headings.length, 6);
  for (const h of headings) {
    const level = +h.match(/^Level (\d)/)[1];
    for (const s of storySection(h)) {
      if (s.speaker === 'keeper' && /\bRenee\b/.test(s.text)) found.push({ level, when: s.label.replace(/^Keeper,\s*/, ''), line: s.id, text: s.text });
    }
  }
  assert.strictEqual(found.length, 2, `the story draft has ${found.length} update lines, and this check knows two`);
  assert.deepStrictEqual(NEWS.map((n) => ({ level: n.level, when: n.when, line: n.line })), found.map((f) => ({ level: f.level, when: f.when, line: f.line })));
  for (const n of NEWS) {
    assert.ok(BEATS[n.level] && typeof BEATS[n.level][n.at] === 'function', `no beat for ${n.line}`);
    assert.ok(/Renee (sends word|tells me)/.test(found.find((f) => f.line === n.line).text), `${n.line} is not spoken as news from Renee`);
  }
  // "when they meet again" is the end of Level 1; "when the golem is freed" is the freeing in Level 3.
  assert.strictEqual(NEWS[0].at, 'exit');
  assert.strictEqual(NEWS[1].at, 'freed');
  // Renee at the castle door is the start of Level 6.
  assert.ok(/^Renee meets the family at the castle door and shows them the way down\./m.test(read('docs/STORY.md')));
  assert.strictEqual(typeof BEATS[6].start, 'function');
});

test('4.2 each update plays at its place, with the Keeper there in person', async () => {
  const g = await openReady();
  try {
    const r = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const used = { 1: K.standIn(1, K.yardFight('bear', 1)), 3: K.standIn(3, K.yardFight('magma', 3)) };
      const watch = (w) => {
        const list = [];
        const handle = game.handle.bind(game);
        game.handle = (e) => { if (['exit', 'guardianFreed', 'egg', 'fightStart'].includes(e.type)) list.push('event:' + e.type); handle(e); };
        return { list, restore: () => { game.handle = handle; } };
      };
      const run = (w, until, limit) => {
        const seen = { said: game.dialogue.history.length, heard: [], states: [], keeper: null, owl: null, owlFrom: null, words: 0, sceneAt: null };
        const bot = new K.Bot(w, { react: 0.3 });
        const ev = watch(w);
        K.play(limit, [bot], {
          until,
          each: () => {
            for (; ev.list.length; ) seen.heard.push(ev.list.shift());
            for (; seen.said < game.dialogue.history.length; seen.said++) {
              const id = game.dialogue.history[seen.said];
              seen.heard.push('line:' + id);
              if (/keeper_(news|freed)/.test(id)) {
                const k = game.view.actors.keeper, o = game.view.actors.owl, lead = w.leader();
                seen.keeper = k ? { shown: k.visible, away: +Math.hypot(k.position.x - lead.x, k.position.z - lead.z).toFixed(1) } : null;
                seen.owl = o ? { away: +Math.hypot(o.position.x - k.position.x, o.position.z - k.position.z).toFixed(1), up: +(o.position.y - k.position.y).toFixed(1) } : null;
                seen.sceneAt = { state: game.state, scene: game.scene && game.scene.name };
              }
            }
            if (game.state === 'cutscene') game.view.sync(w, 1 / 60);
            const o = game.view.actors.owl;
            if (o && !seen.owlFrom) seen.owlFrom = +(o.position.y).toFixed(1);
            seen.words = Math.max(seen.words, game.words().length);
          },
        });
        ev.restore();
        seen.news = game.log.filter((e) => e.news).map((e) => e.news);
        seen.owlGone = !game.view.actors.owl;
        seen.state = game.state;
        return seen;
      };

      // Level 1: the family meets the Keeper again at the end.
      await game.startLevel(1, { difficulty: 'easy', p1Hero: 0 });
      await K.loaded();
      for (let i = 0; i < 5 && game.state === 'cutscene'; i++) K.tap(K.BUTTON.START);
      let w = game.world;
      K.clearWayTo(w, w.L.exit.z);
      K.placeAt(w, w.L.exit.z + 14);
      game.log.length = 0;
      const one = run(w, () => game.state === 'complete', 120);

      // Level 3: the golem is freed.
      await game.startLevel(3, { difficulty: 'easy', p1Hero: 2 });
      await K.loaded();
      for (let i = 0; i < 5 && game.state === 'cutscene'; i++) K.tap(K.BUTTON.START);
      w = game.world;
      const A = w.L.arena;
      K.clearWayTo(w, A.z1 + 3);
      K.placeAt(w, A.z1 + 4);
      game.log.length = 0;
      const guardian = w.guardian.def.name;
      const three = run(w, () => w.guardian.state === 'freed' && game.state === 'play', 300);
      return { used, one, three, guardian };
    });
    // Level 1: the news comes at the meeting at the end, once, before the level is done.
    assert.strictEqual(r.one.state, 'complete');
    assert.deepStrictEqual(r.one.heard.filter((h) => h.endsWith('l1_keeper_news')), ['line:l1_keeper_news']);
    assertOrder(r.one.heard, ['event:exit', 'line:l1_keeper_news'], 'Level 1');
    assert.deepStrictEqual(r.one.sceneAt, { state: 'cutscene', scene: 'exit' });
    assert.ok(!r.one.heard.includes('line:l3_keeper_freed'));
    // Level 3: the news comes the moment the golem is freed.
    assert.strictEqual(r.guardian, 'Ember Golem');
    assert.deepStrictEqual(r.three.heard.filter((h) => h.endsWith('l3_keeper_freed')), ['line:l3_keeper_freed']);
    assertOrder(r.three.heard, ['event:fightStart', 'event:guardianFreed', 'line:l3_keeper_freed'], 'Level 3');
    assert.deepStrictEqual(r.three.sceneAt, { state: 'cutscene', scene: 'freed' });
    assert.ok(!r.three.heard.includes('line:l1_keeper_news'));
    for (const [name, s] of [['Level 1', r.one], ['Level 3', r.three]]) {
      // The Keeper is there in person, close by, and Renee's owl has come down to him.
      assert.ok(s.keeper && s.keeper.shown, `${name}: the Keeper was not there`);
      assert.ok(s.keeper.away < 16, `${name}: the Keeper was ${s.keeper.away} away`);
      assert.ok(s.owl && s.owl.away < 1.5 && s.owl.up > 1.5 && s.owl.up < 3.5, `${name}: the owl had not reached the Keeper when he spoke`);
      assert.ok(s.owlFrom > 8, `${name}: the owl did not fly down`);
      assert.ok(s.owlGone, `${name}: the owl stayed behind`);
      assert.strictEqual(s.news.length, 1);
      assert.ok(s.words <= 8, `${name}: ${s.words} words on screen`);
    }
    console.log(`4.2 "Renee sends word" played at the meeting at the end of Level 1${r.used[1] ? ' (practice level standing in)' : ''}; "Renee tells me" played when the golem was freed in Level 3${r.used[3] ? ' (practice level standing in)' : ''}`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

test('4.2 Renee meets the family at the castle door in Level 6 and shows them the way', async () => {
  const g = await openReady();
  try {
    const r = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const used = K.standIn(6, K.YARD_WALK);
      const out = { used, runs: [] };
      for (const skipAfter of [null, 0.5, 3.0]) {
        game.log.length = 0;
        await game.startLevel(6, { difficulty: 'easy', p1Hero: 0 });
        await K.loaded();
        const w = game.world, v = game.view;
        const first = { state: game.state, scene: game.scene && game.scene.name, renee: !!v.actors.renee, door: !!v.actors['castle-door'] };
        const spawn = w.L.spawn;
        const r0 = v.actors.renee ? { x: v.actors.renee.position.x, z: v.actors.renee.position.z } : null;
        const door = v.actors['castle-door'] ? { x: v.actors['castle-door'].position.x, z: v.actors['castle-door'].position.z } : null;
        const said0 = game.dialogue.history.length;
        let t = 0, words = 0, through = false;
        while (game.state === 'cutscene' && t < 60) {
          if (skipAfter !== null && t >= skipAfter) { K.tap(K.BUTTON.START); break; }
          game.advance(1 / 60, 1 / 60); v.sync(w, 1 / 60); t += 1 / 60;
          words = Math.max(words, game.words().length);
          const p = v.actors.renee.position;
          if (Math.abs(p.x - door.x) < 1.2 && Math.abs(p.z - door.z) < 0.6) through = true;
        }
        const r1 = { x: v.actors.renee.position.x, z: v.actors.renee.position.z };
        // After the scene the family can walk through the door themselves.
        const bot = new K.Bot(w, {});
        const z0 = w.leader().z;
        K.play(6, [bot]);
        out.runs.push({
          skipAfter, first, seconds: +t.toFixed(1), words, through, state: game.state,
          fromFamily: r0 ? +Math.hypot(r0.x - spawn.x, r0.z - spawn.z).toFixed(1) : null,
          besideDoor: r0 && door ? +Math.hypot(r0.x - door.x, r0.z - door.z).toFixed(1) : null,
          led: r0 ? +(r0.z - r1.z).toFixed(1) : null, offPath: +Math.abs(r1.x - door.x).toFixed(1),
          log: game.log.filter((e) => e.renee).map((e) => e.renee), lines: game.dialogue.history.length - said0,
          walked: +(z0 - w.leader().z).toFixed(1), pastDoor: w.leader().z < door.z,
        });
      }
      return out;
    });
    for (const q of r.runs) {
      const tag = q.skipAfter === null ? 'watched' : `skipped at ${q.skipAfter}s`;
      assert.deepStrictEqual(q.first, { state: 'cutscene', scene: 'start', renee: true, door: true }, `${tag}: Renee was not at the door when Level 6 began`);
      assert.ok(q.fromFamily < 16 && q.besideDoor < 5, `${tag}: Renee was not waiting at the door (${q.besideDoor} from it)`);
      assert.ok(q.led > 6, `${tag}: Renee did not lead the way (${q.led})`);
      assert.ok(q.offPath > 3, `${tag}: Renee is standing in the family's way`);
      assert.deepStrictEqual(q.log, ['door', 'led the way'], tag);
      if (q.skipAfter === null) assert.ok(q.through, 'Renee did not walk through the door');
      assert.ok(q.words <= 8);
      assert.strictEqual(q.state, 'play');
      assert.ok(q.walked > 20 && q.pastDoor, `${tag}: the family could not walk on through the door (${q.walked})`);
    }
    console.log(`4.2 Renee waits at the castle door at the start of Level 6${r.used ? ' (practice level standing in)' : ''}, ${r.runs[0].besideDoor} from it, and leads the way ${r.runs[0].led} steps in ${r.runs[0].seconds}s`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

// ---------------------------------------------------------------------------------------------
// 4.3 The festival
// ---------------------------------------------------------------------------------------------

test('4.3 the bot finishes Level 6 with 3 gold berries and with all of them, and the lanterns match', async () => {
  const story = storySection('The festival');
  assert.strictEqual(story.length, 7, 'the story draft\'s festival no longer has seven spoken lines');
  for (const s of story) assert.ok(s.id, `not in data/dialogue.json: ${s.speaker}: "${s.text}"`);
  const g = await openReady();
  try {
    const r = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      // Practice levels stand in for the levels not built yet, each with three gold berries like a real one.
      const withGold = { ...K.YARD_WALK, course: K.YARD_WALK.course.map((s, i) => (i === 0 ? { ...s, items: [1, 2, 3].map((n) => ({ k: 'gold', n, u: 10 + n * 14, x: (n - 2) * 9 })) } : s)) };
      const standIns = [1, 2, 3, 4, 5, 6].filter((n) => K.standIn(n, withGold));
      const every = game.levelList().flatMap((l) => l.gold);
      const heard = [];
      const sfx = game.audio.sfx.bind(game.audio), music = game.audio.playMusic.bind(game.audio);
      game.audio.sfx = (name, v) => { heard.push('sfx:' + name); return sfx(name, v); };
      game.audio.playMusic = (track, o) => { if (heard[heard.length - 1] !== 'music:' + track) heard.push('music:' + track); return music(track, o); };
      const out = { standIns, total: every.length, runs: [] };
      for (const have of [every.slice(0, 3), every]) {
        heard.length = 0; game.log.length = 0;
        Object.assign(game.save, { setupDone: true, prologueSeen: true, highest: 5, bonded: [true, true, true, true], gold: [...have], players: 1, heroes: [0, 1] });
        game.saveNow();
        await game.startLevel(6, { difficulty: 'easy' });
        await K.loaded();
        for (let i = 0; i < 5 && game.state === 'cutscene'; i++) K.tap(K.BUTTON.START);
        // The bot plays Level 6 to its end. (The way is cleared: this check is about what comes after.)
        let w = game.world;
        if (w.L.exit) { K.clearWayTo(w, w.L.exit.z); K.placeAt(w, w.L.exit.z + 16); }
        const p = K.play(600, [new K.Bot(w, { react: 0.3 })], { until: () => game.state === 'complete' });
        const done = { state: game.state, screen: game.ui.screen, level: game.level.number, gold: game.save.gold.length };
        K.tap(K.BUTTON.A);                                       // on to what comes next
        await K.loaded();
        w = game.world;
        const v = game.view;
        const at = { level: game.level && game.level.number, state: game.state, scene: game.scene && game.scene.name, hud: !game.ui.hud.classList.contains('hidden') };
        let said = game.dialogue.history.length, words = 0, t = 0;
        const seen = { lanternPairs: null, lanterns: null, guests: null, apart: [], dragonsZoomed: 0 };
        while (game.state === 'cutscene' && t < 400) {
          game.advance(1 / 60, 1 / 60); v.sync(w, 1 / 60); t += 1 / 60;
          for (; said < game.dialogue.history.length; said++) heard.push('line:' + game.dialogue.history[said]);
          words = Math.max(words, game.words().length);
          if (seen.lanternPairs === null && v.lanternPairs !== undefined && v.actors.castle) {
            seen.lanternPairs = v.lanternPairs; seen.lanterns = v.lanterns.length;
            seen.lit = v.lanterns.filter((l) => l.m.visible && l.m.parent).length;
            seen.pairsApart = new Set(v.lanterns.map((l) => l.pair)).size;
            seen.guests = ['bear', 'vine', 'golem', 'yeti', 'gargoyle', 'dragon', 'keeper', 'renee', 'castle'].filter((n) => v.actors[n] && v.actors[n].visible);
            seen.dragons = v.heroViz.filter((q) => q.dragon).length;
          }
          const k = v.actors.keeper, re = v.actors.renee;
          if (k && re) seen.apart.push(+Math.hypot(k.position.x - re.position.x, k.position.z - re.position.z).toFixed(2));
          seen.dragonsZoomed = Math.max(seen.dragonsZoomed, v.heroViz.filter((q) => q.zoom).length);
          if (game.log.some((e) => e.embrace) && seen.embraceAfter === undefined) { seen.embraceAfter = heard.filter((h) => h.startsWith('line:')).pop(); seen.embraceApart = seen.apart[seen.apart.length - 1]; }
        }
        const end = { state: game.state, screen: game.ui.screen, words: game.words(), finished: game.save.finished, gifts: game.log.filter((e) => e.gift !== undefined).map((e) => e.gift) };
        K.tap(K.BUTTON.A);
        out.runs.push({ have: have.length, done, at, seen: { ...seen, apart: [seen.apart[0], Math.min(...seen.apart)] }, heard: [...heard], words, seconds: +t.toFixed(1), end, last: { screen: game.ui.screen, state: game.state }, playSeconds: +p.t.toFixed(1) });
      }
      return out;
    });
    assert.ok(r.total > 3, `only ${r.total} gold berries exist, so "3" and "all" are the same`);
    assert.deepStrictEqual(r.runs.map((q) => q.have), [3, r.total]);
    for (const q of r.runs) {
      const tag = `with ${q.have} gold berries`;
      assert.deepStrictEqual(q.done, { state: 'complete', screen: 'complete', level: 6, gold: q.have }, `${tag}: Level 6 was not finished`);
      assert.deepStrictEqual(q.at, { level: 7, state: 'cutscene', scene: 'start', hud: false }, `${tag}: the festival did not follow Level 6`);
      // One pair of lanterns for every gold berry found.
      assert.strictEqual(q.seen.lanternPairs, q.have, `${tag}: ${q.seen.lanternPairs} pairs of lanterns`);
      assert.strictEqual(q.seen.lanterns, q.have * 2);
      assert.strictEqual(q.seen.lit, q.have * 2);
      assert.strictEqual(q.seen.pairsApart, q.have);
      // Everyone is there: the guardians, the dragon, the Keeper, Renee, the four little dragons.
      assert.deepStrictEqual(q.seen.guests, ['bear', 'vine', 'golem', 'yeti', 'gargoyle', 'dragon', 'keeper', 'renee', 'castle']);
      assert.strictEqual(q.seen.dragons, 4);
      // The story draft's order, every line once, nothing else spoken.
      assert.deepStrictEqual(q.heard.filter((h) => h.startsWith('line:')).map((h) => h.slice(5)), story.map((s) => s.id));
      assertOrder(q.heard, ['music:ending_festival', 'line:fest_keeper_worthy', 'line:fest_daniel_stay', 'line:fest_keeper_ask', 'sfx:chirps',
        'line:fest_renee_home', 'line:fest_keeper_missed', 'line:fest_dragon_hmph', 'line:fest_narrator'], tag);
      assert.strictEqual(q.seen.dragonsZoomed, 4, `${tag}: the four dragons did not answer together`);
      // The Keeper makes the gifts permanent: all four, in his first line.
      assert.deepStrictEqual([...q.end.gifts].sort(), [0, 1, 2, 3]);
      // Renee and the Keeper: apart, then together, and they embrace after his line to her.
      assert.ok(q.seen.apart[0] > 20, `${tag}: Renee began beside the Keeper`);
      assert.strictEqual(q.seen.embraceAfter, 'line:fest_keeper_missed');
      assert.ok(q.seen.embraceApart < 1.4, `${tag}: they embraced from ${q.seen.embraceApart} apart`);
      assert.ok(q.words <= 8, `${tag}: ${q.words} words on screen`);
      // The end.
      assert.strictEqual(q.end.state, 'complete');
      assert.strictEqual(q.end.screen, 'end');
      assert.ok(q.end.words.length <= 8 && q.end.words.join(' ').includes('The End'), `the last screen says: ${q.end.words.join(' ')}`);
      assert.ok(q.end.finished);
      assert.deepStrictEqual(q.last, { screen: 'map', state: 'menu' });
    }
    console.log(`4.3 festival after Level 6${r.standIns.includes(6) ? ' (practice level standing in)' : ''}: ${r.runs.map((q) => `${q.have} gold berries, ${q.seen.lanternPairs} pairs of lanterns`).join('; ')}; the scene runs ${r.runs[0].seconds}s`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});

test('4.3 skipping the festival still reaches the end', async () => {
  const g = await openReady();
  try {
    const rows = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const out = [];
      for (const after of [0.3, 5, 14, 22, 33, 45]) {
        Object.assign(game.save, { setupDone: true, prologueSeen: true, highest: 6, bonded: [true, true, true, true], finished: false });
        game.saveNow();
        await game.startLevel(7);
        await K.loaded();
        game.advance(after, 1 / 60);
        const before = game.state;
        K.tap(K.BUTTON.START);
        out.push({ after, before, state: game.state, screen: game.ui.screen, finished: game.save.finished, lanterns: game.view.lanternPairs, gold: game.save.gold.length });
      }
      return out;
    });
    for (const r of rows) {
      assert.strictEqual(r.before, 'cutscene', `at ${r.after}s the festival had already ended`);
      assert.deepStrictEqual({ state: r.state, screen: r.screen, finished: r.finished }, { state: 'complete', screen: 'end', finished: true }, `skipped at ${r.after}s`);
      assert.strictEqual(r.lanterns, r.gold);
    }
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
  }
});
