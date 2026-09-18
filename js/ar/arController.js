/**
 * ARController - Gestor de Realidad Aumentada con cámara en vivo, MindAR y modo simulador
 */

export class ARController {
  constructor(options = {}) {
    this.onTargetFoundA = options.onTargetFoundA || (() => {});
    this.onTargetFoundB = options.onTargetFoundB || (() => {});
    this.onTargetLost = options.onTargetLost || (() => {});

    this.mindThree = null;
    this.isARActive = false;
    this.cameraStream = null;
    this.videoElement = null;

    this.initSimButtons();
  }

  /**
   * Inicializa la cámara AR y el tracking de marcadores
   */
  async startAR(containerElement) {
    if (!containerElement) return;

    // 1. Iniciar la cámara en vivo del dispositivo (pide permisos de cámara al usuario)
    await this.startLiveCamera(containerElement);

    // 2. Si MindAR está disponible y existe targets.mind, inicializar Image Tracking
    if (window.MINDAR && window.MINDAR.IMAGE) {
      try {
        const res = await fetch('./assets/targets/targets.mind', { method: 'HEAD' }).catch(() => null);
        if (res && res.ok) {
          this.mindThree = new window.MINDAR.IMAGE.MindARThree({
            container: containerElement,
            imageTargetSrc: './assets/targets/targets.mind'
          });

          const { renderer, scene, camera } = this.mindThree;

          const anchorA = this.mindThree.addAnchor(0);
          anchorA.onTargetFound = () => this.onTargetFoundA();
          anchorA.onTargetLost = () => this.onTargetLost();

          const anchorB = this.mindThree.addAnchor(1);
          anchorB.onTargetFound = () => this.onTargetFoundB();
          anchorB.onTargetLost = () => this.onTargetLost();

          await this.mindThree.start();
          renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
          });
          console.log('MindAR Image Tracking iniciado.');
        }
      } catch (e) {
        console.warn('Error al iniciar MindAR:', e);
      }
    }
  }

  /**
   * Solicita permisos y muestra la transmisión en vivo de la cámara
   */
  async startLiveCamera(containerElement) {
    if (this.cameraStream && this.videoElement) {
      return; // Ya está corriendo
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia no soportado en este entorno/navegador.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.cameraStream = stream;

      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('autoplay', '');
        this.videoElement.setAttribute('muted', '');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('webkit-playsinline', '');
        this.videoElement.className = 'ar-camera-video';
        containerElement.appendChild(this.videoElement);
      }

      this.videoElement.srcObject = stream;
      await this.videoElement.play().catch(err => console.warn('Autoplay video error:', err));
      this.isARActive = true;
      console.log('Cámara en vivo activada.');
    } catch (err) {
      console.warn('No se pudo acceder a la cámara o el usuario denegó el permiso:', err);
    }
  }

  /**
   * Detiene la cámara y el visor AR para ahorrar batería al salir de la pestaña
   */
  stopAR() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }

    if (this.mindThree) {
      try {
        this.mindThree.stop();
      } catch (e) {}
      this.mindThree = null;
    }

    this.isARActive = false;
  }

  /**
   * Inicializa los botones de simulación para pruebas de desarrollo
   */
  initSimButtons() {
    const btnSimA = document.getElementById('btn-sim-tree-a');
    const btnSimB = document.getElementById('btn-sim-tree-b');

    if (btnSimA) {
      btnSimA.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Simulando detección de Árbol A...');
        this.onTargetFoundA();
      });
    }

    if (btnSimB) {
      btnSimB.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Simulando detección de Árbol B...');
        this.onTargetFoundB();
      });
    }
  }
}
