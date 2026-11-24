// Milestone 2.8: spoken, not read. Every line lives in data/dialogue.json with
// its speaker and its sound file, the story's lines are there word for word,
// and nothing on screen is ever more than eight words.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { openReady } = require('./harness/kit');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const data = JSON.parse(read('data/dialogue.json'));
const words = (t) => t.trim().split(/\s+/).length;

// The story draft writes each spoken line as:  - **Speaker, note:** "The words."
function storyLines() {
  const who = (label) => {
    const l = label.toLowerCase();
    if (l.startsWith('hero in a web')) return ['joshua', 'daniel', 'vanessa', 'michael'];
    if (l.startsWith('great black dragon')) return ['dragon'];
    for (const k of ['keeper', 'renee', 'narrator', 'joshua', 'daniel', 'vanessa', 'michael']) if (l.startsWith(k)) return [k];
    throw new Error(`The story draft has a speaker this check does not know: ${label}`);
  };
  const out = [];
  for (const row of read('docs/STORY.md').split('\n')) {
    const m = row.match(/^- \*\*([^*]+?):\*\* "(.+?)"(?: .*)?$/);
    if (!m) continue;
    for (const speaker of who(m[1])) out.push({ speaker, text: m[2] });
  }
  return out;
}

test('2.8 every line of the story draft is in data/dialogue.json, word for word, with its speaker', () => {
  const story = storyLines();
  assert.ok(story.length >= 47, `only ${story.length} spoken lines found in the story draft`);
  for (const s of story) {
    const hit = data.lines.find((l) => l.text === s.text && l.speaker === s.speaker);
    assert.ok(hit, `missing or changed: ${s.speaker}: "${s.text}"`);
    assert.strictEqual(hit.from, 'story');
  }
  // And nothing claims to be from the story that is not in it.
  const fromStory = data.lines.filter((l) => l.from === 'story');
  assert.strictEqual(fromStory.length, story.length);
  for (const l of fromStory) assert.ok(story.some((s) => s.text === l.text && s.speaker === l.speaker), `${l.id} is not in the story draft`);
  // Every other line is a Keeper hint that the plan asks for.
  for (const l of data.lines.filter((x) => x.from !== 'story')) {
    assert.strictEqual(l.from, 'added');
    assert.strictEqual(l.speaker, 'keeper', `${l.id}: an added line must be a Keeper hint`);
    assert.match(l.id, /^hint_/);
  }
  console.log(`2.8 ${story.length} story lines and ${data.lines.length - story.length} added Keeper hints, ${data.lines.length} in all`);
});

test('2.8 every line has its speaker and a sound file made with Fish Audio', () => {
  const tasks = new Map(read('tools/voice-tasks.tsv').trim().split('\n').map((r) => r.split('\t')));
  const ids = new Set();
  let total = 0;
  for (const l of data.lines) {
    assert.ok(!ids.has(l.id), `two lines share the id ${l.id}`);
    ids.add(l.id);
    assert.ok(data.voices[l.speaker], `${l.id}: unknown speaker ${l.speaker}`);
    assert.strictEqual(l.file, `assets/audio/voice/${l.id}.mp3`);
    const abs = path.join(root, l.file);
    assert.ok(fs.existsSync(abs), `${l.id}: no sound file`);
    assert.ok(fs.statSync(abs).size > 3000, `${l.id}: the sound file is nearly empty`);
    // The file really is sound of a sensible length for its words.
    const secs = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', abs], { encoding: 'utf8' }));
    assert.ok(Math.abs(secs - l.duration) < 0.05, `${l.id}: the data file says ${l.duration}s and the sound is ${secs}s`);
    const perWord = secs / words(l.text);
    assert.ok(perWord > 0.15 && perWord < 0.9, `${l.id}: ${secs}s for ${words(l.text)} words does not sound like this line`);
    assert.match(tasks.get(l.id) || '', /^[0-9a-f]{32}$/, `${l.id}: no Fish Audio task on record`);
    total += secs;
  }
  assert.strictEqual(tasks.size, data.lines.length, 'tools/voice-tasks.tsv and the data file list different lines');
  console.log(`2.8 ${data.lines.length} sound files, ${total.toFixed(0)} seconds of speech`);
});

