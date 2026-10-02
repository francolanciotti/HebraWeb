/**
 * CityMapUI - Mapa Vectorial Interactivo de la Ciudad de La Plata
 * Trazado urbano geométrico (cuadrícula, Diagonales 73/74 y parques) con marcadores reactivos.
 * 
 * Regla de Juego (Niebla de Exploración):
 * Solo se muestran los árboles cuyas coordenadas fueron descifradas en glifos O cuyo Kencalo ya fue capturado.
 */

import { soundManager } from '../audio/audioManager.js';
import { NotificationUI } from './notificationUI.js';

export const TREES_MAP_DATA = [
  {
    id: 'tree_a',
    code: 'A',
    name: 'El Bosque',
    zone: 'Paseo del Bosque',
    address: 'Av. Iraola y 120',
    coords: "34°54'34\"S 57°56'02\"W",
    x: 435,
    y: 145,
    description: 'Bajo el follaje centenario late una pulsación que mira a las estrellas.'
  },
  {
    id: 'tree_b',
    code: 'B',
    name: 'Plaza San Martín',
    zone: 'Eje Monumental',
    address: 'Av. 7 e/ 50 y 54',
    coords: "34°54'57\"S 57°56'48\"W",
    x: 125,
    y: 230,
    description: 'En el corazón de la simetría urbana, las raíces guardan la memoria del tilo.'
  },
  {
    id: 'tree_c',
    code: 'C',
    name: 'Plaza Rocha',
    zone: 'Diagonal 73',
    address: 'Av. 7 y 60',
    coords: "34°55'42\"S 57°56'30\"W",
    x: 262.5,
    y: 393.5,
    description: 'Vórtice donde convergen las líneas del sur; una frecuencia espera despertar.'
  }
];

export class CityMapUI {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.container = document.getElementById('city-map-container');
    this.popupContainer = document.getElementById('map-tree-details-popup');
    this.treesCounter = document.getElementById('map-trees-counter');
    this.fogNotice = document.getElementById('map-fog-notice');

    this.renderMap();
    this.update();

