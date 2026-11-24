// Prints the map of a level as a table, straight from the level's own data,
// for pasting into docs/levels/level-N.md.
//
//   node tools/level-map.mjs 2            print it
//   node tools/level-map.mjs 2 --write    put it into the doc, between the two map markers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLayout } from '../src/levels.js';
import { HEROES, GUARDIANS } from '../src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const n = process.argv[2];
const mod = await import(`../src/levels/level${n}.js`);
const def = Object.values(mod).find((v) => v && v.course);
const L = buildLayout(def);
const lines = JSON.parse(fs.readFileSync(path.join(root, 'data/dialogue.json'), 'utf8')).lines;
const text = (id) => (lines.find((l) => l.id === id) || {}).text || '';

const KIND = { wall: 'A wall across the path', bridge: 'A gap far too wide to jump', run: 'A run only the fastest can make', leap: 'A gap only the longest leap clears' };
const ITEM = {
  enemy: (i) => `a spellbound ${i.type}`, web: () => 'a spider web', bush: () => 'a berry bush', gold: (i) => `gold berry ${i.n}`,
  animal: (i) => `a friendly ${i.type}`, line: (i) => `the Keeper speaks: "${text(i.id)}"`, alcove: () => 'a side nook',
};

const rows = [];
let start = 0, gateNo = 0;
def.course.forEach((sec, k) => {
  const s = L.sections[k];
  const len = Math.round(s.zNear - s.zFar);
  const from = Math.round(start), to = Math.round(start + len);
  start += len;
  let what = '';
  if (sec.t === 'path') what = 'Walkway';
  else if (sec.t === 'ramp') what = `Ramp ${sec.y1 > s.y ? 'up' : 'down'}`;
  else if (sec.t === 'hop') what = 'A small gap anyone can jump';
  else if (sec.t === 'ferry') what = 'A moving platform across a drop';
  else if (sec.t === 'arena') what = `**Guardian's arena:** ${GUARDIANS[def.guardian].name}, ${Math.round(s.x1 - s.x0)} wide`;
  else if (sec.t === 'nest') what = `**The nest** and the egg (${HEROES[def.eggHero].name}'s)`;
  else if (sec.t === 'exit') what = '**The way out**';
  else if (sec.t === 'gate') {
    gateNo++;
    const g = L.gates.find((q) => q.id === sec.id);
    what = `**Gate ${gateNo}: ${HEROES[g.hero].name}, ${g.gift}${sec.dragon ? ', with ' + HEROES[g.hero].dragon.name : ''}.** ${KIND[g.mech]}. Hint: "${text(g.hint)}"`;
  }
  const things = (sec.items || []).filter((i) => i.k !== 'alcove').map((i) => ITEM[i.k](i));
  rows.push(`| ${from} to ${to} | ${what} | ${things.join(', ') || ''} |`);
});

const out = [
  `Length ${Math.round(L.length)} units. ${L.gates.length} gates, ${L.bushes.length} berry bushes, ${L.gold.length} gold berries, ${L.enemies.length} creatures, ${L.webs.length} webs.`,
  '',
  '| Distance from the start | What is there | Along the way |',
  '| --- | --- | --- |',
  ...rows,
].join('\n');

if (process.argv[3] === '--write') {
  const file = path.join(root, `docs/levels/level-${n}.md`);
  const doc = fs.readFileSync(file, 'utf8');
  const a = '<!-- map:start -->', b = '<!-- map:end -->';
  if (!doc.includes(a) || !doc.includes(b)) throw new Error(`${file} has no map markers`);
  fs.writeFileSync(file, doc.slice(0, doc.indexOf(a) + a.length) + '\n' + out + '\n' + doc.slice(doc.indexOf(b)));
  console.log(`Map written into docs/levels/level-${n}.md`);
} else console.log(out);
