<template>
  <div class="create-trip">
    <!-- Sidebar -->
    <div class="sidebar">
      <img src="@/assets/LogoBlanco.png" alt="StoryLines Logo" class="logo" />
      <nav>
        <router-link to="/" class="nav-item" :class="{ 'active': $route.path === '/' }">
          <svg class="icon" v-html="homeIcon"></svg>
          <span>Home</span>
        </router-link>
        <router-link to="/create" class="nav-item" :class="{ 'active': $route.path === '/create' }">
          <svg class="icon" v-html="createIcon"></svg>
          <span>Create</span>
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ 'active': $route.path === '/profile' }">
          <svg class="icon" v-html="profileIcon"></svg>
          <span>Profile</span>
        </router-link>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <h1 class="title">Creación de viaje</h1>

      <div v-if="loading" class="loading">Cargando...</div>

      <div v-else class="trip-content">
        <!-- Step 1: Portada Section -->
        <div v-if="currentStep === 1">
          <h2 class="section-title">Portada</h2>
          <div class="section-card">
            <div class="input-container">
              <div class="image-upload">
                <label>Foto de portada</label>
                <img
                  :src="coverPreview || 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'"
                  class="preview"
                  alt="Portada del viaje"
                />
                <input
                  type="file"
                  ref="coverInput"
                  accept="image/*"
                  style="display:none"
                  @change="handleCoverUpload"
                />
                <button @click="$refs.coverInput.click()" class="upload-btn">Seleccionar imagen</button>
              </div>
              <div class="form-fields">
                <label>Título del viaje</label>
                <input v-model="trip.trip_name" type="text" placeholder="Ej: Ruta por Japón" />
                <div class="date-fields">
                  <div class="date-field">
                    <label>Fecha de inicio</label>
                    <input type="date" v-model="trip.start_date" />
                  </div>
                  <div class="date-field">
                    <label>Fecha de fin</label>
                    <input type="date" v-model="trip.end_date" />
                  </div>
                </div>
                <label>Descripción (opcional)</label>
                <textarea v-model="trip.description" rows="3"></textarea>
              </div>
            </div>
            <div class="step-actions">
              <button class="next-btn" @click="goToStops" :disabled="!canProceedToStops">Siguiente</button>
              <button class="cancel" @click="cancelTrip">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- Step 2: Paradas Section -->
        <div v-if="currentStep === 2">
          <h2 class="section-title">Paradas</h2>
          <div class="section-card">
            <button class="back-btn" @click="goToCover">
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg> Volver
</button>
            <div v-for="(stop, index) in trip.stops" :key="index" class="input-container">
              <div class="image-upload">
                <label>Fotos (opcional)</label>
                <img
                  v-if="stop.images.length > 0"
                  :src="stop.images[0]"
                  class="preview"
                  alt="Foto parada"
                />
                <img
                  v-else
                  src="https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg"
                  class="preview"
                  alt="Parada por defecto"
                />
                <input
                  type="file"
                  :ref="el => stopFileInputs[index] = el"
                  style="display:none"
                  accept="image/*"
                  multiple
                  @change="e => handleStopImagesUpload(e, index)"
                />
                <button @click="openStopFile(index)" class="upload-btn">Seleccionar imágenes</button>
              </div>
              <div class="form-fields">
                <label>Título de la parada</label>
                <!--<input v-model="stop.title" type="text" placeholder="Ej: Parada en Tokio" />-->
                <label>Ciudad (opcional)</label>
                <input v-model="stop.city" type="text" placeholder="Ej: Tokio" @focus="stop.countryOpen = true" @input="stop.countryOpen = true" />
                <label>País</label>
                <input v-model="stop.countrySearch" type="text" placeholder="Buscar país..." @focus="stop.countryOpen = true" @input="stop.countryOpen = true" />
                <label>Descripción (opcional)</label>
                <textarea v-model="stop.description" rows="3"></textarea>
                <ul v-show="stop.countryOpen" class="dropdown">
                  <li v-for="c in filteredCountries(stop.countrySearch)" :key="c.id" @click="selectCountry(stop, c)">
                    {{ c.name }}
                  </li>
                  <li v-if="filteredCountries(stop.countrySearch).length === 0" class="empty">
                    No hay resultados
                  </li>
                </ul>
              </div>
              <button v-if="trip.stops.length > 1" class="delete-btn" @click="removeStop(index)">Eliminar</button>
            </div>
            <div class="add-stop-container">
              <button class="add-stop-btn" @click="addStop">Añadir parada</button>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <button @click="publishTrip" :disabled="saving">
              {{ saving ? 'Publicando...' : 'Publicar viaje' }}
            </button>
            <button class="save-draft" @click="saveDraft" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar borrador' }}
            </button>
            <button class="cancel" @click="cancelTrip">Cancelar</button>
          </div>
        </div>

        <!-- Messages -->
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
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
    const currentStep = ref(1) // 1 for cover, 2 for stops

    const coverPreview = ref('')

    // refs de inputs de fotos por parada
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

      if (cErr) { error.value = 'No se pudieron cargar los países'; return }
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
      if (!clickedInside) trip.value.stops.forEach(s => (s.countryOpen = false))
    }

    const filteredCountries = (search) => {
      const q = (search || '').trim().toLowerCase()
      if (!q) return countries.value.slice(0, 50)
      return countries.value.filter(c => (c.name || '').toLowerCase().includes(q)).slice(0, 50)
    }
    const selectCountry = (stop, country) => { stop.country_id = country.id; stop.countrySearch = country.name; stop.countryOpen = false }
    const clearCountry = (stop) => { stop.country_id = ''; stop.countrySearch = '' }
    const getCountryNameById = (id) => countries.value.find(x => x.id === id)?.name || ''

    // Portada
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

    // Fotos de parada
    const openStopFile = (index) => { stopFileInputs.value[index]?.click() }

    const handleStopImagesUpload = async (e, stopIndex) => {
      const files = Array.from(e.target.files || [])
      if (!files.length) return

      if (!user.value) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { error.value = 'Debes iniciar sesión para subir imágenes'; return }
        user.value = session.user
      }

      for (const file of files) {
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

      if (stopFileInputs.value[stopIndex]) stopFileInputs.value[stopIndex].value = ''
    }

    const removeStopImage = (stopIndex, imgIndex) => {
      trip.value.stops[stopIndex].images.splice(imgIndex, 1)
    }

    // Validaciones publicar
    const validateRequiredFields = () => {
      for (const s of trip.value.stops) { if (!s.country_id) { error.value = 'En cada parada el país es obligatorio.'; return false } }
      if (trip.value.stops.length < 1) { error.value = 'Debes añadir al menos 1 parada para publicar.'; return false }
      error.value = ''; return true
    }

    // Validaciones para pasar a paradas
    const canProceedToStops = () => {
      if (!trip.value.cover_image) { error.value = 'La foto de portada es obligatoria.'; return false }
      if (!trip.value.trip_name.trim()) { error.value = 'El nombre del viaje es obligatorio.'; return false }
      if (!trip.value.start_date || !trip.value.end_date) { error.value = 'Las fechas de inicio y fin son obligatorias.'; return false }
      const start = new Date(trip.value.start_date), end = new Date(trip.value.end_date)
      if (isNaN(start) || isNaN(end)) { error.value = 'Las fechas no son válidas.'; return false }
      if (end < start) { error.value = 'La fecha de fin no puede ser anterior a la de inicio.'; return false }
      error.value = ''; return true
    }

    // Navegación entre pasos
    const goToStops = () => {
      if (canProceedToStops()) {
        currentStep.value = 2
      }
    }

    const goToCover = () => {
      currentStep.value = 1
    }

    // Paradas
    const addStop = () => {
      trip.value.stops.push({ city: '', country_id: '', countrySearch: '', countryOpen: false, description: '', images: [] })
      stopFileInputs.value.push(null)
    }
    const removeStop = (i) => {
      trip.value.stops.splice(i, 1)
      stopFileInputs.value.splice(i, 1)
    }

    const cancelTrip = () => { router.push('/') }

    // Insert trip + stops
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

    // Acciones
    const saveDraft = async () => {
      error.value = ''; success.value = ''; saving.value = true
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
      } finally { saving.value = false }
    }

    const publishTrip = async () => {
      error.value = ''; success.value = ''
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
      } finally { saving.value = false }
    }

    // Icons
    const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const searchIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    const notificationsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 13.2284 3 17.9842 3 17.9842H21 17.9842C21 17.9842 18 13.2284 18 8Z" stroke="currentColor" stroke-width="2"/><path d="M12 18V18.009" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const storeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9H21V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2"/><path d="M12 22V12L10 10H14L12 12V22Z" stroke="currentColor" stroke-width="2"/></svg>`;
    const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21" stroke="currentColor" stroke-width="2"/></svg>`;
    const settingsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15A1.65 1.65 0 0 0 19 15C19 14.7 18.9 14.4 18.7 14.2L16.9 12.4C16.8 12.3 16.7 12.2 16.7 12C16.7 11.8 16.8 11.7 16.9 11.6L18.7 9.8C18.9 9.6 19 9.3 19 9A1.65 1.65 0 0 0 19.4 9L20.5 8A1.65 1.65 0 0 0 21 7.4L21 6.5A1.65 1.65 0 0 0 20.5 6L19.4 5A1.65 1.65 0 0 0 19 5C19 4.7 18.9 4.4 18.7 4.2L16.9 2.4C16.8 2.3 16.7 2.2 16.7 2C16.7 1.8 16.8 1.7 16.9 1.6L18.7 0C18.9 -0.2 19 0.1 19 0.4V1.5A1.65 1.65 0 0 0 19.4 2L20.5 3A1.65 1.65 0 0 0 21 3.6L21 4.5A1.65 1.65 0 0 0 20.5 5L19.4 6A1.65 1.65 0 0 0 19 6C19 6.3 18.9 6.6 18.7 6.8L16.9 8.6C16.8 8.7 16.7 8.8 16.7 9C16.7 9.2 16.8 9.3 16.9 9.4L18.7 11.2C18.9 11.4 19 11.7 19 12A1.65 1.65 0 0 0 19.4 12L20.5 13A1.65 1.65 0 0 0 21 13.6L21 14.5A1.65 1.65 0 0 0 20.5 15L19.4 16A1.65 1.65 0 0 0 19 16C19 16.3 18.9 16.6 18.7 16.8L16.9 18.6C16.8 18.7 16.7 18.8 16.7 19C16.7 19.2 16.8 19.3 16.9 19.4L18.7 21.2C18.9 21.4 19 21.7 19 22V20.5A1.65 1.65 0 0 0 19.4 20L20.5 19A1.65 1.65 0 0 0 21 18.4L21 17.5A1.65 1.65 0 0 0 20.5 17L19.4 16A1.65 1.65 0 0 0 19 16C19 15.7 18.9 15.4 18.7 15.2L16.9 13.4C16.8 13.3 16.7 13.2 16.7 13C16.7 12.8 16.8 12.7 16.9 12.6L18.7 10.8C18.9 10.6 19 10.3 19 10A1.65 1.65 0 0 0 19.4 10L20.5 9A1.65 1.65 0 0 0 21 8.4L21 7.5A1.65 1.65 0 0 0 20.5 7L19.4 6Z" stroke="currentColor" stroke-width="2"/></svg>`;

    return {
      trip, error, success, coverPreview, countries,
      filteredCountries, selectCountry, clearCountry, getCountryNameById,
      addStop, removeStop, removeStopImage,
      stopFileInputs, openStopFile, handleStopImagesUpload,
      handleCoverUpload,
      saveDraft, publishTrip, cancelTrip,
      loading, saving,
      currentStep, goToStops, goToCover, canProceedToStops,
      homeIcon, searchIcon, notificationsIcon, createIcon, storeIcon, profileIcon, settingsIcon
    }
  }
}
</script>

