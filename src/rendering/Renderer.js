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

    this._ambientLight = new THREE.AmbientLight(0x302050, 0.6);
    this.scene.add(this._ambientLight);

    this.sun = new THREE.DirectionalLight(0xffe0b0, 1.2);
    this.sun.position.set(60, 120, 40);
    this.scene.add(this.sun);

    this._dayTime   = 0;      // 0 = noon, 0.5 = midnight
    this._dayLength = 600;    // seconds for a full cycle

    // Pre-allocate reusable sky color objects to avoid per-frame GC pressure
    this._daySkyColor = new THREE.Color(0x0c0c23);
    this._nightSkyColor = new THREE.Color(0x04040f);
    this._skyColor = new THREE.Color(0x04040f);

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

  getDayProgress() {
    return this._dayTime;
  }

  setPlanet(planet) {
    const atmosphere = planet?.atmosphere;
    if (!atmosphere) return;

    this._daySkyColor.setHex(atmosphere.daySky);
    this._nightSkyColor.setHex(atmosphere.nightSky);
    this.updateDayNight(0);
    // Re-apply graphics settings so fog distances reflect current render distance.
    // If applySettings has not been called yet, use planet atmosphere defaults.
    if (this._settings) {
      this.applySettings(this._settings);
    } else {
      this.scene.fog.near = atmosphere.fogNear;
      this.scene.fog.far  = atmosphere.fogFar;
    }
  }

  /**
   * Apply graphics settings. Call at startup and whenever settings change.
   * @param {{ renderDistance?: number, fog?: boolean, quality?: string }} settings
   */
  applySettings({ renderDistance = 4, fog = true, quality = 'medium' } = {}) {
    const CHUNK_SIZE = 16;
    const far = renderDistance * CHUNK_SIZE * 2 + 64;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();

    if (fog) {
      this.scene.fog.near = renderDistance * CHUNK_SIZE * 0.5;
      this.scene.fog.far  = far - 16;
    } else {
      this.scene.fog.near = 100000;
      this.scene.fog.far  = 100001;
    }

    const ratios = { low: 0.5, medium: 1.0, high: window.devicePixelRatio || 1.0 };
    this._renderer.setPixelRatio(ratios[quality] ?? 1.0);

    this._settings = { renderDistance, fog, quality };
  }

  updateDayNight(dt) {
    this._dayTime = (this._dayTime + dt / this._dayLength) % 1;

    // Angle: 0 = noon (sun at top), 0.5 = midnight (sun below)
    const angle = this._dayTime * Math.PI * 2;
    const sunX = Math.sin(angle) * 200;
    const sunY = Math.cos(angle) * 200;
    this.sun.position.set(sunX, sunY, 40);

    // Intensity: bright at noon, dim at midnight
    const t = Math.cos(angle); // +1 at noon, -1 at midnight
    const intensity = 0.75 + t * 0.65;
    this.sun.intensity = Math.max(0.1, intensity);

    // Color: warm at noon, cool at night
    const warmth = Math.max(0, t); // 0..1
    const r = Math.round(0x70 + warmth * (0xff - 0x70));
    const g = Math.round(0x60 + warmth * (0xe0 - 0x60));
    const b = Math.round(0x80 + warmth * (0xb0 - 0x80));
    this.sun.color.setRGB(r / 255, g / 255, b / 255);

    // Ambient: brighter at day
    const ambientI = 0.15 + warmth * 0.45;
    this._ambientLight.intensity = ambientI;

    // Sky/fog color follows the current planet palette.
    this._skyColor.lerpColors(this._nightSkyColor, this._daySkyColor, warmth);
    this.scene.background = this._skyColor;
    this.scene.fog.color.copy(this._skyColor);
  }

  render() {
    this._renderer.render(this.scene, this.camera);
  }
}
