import { Chunk, CHUNK_SIZE } from './Chunk.js';
import { BLOCKS } from './BlockRegistry.js';
import { SimplexNoise } from '../utils/Noise.js';

const TERRAIN_BASE = 8;
const TERRAIN_AMPLITUDE = 6;

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
