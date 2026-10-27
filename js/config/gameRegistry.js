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
    description: 'Espíritu etéreo de alas vibrantes que danza al compás del viento.'
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
    description: 'Espíritu rítmico cuyos movimientos acompasan las corrientes místicas.'
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
    description: 'Criatura flotante y serena.'
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
    description: 'Guardián compacto y curioso.'
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
    description: 'Astuto y ágil; suele jugar entre los reflejos de lluvia.'
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
    baseScale: 2,
    pivotOffset: [0, -0.3, -0],
    hatAnchor: {
      pos: [0, 0.28, 0.04],          // [X, Y, Z] Calibración de sombreros en Manitas
      scale: [1.5, 1.5, 1.5],
      rot: [0.4, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Espíritu acogedor.'
  },

  rino: {
    id: 'rino',
    name: 'Rino',
    modelPath: './assets/species/rino/Kencalitas7.glb',
    textures: {
      'A': './assets/species/rino/KencalitaTextura7A.png',
      'B': './assets/species/rino/KencalitaTextura7B.png',
      'C': './assets/species/rino/KencalitaTextura7C.png',
      'D': './assets/species/rino/KencalitaTextura7D.png'
    },
    animations: {
      idle: './assets/species/rino/Kencalitas7_Idle.glb',
      happy: './assets/species/rino/Kencalitas7_Happy.glb'
    },
    baseScale: 2.2,
    pivotOffset: [0, 0.1, -1],
    hatAnchor: {
      pos: [0, 0.23, 0],          // [X, Y, Z] Calibración de sombreros en Rino
      scale: [1.4, 1.4, 1.4],
      rot: [0.3, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Espíritu noble y firme que custodia las raíces con serenidad.'
  },

  pajaro: {
    id: 'pajaro',
    name: 'Pájaro',
    modelPath: './assets/species/pajaro/Kencalitas8.glb',
    textures: {
      'A': './assets/species/pajaro/KencalitaTextura8A.png',
      'B': './assets/species/pajaro/KencalitaTextura8B.png',
      'C': './assets/species/pajaro/KencalitaTextura8C.png',
      'D': './assets/species/pajaro/KencalitaTextura8D.png'
    },
    animations: {
      idle: './assets/species/pajaro/Kencalitas8_Idle.glb',
      happy: './assets/species/pajaro/Kencalitas8_Happy.glb'
    },
    baseScale: 2,
    pivotOffset: [0, -0.1, -0.7],
    hatAnchor: {
      pos: [0, 1.49, 0.24],          // [X, Y, Z] Calibración de sombreros en Pájaro
      scale: [1.3, 1.3, 1.3],
      rot: [0.3, 0, 0],
      custom: {
        'outfit_pet': { pos: [0.35, 0.05, 0], scale: [1.3, 1.3, 1.3], rot: [0, 0, 0] }
      }
    },
    description: 'Espíritu veloz y curioso.'
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
    zone: '',
    address: 'Av. 1 y Av. 53',
    coords: "34°54'34\"S 57°56'02\"W",
    mapCoords: { x: 200, y: 118 }, // Coordenadas en el mapa SVG 356x478 (El Bosque)
    glyphSequence: [1, 2, 4, 12],
    glyphHint: 'Donde el verde se abre a los astros',
    description: '',
    targetIndex: 0
  },
  {
    id: 'tree_b',
    code: 'B',
    type: 'tree',
    name: 'Plaza San Martín',
    companionTitle: 'de Plaza San Martín',
    zone: '',
    address: 'Av. 51 y Calle 4',
    coords: "34°54'57\"S 57°56'48\"W",
    mapCoords: { x: 113, y: 180 }, // Coordenadas en el mapa SVG 356x478 (Plaza San Martín)
    glyphSequence: [6, 5, 3, 11],
    glyphHint: 'Bajo las sombras del eje',
    description: '',
    targetIndex: 1
  },
  {
    id: 'tree_c',
    code: 'C',
    type: 'tree',
    name: 'Sede Fonseca',
    companionTitle: 'de Sede Fonseca', // -> "Kencalo de Plaza Rocha"
    zone: '',
    address: 'Diag. 78 y Calle 62',
    coords: "34°55'42\"S 57°56'30\"W",
    mapCoords: { x: 189, y: 408 }, // Coordenadas en el mapa SVG 356x478 (Plaza Rocha)
    glyphSequence: [8, 10, 9, 7],
    glyphHint: 'La diagonal que converge hacia la cueva',
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
  return loc?.speciesId ? getSpeciesById(loc.speciesId) : null;
}

/**
 * Devuelve el título con la preposición gramatical correcta (ej: "Kencalo del Bosque")
 */
export function getKencaloFullName(treeId) {
  const loc = getLocationById(treeId);
  const title = loc?.companionTitle || (loc?.name ? `de ${loc.name}` : '');
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
    description: loc.description
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
      coords: loc.coords
    };
  });
  return map;
}