<style scoped>
.create-trip {
  display: flex;
  min-height: 100vh;
  background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rbahoo4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1172') no-repeat center center/cover;
  opacity: 0.9;
  color: #fff;
}

.sidebar {
  width: 250px;
  background: #0A0A0A;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  align-self: left;
}

.sidebar nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
  color: #ccc;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s;
  position: relative;
  min-height: 40px;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: margin-left 0.2s;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  margin-left: 1rem;
}

.section-card {
  border: 1.5px solid #fff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background: rgba(10, 10, 10, 0.7);
  width: 700px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.input-container {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
  align-items: flex-start;
  max-width: 100%;
}

.image-upload {
  flex: 1;
  max-width: 250px;
  font-size: 1.1rem;
}

.image-upload label {
  display: block;
  margin-bottom: 0.5rem;
  text-align: left;
}

.preview {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #fff;
  margin-bottom: 0.6rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.upload-btn {
  background: #d3d3d3;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  display: block;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.1rem;
}

.form-fields {
  flex: 2;
  max-width: 450px;
}

.form-fields label {
  display: block;
  margin-bottom: 0.5rem;
  text-align: left;
  font-size: 1.1rem;
}

.form-fields input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.form-fields input,
.form-fields textarea {
  width: 100%;
  padding: 0.6rem;
  margin-bottom: 0.6rem;
  border: 1.5px solid #fff;
  border-radius: 6px;
  background: rgba(10, 10, 10, 0.7);
  color: #fff;
  display: block;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.1rem;
}

.date-fields {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
}

.date-field {
  flex: 1;
}

.date-field label {
  margin-bottom: 0.5rem;
  text-align: left;
  font-size: 1.1rem;
}

.dropdown {
  position: absolute;
  z-index: 10;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  margin-top: 4px;
  border-radius: 6px;
  list-style: none;
  padding: 6px 0;
  color: #000;
}

.dropdown li {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 1.1rem;
}

.dropdown li:hover {
  background: #f0f0f0;
}

.dropdown .empty {
  color: #888;
  cursor: default;
}

.add-stop-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.add-stop-btn {
  background: #375689;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: none;
  width: 250px;
  margin: 0 auto;
  display: block;
  font-size: 1.1rem;
}

.delete-btn {
  background: #e74c3c;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  margin-top: 0.6rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  max-width: 700px;
  justify-content: center;
}

.actions button {
  flex: 1;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  color: white;
  border: none;
  max-width: 250px;
  font-size: 1.1rem;
}

.actions button:first-child {
  background: #828282;
}

.actions .cancel {
  background: #363636;
}

.actions .save-draft {
  background: #48494B;
}

.actions button:disabled {
  background: #555;
  cursor: not-allowed;
}

.step-actions {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  justify-content: center;
}

.step-actions button {
  flex: 1;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  color: white;
  border: none;
  max-width: 250px;
  font-size: 1.1rem;
}

.step-actions .next-btn {
  background: #375689;
}

.step-actions .cancel {
  background: #363636;
}

.back-btn {
  background: #48494B;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  align-self: flex-start;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
  font-size: 1.1rem;
}

.success {
  color: #2ecc71;
  font-size: 1.1rem;
}
</style>