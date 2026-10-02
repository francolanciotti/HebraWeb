/**
 * App.js - Controlador principal de la aplicación Kencalo Web AR & Transmedia
 */

import { stateManager } from './storage/stateManager.js';
import { SceneManager } from './3d/sceneManager.js';
import { KencaloModel, KENCALO_CONFIG } from './3d/kencaloModel.js';
import { ARController } from './ar/arController.js';
import { OutfitSelectorUI } from './ui/outfitSelector.js';
import { KencaloSwitcherUI } from './ui/kencaloSwitcher.js';
import { TransmediaUI } from './ui/transmediaModal.js';
import { NotificationUI } from './ui/notificationUI.js';
import { AccountSettingsUI } from './ui/accountSettings.js';
import { CaptureStoryUI } from './ui/captureModal.js';
import { InkBleedCanvas } from './fx/inkBleed.js';
import { soundManager } from './audio/audioManager.js';
import { getKencaloFullName, getSpeciesForTree, getLocationById } from './config/gameRegistry.js';

// Configuración configurable de la Pantalla de Bienvenida (Splash Screen)
const SPLASH_CONFIG = {
  STEP_1_DURATION: 3500, // Duración en milisegundos del Paso 1 ("Hebra")
  STEP_2_DURATION: 3500, // Duración en milisegundos del Paso 2 ("KENOSIS")
  ALLOW_CLICK_SKIP: false // Permitir al usuario hacer clic/tocar para saltar inmediatamente
};

export class KencaloApp {
  constructor() {
    this.currentView = 'ar'; // 'ar' | 'companion' | 'transmedia'
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
  }

