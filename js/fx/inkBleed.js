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
    this.text = options.text || 'HEBRA';
    this.fontFamily = options.fontFamily || "'Outfit', 'Inter', sans-serif";
    this.fontWeight = options.fontWeight || '800';
    this.fontSize = options.fontSize || 120;
    this.inkColor = options.inkColor || [0.95, 0.96, 1.0]; // RGB normalizado (blanco platino)
    this.bgColor = options.bgColor || [0.0, 0.0, 0.0, 0.0]; // Transparente por defecto

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

    this.animationFrameId = null;

    this.initCanvas();
    this.initWebGL();
    this.renderOffscreenText();
    this.updateTexture();
    this.bindEvents();
    this.startLoop();

    // Re-rasterizar cuando las fuentes de Google (Outfit/Inter) terminen de cargar
    if (document.fonts && document.fonts.ready) {
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

    // Offscreen Canvas para rasterizar el texto en 2D con alta nitidez
    this.offscreenCanvas = document.createElement('canvas');
    this.offCtx = this.offscreenCanvas.getContext('2d');

    this.resize();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.isMobile = ('ontouchstart' in window) || (window.innerWidth < 768);

    // En pantallas móviles limitamos el DPR a 1.25x para reducir la carga de GPU manteniendo nitidez
    const maxDpr = this.isMobile ? 1.25 : 2.0;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    this.width = Math.floor(rect.width || 600);
    this.height = Math.floor(rect.height || 300);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

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

    // Calcular tamaño de fuente proporcional de alta definición
    const calculatedFontSize = Math.floor(Math.min(w * 0.20, h * 0.52));

    this.offCtx.fillStyle = '#ffffff';
    this.offCtx.font = `${this.fontWeight} ${calculatedFontSize}px ${this.fontFamily}`;
    this.offCtx.textAlign = 'center';
    this.offCtx.textBaseline = 'middle';

    // Texto nítido de alta precisión
    this.offCtx.fillText(this.text, w / 2, h / 2);
  }

  initWebGL() {
    this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!this.gl) {
      console.warn('WebGL no disponible para InkBleedCanvas, utilizando fallback 2D.');
      return;
    }

    const gl = this.gl;

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

        // 1. Núcleo base nítido (NUNCA genera vacío ni huecos dentro del texto)
        float coreAlpha = texture2D(uTexture, uv).a;

        // 2. Corrección de Aspect Ratio (1:1 real en píxeles de pantalla)
        float aspect = uResolution.x / uResolution.y;
        vec2 aspectUv = vec2(uv.x * aspect, uv.y);
        vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);

        vec2 mouseVec = aspectUv - aspectMouse;
        float mouseDist = length(mouseVec);

        // Radio de acción ajustado y equilibrado del cursor (0.23)
        float mouseFactor = smoothstep(0.23, 0.0, mouseDist);

        // Radio de colmatación y puente líquido entre letras
        float fillRadius = uVolatility * mouseFactor * 0.096;

        // 3. Muestreo de dilatación fluida
        float fillAlpha = 0.0;
        
        for (int i = 0; i < 16; i++) {
          float angle = float(i) * 0.392699;
          vec2 sampleDir = vec2(cos(angle) / aspect, sin(angle));

          for (int s = 1; s <= 5; s++) {
            float stepFactor = float(s) * 0.20;
            vec2 offset = sampleDir * (fillRadius * stepFactor);
            float sAlpha = texture2D(uTexture, uv - offset).a;
            fillAlpha = max(fillAlpha, sAlpha);
          }
        }

        // 4. Tensión Superficial Líquida - Enganche y Fusión Notoria (Snap Attraction)
        float edgeProximity = pow(fillAlpha, 1.12);
        
        // Umbral de Enganche Rápido "Snap": En cuanto dos bordes se acercan, la tensión los engancha
        float liquidAlpha = smoothstep(0.06, 0.42, edgeProximity);

        // Relieve y brillo pronunciado en el cuello del menisco de unión
        float bridgeHighlight = smoothstep(0.10, 0.40, liquidAlpha) * (1.0 - smoothstep(0.40, 0.86, liquidAlpha));
        vec3 color = uInkColor + vec3(0.10, 0.12, 0.16) * bridgeHighlight * 0.70;

        // Alpha final: Conserva el texto limpio y engancha fuertemente bordes cercanos
        float totalAlpha = max(coreAlpha, liquidAlpha * 0.99);

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

    const updateMousePos = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      this.targetMouse.x = Math.max(0, Math.min(1, x));
      this.targetMouse.y = Math.max(0, Math.min(1, y));

      const dx = this.targetMouse.x - this.lastMouse.x;
      const dy = this.targetMouse.y - this.lastMouse.y;
      const speed = Math.hypot(dx, dy);

      // Al pasar o mover el puntero sobre las letras, la dilatación de tinta responde de inmediato
      const activeImpulse = 0.65 + Math.min(speed * 8.0, 0.35);
      this.targetVolatility = Math.min(activeImpulse, this.maxVolatility);

      this.lastMouse.x = this.targetMouse.x;
      this.lastMouse.y = this.targetMouse.y;
    };

    this.canvas.addEventListener('mousemove', (e) => {
      this.isHovered = true;
      updateMousePos(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.targetVolatility = this.baseVolatility;
    });

    // Soporte para gestos táctiles en pantallas móviles
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.isHovered = true;
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.isHovered = false;
      this.targetVolatility = this.baseVolatility;
    });
  }

  startLoop() {
    const render = () => {
      this.renderFrame();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  renderFrame() {
    if (!this.gl) return;

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

