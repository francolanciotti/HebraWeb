# Hoja de Ruta de Desarrollo (Roadmap) — Hebra / Kencalo

Este documento establece la hoja de ruta oficial dividida en **6 Fases de Desarrollo** para el crecimiento, calibración y actualización progresiva de la aplicación WebAR y Universo Transmedia **Hebra / Kencalo**.

---

## 🟢 Fase 1: Rediseño Estético Global y Sistema de Diseño (COMPLETADA)
> **Estado:** Finalizada ✓

- [x] **Tipografía y Marca:** Implementación de `@font-face` con fuente `Caoutchouc` para títulos y Google Font `Epilogue` para cuerpo.
- [x] **Fondo Orgánico Interactivo:** Integración del vector `assets/file.svg` con el motor WebGL de sangrado de tinta (`InkBleedCanvas`) reactivo a eventos táctiles.
- [x] **Sistema Glassmorphism Figma:** Implementación del efecto glass exacto (`#D9D9D9 20%`, `blur 8px`, `Light -45º 80%`, `Depth 73`, `Refraction 21`) en todas las tarjetas, modales y panales.
- [x] **Componentes UI Principal:** Botones de acción píldora en Azul Oscuro Marino (`#112142`), barra de navegación inferior flotante con indicador destacado y menú desplegable de indumentaria con íconos vectoriales minimalistas.
- [x] **Visor 3D y Pivote:** Reajuste del centro geométrico (*Bounding Box*) de Kencalo en el torso para rotación y zoom precisos.
- [x] **Herramientas de Debug:** Incorporación de la barra de simulación AR con simuladores de Árbol A, Árbol B y botón de **Reiniciar Progreso**.

---

## 🟢 Fase 2: Calibración y Pruebas WebAR en Entorno Real (COMPLETADA)
> **Estado:** Finalizada ✓

- [x] **Motor MindAR Local y ES Modules:** Integración auto-alojada sin dependencias CDN externas con soporte nativo de WASM/Feature Detection.
- [x] **Variación Aleatoria de Texturas por Persona:** Generación única y aleatoria de texturas (`'A'`, `'B'`, `'C'`, `'D'`) por persona/dispositivo en AR, preservada exactamente en la captura.
- [x] **Flujo de Transición AR → Companion:** Animación alegre de captura al tocar a Kencalo, des-congelamiento inmediato del visor y transferencia directa al visor 3D Companion.
- [x] **Integración de Marcador Real (`targets.mind`):** Compilación e integración de la imagen del árbol real para el Image Tracking WebAR.
---

## 🟢 Fase 3: Expansión del Lore y Sección Transmedia ("Hebra") (COMPLETADA)
> **Estado:** Finalizada ✓

- [x] **Traductor de Glifos (Reemplazo de Card de Hebra):** Teclado interactivo y decodificador con glifos vectoriales negros SVG de alta definición (`image (45) 2.svg` a `13.svg`), display con slots activos y audio armónico Web Audio API para descifrar secuencias y revelar coordenadas.
- [x] **Mapa Vectorial de La Plata (Reemplazo de Mapa de Instalación):** Cartografía vectorial SVG estilizada con el trazado geométrico platense (Diagonales 73/74, eje cívico y plazas), ubicando los árboles clave: **Árbol A en El Bosque**, **Árbol B en Plaza San Martín** y **Árbol C en Plaza Rocha**.
- [x] **Sub-Navegación Segmentada (Adiós a las Cards con Clipping):** Reemplazo del sistema acordeón por una barra de píldoras segmentadas (`[ 🔮 Traductor de Glifos ] [ 🗺️ Mapa de La Plata (0/3) ]`) con paneles de pantalla completa sin desbordamiento ni cortes de altura.
- [x] **Flujo Unificado de Captura AR para Árboles A, B y C:** Detección y simulación completa para los tres árboles, mostrando siempre el botón de captura en AR con Kencalos y texturas únicas ('A', 'B', 'C', 'D').
- [x] **Selector de Compañero Kencalo:** Cápsula HUD interactiva con flechas `<` y `>` para alternar en tiempo real entre los Kencalos en posesión, aplicando textura inmediata y reacción alegre al modelo 3D.
- [x] **Lógica de Visibilidad y Exploración:** En el mapa solo se muestran los árboles cuyas coordenadas fueron descifradas en glifos o cuyo Kencalo ya fue capturado (niebla de exploración interactiva con popups informativos y foco con pulso radar).
- [x] **Depuración UI:** Retiro definitivo del botón de reinicio de bienvenida (`#btn-reopen-welcome`) para una interfaz minimalista y enfocada.

---

## 🟢 Fase 4: Identificación Ligera, Ajustes y Captura en el Árbol (COMPLETADA)
> **Estado:** Finalizada ✓

- [x] **1. Identificación Opcional y Recomendada (Sin Bloqueo / Cero Fricción):**
  - **No obligatorio:** El usuario puede jugar libremente en modo invitado sin necesidad de registrarse.
  - **Llamado amistoso:** Mensaje pedagógico sutil (*"Crea tu nombre de usuario para guardar tus Kencalos y no perder tu progreso"*).
  - **Nombre de usuario libre:** Cualquier nombre o apodo que el usuario desee registrar (sin dependencia ni obligación de Instagram o celular).
  - **Cero Merge / Registro Único:** Limitado estrictamente a cuentas de invitado creando su cuenta por primera vez; al cargar otra cuenta existente se carga limpiamente su estado sin fusiones ni conflictos.

