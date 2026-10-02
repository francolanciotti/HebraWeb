/**
 * TransmediaUI - Manejador de la pestaña de universo transmedia (Fase 3: Glifos y Mapa de La Plata)
 */

import { NotificationUI } from './notificationUI.js';
import { soundManager } from '../audio/audioManager.js';
import { GlyphTranslatorUI } from './glyphTranslator.js';
import { CityMapUI } from './cityMap.js';

export class TransmediaUI {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.overlayTranslator = document.getElementById('glyph-translator-overlay');
    this.btnOpenTranslator = document.getElementById('btn-open-translator');
    this.btnCloseTranslator = document.getElementById('btn-close-translator');
    this.backdropTranslator = document.getElementById('glyph-modal-backdrop');

    // Inicializar Traductor de Glifos y Mapa de La Plata
    this.cityMapUI = new CityMapUI(this.stateManager);
    this.glyphTranslatorUI = new GlyphTranslatorUI(this.stateManager, (unlockedTreeId) => {
      // Al descifrar una coordenada mediante glifos:
      // Esperar brevemente para mostrar la señal de éxito, cerrar el modal y enfocar el árbol en el mapa
      setTimeout(() => {
        this.closeTranslator();
        if (this.cityMapUI) {
          this.cityMapUI.focusTree(unlockedTreeId);
        }
      }, 750);
    });

    this.initEvents();
  }

  openTranslator() {
    soundManager.playOutfitNav();
    if (this.overlayTranslator) {
      this.overlayTranslator.classList.remove('hidden');
      this.overlayTranslator.setAttribute('aria-hidden', 'false');
    }
  }

  closeTranslator() {
    if (this.overlayTranslator) {
      this.overlayTranslator.classList.add('hidden');
      this.overlayTranslator.setAttribute('aria-hidden', 'true');
    }
  }

  initEvents() {
    // Abrir y cerrar sintonizador de glifos en overlay
    if (this.btnOpenTranslator) {
      this.btnOpenTranslator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTranslator();
      });
    }

    if (this.btnCloseTranslator) {
      this.btnCloseTranslator.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.playOutfitNav();
        this.closeTranslator();
      });
    }

    if (this.backdropTranslator) {
      this.backdropTranslator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTranslator();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayTranslator && !this.overlayTranslator.classList.contains('hidden')) {
        this.closeTranslator();
      }
    });
  }
}
