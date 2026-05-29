import * as THREE from 'three';

export class Spaceship {
  constructor(scene, x, y, z) {
    this.position = { x, y, z };
    
    const geometry = new THREE.CylinderGeometry(1, 1.5, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y + 2, z);
    
    const noseGeo = new THREE.ConeGeometry(1, 2, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.y = 3;
    this.mesh.add(nose);
    
    scene.add(this.mesh);
  }
  
  checkInteraction(playerEye, lookDir) {
    const dx = this.position.x - playerEye.x;
    const dy = this.position.y + 2 - playerEye.y;
    const dz = this.position.z - playerEye.z;
    const distSq = dx*dx + dy*dy + dz*dz;
    
    if (distSq < 36) { 
      const dot = (dx*lookDir.x + dy*lookDir.y + dz*lookDir.z) / Math.sqrt(distSq);
      if (dot > 0.85) return true;
    }
    return false;
  }

  destroy(scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
