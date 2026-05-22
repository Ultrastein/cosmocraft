import { BLOCK_DATA } from '../world/BlockRegistry.js';

const TERMINAL_VEL = -50;
const BASE_GRAVITY = -22;

export class Physics {
  constructor(world) {
    this._world = world;
  }

  update(player, dt, options = {}) {
    const creativeFlight = options.creativeFlight ?? player.creativeFlight;
    const noClip = options.noClip ?? false;
    const gravityScale = options.gravityScale ?? this._world.planet?.gravityScale ?? 1;

    // noClip: free movement, skip gravity and collision entirely
    if (noClip) {
      player.position.x += player.velocity.x * dt;
      player.position.y += player.velocity.y * dt;
      player.position.z += player.velocity.z * dt;
      return;
    }

    if (!creativeFlight) {
      const gravity = BASE_GRAVITY * gravityScale;
      player.velocity.y = Math.max(player.velocity.y + gravity * dt, TERMINAL_VEL);
    }

    this._moveAxis(player, 'x', player.velocity.x * dt);
    this._moveAxis(player, 'y', player.velocity.y * dt);
    this._moveAxis(player, 'z', player.velocity.z * dt);
  }

  _moveAxis(player, axis, delta) {
    player.position[axis] += delta;
    if (this._collides(player)) {
      player.position[axis] -= delta;
      if (axis === 'y') {
        player.onGround = delta < 0;
        player.velocity.y = 0;
      } else {
        player.velocity[axis] = 0;
      }
    } else if (axis === 'y' && delta < 0) {
      player.onGround = false;
    }
  }

  _collides(player) {
    const hw = player.width / 2;
    const x0 = player.position.x - hw, x1 = player.position.x + hw;
    const y0 = player.position.y,      y1 = player.position.y + player.height;
    const z0 = player.position.z - hw, z1 = player.position.z + hw;

    for (let bx = Math.floor(x0); bx <= Math.floor(x1 - 0.001); bx++) {
      for (let by = Math.floor(y0); by <= Math.floor(y1 - 0.001); by++) {
        for (let bz = Math.floor(z0); bz <= Math.floor(z1 - 0.001); bz++) {
          const block = this._world.getBlock(bx, by, bz);
          if (BLOCK_DATA[block]?.solid) return true;
        }
      }
    }
    return false;
  }
}
