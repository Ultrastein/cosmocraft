# CosmoCraft Phase 1 — Playable Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable 3D voxel game in the browser where the player can walk, jump, mine blocks, and place blocks on a procedurally generated alien planet.

**Architecture:** Three.js renders a chunk-based voxel world. A custom Physics engine handles gravity and AABB collision. The Player class reads keyboard/mouse input. A World class manages chunk generation on demand. A Canvas HUD overlays the crosshair and hotbar.

**Tech Stack:** Three.js 0.163, Vite 5, Vanilla JS (ES modules), Vitest 1.5

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Entry HTML, canvas mount, HUD div |
| `src/main.js` | Game class, main loop, wires all systems |
| `src/world/BlockRegistry.js` | Block type IDs and properties |
| `src/world/Chunk.js` | 16×16×16 voxel data structure |
| `src/world/WorldGen.js` | Procedural terrain via simplex noise |
| `src/world/World.js` | Chunk manager (load on demand, getBlock/setBlock) |
| `src/utils/Noise.js` | Simplex noise (2D + 3D) |
| `src/utils/MathUtils.js` | DDA raycast for mining/building |
| `src/player/Player.js` | Position, velocity, yaw/pitch, keyboard/mouse input |
| `src/player/Physics.js` | Gravity, AABB collision resolution |
| `src/player/Inventory.js` | 36 item slots + 9-slot hotbar |
| `src/rendering/Renderer.js` | Three.js scene, camera, lights, WebGL |
| `src/rendering/ChunkMesh.js` | Build Three.js geometry from chunk voxel data |
| `src/rendering/HUD.js` | Canvas overlay: crosshair, hotbar |
| `tests/world/BlockRegistry.test.js` | Tests for block registry |
| `tests/world/Chunk.test.js` | Tests for chunk data structure |
| `tests/world/WorldGen.test.js` | Tests for terrain generation |
| `tests/player/Inventory.test.js` | Tests for inventory system |
| `tests/utils/Noise.test.js` | Tests for simplex noise |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/main.js` (placeholder)

- [ ] **Step 1: Create project directory and package.json**

```bash
cd C:\Users\nicol\Documents\GitHub\cosmocraft
npm init -y
```

Then replace the generated `package.json` with:

```json
{
  "name": "cosmocraft",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "three": "^0.163.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, three and vite installed.

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CosmoCraft</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; font-family: monospace; }
    canvas { display: block; }
    #hud { position: fixed; inset: 0; pointer-events: none; }
    #overlay {
      position: fixed; inset: 0; display: flex;
      align-items: center; justify-content: center;
      background: rgba(0,0,20,0.85); color: #7af; font-size: 24px;
      cursor: pointer; z-index: 10;
    }
    #overlay.hidden { display: none; }
  </style>
</head>
<body>
  <div id="overlay">
    <div style="text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🚀 CosmoCraft</div>
      <div>Click para empezar</div>
      <div style="font-size:14px;margin-top:12px;color:#5af">
        WASD mover · Espacio saltar · Click izq minar · Click der colocar · Rueda cambiar bloque
      </div>
    </div>
  </div>
  <div id="hud"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Create placeholder src/main.js**

```js
console.log('CosmoCraft loading...');
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Terminal shows `http://localhost:5173`. Open it — see black screen with "CosmoCraft loading..." in browser console. No errors.

- [ ] **Step 7: Commit**

```bash
git add package.json index.html vite.config.js src/main.js
git commit -m "feat: project setup with Vite and Three.js"
```

---

## Task 2: BlockRegistry

**Files:**
- Create: `src/world/BlockRegistry.js`
- Create: `tests/world/BlockRegistry.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/world/BlockRegistry.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { BLOCKS, BLOCK_DATA } from '../../src/world/BlockRegistry.js';

describe('BlockRegistry', () => {
  it('AIR is 0', () => {
    expect(BLOCKS.AIR).toBe(0);
  });

  it('all blocks have a numeric ID starting from 0', () => {
    Object.values(BLOCKS).forEach(id => {
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThanOrEqual(0);
    });
  });

  it('all blocks have a name string', () => {
    Object.values(BLOCK_DATA).forEach(data => {
      expect(typeof data.name).toBe('string');
      expect(data.name.length).toBeGreaterThan(0);
    });
  });

  it('AIR is not solid', () => {
    expect(BLOCK_DATA[BLOCKS.AIR].solid).toBe(false);
  });

  it('all non-AIR blocks are solid', () => {
    Object.entries(BLOCK_DATA).forEach(([id, data]) => {
      if (Number(id) !== BLOCKS.AIR) {
        expect(data.solid).toBe(true);
      }
    });
  });

  it('all blocks have a hardness >= 0', () => {
    Object.values(BLOCK_DATA).forEach(data => {
      expect(typeof data.hardness).toBe('number');
      expect(data.hardness).toBeGreaterThanOrEqual(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../../src/world/BlockRegistry.js'`

- [ ] **Step 3: Create src/world/BlockRegistry.js**

