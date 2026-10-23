/**
 * ARController - Gestor de Realidad Aumentada con cámara en vivo, MindAR y modo simulador
 */

import { NotificationUI } from '../ui/notificationUI.js';
import { MindARThree } from '../lib/mindar-image-three.prod.js';
import { getTodayArgentinaDate } from '../config/gameRegistry.js';

export class ARController {
  constructor(options = {}) {
    this.onTargetDetected = options.onTargetDetected || null;
    this.onTargetFoundA = options.onTargetFoundA || (() => {});
    this.onTargetFoundB = options.onTargetFoundB || (() => {});
    this.onTargetFoundC = options.onTargetFoundC || (() => {});
    this.onTargetLost = options.onTargetLost || (() => {});

    this.mindThree = null;
    this.anchors = [];
    this.activeAnchorGroup = null;
    this.isARActive = false;
    this.isStartingAR = false;
    this.hasPermission = false;
    this.cameraStream = null;
    this.videoElement = null;

    this.initSimButtons();
  }

  /**
   * Inicializa la cámara AR y el tracking de marcadores
   */
  async startAR(containerElement) {
    if (!containerElement) return;

    if (this.isARActive || this.isStartingAR) {
      return;
    }

    this.isStartingAR = true;

    try {
      // 1. Inicializar MindARThree módulo ES nativo
      if (MindARThree) {
        try {
          if (this.mindThree) {
            try { this.mindThree.stop(); } catch (e) {}
            this.mindThree = null;
          }

          // Limpiar cualquier canvas o video residual en el contenedor para evitar imágenes congeladas
          const leftoverElements = containerElement.querySelectorAll('canvas, video');
          leftoverElements.forEach(el => el.remove());

          // Cache-buster basado en la fecha de Argentina para descargar siempre el .mind del día
          const todayDate = getTodayArgentinaDate();

          this.mindThree = new MindARThree({
            container: containerElement,
            imageTargetSrc: `./assets/targets/targets.mind?d=${todayDate}`,
            maxTrack: 1,
            uiLoading: 'no',
            uiScanning: 'no'
          });

          const { renderer, scene, camera } = this.mindThree;

          // Añadir luces a la escena 3D de MindAR
          const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
          scene.add(ambientLight);

          const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
          dirLight.position.set(1, 2, 3);
          scene.add(dirLight);

          // Soporte para hasta 10 fotos en targets.mind para el árbol del día
          const MAX_TARGETS = 10;
          this.anchors = [];

          for (let i = 0; i < MAX_TARGETS; i++) {
            const anchor = this.mindThree.addAnchor(i);

            anchor.onTargetFound = () => {
              console.log(`Foto/Target #${i} detectado por MindAR`);
              this.activeAnchorGroup = anchor.group;

              if (this.onTargetDetected) {
                this.onTargetDetected(anchor.group, i);
              } else {
                if (i === 0) this.onTargetFoundA(anchor.group);
                else if (i === 1) this.onTargetFoundB(anchor.group);
                else if (i === 2) this.onTargetFoundC(anchor.group);
              }
            };

            anchor.onTargetLost = () => {
              if (this.activeAnchorGroup === anchor.group) {
                this.activeAnchorGroup = null;
              }
              this.onTargetLost();
            };

            this.anchors.push(anchor);
          }

          this.anchorA = this.anchors[0];
          this.anchorB = this.anchors[1];

          await this.mindThree.start();

          renderer.setAnimationLoop((time) => {
            if (this.isARActive && this.mindThree) {
              if (this.onRenderCallback) this.onRenderCallback(time);
              renderer.render(scene, camera);
            }
          });

          this.hasPermission = true;
          this.isARActive = true;
          return;
        } catch (e) {
          console.error('Error al iniciar MindAR:', e);
          NotificationUI.showToast('Error en motor AR: ' + e.message, '⚠️');
        }
      }

      // 2. Fallback: cámara estándar si MindAR no está disponible
      await this.startLiveCamera(containerElement);
      if (this.cameraStream) {
        this.hasPermission = true;
        this.isARActive = true;
      }
    } catch (err) {
      console.warn('Error en startAR:', err);
    } finally {
      this.isStartingAR = false;
    }
  }

  async startLiveCamera(containerElement) {
    if (this.cameraStream && this.videoElement) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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

      if (!this.isStartingAR) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      this.cameraStream = stream;

      const existingVideo = containerElement.querySelector('.ar-camera-video');
      if (existingVideo) {
        this.videoElement = existingVideo;
      } else if (!this.videoElement) {
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
    } catch (err) {
      console.warn('No se pudo acceder a la cámara:', err);
    }
  }

  stopAR() {
    this.isStartingAR = false;
    this.isARActive = false;

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
        if (this.mindThree.renderer) {
          this.mindThree.renderer.setAnimationLoop(null);
        }
        this.mindThree.stop();
      } catch (e) {}
      this.mindThree = null;
    }

    const arViewport = document.getElementById('ar-viewport');
    if (arViewport) {
      const leftover = arViewport.querySelectorAll('canvas, video');
      leftover.forEach(el => el.remove());
    }
  }

  initSimButtons() {
    const btnSimA = document.getElementById('btn-sim-tree-a');
    const btnSimB = document.getElementById('btn-sim-tree-b');
    const btnSimC = document.getElementById('btn-sim-tree-c');

    if (btnSimA) {
      btnSimA.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTargetFoundA();
      });
    }

    if (btnSimB) {
      btnSimB.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTargetFoundB();
      });
    }

    if (btnSimC) {
      btnSimC.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTargetFoundC();
      });
    }
  }

  getAnchorGroup(index = 0) {
    if (this.activeAnchorGroup) return this.activeAnchorGroup;
    if (this.anchors && this.anchors[index]) return this.anchors[index].group;
    if (index === 0 && this.anchorA) return this.anchorA.group;
    if (index === 1 && this.anchorB) return this.anchorB.group;
    return null;
  }
}
