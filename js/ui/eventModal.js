/**
 * EventInvitationModalUI - Ventana / Modal de Invitación a Evento Exclusivo (3 Kencalos Capturados)
 * 
 * Presenta una estética Glassmorphism pulida idéntica al modal de Ajustes de Cuenta,
 * felicitando al guardián e invitándolo a la experiencia personalizada presencial.
 * Todos los textos y datos son controlados dinámicamente por EVENT_INVITATION_CONFIG.
 */

import { EVENT_INVITATION_CONFIG } from '../config/gameRegistry.js';
import { soundManager } from '../audio/audioManager.js';

export class EventInvitationModalUI {
  constructor() {
    this.modal = document.getElementById('event-invitation-modal');
    this.backdrop = document.getElementById('event-modal-backdrop');
    this.btnClose = document.getElementById('btn-close-event-modal');

    this.titleEl = document.getElementById('event-modal-title');
    this.subtitleEl = document.getElementById('event-modal-subtitle');
    this.nameEl = document.getElementById('event-modal-name');
    this.descEl = document.getElementById('event-modal-desc');
    this.dateEl = document.getElementById('event-modal-date');
    this.locationEl = document.getElementById('event-modal-location');
    this.noteEl = document.getElementById('event-modal-note');

    this.initEvents();
  }

  initEvents() {
    // Evitar propagación a toques 3D de fondo
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
        soundManager.playOutfitNav();
        this.close();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  render() {
    const config = EVENT_INVITATION_CONFIG;
    if (!config) return;

    if (this.titleEl) this.titleEl.textContent = config.title || '¡Felicitaciones!';
    if (this.subtitleEl) this.subtitleEl.textContent = config.subtitle || 'Has capturado a los 3 Kencalos';
    if (this.nameEl) this.nameEl.textContent = config.eventName || 'Evento Especial';
    if (this.descEl) this.descEl.textContent = config.eventDescription || '';
    if (this.dateEl) this.dateEl.textContent = config.eventDate || '';
    if (this.locationEl) this.locationEl.textContent = config.eventLocation || '';
    if (this.noteEl) this.noteEl.textContent = config.eventAccessNote || '';
  }

  open(playSound = true) {
    this.render();
    if (playSound) {
      soundManager.playScanSuccess();
    }
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.modal.setAttribute('aria-hidden', 'false');
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.setAttribute('aria-hidden', 'true');
    }
  }
}
