/**
 * FirebaseService - Conexión con Firestore para persistencia y sincronización multidispositivo
 * de cuentas de Hebra.
 * Compatible con GitHub Pages (Vanilla JS modular vía CDN oficial de Firebase v10).
 */

import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isInitialized = false;

    this.init();
  }

  init() {
    try {
      if (firebaseConfig && firebaseConfig.apiKey) {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        this.isInitialized = true;
        console.log('[FirebaseService] Firestore conectado exitosamente.');
      } else {
        console.warn('[FirebaseService] Configuración de Firebase incompleta.');
      }
    } catch (e) {
      console.warn('[FirebaseService] Error al inicializar Firebase:', e);
      this.isInitialized = false;
    }
  }

  isAvailable() {
    return Boolean(this.isInitialized && this.db);
  }

  /**
   * Sanitiza el estado del juego para almacenar únicamente datos serializables
   */
  sanitizeState(state) {
    if (!state || typeof state !== 'object') return {};
    return {
      kencaloCaptured: Boolean(state.kencaloCaptured),
      activeKencaloTreeId: state.activeKencaloTreeId || 'tree_a',
      kencaloTexture: state.kencaloTexture || 'A',
      discoveredTrees: Array.isArray(state.discoveredTrees) ? [...state.discoveredTrees] : [],
      discoveredCoordinates: Array.isArray(state.discoveredCoordinates) ? [...state.discoveredCoordinates] : [],
      capturedKencalos: state.capturedKencalos && typeof state.capturedKencalos === 'object' ? { ...state.capturedKencalos } : {},
      capturedSpecies: state.capturedSpecies && typeof state.capturedSpecies === 'object' ? { ...state.capturedSpecies } : {},
      kencaloOutfits: state.kencaloOutfits && typeof state.kencaloOutfits === 'object' ? { ...state.kencaloOutfits } : {},
      unlockedOutfits: Array.isArray(state.unlockedOutfits) ? [...state.unlockedOutfits] : ['default'],
      currentOutfit: state.currentOutfit || 'default',
      userIdentifier: state.userIdentifier || null,
      isAccountLinked: Boolean(state.isAccountLinked)
    };
  }

  /**
   * Verifica si un nombre de usuario ya existe en Firestore
   */
  async checkAccountExists(username) {
    if (!this.isAvailable()) return { exists: false, offline: true };

    const cleanId = String(username).trim().toLowerCase();
    if (!cleanId) return { exists: false, error: 'Usuario inválido' };

    try {
      const docRef = doc(this.db, 'accounts', cleanId);
      const snapshot = await getDoc(docRef);
      return { exists: snapshot.exists(), data: snapshot.exists() ? snapshot.data() : null };
    } catch (err) {
      console.warn('[FirebaseService] Error al verificar cuenta en Firestore:', err);
      return { exists: false, error: err.message, offline: true };
    }
  }

  /**
   * Registra una nueva cuenta en la nube para un usuario invitado
   */
  async createAccountInCloud(username, stateData) {
    if (!this.isAvailable()) {
      return { success: false, offline: true, message: 'Servicio en la nube no disponible' };
    }

    const cleanId = String(username).trim().toLowerCase();
    const cleanState = this.sanitizeState(stateData);

    try {
      const docRef = doc(this.db, 'accounts', cleanId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { success: false, message: `El usuario "${username}" ya está registrado en la nube.` };
      }

      await setDoc(docRef, {
        username: username.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        state: cleanState
      });

      return { success: true, message: `Cuenta "${username}" guardada en la nube con éxito.` };
    } catch (err) {
      console.error('[FirebaseService] Error al crear cuenta en Firestore:', err);
      if (err.code === 'permission-denied') {
        return { success: false, message: 'Permiso denegado en Firestore (verifica que la base esté en Modo de prueba).' };
      }
      return { success: false, message: 'No se pudo conectar con la nube. Guardado localmente.' };
    }
  }

  /**
   * Actualiza el progreso de una cuenta ya vinculada en Firestore
   */
  async saveAccountToCloud(username, stateData) {
    if (!this.isAvailable()) return false;

    const cleanId = String(username).trim().toLowerCase();
    const cleanState = this.sanitizeState(stateData);

    try {
      const docRef = doc(this.db, 'accounts', cleanId);
      await setDoc(docRef, {
        username: username.trim(),
        updatedAt: serverTimestamp(),
        state: cleanState
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('[FirebaseService] Error al sincronizar con Firestore:', err);
      return false;
    }
  }

  /**
   * Carga directamente la partida guardada desde la nube (CERO MERGE)
   */
  async loadAccountFromCloud(username) {
    if (!this.isAvailable()) {
      return { success: false, offline: true, message: 'No hay conexión con la nube' };
    }

    const cleanId = String(username).trim().toLowerCase();
    try {
      const docRef = doc(this.db, 'accounts', cleanId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const loadedState = data.state || {};
        return { 
          success: true, 
          state: this.sanitizeState({ ...loadedState, userIdentifier: data.username || username, isAccountLinked: true }),
          message: `Partida de "${data.username || username}" recuperada de la nube.`
        };
      } else {
        return { success: false, message: `No se encontró el usuario "${username}" en la nube.` };
      }
    } catch (err) {
      console.error('[FirebaseService] Error al cargar cuenta desde Firestore:', err);
      if (err.code === 'permission-denied') {
        return { success: false, message: 'Permiso denegado en Firestore (verifica el Modo de prueba).' };
      }
      return { success: false, message: 'Error de conexión con la nube.' };
    }
  }
}

export const firebaseService = new FirebaseService();