```js
export const BLOCKS = {
  AIR: 0,
  REGOLITH: 1,
  IRON_ORE: 2,
  SILICON_CRYSTAL: 3,
  TITANIUM_ORE: 4,
  ICE_BLOCK: 5,
  QUANTUM_CRYSTAL: 6,
  STEEL_BLOCK: 7,
  SOLAR_PANEL: 8,
  OXYGEN_GENERATOR: 9,
  REACTOR_CORE: 10,
  LAUNCH_PAD: 11,
  COMPUTER_BLOCK: 12,
};

export const BLOCK_DATA = {
  [BLOCKS.AIR]:              { name: 'Air',               solid: false, color: 0x000000, hardness: 0 },
  [BLOCKS.REGOLITH]:         { name: 'Regolith',          solid: true,  color: 0x8a7a6a, hardness: 1 },
  [BLOCKS.IRON_ORE]:         { name: 'Iron Ore',          solid: true,  color: 0x8b6f5e, hardness: 3 },
  [BLOCKS.SILICON_CRYSTAL]:  { name: 'Silicon Crystal',   solid: true,  color: 0x6090a0, hardness: 2 },
  [BLOCKS.TITANIUM_ORE]:     { name: 'Titanium Ore',      solid: true,  color: 0x7090b0, hardness: 4 },
  [BLOCKS.ICE_BLOCK]:        { name: 'Ice Block',         solid: true,  color: 0xa0d0f0, hardness: 1 },
  [BLOCKS.QUANTUM_CRYSTAL]:  { name: 'Quantum Crystal',   solid: true,  color: 0x8040ff, hardness: 5 },
  [BLOCKS.STEEL_BLOCK]:      { name: 'Steel Block',       solid: true,  color: 0x708090, hardness: 3 },
  [BLOCKS.SOLAR_PANEL]:      { name: 'Solar Panel',       solid: true,  color: 0x1040c0, hardness: 2 },
  [BLOCKS.OXYGEN_GENERATOR]: { name: 'Oxygen Generator',  solid: true,  color: 0x40a0ff, hardness: 3 },
  [BLOCKS.REACTOR_CORE]:     { name: 'Reactor Core',      solid: true,  color: 0xff6020, hardness: 5 },
  [BLOCKS.LAUNCH_PAD]:       { name: 'Launch Pad',        solid: true,  color: 0x505060, hardness: 4 },
  [BLOCKS.COMPUTER_BLOCK]:   { name: 'Computer Block',    solid: true,  color: 0x204060, hardness: 2 },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/world/BlockRegistry.js tests/world/BlockRegistry.test.js
git commit -m "feat: block registry with 13 block types"
```

---

## Task 3: Simplex Noise

**Files:**
- Create: `src/utils/Noise.js`
- Create: `tests/utils/Noise.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/utils/Noise.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { SimplexNoise } from '../../src/utils/Noise.js';

describe('SimplexNoise', () => {
  it('noise2D returns values in roughly [-1, 1]', () => {
    const noise = new SimplexNoise(42);
    for (let i = 0; i < 200; i++) {
      const v = noise.noise2D(i * 0.13, i * 0.27);
      expect(v).toBeGreaterThanOrEqual(-1.1);
      expect(v).toBeLessThanOrEqual(1.1);
    }
  });

  it('noise2D is deterministic with same seed', () => {
    const n1 = new SimplexNoise(1234);
    const n2 = new SimplexNoise(1234);
    expect(n1.noise2D(3.5, 7.2)).toBe(n2.noise2D(3.5, 7.2));
    expect(n1.noise2D(0, 0)).toBe(n2.noise2D(0, 0));
  });

  it('different seeds produce different results', () => {
    const n1 = new SimplexNoise(1);
    const n2 = new SimplexNoise(2);
    expect(n1.noise2D(1.5, 2.5)).not.toBe(n2.noise2D(1.5, 2.5));
  });

  it('noise3D returns values in roughly [-1, 1]', () => {
    const noise = new SimplexNoise(99);
    for (let i = 0; i < 100; i++) {
      const v = noise.noise3D(i * 0.1, i * 0.2, i * 0.15);
      expect(v).toBeGreaterThanOrEqual(-1.1);
      expect(v).toBeLessThanOrEqual(1.1);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../../src/utils/Noise.js'`

- [ ] **Step 3: Create src/utils/Noise.js**

```js
const GRAD3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
];
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

export class SimplexNoise {
  constructor(seed = 0) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    let s = seed >>> 0;
    for (let i = 255; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    this._perm = new Uint8Array(512);
    this._permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this._perm[i] = p[i & 255];
      this._permMod12[i] = this._perm[i] % 12;
    }
  }

  noise2D(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this._permMod12[ii + this._perm[jj]];
    const gi1 = this._permMod12[ii + i1 + this._perm[jj + j1]];
    const gi2 = this._permMod12[ii + 1 + this._perm[jj + 1]];

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * (GRAD3[gi0][0] * x0 + GRAD3[gi0][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * (GRAD3[gi1][0] * x1 + GRAD3[gi1][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * (GRAD3[gi2][0] * x2 + GRAD3[gi2][1] * y2); }

    return Math.max(-1, Math.min(1, 70 * (n0 + n1 + n2)));
  }

  noise3D(x, y, z) {
    // Composed from two offset 2D slices — sufficient for ore distribution
    const a = this.noise2D(x + z * 31.7, y + z * 17.3);
    const b = this.noise2D(x * 2.1 + z * 0.5, y * 2.1 + z * 0.3);
    return Math.max(-1, Math.min(1, a * 0.6 + b * 0.4));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: All 4 noise tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/Noise.js tests/utils/Noise.test.js
git commit -m "feat: simplex noise utility (2D + 3D)"
```

---

## Task 4: Chunk Data Structure

