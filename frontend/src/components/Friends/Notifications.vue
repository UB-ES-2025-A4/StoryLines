<template>
  <div class="notifications-panel">
    <div class="panel-header">
      <h2>Notificaciones</h2>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-if="!loading && notifications.length === 0" class="no-notifications">
      <p>No tienes notificaciones.</p>
    </div>

    <div class="notifications-list">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="notification-card"
      >
        <div class="user-avatar">
          <img v-if="n.type !== 'friend-accepted'" :src="n.sender?.avatar_url || '/default-avatar.png'" :alt="n.sender?.display_name || n.sender?.username" />
        </div>
        <div class="notification-content">
          <div class="text">
            <p>{{ n.message }}</p>
            <small>{{ formatDate(n.created_at) }}</small>
          </div>

          <div v-if="n.type === 'friend-approval'" class="actions">
            <button class="accept" @click="acceptRequest(n)">Aceptar</button>
            <button class="reject" @click="rejectRequest(n)">Rechazar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, watch } from "vue"
import { supabase } from "@/config/supabase"

const props = defineProps(['isVisible'])
const emit = defineEmits(['close', 'update-notification-count'])

const currentUserId = ref("")
const notifications = ref([])
const loading = ref(false)

async function loadNotifications() {
  loading.value = true
  try {
    const res = await fetch(`/api/notifications?userId=${currentUserId.value}`)
    const data = await res.json()
    if (data.ok) {
      notifications.value = data.notifications
      // Emitir conteo de notificaciones no leídas
      const unreadCount = data.notifications.filter(n => !n.read).length
      emit('update-notification-count', unreadCount)
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function markAsRead() {
  try {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId.value })
    })
  } catch (e) {
    console.error(e)
  }
}

async function acceptRequest(notif) {
  try {
    const res = await fetch('/api/friend-request/respond', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friendship_id: notif.friendship_id,
        action: 'accept',
        currentUserId: currentUserId.value
      })
    })
    const data = await res.json()
    if (data.ok) loadNotifications()
  } catch (e) {
    console.error(e)
  }
}

async function rejectRequest(notif) {
  try {
    const res = await fetch('/api/friend-request/respond', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friendship_id: notif.friendship_id,
        action: 'reject',
        currentUserId: currentUserId.value
      })
    })
    const data = await res.json()
    if (data.ok) loadNotifications()
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (dateStr) => {
      if (!dateStr) return "";
      
      //how long ago was created
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date; // diferencia en milisegundos
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);

      if (weeks > 0) return `${weeks} semana${weeks > 1 ? 's' : ''}`;
      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
      if (minutes > 0) return `${minutes}m`;
      if (seconds > 0) return `${seconds}s`;
      return "justo ahora";
    };

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUserId.value = session?.user?.id || ""
  if (currentUserId.value) {
    loadNotifications()
  }
})

watch(() => props.isVisible, async (newValue) => {
  if (newValue && currentUserId.value) {
    await markAsRead()
    loadNotifications()
  }
})
</script>

<style scoped>
.notifications-panel {
  width: 400px;
  background: #0a0a0a;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #333;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #333;
}

.panel-header h2 {
  color: #fff;
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 1.5rem;
  cursor: pointer;
}

.notifications-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.notifications-list::-webkit-scrollbar {
  width: 8px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #0a0a0a;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #0a0a0a;
  border-radius: 4px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #0a0a0a;
}

.notification-card {
  background: #ffffff;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid #ffffff00;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notification-content {
  flex: 1;
}

.notification-card .text {
  color: #000000;
}

.notification-card strong {
  color: #000000;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 8px;
}

.accept {
  background: #52865e;
  font-weight: 550;
  padding: 2px 8px;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.accept:hover {
  background: #668d6f;
}

.reject {
  background: #363636;
  font-weight: 550;
  padding: 3px 7px;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.reject:hover {
  background: #4c5353;
}

.user-avatar {
  flex-shrink: 0;
}

.user-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.loading, .no-notifications {
  padding: 2rem;
  text-align: center;
  color: #ccc;
}
</style>
