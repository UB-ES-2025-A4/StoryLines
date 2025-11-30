// Items por defecto (ya comprados y equipados)
export const DEFAULT_ITEMS = {
  globe: 'earth-night-globe',
  homeBg: 'space-home-bg',
  profileBg: 'mountain-profile-bg'
}

export const themes = []

export const standaloneItems = [
  // === GLOBOS OFICIALES (globe.gl) ===
  {
    id: 'earth-night-globe',
    name: 'Earth Night',
    description: 'Vista nocturna de la Tierra',
    type: 'globe',
    price: 0,
    imageUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    textureUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    isDefault: true
  },
  {
    id: 'earth-blue-marble-globe',
    name: 'Blue Marble',
    description: 'Tierra con mármol azul',
    type: 'globe',
    price: 500,
    imageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    textureUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
  },
  {
    id: 'earth-dark-globe',
    name: 'Dark Earth',
    description: 'Tierra oscura y misteriosa',
    type: 'globe',
    price: 800,
    imageUrl: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    textureUrl: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg'
  },
  {
    id: 'earth-day-globe',
    name: 'Earth Day',
    description: 'Vista diurna de la Tierra',
    type: 'globe',
    price: 600,
    imageUrl: 'https://unpkg.com/three-globe/example/img/earth-day.jpg',
    textureUrl: 'https://unpkg.com/three-globe/example/img/earth-day.jpg'
  },
  {
    id: 'earth-topology-globe',
    name: 'Topology',
    description: 'Mapa topográfico terrestre',
    type: 'globe',
    price: 700,
    imageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    textureUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png'
  },
  {
    id: 'earth-water-globe',
    name: 'Water World',
    description: 'Planeta agua',
    type: 'globe',
    price: 900,
    imageUrl: 'https://unpkg.com/three-globe/example/img/earth-water.png',
    textureUrl: 'https://unpkg.com/three-globe/example/img/earth-water.png'
  },

  // === GLOBOS CUSTOM (assets locales) ===
  {
    id: 'lava-globe',
    name: 'Lava World',
    description: 'Planeta de lava ardiente',
    type: 'globe',
    price: 1200,
    imageUrl: '/src/assets/globe-textures/lava-globe.png',
    textureUrl: '/src/assets/globe-textures/lava-globe.png'
  },
  {
    id: 'ice-globe',
    name: 'Ice Planet',
    description: 'Mundo congelado',
    type: 'globe',
    price: 1100,
    imageUrl: '/src/assets/globe-textures/ice-globe.png',
    textureUrl: '/src/assets/globe-textures/ice-globe.png'
  },
  {
    id: 'toxic-globe',
    name: 'Toxic World',
    description: 'Planeta tóxico',
    type: 'globe',
    price: 1000,
    imageUrl: '/src/assets/globe-textures/toxic-globe.png',
    textureUrl: '/src/assets/globe-textures/toxic-globe.png'
  },
  {
    id: 'noir-globe',
    name: 'Noir Earth',
    description: 'Tierra en blanco y negro',
    type: 'globe',
    price: 800,
    imageUrl: '/src/assets/globe-textures/noir-globe.png',
    textureUrl: '/src/assets/globe-textures/noir-globe.png'
  },
  {
    id: 'starry-globe',
    name: 'Starry Night',
    description: 'Cielo estrellado',
    type: 'globe',
    price: 950,
    imageUrl: '/src/assets/globe-textures/starry-globe.png',
    textureUrl: '/src/assets/globe-textures/starry-globe.png'
  },
  {
    id: 'wireframe-globe',
    name: 'Wireframe',
    description: 'Estilo wireframe técnico',
    type: 'globe',
    price: 700,
    imageUrl: '/src/assets/globe-textures/wireframe-globe.png',
    textureUrl: '/src/assets/globe-textures/wireframe-globe.png'
  },
  {
    id: 'cartographic-globe',
    name: 'Cartographic',
    description: 'Mapa cartográfico detallado',
    type: 'globe',
    price: 850,
    imageUrl: '/src/assets/globe-textures/cartographic-globe.png',
    textureUrl: '/src/assets/globe-textures/cartographic-globe.png'
  },
  {
    id: 'doodle-globe',
    name: 'Doodle Earth',
    description: 'Estilo dibujado a mano',
    type: 'globe',
    price: 750,
    imageUrl: '/src/assets/globe-textures/doodle-globe.png',
    textureUrl: '/src/assets/globe-textures/doodle-globe.png'
  },
  {
    id: 'euler-globe',
    name: 'Euler Diagram',
    description: 'Diagrama matemático',
    type: 'globe',
    price: 900,
    imageUrl: '/src/assets/globe-textures/euler-globe.png',
    textureUrl: '/src/assets/globe-textures/euler-globe.png'
  },

  // === FONDOS HOME ===
  {
    id: 'space-home-bg',
    name: 'Night Sky',
    description: 'Cielo nocturno estrellado (default)',
    type: 'homeBg',
    price: 0,
    imageUrl: '//unpkg.com/three-globe/example/img/night-sky.png',
    bgUrl: '//unpkg.com/three-globe/example/img/night-sky.png',
    isDefault: true
  },
  {
    id: 'lava-home-bg',
    name: 'Lava Flow',
    description: 'Flujo de lava ardiente',
    type: 'homeBg',
    price: 700,
    imageUrl: '/src/assets/fondo-textures/lava-fondo.png',
    bgUrl: '/src/assets/fondo-textures/lava-fondo.png'
  },

  // === FONDOS PERFIL ===
  {
    id: 'mountain-profile-bg',
    name: 'Mountain View',
    description: 'Vista de montaña por defecto',
    type: 'profileBg',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=800',
    bgUrl: 'https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=1920&q=80',
    isDefault: true
  },
  {
    id: 'cartographic-profile-bg',
    name: 'Cartographic',
    description: 'Mapa antiguo',
    type: 'profileBg',
    price: 550,
    imageUrl: '/src/assets/profile-textures/cartographic-profile.jpg',
    bgUrl: '/src/assets/profile-textures/cartographic-profile.jpg'
  },
  {
    id: 'doodle-profile-bg',
    name: 'Doodle Art',
    description: 'Arte dibujado',
    type: 'profileBg',
    price: 500,
    imageUrl: '/src/assets/profile-textures/doodle-profile.jpg',
    bgUrl: '/src/assets/profile-textures/doodle-profile.jpg'
  },
  {
    id: 'euler-profile-bg',
    name: 'Euler Pattern',
    description: 'Patrón matemático',
    type: 'profileBg',
    price: 600,
    imageUrl: '/src/assets/profile-textures/euler-profile.webp',
    bgUrl: '/src/assets/profile-textures/euler-profile.webp'
  },
  {
    id: 'ice-profile-bg',
    name: 'Ice World',
    description: 'Mundo congelado',
    type: 'profileBg',
    price: 650,
    imageUrl: '/src/assets/profile-textures/ice-profile.jpg',
    bgUrl: '/src/assets/profile-textures/ice-profile.jpg'
  },
  {
    id: 'lava-profile-bg',
    name: 'Lava Flow',
    description: 'Flujo de lava',
    type: 'profileBg',
    price: 700,
    imageUrl: '/src/assets/profile-textures/profile-lava.avif',
    bgUrl: '/src/assets/profile-textures/profile-lava.avif'
  },
  {
    id: 'toxic-profile-bg',
    name: 'Toxic Zone',
    description: 'Zona tóxica',
    type: 'profileBg',
    price: 550,
    imageUrl: '/src/assets/profile-textures/toxic-profile.jpg',
    bgUrl: '/src/assets/profile-textures/toxic-profile.jpg'
  }
]

// Funciones de utilidad
export function getThemes() {
  return themes
}

export function getFeaturedTheme() {
  return null // No hay featured theme ahora
}

export async function getItems() {
  const res = await fetch('/api/shop/items')
  const data = await res.json()
  if (!data.ok) {
    throw new Error(data.error || 'Error loading items')
  }
  return data.items
}

export async function getItemById(itemId) {
  const res = await fetch(`/api/shop/items/${itemId}`)
  const data = await res.json()
  if (!data.ok) {
    throw new Error(data.error || 'Error loading item')
  }
  return data.item
}

export function getItemsByTheme(themeId) {
  return []
}

export function getAdjustedThemePrice(themeId, purchasedItemIds) {
  return 0
}

export function getThemeById(themeId) {
  return themes.find(theme => theme.id === themeId)
}
