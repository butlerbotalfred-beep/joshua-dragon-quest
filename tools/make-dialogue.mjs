// Builds data/dialogue.json from tools/dialogue-source.mjs.
// Run it again whenever a line or a sound file changes:  node tools/make-dialogue.mjs
// It needs ffprobe (part of ffmpeg) to measure how long each sound file is.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOICES, LINES, SOUND_NAMES } from './dialogue-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function seconds(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
    const n = parseFloat(out);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  } catch (_) { return 0; }
}

const missing = [];
const lines = LINES.map((l) => {
  const rel = `assets/audio/voice/${l.id}.mp3`;
  const abs = path.join(root, rel);
  const has = fs.existsSync(abs);
  if (!has) missing.push(rel);
  const words = l.text.trim().split(/\s+/).length;
  return {
    id: l.id, speaker: l.speaker, text: l.text, file: rel,
    duration: has ? seconds(abs) : Math.round(words * 0.4 * 100) / 100,
    scene: l.scene, from: l.from,
  };
});

const sounds = {};
for (const name of SOUND_NAMES) {
  const rel = `assets/audio/sfx/${name}.mp3`;
  if (fs.existsSync(path.join(root, rel))) sounds[name] = rel; else missing.push(rel);
}

const voices = {};
for (const [k, v] of Object.entries(VOICES)) voices[k] = { name: v.name, voice: v.voice, voiceId: v.voiceId, standIn: v.standIn, madeWith: 'Fish Audio' };

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/dialogue.json'), JSON.stringify({ voices, sounds, lines }, null, 1) + '\n');
console.log(`${lines.length} lines, ${Object.keys(sounds).length} sounds written to data/dialogue.json`);
if (missing.length) console.log(`${missing.length} sound files are missing:\n  ${missing.join('\n  ')}`);
