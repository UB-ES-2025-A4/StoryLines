<!-- SOLO muestro las partes que cambian respecto a tu archivo.
     Puedes pegarlo tal cual si quieres; es el componente completo. -->
<template>
  <div class="create-trip">
    <h1>Crear nuevo viaje</h1>

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else class="trip-content">
      <!-- ... portada, datos del viaje, etc. (igual que tienes) ... -->

      <!-- Paradas -->
      <h2>Paradas</h2>

      <div class="stop-card" v-for="(stop, index) in trip.stops" :key="index">
        <div class="stop-header">
          <h3>Parada {{ index + 1 }}</h3>
          <button v-if="trip.stops.length > 1" class="delete-btn" @click="removeStop(index)">
            ❌ Eliminar
          </button>
        </div>

        <!-- Ciudad -->
        <div class="form-group">
          <label>Ciudad (opcional):</label>
          <input v-model="stop.city" placeholder="Ej: Tokio" type="text" />
        </div>

        <!-- País con buscador (igual que tienes) -->
        <div class="form-group country-picker">
          <label>País (obligatorio):</label>
          <div class="country-select">
            <input
              type="text"
              v-model="stop.countrySearch"
              :placeholder="getCountryNameById(stop.country_id) || 'Buscar país...'"
              @focus="stop.countryOpen = true"
              @input="stop.countryOpen = true"
            />
            <button
              v-if="stop.country_id"
              type="button"
              class="clear-btn"
              @click="clearCountry(stop)"
              title="Quitar país"
            >✕</button>

            <ul v-show="stop.countryOpen" class="dropdown">
              <li
                v-for="c in filteredCountries(stop.countrySearch)"
                :key="c.id"
                @click="selectCountry(stop, c)"
              >
                {{ c.name }}
              </li>
              <li v-if="filteredCountries(stop.countrySearch).length === 0" class="empty">
                No hay resultados
              </li>
            </ul>
          </div>
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label>Descripción (opcional):</label>
          <textarea v-model="stop.description" rows="3"></textarea>
        </div>

        <!-- Fotos de la parada -->
        <div class="form-group">
          <label>Fotos de la parada (opcional):</label>

          <div class="stop-images-preview">
            <div v-for="(img, i) in stop.images" :key="i" style="display:inline-block; position:relative; margin:5px;">
              <img :src="img" class="stop-img" alt="Foto parada" />
              <button
                type="button"
                class="delete-btn"
                style="position:absolute; top:-8px; right:-8px; padding:2px 6px; border-radius:50%;"
                @click="removeStopImage(index, i)"
                title="Eliminar imagen"
              >×</button>
            </div>
          </div>

          <!-- ⚠️ ref por índice -->
          <input
            type="file"
            :ref="el => stopFileInputs[index] = el"
            style="display:none"
            accept="image/*"
            multiple
            @change="e => handleStopImagesUpload(e, index)"
          />
          <button @click="openStopFile(index)">Subir fotos</button>
        </div>
      </div>

      <button class="add-stop-btn" @click="addStop">➕ Añadir parada</button>

      <!-- Mensajes -->
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <!-- Acciones -->
      <div class="actions">
        <button @click="publishTrip" :disabled="saving">
          {{ saving ? 'Publicando...' : 'Publicar viaje' }}
        </button>

        <button @click="saveDraft" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Guardar borrador' }}
        </button>

        <button class="cancel" @click="cancelTrip">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '@/config/supabase'
import { useRouter } from 'vue-router'

