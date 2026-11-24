// Turns the raw Fish Audio downloads into the game's sound files.
//
//   node tools/make-audio.mjs <folder of downloads>
//
// The folder holds `v_<line id>.mp3` for speech and `s_<name>.mp3` or
// `s_<name>.wav` for sound effects, exactly as they came from Fish Audio.
// Every file has the silence trimmed from both ends and is brought to an even
// loudness. Nothing is made here: this only trims and levels.
// Speech  -> assets/audio/voice/<line id>.mp3   (mono, average level -20 dB)
// Effects -> assets/audio/sfx/<name>.mp3        (mono, peak -3 dB, cut to the
//                                                length in tools/sounds.json)
// It needs ffmpeg. Run `node tools/make-dialogue.mjs` afterwards.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, SOUND_NAMES } from './dialogue-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error('Give the folder that holds the downloads.'); process.exit(1); }
const only = process.argv.slice(3);

const sounds = JSON.parse(fs.readFileSync(path.join(root, 'tools/sounds.json'), 'utf8'));
const trims = {}, cuts = {};
for (const group of [sounds.library, sounds.generated]) for (const [k, v] of Object.entries(group)) { trims[k] = v.trim; cuts[k] = v; }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rdr-audio-'));
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

function levels(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mean = parseFloat((r.stderr.match(/mean_volume: (-?[\d.]+) dB/) || [])[1]);
  const max = parseFloat((r.stderr.match(/max_volume: (-?[\d.]+) dB/) || [])[1]);
  return { mean, max };
}
function seconds(file) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }));
}

// Cuts silence from the start and the end, leaving a short breath of room.
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse';

const report = [];
function voice(id) {
  const from = path.join(src, `v_${id}.mp3`);
  if (!fs.existsSync(from)) return report.push(`MISSING speech ${id}`);
  const wav = path.join(tmp, `v_${id}.wav`);
  ff(['-i', from, '-ac', '1', '-ar', '44100', '-af', TRIM, wav]);
  const { mean, max } = levels(wav);
  const gain = Math.min(-20 - mean, -1.5 - max);
  const out = path.join(root, 'assets/audio/voice', `${id}.mp3`);
  ff(['-i', wav, '-af', `volume=${gain.toFixed(2)}dB,afade=t=in:d=0.01`, '-c:a', 'libmp3lame', '-b:a', '64k', out]);
  report.push(`speech ${id}: ${seconds(from).toFixed(2)}s -> ${seconds(out).toFixed(2)}s, gain ${gain.toFixed(1)} dB`);
}
function effect(name) {
  // An effect can be a later part of another effect's download: `file` names
  // that download and `start` says where in it this effect begins.
  const cutInfo = cuts[name] || {};
  const base = cutInfo.file || name;
  const start = cutInfo.start || 0;
  const from = ['mp3', 'wav'].map((e) => path.join(src, `s_${base}.${e}`)).find((f) => fs.existsSync(f));
  if (!from) return report.push(`MISSING effect ${name}`);
  // Some effects arrive very quiet, so bring the peak up first: the silence
  // trim then cuts real silence and not a quiet sound.
  const raw = path.join(tmp, `s_${name}_raw.wav`);
  ff(['-ss', String(start), '-i', from, '-ac', '1', '-ar', '44100', ...(start ? ['-t', String((trims[name] || 2) + 0.5)] : []), raw]);
  const first = levels(raw);
  if (!(first.max > -60)) return report.push(`SILENT effect ${name} (peak ${first.max} dB)`);
  const wav = path.join(tmp, `s_${name}.wav`);
  ff(['-i', raw, '-af', `volume=${(-3 - first.max).toFixed(2)}dB,${TRIM}`, wav]);
  const keep = Math.min(trims[name] || 2, seconds(wav));
  const cut = path.join(tmp, `s_${name}_cut.wav`);
  const fade = Math.min(0.12, keep / 3);
  ff(['-i', wav, '-t', keep.toFixed(3), '-af', `afade=t=in:d=${start ? 0.25 : 0.005},afade=t=out:st=${(keep - fade).toFixed(3)}:d=${fade.toFixed(3)}`, cut]);
  const { max } = levels(cut);
  const gain = -3 - max;
  const out = path.join(root, 'assets/audio/sfx', `${name}.mp3`);
  ff(['-i', cut, '-af', `volume=${gain.toFixed(2)}dB`, '-c:a', 'libmp3lame', '-b:a', '96k', out]);
  report.push(`effect ${name}: ${seconds(from).toFixed(2)}s -> ${seconds(out).toFixed(2)}s, gain ${gain.toFixed(1)} dB`);
}

fs.mkdirSync(path.join(root, 'assets/audio/voice'), { recursive: true });
fs.mkdirSync(path.join(root, 'assets/audio/sfx'), { recursive: true });
for (const l of LINES) if (!only.length || only.includes(l.id)) voice(l.id);
for (const n of SOUND_NAMES) if (!only.length || only.includes(n)) effect(n);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(report.join('\n'));
const bad = report.filter((r) => r.startsWith('MISSING') || r.startsWith('SILENT'));
if (bad.length) process.exitCode = 1;
