# Rocket Vehicle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players construct rockets from blocks and pilot the entire structure as a fused vehicle that moves through the world.

**Architecture:** Pure logic (flood fill, validation, weight/thrust math) lives in `RocketLogic.js` so it can be unit-tested without Three.js. `RocketVehicle.js` owns the Three.js mesh and flight physics. `RocketInteraction.js` handles proximity detection. `main.js` wires pilot mode into the game loop.

**Tech Stack:** Three.js 0.163, Vanilla JS ES modules, Vitest 1.5

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/world/BlockRegistry.js` | Modify | Add THRUSTER (13), COMMAND_PANEL (14), CAPSULE (15); add `weight` to all BLOCK_DATA entries |
| `src/systems/RocketLogic.js` | Create | `BUILDABLE_BLOCKS`, `floodFillRocket`, `validateRocket` — pure, no Three.js |
| `src/systems/RocketVehicle.js` | Create | Three.js mesh construction, flight physics `update()`, `dispose()` |
| `src/systems/RocketInteraction.js` | Create | Proximity check for CAPSULE/COMMAND_PANEL, HUD prompt |
| `src/main.js` | Modify | Import new systems; `_pilotMode`, `_rocketVehicle`, `_rocketInteraction`; `_tryLaunchRocket`, `_exitPilotMode`, `_updateCameraPilot`; pilot branch in `_loop`; F/ESC handling |
| `tests/world/BlockRegistry.test.js` | Modify | Add weight/thrust assertions |
| `tests/systems/RocketLogic.test.js` | Create | Flood fill and validation unit tests |
| `tests/systems/RocketInteraction.test.js` | Create | Proximity detection unit tests |

---

## Task 1: BlockRegistry — new blocks + weight property

**Files:**
- Modify: `src/world/BlockRegistry.js`
- Modify: `tests/world/BlockRegistry.test.js`

- [ ] **Step 1: Write failing tests**

Add to `tests/world/BlockRegistry.test.js`:

```js
it('THRUSTER is block 13 with thrust 15', () => {
  expect(BLOCKS.THRUSTER).toBe(13);
  expect(BLOCK_DATA[BLOCKS.THRUSTER].thrust).toBe(15);
});

it('COMMAND_PANEL is block 14 with thrust 0', () => {
  expect(BLOCKS.COMMAND_PANEL).toBe(14);
  expect(BLOCK_DATA[BLOCKS.COMMAND_PANEL].thrust).toBe(0);
});

it('CAPSULE is block 15 with thrust 0', () => {
  expect(BLOCKS.CAPSULE).toBe(15);
  expect(BLOCK_DATA[BLOCKS.CAPSULE].thrust).toBe(0);
});

