import { BLOCKS } from '../world/BlockRegistry.js';

const INTERACT_DISTANCE = 4;
const INTERACT_BLOCKS = new Set([BLOCKS.CAPSULE, BLOCKS.COMMAND_PANEL]);

export class RocketInteraction {
  constructor(world) {
    this._world = world;
  }

  /**
   * Check if player is within reach of a CAPSULE or COMMAND_PANEL.
   * Scans a 5×6×5 volume around the player.
   * @returns {{ canInteract, blockX, blockY, blockZ, blockId } | null}
   */
  check(player) {
    const eye = player.getEyePosition();
    const px = Math.round(eye.x);
    const py = Math.round(eye.y - 0.8);
    const pz = Math.round(eye.z);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 3; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          const bx = px + dx, by = py + dy, bz = pz + dz;
          const blockId = this._world.getBlock(bx, by, bz);
          if (!INTERACT_BLOCKS.has(blockId)) continue;

          const dist = Math.sqrt(
            (bx + 0.5 - eye.x) ** 2 +
            (by + 0.5 - eye.y) ** 2 +
            (bz + 0.5 - eye.z) ** 2
          );
          if (dist <= INTERACT_DISTANCE) {
            return { canInteract: true, blockX: bx, blockY: by, blockZ: bz, blockId };
          }
        }
      }
    }
    return null;
  }

  /** Returns HUD prompt string or null. */
  getPrompt(player) {
    const result = this.check(player);
    if (!result) return null;
    return result.blockId === BLOCKS.CAPSULE
      ? 'F pilotar cohete'
      : 'F activar lanzamiento';
  }

  /** Call after travelTo so the new world is searched. */
  setWorld(world) {
    this._world = world;
  }
}
