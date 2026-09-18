# Especificación del Proyecto: Kencalo Web AR & Minijuego Transmedia

## 1. Concepto y Flujo General
- Experiencia transmedia vinculada a una instalación física/urbana.
- El usuario escanea con la cámara del celular un marcador físico (imagen gráfica/textura de sustancia viscosa adherida a un árbol).
- Al reconocer el marcador, aparece en Realidad Aumentada un ser 3D llamado "Kencalo".
- El usuario lo "captura" y pasa a una vista web 2D/3D tipo minijuego (estilo Pou/Tamagotchi) para cuidarlo e interactuar con él.
- Si el usuario encuentra y escanea un segundo árbol (Marcador B), desbloquea indumentaria customizada para el Kencalo.
- La web actúa también como portal transmedia hacia otras obras y piezas artísticas del autor.

## 2. Stack Tecnológico
- **Frontend / Hosting:** HTML5, CSS3, JavaScript plano / modular. Alojado en GitHub Pages (requiere HTTPS para cámara).
- **Motor 3D:** Three.js (manejo de escena, iluminación, render de modelos `.glb` exportados desde Blender).
- **Web AR:** MindAR.js (módulo de Image Tracking integrado sobre Three.js).
- **Marcadores:** 2 targets compilados (`.mind`) basados en patrones gráficos de alto contraste con estética viscosa.

## 3. Persistencia de Datos y Respaldo
- **Estado activo:** `localStorage` del navegador para guardar:
  - `kencaloCaptured` (boolean)
  - `unlockedOutfits` (array de IDs)
  - Parámetros de interacción/estado básico.
- **Sistema de rescate:** Generador y validador de códigos alfanuméricos cortos (tokens) para que el usuario pueda exportar e importar su partida sin depender de base de datos o backend externo.