// Writes docs/recording-script.md: every spoken line in the game, by speaker,
// with the file name each recording must have. It is made from
// data/dialogue.json, so it cannot list a line the game does not have.
//
//   node tools/recording-script.mjs           write the file
//   node tools/recording-script.mjs --print   print it instead

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/dialogue.json'), 'utf8'));

const PLACE = {
  prologue: 'Prologue', level1: 'Level 1', level2: 'Level 2', level3: 'Level 3', level4: 'Level 4',
  level5: 'Level 5', level6: 'Level 6', festival: 'The festival', any: 'Any level',
};
// The family first, because theirs are the voices still to come.
const ORDER = ['joshua', 'daniel', 'vanessa', 'michael', 'renee', 'keeper', 'narrator', 'dragon'];
// How a line should sound, where the story draft says.
const HOW = {
  l2_joshua_hatch: 'Tender. This is the first hatching.',
  web_joshua: 'Calling for help, and giggling.', web_daniel: 'Calling for help, and giggling.',
  web_vanessa: 'Calling for help, and giggling.', web_michael: 'Calling for help, and giggling.',
  pro_dragon_eggs: 'Grand and grumpy.', l6_dragon_mine: 'Grand and grumpy.', fest_dragon_hmph: 'Grand and grumpy, but pleased underneath.',
  l6_dragon_family: 'Her anger has run out. Sad and honest.', l6_dragon_love: 'Small and unsure.',
  fest_keeper_missed: 'Warm. He has waited years to say it.', fest_renee_home: 'Warm and glad.',
};

const speakers = ORDER.filter((s) => data.lines.some((l) => l.speaker === s));
for (const l of data.lines) if (!ORDER.includes(l.speaker)) throw new Error(`No place in the script for speaker "${l.speaker}"`);

const out = [];
out.push('# Recording script');
out.push('');
out.push('Every line spoken in The Royal Dragon Rescue, by speaker. This file is written by `node tools/recording-script.mjs` from `data/dialogue.json`, the list the game itself plays from, so the two always agree.');
out.push('');
out.push(`There are **${data.lines.length} lines** for ${speakers.length} speakers.`);
out.push('');
out.push('| Speaker | Lines | Voice in the game today |');
out.push('| --- | --- | --- |');
for (const s of speakers) {
  const v = data.voices[s];
  const n = data.lines.filter((l) => l.speaker === s).length;
  out.push(`| ${v.name} | ${n} | ${v.standIn ? `Stand-in: Fish Audio voice "${v.voice}", until the family's recording arrives` : `Fish Audio voice "${v.voice}"`} |`);
}
out.push('');
out.push('## How to record');
out.push('');
out.push('- The four family voices (Joshua, Daniel, Vanessa and Michael) are stand-ins today. Everyone else already has their voice.');
out.push('- A quiet room, the phone or microphone a hand\'s width from the mouth, no music or television behind.');
out.push('- One file for each line, named exactly as in the "File name" column. Any common sound format is fine (m4a, wav or mp3): keep the name and change only the ending.');
out.push('- Say the line the way it would be said to a six-year-old: clear, warm, not rushed. Leave a breath of quiet before and after.');
out.push('- For a grown-up whose voice will be copied in Fish Audio instead of recorded line by line, reading that person\'s whole list once in a single recording is enough. The game\'s files are then made from the copied voice under the same file names.');
out.push('- When recordings arrive they are trimmed and set to the same loudness as the rest by `node tools/make-audio.mjs`.');
out.push('');

for (const s of speakers) {
  const v = data.voices[s];
  const mine = data.lines.filter((l) => l.speaker === s);
  const secs = mine.reduce((a, l) => a + (l.duration || 0), 0);
  out.push(`## ${v.name}`);
  out.push('');
  out.push(`${mine.length} ${mine.length === 1 ? 'line' : 'lines'}, about ${Math.max(1, Math.round(secs))} seconds in all.`);
  out.push('');
  out.push('| # | File name | Where | The words | How |');
  out.push('| --- | --- | --- | --- | --- |');
  mine.forEach((l, i) => {
    out.push(`| ${i + 1} | \`${path.basename(l.file)}\` | ${PLACE[l.scene] || l.scene} | "${l.text}" | ${HOW[l.id] || ''} |`);
  });
  out.push('');
}

const text = out.join('\n');
if (process.argv[2] === '--print') console.log(text);
else { fs.writeFileSync(path.join(root, 'docs/recording-script.md'), text + '\n'); console.log(`docs/recording-script.md written: ${data.lines.length} lines for ${speakers.length} speakers`); }