- [x] **2. Botón Superior de Ajustes de Cuenta con Integración Armónica:**
  - **Convivencia visual en todas las pantallas:**
    - *En Cámara AR (`view-ar`):* Botón Glass circular (⚙️) en la esquina superior derecha, con margen seguro respecto al visor.
    - *En Kencalo Companion (`view-companion`):* Integración en el área superior coordinada con la cápsula del selector de Kencalos (ancho flexible para evitar solapamientos en pantallas angostas).
    - *En Hebra Transmedia (`view-transmedia`):* Integrado elegantemente junto a la cabecera del mapa (`.map-hud-header`), sin romper el diseño de Figma y sin badges numéricos residuales.
  - **Modal Glassmorphism de Ajustes:**
    - Estado de cuenta: Muestra si es *Invitado* (con input para crear y guardar cuenta) o si ya está identificado con su usuario activo.
    - Carga directa: Opción para restaurar partida en otro dispositivo ingresando el nombre de usuario (reemplazo limpio, sin merge).
    - Opciones para desvincular el dispositivo o reiniciar progreso local.

- [x] **3. Modal de Postal Polaroid al Capturar en el Árbol (Historia 9:16):**
  - **Visualización Grande y Legible:** La imagen que se va a subir en la red social se muestra en un tamaño destacado y nítido para que el usuario pueda verla y leerla perfectamente antes de compartirla o guardarla.
  - **Formato Polaroid con Estética del Universo Hebra:**
    - Marco de reliquia fotográfica espacial/mística en formato Polaroid (con apertura cuadrada 1:1 para el render 3D de Kencalo).
    - Pie del Polaroid con tipografía limpia: Título **HEBRA**, árbol descubierto (*El Bosque*, *Plaza San Martín*, *Plaza Rocha*), coordenadas de La Plata, insignia del explorador con su nombre de usuario, y sello oficial `@hebra.tdm3`.
    - **Regla estricta:** **Sin mención de texturas** en ningún lugar del arte ni de la interfaz.
  - **Botones Limpios y sin Fricción:**
    - Botón **"Compartir"**: invoca la hoja nativa para subir a Instagram Stories u otras redes.
    - Botón **"⬇️ Guardar"**: descarga la postal en alta resolución a la galería del dispositivo.
    - Botón **Cruz ("✕")**: para cerrar cómodamente la vista previa y continuar con el juego.
    - Acceso permanente desde el botón de cámara en el HUD de Companion.

- [x] **4. Integración de Base de Datos en la Nube (Firebase Firestore):**
  - **Arquitectura Local-First con Sincronización Cloud:**
    - Persistencia inmediata en `localStorage` (sin latencia y resistente a pérdida de señal en la ciudad).
    - Sincronización automática en segundo plano con Firestore Database (`accounts/{username}`).
  - **Cero Merge en la Nube:**
    - Al crear cuenta de invitado: valida que el usuario no exista previamente en la nube y registra su progreso actual.
    - Al cargar partida: descarga el estado exacto guardado en Firestore y reemplaza limpiamente la sesión sin fusiones.


---

## 🟢 Fase 5: Escenario 3D de Acompañamiento (Companion Habitat)
> **Estado:** Finalizada ✓

- [x] **Entorno 3D Interactivo (Cueva Kenosis 360º):** Integración del mapa de entorno HDR optimizado (`KenosisCaveHDRI.hdr` 1.44 MB) con módulo local `RGBELoader` y generación PMREM, proporcionando iluminación PBR Image-Based Lighting (IBL) y hábitat inmersivo en 360° en la vista Companion.
- [x] **Cámara Frontal Estable (Cero Paralaje):** Rotación centrada 360° exclusiva sobre Kencalo con cámara fija, conservando encuadre óptimo y estable sobre el hábitat de la cueva.
- [x] **Optimización Gráfica Mobile-First:** Liberación inmediata de memoria VRAM (`texture.dispose()` y `pmremGenerator.dispose()`), colorimetría cinematográfica `ACESFilmicToneMapping` y `sRGBEncoding` a 60 FPS estables.

---

## 🟢 Fase 6: Sistema Multimodelo de Kencalos y Variantes
> **Estado:** Completada (Base Multimodelo y Registro Modular)

- [x] **Variantes de Especies Kencalo:**
  - Soporte y carga dinámica de diferentes modelos `.glb` en tiempo real según la especie:
    - **Libélula** (especie activa base, `Kencalitas1.glb`)
    - **Danzante** (`Kencalitas2.glb`)
    - **Burbuja** (`Kencalitas3.glb`)
    - **Tapón** (`Kencalitas4.glb`)
    - **Gatogota** (`Kencalitas5.glb`)
    - **Manitas** (`Kencalitas6.glb`)
  - Manejo de cuartetos de textura individuales (A, B, C, D) y animaciones específicas (`Idle` y `Happy`) por especie.
  - **Sorteo Aleatorio sin Repetición:** Selección 100% aleatoria de textura (A, B, C, D) y de especie entre las no capturadas, garantizando que el jugador nunca capture el mismo modelo dos veces.
- [x] **Selector de Compañero (Cápsula Rápida):**
  - Cápsula flotante reactiva en la vista Companion para alternar al instante entre los Kencalos en posesión.
  - Identificación gramatical natural con preposición en toda la app: *Kencalo del Bosque*, *Kencalo de Plaza San Martín*, *Kencalo de Plaza Rocha*.
  - Sincronización en caliente del modelo 3D, animación de alegría al cambiar y actualización de estado.
- [x] **Registro Centralizado de Árboles y Eventos (`gameRegistry.js`):**
  - Fuente única de la verdad para personalizar y reubicar árboles o crear eventos temporales (coordenadas reales, posición vectorial en el mapa de La Plata, especie asignada, pistas y secuencias de glifos).
- [ ] **Eventos Temporales en Vivo:** Marcadores AR especiales por tiempo limitado para desbloquear atuendos exclusivos.

---
*Hoja de Ruta oficial para el desarrollo del proyecto WebHebra.*
