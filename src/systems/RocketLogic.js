import { BLOCKS, BLOCK_DATA } from '../world/BlockRegistry.js';

/**
 * Blocks that can be part of a rocket structure.
 * Natural terrain blocks are excluded so the flood fill
 * doesn't absorb the ground.
 */
export const BUILDABLE_BLOCKS = new Set([
  BLOCKS.STEEL_BLOCK,
  BLOCKS.SOLAR_PANEL,
  BLOCKS.OXYGEN_GENERATOR,
  BLOCKS.REACTOR_CORE,
  BLOCKS.LAUNCH_PAD,
  BLOCKS.COMPUTER_BLOCK,
  BLOCKS.QUANTUM_CRYSTAL,
  BLOCKS.THRUSTER,
  BLOCKS.COMMAND_PANEL,
  BLOCKS.CAPSULE,
]);

const DIRECTIONS = [
  [1,0,0],[-1,0,0],
  [0,1,0],[0,-1,0],
  [0,0,1],[0,0,-1],
];

/**
 * BFS from (startX, startY, startZ) collecting all connected
 * buildable blocks. Max 512 blocks.
 * @param {{ getBlock(x,y,z): number }} world
 * @returns {{ x, y, z, blockId }[]}
 */
export function floodFillRocket(world, startX, startY, startZ) {
  const startId = world.getBlock(startX, startY, startZ);
  if (!BUILDABLE_BLOCKS.has(startId)) return [];

  const visited = new Set();
  const blocks = [];
  const queue = [[startX, startY, startZ]];
  const key = (x, y, z) => `${x},${y},${z}`;

  visited.add(key(startX, startY, startZ));

  while (queue.length > 0 && blocks.length < 512) {
    const [x, y, z] = queue.shift();
    const blockId = world.getBlock(x, y, z);
    if (!BUILDABLE_BLOCKS.has(blockId)) continue;

    blocks.push({ x, y, z, blockId });

    for (const [dx, dy, dz] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      const nk = key(nx, ny, nz);
      if (!visited.has(nk)) {
        visited.add(nk);
        queue.push([nx, ny, nz]);
      }
    }
  }

  return blocks;
}

/**
 * Validates that a set of blocks forms a launchable rocket.
 * Condition: hasCapsule && hasThruster && totalThrust >= totalWeight * 1.2
 * @param {{ blockId: number }[]} blocks
 * @returns {{ valid, hasCapsule, hasThruster, totalWeight, totalThrust, needed }}
 */
export function validateRocket(blocks) {
  let totalWeight = 0;
  let totalThrust = 0;
  let hasCapsule = false;
  let hasThruster = false;

  for (const { blockId } of blocks) {
    const data = BLOCK_DATA[blockId];
    if (!data) continue;
    totalWeight += data.weight ?? 1;
    totalThrust += data.thrust ?? 0;
    if (blockId === BLOCKS.CAPSULE) hasCapsule = true;
    if (blockId === BLOCKS.THRUSTER) hasThruster = true;
  }

  const needed = totalWeight * 1.2;
  const valid = hasCapsule && hasThruster && totalThrust >= needed;

  return { valid, hasCapsule, hasThruster, totalWeight, totalThrust, needed };
}
