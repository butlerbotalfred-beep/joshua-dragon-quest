// Stage 6: small and smooth.
//
// 6.1 Light first load. The game starts after downloading 25 MB or less, each
//     level loads its own files when entered (20 MB or less), and no texture is
//     larger than 1024 pixels on a side. The harness adds up the bytes the
//     server sent before the title screen and on entering each level.
//
// The checks run on every place that exists (the prologue, each level, the
// festival), so they cover new levels the moment they are added.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { openReady } = require('./harness/kit');
const { startServer, ROOT } = require('./harness/server');

const MB = 1048576;
const FIRST_LOAD_MB = 25;
const LEVEL_MB = 20;
const MAX_TEXTURE = 1024;

// What a player's device is sent: the page, the code, the data and the assets.
// Everything else in the repository (docs, tests, tools, originals) stays behind.
const SHIPPED = ['index.html', 'game.js', 'styles.css', 'src', 'data', 'vendor', 'assets'];

function walk(p, out = []) {
  const full = path.join(ROOT, p);
  if (!fs.existsSync(full)) return out;
  if (fs.statSync(full).isFile()) { out.push(p); return out; }
  for (const name of fs.readdirSync(full).sort()) walk(path.posix.join(p, name), out);
  return out;
}
const shippedFiles = () => SHIPPED.flatMap((p) => walk(p));

function pictureSize(bytes) {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { w: bytes.readUInt16BE(i + 7), h: bytes.readUInt16BE(i + 5) };
      i += 2 + bytes.readUInt16BE(i + 2);
    }
  }
  if (bytes.length > 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const kind = bytes.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { w: 1 + bytes.readUIntLE(24, 3), h: 1 + bytes.readUIntLE(27, 3) };
    if (kind === 'VP8 ') return { w: bytes.readUInt16LE(26) & 0x3fff, h: bytes.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') { const b = bytes.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }; }
  }
  return null;
}

// Every picture inside a .glb file.
function glbPictures(file) {
  const b = fs.readFileSync(path.join(ROOT, file));
  assert.strictEqual(b.readUInt32LE(0), 0x46546c67, `${file} is not a .glb file`);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8'));
  const binAt = 20 + jsonLen + 8;
  return (json.images || []).map((im, n) => {
    assert.ok(im.bufferView !== undefined, `${file}: picture ${n} is kept outside the file`);
    const v = json.bufferViews[im.bufferView];
    return pictureSize(b.subarray(binAt + (v.byteOffset || 0), binAt + (v.byteOffset || 0) + v.byteLength));
  });
}

test('6.1 no texture in the shipped game is larger than 1024 pixels on a side', () => {
  const files = shippedFiles();
  let pictures = 0, largest = 0;
  const tooBig = [];
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    let sizes = [];
    if (ext === '.glb') sizes = glbPictures(f);
    else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) sizes = [pictureSize(fs.readFileSync(path.join(ROOT, f)))];
    for (const s of sizes) {
      assert.ok(s, `${f}: a picture in a format the check cannot measure`);
      pictures++;
      largest = Math.max(largest, s.w, s.h);
      if (s.w > MAX_TEXTURE || s.h > MAX_TEXTURE) tooBig.push(`${f} ${s.w}x${s.h}`);
    }
  }
  assert.ok(pictures > 30, `only ${pictures} pictures found: the check is not looking in the right place`);
  assert.deepStrictEqual(tooBig, [], 'pictures larger than 1024 pixels on a side');
  console.log(`6.1 textures: ${pictures} pictures in ${files.filter((f) => f.endsWith('.glb')).length} models, the largest ${largest} pixels on a side`);
});

// The lighter models are the family's models with smaller pictures, and nothing else changed.
function readGlb(file) {
  const b = fs.readFileSync(file);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8'));
  const binAt = 20 + jsonLen + 8;
  const view = (i) => { const v = json.bufferViews[i]; return b.subarray(binAt + (v.byteOffset || 0), binAt + (v.byteOffset || 0) + v.byteLength); };
  return { json, view };
}

