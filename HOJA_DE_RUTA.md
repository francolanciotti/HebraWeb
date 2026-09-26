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

## 🟡 Fase 2: Calibración y Pruebas WebAR en Entorno Real
> **Estado:** En Curso / Siguiente Fase Próxima 🚀

- [ ] **Pruebas de Marcadores (`targets.mind`):** Evaluación de tasa de detección y estabilidad del Image Tracking bajo diferentes condiciones de luz solar y sombra urbana.
- [ ] **Anclaje Físico sobre Troncos de Árboles:** Ajuste de escala, orientación y oclusión del modelo 3D de Kencalo para que aparezca anclado de forma realista al tronco.
- [ ] **Flujo de Transición AR → Companion:** Animación fluida de captura al tocar a Kencalo sobre la cámara, con efecto de partículas y transferencia directa al visor 3D Companion.
- [ ] **Optimización Rendimiento Móvil:** Asegurar 60 FPS en el renderizado de la cámara y canvas WebGL en iOS (Safari) y Android (Chrome).

---

## 🔵 Fase 3: Expansión del Lore y Sección Transmedia ("Hebra")
> **Estado:** Planificada

- [ ] **Galería Multimedia Transmedia:** Integración de reproductores de audio, galerías fotográficas y cápsulas de video con el universo narrativo Kenosis.
- [ ] **Mapa Interactivo de Árboles Urbanos:** Mapa visual o geolocalizado de la instalación física para guiar al espectador entre los árboles intervenidos en la ciudad.
- [ ] **Secciones Desplegables de Lore:** Ampliación del acordeón interactivo con historias sobre el origen de los Kencalos y la trama de Hebra.

---

## 🟣 Fase 4: Autenticación, Usuarios y Persistencia en la Nube
> **Estado:** Planificada

- [ ] **Evolución del Sistema de Tokens:** Transición del código de respaldo local a un sistema de Login ligero (Firebase / Supabase / Backend REST).
- [ ] **Sincronización en la Nube:** Guardado automático de indumentarias desbloqueadas, logros y árboles visitados en la cuenta del usuario.
- [ ] **Perfil de Explortador:** Estadísticas de captura, tiempo de interacción y registro histórico.

---

## 🟠 Fase 5: Escenario 3D de Acompañamiento (Companion Habitat)
> **Estado:** Futura

- [ ] **Entorno 3D Interactivo:** Desarrollo de un hábitat/escenario tridimensional completo para Kencalo en la vista Companion (terreno, vegetación, iluminación ambiental).
- [ ] **Física y Partículas:** Efectos de hojas flotantes, partículas de tinta y luz reactiva al mover la cámara.
- [ ] **Interacciones Avanzadas:** Nuevas animaciones de caricias, alimentación, minijuegos y reacciones emocionales de Kencalo.

---

## 🔴 Fase 6: Sistema Multimodelo de Kencalos y Variantes
> **Estado:** Futura

- [ ] **Variantes de Especies Kencalo:** Soporte para cargar diferentes modelos `.glb` con distintas geometrías, patrones de color y comportamientos.
- [ ] **Selector de Compañero:** Sistema de inventario para alternar entre distintos Kencalos capturados en la ciudad.
- [ ] **Eventos Temporales:** Aparición de marcadores AR especiales por tiempo limitado con indumentarias exclusivas.

---
*Hoja de Ruta oficial para el desarrollo del proyecto WebHebra.*