**Files:**
- Create: `src/world/Chunk.js`
- Create: `tests/world/Chunk.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/world/Chunk.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { Chunk, CHUNK_SIZE } from '../../src/world/Chunk.js';
import { BLOCKS } from '../../src/world/BlockRegistry.js';

describe('Chunk', () => {
  it('CHUNK_SIZE is 16', () => {
    expect(CHUNK_SIZE).toBe(16);
  });

  it('initializes with all AIR blocks', () => {
    const chunk = new Chunk(0, 0, 0);
    expect(chunk.getBlock(0, 0, 0)).toBe(BLOCKS.AIR);
    expect(chunk.getBlock(15, 15, 15)).toBe(BLOCKS.AIR);
    expect(chunk.getBlock(7, 7, 7)).toBe(BLOCKS.AIR);
  });

  it('sets and gets a block correctly', () => {
    const chunk = new Chunk(0, 0, 0);
    chunk.setBlock(5, 3, 7, BLOCKS.REGOLITH);
    expect(chunk.getBlock(5, 3, 7)).toBe(BLOCKS.REGOLITH);
  });

  it('returns AIR for out-of-bounds coordinates', () => {
    const chunk = new Chunk(0, 0, 0);
    expect(chunk.getBlock(-1, 0, 0)).toBe(BLOCKS.AIR);
    expect(chunk.getBlock(CHUNK_SIZE, 0, 0)).toBe(BLOCKS.AIR);
    expect(chunk.getBlock(0, -1, 0)).toBe(BLOCKS.AIR);
    expect(chunk.getBlock(0, CHUNK_SIZE, 0)).toBe(BLOCKS.AIR);
  });

  it('setBlock ignores out-of-bounds writes', () => {
    const chunk = new Chunk(0, 0, 0);
    expect(() => chunk.setBlock(-1, 0, 0, BLOCKS.IRON_ORE)).not.toThrow();
    expect(chunk.getBlock(0, 0, 0)).toBe(BLOCKS.AIR);
  });

  it('marks chunk dirty when a block is set', () => {
    const chunk = new Chunk(0, 0, 0);
    chunk.dirty = false;
    chunk.setBlock(1, 1, 1, BLOCKS.IRON_ORE);
    expect(chunk.dirty).toBe(true);
  });

  it('stores chunk coordinates', () => {
    const chunk = new Chunk(3, -1, 7);
    expect(chunk.cx).toBe(3);
    expect(chunk.cy).toBe(-1);
    expect(chunk.cz).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../../src/world/Chunk.js'`

- [ ] **Step 3: Create src/world/Chunk.js**

```js
export const CHUNK_SIZE = 16;

export class Chunk {
  constructor(cx, cy, cz) {
    this.cx = cx;
    this.cy = cy;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
    this.dirty = true;
  }

  _index(x, y, z) {
    return x + CHUNK_SIZE * (y + CHUNK_SIZE * z);
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
    return this.blocks[this._index(x, y, z)];
  }

  setBlock(x, y, z, type) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
    this.blocks[this._index(x, y, z)] = type;
    this.dirty = true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: All 7 chunk tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/world/Chunk.js tests/world/Chunk.test.js
git commit -m "feat: Chunk data structure (16x16x16 voxel grid)"
```

---

## Task 5: WorldGen — Terrain Generation

**Files:**
- Create: `src/world/WorldGen.js`
- Create: `tests/world/WorldGen.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/world/WorldGen.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { WorldGen } from '../../src/world/WorldGen.js';
import { BLOCKS } from '../../src/world/BlockRegistry.js';
import { CHUNK_SIZE } from '../../src/world/Chunk.js';

describe('WorldGen', () => {
  it('returns a Chunk with dirty=true', () => {
    const gen = new WorldGen(42);
    const chunk = gen.generateChunk(0, 0, 0);
    expect(chunk.dirty).toBe(true);
    expect(chunk.cx).toBe(0);
  });

  it('surface chunk (0,0,0) contains regolith', () => {
    const gen = new WorldGen(42);
    const chunk = gen.generateChunk(0, 0, 0);
    const hasRegolith = chunk.blocks.some(b => b === BLOCKS.REGOLITH);
    expect(hasRegolith).toBe(true);
  });

  it('high-altitude chunk is all air', () => {
    const gen = new WorldGen(42);
    // cy=5 means world Y from 80 to 95 — way above terrain (max ~20)
    const chunk = gen.generateChunk(0, 5, 0);
    expect(chunk.blocks.every(b => b === BLOCKS.AIR)).toBe(true);
  });

  it('underground chunk (cy=-1) is all solid', () => {
    const gen = new WorldGen(42);
    const chunk = gen.generateChunk(0, -1, 0);
    expect(chunk.blocks.every(b => b !== BLOCKS.AIR)).toBe(true);
  });

  it('same seed produces identical chunks', () => {
    const gen1 = new WorldGen(999);
    const gen2 = new WorldGen(999);
    const c1 = gen1.generateChunk(2, 0, 3);
    const c2 = gen2.generateChunk(2, 0, 3);
    expect(Array.from(c1.blocks)).toEqual(Array.from(c2.blocks));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../../src/world/WorldGen.js'`

- [ ] **Step 3: Create src/world/WorldGen.js**

```js
import { Chunk, CHUNK_SIZE } from './Chunk.js';
import { BLOCKS } from './BlockRegistry.js';
import { SimplexNoise } from '../utils/Noise.js';

const TERRAIN_BASE = 8;   // base surface height (world blocks)
const TERRAIN_AMPLITUDE = 6; // height variation in blocks

export class WorldGen {
  constructor(seed = 12345) {
    this.noise = new SimplexNoise(seed);
    this.oreNoise = new SimplexNoise(seed ^ 0xdeadbeef);
  }

  generateChunk(cx, cy, cz) {
    const chunk = new Chunk(cx, cy, cz);

    if (cy < 0) {
      chunk.blocks.fill(BLOCKS.REGOLITH);
      chunk.dirty = true;
      return chunk;
    }

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const surfaceY = this._surfaceHeight(wx, wz);

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
          const wy = cy * CHUNK_SIZE + ly;
          chunk.setBlock(lx, ly, lz, this._blockAt(wx, wy, wz, surfaceY));
        }
      }
    }

    chunk.dirty = true;
    return chunk;
  }

  _surfaceHeight(wx, wz) {
    const n = this.noise.noise2D(wx / 32, wz / 32);
    return Math.floor(TERRAIN_BASE + n * TERRAIN_AMPLITUDE);
  }

  _blockAt(wx, wy, wz, surfaceY) {
    if (wy > surfaceY) return BLOCKS.AIR;
    if (wy === surfaceY) return BLOCKS.REGOLITH;
    if (wy >= surfaceY - 3) return BLOCKS.REGOLITH;

    const ore = this.oreNoise.noise3D(wx / 8, wy / 8, wz / 8);
    if (ore > 0.75) return BLOCKS.SILICON_CRYSTAL;
    if (ore > 0.60) return BLOCKS.IRON_ORE;
    return BLOCKS.REGOLITH;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: All 5 WorldGen tests PASS. All previous tests still PASS.

- [ ] **Step 5: Commit**

```bash
git add src/world/WorldGen.js tests/world/WorldGen.test.js
git commit -m "feat: procedural terrain generation with simplex noise"
```

---

## Task 6: World — Chunk Manager

**Files:**
- Create: `src/world/World.js`

No unit tests for this module — it coordinates WorldGen and Chunk which are already tested. Verified manually in Task 15.

- [ ] **Step 1: Create src/world/World.js**

```js
import { CHUNK_SIZE } from './Chunk.js';
import { WorldGen } from './WorldGen.js';
import { BLOCKS } from './BlockRegistry.js';

