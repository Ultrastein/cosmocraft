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
