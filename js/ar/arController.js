/**
 * ARController - Gestor de Realidad Aumentada con MindAR.js y modo simulador de pruebas
 */

export class ARController {
  constructor(options = {}) {
    this.onTargetFoundA = options.onTargetFoundA || (() => {});
    this.onTargetFoundB = options.onTargetFoundB || (() => {});
    this.onTargetLost = options.onTargetLost || (() => {});
    
    this.mindThree = null;
    this.isARActive = false;

    this.initSimButtons();
  }

  /**
   * Inicializa la cámara AR con MindAR si está disponible en la página
   */
  async startAR(containerElement) {
    if (this.isARActive) return;

    if (window.MINDAR && window.MINDAR.IMAGE) {
      try {
        // Verificar existencia de targets.mind para no romper con 404
        const res = await fetch('./assets/targets/targets.mind', { method: 'HEAD' }).catch(() => null);
        if (!res || !res.ok) {
          console.log('targets.mind no encontrado aún en assets/targets/. Usa los botones del "Modo Prueba" para simular marcadores.');
          return;
        }

        this.mindThree = new window.MINDAR.IMAGE.MindARThree({
          container: containerElement,
          imageTargetSrc: './assets/targets/targets.mind'
        });

        const { renderer, scene, camera } = this.mindThree;

        // Anclar Target 0 (Árbol A)
        const anchorA = this.mindThree.addAnchor(0);
        anchorA.onTargetFound = () => this.onTargetFoundA();
        anchorA.onTargetLost = () => this.onTargetLost();

        // Anclar Target 1 (Árbol B)
        const anchorB = this.mindThree.addAnchor(1);
        anchorB.onTargetFound = () => this.onTargetFoundB();
        anchorB.onTargetLost = () => this.onTargetLost();

        await this.mindThree.start();
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });

        this.isARActive = true;
        console.log('MindAR iniciado correctamente.');
      } catch (e) {
        console.warn('Cámara AR no activa (se requiere HTTPS/permisos de cámara). Modo prueba listo.', e);
      }
    } else {
      console.log('Modo prueba activo para simulación de marcadores A y B.');
    }
  }

  stopAR() {
    if (this.mindThree && this.isARActive) {
      try {
        this.mindThree.stop();
      } catch (e) {
        // Silencioso
      }
      this.isARActive = false;
    }
  }

  /**
   * Inicializa los botones de simulación para desarrollo sin cámara ni marcadores impresos
   */
  initSimButtons() {
    const btnSimA = document.getElementById('btn-sim-tree-a');
    const btnSimB = document.getElementById('btn-sim-tree-b');

    if (btnSimA) {
      btnSimA.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Simulando escaneo de Árbol A (Marcador A)...');
        this.onTargetFoundA();
      });
    }

    if (btnSimB) {
      btnSimB.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Simulando escaneo de Árbol B (Marcador B)...');
        this.onTargetFoundB();
      });
    }
  }
}
