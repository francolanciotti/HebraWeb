/**
 * TransmediaUI - Manejador de la pestaña de universo transmedia y la pantalla de respaldo de token
 */

import { TokenManager } from '../storage/tokenManager.js';
import { NotificationUI } from './notificationUI.js';

export class TransmediaUI {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.displayTokenInput = document.getElementById('token-display');
    this.btnCopyToken = document.getElementById('btn-copy-token');
    this.copyFeedback = document.getElementById('copy-feedback');

    this.importTokenInput = document.getElementById('token-import-input');
    this.btnImportToken = document.getElementById('btn-import-token');
    this.btnReset = document.getElementById('btn-reset-game');

    this.badgeTreeA = document.getElementById('badge-tree-a');
    this.stateTreeA = document.getElementById('state-tree-a');
    this.badgeTreeB = document.getElementById('badge-tree-b');
    this.stateTreeB = document.getElementById('state-tree-b');

    this.initEvents();
    this.update();
  }

  initEvents() {
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

    // Reiniciar
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

    // Actualizar estado de Árboles en la sección Universo
    const discovered = state.discoveredTrees || [];

    if (this.badgeTreeA && this.stateTreeA) {
      if (discovered.includes('tree_a')) {
        this.badgeTreeA.classList.add('unlocked');
        this.stateTreeA.textContent = 'Descubierto ✓';
      } else {
        this.badgeTreeA.classList.remove('unlocked');
        this.stateTreeA.textContent = 'No descubierto';
      }
    }

    if (this.badgeTreeB && this.stateTreeB) {
      if (discovered.includes('tree_b')) {
        this.badgeTreeB.classList.add('unlocked');
        this.stateTreeB.textContent = 'Descubierto ✓';
      } else {
        this.badgeTreeB.classList.remove('unlocked');
        this.stateTreeB.textContent = 'Bloqueado 🔒';
      }
    }
  }
}
