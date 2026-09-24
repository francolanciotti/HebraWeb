/**
 * App.js - Controlador principal de la aplicación Kencalo Web AR & Transmedia
 */

import { stateManager } from './storage/stateManager.js';
import { SceneManager } from './3d/sceneManager.js';
import { KencaloModel } from './3d/kencaloModel.js';
import { ARController } from './ar/arController.js';
import { OutfitSelectorUI } from './ui/outfitSelector.js';
import { TransmediaUI } from './ui/transmediaModal.js';
import { NotificationUI } from './ui/notificationUI.js';
import { InkBleedCanvas } from './fx/inkBleed.js';

class KencaloApp {
  constructor() {
    this.currentView = 'ar'; // 'ar' | 'companion' | 'transmedia' | 'backup'
    this.isKencaloSpawnedInAR = false;

    this.initWelcomeModal();
    this.init3DScene();
    this.initUI();
    this.initAR();
    this.initNavigation();

    // Suscribirse a cambios de estado
    stateManager.subscribe(state => this.onStateChange(state));
  }

  /**
   * Inicializa la ventana de bienvenida transmedia con reacción de tinta (1s) y transición en el lugar
   */
  initWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-splash-modal');
    const step1 = document.getElementById('splash-step-1');
    const step2 = document.getElementById('splash-step-2');
    const containerStep1 = document.getElementById('ink-title-step1');
    const containerStep2 = document.getElementById('ink-title-step2');
    
    let currentSplashStep = 1;
    let isTransitioning = false;

    // Inicializar Motor WebGL de Sangrado de Tinta para HEBRA (Paso 1)
    if (containerStep1) {
      this.inkCanvasStep1 = new InkBleedCanvas(containerStep1, {
        text: 'Hebra',
        fontFamily: "'Caoutchouc', sans-serif",
        fontWeight: '400',
        inkColor: [0.96, 0.97, 1.0],
        maxVolatility: 0.85,
        baseVolatility: 0.0
      });
    }

    // Inicializar Motor WebGL de Sangrado de Tinta para KENOSIS (Paso 2)
    if (containerStep2) {
      this.inkCanvasStep2 = new InkBleedCanvas(containerStep2, {
        text: 'KENOSIS',
        fontFamily: "'Caoutchouc', sans-serif",
        fontWeight: '400',
        inkColor: [0.96, 0.97, 1.0],
        maxVolatility: 0.85,
        baseVolatility: 0.0
      });
    }

    // Inicializar Motor WebGL de Sangrado de Tinta para el Vector Orgánico de Fondo (file.svg)
    const containerVector = document.getElementById('splash-svg-bg');
    if (containerVector && welcomeModal) {
      this.inkCanvasVector = new InkBleedCanvas(containerVector, {
        imageSrc: 'assets/file.svg',
        inkColor: [0.96, 0.97, 1.0],
        maxVolatility: 0.85,
        baseVolatility: 0.0,
        eventTarget: welcomeModal,
        positionXMobile: 0.45,
        positionYMobile: 0.80,
        positionXDesktop: 0.50,
        positionYDesktop: 0.67,
        scaleMultiplier: 1.0
      });
    }

    // Función para manejar la transición por scroll/gesto con 1 segundo de dilatación de tinta en el lugar
    const handleScrollTrigger = () => {
      if (isTransitioning || !welcomeModal || welcomeModal.classList.contains('fade-out')) return;
      isTransitioning = true;

      if (currentSplashStep === 1) {
        // 1. Activar reacción intensa de tinta en HEBRA y el Vector de fondo durante 1 segundo
        if (this.inkCanvasStep1) {
          this.inkCanvasStep1.targetVolatility = 0.85;
        }
        if (this.inkCanvasVector) {
          this.inkCanvasVector.targetVolatility = 0.85;
        }

        // 2. Tras 1 segundo de dilatación, cambiar en el lugar hacia el Paso 2 (KENOSIS)
        setTimeout(() => {
          currentSplashStep = 2;
          if (step1) {
            step1.classList.remove('active');
            step1.classList.add('hidden');
          }
          if (step2) {
            step2.classList.remove('hidden');
            step2.classList.add('active');
          }
          if (this.inkCanvasStep2) {
            this.inkCanvasStep2.resize();
            this.inkCanvasStep2.resume();
          }
          setTimeout(() => { isTransitioning = false; }, 400);
        }, 1000);

      } else if (currentSplashStep === 2) {
        // 1. Activar reacción intensa de tinta en KENOSIS y el Vector de fondo durante 1 segundo
        if (this.inkCanvasStep2) {
          this.inkCanvasStep2.targetVolatility = 0.85;
        }
        if (this.inkCanvasVector) {
          this.inkCanvasVector.targetVolatility = 0.85;
        }

        // 2. Tras 1 segundo de dilatación, desvanecer en el lugar para entrar a la App
        setTimeout(() => {
          welcomeModal.classList.add('fade-out');
          setTimeout(() => {
            welcomeModal.style.display = 'none';
            if (this.inkCanvasStep1) this.inkCanvasStep1.pause();
            if (this.inkCanvasStep2) this.inkCanvasStep2.pause();
            if (this.inkCanvasVector) this.inkCanvasVector.pause();
            isTransitioning = false;
          }, 700);
        }, 1000);
      }
    };

