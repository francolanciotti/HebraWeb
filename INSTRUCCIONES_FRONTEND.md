# Guía de Especificaciones y Sistema de Diseño Frontend — Hebra / Kencalo

Este documento recopila las directrices de diseño, tokens de estilo, componentes de UI y comportamiento interactivo implementados en el frontend de la aplicación WebAR y Transmedia **Hebra / Kencalo**.

---

## 1. Sistema de Tipografía (Typography System)

- **Fuente de Encabezados y Títulos:** `@font-face` local **Caoutchouc** (`assets/fonts/Caoutchouc.otf`).
  - *Uso:* Encabezados principales `<h1>`, `<h2>`, títulos de splash screen y tarjetas destacadas (`font-family: 'Caoutchouc', sans-serif`).
- **Fuente de Texto de Cuerpo e Interfaz:** Google Font **Epilogue** (`font-family: 'Epilogue', sans-serif`).
  - *Uso:* Párrafos, botones, badges, inputs y textos informativos.

---

## 2. Fondo Orgánico Interactivo (Background Vector & Ink Bleed)

- **Vector Orgánico Fullscreen:** La aplicación incluye un fondo vectorial orgánico a pantalla completa (`assets/file.svg`) contenido dentro del elemento `.app-organic-bg`.
- **Efecto Físico de Sangrado de Tinta (Ink Bleed):**
  - Renderizado dinámicamente mediante WebGL (`js/fx/inkBleed.js`).
  - Reacciona a eventos táctiles y de ratón (*click / touch*) generando una dilatación líquida expansiva en el vector y títulos con disolución progresiva.
  - Volatilidad adaptativa: `0.85` en dispositivos Desktop y `0.38` en dispositivos Mobile.

---

## 3. Efecto Glassmorphism Figma (Glass Cards & Panels)

Todas las tarjetas, modales y paneles flotantes de la interfaz utilizan el efecto de vidrio réplica exacta del inspector de Figma (`Light -45º 80%`, `Refraction 21`, `Depth 73`, `Frost 8`):

### Tokens de Estilo CSS (`.glass-card`)
```css
.glass-card {
  background: rgba(217, 217, 217, 0.2); /* #D9D9D9 con 20% de transparencia */
  backdrop-filter: blur(8px);            /* Frost: 8px */
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-top-color: rgba(255, 255, 255, 0.9);   /* Luz incidente -45º a 80% */
  border-left-color: rgba(255, 255, 255, 0.85);  /* Luz incidente -45º a 80% */
  box-shadow: 
    0 16px 40px -8px rgba(17, 33, 66, 0.14),     /* Depth: 73 */
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.85),/* Bisel interno de luz */
    inset -1px -1px 3px 0 rgba(17, 33, 66, 0.1); /* Refraction: 21 */
  border-radius: var(--radius-lg);
}
```

### Componentes que aplican el efecto Glass:
- `.glass-card` (Tarjetas genéricas y paneles).
- `.hero-card` (Tarjeta Hero de Hebra).
- `.transmedia-lore` (Tarjeta del Mapa de la Instalación).
- `.tree-badge-card` (Badges de estado de Árbol A y Árbol B).
- `.link-card-instagram` (Tarjeta de enlace a Instagram).
- `.ar-permission-card` (Tarjeta de solicitud de permisos de cámara).
- `.unclaimed-card` (Tarjeta de compañero no capturado).
- `.wardrobe-dropdown-menu` (Menú desplegable de indumentaria).
- `.dev-sim-bar` (Barra de herramientas de pruebas).

---

## 4. Botones de Acción Principal (`.btn-dark-pill`)

- **Forma Píldora (*Pill Shape*):** `border-radius: 50px`.
- **Color Base:** Azul Oscuro Marino (`#112142` / `var(--navy-dark)`).
- **Texto:** Blanco (`#FFFFFF`), centrado, peso semi-bold (`600`).
- **Comportamiento Interactivo:** Micro-animación de elevación con sombra suave al pasar el cursor (`hover`) y compresión ligera (`transform: scale(0.97)`) al presionar (`active`).

---

## 5. Navegación Inferior Flotante (`.bottom-nav`)

- **Contenedor:** Cápsula horizontal forma píldora flotante fijada en la parte inferior de la pantalla en color Azul Oscuro Marino (`#112142`).
- **Estructura de 3 Pestañas:**
  1. **Cámara (`ar`):** Escáner WebAR con cámara en vivo y visor de marcadores.
  2. **Kencalo (`companion`):** Vista 3D del compañero interactivo y vestimenta.
  3. **Hebra (`transmedia`):** Lore del universo, mapa de árboles y respaldo.
- **Estado Activo (`.nav-item.active`):** El ícono y la etiqueta seleccionados se encierran dentro de un contenedor destacado con resaltado Glass.

---

## 6. Tarjetas Desplegables de Lore Hebra (Acordeón Autocerrable)

- **Estructura (`.collapsible-card`):** Encabezados cliqueables (`.card-header-toggle`) con ícono indicador SVG de flecha de despliegue.
- **Comportamiento Exclusivo:** Al presionar el encabezado de cualquier tarjeta para abrirla, **todas las demás tarjetas abiertas se cierran automáticamente**. Esto optimiza el espacio útil de pantalla en dispositivos móviles sin saturar el scroll.

---

## 7. Menú Desplegable de Indumentaria (`.wardrobe-dropdown-menu`)

