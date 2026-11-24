// Makes the shipped copies of the 3D models small enough for an iPad.
//
// The family's models come with 2048 x 2048 pictures on them, 5 to 8 MB a
// model. This tool keeps every original untouched in originals/3d/ and writes
// a lighter copy to assets/3d/, which is the one the game loads:
//
//   - no picture on a model is larger than 1024 x 1024;
//   - a hero's "run" file keeps only the running movement (the game takes the
//     body and its pictures from the "walk" file, so sending them twice is waste);
//   - files beside the models that the game never asks for move to originals/3d/.
//
// Nothing is deleted and nothing is redrawn: the shapes, the bones and the
// movements are byte for byte the same.
//
//   node tools/shrink-models.mjs            every model the game uses
//   node tools/shrink-models.mjs --check    change nothing; say what would be done
//
// It can be run again at any time. It always starts from originals/3d/.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX = 1024;
const QUALITY = 3;                      // ffmpeg's scale for JPEG: 2 is finest, 31 is roughest
const checkOnly = process.argv.includes('--check');

// ---- reading and writing a .glb -----------------------------------------------------------------

export function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file} is not a .glb file`);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen;
  const bin = binStart < b.length ? b.subarray(binStart + 8, binStart + 8 + b.readUInt32LE(binStart)) : Buffer.alloc(0);
  return { json, bin };
}

const pad4 = (n) => (n + 3) & ~3;

export function writeGlb(file, json, bin) {
  let j = Buffer.from(JSON.stringify(json), 'utf8');
  if (j.length % 4) j = Buffer.concat([j, Buffer.alloc(4 - (j.length % 4), 0x20)]);
  const binPad = Buffer.concat([bin, Buffer.alloc(pad4(bin.length) - bin.length)]);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + binPad.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(j.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binPad.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([head, jh, j, bh, binPad]));
}

// Lay the pieces of data out again, in order, keeping only the ones still in use.
// `pieces[i]` is the bytes for buffer view i, or null to drop it.
function repack(json, pieces) {
  const map = new Map();
  const views = [];
  const chunks = [];
  let at = 0;
  pieces.forEach((bytes, i) => {
    if (!bytes) return;
    const v = { ...json.bufferViews[i], buffer: 0, byteOffset: at, byteLength: bytes.length };
    map.set(i, views.length);
    views.push(v);
    chunks.push(bytes);
    const padded = pad4(bytes.length);
    if (padded > bytes.length) chunks.push(Buffer.alloc(padded - bytes.length));
    at += padded;
  });
  json.bufferViews = views;
  for (const a of json.accessors || []) if (a.bufferView !== undefined) a.bufferView = map.get(a.bufferView);
  for (const im of json.images || []) if (im.bufferView !== undefined) im.bufferView = map.get(im.bufferView);
  const bin = Buffer.concat(chunks);
  json.buffers = [{ byteLength: bin.length }];
  return bin;
}

const viewBytes = (json, bin, i) => { const v = json.bufferViews[i]; return bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };

// ---- pictures ----------------------------------------------------------------------------------------

export function pictureSize(bytes, mime) {
  if (mime === 'image/png') return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
  if (mime === 'image/jpeg') {
    let i = 2;
    while (i < bytes.length) {
      const marker = bytes[i + 1], len = bytes.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { w: bytes.readUInt16BE(i + 7), h: bytes.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return { w: 0, h: 0 };
}

function smaller(bytes, mime, tmp) {
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const a = path.join(tmp, `in.${ext}`), b = path.join(tmp, `out.${ext}`);
  fs.writeFileSync(a, bytes);
  const args = ['-y', '-loglevel', 'error', '-i', a, '-vf', `scale='min(${MAX},iw)':'min(${MAX},ih)':flags=lanczos`];
  if (ext === 'jpg') args.push('-q:v', String(QUALITY));
  execFileSync('ffmpeg', [...args, b]);
  return fs.readFileSync(b);
}

// ---- the two jobs -----------------------------------------------------------------------------------

// Every picture down to 1024 at most. Everything else is carried across untouched.
function shrinkPictures(json, bin, tmp, notes) {
  const pieces = json.bufferViews.map((_, i) => viewBytes(json, bin, i));
  for (const im of json.images || []) {
    if (im.bufferView === undefined) continue;
    const bytes = pieces[im.bufferView];
    const { w, h } = pictureSize(bytes, im.mimeType);
    if (w <= MAX && h <= MAX) continue;
    const out = smaller(bytes, im.mimeType, tmp);
    const s = pictureSize(out, im.mimeType);
    notes.push(`${w}x${h} to ${s.w}x${s.h}`);
    pieces[im.bufferView] = out;
  }
  return repack(json, pieces);
}

// Keep the movement and the bones it moves. Drop the body and its pictures.
function movementOnly(json, bin, notes) {
  const keepAcc = new Set();
  for (const an of json.animations || []) for (const s of an.samplers) { keepAcc.add(s.input); keepAcc.add(s.output); }
  const accMap = new Map();
  const accessors = [];
  (json.accessors || []).forEach((a, i) => { if (keepAcc.has(i)) { accMap.set(i, accessors.length); accessors.push(a); } });
  for (const an of json.animations || []) for (const s of an.samplers) { s.input = accMap.get(s.input); s.output = accMap.get(s.output); }
  json.accessors = accessors;
  const keepView = new Set(accessors.map((a) => a.bufferView));
  const pieces = json.bufferViews.map((_, i) => (keepView.has(i) ? viewBytes(json, bin, i) : null));
  for (const n of json.nodes || []) { delete n.mesh; delete n.skin; }
  for (const k of ['meshes', 'skins', 'materials', 'textures', 'images', 'samplers']) delete json[k];
  notes.push('movement only');
  return repack(json, pieces);
}

// ---- which files -------------------------------------------------------------------------------------

const { MODEL_FILES } = await import('../src/assets.js').catch(async () => {
  // src/assets.js imports three.js, which Node cannot load from the browser's import map.
  // Read the list out of the file instead.
  const src = fs.readFileSync(path.join(root, 'src/assets.js'), 'utf8');
  const dirs = { C: 'assets/3d/characters/', D: 'assets/3d/dragons/', E: 'assets/3d/enemies/', P: 'assets/3d/props/' };
  const files = {};
  for (const m of src.matchAll(/(\w+): `\$\{([CDEP])\}([^`]+)`/g)) files[m[1]] = dirs[m[2]] + m[3];
  for (const id of ['joshua', 'daniel', 'vanessa', 'michael']) { files[`hero_${id}`] = `${dirs.C}${id}_walk.glb`; files[`run_${id}`] = `${dirs.C}${id}_run.glb`; }
  return { MODEL_FILES: files };
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shrink-'));
let before = 0, after = 0;
const rows = [];
for (const [key, rel] of Object.entries(MODEL_FILES)) {
  const shipped = path.join(root, rel);
  const original = path.join(root, 'originals', rel.replace(/^assets\//, ''));
  if (!fs.existsSync(original)) {
    if (!fs.existsSync(shipped)) { rows.push(`${key}: MISSING ${rel}`); continue; }
    if (checkOnly) { rows.push(`${key}: would keep the original in originals/ and shrink ${rel}`); continue; }
    fs.mkdirSync(path.dirname(original), { recursive: true });
    fs.copyFileSync(shipped, original);
  }
  const { json, bin } = readGlb(original);
  const notes = [];
  const out = key.startsWith('run_') ? movementOnly(json, bin, notes) : shrinkPictures(json, bin, tmp, notes);
  const b = fs.statSync(original).size;
  before += b;
  if (checkOnly) { rows.push(`${key}: ${notes.join(', ') || 'no change'}`); continue; }
  writeGlb(shipped, json, out);
  const a = fs.statSync(shipped).size;
  after += a;
  rows.push(`${key.padEnd(20)} ${(b / 1048576).toFixed(2).padStart(6)} MB -> ${(a / 1048576).toFixed(2).padStart(5)} MB  ${notes.join(', ')}`);
}
fs.rmSync(tmp, { recursive: true, force: true });

// Files beside the models that the game never asks for (preview pictures, notes from the
// model makers, and bodies without movements) move to originals/3d/ too. Moved, not deleted.
const used = new Set(Object.values(MODEL_FILES));
const everything = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? everything(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
let moved = 0;
for (const rel of everything('assets/3d')) {
  if (used.has(rel)) continue;
  const to = path.join(root, 'originals', rel.replace(/^assets\//, ''));
  if (checkOnly) { rows.push(`would move ${rel} to originals/`); continue; }
  if (fs.existsSync(to)) throw new Error(`${to} is already there; not overwriting it`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(path.join(root, rel), to);
  moved++;
}
console.log(rows.join('\n'));
if (moved) console.log(`\n${moved} files the game never asks for moved to originals/3d/.`);
if (!checkOnly) console.log(`\n${Object.keys(MODEL_FILES).length} models: ${(before / 1048576).toFixed(1)} MB before, ${(after / 1048576).toFixed(1)} MB after. The originals are in originals/3d/.`);
