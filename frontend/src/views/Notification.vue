<template>
  <div class="notifications-container">
    <h2>🔔 Notificaciones</h2>

    <div v-if="loading">Cargando...</div>

    <!-- SIN NOTIFICACIONES -->
    <div v-if="!loading && notifications.length === 0">
      <p>No tienes notificaciones.</p>
    </div>

    <!-- LISTADO -->
    <div
      v-for="n in notifications"
      :key="n.id"
      class="notification-card"
    >
      <div class="text">
        <strong>{{ n.type }}</strong>
        <p>{{ n.message }}</p>
        <small>{{ new Date(n.created_at).toLocaleString() }}</small>
      </div>

      <!-- SOLO PARA SOLICITUDES -->
      <div v-if="n.type === 'friend-approval'" class="actions">
        <button class="accept" @click="acceptRequest(n)">Aceptar</button>
        <button class="reject" @click="rejectRequest(n)">Rechazar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { supabase } from "@/config/supabase"

const currentUserId = ref("")
const notifications = ref([])
const loading = ref(false)

/* -------------------------------------------
   CARGAR NOTIFICACIONES AUTOMÁTICAMENTE
------------------------------------------- */
async function loadNotifications() {
  loading.value = true

  try {
    const res = await fetch(`/api/notifications?userId=${currentUserId.value}`)
    const data = await res.json()

    if (!data.ok) throw new Error(data.error)

    notifications.value = data.notifications
  } catch (e) {
    console.error(e)
  }

  loading.value = false
}

/* -------------------------------------------
   ACEPTAR SOLICITUD  (ruta correcta)
------------------------------------------- */
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
    if (!data.ok) throw new Error(data.error)

    loadNotifications()
  } catch (e) {
    console.error(e)
    alert("Error al aceptar solicitud")
  }
}

/* -------------------------------------------
   RECHAZAR SOLICITUD
------------------------------------------- */
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
    if (!data.ok) throw new Error(data.error)

    loadNotifications()
  } catch (e) {
    console.error(e)
    alert("Error al rechazar solicitud")
  }
}

/* -------------------------------------------
   OBTENER USER LOGUEADO Y CARGAR NOTIS
------------------------------------------- */
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUserId.value = session?.user?.id || ""

  if (currentUserId.value) {
    loadNotifications()
  }
})
</script>

<style scoped>
.notifications-container {
  padding: 20px;
  max-width: 500px;
  margin: auto;
  color: rgb(165, 121, 121);
}

.notification-card {
  background: #222;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid #333;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.accept {
  background: #4caf50;
  padding: 5px 10px;
  border: none;
  color: white;
  cursor: pointer;
}

.reject {
  background: #f44336;
  padding: 5px 10px;
  border: none;
  color: white;
  cursor: pointer;
}
</style>