it('all blocks have a numeric weight >= 0', () => {
  Object.values(BLOCK_DATA).forEach(data => {
    expect(typeof data.weight).toBe('number');
    expect(data.weight).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/world/BlockRegistry.test.js
```

Expected: 4 failures about THRUSTER/COMMAND_PANEL/CAPSULE/weight not found.

- [ ] **Step 3: Add new blocks to BlockRegistry**

Replace the entire content of `src/world/BlockRegistry.js`:

```js
export const BLOCKS = {
  AIR:              0,
  REGOLITH:         1,
  IRON_ORE:         2,
  SILICON_CRYSTAL:  3,
  TITANIUM_ORE:     4,
  ICE_BLOCK:        5,
  QUANTUM_CRYSTAL:  6,
  STEEL_BLOCK:      7,
  SOLAR_PANEL:      8,
  OXYGEN_GENERATOR: 9,
  REACTOR_CORE:     10,
  LAUNCH_PAD:       11,
  COMPUTER_BLOCK:   12,
  THRUSTER:         13,
  COMMAND_PANEL:    14,
  CAPSULE:          15,
};

export const BLOCK_DATA = {
  [BLOCKS.AIR]:              { name: 'Air',               solid: false, color: 0x000000, hardness: 0,  weight: 0, thrust: 0  },
  [BLOCKS.REGOLITH]:         { name: 'Regolith',          solid: true,  color: 0x8a7a6a, hardness: 1,  weight: 1, thrust: 0  },
  [BLOCKS.IRON_ORE]:         { name: 'Iron Ore',          solid: true,  color: 0x8b6f5e, hardness: 3,  weight: 2, thrust: 0  },
  [BLOCKS.SILICON_CRYSTAL]:  { name: 'Silicon Crystal',   solid: true,  color: 0x6090a0, hardness: 2,  weight: 2, thrust: 0  },
  [BLOCKS.TITANIUM_ORE]:     { name: 'Titanium Ore',      solid: true,  color: 0x7090b0, hardness: 4,  weight: 3, thrust: 0  },
  [BLOCKS.ICE_BLOCK]:        { name: 'Ice Block',         solid: true,  color: 0xa0d0f0, hardness: 1,  weight: 1, thrust: 0  },
  [BLOCKS.QUANTUM_CRYSTAL]:  { name: 'Quantum Crystal',   solid: true,  color: 0x8040ff, hardness: 5,  weight: 3, thrust: 0  },
  [BLOCKS.STEEL_BLOCK]:      { name: 'Steel Block',       solid: true,  color: 0x708090, hardness: 3,  weight: 3, thrust: 0  },
  [BLOCKS.SOLAR_PANEL]:      { name: 'Solar Panel',       solid: true,  color: 0x1040c0, hardness: 2,  weight: 2, thrust: 0  },
  [BLOCKS.OXYGEN_GENERATOR]: { name: 'Oxygen Generator',  solid: true,  color: 0x40a0ff, hardness: 3,  weight: 3, thrust: 0  },
  [BLOCKS.REACTOR_CORE]:     { name: 'Reactor Core',      solid: true,  color: 0xff6020, hardness: 5,  weight: 5, thrust: 0  },
  [BLOCKS.LAUNCH_PAD]:       { name: 'Launch Pad',        solid: true,  color: 0x505060, hardness: 4,  weight: 4, thrust: 0  },
  [BLOCKS.COMPUTER_BLOCK]:   { name: 'Computer Block',    solid: true,  color: 0x204060, hardness: 2,  weight: 2, thrust: 0  },
  [BLOCKS.THRUSTER]:         { name: 'Thruster',          solid: true,  color: 0xff4400, hardness: 3,  weight: 3, thrust: 15 },
  [BLOCKS.COMMAND_PANEL]:    { name: 'Command Panel',     solid: true,  color: 0x00cc44, hardness: 2,  weight: 4, thrust: 0  },
  [BLOCKS.CAPSULE]:          { name: 'Capsule',           solid: true,  color: 0x44aaff, hardness: 3,  weight: 5, thrust: 0  },
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- tests/world/BlockRegistry.test.js
```

Expected: all pass.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
npm test
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/world/BlockRegistry.js tests/world/BlockRegistry.test.js
git commit -m "feat: add THRUSTER, COMMAND_PANEL, CAPSULE blocks with weight/thrust"
```

---

## Task 2: RocketLogic — flood fill and validation

**Files:**
- Create: `src/systems/RocketLogic.js`
- Create: `tests/systems/RocketLogic.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/systems/RocketLogic.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { BLOCKS } from '../../src/world/BlockRegistry.js';
import { floodFillRocket, validateRocket, BUILDABLE_BLOCKS } from '../../src/systems/RocketLogic.js';

function makeWorld(blockMap) {
  return { getBlock: (x, y, z) => blockMap[`${x},${y},${z}`] ?? BLOCKS.AIR };
}

describe('floodFillRocket', () => {
  it('returns single starting block', () => {
    const world = makeWorld({ '0,0,0': BLOCKS.CAPSULE });
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ x: 0, y: 0, z: 0, blockId: BLOCKS.CAPSULE });
  });

  it('collects all connected buildable blocks', () => {
    const world = makeWorld({
      '0,0,0': BLOCKS.CAPSULE,
      '1,0,0': BLOCKS.THRUSTER,
      '0,1,0': BLOCKS.COMMAND_PANEL,
    });
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(3);
  });

  it('does not cross natural blocks (REGOLITH)', () => {
    const world = makeWorld({
      '0,0,0': BLOCKS.CAPSULE,
      '1,0,0': BLOCKS.REGOLITH,   // natural — stops here
      '2,0,0': BLOCKS.THRUSTER,   // unreachable
    });
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(1);
  });

  it('respects 512-block limit', () => {
    const blockMap = {};
    for (let i = 0; i < 600; i++) blockMap[`${i},0,0`] = BLOCKS.STEEL_BLOCK;
    const world = makeWorld(blockMap);
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result.length).toBeLessThanOrEqual(512);
  });

  it('returns empty array when starting block is AIR', () => {
    const world = makeWorld({});
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(0);
  });
});

describe('validateRocket', () => {
  it('returns valid for capsule + thruster combo with enough thrust', () => {
    // 1 CAPSULE (w:5) + 2 THRUSTERs (w:3 each, thrust:15 each) = weight:11, thrust:30 >= 13.2
    const blocks = [
      { blockId: BLOCKS.CAPSULE },
      { blockId: BLOCKS.THRUSTER },
      { blockId: BLOCKS.THRUSTER },
    ];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when no capsule', () => {
    const blocks = [
      { blockId: BLOCKS.THRUSTER },
      { blockId: BLOCKS.THRUSTER },
    ];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(false);
    expect(result.hasCapsule).toBe(false);
  });

  it('returns invalid when no thruster', () => {
    const blocks = [{ blockId: BLOCKS.CAPSULE }];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(false);
    expect(result.hasThruster).toBe(false);
  });

  it('returns invalid when thrust too low for weight', () => {
    // 1 CAPSULE(5) + 10 REACTOR_CORE(5 each) + 1 THRUSTER(thrust:15) = weight:60, thrust:15 < 72
    const blocks = [
      { blockId: BLOCKS.CAPSULE },
      ...Array(10).fill({ blockId: BLOCKS.REACTOR_CORE }),
      { blockId: BLOCKS.THRUSTER },
    ];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(false);
  });

  it('exposes totalWeight, totalThrust, needed', () => {
    const blocks = [{ blockId: BLOCKS.CAPSULE }, { blockId: BLOCKS.THRUSTER }];
    const result = validateRocket(blocks);
    expect(result.totalWeight).toBe(8);  // 5 + 3
    expect(result.totalThrust).toBe(15);
    expect(typeof result.needed).toBe('number');
  });
});

describe('BUILDABLE_BLOCKS', () => {
  it('includes THRUSTER, CAPSULE, COMMAND_PANEL', () => {
    expect(BUILDABLE_BLOCKS.has(BLOCKS.THRUSTER)).toBe(true);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.CAPSULE)).toBe(true);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.COMMAND_PANEL)).toBe(true);
  });

  it('excludes natural blocks', () => {
    expect(BUILDABLE_BLOCKS.has(BLOCKS.REGOLITH)).toBe(false);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.IRON_ORE)).toBe(false);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.ICE_BLOCK)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/systems/RocketLogic.test.js
```

Expected: module not found error for `RocketLogic.js`.

- [ ] **Step 3: Create RocketLogic.js**

Create `src/systems/RocketLogic.js`:

```js
import { BLOCKS, BLOCK_DATA } from '../world/BlockRegistry.js';

/**
 * Blocks that can be part of a rocket structure.
 * Natural terrain blocks are excluded so the flood fill
 * doesn't absorb the ground.
 */
export const BUILDABLE_BLOCKS = new Set([
  BLOCKS.STEEL_BLOCK,
  BLOCKS.SOLAR_PANEL,
  BLOCKS.OXYGEN_GENERATOR,
  BLOCKS.REACTOR_CORE,
  BLOCKS.LAUNCH_PAD,
  BLOCKS.COMPUTER_BLOCK,
  BLOCKS.QUANTUM_CRYSTAL,
  BLOCKS.THRUSTER,
  BLOCKS.COMMAND_PANEL,
  BLOCKS.CAPSULE,
]);

const DIRECTIONS = [
  [1,0,0],[-1,0,0],
  [0,1,0],[0,-1,0],
  [0,0,1],[0,0,-1],
];

/**
 * BFS from (startX, startY, startZ) collecting all connected
 * buildable blocks. Max 512 blocks.
 * @param {{ getBlock(x,y,z): number }} world
 * @returns {{ x, y, z, blockId }[]}
 */
export function floodFillRocket(world, startX, startY, startZ) {
  const startId = world.getBlock(startX, startY, startZ);
  if (!BUILDABLE_BLOCKS.has(startId)) return [];

  const visited = new Set();
  const blocks = [];
  const queue = [[startX, startY, startZ]];
  const key = (x, y, z) => `${x},${y},${z}`;

  visited.add(key(startX, startY, startZ));

  while (queue.length > 0 && blocks.length < 512) {
    const [x, y, z] = queue.shift();
    const blockId = world.getBlock(x, y, z);
    if (!BUILDABLE_BLOCKS.has(blockId)) continue;

    blocks.push({ x, y, z, blockId });

    for (const [dx, dy, dz] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      const nk = key(nx, ny, nz);
      if (!visited.has(nk)) {
        visited.add(nk);
        queue.push([nx, ny, nz]);
      }
    }
  }

  return blocks;
}

/**
 * Validates that a set of blocks forms a launchable rocket.
 * Condition: hasCapsule && hasThruster && totalThrust >= totalWeight * 1.2
 * @param {{ blockId: number }[]} blocks
 * @returns {{ valid, hasCapsule, hasThruster, totalWeight, totalThrust, needed }}
 */
export function validateRocket(blocks) {
  let totalWeight = 0;
  let totalThrust = 0;
  let hasCapsule = false;
  let hasThruster = false;

  for (const { blockId } of blocks) {
    const data = BLOCK_DATA[blockId];
    if (!data) continue;
    totalWeight += data.weight ?? 1;
    totalThrust += data.thrust ?? 0;
    if (blockId === BLOCKS.CAPSULE) hasCapsule = true;
    if (blockId === BLOCKS.THRUSTER) hasThruster = true;
  }

  const needed = totalWeight * 1.2;
  const valid = hasCapsule && hasThruster && totalThrust >= needed;

  return { valid, hasCapsule, hasThruster, totalWeight, totalThrust, needed };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- tests/systems/RocketLogic.test.js
```

Expected: all 13 tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/systems/RocketLogic.js tests/systems/RocketLogic.test.js
git commit -m "feat: add RocketLogic with flood fill and validation"
```

---

## Task 3: RocketInteraction — proximity detection

**Files:**
- Create: `src/systems/RocketInteraction.js`
- Create: `tests/systems/RocketInteraction.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/systems/RocketInteraction.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { BLOCKS } from '../../src/world/BlockRegistry.js';
import { RocketInteraction } from '../../src/systems/RocketInteraction.js';

function makeWorld(blockMap) {
  return { getBlock: (x, y, z) => blockMap[`${x},${y},${z}`] ?? BLOCKS.AIR };
}

function makePlayer(px, py, pz) {
  return {
    getEyePosition: () => ({ x: px, y: py + 1.6, z: pz }),
  };
}

describe('RocketInteraction', () => {
  it('returns null when no capsule or command panel nearby', () => {
    const world = makeWorld({ '10,5,10': BLOCKS.REGOLITH });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).toBeNull();
  });

  it('detects capsule within 4 blocks', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.CAPSULE });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).not.toBeNull();
    expect(result.blockId).toBe(BLOCKS.CAPSULE);
  });

  it('detects command panel within 4 blocks', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.COMMAND_PANEL });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).not.toBeNull();
    expect(result.blockId).toBe(BLOCKS.COMMAND_PANEL);
  });

  it('returns null when capsule is farther than 4 blocks', () => {
    const world = makeWorld({ '10,0,0': BLOCKS.CAPSULE });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).toBeNull();
  });

  it('getPrompt returns pilotar for capsule', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.CAPSULE });
    const ri = new RocketInteraction(world);
    expect(ri.getPrompt(makePlayer(0, 0, 0))).toContain('pilotar');
  });

  it('getPrompt returns activar for command panel', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.COMMAND_PANEL });
    const ri = new RocketInteraction(world);
    expect(ri.getPrompt(makePlayer(0, 0, 0))).toContain('activar');
  });

  it('getPrompt returns null when nothing nearby', () => {
    const world = makeWorld({});
    const ri = new RocketInteraction(world);
    expect(ri.getPrompt(makePlayer(0, 0, 0))).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/systems/RocketInteraction.test.js
```

Expected: module not found.

- [ ] **Step 3: Create RocketInteraction.js**

Create `src/systems/RocketInteraction.js`:

```js
import { BLOCKS } from '../world/BlockRegistry.js';

const INTERACT_DISTANCE = 4;
const INTERACT_BLOCKS = new Set([BLOCKS.CAPSULE, BLOCKS.COMMAND_PANEL]);

export class RocketInteraction {
  constructor(world) {
    this._world = world;
  }

  /**
   * Check if player is within reach of a CAPSULE or COMMAND_PANEL.
   * Scans a 5×6×5 volume around the player.
   * @returns {{ canInteract, blockX, blockY, blockZ, blockId } | null}
   */
  check(player) {
    const eye = player.getEyePosition();
    const px = Math.round(eye.x);
    const py = Math.round(eye.y - 0.8);
    const pz = Math.round(eye.z);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 3; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          const bx = px + dx, by = py + dy, bz = pz + dz;
          const blockId = this._world.getBlock(bx, by, bz);
          if (!INTERACT_BLOCKS.has(blockId)) continue;

          const dist = Math.sqrt(
            (bx + 0.5 - eye.x) ** 2 +
            (by + 0.5 - eye.y) ** 2 +
            (bz + 0.5 - eye.z) ** 2
          );
          if (dist <= INTERACT_DISTANCE) {
            return { canInteract: true, blockX: bx, blockY: by, blockZ: bz, blockId };
          }
        }
      }
    }
    return null;
  }

  /** Returns HUD prompt string or null. */
  getPrompt(player) {
    const result = this.check(player);
    if (!result) return null;
    return result.blockId === BLOCKS.CAPSULE
      ? 'F pilotar cohete'
      : 'F activar lanzamiento';
  }

  /** Call after travelTo so the new world is searched. */
  setWorld(world) {
    this._world = world;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- tests/systems/RocketInteraction.test.js
```

Expected: all 7 tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/systems/RocketInteraction.js tests/systems/RocketInteraction.test.js
git commit -m "feat: add RocketInteraction proximity detection"
```

---

## Task 4: RocketVehicle — mesh, physics, pilot mode

**Files:**
- Create: `src/systems/RocketVehicle.js`

No unit tests for this file — it depends on Three.js which requires a browser DOM. It is integration-tested when you run the game in Task 5.

- [ ] **Step 1: Create RocketVehicle.js**

Create `src/systems/RocketVehicle.js`:

```js
import * as THREE from 'three';
import { BLOCK_DATA } from '../world/BlockRegistry.js';
import { validateRocket } from './RocketLogic.js';

export class RocketVehicle {
  /**
   * @param {THREE.Scene} scene
   * @param {{ x, y, z, blockId }[]} blocks  — already removed from world
   * @param {((blockId: number) => number) | null} getColor
   */
  constructor(scene, blocks, getColor = null) {
    this._scene = scene;
    this.blocks = blocks;

    // Center of mass
    let cx = 0, cy = 0, cz = 0;
    for (const b of blocks) { cx += b.x; cy += b.y; cz += b.z; }
    cx /= blocks.length;
    cy /= blocks.length;
    cz /= blocks.length;

    this.position = { x: cx, y: cy, z: cz };
    this.yaw = 0;
    this.velocity = { x: 0, y: 0, z: 0 };

    const v = validateRocket(blocks);
    this.thrustPower = v.totalThrust;
    this.totalWeight = v.totalWeight;

    // Build mesh: one BoxGeometry per block, grouped
    this.group = new THREE.Group();
    this.group.position.set(cx, cy, cz);

    for (const b of blocks) {
      const colorNum = getColor
        ? getColor(b.blockId)
        : (BLOCK_DATA[b.blockId]?.color ?? 0x888888);
      const r = ((colorNum >> 16) & 0xff) / 255;
      const g = ((colorNum >> 8)  & 0xff) / 255;
      const bl = (colorNum        & 0xff) / 255;

      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, bl) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x - cx, b.y - cy, b.z - cz);
      this.group.add(mesh);
    }

    scene.add(this.group);
  }

  /**
   * Returns world-space point above center of mass for camera tracking.
   */
  getEyePosition() {
    return {
      x: this.position.x,
      y: this.position.y + 2,
      z: this.position.z,
    };
  }

  /**
   * Flight physics. Call every frame while in pilot mode.
   * @param {number} dt  seconds
   * @param {Record<string,boolean>} keys  player._keys
   * @param {number} gravityScale  from current planet
   */
  update(dt, keys, gravityScale = 1) {
    const ratio = this.thrustPower / this.totalWeight;
    const accel = ratio * 8;
    const maxSpeed = ratio * 12;

    // Yaw steering
    if (keys['KeyA']) this.yaw += 1.5 * dt;
    if (keys['KeyD']) this.yaw -= 1.5 * dt;

    const fwdX = Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);

    // Horizontal thrust
    if (keys['KeyW']) {
      this.velocity.x += fwdX * accel * dt;
      this.velocity.z += fwdZ * accel * dt;
    }
    if (keys['KeyS']) {
      this.velocity.x -= fwdX * accel * dt;
      this.velocity.z -= fwdZ * accel * dt;
    }

    // Vertical thrust
    if (keys['Space'])      this.velocity.y += accel * dt;
    if (keys['ShiftLeft'])  this.velocity.y -= accel * dt;

    // Gravity (suppressed while pressing Space)
    if (!keys['Space']) this.velocity.y -= 9.8 * gravityScale * dt;

    // Horizontal drag
    const drag = Math.pow(0.88, dt * 60);
    this.velocity.x *= drag;
    this.velocity.z *= drag;

    // Speed clamp
    const spd = Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
    if (spd > maxSpeed) {
      const s = maxSpeed / spd;
      this.velocity.x *= s;
      this.velocity.y *= s;
      this.velocity.z *= s;
    }

    // Integrate
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Floor clamp
    if (this.position.y < 1) {
      this.position.y = 1;
      this.velocity.y = 0;
    }

    // Sync mesh
    this.group.position.set(this.position.x, this.position.y, this.position.z);
    this.group.rotation.y = this.yaw;
  }

  /** Remove mesh from scene and free GPU memory. */
  dispose() {
    this._scene.remove(this.group);
    this.group.traverse(child => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
  }
}
```

- [ ] **Step 2: Run full test suite (no new tests, verify no regressions)**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/systems/RocketVehicle.js
git commit -m "feat: add RocketVehicle with mesh building and flight physics"
```

---

## Task 5: Wire pilot mode into main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Add imports at top of main.js**

After the existing imports, add:

```js
import { RocketVehicle }     from './systems/RocketVehicle.js';
import { RocketInteraction } from './systems/RocketInteraction.js';
import { floodFillRocket, validateRocket } from './systems/RocketLogic.js';
```

- [ ] **Step 2: Add pilot-mode state to Game constructor**

Inside the `Game` constructor, after `this._travel = new TravelSystem(...)`:

```js
this._rocketVehicle    = null;
this._pilotMode        = false;
this._rocketInteraction = new RocketInteraction(this._world);
```

- [ ] **Step 3: Add THRUSTER, COMMAND_PANEL, CAPSULE to CREATIVE_BLOCKS**

Replace the `CREATIVE_BLOCKS` array (lines ~23-36) with:

```js
const CREATIVE_BLOCKS = [
  BLOCKS.REGOLITH,
  BLOCKS.STEEL_BLOCK,
  BLOCKS.SOLAR_PANEL,
  BLOCKS.OXYGEN_GENERATOR,
  BLOCKS.REACTOR_CORE,
  BLOCKS.LAUNCH_PAD,
  BLOCKS.COMPUTER_BLOCK,
  BLOCKS.ICE_BLOCK,
  BLOCKS.QUANTUM_CRYSTAL,
  BLOCKS.IRON_ORE,
  BLOCKS.SILICON_CRYSTAL,
  BLOCKS.TITANIUM_ORE,
  BLOCKS.THRUSTER,
  BLOCKS.COMMAND_PANEL,
  BLOCKS.CAPSULE,
];
```

- [ ] **Step 4: Add _tryLaunchRocket and _exitPilotMode methods**

Add before the `_bindInput()` method:

```js
_tryLaunchRocket({ blockX, blockY, blockZ }) {
  const blocks = floodFillRocket(this._world, blockX, blockY, blockZ);
  const result = validateRocket(blocks);

  if (!result.valid) {
    let msg;
    if (!result.hasCapsule)   msg = 'Falta bloque Cápsula en la nave';
    else if (!result.hasThruster) msg = 'Falta al menos un Propulsor';
    else {
      const extra = Math.ceil((result.needed - result.totalThrust) / 15);
      msg = `Faltan propulsores: agregá ${extra} más`;
    }
    this._hud.setInteractionPrompt(msg);
    setTimeout(() => this._hud.setInteractionPrompt(null), 3000);
    return;
  }

  // Remove blocks from world
  for (const b of blocks) {
    this._world.setBlock(b.x, b.y, b.z, BLOCKS.AIR);
  }

  this._rocketVehicle = new RocketVehicle(
    this._renderer.scene,
    blocks,
    (id) => this._adminSettings.getColor(id)
  );
  this._pilotMode = true;

  if (document.pointerLockElement) document.exitPointerLock();
  setTimeout(() => this._requestLock(), 150);
}

_exitPilotMode() {
  if (!this._rocketVehicle) return;

  // Move player to rocket's last position so they don't fall through the world
  this._player.position.x = this._rocketVehicle.position.x;
  this._player.position.y = this._rocketVehicle.position.y + 1;
  this._player.position.z = this._rocketVehicle.position.z;
  this._player.velocity   = { x: 0, y: 0, z: 0 };

  this._rocketVehicle.dispose();
  this._rocketVehicle = null;
  this._pilotMode     = false;
}

_updateCameraPilot() {
  const veh = this._rocketVehicle;
  const behindX = veh.position.x - Math.sin(veh.yaw) * 10;
  const behindZ = veh.position.z + Math.cos(veh.yaw) * 10;
  const camY    = veh.position.y + 4;

  this._renderer.camera.position.set(behindX, camY, behindZ);
  this._renderer.camera.lookAt(
    veh.position.x,
    veh.position.y + 1,
    veh.position.z
  );
}
```

- [ ] **Step 5: Update F-key handler in _bindInput**

Replace the `KeyF` block inside `_bindInput`:

```js
if (e.code === 'KeyF') {
  if (this._pilotMode && this._rocketVehicle) {
    // In pilot mode: travel if high enough
    if (this._rocketVehicle.position.y >= 20) {
      this._openTravelMap();
    }
  } else if (!this._travelMapOpen) {
    if (this._travel.canInteract(this._player)) {
      this._openTravelMap();
    } else {
      const rocketHit = this._rocketInteraction.check(this._player);
      if (rocketHit) this._tryLaunchRocket(rocketHit);
    }
  }
}
```

- [ ] **Step 6: Update ESC handler to exit pilot mode first**

Replace the `Escape` block inside `_bindInput`:

```js
if (e.code === 'Escape') {
  if (this._pilotMode) {
    this._exitPilotMode();
  } else if (this._travelMapOpen) {
    this.closeTravelMap(false);
  } else if (this._pauseMenu.isOpen()) {
    this._pauseMenu.close();
  } else {
    this._pauseMenu.open();
  }
}
```

- [ ] **Step 7: Add pilot branch at start of _loop**

At the very start of `_loop`, before the existing `const isInspector` line, add:

```js
// ── Pilot mode: rocket vehicle drives the frame ──────────────────────
if (this._pilotMode && this._rocketVehicle) {
  this._rocketVehicle.update(dt, this._player._keys, this.currentPlanet.gravityScale);
  this._updateCameraPilot();
  this._renderer.updateDayNight(dt);
  this._survival.update(dt, this._renderer.getDayProgress(), {
    paused: this.mode !== 'survival',
  });
  this._hud.setSurvivalStats(
    this._survival.getOxygen(),
    this._survival.getEnergy(),
    this._survival.getTemperature(),
    this._survival.getHealth()
  );
  this._hud.updateFPS(dt);
  this._hud.setMiningProgress(0);
  const altitude = this._rocketVehicle.position.y;
  this._hud.setInteractionPrompt(altitude >= 20 ? 'F → viajar al espacio' : null);
  this._loadChunks();
  this._updateChunkMeshes();
  this._hud.draw();
  this._renderer.render();
  requestAnimationFrame(t => this._loop(t));
  return;
}
// ─────────────────────────────────────────────────────────────────────
```

- [ ] **Step 8: Update _updateInteractionPrompt to show rocket prompt**

Replace the body of `_updateInteractionPrompt`:

```js
_updateInteractionPrompt() {
  if (this._travelMapOpen) {
    this._hud.setInteractionPrompt(null);
    return;
  }
  if (this._travel.canInteract(this._player)) {
    this._hud.setInteractionPrompt('F viajar');
    return;
  }
  const rocketPrompt = this._rocketInteraction.getPrompt(this._player);
  this._hud.setInteractionPrompt(rocketPrompt);
}
```

- [ ] **Step 9: Update travelTo to dispose rocket if in pilot mode**

At the top of `travelTo(planetId)`, before the existing guard, add:

```js
if (this._pilotMode) {
  this._exitPilotMode();
}
```

Also after `this._physics = new Physics(this._world);` add:

```js
this._rocketInteraction.setWorld(this._world);
```

- [ ] **Step 10: Run full test suite**

```bash
npm test
```

Expected: all pass (no unit tests touch main.js directly).

- [ ] **Step 11: Commit**

```bash
git add src/main.js
git commit -m "feat: wire rocket pilot mode into game loop"
```

---

## Task 6: Smoke-test in browser

No code changes. Verify the full flow works end-to-end.

- [ ] **Step 1: Open the game**

Open `http://localhost:5174` (or whichever port Vite picked). Select **Creativo** mode.

- [ ] **Step 2: Verify new blocks appear in hotbar**

Scroll through the hotbar slots — you should see **Thruster**, **Command Panel**, and **Capsule** available.

- [ ] **Step 3: Build and launch a minimal rocket**

Place this structure near spawn (all blocks touching):
```
  [CAPSULE]
  [COMMAND_PANEL]
  [THRUSTER]
  [THRUSTER]
```

Walk up to the CAPSULE or COMMAND_PANEL. HUD should show **"F pilotar cohete"** or **"F activar lanzamiento"**.

Press F. The blocks should disappear and the rocket mesh should appear. You should now be in third-person view behind the rocket.

- [ ] **Step 4: Test controls**

- W/S moves forward/back
- A/D rotates
- Space ascends
- Shift descends
- ESC exits pilot mode (you land where the rocket was)

- [ ] **Step 5: Test travel**

Ascend to altitude ≥ 20. HUD shows **"F → viajar al espacio"**. Press F — travel UI opens. Select a planet. Rocket is destroyed, you appear on the new planet walking normally.

- [ ] **Step 6: Test validation error**

Build a structure with only 1 THRUSTER + 1 CAPSULE + 10 REACTOR_CORE blocks. Press F on the capsule. HUD should show **"Faltan propulsores: agregá X más"** for 3 seconds.

- [ ] **Step 7: Final test run**

```bash
npm test
```

Expected: all tests pass.
