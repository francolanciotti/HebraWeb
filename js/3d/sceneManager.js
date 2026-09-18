/**
 * SceneManager - Administrador de la escena Three.js, luces, render loop y Raycasting táctil
 */

export class SceneManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = new THREE.Scene();

    // Cámara
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 4.5);

    // Renderer con soporte de alpha transparente
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Luces
    this.initLights();

    // Raycaster para toques táctiles
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.onTapCallback = null;

    // Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.initTouchEvents();

    // Render loop
    this.updateCallbacks = [];
    this.animate();
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x00ffaa, 1.2);
    mainLight.position.set(3, 5, 4);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x9d4edd, 2, 10);
    rimLight.position.set(-3, -2, -2);
    this.scene.add(rimLight);
  }

  initTouchEvents() {
    const handleTap = (clientX, clientY) => {
      this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0 && this.onTapCallback) {
        const point = intersects[0].point;
        this.onTapCallback(intersects[0], point);
      }
    };

    // Escuchar a nivel global window para que funcione a través de capas transparentes
    window.addEventListener('pointerdown', (e) => {
      // Ignorar si el usuario tocó sobre un botón o elemento interactivo 2D
      if (e.target && e.target.closest('button, input, a, .nav-item, .drawer, .token-box, .glass-card, .btn-glass-circle, .link-card')) {
        return;
      }
      handleTap(e.clientX, e.clientY);
    });
  }

  registerInteractiveObject(object) {
    if (!this.interactiveObjects.includes(object)) {
      this.interactiveObjects.push(object);
    }
  }

  onTap(callback) {
    this.onTapCallback = callback;
  }

  addUpdateCallback(cb) {
    this.updateCallbacks.push(cb);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;
    this.updateCallbacks.forEach(cb => cb(time));

    this.renderer.render(this.scene, this.camera);
  }
}
