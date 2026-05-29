import * as THREE from 'three';

export class TravelSystem {
  constructor(scene) {
    this._scene = scene;
    this._ship = null;
    this._position = { x: 0, y: 0, z: 0 };
  }

  setPosition(x, y, z) {
    this._position = { x, y, z };
    if (!this._ship) {
      this._ship = this._createShipMesh();
      this._scene.add(this._ship);
    }
    this._ship.position.set(x, y, z);
  }

  dispose() {
    if (!this._ship) return;
    this._scene.remove(this._ship);
    this._ship.traverse(child => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    this._ship = null;
  }

  canInteract(player) {
    if (!this._ship) return false;

    const eye = player.getEyePosition();
    const look = player.getLookDirection();
    const target = {
      x: this._position.x,
      y: this._position.y + 2.2,
      z: this._position.z,
    };

    const dx = target.x - eye.x;
    const dy = target.y - eye.y;
    const dz = target.z - eye.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > 10) return false;
    if (dist < 4) return true;

    const dot = (dx / dist) * look.x + (dy / dist) * look.y + (dz / dist) * look.z;
    return dot > 0.65;
  }

  _createShipMesh() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xb8c2d0 });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0xff7040 });
    const finMat = new THREE.MeshLambertMaterial({ color: 0x506080 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x52b8ff });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 3.2, 12), bodyMat);
    body.position.y = 2.1;
    group.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.1, 12), noseMat);
    nose.position.y = 4.25;
    group.add(nose);

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), glassMat);
    cockpit.position.set(0, 2.85, -0.48);
    cockpit.scale.set(1, 0.7, 0.35);
    group.add(cockpit);

    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.5, 0.45, 10), finMat);
    engine.position.y = 0.25;
    group.add(engine);

    const finGeometry = new THREE.BoxGeometry(0.18, 1.15, 0.75);
    for (const [x, z, rot] of [
      [0.62, 0, 0],
      [-0.62, 0, 0],
      [0, 0.62, Math.PI / 2],
      [0, -0.62, Math.PI / 2],
    ]) {
      const fin = new THREE.Mesh(finGeometry, finMat);
      fin.position.set(x, 0.85, z);
      fin.rotation.y = rot;
      group.add(fin);
    }

    const light = new THREE.PointLight(0x52b8ff, 0.65, 8);
    light.position.set(0, 1.2, 0);
    group.add(light);

    return group;
  }
}
