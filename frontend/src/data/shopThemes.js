export const themes = [
  {
    id: 'cosmic-explorer',
    name: 'Cosmic Explorer',
    description: 'Explora las profundidades del espacio',
    price: 2400,
    featured: true,
    items: [
      {
        id: 'cosmic-globe',
        themeId: 'cosmic-explorer',
        name: 'Globo Cósmico',
        description: 'Nebulosas y estrellas',
        type: 'globe',
        price: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800'
      },
      {
        id: 'cosmic-home-bg',
        themeId: 'cosmic-explorer',
        name: 'Fondo Home Espacial',
        description: 'Galaxias infinitas',
        type: 'homeBg',
        price: 800,
        imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800'
      },
      {
        id: 'cosmic-profile-bg',
        themeId: 'cosmic-explorer',
        name: 'Fondo Perfil Cósmico',
        description: 'Constelaciones brillantes',
        type: 'profileBg',
        price: 600,
        imageUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800'
      }
    ]
  },
  {
    id: 'vintage-traveler',
    name: 'Vintage Traveler',
    description: 'Viaja con estilo retro',
    price: 2400,
    featured: false,
    items: [
      {
        id: 'vintage-globe',
        themeId: 'vintage-traveler',
        name: 'Globo Vintage',
        description: 'Mapa antiguo',
        type: 'globe',
        price: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800'
      },
      {
        id: 'vintage-home-bg',
        themeId: 'vintage-traveler',
        name: 'Fondo Home Retro',
        description: 'Postales antiguas',
        type: 'homeBg',
        price: 800,
        imageUrl: 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=800'
      },
      {
        id: 'vintage-profile-bg',
        themeId: 'vintage-traveler',
        name: 'Fondo Perfil Vintage',
        description: 'Papel envejecido',
        type: 'profileBg',
        price: 600,
        imageUrl: 'https://images.unsplash.com/photo-1509255929945-586a420363cf?w=800'
      }
    ]
  },
  {
    id: 'neon-dreams',
    name: 'Neon Dreams',
    description: 'Vibra con luces neón',
    price: 2400,
    featured: false,
    items: [
      {
        id: 'neon-globe',
        themeId: 'neon-dreams',
        name: 'Globo Neón',
        description: 'Luces de ciudad',
        type: 'globe',
        price: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800'
      },
      {
        id: 'neon-home-bg',
        themeId: 'neon-dreams',
        name: 'Fondo Home Neón',
        description: 'Cyberpunk vibes',
        type: 'homeBg',
        price: 800,
        imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800'
      },
      {
        id: 'neon-profile-bg',
        themeId: 'neon-dreams',
        name: 'Fondo Perfil Neón',
        description: 'Colores vibrantes',
        type: 'profileBg',
        price: 600,
        imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800'
      }
    ]
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    description: 'Sumérgete en el azul profundo',
    price: 2400,
    featured: false,
    items: [
      {
        id: 'ocean-globe',
        themeId: 'deep-ocean',
        name: 'Globo Oceánico',
        description: 'Aguas cristalinas',
        type: 'globe',
        price: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
      },
      {
        id: 'ocean-home-bg',
        themeId: 'deep-ocean',
        name: 'Fondo Home Marino',
        description: 'Profundidades azules',
        type: 'homeBg',
        price: 800,
        imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800'
      },
      {
        id: 'ocean-profile-bg',
        themeId: 'deep-ocean',
        name: 'Fondo Perfil Acuático',
        description: 'Olas tranquilas',
        type: 'profileBg',
        price: 600,
        imageUrl: 'https://images.unsplash.com/photo-1484821582734-6c6c9f99a672?w=800'
      }
    ]
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Luces del norte místicas',
    price: 2400,
    featured: false,
    items: [
      {
        id: 'aurora-globe',
        themeId: 'aurora-borealis',
        name: 'Globo Aurora',
        description: 'Luces polares',
        type: 'globe',
        price: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800'
      },
      {
        id: 'aurora-home-bg',
        themeId: 'aurora-borealis',
        name: 'Fondo Home Aurora',
        description: 'Cielos mágicos',
        type: 'homeBg',
        price: 800,
        imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800'
      },
      {
        id: 'aurora-profile-bg',
        themeId: 'aurora-borealis',
        name: 'Fondo Perfil Aurora',
        description: 'Resplandor místico',
        type: 'profileBg',
        price: 600,
        imageUrl: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800'
      }
    ]
  }
]

export const standaloneItems = [
  {
    id: 'golden-globe',
    themeId: null,
    name: 'Globo Dorado',
    description: 'Elegancia pura',
    type: 'globe',
    price: 800,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800'
  },
  {
    id: 'sunset-bg',
    themeId: null,
    name: 'Fondo Atardecer',
    description: 'Cielos cálidos',
    type: 'homeBg',
    price: 600,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  },
  {
    id: 'mountain-profile',
    themeId: null,
    name: 'Perfil Montañas',
    description: 'Picos majestuosos',
    type: 'profileBg',
    price: 500,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  },
  {
    id: 'city-lights-globe',
    themeId: null,
    name: 'Globo Ciudad',
    description: 'Luces urbanas',
    type: 'globe',
    price: 700,
    imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800'
  },
  {
    id: 'forest-bg',
    themeId: null,
    name: 'Fondo Bosque',
    description: 'Naturaleza verde',
    type: 'homeBg',
    price: 550,
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800'
  },
  {
    id: 'abstract-profile',
    themeId: null,
    name: 'Perfil Abstracto',
    description: 'Arte moderno',
    type: 'profileBg',
    price: 450,
    imageUrl: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800'
  },
  {
    id: 'earth-classic',
    themeId: null,
    name: 'Tierra Clásica',
    description: 'Vista satélite',
    type: 'globe',
    price: 400,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800'
  }
]

export function getThemes() {
  return themes
}

export function getFeaturedTheme() {
  return themes.find(theme => theme.featured) || themes[0]
}

export function getItems() {
  const themeItems = themes.flatMap(theme => theme.items)
  return [...themeItems, ...standaloneItems]
}

export function getItemsByTheme(themeId) {
  const theme = themes.find(t => t.id === themeId)
  return theme ? theme.items : []
}

export function getAdjustedThemePrice(themeId, purchasedItemIds) {
  const theme = themes.find(t => t.id === themeId)
  if (!theme) return 0

  const unpurchasedItems = theme.items.filter(
    item => !purchasedItemIds.includes(item.id)
  )

  if (unpurchasedItems.length === 0) return 0
  if (unpurchasedItems.length === theme.items.length) return theme.price

  return unpurchasedItems.reduce((sum, item) => sum + item.price, 0)
}

export function getItemById(itemId) {
  return getItems().find(item => item.id === itemId)
}

export function getThemeById(themeId) {
  return themes.find(theme => theme.id === themeId)
}
