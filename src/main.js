import { Renderer }       from './rendering/Renderer.js';
import { buildChunkMesh } from './rendering/ChunkMesh.js';
import { HUD }            from './rendering/HUD.js';
import { World }          from './world/World.js';
import { CHUNK_SIZE }     from './world/Chunk.js';
import { BLOCKS, BLOCK_DATA } from './world/BlockRegistry.js';
import { DEFAULT_PLANET, PLANETS, getPlanetById } from './world/Planets.js';
import { Player }         from './player/Player.js';
import { Physics }        from './player/Physics.js';
import { Inventory }      from './player/Inventory.js';
import { raycast }        from './utils/MathUtils.js';
import { Survival }       from './systems/Survival.js';
import { TravelSystem }   from './systems/TravelSystem.js';
import { AdminSettings }  from './systems/AdminSettings.js';
import { PauseMenu }      from './ui/PauseMenu.js';

const RENDER_DISTANCE       = 4;
const MINING_REACH          = 5;
const MESH_BUILDS_PER_FRAME = 4;
const SHIP_X = 6;
const SHIP_Z = 6;

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
];

class Game {
  constructor(mode = 'survival', options = {}) {
    this.mode = mode;
    this.currentPlanet = DEFAULT_PLANET;
    this._requestLock = options.requestLock ?? (() => {});

    this._renderer     = new Renderer();
    this._renderer.setPlanet(this.currentPlanet);
    this._world        = new World(this.currentPlanet);
    const spawnY       = this._findSpawnY(0, 0);
    this._player       = new Player(0.5, spawnY, 0.5);
    this._player.creativeFlight = (this.mode === 'creative' || this.mode === 'inspector');
    this._physics      = new Physics(this._world);
    this._inventory    = new Inventory();
    this._hud          = new HUD(this._inventory);
    this._survival     = new Survival();
    this._travel       = new TravelSystem(this._renderer.scene);
    this._meshes       = new Map();
    this._blockData    = BLOCK_DATA;
    this._adminSettings = new AdminSettings();
    this._pauseMenu    = new PauseMenu(this, this._adminSettings);
    this._renderer.applySettings(this._pauseMenu.getGraphicsSettings());

    this._miningTarget   = null;
    this._miningProgress = 0;
    this._mouseButtons   = {};
    this._travelMapOpen  = false;

    if (this.mode === 'creative') {
      this._inventory.setCreative(true, CREATIVE_BLOCKS);
    } else {
      this._inventory.addItem(BLOCKS.REGOLITH,   32);
      this._inventory.addItem(BLOCKS.STEEL_BLOCK, 16);
      this._inventory.addItem(BLOCKS.IRON_ORE,   16);
    }

    this._hud.setWorldInfo(this.mode, this.currentPlanet.name);
    this._bindInput();
    this._preGenerate();
    this._placeShipForCurrentPlanet();

    this._lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  isModalOpen() {
    return this._travelMapOpen || this._pauseMenu.isOpen();
  }

  closeTravelMap(lockAgain = true) {
    const travelUI = document.getElementById('travel-ui');
    travelUI?.classList.add('hidden');
    this._travelMapOpen = false;
    if (lockAgain) this._requestLock();
  }

  setMode(newMode) {
    this.mode = newMode;
    this._player.creativeFlight = (newMode === 'creative' || newMode === 'inspector');
    if (newMode === 'creative') {
      this._inventory.setCreative(true, CREATIVE_BLOCKS);
    } else {
      this._inventory.setCreative(false);
      if (newMode === 'survival') {
        this._inventory.addItem(BLOCKS.REGOLITH,   32);
        this._inventory.addItem(BLOCKS.STEEL_BLOCK, 16);
        this._inventory.addItem(BLOCKS.IRON_ORE,   16);
      }
    }
    this._survival = new Survival();
    this._hud.setWorldInfo(newMode, this.currentPlanet.name);
    if (newMode !== 'inspector') this._hud.setInspectorInfo(null);
  }

  _findSpawnY(wx, wz) {
    for (let wy = 48; wy >= 0; wy--) {
      if (this._world.getBlock(wx, wy, wz) !== BLOCKS.AIR &&
          this._world.getBlock(wx, wy + 1, wz) === BLOCKS.AIR) {
        return wy + 1 + 0.01;
      }
    }
    return 16;
  }

  _preGenerate() {
    for (let cx = -2; cx <= 2; cx++)
      for (let cz = -2; cz <= 2; cz++)
        for (let cy = 0; cy <= 1; cy++)
          this._world.getChunk(cx, cy, cz);
  }

  _placeShipForCurrentPlanet() {
    const spawnY = this._findSpawnY(SHIP_X, SHIP_Z);
    const floorY = Math.floor(spawnY) - 1;

    for (let x = SHIP_X - 1; x <= SHIP_X + 1; x++) {
      for (let z = SHIP_Z - 1; z <= SHIP_Z + 1; z++) {
        this._world.setBlock(x, floorY, z, BLOCKS.LAUNCH_PAD);
        for (let y = floorY + 1; y <= floorY + 5; y++) {
          this._world.setBlock(x, y, z, BLOCKS.AIR);
        }
      }
    }

    this._travel.setPosition(SHIP_X + 0.5, floorY + 1.01, SHIP_Z + 0.5);
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
      if (e.code === 'Escape') {
        if (this._travelMapOpen) {
          this.closeTravelMap(false);
        } else if (this._pauseMenu.isOpen()) {
          this._pauseMenu.close();
        } else {
          this._pauseMenu.open();
        }
      }
      if (e.code === 'KeyF' && !this._travelMapOpen && this._travel.canInteract(this._player)) {
        this._openTravelMap();
      }
    });
  }

  _openTravelMap() {
    this._travelMapOpen = true;
    this._hud.setInteractionPrompt(null);
    this._renderPlanetList();
    document.getElementById('travel-ui')?.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  _renderPlanetList() {
    const planetList = document.getElementById('planet-list');
    if (!planetList) return;

    planetList.innerHTML = '';
    for (const planet of PLANETS) {
      const btn = document.createElement('button');
      const isCurrent = planet.id === this.currentPlanet.id;
      btn.textContent = isCurrent ? `${planet.name} (Actual)` : planet.name;
      btn.disabled = isCurrent;
      btn.style.cssText = [
        'padding:10px 14px',
        'font-size:16px',
        'cursor:pointer',
        'background:' + (isCurrent ? '#555' : '#28f'),
        'color:#fff',
        'border:none',
        'border-radius:4px',
        'min-width:220px',
      ].join(';');
      btn.addEventListener('click', () => {
        this.travelTo(planet.id);
        this.closeTravelMap(true);
      });
      planetList.appendChild(btn);
    }
  }

  travelTo(planetId) {
    const nextPlanet = getPlanetById(planetId);
    if (nextPlanet.id === this.currentPlanet.id) return;

    this.currentPlanet = nextPlanet;
    this._renderer.setPlanet(this.currentPlanet);
    this._disposeChunkMeshes();

    this._world = new World(this.currentPlanet);
    this._physics = new Physics(this._world);
    this._player.position.x = 0.5;
    this._player.position.y = this._findSpawnY(0, 0);
    this._player.position.z = 0.5;
    this._player.velocity = { x: 0, y: 0, z: 0 };

    this._preGenerate();
    this._placeShipForCurrentPlanet();
    this._hud.setWorldInfo(this.mode, this.currentPlanet.name);
  }

  _disposeChunkMeshes() {
    for (const mesh of this._meshes.values()) {
      this._renderer.scene.remove(mesh);
      mesh.geometry?.dispose?.();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose?.());
      } else {
        mesh.material?.dispose?.();
      }
    }
    this._meshes.clear();
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
    const hardness = this.mode === 'creative' ? 0.08 : this._blockData[block]?.hardness ?? 1;
    this._miningProgress += dt / hardness;

    if (this._miningProgress >= 1) {
      this._world.setBlock(x, y, z, BLOCKS.AIR);
      if (this.mode !== 'creative') this._inventory.addItem(block, 1);
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

      const mesh = buildChunkMesh(
        chunk,
        (x, y, z) => this._world.getBlock(x, y, z),
        (id) => this._adminSettings.getColor(id)
      );
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
    const rd = this._pauseMenu?.getGraphicsSettings().renderDistance ?? RENDER_DISTANCE;
    for (let cx = px - rd; cx <= px + rd; cx++)
      for (let cz = pz - rd; cz <= pz + rd; cz++)
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

  _updateInteractionPrompt() {
    if (this._travelMapOpen) {
      this._hud.setInteractionPrompt(null);
      return;
    }
    this._hud.setInteractionPrompt(this._travel.canInteract(this._player) ? 'F viajar' : null);
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;

    const isInspector = this.mode === 'inspector';
    const isFlight    = this.mode === 'creative' || isInspector;

    this._player.creativeFlight = isFlight;
    this._player.update(dt);
    this._physics.update(this._player, dt, {
      creativeFlight: isFlight,
      gravityScale:   this.currentPlanet.gravityScale,
      noClip:         isInspector,
    });
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

    // Inspector overlay: show targeted block name + coords + chunk
    if (isInspector) {
      const hit = this._raycastWorld();
      if (hit.hit) {
        const blockId   = this._world.getBlock(hit.x, hit.y, hit.z);
        const blockName = BLOCK_DATA[blockId]?.name ?? 'Unknown';
        this._hud.setInspectorInfo({
          blockName,
          x:  hit.x,
          y:  hit.y,
          z:  hit.z,
          cx: Math.floor(hit.x / CHUNK_SIZE),
          cy: Math.floor(hit.y / CHUNK_SIZE),
          cz: Math.floor(hit.z / CHUNK_SIZE),
        });
      } else {
        this._hud.setInspectorInfo(null);
      }
    }

    this._updateInteractionPrompt();
    if (!isInspector) this._updateMining(dt);
    this._loadChunks();
    this._updateChunkMeshes();
    this._updateCamera();
    this._updateOutline();
    this._hud.setMiningProgress(isInspector ? 0 : this._miningProgress);
    this._hud.draw();
    this._renderer.render();

    requestAnimationFrame(t => this._loop(t));
  }
}