    if (welcomeModal) {
      // Rueda del ratón en PC (Solo scroll hacia abajo / mover contenido hacia arriba)
      welcomeModal.addEventListener('wheel', (e) => {
        if (e.deltaY > 10) {
          handleScrollTrigger();
        }
      }, { passive: true });

      // Gestos de toque o arrastre táctil en celular (Solo hacia arriba, Umbral 100px)
      const TOUCH_SCROLL_THRESHOLD = 100;
      let touchStartY = 0;

      welcomeModal.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      welcomeModal.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const deltaY = touchStartY - e.touches[0].clientY;
          // Exclusivamente deslizar el dedo hacia arriba superando los 100px
          if (deltaY > TOUCH_SCROLL_THRESHOLD) {
            handleScrollTrigger();
          }
        }
      }, { passive: true });

      // Clic directo como método secundario
      welcomeModal.addEventListener('click', handleScrollTrigger);
    }

    const btnReopen = document.getElementById('btn-reopen-welcome');
    if (btnReopen && welcomeModal) {
      btnReopen.addEventListener('click', () => {
        currentSplashStep = 1;
        isTransitioning = false;

        if (step2) {
          step2.classList.remove('active');
          step2.classList.add('hidden');
        }
        if (step1) {
          step1.classList.remove('hidden');
          step1.classList.add('active');
        }

        welcomeModal.style.display = 'flex';
        void welcomeModal.offsetWidth;
        welcomeModal.classList.remove('fade-out');

        if (this.inkCanvasStep1) {
          this.inkCanvasStep1.resume();
          this.inkCanvasStep1.resize();
        }
        if (this.inkCanvasStep2) {
          this.inkCanvasStep2.resume();
          this.inkCanvasStep2.resize();
        }
        if (this.inkCanvasVector) {
          this.inkCanvasVector.resume();
          this.inkCanvasVector.resize();
        }
      });
    }
  }

  init3DScene() {
    const container = document.getElementById('companion-3d-root');
    this.sceneManager = new SceneManager(container);
    this.kencaloModel = new KencaloModel(this.sceneManager.scene);
    this.sceneManager.setTargetModel(this.kencaloModel.group);

    // Intentar cargar modelo .glb si existe en la ruta de assets
    this.kencaloModel.loadGLBModel('./assets/models/kencalo.glb');

    // Registrar malla para toques táctiles
    this.sceneManager.registerInteractiveObject(this.kencaloModel.getInteractiveMesh());

    // Evento al tocar a Kencalo en 3D
    this.sceneManager.onTap((intersect, point) => {
      const state = stateManager.getState();

      // Si estamos en AR y Kencalo apareció pero aún no fue capturado
      if (this.currentView === 'ar' && this.isKencaloSpawnedInAR && !state.kencaloCaptured) {
        this.captureCurrentKencalo();
        return;
      }

      // Si estamos en la vista Companion y ya fue capturado
      if (this.currentView === 'companion' && state.kencaloCaptured) {
        this.kencaloModel.triggerTouchReaction();
      }
    });

    // Render Loop Update
    this.sceneManager.addUpdateCallback((time) => {
      this.kencaloModel.update(time);
    });
  }

  initUI() {
    this.outfitUI = new OutfitSelectorUI(stateManager, this.kencaloModel);
    this.transmediaUI = new TransmediaUI(stateManager);

    // Botón de captura en vista AR
    const btnCapture = document.getElementById('btn-capture-kencalo');
    if (btnCapture) {
      btnCapture.addEventListener('click', (e) => {
        e.stopPropagation();
        this.captureCurrentKencalo();
      });
    }

    // Botón ir a AR desde la pantalla de no capturado
    const btnGoAr = document.getElementById('btn-go-ar');
    if (btnGoAr) {
      btnGoAr.addEventListener('click', () => {
        this.switchView('ar');
      });
    }
  }

  /**
   * Captura a Kencalo, dispara su animación alegre y pasa a la vista Companion
   */
  captureCurrentKencalo() {
    const captured = stateManager.captureKencalo();
    if (captured) {
      this.isKencaloSpawnedInAR = false;

      const arActions = document.getElementById('ar-actions');
      if (arActions) arActions.classList.add('hidden');

      NotificationUI.showToast('¡Has capturado a Kencalo!', '✨');
      this.kencaloModel.triggerTouchReaction();

      setTimeout(() => {
        this.switchView('companion');
      }, 700);
    }
  }

  initAR() {
    this.arController = new ARController({
      onTargetFoundA: () => this.handleTargetFoundA(),
      onTargetFoundB: () => this.handleTargetFoundB(),
      onTargetLost: () => this.handleTargetLost()
    });
  }

  handleTargetFoundA() {
    const state = stateManager.getState();
    if (state.kencaloCaptured) {
      NotificationUI.showToast('¡Árbol A detectado! (Ya capturaste a Kencalo)', '🌳');
      return;
    }

    this.isKencaloSpawnedInAR = true;

    // Hacer visible a Kencalo flotando en la escena AR
    if (this.kencaloModel && this.kencaloModel.group) {
      this.kencaloModel.group.visible = true;
    }

    const root3D = document.getElementById('companion-3d-root');
    if (root3D) {
      root3D.style.pointerEvents = 'auto';
      root3D.style.opacity = '1';
    }

    const arActions = document.getElementById('ar-actions');
    const arInstruction = document.getElementById('ar-instruction');

    if (arInstruction) {
      arInstruction.textContent = '¡Kencalo ha aparecido! Tócalo para capturarlo';
    }

    if (arActions) {
      arActions.classList.remove('hidden');
    }

    NotificationUI.showToast('¡Kencalo descubierto en el Árbol A!', '✨');
  }

  handleTargetFoundB() {
    const isNew = stateManager.discoverTreeB();

    NotificationUI.showToast('¡Marcador B del Árbol B reconocido!', '🌲');

    if (isNew) {
      NotificationUI.showBanner(
        '¡Has descubierto el Árbol B! Se ha desbloqueado la indumentaria Corona Cyber Neón.',
        'Ver Armario',
        () => {
          this.switchView('companion');
          this.outfitUI.open();
        }
      );
    }
  }

  handleTargetLost() {
    const arInstruction = document.getElementById('ar-instruction');
    if (arInstruction) {
      arInstruction.textContent = 'Apunta la cámara al marcador viscoso en el árbol';
    }
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetView = item.dataset.view;
        this.switchView(targetView);
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Actualizar items de la barra de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Actualizar secciones
    document.querySelectorAll('.view-section').forEach(section => {
      if (section.id === `view-${viewName}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Visibilidad del canvas 3D global según vista
    const state = stateManager.getState();
    const root3D = document.getElementById('companion-3d-root');
    const shouldShow3D = (viewName === 'companion' && state.kencaloCaptured) || (viewName === 'ar' && this.isKencaloSpawnedInAR && !state.kencaloCaptured);

    if (root3D) {
      if (shouldShow3D) {
        root3D.style.pointerEvents = 'auto';
        root3D.style.opacity = '1';
      } else {
        root3D.style.pointerEvents = 'none';
        root3D.style.opacity = '0';
      }
    }

    if (this.sceneManager) {
      this.sceneManager.setVisible(shouldShow3D);
    }

    // Gestiones específicas de cámara AR
    if (viewName === 'ar') {
      const arViewport = document.getElementById('ar-viewport');
      if (arViewport) this.arController.startAR(arViewport);
    } else {
      this.arController.stopAR();
    }
  }

  onStateChange(state) {
    const isCaptured = !!state.kencaloCaptured;

    // Control de visibilidad del modelo 3D de Kencalo
    if (this.kencaloModel && this.kencaloModel.group) {
      this.kencaloModel.group.visible = isCaptured || (this.currentView === 'ar' && this.isKencaloSpawnedInAR);
    }

    // Pantalla de estado no capturado en la solapa Companion
    const unclaimedHint = document.getElementById('companion-unclaimed-hint');
    const companionHud = document.querySelector('.companion-hud');

    if (unclaimedHint && companionHud) {
      if (isCaptured) {
        unclaimedHint.classList.add('hidden');
        companionHud.classList.remove('hidden');
      } else {
        unclaimedHint.classList.remove('hidden');
        companionHud.classList.add('hidden');
      }
    }

    // Actualizar textura e indumentaria activa en el modelo 3D
    if (this.kencaloModel) {
      this.kencaloModel.setTexture(state.kencaloTexture || 'A');
      this.kencaloModel.setOutfit(state.currentOutfit || 'default');
    }

    // Refrescar la vista actual para actualizar opacidades 3D
    this.switchView(this.currentView);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  window.app = new KencaloApp();
});
