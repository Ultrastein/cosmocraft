import { describe, it, expect } from 'vitest';
import { Physics } from '../../src/player/Physics.js';

describe('Physics noclip', () => {
  it('with noClip=true gravity is NOT applied (velocity.y stays 0)', () => {
    const world = { planet: { gravityScale: 1 }, getBlock: () => 1 };
    const physics = new Physics(world);
    const player = {
      position: { x: 0, y: 10, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      onGround: false,
      width: 0.6,
      height: 1.8,
    };
    physics.update(player, 1, { noClip: true });
    expect(player.velocity.y).toBe(0);
  });

  it('without noClip gravity IS applied (velocity.y goes negative)', () => {
    const world = { planet: { gravityScale: 1 }, getBlock: () => 0 };
    const physics = new Physics(world);
    const player = {
      position: { x: 0, y: 100, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      onGround: false,
      width: 0.6,
      height: 1.8,
    };
    physics.update(player, 1, { noClip: false });
    expect(player.velocity.y).toBeLessThan(0);
  });

  it('with noClip=true position updates directly from velocity', () => {
    const world = { planet: { gravityScale: 1 }, getBlock: () => 1 };
    const physics = new Physics(world);
    const player = {
      position: { x: 0, y: 10, z: 0 },
      velocity: { x: 5, y: 3, z: -2 },
      onGround: false,
      width: 0.6,
      height: 1.8,
    };
    physics.update(player, 1, { noClip: true });
    expect(player.position.x).toBeCloseTo(5);
    expect(player.position.y).toBeCloseTo(13);
    expect(player.position.z).toBeCloseTo(-2);
  });
});
