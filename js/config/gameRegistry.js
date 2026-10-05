/**
 * GameRegistry - Fuente Única de la Verdad para Especies de Kencalos, Árboles y Eventos
 * 
 * Permite personalizar, agregar y reubicar fácilmente:
 * 1. Especies (geometría .glb, texturas, animaciones, offsets)
 * 2. Árboles y puntos en la ciudad (nombre, preposición, coordenadas, especie asignada, glifos)
 * 3. Eventos temporales y marcadores especiales
 */

// ============================================================================
// 1. CATÁLOGO DE ESPECIES DE KENCALOS
// ============================================================================
export const SPECIES_REGISTRY = {
  libelula: {
    id: 'libelula',
    name: 'Libélula',
    modelPath: './assets/species/libelula/Kencalitas1.glb',
    textures: {
      'A': './assets/species/libelula/KencalitaTextura1A.png',
      'B': './assets/species/libelula/KencalitaTextura1B.png',
      'C': './assets/species/libelula/KencalitaTextura1C.png',
      'D': './assets/species/libelula/KencalitaTextura1D.png'
    },
    animations: {
      idle: './assets/species/libelula/Kencalitas1_Idle.glb',
      happy: './assets/species/libelula/Kencalitas1_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, -0.2, -1.3],
    hatAnchor: {
      pos: [0, 0.07, 0.03],          // [X, Y, Z] Calibración de sombreros en Libélula
      scale: [1.5, 1.5, 1.5],
      rot: [0, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, -0.02], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Espíritu grácil y etéreo de alas vibrantes que danza al compás del viento.'
  },

  danzante: {
    id: 'danzante',
    name: 'Danzante',
    modelPath: './assets/species/danzante/Kencalitas2.glb',
    textures: {
      'A': './assets/species/danzante/KencalitaTextura2A.png',
      'B': './assets/species/danzante/KencalitaTextura2B.png',
      'C': './assets/species/danzante/KencalitaTextura2C.png',
      'D': './assets/species/danzante/KencalitaTextura2D.png'
    },
    animations: {
      idle: './assets/species/danzante/Kencalitas2_Idle.glb',
      happy: './assets/species/danzante/Kencalitas2_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, -0.2, -0.8],
    hatAnchor: {
      pos: [0, 0.08, -0.05],          // [X, Y, Z] Calibración de sombreros en Danzante
      scale: [1.2, 1.2, 1.2],
      rot: [0, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Espíritu rítmico y armónico cuyos movimientos acompasan las corrientes místicas.'
  },

  burbuja: {
    id: 'burbuja',
    name: 'Burbuja',
    modelPath: './assets/species/burbuja/Kencalitas3.glb',
    textures: {
      'A': './assets/species/burbuja/KencalitaTextura3A.png',
      'B': './assets/species/burbuja/KencalitaTextura3B.png',
      'C': './assets/species/burbuja/KencalitaTextura3C.png',
      'D': './assets/species/burbuja/KencalitaTextura3D.png'
    },
    animations: {
      idle: './assets/species/burbuja/Kencalitas3_Idle.glb',
      happy: './assets/species/burbuja/Kencalitas3_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, -0.2, -0.5],
    hatAnchor: {
      pos: [0, 0.09, 0.03],          // [X, Y, Z] Calibración de sombreros en Burbuja
      scale: [1.2, 1.2, 1.2],
      rot: [0, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Criatura flotante y serena con reflejos acuáticos que resuenan con la calma.'
  },

  tapon: {
    id: 'tapon',
    name: 'Tapón',
    modelPath: './assets/species/tapon/Kencalitas4.glb',
    textures: {
      'A': './assets/species/tapon/KencalitaTextura4A.png',
      'B': './assets/species/tapon/KencalitaTextura4B.png',
      'C': './assets/species/tapon/KencalitaTextura4C.png',
      'D': './assets/species/tapon/KencalitaTextura4D.png'
    },
    animations: {
      idle: './assets/species/tapon/Kencalitas4_Idle.glb',
      happy: './assets/species/tapon/Kencalitas4_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, -0.7, 0],
    hatAnchor: {
      pos: [0, 0.15, 0],          // [X, Y, Z] Calibración de sombreros en Tapón
      scale: [1.5, 1.5, 1.5],
      rot: [0, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Guardián compacto y curioso que cuida los puntos de conexión telúrica.'
  },

  gatogota: {
    id: 'gatogota',
    name: 'Gatogota',
    modelPath: './assets/species/gatogota/Kencalitas5.glb',
    textures: {
      'A': './assets/species/gatogota/KencalitaTextura5A.png',
      'B': './assets/species/gatogota/KencalitaTextura5B.png',
      'C': './assets/species/gatogota/KencalitaTextura5C.png',
      'D': './assets/species/gatogota/KencalitaTextura5D.png'
    },
    animations: {
      idle: './assets/species/gatogota/Kencalitas5_Idle.glb',
      happy: './assets/species/gatogota/Kencalitas5_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, -0.2, -0.7],
    hatAnchor: {
      pos: [0, 0.21, 0.05],          // [X, Y, Z] Calibración de sombreros en Gatogota
      scale: [1, 1, 1],
      rot: [0.4, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Astuto y ágil con orejitas atentas; suele jugar entre los reflejos de lluvia.'
  },

  manitas: {
    id: 'manitas',
    name: 'Manitas',
    modelPath: './assets/species/manitas/Kencalitas6.glb',
    textures: {
      'A': './assets/species/manitas/KencalitaTextura6A.png',
      'B': './assets/species/manitas/KencalitaTextura6B.png',
      'C': './assets/species/manitas/KencalitaTextura6C.png',
      'D': './assets/species/manitas/KencalitaTextura6D.png'
    },
    animations: {
      idle: './assets/species/manitas/Kencalitas6_Idle.glb',
      happy: './assets/species/manitas/Kencalitas6_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, -0.3, -0],
    hatAnchor: {
      pos: [0, 0.28, 0.04],          // [X, Y, Z] Calibración de sombreros en Manitas
      scale: [1.5, 1.5, 1.5],
      rot: [0.4, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Espíritu acogedor que teje lazos místico-orgánicos entre las ramas centenarias.'
  }
};

// ============================================================================
// 2. REGISTRO DE UBICACIONES Y EVENTOS (FÁCIL DE PERSONALIZAR Y REUBICAR)
// ============================================================================
export const LOCATIONS_REGISTRY = [
  {
    id: 'tree_a',
    code: 'A',
    type: 'tree',
    name: 'El Bosque',
    companionTitle: 'del Bosque', // -> "Kencalo del Bosque"
    speciesId: 'libelula', // Especie asignada a este árbol
    zone: 'Paseo del Bosque • La Plata',
    address: 'Av. Iraola y 120',
    coords: "34°54'34\"S 57°56'02\"W",
    mapCoords: { x: 435, y: 145 }, // Coordenadas en el mapa SVG 525x525
    glyphSequence: [1, 2, 3, 4],
    glyphHint: 'Donde el verde se abre a los astros',
    description: '',
    targetIndex: 0
  },
  {
    id: 'tree_b',
    code: 'B',
    type: 'tree',
    name: 'Plaza San Martín',
    companionTitle: 'de Plaza San Martín', // -> "Kencalo de Plaza San Martín"
    speciesId: 'burbuja', // Especie asignada a este árbol
    zone: 'Eje Monumental • Calle 7 y 50',
    address: 'Av. 7 e/ 50 y 54',
    coords: "34°54'57\"S 57°56'48\"W",
    mapCoords: { x: 125, y: 230 }, // Coordenadas en el mapa SVG 525x525
    glyphSequence: [5, 6, 7, 8],
    glyphHint: 'Bajo las sombras del eje monumental',
    description: '',
    targetIndex: 1
  },
  {
    id: 'tree_c',
    code: 'C',
    type: 'tree',
    name: 'Plaza Rocha',
    companionTitle: 'de Plaza Rocha', // -> "Kencalo de Plaza Rocha"
    speciesId: 'gatogota', // Especie asignada a este árbol
    zone: 'Diagonal 73 y Plaza Rocha',
    address: 'Av. 7 y 60',
    coords: "34°55'42\"S 57°56'30\"W",
    mapCoords: { x: 262.5, y: 393.5 }, // Coordenadas en el mapa SVG 525x525
    glyphSequence: [9, 10, 11, 12],
    glyphHint: 'La diagonal que converge hacia el sur',
    description: '',
    targetIndex: 2
  }
];

// ============================================================================
// 3. MÉTODOS DE CONSULTA Y UTILIDADES
// ============================================================================

export function getLocationById(id) {
  return LOCATIONS_REGISTRY.find(loc => loc.id === id) || LOCATIONS_REGISTRY[0];
}

export function getSpeciesById(speciesId) {
  return SPECIES_REGISTRY[speciesId] || SPECIES_REGISTRY.libelula;
}

export function getSpeciesForTree(treeId) {
  const loc = getLocationById(treeId);
  return getSpeciesById(loc.speciesId);
}

/**
 * Devuelve el título con la preposición gramatical correcta (ej: "Kencalo del Bosque")
 */
export function getKencaloFullName(treeId) {
  const loc = getLocationById(treeId);
  const title = loc.companionTitle || `de ${loc.name}`;
  return `Kencalo ${title}`;
}

/**
 * Datos listos para el mapa de La Plata (CityMapUI)
 */
export function getMapTreesData() {
  return LOCATIONS_REGISTRY.map(loc => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    zone: loc.zone,
    address: loc.address,
    coords: loc.coords,
    x: loc.mapCoords.x,
    y: loc.mapCoords.y,
    description: loc.description,
    speciesName: getSpeciesById(loc.speciesId).name
  }));
}

/**
 * Datos listos para el Traductor de Glifos (GlyphTranslatorUI)
 */
export function getGlyphTreeSecrets() {
  return LOCATIONS_REGISTRY.map(loc => ({
    treeId: loc.id,
    name: loc.name,
    location: loc.zone,
    sequence: loc.glyphSequence,
    hint: loc.glyphHint
  }));
}

/**
 * Datos listos para la Polaroid de Captura (CaptureStoryUI)
 */
export function getPolaroidTreeData() {
  const map = {};
  LOCATIONS_REGISTRY.forEach(loc => {
    map[loc.id] = {
      title: `Árbol de ${loc.name}`,
      companionTitle: loc.companionTitle,
      zone: loc.zone,
      coords: loc.coords,
      speciesName: getSpeciesById(loc.speciesId).name
    };
  });
  return map;
}
