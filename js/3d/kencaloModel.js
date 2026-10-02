/**
 * KencaloModel - Cargador y gestor de modelos 3D GLB, texturas, indumentos y animaciones
 */

// ============================================================================
// ⚙️ CONFIGURACIÓN DE TAMAÑO Y POSICIÓN (Ajusta los valores aquí)
// ============================================================================

export const KENCALO_CONFIG = {
  baseScale: 2.2,                             // Tamaño general de Kencalo
  pivotOffset: [0, -0.2, -1],               // [X, Y, Z] Punto de pivote/enfoque de cámara (para que al hacer zoom enfoque la cara/torso y no la cola)
  arPositionOffset: [0, 0, 0],          // [X, Y, Z] Posición exclusiva sobre el árbol en la cámara AR
  arRotationOffset: [0, 1, 0.3],              // [X, Y, Z] Rotación exclusiva en la cámara AR
  companionPositionOffset: [0, 0, 0],         // [X, Y, Z] Posición exclusiva en la pantalla 3D Companion
  companionRotationOffset: [0, 0, 0],         // [X, Y, Z] Rotación exclusiva en la pantalla 3D Companion
  animationFadeDuration: 0.35                 // Duración de transición entre animaciones
};

export const OUTFIT_GLB_MAP = {
  'outfit_corona': {
    path: './assets/models/outfits/IndumentoCorona.glb',
    pos: [0, 0.07, 0],           // [X, Y, Z] Desplazamiento de la Corona
    scale: [1.5, 1.5, 1.5],       // [X, Y, Z] Tamaño multiplicador
    rot: [0, 0, 0]            // [X, Y, Z] Rotación
  },
  'outfit_flor': {
    path: './assets/models/outfits/IndumentoFlor.glb',
    pos: [0, 0.07, 0],           // [X, Y, Z] Desplazamiento de la Flor
    scale: [1.5, 1.5, 1.5],
    rot: [0, 0, 0]
  },
  'outfit_palos': {
    path: './assets/models/outfits/IndumentoPalos.glb',
    pos: [0, 0.07, 0],           // [X, Y, Z] Desplazamiento de los Palos
    scale: [1.5, 1.5, 1.5],
    rot: [0, 0, 0]
  },
  'outfit_reno': {
    path: './assets/models/outfits/IndumentoReno.glb',
    pos: [0, 0.07, 0],           // [X, Y, Z] Desplazamiento de Cuernos Reno
    scale: [1.5, 1.5, 1.5],
    rot: [0, 0, 0]
  },
  'outfit_pet': {
    path: './assets/models/outfits/IndumentoPet.glb',
    pos: [0.35, 0.05, 0],         // [X, Y, Z] Desplazamiento del Pet
    scale: [1.3, 1.3, 1.3],
    rot: [0, 0, 0]
  }
};

const TEXTURES_MAP = {
  'A': './assets/textures/KencalitaTextura1A.png',
  'B': './assets/textures/KencalitaTextura1B.png',
  'C': './assets/textures/KencalitaTextura1C.png',
  'D': './assets/textures/KencalitaTextura1D.png'
};

const ANIMATIONS_MAP = {
  idle: './assets/animations/Kencalitas1_Idle.glb',
  happy: './assets/animations/Kencalitas1_Happy.glb'
};

// ============================================================================

import { SPECIES_REGISTRY, getSpeciesById } from '../config/gameRegistry.js';

