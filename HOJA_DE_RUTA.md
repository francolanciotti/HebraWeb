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

## 🔵 Fase 3: Expansión del Lore y Sección Transmedia ("Hebra")
> **Estado:** Planificada

- [ ] **Traductor de glifos:** Integración de traductor de glifos para desbloquear coordenadas de los árboles.
- [ ] **Mapa Interactivo de Árboles Urbanos:** Mapa visual o geolocalizado de la instalación física para guiar al espectador entre los árboles intervenidos en la ciudad.

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
- [ ] **Física y Partículas:** Efectos de partículas y luz al capturar el kencalo.

---

## 🔴 Fase 6: Sistema Multimodelo de Kencalos y Variantes
> **Estado:** Futura

- [ ] **Variantes de Especies Kencalo:** Soporte para cargar diferentes modelos `.glb` con distintas geometrías, patrones de color y comportamientos.
- [ ] **Selector de Compañero:** Sistema de inventario para alternar entre distintos Kencalos capturados en la ciudad.
- [ ] **Eventos Temporales:** Aparición de marcadores AR especiales por tiempo limitado con indumentarias exclusivas.

---
*Hoja de Ruta oficial para el desarrollo del proyecto WebHebra.*