test('6.1 every lighter model keeps the shapes, bones and movements of its original, which is still in the repository', () => {
  const models = walk('assets/3d').filter((f) => f.endsWith('.glb'));
  let shapes = 0, moves = 0;
  for (const f of models) {
    const orig = path.join(ROOT, 'originals', f.replace(/^assets\//, ''));
    assert.ok(fs.existsSync(orig), `${f}: its original is not in originals/`);
    const a = readGlb(orig), b = readGlb(path.join(ROOT, f));
    const strip = (n) => { const c = { ...n }; delete c.mesh; delete c.skin; return c; };
    assert.deepStrictEqual((b.json.nodes || []).map(strip), (a.json.nodes || []).map(strip), `${f}: the bones differ`);
    // Movements: every channel moves the same bone the same way, with the same numbers.
    assert.strictEqual((b.json.animations || []).length, (a.json.animations || []).length, `${f}: a movement is missing`);
    (a.json.animations || []).forEach((an, n) => {
      const bn = b.json.animations[n];
      assert.deepStrictEqual(bn.channels.map((c) => c.target), an.channels.map((c) => c.target), `${f}: movement ${n} moves different bones`);
      assert.strictEqual(bn.samplers.length, an.samplers.length);
      an.samplers.forEach((sa, k) => {
        for (const end of ['input', 'output']) {
          const x = a.json.accessors[sa[end]], y = b.json.accessors[bn.samplers[k][end]];
          assert.strictEqual(y.count, x.count, `${f}: movement ${n} has a different number of steps`);
          assert.ok(a.view(x.bufferView).equals(b.view(y.bufferView)), `${f}: movement ${n} was changed`);
        }
        moves++;
      });
    });
    if (/_run\.glb$/.test(f)) {
      // A running file carries the running movement only; the body comes from the walking file.
      assert.ok(!(b.json.meshes || []).length && !(b.json.images || []).length, `${f}: still carries a body or pictures`);
      assert.ok((b.json.animations || []).length >= 1, `${f}: has no movement`);
      continue;
    }
    // Shapes: every mesh is byte for byte the original's.
    assert.deepStrictEqual(b.json.meshes, a.json.meshes, `${f}: the meshes differ`);
    assert.deepStrictEqual(b.json.skins, a.json.skins, `${f}: the skins differ`);
    assert.deepStrictEqual(b.json.materials, a.json.materials, `${f}: the materials differ`);
    assert.strictEqual(b.json.accessors.length, a.json.accessors.length);
    a.json.accessors.forEach((x, i) => {
      const y = b.json.accessors[i];
      assert.strictEqual(y.count, x.count);
      if (x.bufferView !== undefined) assert.ok(a.view(x.bufferView).equals(b.view(y.bufferView)), `${f}: shape data ${i} was changed`);
      shapes++;
    });
    assert.strictEqual((b.json.images || []).length, (a.json.images || []).length, `${f}: a picture is missing`);
  }
  assert.ok(models.length >= 36, `only ${models.length} models found`);
  console.log(`6.1 originals: ${models.length} models compared with originals/3d (${shapes} pieces of shape data and ${moves} movement tracks identical)`);
});

test('6.1 the game starts after downloading 25 MB or less', async () => {
  const server = await startServer();
  const g = await openReady({ server });
  try {
    // The title screen is up. Give the title music a moment to ask for its file, as it would for a player.
    await g.page.waitForTimeout(1500);
    const bytes = server.totalBytes();
    const biggest = [...server.log].sort((a, b) => b.bytes - a.bytes).slice(0, 3).map((e) => `${e.url} ${(e.bytes / MB).toFixed(2)} MB`);
    console.log(`6.1 first load: ${(bytes / MB).toFixed(2)} MB in ${server.log.length} requests before the title screen (largest: ${biggest.join('; ')})`);
    assert.ok(bytes > 100000, 'the server counted almost nothing: the check is not measuring');
    assert.ok(bytes <= FIRST_LOAD_MB * MB, `${(bytes / MB).toFixed(2)} MB were downloaded before the title screen`);
    assert.deepStrictEqual(g.errors, []);
  } finally {
    await g.close();
    await server.close();
  }
});

test('6.1 entering each level downloads 20 MB or less', async () => {
  // Which places exist today.
  const server = await startServer();
  let places;
  {
    const g = await openReady({ server });
    places = await g.page.evaluate(async () => {
      const K = await import('/tests/harness/pagekit.js');
      return Object.keys(K.LEVELS).map(Number).sort((a, b) => a - b).map((n) => ({ n, name: K.LEVELS[n].name || K.LEVELS[n].key }));
    });
    await g.close();
  }
  assert.ok(places.length >= 1);
  const rows = [];
  try {
    for (const p of places) {
      // A new visit each time, so nothing is already in memory: the most a level can ask for.
      const g = await openReady({ server });
      try {
        await g.page.waitForTimeout(500);
        const mark = server.mark();
        const state = await g.page.evaluate(async (n) => {
          const K = await import('/tests/harness/pagekit.js');
          const game = window.game;
          game.startLevel(n);
          await K.loaded();
          // Play the opening for a few seconds so its music and first lines are asked for too.
          for (let i = 0; i < 5; i++) { game.advance(1, 1 / 60); await new Promise((r) => setTimeout(r, 150)); }
          return game.state;
        }, p.n);
        assert.ok(['play', 'cutscene'].includes(state), `${p.name}: ended in state ${state}`);
        const urls = server.urlsSince(mark).filter((u) => !u.startsWith('/tests/'));
        const bytes = server.log.slice(mark).filter((e) => !e.url.startsWith('/tests/')).reduce((s, e) => s + e.bytes, 0);
        rows.push({ ...p, bytes, files: urls.length, models: urls.filter((u) => u.endsWith('.glb')).length });
        assert.deepStrictEqual(g.errors, [], `${p.name}: errors while loading`);
      } finally {
        await g.close();
      }
    }
  } finally {
    await server.close();
  }
  for (const r of rows) console.log(`6.1 entering ${r.name}: ${(r.bytes / MB).toFixed(2)} MB in ${r.files} files (${r.models} models)`);
  for (const r of rows) {
    assert.ok(r.models > 0, `${r.name}: no models were asked for, so the check is not measuring`);
    assert.ok(r.bytes <= LEVEL_MB * MB, `${r.name} downloads ${(r.bytes / MB).toFixed(2)} MB when entered`);
  }
});