export default {
  name: 'CreateTrip',
  setup() {
    const router = useRouter()

    const user = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref('')
    const success = ref('')

    const coverPreview = ref('')

    // ⚠️ inputs de archivo por parada
    const stopFileInputs = ref([])

    const countries = ref([])

    const trip = ref({
      trip_name: '',
      cover_image: '',
      start_date: '',
      end_date: '',
      description: '',
      stops: [
        {
          city: '',
          country_id: '',
          countrySearch: '',
          countryOpen: false,
          description: '',
          images: []
        }
      ]
    })

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user
    }

    const loadCountries = async () => {
      const { data, error: cErr } = await supabase
        .from('countries')
        .select('id, name, latitude, longitude')
        .order('name', { ascending: true })

      if (cErr) {
        error.value = 'No se pudieron cargar los países'
        return
      }
      countries.value = data || []
    }

    onMounted(async () => {
      loading.value = true
      await loadUser()
      await loadCountries()
      loading.value = false
      window.addEventListener('click', closeAllDropdowns)
    })

    const closeAllDropdowns = (e) => {
      const selects = document.querySelectorAll('.country-select')
      let clickedInside = false
      selects.forEach(sel => { if (sel.contains(e.target)) clickedInside = true })
      if (!clickedInside) {
        trip.value.stops.forEach(s => (s.countryOpen = false))
      }
    }

    const filteredCountries = (search) => {
      const q = (search || '').trim().toLowerCase()
      if (!q) return countries.value.slice(0, 50)
      return countries.value.filter(c => (c.name || '').toLowerCase().includes(q)).slice(0, 50)
    }
    const selectCountry = (stop, country) => { stop.country_id = country.id; stop.countrySearch = country.name; stop.countryOpen = false }
    const clearCountry = (stop) => { stop.country_id = ''; stop.countrySearch = '' }
    const getCountryNameById = (id) => countries.value.find(x => x.id === id)?.name || ''

    /* ==== Portada ==== */
    const handleCoverUpload = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      coverPreview.value = URL.createObjectURL(file)

      if (!user.value) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { error.value = 'Debes iniciar sesión para subir imágenes'; return }
        user.value = session.user
      }

      const ext = file.name.split('.').pop()
      const filename = `${user.value.id}-trip-cover-${Date.now()}.${ext}`
      const path = `trips/covers/${filename}`

      const { error: err } = await supabase.storage.from('trips-pictures').upload(path, file)
      if (err) { error.value = 'Error subiendo portada'; return }

      const { data } = supabase.storage.from('trips-pictures').getPublicUrl(path)
      trip.value.cover_image = data.publicUrl
    }

    /* ==== Fotos de parada ==== */
    const openStopFile = (index) => {
      stopFileInputs.value[index]?.click()
    }

    const handleStopImagesUpload = async (e, stopIndex) => {
      const files = Array.from(e.target.files || [])
      if (!files.length) return

      if (!user.value) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { error.value = 'Debes iniciar sesión para subir imágenes'; return }
        user.value = session.user
      }

      for (const file of files) {
        // Validaciones básicas
        if (!file.type.startsWith('image/')) { error.value = 'Archivo no válido: debe ser imagen'; continue }
        if (file.size > 8 * 1024 * 1024) { error.value = 'La imagen no puede superar 8MB'; continue }

        const ext = file.name.split('.').pop()
        const filename = `${user.value.id}-stop-${stopIndex + 1}-${Date.now()}.${ext}`
        const path = `trips/stops/${filename}`

        const { error: err } = await supabase.storage.from('trips-pictures').upload(path, file)
        if (err) { error.value = 'Error subiendo una imagen de la parada'; continue }

        const { data } = supabase.storage.from('trips-pictures').getPublicUrl(path)
        trip.value.stops[stopIndex].images.push(data.publicUrl)
      }

      // Limpia el input para permitir volver a subir las mismas imágenes si se quiere
      if (stopFileInputs.value[stopIndex]) stopFileInputs.value[stopIndex].value = ''
    }

    const removeStopImage = (stopIndex, imgIndex) => {
      trip.value.stops[stopIndex].images.splice(imgIndex, 1)
    }

    /* ==== Validaciones publicar (las tuyas) ==== */
    const validateRequiredFields = () => {
      if (!trip.value.cover_image) { error.value = 'La portada es obligatoria'; return false }
      if (!trip.value.trip_name.trim()) { error.value = 'El nombre del viaje es obligatorio'; return false }
      if (!trip.value.start_date || !trip.value.end_date) { error.value = 'Las fechas de inicio y fin son obligatorias'; return false }
      const start = new Date(trip.value.start_date), end = new Date(trip.value.end_date)
      if (isNaN(start) || isNaN(end)) { error.value = 'Las fechas no son válidas'; return false }
      if (end < start) { error.value = 'La fecha de fin no puede ser anterior a la de inicio'; return false }
      for (const s of trip.value.stops) {
        if (!s.country_id) { error.value = 'En cada parada el país es obligatorio'; return false }
      }
      if (trip.value.stops.length < 2) { error.value = 'Debes añadir al menos 2 paradas para publicar'; return false }
      error.value = ''
      return true
    }

    /* ==== Paradas ==== */
    const addStop = () => {
      trip.value.stops.push({ city: '', country_id: '', countrySearch: '', countryOpen: false, description: '', images: [] })
      // asegura hueco en el array de refs
      stopFileInputs.value.push(null)
    }
    const removeStop = (i) => {
      trip.value.stops.splice(i, 1)
      stopFileInputs.value.splice(i, 1)
    }

    const cancelTrip = () => { router.push('/') }

    /* ==== Insert trip + stops ==== */
    const insertTripWithStops = async (status) => {
      const payload = {
        user_id: user.value.id,
        trip_name: trip.value.trip_name,
        cover_image: trip.value.cover_image,
        start_date: trip.value.start_date,
        end_date: trip.value.end_date,
        description: trip.value.description || null,
        status
      }
      const { data: inserted, error: insertError } = await supabase.from('trips').insert(payload).select().single()
      if (insertError) throw insertError
      const tripId = inserted.id

      for (const stop of trip.value.stops) {
        const stopPayload = {
          trip_id: tripId,
          city: stop.city || null,
          country_id: stop.country_id,
          images: stop.images?.length ? stop.images : []
        }
        const { error: stopErr } = await supabase.from('trip_stops').insert(stopPayload)
        if (stopErr) throw stopErr
      }
    }

    /* ==== Guardar borrador / Publicar ==== */
    const saveDraft = async () => {
      error.value = ''
      success.value = ''
      saving.value = true
      try {
        if (!user.value) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) { error.value = 'Debes iniciar sesión'; saving.value = false; return }
          user.value = session.user
        }
        await insertTripWithStops('draft')
        success.value = 'Borrador guardado correctamente'
        router.push('/')
      } catch (err) {
        error.value = err.message || 'Error al guardar borrador'
      } finally {
        saving.value = false
      }
    }

    const publishTrip = async () => {
      error.value = ''
      success.value = ''
      if (!validateRequiredFields()) return
      saving.value = true
      try {
        if (!user.value) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) { error.value = 'Debes iniciar sesión'; saving.value = false; return }
          user.value = session.user
        }
        await insertTripWithStops('published')
        success.value = 'Viaje publicado correctamente'
        router.push('/')
      } catch (err) {
        error.value = err.message || 'Error al publicar el viaje'
      } finally {
        saving.value = false
      }
    }

    return {
      trip, error, success, coverPreview, countries,
      filteredCountries, selectCountry, clearCountry, getCountryNameById,
      addStop, removeStop, removeStopImage,
      // fotos de parada
      stopFileInputs, openStopFile, handleStopImagesUpload,
      // portada
      handleCoverUpload,
      // acciones
      saveDraft, publishTrip, cancelTrip,
      loading, saving
    }
  }
}
</script>

