import { describe, it, expect } from 'vitest';
import { BLOCKS } from '../../src/world/BlockRegistry.js';
import { floodFillRocket, validateRocket, BUILDABLE_BLOCKS } from '../../src/systems/RocketLogic.js';

function makeWorld(blockMap) {
  return { getBlock: (x, y, z) => blockMap[`${x},${y},${z}`] ?? BLOCKS.AIR };
}

describe('floodFillRocket', () => {
  it('returns single starting block', () => {
    const world = makeWorld({ '0,0,0': BLOCKS.CAPSULE });
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ x: 0, y: 0, z: 0, blockId: BLOCKS.CAPSULE });
  });

  it('collects all connected buildable blocks', () => {
    const world = makeWorld({
      '0,0,0': BLOCKS.CAPSULE,
      '1,0,0': BLOCKS.THRUSTER,
      '0,1,0': BLOCKS.COMMAND_PANEL,
    });
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(3);
  });

  it('does not cross natural blocks (REGOLITH)', () => {
    const world = makeWorld({
      '0,0,0': BLOCKS.CAPSULE,
      '1,0,0': BLOCKS.REGOLITH,   // natural — stops here
      '2,0,0': BLOCKS.THRUSTER,   // unreachable
    });
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(1);
  });

  it('respects 512-block limit', () => {
    const blockMap = {};
    for (let i = 0; i < 600; i++) blockMap[`${i},0,0`] = BLOCKS.STEEL_BLOCK;
    const world = makeWorld(blockMap);
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result.length).toBeLessThanOrEqual(512);
  });

  it('returns empty array when starting block is AIR', () => {
    const world = makeWorld({});
    const result = floodFillRocket(world, 0, 0, 0);
    expect(result).toHaveLength(0);
  });
});

describe('validateRocket', () => {
  it('returns valid for capsule + thruster combo with enough thrust', () => {
    // 1 CAPSULE (w:5) + 2 THRUSTERs (w:3 each, thrust:15 each) = weight:11, thrust:30 >= 13.2
    const blocks = [
      { blockId: BLOCKS.CAPSULE },
      { blockId: BLOCKS.THRUSTER },
      { blockId: BLOCKS.THRUSTER },
    ];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when no capsule', () => {
    const blocks = [
      { blockId: BLOCKS.THRUSTER },
      { blockId: BLOCKS.THRUSTER },
    ];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(false);
    expect(result.hasCapsule).toBe(false);
  });

  it('returns invalid when no thruster', () => {
    const blocks = [{ blockId: BLOCKS.CAPSULE }];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(false);
    expect(result.hasThruster).toBe(false);
  });

  it('returns invalid when thrust too low for weight', () => {
    // 1 CAPSULE(5) + 10 REACTOR_CORE(5 each) + 1 THRUSTER(thrust:15) = weight:60, thrust:15 < 72
    const blocks = [
      { blockId: BLOCKS.CAPSULE },
      ...Array(10).fill({ blockId: BLOCKS.REACTOR_CORE }),
      { blockId: BLOCKS.THRUSTER },
    ];
    const result = validateRocket(blocks);
    expect(result.valid).toBe(false);
  });

  it('exposes totalWeight, totalThrust, needed', () => {
    const blocks = [{ blockId: BLOCKS.CAPSULE }, { blockId: BLOCKS.THRUSTER }];
    const result = validateRocket(blocks);
    expect(result.totalWeight).toBe(8);  // 5 + 3
    expect(result.totalThrust).toBe(15);
    expect(typeof result.needed).toBe('number');
  });
});

describe('BUILDABLE_BLOCKS', () => {
  it('includes THRUSTER, CAPSULE, COMMAND_PANEL', () => {
    expect(BUILDABLE_BLOCKS.has(BLOCKS.THRUSTER)).toBe(true);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.CAPSULE)).toBe(true);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.COMMAND_PANEL)).toBe(true);
  });

  it('excludes natural blocks', () => {
    expect(BUILDABLE_BLOCKS.has(BLOCKS.REGOLITH)).toBe(false);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.IRON_ORE)).toBe(false);
    expect(BUILDABLE_BLOCKS.has(BLOCKS.ICE_BLOCK)).toBe(false);
  });

  it('contains exactly 10 buildable block types', () => {
    expect(BUILDABLE_BLOCKS.size).toBe(10);
  });
});
