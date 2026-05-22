import { CHUNK_SIZE } from './Chunk.js';
import { WorldGen } from './WorldGen.js';
import { BLOCKS } from './BlockRegistry.js';
import { normalizePlanetConfig } from './Planets.js';

export class World {
  constructor(seedOrPlanet = 12345) {
    this._chunks = new Map();
    this.planet = normalizePlanetConfig(seedOrPlanet);
    this._gen = new WorldGen(this.planet);
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
    if (wy < -CHUNK_SIZE) return BLOCKS.REGOLITH;
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

  clear() {
    this._chunks.clear();
  }

  markClean(chunk) {
    chunk.dirty = false;
  }

  markAllDirty() {
    for (const chunk of this._chunks.values()) {
      chunk.dirty = true;
    }
  }
}
