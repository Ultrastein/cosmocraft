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
