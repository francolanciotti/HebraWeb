/**
 * SceneManager - Administrador de la escena Three.js, luces, render loop,
 * rotación interactiva por arrastre (drag 360°) y zoom limitado (pinch-to-zoom).
 */

export class SceneManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = new THREE.Scene();

    // Configuración de Zoom de Cámara (con límites)
    this.initialZoom = 4.5;
    this.targetZoom = 4.5;
    this.currentZoom = 4.5;
    this.minZoom = 2.2;  // Límite cercano (inspección de detalles/corona)
    this.maxZoom = 6.5;  // Límite lejano (vista general)

    // Cámara
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, this.initialZoom);

    // Renderer con soporte de alpha transparente y DPR universalmente optimizado
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false; // Desactivar sombras pesadas universalmente para rendimiento ultra fluido

    this.container.appendChild(this.renderer.domElement);
    this.isVisible = true;

    // Luces
    this.initLights();

    // Control de Rotación del Modelo
    this.targetModel = null;
    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.currentRotationY = 0;
    this.currentRotationX = 0;

    // Raycaster y toques táctiles
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.onTapCallback = null;

    // Estado táctil multi-touch (rotación y zoom)
    this.activePointers = new Map();
    this.startPointerPos = { x: 0, y: 0 };
    this.startPointerTime = 0;
    this.isDragging = false;
    this.isPinching = false;
    this.initialPinchDistance = 0;
    this.pinchStartZoom = 4.5;
    this.lastTapTime = 0;

    // Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.initTouchAndGestureEvents();

    // Render loop
    this.updateCallbacks = [];
    this.animate();
  }

  setTargetModel(modelGroup) {
    this.targetModel = modelGroup;
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

  initTouchAndGestureEvents() {
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

    // 1. POINTER DOWN
    window.addEventListener('pointerdown', (e) => {
      // Ignorar si el usuario tocó sobre controles 2D de la interfaz
      if (e.target && e.target.closest('button, input, a, .nav-item, .drawer, .token-box, .glass-card, .btn-glass-circle, .link-card, .scanner-frame')) {
        return;
      }

      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1) {
        this.startPointerPos = { x: e.clientX, y: e.clientY };
        this.startPointerTime = performance.now();
        this.isDragging = false;
        this.isPinching = false;
      } else if (this.activePointers.size === 2) {
        // Inicio de gesto de pellizco con 2 dedos (Pinch to Zoom)
        this.isPinching = true;
        this.isDragging = false;
        const pts = Array.from(this.activePointers.values());
        this.initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.pinchStartZoom = this.targetZoom;
      }
    });

    // 2. POINTER MOVE
    window.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) return;

      const prev = this.activePointers.get(e.pointerId);
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Un solo dedo: Rotación 360° del modelo
      if (this.activePointers.size === 1 && !this.isPinching) {
        const deltaX = e.clientX - prev.x;
        const deltaY = e.clientY - prev.y;

        const moveDist = Math.hypot(e.clientX - this.startPointerPos.x, e.clientY - this.startPointerPos.y);
        if (moveDist > 6) {
          this.isDragging = true;
        }

        if (this.isDragging && this.targetModel) {
          // Rotación en Y (horizontal 360°)
          this.targetRotationY += deltaX * 0.008;

          // Inclinación en X (vertical limitada)
          this.targetRotationX += deltaY * 0.005;
          this.targetRotationX = THREE.MathUtils.clamp(this.targetRotationX, -0.35, 0.35);
        }
      } else if (this.activePointers.size === 2) {
        // Dos dedos: Zoom proporcional con límites
        this.isPinching = true;
        const pts = Array.from(this.activePointers.values());
        const currentDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

        if (this.initialPinchDistance > 0) {
          const ratio = currentDistance / this.initialPinchDistance;
          const newZoom = this.pinchStartZoom / ratio;
          this.targetZoom = THREE.MathUtils.clamp(newZoom, this.minZoom, this.maxZoom);
        }
      }
    });

    // 3. POINTER UP / CANCEL
    const onPointerEnd = (e) => {
      if (!this.activePointers.has(e.pointerId)) return;

      const endedPoint = { x: e.clientX, y: e.clientY };
      this.activePointers.delete(e.pointerId);

      // Si no quedan dedos tocando la pantalla
      if (this.activePointers.size === 0) {
        const moveDist = Math.hypot(endedPoint.x - this.startPointerPos.x, endedPoint.y - this.startPointerPos.y);
        const duration = performance.now() - this.startPointerTime;

        // Si fue un toque breve y sin arrastre, es un TAP
        if (!this.isPinching && !this.isDragging && moveDist < 10 && duration < 350) {
          const now = performance.now();
          // Doble toque rápido: restablecer vista frontal
          if (now - this.lastTapTime < 280) {
            this.resetView();
          } else {
            handleTap(endedPoint.x, endedPoint.y);
          }
          this.lastTapTime = now;
        }

        this.isDragging = false;
        this.isPinching = false;
        this.initialPinchDistance = 0;
      } else if (this.activePointers.size === 1) {
        const remaining = Array.from(this.activePointers.values())[0];
        this.startPointerPos = { x: remaining.x, y: remaining.y };
      }
    };

    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);

    // 4. ZOOM CON RUEDA DEL MOUSE (para pruebas en Desktop)
    window.addEventListener('wheel', (e) => {
      if (e.target && e.target.closest('.scrollable, .drawer, .transmedia-container, .backup-container')) {
        return;
      }
      const zoomDelta = e.deltaY * 0.003;
      this.targetZoom = THREE.MathUtils.clamp(this.targetZoom + zoomDelta, this.minZoom, this.maxZoom);
    }, { passive: true });
  }

  resetView() {
    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.targetZoom = this.initialZoom;
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

  setVisible(visible) {
    this.isVisible = !!visible;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Si la escena 3D está oculta, no desperdiciar recursos de GPU/batería renderizando
    if (!this.isVisible) return;

    const time = performance.now() * 0.001;

    // Suavizado fluido de Zoom (Lerp hacia targetZoom dentro de minZoom y maxZoom)
    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.12;
    this.camera.position.z = this.currentZoom;

    // Suavizado fluido de Rotación del modelo (Lerp hacia targetRotation)
    if (this.targetModel) {
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.12;
      this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.12;
      this.targetModel.rotation.y = this.currentRotationY;
      this.targetModel.rotation.x = this.currentRotationX;
    }

    this.updateCallbacks.forEach(cb => cb(time));

    this.renderer.render(this.scene, this.camera);
  }
}
