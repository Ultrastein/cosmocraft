import * as THREE from 'three';
import { BLOCK_DATA } from '../world/BlockRegistry.js';
import { validateRocket } from './RocketLogic.js';

export class RocketVehicle {
  /**
   * @param {THREE.Scene} scene
   * @param {{ x, y, z, blockId }[]} blocks  — already removed from world
   * @param {((blockId: number) => number) | null} getColor
   */
  constructor(scene, blocks, getColor = null) {
    this._scene = scene;
    this.blocks = blocks;

    // Center of mass
    let cx = 0, cy = 0, cz = 0;
    for (const b of blocks) { cx += b.x; cy += b.y; cz += b.z; }
    cx /= blocks.length;
    cy /= blocks.length;
    cz /= blocks.length;

    this.position = { x: cx, y: cy, z: cz };
    this.yaw = 0;
    this.velocity = { x: 0, y: 0, z: 0 };

    const v = validateRocket(blocks);
    this.thrustPower = v.totalThrust;
    this.totalWeight = v.totalWeight;

    // Build mesh: one BoxGeometry per block, grouped
    this.group = new THREE.Group();
    this.group.position.set(cx, cy, cz);

    for (const b of blocks) {
      const colorNum = getColor
        ? getColor(b.blockId)
        : (BLOCK_DATA[b.blockId]?.color ?? 0x888888);
      const r = ((colorNum >> 16) & 0xff) / 255;
      const g = ((colorNum >> 8)  & 0xff) / 255;
      const bl = (colorNum        & 0xff) / 255;

      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, bl) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x - cx, b.y - cy, b.z - cz);
      this.group.add(mesh);
    }

    scene.add(this.group);
  }

  /**
   * Returns world-space point above center of mass for camera tracking.
   */
  getEyePosition() {
    return {
      x: this.position.x,
      y: this.position.y + 2,
      z: this.position.z,
    };
  }

  /**
   * Flight physics. Call every frame while in pilot mode.
   * @param {number} dt  seconds
   * @param {Record<string,boolean>} keys  player._keys
   * @param {number} gravityScale  from current planet
   */
  update(dt, keys, gravityScale = 1) {
    const ratio = this.thrustPower / this.totalWeight;
    const accel = ratio * 8;
    const maxSpeed = ratio * 12;

    // Yaw steering
    if (keys['KeyA']) this.yaw += 1.5 * dt;
    if (keys['KeyD']) this.yaw -= 1.5 * dt;

    const fwdX = Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);

    // Horizontal thrust
    if (keys['KeyW']) {
      this.velocity.x += fwdX * accel * dt;
      this.velocity.z += fwdZ * accel * dt;
    }
    if (keys['KeyS']) {
      this.velocity.x -= fwdX * accel * dt;
      this.velocity.z -= fwdZ * accel * dt;
    }

    // Vertical thrust
    if (keys['Space'])      this.velocity.y += accel * dt;
    if (keys['ShiftLeft'])  this.velocity.y -= accel * dt;

    // Gravity (suppressed while pressing Space)
    if (!keys['Space']) this.velocity.y -= 9.8 * gravityScale * dt;

    // Horizontal drag
    const drag = Math.pow(0.88, dt * 60);
    this.velocity.x *= drag;
    this.velocity.z *= drag;

    // Speed clamp
    const spd = Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
    if (spd > maxSpeed) {
      const s = maxSpeed / spd;
      this.velocity.x *= s;
      this.velocity.y *= s;
      this.velocity.z *= s;
    }

    // Integrate
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Floor clamp
    if (this.position.y < 1) {
      this.position.y = 1;
      this.velocity.y = 0;
    }

    // Sync mesh
    this.group.position.set(this.position.x, this.position.y, this.position.z);
    this.group.rotation.y = this.yaw;
  }

  /** Remove mesh from scene and free GPU memory. */
  dispose() {
    this._scene.remove(this.group);
    this.group.traverse(child => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
  }
}
