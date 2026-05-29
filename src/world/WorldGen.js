import { Chunk, CHUNK_SIZE } from './Chunk.js';
import { BLOCKS } from './BlockRegistry.js';
import { SimplexNoise } from '../utils/Noise.js';
import { normalizePlanetConfig } from './Planets.js';

export class WorldGen {
  constructor(seedOrPlanet = 12345) {
    this.planet = normalizePlanetConfig(seedOrPlanet);
    this.noise = new SimplexNoise(this.planet.seed);
    this.oreNoise = new SimplexNoise(this.planet.seed ^ 0xdeadbeef);
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
    const terrain = this.planet.terrain;
    const n = this.noise.noise2D(wx / terrain.noiseScale, wz / terrain.noiseScale);
    return Math.floor(terrain.baseHeight + n * terrain.amplitude);
  }

  _blockAt(wx, wy, wz, surfaceY) {
    const terrain = this.planet.terrain;

    if (wy > surfaceY) return BLOCKS.AIR;
    if (wy === surfaceY) return terrain.surfaceBlock;
    if (wy >= surfaceY - 3) return terrain.crustBlock;

    const ore = this.oreNoise.noise3D(wx / 8, wy / 8, wz / 8);
    for (const resource of terrain.ores) {
      if (ore > resource.threshold) return resource.block;
    }
    return terrain.crustBlock;
  }
}
