/**
 * KencaloModel - Cargador y gestor de modelos 3D GLB, texturas, indumentos y animaciones
 */

// ============================================================================
// ⚙️ CONFIGURACIÓN DE TAMAÑO Y POSICIÓN (Ajusta los valores aquí)
// ============================================================================

export const KENCALO_CONFIG = {
  baseScale: 2.2,             // Tamaño de Kencalo (sube a 3.0 para agrandar, baja a 1.5 para achicar)
  positionOffset: [0, -0.2, 0],  // [X, Y, Z] Posición de Kencalo (ej: [0, -0.5, 0] para bajarlo)
  rotationOffset: [0, 0, 0],   // [X, Y, Z] Rotación en radianes (ej: [0, Math.PI, 0] para girar 180°)
  animationFadeDuration: 0.35 // Duración en segundos de la transición suave entre animaciones
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
    this.currentTextureKey = 'A';
  }

  /**
   * Carga la criatura base (kencalo.glb con geometría, textura y esqueleto)
   * y vincula las animaciones independientes (Idle y Happy) según la especificación del animador.
   */
  loadGLBModel(urlPath, onLoadCallback) {
    if (!window.THREE || !window.THREE.GLTFLoader) return;

    const loader = new THREE.GLTFLoader();

    // 1. Cargar la criatura base (Geometría + Textura + Esqueleto)
    loader.load(
      urlPath,
      (gltfBase) => {
        console.log('1. Criatura base Kencalo cargada con éxito');
        this.group.clear();

        this.mesh = gltfBase.scene;

        // Bounding Box para calcular tamaño y centrado inicial
        const box = new THREE.Box3().setFromObject(this.mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.mesh.position.sub(center);
        this.mesh.position.x += KENCALO_CONFIG.positionOffset[0];
        this.mesh.position.y += KENCALO_CONFIG.positionOffset[1];
        this.mesh.position.z += KENCALO_CONFIG.positionOffset[2];

        this.mesh.rotation.x += KENCALO_CONFIG.rotationOffset[0];
        this.mesh.rotation.y += KENCALO_CONFIG.rotationOffset[1];
        this.mesh.rotation.z += KENCALO_CONFIG.rotationOffset[2];

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scaleFactor = KENCALO_CONFIG.baseScale / maxDim;
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

        // Crear el mezclador de animaciones vinculado a la criatura base cargada
        this.mixer = new THREE.AnimationMixer(this.mesh);

        // 2. Cargar el archivo de animación Idle independiente
        loader.load(
          ANIMATIONS_MAP.idle,
          (gltfIdle) => {
            if (gltfIdle.animations && gltfIdle.animations.length > 0) {
              const idleClip = gltfIdle.animations[0];
              this.idleAction = this.mixer.clipAction(idleClip);
              this.idleAction.play();
              console.log('2. Animación Idle vinculada y reproduciéndose');
            }
          },
          undefined,
          (err) => {
            console.warn('No se pudo cargar animación Idle:', err);
          }
        );

        // 3. Cargar el archivo de animación Happy independiente
        loader.load(
          ANIMATIONS_MAP.happy,
          (gltfHappy) => {
            if (gltfHappy.animations && gltfHappy.animations.length > 0) {
              const happyClip = gltfHappy.animations[0];
              this.happyAction = this.mixer.clipAction(happyClip);
              this.happyAction.setLoop(THREE.LoopOnce, 1);
              this.happyAction.clampWhenFinished = true;
              console.log('3. Animación Happy vinculada correctamente');
            }
          },
          undefined,
          (err) => {
            console.warn('No se pudo cargar animación Happy:', err);
          }
        );

        // Aplicar textura a Kencalo
        this.setTexture(this.currentTextureKey);

        // Cargar indumentos (preservando sus texturas y materiales propios)
        this.loadOutfitModels(loader);

        if (onLoadCallback) onLoadCallback();
      },
      undefined,
      (err) => {
        console.warn('Error al cargar la criatura base kencalo.glb:', err);
      }
    );
  }

  /**
   * Carga y posiciona cada indumento 3D preservando sus texturas y materiales propios
   */
  loadOutfitModels(loader) {
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

          outfitScene.position.set(config.pos[0], config.pos[1], config.pos[2]);
          outfitScene.scale.set(config.scale[0], config.scale[1], config.scale[2]);
          if (config.rot) {
            outfitScene.rotation.set(config.rot[0], config.rot[1], config.rot[2]);
          }

          outfitScene.visible = (this.currentOutfitId === outfitId);

          if (this.mesh) {
            this.mesh.add(outfitScene);
            this.mesh.updateMatrixWorld(true);

            // Vincular al hueso de la cabeza para que siga todas las animaciones (Idle y Happy)
            const hatBone = this.mesh.getObjectByName('HuesoSombrero') || this.mesh.getObjectByName('Cabeza');
            if (hatBone) {
              hatBone.updateMatrixWorld(true);
              hatBone.attach(outfitScene);
            }
          } else {
            this.group.add(outfitScene);
          }

          this.outfitObjects[outfitId] = outfitScene;
          console.log(`Indumento 3D cargado y vinculado al esqueleto: ${outfitId}`);
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
    const path = TEXTURES_MAP[this.currentTextureKey] || TEXTURES_MAP['A'];

    if (this.loadedTextures[this.currentTextureKey]) {
      this.applyTextureToMesh(this.loadedTextures[this.currentTextureKey]);
    } else {
      this.textureLoader.load(path, (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = false;
        this.loadedTextures[this.currentTextureKey] = texture;
        this.applyTextureToMesh(texture);
      });
    }
  }

  applyTextureToMesh(texture) {
    if (!this.mesh) return;

    this.mesh.traverse((node) => {
      if (node.isMesh && node.material && !node.userData.isOutfit) {
        node.material.map = texture;
        node.material.needsUpdate = true;
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

  /**
   * Dispara la animación Happy con transición suave (crossfade) y vuelve a Idle
   */
  triggerTouchReaction() {
    if (!this.happyAction || !this.mixer) return;
    if (this.isReacting) return; // Evita disparos repetidos mientras reacciona

    this.isReacting = true;
    const fadeDuration = KENCALO_CONFIG.animationFadeDuration || 0.35;

    // Transición suave: atenúa Idle e ingresa Happy
    if (this.idleAction) {
      this.idleAction.fadeOut(fadeDuration);
    }

    this.happyAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(fadeDuration)
      .play();

    const onFinished = (e) => {
      if (e.action === this.happyAction) {
        this.mixer.removeEventListener('finished', onFinished);

        // Transición suave de retorno: atenúa Happy y recupera Idle
        this.happyAction.fadeOut(fadeDuration);

        if (this.idleAction) {
          this.idleAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(fadeDuration)
            .play();
        }

        setTimeout(() => {
          this.isReacting = false;
        }, fadeDuration * 1000);
      }
    };

    this.mixer.addEventListener('finished', onFinished);
  }

  update(time) {
    // Actualizar animación del mezclador con delta de tiempo
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }

    // Flotación suave y balanceo en el eje X
    const floatY = Math.sin(time * 2.0) * 0.12;
    this.group.position.y = floatY;
    this.group.rotation.y = Math.sin(time * 0.8) * 0.3;
    this.group.rotation.x = Math.sin(time * 1.4) * 0.15;
  }

  getInteractiveMesh() {
    return this.mesh || this.group;
  }
}
