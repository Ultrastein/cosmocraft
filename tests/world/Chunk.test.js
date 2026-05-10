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
