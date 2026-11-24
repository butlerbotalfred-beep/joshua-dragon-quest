// Draws the world. Nothing here changes the game: it only looks at it.

import * as THREE from 'three';
import { HEROES, GUARDIANS, ENEMIES, FIGHT } from './config.js';
import { floorHeight } from './levels.js';
import { disposeTree } from './assets.js';

export const BIOMES = {
  meadow: { sky: 0x9fd8ff, fog: [0xbfe6ff, 45, 150], ground: ['#6fbf5a', '#5cab4b', '#83cf6b'], side: 0x6b4a2b, shoulder: 0x5aa84a, decor: 'pines', sparse: 0.45, sun: 0xfff3d6, amb: [0xdff3ff, 0x6c8f4e, 1.15] },
  woods: { sky: 0x8ecbf0, fog: [0xa8d8c8, 40, 135], ground: ['#5d8a45', '#4d7a3a', '#6f9c52'], side: 0x5a3d22, shoulder: 0x3f6b33, decor: 'pines', sparse: 1, sun: 0xfff0cc, amb: [0xcfeaff, 0x4c6b3a, 1.05] },
  canopy: { sky: 0xa6e3c8, fog: [0x8fd3ae, 38, 125], ground: ['#b58a55', '#a57a48', '#c69a63'], side: 0x6b4a2b, shoulder: null, deep: 0x2f6b45, decor: 'trunks', sparse: 1, sun: 0xfff6d8, amb: [0xdfffe9, 0x4f7f55, 1.15] },
  caverns: { sky: 0x2a1410, fog: [0x3a1a12, 30, 110], ground: ['#4a3530', '#3d2a26', '#5a4038'], side: 0x241614, shoulder: 0x2c1c18, decor: 'spikes', sparse: 1, sun: 0xffb37a, amb: [0xffc9a0, 0x3a1a10, 1.0] },
  frost: { sky: 0xcfe9ff, fog: [0xdff1ff, 38, 130], ground: ['#eef7ff', '#dcecfa', '#ffffff'], side: 0x9fbfd8, shoulder: 0xd6e8f6, decor: 'snowpines', sparse: 0.8, sun: 0xffffff, amb: [0xf2f9ff, 0x9fb8cc, 1.15] },
  crags: { sky: 0x9b93c4, fog: [0x8780ad, 38, 125], ground: ['#6a6384', '#5b5574', '#7a7296'], side: 0x3d3852, shoulder: null, deep: 0x3a3555, decor: 'pillars', sparse: 0.8, sun: 0xffe8f0, amb: [0xe6dcff, 0x4a4466, 1.1] },
  castle: { sky: 0x1a1426, fog: [0x231a33, 30, 105], ground: ['#4d415c', '#3d3448', '#5d506c'], side: 0x241e2e, shoulder: 0x2c2438, decor: 'columns', sparse: 0.9, sun: 0xffc9a8, amb: [0xcbb8ff, 0x2a2238, 1.05] },
  festival: { sky: 0x2b2a5a, fog: [0x3a376e, 45, 150], ground: ['#8a7a66', '#7a6a58', '#9a8a74'], side: 0x4a3d30, shoulder: 0x4f7a45, decor: 'pines', sparse: 0.3, sun: 0xffd9a0, amb: [0xbfc4ff, 0x4a4466, 1.1] },
};

const GIFT_ICON = { speed: '⚡', fire: '🔥', ice: '❄️', strength: '💪' };
const GIFT_COLOR = { speed: 0x2ecc71, fire: 0xff6a2a, ice: 0x6fd3ff, strength: 0xb277ff };

