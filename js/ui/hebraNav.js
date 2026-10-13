/**
 * hebraNav.js - Controlador de Navegación Gestual Orgánica con Motor InkBleed WebGL
 *
 * Posición: barra inferior horizontal (igual que la barra original, pero orgánica).
 * - 3 nodos distribuidos horizontalmente (izquierda = AR, centro = Kencalo, derecha = Hebra).
 * - Eje X (exploración): Desplazar el dedo horizontalmente sobre el hilo selecciona el nodo.
 * - Eje Y (confirmación): Tirar hacia ARRIBA elonga elásticamente el filamento;
 *   al superar el umbral y soltar, viaja a la vista seleccionada.
 * - Motor InkBleed WebGL activo bajo el dedo en tiempo real.
 */

import { InkBleedCanvas } from '../fx/inkBleed.js';
import { soundManager } from '../audio/audioManager.js';

export class HebraNavUI {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Contenedor raíz (#hebra-nav-root)
   * @param {string} options.currentView - Vista inicial ('ar' | 'companion' | 'transmedia')
   * @param {Function} options.onSelectView - Callback al confirmar cambio de vista
   */
  constructor(options = {}) {
    this.container = options.container || document.getElementById('hebra-nav-root');
    this.currentView = options.currentView || 'ar';
    this.onSelectView = options.onSelectView || (() => { });

    // 3 Nodos distribuidos horizontalmente (xRatio = posición en el eje X)
    this.nodes = [
      { id: 'ar', label: 'Cámara AR', xRatio: 0.22 },
      { id: 'companion', label: 'Mi Kencalo', xRatio: 0.50 },
      { id: 'transmedia', label: 'Hebra', xRatio: 0.78 }
    ];

    this.snapThreshold = 36; // Píxeles de arrastre hacia ARRIBA para confirmar

    this.hoveredIndex = this.getNodeIndex(this.currentView);

    // Estado físico del hilo elástico horizontal
    this.pullAmount = 0; // Cuánto se estira hacia arriba
    this.pullPos = 0;    // Posición X horizontal del dedo (en píxeles CSS del contenedor)

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.isReadyToSnap = false;
    this.springAnimId = null;

    // Handlers persistentes para remover listeners al destruir
    this.boundPointerMove = (e) => this.handlePointerMove(e);
    this.boundPointerUp = (e) => this.handlePointerUp(e);
    this.boundResize = () => this.handleResize();

    this.initDOM();
    this.initInkBleed();
    this.bindEvents();
  }

  getNodeIndex(viewId) {
    const idx = this.nodes.findIndex(n => n.id === viewId);
    return idx !== -1 ? idx : 0;
  }

  initDOM() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'hebra-nav-root';
      this.container.className = 'hebra-nav-container';
      document.body.appendChild(this.container);
    }
    this.container.innerHTML = '';
  }

  initInkBleed() {
    this.inkCanvas = new InkBleedCanvas(this.container, {
      inkColor: [0.96, 0.97, 1.0],
      maxVolatility: 0.78,
      maxVolatilityMobile: 0.78,
      baseVolatility: 0.0,
      customDraw: (ctx, w, h) => this.drawOrganicStrand(ctx, w, h)
    });
  }

  /**
   * Dibuja el hilo orgánico HORIZONTAL con 3 nodos anatómicos.
   * Los extremos izquierdo y derecho permanecen fijos; el cuerpo se elonga hacia arriba.
   */
  drawOrganicStrand(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Línea de base del hilo (cerca del borde inferior del contenedor)
    const baseY = h - 36;
    const leftX = -12;    // Anclaje izquierdo fijo (fuera del canvas)
    const rightX = w + 12; // Anclaje derecho fijo (fuera del canvas)

    const pullAmount = this.pullAmount;

    // Normalizar la posición X del arrastre respecto al ancho real del canvas WebGL (w)
    const rect = this.container ? this.container.getBoundingClientRect() : null;
    const pullRatio = (rect && rect.width > 0) ? Math.max(0, Math.min(1, this.pullPos / rect.width)) : 0.5;
    const pullPos = pullRatio * w;

    // Desplazamiento vertical en cualquier posición X (puntas extremas = 0)
    const getDispY = (x) => {
      if (pullAmount <= 0) return 0;
      const dist = Math.abs(x - pullPos);
      const span = w * 0.48;
      const factor = Math.max(0, 1 - (dist / span));
      return (Math.sin(factor * Math.PI * 0.5) ** 1.8) * pullAmount;
    };

    // Posiciones X de los 3 nodos en la resolución real del Canvas (w)
    const node1X = w * this.nodes[0].xRatio;
    const node2X = w * this.nodes[1].xRatio;
    const node3X = w * this.nodes[2].xRatio;

    // Grosor vertical del filamento según la posición X (con abultamientos en nodos)
    const getThicknessAt = (x) => {
      let halfH = 5.0;

      const d1 = Math.abs(x - node1X);
      if (d1 < 36) halfH = Math.max(halfH, 16 * (1 - (d1 / 36) ** 2));

      const d2 = Math.abs(x - node2X);
      if (d2 < 44) halfH = Math.max(halfH, 20 * (1 - (d2 / 44) ** 2));

      const d3 = Math.abs(x - node3X);
      if (d3 < 36) halfH = Math.max(halfH, 16 * (1 - (d3 / 36) ** 2));

      // El hilo se afina ligeramente por tensión al estirarse hacia arriba
      if (pullAmount > 10) {
        halfH *= Math.max(0.72, 1 - (pullAmount / 170));
      }

      return halfH;
    };

    // ========================================================
    // 1. Trazado de la Masa del Hilo Horizontal
    // ========================================================
    const steps = 48;
    const topPoints = [];
    const bottomPoints = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = leftX + t * (rightX - leftX);
      const spineY = baseY - getDispY(x);
      const hh = getThicknessAt(x);

      topPoints.push({ x, y: spineY - hh });
      bottomPoints.push({ x, y: spineY + hh });
    }

    ctx.fillStyle = '#F5F6FA';

    ctx.beginPath();

    // Borde superior izquierda → derecha
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length; i++) {
      const prev = topPoints[i - 1];
      const curr = topPoints[i];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(topPoints[topPoints.length - 1].x, topPoints[topPoints.length - 1].y);

    // Borde derecho → izquierda (borde inferior)
    const lastBottom = bottomPoints[bottomPoints.length - 1];
    ctx.lineTo(lastBottom.x, lastBottom.y);

    for (let i = bottomPoints.length - 2; i >= 0; i--) {
      const prev = bottomPoints[i + 1];
      const curr = bottomPoints[i];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
    }
    ctx.closePath();

    // ========================================================
    // 2. Cavidades y Lagunas Orgánicas en los 3 Nodos
    // ========================================================
    const drawLacuna = (centerX, rx, ry) => {
      const cy = baseY - getDispY(centerX);
      ctx.moveTo(centerX + rx, cy);
      ctx.ellipse(centerX, cy, rx, ry, 0, 0, Math.PI * 2, true);
    };

    // Nodo 1 (Cámara AR)
    drawLacuna(node1X, 9, 6.5);
    drawLacuna(node1X + 16, 3.5, 2.5);

    // Nodo 2 (Mi Kencalo)
    drawLacuna(node2X, 12, 8.5);
    drawLacuna(node2X - 18, 4, 3);
    drawLacuna(node2X + 20, 4.5, 3);

    // Nodo 3 (Hebra)
    drawLacuna(node3X, 9, 6.5);
    drawLacuna(node3X - 16, 3.5, 2.5);

    ctx.fill('evenodd');

    // ========================================================
    // 3. Marcadores de Nodo Activo / Hover (puntos internos de tinta)
    // ========================================================
    this.nodes.forEach((node, idx) => {
      const nx = w * node.xRatio;
      const ny = baseY - getDispY(nx);

      if (node.id === this.currentView || idx === this.hoveredIndex) {
        ctx.fillStyle = idx === this.hoveredIndex ? '#112142' : 'rgba(17, 33, 66, 0.60)';
        ctx.beginPath();
        ctx.arc(nx, ny, idx === this.hoveredIndex ? 4.2 : 3.0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  bindEvents() {
    this.boundPointerDown = (e) => this.handlePointerDown(e);
    this.container.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
    window.addEventListener('resize', this.boundResize);
  }

  unbindEvents() {
    if (this.container && this.boundPointerDown) {
      this.container.removeEventListener('pointerdown', this.boundPointerDown);
    }
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
    window.removeEventListener('resize', this.boundResize);
  }

  handleResize() {
    if (this.inkCanvas) {
      this.inkCanvas.resize();
      this.refreshStrand();
    }
  }

  handlePointerDown(e) {
    if (this.springAnimId) {
      cancelAnimationFrame(this.springAnimId);
      this.springAnimId = null;
    }

    this.isDragging = true;
    try {
      this.container.setPointerCapture(e.pointerId);
    } catch (_) { }

    const rect = this.container.getBoundingClientRect();
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.pullAmount = 0;
    this.pullPos = e.clientX - rect.left;
    this.isReadyToSnap = false;

    const width = rect.width || 1;
    const height = rect.height || 1;
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / height));

    if (this.inkCanvas) {
      this.inkCanvas.setInteractionState(true, 0.30, normX, normY);
    }

    this.updateClosestNode(e.clientX);
    this.refreshStrand();

    if (navigator.vibrate) navigator.vibrate(8);
  }

  handlePointerMove(e) {
    if (!this.isDragging) return;

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;

    // 1. Posición horizontal: qué nodo está siendo apuntado
    this.pullPos = Math.max(0, Math.min(width, e.clientX - rect.left));
    this.updateClosestNode(e.clientX);

    // 2. Arrastre hacia ARRIBA: cuánto se estira el hilo
    const deltaY = this.dragStartY - e.clientY; // Positivo = tirando hacia arriba
    this.pullAmount = Math.max(0, Math.min(85, deltaY));

    const wasReady = this.isReadyToSnap;
    this.isReadyToSnap = this.pullAmount >= this.snapThreshold;

    if (this.isReadyToSnap && !wasReady) {
      if (navigator.vibrate) navigator.vibrate(16);
      soundManager.playOutfitNav();
    }

    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / height));
    const targetVol = this.isReadyToSnap ? 0.42 : 0.30;

    if (this.inkCanvas) {
      this.inkCanvas.setInteractionState(true, targetVol, normX, normY);
    }

    this.refreshStrand();
  }

  handlePointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    try {
      this.container.releasePointerCapture(e.pointerId);
    } catch (_) { }

    if (this.isReadyToSnap) {
      // ¡CONFIRMACIÓN / VIAJAR AL PLANO SELECCIONADO!
      const targetNode = this.nodes[this.hoveredIndex];
      if (targetNode) {
        if (navigator.vibrate) navigator.vibrate([15, 25]);
        this.setActiveView(targetNode.id);

        if (this.onSelectView) {
          this.onSelectView(targetNode.id);
        }
      }

      if (this.inkCanvas) {
        this.inkCanvas.setInteractionState(true, 0.40);
        setTimeout(() => {
          if (this.inkCanvas) this.inkCanvas.setInteractionState(false, 0.0);
        }, 220);
      }

      this.animateSnapBack();
    } else {
      // CANCELACIÓN: Rebote elástico amortiguado hacia el reposo
      if (this.inkCanvas) {
        this.inkCanvas.setInteractionState(false, 0.0);
      }
      this.animateSpringBack();
    }
  }

  refreshStrand() {
    if (!this.inkCanvas) return;
    this.inkCanvas.renderOffscreenText();
    this.inkCanvas.updateTexture();
  }

  /**
   * Oscilación armónica amortiguada al cancelar el gesto
   */
  animateSpringBack() {
    const initialPull = this.pullAmount;
    const startTime = performance.now();
    const duration = 400;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const damping = Math.exp(-progress * 5.0);
      const oscillation = Math.cos(progress * Math.PI * 4.5);
      this.pullAmount = initialPull * damping * oscillation;

      this.refreshStrand();

      if (progress < 1) {
        this.springAnimId = requestAnimationFrame(step);
      } else {
        this.pullAmount = 0;
        this.refreshStrand();
        this.springAnimId = null;
      }
    };

    this.springAnimId = requestAnimationFrame(step);
  }

  /**
   * Contracción rápida al confirmar el snap
   */
  animateSnapBack() {
    const initialPull = this.pullAmount;
    const startTime = performance.now();
    const duration = 140;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      this.pullAmount = initialPull * (1 - progress) * (1 - progress);

      this.refreshStrand();

      if (progress < 1) {
        this.springAnimId = requestAnimationFrame(step);
      } else {
        this.pullAmount = 0;
        this.refreshStrand();
        this.springAnimId = null;
      }
    };

    this.springAnimId = requestAnimationFrame(step);
  }

  /**
   * Detecta el nodo más cercano por posición HORIZONTAL del dedo
   */
  updateClosestNode(clientX) {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 1;
    const currentRatio = (clientX - rect.left) / width;

    let closestIdx = 0;
    let minDiff = Infinity;

    this.nodes.forEach((node, idx) => {
      const diff = Math.abs(currentRatio - node.xRatio);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== this.hoveredIndex) {
      this.hoveredIndex = closestIdx;
      if (navigator.vibrate) navigator.vibrate(6);
    }
  }

  setActiveView(viewId) {
    this.currentView = viewId;
    this.hoveredIndex = this.getNodeIndex(viewId);
    this.refreshStrand();
  }

  /**
   * Limpieza de recursos y eventos para evitar fugas de memoria
   */
  destroy() {
    if (this.springAnimId) {
      cancelAnimationFrame(this.springAnimId);
      this.springAnimId = null;
    }
    this.unbindEvents();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

