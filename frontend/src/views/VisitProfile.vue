<template>
  <div class="profile-page">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Loading -->
    <div v-if="loading" class="loading">Cargando...</div>

    <!-- Contenido -->
    <div v-else class="profile-card">
      <!-- CABECERA -->
      <div class="profile-header">
        <div class="avatar-container">
          <img
            class="avatar"
            :src="profile.avatar_url || defaultAvatar"
            alt="Foto de perfil"
          />
        </div>

        <div class="profile-text">
          <!-- NOMBRE + BOTÓN AMIGOS -->
          <div class="name-friends-row">
            <h2 class="username">{{ profile.username }}</h2>

            <button class="friends-btn" @click="showFriends = true">
              Amigos | {{ friends.length }} 
            </button>
          </div>

          <h1 class="display-name">{{ profile.display_name }}</h1>
          <p class="bio">{{ profile.bio }}</p>

          <!-- NUEVO BOTÓN DE ESTADO DE AMISTAD -->
          <button
            v-if="currentUserId && !isOwnProfile"
            class="friend-action-btn"
            :disabled="friendActionLoading"
            @click="onFriendButtonClick"
          >
            {{ friendButtonLabel }}
          </button>
        </div>
      </div>

      <!-- VIAJES PUBLICADOS -->
      <div class="recent-trips-section">
        <div class="recent-trips-header">
          <h2 style="text-align:center; color:white">Viajes publicados</h2>
        </div>

        <div class="trips-container">
          <!-- Tarjetas como en Profile.vue (SIN menú) -->
          <div v-if="trips.length > 0" class="trip-cards-wrapper">
            <div
              class="trip-card"
              v-for="trip in trips"
              :key="trip.id"
              @click="goToTrip(trip.id)"
            >
              <img
                :src="trip.coverImage || trip.cover_image || defaultImg"
                alt="Foto del viaje"
                class="trip-image"
              />
              <div class="trip-info">
                <div class="trip-details">
                  <h4>{{ trip.tripName || trip.trip_name || 'Sin título' }}</h4>
                  <p>{{ truncateText(trip.description, 120) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-trips-message">
            No hay viajes publicados.
          </div>
        </div>
      </div>
    </div>

    <!-- POPUP AMIGOS -->
    <div
      v-if="showFriends"
      class="modal-overlay"
      @click.self="showFriends = false"
    >
      <div class="modal-box">
        <button class="modal-close-x" @click="showFriends = false">✕</button>
        <h2 class="modal-title">Amigos</h2>

        <div v-if="friends.length === 0" class="no-friends">
          Este usuario no tiene amigos todavía.
        </div>

        <div class="friends-list-scroll">
        <div
          v-for="f in friends"
          :key="f.id"
          class="friend-item"
          @click="goToUser(f.id)"
        >
          <img :src="f.avatar_url || defaultAvatar" class="friend-avatar" />
          <span class="friend-username">{{ f.username }}</span>
        </div>
      </div>

      </div>
    </div>

    <!-- POPUP CONFIRMAR ELIMINAR AMIGO -->
    <div
      v-if="showConfirmUnfriend"
      class="modal-overlay"
      @click.self="showConfirmUnfriend = false"
    >
      <div class="modal-box">
        <button class="modal-close-x" @click="showConfirmUnfriend = false">
          ✕
        </button>
        <h2 class="modal-title">Eliminar amigo</h2>
        <p>¿Seguro que quieres eliminar a este amigo?</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showConfirmUnfriend = false">
            Cancelar
          </button>
          <button class="btn-danger" @click="confirmUnfriend">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'
import Sidebar from '@/components/Sidebar.vue'

const API_BASE = 'http://localhost:3000'

const route = useRoute()
const router = useRouter()
const userId = ref(route.params.id)

const loading = ref(true)
const profile = ref({})
const trips = ref([])
const friends = ref([])
const showFriends = ref(false)

// usuario logueado
const currentUserId = ref(null)

// estado del botón de amistad: 'none' | 'pending' | 'accepted'
const friendStatus = ref('none')
const friendActionLoading = ref(false)
const showConfirmUnfriend = ref(false)

const defaultAvatar =
  'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'

const defaultImg =
  'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'

/* ===============================
   PERFIL
================================ */
const loadProfile = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/profile-data?userId=${userId.value}`)
    if (!res.ok) throw new Error('Error HTTP')

    const body = await res.json()
    if (body.ok) {
      profile.value = body.profile || {}
    } else {
      profile.value = {}
    }
  } catch (e) {
    console.warn('Error cargando perfil público:', e)
    profile.value = {}
  }
}

/* ===============================
   VIAJES PUBLICADOS
================================ */
const loadTrips = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/trips?userId=${userId.value}`)
    if (!res.ok) throw new Error('Error HTTP')

    const body = await res.json()
    if (body.ok) {
      trips.value = (body.trips || []).filter(
        (t) => t.userId === userId.value
      )
    } else {
      trips.value = []
    }
  } catch (e) {
    console.error('Error cargando trips:', e)
    trips.value = []
  }
}

