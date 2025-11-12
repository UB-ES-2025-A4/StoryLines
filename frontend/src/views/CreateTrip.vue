<template>
  <div class="create-trip">
    <!-- Sidebar -->
    <Sidebar />

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
                <input v-model="trip.trip_name" type="text" placeholder="Ej: Viaje a Japón" />
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
  <div class="stops-route">
    <div v-for="(stop, index) in trip.stops" :key="index" class="stop-card-wrapper">
      <h3 v-if="index === 0" class="stop-origin-title">Origen del viaje</h3>
      <div class="input-container stop-card">
        <div class="image-upload">
          <label>Fotos (opcional)</label>
          <div class="stop-images">
            <button class="nav-arrow left" @click="changeStopImage(stop, -1)" :disabled="stop.currentImageIndex === 0 || stop.images.length <= 1">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="preview-wrapper">
              <img
                :src="stop.images.length > 0 ? stop.images[stop.currentImageIndex] : 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'"
                class="stop-image"
                alt="Foto parada"
              />
              <button v-if="stop.images.length > 0" class="remove-img-btn" @click="removeCurrentStopImage(index)">
                <svg class="trash-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <button class="nav-arrow right" @click="changeStopImage(stop, 1)" :disabled="stop.currentImageIndex === stop.images.length - 1 || stop.images.length <= 1">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
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
          <label>Ciudad (opcional)</label>
          <input v-model="stop.city" type="text" placeholder="Ej: Tokio"/>
          <label>País</label>
          <input v-model="stop.countrySearch" type="text" placeholder="Buscar país..." @focus="stop.countryOpen = true" @input="stop.countryOpen = true" />
          <ul v-show="stop.countryOpen" class="dropdown">
            <li v-for="c in filteredCountries(stop.countrySearch)" :key="c.id" @click="selectCountry(stop, c)">
              {{ c.name }}
            </li>
            <li v-if="filteredCountries(stop.countrySearch).length === 0" class="empty">
              No hay resultados
            </li>
          </ul>
          <label>Descripción (opcional)</label>
          <textarea v-model="stop.description" rows="3"></textarea>
        </div>
        <button v-if="index > 0" class="remove-stop-btn" @click="removeStop(index)">X</button>
      </div>
      <div v-if="index < trip.stops.length - 1" class="route-line"></div>
    </div>
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
import Sidebar from '@/components/Sidebar.vue' 

export default {
  name: 'CreateTrip',
  components: { Sidebar },
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
          images: [],
          currentImageIndex: 0
        },
        {
          city: '',
          country_id: '',
          countrySearch: '',
          countryOpen: false,
          description: '',
          images: [],
          currentImageIndex: 0
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
      stopFileInputs.value = new Array(trip.value.stops.length).fill(null)
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

    const changeStopImage = (stop, delta) => {
  const newIndex = stop.currentImageIndex + delta
  if (newIndex >= 0 && newIndex < stop.images.length) {
    stop.currentImageIndex = newIndex
  }
}

const removeCurrentStopImage = (index) => {
  const stop = trip.value.stops[index]
  if (stop.images.length > 0) {
    stop.images.splice(stop.currentImageIndex, 1)
    if (stop.currentImageIndex > stop.images.length - 1) {
      stop.currentImageIndex = Math.max(0, stop.images.length - 1)
    }
  }
}

    // Validaciones publicar
const validateRequiredFields = () => {
  for (const [i, s] of trip.value.stops.entries()) {
    if (!s.country_id) {
      error.value = `En la parada ${i + 1} el país es obligatorio.`;
      return false;
    }
    if (!s.images || s.images.length === 0) {
      error.value = `Debes subir al menos una foto en la parada ${i + 1}.`;
      return false;
    }
  }

  if (trip.value.stops.length < 2) {
    error.value = 'Debes añadir al menos 2 paradas para publicar.';
    return false;
  }

  if (!trip.value.cover_image) {
    error.value = 'Debes añadir una foto de portada antes de publicar.';
    return false;
  }

  error.value = '';
  return true;
};

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
  trip.value.stops.push({ city: '', country_id: '', countrySearch: '', countryOpen: false, description: '', images: [], currentImageIndex: 0 })
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
          description: stop.description || null,
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

    

    return {
      trip, error, success, coverPreview, countries,
      filteredCountries, selectCountry, clearCountry, getCountryNameById,
      addStop, removeStop, changeStopImage, removeCurrentStopImage,
      stopFileInputs, openStopFile, handleStopImagesUpload,
      handleCoverUpload,
      saveDraft, publishTrip, cancelTrip,
      loading, saving,
      currentStep, goToStops, goToCover, canProceedToStops
    }
  }
}
</script>

<style scoped>
.create-trip {
  display: flex;
  min-height: 100vh;
  background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rbahoo4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1172') no-repeat center center/cover;
  background-attachment: fixed;
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
  max-width: 1100px;
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
  width: 1000px;
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

.stop-card {
  padding: 2rem;
  border: 1.5px solid #fff;
  border-radius: 12px;
  background: #0A0A0A;
  position: relative;
  min-height: 300px;
  max-width: 1100px;
  margin: 0 auto;
}

.image-upload {
  flex: 1;
  max-width: 450px;
  font-size: 1.1rem;
}

.image-upload label {
  display: block;
  margin-bottom: 0.5rem;
  text-align: center;
}

.preview {
  width: 300px;
  height: 300px;
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
  width: 300px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.1rem;
}

.form-fields {
  flex: 2;
  max-width: 600px;
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
  max-width: 280px;
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
  margin-top: 0.5rem;
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
  cursor: pointer;
}

.remove-stop-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  z-index: 1;
}

.actions {
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  margin-left: 2.5rem;
  margin-right: 2.5rem;
  max-width:1100px;
  justify-content: center;
}

.actions button {
  flex: 1;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  color: white;
  border: none;
  max-width: 1100px;
  font-size: 1.1rem;
  cursor: pointer;
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
  cursor: pointer;
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
  cursor: pointer;
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

.stops-route {
  position: relative;
  text-align: center;
}

.stop-card-wrapper {
  position: relative;
  margin-bottom: 3rem;
  display: inline-block;
  vertical-align: top;
}

.route-line {
  position: absolute;
  width: 2px;
  background: #fff;
  height: 100px;
  left: 50%;
  transform: translateX(-50%);
  top: 100%;
  z-index: 0;
  opacity: 1;
}

.stop-images {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 400px;
  padding: 0 10px;
  margin-bottom: 0.6rem;
}

.stop-image {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #fff;
  display: block;
  z-index: 0;
}

.preview-wrapper {
  position: relative;
  width: 250px;
  height: 250px;
  margin: 0 auto;
}

.nav-arrow {
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid #fff;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  padding: 1rem;
  opacity: 0.9;
  transition: opacity 0.2s;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.nav-arrow:hover {
  opacity: 1;
}

.nav-arrow.left {
  margin-right: 10px;
}

.nav-arrow.right {
  margin-left: 10px;
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow svg {
  width: 24px;
  height: 24px;
}

.remove-img-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #888;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 1;
}

.trash-icon {
  width: 16px;
  height: 16px;
}

.stop-origin-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
}
</style>