test('2.8 the Keeper, Renee, the Great Black Dragon and the Narrator each have one voice; the family use stand-ins', () => {
  for (const k of ['keeper', 'renee', 'dragon', 'narrator']) {
    const v = data.voices[k];
    assert.ok(v, `no voice for ${k}`);
    assert.match(v.voiceId, /^[0-9a-f]{32}$/);
    assert.strictEqual(v.standIn, false);
    assert.strictEqual(v.madeWith, 'Fish Audio');
    assert.ok(data.lines.some((l) => l.speaker === k), `${k} never speaks`);
  }
  for (const k of ['joshua', 'daniel', 'vanessa', 'michael']) {
    assert.strictEqual(data.voices[k].standIn, true, `${k} should be marked as a stand-in voice`);
    assert.strictEqual(data.voices[k].madeWith, 'Fish Audio');
  }
  assert.strictEqual(Object.keys(data.voices).length, 8);
  // The build log names each chosen voice.
  const log = read('docs/BUILD_LOG.md');
  for (const v of Object.values(data.voices)) assert.ok(log.includes(v.voiceId), `the build log does not name the voice ${v.voice}`);
});

test('2.8 every sound effect is a Fish Audio file with its source on record', async () => {
  const src = JSON.parse(read('tools/sounds.json'));
  const { SOUND_NAMES } = await import('../tools/dialogue-source.mjs');
  assert.deepStrictEqual(Object.keys(data.sounds).sort(), [...SOUND_NAMES].sort());
  for (const name of SOUND_NAMES) {
    const abs = path.join(root, data.sounds[name]);
    assert.ok(fs.existsSync(abs), `${name}: no sound file`);
    const from = src.library[name] || src.generated[name];
    assert.ok(from && /^[0-9a-f]{32}$/.test(from.id || from.task), `${name}: no Fish Audio source on record`);
  }
  // Nothing in the sound folders that the data file does not know about.
  const known = new Set([...data.lines.map((l) => path.basename(l.file)), ...Object.values(data.sounds).map((f) => path.basename(f))]);
  for (const dir of ['assets/audio/voice', 'assets/audio/sfx']) {
    for (const f of fs.readdirSync(path.join(root, dir))) assert.ok(known.has(f), `${dir}/${f} is not in data/dialogue.json`);
  }
});

