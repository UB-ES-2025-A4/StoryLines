<template>
  <div v-show="isOpen" class="messages-drawer">
    <!-- HEADER -->
    <div class="panel-header">
      <button v-if="mode === 'chat'" @click="backToList" class="back-btn">
        ←
      </button>

      <h2 v-if="mode === 'list'">Chats</h2>
      <h2 v-if="mode === 'new'">Nuevo chat</h2>
      <h2 v-if="mode === 'chat'">{{ selectedFriend?.display_name || selectedFriend?.username }}</h2>

      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <!-- LISTA DE CHATS RECIENTES -->
    <div v-if="mode === 'list'" class="list-container">
      <button class="new-btn" @click="mode = 'new'">➕ Nuevo chat</button>

      <div v-if="loadingChats" class="loading">Cargando...</div>

      <div v-else>
        <div v-if="recentChats.length === 0" class="empty">
          No hay chats recientes
        </div>
        <div v-else></div>
        <div v-for="chat in recentChats" :key="chat.friendshipId" class="chat-item"
          @click="openChat(chat.friend, chat.friendshipId)">
          <img :src="chat.friend.avatar_url || defaultAvatar" class="avatar" />
          <div class="chat-info">
            <strong>{{ chat.friend.display_name || chat.friend.username }}</strong>
            <p class="preview">{{ chat.last_message }}</p>
            <small class="timestamp">{{ new Date(chat.created_at).toLocaleString() }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- SELECCIONAR AMIGO PARA NUEVO CHAT -->
    <div v-if="mode === 'new'" class="list-container">
      <div class="search-box">
        <input v-model="search" placeholder="Buscar amigos..." />
      </div>

      <div v-if="filteredFriends.length === 0" class="empty">No hay amigos</div>

      <div v-for="f in filteredFriends" :key="f.id" class="chat-item" @click="startChat(f)">
        <img :src="f.avatar_url || defaultAvatar" class="avatar" />
        <div class="chat-info">{{ f.display_name || f.username }}</div>
      </div>
    </div>

    <!-- PANEL DE CHAT -->
    <div v-if="mode === 'chat'" class="chat-area">
      <div class="messages-list" ref="messagesList">
        <div v-for="m in messages" :key="m.id" class="message" :class="{ mine: m.sender_id === userId }">
          <p>{{ m.content }}</p>
          <p class="message-timestamp">{{ new Date(m.created_at).toLocaleString() }}</p>
          <span class="message-status" v-if="m.status === 'sent' && m.sender_id === userId">enviado</span>
          <span class="message-status" v-else-if="m.status === 'read' && m.sender_id === userId">leído</span>
        </div>
      </div>

      <div class="input-row">
        <input class="message-input" v-model="messageInput" placeholder="Escribe un mensaje..."
          @keyup.enter="sendMessage" @input="saveDraft" />
        <button class="send-btn" @click="sendMessage">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2L2 12.5l20 9.5-7-9.5L22 2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { supabase } from "@/config/supabase";

const emit =  defineEmits(["close"]);

const props = defineProps({
  isOpen: Boolean
});

// STATE
const userId = ref(null);
const friends = ref([]);
const recentChats = ref([]);
const messages = ref([]);

const drafts = ref({}); 

const messageInput = ref("");
const selectedFriend = ref(null);
const friendshipId = ref(null);

const mode = ref("list"); // list | new | chat
const loadingChats = ref(true);

const search = ref("");

const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    mode.value = "list";
  }
});


// Cargar sesión + amigos del usuario
onMounted(async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  userId.value = session?.user?.id;

  await loadFriends();
  await loadRecentChats();
});

/* --------------------------
   Cargar amigos
-------------------------- */
const loadFriends = async () => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;

    const res = await fetch(`/api/friends?userId=${uid}`);
    const body = await res.json();

    if (body.ok) {
      friends.value = body.friends.map((f) => ({
        friendshipId: f.id,
        id: f.friend.id,
        username: f.friend.username,
        display_name: f.friend.display_name,
        avatar_url: f.friend.avatar_url
      }));
    } else {
      friends.value = [];
    }
  } catch {
    friends.value = [];
  }
};