  init3DScene() {
    const container = document.getElementById('companion-3d-root');
    this.sceneManager = new SceneManager(container);
    this.kencaloModel = new KencaloModel(this.sceneManager.scene);
    this.sceneManager.setTargetModel(this.kencaloModel.group);

    // Cargar la especie y textura del compañero actualmente activo (o Libélula por defecto)
    const current = stateManager.getCurrentKencalo();
    const speciesId = current?.speciesId || 'libelula';
    const textureKey = current?.texture || 'A';
    this.kencaloModel.loadSpecies(speciesId, textureKey);

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
        soundManager.playKencaloInteract();
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
    this.kencaloSwitcherUI = new KencaloSwitcherUI(stateManager, this.kencaloModel);
    this.transmediaUI = new TransmediaUI(stateManager);

    // Inicializar generador de captura para Instagram (Historia 9:16)
    this.captureStoryUI = new CaptureStoryUI(
      stateManager,
      this.sceneManager,
      () => { this.switchView('companion'); },
      () => { if (this.accountSettingsUI) this.accountSettingsUI.open(); }
    );

    // Inicializar modal y botón flotante de Ajustes de Cuenta
    this.accountSettingsUI = new AccountSettingsUI(stateManager);

    // Botón en el HUD de Companion para compartir la historia 9:16 de forma directa (sin ventana redundante)
    const btnCompanionShare = document.getElementById('btn-companion-share-story');
    if (btnCompanionShare) {
      btnCompanionShare.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = stateManager.getCurrentKencalo();
        const treeId = current ? current.treeId : 'tree_a';
        if (this.captureStoryUI) {
          this.captureStoryUI.openCapture(treeId);
        }
      });
    }

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
          this.currentEncounterTreeId = null;
          this.currentEncounterTexture = null;
          this.currentEncounterSpecies = null;
          const arActions = document.getElementById('ar-actions');
          if (arActions) arActions.classList.add('hidden');
          NotificationUI.showToast('Progreso reiniciado correctamente', '🔄');
        }
      });
    }

    // Botón de debug para desbloquear todos los sombreros / indumentarias (Modo Prueba)
    const btnSimOutfits = document.getElementById('btn-sim-outfits');
    if (btnSimOutfits) {
      btnSimOutfits.addEventListener('click', (e) => {
        e.stopPropagation();
        // Si no tiene ningún Kencalo capturado, habilitar uno base para que pueda ver y probar los sombreros en 3D
        const state = stateManager.getState();
        if (!state.kencaloCaptured) {
          stateManager.captureKencaloFromTree('tree_a', 'A', 'libelula');
        }
        stateManager.unlockSpecialEventOutfits();
        NotificationUI.showToast('¡Sombreros desbloqueados! Pruébalos en Mi Kencalo', '👑');
        if (this.outfitUI) {
          this.outfitUI.render();
        }
        if (this.kencaloSwitcherUI) {
          this.kencaloSwitcherUI.render();
        }
      });
    }
  }

  /**
   * Captura a Kencalo, dispara su animación alegre y pasa a la vista Companion
   */
  captureCurrentKencalo() {
    const treeId = this.currentEncounterTreeId || 'tree_a';
    if (stateManager.isTreeCaptured(treeId)) {
      NotificationUI.showToast(`Este árbol ya fue capturado previamente`, '🌿');
      const arActions = document.getElementById('ar-actions');
      if (arActions) arActions.classList.add('hidden');
      this.isKencaloSpawnedInAR = false;
      return;
    }

    const tex = this.currentEncounterTexture || stateManager.getRandomTexture();
    const speciesId = this.currentEncounterSpecies || stateManager.getRandomUnusedSpecies();
    stateManager.captureKencaloFromTree(treeId, tex, speciesId);

    soundManager.playKencaloInteract();
    this.isKencaloSpawnedInAR = false;
    this.currentEncounterTreeId = null;
    this.currentEncounterTexture = null;
    this.currentEncounterSpecies = null;

    const arActions = document.getElementById('ar-actions');
    if (arActions) arActions.classList.add('hidden');

    // Re-vincular Kencalo al canvas 3D global inmediatamente para la vista Companion
    if (this.sceneManager && this.kencaloModel && this.kencaloModel.group) {
      this.sceneManager.scene.add(this.kencaloModel.group);
      this.kencaloModel.applyCompanionTransform();
      this.sceneManager.setInteractiveRotationEnabled(true);
      this.sceneManager.setInitialRotation(this.kencaloModel.group.rotation.y, this.kencaloModel.group.rotation.x);
      this.kencaloModel.group.visible = true;
    }

    const fullName = getKencaloFullName(treeId);

    NotificationUI.showToast(`¡Has capturado al ${fullName}!`, '✨');
    if (this.kencaloModel) {
      if (this.kencaloModel.currentSpeciesId !== speciesId) {
        this.kencaloModel.loadSpecies(speciesId, tex, () => {
          this.kencaloModel.triggerTouchReaction();
        });
      } else {
        this.kencaloModel.setTexture(tex);
        this.kencaloModel.triggerTouchReaction();
      }
    }

    setTimeout(() => {
      this.switchView('companion');
      if (this.captureStoryUI) {
        this.captureStoryUI.openCapture(treeId);
      }
    }, 700);
  }

  initAR() {
    this.arController = new ARController({
      onTargetFoundA: () => this.handleTargetFoundA(),
      onTargetFoundB: () => this.handleTargetFoundB(),
      onTargetFoundC: () => this.handleTargetFoundC(),
      onTargetLost: () => this.handleTargetLost()
    });
    this.arController.onRenderCallback = (time) => {
      if (this.kencaloModel) {
        this.kencaloModel.update(time);
      }
    };
  }

  handleTreeEncounter(treeId, treeName, anchorIndex = 0) {
    const fullName = getKencaloFullName(treeId);
    const species = getSpeciesForTree(treeId);

    // Si este árbol YA fue capturado, no permitir volver a capturarlo
    if (stateManager.isTreeCaptured(treeId)) {
      soundManager.playScanSuccess();
      const arInstruction = document.getElementById('ar-instruction');
      if (arInstruction) {
        arInstruction.textContent = `Este árbol (${treeName}) ya fue purificado. Busca otros árboles en el mapa.`;
      }
      const arActions = document.getElementById('ar-actions');
      if (arActions) arActions.classList.add('hidden');
      this.isKencaloSpawnedInAR = false;
      this.currentEncounterTreeId = null;
      this.currentEncounterTexture = null;
      NotificationUI.showToast(`El ${fullName} ya está en tu equipo`, '🌿');
      return;
    }

    soundManager.playScanSuccess();

    this.isKencaloSpawnedInAR = true;
    if (this.currentEncounterTreeId !== treeId) {
      this.currentEncounterSpecies = stateManager.getRandomUnusedSpecies();
      this.currentEncounterTexture = stateManager.getRandomTexture();
    }
    this.currentEncounterTreeId = treeId;

    if (this.kencaloModel) {
      if (this.kencaloModel.currentSpeciesId !== this.currentEncounterSpecies) {
        this.kencaloModel.loadSpecies(this.currentEncounterSpecies, this.currentEncounterTexture);
      } else {
        this.kencaloModel.setTexture(this.currentEncounterTexture);
      }
    }

    // Vincular Kencalo al anclaje AR de MindAR si la cámara real está activa
    const anchorGroup = this.arController.getAnchorGroup(anchorIndex);
    if (anchorGroup && this.kencaloModel && this.kencaloModel.group) {
      anchorGroup.add(this.kencaloModel.group);
      this.kencaloModel.applyARTransform();
      if (this.sceneManager) {
        this.sceneManager.setInteractiveRotationEnabled(false);
      }
      this.kencaloModel.group.visible = true;
    } else {
      // Fallback para modo de simulación sin MindAR
      if (this.sceneManager && this.kencaloModel && this.kencaloModel.group) {
        this.sceneManager.scene.add(this.kencaloModel.group);
        this.kencaloModel.applyARTransform();
        this.sceneManager.setInteractiveRotationEnabled(false);
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
    const btnCapture = document.getElementById('btn-capture-kencalo');

    if (arInstruction) {
      arInstruction.textContent = `¡${fullName} ha aparecido! Tócalo para capturarlo`;
    }

    if (btnCapture) {
      const span = btnCapture.querySelector('span') || btnCapture;
      span.textContent = `¡CAPTURAR ${fullName.toUpperCase()}!`;
    }

    if (arActions) {
      arActions.classList.remove('hidden');
    }

    NotificationUI.showToast(`¡${fullName} descubierto!`, '✨');
  }

  handleTargetFoundA() {
    this.handleTreeEncounter('tree_a', 'El Bosque', 0);
  }

  handleTargetFoundB() {
    this.handleTreeEncounter('tree_b', 'Plaza San Martín', 1);
  }

  handleTargetFoundC() {
    this.handleTreeEncounter('tree_c', 'Plaza Rocha', 0);
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
    if (this.currentView !== viewName) {
      soundManager.playOutfitNav();
    }

    const previousView = this.currentView;
    this.currentView = viewName;

    // Si salimos de la vista AR sin haber capturado a Kencalo, desvincular del anclaje de cámara AR
    if (previousView === 'ar' && viewName !== 'ar') {
      const state = stateManager.getState();
      if (!state.kencaloCaptured) {
        this.isKencaloSpawnedInAR = false;
        const arActions = document.getElementById('ar-actions');
        if (arActions) arActions.classList.add('hidden');
      }
      if (this.sceneManager && this.kencaloModel && this.kencaloModel.group) {
        this.sceneManager.scene.add(this.kencaloModel.group);
      }
    }

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

    // Visibilidad del canvas 3D global según vista (exclusivo para Companion)
    const state = stateManager.getState();
    const root3D = document.getElementById('companion-3d-root');
    const shouldShow3D = (viewName === 'companion' && state.kencaloCaptured);

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
      if (viewName === 'companion' && state.kencaloCaptured && this.kencaloModel && this.kencaloModel.group) {
        this.sceneManager.scene.add(this.kencaloModel.group);
        this.kencaloModel.applyCompanionTransform();
        this.sceneManager.setInteractiveRotationEnabled(true);
        this.sceneManager.setInitialRotation(this.kencaloModel.group.rotation.y, this.kencaloModel.group.rotation.x);
      } else if (viewName === 'ar') {
        this.sceneManager.setInteractiveRotationEnabled(false);
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

    // Actualizar visibilidad del canvas 3D global
    const root3D = document.getElementById('companion-3d-root');
    const shouldShow3D = (this.currentView === 'companion' && isCaptured);
    if (root3D) {
      root3D.style.pointerEvents = shouldShow3D ? 'auto' : 'none';
      root3D.style.opacity = shouldShow3D ? '1' : '0';
    }
    if (this.sceneManager) {
      this.sceneManager.setVisible(shouldShow3D);
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  window.app = new KencaloApp();
});