test('2.8 no sound effect is silent', () => {
  for (const [name, file] of Object.entries(data.sounds)) {
    const r = require('node:child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', path.join(root, file), '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
    const max = parseFloat((r.stderr.match(/max_volume: (-?[\d.]+) dB/) || [])[1]);
    const mean = parseFloat((r.stderr.match(/mean_volume: (-?[\d.]+) dB/) || [])[1]);
    assert.ok(max > -6 && mean > -40, `${name}: peak ${max} dB, average ${mean} dB`);
  }
  for (const l of data.lines) {
    const r = require('node:child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', path.join(root, l.file), '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
    const mean = parseFloat((r.stderr.match(/mean_volume: (-?[\d.]+) dB/) || [])[1]);
    assert.ok(mean > -24 && mean < -16, `${l.id}: average level ${mean} dB is not even with the others`);
  }
});

test('2.8 no caption is over eight words', async () => {
  const { captionChunks, MAX_CAPTION_WORDS } = await import('../src/dialogue.js');
  assert.strictEqual(MAX_CAPTION_WORDS, 8);
  let longest = 0;
  for (const l of data.lines) {
    const chunks = captionChunks(l.text);
    assert.strictEqual(chunks.join(' '), l.text.trim().split(/\s+/).join(' '), `${l.id}: the captions drop or change words`);
    for (const c of chunks) {
      assert.ok(words(c) <= 8, `${l.id}: a caption of ${words(c)} words: "${c}"`);
      longest = Math.max(longest, words(c));
    }
  }
  console.log(`2.8 longest caption is ${longest} words`);
});

test('2.8 in the game, every line plays its sound and no screen ever shows more than eight words', async () => {
  const g = await openReady();
  try {
    const out = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      const game = window.game;
      const res = { screens: {}, lines: [], worst: { n: 0, at: '', words: [] } };
      const look = (at) => {
        const w = game.words();
        if (w.length > res.worst.n) res.worst = { n: w.length, at, words: w };
        return w.length;
      };
      // Every menu screen, reached the way a player reaches it.
      res.screens.title = look('title');
      K.tap(K.BUTTON.A); res.screens.difficulty = look('difficulty');
      K.tap(K.BUTTON.A); res.screens.players = look('players');
      K.nudge(1, 0); K.tap(K.BUTTON.A); res.screens.heroes1 = look('heroes, player one');
      K.tap(K.BUTTON.A); res.screens.heroes2 = look('heroes, player two');
      K.tap(K.BUTTON.A);
      await K.loaded();
      res.screens.prologue = look('the prologue begins');
      game.toMap(); res.screens.map = look('map');
      res.mapScreen = game.ui.screen;

      // In play, with the HUD up: say every line and watch the screen all the way through.
      const w = await K.start(K.YARD_WALK, { difficulty: 'easy' });
      res.screens.hud = look('hud');
      const said = [];
      const voice = game.audio.voice.bind(game.audio);
      game.audio.voice = (file) => { said.push(file); return voice(file); };
      for (const id of Object.keys(game.dialogue.lines)) {
        w.progressT = 0;                                  // keep the idle hint out of the way
        game.dialogue.stop();
        const line = game.dialogue.lines[id];
        const before = said.length;
        game.dialogue.say(id);
        let most = 0, captions = [], t = 0, lastCaption = null;
        while (game.dialogue.busy() && t < 120) {
          game.advance(0.1); t += 0.1;
          w.progressT = 0;
          const c = game.dialogue.caption;
          if (c && c !== lastCaption) { captions.push(c.text); lastCaption = c; }   // each new caption is a new object, even with the same words
          most = Math.max(most, look(`line ${id}`));
          const shown = document.querySelector('#caption, .caption');
          if (c && !shown) res.noCaptionBox = true;
        }
        res.lines.push({ id, seconds: +t.toFixed(1), duration: line.duration, most, captions, file: said[before] || null, plays: said.length - before });
      }
      // A hint with the picture of who is needed, and a pause, complete and lost screen.
      K.tap(K.BUTTON.START); res.screens.pause = look('pause');
      K.tap(K.BUTTON.START);
      game.completeLevel(); res.screens.complete = look('level complete');
      game.ui.showLost(); res.screens.lost = look('try again');
      game.ui.showEnd(18); res.screens.end = look('the end');
      // Every sound file can be fetched.
      res.fetched = [];
      for (const l of Object.values(game.dialogue.lines)) {
        const r = await fetch(l.file);
        const b = await r.arrayBuffer();
        res.fetched.push({ id: l.id, ok: r.ok, type: r.headers.get('content-type'), bytes: b.byteLength });
      }
      for (const [name, file] of Object.entries(game.dialogue.sounds)) {
        const r = await fetch(file);
        res.fetched.push({ id: name, ok: r.ok, type: r.headers.get('content-type'), bytes: (await r.arrayBuffer()).byteLength });
      }
      return res;
    });
    assert.strictEqual(out.mapScreen, 'map');
    for (const [name, n] of Object.entries(out.screens)) assert.ok(n <= 8, `the ${name} screen shows ${n} words`);
    assert.strictEqual(out.lines.length, data.lines.length);
    for (const l of out.lines) {
      assert.strictEqual(l.plays, 1, `${l.id}: its sound was started ${l.plays} times`);
      assert.strictEqual(l.file, `assets/audio/voice/${l.id}.mp3`);
      assert.ok(l.most <= 8, `${l.id}: ${l.most} words on screen at once`);
      assert.ok(l.captions.length >= 1, `${l.id}: no caption`);
      assert.strictEqual(l.captions.join(' '), data.lines.find((d) => d.id === l.id).text.trim().split(/\s+/).join(' '), `${l.id}: the captions shown were not the line`);
      assert.ok(l.seconds >= l.duration, `${l.id}: cut off after ${l.seconds}s of ${l.duration}s`);
    }
    assert.ok(out.worst.n <= 8, `${out.worst.n} words at ${out.worst.at}: ${out.worst.words.join(' ')}`);
    assert.strictEqual(out.fetched.length, data.lines.length + Object.keys(data.sounds).length);
    for (const f of out.fetched) {
      assert.ok(f.ok && f.bytes > 500, `${f.id}: could not be fetched`);
      assert.match(f.type || '', /audio\/mpeg/, `${f.id}: served as ${f.type}`);
    }
    console.log(`2.8 most words on screen at any moment: ${out.worst.n} (${out.worst.at})`);
    assert.deepStrictEqual(g.errors, []);
  } finally { await g.close(); }
});