/* ===============================
   AMIGOS ACEPTADOS (lista + contador)
================================ */
const loadFriends = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/friends?userId=${userId.value}`)
    if (!res.ok) throw new Error('Error HTTP')

    const body = await res.json()
    if (body.ok) {
      friends.value = (body.friends || [])
        .map((f) => ({
          id: f.friend?.id,
          username: f.friend?.username,
          avatar_url: f.friend?.avatar_url
        }))
        .filter((f) => f.id)
    } else {
      friends.value = []
    }
  } catch (e) {
    console.error('Error cargando amigos:', e)
    friends.value = []
  }
}

/* ===============================
   CARGAR USUARIO ACTUAL
================================ */
const loadCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    currentUserId.value = session?.user?.id || null
  } catch (e) {
    console.error('Error obteniendo usuario actual:', e)
    currentUserId.value = null
  }
}

const isOwnProfile = computed(
  () => currentUserId.value && currentUserId.value === userId.value
)

/* ===============================
   ESTADO DE AMISTAD (BOTÓN)
   usa /api/friends?userId=currentUser&includePending=true
================================ */
const loadFriendStatus = async () => {
  // si no hay usuario logueado o es su propio perfil → sin botón
  if (!currentUserId.value || isOwnProfile.value) {
    friendStatus.value = 'none'
    return
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/friends?userId=${currentUserId.value}&includePending=true`
    )
    if (!res.ok) throw new Error('Error HTTP')

    const body = await res.json()
    if (!body.ok) {
      friendStatus.value = 'none'
      return
    }

    const list = body.friends || []

    // buscamos relación donde el otro sea el dueño del perfil
    const relation = list.find((f) => f.friend?.id === userId.value)

    if (!relation) {
      friendStatus.value = 'none'
    } else if (relation.status === 'pending') {
      friendStatus.value = 'pending'
    } else if (relation.status === 'accepted') {
      friendStatus.value = 'accepted'
    } else {
      friendStatus.value = 'none'
    }
  } catch (e) {
    console.error('Error obteniendo estado de amistad:', e)
    friendStatus.value = 'none'
  }
}

/* ===============================
   ACCIONES DEL BOTÓN
================================ */
const friendButtonLabel = computed(() => {
  if (!currentUserId.value || isOwnProfile.value) return ''

  switch (friendStatus.value) {
    case 'pending':
      return 'Pendiente'
    case 'accepted':
      return 'Eliminar amigo'
    case 'none':
    default:
      return 'Añadir amigo'
  }
})

const sendFriendRequest = async () => {
  if (!currentUserId.value || isOwnProfile.value) return

  friendActionLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/add-friend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUserId.value,
        friend_id: userId.value
      })
    })

    if (!res.ok) throw new Error('Error al crear solicitud')

    friendStatus.value = 'pending'
  } catch (e) {
    console.error('Error al enviar solicitud de amistad:', e)
  } finally {
    friendActionLoading.value = false
  }
}

const deleteFriend = async () => {
  if (!currentUserId.value || isOwnProfile.value) return

  friendActionLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/delete-friend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUserId.value,
        friend_id: userId.value
      })
    })

    if (!res.ok) throw new Error('Error al eliminar amistad')

    friendStatus.value = 'none'
    await loadFriends() // actualizar contador y lista
  } catch (e) {
    console.error('Error al eliminar amistad:', e)
  } finally {
    friendActionLoading.value = false
  }
}

