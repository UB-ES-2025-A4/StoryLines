<template>
  <div class="profile-page">
    <!-- Sidebar -->
    <div class="sidebar">
      <img src="@/assets/LogoBlanco.png" alt="StoryLines Logo" class="logo" />
      <nav>
        <router-link to="/" class="nav-item" :class="{ 'active': $route.path === '/' }">
          <svg class="icon" v-html="homeIcon"></svg>
          <span>Home</span>
        </router-link>

        <router-link to="/createtrip" class="nav-item" :class="{ 'active': $route.path === '/create' }">
          <svg class="icon" v-html="createIcon"></svg>
          <span>Create</span>
        </router-link>

        <router-link to="/profile" class="nav-item" :class="{ 'active': $route.path === '/profile' }">
          <svg class="icon" v-html="profileIcon"></svg>
          <span>Profile</span>
        </router-link>
      </nav>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else class="profile-card">
      <!-- Cabecera del perfil -->
      <div class="profile-header">
        <div class="avatar-container" @mouseenter="hovering = true" @mouseleave="hovering = false">
          <img
            class="avatar"
            :src="profileData.avatar_url || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'"
            alt="Foto de perfil"
          />
          <div class="avatar-overlay" v-show="hovering" @click="showChangePicture = !showChangePicture">
            <i class="fa fa-camera camera-icon"></i>
          </div>
        </div>

        <div class="profile-text">
          <h2 class="username">{{ profileData.username || 'Nombre de usuario' }}</h2>
          <h1 class="display-name">{{ profileData.display_name }}</h1>
          <p class="bio">{{ profileData.bio || 'Esta es mi biografía...' }}</p>
          <button class="edit-btn" @click="isEditing = !isEditing">
            {{ isEditing ? 'Cancelar' : 'Editar perfil' }}
          </button>
        </div>
      </div>

      <!-- ChangePicture -->
      <div v-if="showChangePicture" class="change-picture-container">
        <ChangePicture @image-updated="handleImageUpdated" />
      </div>

      <!-- Formulario de edición -->
      <div v-if="isEditing" class="edit-form">
        <input type="text" v-model="profileData.username" placeholder="Nombre de usuario" />
        <input type="text" v-model="profileData.display_name" placeholder="Nombre" />
        <textarea v-model="profileData.bio" placeholder="Biografía"></textarea>
        <button class="save-btn" @click="saveProfile" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
      </div>

      <!-- VIAJES -->
      <div class="recent-trips-section">
        <div class="recent-trips-header">
          <h3>Viajes publicados</h3>
        </div>
        <div class="trips-container">
          <div v-if="trips.length > 0" class="trip-cards-wrapper">
            <div class="trip-card" v-for="trip in trips" :key="trip.id" @click="goToTrip(trip.id)">
              <img :src="trip.image" alt="Foto del viaje" class="trip-image" />
              <div class="trip-info">
                <div class="trip-details">
                  <h4>{{ trip.title }}</h4>
                  <p>{{ truncateText(trip.description, 120) }}</p>
                </div>
              </div>
              <button class="menu-btn" @click.stop="toggleMenu(trip.id)">⋯</button>
              <div v-if="currentMenuTrip === trip.id" class="menu-dropdown">
                <button @click.stop="editTrip(trip.id)">Editar</button>
                <button @click.stop="deleteTrip(trip.id)">Eliminar</button>
              </div>
            </div>
          </div>
          <div v-else class="no-trips-message">No hay viajes publicados</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/config/supabase'
import { useRouter } from 'vue-router'
import ChangePicture from '@/components/Profile/ChangePicture.vue'

