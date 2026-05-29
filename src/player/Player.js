export class Player {
  constructor(x, y, z) {
    this.position = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.creativeFlight = false;
    this.width = 0.6;
    this.height = 1.8;
    this.eyeOffset = 1.6;
    this.creativeFlight = false;

    this._keys = {};
    this._speed = 5;
    this._flightSpeed = 10;

    document.addEventListener('keydown', e => { this._keys[e.code] = true; });
    document.addEventListener('keyup',   e => { this._keys[e.code] = false; });
    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      this.yaw   -= e.movementX * 0.002;
      this.pitch  = Math.max(-Math.PI / 2 + 0.01,
                    Math.min( Math.PI / 2 - 0.01,
                    this.pitch - e.movementY * 0.002));
    });
  }

  update(dt) {
    if (this.creativeFlight) {
      this._updateCreativeFlight();
      return;
    }

    const spd = this._keys['ShiftLeft'] ? this._speed * 2 : this._speed;
    const fwdX = Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const rtX  = Math.cos(this.yaw);
    const rtZ  = Math.sin(this.yaw);

    let mx = 0, mz = 0;
    if (this._keys['KeyW']) { mx += fwdX; mz += fwdZ; }
    if (this._keys['KeyS']) { mx -= fwdX; mz -= fwdZ; }
    if (this._keys['KeyA']) { mx -= rtX;  mz -= rtZ; }
    if (this._keys['KeyD']) { mx += rtX;  mz += rtZ; }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    this.velocity.x = mx * spd;
    this.velocity.z = mz * spd;

    if (this.creativeFlight) {
      if (this._keys['Space']) {
        this.velocity.y = spd;
      } else if (this._keys['ShiftLeft']) {
        this.velocity.y = -spd;
      } else {
        this.velocity.y = 0;
      }
    } else {
      if (this._keys['Space'] && this.onGround) {
      this.velocity.y = 8;
    }
  }

  _updateCreativeFlight() {
    const spd = this._flightSpeed;
    const fwdX = Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const rtX  = Math.cos(this.yaw);
    const rtZ  = Math.sin(this.yaw);

    let mx = 0, my = 0, mz = 0;
    if (this._keys['KeyW']) { mx += fwdX; mz += fwdZ; }
    if (this._keys['KeyS']) { mx -= fwdX; mz -= fwdZ; }
    if (this._keys['KeyA']) { mx -= rtX;  mz -= rtZ; }
    if (this._keys['KeyD']) { mx += rtX;  mz += rtZ; }
    if (this._keys['Space']) my += 1;
    if (this._keys['ShiftLeft']) my -= 1;

    const len = Math.sqrt(mx * mx + my * my + mz * mz);
    if (len > 0) { mx /= len; my /= len; mz /= len; }

    this.velocity.x = mx * spd;
    this.velocity.y = my * spd;
    this.velocity.z = mz * spd;
    this.onGround = false;
  }
  }

  getEyePosition() {
    return {
      x: this.position.x,
      y: this.position.y + this.eyeOffset,
      z: this.position.z,
    };
  }

  getLookDirection() {
    return {
      x:  Math.sin(this.yaw)  * Math.cos(this.pitch),
      y:  Math.sin(this.pitch),
      z: -Math.cos(this.yaw)  * Math.cos(this.pitch),
    };
  }
}
