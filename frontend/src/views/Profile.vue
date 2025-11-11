<template>
  <!-- TEMPLATE -->
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
  
      <!-- ChangePicture insertado justo debajo del perfil -->
      <div v-if="showChangePicture" class="change-picture-container">
        <ChangePicture 
          @image-updated="handleImageUpdated"
        />
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
          <h3>Viajes recientes</h3>
        </div>
        <div class="trips-container">
          <div class="trip-card" v-for="trip in trips" :key="trip.id">
            <img :src="trip.image" alt="Foto del viaje" class="trip-image" />
            <div class="trip-info">
              <div class="trip-details">
                <h4>{{ trip.title }}</h4>
                <p>{{ trip.description }}</p>
              </div>
              <div class="trip-stats">
                <span>♡ {{ formatCount(trip.likes) }}</span>
                <span>👁 {{ formatCount(trip.views) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { supabase } from '@/config/supabase'
  import ChangePicture from '@/components/Profile/ChangePicture.vue'
  
  export default {
    name: 'Profile',
    components: { ChangePicture },
    setup(props, { emit }) {
      const showChangePicture = ref(false);
      const user = ref(null)
      const profileData = ref({
        username: '',
        display_name: '',
        bio: '',
        avatar_url: ''
      })
      const originalData = ref({})
      const isEditing = ref(false)
      const loading = ref(true)
      const saving = ref(false)
      const error = ref('')
      const success = ref('')
      const hovering = ref(false)
      const fileInput = ref(null)
      const showChangePictureModal = ref(false)
  
      // Cargar perfil al montar
      onMounted(async () => {
        await loadProfile()
      })
  
      const loadProfile = async () => {
        loading.value = true
        try {
          // Obtener usuario actual
          const { data: { session } } = await supabase.auth.getSession()
          user.value = session?.user
  
          if (!user.value) return
  
          // Obtener datos del perfil desde la tabla users
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.value.id)
            .single()
  
          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError
          }
  
          // Si existe perfil, cargar datos
          if (data) {
            profileData.value = { ...data }
            originalData.value = { ...data }
          }
        } catch (err) {
          error.value = 'Error al cargar el perfil'
          console.error(err)
        } finally {
          loading.value = false
        }
      }
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
  
          // 👇 Intentar siempre leer el body aunque haya error
          let body = {}
          try {
            body = await res.json()
          } catch (e) {
            console.warn('No se pudo parsear el body como JSON')
          }
  
          if (!res.ok) {
            // 👇 si el backend devolvió un mensaje, lo mostramos
            const msg = body.error || `Error ${res.status}`
            throw new Error(msg)
          }
  
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
  
  
      const cancelEdit = () => {
        profileData.value = { ...originalData.value }
        isEditing.value = false
        error.value = ''
      }
  
      const handleImageUpdated = (newUrl) => {
        profileData.value.avatar_url = newUrl;
        showChangePicture.value = false; // cerrar automáticamente
      }
  
      const handleFileChange = async (event) => {
        const file = event.target.files[0]
        if (!file) return
  
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          error.value = 'Por favor selecciona una imagen válida'
          return
        }
  
        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
          error.value = 'La imagen no puede superar los 2MB'
          return
        }
  
        try {
          // Subir imagen a Supabase Storage
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`
  
          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(filePath, file)
  
          if (uploadError) throw uploadError
  
          // Obtener URL pública
          const { data } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(filePath)
  
          profileData.value.avatar_url = data.publicUrl
  
          // Guardar automáticamente
          await saveProfile()
        } catch (err) {
          error.value = 'Error al subir la imagen'
          console.error(err)
        }
      }
  
      const formatCount = (count) => {
        if (count >= 1000000) {
          if (count % 1000000 === 0) {
            return (count / 1000000).toFixed(0) + 'M'
          }
          return (count / 1000000).toFixed(1) + 'M'
        }
        if (count >= 1000){
          if (count % 1000 === 0) {
            return (count / 1000).toFixed(0) + 'K'
          }
          return (count / 1000).toFixed(1) + 'K'
        }
        return count
      }
  
      const trips = ref([
        {
          id: 1,
          title: 'Mi viaje a Islandia',
          description: 'Este es el album de mi viaje.',
          image: 'https://images.unsplash.com/photo-1500043357865-c6b8827edf10?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
          likes: 500000,
          views: 1200000
        },
        {
          id: 2,
          title: 'Mi viaje a Paris',
          description: 'Este es el album de mi viaje.',
          image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
          likes: 900000,
          views: 3000000
        },
        {
          id: 3,
          title: 'Mi viaje a Tokyo',
          description: 'Este es el album de mi viaje.',
          image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
          likes: 5500000,
          views: 11700000
        }
      ])

      //Icons
    const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const searchIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    const notificationsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 13.2284 3 17.9842 3 17.9842H21 17.9842C21 17.9842 18 13.2284 18 8Z" stroke="currentColor" stroke-width="2"/><path d="M12 18V18.009" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const storeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9H21V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2"/><path d="M12 22V12L10 10H14L12 12V22Z" stroke="currentColor" stroke-width="2"/></svg>`;
    const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21" stroke="currentColor" stroke-width="2"/></svg>`;
    const settingsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15A1.65 1.65 0 0 0 19 15C19 14.7 18.9 14.4 18.7 14.2L16.9 12.4C16.8 12.3 16.7 12.2 16.7 12C16.7 11.8 16.8 11.7 16.9 11.6L18.7 9.8C18.9 9.6 19 9.3 19 9A1.65 1.65 0 0 0 19.4 9L20.5 8A1.65 1.65 0 0 0 21 7.4L21 6.5A1.65 1.65 0 0 0 20.5 6L19.4 5A1.65 1.65 0 0 0 19 5C19 4.7 18.9 4.4 18.7 4.2L16.9 2.4C16.8 2.3 16.7 2.2 16.7 2C16.7 1.8 16.8 1.7 16.9 1.6L18.7 0C18.9 -0.2 19 0.1 19 0.4V1.5A1.65 1.65 0 0 0 19.4 2L20.5 3A1.65 1.65 0 0 0 21 3.6L21 4.5A1.65 1.65 0 0 0 20.5 5L19.4 6A1.65 1.65 0 0 0 19 6C19 6.3 18.9 6.6 18.7 6.8L16.9 8.6C16.8 8.7 16.7 8.8 16.7 9C16.7 9.2 16.8 9.3 16.9 9.4L18.7 11.2C18.9 11.4 19 11.7 19 12A1.65 1.65 0 0 0 19.4 12L20.5 13A1.65 1.65 0 0 0 21 13.6L21 14.5A1.65 1.65 0 0 0 20.5 15L19.4 16A1.65 1.65 0 0 0 19 16C19 16.3 18.9 16.6 18.7 16.8L16.9 18.6C16.8 18.7 16.7 18.8 16.7 19C16.7 19.2 16.8 19.3 16.9 19.4L18.7 21.2C18.9 21.4 19 21.7 19 22V20.5A1.65 1.65 0 0 0 19.4 20L20.5 19A1.65 1.65 0 0 0 21 18.4L21 17.5A1.65 1.65 0 0 0 20.5 17L19.4 16A1.65 1.65 0 0 0 19 16C19 15.7 18.9 15.4 18.7 15.2L16.9 13.4C16.8 13.3 16.7 13.2 16.7 13C16.7 12.8 16.8 12.7 16.9 12.6L18.7 10.8C18.9 10.6 19 10.3 19 10A1.65 1.65 0 0 0 19.4 10L20.5 9A1.65 1.65 0 0 0 21 8.4L21 7.5A1.65 1.65 0 0 0 20.5 7L19.4 6Z" stroke="currentColor" stroke-width="2"/></svg>`;

  
      return {
        user,
        profileData,
        isEditing,
        loading,
        saving,
        error,
        success,
        fileInput,
        hovering,
        showChangePictureModal,
        saveProfile,
        cancelEdit,
        handleFileChange,
        showChangePicture,
        profileData,
        handleImageUpdated,
        trips,
        formatCount,
        homeIcon,
        searchIcon,
        notificationsIcon,
        createIcon,
        storeIcon,
        profileIcon,
        settingsIcon
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
    margin-left: 250px;
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
    gap: 1.6rem;
    padding: 1.5rem 2rem;
    background: rgba(11, 47, 74, 0.3);
    border-radius: 0;
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
    width: 100;
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
  
  .trip-stats {
    display: flex;
    flex-direction: column;
    font-size: 1rem;
    opacity: 0.8;
    color: #0a0a0a;
    flex-shrink: 0;
    margin-left: 5rem;
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

  </style>