import { Renderer }       from './rendering/Renderer.js';
import { buildChunkMesh } from './rendering/ChunkMesh.js';
import { HUD }            from './rendering/HUD.js';
import { World }          from './world/World.js';
import { CHUNK_SIZE }     from './world/Chunk.js';
import { BLOCKS, BLOCK_DATA } from './world/BlockRegistry.js';
import { Player }         from './player/Player.js';
import { Physics }        from './player/Physics.js';
import { Inventory }      from './player/Inventory.js';
import { raycast }        from './utils/MathUtils.js';
import { Survival }       from './systems/Survival.js';

const RENDER_DISTANCE      = 4;
const MINING_REACH         = 5;
const MESH_BUILDS_PER_FRAME = 4;

class Game {
  constructor() {
    this._renderer  = new Renderer();
    this._world     = new World(42);
    const spawnY    = this._findSpawnY(0, 0);
    this._player    = new Player(0.5, spawnY, 0.5);
    this._physics   = new Physics(this._world);
    this._inventory = new Inventory();
    this._hud       = new HUD(this._inventory);
    this._survival  = new Survival();
    this._meshes    = new Map();
    this._blockData = BLOCK_DATA;

    this._miningTarget   = null;
    this._miningProgress = 0;
    this._mouseButtons   = {};

    this._inventory.addItem(BLOCKS.REGOLITH,   32);
    this._inventory.addItem(BLOCKS.STEEL_BLOCK, 16);
    this._inventory.addItem(BLOCKS.IRON_ORE,   16);

    this._bindInput();
    this._preGenerate();

    this._lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  _findSpawnY(wx, wz) {
    // Scan downward from y=32 to find the first solid surface, then stand on top
    for (let wy = 32; wy >= 0; wy--) {
      if (this._world.getBlock(wx, wy, wz) !== BLOCKS.AIR &&
          this._world.getBlock(wx, wy + 1, wz) === BLOCKS.AIR) {
        return wy + 1 + 0.01; // stand just above the surface
      }
    }
    return 16; // fallback
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
      if (e.button === 0) {
        this._miningTarget   = null;
        this._miningProgress = 0;
      }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('wheel', e => {
      const dir = e.deltaY > 0 ? 1 : -1;
      this._inventory.selectSlot((this._inventory.selectedSlot + dir + 9) % 9);
    });
    document.addEventListener('keydown', e => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) this._inventory.selectSlot(n - 1);
      if (e.code === 'KeyE') {
        const sel = this._inventory.getSelected();
        if (sel) this._inventory.removeItem(sel.id, 1);
      }
    });
  }

  _raycastWorld() {
    return raycast(
      this._player.getEyePosition(),
      this._player.getLookDirection(),
      MINING_REACH,
      (x, y, z) => this._world.getBlock(x, y, z)
    );
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
      this._miningTarget   = null;
      this._miningProgress = 0;
      return;
    }

    const hit = this._raycastWorld();
    if (!hit.hit) {
      this._miningTarget   = null;
      this._miningProgress = 0;
      return;
    }

    const { x, y, z } = hit;
    if (!this._miningTarget ||
        this._miningTarget.x !== x ||
        this._miningTarget.y !== y ||
        this._miningTarget.z !== z) {
      this._miningTarget   = hit;
      this._miningProgress = 0;
    }

    const block    = this._world.getBlock(x, y, z);
    const hardness = this._blockData[block]?.hardness ?? 1;
    this._miningProgress += dt / hardness;

    if (this._miningProgress >= 1) {
      this._world.setBlock(x, y, z, BLOCKS.AIR);
      this._inventory.addItem(block, 1);
      this._miningTarget   = null;
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
    const eye = this._player.getEyePosition();
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
    this._renderer.updateDayNight(dt);
    this._survival.update(dt, this._renderer.getDayProgress());
    this._hud.setSurvivalStats(
      this._survival.getOxygen(),
      this._survival.getEnergy(),
      this._survival.getTemperature(),
      this._survival.getHealth()
    );
    // TODO Phase 3: check this._survival.isAlive() here for death screen
    this._updateMining(dt);
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

const overlay = document.getElementById('overlay');
const overlayHint = document.getElementById('overlay-hint');
let game = null;

function requestLock() {
  const p = document.body.requestPointerLock();
  if (p && p.catch) p.catch(() => {
    if (overlayHint) overlayHint.textContent = 'Permití el bloqueo del cursor cuando el browser lo pida';
  });
}

overlay.addEventListener('click', () => {
  overlay.classList.add('hidden');
  requestLock();
  if (!game) game = new Game();
});

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) overlay.classList.remove('hidden');
});

// Re-lock if user clicks anywhere while game is running but pointer isn't locked
document.addEventListener('click', () => {
  if (game && !overlay.classList.contains('hidden')) return; // handled by overlay
  if (game && !document.pointerLockElement) requestLock();
});