<style scoped>

.create-trip {
  max-width: 800px;
  margin: auto;
  padding: 1rem;
}

.preview {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 2px solid #42b983;
}

.dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stop-card {
  background: #f5f5f5;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.stop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.country-picker .country-select {
  position: relative;
}

.country-picker input[type="text"] {
  width: 100%;
  padding-right: 2.2rem;
}

.clear-btn {
  position: absolute;
  right: 0.4rem;
  top: 0.4rem;
  background: #eee;
  border: none;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
}

.dropdown {
  position: absolute;
  z-index: 10;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  margin-top: 4px;
  border-radius: 6px;
  list-style: none;
  padding: 4px 0;
}

.dropdown li {
  padding: 8px 10px;
  cursor: pointer;
}

.dropdown li:hover {
  background: #f0f0f0;
}

.dropdown .empty {
  color: #888;
  cursor: default;
}

.stop-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin: 5px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.add-stop-btn {
  margin-top: 1rem;
  background: #42b983;
  color: white;
  padding: 0.7rem;
  border-radius: 5px;
}

.delete-btn {
  background: #e74c3c;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.actions button {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  color: white;
  background: #42b983;
  border: none;
}

.actions .cancel {
  background: #888;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.error {
  color: #e74c3c;
}

.success {
  color: #2ecc71;
}

.stop-img { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #ccc; }
</style>
