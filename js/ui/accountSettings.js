/**
 * AccountSettingsUI - Manejador del modal de ajustes de cuenta,
 * creación de cuenta para invitados (nombre libre) y restauración directa (sin merge).
 */

import { NotificationUI } from './notificationUI.js';
import { soundManager } from '../audio/audioManager.js';

export class AccountSettingsUI {
  constructor(stateManager) {
    this.stateManager = stateManager;

    // Elementos del Modal
    this.modal = document.getElementById('account-settings-modal');
    this.backdrop = document.getElementById('settings-modal-backdrop');
    this.btnClose = document.getElementById('btn-close-settings');
    this.accountCard = document.getElementById('settings-account-card');
    this.btnReset = document.getElementById('btn-settings-reset');

    // Cartel / Banner de Recomendación en pantalla principal
    this.recommendBanner = document.getElementById('account-recommend-banner');
    this.btnBannerLink = document.getElementById('btn-banner-link-account');
    this.btnDismissBanner = document.getElementById('btn-dismiss-recommend');
    this.isBannerDismissed = false;

    // Botones de apertura en diferentes vistas
    this.btnOpenAR = document.getElementById('btn-open-settings-ar');
    this.btnOpenCompanion = document.getElementById('btn-open-settings-companion');
    this.btnOpenTransmedia = document.getElementById('btn-open-settings-transmedia');
    this.btnOpenGlobal = document.getElementById('btn-open-settings-global');

    this.isRestoreMode = false;

    this.initEvents();
    this.stateManager.subscribe(state => this.render(state));
  }

