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
   * Inicializa la ventana de bienvenida con el motor de sangrado de tinta líquida "HEBRA"
   */
  initWelcomeModal() {
    const welcomeWrapper = document.getElementById('welcome-ink-wrapper');
    const welcomeModal = document.getElementById('welcome-splash-modal');
    const btnEnter = document.getElementById('btn-enter-universe');

    if (welcomeWrapper) {
      this.welcomeInkCanvas = new InkBleedCanvas(welcomeWrapper, {
        text: 'HEBRA',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        fontWeight: '800',
        inkColor: [0.95, 0.96, 1.0],     // Blanco brillante
        maxVolatility: 0.85,
        baseVolatility: 0.0              // Grosor normal en reposo
      });
    }

    if (btnEnter && welcomeModal) {
      btnEnter.addEventListener('click', () => {
        welcomeModal.classList.add('fade-out');

        setTimeout(() => {
          welcomeModal.style.display = 'none';
          if (this.welcomeInkCanvas) {
            this.welcomeInkCanvas.pause();
          }
        }, 750);
      });
    }

    const btnReopen = document.getElementById('btn-reopen-welcome');
    if (btnReopen && welcomeModal) {
      btnReopen.addEventListener('click', () => {
        welcomeModal.style.display = 'flex';
        // Forzar reflow para reiniciar la animación CSS de fade-in
        void welcomeModal.offsetWidth;
        welcomeModal.classList.remove('fade-out');
        if (this.welcomeInkCanvas) {
          this.welcomeInkCanvas.resume();
          this.welcomeInkCanvas.resize();
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