export class World {
  constructor(seed = 12345) {
    this._chunks = new Map();
    this._gen = new WorldGen(seed);
  }

  _key(cx, cy, cz) {
    return `${cx},${cy},${cz}`;
  }

  getChunk(cx, cy, cz) {
    const key = this._key(cx, cy, cz);
    if (!this._chunks.has(key)) {
      this._chunks.set(key, this._gen.generateChunk(cx, cy, cz));
    }
    return this._chunks.get(key);
  }

  getBlock(wx, wy, wz) {
    if (wy < -CHUNK_SIZE) return BLOCKS.REGOLITH; // deep underground
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cy = Math.floor(wy / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return this.getChunk(cx, cy, cz).getBlock(lx, ly, lz);
  }

  setBlock(wx, wy, wz, type) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cy = Math.floor(wy / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    this.getChunk(cx, cy, cz).setBlock(lx, ly, lz, type);
  }

  getDirtyChunks() {
    return [...this._chunks.values()].filter(c => c.dirty);
  }

  markClean(chunk) {
    chunk.dirty = false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/world/World.js
git commit -m "feat: World chunk manager (on-demand generation, getBlock/setBlock)"
```

---

## Task 7: Renderer — Three.js Scene

**Files:**
- Create: `src/rendering/Renderer.js`

No automated tests — Three.js requires a DOM/WebGL context. Verified visually in Task 15.

- [ ] **Step 1: Create src/rendering/Renderer.js**

```js
import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04040f);
    this.scene.fog = new THREE.Fog(0x04040f, 40, 100);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.05,
      200
    );

    this._renderer = new THREE.WebGLRenderer({ antialias: false });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this._renderer.domElement);

    // Stars backdrop (ambient purple-blue)
    this.scene.add(new THREE.AmbientLight(0x302050, 0.6));

    // Directional "sun" — warm orange-white (alien sun)
    this.sun = new THREE.DirectionalLight(0xffe0b0, 1.2);
    this.sun.position.set(60, 120, 40);
    this.scene.add(this.sun);

    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this._renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/rendering/Renderer.js
git commit -m "feat: Three.js renderer with scene, camera, and alien sun light"
```

---

## Task 8: ChunkMesh — Voxel Geometry Builder

**Files:**
- Create: `src/rendering/ChunkMesh.js`

- [ ] **Step 1: Create src/rendering/ChunkMesh.js**

```js
import * as THREE from 'three';
import { CHUNK_SIZE } from '../world/Chunk.js';
import { BLOCKS, BLOCK_DATA } from '../world/BlockRegistry.js';

// Face definitions: direction to check for neighbor, corner offsets, face normal
const FACES = [
  { dir: [ 1, 0, 0], corners: [[1,0,1],[1,1,1],[1,1,0],[1,0,0]], normal: [ 1, 0, 0] },
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,1,0],[0,1,1],[0,0,1]], normal: [-1, 0, 0] },
  { dir: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], normal: [ 0, 1, 0] },
  { dir: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], normal: [ 0,-1, 0] },
  { dir: [ 0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], normal: [ 0, 0, 1] },
  { dir: [ 0, 0,-1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], normal: [ 0, 0,-1] },
];

export function buildChunkMesh(chunk, getBlock) {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  let vi = 0;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const block = chunk.getBlock(lx, ly, lz);
        if (block === BLOCKS.AIR) continue;

        const data = BLOCK_DATA[block];
        const r = ((data.color >> 16) & 0xff) / 255;
        const g = ((data.color >>  8) & 0xff) / 255;
        const b = ( data.color        & 0xff) / 255;
        const wx = chunk.cx * CHUNK_SIZE + lx;
        const wy = chunk.cy * CHUNK_SIZE + ly;
        const wz = chunk.cz * CHUNK_SIZE + lz;

        for (const face of FACES) {
          const neighborBlock = getBlock(
            wx + face.dir[0],
            wy + face.dir[1],
            wz + face.dir[2]
          );
          const neighborData = BLOCK_DATA[neighborBlock];
          if (neighborData && neighborData.solid) continue; // face hidden

          for (const corner of face.corners) {
            positions.push(lx + corner[0], ly + corner[1], lz + corner[2]);
            normals.push(...face.normal);
            // Darken bottom faces for depth cue
            const shade = face.dir[1] === -1 ? 0.6 : face.dir[1] === 1 ? 1.0 : 0.85;
            colors.push(r * shade, g * shade, b * shade);
          }
          indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
          vi += 4;
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));
  geo.setIndex(indices);

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    chunk.cx * CHUNK_SIZE,
    chunk.cy * CHUNK_SIZE,
    chunk.cz * CHUNK_SIZE
  );
  return mesh;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/rendering/ChunkMesh.js
