<template>
  <div class="sidebar-container">
    <div class="sidebar">
      <img src="@/assets/LogoBlanco.png" alt="StoryLines Logo" class="logo" />
      <nav>
        <router-link to="/" class="nav-item" :class="{ 'active': $route.path === '/' }">
          <svg class="icon" v-html="homeIcon"></svg>
          <span>Home</span>
        </router-link>

        <div class="nav-item" :class="{ 'active': showSearcher }" @click="toggleSearcher">
          <svg class="icon" v-html="searchIcon"></svg>
          <span>Buscar</span>
        </div>

        <div class="nav-item" :class="{ 'active': showNotifications, 'disabled': !user }" @click="toggleNotifications">
          <svg class="icon" v-html="notificationsIcon"></svg>
          <span>Notificaciones</span>

          <span v-if="unreadNotificationCount > 0" class="badge">
            {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
          </span>
        </div>

        <router-link to="/createtrip" class="nav-item" :class="{ 'active': $route.path === '/create' }">
          <svg class="icon" v-html="createIcon"></svg>
          <span>Crear viaje</span>
        </router-link>

        <router-link to="/shop" class="nav-item" :class="{ 'active': $route.path === '/shop' }">
          <svg class="icon" v-html="storeIcon"></svg>
          <span>Tienda</span>
        </router-link>

        <div class="nav-item" :class="{ 'active': showMessages, 'disabled': !user }" @click="toggleMessages">
          <svg class="icon" v-html="messagesIcon"></svg>
          <span>Mensajes</span>

          <span v-if="unreadMessageCount > 0" class="badge">
            {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
          </span>
        </div>

        <router-link to="/profile" class="nav-item" :class="{ 'active': $route.path === '/profile' }">
          <img :src="user_avatar_url || defaultAvatar" class="avatar" alt="User Avatar" />
          <span>Perfil</span>
        </router-link>

        <router-link to="/settings" class="nav-item" :class="{ 'active': $route.path === '/settings' }">
          <svg class="icon" v-html="settingsIcon"></svg>
          <span>Configuración</span>
        </router-link>
      </nav>
    </div>

    <div class="notification-panel" :class="{ 'show': showNotifications }">
      <Notifications :isVisible="showNotifications" @close="showNotifications = false" 
        @update-notification-count="unreadNotificationCount = $event" />
    </div>
    <div class="searcher-panel" :class="{ 'show': showSearcher }">
      <Searcher :isOpen="showSearcher" @close="showSearcher = false" />
    </div>
    <div class="messages-panel" :class="{ 'show': showMessages }">
      <Messages :isOpen="showMessages" @close="showMessages = false"
        @update-unread-count="unreadMessageCount = $event" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Searcher from '@/components/Friends/Searcher.vue'
import Notifications from './Friends/Notifications.vue'
import Messages from './Friends/Messages.vue'
import { supabase } from '@/config/supabase'

const route = useRoute()
const showNotifications = ref(false)
const showSearcher = ref(false)
const showMessages = ref(false)
const user = ref(null)
const user_avatar_url = ref(localStorage.getItem('user_avatar_url') || null)
const unreadMessageCount = ref(0)
const unreadNotificationCount = ref(0)

// Obtener sesión y avatar del usuario
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
  
  if (user.value) {
    const { data, error } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.value.id)
      .single()
    
    if (!error) {
      const avatar = data?.avatar_url || defaultAvatar
      user_avatar_url.value = avatar
      localStorage.setItem('user_avatar_url', avatar)
    } else {
      user_avatar_url.value = defaultAvatar
    }
    
    // Cargar conteo de notificaciones
    loadNotificationCount()
  }
})

window.addEventListener("avatar-updated", (e) => {
  const newAvatar = e.detail
  user_avatar_url.value = newAvatar
  localStorage.setItem("user_avatar_url", newAvatar)
})



const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    showSearcher.value = false
    showMessages.value = false
  }
}

const loadNotificationCount = async () => {
  if (!user.value) return
  
  try {
    const res = await fetch(`/api/notifications?userId=${user.value.id}`)
    const data = await res.json()
    if (data.ok) {
      // Contar notificaciones no leídas
      unreadNotificationCount.value = data.notifications.filter(n => !n.read).length
    }
  } catch (e) {
    console.error('Error loading notification count:', e)
  }
}

const toggleSearcher = () => {
  showSearcher.value = !showSearcher.value
  if (showSearcher.value) {
    showNotifications.value = false
    showMessages.value = false
  }
}

const toggleMessages = () => {
  showMessages.value = !showMessages.value
  if (showMessages.value) {
    showNotifications.value = false
    showSearcher.value = false
  }
}

const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'

const homeIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const createIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const searchIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const notificationsIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a1.999 1.999 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const storeIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const messagesIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const settingsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16">   <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>   <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/> </svg>`
</script>

<style scoped>
.sidebar-container {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.sidebar {
  width: 250px;
  background: #0a0a0a;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

.notification-panel {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
}

.notification-panel.show {
  width: 400px;
  transform: translateX(0);
}

.searcher-panel {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
}

.searcher-panel.show {
  width: 400px;
  transform: translateX(0);
}

.messages-panel {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
}

.messages-panel.show {
  width: 400px;
  transform: translateX(0);
}

.logo {
  width: 130px;
  height: auto;
  margin-bottom: 2rem;
  align-self: flex-start;
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
  justify-content: flex-start;
  gap: 1rem;
  font-size: 1.2rem;
  color: #ccc;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s;
  position: relative;
  min-height: 40px;
  cursor: pointer;
}

.nav-item:hover, .nav-item.active {
  color: #fff;
  background: rgba(0, 0, 0, 0.1);
}

.nav-item.disabled {
  pointer-events: none;
  cursor: default;
}

.icon {
  width: 26px;
  height: 26px;
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

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.badge {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 23px;
  height: 23px;
  min-width: 23px;
  background: #e63946;
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  padding: 0 !important;
}


</style>