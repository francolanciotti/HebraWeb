/**
 * StateManager - Control de almacenamiento local y reactividad del estado de Kencalo
 */

const STORAGE_KEY = 'kencalo_game_state_v1';

const TEXTURES = ['A', 'B', 'C', 'D'];
const getRandomTexture = () => TEXTURES[Math.floor(Math.random() * TEXTURES.length)];

const defaultState = {
  kencaloCaptured: false,
  activeKencaloTreeId: 'tree_a', // 'tree_a' | 'tree_b' | 'tree_c'
  kencaloTexture: getRandomTexture(), // 'A' | 'B' | 'C' | 'D'
  discoveredTrees: [], // ['tree_a', 'tree_b', 'tree_c']
  discoveredCoordinates: [], // Coordenadas reveladas por glifos ['tree_a', 'tree_b', 'tree_c']
  capturedKencalos: {}, // { tree_a: 'A', tree_b: 'B', tree_c: 'C' }
  unlockedOutfits: ['default'], // Solo 'default'. La indumentaria solo se desbloquea en un evento especial
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
        const parsed = { ...defaultState, ...JSON.parse(raw) };
        if (!Array.isArray(parsed.discoveredCoordinates)) {
          parsed.discoveredCoordinates = [];
        }
        if (!parsed.capturedKencalos || typeof parsed.capturedKencalos !== 'object') {
          parsed.capturedKencalos = {};
        }
        // Migración retrocompatible: si ya tenía kencaloCaptured pero no en capturedKencalos
        if (parsed.kencaloCaptured && parsed.discoveredTrees?.includes('tree_a') && !parsed.capturedKencalos.tree_a) {
          parsed.capturedKencalos.tree_a = parsed.kencaloTexture || 'A';
        }
        if (parsed.discoveredTrees?.includes('tree_b') && !parsed.capturedKencalos.tree_b) {
          parsed.capturedKencalos.tree_b = 'B';
        }
        if (parsed.discoveredTrees?.includes('tree_c') && !parsed.capturedKencalos.tree_c) {
          parsed.capturedKencalos.tree_c = 'C';
        }
        if (!parsed.activeKencaloTreeId && parsed.discoveredTrees?.length > 0) {
          parsed.activeKencaloTreeId = parsed.discoveredTrees[0];
        }
        return parsed;
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

  /**
   * Obtiene una textura que aún no haya sido asignada a otro árbol capturado.
   */
  getDistinctTextureForTree(treeId) {
    const usedTextures = Object.values(this.state.capturedKencalos || {});
    // Texturas disponibles que no estén en uso
    const available = TEXTURES.filter(t => !usedTextures.includes(t));
    if (available.length > 0) {
      return available[0];
    }
    // Si se agotaron las 4 texturas, asigna de forma determinista según el árbol
    const treeOrder = ['tree_a', 'tree_b', 'tree_c', 'tree_d'];
    const idx = Math.max(0, treeOrder.indexOf(treeId));
    return TEXTURES[idx % TEXTURES.length];
  }

  /**
   * Captura un Kencalo asociado a un árbol específico de la ciudad.
   * Regla de juego: Cada árbol otorga siempre un Kencalo con textura distinta.
   */
  captureKencaloFromTree(treeId = 'tree_a', preferredTexture = null) {
    if (this.isTreeCaptured(treeId)) {
      return false; // Árbol ya capturado previamente. No se puede volver a capturar el mismo árbol.
    }

    const discovered = new Set(this.state.discoveredTrees || []);
    const isNew = !discovered.has(treeId);
    discovered.add(treeId);

    const capturedMap = { ...(this.state.capturedKencalos || {}) };
    let finalTex = capturedMap[treeId];

    if (!finalTex) {
      if (preferredTexture && TEXTURES.includes(preferredTexture)) {
        finalTex = preferredTexture;
      } else {
        finalTex = this.getDistinctTextureForTree(treeId);
      }
      capturedMap[treeId] = finalTex;
    }

    this.state.kencaloCaptured = true;
    this.state.activeKencaloTreeId = treeId; // Sintoniza el recién capturado como compañero activo
    this.state.kencaloTexture = finalTex; // Actualiza el compañero activo
    this.state.discoveredTrees = Array.from(discovered);
    this.state.capturedKencalos = capturedMap;

    if (!this.state.unlockedOutfits || this.state.unlockedOutfits.length === 0) {
      this.state.unlockedOutfits = ['default'];
    }

    this.saveState();
    return isNew;
  }

  // Compatibilidad con la vista AR original (Árbol A)
  captureKencalo(textureKey) {
    return this.captureKencaloFromTree('tree_a', textureKey);
  }

  // Compatibilidad con escaneo de Árbol B
  discoverTreeB() {
    return this.captureKencaloFromTree('tree_b');
  }

  // Captura / descubrimiento de Árbol C
  discoverTreeC() {
    return this.captureKencaloFromTree('tree_c');
  }

  /**
   * Desbloquea las coordenadas de un árbol en el mapa de La Plata mediante el Traductor de Glifos.
   */
  discoverCoordinatesByGlyph(treeId) {
    const coords = new Set(this.state.discoveredCoordinates || []);
    const isNew = !coords.has(treeId);
    coords.add(treeId);
    this.state.discoveredCoordinates = Array.from(coords);
    this.saveState();
    return isNew;
  }

  /**
   * Regla de visibilidad en el mapa de La Plata (Niebla de Exploración):
   * En el mapa SOLO salen las coordenadas que fueron descubiertas en glifos O si se capturó el Kencalo de ese árbol.
   */
  isTreeVisibleOnMap(treeId) {
    const hasCoordinates = (this.state.discoveredCoordinates || []).includes(treeId);
    const isCaptured = (this.state.discoveredTrees || []).includes(treeId);
    return Boolean(hasCoordinates || isCaptured);
  }

  isTreeCaptured(treeId) {
    return Boolean((this.state.discoveredTrees || []).includes(treeId));
  }

  getKencaloTextureForTree(treeId) {
    return this.state.capturedKencalos?.[treeId] || null;
  }

  /**
   * Obtiene la lista de todos los Kencalos en posesión del usuario
   */
  getPossessedKencalos() {
    const treeNames = {
      tree_a: 'El Bosque',
      tree_b: 'Plaza San Martín',
      tree_c: 'Plaza Rocha'
    };

    const list = [];
    const discovered = this.state.discoveredTrees || [];
    const capturedMap = this.state.capturedKencalos || {};

    discovered.forEach((treeId, index) => {
      const tex = capturedMap[treeId] || (index === 0 ? this.state.kencaloTexture : 'A');
      list.push({
        treeId: treeId,
        name: treeNames[treeId] || `Árbol ${treeId.replace('tree_', '').toUpperCase()}`,
        texture: tex
      });
    });

    // Fallback si kencaloCaptured es true pero discoveredTrees estuviera vacío
    if (list.length === 0 && this.state.kencaloCaptured) {
      list.push({
        treeId: 'tree_a',
        name: 'El Bosque',
        texture: this.state.kencaloTexture || 'A'
      });
    }

    return list;
  }

  /**
   * Obtiene el Kencalo actualmente seleccionado/activo
   */
  getCurrentKencalo() {
    const list = this.getPossessedKencalos();
    if (list.length === 0) return null;

    if (this.state.activeKencaloTreeId) {
      const found = list.find(k => k.treeId === this.state.activeKencaloTreeId);
      if (found) return found;
    }

    const currentTex = this.state.kencaloTexture;
    const foundByTex = list.find(k => k.texture === currentTex);
    const chosen = foundByTex || list[0];
    this.state.activeKencaloTreeId = chosen.treeId;
    return chosen;
  }

  /**
   * Cambia al siguiente (+1) o anterior (-1) Kencalo en posesión
   */
  switchKencalo(direction = 1) {
    const list = this.getPossessedKencalos();
    if (list.length <= 1) return this.getCurrentKencalo();

    const current = this.getCurrentKencalo();
    let currentIndex = list.findIndex(k => k.treeId === current.treeId);
    if (currentIndex < 0) currentIndex = 0;

    let nextIndex = (currentIndex + direction + list.length) % list.length;
    const nextKencalo = list[nextIndex];

    this.state.activeKencaloTreeId = nextKencalo.treeId;
    this.state.kencaloTexture = nextKencalo.texture;
    this.saveState();
    return nextKencalo;
  }

  /**
   * Desbloqueo de indumentarias (reservado exclusivamente para un evento especial).
   */
  unlockSpecialEventOutfits() {
    const outfits = new Set(this.state.unlockedOutfits || ['default']);
    ['outfit_corona', 'outfit_flor', 'outfit_palos', 'outfit_reno'].forEach(id => outfits.add(id));
    this.state.unlockedOutfits = Array.from(outfits);
    this.saveState();
    return true;
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
    this.state = {
      ...defaultState,
      activeKencaloTreeId: 'tree_a',
      kencaloTexture: getRandomTexture(),
      discoveredTrees: [],
      discoveredCoordinates: [],
      capturedKencalos: {}
    };
    this.saveState();
  }
}

export const stateManager = new StateManager();
