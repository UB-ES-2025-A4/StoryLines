# Sistema de Personalización - Documentación Técnica

## Almacenamiento LocalStorage

### user_balance
**Key**: `user_balance`
**Tipo**: Number
**Ejemplo**: `5000`
**Descripción**: Balance de monedas virtuales del usuario

### purchased_items
**Key**: `purchased_items`
**Tipo**: Array de strings (IDs de items)
**Ejemplo**: `["cosmic-globe", "vintage-home-bg", "ocean-profile-bg"]`
**Descripción**: Lista de IDs de items comprados por el usuario

### equipped_items
**Key**: `equipped_items`
**Tipo**: Object
**Estructura**:
```json
{
  "globe": "cosmic-globe",
  "homeBg": "vintage-home-bg",
  "profileBg": "ocean-profile-bg"
}
```
**Descripción**: Items actualmente equipados por tipo

## Estructura de Items en shopThemes.js

### Items de tipo 'globe'
Contienen la propiedad `textureUrl` que es la URL de la textura para el globo 3D.

**Texturas disponibles en globe.gl**:
- `earth-blue-marble.jpg` - Tierra en color real
- `earth-day.jpg` - Tierra durante el día
- `earth-night.jpg` - Tierra de noche con luces de ciudades
- `earth-topology.png` - Topografía terrestre
- `earth-water.png` - Mapa de agua

**Ejemplo**:
```javascript
{
  id: 'cosmic-globe',
  type: 'globe',
  textureUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
}
```

### Items de tipo 'homeBg' y 'profileBg'
Contienen la propiedad `bgUrl` que es la URL de la imagen de fondo.

**Ejemplo**:
```javascript
{
  id: 'cosmic-home-bg',
  type: 'homeBg',
  bgUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80'
}
```

## Cómo Cambiar Texturas del Globo

### En GlobeView.vue

Buscar la línea que contiene `.globeImageUrl()` (aproximadamente línea 698):

```javascript
myGlobe = Globe()(globeEl.value)
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
```

Para usar la textura equipada:

```javascript
import { useCustomization } from '@/composables/useCustomization'
import { getItemById } from '@/data/shopThemes'

// En el setup
const { getEquippedItemByType } = useCustomization()

// En initializeGlobe()
const equippedGlobeId = getEquippedItemByType('globe')
const globeItem = equippedGlobeId ? getItemById(equippedGlobeId) : null
const globeTexture = globeItem?.textureUrl || '//unpkg.com/three-globe/example/img/earth-night.jpg'

myGlobe = Globe()(globeEl.value)
  .globeImageUrl(globeTexture)
```

## Cómo Cambiar Fondos

### En Home.vue
Agregar estilo dinámico en la sección principal:

```vue
<template>
  <div class="home-container" :style="{ backgroundImage: homeBg }">
    <!-- contenido -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCustomization } from '@/composables/useCustomization'
import { getItemById } from '@/data/shopThemes'

const { getEquippedItemByType } = useCustomization()

const homeBg = computed(() => {
  const equippedBgId = getEquippedItemByType('homeBg')
  const bgItem = equippedBgId ? getItemById(equippedBgId) : null
  return bgItem?.bgUrl ? `url(${bgItem.bgUrl})` : 'none'
})
</script>

<style>
.home-container {
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
</style>
```

### En Profile.vue
Mismo patrón pero con 'profileBg':

```javascript
const profileBg = computed(() => {
  const equippedBgId = getEquippedItemByType('profileBg')
  const bgItem = equippedBgId ? getItemById(equippedBgId) : null
  return bgItem?.bgUrl ? `url(${bgItem.bgUrl})` : 'none'
})
```

## Tipos de Texturas Soportadas

### Globe.gl
**Formatos**: JPG, PNG
**Requisitos**:
- Proyección equirectangular (2:1 ratio)
- Recomendado: 2048x1024 o 4096x2048 píxeles
- Mapeo UV estándar de esfera

**Fuentes**:
- NASA Visible Earth
- Natural Earth Data
- OpenStreetMap (procesado)
- three-globe ejemplos (unpkg.com/three-globe/example/img/)

### Fondos CSS
**Formatos**: JPG, PNG, WebP
**Requisitos**:
- Cualquier resolución (recomendado: 1920x1080 o superior)
- Aspect ratio 16:9 para mejor cobertura
- Optimizado para web (compresión adecuada)

## Para el Backend

### Tablas necesarias:

**user_balance**
```sql
CREATE TABLE user_balance (
  user_id UUID PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 5000,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**purchased_items**
```sql
CREATE TABLE purchased_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  purchased_at TIMESTAMP DEFAULT NOW(),
  price INTEGER NOT NULL,
  UNIQUE(user_id, item_id)
);
```

**equipped_items**
```sql
CREATE TABLE equipped_items (
  user_id UUID PRIMARY KEY,
  globe_item_id VARCHAR(100),
  home_bg_item_id VARCHAR(100),
  profile_bg_item_id VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Endpoints necesarios:

- `GET /api/shop/balance` - Obtener balance del usuario
- `POST /api/shop/balance/add` - Recargar balance
- `GET /api/shop/purchased` - Obtener items comprados
- `POST /api/shop/purchase` - Comprar item o theme
- `GET /api/shop/equipped` - Obtener items equipados
- `POST /api/shop/equip` - Equipar un item
- `POST /api/shop/unequip` - Desequipar un item

## Probar en Local

1. Abrir DevTools (F12)
2. Ir a Application > Local Storage
3. Ver las keys:
   - `user_balance`
   - `purchased_items`
   - `equipped_items`

4. Para equipar manualmente un item para testing:
```javascript
localStorage.setItem('equipped_items', JSON.stringify({
  globe: 'cosmic-globe',
  homeBg: 'cosmic-home-bg',
  profileBg: 'cosmic-profile-bg'
}))
```

5. Recargar la página y ver los cambios aplicados
