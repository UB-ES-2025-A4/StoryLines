# Sprint 1 - Informe de Implementación
## User Story 1.1 y 1.3


---

## Resumen 

Hice sistema completo de visualización de viajes en un globo terrestre 3D interactivo. El sistema permite:
- Visualizar viajes multi-destino en un globo 3D rotatorio
- Interactuar con pins de destinos mediante clicks
- Ver previsualizaciones de viajes con información detallada
- Sistema de highlight para viajes completos al hacer hover
- Posicionamiento inteligente de tooltips según espacio disponible

---


## Implementación Técnica

### 1. Estructura de Datos (dummyTrips.js)

**Diseño alineado con base de datos:**
```javascript
{
  id: number,                    // ID único del viaje
  userId: string,                // ID del usuario propietario
  userName: string,              // Nombre del usuario
  userColor: string,             // Color RGB asignado al usuario
  tripName: string,              // Nombre descriptivo del viaje
  coverImage: string,            // URL de imagen de portada (Unsplash)
  stops: [                       // Array de paradas del viaje
    {
      country: string,
      city: string,
      lat: number,
      lng: number
    }
  ],
  startDate: string,             // Fecha inicio (YYYY-MM-DD)
  endDate: string,               // Fecha fin (YYYY-MM-DD)
  description: string            // Descripción del viaje
}
```

**Funciones auxiliares exportadas:**
- `convertTripsToArcs(trips)`: Convierte array de stops en arcos individuales para renderizado
- `processDestinationsFromTrips(trips)`: Agrega información de destinos con conteo de visitantes

**Dataset actual:** 9 viajes de ejemplo de 3 usuarios (Tiziano, Mireia, Aleix) con destinos internacionales realistas.

- Los datos dummy pueden exportarse como seed data
- Solo necesitan reemplazar `dummyTrips` con fetch de API cuando esté lista

---

### 2. Componente Principal (GlobeView.vue)

**Tecnologías utilizadas:**
- **Globe.GL v2.x**: Librería de visualización 3D basada en Three.js
- **Three.js**: Motor gráfico WebGL para renderizado 3D
- **Vue 3 Composition API**: ref, onMounted, onUnmounted

**Funcionalidades implementadas:**

#### A) Renderizado del Globo 3D
```javascript
initializeGlobe()
```
- Textura realista de la Tierra (earth-night.jpg)
- Rotación automática inicial con transición suave
- Controles orbitales (drag, zoom, rotate)
- Responsive (se adapta al tamaño de ventana)

#### B) Sistema de Arcos (Rutas de Viaje)
```javascript
.arcsData(groupedArcs)
.arcColor(d => [d.userColor, d.userColor])
.arcStroke(0.5)
.arcDashLength(0.4)
.arcDashGap(0.1)
.arcDashAnimateTime(2000)
```

**Características especiales:**
- **Stacking visual:** Cuando múltiples viajes comparten la misma ruta, los arcos se apilan visualmente (max 3 líneas)
  ```javascript
  stackOffset: (index - (maxStacked - 1) / 2) * 0.5
  ```
- **Colores por usuario:** Cada arco hereda el color del usuario que hizo el viaje
- **Animación de dash:** Efecto de línea punteada animada para indicar dirección
- **Hover highlight:** Al pasar el mouse sobre un arco, se resalta el viaje completo (todos sus segmentos + pins)

#### C) Marcadores de Destino (Pins)
```javascript
.htmlElementsData(destinations)
.htmlElement(d => createPinElement(d))
```

**SVG personalizado en forma de teardrop:**
```svg
<svg viewBox="-4 0 36 36">
  <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
  <circle fill="black" cx="14" cy="14" r="7"></circle>
</svg>
```

**Tamaño dinámico basado en popularidad:**
```javascript
calculatePinSize(visitCount) {
  if (visitCount === 1) return 20px
  if (visitCount === 2) return 28px
  if (visitCount === 3) return 34px
  if (visitCount === 4) return 38px
  return 40px  // 5+ visitas
}
```

**Posicionamiento:** `translate(-50%, -100%)` para anclar el pin por su punta inferior

#### D) Sistema de Tooltips Interactivos

**Tooltip del Pin (Click to open):**
```javascript
showTooltip(destination, pinElement)
```
- Se abre/cierra con click en el pin
- Muestra todos los usuarios que visitaron ese destino
- Lista de viajes agrupados por usuario
- Avatares de usuarios (Pravatar.cc)
- Botones clickeables para cada viaje


#### E) Sistema de Preview de Viajes

**Preview Card (Click en nombre de viaje):**
```javascript
showTripPreviewFromTooltip(tripId, tooltipElement)
```

**Contenido:**
- Imagen de portada del viaje (cover image)
- Badge con nombre de usuario y color
- Nombre del viaje
- Fechas (inicio - fin)
- Descripción del viaje
- Botón "Ver Viaje Completo" (placeholder para navegación futura)

**Posicionamiento inteligente:**
```javascript
calculateBestPosition(x, y, width, height, extraSpacing)
```
- Calcula espacio disponible en 4 direcciones (arriba, abajo, izquierda, derecha)
- Prioriza posición vertical (arriba/abajo)
- Fallback a horizontal si no cabe verticalmente
- **Garantiza visibilidad completa:** ajusta posición si se sale de pantalla
- **Margen de seguridad:** 20px en todos los bordes
- **Extra spacing desde tooltip:** +30px adicional cuando se abre desde pin tooltip

