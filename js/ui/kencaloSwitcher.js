/**
 * KencaloSwitcherUI - Controlador para alternar entre Kencalos en posesión en la vista Companion 3D
 */

import { soundManager } from '../audio/audioManager.js';
import { NotificationUI } from './notificationUI.js';

export class KencaloSwitcherUI {
  constructor(stateManager, kencaloModel) {
    this.stateManager = stateManager;
    this.kencaloModel = kencaloModel;

    this.capsuleEl = document.getElementById('kencalo-switch-capsule');
    this.btnPrev = document.getElementById('btn-prev-kencalo');
    this.btnNext = document.getElementById('btn-next-kencalo');
    this.nameEl = document.getElementById('kencalo-pill-name');
    this.tagEl = document.getElementById('kencalo-pill-tag');

    this.initEvents();
    this.render();

    this.stateManager.subscribe(() => {
      this.render();
    });
  }

  initEvents() {
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switch(-1);
      });
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switch(1);
      });
    }
  }

  switch(direction) {
    const list = this.stateManager.getPossessedKencalos();
    if (list.length <= 1) return;

    const nextKencalo = this.stateManager.switchKencalo(direction);
    if (!nextKencalo) return;

    if (this.kencaloModel) {
      this.kencaloModel.setTexture(nextKencalo.texture);
      this.kencaloModel.triggerTouchReaction();
    }
    this.render();
  }

  render() {
    if (!this.capsuleEl) return;

    const list = this.stateManager.getPossessedKencalos();

    // Si aún no capturó ningún Kencalo, ocultar la cápsula
    if (list.length === 0) {
      this.capsuleEl.classList.add('hidden');
      return;
    }

    this.capsuleEl.classList.remove('hidden');

    const current = this.stateManager.getCurrentKencalo() || list[0];
    let currentIndex = list.findIndex(k => k.treeId === current.treeId);
    if (currentIndex < 0) currentIndex = 0;

    // Sincronizar textura en el modelo 3D si difiere
    if (this.kencaloModel && current?.texture && this.kencaloModel.currentTextureKey !== current.texture) {
      this.kencaloModel.setTexture(current.texture);
    }

    if (this.nameEl) {
      this.nameEl.textContent = `Kencalo ${current.name}`;
    }

    if (this.tagEl) {
      this.tagEl.textContent = `Textura ${current.texture} • ${currentIndex + 1} de ${list.length}`;
    }

    // Si tiene 1 solo Kencalo, deshabilitar flechas
    const hasMultiple = list.length > 1;
    if (this.btnPrev) {
      this.btnPrev.disabled = !hasMultiple;
      this.btnPrev.classList.toggle('disabled', !hasMultiple);
    }
    if (this.btnNext) {
      this.btnNext.disabled = !hasMultiple;
      this.btnNext.classList.toggle('disabled', !hasMultiple);
    }
  }
}
