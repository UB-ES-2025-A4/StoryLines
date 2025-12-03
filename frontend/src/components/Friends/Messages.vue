<template>
  <div v-show="isOpen" class="messages-drawer">
    <!-- HEADER -->
    <div class="panel-header">
      <button v-if="mode === 'chat'" @click="backToList" class="back-btn">←</button>
      <button v-if="mode === 'new'" @click="mode = 'list'" class="back-btn">←</button>

      <h2 v-if="mode === 'list'">Chats</h2>
      <h2 v-if="mode === 'new'">Nuevo chat</h2>
      <h2 v-if="mode === 'chat'" class="friend-title">
        {{ selectedFriend?.display_name || selectedFriend?.username }}
      </h2>

      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <!-- LISTA DE CHATS RECIENTES -->
    <div v-if="mode === 'list'" class="list-container">
      <button class="new-btn" @click="mode = 'new'">Nuevo chat</button>

      <div v-if="loadingChats" class="loading">Cargando...</div>
      <div v-else-if="recentChats.length === 0" class="empty">No hay chats recientes</div>

      <div v-for="chat in recentChats" :key="chat.friendshipId" class="chat-item"
        @click="openChat(chat.friend, chat.friendshipId)">
        <img :src="chat.friend.avatar_url || defaultAvatar" class="avatar" />
        <div class="chat-preview">
          <div class="name-and-time">
            <div class="name">{{ chat.friend.display_name || chat.friend.username }}</div>
            <div class="time">{{ formatTimeRecents(chat.created_at) }}</div>
          </div>

          <div class="preview-and-badge">
            <div class="preview">{{ truncateText(chat.last_message, 50) }}</div>
            <div v-if="chat.unreadCounts > 0" class="unread-badge">{{ chat.unreadCounts }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- NUEVO CHAT -->
    <div v-if="mode === 'new'" class="list-container">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="search" placeholder="Buscar amigos..." />
      </div>
      <div v-if="filteredFriends.length === 0" class="empty">No hay amigos</div>
      <div v-for="f in filteredFriends" :key="f.id" class="chat-item" @click="startChat(f)">
        <img :src="f.avatar_url || defaultAvatar" class="avatar" />
        <div class="chat-info">{{ f.display_name || f.username }}</div>
      </div>
    </div>

    <!-- CHAT ACTIVO -->
    <div v-if="mode === 'chat'" class="chat-area">
      <div class="messages-list" ref="messagesList">
        <template v-for="(group, dateKey) in groupedMessages" :key="dateKey">
          <div class="date-separator">
            <span>{{ formatDateHeader(dateKey) }}</span>
          </div>
          <div v-for="m in group" :key="m.id" class="message-wrapper" :class="{ mine: m.sender_id === userId }">
            <div class="message">
              <p class="content">{{ m.content }}</p>
              <div class="meta">
                <span class="time" :class="{mine: m.sender_id === userId }">{{ formatTimeOnly(m.created_at) }}</span>
                <span v-if="m.sender_id === userId" class="status">
                  <span v-html="m.status === 'read' ? CheckRead : CheckSent"></span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="input-row">
        <textarea class="message-input" v-model="messageInput" placeholder="Escribe un mensaje..."
          @input="autoResize" @keyup.enter="sendMessage" rows="1"></textarea>
        <button class="send-btn" @click="sendMessage">
          <span v-html="SendIcon"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { supabase } from "@/config/supabase";

const emit = defineEmits(["close"]);
const props = defineProps({ isOpen: Boolean });

const userId = ref(null);
const friends = ref([]);
const recentChats = ref([]);
const messages = ref([]);
const drafts = ref({});
const messageInput = ref("");
const selectedFriend = ref(null);
const friendshipId = ref(null);
const mode = ref("list");
const loadingChats = ref(true);
const search = ref("");
const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
const messagesList = ref(null);

// Icono check único (enviado)
const CheckSent =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`

// Icono doble check (leído)
const CheckRead =
  `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <!-- Primer check (atrás) -->
      <path d="M20 6L9 17L4 12" 
            stroke="rgba(255,255,255,0.5)" 
            stroke-width="2.8" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      <!-- Segundo check (delante y desplazado → nunca se solapa) -->
      <path d="M20 6L9 17L4 12" 
            stroke="#ffffff" 
            stroke-width="2.9" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            transform="translate(7,0)"/>
    </svg>
  `

// Icono de enviar 
const SendIcon = `<svg width="22"22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 2L2 12.5l20 9.5-7-9.5L22 2z"/>
  </svg>`

const formatDateHeader = (dateStr) => {
  const [day, month, year] = dateStr.split('/');
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const formatTimeOnly = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTimeRecents = (date) => {
  const d = new Date(date);
  const now = new Date();

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  // HOY ➜ hora
  if (isSameDay(d, now)) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // AYER ➜ "ayer"
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(d, yesterday)) {
    return "ayer";
  }

  // Anterior ➜ dd/mm/yyyy
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};


const truncateText = (text, limit) =>
  text?.length > limit ? text.slice(0, limit) + '...' : text || ''


const groupedMessages = computed(() => {
  const groups = {};
  messages.value.forEach(m => {
    const d = new Date(m.created_at);
    const key = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return groups;
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) mode.value = "list";
});

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  userId.value = session?.user?.id;
  await loadFriends();
  await loadRecentChats();
});

const loadFriends = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
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

async function loadRecentChats() {
  loadingChats.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    userId.value = session?.user?.id;

    if (!userId.value) {
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

    recentChats.value = (body.chats || []).map((chat) => {
      const isMine = chat.sender_id === userId.value;
      return {
        friendshipId: chat.friendship_id,
        friend: chat.friend,
        last_message: isMine ? `Tú: ${chat.last_message}` : chat.last_message,
        created_at: chat.created_at,
        sender_id: chat.sender_id,
        unreadCounts: chat.unreadCounts || 0
      };
    });

    const totalUnread = recentChats.value.reduce((sum, chat) => sum + chat.unreadCounts, 0);
    emit("update-unread-count", totalUnread);

  } catch (err) {
    console.error("Error loading recent chats:", err);
    recentChats.value = [];
  } finally {
    loadingChats.value = false;
  }
}

const filteredFriends = computed(() =>
  friends.value.filter((f) =>
    f.username.toLowerCase().includes(search.value.toLowerCase()) ||
    (f.display_name && f.display_name.toLowerCase().includes(search.value.toLowerCase()))
  )
);

async function openChat(friend, fid) {
  selectedFriend.value = friend;
  friendshipId.value = fid;
  mode.value = "chat";
  await fetchMessages();

  const chat = recentChats.value.find(c => c.friendshipId === fid);
  if (chat) chat.unreadCounts = 0;

  loadRecentChats();
  messageInput.value = drafts.value[friendshipId.value] || "";
}

async function startChat(friend) {
  selectedFriend.value = friend;
  friendshipId.value = friend.friendshipId;
  mode.value = "chat";
  await fetchMessages();

  const chat = recentChats.value.find(c => c.friendshipId === friendshipId.value);
  if (chat) chat.unreadCounts = 0;

  loadRecentChats();
  messageInput.value = drafts.value[friendshipId.value] || "";
}

async function fetchMessages() {
  const res = await fetch(`/api/messages/${friendshipId.value}?userId=${userId.value}`);
  const data = await res.json();

  messages.value = data.error ? [] : (Array.isArray(data.messages) ? data.messages : []);
  await nextTick();
  scrollBottom();
}

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

function scrollBottom() {
  nextTick(() => {
    const el = messagesList.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function backToList() {
  mode.value = "list";
  selectedFriend.value = null;
  friendshipId.value = null;
  messages.value = [];
  loadRecentChats();
}

function saveDraft() {
  if (friendshipId.value) {
    drafts.value[friendshipId.value] = messageInput.value;
  }
}

function autoResize(event) {
  const el = event.target;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
  saveDraft();
}

</script>

<style scoped>
.messages-drawer {
  width: 400px;
  background: #0a0a0a;
  height: 100vh;
  position: fixed;
  z-index: 1000;
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  color: #fff;
}

.panel-header {
  padding: 1.4rem 1.2rem;
  border-bottom: 1px solid #222;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #0a0a0a;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
}

.friend-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 210px;
}

.back-btn, .close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.back-btn:hover, .close-btn:hover {
  background: #222;
  color: #fff;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.list-container::-webkit-scrollbar { display: none; }

.new-btn {
  width: 100%;
  padding: 14px;
  background: #0066ff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;
  transition: 0.2s;
}

.new-btn:hover { background: #0055dd; }

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  margin: 4px 0;
  transition: background 0.2s;
}

.chat-item:hover { background: #111; }

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.chat-preview, .chat-info {
  flex: 1;
  margin-left: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-and-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-and-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview {
  color: #aaa;
  font-size: 13.5px;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 210px;
}

.unread-badge {
  background: #0066ff;
  color: white;
  min-width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 16px;
  min-height: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.messages-list::-webkit-scrollbar { display: none; }

.date-separator {
  text-align: center;
  margin: 24px 0 16px;
  font-size: 13px;
  color: #888;
  position: relative;
}

.date-separator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 16px;
  right: 16px;
  height: 1px;
  background: #333;
  z-index: 1;
}

.date-separator span {
  background: #0a0a0a;
  padding: 0 14px;
  position: relative;
  z-index: 2;
}

.message-wrapper {
  margin: 10px 0;
  display: flex;
}

.message-wrapper.mine {
  justify-content: flex-end;
}

.message {
  max-width: 76%;
  padding: 11px 15px;
  border-radius: 18px;
  background: #1a1a1a;
  color: #fff;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.message-wrapper.mine .message {
  background: #0066ff;
  border-bottom-right-radius: 4px;
}

.message-wrapper:not(.mine) .message {
  border-bottom-left-radius: 4px;
}

.content {
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.meta {
  margin-top: 6px;
  font-size: 11.5px;
  color: rgba(255,255,255,0.7);
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.input-row {
  padding: 16px;
  border-top: 1px solid #222;
  background: #0a0a0a;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-input {
  flex: 1;
  background: #1a1a1a;
  border: none;
  color: #fff;
  padding: 14px 18px;
  border-radius: 24px;
  font-size: 15px;
  outline: none;
  resize: none;
  overflow-y: hidden;
  line-height: 1.45;
  max-height: 180px;
  word-break: break-word;
  font-family: inherit;
}

.message-input:focus {
  background: #222;
}

.send-btn {
  background: #0a0a0a;
  color: white;
  border: none;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover {
  transform: scale(1.08);
}

.empty, .loading {
  color: #666;
  text-align: center;
  padding: 40px 20px;
  font-size: 15px;
}

.-box-box {
  position: relative;
  margin: 8px 8px 0 8px;
}

.search-box{
  position: relative;
  width: 100%;
  margin-bottom: 12px;
  padding: 0 12px;
}

.search-box input {
  width: 100%;
  background: #1a1a1a;
  border: none;
  color: #fff;
  padding: 14px 20px 14px 48px;
  border-radius: 14px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.search-box input:focus {
  background: #222;
}

.search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  z-index: 1;
  pointer-events: none;
}

.time {
  font-size: 11px;
  text-align: right;
  color: #888;
  margin-left: 8px;
}

.time.mine {
  color: rgba(255,255,255,0.9);
}
</style>