  open() {
    soundManager.playOutfitNav();
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.modal.setAttribute('aria-hidden', 'false');
      this.isRestoreMode = false;
      this.render(this.stateManager.getState());
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.setAttribute('aria-hidden', 'true');
    }
  }

  initEvents() {
    // Triggers de apertura
    [this.btnOpenAR, this.btnOpenCompanion, this.btnOpenTransmedia, this.btnOpenGlobal].forEach(btn => {
      if (btn) {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.open();
        });
      }
    });

    // Cartel de recomendación en vista principal
    if (this.btnBannerLink) {
      this.btnBannerLink.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.btnBannerLink.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });
    }

    if (this.btnDismissBanner) {
      this.btnDismissBanner.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.btnDismissBanner.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isBannerDismissed = true;
        if (this.recommendBanner) this.recommendBanner.classList.add('hidden');
      });
    }

    // Prevenir que toques dentro del modal se propaguen al Three.js de fondo
    if (this.modal) {
      this.modal.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.modal.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    }

    if (this.btnClose) {
      this.btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.playOutfitNav();
        this.close();
      });
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });

    // Reiniciar progreso local
    if (this.btnReset) {
      this.btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Estás seguro de reiniciar tu progreso local?')) {
          this.stateManager.resetProgress();
          NotificationUI.showToast('Progreso reiniciado correctamente', '🔄');
          this.render(this.stateManager.getState());
        }
      });
    }
  }

  render(state) {
    // Actualizar visibilidad del cartel de recomendación en modo invitado
    if (this.recommendBanner) {
      if (!state.isAccountLinked && !this.isBannerDismissed) {
        this.recommendBanner.classList.remove('hidden');
      } else {
        this.recommendBanner.classList.add('hidden');
      }
    }

    if (!this.accountCard) return;

    const isLinked = !!state.isAccountLinked && !!state.userIdentifier;
    const identifier = state.userIdentifier || '';

    if (isLinked) {
      // Estado: Cuenta Registrada
      this.accountCard.innerHTML = `
        <div class="account-card-header">
          <span class="account-badge linked">🟢 CUENTA GUARDADA</span>
        </div>
        <div class="account-user-display">
          <span class="account-avatar-icon">👤</span>
          <div class="account-user-details">
            <span class="account-id-label">Usuario Activo</span>
            <span class="account-id-value">${identifier}</span>
          </div>
        </div>
        <p class="account-card-hint">
          Tus Kencalos y avances están registrados bajo el usuario <strong>${identifier}</strong>.
        </p>

        <div class="account-card-actions">
          ${this.isRestoreMode ? `
            <div class="account-switch-form">
              <input type="text" id="input-account-id" class="input-glass-pill" placeholder="Nombre de usuario a cargar">
              <div id="account-error-msg" class="account-error-msg"></div>
              <button id="btn-submit-switch" class="btn-dark-pill btn-sm">Cargar Partida</button>
              <button id="btn-cancel-switch" class="btn-subtle-text">Cancelar</button>
            </div>
          ` : `
            <button id="btn-toggle-switch" class="btn-subtle-pill btn-sm">Cargar otra cuenta existente</button>
            <button id="btn-action-unlink" class="btn-subtle-text btn-sm">Desvincular este dispositivo</button>
          `}
        </div>
      `;

      const btnToggle = this.accountCard.querySelector('#btn-toggle-switch');
      if (btnToggle) {
        btnToggle.addEventListener('click', () => {
          this.isRestoreMode = true;
          this.render(state);
        });
      }

      const btnCancel = this.accountCard.querySelector('#btn-cancel-switch');
      if (btnCancel) {
        btnCancel.addEventListener('click', () => {
          this.isRestoreMode = false;
          this.render(state);
        });
      }

      const btnSubmitSwitch = this.accountCard.querySelector('#btn-submit-switch');
      const inputId = this.accountCard.querySelector('#input-account-id');
      const errorMsgEl = this.accountCard.querySelector('#account-error-msg');

      if (inputId && errorMsgEl) {
        inputId.addEventListener('input', () => {
          errorMsgEl.textContent = '';
          errorMsgEl.classList.remove('visible');
          inputId.classList.remove('input-has-error');
        });
      }

      if (btnSubmitSwitch && inputId) {
        const handleSwitch = async () => {
          const val = inputId.value.trim();
          if (!val) {
            if (errorMsgEl) {
              errorMsgEl.textContent = '⚠️ Ingresa un nombre de usuario';
              errorMsgEl.classList.add('visible');
              inputId.classList.add('input-has-error');
            }
            NotificationUI.showToast('Ingresa un nombre de usuario', '⚠️');
            return;
          }
          btnSubmitSwitch.disabled = true;
          btnSubmitSwitch.textContent = 'Cargando...';
          try {
            const result = await this.stateManager.restoreAccount(val);
            NotificationUI.showToast(result.message, result.success ? '✨' : '⚠️');
            if (result.success) {
              this.isRestoreMode = false;
            } else if (errorMsgEl) {
              errorMsgEl.textContent = `⚠️ ${result.message}`;
              errorMsgEl.classList.add('visible');
              inputId.classList.add('input-has-error');
            }
          } finally {
            btnSubmitSwitch.disabled = false;
            btnSubmitSwitch.textContent = 'Cargar Partida';
          }
        };
        btnSubmitSwitch.addEventListener('click', handleSwitch);
        inputId.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSwitch();
        });
      }

      const btnUnlink = this.accountCard.querySelector('#btn-action-unlink');
      if (btnUnlink) {
        btnUnlink.addEventListener('click', () => {
          this.stateManager.unlinkAccount();
          NotificationUI.showToast('Dispositivo en modo invitado', '👋');
        });
      }

    } else {
      // Estado: Invitado
      this.accountCard.innerHTML = `
        <div class="account-card-header">
          <span class="account-badge guest">MODO INVITADO</span>
          <span class="account-tag-recommend">RECOMENDADO</span>
        </div>
        <p class="account-card-info">
          ${this.isRestoreMode ? 
            'Ingresa tu nombre de usuario para cargar tu partida guardada.' : 
            'Elige tu <strong>nombre de usuario</strong> para guardar tu progreso y conservar tus Kencalos.'}
        </p>

        <div class="account-input-group">
          <input type="text" id="input-account-id" class="input-glass-pill" placeholder="${this.isRestoreMode ? 'Tu nombre de usuario' : 'Elige tu nombre de usuario'}">
          <div id="account-error-msg" class="account-error-msg"></div>
          <button id="btn-submit-link" class="btn-dark-pill">
            ${this.isRestoreMode ? 'Cargar Partida' : 'Crear Cuenta y Guardar'}
          </button>
        </div>

        <div class="account-card-footer-toggle">
          <button id="btn-toggle-mode" class="btn-link-simple">
            ${this.isRestoreMode ? '← Volver a Crear Cuenta' : '¿Ya tienes una cuenta? Cargar partida'}
          </button>
        </div>
      `;

      const inputId = this.accountCard.querySelector('#input-account-id');
      const btnSubmit = this.accountCard.querySelector('#btn-submit-link');
      const btnToggle = this.accountCard.querySelector('#btn-toggle-mode');
      const errorMsgEl = this.accountCard.querySelector('#account-error-msg');

      if (inputId && errorMsgEl) {
        inputId.addEventListener('input', () => {
          errorMsgEl.textContent = '';
          errorMsgEl.classList.remove('visible');
          inputId.classList.remove('input-has-error');
        });
      }

      if (btnToggle) {
        btnToggle.addEventListener('click', () => {
          this.isRestoreMode = !this.isRestoreMode;
          this.render(state);
        });
      }

      if (btnSubmit && inputId) {
        const handleAction = async () => {
          const val = inputId.value.trim();
          if (!val) {
            if (errorMsgEl) {
              errorMsgEl.textContent = '⚠️ Por favor escribe tu nombre de usuario';
              errorMsgEl.classList.add('visible');
              inputId.classList.add('input-has-error');
            }
            NotificationUI.showToast('Por favor escribe tu nombre de usuario', '⚠️');
            return;
          }

          const originalText = btnSubmit.textContent;
          btnSubmit.disabled = true;
          btnSubmit.textContent = this.isRestoreMode ? 'Buscando en la nube...' : 'Guardando en la nube...';

          try {
            if (this.isRestoreMode) {
              const res = await this.stateManager.restoreAccount(val);
              NotificationUI.showToast(res.message, res.success ? '🎉' : '⚠️');
              if (!res.success && errorMsgEl) {
                errorMsgEl.textContent = `⚠️ ${res.message}`;
                errorMsgEl.classList.add('visible');
                inputId.classList.add('input-has-error');
              }
            } else {
              const res = await this.stateManager.createAccount(val);
              NotificationUI.showToast(res.message, res.success ? '✨' : '⚠️');
              if (!res.success && errorMsgEl) {
                errorMsgEl.textContent = `⚠️ ${res.message}`;
                errorMsgEl.classList.add('visible');
                inputId.classList.add('input-has-error');
              }
            }
          } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalText;
          }
        };

        btnSubmit.addEventListener('click', handleAction);
        inputId.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleAction();
        });
      }
    }
  }
}
