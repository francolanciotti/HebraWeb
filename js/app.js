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

// Configuración configurable de la Pantalla de Bienvenida (Splash Screen)
const SPLASH_CONFIG = {
  STEP_1_DURATION: 3500, // Duración en milisegundos del Paso 1 ("Hebra")
  STEP_2_DURATION: 3500, // Duración en milisegundos del Paso 2 ("KENOSIS")
  ALLOW_CLICK_SKIP: false // Permitir al usuario hacer clic/tocar para saltar inmediatamente
};

export class KencaloApp {
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
   * Inicializa la ventana de bienvenida transmedia con transición automática por temporizadores configurables
   */
  initWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-splash-modal');
    const step1 = document.getElementById('splash-step-1');
    const step2 = document.getElementById('splash-step-2');
    const containerStep1 = document.getElementById('ink-title-step1');
    const containerStep2 = document.getElementById('ink-title-step2');

    let currentSplashStep = 1;
    let isTransitioning = false;
    let stepTimer = null;

    const clearSplashTimer = () => {
      if (stepTimer) {
        clearTimeout(stepTimer);
        stepTimer = null;
      }
    };

    // Inicializar Motor WebGL de Sangrado de Tinta para HEBRA (Paso 1)
    if (containerStep1) {
      this.inkCanvasStep1 = new InkBleedCanvas(containerStep1, {
        text: 'Hebra',
        fontFamily: "'Caoutchouc', sans-serif",
        fontWeight: '400',
        inkColor: [0.96, 0.97, 1.0],
        maxVolatility: 0.85,
        baseVolatility: 0.0,
        eventTarget: welcomeModal
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
        baseVolatility: 0.0,
        eventTarget: welcomeModal
      });
    }

    // Inicializar Motor WebGL de Sangrado de Tinta para el Vector Orgánico de Fondo (file.svg)
    const containerVector = document.getElementById('splash-svg-bg');
    if (containerVector && welcomeModal) {
      this.inkCanvasVector = new InkBleedCanvas(containerVector, {
        imageSrc: 'assets/file.svg',
        inkColor: [0.96, 0.97, 1.0],
        maxVolatility: 0.85,
        maxVolatilityMobile: 0.38,
        maxVolatilityDesktop: 0.85,
        baseVolatility: 0.0,
        eventTarget: welcomeModal,
        positionXMobile: 0.45,
        positionYMobile: 0.80,
        positionXDesktop: 0.50,
        positionYDesktop: 0.67,
        scaleMultiplier: 1.0
      });
    }

    // Transición del Paso 1 ("Hebra") al Paso 2 ("KENOSIS")
    const advanceStep1ToStep2 = () => {
      if (isTransitioning || currentSplashStep !== 1) return;
      isTransitioning = true;
      clearSplashTimer();

      const isMobile = window.innerWidth <= 768;
      const vectorMax = isMobile ? 0.38 : 0.85;

      // 1. Activar impulso de tinta en HEBRA y el Vector
      if (this.inkCanvasStep1) this.inkCanvasStep1.targetVolatility = 0.85;
      if (this.inkCanvasVector) this.inkCanvasVector.targetVolatility = vectorMax;

      setTimeout(() => {
        if (this.inkCanvasStep1) this.inkCanvasStep1.targetVolatility = 0.0;
        if (this.inkCanvasVector) this.inkCanvasVector.targetVolatility = 0.0;
      }, 280);

      // 2. Transición al Paso 2 (KENOSIS)
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
          this.inkCanvasStep2.targetVolatility = 0.0;
          this.inkCanvasStep2.volatility = 0.0;
          this.inkCanvasStep2.resize();
          this.inkCanvasStep2.resume();
        }
        isTransitioning = false;

