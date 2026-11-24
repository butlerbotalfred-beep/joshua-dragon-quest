// Loads the 3D models a level needs, and lets go of the ones it does not.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HEROES, GUARDIANS, ENEMIES } from './config.js';

const C = 'assets/3d/characters/', D = 'assets/3d/dragons/', E = 'assets/3d/enemies/', P = 'assets/3d/props/';

// key -> file. Heroes have a walking file (the model and its walk) and a running file.
export const MODEL_FILES = {
  keeper: `${C}keeper_of_the_forest.glb`,
  speedy: `${D}speedy.glb`, ember: `${D}ember.glb`, frosty: `${D}frosty.glb`, samson: `${D}samson.glb`,
  great_black_dragon: `${D}great_black_dragon.glb`,
  grizzly_bear: `${E}grizzly_bear.glb`, vine_monster: `${E}vine_monster.glb`, magma_golem: `${E}magma_golem.glb`,
  yeti: `${E}yeti.glb`, stone_gargoyle: `${E}stone_gargoyle.glb`, tickling_spider: `${E}tickling_spider.glb`,
  wild_wolf: `${E}wild_wolf.glb`,
  egg_green: `${P}egg_green/model.glb`, egg_red: `${P}egg_red/model.glb`, egg_blue: `${P}egg_blue/model.glb`,
  egg_purple: `${P}egg_purple/model.glb`, berry_bush: `${P}berry_bush/model.glb`, pine_tree: `${P}pine_tree/model.glb`,
  spider_web: `${P}spider_web/model.glb`, thorn_bramble: `${P}thorn_bramble/model.glb`,
  royal_castle: `${P}royal_castle/model.glb`, friendly_deer: `${P}friendly_deer/model.glb`,
  friendly_rabbit: `${P}friendly_rabbit/model.glb`, friendly_owl: `${P}friendly_owl/model.glb`,
  ice_barrier: `${P}ice_barrier/model.glb`, obsidian_gate: `${P}obsidian_gate/model.glb`,
  heavy_boulder: `${P}heavy_boulder/model.glb`,
};
for (const h of HEROES) {
  MODEL_FILES[`hero_${h.id}`] = `${C}${h.id}_walk.glb`;
  MODEL_FILES[`run_${h.id}`] = `${C}${h.id}_run.glb`;
}

// Which props a gate's look needs.
const THEME_MODELS = {
  brambles: ['thorn_bramble'], overgrowth: ['thorn_bramble'], boulder: ['heavy_boulder'], rock: ['heavy_boulder'],
  icewall: ['ice_barrier'], iceseal: ['ice_barrier'], stonegate: ['obsidian_gate'], bear: ['grizzly_bear'],
};

// Everything one level needs, worked out from its layout.
export function modelsForLevel(world, extra = []) {
  const keys = new Set(extra);
  for (const h of HEROES) { keys.add(`hero_${h.id}`); keys.add(`run_${h.id}`); }
  world.heroes.forEach((h) => { if (h.bonded) keys.add(h.def.dragon.key); });
  const L = world.L;
  if (L.guardian) keys.add(GUARDIANS[L.guardian.type].model);
  for (const e of L.enemies) keys.add(ENEMIES[e.type].model);
  if (L.webs.length) keys.add('spider_web');
  if (L.bushes.length) keys.add('berry_bush');
  if (L.egg) { keys.add(L.egg.prop); keys.add(HEROES[L.egg.hero].dragon.key); }
  if (L.exit || L.guardian) keys.add('keeper');
  for (const a of L.animals) keys.add(`friendly_${a.type}`);
  for (const g of L.gates) for (const k of THEME_MODELS[g.theme] || []) keys.add(k);
  for (const k of world.def.models || []) keys.add(k);
  return [...keys];
}

export class Assets {
  constructor() {
    this.loader = new GLTFLoader();
    this.loader.setMeshoptDecoder(MeshoptDecoder);
    this.cache = new Map();          // key -> { scene, clips }
    this.pending = new Map();
    this.failed = new Set();
  }

  has(key) { return this.cache.has(key); }

  async loadOne(key) {
    if (this.cache.has(key)) return this.cache.get(key);
    if (this.pending.has(key)) return this.pending.get(key);
    const url = MODEL_FILES[key];
    const p = new Promise((resolve) => {
      if (!url) { this.failed.add(key); resolve(null); return; }
      this.loader.load(url, (gltf) => {
        gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = true; } });
        const entry = { scene: gltf.scene, clips: gltf.animations || [] };
        this.cache.set(key, entry);
        this.pending.delete(key);
        resolve(entry);
      }, undefined, () => { this.failed.add(key); this.pending.delete(key); console.warn(`Model missing: ${key}`); resolve(null); });
    });
    this.pending.set(key, p);
    return p;
  }

  // Load a list, a few at a time, reporting progress from 0 to 1.
  async load(keys, onProgress) {
    const todo = keys.filter((k) => !this.cache.has(k));
    let done = 0;
    const total = todo.length || 1;
    const queue = todo.slice();
    const worker = async () => {
      while (queue.length) {
        const k = queue.shift();
        await this.loadOne(k);
        done++;
        if (onProgress) onProgress(done / total);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (onProgress) onProgress(1);
  }

  // Forget every model not in `keep`, and free its memory on the graphics card.
  keepOnly(keep) {
    const keepSet = new Set(keep);
    for (const [key, entry] of this.cache) {
      if (keepSet.has(key)) continue;
      disposeTree(entry.scene);
      this.cache.delete(key);
    }
  }

  // A copy of a model, scaled so it stands `height` tall with its feet on the ground.
  instance(key, height, { skinned = false, byWidth = false } = {}) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const clone = skinned ? SkeletonUtils.clone(entry.scene) : entry.scene.clone(true);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(), center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);
    const s = byWidth ? height / Math.max(0.01, size.x, size.z) : height / Math.max(0.01, size.y);
    clone.scale.setScalar(s);
    clone.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    wrapper.userData.model = clone;
    return wrapper;
  }

  clips(key) { const e = this.cache.get(key); return e ? e.clips : []; }
}

// Frees the graphics-card memory of everything under `root`. Loaded models
// keep their data in ordinary memory, so they are simply sent again if drawn again.
export function disposeTree(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of mats) {
      for (const key in m) { const v = m[key]; if (v && v.isTexture) v.dispose(); }
      m.dispose();
    }
    if (obj.isSkinnedMesh && obj.skeleton) obj.skeleton.dispose();
    if (obj.isLight && obj.shadow && obj.shadow.map) obj.shadow.map.dispose();
  });
}
