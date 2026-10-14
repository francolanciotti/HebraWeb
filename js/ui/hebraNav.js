/**
 * hebraNav.js - Controlador de Navegación Gestual Orgánica SVG Vectorial Puro
 *
 * Calibración:
 * 1. Grosor: calibrado en punto medio sutil (base ~13px, nodos ~34-38px).
 * 2. Hitbox dedicada (.hebra-strand-hitbox):
 *    - Capa invisible engrosada que cubre el contorno exterior y los huecos/lagunas internas.
 *    - Evita falsos contactos al tocar los orificios del nodo o bordes finos.
 *    - Al no tener relleno en huecos de la capa visible, mantiene el aspecto calado estético original.
 * 3. Nodos limpios sin puntos oscuros.
 * 4. Soporte móvil fluido con Pointer/Touch events independientes.
 */

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

    // 3 Nodos distribuidos horizontalmente
    this.nodes = [
      { id: 'ar', label: 'Cámara AR', xRatio: 0.22 },
      { id: 'companion', label: 'Mi Kencalo', xRatio: 0.50 },
      { id: 'transmedia', label: 'Hebra', xRatio: 0.78 }
    ];

    this.snapThreshold = 36; // Píxeles de arrastre hacia ARRIBA para confirmar
    this.hoveredIndex = this.getNodeIndex(this.currentView);

    // Estado físico del filamento elástico
    this.pullAmount = 0;   // Cuánto se estira verticalmente hacia arriba
    this.pullPos = 0;      // Posición X horizontal del punto de tracción
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartTime = 0;
    this.activePointerId = null;
    this.isReadyToSnap = false;
    this.springAnimId = null;

    // Handlers persistentes para listeners
    this.boundPointerMove = (e) => this.handlePointerMove(e);
    this.boundPointerUp = (e) => this.handlePointerUp(e);
    this.boundTouchMove = (e) => this.handleTouchMove(e);
    this.boundTouchEnd = (e) => this.handleTouchEnd(e);
    this.boundResize = () => this.handleResize();

    this.initDOM();
    this.initSVG();
    this.bindEvents();

    // Fallback de seguridad si la bienvenida no existe o se cierra inmediatamente
    const welcomeModal = document.getElementById('welcome-splash-modal');
    if (!welcomeModal || welcomeModal.style.display === 'none' || getComputedStyle(welcomeModal).display === 'none') {
      setTimeout(() => {
        this.triggerBreatheWave();
      }, 500);
    }
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

  initSVG() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'hebra-nav-svg');
    this.svg.setAttribute('preserveAspectRatio', 'none');

    // 1. Trazado visible del filamento orgánico (Blanco Platino con lagunas)
    this.strandPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.strandPath.setAttribute('class', 'hebra-strand-path');
    this.strandPath.setAttribute('fill', '#F5F6FA');
    this.strandPath.setAttribute('fill-rule', 'evenodd');

    // 2. Punto indicador blanco en el centro del hueco del nodo activo
    this.activeDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.activeDot.setAttribute('class', 'hebra-active-dot');
    this.activeDot.setAttribute('fill', '#FFFFFF');
    this.activeDot.setAttribute('r', '3.8');

    // 3. Trazado de Hitbox dedicada (Transparente pero continua, cubre orificios y márgenes de contacto)
    this.hitboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.hitboxPath.setAttribute('class', 'hebra-strand-hitbox');
    this.hitboxPath.setAttribute('fill', 'transparent');
    this.hitboxPath.setAttribute('stroke', 'transparent');
    this.hitboxPath.setAttribute('stroke-width', '16'); // Margen de holgura para dedos grandes

    this.svg.appendChild(this.strandPath);
    this.svg.appendChild(this.activeDot);
    this.svg.appendChild(this.hitboxPath);
    this.container.appendChild(this.svg);

    this.updateDimensions();
    this.renderStrandSVG();
  }

  updateDimensions() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(Math.floor(rect.width), 320);
    this.height = Math.max(Math.floor(rect.height), 120);

    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
  }

  /**
   * Ondulación orgánica de respiración (ola senoidal que recorre el filamento de lado a lado)
   */
  triggerBreatheWave() {
    if (this.springAnimId) {
      cancelAnimationFrame(this.springAnimId);
      this.springAnimId = null;
    }

    const startTime = performance.now();
    const duration = 1200;

    const step = (now) => {
      if (this.isDragging) {
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const w = this.width || window.innerWidth;

      // La onda viaja de izquierda a derecha elevando el hilo 22px
      this.pullPos = w * (0.10 + progress * 0.80);
      this.pullAmount = Math.sin(progress * Math.PI) * 22;

      this.renderStrandSVG();

      if (progress < 1) {
        this.springAnimId = requestAnimationFrame(step);
      } else {
        this.pullAmount = 0;
        this.renderStrandSVG();
        this.springAnimId = null;
      }
    };

    this.springAnimId = requestAnimationFrame(step);
  }

  /**
   * Genera el path SVG del hilo orgánico y su hitbox sólida asociada
   */
  renderStrandSVG() {
    if (!this.strandPath || !this.width) return;

    const w = this.width;
    const h = this.height;

    // Altura base ergonómica en el contenedor
    const baseY = h - 38;
    const leftX = -12;
    const rightX = w + 12;

    const pullAmount = this.pullAmount;
    const pullRatio = (w > 0) ? Math.max(0, Math.min(1, this.pullPos / w)) : 0.5;
    const pullPos = pullRatio * w;

    // Desplazamiento vertical elástico
    const getDispY = (x) => {
      if (pullAmount === 0) return 0;
      const dist = Math.abs(x - pullPos);
      const span = w * 0.46;
      const factor = Math.max(0, 1 - (dist / span));
      return (Math.sin(factor * Math.PI * 0.5) ** 1.7) * pullAmount;
    };

    const node1X = w * this.nodes[0].xRatio;
    const node2X = w * this.nodes[1].xRatio;
    const node3X = w * this.nodes[2].xRatio;

    // =========================================================================
    // CALIBRACIÓN DE GROSOR VISUAL (Punto medio sutil y elegante)
    // - base: halfH = 6.4px (diámetro ~13px)
    // - nodos: halfH = 17px a 19px (diámetro ~34px a 38px)
    // =========================================================================
    const getThicknessAt = (x) => {
      let halfH = 6.4;

      const d1 = Math.abs(x - node1X);
      if (d1 < 38) halfH = Math.max(halfH, 17 * (1 - (d1 / 38) ** 2));

      const d2 = Math.abs(x - node2X);
      if (d2 < 44) halfH = Math.max(halfH, 19.5 * (1 - (d2 / 44) ** 2));

      const d3 = Math.abs(x - node3X);
      if (d3 < 38) halfH = Math.max(halfH, 17 * (1 - (d3 / 38) ** 2));

      if (pullAmount > 10) {
        halfH *= Math.max(0.72, 1 - (pullAmount / 190));
      }

      return halfH;
    };

    // ========================================================
    // 1. Trazado del Contorno Exterior del Hilo (Sólido Base)
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

    let outerPathD = `M ${topPoints[0].x.toFixed(1)} ${topPoints[0].y.toFixed(1)} `;

    for (let i = 1; i < topPoints.length; i++) {
      const prev = topPoints[i - 1];
      const curr = topPoints[i];
      const midX = ((prev.x + curr.x) / 2).toFixed(1);
      const midY = ((prev.y + curr.y) / 2).toFixed(1);
      outerPathD += `Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX} ${midY} `;
    }

    const lastTop = topPoints[topPoints.length - 1];
    outerPathD += `L ${lastTop.x.toFixed(1)} ${lastTop.y.toFixed(1)} `;

    const lastBottom = bottomPoints[bottomPoints.length - 1];
    outerPathD += `L ${lastBottom.x.toFixed(1)} ${lastBottom.y.toFixed(1)} `;

    for (let i = bottomPoints.length - 2; i >= 0; i--) {
      const prev = bottomPoints[i + 1];
      const curr = bottomPoints[i];
      const midX = ((prev.x + curr.x) / 2).toFixed(1);
      const midY = ((prev.y + curr.y) / 2).toFixed(1);
      outerPathD += `Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX} ${midY} `;
    }
    outerPathD += 'Z ';

    // La hitbox transparente utiliza el contorno exterior continuo SIN orificios,
    // garantizando que un toque en el centro o hueco del nodo se capture siempre.
    this.hitboxPath.setAttribute('d', outerPathD);

    // ========================================================
    // 2. Cavidades y Lagunas Anatómicas Visibles (Fill-rule evenodd)
    // ========================================================
    let visualPathD = outerPathD;

    const addLacunaPath = (centerX, rx, ry) => {
      const cy = baseY - getDispY(centerX);
      visualPathD += `M ${(centerX - rx).toFixed(1)} ${cy.toFixed(1)} `;
      visualPathD += `A ${rx} ${ry} 0 1 0 ${(centerX + rx).toFixed(1)} ${cy.toFixed(1)} `;
      visualPathD += `A ${rx} ${ry} 0 1 0 ${(centerX - rx).toFixed(1)} ${cy.toFixed(1)} Z `;
    };

    // Nodo 1 (Cámara AR)
    addLacunaPath(node1X, 7.5, 5.0);
    addLacunaPath(node1X + 13, 3.2, 2.2);

    // Nodo 2 (Mi Kencalo)
    addLacunaPath(node2X, 9.5, 6.8);
    addLacunaPath(node2X - 16, 3.8, 2.8);
    addLacunaPath(node2X + 17, 4.0, 2.9);

    // Nodo 3 (Hebra)
    addLacunaPath(node3X, 7.5, 5.0);
    addLacunaPath(node3X - 13, 3.2, 2.2);

    this.strandPath.setAttribute('d', visualPathD);

    // ========================================================
    // 3. Punto Indicador Blanco en el Hueco del Nodo Activo
    // ========================================================
    if (this.activeDot) {
      // El nodo objetivo es el seleccionado o el que se está previsualizando al arrastrar
      const activeIdx = this.isDragging ? this.hoveredIndex : this.getNodeIndex(this.currentView);
      const activeNode = this.nodes[activeIdx] || this.nodes[0];
      const activeX = w * activeNode.xRatio;
      const activeY = baseY - getDispY(activeX);

      this.activeDot.setAttribute('cx', activeX.toFixed(1));
      this.activeDot.setAttribute('cy', activeY.toFixed(1));

      // Crece ligeramente si se está sobre el nodo al traccionar
      const dotRadius = this.isDragging && (this.hoveredIndex === activeIdx) ? 4.4 : 3.6;
      this.activeDot.setAttribute('r', dotRadius.toFixed(1));
    }
  }

  bindEvents() {
    this.boundPointerDown = (e) => this.handlePointerDown(e);
    this.boundTouchStart = (e) => this.handleTouchStart(e);

    // El evento se asocia a la hitbox transparente continua
    this.hitboxPath.addEventListener('pointerdown', this.boundPointerDown, { passive: false });
    this.hitboxPath.addEventListener('touchstart', this.boundTouchStart, { passive: false });

    window.addEventListener('pointermove', this.boundPointerMove, { passive: false });
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);

    window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd);
    window.addEventListener('touchcancel', this.boundTouchEnd);

    window.addEventListener('resize', this.boundResize);
  }

  unbindEvents() {
    if (this.hitboxPath) {
      if (this.boundPointerDown) this.hitboxPath.removeEventListener('pointerdown', this.boundPointerDown);
      if (this.boundTouchStart) this.hitboxPath.removeEventListener('touchstart', this.boundTouchStart);
    }
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);

    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
    window.removeEventListener('touchcancel', this.boundTouchEnd);

    window.removeEventListener('resize', this.boundResize);
  }

  handleResize() {
    this.updateDimensions();
    this.renderStrandSVG();
  }

  startDrag(clientX, clientY, pointerId = null) {
    if (this.isDragging) return;

    if (this.springAnimId) {
      cancelAnimationFrame(this.springAnimId);
      this.springAnimId = null;
    }

    this.isDragging = true;
    this.activePointerId = pointerId;

    if (pointerId !== null && this.hitboxPath.setPointerCapture) {
      try {
        this.hitboxPath.setPointerCapture(pointerId);
      } catch (_) { }
    }

    const rect = this.container.getBoundingClientRect();
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragStartTime = performance.now();
    this.pullAmount = 0;
    this.pullPos = clientX - rect.left;
    this.isReadyToSnap = false;

    this.updateClosestNode(clientX);
    this.renderStrandSVG();
  }

  updateDrag(clientX, clientY) {
    if (!this.isDragging) return;

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 1;

    this.pullPos = Math.max(0, Math.min(width, clientX - rect.left));
    this.updateClosestNode(clientX);

    const deltaY = this.dragStartY - clientY; // Tirando hacia arriba
    this.pullAmount = Math.max(0, Math.min(90, deltaY));

    const wasReady = this.isReadyToSnap;
    this.isReadyToSnap = this.pullAmount >= this.snapThreshold;

    if (this.isReadyToSnap && !wasReady) {
      if (navigator.vibrate) navigator.vibrate(14);
      soundManager.playOutfitNav();
    }

    this.renderStrandSVG();
  }

  endDrag(clientX, clientY) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.activePointerId !== null && this.hitboxPath.releasePointerCapture) {
      try {
        this.hitboxPath.releasePointerCapture(this.activePointerId);
      } catch (_) { }
    }
    this.activePointerId = null;

    const duration = performance.now() - this.dragStartTime;
    const deltaY = this.dragStartY - clientY;

    if (this.isReadyToSnap) {
      // CONFIRMACIÓN: Superó el umbral de tensión
      const targetNode = this.nodes[this.hoveredIndex];
      if (targetNode) {
        if (navigator.vibrate) navigator.vibrate([14, 26]);
        this.setActiveView(targetNode.id);

        if (this.onSelectView) {
          this.onSelectView(targetNode.id);
        }
      }

      // Rebote de snap orgánico fluido hacia el reposo
      this.animateSnapWhipBack();

    } else if (duration < 300 && Math.abs(deltaY) < 14) {
      // REBOTE CONTUNDENTE "CHICLE" ANTE SIMPLE TAP
      if (navigator.vibrate) navigator.vibrate(12);
      soundManager.playOutfitNav();
      this.animateTapChicleBounce(this.pullPos);

    } else {
      // CANCELACIÓN DE ARRASTRE: Rebote con física de muelle orgánico
      this.animateSpringBack();
    }
  }

  // --- Handlers Pointer ---
  handlePointerDown(e) {
    if (e.pointerType === 'touch') {
      return;
    }
    e.preventDefault();
    this.startDrag(e.clientX, e.clientY, e.pointerId);
  }

  handlePointerMove(e) {
    if (this.isDragging && this.activePointerId === e.pointerId) {
      e.preventDefault();
      this.updateDrag(e.clientX, e.clientY);
    }
  }

  handlePointerUp(e) {
    if (this.isDragging && this.activePointerId === e.pointerId) {
      this.endDrag(e.clientX, e.clientY);
    }
  }

  // --- Handlers Touch Nativos (Robustez Móvil) ---
  handleTouchStart(e) {
    if (e.touches.length > 0) {
      e.preventDefault();
      const t = e.touches[0];
      this.startDrag(t.clientX, t.clientY, null);
    }
  }

  handleTouchMove(e) {
    if (this.isDragging && e.touches.length > 0) {
      e.preventDefault(); // Previene el scroll del navegador
      const t = e.touches[0];
      this.updateDrag(t.clientX, t.clientY);
    }
  }

  handleTouchEnd(e) {
    if (this.isDragging) {
      const t = e.changedTouches ? e.changedTouches[0] : null;
      const clientX = t ? t.clientX : this.dragStartX;
      const clientY = t ? t.clientY : this.dragStartY;
      this.endDrag(clientX, clientY);
    }
  }

  /**
   * Rebote elástico "chicle" contundente localizado en el punto del tap
   */
  animateTapChicleBounce(tapX) {
    if (this.springAnimId) {
      cancelAnimationFrame(this.springAnimId);
      this.springAnimId = null;
    }

    this.pullPos = tapX;
    const initialPeak = 30; // Pico elástico de chicle visible
    const startTime = performance.now();
    const duration = 480;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Oscilación amortiguada viva: rebota arriba y abajo con inercia elástica
      const damping = Math.exp(-progress * 4.2);
      const oscillation = Math.sin(progress * Math.PI * 4.0);
      this.pullAmount = initialPeak * damping * oscillation;

      this.renderStrandSVG();

      if (progress < 1) {
        this.springAnimId = requestAnimationFrame(step);
      } else {
        this.pullAmount = 0;
        this.renderStrandSVG();
        this.springAnimId = null;
      }
    };

    this.springAnimId = requestAnimationFrame(step);
  }

  /**
   * Oscilación armónica amortiguada orgánica al cancelar el arrastre
   */
  animateSpringBack() {
    const initialPull = this.pullAmount;
    const startTime = performance.now();
    const duration = 500;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const damping = Math.exp(-progress * 4.5);
      const oscillation = Math.cos(progress * Math.PI * 3.5);
      this.pullAmount = initialPull * damping * oscillation;

      this.renderStrandSVG();

      if (progress < 1) {
        this.springAnimId = requestAnimationFrame(step);
      } else {
        this.pullAmount = 0;
        this.renderStrandSVG();
        this.springAnimId = null;
      }
    };

    this.springAnimId = requestAnimationFrame(step);
  }

  /**
   * Rebote elástico tras confirmar el Snap (efecto latigazo orgánico con inercia)
   */
  animateSnapWhipBack() {
    const initialPull = this.pullAmount;
    const startTime = performance.now();
    const duration = 360;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Se contrae a gran velocidad, sobrepasa la línea base y oscila hasta descansar
      const damping = Math.exp(-progress * 5.0);
      const oscillation = Math.cos(progress * Math.PI * 3.0);
      this.pullAmount = initialPull * damping * oscillation;

      this.renderStrandSVG();

      if (progress < 1) {
        this.springAnimId = requestAnimationFrame(step);
      } else {
        this.pullAmount = 0;
        this.renderStrandSVG();
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
    this.renderStrandSVG();
  }

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
