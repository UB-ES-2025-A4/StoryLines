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
              {{ friends.length }} amigos
            </button>
          </div>

          <h1 class="display-name">{{ profile.display_name }}</h1>
          <p class="bio">{{ profile.bio }}</p>
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

        <div v-for="f in friends" :key="f.id" class="friend-item">
          <img
            :src="f.avatar_url || defaultAvatar"
            class="friend-avatar"
            alt="Avatar amigo"
          />
          <span class="friend-username">{{ f.username }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const defaultAvatar =
  'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'

const defaultImg =
  'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'

/* ===============================
   CARGAR PERFIL
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
   CARGAR VIAJES PUBLICADOS
   (el backend ya filtra status = 'published')
================================ */
const loadTrips = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/trips?userId=${userId.value}`)
    if (!res.ok) throw new Error('Error HTTP')

    const body = await res.json()
    if (body.ok) {
      // Solo viajes de este usuario
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
   CARGAR AMIGOS (SOLO ACCEPTED)
   El backend ya filtra status = 'accepted'
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
        .filter((f) => f.id) // limpia posibles nulos
    } else {
      friends.value = []
    }
  } catch (e) {
    console.error('Error cargando amigos:', e)
    friends.value = []
  }
}

/* ===============================
   HELPERS
================================ */
const truncateText = (text, limit) =>
  text?.length > limit ? text.slice(0, limit) + '...' : text || ''

const goToTrip = (id) => router.push(`/post/${id}`)

/* ===============================
   CARGAR TODO AL ENTRAR
================================ */
onMounted(async () => {
  loading.value = true
  await loadProfile()
  await loadTrips()
  await loadFriends()
  loading.value = false
})

/* ===============================
   REACCIONAR SI CAMBIA EL :id
================================ */
watch(
  () => route.params.id,
  async (newId) => {
    userId.value = newId
    loading.value = true
    await loadProfile()
    await loadTrips()
    await loadFriends()
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
  gap: 2rem;
  margin-bottom: 2rem;
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

/* === Trips === */
.recent-trips-section {
  width: 95%;
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

/* === Friends Modal === */
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

.friend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
</style>
