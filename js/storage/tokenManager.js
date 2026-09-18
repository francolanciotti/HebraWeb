/**
 * TokenManager - Generador y validador de códigos alfanuméricos cortos (tokens de rescate)
 * Formato de Token: KENC-XXXXX (5 caracteres alfanuméricos con checksum)
 */

const TEXTURES = ['A', 'B', 'C', 'D'];
const TREES = ['tree_a', 'tree_b'];
const OUTFITS = ['default', 'outfit_corona', 'outfit_flor', 'outfit_palos', 'outfit_reno'];

export class TokenManager {
  /**
   * Genera un token corto de 5 caracteres alfanuméricos basado en el estado del juego
   * @param {Object} state - Estado actual de stateManager
   * @returns {string} Token alfanumérico ej: KENC-046DS
   */
  static generateToken(state) {
    if (!state) return 'KENC-00207';

    const captured = state.kencaloCaptured ? 1 : 0;
    let texIdx = TEXTURES.indexOf(state.kencaloTexture);
    if (texIdx < 0) texIdx = 0;

    let treeBits = 0;
    (state.discoveredTrees || []).forEach(t => {
      const idx = TREES.indexOf(t);
      if (idx >= 0) treeBits |= (1 << idx);
    });

    let outfitBits = 0;
    (state.unlockedOutfits || ['default']).forEach(o => {
      const idx = OUTFITS.indexOf(o);
      if (idx >= 0) outfitBits |= (1 << idx);
    });

    let curOutfitIdx = OUTFITS.indexOf(state.currentOutfit);
    if (curOutfitIdx < 0) curOutfitIdx = 0;

    // Empaquetar estado en un entero:
    // bit 0: capturado (1 bit)
    // bits 1-2: textura (2 bits)
    // bits 3-4: árboles descubiertos (2 bits)
    // bits 5-9: indumentarias desbloqueadas (5 bits)
    // bits 10-12: indumentaria activa (3 bits)
    const val = (captured & 1) |
                ((texIdx & 3) << 1) |
                ((treeBits & 3) << 3) |
                ((outfitBits & 31) << 5) |
                ((curOutfitIdx & 7) << 10);

    // Dígito de verificación alfanumérico (checksum)
    const checksum = ((val * 37 + 11) % 36);
    const code = val.toString(16).toUpperCase().padStart(4, '0') + checksum.toString(36).toUpperCase();

    return `KENC-${code}`;
  }

  /**
   * Valida e importa un token
   * @param {string} token - Token ingresado por el usuario (ej: KENC-046DS o Base64 legacy)
   * @returns {Object|null} Estado restaurado o null si es inválido
   */
  static parseToken(token) {
    if (!token || typeof token !== 'string') return null;

    let clean = token.trim();
    if (clean.toUpperCase().startsWith('KENC-')) {
      clean = clean.slice(5).trim();
    }
    if (!clean) return null;

    // 1. Decodificar formato corto oficial de 5 caracteres alfanuméricos (case-insensitive)
    const upper = clean.toUpperCase();
    if (upper.length === 5) {
      const hex = upper.slice(0, 4);
      const checkChar = upper.slice(4);
      const val = parseInt(hex, 16);

      if (!isNaN(val)) {
        const expectedCheck = ((val * 37 + 11) % 36).toString(36).toUpperCase();
        if (checkChar === expectedCheck) {
          const captured = (val & 1) === 1;
          const texIdx = (val >> 1) & 3;
          const treeBits = (val >> 3) & 3;
          const outfitBits = (val >> 5) & 31;
          const curOutfitIdx = (val >> 10) & 7;

          const discoveredTrees = [];
          TREES.forEach((t, i) => {
            if ((treeBits & (1 << i)) !== 0) discoveredTrees.push(t);
          });

          const unlockedOutfits = [];
          OUTFITS.forEach((o, i) => {
            if ((outfitBits & (1 << i)) !== 0) unlockedOutfits.push(o);
          });
          if (unlockedOutfits.length === 0) unlockedOutfits.push('default');

          return {
            kencaloCaptured: captured,
            kencaloTexture: TEXTURES[texIdx] || 'A',
            discoveredTrees,
            unlockedOutfits,
            currentOutfit: OUTFITS[curOutfitIdx] || 'default'
          };
        }
      }
    }

    // 2. Fallback: Formato Base64 JSON (legacy)
    try {
      let b64 = clean.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) {
        b64 += '=';
      }

      const jsonString = decodeURIComponent(escape(atob(b64)));
      const payload = JSON.parse(jsonString);

      if (payload && (typeof payload.c !== 'undefined' || typeof payload.kencaloCaptured !== 'undefined')) {
        return {
          kencaloCaptured: payload.c === 1 || payload.kencaloCaptured === true,
          kencaloTexture: payload.tex || payload.kencaloTexture || 'A',
          discoveredTrees: Array.isArray(payload.t) ? payload.t : (Array.isArray(payload.discoveredTrees) ? payload.discoveredTrees : []),
          unlockedOutfits: Array.isArray(payload.o) ? payload.o : (Array.isArray(payload.unlockedOutfits) ? payload.unlockedOutfits : ['default']),
          currentOutfit: payload.co || payload.currentOutfit || 'default'
        };
      }
    } catch (e) {
      // Ignorar error de fallback
    }

    return null;
  }
}
