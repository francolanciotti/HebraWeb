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
    this.audioCtx = null;
    this.initAudioUnlock();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Inicializa la escucha para desbloquear el audio en navegadores móviles/desktop
   * tras la primera interacción del usuario (click / tap).
   */
  initAudioUnlock() {
    const unlock = () => {
      if (this.isUnlocked) return;
      this.getAudioContext();
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
   * Sonido rúnico armónico al pulsar un glifo (Web Audio API)
   * Escala pentatónica etérea según el índice del glifo (1 al 12).
   */
  playGlyphTap(glyphIndex = 1) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1046.50];
      const freq = scale[(glyphIndex - 1) % scale.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('AudioContext glifo tap:', e);
    }
  }

  /**
   * Acorde ascendente de resonancia al descifrar exitosamente una coordenada
   */
  playDecodeSuccess() {
    const ctx = this.getAudioContext();
    if (!ctx) {
      this.playScanSuccess();
      return;
    }

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } catch (e) {
      this.playScanSuccess();
    }
  }

  /**
   * Sonido sutil de señal no sintonizada al fallar la combinación
   */
  playDecodeFail() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('AudioContext fail tone:', e);
    }
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
