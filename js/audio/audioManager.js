/**
 * AudioManager - Gestor centralizado de efectos de sonido para WebHebra / Kencalo
 *
 * Mapeo de Audios:
 * - 1.mp3: Captura de Kencalo e interacción táctil con la criatura.
 * - 3.mp3: Reconocimiento y escaneo exitoso de marcadores AR en el entorno.
 * - 4.mp3: Selección/equipar indumentaria y transición entre secciones de la app.
 */

export class AudioManager {
  constructor() {
    this.sounds = {
      kencaloInteract: new Audio('./assets/audio/1.mp3'),
      scanSuccess: new Audio('./assets/audio/3.mp3'),
      outfitNav: new Audio('./assets/audio/4.mp3')
    };

    // Precargar audios para baja latencia
    Object.values(this.sounds).forEach(audio => {
      audio.preload = 'auto';
    });

    this.isUnlocked = false;
    this.initAudioUnlock();
  }

  /**
   * Inicializa la escucha para desbloquear el audio en navegadores móviles/desktop
   * tras la primera interacción del usuario (click / tap).
   */
  initAudioUnlock() {
    const unlock = () => {
      if (this.isUnlocked) return;
      Object.values(this.sounds).forEach(audio => {
        const promise = audio.play();
        if (promise !== undefined) {
          promise.then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch(() => {});
        }
      });
      this.isUnlocked = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  /**
   * Reproduce 1.mp3 - Al capturar a Kencalo o interactuar/tocar la criatura 3D
   */
  playKencaloInteract() {
    this.playSound(this.sounds.kencaloInteract);
  }

  /**
   * Reproduce 3.mp3 - Al detectar/escanear correctamente un marcador de árbol
   */
  playScanSuccess() {
    this.playSound(this.sounds.scanSuccess);
  }

  /**
   * Reproduce 4.mp3 - Al equipar una prenda de vestir o pasar entre secciones
   */
  playOutfitNav() {
    this.playSound(this.sounds.outfitNav);
  }

  /**
   * Función auxiliar para reiniciar el tiempo del audio y reproducirlo de forma segura
   */
  playSound(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Reproducción de audio atenuada o retenida por el navegador:', err);
        });
      }
    } catch (err) {
      console.warn('Error al reproducir audio de interacción:', err);
    }
  }
}

export const soundManager = new AudioManager();
