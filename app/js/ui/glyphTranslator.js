/**
 * GlyphTranslatorUI - Controlador del Traductor de Glifos del Universo Hebra
 * Permite decodificar secuencias rúnicas para revelar coordenadas de árboles en La Plata.
 */

import { soundManager } from '../audio/audioManager.js';
import { NotificationUI } from './notificationUI.js';

export const GLYPHS_DATA = [
  { id: 1, label: 'I', file: 'assets/glifos/image (45) 2.svg' },
  { id: 2, label: 'II', file: 'assets/glifos/image (45) 3.svg' },
  { id: 3, label: 'III', file: 'assets/glifos/image (45) 4.svg' },
  { id: 4, label: 'IV', file: 'assets/glifos/image (45) 5.svg' },
  { id: 5, label: 'V', file: 'assets/glifos/image (45) 6.svg' },
  { id: 6, label: 'VI', file: 'assets/glifos/image (45) 7.svg' },
  { id: 7, label: 'VII', file: 'assets/glifos/image (45) 8.svg' },
  { id: 8, label: 'VIII', file: 'assets/glifos/image (45) 9.svg' },
  { id: 9, label: 'IX', file: 'assets/glifos/image (45) 10.svg' },
  { id: 10, label: 'X', file: 'assets/glifos/image (45) 11.svg' },
  { id: 11, label: 'XI', file: 'assets/glifos/image (45) 12.svg' },
  { id: 12, label: 'XII', file: 'assets/glifos/image (45) 13.svg' }
];

import { getGlyphTreeSecrets } from '../config/gameRegistry.js';

// Secuencias de glifos que sintonizan las coordenadas de cada árbol desde el registro central
export const TREE_SECRETS = getGlyphTreeSecrets();

export class GlyphTranslatorUI {
  constructor(stateManager, onCoordinateUnlocked = null) {
    this.stateManager = stateManager;
    this.onCoordinateUnlocked = onCoordinateUnlocked;
    this.currentSequence = [];
    this.maxSequenceLength = 4;

    this.displayContainer = document.getElementById('glyph-sequence-display');
    this.keypadContainer = document.getElementById('glyph-keypad-grid');
    this.btnDecode = document.getElementById('btn-glyph-decode');
    this.btnBackspace = document.getElementById('btn-glyph-backspace');
    this.statusText = document.getElementById('glyph-status-message');

    this.initKeypad();
    this.initControls();
    this.updateDisplay();
  }

  initKeypad() {
    if (!this.keypadContainer) return;
    this.keypadContainer.innerHTML = '';

    GLYPHS_DATA.forEach(glyph => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glyph-key-btn';
      btn.dataset.glyphId = glyph.id;
      btn.title = `Glifo ${glyph.id}`;

      btn.innerHTML = `
        <div class="glyph-icon-box">
          <img src="${glyph.file}" alt="Glifo" class="glyph-svg-img" loading="lazy" />
        </div>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addGlyph(glyph.id);
      });

      this.keypadContainer.appendChild(btn);
    });
  }

  initControls() {
    if (this.btnDecode) {
      this.btnDecode.addEventListener('click', (e) => {
        e.stopPropagation();
        this.decodeSequence();
      });
    }

    if (this.btnBackspace) {
      this.btnBackspace.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeLastGlyph();
      });
    }
  }

  addGlyph(glyphId) {
    if (this.currentSequence.length >= this.maxSequenceLength) {
      soundManager.playGlyphTap(glyphId);
      return;
    }

    soundManager.playGlyphTap(glyphId);
    this.currentSequence.push(glyphId);
    this.updateDisplay();
    this.clearStatus();
  }

  removeLastGlyph() {
    if (this.currentSequence.length > 0) {
      this.currentSequence.pop();
      soundManager.playOutfitNav();
      this.updateDisplay();
      this.clearStatus();
    }
  }

  clearSequence() {
    if (this.currentSequence.length > 0) {
      this.currentSequence = [];
      soundManager.playOutfitNav();
      this.updateDisplay();
      this.clearStatus();
    }
  }

  clearStatus() {
    if (this.statusText) {
      this.statusText.textContent = '';
      this.statusText.className = 'glyph-status-message';
    }
  }

  updateDisplay() {
    if (!this.displayContainer) return;
    this.displayContainer.innerHTML = '';

    if (this.currentSequence.length === 0) {
      this.displayContainer.innerHTML = `
        <div class="glyph-empty-slot hint-pulse">
          <span>Introduce una secuencia de glifos...</span>
        </div>
      `;
      if (this.btnDecode) this.btnDecode.disabled = true;
      return;
    }

    if (this.btnDecode) this.btnDecode.disabled = false;

    this.currentSequence.forEach((glyphId, index) => {
      const glyph = GLYPHS_DATA.find(g => g.id === glyphId);
      if (!glyph) return;

      const slot = document.createElement('div');
      slot.className = 'glyph-slot active pop-in';
      slot.innerHTML = `
        <img src="${glyph.file}" alt="Glifo" class="glyph-slot-img" />
      `;

      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentSequence.splice(index, 1);
        soundManager.playOutfitNav();
        this.updateDisplay();
        this.clearStatus();
      });

      this.displayContainer.appendChild(slot);
    });
  }

  decodeSequence() {
    if (this.currentSequence.length === 0) return;

    // Buscar si coincide con alguna coordenada secreta
    const match = TREE_SECRETS.find(t => {
      if (t.sequence.length !== this.currentSequence.length) return false;
      return t.sequence.every((val, idx) => val === this.currentSequence[idx]);
    });

    if (match) {
      // Coincidencia acertada
      const isNew = this.stateManager.discoverCoordinatesByGlyph(match.treeId);
      soundManager.playDecodeSuccess();

      if (this.displayContainer) {
        this.displayContainer.classList.add('flash-success');
        setTimeout(() => this.displayContainer.classList.remove('flash-success'), 1200);
      }

      if (this.statusText) {
        this.statusText.textContent = isNew
          ? `✦ Éxito: Coordenada revelada: ${match.name}.`
          : `✦ Éxito: Coordenada ya revelada: ${match.name}.`;
        this.statusText.className = 'glyph-status-message success';
      }

      NotificationUI.showToast(isNew ? `¡Éxito! Coordenada revelada: ${match.name}` : `Éxito: Coordenada ${match.name} activa`, '🧭');

      if (typeof this.onCoordinateUnlocked === 'function') {
        this.onCoordinateUnlocked(match.treeId);
      }

      // Limpia después de éxito
      setTimeout(() => {
        this.currentSequence = [];
        this.updateDisplay();
      }, 1000);

    } else {
      // No coincide
      soundManager.playDecodeFail();
      if (this.displayContainer) {
        this.displayContainer.classList.add('shake-error');
        setTimeout(() => this.displayContainer.classList.remove('shake-error'), 600);
      }

      if (this.statusText) {
        this.statusText.textContent = '✦ Fracaso: Secuencia de glifos incorrecta.';
        this.statusText.className = 'glyph-status-message error';
      }
    }
  }
}