const onFriendButtonClick = () => {
  if (friendActionLoading.value || !currentUserId.value || isOwnProfile.value) return

  if (friendStatus.value === 'none') {
    // no hay relación → crear pending
    sendFriendRequest()
  } else if (friendStatus.value === 'pending') {
    // cancelar solicitud (delete)
    deleteFriend()
  } else if (friendStatus.value === 'accepted') {
    // mostrar popup de confirmación
    showConfirmUnfriend.value = true
  }
}

const confirmUnfriend = async () => {
  showConfirmUnfriend.value = false
  await deleteFriend()
}

/* ===============================
   HELPERS
================================ */
const truncateText = (text, limit) =>
  text?.length > limit ? text.slice(0, limit) + '...' : text || ''

const goToTrip = (id) => router.push(`/post/${id}`)

const goToUser = (id) => {
  showFriends.value = false
  // Si el usuario que clicas eres tú → ir a tu propio perfil
  if (id === currentUserId.value) {
    router.push('/profile')
  } else {
    router.push(`/user/${id}`)
  }
}


/* ===============================
   LOAD
================================ */
onMounted(async () => {
  loading.value = true
  await loadCurrentUser()
  await loadProfile()
  await loadTrips()
  await loadFriends()
  await loadFriendStatus()
  loading.value = false
})

watch(
  () => route.params.id,
  async (newId) => {
    userId.value = newId
    loading.value = true
    await loadProfile()
    await loadTrips()
    await loadFriends()
    await loadFriendStatus()
    loading.value = false
  }
)
</script>

<style scoped>
/* === Layout General === */
.profile-page {
  min-height: 100vh;
  background: url('https://images.unsplash.com/photo-1604608672516-f1b9b1d37076')
    center/cover no-repeat;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  color: #fff;
}

.loading {
  margin: auto;
  font-size: 1.5rem;
}

/* Tarjeta central */
.profile-card {
  background: linear-gradient(
    to bottom,
    rgba(11, 47, 74, 0.6),
    rgba(39, 45, 45, 0.6)
  );
  backdrop-filter: blur(14px);
  width: 100%;
  max-width: 700px;
  padding: 3rem 1rem;
  min-height: 100vh;
}

/* === Header === */
.profile-header {
    display: flex;
    align-items: center;
    text-align: left;
    gap: 2rem;
    margin-bottom: 2rem;
    justify-content: flex-start;
    margin-left: 80px; /* mueve TODO hacia la derecha */
}

.avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
}

 .profile-text {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }



.name-friends-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-size: 2rem;
}

.display-name {
  font-size: 1.3rem;
}

.bio {
  font-size: 0.9rem;
}

/* === Friends button === */
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

/* === Botón de acción de amigo === */
.friend-action-btn {
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
}

.friend-action-btn[disabled] {
  opacity: 0.7;
  cursor: default;
}

.friend-action-btn:hover:not([disabled]) {
  background: #028270;
}

/* === Trips === */
.recent-trips-section {
  width: 100%;
  max-width: 750px;   /* MISMA ANCHURA QUE PROFILE */
  margin: 0 auto;     /* CENTRAR */
}


.recent-trips-header {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #02a18f, #375689);
}

.trips-container {
  padding: 1.5rem 2rem;
  background: rgba(11, 47, 74, 0.3);
}

/* Tarjetas estilo Profile.vue */
.trip-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.trip-card {
  background: #fff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  height: 150px;
  cursor: pointer;
  transition: 0.2s;
}

.trip-card:hover {
  background: #f0f0f0;
}

.trip-image {
  width: 150px;
  height: 100%;
  border-radius: 12px 0 0 12px;
  object-fit: cover;
}

.trip-info {
  width: 100%;
  display: flex;
}

.trip-details {
  flex-grow: 1;
}

.trip-details h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
}

.trip-details p {
  margin: 0.3rem 0 0;
  color: #222;
  opacity: 0.9;
}

.no-trips-message {
  text-align: center;
  font-size: 1.2rem;
  color: #fff;
}

/* === Modal genérico === */
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
  transition: 0.2s;
}

.modal-close-x:hover {
  opacity: 1;
}

/* Lista de amigos en popup */
.friend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: 0.2s;
}

.friend-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
}

.friend-username {
  font-size: 1.1rem;
}

.no-friends {
  text-align: center;
  padding: 1rem 0;
  opacity: 0.8;
}

/* Botones del modal de eliminar amigo */
.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}

.btn-secondary {
  background: #ccc;
  color: #111;
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
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

</style>
