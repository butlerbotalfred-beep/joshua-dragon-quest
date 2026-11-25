import * as THREE from 'three';

// ============================================================================
// LEVEL 2: TREETOP CANOPY — THE GREEN EGG
// Multi-elevation treetop adventure with 4 unskippable family gift gates:
//   1. Daniel (Fire)     -> Burn tangled overgrowth (l2_gate_overgrowth)
//   2. Michael (Strength)-> Steady heavy timber bridge (l2_gate_bridge)
//   3. Vanessa (Ice)     -> Freeze waterfall into steps (l2_gate_waterfall)
//   4. Joshua (Speed)    -> Make the last long leap (l2_gate_leap)
// Guardian: The Old Vine -> Freed & friendly -> Green Egg (Speedy bonds Joshua)
// ============================================================================

export function buildLevel2(game, def) {
  game.levelMinZ = -415;
  game.levelMaxZ = 16;

  // Helper: wooden deck railings along solid edges so boundaries look cozy & clear
  const addDeckRailings = (x, z, w, d, y, openLeft = false, openRight = false) => {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 0.85 });

    for (const side of [-1, 1]) {
      if (side === -1 && openLeft) continue;
      if (side === 1 && openRight) continue;
      const rx = x + side * (w / 2 - 0.35);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, d), railMat);
      rail.position.set(rx, y + 1.05, z);
      game.worldGroup.add(rail);

      for (let pz = z + d / 2 - 2; pz >= z - d / 2 + 2; pz -= 9) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.35, 6), postMat);
        post.position.set(rx, y + 0.65, pz);
        game.worldGroup.add(post);
        if (Math.abs(Math.round(pz)) % 18 < 9) {
          const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), lanternMat);
          lantern.position.set(rx, y + 1.48, pz);
          game.worldGroup.add(lantern);
        }
      }
    }
  };

  // Giant ancient canopy tree trunks framing the elevated walkways
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.85 });
  const addCanopyTrunks = (zStart, zEnd, step = 22) => {
    for (let z = zStart; z >= zEnd; z -= step) {
      for (const side of [-1, 1]) {
        const tx = side * (16 + Math.abs(Math.sin(z * 0.13)) * 5);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.3, 42, 8), trunkMat);
        trunk.position.set(tx, 6, z);
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5), leafMat);
        crown.position.set(tx, 25, z);
        crown.scale.set(1.25, 0.75, 1.25);
        game.worldGroup.add(trunk, crown);
      }
    }
  };

  // --------------------------------------------------------------------------
  // ZONE 1: CANOPY ENTRANCE (z: +12 -> -66, y = 0)
  // --------------------------------------------------------------------------
  game.addGroundSegment(0, -27, 22, 78, def.biome, 0);
  addDeckRailings(0, -27, 22, 78, 0, false, true);
  // East Lookout Alcove for Gold Berry #1
  game.addGroundSegment(16, -30, 12, 18, def.biome, 0);
  addDeckRailings(16, -30, 12, 18, 0, true, false);

  game.addPeacefulAnimal('owl', -10.5, -12);
  game.addPeacefulAnimal('deer', 15.5, -24);
  game.addPeacefulAnimal('rabbit', -6.5, -42);

  game.addBerryBush(-8.5, -10, 'green', 0);
  game.addBerryBush(8.5, -48, 'red', 0);
  game.addGoldBerry('l2_g1', 18.0, -30, 1.15);

  // First web rescue & playful skirmish
  game.addSpiderWeb(-1.5, -22, 0);
  game.addEnemy('spider', 4.5, -25, 0);
  game.addEnemy('wolf', -4.5, -44, 0);
  game.addEnemy('vine_minion', 3.5, -54, 0);

  // GATE 1: Tangled Overgrowth — Daniel's Fire (z = -66, y = 0)
  game.addObstacle('bramble', 0, -66, 0, {
    gateId: 'l2_gate_overgrowth',
    hintText: 'Let Daniel burn away that tangle.',
    hintDialogueId: 'hint_daniel_fire',
  });

  // --------------------------------------------------------------------------
  // ZONE 2: TIMBER BRIDGE LANDING & SWAYING BRIDGE (z: -66 -> -196, y = 0 -> 2)
  // --------------------------------------------------------------------------
  game.addGroundSegment(0, -90, 22, 48, def.biome, 0);
  addDeckRailings(0, -90, 22, 48, 0);

  game.addBerryBush(-8.5, -88, 'red', 0);
  game.addEnemy('vine_minion', -4.5, -78, 0);
  game.addEnemy('wolf', 4.5, -96, 0);

  // Chasm under Gate 2 swaying bridge (z = -122, d = 16 -> spans -114 to -130)
  const bridgeChasm = game.addChasmZone(0, -122, 22, 16, 'water', {
    y: 0,
    hintText: 'Michael is strong enough for that.',
  });

  // Visual heavy timber bridge + counterweight anchor (rocks tilted until Michael steadies it!)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 1.0, -122);
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.85 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 });
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.65, 17.6), plankMat);
  bridgeDeck.castShadow = true;
  bridgeDeck.receiveShadow = true;
  bridgeGroup.add(bridgeDeck);
  for (const sx of [-5.2, 5.2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 17.6), ropeMat);
    rail.position.set(sx, 0.7, 0);
    bridgeGroup.add(rail);
  }
  bridgeGroup.rotation.z = 0.45; // Tilted sideways until steadied!
  bridgeGroup.rotation.x = Math.atan2(2, 16);
  game.worldGroup.add(bridgeGroup);

  // Counterweight Wheel Anchor on the near landing (z = -112)
  const anchorGroup = new THREE.Group();
  anchorGroup.position.set(0, 0, -112);
  const anchorPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.25, 2.6, 10),
    new THREE.MeshStandardMaterial({ color: 0x6c5ce7, emissive: 0x3c1e70, emissiveIntensity: 0.45, roughness: 0.55 })
  );
  anchorPillar.position.y = 1.3;
  anchorPillar.castShadow = true;
  const anchorRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.85, 24),
    new THREE.MeshBasicMaterial({ color: 0xb76eff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
  );
  anchorRing.rotation.x = -Math.PI / 2;
  anchorRing.position.y = 0.08;
  anchorGroup.add(anchorPillar, anchorRing);
  game.worldGroup.add(anchorGroup);

  // GATE 2: Heavy Swaying Bridge — Michael's Strength
  const bridgeGate = game.addGate({
    id: 'l2_gate_bridge',
    type: 'bridge_hold',
    z: -114,
    // Placed inside the chasm near far edge so wrong heroes fall into gap & never reach far side!
    blockZ: -129.0,
    requiredHeroIdx: 3,
    requiresDragon: false,
    hintText: 'Michael is strong enough for that.',
    hintDialogueId: 'hint_michael_strength',
    chasmZone: bridgeChasm,
    onOpen: () => {
      bridgeGroup.rotation.z = 0;
      bridgeGroup.position.y = 0.65;
      anchorPillar.material.color.setHex(0x2ecc71);
      anchorPillar.material.emissive.setHex(0x1b8a5a);
      anchorRing.material.color.setHex(0x69f0ae);
      // Add smooth walkable slope rising from y=0 (z=-114) to y=2 (z=-130)
      game.slopeZones.push({
        minX: -5.8,
        maxX: 5.8,
        minZ: -130.8,
        maxZ: -113.2,
        baseY: 0,
        topY: 2.0,
        requiresSpeed: false,
      });
      game.spawnParticles(new THREE.Vector3(0, 1.8, -114), 0xb76eff, 32);
      game.spawnFloatingText(new THREE.Vector3(0, 2.8, -114), 'BRIDGE STEADIED!', '#d8b4fe');
      game.audio.sfxSmash();
      game.showAlert('Michael steadied the bridge!', 2.4);
    },
  });
  game.levelAnimators = game.levelAnimators || [];
  game.levelAnimators.push((t) => {
    if (!bridgeGate.opened) {
      bridgeGroup.rotation.z = 0.42 + Math.sin(t * 2.6) * 0.16;
    }
  });

  // Cascade Overlook Deck (z: -130 -> -206, y = 2)
  game.addGroundSegment(0, -168, 22, 76, def.biome, 2.0);
  addDeckRailings(0, -168, 22, 76, 2.0, true, false);
  // West Canopy Branch Deck with Michael's Rune Push-Block puzzle -> Gold Berry #2!
  game.addGroundSegment(-17, -166, 14, 22, def.biome, 2.0);
  addDeckRailings(-17, -166, 14, 22, 2.0, false, true);
  game.addPushSwitchPuzzle(-14.5, -161, -19.5, -169, 'l2_g2', -16.5, -169, 2.0);

  game.addPeacefulAnimal('owl', 11.5, -148);
  game.addPeacefulAnimal('deer', -16.5, -158);
  game.addBerryBush(8.5, -154, 'green', 2.0);
  game.addBerryBush(-8.5, -186, 'red', 2.0);

  game.addSpiderWeb(1.5, -148, 2.0);
  game.addEnemy('spider', -5.0, -152, 2.0);
  game.addEnemy('vine_minion', 4.5, -172, 2.0);
  game.addEnemy('wolf', -3.5, -190, 2.0);

  // --------------------------------------------------------------------------
  // ZONE 3: CASCADING WATERFALL -> UPPER CANOPY (z: -206 -> -298, y = 2 -> 8)
  // --------------------------------------------------------------------------
  // Cliff wall & flowing waterfall sheet from z = -206 (y = 2) to z = -226 (y = 8)
  const cliffWall = new THREE.Mesh(
    new THREE.BoxGeometry(26, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x3b5e3c, roughness: 0.92 })
  );
  cliffWall.position.set(0, 4.0, -216);
  game.worldGroup.add(cliffWall);

  const waterTex = game.textures.getWaterTexture('water');
  const waterfallMat = new THREE.MeshStandardMaterial({
    map: waterTex,
    color: 0x4fc3f7,
    emissive: 0x0277bd,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.88,
    roughness: 0.15,
  });
  const waterfallSheet = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.8, 22.0), waterfallMat);
  waterfallSheet.position.set(0, 5.1, -216);
  waterfallSheet.rotation.x = Math.atan2(6.0, 20.0);
  game.worldGroup.add(waterfallSheet);

  // Frozen ice steps group (hidden until Vanessa freezes the waterfall!)
  const iceStepsGroup = new THREE.Group();
  const iceStepMat = new THREE.MeshStandardMaterial({
    color: 0xb3f3ff,
    emissive: 0x29b6f6,
    emissiveIntensity: 0.42,
    roughness: 0.12,
    transparent: true,
    opacity: 0.94,
  });
  for (let s = 0; s < 10; s++) {
    const t = (s + 0.5) / 10;
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.7, 2.2), iceStepMat);
    stepMesh.position.set(0, 2.0 + t * 6.0 - 0.15, -206 - t * 20.0);
    stepMesh.receiveShadow = true;
    iceStepsGroup.add(stepMesh);
  }
  iceStepsGroup.visible = false;
  game.worldGroup.add(iceStepsGroup);

  // GATE 3: Cascading Waterfall — Vanessa's Ice (z = -206 -> -226, y = 2 -> 8)
  game.addGate({
    id: 'l2_gate_waterfall',
    type: 'waterfall_freeze',
    z: -206,
    blockZ: -204.5,
    requiredHeroIdx: 2,
    requiresDragon: false,
    hintText: 'Vanessa can freeze a path here.',
    hintDialogueId: 'hint_vanessa_ice',
    onOpen: () => {
      waterfallSheet.visible = false;
      iceStepsGroup.visible = true;
      game.slopeZones.push({
        minX: -5.6,
        maxX: 5.6,
        minZ: -226.8,
        maxZ: -205.2,
        baseY: 2.0,
        topY: 8.0,
        requiresSpeed: false,
      });
      game.spawnParticles(new THREE.Vector3(0, 5.2, -210), 0x80e8ff, 36);
      game.spawnFloatingText(new THREE.Vector3(0, 5.5, -208), 'FROZEN STEPS!', '#80e8ff');
      game.audio.sfxBridge();
      game.showAlert('Vanessa froze waterfall steps!', 2.4);
    },
  });

  // Upper Canopy Approach (z: -226 -> -298, y = 8)
  game.addGroundSegment(0, -262, 22, 72, def.biome, 8.0);
  addDeckRailings(0, -262, 22, 72, 8.0);

  game.addPeacefulAnimal('owl', -10.5, -242);
  game.addPeacefulAnimal('rabbit', 7.5, -250);
  game.addBerryBush(-8.5, -244, 'red', 8.0);
  game.addBerryBush(8.5, -276, 'green', 8.0);

  game.addEnemy('vine_minion', -4.0, -240, 8.0);
  game.addSpiderWeb(0, -258, 8.0);
  game.addEnemy('spider', 5.0, -260, 8.0);
  game.addEnemy('wolf', -4.5, -278, 8.0);
  game.addEnemy('vine_minion', 4.0, -286, 8.0);

  // --------------------------------------------------------------------------
  // ZONE 4: THE LAST LONG LEAP -> OLD VINE ARENA & GREEN EGG (z: -298 -> -408, y = 8)
  // --------------------------------------------------------------------------
  const leapChasm = game.addChasmZone(0, -308, 22, 20, 'water', {
    y: 8.0,
    hintText: 'Joshua is fast enough to make it.',
  });

  // Glowing emerald speed-runway arrows at launch edge (z = -294, y = 8)
  const padMat = new THREE.MeshBasicMaterial({ color: 0x39e58c, side: THREE.DoubleSide, transparent: true, opacity: 0.82 });
  for (let i = 0; i < 3; i++) {
    const chevron = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), padMat);
    chevron.rotation.x = -Math.PI / 2;
    chevron.position.set(0, 8.06, -291 - i * 2.4);
    game.worldGroup.add(chevron);
  }

  // Hanging vine-plank walkway (unrolls after Joshua makes the long leap!)
  const vineWalkway = new THREE.Mesh(
    new THREE.BoxGeometry(10.0, 0.55, 21.5),
    new THREE.MeshStandardMaterial({ color: 0x558b2f, emissive: 0x1b5e20, emissiveIntensity: 0.25, roughness: 0.8 })
  );
  vineWalkway.position.set(0, 7.75, -308);
  vineWalkway.receiveShadow = true;
  vineWalkway.visible = false;
  game.worldGroup.add(vineWalkway);

  // GATE 4: The Last Long Leap — Joshua's Speed (z = -298 -> -318, y = 8)
  game.addGate({
    id: 'l2_gate_leap',
    type: 'speed_leap',
    z: -298,
    // Placed inside chasm near far edge so wrong heroes fall into gap & never cross!
    blockZ: -317.0,
    requiredHeroIdx: 0,
    requiresDragon: false,
    hintText: 'Joshua is fast enough to make it.',
    hintDialogueId: 'hint_joshua_speed',
    chasmZone: leapChasm,
    onOpen: () => {
      vineWalkway.visible = true;
      game.platforms.push({
        minX: -5.2,
        maxX: 5.2,
        minZ: -319.0,
        maxZ: -297.0,
        topY: 8.0,
      });
      const joshua = game.heroes[0];
      if (joshua && joshua.pos.z > -320) {
        joshua.pos.set(0, 8.0, -321);
        joshua.lastSafePos.set(0, 8.0, -321);
        joshua.vel.set(0, 0, 0);
        joshua.onGround = true;
      }
      game.spawnParticles(new THREE.Vector3(0, 9.2, -308), 0x39e58c, 36);
      game.spawnFloatingText(new THREE.Vector3(0, 10.5, -318), 'SPEED LEAP!', '#6effa1');
      game.audio.sfxSpeed();
      game.showAlert('Joshua leapt across and dropped a bridge!', 2.6);
    },
  });

  // ZONE 5: THE OLD VINE'S SUNLIT ARENA & GREEN EGG NEST (z: -318 -> -406, y = 8)
  game.addGroundSegment(0, -362, 34, 88, def.biome, 8.0);
  addDeckRailings(0, -362, 34, 88, 8.0);

  game.addBerryBush(-13.5, -342, 'red', 8.0);
  game.addBerryBush(13.5, -342, 'green', 8.0);
  game.addGoldBerry('l2_g3', -12.5, -394, 9.2);

  // Guardian: The Old Vine
  game.addBoss(def.bossType, 'THE OLD VINE', 0, -362, 8.0);

  // Woven Nest pedestal + Glowing Green Egg at the end of the canopy!
  const nestRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.42, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.95 })
  );
  nestRing.rotation.x = Math.PI / 2;
  nestRing.position.set(0, 8.32, -396);
  game.worldGroup.add(nestRing);
  game.spawnDragonEgg(def.eggPropKey, 0x39e58c, 0, -396, 8.15);

  // Framing canopy trunks & stylized pines along the full length
  addCanopyTrunks(10, -405, 24);
  const trees = [];
  for (let z = 6; z >= -395; z -= 26) {
    trees.push([-18.5, z, 1.5], [18.5, z, 1.5]);
  }
  game.addStylizedTrees(trees);
}
