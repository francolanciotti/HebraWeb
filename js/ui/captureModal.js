/**
 * CaptureStoryUI - Generador de postales estilo Polaroid en formato vertical (9:16)
 * optimizado para previsualización clara en pantalla y para subir a Instagram Stories.
 * REGLA ESTRICTA: Sin ninguna mención de texturas en el arte ni en el texto.
 */

import { NotificationUI } from './notificationUI.js';
import { soundManager } from '../audio/audioManager.js';
import { getPolaroidTreeData, getKencaloFullName } from '../config/gameRegistry.js';

const TREE_DATA = getPolaroidTreeData();

export class CaptureStoryUI {
  constructor(stateManager, sceneManager, onContinueCallback = null) {
    this.stateManager = stateManager;
    this.sceneManager = sceneManager;
    this.onContinueCallback = onContinueCallback;

    // Elementos del Modal Polaroid
    this.modal = document.getElementById('polaroid-share-modal');
    this.backdrop = document.getElementById('polaroid-modal-backdrop');
    this.btnClose = document.getElementById('btn-close-polaroid');
    this.previewImg = document.getElementById('polaroid-preview-img');
    this.spinner = document.getElementById('polaroid-spinner');
    this.btnShare = document.getElementById('btn-polaroid-share');
    this.btnSave = document.getElementById('btn-polaroid-save');
    this.canvas = document.getElementById('polaroid-story-canvas');

    this.currentBlob = null;
    this.currentDataURL = null;
    this.currentTreeId = 'tree_a';
    this.isGenerating = false;

    this.initEvents();
  }

  initEvents() {
    // Evitar que toques dentro del modal se propaguen al 3D o fondo
    if (this.modal) {
      this.modal.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.modal.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    }

    if (this.btnClose) {
      this.btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    if (this.btnShare) {
      this.btnShare.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shareToInstagram();
      });
    }

    if (this.btnSave) {
      this.btnSave.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadImage();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.setAttribute('aria-hidden', 'true');
    }
    if (typeof this.onContinueCallback === 'function') {
      this.onContinueCallback();
    }
  }

  /**
   * Abre el modal y genera la postal Polaroid en alta resolución
   */
  async openCapture(treeId = 'tree_a') {
    this.currentTreeId = treeId;

    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.modal.setAttribute('aria-hidden', 'false');
    }

    if (this.spinner) this.spinner.classList.remove('hidden');
    if (this.previewImg) this.previewImg.style.opacity = '0.35';

    soundManager.playScanSuccess();
    await this.generateStoryCard(treeId);

    if (this.spinner) this.spinner.classList.add('hidden');
    if (this.previewImg) this.previewImg.style.opacity = '1';
  }

  /**
   * Renderiza la composición vertical 9:16 con el retrato Polaroid central
   */
  async generateStoryCard(treeId) {
    if (!this.canvas) return;
    this.isGenerating = true;

    const ctx = this.canvas.getContext('2d');
    const size = 800;
    this.canvas.width = size;
    this.canvas.height = size;

    const state = this.stateManager.getState();
    const companionDisplayName = getKencaloFullName(treeId) || "Kencalo del Bosque";
    const userTag = state.userIdentifier ? `${state.userIdentifier}` : "@hebra.tdm3";

    ctx.clearRect(0, 0, size, size);

    // 1. Cargar y dibujar tu SVG de fondo
    await new Promise((resolve, reject) => {
      const svgImg = new Image();
      svgImg.onload = () => {
        ctx.save();
        // Sombra suave para el SVG
        ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        
        // Dibuja el SVG (ajusta las coordenadas y el tamaño si es necesario)
        ctx.drawImage(svgImg, 0, 0, size, size);
        ctx.restore();
        resolve();
      };
      svgImg.onerror = () => {
        console.error("Error cargando el SVG");
        resolve(); // Resolvemos igual para no bloquear la app
      };
      // REEMPLAZA ESTO CON LA RUTA REAL A TU ARCHIVO SVG
      svgImg.src = 'assets/compartir_blob.svg'; 
    });

    // 2. Textos (Arriba a la Izquierda)
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#0f2446'; // Azul oscuro
    ctx.font = '700 42px "Epilogue", "Inter", sans-serif';
    ctx.fillText(companionDisplayName, 120, 170);

    ctx.fillStyle = '#1b345a';
    ctx.font = '400 28px "Epilogue", sans-serif';
    ctx.fillText(userTag, 120, 220);
    ctx.fillText('@hebra.tdm3', 120, 275);

    // 3. Renderizar instantánea 3D de Kencalo (ahora transparente)
    if (this.sceneManager) {
      const snapData = this.sceneManager.getSnapshotDataURL();
      if (snapData) {
        await this.drawKencaloSnapshot(ctx, snapData, 180, 280, 440, 440);
      }
    }

    // 4. Generar salida
    this.currentDataURL = this.canvas.toDataURL('image/png');
    if (this.previewImg) {
      this.previewImg.src = this.currentDataURL;
    }

    this.currentBlob = await new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'));
    this.isGenerating = false;
  }
  /**
   * Dibuja y recorta la instantánea 3D de Kencalo dentro de la ventana de la foto
   */
  drawKencaloSnapshot(ctx, dataURL, boxX, boxY, boxW, boxH) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        
        // 1. Escalar más grande. 
        // Como alejamos la cámara, multiplicamos fuerte (ej: 1.6 o 1.8) 
        // Juega con este valor si lo quieres aún más gigante.
        const scale = Math.max(boxW / img.width, boxH / img.height) * 1.5; 
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // 2. Centramos en X, y le restamos valor en Y para subirlo.
        const drawX = boxX + (boxW - drawWidth) / 2;
        const drawY = boxY + (boxH - drawHeight) / 2 - 60; // El -90 lo eleva. Ajusta si necesitas más.

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        ctx.restore();
        resolve();
      };
      img.onerror = () => {
        console.error("Error al renderizar el PNG del Kencalo.");
        resolve();
      };
      img.src = dataURL;
    });
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Comparte a través de la Web Share API (abre Instagram Stories / WhatsApp en smartphones)
   */
  async shareToInstagram() {
    if (!this.currentBlob) {
      NotificationUI.showToast('Generando postal...', '⏳');
      return;
    }

    const treeInfo = TREE_DATA[this.currentTreeId] || TREE_DATA.tree_a;
    const file = new File([this.currentBlob], `hebra_${this.currentTreeId}_polaroid.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        const compName = getKencaloFullName(this.currentTreeId);
        await navigator.share({
          title: `Hebra — ${compName}`,
          text: `Registro de encuentro con el ${compName}. @hebra.tdm3`,
          files: [file]
        });
        NotificationUI.showToast('¡Compartido con éxito!', '✨');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Error en Web Share, guardando imagen:', err);
          this.downloadImage();
        }
      }
    } else {
      // Fallback: descarga directa
      this.downloadImage();
      NotificationUI.showToast('Postal guardada para subir a tu Historia', '📸');
    }
  }

  downloadImage() {
    if (!this.currentDataURL) return;
    const link = document.createElement('a');
    link.download = `hebra_${this.currentTreeId}_polaroid.png`;
    link.href = this.currentDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    NotificationUI.showToast('Postal guardada en tu galería', '💾');
  }
}
