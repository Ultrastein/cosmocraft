import { describe, it, expect } from 'vitest';
import { World } from '../../src/world/World.js';

describe('World.markAllDirty', () => {
  it('marks all loaded chunks as dirty', () => {
    const world = new World(42);
    world.getChunk(0, 0, 0);
    world.getChunk(1, 0, 0);
    world.getChunk(0, 0, 1);
    // Clean them
    for (const chunk of world.getDirtyChunks()) world.markClean(chunk);
    expect(world.getDirtyChunks().length).toBe(0);
    // Mark all dirty
    world.markAllDirty();
    expect(world.getDirtyChunks().length).toBe(3);
  });

  it('does nothing on empty world', () => {
    const world = new World(42);
    expect(() => world.markAllDirty()).not.toThrow();
  });
});