const overlay = document.getElementById('overlay');
const overlayHint = document.getElementById('overlay-hint');
const btnSurvival = document.getElementById('btn-survival');
const btnCreative = document.getElementById('btn-creative');
const travelUI = document.getElementById('travel-ui');
const btnCancelTravel = document.getElementById('btn-cancel-travel');

let game = null;

function requestLock() {
  const p = document.body.requestPointerLock();
  if (p && p.catch) p.catch(() => {
    if (overlayHint) overlayHint.textContent = 'Permiti el bloqueo del cursor cuando el browser lo pida';
  });
}

function showResumeOverlay() {
  btnSurvival?.style.setProperty('display', 'none');
  btnCreative?.style.setProperty('display', 'none');
  if (overlayHint) overlayHint.textContent = 'Click para continuar';
}

function startGame(mode) {
  overlay.classList.add('hidden');
  requestLock();
  if (!game) {
    game = new Game(mode, { requestLock });
    showResumeOverlay();
  }
}

btnSurvival?.addEventListener('click', () => startGame('survival'));
btnCreative?.addEventListener('click', () => startGame('creative'));
const btnInspector = document.getElementById('btn-inspector');
btnInspector?.addEventListener('click', () => startGame('inspector'));

overlay?.addEventListener('click', () => {
  if (!game) return;
  overlay.classList.add('hidden');
  requestLock();
});

btnCancelTravel?.addEventListener('click', () => {
  game?.closeTravelMap(true);
});

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && !game?.isModalOpen()) {
    overlay.classList.remove('hidden');
  }
});

document.addEventListener('click', (e) => {
  if (!game || document.pointerLockElement) return;
  if (!overlay.classList.contains('hidden')) return;
  if (travelUI && !travelUI.classList.contains('hidden') && travelUI.contains(e.target)) return;
  requestLock();
});