export class KencaloModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = {};

    this.isLoadedGLB = false;
    this.mesh = null;
    this.clock = new THREE.Clock();

    // AnimationMixer y acciones de animación
    this.mixer = null;
    this.idleAction = null;
    this.happyAction = null;
    this.isReacting = false;

    this.outfitObjects = {};
    this.currentOutfitId = 'default';
    this.currentSpeciesId = 'libelula';
    this.currentTextureKey = 'A';
    this.reactionTimeout = null;
  }

  /**
   * Carga la criatura base por defecto (compatibilidad hacia atrás)
   */
  loadGLBModel(urlPath, onLoadCallback) {
    this.loadSpecies('libelula', this.currentTextureKey, onLoadCallback);
  }

  cleanupReaction() {
    if (this.reactionTimeout) {
      clearTimeout(this.reactionTimeout);
      this.reactionTimeout = null;
    }
    this.isReacting = false;
  }

  /**
   * Carga dinámicamente cualquier especie del catálogo de Kencalos (Libélula, Burbuja, Tapón, Gatogota, Manitas)
   * Sincroniza la carga de la malla base con sus animaciones Idle y Happy mediante Promise.all
   */
  loadSpecies(speciesId = 'libelula', textureKey = 'A', onLoadCallback = null) {
    if (!window.THREE || !window.THREE.GLTFLoader) return;

    const speciesConfig = getSpeciesById(speciesId);
    this.currentSpeciesId = speciesConfig.id;
    this.currentTextureKey = textureKey || 'A';

    // 1. Limpiar estado de animación anterior para evitar bloqueos
    this.cleanupReaction();
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.idleAction = null;
    this.happyAction = null;

    const loader = new THREE.GLTFLoader();
    const loadPromise = (url) => new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });

    // Cargar en paralelo la criatura base, animación Idle y animación Happy
    Promise.all([
      loadPromise(speciesConfig.modelPath),
      loadPromise(speciesConfig.animations.idle).catch(err => {
        console.warn(`No se pudo cargar animación Idle para ${speciesConfig.name}:`, err);
        return null;
      }),
      loadPromise(speciesConfig.animations.happy).catch(err => {
        console.warn(`No se pudo cargar animación Happy para ${speciesConfig.name}:`, err);
        return null;
      })
    ]).then(([gltfBase, gltfIdle, gltfHappy]) => {
      if (!gltfBase) return;

      console.log(`1. Criatura base [${speciesConfig.name}] cargada con éxito`);
      this.group.clear();

      this.mesh = gltfBase.scene;

      // Bounding Box para calcular el centro real del cuerpo del Kencalo
      const bodyBox = new THREE.Box3();
      this.mesh.traverse((node) => {
        if (node.isMesh) {
          node.geometry.computeBoundingBox();
          bodyBox.expandByObject(node);
        }
      });

      const center = bodyBox.getCenter(new THREE.Vector3());
      const size = bodyBox.getSize(new THREE.Vector3());

      // Centrar la geometría en su punto de pivote exacto
      const pivot = speciesConfig.pivotOffset || KENCALO_CONFIG.pivotOffset || [0, 0, 0];
      this.mesh.position.set(-center.x + pivot[0], -center.y + pivot[1], -center.z + pivot[2]);
      this.mesh.rotation.set(0, 0, 0);

      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const baseScale = speciesConfig.baseScale || KENCALO_CONFIG.baseScale;
        const scaleFactor = baseScale / maxDim;
        this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }

      this.mesh.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      this.group.add(this.mesh);
      this.isLoadedGLB = true;

      // Crear el nuevo mezclador de animaciones vinculado a la criatura base
      this.mixer = new THREE.AnimationMixer(this.mesh);

      // Vincular Idle
      if (gltfIdle && gltfIdle.animations && gltfIdle.animations.length > 0) {
        const idleClip = gltfIdle.animations[0];
        this.idleAction = this.mixer.clipAction(idleClip);
        this.idleAction.play();
        console.log(`2. Animación Idle de [${speciesConfig.name}] vinculada y reproduciéndose`);
      }

      // Vincular Happy
      if (gltfHappy && gltfHappy.animations && gltfHappy.animations.length > 0) {
        const happyClip = gltfHappy.animations[0];
        this.happyAction = this.mixer.clipAction(happyClip);
        this.happyAction.setLoop(THREE.LoopOnce, 1);
        this.happyAction.clampWhenFinished = true;
        console.log(`3. Animación Happy de [${speciesConfig.name}] vinculada correctamente`);
      }

      // Aplicar textura
      this.setTexture(this.currentTextureKey);

      // Cargar indumentos
      this.loadOutfitModels(loader);

      if (onLoadCallback) onLoadCallback();
    }).catch(err => {
      console.warn(`Error al cargar especie ${speciesConfig.name}:`, err);
    });
  }

  /**
   * Carga y posiciona cada indumento 3D preservando sus texturas y materiales propios
   */
  loadOutfitModels(loader) {
    this.outfitObjects = {};
    const speciesConfig = getSpeciesById(this.currentSpeciesId);
    const anchor = speciesConfig?.hatAnchor || { pos: [0, 0.07, 0], scale: [1.5, 1.5, 1.5], rot: [0, 0, 0] };

    Object.entries(OUTFIT_GLB_MAP).forEach(([outfitId, config]) => {
      loader.load(
        config.path,
        (gltf) => {
          const outfitScene = gltf.scene;

          outfitScene.traverse((child) => {
            if (child.isMesh) {
              child.userData.isOutfit = true;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Calibración independiente: toma los valores del registro de la especie actual (con soporte de custom override)
          const custom = anchor.custom?.[outfitId];
          const finalPos = custom?.pos || anchor.pos || config.pos || [0, 0, 0];
          const finalScale = custom?.scale || anchor.scale || config.scale || [1, 1, 1];
          const finalRot = custom?.rot || anchor.rot || config.rot || [0, 0, 0];

          outfitScene.position.set(finalPos[0], finalPos[1], finalPos[2]);
          outfitScene.scale.set(finalScale[0], finalScale[1], finalScale[2]);
          outfitScene.rotation.set(finalRot[0], finalRot[1], finalRot[2]);

          outfitScene.visible = (this.currentOutfitId === outfitId);

          if (this.mesh) {
            this.mesh.add(outfitScene);
            this.mesh.updateMatrixWorld(true);

            // Vincular al hueso de la cabeza para que siga todas las animaciones (Idle y Happy)
            const hatBone = this.mesh.getObjectByName('HuesoSombrero') || this.mesh.getObjectByName('Cabeza') || this.mesh.getObjectByName('Head');
            if (hatBone) {
              hatBone.updateMatrixWorld(true);
              hatBone.attach(outfitScene);
            }
          } else {
            this.group.add(outfitScene);
          }

          this.outfitObjects[outfitId] = outfitScene;
        },
        undefined,
        (err) => {
          console.warn(`Error al cargar indumento ${outfitId}:`, err);
        }
      );
    });
  }

  setTexture(texKey) {
    this.currentTextureKey = texKey || 'A';
    const speciesConfig = getSpeciesById(this.currentSpeciesId);
    const path = speciesConfig.textures[this.currentTextureKey] || speciesConfig.textures['A'];
    const cacheKey = `${speciesConfig.id}_${this.currentTextureKey}`;

    if (this.loadedTextures[cacheKey]) {
      this.applyTextureToMesh(this.loadedTextures[cacheKey]);
    } else {
      this.textureLoader.load(path, (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = false;
        this.loadedTextures[cacheKey] = texture;
        this.applyTextureToMesh(texture);
      });
    }
  }

  applyTextureToMesh(texture) {
    if (!this.mesh) return;

    this.mesh.traverse((node) => {
      if (node.isMesh && node.material && !node.userData.isOutfit) {
        if (Array.isArray(node.material)) {
          node.material.forEach(mat => {
            mat.map = texture;
            mat.needsUpdate = true;
          });
        } else {
          node.material.map = texture;
          node.material.needsUpdate = true;
        }
      }
    });
  }

  setOutfit(outfitId) {
    this.currentOutfitId = outfitId;

    Object.keys(this.outfitObjects).forEach(id => {
      if (this.outfitObjects[id]) {
        this.outfitObjects[id].visible = (id === outfitId);
      }
    });
  }

  parseRotation(rotArray) {
    const rot = rotArray || [0, 0, 0];
    return rot.map(v => (Math.abs(v) > 6.28318 ? v * (Math.PI / 180) : v));
  }

  applyARTransform() {
    if (!this.group) return;
    const pos = KENCALO_CONFIG.arPositionOffset || [0, -0.2, -1];
    const rot = this.parseRotation(KENCALO_CONFIG.arRotationOffset);
    this.group.position.set(pos[0], pos[1], pos[2]);
    this.group.rotation.set(rot[0], rot[1], rot[2]);
    this.group.scale.set(1, 1, 1);
  }

  applyCompanionTransform() {
    if (!this.group) return;
    const pos = KENCALO_CONFIG.companionPositionOffset || [0, 0, 0];
    const rot = this.parseRotation(KENCALO_CONFIG.companionRotationOffset);
    this.group.position.set(pos[0], pos[1], pos[2]);
    this.group.rotation.set(rot[0], rot[1], rot[2]);
    this.group.scale.set(1, 1, 1);
  }

  /**
   * Dispara la animación Happy con transición suave (crossfade) y vuelve a Idle de forma 100% robusta
   */
  triggerTouchReaction() {
    if (!this.happyAction || !this.mixer) return;
    if (this.isReacting) return; // Evita disparos repetidos mientras reacciona

    this.isReacting = true;
    const fadeDuration = KENCALO_CONFIG.animationFadeDuration || 0.35;
    const happyClip = this.happyAction.getClip();
    const clipDuration = (happyClip && happyClip.duration > 0) ? happyClip.duration : 1.5;

    // Transición suave: atenúa Idle e ingresa Happy
    if (this.idleAction) {
      this.idleAction.fadeOut(fadeDuration);
    }

    this.happyAction.reset();
    this.happyAction.paused = false;
    this.happyAction.setLoop(THREE.LoopOnce, 1);
    this.happyAction.clampWhenFinished = true;
    this.happyAction
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(fadeDuration)
      .play();

    // Limpiar cualquier temporizador previo
    if (this.reactionTimeout) {
      clearTimeout(this.reactionTimeout);
      this.reactionTimeout = null;
    }

    // Temporizador principal garantizado para volver a Idle antes de que termine el clip
    const returnDelayMs = Math.max(200, (clipDuration - fadeDuration) * 1000);
    this.reactionTimeout = setTimeout(() => {
      if (this.happyAction) {
        this.happyAction.fadeOut(fadeDuration);
      }

      if (this.idleAction) {
        this.idleAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(fadeDuration)
          .play();
      }

      // Liberar la bandera de reacción
      this.reactionTimeout = setTimeout(() => {
        this.isReacting = false;
        this.reactionTimeout = null;
      }, fadeDuration * 1000);
    }, returnDelayMs);
  }

  update(time) {
    // Actualizar animación del mezclador con delta de tiempo
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }
  }

  getInteractiveMesh() {
    return this.mesh || this.group;
  }
}
