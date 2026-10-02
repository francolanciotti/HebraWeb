/**
 * OutfitSelectorUI - Drawer e interfaz para la selección de indumentaria desbloqueada
 */

import { soundManager } from '../audio/audioManager.js';

const OUTFITS_DATA = [
  {
    id: 'default',
    name: 'Natural',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="14" r="7"/><circle cx="9.5" cy="13" r="1" fill="currentColor"/><circle cx="14.5" cy="13" r="1" fill="currentColor"/><path d="M12 7V4 M12 4c1.5-1.5 3-1 4 0" stroke-linecap="round"/></svg>`,
    description: 'La forma original e interactiva de Kencalo.'
  },
  {
    id: 'outfit_corona',
    name: 'Corona',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17h18L19 8l-4 4-3-6-3 6-4-4-2 9z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    description: 'Indumento Corona real en 3D.'
  },
  {
    id: 'outfit_flor',
    name: 'Flor',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5 3.5 3.5 0 01-3.5 3.5 3.5 3.5 0 01-3.5-3.5 3.5 3.5 0 01-3.5-3.5 3.5 3.5 0 013.5-3.5A3.5 3.5 0 0112 5z"/></svg>`,
    description: 'Indumento Flor bio-digital en 3D.'
  },
  {
    id: 'outfit_palos',
    name: 'Palos',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L20 4M8 4l12 12M4 10l10 10" stroke-linecap="round"/></svg>`,
    description: 'Indumento Palos orgánicos en 3D.'
  },
  {
    id: 'outfit_reno',
    name: 'Reno',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v5a3 3 0 003 3h6a3 3 0 003-3V4M4 6h4M16 6h4M12 12v8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    description: 'Indumento Cuernos de Reno en 3D.'
  },
  {
    id: 'outfit_pet',
    name: 'Pet',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M8 15s1.5 2 4 2 4-2 4-2" stroke-linecap="round"/></svg>`,
    description: 'Compañero místico en 3D.'
  }
];

export class OutfitSelectorUI {
  constructor(stateManager, kencaloModel) {
    this.stateManager = stateManager;
    this.kencaloModel = kencaloModel;

    this.drawerEl = document.getElementById('wardrobe-drawer');
    this.gridEl = document.getElementById('outfit-options-grid');
    this.btnOpen = document.getElementById('btn-open-wardrobe');
    this.badgeEl = document.getElementById('wardrobe-badge');

    this.initEvents();
    this.render();
    this.stateManager.subscribe(() => this.render());
  }

  initEvents() {
    if (this.btnOpen) {
      this.btnOpen.addEventListener('click', (e) => {
        e.stopPropagation();
        const state = this.stateManager.getState();
        if (state.kencaloCaptured) {
          this.toggle();
        }
      });
    }

    // Cerrar desplegable al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (this.drawerEl && !this.drawerEl.contains(e.target) && e.target !== this.btnOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.drawerEl) {
      this.drawerEl.classList.toggle('hidden');
    }
  }

  open() {
    this.render();
    if (this.drawerEl) this.drawerEl.classList.remove('hidden');
  }

  close() {
    if (this.drawerEl) this.drawerEl.classList.add('hidden');
  }

  render() {
    const state = this.stateManager.getState();
    const unlocked = state.unlockedOutfits || ['default'];
    const currentKencalo = this.stateManager.getCurrentKencalo();
    const treeId = currentKencalo?.treeId || state.activeKencaloTreeId || 'tree_a';
    const current = this.stateManager.getOutfitForKencalo(treeId);

    // Actualizar botón del armario en HUD
    if (this.btnOpen) {
      if (state.kencaloCaptured) {
        this.btnOpen.classList.remove('disabled');
      } else {
        this.btnOpen.classList.add('disabled');
      }
    }

    // Indicador de notificación si hay indumentarias
    if (this.badgeEl) {
      if (unlocked.length > 1) {
        this.badgeEl.classList.remove('hidden');
      } else {
        this.badgeEl.classList.add('hidden');
      }
    }

    if (!this.gridEl) return;

    this.gridEl.innerHTML = '';

    OUTFITS_DATA.forEach(outfit => {
      const isUnlocked = unlocked.includes(outfit.id);
      const isActive = current === outfit.id;

      const btn = document.createElement('button');
      btn.className = `outfit-icon-btn ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      btn.title = isUnlocked ? outfit.name : `${outfit.name} (Bloqueado - Árbol B)`;
      btn.innerHTML = outfit.svg;

      if (isUnlocked) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          soundManager.playOutfitNav();
          this.stateManager.setOutfit(outfit.id, treeId);
          this.kencaloModel.setOutfit(outfit.id);
          this.render();
        });
      } else {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          soundManager.playOutfitNav();
          this.stateManager.unlockSpecialEventOutfits();
          this.stateManager.setOutfit(outfit.id, treeId);
          this.kencaloModel.setOutfit(outfit.id);
          this.render();
        });
      }

      this.gridEl.appendChild(btn);
    });
  }
}