git commit -m "feat: chunk mesh builder with face culling and vertex shading"
```

---

## Task 9: Player — Input and Camera

**Files:**
- Create: `src/player/Player.js`

- [ ] **Step 1: Create src/player/Player.js**

```js
export class Player {
  constructor(x, y, z) {
    this.position = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.yaw = 0;    // radians, rotation around Y axis
    this.pitch = 0;  // radians, rotation around X axis
    this.onGround = false;
    this.width = 0.6;
    this.height = 1.8;
    this.eyeOffset = 1.6; // eyes from feet

    this._keys = {};
    this._speed = 5; // blocks/second

    document.addEventListener('keydown', e => { this._keys[e.code] = true; });
    document.addEventListener('keyup',   e => { this._keys[e.code] = false; });
    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      this.yaw   -= e.movementX * 0.002;
      this.pitch  = Math.max(-Math.PI / 2 + 0.01,
                    Math.min( Math.PI / 2 - 0.01,
                    this.pitch - e.movementY * 0.002));
    });
  }

  update(dt) {
    const spd = this._keys['ShiftLeft'] ? this._speed * 2 : this._speed;
    const fwdX = Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const rtX  = Math.cos(this.yaw);
    const rtZ  = Math.sin(this.yaw);

    let mx = 0, mz = 0;
    if (this._keys['KeyW']) { mx += fwdX; mz += fwdZ; }
    if (this._keys['KeyS']) { mx -= fwdX; mz -= fwdZ; }
    if (this._keys['KeyA']) { mx -= rtX;  mz -= rtZ; }
    if (this._keys['KeyD']) { mx += rtX;  mz += rtZ; }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    this.velocity.x = mx * spd;
    this.velocity.z = mz * spd;

    if (this._keys['Space'] && this.onGround) {
      this.velocity.y = 8;
    }
  }

  getEyePosition() {
    return {
      x: this.position.x,
      y: this.position.y + this.eyeOffset,
      z: this.position.z,
    };
  }

  getLookDirection() {
    return {
      x:  Math.sin(this.yaw)  * Math.cos(this.pitch),
      y:  Math.sin(this.pitch),
      z: -Math.cos(this.yaw)  * Math.cos(this.pitch),
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/player/Player.js
git commit -m "feat: Player with WASD, mouse look, jump input"
```

---

## Task 10: Physics — Gravity and AABB Collision

**Files:**
- Create: `src/player/Physics.js`

- [ ] **Step 1: Create src/player/Physics.js**

```js
import { BLOCK_DATA } from '../world/BlockRegistry.js';

const GRAVITY = -22;      // blocks/s²
const TERMINAL_VEL = -50; // blocks/s

export class Physics {
  constructor(world) {
    this._world = world;
  }

  update(player, dt) {
    player.velocity.y = Math.max(player.velocity.y + GRAVITY * dt, TERMINAL_VEL);

    this._moveAxis(player, 'x', player.velocity.x * dt);
    this._moveAxis(player, 'y', player.velocity.y * dt);
    this._moveAxis(player, 'z', player.velocity.z * dt);
  }

  _moveAxis(player, axis, delta) {
    player.position[axis] += delta;
    if (this._collides(player)) {
      player.position[axis] -= delta;
      if (axis === 'y') {
        player.onGround = delta < 0;
        player.velocity.y = 0;
      } else {
        player.velocity[axis] = 0;
      }
    } else if (axis === 'y' && delta < 0) {
      player.onGround = false;
    }
  }

  _collides(player) {
    const hw = player.width / 2;
    const x0 = player.position.x - hw, x1 = player.position.x + hw;
    const y0 = player.position.y,      y1 = player.position.y + player.height;
    const z0 = player.position.z - hw, z1 = player.position.z + hw;

    for (let bx = Math.floor(x0); bx <= Math.floor(x1 - 0.001); bx++) {
      for (let by = Math.floor(y0); by <= Math.floor(y1 - 0.001); by++) {
        for (let bz = Math.floor(z0); bz <= Math.floor(z1 - 0.001); bz++) {
          const block = this._world.getBlock(bx, by, bz);
          if (BLOCK_DATA[block]?.solid) return true;
        }
      }
    }
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/player/Physics.js
git commit -m "feat: Physics with gravity and AABB collision per axis"
```

---

## Task 11: MathUtils — DDA Raycast

**Files:**
- Create: `src/utils/MathUtils.js`

- [ ] **Step 1: Create src/utils/MathUtils.js**

```js
export function raycast(origin, direction, maxDist, getBlock) {
  let { x, y, z } = origin;
  const { x: dx, y: dy, z: dz } = direction;

  let ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;

  const tDx = Math.abs(dx) < 1e-10 ? Infinity : Math.abs(1 / dx);
  const tDy = Math.abs(dy) < 1e-10 ? Infinity : Math.abs(1 / dy);
  const tDz = Math.abs(dz) < 1e-10 ? Infinity : Math.abs(1 / dz);

  let tMaxX = dx >= 0 ? (ix + 1 - x) * tDx : (x - ix) * tDx;
  let tMaxY = dy >= 0 ? (iy + 1 - y) * tDy : (y - iy) * tDy;
  let tMaxZ = dz >= 0 ? (iz + 1 - z) * tDz : (z - iz) * tDz;

  let prevX = ix, prevY = iy, prevZ = iz;

  for (let i = 0; i < maxDist * 4; i++) {
    const block = getBlock(ix, iy, iz);
    if (block !== 0) {
      return { hit: true, x: ix, y: iy, z: iz, prevX, prevY, prevZ };
    }

    prevX = ix; prevY = iy; prevZ = iz;

    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      if (tMaxX > maxDist) break;
      ix += stepX; tMaxX += tDx;
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > maxDist) break;
      iy += stepY; tMaxY += tDy;
    } else {
      if (tMaxZ > maxDist) break;
      iz += stepZ; tMaxZ += tDz;
    }
  }

  return { hit: false };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/MathUtils.js
git commit -m "feat: DDA raycast for block selection"
```

---

## Task 12: Inventory

**Files:**
- Create: `src/player/Inventory.js`
- Create: `tests/player/Inventory.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/player/Inventory.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { Inventory } from '../../src/player/Inventory.js';
import { BLOCKS } from '../../src/world/BlockRegistry.js';

describe('Inventory', () => {
  it('starts empty', () => {
    const inv = new Inventory();
    expect(inv.getSelected()).toBeNull();
    for (let i = 0; i < 9; i++) expect(inv.getHotbarSlot(i)).toBeNull();
  });

  it('adds an item to the first free slot', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 5);
    expect(inv.slots[0]).toEqual({ id: BLOCKS.REGOLITH, count: 5 });
  });

  it('stacks items of same type up to 64', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.IRON_ORE, 50);
    inv.addItem(BLOCKS.IRON_ORE, 20);
    expect(inv.slots[0]).toEqual({ id: BLOCKS.IRON_ORE, count: 64 });
    expect(inv.slots[1]).toEqual({ id: BLOCKS.IRON_ORE, count: 6 });
  });

  it('removes items and clears empty slots', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 3);
    inv.removeItem(BLOCKS.REGOLITH, 3);
    expect(inv.slots[0]).toBeNull();
  });

  it('removeItem returns true when successful', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 10);
    expect(inv.removeItem(BLOCKS.REGOLITH, 5)).toBe(true);
  });

  it('removeItem returns false when not enough items', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 2);
    expect(inv.removeItem(BLOCKS.REGOLITH, 5)).toBe(false);
  });

  it('selectSlot changes the active hotbar slot', () => {
    const inv = new Inventory();
    inv.selectSlot(4);
    expect(inv.selectedSlot).toBe(4);
  });

  it('getSelected returns hotbar item at selectedSlot', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.STEEL_BLOCK, 10);
    inv.selectSlot(0);
    expect(inv.getSelected()).toEqual({ id: BLOCKS.STEEL_BLOCK, count: 10 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../../src/player/Inventory.js'`

- [ ] **Step 3: Create src/player/Inventory.js**

```js
const STACK_MAX = 64;

export class Inventory {
  constructor() {
    this.slots = new Array(36).fill(null);
    this.selectedSlot = 0;
  }

  addItem(blockType, count = 1) {
    // Stack with existing slots first
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (this.slots[i]?.id === blockType && this.slots[i].count < STACK_MAX) {
        const space = STACK_MAX - this.slots[i].count;
        const added = Math.min(space, count);
        this.slots[i].count += added;
        count -= added;
      }
    }
    // Fill empty slots
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (!this.slots[i]) {
        const added = Math.min(STACK_MAX, count);
        this.slots[i] = { id: blockType, count: added };
        count -= added;
      }
    }
    return count <= 0;
  }

  removeItem(blockType, count = 1) {
    // Check we have enough first
    const total = this.slots.reduce((s, slot) =>
      s + (slot?.id === blockType ? slot.count : 0), 0);
    if (total < count) return false;

    for (let i = this.slots.length - 1; i >= 0 && count > 0; i--) {
      if (this.slots[i]?.id === blockType) {
        const removed = Math.min(this.slots[i].count, count);
        this.slots[i].count -= removed;
        count -= removed;
        if (this.slots[i].count === 0) this.slots[i] = null;
      }
    }
    return true;
  }

  getHotbarSlot(index) {
    return this.slots[index] ?? null;
  }

  getSelected() {
    return this.slots[this.selectedSlot] ?? null;
  }

  selectSlot(index) {
    if (index >= 0 && index < 9) this.selectedSlot = index;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: All 8 inventory tests PASS. All previous tests still PASS.

- [ ] **Step 5: Commit**

```bash
git add src/player/Inventory.js tests/player/Inventory.test.js
git commit -m "feat: Inventory with 36 slots, stacking, hotbar selection"
```

---

## Task 13: HUD — Canvas Overlay

**Files:**
- Create: `src/rendering/HUD.js`

- [ ] **Step 1: Create src/rendering/HUD.js**

```js
import { BLOCK_DATA } from '../world/BlockRegistry.js';

export class HUD {
  constructor(inventory) {
    this._inv = inventory;
    this._miningProgress = 0;

    this._canvas = document.createElement('canvas');
    this._canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
    document.getElementById('hud').appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }

  setMiningProgress(p) {
    this._miningProgress = p; // 0..1
  }

  draw() {
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    this._drawCrosshair(ctx, W, H);
    this._drawHotbar(ctx, W, H);
    if (this._miningProgress > 0) this._drawMiningBar(ctx, W, H);
  }

  _drawCrosshair(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 10, H / 2); ctx.lineTo(W / 2 + 10, H / 2);
    ctx.moveTo(W / 2, H / 2 - 10); ctx.lineTo(W / 2, H / 2 + 10);
    ctx.stroke();
    ctx.restore();
  }

  _drawHotbar(ctx, W, H) {
    const SLOT = 48, GAP = 4;
    const totalW = 9 * SLOT + 8 * GAP;
    const sx = (W - totalW) / 2;
    const sy = H - SLOT - 12;

    for (let i = 0; i < 9; i++) {
      const x = sx + i * (SLOT + GAP);
      const selected = i === this._inv.selectedSlot;
      const slot = this._inv.getHotbarSlot(i);

      ctx.fillStyle = selected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.55)';
      ctx.strokeStyle = selected ? '#fff' : '#555';
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, sy, SLOT, SLOT, 4);
      ctx.fill(); ctx.stroke();

      if (slot) {
        const data = BLOCK_DATA[slot.id];
        if (data) {
          const hex = '#' + data.color.toString(16).padStart(6, '0');
          ctx.fillStyle = hex;
          ctx.fillRect(x + 8, sy + 8, SLOT - 16, SLOT - 16);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(slot.count, x + SLOT - 4, sy + SLOT - 4);
      }

      // Slot number
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, x + SLOT / 2, sy - 3);
    }
    ctx.textAlign = 'left';
  }

  _drawMiningBar(ctx, W, H) {
    const barW = 120, barH = 8;
    const bx = (W - barW) / 2;
    const by = H / 2 + 20;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#f90';
    ctx.fillRect(bx, by, barW * this._miningProgress, barH);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/rendering/HUD.js
git commit -m "feat: HUD canvas overlay with crosshair, hotbar, mining bar"
```

---

## Task 14: Block Outline (selected block highlight)

**Files:**
- Modify: `src/rendering/Renderer.js`

- [ ] **Step 1: Add wireframe outline mesh to Renderer**

Add to the end of the `Renderer` constructor, after the sun light:

```js
// Wireframe box shown around the targeted block
const outlineGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const outlineMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.5,
});
this.blockOutline = new THREE.Mesh(outlineGeo, outlineMat);
this.blockOutline.visible = false;
this.scene.add(this.blockOutline);
```

Add this method to the `Renderer` class:

```js
showOutline(x, y, z) {
  this.blockOutline.position.set(x + 0.5, y + 0.5, z + 0.5);
  this.blockOutline.visible = true;
}

