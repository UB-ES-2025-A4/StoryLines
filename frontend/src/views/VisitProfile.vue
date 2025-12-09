<template>
  <div v-if="bgLoaded" class="profile-page" :style="bgStyle">
    <Sidebar />
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else class="profile-card">
      <div class="profile-header">
        <div class="avatar-container">
          <img class="avatar" :src="profile.avatar_url || defaultAvatar" alt="Foto de perfil" />
        </div>
        <div class="profile-text">
          <div class="name-friends-row">
            <h2 class="username">{{ profile.username }}</h2>
          </div>
          <h1 class="display-name">{{ profile.display_name }}</h1>
          <p class="bio">{{ profile.bio }}</p>
          <div class="button-row">
            <button class="friends-btn" @click="showFriends = true">
              Amigos ({{ formatCount(friends.length) }})
            </button>
            <button v-if="currentUserId && !isOwnProfile" class="friend-action-btn" :disabled="friendActionLoading"
              @click="onFriendButtonClick">
              {{ friendButtonLabel }}
            </button>
          </div>
        </div>
      </div>
      <div class="recent-trips-section">
        <div class="recent-trips-header">
          <div class="tabs">Viajes publicados</div>
        </div>
        <div class="trips-container">
          <div v-if="trips.length > 0" class="trip-cards-wrapper">
            <div class="trip-card" v-for="trip in trips" :key="trip.id" @click="goToTrip(trip.id)">
              <div class="trip-image-container">
                <img :src="trip.coverImage || trip.cover_image || defaultImg" alt="Foto del viaje" class="trip-image" />
              </div>
              <div class="trip-info">
                <div class="trip-details">
                  <h4>{{ trip.tripName || trip.trip_name || 'Sin título' }}</h4>
                  <p>{{ truncateText(trip.description, 120) }}</p>
                </div>
                <div class="trip-stats">
                  <p class="trip-views">
                    <span v-html="viewsIcon"></span> {{ formatCount(trip.views) }}
                  </p>
                  <p class="trip-likes">
                    <span v-html="likesIcon"></span> {{ formatCount(trip.likes) }}
                  </p>
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
    <div v-if="showFriends" class="modal-overlay" @click.self="showFriends = false">
      <div class="modal-box">
        <button class="modal-close-x" @click="showFriends = false">✕</button>
        <h2 class="modal-title">Amigos</h2>
        <div v-if="friends.length === 0" class="no-friends">
          Este usuario no tiene amigos todavía.
        </div>
        <div class="friends-list-scroll">
          <div v-for="f in friends" :key="f.id" class="friend-item" @click="goToUser(f.id)">
            <img :src="f.avatar_url || defaultAvatar" class="friend-avatar" />
            <span class="friend-username">{{ f.username }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showConfirmUnfriend" class="modal-overlay" @click.self="showConfirmUnfriend = false">
      <div class="modal-box">
        <button class="modal-close-x" @click="showConfirmUnfriend = false">✕</button>
        <h2 class="modal-title">Eliminar amigo</h2>
        <p>¿Seguro que quieres eliminar a este amigo?</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showConfirmUnfriend = false">Cancelar</button>
          <button class="btn-danger" @click="confirmUnfriend">Eliminar</button>
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
import { getItems } from '@/data/shopThemes'
import { useCustomization, initialize, resetCustomization } from '@/composables/useCustomization'

const API_BASE = ''
const route = useRoute()
const router = useRouter()
const userId = ref(route.params.id)

const loading = ref(true)
const profile = ref({})
const trips = ref([])
const friends = ref([])
const showFriends = ref(false)
const currentUserId = ref(null)
const friendStatus = ref('none')
const friendActionLoading = ref(false)
const showConfirmUnfriend = ref(false)
const bgLoaded = ref(false)
const allItems = ref([])
const profilePageRef = ref(null)

const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'
const defaultImg = 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'
const defaultProfileBg = "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?ixlib=rb-4.1.0"

const { getEquippedItem } = useCustomization()

const bgStyle = computed(() => {
  const equippedBgId = getEquippedItem("profileBg")
  console.log('🔥 VISIT PROFILE - equippedBgId:', equippedBgId)
  console.log('🔥 VISIT PROFILE - allItems length:', allItems.value.length)

  if (!equippedBgId || allItems.value.length === 0) {
    console.log('🔥 VISIT PROFILE - Usando fondo por defecto')
    const style = {
      background: `url('${defaultProfileBg}') center/cover no-repeat`
    }
    console.log('🔥 VISIT PROFILE - Estilo por defecto:', style)
    return style
  }

  const item = allItems.value.find(i => i.id === equippedBgId)
  console.log('🔥 VISIT PROFILE - Item encontrado:', item)
  
  if (!item) {
    console.log('🔥 VISIT PROFILE - No se encontró item, usando fondo por defecto')
    const style = {
      background: `url('${defaultProfileBg}') center/cover no-repeat`
    }
    return style
  }
  
  let bgUrl = item.bgUrl || item.imageUrl
  
  if (!bgUrl) {
    console.log('🔥 VISIT PROFILE - Item sin URL, usando fondo por defecto')
    const style = {
      background: `url('${defaultProfileBg}') center/cover no-repeat`
    }
    return style
  }
  
  // Corregir URLs locales
  if (bgUrl.startsWith('/src/assets/')) {
    bgUrl = bgUrl.replace('/src/assets/', '/')
  } else if (!bgUrl.startsWith('http') && !bgUrl.startsWith('/')) {
    bgUrl = '/' + bgUrl
  }
  
  console.log('🔥 VISIT PROFILE - URL final:', bgUrl)

  const style = {
    background: `url('${bgUrl}') center/cover no-repeat`
  }
  console.log('🔥 VISIT PROFILE - Estilo final:', style)
  return style
})

const loadProfile = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/profile/data?userId=${userId.value}`)
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

const loadTrips = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/trips?userId=${userId.value}`)
    if (!res.ok) throw new Error('Error HTTP')
    const body = await res.json()
    if (body.ok) {
      trips.value = (body.trips || []).filter((t) => t.userId === userId.value)
    } else {
      trips.value = []
    }
  } catch (e) {
    console.error('Error cargando trips:', e)
    trips.value = []
  }
}

