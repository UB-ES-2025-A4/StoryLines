<template>
  <div v-show="isOpen" class="searcher-content">
    <div class="searcher-header">
      <h2>Buscar</h2>
      <button class="close-btn" @click="closeSearcher">✕</button>
    </div>

    <div class="search-box">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2"/>
      </svg>
      <input 
        ref="searchInput"
        v-model="searchQuery" 
        type="text" 
        placeholder="Busca un usuario"
        @input="onSearchInput"
      />
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <div class="results">
      <div v-if="loading" class="loading">Buscando usuarios...</div>
      <div v-else-if="searchResults.length === 0 && searchQuery" class="empty">
        No se encontraron usuarios
      </div>
      <div v-else-if="searchResults.length > 0" class="results-list">
        <div 
          v-for="user in searchResults.slice(0, 10)" 
          :key="user.id" 
          class="result-item"
        >
        <div class="user-info" @click="goToUser(user.id)">

            <div class="avatar">
              <img :src="user.avatar_url || '/default-avatar.png'" :alt="user.username" />
            </div>
            <div class="user-details">
              <div>
                <span class="username">{{ user.username }}</span>
              </div>
              <div class="display-name">{{ user.display_name || 'Sin nombre' }}</div>
            </div>
          </div>
          <button 
            :class="getButtonClass(user.friendshipStatus)"
            :disabled="isButtonDisabled(user.friendshipStatus)"
            @click="handleAction(user)"
          >
            {{ getButtonText(user.friendshipStatus) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref, watch, nextTick } from 'vue'
import { supabase } from '@/config/supabase.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToUser = (id) => {
  router.push(`/user/${id}`)
  emit('close')
}

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)
const message = ref('')
const messageType = ref('')
const searchInput = ref(null)
let searchTimeout = null
let currentUserId = null

// Get current user
supabase.auth.getUser().then(({ data: { user } }) => {
  if (user) currentUserId = user.id
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  } else {
    searchQuery.value = ''
    searchResults.value = []
    message.value = ''
  }
})

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  const query = searchQuery.value.trim()
  
  if (query.length >= 1) {
    searchTimeout = setTimeout(() => {
      searchUsers()
    }, 300)
  } else {
    searchResults.value = []
  }
}

const searchUsers = async () => {
  if (!currentUserId) {
    showMessage('Debes iniciar sesión para buscar usuarios', 'error')
    return
  }

  const query = searchQuery.value.trim()
  if (!query) {
    searchResults.value = []
    return
  }

  loading.value = true
  message.value = ''

  try {
    const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}&userId=${currentUserId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error en la búsqueda')
    }

    const data = await response.json()
    // Filtrar al usuario actual de los resultados
    searchResults.value = (data.users || []).filter(user => user.id !== currentUserId)

  } catch (error) {
    console.error('Error:', error)
    showMessage(`Error: ${error.message}`, 'error')
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const handleAction = async (user) => {
  if (user.friendshipStatus === 'none') {
    await sendFriendRequest(user)
  } else if (user.friendshipStatus === 'pending_received') {
    await acceptRequest(user)
  }
}

async function acceptRequest(user) {
try {
  // Obtener notificaciones para encontrar el friendship_id
  const notifResponse = await fetch(`/api/notifications?userId=${currentUserId}`)
  const notifData = await notifResponse.json()
  
  // Buscar la notificación de solicitud de amistad de este usuario
  const friendRequest = notifData.notifications?.find(
    notif => notif.type === 'friend-approval' && notif.sender.id === user.id
  )
  
  if (!friendRequest) {
    throw new Error('No se encontró la solicitud de amistad')
  }

  // Aceptar la solicitud usando el friendship_id
  const res = await fetch('/api/friend-request/respond', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      friendship_id: friendRequest.friendship_id,
      action: 'accept',
      currentUserId: currentUserId
    })
  })
  
  const data = await res.json()
  
  if (data.ok) {
    showMessage(`Solicitud de ${user.username} aceptada`, 'success')
    await searchUsers() // Refresh results
  } else {
    throw new Error(data.error || 'Error aceptando solicitud')
  }
} catch (e) {
  console.error('Error:', e)
  showMessage(`Error: ${e.message}`, 'error')
}
}


const sendFriendRequest = async (user) => {
  if (!confirm(`¿Enviar solicitud de amistad a ${user.username}?`)) {
    return
  }

  try {
    const response = await fetch('/api/add-friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUserId,
        friend_id: user.id
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error enviando solicitud')
    }

    showMessage(`Solicitud enviada a ${user.username}`, 'success')
    await searchUsers() // Refresh results

  } catch (error) {
    console.error('Error:', error)
    showMessage(`${error.message}`, 'error')
  }
}

const getButtonClass = (status) => {
  const baseClass = 'action-btn'
  switch (status) {
    case 'none': return `${baseClass} btn-add`
    case 'pending_sent': return `${baseClass} btn-pending`
    case 'pending_received': return `${baseClass} btn-accept`
    case 'friends': return `${baseClass} btn-friends`
    default: return baseClass
  }
}

const getButtonText = (status) => {
  switch (status) {
    case 'none': return 'Añadir amigo'
    case 'pending_sent': return 'Pendiente'
    case 'pending_received': return 'Aceptar'
    case 'friends': return 'Amigos'
    default: return ''
  }
}

const isButtonDisabled = (status) => {
  return ['pending_sent', 'friends'].includes(status)
}

const showMessage = (text, type) => {
  message.value = text
  messageType.value = type
  
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 5000)
}

const closeSearcher = () => {
  emit('close')
}
</script>

<style scoped>

.searcher-content {
width: 400px;
height: 100vh;
display: flex;
flex-direction: column;
background: #0a0a0a;
border-left: 1px solid #333;
}


.searcher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #333;
}

.searcher-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
}

.search-box {
  position: relative;
  padding: 20px 24px;
}

.search-icon {
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #999;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: border-color 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #000000;
}

.message {
  margin: 0 24px 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border-left: 4px solid #f5c6cb;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border-left: 4px solid #c3e6cb;
}

.results {
  flex: 1;
  padding: 0 24px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-list {
  flex: 1;
  overflow-y: auto;
}

.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-track {
  background: #0a0a0a;
}

.results-list::-webkit-scrollbar-thumb {
  background: #0a0a0a;
  border-radius: 4px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: #0a0a0a;
}

.loading, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.result-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: transform 0.2s;
  border: 2px solid transparent;
}


.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.display-name {
  color: #000000;
  font-size: 13px;
  margin-top: 2px;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

.badge-friend {
  background: #d4edda;
  color: #155724;
}

.action-btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  margin-top: 17px;
  margin-left: 12px;
  }


.btn-add {
  background: #375689;
  color: white;
}

.btn-add:hover {
  background: #456291;
  transform: scale(1.05);
}

.btn-pending {
  background: #637171;
  color: #ffffff;
  cursor: not-allowed;
}

.btn-friends {
  background: #749fe4;
  color: #ffffff;
  cursor: not-allowed;
}

.btn-accept {
  background: #52865e;
  color: white;
}

.btn-accept:hover {
  background: #218838;
  transform: scale(1.05);
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}
</style>
