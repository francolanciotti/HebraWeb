/**
 * TransmediaUI - Manejador de la pestaña de universo transmedia (Fase 3: Glifos y Mapa de La Plata)
 * y la pantalla de respaldo de token
 */

import { TokenManager } from '../storage/tokenManager.js';
import { NotificationUI } from './notificationUI.js';
import { soundManager } from '../audio/audioManager.js';
import { GlyphTranslatorUI } from './glyphTranslator.js';
import { CityMapUI } from './cityMap.js';

export class TransmediaUI {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.displayTokenInput = document.getElementById('token-display');
    this.btnCopyToken = document.getElementById('btn-copy-token');
    this.copyFeedback = document.getElementById('copy-feedback');

    this.importTokenInput = document.getElementById('token-import-input');
    this.btnImportToken = document.getElementById('btn-import-token');
    this.btnReset = document.getElementById('btn-reset-game');

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
    this.update();
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

    // Copiar Token
    if (this.btnCopyToken && this.displayTokenInput) {
      this.btnCopyToken.addEventListener('click', () => {
        const token = this.displayTokenInput.value;
        if (token) {
          navigator.clipboard.writeText(token).then(() => {
            if (this.copyFeedback) {
              this.copyFeedback.classList.remove('hidden');
              setTimeout(() => this.copyFeedback.classList.add('hidden'), 2500);
            }
            NotificationUI.showToast('Código de respaldo copiado', '📋');
          }).catch(() => {
            NotificationUI.showToast('Copia el código manualmente', '⚠️');
          });
        }
      });
    }

    // Importar Token
    if (this.btnImportToken && this.importTokenInput) {
      const handleImport = () => {
        const rawToken = this.importTokenInput.value;
        const restoredState = TokenManager.parseToken(rawToken);

        if (restoredState) {
          this.stateManager.setState(restoredState);
          NotificationUI.showToast('Partida restaurada con éxito', '🎉');
          this.importTokenInput.value = '';
        } else {
          NotificationUI.showToast('Código de respaldo inválido', '❌');
        }
      };

      this.btnImportToken.addEventListener('click', handleImport);
      this.importTokenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleImport();
        }
      });
    }

    // Reiniciar Progreso
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        if (confirm('¿Estás seguro de reiniciar tu progreso local?')) {
          this.stateManager.resetProgress();
          NotificationUI.showToast('Progreso reiniciado', '🔄');
        }
      });
    }

    // Escuchar cambios de estado
    this.stateManager.subscribe(() => this.update());
  }

  update() {
    const state = this.stateManager.getState();

    // Actualizar Token de Respaldo
    if (this.displayTokenInput) {
      this.displayTokenInput.value = TokenManager.generateToken(state);
    }
  }
}
