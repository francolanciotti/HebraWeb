/**
 * inkBleed.js - Motor WebGL para Efecto de Sangrado de Tinta y Distorsión Líquida
 */

export class InkBleedCanvas {
  /**
   * @param {HTMLElement} container - Elemento contenedor donde se creará el canvas
   * @param {Object} options - Opciones de configuración
   */
  constructor(container, options = {}) {
    this.container = container;
    this.text = options.text || null;
    this.fontFamily = options.fontFamily || "'Outfit', 'Inter', sans-serif";
    this.fontWeight = options.fontWeight || '800';
    this.fontSize = options.fontSize || 120;
    this.inkColor = options.inkColor || [0.95, 0.96, 1.0]; // RGB normalizado (blanco platino)
    this.bgColor = options.bgColor || [0.0, 0.0, 0.0, 0.0]; // Transparente por defecto

    // Opciones para imágenes y vectores SVG
    this.imageSrc = options.imageSrc || null;
    this.eventTarget = options.eventTarget || null;
    this.positionX = options.positionX !== undefined ? options.positionX : 0.5;
    this.positionY = options.positionY !== undefined ? options.positionY : 0.5;
    this.positionXMobile = options.positionXMobile;
    this.positionYMobile = options.positionYMobile;
    this.positionXDesktop = options.positionXDesktop;
    this.positionYDesktop = options.positionYDesktop;
    this.scaleMultiplier = options.scaleMultiplier !== undefined ? options.scaleMultiplier : 1.0;
    this.imgLoaded = false;

    // Parámetros de física y distorsión fluida
    this.speed = options.speed !== undefined ? options.speed : 1.0;
    this.volatility = 0.0;
    this.targetVolatility = 0.0;
    this.maxVolatility = options.maxVolatility || 0.85;
    this.baseVolatility = options.baseVolatility || 0.0; // 0.0 en reposo

    // Estado del Mouse / Touch con seguimiento suave 1er orden
    this.mouse = { x: 0.5, y: 0.5 };
    this.targetMouse = { x: 0.5, y: 0.5 };
    this.lastMouse = { x: 0.5, y: 0.5 };
    this.isHovered = false;
    this.isPaused = false;

    this.animationFrameId = null;

    if (this.imageSrc) {
      this.img = new Image();
      this.img.onload = () => {
        this.imgLoaded = true;
        this.renderOffscreenText();
        this.updateTexture();
      };
      this.img.src = this.imageSrc;
    }

    this.initCanvas();
    this.initWebGL();
    this.renderOffscreenText();
    this.updateTexture();
    this.bindEvents();
    this.startLoop();

    // Re-rasterizar cuando la fuente personalizada Caoutchouc o Google Fonts termine de cargar
    if (document.fonts) {
      document.fonts.load(`400 64px ${this.fontFamily}`).then(() => {
        this.renderOffscreenText();
        this.updateTexture();
      }).catch(() => {});

      document.fonts.ready.then(() => {
        this.renderOffscreenText();
        this.updateTexture();
      });
    }
  }

  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ink-bleed-canvas';
    this.container.appendChild(this.canvas);

    // Offscreen Canvas para rasterizar el texto en 2D con ultra nitidez
    this.offscreenCanvas = document.createElement('canvas');
    this.offCtx = this.offscreenCanvas.getContext('2d', { alpha: true, willReadFrequently: false });

    this.resize();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.max(window.devicePixelRatio || 1, 2.5);