// ============================================================================
// 4. CONFIGURACIÓN DEL EVENTO EXCLUSIVO (PERSONALIZABLE)
// ============================================================================
export const EVENT_INVITATION_CONFIG = {
  // Tiempo de espera para apreciar al Kencalo tras cerrar la Polaroid antes de que salte el cartel (en ms)
  postCaptureDelayMs: 7000, // 10 segundos (10000 ms)

  // Textos y Encabezado de la Ventana
  badgeText: '✦ TRILOGÍA COMPLETADA',
  title: '¡Felicitaciones!',
  subtitle: 'Has capturado a tus 3 Kencalos',

  // Datos del Evento Personalizado
  eventName: 'Encuentro Transmedia Hebra',
  eventDescription: 'Capturaste tus tres espíritus desifrando los glifos y sintonizado con cada Kencalo. Ellos te guiaron a una nueva experiencia exclusiva.',
  eventDate: 'Sábado 21 de Noviembre • 18:00 hs',
  eventLocation: 'Gruta del Bosque.',
  eventAccessNote: 'Presenta esta aplicación con los 3 Kencalos en el acceso.',

  // Marcador en el Mapa SVG de La Plata (CityMapUI)
  mapPin: {
    x: 290,
    y: 150, // Coordenadas en el mapa SVG (356x478)
    label: '✦ Evento ✦',
    badgeText: 'Acceso Exclusivo'
  }
};

// ============================================================================
// 5. CRONOGRAMA DIARIO DE ÁRBOLES (ZONA HORARIA ARGENTINA ART / UTC-3)
// ============================================================================

/**
 * Calendario de activación de árboles por fecha (Horario oficial de Argentina ART / UTC-3).
 * Formato: 'AAAA-MM-DD'
 * Edita estas fechas según los días en que actives cada árbol.
 */
export const TREE_DAILY_SCHEDULE = {
  '2026-10-29': 'tree_a', // El Bosque
  '2026-10-30': 'tree_b', // Plaza San Martín
  '2026-10-31': 'tree_c', // Plaza Rocha
};

/**
 * Obtiene la fecha actual en formato 'AAAA-MM-DD' bajo la zona horaria oficial de Argentina,
 * garantizando que funcione idéntico sin importar la zona horaria configurada en el teléfono del usuario.
 */
export function getTodayArgentinaDate() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch (e) {
    // Fallback estándar si el navegador no soporta IANA timezones
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const artDate = new Date(utcTime - (3 * 3600000));
    const year = artDate.getFullYear();
    const month = String(artDate.getMonth() + 1).padStart(2, '0');
    const day = String(artDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Determina cuál es el árbol activo correspondiente a la fecha actual de Argentina.
 */
export function getActiveTreeForToday() {
  const todayStr = getTodayArgentinaDate();
  const treeId = TREE_DAILY_SCHEDULE[todayStr] || 'tree_a';
  return getLocationById(treeId);
}