- **Ubicación:** Pestaña **Kencalo (Companion 3D)**.
- **Diseño:** Menú hamburguesa flotante en color Azul Oscuro Marino (`#112142`) con efecto Glass.
- **Grid de Íconos Minimalistas:**
  - Botones circulares de solo ícono (`.outfit-icon-btn`).
  - Utilizan trazados vectoriales minimalistas en SVG (líneas finas), homogéneos con el ícono de la cámara.
  - Indicador visual circular activo (`.active`) con borde brillante para señalar la prenda equipada.

---

## 8. Centrado de Pivote del Modelo 3D de Kencalo

- **Ajuste de Geometría (`js/3d/kencaloModel.js`):** Se calcula el centro de la caja delimitadora (*Bounding Box*) centrando la geometría en el origen del torso `(0, y, 0)`.
- **Cámara 3D (`js/3d/sceneManager.js`):** Apunta fijamente a `(0, 0, 0)`.
- **Resultado:** Al hacer zoom o rotar la cámara sobre el modelo 3D en la pantalla Companion, la vista gira exactamente sobre el centro del cuerpo de Kencalo y no sobre su cola.

---

## 9. Barra de Herramientas de Pruebas y Debug (`.dev-sim-bar`)

- **Ubicación:** Flotante en la zona inferior de la vista Cámara / AR.
- **Botones de Simulación:**
  - **Simular Árbol A:** Desencadena la aparición de Kencalo en AR.
  - **Simular Árbol B:** Simula la lectura del marcador B y desbloquea prendas.
  - **Reiniciar Progreso (`#btn-sim-reset`):** Botón de debug con tinte de advertencia rojo sutil que restablece todo el estado local (`localStorage`), borra Kencalos capturados, bloquea prendas y notifica el reinicio mediante un mensaje Toast.

---

## 10. Pantalla de Bienvenida (Splash Screen & Temporizadores)

- **Transición Automática por Temporizadores:** La pantalla de bienvenida transiciona automáticamente del Paso 1 ("Hebra") al Paso 2 ("KENOSIS") y luego hacia la aplicación principal basándose en temporizadores configurables en milisegundos.
- **Configuración en `js/app.js` (`SPLASH_CONFIG`):**
  ```javascript
  const SPLASH_CONFIG = {
    STEP_1_DURATION: 2500, // Tiempo en ms para el Paso 1 ("Hebra")
    STEP_2_DURATION: 2500, // Tiempo en ms para el Paso 2 ("KENOSIS")
    ALLOW_CLICK_SKIP: true  // Si es true, permite tocar/clickear para avanzar antes de tiempo
  };
  ```
- **Dilatación de Tinta WebGL:** Durante el cambio automático de pantalla, se activa la animación física de sangrado de tinta en los títulos y el vector de fondo.

---

## 11. Traductor de Glifos (`js/ui/glyphTranslator.js`) — Fase 3

- **Ubicación:** Pestaña **Hebra (Transmedia)**, primer módulo colapsable (`#card-glyph-translator`).
- **Sistema de Glifos:** 12 glifos vectoriales recortados en formato SVG (`assets/glifos/image-Photoroom (15)-Photoroom 1.svg` a `12.svg`).
- **Display Interactivo:** Ranuras con efecto vidrio donde se visualizan los glifos pulsados con micro-animaciones `popIn`, opción de eliminación individual, botón de borrado (`⌫`) y limpieza total.
- **Teclado de Glifos (`.glyph-keypad-grid`):** Grid responsivo de botones circulares/píldora con efecto Glass Figma, elevación táctil y audio Web Audio API pentatónico (`soundManager.playGlyphTap()`).
- **Lógica de Decodificación y Pistas:** Al ingresar y sintonizar la combinación correspondiente a un árbol (ej. `I • VI • XI` para El Bosque, `II • V • VIII` para Plaza San Martín, `III • VII • X` para Plaza Rocha), se revela su coordenada en el mapa de La Plata y se reproduce un acorde celestial ascendente (`soundManager.playDecodeSuccess()`).

---

## 12. Mapa Vectorial de la Ciudad de La Plata (`js/ui/cityMap.js`) — Fase 3

- **Ubicación:** Pestaña **Hebra (Transmedia)**, segundo módulo colapsable (`#card-city-map`).
- **Trazado Cartográfico Vectorial SVG:**
  - Circunvalación cuadrada auténtica de la ciudad.
  - Eje cívico monumental (Avenidas 51 y 53) y Avenida 7.
  - Trazado de Diagonales 73 y 74.
  - Pulmones verdes y plazas: **Plaza Moreno** (centro exacto Km 0), **Paseo del Bosque**, **Plaza San Martín**, **Plaza Rocha**, **Plaza Malvinas** y **Parque Saavedra**.
- **Regla de Juego (Niebla de Exploración):** En el mapa únicamente son visibles los árboles cuyas coordenadas fueron descifradas en glifos O cuyo Kencalo ya fue capturado.
- **Marcadores Reactivos con Animaciones:**
  - *Árboles Revelados por Glifos:* Emite onda de radar cian expansiva (`@keyframes radar-pulse`) y badge de coordenada activa.
  - *Árboles con Kencalo Capturado:* Halo verde esmeralda bioluminiscente (`@keyframes captured-pulse`), pin con checkmark `✓` y miniatura del Kencalo obtenido.
- **Tarjeta Emergente de Detalles (`.map-tree-details-popup`):** Al tocar cualquier árbol visible, se despliega una ficha Glassmorphism con coordenadas GPS reales de La Plata, descripción del hito, estado del Kencalo y botón directo para activar la cámara AR.
- **Colección de Kencalos Distintos:** Cada árbol escaneado en la ciudad otorga siempre un Kencalo con textura distinta a la colección del usuario.

---
*Documento actualizado y alineado con las Fases 1, 2 y 3 del proyecto WebHebra.*