/* --------------------------
   Cargar chats recientes
-------------------------- */
async function loadRecentChats() {
  loadingChats.value = true;

  try{
    const {
      data: { session }
    } = await supabase.auth.getSession();
    userId.value = session?.user?.id;

    if(!userId.value){
      recentChats.value = [];
      loadingChats.value = false;
      return;
    }

    const res = await fetch(`/api/messages/recents?userId=${userId.value}`);
    const body = await res.json();

    if (!res.ok) {
      recentChats.value = [];
      return;
    }

    const raw = body.chats || [];
    const arr = Array.isArray(raw) ? raw : [];

    recentChats.value = raw.map((chat) => {
      const isMine = chat.sender_id === userId.value;

      return {
        friendshipId: chat.friendship_id,
        friend: chat.friend,
        last_message: isMine
          ? `Tú: ${chat.last_message}`
          : chat.last_message,
        created_at: chat.created_at,
        sender_id: chat.sender_id
      };
    });

  } catch (err) {
    console.error("Error loading recent chats:", err);
    recentChats.value = [];
  } finally {
    loadingChats.value = false;
  }
}

/* --------------------------
   Filtro de amigos
-------------------------- */
const filteredFriends = computed(() =>
  friends.value.filter((f) =>
    f.username.toLowerCase().includes(search.value.toLowerCase())
  )
);

/* --------------------------
   Abrir chat existente
-------------------------- */
async function openChat(friend, fid) {
  selectedFriend.value = friend;
  friendshipId.value = fid;
  mode.value = "chat";
  await fetchMessages();

  messageInput.value = drafts.value[friendshipId.value] || "";

}

/* --------------------------
   Iniciar chat
-------------------------- */
async function startChat(friend) {
  selectedFriend.value = friend;
  friendshipId.value = friend.friendshipId;
  mode.value = "chat";
  await fetchMessages();

  messageInput.value = drafts.value[friendshipId.value] || "";

}

/* --------------------------
   Cargar mensajes de un chat
-------------------------- */
async function fetchMessages() {
  
  const res = await fetch(`/api/messages/${friendshipId.value}?userId=${userId.value}`);
  const data = await res.json();

  if (data.error) {
    messages.value = [];
    return;
  }

  messages.value = Array.isArray(data.messages) ? data.messages : [];

  await nextTick();
  scrollBottom();
}

/* --------------------------
   Enviar mensaje
-------------------------- */
async function sendMessage() {
  if (!messageInput.value.trim()) return;

  const res = await fetch(`/api/messages/${friendshipId.value}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: messageInput.value,
      senderId: userId.value
    })
  });

  const response = await res.json();
  if (response.error) return;

  messages.value.push(response.message);
  messageInput.value = "";
  drafts.value[friendshipId.value] = "";

  await nextTick();
  scrollBottom();
}

/* --------------------------
   Scroll al fondo
-------------------------- */
function scrollBottom() {
  const el = messagesList.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

/* --------------------------
   Volver a la lista de chats
-------------------------- */
function backToList() {
  mode.value = "list";
  selectedFriend.value = null;
  friendshipId.value = null;
  messages.value = [];
  loadRecentChats(); // recargar lista
}

/* --------------------------
   Guardar borrador
-------------------------- */
function saveDraft() {
  if (friendshipId.value) {
    drafts.value[friendshipId.value] = messageInput.value;
  }
}



const messagesList = ref(null);
</script>

<style scoped>
.messages-drawer {
  width: 350px;
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

.back-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  margin-right: 0.5rem;
  cursor: pointer;
  color: #fff;
}


.list-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px;
  gap: 10px;
  cursor: pointer;
}

.chat-info {
  flex: 1;
  color: #fff;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.message {
  max-width: 70%;
  margin: 8px 0;
  padding: 8px 12px;
  background: #fff;
  border-radius: 10px;
}

.message.mine {
  margin-left: auto;
  color: #fff;
  background: #0066ff;
}

.message-input {
  flex: 1;
  background: #222;
  border: 1px solid #444;
  color: #fff;
  padding: .5rem;
  border-radius: 5px;
}

.message-timestamp {
  font-size: 10px;
  color: #0a0a0a;
  opacity: 0.6;
  text-align: right;
}

.message-status {
  font-size: 10px;
  color: #0a0a0a;
  opacity: 0.6;
  text-align: right;
}

.input-row {
  display: flex;
  padding: 10px;
  border-top: 1px solid #333;
}

.input-row input {
  flex: 1;
  background: #222;
  border: 1px solid #444;
}

.send-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: .3rem;
  display: flex;
  align-items: center
}

.send-btn:hover {
  opacity: .8
}

.preview {
  opacity: 0.6;
  font-size: 13px;
}
</style>
