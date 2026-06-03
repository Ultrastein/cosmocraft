import { describe, it, expect } from 'vitest';
import { BLOCKS } from '../../src/world/BlockRegistry.js';
import { RocketInteraction } from '../../src/systems/RocketInteraction.js';

function makeWorld(blockMap) {
  return { getBlock: (x, y, z) => blockMap[`${x},${y},${z}`] ?? BLOCKS.AIR };
}

function makePlayer(px, py, pz) {
  return {
    getEyePosition: () => ({ x: px, y: py + 1.6, z: pz }),
  };
}

describe('RocketInteraction', () => {
  it('returns null when no capsule or command panel nearby', () => {
    const world = makeWorld({ '10,5,10': BLOCKS.REGOLITH });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).toBeNull();
  });

  it('detects capsule within 4 blocks', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.CAPSULE });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).not.toBeNull();
    expect(result.blockId).toBe(BLOCKS.CAPSULE);
  });

  it('detects command panel within 4 blocks', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.COMMAND_PANEL });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).not.toBeNull();
    expect(result.blockId).toBe(BLOCKS.COMMAND_PANEL);
  });

  it('returns null when capsule is farther than 4 blocks', () => {
    const world = makeWorld({ '10,0,0': BLOCKS.CAPSULE });
    const ri = new RocketInteraction(world);
    const result = ri.check(makePlayer(0, 0, 0));
    expect(result).toBeNull();
  });

  it('getPrompt returns pilotar for capsule', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.CAPSULE });
    const ri = new RocketInteraction(world);
    expect(ri.getPrompt(makePlayer(0, 0, 0))).toContain('pilotar');
  });

  it('getPrompt returns activar for command panel', () => {
    const world = makeWorld({ '1,1,0': BLOCKS.COMMAND_PANEL });
    const ri = new RocketInteraction(world);
    expect(ri.getPrompt(makePlayer(0, 0, 0))).toContain('activar');
  });

  it('getPrompt returns null when nothing nearby', () => {
    const world = makeWorld({});
    const ri = new RocketInteraction(world);
    expect(ri.getPrompt(makePlayer(0, 0, 0))).toBeNull();
  });
});
