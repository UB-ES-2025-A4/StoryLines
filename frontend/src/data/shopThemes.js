// shopThemes.js - Datos dummy de themes e items para la tienda

// Themes completos con sus 3 items
const themes = [
  {
    id: 'theme-cosmic',
    name: 'Cosmic Explorer',
    description: 'Explora el universo con este set espacial completo',
    price: 2400, // Bundle price (3 items × 1000 - 20% descuento)
    featured: true,
    category: 'space',
    items: ['globe-cosmic', 'home-cosmic', 'profile-cosmic']
  },
  {
    id: 'theme-vintage',
    name: 'Vintage Traveler',
    description: 'Un toque nostálgico y elegante para tus viajes',
    price: 2400,
    featured: false,
    category: 'classic',
    items: ['globe-vintage', 'home-vintage', 'profile-vintage']
  },
  {
    id: 'theme-neon',
    name: 'Neon Dreams',
    description: 'Colores vibrantes y estilo futurista',
    price: 2400,
    featured: false,
    category: 'modern',
    items: ['globe-neon', 'home-neon', 'profile-neon']
  },
  {
    id: 'theme-ocean',
    name: 'Deep Ocean',
    description: 'Sumérgete en las profundidades del océano',
    price: 2400,
    featured: false,
    category: 'nature',
    items: ['globe-ocean', 'home-ocean', 'profile-ocean']
  },
  {
    id: 'theme-aurora',
    name: 'Aurora Borealis',
    description: 'Colores mágicos del norte',
    price: 2400,
    featured: false,
    category: 'nature',
    items: ['globe-aurora', 'home-aurora', 'profile-aurora']
  }
]

// Items individuales (todos los del theme + algunos sueltos)
const items = [
  // THEME COSMIC EXPLORER
  {
    id: 'globe-cosmic',
    type: 'globe',
    name: 'Globo Galáctico',
    description: 'Tierra rodeada de estrellas brillantes',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg', // Default por ahora
    themeId: 'theme-cosmic'
  },
  {
    id: 'home-cosmic',
    type: 'homeBg',
    name: 'Nebulosa Espacial',
    description: 'Fondo de nebulosa colorida para tu Home',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=1080&fit=crop',
    themeId: 'theme-cosmic'
  },
  {
    id: 'profile-cosmic',
    type: 'profileBg',
    name: 'Galaxia Espiral',
    description: 'Fondo de galaxia para tu Perfil',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&h=1080&fit=crop',
    themeId: 'theme-cosmic'
  },

  // THEME VINTAGE TRAVELER
  {
    id: 'globe-vintage',
    type: 'globe',
    name: 'Globo Antiguo',
    description: 'Mapa vintage estilo siglo XVIII',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    themeId: 'theme-vintage'
  },
  {
    id: 'home-vintage',
    type: 'homeBg',
    name: 'Pergamino Clásico',
    description: 'Fondo de papel antiguo para Home',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1920&h=1080&fit=crop',
    themeId: 'theme-vintage'
  },
  {
    id: 'profile-vintage',
    type: 'profileBg',
    name: 'Brújula Retro',
    description: 'Fondo con brújula vintage para Perfil',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1552799446-159ba9523315?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1552799446-159ba9523315?w=1920&h=1080&fit=crop',
    themeId: 'theme-vintage'
  },

  // THEME NEON DREAMS
  {
    id: 'globe-neon',
    type: 'globe',
    name: 'Globo Cyberpunk',
    description: 'Tierra con luces de neón',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    themeId: 'theme-neon'
  },
  {
    id: 'home-neon',
    type: 'homeBg',
    name: 'Ciudad Neón',
    description: 'Fondo futurista con luces de neón para Home',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop',
    themeId: 'theme-neon'
  },
  {
    id: 'profile-neon',
    type: 'profileBg',
    name: 'Vaporwave Grid',
    description: 'Grid retro-futurista para Perfil',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=1920&h=1080&fit=crop',
    themeId: 'theme-neon'
  },

  // THEME DEEP OCEAN
  {
    id: 'globe-ocean',
    type: 'globe',
    name: 'Globo Oceánico',
    description: 'Planeta agua en tonos azules',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    themeId: 'theme-ocean'
  },
  {
    id: 'home-ocean',
    type: 'homeBg',
    name: 'Profundidades Marinas',
    description: 'Fondo submarino para Home',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
    themeId: 'theme-ocean'
  },
  {
    id: 'profile-ocean',
    type: 'profileBg',
    name: 'Olas Tranquilas',
    description: 'Superficie del océano para Perfil',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&h=1080&fit=crop',
    themeId: 'theme-ocean'
  },

  // THEME AURORA BOREALIS
  {
    id: 'globe-aurora',
    type: 'globe',
    name: 'Globo Polar',
    description: 'Tierra con auroras boreales',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    themeId: 'theme-aurora'
  },
  {
    id: 'home-aurora',
    type: 'homeBg',
    name: 'Luces del Norte',
    description: 'Aurora boreal para Home',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1920&h=1080&fit=crop',
    themeId: 'theme-aurora'
  },
  {
    id: 'profile-aurora',
    type: 'profileBg',
    name: 'Cielo Mágico',
    description: 'Colores de aurora para Perfil',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&h=1080&fit=crop',
    themeId: 'theme-aurora'
  },

  // ITEMS SUELTOS (no pertenecen a ningún theme completo)
  {
    id: 'globe-realistic',
    type: 'globe',
    name: 'Tierra Realista',
    description: 'Fotografía satelital de alta resolución',
    price: 800,
    imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
    themeId: null
  },
  {
    id: 'globe-minimalist',
    type: 'globe',
    name: 'Globo Minimalista',
    description: 'Diseño simple y elegante',
    price: 600,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
    textureUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    themeId: null
  },
  {
    id: 'home-sunset',
    type: 'homeBg',
    name: 'Atardecer Tropical',
    description: 'Playa al atardecer para Home',
    price: 700,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop',
    themeId: null
  },
  {
    id: 'home-mountains',
    type: 'homeBg',
    name: 'Montañas Nevadas',
    description: 'Paisaje de montaña para Home',
    price: 700,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    themeId: null
  },
  {
    id: 'profile-geometric',
    type: 'profileBg',
    name: 'Patrón Geométrico',
    description: 'Diseño abstracto geométrico para Perfil',
    price: 500,
    imageUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&h=1080&fit=crop',
    themeId: null
  },
  {
    id: 'profile-gradient',
    type: 'profileBg',
    name: 'Gradiente Suave',
    description: 'Colores degradados elegantes para Perfil',
    price: 400,
    imageUrl: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1920&h=1080&fit=crop',
    themeId: null
  },
  {
    id: 'profile-stars',
    type: 'profileBg',
    name: 'Cielo Estrellado',
    description: 'Noche estrellada para Perfil',
    price: 600,
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop',
    backgroundUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&h=1080&fit=crop',
    themeId: null
  }
]

