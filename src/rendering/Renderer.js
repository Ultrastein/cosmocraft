import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04040f);
    this.scene.fog = new THREE.Fog(0x04040f, 40, 100);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.05,
      200
    );

    this._renderer = new THREE.WebGLRenderer({ antialias: false });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this._renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x302050, 0.6));

    this.sun = new THREE.DirectionalLight(0xffe0b0, 1.2);
    this.sun.position.set(60, 120, 40);
    this.scene.add(this.sun);

    // Wireframe box shown around the targeted block
    const outlineGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.blockOutline = new THREE.Mesh(outlineGeo, outlineMat);
    this.blockOutline.visible = false;
    this.scene.add(this.blockOutline);

    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  showOutline(x, y, z) {
    this.blockOutline.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.blockOutline.visible = true;
  }

  hideOutline() {
    this.blockOutline.visible = false;
  }

  render() {
    this._renderer.render(this.scene, this.camera);
  }
}