    this.stateManager.subscribe(() => {
      this.update();
    });
  }

  renderMap() {
    if (!this.container) return;

    // SVG cartográfico exacto basado en assets/map.svg (viewBox 0 0 553 607)
    this.container.innerHTML = `
      <div class="map-viewport-wrapper">
        <svg class="city-map-svg" viewBox="0 0 553 607" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Gradientes bioluminiscentes para marcadores reactivos -->
            <radialGradient id="grad-radar-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#6BC9D9" stop-opacity="0.85" />
              <stop offset="60%" stop-color="#422E8F" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#422E8F" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="grad-captured-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#55E6A5" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#422E8F" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#112142" stop-opacity="0" />
            </radialGradient>
            <!-- Filtro de resplandor Glass -->
            <filter id="glow-filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <!-- Gradiente de fondo del mapa oficial -->
            <radialGradient id="paint0_radial_2063_627" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(276.5 303.5) rotate(89.9056) scale(303.5 276.5)">
              <stop stop-color="#F5F6FA" stop-opacity="0"/>
              <stop offset="1" stop-color="#F5F6FA"/>
            </radialGradient>
            <clipPath id="clip0_2063_627">
              <rect width="553" height="607" rx="14" fill="white"/>
            </clipPath>
          </defs>

          <!-- Trazado Urbano Vectorial de La Plata (assets/map.svg) -->
          <g clip-path="url(#clip0_2063_627)">
            <rect width="553" height="607" fill="white"/>
            <line x1="299.252" y1="616.336" x2="538.252" y2="347.336" stroke="#112142" stroke-width="2"/>
            <rect width="553" height="607" fill="#F5F6FA"/>
            <!-- El Bosque (Paseo del Bosque) -->
            <rect x="361.664" y="-98.4691" width="253.056" height="216.564" transform="rotate(42.0801 361.664 -98.4691)" fill="#85C1A1" stroke="#112142" stroke-width="5"/>
            <!-- Parque / Plaza San Martín oeste -->
            <rect x="77.3235" y="221.757" width="30" height="73" transform="rotate(-48.0508 77.3235 221.757)" fill="#85C1A1" stroke="#112142" stroke-width="5"/>
            <!-- Diagonales y Avenidas principales -->
            <line x1="162.766" y1="503.998" x2="525.766" y2="98.9977" stroke="#112142" stroke-width="6"/>
            <line x1="75.0284" y1="220.79" x2="432.426" y2="548.769" stroke="#112142" stroke-width="6"/>
            <line x1="11.8451" y1="407.004" x2="534.001" y2="380.006" stroke="#112142" stroke-width="6"/>
            <line x1="150.814" y1="248.006" x2="406.817" y2="232.068" stroke="#112142" stroke-width="6"/>
            <line x1="406.044" y1="230.804" x2="551.044" y2="365.804" stroke="#112142" stroke-width="6"/>
            <line x1="-2.22738" y1="394.99" x2="117.773" y2="261.99" stroke="#112142" stroke-width="6"/>
            <line x1="250.001" y1="606.958" x2="271.001" y2="108.958" stroke="#112142" stroke-width="2"/>
            <!-- Trazado de calles secundarias -->
            <line x1="195.252" y1="525.336" x2="434.252" y2="256.336" stroke="#112142" stroke-width="2"/>
            <line x1="139.252" y1="476.336" x2="378.252" y2="207.336" stroke="#112142" stroke-width="2"/>
            <line x1="113.252" y1="455.336" x2="352.252" y2="186.336" stroke="#112142" stroke-width="2"/>
            <line x1="92.2524" y1="434.336" x2="331.252" y2="165.336" stroke="#112142" stroke-width="2"/>
            <line x1="75.2524" y1="416.336" x2="314.252" y2="147.336" stroke="#112142" stroke-width="2"/>
            <line x1="59.257" y1="393.331" x2="295.257" y2="131.331" stroke="#112142" stroke-width="2"/>
            <line x1="37.2509" y1="380.338" x2="274.251" y2="112.338" stroke="#112142" stroke-width="2"/>
            <line x1="221.252" y1="550.336" x2="460.252" y2="281.336" stroke="#112142" stroke-width="2"/>
            <line x1="247.252" y1="572.336" x2="486.252" y2="303.336" stroke="#112142" stroke-width="2"/>
            <line x1="273.252" y1="594.336" x2="512.252" y2="325.336" stroke="#112142" stroke-width="2"/>
            <line x1="69.6751" y1="313.262" x2="335.143" y2="556.18" stroke="#112142" stroke-width="2"/>
            <line x1="40.6751" y1="334.262" x2="306.143" y2="577.18" stroke="#112142" stroke-width="2"/>
            <line x1="11.6751" y1="355.262" x2="277.143" y2="598.18" stroke="#112142" stroke-width="2"/>
            <line x1="93.6751" y1="288.262" x2="359.143" y2="531.18" stroke="#112142" stroke-width="2"/>
            <line x1="155.675" y1="246.262" x2="421.143" y2="489.18" stroke="#112142" stroke-width="2"/>
            <line x1="180.675" y1="219.262" x2="448.143" y2="464.18" stroke="#112142" stroke-width="2"/>
            <line x1="202.675" y1="192.262" x2="468.143" y2="435.18" stroke="#112142" stroke-width="2"/>
            <line x1="225.675" y1="166.262" x2="488.142" y2="406.18" stroke="#112142" stroke-width="2"/>
            <line x1="248.674" y1="140.262" x2="508.142" y2="377.179" stroke="#112142" stroke-width="2"/>
            <!-- Plaza Central / Plaza Rocha -->
            <circle cx="262.5" cy="393.5" r="18" fill="#85C1A1" stroke="#112142" stroke-width="5"/>
            <line x1="139.266" y1="234.321" x2="262.266" y2="101.321" stroke="#112142" stroke-width="2"/>
            <line x1="110.266" y1="209.321" x2="234.266" y2="75.3208" stroke="#112142" stroke-width="2"/>
            <rect width="553" height="607" fill="url(#paint0_radial_2063_627)"/>
          </g>

          <!-- Capa de Marcadores de Árboles Reactivos -->
          <g id="map-tree-markers-layer"></g>
        </svg>

        <!-- Indicador de Niebla de Exploración si no hay árboles revelados -->
        <div id="map-fog-overlay" class="map-fog-overlay hidden">
          <div class="fog-message-card glass-card">
            <span class="fog-symbol">✦</span>
            <h4>Frecuencias Ocultas</h4>
            <p>Sintoniza los glifos para despertar las coordenadas de la ciudad.</p>
          </div>
        </div>
      </div>
    `;
  }

  update() {
    const markersLayer = document.getElementById('map-tree-markers-layer');
    if (!markersLayer) return;

    markersLayer.innerHTML = '';

    let visibleCount = 0;
    const totalTrees = TREES_MAP_DATA.length;

    TREES_MAP_DATA.forEach(tree => {
      const isVisible = this.stateManager.isTreeVisibleOnMap(tree.id);
      const isCaptured = this.stateManager.isTreeCaptured(tree.id);
      const textureKey = this.stateManager.getKencaloTextureForTree(tree.id);

      if (isVisible) {
        visibleCount++;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `tree-marker-interactive ${isCaptured ? 'captured' : 'revealed-beacon'}`);
        g.setAttribute('data-tree-id', tree.id);
        g.style.cursor = 'pointer';

        if (isCaptured) {
          // Marcador bioluminiscente capturado (Verde Esmeralda / Oro)
          g.innerHTML = `
            <!-- Pin central capturado -->
            <circle cx="${tree.x}" cy="${tree.y}" r="15" class="marker-core-captured" filter="url(#glow-filter)" />
            <!-- Ícono de árbol capturado -->
            <text x="${tree.x}" y="${tree.y + 5}" class="marker-code-captured">✓</text>
          `;
        } else {
          // Marcador de coordenada descubierta por glifos (Señal Activa)
          const labelText = `✦ ${tree.name}`;
          const badgeWidth = Math.max(130, labelText.length * 9 + 20);
          const badgeX = tree.x - badgeWidth / 2;
          const badgeY = tree.y - 46;

          g.innerHTML = `
            <!-- Onda expansiva de radar más amplia -->
            <circle cx="${tree.x}" cy="${tree.y}" r="36" class="radar-ping-animation" />
            <circle cx="${tree.x}" cy="${tree.y}" r="22" fill="url(#grad-radar-pulse)" />
            <!-- Pin central visible -->
            <circle cx="${tree.x}" cy="${tree.y}" r="14" class="marker-core-revealed" filter="url(#glow-filter)" />
            <text x="${tree.x}" y="${tree.y + 5}" class="marker-code-revealed">?</text>
            <!-- Badge flotante grande y legible -->
            <g class="marker-tag-group">
              <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="28" rx="14" class="marker-bubble-bg beacon" />
              <text x="${tree.x}" y="${badgeY + 18.5}" class="marker-bubble-text beacon">${labelText}</text>
            </g>
          `;
        }

        g.addEventListener('click', (e) => {
          e.stopPropagation();
          soundManager.playGlyphTap(2);
          this.openTreeDetails(tree, isCaptured, textureKey);
        });

        markersLayer.appendChild(g);
      }
    });

    // Actualizar contador de exploración
    if (this.treesCounter) {
      this.treesCounter.textContent = `${visibleCount} / ${totalTrees}`;
    }
    const subtitle = document.getElementById('map-trees-subtitle');
    if (subtitle) {
      subtitle.textContent = `${visibleCount} de ${totalTrees} Árboles Descubiertos`;
    }

    // Niebla de exploración
    const fogOverlay = document.getElementById('map-fog-overlay');
    if (fogOverlay) {
      if (visibleCount === 0) {
        fogOverlay.classList.remove('hidden');
      } else {
        fogOverlay.classList.add('hidden');
      }
    }
  }

  openTreeDetails(tree, isCaptured, textureKey) {
    if (!this.popupContainer) return;

    this.popupContainer.innerHTML = `
      <div class="tree-details-card glass-card pop-in">
        <button class="btn-close-popup" id="btn-close-tree-popup" title="Cerrar">✕</button>
        <div class="popup-header">
          <span class="tree-badge-status ${isCaptured ? 'status-captured' : 'status-revealed'}">
            ${isCaptured ? '✓ Kencalo en Posesión' : '✦ Señal Revelada'}
          </span>
          <h3>${tree.name}</h3>
          <span class="tree-coords-minimal">${tree.coords}</span>
        </div>

        <p class="tree-desc-short">${tree.description}</p>

        <div class="tree-popup-actions">
          <span class="tree-address-minimal">📍 ${tree.address}</span>
          ${isCaptured ? `
            <span class="tree-badge-texture">Textura ${textureKey || 'A'}</span>
          ` : `
            <button class="btn-dark-pill btn-mini-go-camera" id="btn-popup-go-camera">Rastrear en AR</button>
          `}
        </div>
      </div>
    `;

    this.popupContainer.classList.remove('hidden');

    const btnClose = document.getElementById('btn-close-tree-popup');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        soundManager.playOutfitNav();
        this.popupContainer.classList.add('hidden');
      });
    }

    const btnGoCamera = document.getElementById('btn-popup-go-camera');
    if (btnGoCamera) {
      btnGoCamera.addEventListener('click', () => {
        soundManager.playOutfitNav();
        this.popupContainer.classList.add('hidden');
        const navBtnAR = document.querySelector('.bottom-nav [data-view="ar"]');
        if (navBtnAR) navBtnAR.click();
      });
    }
  }

  focusTree(treeId) {
    const tree = TREES_MAP_DATA.find(t => t.id === treeId);
    if (!tree) return;

    const isCaptured = this.stateManager.isTreeCaptured(tree.id);
    const textureKey = this.stateManager.getKencaloTextureForTree(tree.id);
    this.openTreeDetails(tree, isCaptured, textureKey);
  }
}
