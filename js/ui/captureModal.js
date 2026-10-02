/**
 * CaptureStoryUI - Generador de postales estilo Polaroid en formato vertical (9:16)
 * optimizado para previsualización clara en pantalla y para subir a Instagram Stories.
 * REGLA ESTRICTA: Sin ninguna mención de texturas en el arte ni en el texto.
 */

import { NotificationUI } from './notificationUI.js';
import { soundManager } from '../audio/audioManager.js';

const TREE_DATA = {
  tree_a: {
    title: 'Árbol de El Bosque',
    zone: 'Paseo del Bosque • La Plata',
    coords: "34°54'32\"S 57°55'48\"W"
  },
  tree_b: {
    title: 'Árbol de Plaza San Martín',
    zone: 'Eje Cívico • Calle 7 y 50',
    coords: "34°54'52\"S 57°57'14\"W"
  },
  tree_c: {
    title: 'Árbol de Plaza Rocha',
    zone: 'Diagonal 73 y Plaza Rocha',
    coords: "34°55'28\"S 57°56'42\"W"
  }
};

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
    const width = 1080;
    const height = 1920;
    this.canvas.width = width;
    this.canvas.height = height;

    const state = this.stateManager.getState();
    const treeInfo = TREE_DATA[treeId] || TREE_DATA.tree_a;

    // 1. Fondo Atmosférico Cósmico (Fiel al universo de Kenosis/Hebra)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#060810');
    bgGrad.addColorStop(0.3, '#0b1324');
    bgGrad.addColorStop(0.7, '#0e1a34');
    bgGrad.addColorStop(1, '#070a12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Halo etéreo de tinta y partículas de luz
    const bgHalo = ctx.createRadialGradient(540, 960, 100, 540, 960, 650);
    bgHalo.addColorStop(0, 'rgba(107, 201, 217, 0.16)');
    bgHalo.addColorStop(0.5, 'rgba(66, 46, 143, 0.12)');
    bgHalo.addColorStop(1, 'rgba(7, 10, 18, 0)');
    ctx.fillStyle = bgHalo;
    ctx.beginPath();
    ctx.arc(540, 960, 650, 0, Math.PI * 2);
    ctx.fill();

    // Líneas geométricas sutiles de constelación de La Plata
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(540, 960, 480, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(540, 960, 620, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Tarjeta Marco Polaroid (Estética de Reliquia Fotográfica de Hebra)
    const polW = 860;
    const polH = 1280;
    const polX = (width - polW) / 2; // 110
    const polY = 320;
    const polR = 28;

    // Sombra proyectada del Polaroid
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = '#0c1426';
    this.roundRect(ctx, polX, polY, polW, polH, polR);
    ctx.fill();
    ctx.restore();

    // Cuerpo de la tarjeta Polaroid (Gradiente de vidrio oscuro esmerilado)
    ctx.save();
    const polGrad = ctx.createLinearGradient(polX, polY, polX + polW, polY + polH);
    polGrad.addColorStop(0, 'rgba(18, 28, 50, 0.96)');
    polGrad.addColorStop(1, 'rgba(10, 16, 30, 0.98)');
    ctx.fillStyle = polGrad;
    this.roundRect(ctx, polX, polY, polW, polH, polR);
    ctx.fill();

    // Borde brillante fino cian
    ctx.strokeStyle = 'rgba(107, 201, 217, 0.45)';
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, polX, polY, polW, polH, polR);
    ctx.stroke();
    ctx.restore();

    // 3. Ventana de la Foto Polaroid (Formato Cuadrado Icónico)
    const photoPad = 50;
    const photoX = polX + photoPad; // 160
    const photoY = polY + photoPad; // 370
    const photoW = polW - (photoPad * 2); // 760
    const photoH = 760; // 1:1 Cuadrado
    const photoR = 18;

    // Fondo del área de la foto
    ctx.save();
    const photoBg = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
    photoBg.addColorStop(0, '#060d1b');
    photoBg.addColorStop(0.5, '#0c1833');
    photoBg.addColorStop(1, '#112347');
    ctx.fillStyle = photoBg;
    this.roundRect(ctx, photoX, photoY, photoW, photoH, photoR);
    ctx.fill();

    // Anillo de brillo interno para la foto
    const photoGlow = ctx.createRadialGradient(
      photoX + photoW / 2, photoY + photoH / 2, 40,
      photoX + photoW / 2, photoY + photoH / 2, photoW / 1.5
    );
    photoGlow.addColorStop(0, 'rgba(107, 201, 217, 0.22)');
    photoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = photoGlow;
    this.roundRect(ctx, photoX, photoY, photoW, photoH, photoR);
    ctx.fill();
    ctx.restore();

    // 4. Renderizar instantánea 3D de Kencalo dentro de la foto Polaroid
    if (this.sceneManager) {
      const snapData = this.sceneManager.getSnapshotDataURL();
      if (snapData) {
        await this.drawKencaloSnapshot(ctx, snapData, photoX, photoY, photoW, photoH, photoR);
      }
    }

    // Borde fino de la foto
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, photoX, photoY, photoW, photoH, photoR);
    ctx.stroke();
    ctx.restore();

    // 5. Pie del Polaroid (Zona de Firma y Registro)
    // Tag superior del pie
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6bc9d9';
    ctx.font = '700 20px Epilogue, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('PORTAL TRANSMEDIA // LA PLATA', 540, 1205);

    // Título Principal "HEBRA" + Nombre del Árbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Caoutchouc, Epilogue, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.shadowColor = 'rgba(107, 201, 217, 0.4)';
    ctx.shadowBlur = 18;
    ctx.fillText('HEBRA', 540, 1265);
    ctx.shadowBlur = 0;

    // Nombre específico del árbol
    ctx.fillStyle = '#6bc9d9';
    ctx.font = '700 32px Epilogue, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(treeInfo.title, 540, 1315);

    // Zona y Coordenadas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 24px Epilogue, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(treeInfo.zone, 540, 1360);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 20px monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText(treeInfo.coords, 540, 1395);

    // 6. Insignia de Explorador
    const isLinked = !!state.isAccountLinked && !!state.userIdentifier;
    const explorerTag = isLinked ? `EXPLORADOR: ${state.userIdentifier}` : 'EXPLORADOR DE HEBRA';

    ctx.save();
    const pillW = 540;
    const pillH = 58;
    const pillX = 540 - (pillW / 2);
    const pillY = 1445;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(107, 201, 217, 0.4)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, pillX, pillY, pillW, pillH, 29);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px Epilogue, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(explorerTag, 540, pillY + 38);
    ctx.restore();

    // 7. Pie de Marca Oficial
    ctx.fillStyle = '#6bc9d9';
    ctx.font = '800 24px Epilogue, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('@hebra.tdm3', 540, 1545);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '400 18px Epilogue, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Una experiencia transmedia de KENOSIS', 540, 1575);

    // 8. Convertir a DataURL y Blob para previsualización nítida y compartir
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
  drawKencaloSnapshot(ctx, dataURL, cardX, cardY, cardW, cardH, radius) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        this.roundRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.clip();

        // Centrado y escala conservando proporciones
        const scale = Math.max(cardW / img.width, cardH / img.height) * 0.98;
        const nw = img.width * scale;
        const nh = img.height * scale;
        const nx = cardX + (cardW - nw) / 2;
        const ny = cardY + (cardH - nh) / 2 + 10;

        ctx.drawImage(img, nx, ny, nw, nh);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
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
        await navigator.share({
          title: `Hebra — ${treeInfo.title}`,
          text: `Registro de encuentro con Kencalo en ${treeInfo.title}. @hebra.tdm3`,
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
