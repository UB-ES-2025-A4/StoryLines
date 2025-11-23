<!-- frontend/src/components/Notifications.vue -->
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
            <small>{{ new Date(n.created_at).toLocaleDateString() }}</small>
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
import { ref, onMounted } from "vue"
import { supabase } from "@/config/supabase"

defineEmits(['close'])

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
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
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

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUserId.value = session?.user?.id || ""
  if (currentUserId.value) {
    loadNotifications()
  }
})
</script>

<style scoped>
.notifications-panel {
  width: 350px;
  background: #000000;
  height: 100vh;
  overflow-y: auto;
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
  padding: 1rem;
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
  background: #375689;
  padding: 2px 8px;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.accept:hover {
  background: #4a6ba3;
}

.reject {
  background: #363636;
  padding: 2px 6px;
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