// Funciones de utilidad

/**
 * Obtener todos los themes
 * @returns {Array} Array de themes
 */
export function getThemes() {
  return themes
}

/**
 * Obtener un theme por ID
 * @param {string} themeId - ID del theme
 * @returns {Object|null} Theme o null si no existe
 */
export function getThemeById(themeId) {
  return themes.find(theme => theme.id === themeId) || null
}

/**
 * Obtener el theme destacado (featured)
 * @returns {Object|null} Theme destacado o null
 */
export function getFeaturedTheme() {
  return themes.find(theme => theme.featured) || null
}

/**
 * Obtener todos los items
 * @returns {Array} Array de items
 */
export function getItems() {
  return items
}

/**
 * Obtener un item por ID
 * @param {string} itemId - ID del item
 * @returns {Object|null} Item o null si no existe
 */
export function getItemById(itemId) {
  return items.find(item => item.id === itemId) || null
}

/**
 * Obtener items por tipo
 * @param {string} type - Tipo de item: 'globe', 'homeBg', 'profileBg'
 * @returns {Array} Array de items del tipo especificado
 */
export function getItemsByType(type) {
  return items.filter(item => item.type === type)
}

/**
 * Obtener items de un theme específico
 * @param {string} themeId - ID del theme
 * @returns {Array} Array de items del theme
 */
export function getItemsByTheme(themeId) {
  return items.filter(item => item.themeId === themeId)
}

/**
 * Obtener items sueltos (sin theme)
 * @returns {Array} Array de items sin theme
 */
export function getStandaloneItems() {
  return items.filter(item => item.themeId === null)
}

/**
 * Calcular precio de theme considerando items ya comprados
 * @param {string} themeId - ID del theme
 * @param {Array} purchasedItemIds - Array de IDs de items ya comprados
 * @returns {number} Precio ajustado del theme
 */
export function getAdjustedThemePrice(themeId, purchasedItemIds = []) {
  const theme = getThemeById(themeId)
  if (!theme) return 0

  const themeItems = getItemsByTheme(themeId)
  const unpurchasedItems = themeItems.filter(item => !purchasedItemIds.includes(item.id))
  
  // Si ya están todos comprados, precio 0
  if (unpurchasedItems.length === 0) return 0
  
  // Si faltan items, calcular precio de los faltantes (sin descuento)
  if (unpurchasedItems.length < themeItems.length) {
    return unpurchasedItems.reduce((total, item) => total + item.price, 0)
  }
  
  // Si no hay ninguno comprado, aplicar descuento del bundle
  return theme.price
}

/**
 * Verificar si un theme está completo en el inventario
 * @param {string} themeId - ID del theme
 * @param {Array} purchasedItemIds - Array de IDs de items comprados
 * @returns {boolean} True si todos los items del theme están comprados
 */
export function isThemeComplete(themeId, purchasedItemIds = []) {
  const themeItems = getItemsByTheme(themeId)
  return themeItems.every(item => purchasedItemIds.includes(item.id))
}

/**
 * Obtener tipos de items disponibles
 * @returns {Array} Array de tipos con labels
 */
export function getItemTypes() {
  return [
    { value: 'all', label: 'Todos' },
    { value: 'globe', label: 'Globos' },
    { value: 'homeBg', label: 'Fondos Home' },
    { value: 'profileBg', label: 'Fondos Perfil' }
  ]
}

export default {
  getThemes,
  getThemeById,
  getFeaturedTheme,
  getItems,
  getItemById,
  getItemsByType,
  getItemsByTheme,
  getStandaloneItems,
  getAdjustedThemePrice,
  isThemeComplete,
  getItemTypes
}