export default {
  name: 'Profile',
  components: { ChangePicture },
  setup() {
    const router = useRouter()
    const showChangePicture = ref(false)
    const user = ref(null)
    const profileData = ref({ username: '', display_name: '', bio: '', avatar_url: '' })
    const originalData = ref({})
    const isEditing = ref(false)
    const loading = ref(true)
    const saving = ref(false)
    const error = ref('')
    const success = ref('')
    const hovering = ref(false)
    const currentMenuTrip = ref(null)
    const trips = ref([])

    // === Cargar perfil ===
    const loadProfile = async () => {
      loading.value = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        user.value = session?.user
        if (!user.value) return

        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.value.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError
        if (data) {
          profileData.value = { ...data }
          originalData.value = { ...data }
        }
      } catch (err) {
        console.error('Error al cargar el perfil:', err)
        error.value = 'Error al cargar el perfil'
      } finally {
        loading.value = false
      }
    }

    // === Guardar perfil (versión original tuya) ===
    const API_URL = ''
    const saveProfile = async () => {
      error.value = ''
      success.value = ''
      saving.value = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const payload = {
          userId: user.value.id,
          username: profileData.value.username,
          display_name: profileData.value.display_name,
          bio: profileData.value.bio,
          avatar_url: profileData.value.avatar_url
        }

        const res = await fetch(`${API_URL}/api/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        })

        let body = {}
        try {
          body = await res.json()
        } catch {
          console.warn('No se pudo parsear el body como JSON')
        }

        if (!res.ok) throw new Error(body.error || `Error ${res.status}`)
        success.value = body.message || 'Perfil actualizado correctamente ✅'
        originalData.value = { ...profileData.value }
        isEditing.value = false
      } catch (err) {
        console.error('saveProfile error:', err)
        error.value = err.message || 'Error al guardar el perfil'
      } finally {
        saving.value = false
      }
    }

    // === Cargar viajes publicados ===
    const loadTrips = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        user.value = session?.user
        if (!user.value) return

        const { data, error: tripsError } = await supabase
          .from('trips')
          .select('id, trip_name, description, cover_image, status, start_date')
          .eq('user_id', user.value.id)
          .eq('status', 'published')
          .order('start_date', { ascending: false })

        if (tripsError) throw tripsError

        trips.value = (data || []).map(trip => ({
          id: trip.id,
          title: trip.trip_name || 'Sin título',
          description: trip.description || 'Sin descripción',
          image: trip.cover_image || 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'
        }))
      } catch (err) {
        console.error('Error cargando viajes:', err)
      }
    }

    const truncateText = (text, limit) => (text?.length > limit ? text.slice(0, limit) + '...' : text || '')
    const goToTrip = (tripId) => router.push(`/post/${tripId}`)
    const toggleMenu = (tripId) => {
      currentMenuTrip.value = currentMenuTrip.value === tripId ? null : tripId
    }

    const editTrip = (tripId) => console.log('TODO editar viaje:', tripId)
    const deleteTrip = (tripId) => console.log('TODO eliminar viaje:', tripId)

    const handleImageUpdated = (newUrl) => {
      profileData.value.avatar_url = newUrl
      showChangePicture.value = false
    }

    const handleClickOutside = (event) => {
      if (currentMenuTrip.value !== null) {
        const menuBtn = event.target.closest('.menu-btn')
        const menuDropdown = event.target.closest('.menu-dropdown')
        if (!menuBtn && !menuDropdown) {
          currentMenuTrip.value = null
        }
      }
    }

    onMounted(async () => {
      await loadProfile()
      await loadTrips()
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    // ICONOS
    const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5" stroke="currentColor" stroke-width="2"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21" stroke="currentColor" stroke-width="2"/></svg>`

    return {
      user,
      profileData,
      isEditing,
      loading,
      saving,
      error,
      success,
      hovering,
      showChangePicture,
      handleImageUpdated,
      trips,
      currentMenuTrip,
      truncateText,
      toggleMenu,
      editTrip,
      deleteTrip,
      goToTrip,
      homeIcon,
      createIcon,
      profileIcon,
      saveProfile
    }
  }
}
</script>

<style scoped>
  .profile-page {
    min-height: 100vh;
    background: url('https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?ixlib=rb-4.1.0')
      center/cover no-repeat;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    color: #fff;
  }
  
  .profile-card {
    background: linear-gradient(to bottom, rgba(11, 47, 74, 0.6), rgba(39, 45, 45, 0.6));
    backdrop-filter: blur(14px);
    width: 100%;
    max-width: 700px;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    min-height: 100vh;
  }
  
  /* --- CABECERA PERFIL --- */
  .profile-header {
    display: flex;
    align-items: center;
    text-align: left;
    gap: 2rem;
    margin-bottom: 2rem;
    justify-content: flex-start;
    margin-right: 20%;
  }
  
  .profile-text {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .avatar {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  }
  
  .username {
    font-size: 2rem;
    font-weight: 500;
    margin: 0;
  }
  
  .display-name {
    font-size: 1.3rem;
    font-weight: 500;
    margin: 0;
  }
  
  .bio {
    font-size: 0.9rem;
    max-width: 500px;
  }
  
  .edit-btn {
    background: #ffffff;
    border: none;
    padding: 0.6rem 3rem;
    border-radius: 10px;
    color: #0a0a0a;
    cursor: pointer;
    transition: 0.2s;
    font-weight: 500;
    align-self: flex-start;
  }
  
  .edit-btn:hover {
    background: #e0e0e0;
  }
  
  /* --- FORMULARIO DE EDICIÓN --- */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    width: 100%;
    max-width: 500px;
  }
  
  .edit-form input,
  .edit-form textarea {
    padding: 0.8rem 1rem;
    border: none;
    border-radius: 0;
    outline: none;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  
  .save-btn {
    background: #42b983;
    border: none;
    padding: 0.6rem 3rem;
    border-radius: 25px;
    color: #fff;
    cursor: pointer;
    transition: 0.2s;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  /* --- VIAJES RECIENTES --- */
  .recent-trips-section {
    width: 95%;
    border-radius: 0;
    overflow: hidden;
    padding-bottom: 2rem;
  }
  
  .recent-trips-header {
    text-align: left;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, rgba(2, 161, 143, 0.8), rgba(55, 86, 137, 0.8));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .recent-trips-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 500;
    color: #fff;
  }
  
  /* --- CONTENEDOR DE TARJETAS --- */
  .trips-container {
    display: flex;
    flex-direction: column;
    padding: 1.5rem 2rem;
    background: rgba(11, 47, 74, 0.3);
    border-radius: 0;
    min-height: 200px;
  }
  
  /* --- TARJETA DE VIAJE --- */
  .trip-card {
    background: #fff;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0;
    transition: all 0.3s ease;
    height: 150px;
    position: relative;
  }
  
  .trip-card:hover {
    cursor: pointer;
    background: #f0f0f0;
  }
  
  .trip-image {
    width: 150px;
    height: 100%;
    border-radius: 12px 0 0 12px;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .trip-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .trip-details {
    flex-grow: 1;
  }
  
  .trip-details h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #0a0a0a;
  }
  
  .trip-details p {
    font-size: 0.95rem;
    opacity: 0.9;
    color: #0a0a0a;
  }
  
  .avatar-container {
    position: relative;
    display: inline-block;
  }
  
  .avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5); /* Fondo oscuro translúcido */
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
    z-index: 10;
  }
  
  .avatar-container:hover .avatar-overlay {
    opacity: 1;
  }
  
  .camera-icon {
    color: white;
    font-size: 2rem;
  }

  .sidebar {
  width: 250px;
  background: #0a0a0a;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  z-index: 100;
  resize: horizontal;
  min-width: 200px;
  max-width: 300px;
  transition: width 0.2s, padding 0.2s;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  /* Removed invalid align-self: left */
  /* Align to left if desired: */
  align-self: flex-start; /* Optional: aligns logo to the left */
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
  /* Changed from justify-content: center to flex-start for left alignment */
  justify-content: flex-start;
  gap: 1rem;
  font-size: 1.1rem;
  color: #ccc;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s;
  position: relative;
  min-height: 40px;
  /* Removed text-align: center since it's no longer needed */
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center; /* Keeps SVG centered within its container */
}

.icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.no-trips-message {
  text-align: center;
  font-size: 1.2rem;
  color: #fff;
  margin: auto 0;
}

.menu-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #0a0a0a;
}

.menu-dropdown {
  position: absolute;
  top: 30px;
  right: 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.menu-dropdown button {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  color: #0a0a0a;
}

.menu-dropdown button:hover {
  background: #f0f0f0;
}

.trip-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

  </style>