const loadFriends = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/friends?userId=${userId.value}`)
    if (!res.ok) throw new Error('Error HTTP')
    const body = await res.json()
    if (body.ok) {
      friends.value = body.friends.map(f => ({
        id: f.friend.id,
        username: f.friend.username,
        avatar_url: f.friend.avatar_url
      })).filter((f) => f.id)
    } else {
      friends.value = []
    }
  } catch (e) {
    console.error('Error cargando amigos:', e)
    friends.value = []
  }
}

const loadCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    currentUserId.value = session?.user?.id || null
  } catch (e) {
    console.error('Error obteniendo usuario actual:', e)
    currentUserId.value = null
  }
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = resolve
    img.src = src
  })
}

const isOwnProfile = computed(() => currentUserId.value && currentUserId.value === userId.value)

const loadFriendStatus = async () => {
  if (!currentUserId.value || isOwnProfile.value) {
    friendStatus.value = 'none'
    return
  }
  try {
    const res = await fetch(`${API_BASE}/api/friends?userId=${currentUserId.value}&includePending=true`)
    if (!res.ok) throw new Error('Error HTTP')
    const body = await res.json()
    if (!body.ok) {
      friendStatus.value = 'none'
      return
    }
    const list = body.friends || []
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

const friendButtonLabel = computed(() => {
  if (!currentUserId.value || isOwnProfile.value) return ''
  switch (friendStatus.value) {
    case 'pending': return 'Pendiente'
    case 'accepted': return 'Eliminar amigo'
    case 'none':
    default: return 'Añadir amigo'
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
    await loadFriends()
  } catch (e) {
    console.error('Error al eliminar amistad:', e)
  } finally {
    friendActionLoading.value = false
  }
}

const onFriendButtonClick = () => {
  if (friendActionLoading.value || !currentUserId.value || isOwnProfile.value) return
  if (friendStatus.value === 'none') {
    sendFriendRequest()
  } else if (friendStatus.value === 'pending') {
    deleteFriend()
  } else if (friendStatus.value === 'accepted') {
    showConfirmUnfriend.value = true
  }
}

const confirmUnfriend = async () => {
  showConfirmUnfriend.value = false
  await deleteFriend()
}

const truncateText = (text, limit) => text?.length > limit ? text.slice(0, limit) + '...' : text || ''
const goToTrip = (id) => router.push(`/post/${id}`)
const goToUser = (id) => {
  showFriends.value = false
  if (id === currentUserId.value) {
    router.push('/profile')
  } else {
    router.push(`/user/${id}`)
  }
}

const formatCount = (count) => {
  if (count < 1000) return count;
  if (count < 1000000) {
    if (count % 1000 < 100) {
      return (count / 1000).toFixed(0) + 'K';
    } else {
      return (count / 1000).toFixed(1) + 'K';
    }
  }
  if (count < 1000000000) {
    if (count % 1000000 < 100000) {
      return (count / 1000000).toFixed(0) + 'M';
    } else {
      return (count / 1000000).toFixed(1) + 'M';
    }
  }
};

onMounted(async () => {
  loading.value = true
  
  await loadCurrentUser()
  
  if (userId.value) {
    console.log('🔥 VISIT PROFILE - Inicializando para usuario:', userId.value)
    await initialize(userId.value)
    console.log('🔥 VISIT PROFILE - Inicialización completa')
  }
  
  allItems.value = await getItems()
  
  const equippedBgId = getEquippedItem("profileBg")
  const bgItem = allItems.value.find(i => i.id === equippedBgId)
  const bgUrlPreload = bgItem?.bgUrl || defaultProfileBg
  await preloadImage(bgUrlPreload)
  
  bgLoaded.value = true
  
  // Debug: verificar que el estilo se aplica
  setTimeout(() => {
    if (profilePageRef.value) {
      console.log('🔥 VISIT PROFILE - Elemento DOM:', profilePageRef.value)
      console.log('🔥 VISIT PROFILE - Estilo aplicado:', profilePageRef.value.style.background)
      console.log('🔥 VISIT PROFILE - Computed style:', window.getComputedStyle(profilePageRef.value).background)
    }
  }, 100)
  
  await loadProfile()
  await loadTrips()
  await loadFriends()
  await loadFriendStatus()
  loading.value = false
})

watch(() => route.params.id, async (newId) => {
  userId.value = newId
  loading.value = true
  bgLoaded.value = false
  
  // Reset personalización antes de cargar nuevo usuario
  resetCustomization()
  
  if (newId) {
    console.log('🔥 VISIT PROFILE - Inicializando para nuevo usuario:', newId)
    await initialize(newId)
    console.log('🔥 VISIT PROFILE - Nueva inicialización completa')
  }
  
  const equippedBgId = getEquippedItem("profileBg")
  const bgItem = allItems.value.find(i => i.id === equippedBgId)
  const bgUrlWatch = bgItem?.bgUrl || defaultProfileBg
  await preloadImage(bgUrlWatch)
  
  bgLoaded.value = true
  
  await loadProfile()
  await loadTrips()
  await loadFriends()
  await loadFriendStatus()
  loading.value = false
})

const viewsIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const likesIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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

.loading {
  margin: auto;
  font-size: 1.5rem;
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

.profile-header {
  display: flex;
  align-items: center;
  text-align: left;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: flex-start;
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
  max-width: 300px;
  word-wrap: break-word;
  overflow-wrap: break-word;
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
  width: 150px;
}

.friends-btn:hover {
  background: #e0e0e0;
}

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
  width: 150px;
}

.friend-action-btn[disabled] {
  opacity: 0.7;
  cursor: default;
}

.friend-action-btn:hover:not([disabled]) {
  background: #028270;
}

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
  border-radius: 10px 10px 0 0;
  height: 75px;
}

.tabs {
  margin-left: 1rem;
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 3rem;
  height: 100%;
  position: relative;
  font-size: 1.3rem;
  font-weight: 500;
  color: #fff;
}

.trips-container {
  display: flex;
  flex-direction: column;
  padding: 1.5rem 2rem;
  background: rgba(11, 47, 74, 0.3);
  border-radius: 0;
  min-height: 200px;
}

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
  padding: 0;
  transition: all 0.3s ease;
  height: 150px;
  cursor: pointer;
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

.trip-details h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
}

.trip-details p {
  font-size: 0.95rem;
  opacity: 0.9;
  color: #0a0a0a;
}

.no-trips-message {
  text-align: center;
  font-size: 1.2rem;
  color: #fff;
}

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

.friends-list-scroll {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

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

.button-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.trip-stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.5rem;
  margin-left: -0.5rem;
}

.trip-views {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.85rem;
  color: #555;
}

.trip-likes {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.85rem;
  color: #555;
}
</style>