// How each kind of gate looks. `prop` is what a target is made of, `out` is how it leaves.
const THEMES = {
  brambles: { prop: 'thorn_bramble', h: 2.8, fill: 'bush', color: 0x3c6b2c, out: 'shrink' },
  overgrowth: { prop: 'thorn_bramble', h: 3.2, fill: 'bush', color: 0x2f7a35, out: 'shrink' },
  boulder: { prop: 'heavy_boulder', h: 4.4, fill: 'rock', color: 0x7b7468, out: 'slide', big: true },
  rock: { prop: 'heavy_boulder', h: 4.0, fill: 'rock', color: 0x5a4640, out: 'rise', big: true },
  icewall: { prop: 'ice_barrier', h: 3.6, fill: 'ice', color: 0x9fdcff, out: 'sink' },
  iceseal: { prop: 'ice_barrier', h: 4.2, fill: 'ice', color: 0x9fdcff, out: 'sink' },
  vents: { prop: 'vent', h: 1.2, fill: 'steam', color: 0xffb380, out: 'stay' },
  lamps: { prop: 'lamp', h: 2.6, fill: 'dark', color: 0x1a1420, out: 'stay' },
  snowdrift: { prop: 'mound', h: 3.2, fill: 'snow', color: 0xffffff, out: 'shrink', big: true },
  storm: { prop: 'swirl', h: 3.0, fill: 'storm', color: 0xb8c8dc, out: 'shrink' },
  stonegate: { prop: 'obsidian_gate', h: 5.0, fill: 'stone', color: 0x4d4660, out: 'rise', big: true },
  block: { prop: 'block', h: 4.2, fill: 'stone', color: 0x7a7296, out: 'push', big: true },
};

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export class View {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.5, 400);
    this.camera.position.set(0, 12, 20);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1.1);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0015;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.root = null;
    this.textures = {};
    this.camPos = new THREE.Vector3(0, 12, 20);
    this.camLook = new THREE.Vector3(0, 0, 0);
    this.camOverride = null;
    this.time = 0;
    this.tmp = new THREE.Vector3();
    this.dummy = new THREE.Object3D();
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  // ---- building a level ------------------------------------------------------------

  clear() {
    if (this.root) {
      this.scene.remove(this.root);
      disposeTree(this.root);
      this.root = null;
    }
    for (const k in this.textures) this.textures[k].dispose();
    this.textures = {};
    this.heroViz = []; this.enemyViz = []; this.gateViz = []; this.shots = new Map(); this.tele = [];
    this.mixers = []; this.particles = []; this.actors = {}; this.spin = []; this.floorViz = [];
    this.guardianViz = null; this.eggViz = null; this.fxMesh = null; this.liquids = [];
  }

  build(world, assets) {
    this.clear();
    this.world = world;
    this.assets = assets;
    const L = world.L;
    const B = this.biome = BIOMES[L.biome] || BIOMES.woods;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.scene.background = new THREE.Color(B.sky);
    this.scene.fog = new THREE.Fog(B.fog[0], B.fog[1], B.fog[2]);
    this.hemi.color.set(B.amb[0]); this.hemi.groundColor.set(B.amb[1]); this.hemi.intensity = B.amb[2];
    this.sun.color.set(B.sun);
    this.rand = seeded(1000 + L.number * 77);

    this.groundTex = this.makeGroundTexture(B);
    this.matTop = new THREE.MeshStandardMaterial({ map: this.groundTex, roughness: 0.95 });
    this.matSide = new THREE.MeshStandardMaterial({ color: B.side, roughness: 1 });
    this.matIce = new THREE.MeshStandardMaterial({ color: 0xbfe9ff, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });
    this.matWood = new THREE.MeshStandardMaterial({ color: 0x9a6b3c, roughness: 0.9 });

    for (const f of L.floors) this.addFloor(f);
    this.addSurroundings(L, B);
    this.addDecor(L, B);
    for (const g of world.gates) this.addGate(g);
    this.addPickups(world);
    this.addParticles();
    for (const h of world.heroes) this.addHero(h);
    for (const e of world.enemies) this.addEnemy(e);
    if (world.guardian) this.addGuardian(world.guardian);
    this.snapCamera();
  }

  makeGroundTexture(B) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const r = seeded(99);
    ctx.fillStyle = B.ground[0];
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = B.ground[1 + (i % 2)];
      ctx.globalAlpha = 0.35 + r() * 0.3;
      ctx.beginPath();
      ctx.ellipse(r() * 256, r() * 256, 8 + r() * 26, 5 + r() * 14, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.ground = tex;
    return tex;
  }

  glowTexture() {
    if (this.textures.glow) return this.textures.glow;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return (this.textures.glow = new THREE.CanvasTexture(c));
  }

  glow(color, size, opacity = 0.6) {
    const m = new THREE.SpriteMaterial({ map: this.glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const s = new THREE.Sprite(m);
    s.scale.setScalar(size);
    return s;
  }

  iconTexture(icon, ring = '#ffffff') {
    const key = `icon_${icon}_${ring}`;
    if (this.textures[key]) return this.textures[key];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(20,24,40,0.78)';
    ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = ring; ctx.stroke();
    ctx.font = '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(icon, 64, 70);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return (this.textures[key] = tex);
  }

  iconSprite(icon, ring, size = 1.5) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.iconTexture(icon, ring), transparent: true, depthTest: false }));
    s.scale.setScalar(size);
    s.renderOrder = 10;
    return s;
  }

  addFloor(f) {
    const w = f.x1 - f.x0, len = f.z1 - f.z0, T = f.kind === 'ice' || f.kind === 'bridge' || f.kind === 'platform' ? 0.5 : 3;
    const rise = (f.y1 ?? f.y) - f.y;
    const hyp = Math.hypot(len, rise);
    const geo = new THREE.BoxGeometry(w, T, hyp);
    const uv = geo.attributes.uv;
    for (let i = 8; i < 12; i++) uv.setXY(i, uv.getX(i) * (w / 8), uv.getY(i) * (hyp / 8));
    let mat;
    if (f.kind === 'ice') mat = this.matIce;
    else if (f.kind === 'bridge' || f.kind === 'platform') mat = this.matWood;
    else mat = [this.matSide, this.matSide, this.matTop, this.matSide, this.matSide, this.matSide];
    const mesh = new THREE.Mesh(geo, mat);
    const ang = Math.atan2(rise, len);
    mesh.rotation.x = ang;
    mesh.position.set((f.x0 + f.x1) / 2, f.y + rise / 2 - (T / 2) * Math.cos(ang), (f.z0 + f.z1) / 2);
    mesh.receiveShadow = true;
    mesh.visible = f.active;
    this.root.add(mesh);
    this.floorViz.push({ f, mesh, shown: f.active ? 1 : 0, len });
  }

  addSurroundings(L, B) {
    // Ground beside the path, and whatever lies in the gaps.
    const shoulderMat = B.shoulder ? new THREE.MeshStandardMaterial({ color: B.shoulder, roughness: 1 }) : null;
    for (const s of L.sections) {
      const len = s.zNear - s.zFar;
      if (len <= 0) continue;
      const gap = L.gaps.find((g) => g.z1 <= s.zNear + 0.01 && g.z0 >= s.zFar - 0.01);
      if (gap) continue;
      if (!shoulderMat) continue;
      const rise = s.y1 - s.y;
      for (const side of [-1, 1]) {
        const geo = new THREE.PlaneGeometry(70, Math.hypot(len, rise));
        const m = new THREE.Mesh(geo, shoulderMat);
        m.rotation.x = -Math.PI / 2 + Math.atan2(rise, len);
        m.position.set(side > 0 ? s.x1 + 35 - 0.1 : s.x0 - 35 + 0.1, s.y + rise / 2 - 0.06, (s.zNear + s.zFar) / 2);
        m.receiveShadow = true;
        this.root.add(m);
      }
    }
    for (const g of L.gaps) {
      const len = g.z1 - g.z0;
      let color = 0x1b82d4, y = g.y - 1.1, opacity = 0.9, emissive = 0x000000;
      if (g.kind === 'lava') { color = 0xff5a00; emissive = 0xd83200; }
      else if (g.kind === 'drop') { color = B.deep || 0x10131c; y = g.y - 16; opacity = 1; }
      const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: g.kind === 'lava' ? 0.9 : 0, roughness: g.kind === 'water' ? 0.25 : 0.9, transparent: opacity < 1, opacity });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(g.kind === 'drop' ? 220 : 150, len + (g.kind === 'drop' ? 40 : 0)), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((g.x0 + g.x1) / 2, y, (g.z0 + g.z1) / 2);
      this.root.add(m);
      if (g.kind !== 'drop') this.liquids.push({ m, base: y, kind: g.kind });
      // The banks of the gap.
      for (const z of [g.z1, g.z0]) {
        const bank = new THREE.Mesh(new THREE.BoxGeometry(150, 3, 0.4), this.matSide);
        bank.position.set((g.x0 + g.x1) / 2, g.y - 1.55, z + (z === g.z1 ? 0.2 : -0.2));
        if (B.shoulder) this.root.add(bank);
      }
    }
    // A far floor below the walkways for the high places.
    if (!B.shoulder) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(400, L.length + 200), new THREE.MeshBasicMaterial({ color: B.deep }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, -24, (L.zStart + L.zEnd) / 2);
      this.root.add(m);
    }
  }

  addDecor(L, B) {
    // Trees, rocks and pillars beside the path, drawn in batches.
    const r = this.rand;
    const sets = {};
    const put = (kind, x, y, z, s, ry = r() * 6.28) => { (sets[kind] = sets[kind] || []).push([x, y, z, s, ry]); };
    const edge = B.decor === 'pines' || B.decor === 'snowpines' ? 'bush' : B.decor === 'trunks' ? 'post' : 'stone';
    for (const s of L.sections) {
      const len = s.zNear - s.zFar;
      const isGap = L.gaps.some((g) => g.z1 <= s.zNear + 0.01 && g.z0 >= s.zFar - 0.01);
      if (isGap || len <= 0) continue;
      const yAt = (z) => s.y + (s.y1 - s.y) * ((s.zNear - z) / len);
      const corridor = s.t === 'gate' && L.gates.find((g) => g.zNear === s.zNear && g.corridor);
      const x0 = corridor ? corridor.corridor.x0 : s.x0, x1 = corridor ? corridor.corridor.x1 : s.x1;
      // A low border so the edge of the path is easy to see.
      for (let z = s.zNear - 0.8; z > s.zFar; z -= 1.9) {
        for (const side of [-1, 1]) {
          const ex = side > 0 ? x1 + 0.5 : x0 - 0.5;
          if (L.floors.some((f) => f.kind === 'alcove' && ex > f.x0 - 0.6 && ex < f.x1 + 0.6 && z > f.z0 && z < f.z1)) continue;
          put(edge, ex + (r() - 0.5) * 0.3, yAt(z), z + (r() - 0.5) * 0.5, 0.7 + r() * 0.5);
        }
      }
      const n = Math.round(len * 0.42 * B.sparse);
      for (let i = 0; i < n; i++) {
        const side = r() < 0.5 ? -1 : 1;
        const x = (side > 0 ? x1 : x0) + side * (3 + r() * 30);
        const z = s.zNear - r() * len;
        if (L.floors.some((f) => x > f.x0 - 2 && x < f.x1 + 2 && z > f.z0 - 2 && z < f.z1 + 2)) continue;
        put('tall', x, B.shoulder ? yAt(z) : yAt(z) - 16 - r() * 6, z, 0.8 + r() * 0.9);
      }
    }
    const mk = (geo, color, opts = {}) => ({ geo, mat: new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...opts }) });
    const kinds = {
      bush: [{ ...mk(new THREE.IcosahedronGeometry(0.6, 0), B.decor === 'snowpines' ? 0xe8f4ff : 0x3f7a35), dy: 0.3 }],
      stone: [{ ...mk(new THREE.DodecahedronGeometry(0.55, 0), B.side), dy: 0.25 }],
      post: [{ ...mk(new THREE.CylinderGeometry(0.14, 0.16, 1.3, 6), 0x7a5230), dy: 0.65 }],
    };
    if (B.decor === 'pines' || B.decor === 'snowpines') {
      const leaf = B.decor === 'snowpines' ? 0xdfeef8 : 0x2f6b34;
      kinds.tall = [
        { ...mk(new THREE.CylinderGeometry(0.35, 0.5, 3, 6), 0x5a3d22), dy: 1.5 },
        { ...mk(new THREE.ConeGeometry(2.4, 5, 7), leaf), dy: 5 },
        { ...mk(new THREE.ConeGeometry(1.7, 4, 7), leaf), dy: 7.6 },
      ];
    } else if (B.decor === 'trunks') {
      kinds.tall = [
        { ...mk(new THREE.CylinderGeometry(1.5, 2.0, 46, 8), 0x6b4a2b), dy: 10 },
        { ...mk(new THREE.IcosahedronGeometry(6.5, 1), 0x3f8f4a), dy: 34 },
      ];
    } else if (B.decor === 'spikes') {
      kinds.tall = [
        { ...mk(new THREE.ConeGeometry(1.6, 7, 6), 0x3a2622), dy: 3.5 },
        { ...mk(new THREE.OctahedronGeometry(0.8, 0), 0xff7a2a, { emissive: 0xff4a00, emissiveIntensity: 0.9 }), dy: 0.9, dx: 2.2 },
      ];
    } else if (B.decor === 'pillars') {
      kinds.tall = [
        { ...mk(new THREE.CylinderGeometry(1.3, 1.6, 26, 7), 0x5b5574), dy: 6 },
        { ...mk(new THREE.BoxGeometry(3.6, 1.0, 3.6), 0x6a6384), dy: 19.2 },
      ];
    } else {
      kinds.tall = [
        { ...mk(new THREE.CylinderGeometry(0.9, 1.1, 14, 8), 0x4d415c), dy: 7 },
        { ...mk(new THREE.BoxGeometry(2.6, 0.8, 2.6), 0x5d506c), dy: 14.3 },
        { ...mk(new THREE.OctahedronGeometry(0.4, 0), 0xffb060, { emissive: 0xff8a2a, emissiveIntensity: 1 }), dy: 4.2, dx: 1.3 },
      ];
    }
    for (const kind of Object.keys(sets)) {
      const list = sets[kind];
      for (const part of kinds[kind] || []) {
        const im = new THREE.InstancedMesh(part.geo, part.mat, list.length);
        list.forEach(([x, y, z, s, ry], i) => {
          this.dummy.position.set(x + (part.dx || 0) * s, y + part.dy * s, z);
          this.dummy.rotation.set(0, ry, 0);
          this.dummy.scale.setScalar(s);
          this.dummy.updateMatrix();
          im.setMatrixAt(i, this.dummy.matrix);
        });
        im.castShadow = kind !== 'tall' || !!B.shoulder;
        im.receiveShadow = false;
        im.frustumCulled = false;
        this.root.add(im);
      }
    }
    for (const a of L.animals) {
      const m = this.assets.instance(`friendly_${a.type}`, a.type === 'deer' ? 2.0 : 0.9);
      if (m) { m.position.set(a.x, a.y, a.z); m.rotation.y = this.rand() * 6.28; this.root.add(m); }
    }
  }

  prop(theme, big) {
    const T = THEMES[theme] || THEMES.brambles;
    let m = this.assets.instance(T.prop, T.h);
    if (m) return m;
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: T.color, roughness: 0.8 });
    if (T.prop === 'vent') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 1.0, 10), new THREE.MeshStandardMaterial({ color: 0x3a2622, roughness: 1 }));
      base.position.y = 0.5;
      const steam = this.glow(0xffc9a0, 5, 0.7); steam.position.y = 2.6;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), this.matIce.clone()); cap.position.y = 1.0; cap.visible = false;
      g.add(base, steam, cap); g.userData = { steam, cap };
    } else if (T.prop === 'lamp') {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x3d3448, roughness: 0.8 }));
      post.position.y = 1.1;
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshStandardMaterial({ color: 0x55506a, emissive: 0xffa040, emissiveIntensity: 0 }));
      bowl.position.y = 2.4;
      const flame = this.glow(0xffb040, 5, 0.9); flame.position.y = 2.6; flame.visible = false;
      g.add(post, bowl, flame); g.userData = { bowl, flame };
    } else if (T.prop === 'mound') {
      const s = new THREE.Mesh(new THREE.SphereGeometry(4.4, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
      s.scale.set(1.5, 0.75, 0.8); s.position.y = 0.6; g.add(s);
    } else if (T.prop === 'swirl') {
      const s = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.45, 8, 18), new THREE.MeshStandardMaterial({ color: 0xdfe8f5, roughness: 0.6, transparent: true, opacity: 0.85 }));
      s.position.y = 2.2; s.rotation.x = Math.PI / 2; g.add(s); this.spin.push({ o: s, axis: 'z', speed: 5 });
    } else if (T.prop === 'block') {
      const s = new THREE.Mesh(new THREE.BoxGeometry(6, 4.2, 4), mat); s.position.y = 2.1; g.add(s);
    } else {
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(big ? 2.4 : 1.2, 0), mat); s.position.y = big ? 2.2 : 1.1; g.add(s);
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  addGate(g) {
    const T = THEMES[g.theme] || {};
    const group = new THREE.Group();
    this.root.add(group);
    const gv = { g, group, targets: [], curtain: null, open: 0, T, chaser: null, door: null, rope: null, sign: null };
    const ringColor = '#' + new THREE.Color(GIFT_COLOR[g.gift]).getHexString();
    const marker = (x, y, z) => {
      const s = this.iconSprite(GIFT_ICON[g.gift], ringColor, 1.7);
      s.position.set(x, y, z);
      group.add(s);
      return s;
    };
    if (g.mech === 'wall') {
      const big = !!T.big;
      // Something solid across the whole path.
      const curtain = new THREE.Group();
      const zc = (g.wall.z0 + g.wall.z1) / 2;
      const fillMat = new THREE.MeshStandardMaterial({ color: T.color || 0x555555, roughness: 0.9, transparent: true, opacity: T.fill === 'dark' ? 0.93 : T.fill === 'steam' || T.fill === 'storm' ? 0.55 : 1 });
      if (T.fill === 'dark' || T.fill === 'steam' || T.fill === 'storm' || T.fill === 'ice') {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(g.x1 - g.x0 + 2, T.fill === 'ice' ? 3.2 : 7, 1.4), T.fill === 'ice' ? this.matIce : fillMat);
        slab.position.set(g.cx, g.y + (T.fill === 'ice' ? 1.6 : 3.5), zc);
        curtain.add(slab);
      } else {
        const geo = T.fill === 'bush' ? new THREE.ConeGeometry(0.9, 2.4, 6) : T.fill === 'snow' ? new THREE.SphereGeometry(1.3, 8, 6) : new THREE.DodecahedronGeometry(1.1, 0);
        for (let x = g.x0 - 0.5; x <= g.x1 + 0.6; x += 1.5) {
          const m = new THREE.Mesh(geo, fillMat);
          m.position.set(x, g.y + (T.fill === 'bush' ? 1.2 : 0.8), zc + (this.rand() - 0.5) * 0.6);
          m.rotation.y = this.rand() * 6; m.scale.setScalar(0.85 + this.rand() * 0.5);
          m.castShadow = true;
          curtain.add(m);
        }
      }
      group.add(curtain);
      gv.curtain = curtain;
      g.targets.forEach((t) => {
        const mesh = this.prop(g.theme, big);
        mesh.position.set(t.x, t.y, big ? zc : t.z);
        group.add(mesh);
        gv.targets.push({ t, mesh, marker: marker(t.x, t.y + (T.h || 3) + 1.2, t.z), shown: 1, punch: 0, base: mesh.position.clone() });
      });
    } else if (g.mech === 'bridge' && g.slices.length) {
      g.targets.forEach((t) => {
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 20), new THREE.MeshBasicMaterial({ color: GIFT_COLOR.ice, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(t.x, t.y - 0.6, t.z);
        group.add(ring);
        gv.targets.push({ t, mesh: ring, marker: marker(t.x, t.y + 2.2, t.z), shown: 1, punch: 0, base: ring.position.clone() });
      });
      if (g.theme === 'waterfall') {
        const fall = new THREE.Mesh(new THREE.PlaneGeometry(9, g.yFar - g.y + 8), new THREE.MeshStandardMaterial({ color: 0x6fc3ff, transparent: true, opacity: 0.75, roughness: 0.2 }));
        fall.position.set(g.cx, g.y + (g.yFar - g.y) / 2 - 2, g.zFar + 0.3);
        group.add(fall);
      }
    } else if (g.mech === 'bridge') {
      // A rope bridge that sways until it is held steady.
      const len = g.zNear - g.zFar;
      const planks = new THREE.Group();
      for (let i = 0; i < len / 1.2; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 0.9), this.matWood);
        p.position.set(0, 0, -i * 1.2 - 0.6);
        p.castShadow = true;
        planks.add(p);
      }
      planks.position.set(g.cx, g.y - 0.15, g.zNear);
      group.add(planks);
      gv.rope = planks;
      g.targets.forEach((t) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.6, 8), this.matWood);
        post.position.set(t.x, t.y + 1.3, t.z);
        post.castShadow = true;
        group.add(post);
        gv.targets.push({ t, mesh: post, marker: marker(t.x, t.y + 3.8, t.z), shown: 1, punch: 0, base: post.position.clone() });
      });
    } else if (g.mech === 'run') {
      gv.sign = marker(g.cx, g.y + 3.4, g.zNear + 0.5);
      const c = g.corridor;
      if (g.style === 'chase') {
        let ch = g.theme === 'bear' ? this.assets.instance('grizzly_bear', 3.4) : null;
        if (!ch) {
          ch = new THREE.Group();
          const m = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x1b4a7a, transparent: true, opacity: 0.85 }));
          m.position.y = 0.1; ch.add(m);
          ch.add(this.glow(0x9fdcff, 9, 0.5));
        }
        ch.visible = false;
        group.add(ch);
        gv.chaser = ch;
      } else if (g.style === 'door') {
        const door = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0 + 2, 6, 1), new THREE.MeshStandardMaterial({ color: 0x4d4660, roughness: 0.7 }));
        door.position.set(g.cx, g.y + 9, (g.door.z0 + g.door.z1) / 2);
        door.castShadow = true;
        group.add(door);
        gv.door = door;
        for (const sx of [c.x0 - 1.6, c.x1 + 1.6]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 13, 1.6), new THREE.MeshStandardMaterial({ color: 0x3d3448 }));
          post.position.set(sx, g.y + 6.5, door.position.z);
          group.add(post);
        }
      } else {
        // A slope: a rope or ladder drops when Joshua reaches the top.
        const len = Math.hypot(g.zNear - g.zFar, g.yFar - g.y);
        const rope = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, len), this.matWood);
        rope.position.set(g.cx + 2.6, (g.y + g.yFar) / 2 + 0.12, (g.zNear + g.zFar) / 2);
        rope.rotation.x = Math.atan2(g.yFar - g.y, g.zNear - g.zFar);
        rope.visible = false;
        group.add(rope);
        gv.rope = rope;
      }
      // Walls beside a narrow way.
      for (const side of [-1, 1]) {
        const wdt = side > 0 ? g.x1 - c.x1 : c.x0 - g.x0;
        if (wdt <= 0.2) continue;
      }
    } else if (g.mech === 'leap') {
      gv.sign = marker(g.cx, g.y + 3.4, g.zNear + 0.5);
    }
    this.gateViz.push(gv);
  }

  addPickups(world) {
    this.bushViz = world.bushes.map((b) => {
      const m = this.assets.instance('berry_bush', 1.5) || new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), new THREE.MeshStandardMaterial({ color: 0xc0392b }));
      m.position.set(b.x, b.y, b.z);
      this.root.add(m);
      return { b, m };
    });
    this.goldViz = world.gold.map((g) => {
      const grp = new THREE.Group();
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa800, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.4 }));
      grp.add(orb, this.glow(0xffd24a, 3.2, 0.7));
      grp.position.set(g.x, g.y + 1.3, g.z);
      grp.visible = !g.taken;
      this.root.add(grp);
      return { g, m: grp };
    });
    this.webViz = world.webs.map((w) => {
      const m = this.assets.instance('spider_web', 3.2, { byWidth: true }) || new THREE.Mesh(new THREE.CircleGeometry(1.6, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      m.position.set(w.x, w.y + 0.05, w.z);
      this.root.add(m);
      return { w, m };
    });
    const egg = world.L.egg;
    if (egg) {
      const grp = new THREE.Group();
      const nest = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.42, 8, 16), new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 1 }));
      nest.rotation.x = Math.PI / 2; nest.position.y = 0.3;
      const model = this.assets.instance(egg.prop, 1.7) || new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshStandardMaterial({ color: HEROES[egg.hero].color }));
      model.position.y = 0.35;
      const glow = this.glow(HEROES[egg.hero].dragon.color, 4, 0.5);
      glow.position.y = 1.2;
      grp.add(nest, model, glow);
      grp.position.set(egg.x, egg.y, egg.z);
      this.root.add(grp);
      this.eggViz = { grp, model, glow, hatched: false };
    }
    const ex = world.L.exit;
    if (ex) {
      const k = this.addActor('keeper', 'keeper', 2.5, ex.x, ex.y, ex.z - 1.5);
      if (k) k.rotation.y = 0;
    }
  }

  // A story character placed in the scene (the Keeper, Renee, the dragon).
  addActor(name, modelKey, height, x, y, z) {
    if (this.actors[name]) { this.root.remove(this.actors[name]); }
    let m = modelKey ? this.assets.instance(modelKey, height) : null;
    if (!m) m = this.standIn(name, height);
    m.position.set(x, y, z);
    this.root.add(m);
    this.actors[name] = m;
    return m;
  }

  removeActor(name) {
    const m = this.actors[name];
    if (m) { this.root.remove(m); disposeTree(m); delete this.actors[name]; }
  }

  // A simple figure for a character with no model of their own.
  standIn(name, height) {
    const g = new THREE.Group();
    const dress = name === 'renee' ? 0x7a4fa3 : 0x3f7a55;
    const body = new THREE.Mesh(new THREE.ConeGeometry(height * 0.26, height * 0.72, 12), new THREE.MeshStandardMaterial({ color: dress, roughness: 0.8 }));
    body.position.y = height * 0.36;
    const head = new THREE.Mesh(new THREE.SphereGeometry(height * 0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.7 }));
    head.position.y = height * 0.8;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(height * 0.13, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0xd9d9e0, roughness: 0.9 }));
    hair.position.y = height * 0.83;
    const shawl = new THREE.Mesh(new THREE.TorusGeometry(height * 0.14, height * 0.05, 8, 14), new THREE.MeshStandardMaterial({ color: 0xf2e6c8, roughness: 0.9 }));
    shawl.rotation.x = Math.PI / 2; shawl.position.y = height * 0.66;
    g.add(body, head, hair, shawl);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  addParticles() {
    const N = 260;
    const im = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    im.frustumCulled = false;
    im.count = 0;
    this.root.add(im);
    this.fxMesh = im;
    this.fxMax = N;
  }

  burst(x, y, z, color, n = 10, speed = 4, life = 0.7) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n && this.particles.length < this.fxMax; i++) {
      const a = Math.random() * 6.28, u = Math.random();
      this.particles.push({ x, y, z, vx: Math.cos(a) * speed * (0.4 + u), vy: 2 + Math.random() * speed, vz: Math.sin(a) * speed * (0.4 + u), life, max: life, r: c.r, g: c.g, b: c.b });
    }
  }

  addHero(h) {
    const group = new THREE.Group();
    const key = `hero_${h.def.id}`;
    let model = this.assets.instance(key, h.def.height, { skinned: true });
    const viz = { h, group, mixer: null, walk: null, run: null, dragon: null, stars: null, web: null, ring: null };
    if (model) {
      const mixer = new THREE.AnimationMixer(model.userData.model);
      const walk = this.assets.clips(key)[0], run = this.assets.clips(`run_${h.def.id}`)[0];
      if (walk) { viz.walk = mixer.clipAction(walk); viz.walk.play(); viz.walk.setEffectiveWeight(1); }
      if (run) { viz.run = mixer.clipAction(run); viz.run.play(); viz.run.setEffectiveWeight(0); }
      viz.mixer = mixer;
    } else {
      model = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, h.def.height * 0.45, 6, 10), new THREE.MeshStandardMaterial({ color: h.def.color }));
      body.position.y = h.def.height * 0.5; body.castShadow = true;
      model.add(body);
    }
    group.add(model);
    viz.model = model;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.8, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
    group.add(ring);
    viz.ring = ring;
    const stars = this.iconSprite('💫', '#ffd24a', 1.0);
    stars.position.y = h.def.height + 0.7; stars.visible = false;
    group.add(stars);
    viz.stars = stars;
    this.root.add(group);
    this.heroViz[h.i] = viz;
    if (h.bonded) this.addDragon(h.i);
  }

  addDragon(i) {
    const viz = this.heroViz[i];
    if (!viz || viz.dragon) return;
    const def = HEROES[i].dragon;
    let m = this.assets.instance(def.key, 0.95);
    if (!m) {
      m = new THREE.Group();
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: def.color }));
      m.add(b);
    }
    this.root.add(m);
    viz.dragon = m;
    viz.dragonPos = new THREE.Vector3(viz.h.x, viz.h.y + 2, viz.h.z);
  }

  addEnemy(e) {
    const m = this.assets.instance(e.def.model, e.def.height) || new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshStandardMaterial({ color: 0x884488 }));
    const g = new THREE.Group();
    g.add(m);
    const aura = this.glow(0x9b4dff, 2.6, 0.45);
    aura.position.y = e.def.height * 0.6;
    g.add(aura);
    g.position.set(e.x, e.y, e.z);
    this.root.add(g);
    this.enemyViz.push({ e, g, m, aura, scale: 1 });
  }

  addGuardian(gd) {
    const g = new THREE.Group();
    const m = this.assets.instance(gd.def.model, gd.def.height) || new THREE.Mesh(new THREE.SphereGeometry(2, 12, 10), new THREE.MeshStandardMaterial({ color: gd.def.color }));
    g.add(m);
    const spell = new THREE.Mesh(new THREE.TorusGeometry(gd.def.radius + 0.9, 0.16, 8, 40), new THREE.MeshBasicMaterial({ color: 0x9b4dff, transparent: true, opacity: 0.8 }));
    spell.rotation.x = Math.PI / 2; spell.position.y = 0.5;
    g.add(spell);
    const knots = [];
    for (let i = 0; i < gd.knots; i++) {
      const k = new THREE.Group();
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshBasicMaterial({ color: 0xc58bff }));
      k.add(orb, this.glow(0xb277ff, 1.6, 0.6));
      g.add(k);
      knots.push(k);
    }
    const halo = this.glow(0xffe08a, gd.def.height * 2.2, 0.0);
    halo.position.y = gd.def.height * 0.6;
    g.add(halo);
    g.position.set(gd.x, gd.y, gd.z);
    this.root.add(g);
    this.guardianViz = { gd, g, m, spell, knots, halo, freedT: 0 };
  }

  // ---- every frame ----------------------------------------------------------------------

  sync(world, dt) {
    if (!this.root) return;
    this.time += dt;
    const t = this.time;

    for (const fv of this.floorViz) {
      const f = fv.f;
      const want = f.active ? 1 : 0;
      fv.shown += (want - fv.shown) * Math.min(1, dt * 8);
      fv.mesh.visible = fv.shown > 0.02;
      if (f.kind === 'ice' || f.kind === 'bridge') fv.mesh.scale.set(1, 1, Math.max(0.01, fv.shown));
      if (f.moving) fv.mesh.position.z = (f.z0 + f.z1) / 2;
    }
    for (const l of this.liquids) l.m.position.y = l.base + Math.sin(t * 1.3) * 0.08;
    for (const s of this.spin) s.o.rotation[s.axis] += s.speed * dt;

    for (const viz of this.heroViz) this.syncHero(viz, world, dt, t);
    for (const ev of this.enemyViz) this.syncEnemy(ev, dt, t);
    if (this.guardianViz) this.syncGuardian(this.guardianViz, world, dt, t);
    for (const gv of this.gateViz) this.syncGate(gv, world, dt, t);
    this.syncShots(world, dt, t);
    this.syncTelegraph(world, t);
    this.syncPickups(world, dt, t);
    this.syncParticles(dt);
    this.updateCamera(world, dt);
  }

  syncHero(viz, world, dt, t) {
    const h = viz.h;
    viz.group.position.set(h.x, h.y, h.z);
    const target = Math.atan2(h.fx, h.fz);
    let d = target - viz.group.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    viz.model.rotation.y += 0;
    viz.group.rotation.y += d * Math.min(1, dt * 14);
    viz.ring.visible = h.control !== null;
    if (h.control !== null) viz.ring.material.color.set(h.control === 0 ? 0xffffff : 0xffd24a);
    viz.stars.visible = h.state === 'dizzy' || h.state === 'down';
    viz.stars.position.x = Math.sin(t * 6) * 0.3;
    const lying = h.state === 'down';
    viz.model.rotation.x += ((lying ? -Math.PI / 2 : 0) - viz.model.rotation.x) * Math.min(1, dt * 8);
    viz.model.position.y = lying ? 0.4 : 0;
    viz.model.visible = !(h.invuln > 0 && h.state === 'ok' && Math.floor(t * 14) % 2 === 0 && h.dashT <= 0);
    if (viz.mixer) {
      const sp = h.speedNow;
      const running = sp > 8.6;
      const moving = sp > 0.4 && h.state === 'ok';
      if (viz.walk) { viz.walk.setEffectiveWeight(moving && (!running || !viz.run) ? 1 : moving ? 0 : 1); viz.walk.timeScale = moving ? Math.max(0.6, sp / 5.5) : 0; }
      if (viz.run) { viz.run.setEffectiveWeight(moving && running ? 1 : 0); viz.run.timeScale = Math.max(0.8, sp / 10); }
      viz.mixer.update(dt);
    }
    if (h.dashT > 0 && Math.random() < 0.6) this.burst(h.x, h.y + 0.6, h.z, HEROES[0].color, 1, 1.2, 0.35);
    if (viz.dragon) {
      const side = h.i % 2 === 0 ? -0.9 : 0.9;
      this.tmp.set(h.x + side * h.fz - h.fx * 0.5, h.y + h.def.height + 0.45 + Math.sin(t * 3 + h.i) * 0.14, h.z - side * h.fx - h.fz * 0.5);
      viz.dragonPos.lerp(this.tmp, Math.min(1, dt * 7));
      viz.dragon.position.copy(viz.dragonPos);
      viz.dragon.rotation.y = viz.group.rotation.y;
    }
  }

  syncEnemy(ev, dt, t) {
    const e = ev.e;
    if (e.state === 'gone') { ev.g.visible = false; return; }
    ev.g.position.set(e.x, e.y + (e.state === 'chase' || e.state === 'freed' ? Math.abs(Math.sin(t * 9 + e.id)) * 0.25 : 0), e.z);
    ev.g.rotation.y = Math.atan2(e.fx, e.fz);
    let s = 1;
    if (e.state === 'windup') s = 1 + 0.18 * Math.sin(t * 30);
    if (e.state === 'freed') { s = Math.max(0.05, 1 - e.t / 2.2); ev.aura.visible = false; if (Math.random() < 0.3) this.burst(e.x, e.y + 1, e.z, 0xffe08a, 1, 1.5, 0.5); }
    if (e.flash > 0) s *= 1.15;
    ev.g.scale.setScalar(s);
  }

  syncGuardian(gv, world, dt, t) {
    const gd = gv.gd;
    gv.g.position.set(gd.x, gd.y, gd.z);
    const freed = gd.state === 'freed';
    const face = Math.atan2(gd.fx, gd.fz);
    let d = face - gv.m.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    gv.m.rotation.y += d * Math.min(1, dt * 6);
    const winding = gd.attack && !gd.attack.fired;
    gv.m.position.y = freed ? Math.abs(Math.sin(t * 2.2)) * 0.25 : Math.sin(t * 2) * 0.08;
    const sc = 1 + (gd.flash > 0 ? 0.05 : 0) + (winding ? 0.05 * Math.sin(t * 22) : 0);
    gv.m.scale.setScalar(sc);
    gv.m.position.x = gd.stagger > 0 ? Math.sin(t * 60) * 0.18 : (gd.holdT > 0 ? Math.sin(t * 40) * 0.05 : 0);
    gv.spell.visible = !freed;
    gv.spell.rotation.z = t * 1.5;
    const fighting = gd.state === 'fight';
    const R = gd.def.radius + 1.3;
    gv.knots.forEach((k, i) => {
      const alive = !freed && i < gd.knotsLeft;
      k.visible = alive;
      if (!alive) return;
      const a = t * (fighting ? 1.1 : 0.4) + (i / gd.knots) * Math.PI * 2;
      k.position.set(Math.cos(a) * R, gd.def.height * 0.55 + Math.sin(a * 2 + i) * 0.4, Math.sin(a) * R);
      const current = i === gd.knotsLeft - 1;
      const size = current ? 0.6 + 0.9 * (gd.knotHp / FIGHT.knotHp) : 1;
      k.scale.setScalar(size * (gd.knotLocked ? 0.75 : 1));
      k.children[0].material.color.set(gd.knotLocked ? 0x7a6a99 : current ? 0xffffff : 0xc58bff);
    });
    if (freed) {
      gv.freedT += dt;
      gv.halo.material.opacity = Math.min(0.5, gv.freedT * 0.5);
      if (Math.random() < 0.25) this.burst(gd.x + (Math.random() - 0.5) * 4, gd.y + 2 + Math.random() * 2, gd.z + (Math.random() - 0.5) * 4, 0xffe08a, 1, 1.2, 0.9);
    }
  }

  syncGate(gv, world, dt, t) {
    const g = gv.g, T = gv.T;
    gv.open += ((g.open ? 1 : 0) - gv.open) * Math.min(1, dt * 3);
    if (gv.curtain) {
      gv.curtain.visible = gv.open < 0.97;
      gv.curtain.position.y = -gv.open * 6;
      gv.curtain.scale.setScalar(1 - gv.open * 0.5);
    }
    if (gv.sign) { gv.sign.visible = !g.open; gv.sign.position.y = g.y + 3.4 + Math.sin(t * 3) * 0.25; }
    for (const tv of gv.targets) {
      const tt = tv.t;
      const active = !g.open && !tt.done && (!g.slices.length || world.nextTarget(g) === tt);
      tv.marker.visible = active;
      tv.marker.position.y += Math.sin(t * 3 + tt.x) * 0.004;
      if (tv.punch > 0) tv.punch -= dt;
      const hitScale = 1 + Math.max(0, tv.punch) * 0.8;
      const goneWant = tt.done || g.open ? 0 : 1;
      tv.shown += (goneWant - tv.shown) * Math.min(1, dt * 4);
      const hurt = 1 - tt.hp / tt.hits;                          // 0 fresh, 1 finished
      if (g.slices.length) { tv.mesh.visible = active; continue; }
      if (g.mech === 'bridge') { tv.mesh.scale.set(hitScale, 1, hitScale); continue; }
      const out = T.out;
      if (out === 'stay') {
        tv.mesh.scale.setScalar(hitScale);
        const u = tv.mesh.userData;
        if (u.cap) { u.cap.visible = tt.done; u.steam.visible = !tt.done; u.steam.material.opacity = 0.4 + 0.3 * Math.sin(t * 5 + tt.x); }
        if (u.flame) { u.flame.visible = tt.done; u.bowl.material.emissiveIntensity = tt.done ? 1.5 : hurt * 0.6; }
      } else if (out === 'slide') {
        tv.mesh.position.x = tv.base.x + hurt * 4 + (1 - tv.shown) * 9;
        tv.mesh.rotation.z = -(hurt * 0.8 + (1 - tv.shown) * 2);
        tv.mesh.scale.setScalar(hitScale);
      } else if (out === 'rise') {
        tv.mesh.position.y = tv.base.y + hurt * 1.2 + (1 - tv.shown) * 9;
        tv.mesh.scale.setScalar(hitScale);
        tv.mesh.visible = tv.shown > 0.03;
      } else if (out === 'push') {
        tv.mesh.position.z = tv.base.z - hurt * 1.5;
        tv.mesh.position.y = tv.base.y - (1 - tv.shown) * 5;
        tv.mesh.scale.setScalar(hitScale);
      } else if (out === 'sink') {
        tv.mesh.position.y = tv.base.y - (1 - tv.shown) * 5 - hurt * 0.6;
        tv.mesh.scale.set(hitScale, hitScale * (1 - hurt * 0.3), hitScale);
        tv.mesh.visible = tv.shown > 0.03;
      } else {
        const s = Math.max(0.01, tv.shown * (1 - hurt * 0.45)) * hitScale;
        tv.mesh.scale.setScalar(s);
        tv.mesh.visible = tv.shown > 0.03;
      }
    }
    if (g.mech === 'bridge' && !g.slices.length && gv.rope) {
      const sway = g.open ? 0 : 1;
      gv.rope.rotation.z = Math.sin(t * 2.4) * 0.35 * sway;
      gv.rope.position.x = g.cx + Math.sin(t * 1.7) * 0.8 * sway;
    }
    if (gv.chaser) {
      const ch = g.chaser;
      gv.chaser.visible = ch.active && !g.open;
      if (ch.active) {
        gv.chaser.position.set(g.cx, g.y + Math.abs(Math.sin(t * 12)) * 0.3, ch.z + 1.2);
        gv.chaser.rotation.y = Math.PI;
      }
    }
    if (gv.door) {
      let shut = 0;
      if (!g.open) {
        if (g.door.active) shut = 1;
        else if (g.chaser.active) shut = Math.min(1, (g.chaser.t * 8.9) / (g.zNear - g.zFar - 3));
      }
      gv.door.position.y = g.y + 3 + (1 - shut) * 6.2;
    }
    if (gv.rope && g.mech === 'run') gv.rope.visible = g.open;
  }

  syncShots(world, dt, t) {
    const seen = new Set(world.projectiles);
    for (const [p, m] of this.shots) {
      if (!seen.has(p)) { this.root.remove(m); disposeTree(m); this.shots.delete(p); }
    }
    for (const p of world.projectiles) {
      let m = this.shots.get(p);
      if (!m) {
        const color = p.kind === 'fire' ? 0xff7a2a : p.kind === 'ice' ? 0x8fe0ff : 0xb277ff;
        m = new THREE.Group();
        m.add(new THREE.Mesh(new THREE.SphereGeometry(p.r * 0.7, 10, 8), new THREE.MeshBasicMaterial({ color })), this.glow(color, p.r * 5, 0.7));
        this.root.add(m);
        this.shots.set(p, m);
      }
      m.position.set(p.x, p.y, p.z);
    }
  }

  syncTelegraph(world, t) {
    const g = world.guardian;
    const a = g && g.state === 'fight' ? g.attack : null;
    if (this.teleFor !== a) {
      for (const m of this.tele) { this.root.remove(m); disposeTree(m); }
      this.tele = [];
      this.teleFor = a;
      if (a) {
        for (const s of a.shapes) {
          const mat = new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
          const fill = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
          const grp = new THREE.Group();
          grp.position.set(s.x, g.y + 0.08, s.z);
          let outer, inner;
          if (s.kind === 'ring') {
            outer = new THREE.Mesh(new THREE.CircleGeometry(s.r, 40), mat);
            inner = new THREE.Mesh(new THREE.CircleGeometry(s.r, 40), fill);
            outer.rotation.x = -Math.PI / 2; inner.rotation.x = -Math.PI / 2;
            inner.userData.grow = 'all';
          } else {
            // A strip on the ground, pointing the way the guardian will charge.
            grp.rotation.y = Math.atan2(s.dx, s.dz);
            const og = new THREE.PlaneGeometry(s.w, s.len); og.translate(0, s.len / 2, 0);
            const ig = new THREE.PlaneGeometry(s.w, s.len); ig.translate(0, s.len / 2, 0);
            outer = new THREE.Mesh(og, mat); inner = new THREE.Mesh(ig, fill);
            outer.rotation.x = Math.PI / 2; inner.rotation.x = Math.PI / 2;
            inner.userData.grow = 'y';
          }
          inner.position.y = 0.03;
          grp.add(outer, inner);
          grp.userData.inner = inner;
          this.root.add(grp);
          this.tele.push(grp);
        }
      }
    }
    if (a) {
      const k = Math.max(0.02, Math.min(1, a.t / a.tele));
      for (const grp of this.tele) {
        const inner = grp.userData.inner;
        if (inner.userData.grow === 'all') inner.scale.setScalar(k); else inner.scale.set(1, k, 1);
        grp.visible = !a.fired || Math.floor(t * 20) % 2 === 0;
      }
    }
  }

  syncPickups(world, dt, t) {
    for (const v of this.bushViz) v.m.visible = !v.b.taken;
    for (const v of this.goldViz) { v.m.visible = !v.g.taken; v.m.rotation.y = t * 2; v.m.position.y = v.g.y + 1.3 + Math.sin(t * 2.5 + v.g.x) * 0.2; }
    for (const v of this.webViz) v.m.visible = !v.w.used;
    if (this.eggViz && !this.eggViz.hatched) {
      const near = world.eggNearness();
      const e = this.eggViz;
      e.glow.material.opacity = 0.25 + near * 0.7;
      e.glow.scale.setScalar(3 + near * 6 + Math.sin(t * (2 + near * 6)) * 0.4 * (0.3 + near));
      e.model.rotation.z = Math.sin(t * (3 + near * 9)) * 0.05 * (0.2 + near * 2.2);
    }
  }

  syncParticles(dt) {
    const im = this.fxMesh;
    if (!im) return;
    let n = 0;
    const keep = [];
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy -= 9 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.rotation.set(p.life * 5, p.life * 7, 0);
      this.dummy.scale.setScalar(0.4 + (p.life / p.max) * 1.1);
      this.dummy.updateMatrix();
      im.setMatrixAt(n, this.dummy.matrix);
      im.instanceColor.setXYZ(n, p.r, p.g, p.b);
      n++;
      keep.push(p);
    }
    this.particles = keep;
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
    im.instanceColor.needsUpdate = true;
  }

  // ---- reacting to what happens ------------------------------------------------------------

  onEvent(e, world) {
    if (!this.root) return;
    const hero = e.hero !== undefined ? world.heroes[e.hero] : null;
    switch (e.type) {
      case 'gift':
        if (e.gift === 'strength') { this.burst(e.x, hero.y + 0.3, e.z, GIFT_COLOR.strength, 16, 6, 0.5); }
        break;
      case 'boltHit': case 'fizz':
        this.burst(e.x, e.y, e.z, e.kind === 'fire' ? 0xff7a2a : 0x8fe0ff, 8, 3.5, 0.45);
        break;
      case 'targetHit': {
        const gv = this.gateViz.find((v) => v.g.id === e.gate);
        const tv = gv && gv.targets[e.index];
        if (tv) { tv.punch = 0.25; this.burst(tv.t.x, tv.t.y + 1.5, tv.t.z, GIFT_COLOR[gv.g.gift], 10, 4, 0.6); }
        break;
      }
      case 'wrongGift': this.burst(e.x, 1.5 + (hero ? hero.y : 0), e.z, 0x999999, 5, 2, 0.4); break;
      case 'gateOpen': {
        const g = world.gateById(e.gate);
        for (let i = 0; i < 5; i++) this.burst(g.cx + (i - 2) * 2.5, g.y + 2, (g.zNear + g.zFar) / 2, 0xffe08a, 10, 5, 1.0);
        break;
      }
      case 'enemyHit': { const en = world.enemies[e.id]; this.burst(en.x, en.y + 1, en.z, GIFT_COLOR[e.gift], 6, 3, 0.4); break; }
      case 'enemyFreed': { const en = world.enemies[e.id]; this.burst(en.x, en.y + 1, en.z, 0xffe08a, 22, 5, 0.9); break; }
      case 'guardianHit': { const g = world.guardian; this.burst(g.x, g.y + g.def.height * 0.5, g.z, e.locked ? 0x8877aa : GIFT_COLOR[e.gift], e.locked ? 3 : 8, 5, 0.5); break; }
      case 'knot': { const g = world.guardian; this.burst(g.x, g.y + g.def.height * 0.6, g.z, 0xffffff, 30, 8, 0.9); this.burst(g.x, g.y + 2, g.z, 0xc58bff, 20, 6, 0.9); break; }
      case 'guardianFreed': { const g = world.guardian; for (let i = 0; i < 6; i++) this.burst(g.x + (Math.random() - 0.5) * 6, g.y + 2 + Math.random() * 3, g.z + (Math.random() - 0.5) * 6, 0xffe08a, 14, 6, 1.2); break; }
      case 'strike': for (const s of e.shapes || []) this.burst(s.x, (world.guardian ? world.guardian.y : 0) + 0.4, s.z, 0xff8a4a, 14, 6, 0.5); break;
      case 'hurt': this.burst(hero.x, hero.y + 1.2, hero.z, 0xffffff, 6, 3, 0.4); break;
      case 'berry': this.burst(hero.x, hero.y + 1.4, hero.z, 0xff4d6d, 12, 3, 0.7); break;
      case 'gold': this.burst(hero.x, hero.y + 1.6, hero.z, 0xffd700, 26, 5, 1.0); break;
      case 'fell': this.burst(hero.x, hero.y + 1, hero.z, 0xbfe9ff, 12, 3, 0.6); break;
      case 'pop': this.burst(hero.x, hero.y + 1, hero.z, hero.def.color, 10, 3, 0.5); break;
      case 'caught': this.burst(hero.x, hero.y + 1, hero.z, 0xffffff, 10, 3, 0.5); break;
      case 'webFreed': this.burst(hero.x, hero.y + 1, hero.z, 0xffffff, 16, 4, 0.7); break;
      case 'swap': break;
      default: break;
    }
  }

  hatch(world) {
    if (!this.eggViz) return;
    const e = this.eggViz, egg = world.L.egg;
    e.hatched = true;
    e.model.visible = false;
    e.glow.material.opacity = 0.9; e.glow.scale.setScalar(7);
    for (let i = 0; i < 4; i++) this.burst(egg.x, egg.y + 1.2, egg.z, HEROES[egg.hero].dragon.color, 18, 6, 1.2);
    this.addDragon(egg.hero);
    const viz = this.heroViz[egg.hero];
    if (viz && viz.dragonPos) viz.dragonPos.set(egg.x, egg.y + 1.2, egg.z);
  }

  // ---- camera ---------------------------------------------------------------------------------

  cameraGoal(world) {
    const ps = world.players.map((p) => world.heroes[p.hero]);
    let fx = 0, fy = 0, fz = 0;
    for (const h of ps) { fx += h.x; fy += h.y; fz += h.z; }
    fx /= ps.length; fy /= ps.length; fz /= ps.length;
    let sep = 0;
    if (ps.length > 1) sep = Math.max(Math.abs(ps[0].x - ps[1].x) / 1.9, Math.abs(ps[0].z - ps[1].z) * 1.15);
    let height = 11.5 + sep * 0.62, back = 13 + sep * 0.5;
    const g = world.guardian;
    if (g && g.state === 'fight') {
      fx = fx * 0.6 + g.x * 0.4; fz = fz * 0.6 + g.z * 0.4;
      height += 6; back += 6;
    }
    const aspect = this.camera.aspect;
    if (aspect < 1.5) { height *= 1.5 / aspect * 0.85; back *= 1.5 / aspect * 0.85; }
    return { px: fx * 0.8, py: fy + height, pz: fz + back, lx: fx * 0.9, ly: fy + 1.0, lz: fz - 3.5 };
  }

  updateCamera(world, dt) {
    const k = 1 - Math.exp(-dt * 5);
    if (this.camOverride) {
      const o = this.camOverride;
      this.camPos.lerp(this.tmp.set(o.px, o.py, o.pz), o.snap ? 1 : 1 - Math.exp(-dt * 2.5));
      this.camLook.lerp(this.tmp.set(o.lx, o.ly, o.lz), o.snap ? 1 : 1 - Math.exp(-dt * 2.5));
      o.snap = false;
    } else if (world) {
      const c = this.cameraGoal(world);
      this.camPos.lerp(this.tmp.set(c.px, c.py, c.pz), k);
      this.camLook.lerp(this.tmp.set(c.lx, c.ly, c.lz), k);
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.sun.position.set(this.camLook.x + 22, this.camLook.y + 40, this.camLook.z + 16);
    this.sun.target.position.copy(this.camLook);
    this.sun.target.updateMatrixWorld();
  }

  snapCamera() {
    if (!this.world) return;
    const c = this.cameraGoal(this.world);
    this.camPos.set(c.px, c.py, c.pz);
    this.camLook.set(c.lx, c.ly, c.lz);
    this.updateCamera(this.world, 0);
  }

  // Where a point in the world lands on screen: x and y from -1 to 1 when visible.
  project(x, y, z) {
    this.camera.updateMatrixWorld();
    const v = this.tmp.set(x, y, z).project(this.camera);
    return { x: v.x, y: v.y, z: v.z };
  }

  render() { this.renderer.render(this.scene, this.camera); }

  info() {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs ? this.renderer.info.programs.length : 0,
    };
  }
}
