/**
 * StateManager - Control de almacenamiento local y reactividad del estado de Kencalo
 */

const STORAGE_KEY = 'kencalo_game_state_v1';

const defaultState = {
  kencaloCaptured: false,
  kencaloTexture: 'A', // 'A' | 'B' | 'C' | 'D'
  discoveredTrees: [], // ['tree_a', 'tree_b']
  unlockedOutfits: ['default', 'outfit_corona', 'outfit_flor', 'outfit_palos', 'outfit_reno'],
  currentOutfit: 'default',
  lastInteractionTime: null
};

class StateManager {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...defaultState, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Error al cargar estado de localStorage:', e);
    }
    return { ...defaultState };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (e) {
      console.error('Error al guardar estado:', e);
    }
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.saveState();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach(cb => cb(currentState));
  }

  // Métodos helper específicos
  captureKencalo() {
    if (!this.state.kencaloCaptured) {
      const textures = ['A', 'B', 'C', 'D'];
      const randomTex = textures[Math.floor(Math.random() * textures.length)];
      
      const discovered = new Set(this.state.discoveredTrees);
      discovered.add('tree_a');

      this.state.kencaloCaptured = true;
      this.state.kencaloTexture = randomTex;
      this.state.discoveredTrees = Array.from(discovered);
      this.saveState();
      return true;
    }
    return false;
  }

  discoverTreeB() {
    const discovered = new Set(this.state.discoveredTrees);
    const outfits = new Set(this.state.unlockedOutfits);
    
    let isNew = !discovered.has('tree_b');
    discovered.add('tree_b');
    
    ['outfit_corona', 'outfit_flor', 'outfit_palos', 'outfit_reno'].forEach(id => outfits.add(id));

    this.state.discoveredTrees = Array.from(discovered);
    this.state.unlockedOutfits = Array.from(outfits);
    this.saveState();
    return isNew;
  }

  setOutfit(outfitId) {
    if (this.state.unlockedOutfits.includes(outfitId)) {
      this.state.currentOutfit = outfitId;
      this.saveState();
      return true;
    }
    return false;
  }

  resetProgress() {
    this.state = { ...defaultState };
    this.saveState();
  }
}

export const stateManager = new StateManager();