        // Iniciar temporizador para el Paso 2
        scheduleStep2Completion();
      }, 800);
    };

    // Transición del Paso 2 ("KENOSIS") hacia la App principal
    const advanceStep2ToApp = () => {
      if (isTransitioning || currentSplashStep !== 2) return;
      isTransitioning = true;
      clearSplashTimer();

      const isMobile = window.innerWidth <= 768;
      const vectorMax = isMobile ? 0.38 : 0.85;

      // 1. Activar impulso de tinta en KENOSIS y el Vector
      if (this.inkCanvasStep2) this.inkCanvasStep2.targetVolatility = 0.85;
      if (this.inkCanvasVector) this.inkCanvasVector.targetVolatility = vectorMax;

      setTimeout(() => {
        if (this.inkCanvasStep2) this.inkCanvasStep2.targetVolatility = 0.0;
        if (this.inkCanvasVector) this.inkCanvasVector.targetVolatility = 0.0;
      }, 280);

      // 2. Desvanecer Splash Screen para entrar a la App
      setTimeout(() => {
        welcomeModal.classList.add('fade-out');
        setTimeout(() => {
          welcomeModal.style.display = 'none';
          if (this.inkCanvasStep1) {
            this.inkCanvasStep1.targetVolatility = 0.0;
            this.inkCanvasStep1.volatility = 0.0;
            this.inkCanvasStep1.pause();
          }
          if (this.inkCanvasStep2) {
            this.inkCanvasStep2.targetVolatility = 0.0;
            this.inkCanvasStep2.volatility = 0.0;
            this.inkCanvasStep2.pause();
          }
          if (this.inkCanvasVector) {
            this.inkCanvasVector.targetVolatility = 0.0;
            this.inkCanvasVector.volatility = 0.0;
            this.inkCanvasVector.pause();
          }
          isTransitioning = false;
        }, 700);
      }, 800);
    };

    const scheduleStep1Completion = () => {
      clearSplashTimer();
      stepTimer = setTimeout(() => {
        advanceStep1ToStep2();
      }, SPLASH_CONFIG.STEP_1_DURATION);
    };

    const scheduleStep2Completion = () => {
      clearSplashTimer();
      stepTimer = setTimeout(() => {
        advanceStep2ToApp();
      }, SPLASH_CONFIG.STEP_2_DURATION);
    };

    if (welcomeModal) {
      // Opcional: permitir clic/tap para avanzar manualmente sin esperar al temporizador
      welcomeModal.addEventListener('click', () => {
        if (!SPLASH_CONFIG.ALLOW_CLICK_SKIP) return;
        if (currentSplashStep === 1) {
          advanceStep1ToStep2();
        } else if (currentSplashStep === 2) {
          advanceStep2ToApp();
        }
      });
    }

    // Arrancar temporizador para Paso 1
    scheduleStep1Completion();

    const btnReopen = document.getElementById('btn-reopen-welcome');
    if (btnReopen && welcomeModal) {
      btnReopen.addEventListener('click', () => {
        clearSplashTimer();
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
          this.inkCanvasStep1.targetVolatility = 0.0;
          this.inkCanvasStep1.volatility = 0.0;
          this.inkCanvasStep1.resume();
          this.inkCanvasStep1.resize();
        }
        if (this.inkCanvasStep2) {
          this.inkCanvasStep2.targetVolatility = 0.0;
          this.inkCanvasStep2.volatility = 0.0;
          this.inkCanvasStep2.resume();
          this.inkCanvasStep2.resize();
        }
        if (this.inkCanvasVector) {
          this.inkCanvasVector.targetVolatility = 0.0;
          this.inkCanvasVector.volatility = 0.0;
          this.inkCanvasVector.resume();
          this.inkCanvasVector.resize();
        }

        scheduleStep1Completion();
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

    // Botón para solicitar acceso a la cámara de forma explícita
    const btnRequestCamera = document.getElementById('btn-request-camera');
    const permissionCard = document.getElementById('ar-permission-card');
    const scannerFrame = document.getElementById('ar-target-scanner');
    const permissionError = document.getElementById('ar-permission-error');
    const btnText = document.getElementById('btn-request-camera-text');

    if (btnRequestCamera) {
      btnRequestCamera.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (btnText) btnText.textContent = 'Iniciando cámara...';
        btnRequestCamera.disabled = true;
        if (permissionError) permissionError.classList.add('hidden');

        const arViewport = document.getElementById('ar-viewport');
        await this.arController.startAR(arViewport);

        if (this.arController.isARActive) {
          if (permissionCard) permissionCard.classList.add('hidden');
          if (scannerFrame) scannerFrame.classList.remove('hidden');
        } else {
          btnRequestCamera.disabled = false;
          if (btnText) btnText.textContent = 'Reintentar';
          if (permissionError) {
            permissionError.textContent = 'No se pudo acceder a la cámara. Por favor permite el acceso en tu navegador.';
            permissionError.classList.remove('hidden');
          }
        }
      });
    }

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

    // Botón de debug para reiniciar el progreso (Modo Prueba)
    const btnSimReset = document.getElementById('btn-sim-reset');
    if (btnSimReset) {
      btnSimReset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Reiniciar todo el progreso de la partida?')) {
          stateManager.resetProgress();
          this.isKencaloSpawnedInAR = false;
          this.currentEncounterTexture = null;
          NotificationUI.showToast('Progreso reiniciado correctamente', '🔄');
        }
      });
    }
  }

  /**
   * Captura a Kencalo, dispara su animación alegre y pasa a la vista Companion
   */
  captureCurrentKencalo() {
    const captured = stateManager.captureKencalo(this.currentEncounterTexture);
    if (captured) {
      this.isKencaloSpawnedInAR = false;

      const arActions = document.getElementById('ar-actions');
      if (arActions) arActions.classList.add('hidden');

      // Re-vincular Kencalo al canvas 3D global inmediatamente para evitar congelamiento en la cámara
      if (this.sceneManager && this.kencaloModel && this.kencaloModel.group) {
        this.sceneManager.scene.add(this.kencaloModel.group);
        this.kencaloModel.group.position.set(0, -0.2, -1);
        this.kencaloModel.group.rotation.set(0, 0, 0);
        this.kencaloModel.group.scale.set(1, 1, 1);
        this.kencaloModel.group.visible = true;
      }

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
    this.arController.onRenderCallback = (time) => {
      if (this.kencaloModel) {
        this.kencaloModel.update(time);
      }
    };
  }

  handleTargetFoundA() {
    const state = stateManager.getState();
    if (state.kencaloCaptured) {
      NotificationUI.showToast('¡Árbol A detectado! (Ya capturaste a Kencalo)', '🌳');
      return;
    }

    this.isKencaloSpawnedInAR = true;

    // Asignar variación aleatoria única de textura para esta persona/encuentro (preservada al capturar)
    if (!this.currentEncounterTexture) {
      const textures = ['A', 'B', 'C', 'D'];
      this.currentEncounterTexture = textures[Math.floor(Math.random() * textures.length)];
    }

    if (this.kencaloModel) {
      this.kencaloModel.setTexture(this.currentEncounterTexture);
    }

    // Vincular Kencalo al anclaje AR de MindAR si la cámara real está activa
    const anchorGroup = this.arController.getAnchorGroup(0);
    if (anchorGroup && this.kencaloModel && this.kencaloModel.group) {
      anchorGroup.add(this.kencaloModel.group);
      this.kencaloModel.group.position.set(0, -0.2, -1);
      this.kencaloModel.group.rotation.set(0, 0, 0);
      this.kencaloModel.group.scale.set(1, 1, 1);
      this.kencaloModel.group.visible = true;
    } else {
      // Fallback para modo de simulación sin MindAR
      if (this.kencaloModel && this.kencaloModel.group) {
        this.kencaloModel.group.visible = true;
      }
      const root3D = document.getElementById('companion-3d-root');
      if (root3D) {
        root3D.style.pointerEvents = 'auto';
        root3D.style.opacity = '1';
      }
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
      if (viewName === 'companion' && this.kencaloModel && this.kencaloModel.group) {
        this.sceneManager.scene.add(this.kencaloModel.group);
        this.kencaloModel.group.position.set(0, 0, 0);
      }
    }

    // Gestiones específicas de cámara AR
    if (viewName === 'ar') {
      const permissionCard = document.getElementById('ar-permission-card');
      const scannerFrame = document.getElementById('ar-target-scanner');

      if (this.arController.hasPermission) {
        if (permissionCard) permissionCard.classList.add('hidden');
        if (scannerFrame) scannerFrame.classList.remove('hidden');
        const arViewport = document.getElementById('ar-viewport');
        if (arViewport) this.arController.startAR(arViewport);
      } else {
        if (permissionCard) permissionCard.classList.remove('hidden');
        if (scannerFrame) scannerFrame.classList.add('hidden');
      }
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