    this.width = Math.max(Math.floor(rect.width), 320);
    this.height = Math.max(Math.floor(rect.height), 120);

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);

    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    this.renderOffscreenText();
    if (this.texture) {
      this.updateTexture();
    }
  }

  renderOffscreenText() {
    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;
    if (w === 0 || h === 0) return;

    this.offCtx.clearRect(0, 0, w, h);
    this.offCtx.imageSmoothingEnabled = true;
    this.offCtx.imageSmoothingQuality = 'high';

    // 1. Renderizado de imagen/vector SVG con algoritmo idéntico a CSS background-position y background-size
    if (this.imageSrc && this.imgLoaded && this.img) {
      const isMobile = window.innerWidth <= 768;
      const imgW = this.img.naturalWidth || 723;
      const imgH = this.img.naturalHeight || 1113;

      let drawW, drawH, drawX, drawY;
      let posX, posY;

      if (isMobile) {
        // En celular: background-size: 180%, background-position: 45% 80%
        posX = this.positionXMobile !== undefined ? this.positionXMobile : (this.positionX !== undefined ? this.positionX : 0.45);
        posY = this.positionYMobile !== undefined ? this.positionYMobile : (this.positionY !== undefined ? this.positionY : 0.80);

        drawW = w * 1.8 * this.scaleMultiplier;
        drawH = drawW * (imgH / imgW);

        // Fórmula CSS estándar para background-position: X% Y% -> (width_contenedor - width_imagen) * X%
        drawX = (w - drawW) * posX;
        drawY = (h - drawH) * posY;
      } else {
        // En PC: background-size: cover, background-position: center 67% (50% 67%)
        posX = this.positionXDesktop !== undefined ? this.positionXDesktop : (this.positionX !== undefined ? this.positionX : 0.50);
        posY = this.positionYDesktop !== undefined ? this.positionYDesktop : (this.positionY !== undefined ? this.positionY : 0.67);

        const scale = Math.max(w / imgW, h / imgH) * this.scaleMultiplier;
        drawW = imgW * scale;
        drawH = imgH * scale;

        // Fórmula CSS estándar para background-position: X% Y% -> (width_contenedor - width_imagen) * X%
        drawX = (w - drawW) * posX;
        drawY = (h - drawH) * posY;
      }

      this.offCtx.drawImage(this.img, drawX, drawY, drawW, drawH);
    }

    // 2. Renderizado de texto
    if (this.text) {
      const isMobile = window.innerWidth <= 768;
      const baseFontSize = isMobile ? 64 : 110;
      const dpr = Math.max(window.devicePixelRatio || 1, 2.5);
      const targetFontSize = Math.floor(baseFontSize * dpr);

      this.offCtx.fillStyle = '#ffffff';
      this.offCtx.font = `${this.fontWeight} ${targetFontSize}px ${this.fontFamily}`;
      this.offCtx.textAlign = 'center';
      this.offCtx.textBaseline = 'middle';

      this.offCtx.fillText(this.text, w / 2, h / 2);
    }
  }

  initWebGL() {
    this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!this.gl) {
      console.warn('WebGL no disponible para InkBleedCanvas, utilizando fallback 2D.');
      return;
    }

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Shaders
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = (aPosition + 1.0) * 0.5;
        vUv.y = 1.0 - vUv.y; // Invertir Y para textura WebGL
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;

      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec2 uResolution;
      uniform float uVolatility;
      uniform vec2 uMouse;
      uniform vec3 uInkColor;

      void main() {
        vec2 uv = vUv;

        // 1. Núcleo base nítido (Textura original 100% limpia sin modificar en reposo)
        float coreAlpha = texture2D(uTexture, uv).a;

        if (uVolatility <= 0.001) {
          gl_FragColor = vec4(uInkColor, coreAlpha);
          return;
        }

        // 2. Corrección de Aspect Ratio
        float aspect = uResolution.x / uResolution.y;
        vec2 aspectUv = vec2(uv.x * aspect, uv.y);
        vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);

        float mouseDist = length(aspectUv - aspectMouse);
        float mouseFactor = smoothstep(0.30, 0.0, mouseDist);

        // Radio de dilatación líquida según volatilidad y cursor
        float fillRadius = uVolatility * mouseFactor * 0.095;

        // 3. Muestreo de expansión líquida de alta precisión (12 ángulos x 4 pasos)
        float fillAlpha = 0.0;

        for (int i = 0; i < 12; i++) {
          float angle = float(i) * 0.5235987; // 2 * PI / 12
          vec2 sampleDir = vec2(cos(angle) / aspect, sin(angle));

          for (int s = 1; s <= 4; s++) {
            float stepFactor = float(s) * 0.25;
            vec2 offset = sampleDir * (fillRadius * stepFactor);
            float sAlpha = texture2D(uTexture, uv - offset).a;
            fillAlpha = max(fillAlpha, sAlpha);
          }
        }

        // 4. Alpha Sólido Opaco (100% Blanco Opaco en toda la masa de tinta dilatada)
        float dilatedAlpha = smoothstep(0.01, 0.15, fillAlpha);

        // Brillo y relieve sutil en el borde de fusión del fluido
        float highlight = smoothstep(0.08, 0.30, dilatedAlpha) * (1.0 - smoothstep(0.30, 0.85, dilatedAlpha));
        vec3 color = uInkColor + vec3(0.08, 0.10, 0.14) * highlight * uVolatility;

        // Alpha final: 100% Sólido opaco tanto en el núcleo como en la tinta expandida
        float totalAlpha = max(coreAlpha, dilatedAlpha);

        gl_FragColor = vec4(color, totalAlpha);
      }
    `;

    // Compilación de Shaders
    const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Error al vincular el programa WebGL:', gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    // Buffers para Quad
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(this.program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Guardar ubicaciones de Uniforms
    this.uniforms = {
      uTexture: gl.getUniformLocation(this.program, 'uTexture'),
      uResolution: gl.getUniformLocation(this.program, 'uResolution'),
      uVolatility: gl.getUniformLocation(this.program, 'uVolatility'),
      uMouse: gl.getUniformLocation(this.program, 'uMouse'),
      uInkColor: gl.getUniformLocation(this.program, 'uInkColor')
    };

    // Textura WebGL
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compilando shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  updateTexture() {
    if (!this.gl || !this.texture) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreenCanvas);
  }

  bindEvents() {
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    const targetEl = this.eventTarget || this.canvas;

    const updateMousePos = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      this.targetMouse.x = Math.max(0, Math.min(1, x));
      this.targetMouse.y = Math.max(0, Math.min(1, y));

      const dx = this.targetMouse.x - this.lastMouse.x;
      const dy = this.targetMouse.y - this.lastMouse.y;
      const speed = Math.hypot(dx, dy);

      // Al pasar o mover el puntero sobre la superficie, la dilatación responde de inmediato
      const activeImpulse = 0.65 + Math.min(speed * 8.0, 0.35);
      this.targetVolatility = Math.min(activeImpulse, this.maxVolatility);

      this.lastMouse.x = this.targetMouse.x;
      this.lastMouse.y = this.targetMouse.y;
    };

    targetEl.addEventListener('mousemove', (e) => {
      this.isHovered = true;
      updateMousePos(e.clientX, e.clientY);
    });

    targetEl.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.targetVolatility = this.baseVolatility;
    });

    // Soporte para gestos táctiles en pantallas móviles
    targetEl.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.isHovered = true;
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    targetEl.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.isHovered = true;
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    targetEl.addEventListener('touchend', () => {
      this.isHovered = false;
      this.targetVolatility = this.baseVolatility;
    });
  }

  startLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    const render = () => {
      if (this.isPaused) return;
      this.renderFrame();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  pause() {
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.startLoop();
    }
  }

  renderFrame() {
    if (this.isPaused) return;

    if (!this.gl) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(this.offscreenCanvas, 0, 0);
      }
      return;
    }

    const gl = this.gl;

    // 1. Trayectoria de seguimiento directa y suave (Sin inercia de sobrepaso ni rebote al cambiar de dirección)
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.09;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.09;

    // 2. Transición fluida suave sin rebote elástico (100% progresiva)
    this.volatility += (this.targetVolatility - this.volatility) * 0.045;

    // Si el puntero sale del canvas, retornar gradualmente y despacio al reposo (0.0)
    if (!this.isHovered && this.targetVolatility > this.baseVolatility) {
      this.targetVolatility += (this.baseVolatility - this.targetVolatility) * 0.03;
    }

    gl.useProgram(this.program);

    gl.uniform1i(this.uniforms.uTexture, 0);
    gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.uVolatility, this.volatility);
    gl.uniform2f(this.uniforms.uMouse, this.mouse.x, this.mouse.y);
    gl.uniform3fv(this.uniforms.uInkColor, this.inkColor);

    gl.clearColor(this.bgColor[0], this.bgColor[1], this.bgColor[2], this.bgColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  setText(newText) {
    if (this.text !== newText) {
      this.text = newText;
      this.renderOffscreenText();
      this.updateTexture();
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