hideOutline() {
  this.blockOutline.visible = false;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/rendering/Renderer.js
git commit -m "feat: wireframe outline on targeted block"
```

---

## Task 15: main.js — Game Loop

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Replace src/main.js with the complete game loop**

```js
import { Renderer }      from './rendering/Renderer.js';
import { buildChunkMesh } from './rendering/ChunkMesh.js';
import { HUD }           from './rendering/HUD.js';
import { World }         from './world/World.js';
import { CHUNK_SIZE }    from './world/Chunk.js';
import { BLOCKS }        from './world/BlockRegistry.js';
import { Player }        from './player/Player.js';
import { Physics }       from './player/Physics.js';
import { Inventory }     from './player/Inventory.js';
import { raycast }       from './utils/MathUtils.js';

const RENDER_DISTANCE = 4;
const MINING_REACH    = 5;
const MESH_BUILDS_PER_FRAME = 4;

class Game {
  constructor() {
    this._renderer  = new Renderer();
    this._world     = new World(42);
    this._player    = new Player(0.5, 20, 0.5);
    this._physics   = new Physics(this._world);
    this._inventory = new Inventory();
    this._hud       = new HUD(this._inventory);
    this._meshes    = new Map(); // key → THREE.Mesh

    this._miningTarget   = null;
    this._miningProgress = 0;
    this._mouseButtons   = {};

    // Starting items
    this._inventory.addItem(BLOCKS.REGOLITH,   32);
    this._inventory.addItem(BLOCKS.STEEL_BLOCK, 16);
    this._inventory.addItem(BLOCKS.IRON_ORE,   16);

    this._bindInput();
    this._preGenerate();

    this._lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  _preGenerate() {
    for (let cx = -2; cx <= 2; cx++)
      for (let cz = -2; cz <= 2; cz++)
        for (let cy = 0; cy <= 1; cy++)
          this._world.getChunk(cx, cy, cz);
  }

  _bindInput() {
    document.addEventListener('mousedown', e => {
      this._mouseButtons[e.button] = true;
      if (!document.pointerLockElement) return;
      if (e.button === 2) this._placeBlock();
    });
    document.addEventListener('mouseup', e => {
      this._mouseButtons[e.button] = false;
      if (e.button === 0) { this._miningTarget = null; this._miningProgress = 0; }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('wheel', e => {
      const dir = e.deltaY > 0 ? 1 : -1;
      this._inventory.selectSlot((this._inventory.selectedSlot + dir + 9) % 9);
    });
    document.addEventListener('keydown', e => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) this._inventory.selectSlot(n - 1);
      if (e.code === 'KeyE') this._dropCurrentItem();
    });
  }

  _dropCurrentItem() {
    const sel = this._inventory.getSelected();
    if (sel) this._inventory.removeItem(sel.id, 1);
  }

  _getLookDir() {
    return this._player.getLookDirection();
  }

  _getEye() {
    return this._player.getEyePosition();
  }

  _raycastWorld() {
    return raycast(this._getEye(), this._getLookDir(), MINING_REACH,
      (x, y, z) => this._world.getBlock(x, y, z));
  }

  _placeBlock() {
    const sel = this._inventory.getSelected();
    if (!sel) return;
    const hit = this._raycastWorld();
    if (!hit.hit) return;
    this._world.setBlock(hit.prevX, hit.prevY, hit.prevZ, sel.id);
    this._inventory.removeItem(sel.id, 1);
  }

  _updateMining(dt) {
    if (!this._mouseButtons[0] || !document.pointerLockElement) {
      this._miningTarget = null;
      this._miningProgress = 0;
      return;
    }

    const hit = this._raycastWorld();
    if (!hit.hit) {
      this._miningTarget = null;
      this._miningProgress = 0;
      return;
    }

    const { x, y, z } = hit;
    if (!this._miningTarget || this._miningTarget.x !== x ||
        this._miningTarget.y !== y || this._miningTarget.z !== z) {
      this._miningTarget = hit;
      this._miningProgress = 0;
    }

    const block = this._world.getBlock(x, y, z);
    const { BLOCK_DATA } = await import('./world/BlockRegistry.js').catch(() => ({ BLOCK_DATA: {} }));
    const hardness = (await import('./world/BlockRegistry.js')).BLOCK_DATA[block]?.hardness ?? 1;
    this._miningProgress += dt / hardness;

    if (this._miningProgress >= 1) {
      this._world.setBlock(x, y, z, BLOCKS.AIR);
      this._inventory.addItem(block, 1);
      this._miningTarget = null;
      this._miningProgress = 0;
    }
  }

  _updateChunkMeshes() {
    const dirty = this._world.getDirtyChunks();
    let built = 0;
    for (const chunk of dirty) {
      if (built >= MESH_BUILDS_PER_FRAME) break;
      const key = `${chunk.cx},${chunk.cy},${chunk.cz}`;
      const old = this._meshes.get(key);
      if (old) this._renderer.scene.remove(old);

      const mesh = buildChunkMesh(chunk, (x, y, z) => this._world.getBlock(x, y, z));
      if (mesh) {
        this._renderer.scene.add(mesh);
        this._meshes.set(key, mesh);
      } else {
        this._meshes.delete(key);
      }
      this._world.markClean(chunk);
      built++;
    }
  }

  _loadChunks() {
    const px = Math.floor(this._player.position.x / CHUNK_SIZE);
    const py = Math.floor(this._player.position.y / CHUNK_SIZE);
    const pz = Math.floor(this._player.position.z / CHUNK_SIZE);
    for (let cx = px - RENDER_DISTANCE; cx <= px + RENDER_DISTANCE; cx++)
      for (let cz = pz - RENDER_DISTANCE; cz <= pz + RENDER_DISTANCE; cz++)
        for (let cy = Math.max(0, py - 1); cy <= py + 2; cy++)
          this._world.getChunk(cx, cy, cz);
  }

  _updateCamera() {
    const eye = this._getEye();
    this._renderer.camera.position.set(eye.x, eye.y, eye.z);
    this._renderer.camera.rotation.order = 'YXZ';
    this._renderer.camera.rotation.y = this._player.yaw;
    this._renderer.camera.rotation.x = this._player.pitch;
  }

  _updateOutline() {
    const hit = this._raycastWorld();
    if (hit.hit) {
      this._renderer.showOutline(hit.x, hit.y, hit.z);
    } else {
      this._renderer.hideOutline();
    }
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;

    this._player.update(dt);
    this._physics.update(this._player, dt);
    this._loadChunks();
    this._updateChunkMeshes();
    this._updateCamera();
    this._updateOutline();
    this._hud.setMiningProgress(this._miningProgress);
    this._hud.draw();
    this._renderer.render();

    requestAnimationFrame(t => this._loop(t));
  }
}

// Start on click (needed for pointer lock)
const overlay = document.getElementById('overlay');
overlay.addEventListener('click', () => {
  overlay.classList.add('hidden');
  document.body.requestPointerLock();
  new Game();
});

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) overlay.classList.remove('hidden');
});
```

- [ ] **Step 2: Fix the async import in _updateMining** — replace that method with a synchronous import version:

```js
_updateMining(dt) {
  if (!this._mouseButtons[0] || !document.pointerLockElement) {
    this._miningTarget = null;
    this._miningProgress = 0;
    return;
  }

  const hit = this._raycastWorld();
  if (!hit.hit) {
    this._miningTarget = null;
    this._miningProgress = 0;
    return;
  }

  const { x, y, z } = hit;
  if (!this._miningTarget || this._miningTarget.x !== x ||
      this._miningTarget.y !== y || this._miningTarget.z !== z) {
    this._miningTarget = hit;
    this._miningProgress = 0;
  }

  const block = this._world.getBlock(x, y, z);
  const hardness = this._blockData[block]?.hardness ?? 1;
  this._miningProgress += dt / hardness;

  if (this._miningProgress >= 1) {
    this._world.setBlock(x, y, z, BLOCKS.AIR);
    this._inventory.addItem(block, 1);
    this._miningTarget = null;
    this._miningProgress = 0;
  }
}
```

And add to the Game constructor after other imports:

```js
import { BLOCK_DATA } from './world/BlockRegistry.js';
// ... inside constructor:
this._blockData = BLOCK_DATA;
```

So the final `main.js` imports line at the top becomes:

```js
import { BLOCKS, BLOCK_DATA } from './world/BlockRegistry.js';
```

And in the constructor add: `this._blockData = BLOCK_DATA;`

- [ ] **Step 3: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: All tests PASS (20+ tests across all modules).

- [ ] **Step 4: Start dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173`. Click the launch screen. Verify:
- [ ] 3D voxel terrain is visible (brownish alien landscape)
- [ ] WASD moves the player, mouse rotates camera
- [ ] Space jumps
- [ ] White wireframe outline appears on hovered blocks
- [ ] Left-click and hold mines a block (orange mining progress bar shows)
- [ ] Mined block appears in hotbar
- [ ] Right-click places a block from hotbar
- [ ] Mouse wheel / 1-9 keys switch hotbar slot
- [ ] Moving far away loads new chunks

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/world/ src/player/ src/rendering/ src/utils/ tests/
git commit -m "feat: Phase 1 complete — playable CosmoCraft core"
```

---

## Self-Review Checklist

- [x] Project setup with Vite + Three.js
- [x] BlockRegistry with 13 blocks + tests
- [x] Simplex noise 2D/3D + tests
- [x] Chunk 16×16×16 + tests
- [x] WorldGen procedural terrain + tests
- [x] World chunk manager (getBlock/setBlock/getDirtyChunks)
- [x] Renderer (Three.js scene, camera, lights)
- [x] ChunkMesh builder with face culling
- [x] Player (WASD, mouse look, jump)
- [x] Physics (gravity, AABB collision per axis)
- [x] DDA raycast for mining/building
- [x] Inventory 36 slots + hotbar + tests
- [x] HUD canvas overlay (crosshair, hotbar, mining bar)
- [x] Block outline on targeted block
- [x] Game loop wiring everything together
