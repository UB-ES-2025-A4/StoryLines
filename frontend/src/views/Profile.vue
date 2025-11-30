<template>
  <div class="profile-page" :style="bgStyle">
    <!-- Sidebar -->
    <Sidebar />

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else class="profile-card">
      <!-- Cabecera del perfil -->
      <div class="profile-header">
        <div
          class="avatar-container"
          @mouseenter="hovering = true"
          @mouseleave="hovering = false"
        >
          <img
            class="avatar"
            :src="profileData.avatar_url && profileData.avatar_url.trim() !== '' 
              ? profileData.avatar_url 
              : defaultAvatar"
            alt="Foto de perfil"
          />

          <!-- Hover change picture -->
          <div
            class="avatar-overlay"
            v-show="hovering"
            @click="showChangePicture = !showChangePicture"
          >
            <i class="fa fa-camera camera-icon"></i>
          </div>
        </div>

        <div class="profile-text">
          <div class="name-friends-row">
            <h2 class="username">{{ profileData.username }}</h2>

            <button class="friends-btn" @click="showFriends = true">
              Amigos ({{ formatCount(friends.length) }})
            </button>

            <button class="edit-btn" @click="toggleEditModal">
              Editar perfil
            </button>
          </div>

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

      <!-- Formulario edición -->
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
          <div class="tabs">
            <button :class="{ active: currentTab === 'published' }" @click="currentTab = 'published'">
              Viajes publicados
            </button>

            <span class="separator">|</span>

            <button :class="{ active: currentTab === 'drafts' }" @click="currentTab = 'drafts'">
              Borradores
            </button>

            <span class="separator">|</span>
            <button :class="{ active: currentTab === 'saved' }" @click="currentTab = 'saved'">
              Viajes guardados
            </button>
          </div>
        </div>

        <div class="trips-container">
          <div v-if="currentTrips.length > 0" class="trip-cards-wrapper">
            <div
              class="trip-card"
              v-for="trip in currentTrips"
              :key="trip.id"
              @click="goToTrip(trip.id)"
            >
              <div class="trip-image-container">
                <img :src="trip.image" alt="Foto del viaje" class="trip-image" :class="{ faded: currentTab === 'drafts' }" />
                <div v-if="currentTab === 'drafts'" class="draft-watermark">BORRADOR</div>
              </div>

              <div class="trip-info">
                <div class="trip-details" style="margin-top: 1rem" v-if="currentTab === 'saved'">
                  <h4>{{ truncateText(trip.title, 20) }}</h4>
                  <p>{{ truncateText(trip.description, 30) }}</p>
                </div>

                <div class="trip-details" v-if="currentTab !== 'saved'">
                  <h4>{{ truncateText(trip.title, 30) }}</h4>
                  <p>{{ truncateText(trip.description, 45) }}</p>
                </div>

                <p class="trip-views" style="margin-top: 0.5rem;" v-if="currentTab !== 'saved' && currentTab !== 'drafts'">
                  <span v-html="viewsIcon"></span> {{ formatCount(trip.views) }}
                </p>

                <div class="trip-author" v-if="currentTab === 'saved' && trip.author">
                  <p class="trip-views" style="margin-bottom: 0.5rem;" v-if="currentTab === 'saved'">
                    <span v-html="viewsIcon"></span> {{ formatCount(trip.views) }} 
                  </p>
                  <span class="published-by">Published by</span>
                  <div class="author-info" @click.stop="goToUser(trip.author.id)"
                    style="cursor: pointer; display:flex; align-items:center;">
                    <div class="avatar-container" style="width:30px; height:30px; margin-right:8px;">
                      <img :src="safeAvatar(trip.author.avatar_url)" alt="Avatar del autor" class="avatar"
                        style="width:30px; height:30px; border-radius:50%; object-fit:cover;" />
                    </div>
                    <span>{{ truncateText(trip.author.username, 10)}}</span>
                  </div>
                </div>
              </div>

              <button class="menu-btn" v-if="currentTab !== 'saved'" @click.stop="toggleMenu(trip.id)">⋯</button>

              <div v-if="currentMenuTrip === trip.id && currentTab !== 'saved'" class="menu-dropdown">
                <button class="menu-item edit-item" @click.stop="editTrip(trip.id)">
                  <i class="fa fa-pencil"></i> Editar
                </button>
                <button class="menu-item delete-item" v-if="currentTab !== 'saved'"
                  @click.stop="openDeleteTripConfirm(trip.id)">
                  <i class="fa fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>

          <div v-else class="no-trips-message">
            {{ noTripsMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- =============================== -->
    <!-- POPUP AMIGOS (SOLO ESTE)       -->
    <!-- =============================== -->
    <div
      v-if="showFriends"
      class="modal-overlay"
      @click.self="showFriends = false"
    >
      <div class="modal-box">
        <button class="modal-close-x" @click="showFriends = false">✕</button>
        <h2 class="modal-title">Amigos</h2>

        <div v-if="friends.length === 0" class="no-friends">
          No tienes amigos todavía.
        </div>

        <div class="friends-list-scroll">
          <div 
            v-for="f in friends" 
            :key="f.id" 
            class="friend-item"
          >
            <div class="friend-click-zone" @click="goToUser(f.id)">
              <img :src="safeAvatar(f.avatar_url)" class="friend-avatar" />
              <span class="friend-username">{{ f.username }}</span>
            </div>

            <button
              class="delete-friend-btn"
              @click.stop="openDeleteFriendConfirm(f.id)"
            >
              ✕
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ============================================= -->
    <!-- POPUP CONFIRMAR ELIMINAR AMIGO -->
    <!-- ============================================= -->
    <div
      v-if="showConfirmDeleteFriend"
      class="modal-overlay"
      @click.self="showConfirmDeleteFriend = false"
    >
      <div class="modal-box">
        <button class="modal-close-x" @click="showConfirmDeleteFriend = false">✕</button>
        <h2 class="modal-title">Eliminar amigo</h2>

        <p>¿Seguro que quieres eliminar a este amigo?</p>

        <div class="modal-actions">
          <button class="btn-secondary" @click="showConfirmDeleteFriend = false">
            Cancelar
          </button>
          <button class="btn-danger" @click="confirmDeleteFriend">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================= -->
    <!-- POPUP CONFIRMAR ELIMINAR VIAJE -->
    <!-- ============================================= -->
    <div
      v-if="showConfirmDeleteTrip"
      class="modal-overlay"
      @click.self="showConfirmDeleteTrip = false"
    >
      <div class="modal-box">
        <button class="modal-close-x" @click="showConfirmDeleteTrip = false">✕</button>
        <h2 class="modal-title">Eliminar viaje</h2>

        <p>¿Seguro que quieres eliminar este viaje?</p>

        <div class="modal-actions">
          <button class="btn-secondary" @click="showConfirmDeleteTrip = false">
            Cancelar
          </button>
          <button class="btn-danger" @click="confirmDeleteTrip">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================= -->
    <!-- MODAL EDITAR PERFIL -->
    <!-- ============================================= -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="toggleEditModal">
      <div class="modal-box">
        <button class="modal-close-x" @click="toggleEditModal">✕</button>
        <h2 class="modal-title">Editar Perfil</h2>

        <div class="edit-form">
          <label>Nombre de usuario:</label>
          <input type="text" v-model="editUsername" placeholder="Nombre de usuario" />

          <label>Display name:</label>
          <input type="text" v-model="editDisplayName" placeholder="Display name" />

          <label>Biografía:</label>
          <textarea v-model="editBio" placeholder="Biografía"></textarea>

          <button class="save-btn" @click="saveProfileAndClose" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>

          <button class="cancel-btn" @click="toggleEditModal">
            Cancelar
          </button>

          <div v-if="error" class="alert alert-error">{{ error }}</div>
          <div v-if="success" class="alert alert-success">{{ success }}</div>
        </div>
      </div>
    </div>

    <!-- ============================================= -->
    <!-- MODAL CAMBIAR FOTO DE PERFIL -->
    <!-- ============================================= -->
    <div v-if="showPictureModal" class="modal-overlay" @click.self="togglePictureModal">
      <div class="modal-box">
        <button class="modal-close-x" @click="togglePictureModal">✕</button>
        <h2 class="modal-title">Cambiar foto de perfil</h2>

        <div class="change-picture-container">
          <ChangePicture @image-updated="handleImageUpdated" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/config/supabase'
import { useRouter } from 'vue-router'
import ChangePicture from '@/components/Profile/ChangePicture.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useCustomization } from '@/composables/useCustomization'
import { getItemById } from '@/data/shopThemes'

export default {
  name: 'Profile',
  components: { ChangePicture, Sidebar },
  setup() {
    const router = useRouter()
    const showChangePicture = ref(false)
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
    const currentMenuTrip = ref(null)
    const trips = ref([])
    const savedTrips = ref([])
    const drafts = ref([])
    const currentTab = ref('published')
    const friends = ref([])
    const showFriends = ref(false)
    // === FIX para variables usadas en el template ===
    const showEditModal = ref(false)
    const showPictureModal = ref(false)
    
    function toggleEditModal() {
      showEditModal.value = !showEditModal.value
    }
    
    function togglePictureModal() {
      showPictureModal.value = !showPictureModal.value
    }
    
    // Si existen inputs para editar perfil:
    const editUsername = ref('')
    const editDisplayName = ref('')
    const editBio = ref('')
    
    // Si el template usa esto, define aunque sea vacío:
    function formatFriendCount(n) {
      return n || 0
    }


    const defaultAvatar =
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'

    // Sistema de personalización de fondo
    const { getEquippedItem } = useCustomization()
    const bgStyle = computed(() => {
      const equippedBgId = getEquippedItem('profileBg')
      const bgItem = equippedBgId ? getItemById(equippedBgId) : null
      const bgUrl = bgItem?.bgUrl || 'https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?ixlib=rb-4.1.0'
      return {
        background: `url('${bgUrl}') center/cover no-repeat`
      }
    })

    const showConfirmDeleteFriend = ref(false)
    const friendToDelete = ref(null)

    const showConfirmDeleteTrip = ref(false)
    const tripToDelete = ref(null)

    const openDeleteFriendConfirm = (id) => {
      showConfirmDeleteFriend.value = true
      friendToDelete.value = id
    }

    const confirmDeleteFriend = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        await fetch(`/api/delete-friend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            friend_id: friendToDelete.value
          })
        })

        // Actualiza la lista
        await loadFriends()

      } catch (e) {
        console.error("Error eliminando amigo:", e)
      }

      showConfirmDeleteFriend.value = false
    }

    const openDeleteTripConfirm = (id) => {
      showConfirmDeleteTrip.value = true
      tripToDelete.value = id
    }

    const confirmDeleteTrip = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { error: deleteError } = await supabase
          .from('trips')
          .delete()
          .eq('id', tripToDelete.value)
          .eq('user_id', session.user.id) // Seguridad extra

        if (deleteError) throw deleteError

        // Recargar listas
        await loadTrips()
        await loadDrafts()
        
      } catch (e) {
        console.error("Error eliminando viaje:", e)
      }

      showConfirmDeleteTrip.value = false
      currentMenuTrip.value = null
    }

    const safeAvatar = (url) => {
      if (!url || url === 'undefined' || url.trim() === '') {
        return defaultAvatar
      }
      return url
    }

    const currentTrips = computed(() => {
      if (currentTab.value === 'published') {
        return trips.value
      } else if (currentTab.value === 'drafts') {
        return drafts.value
      } else if (currentTab.value === 'saved') {
        return savedTrips.value
      }
      return []
    })

    const noTripsMessage = computed(() => {
      if (currentTab.value === 'published') {
        return 'No hay viajes publicados.'
      } else if (currentTab.value === 'drafts') {
        return 'No hay borradores.'
      } else if (currentTab.value === 'saved') {
        return 'No hay viajes guardados.'
      }
      return ''
    }
  
    )

    // === Cargar perfil ===
    const loadProfile = async () => {
      loading.value = true
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
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

    // === Cargar amigos ===
    const loadFriends = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) return

        const res = await fetch(
          `/api/friends?userId=${uid}`
        )
        const body = await res.json()

        if (body.ok) {
          friends.value = body.friends.map((f) => ({
            id: f.friend.id,
            username: f.friend.username,
            avatar_url: f.friend.avatar_url
          }))
        } else {
          friends.value = []
        }
      } catch {
        friends.value = []
      }const formatCount = (count) => {
  if (count < 1000) return count.toString();

  if (count < 1_000_000) {
    const k = count / 1000;
    return (Number.isInteger(k) ? k.toString() : k.toFixed(1)) + 'K';
  }

  const m = count / 1_000_000;
  return (Number.isInteger(m) ? m.toString() : m.toFixed(1)) + 'M';
};

    }

    const formatCount = (count) => {
      if (count < 1000) return count;
      if (count < 1000000){
        if (count % 1000 < 100){
          return (count / 1000).toFixed(0) + 'K';
        } else {
          return (count / 1000).toFixed(1) + 'K';
        }
      }
      if (count < 1000000000){
        if (count % 1000000 < 100000){
          return (count / 1000000).toFixed(0) + 'M';
        } else {
          return (count / 1000000).toFixed(1) + 'M';
        }
      }
    };


    // === Guardar perfil ===
    const API_URL = ''
    const saveProfile = async () => {
      error.value = ''
      success.value = ''
      saving.value = true
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        const token = session?.access_token

        const payload = {
          userId: user.value.id,
          username: profileData.value.username,
          display_name: profileData.value.display_name,
          bio: profileData.value.bio,
          avatar_url: profileData.value.avatar_url
        }

        // check if username contains spaces
        if (/\s/.test(payload.username)) {
          throw new Error('El nombre de usuario no puede contener espacios')
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
        success.value =
          body.message || 'Perfil actualizado correctamente ✅'
        originalData.value = { ...profileData.value }
        isEditing.value = false
      } catch (err) {
        console.error('saveProfile error:', err)
        error.value = err.message || 'Error al guardar el perfil'
      } finally {
        saving.value = false
      }
    }

    const saveProfileAndClose = async () => {
      await saveProfile()
      if (!error.value) {
        showEditModal.value = false
      }
    }

    // === Cargar viajes publicados ===
    const loadTrips = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        user.value = session?.user
        if (!user.value) return

        const { data, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.value.id)
          .eq('status', 'published')
          .order('start_date', { ascending: false })

        if (tripsError) throw tripsError

        trips.value = (data || []).map((trip) => ({
          id: trip.id,
          title: trip.trip_name || 'Sin título',
          description: trip.description || 'Sin descripción',
          image:
            trip.cover_image ||
            'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg',
          views: trip.views || 0
        }))
      } catch (err) {
        console.error('Error cargando viajes:', err)
      }
    }

    // === Cargar viajes guardados ===
    const loadSavedTrips = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) return


        const res = await fetch(`/api/trips/saved/${userId}`)
        const body = await res.json()

        if (!body.ok || !body.trips) {
          savedTrips.value = []
          return
        }

        const trips = body.trips

        savedTrips.value = trips.map(t => ({
          id: t.id,
          title: t.tripName || "Sin título",
          description: t.description || "Sin descripción",
          image: t.coverImage ||
            "https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg",
          author: {
            id: t.userId,
            username: t.userName,
            avatar_url: t.userAvatar
          },
          views: t.views || 0
        }))

      } catch (err) {
        console.error("Error cargando viajes guardados:", err)
        savedTrips.value = []
      }
    }


    // === Cargar borradores ===
    const loadDrafts = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        user.value = session?.user
        if (!user.value) return

        const { data, error: draftsError } = await supabase
          .from('trips')
          .select('id, trip_name, description, cover_image, status, start_date')
          .eq('user_id', user.value.id)
          .eq('status', 'draft')
          .order('start_date', { ascending: false })

        if (draftsError) throw draftsError

        drafts.value = (data || []).map((trip) => ({
          id: trip.id,
          title: trip.trip_name || 'Sin título',
          description: trip.description || 'Sin descripción',
          image:
            trip.cover_image ||
            'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'
        }))
      } catch (err) {
        console.error('Error cargando borradores:', err)
      }
    }

    const truncateText = (text, limit) =>
      text?.length > limit ? text.slice(0, limit) + '...' : text || ''

    const goToTrip = (tripId) => router.push(`/post/${tripId}`)

    const goToUser = (id) => {
      showFriends.value = false
      router.push(`/user/${id}`)
    }

    const toggleMenu = (tripId) => {
      currentMenuTrip.value =
        currentMenuTrip.value === tripId ? null : tripId
    }

    const editTrip = (tripId) =>
      router.push(`/createtrip/${tripId}`)

    const handleImageUpdated = async (newUrl) => {
      profileData.value.avatar_url = newUrl
      showPictureModal.value = false
      localStorage.setItem('profile_avatar_url', newUrl)
      await saveProfile()
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
      await loadFriends()
      await loadTrips()
      await loadDrafts()
      await loadSavedTrips()
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    const viewsIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
      trips,
      drafts,
      currentTab,
      currentTrips,
      noTripsMessage,
      currentMenuTrip,
      truncateText,
      toggleMenu,
      editTrip,
      goToTrip,
      saveProfile,
      friends,
      bgStyle,
      showFriends,
      goToUser,
      defaultAvatar,
      safeAvatar,
      showConfirmDeleteFriend,
      openDeleteFriendConfirm,
      confirmDeleteFriend,
      showConfirmDeleteTrip,
      openDeleteTripConfirm,
      confirmDeleteTrip,
      showEditModal,
      toggleEditModal,
      editUsername,
      editDisplayName,
      editBio,
      showPictureModal,
      togglePictureModal,
      handleImageUpdated,
      formatCount,
      saveProfileAndClose,
      viewsIcon,
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: url('https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?ixlib=rb-4.1.0') center/cover no-repeat;
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
}

.profile-text {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 300px;
  word-wrap: break-word;
  overflow-wrap: break-word;
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
  margin-top: 0.3rem;
  background: #02a18f;
  color: #fff;
  padding: 0.4rem 1.2rem;
  border-radius: 10px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  font-size: 0.9rem;
  width: 150px;
}



.edit-btn:hover {
  background: #028f7f;
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

.cancel-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: 0.6rem 3rem;
  border-radius: 25px;
  color: #fff;
  cursor: pointer;
  transition: 0.2s;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 0.2rem;
}

/* --- VIAJES RECIENTES --- */
.recent-trips-section {
  width: 95%;
  border-radius: 0;
  overflow: hidden;
  padding-bottom: 2rem;
  padding-top: 1.5rem;
}

.recent-trips-header {
  text-align: left;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(2, 161, 143, 0.8), rgba(55, 86, 137, 0.8));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.tabs button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  font-weight: 500;
  padding: 0;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: border-bottom 0.3s;
}

.tabs button.active {
  border-bottom: 2px solid #fff;
}

.separator {
  color: #fff;
  font-size: 1.3rem;
  font-weight: 500;
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

.trip-image-container {
  position: relative;
  width: 150px;
  height: 100%;
  flex-shrink: 0;
}

.trip-image {
  width: 100%;
  height: 100%;
  border-radius: 12px 0 0 12px;
  object-fit: cover;
}

.faded {
  opacity: 0.7;
}

.draft-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  white-space: nowrap;
}

.trip-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: flex-start;
  padding: 1rem;
}

.trip-details {
  flex-grow: 1;
}

  .tabs button {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.3rem;
    font-weight: 500;
    padding: 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: border-bottom 0.3s;
  }

  .tabs button.active {
    border-bottom: 2px solid #fff;
  }

  .separator {
    color: #fff;
    font-size: 1.3rem;
    font-weight: 500;
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
  
  .trip-image-container {
    position: relative;
    width: 150px;
    height: 100%;
    flex-shrink: 0;
  }

  .trip-image {
    width: 100%;
    height: 100%;
    border-radius: 12px 0 0 12px;
    object-fit: cover;
  }

  .faded {
    opacity: 0.7;
  }

  .draft-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.5);
    pointer-events: none;
    white-space: nowrap;
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
  background: rgba(0, 0, 0, 0.1);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #0a0a0a;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
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

.menu-item {
  padding: 0.7rem 1.2rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  color: #0a0a0a;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menu-item:hover {
  background: #f0f0f0;
}

.edit-item {
  color: #0a0a0a;
}

.delete-item {
  color: #ff0000;
}

.trip-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.name-friends-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.friends-btn {
  background: white;
  color: #111;
  padding: 0.4rem 1rem;
  border-radius: 10px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  font-size: 0.9rem;
}
.friends-btn:hover {
  background: #e0e0e0;
}

/* === Modal === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-box {
  background: #112233;
  padding: 2rem;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  color: white;
  position: relative;
}

.modal-title {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.modal-close-x {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: white;
  opacity: 0.8;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}


.friend-avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid white;
}

.friend-username {
  font-size: 1.1rem;
}

.no-friends {
  text-align: center;
  padding: 1rem 0;
  opacity: 0.8;
}
.friend-click-zone {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-grow: 1;           
  cursor: pointer;
  padding-right: 1rem;
}


.friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: default; /* ⬅ ELIMINA EL CLICK GENERAL */
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer; /* SOLO ESTA PARTE ES CLICABLE */
}

.delete-friend-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #ff6b6b;
  cursor: pointer;
  padding: 0 0.5rem;
}

.delete-friend-btn:hover {
  color: #ff3b3b;
}

/* Contenedor de acciones */
.modal-actions {
  margin-top: 1.8rem;
  display: flex;
  justify-content: center;
  gap: 1.2rem;        /* más separación */
}

/* Botón cancelar */
.btn-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 0.55rem 1.4rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: 0.2s;
}

/* Botón eliminar */
.btn-danger {
  background: #ff4b4b;
  color: #fff;
  padding: 0.55rem 1.4rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: 0.2s;
}

.btn-danger:hover {
  background: #e03b3b;
}

/* Botón X de cerrar—más bonito */
.modal-close-x {
  top: 15px;
  right: 15px;
  width: 34px;
  height: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  backdrop-filter: blur(4px);
  transition: 0.2s;
}

/* Scroll para lista de amigos (máx. 5 amigos visibles) */
.friends-list-scroll {
  max-height: 320px;      /* ≈ 5 amigos (5 × ~60px) */
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* Barra de scroll bonita */
.friends-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.friends-list-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.friends-list-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}


.trip-author {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  color: #0a0a0a;
  font-size: 0.9rem;
  margin-left: 1rem;
  margin-right: 1rem;
}

.published-by {
  font-size: 0.85rem;
  opacity: 0.8;
}

.author-info {
  display: flex;
  align-items: center;
  margin-top: 0.3rem;
}

.trip-author .avatar {
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.trip-views {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.8rem;
  font-size: 0.85rem;
  color: #555;
}

</style>
