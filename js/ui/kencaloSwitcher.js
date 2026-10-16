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
    if (this.isSwitching) return;

    const list = this.stateManager.getPossessedKencalos();
    if (list.length <= 1) return;

    this.isSwitching = true;

    const nextKencalo = this.stateManager.switchKencalo(direction);
    if (!nextKencalo) {
      this.isSwitching = false;
      return;
    }

    const outfit = this.stateManager.getOutfitForKencalo(nextKencalo.treeId);

    if (this.kencaloModel) {
      this.kencaloModel.currentOutfitId = outfit;
      if (nextKencalo.speciesId && this.kencaloModel.currentSpeciesId !== nextKencalo.speciesId) {
        this.kencaloModel.loadSpecies(nextKencalo.speciesId, nextKencalo.texture, () => {
          this.kencaloModel.setOutfit(outfit);
          this.kencaloModel.triggerTouchReaction();
          this.isSwitching = false;
        });
      } else {
        this.kencaloModel.setTexture(nextKencalo.texture);
        this.kencaloModel.setOutfit(outfit);
        this.kencaloModel.triggerTouchReaction();
        this.isSwitching = false;
      }
    } else {
      this.isSwitching = false;
    }

    // Actualizar datos de UI de la píldora inmediatamente
    this.renderUIOnly();

    // Desbloquear por seguridad si la carga toma más tiempo
    setTimeout(() => {
      this.isSwitching = false;
    }, 450);
  }

  renderUIOnly() {
    if (!this.capsuleEl) return;

    const list = this.stateManager.getPossessedKencalos();
    if (list.length === 0) {
      this.capsuleEl.classList.add('hidden');
      return;
    }

    this.capsuleEl.classList.remove('hidden');

    const current = this.stateManager.getCurrentKencalo() || list[0];
    let currentIndex = list.findIndex(k => k.treeId === current.treeId);
    if (currentIndex < 0) currentIndex = 0;

    if (this.nameEl) {
      this.nameEl.textContent = current.fullName || `Kencalo ${current.companionTitle || current.name}`;
    }

    if (this.tagEl) {
      this.tagEl.textContent = `Compañero • ${currentIndex + 1} de ${list.length}`;
    }

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

  render() {
    this.renderUIOnly();

    // Si ya hay un cambio en proceso o el modelo está cargando, no disparar cargas redundantes
    if (this.isSwitching || this.kencaloModel?.isLoadingSpecies) return;

    const list = this.stateManager.getPossessedKencalos();
    if (list.length === 0) return;

    const current = this.stateManager.getCurrentKencalo() || list[0];

    // Sincronizar especie, textura e indumento en el modelo 3D solo si difiere
    const outfit = this.stateManager.getOutfitForKencalo(current?.treeId);
    if (this.kencaloModel && current) {
      this.kencaloModel.currentOutfitId = outfit;
      if (current.speciesId && this.kencaloModel.currentSpeciesId !== current.speciesId) {
        this.kencaloModel.loadSpecies(current.speciesId, current.texture, () => {
          this.kencaloModel.setOutfit(outfit);
        });
      } else {
        if (current?.texture && this.kencaloModel.currentTextureKey !== current.texture) {
          this.kencaloModel.setTexture(current.texture);
        }
        if (this.kencaloModel.currentOutfitId !== outfit) {
          this.kencaloModel.setOutfit(outfit);
        }
      }
    }
  }
}
