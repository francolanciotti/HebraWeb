/**
 * OutfitSelectorUI - Drawer e interfaz para la selección de indumentaria desbloqueada
 */

const OUTFITS_DATA = [
  {
    id: 'default',
    name: 'Natural',
    icon: '🟢',
    description: 'La forma original e interactiva de Kencalo.'
  },
  {
    id: 'outfit_corona',
    name: 'Corona',
    icon: '👑',
    description: 'Indumento Corona real en 3D.'
  },
  {
    id: 'outfit_flor',
    name: 'Flor',
    icon: '🌸',
    description: 'Indumento Flor bio-digital en 3D.'
  },
  {
    id: 'outfit_palos',
    name: 'Palos',
    icon: '🪵',
    description: 'Indumento Palos orgánicos en 3D.'
  },
  {
    id: 'outfit_reno',
    name: 'Reno',
    icon: '🦌',
    description: 'Indumento Cuernos de Reno en 3D.'
  }
];

export class OutfitSelectorUI {
  constructor(stateManager, kencaloModel) {
    this.stateManager = stateManager;
    this.kencaloModel = kencaloModel;

    this.drawerEl = document.getElementById('wardrobe-drawer');
    this.gridEl = document.getElementById('outfit-options-grid');
    this.btnOpen = document.getElementById('btn-open-wardrobe');
    this.btnClose = document.getElementById('btn-close-wardrobe');
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
          this.open();
        }
      });
    }

    if (this.btnClose) {
      this.btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
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
    const unlocked = state.unlockedOutfits || ['default', 'outfit_corona', 'outfit_flor', 'outfit_palos', 'outfit_reno'];
    const current = state.currentOutfit || 'default';

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

      const card = document.createElement('div');
      card.className = `outfit-card ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      
      card.innerHTML = `
        <span class="outfit-icon">${outfit.icon}</span>
        <span class="outfit-name">${outfit.name}</span>
        ${!isUnlocked ? '<span class="outfit-badge-lock">🔒 Árbol B</span>' : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.stateManager.setOutfit(outfit.id);
          this.kencaloModel.setOutfit(outfit.id);
          this.render();
        });
      }

      this.gridEl.appendChild(card);
    });
  }
}