#### F) Gestión de Eventos y Estado

**Variables de estado:**
```javascript
activePinTooltip = null       // Pin con tooltip abierto
activeTripPreview = null      // Preview de viaje abierto
hoveredTripId = null          // ID del viaje en hover (para highlight)
```

**Event listeners:**
1. **Click en pin:** Toggle tooltip (abre/cierra)
2. **Click en nombre de viaje:** Abre preview con posicionamiento inteligente
3. **Click en documento (fuera):** Cierra tooltip y preview
4. **Drag/Zoom del globo:** Cierra tooltip y preview
5. **Hover en arco:** Resalta viaje completo (arcos + pins con opacidad)

**Manejo de pointer-events:**
```javascript
// Al abrir tooltip/preview
globeEl.value.style.pointerEvents = 'none'  // Globo no captura eventos

// Al cerrar
globeEl.value.style.pointerEvents = 'auto'  // Globo vuelve a ser interactivo
```

**Función global para callbacks inline:**
```javascript
window.openTripPreview = function(tripId, tooltipElement) {
  showTripPreviewFromTooltip(tripId, tooltipElement)
}
```
Permite usar `onclick="window.openTripPreview(...)"` en HTML generado dinámicamente.

---

### 3. Vista Home (Home.vue)

**Integración con autenticación:**
- GlobeView como componente de fondo
- Header glassmorphism flotante con menú condicional (usuario/invitado)
- Info overlay con leyenda de colores de usuarios
- Sistema de logout integrado con Supabase

**Diseño:**
- Efecto glassmorphism (blur + transparencia)
- Indicadores de color CSS (círculos 12px) en lugar de emojis
- Branding "StoryLines" con navegación

---

## Archivos Creados/Modificados

### Nuevos archivos:
1. **`frontend/src/data/dummyTrips.js`** (338 líneas)
   - Dataset de prueba con estructura de DB
   - Funciones de transformación de datos

2. **`frontend/src/components/Globe/GlobeView.vue`** (610 líneas)
   - Componente principal del globo 3D
   - Toda la lógica de interacción

### Archivos modificados:
3. **`frontend/src/views/Home.vue`**
   - Integración de GlobeView
   - UI overlay con glassmorphism

---

## 🔄 Compatibilidad con Backend

### Estructura de datos DB-ready:

**Tabla `trips` (ready):**
```sql
{
  id: SERIAL PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  trip_name: VARCHAR(255),
  cover_image_url: TEXT,
  start_date: DATE,
  end_date: DATE,
  description: TEXT,
  created_at: TIMESTAMP
}
```

**Tabla `trip_stops` (ready):**
```sql
{
  id: SERIAL PRIMARY KEY,
  trip_id: INTEGER REFERENCES trips(id),
  country: VARCHAR(100),
  city: VARCHAR(100),
  latitude: DECIMAL(10, 8),
  longitude: DECIMAL(11, 8),
  stop_order: INTEGER
}
```

**Tabla `users` (ya existe de Sprint 0):**
```sql
{
  id: UUID PRIMARY KEY,
  username: VARCHAR(50),
  email: VARCHAR(255),
  -- color se puede agregar como: user_color VARCHAR(30)
}
```

### Migración a API (cuando esté lista):

**Paso 1:** Crear endpoint GET `/api/trips`:
```javascript
// Reemplazar esta línea:
import { dummyTrips } from '@/data/dummyTrips.js'

// Por:
const { data: trips } = await supabase
  .from('trips')
  .select(`
    *,
    trip_stops (
      country,
      city,
      latitude,
      longitude,
      stop_order
    ),
    users (
      username,
      user_color
    )
  `)
  .order('trip_stops.stop_order', { foreignTable: 'trip_stops' })
```

**Paso 2:** Transformar respuesta al formato esperado:
```javascript
const formattedTrips = trips.map(trip => ({
  id: trip.id,
  userId: trip.user_id,
  userName: trip.users.username,
  userColor: trip.users.user_color,
  tripName: trip.trip_name,
  coverImage: trip.cover_image_url,
  stops: trip.trip_stops.map(stop => ({
    country: stop.country,
    city: stop.city,
    lat: stop.latitude,
    lng: stop.longitude
  })),
  startDate: trip.start_date,
  endDate: trip.end_date,
  description: trip.description
}))
```

Esto es según el chat, asi que no estoy seguro de si es correcto

---

## Recomendaciones para DB Team (del chat)

### Schema sugerido:

```sql
-- Agregar a tabla users (si no existe)
ALTER TABLE users ADD COLUMN user_color VARCHAR(30) DEFAULT 'rgba(0, 123, 255, 1)';

-- Crear tabla trips
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_name VARCHAR(255) NOT NULL,
  cover_image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla trip_stops
CREATE TABLE trip_stops (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX idx_trip_stops_order ON trip_stops(trip_id, stop_order);
```

### Seed data (opcional):
El archivo `dummyTrips.js` puede convertirse en un script de seed para tener datos de prueba en desarrollo:

```javascript
// scripts/seed-trips.js
import { dummyTrips } from '../frontend/src/data/dummyTrips.js'
// Insertar en DB...
```

