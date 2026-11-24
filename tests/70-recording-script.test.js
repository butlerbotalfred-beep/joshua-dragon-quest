// Milestone 7.1: docs/recording-script.md lists every line by speaker, with the
// file name each recording must have, and the line count per speaker matches
// data/dialogue.json.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('7.1 the recording script lists every line by speaker, and the counts match data/dialogue.json', () => {
  assert.ok(fs.existsSync(path.join(root, 'docs/recording-script.md')), 'docs/recording-script.md does not exist');
  const doc = read('docs/recording-script.md');
  const data = JSON.parse(read('data/dialogue.json'));

  // The file is the one the tool writes from the data today.
  const fresh = execFileSync('node', ['tools/recording-script.mjs', '--print'], { cwd: root, env: { ...process.env, NODE_NO_WARNINGS: '1' } }).toString();
  assert.strictEqual(doc.trim(), fresh.trim(), 'the recording script is out of date (run: node tools/recording-script.mjs)');

  // Read the file back as a person would: a heading for each speaker, then a table of that speaker's lines.
  const sections = {};
  let who = null;
  for (const row of doc.split('\n')) {
    const h = row.match(/^## (.+)$/);
    if (h) { who = h[1]; if (who !== 'How to record') sections[who] = []; continue; }
    const m = row.match(/^\| (\d+) \| `([^`]+)` \| ([^|]+) \| "(.+)" \| ([^|]*)\|$/);
    if (m && who && sections[who]) sections[who].push({ n: +m[1], file: m[2], where: m[3].trim(), text: m[4] });
  }
  const speakers = [...new Set(data.lines.map((l) => l.speaker))];
  assert.deepStrictEqual(Object.keys(sections).sort(), speakers.map((s) => data.voices[s].name).sort(), 'the speakers in the script are not the speakers in the game');

  let total = 0;
  const files = new Set();
  for (const s of speakers) {
    const mine = data.lines.filter((l) => l.speaker === s);
    const rows = sections[data.voices[s].name];
    assert.strictEqual(rows.length, mine.length, `${data.voices[s].name}: ${rows.length} lines in the script, ${mine.length} in the game`);
    mine.forEach((l, i) => {
      const r = rows[i];
      assert.strictEqual(r.n, i + 1);
      assert.strictEqual(r.text, l.text, `${l.id}: the words differ`);
      assert.strictEqual(r.file, path.basename(l.file), `${l.id}: the file name differs`);
      assert.ok(fs.existsSync(path.join(root, l.file)), `${l.file} is not in the game`);
      assert.ok(!files.has(r.file), `${r.file} is listed twice`);
      files.add(r.file);
    });
    // The count is also written out in words a person reads.
    assert.ok(doc.includes(`| ${data.voices[s].name} | ${mine.length} |`), `the summary does not give ${mine.length} for ${data.voices[s].name}`);
    total += mine.length;
  }
  assert.strictEqual(total, data.lines.length);
  assert.ok(doc.includes(`**${data.lines.length} lines**`));
  // The four family voices are marked as stand-ins, and nobody else is.
  for (const s of speakers) {
    const row = doc.split('\n').find((r) => r.startsWith(`| ${data.voices[s].name} | `));
    assert.strictEqual(/Stand-in/.test(row), ['joshua', 'daniel', 'vanessa', 'michael'].includes(s), `${s}: stand-in marking is wrong`);
  }
  console.log(`7.1 recording script: ${total} lines; ${speakers.map((s) => `${data.voices[s].name} ${data.lines.filter((l) => l.speaker === s).length}`).join(', ')}`);
});
