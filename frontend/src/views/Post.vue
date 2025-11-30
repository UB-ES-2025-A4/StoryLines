<template>
  <div class="post-page" :style="{
    backgroundColor: loading ? '#0A0A0A' : 'transparent',
    backgroundBlendMode: loading ? 'normal' : 'overlay',
    ...(!loading && {
      backgroundImage: `url(${trip.cover_image || defaultCover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    })
  }">

    <!-- Sidebar -->
    <Sidebar />

    <!-- Contenido principal -->
    <div class="main-content">
      <div v-if="loading" class="loading">Cargando viaje...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="trip-content">
        <div class="trip-details">
          <h1 class="trip-title">{{ trip.trip_name }}</h1>
          <p class="trip-description">{{ trip.description }}</p>

          <!-- Trip actions -->
          <div class="trip-actions">
            <button class="action-button like-button" @click="toggleLike">
              <span class="like-icon" v-html="isLiked ? likeFilledIcon : likeOutlineIcon"></span>
              <span class="like-count">{{ likeCount }}</span>
            </button>
            <button class="action-button" @click="showComments = !showComments">
              <span class="action-icon" v-html="commentIcon"></span>
              <span>{{ commentsCount }}</span>
            </button>
            <button class="action-button">
              <span class="action-icon" v-html="saveIcon"></span>
            </button>
            <button class="action-button">
              <span class="action-icon" v-html="viewsIcon"></span>
              <span class="view-count">{{ views }}</span>
            </button>
          </div>

          <div class="stops-route">
            <div v-for="(stop, index) in trip.stops || []" :key="index" class="stop-card-wrapper">
              <div class="stop-card fade-in">
                <div class="stop-images">
                  <button class="nav-arrow left" @click="changeImage(stop, -1)" :disabled="stop.currentImageIndex === 0">◀</button>

                  <img :src="stop.images && stop.images.length > 0
                    ? stop.images[stop.currentImageIndex]
                    : defaultImage" alt="Stop image" class="stop-image" />

                  <button class="nav-arrow right" @click="changeImage(stop, 1)" :disabled="!stop.images || stop.currentImageIndex === stop.images.length - 1">▶</button>
                </div>

                <div class="stop-details">
                  <h3 class="stop-title">{{ stop.country }}</h3>
                  <div class="stop-info">
                    <p><strong>Ciudad:</strong> {{ stop.city || '—' }}</p>
                    <p><strong>Descripción:</strong> {{ stop.description || 'Sin descripción' }}</p>
                  </div>
                </div>
              </div>

              <div v-if="index < (trip.stops?.length || 0) - 1" class="route-line"></div>
            </div>
          </div>
        </div>

        <!-- Sección de comentarios -->
        <div v-show="showComments" class="comments-section">
          <h2 class="section-title">Comentarios</h2>

          <div v-if="comments.length === 0" class="no-comments">No hay comentarios todavía.</div>

          <div v-else>
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <div class="comment-user-info">
                  <img
                    :src="comment.user?.avatarUrl || 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'"
                    alt="Avatar" class="comment-avatar" />
                  <div class="user-text-wrapper">
                    <p class="comment-user">{{ comment.user?.displayName || comment.user?.username || 'Anónimo' }}</p>
                    <p class="comment-date">{{ formatDate(comment.createdAt) }}</p>
                  </div>
                </div>

                <div v-if="canDeleteComment(comment)" class="comment-actions">
                  <button @click.stop="toggleMenu(comment.id)" class="dots-btn">⋮</button>
                  <div v-if="openMenuId === comment.id" class="dropdown-menu">
                    <button @click.stop="confirmDelete(comment.id)" class="delete-option">Eliminar</button>
                  </div>
                </div>
              </div>

              <p class="comment-text">{{ comment.text }}</p>
            </div>
          </div>

          <div class="comment-input-wrapper">
            <input v-model="newComment" type="text" placeholder="Escribe tu comentario..." class="comment-input" @keyup.enter="sendComment" />
            <button class="comment-send-btn" @click="sendComment">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2L2 12.5l20 9.5-7-9.5L22 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de confirmación -->
  <div v-if="showDeleteModal" class="modal-overlay">
    <div class="modal-box">
      <p>¿Eliminar este comentario?</p>

      <div class="modal-buttons">
        <button class="modal-cancel" @click="showDeleteModal = false">Cancelar</button>
        <button class="modal-confirm" @click="performDelete">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { supabase } from '@/config/supabase'
import { useRoute } from "vue-router";
import Sidebar from '@/components/Sidebar.vue';

export default {
  name: "Post",
  components: { Sidebar },
  setup() {
    const route = useRoute();
    const trip = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const comments = ref([]);
    const commentsCount = ref(0);
    const newComment = ref("");
    const openMenuId = ref(null);

    // Modal
    const showDeleteModal = ref(false);
    const commentToDelete = ref(null);

    const defaultImage = "https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg";
    const defaultCover = "https://i.imgur.com/mS1b7mF.jpeg";

    const isLiked = ref(false);
    const likeCount = ref(0);
    const showComments = ref(false);
    const views = ref(0);

    const tripOwnerId = ref(null);

    let userId = null;

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user ? user.id : null;
    };

    const fetchTrip = async () => {
      try {
        const id = route.params.id;
        const res = await fetch(`/api/trips/${id}?userId=${userId}`);
        const data = await res.json();

        if (data.ok && data.trip) {
          data.trip.stops?.forEach((stop) => {
            stop.currentImageIndex = 0;
            if (!Array.isArray(stop.images)) stop.images = [];
          });

          trip.value = data.trip;
          likeCount.value = data.trip.likes ?? 0;
          isLiked.value = data.trip.userLiked ?? false;
          views.value = data.trip.views ?? 0;
          comments.value = data.trip.comments ?? [];
          commentsCount.value = data.trip.commentsCount ?? 0;
          tripOwnerId.value = data.trip.user.id;
        } else {
          error.value = data.error || "Error al cargar el viaje";
        }
      } catch (e) {
        error.value = "Error de conexión con el servidor";
      } finally {
        loading.value = false;
      }
    };

    const changeImage = (stop, delta) => {
      const newIndex = stop.currentImageIndex + delta;
      if (newIndex >= 0 && newIndex < stop.images.length) {
        stop.currentImageIndex = newIndex;
      }
    };

    const toggleLike = async () => {
      if (!userId) return alert("Debes iniciar sesión para dar like.");
      const id = route.params.id;
      try {
        if (isLiked.value) {
          await fetch(`/api/trips/${id}/like/${userId}`, { method: "DELETE" });
        } else {
          await fetch(`/api/trips/${id}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
        }
        await fetchTrip();
      } catch (e) {
        console.error('Error toggling like');
      }
    };

    const sendComment = async () => {
      if (!userId) return alert("Debes iniciar sesión para comentar.");
      if (!newComment.value.trim()) return;

      const tripId = route.params.id;
      try {
        await fetch(`/api/trips/${tripId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, text: newComment.value }),
        });
        newComment.value = "";
        await fetchTrip();
      } catch (e) {
        console.error("Error enviando comentario:", e);
      }
    };

    const canDeleteComment = (comment) => {
      if (!userId) return false;
      return comment.user?.id === userId || tripOwnerId.value === userId;
    };

    const toggleMenu = (commentId) => {
      openMenuId.value = openMenuId.value === commentId ? null : commentId;
    };

    const closeMenuOutside = () => openMenuId.value = null;

    const confirmDelete = (commentId) => {
      commentToDelete.value = commentId;
      showDeleteModal.value = true;
    };


    const performDelete = async () => {
      const commentId = commentToDelete.value;
      const tripId = route.params.id;

      showDeleteModal.value = false;

      try {
        const res = await fetch(`/api/trips/${tripId}/comments/${commentId}/${userId}`, {
          method: 'DELETE'
        });

        const data = await res.json();

        if (data.ok) {
          await fetchTrip();
          openMenuId.value = null;
        } else {
          alert(data.error || 'Error al eliminar');
        }
      } catch (e) {
        alert('Error al eliminar comentario');
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    };

    // Action icons
    const likeOutlineIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const likeFilledIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="red" stroke="white" stroke-width="2" d="M11.645 20.906l-.007-.003-.022-.01a15.741 15.741 0 01-.383-.218 25.45 25.45 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.01-.007.004-.003.001a.752 .752 0 01-.704 0l-.003-.001z"/></svg>`;
    const commentIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const saveIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const viewsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;


    onMounted(async () => {
      await loadUser();
      await fetchTrip();
      document.addEventListener('click', closeMenuOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', closeMenuOutside);
    });

    return {
      trip, loading, error, changeImage, defaultImage, defaultCover,
      isLiked, likeCount, toggleLike, showComments, likeOutlineIcon,
      likeFilledIcon, commentIcon, saveIcon, viewsIcon, views,
      comments, commentsCount, newComment, sendComment, formatDate,
      openMenuId, canDeleteComment, toggleMenu,
      showDeleteModal,
      commentToDelete,
      confirmDelete,
      performDelete
    };
  },
};
</script>

<style
  scoped>
  .post-page {
    display: flex;
    min-height: 100vh;
    color: #fff;
    position: relative
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    margin-left: 250px;
    margin-right: 350px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh
  }

  .trip-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    text-align: center
  }

  .trip-details {
    width: 100%;
    max-width: 850px;
    text-align: center;
    margin: 0 auto
  }

  .trip-title {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #fff
  }

  .trip-description {
    color: #ccc;
    font-size: 1.1rem;
    margin-bottom: 2rem;
    max-width: 700px;
    margin-inline: auto;
    line-height: 1.6
  }

  .trip-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: .5rem;
    background: rgba(255, 255, 255, .1);
    border: 1px solid #fff;
    border-radius: 8px;
    padding: .5rem 1rem;
    color: #fff;
    cursor: pointer;
    transition: background .2s
  }

  .action-button:hover {
    background: rgba(255, 255, 255, .2)
  }

  .action-icon,
  .like-icon {
    display: inline-block;
    width: 20px;
    height: 20px
  }

  .stop-card-wrapper {
    position: relative;
    margin-bottom: 6rem;
    width: 100%
  }

  .stop-card {
    padding: 2rem;
    border: 1.5px solid #fff;
    border-radius: 12px;
    background: rgba(10, 10, 10, .7);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    max-width: 850px;
    margin: 0 auto;
    min-height: 300px;
    animation: fadeIn .6s ease-in
  }

  .stop-images {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 350px
  }

  .stop-image {
    width: 250px;
    height: 250px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #fff
  }

  .nav-arrow {
    background: rgba(10, 10, 10, 0.7);
    border: 1px solid #fff;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    padding: 1rem;
    opacity: 0.9;
    transition: opacity 0.2s;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-arrow:hover {
    opacity: 1;
  }

  .nav-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .stop-details {
    flex: 1;
    padding-left: 1.5rem;
    text-align: left;
    max-width: 400px
  }

  .stop-title {
    font-size: 1.5rem;
    margin-bottom: 1rem
  }

  .stop-info p {
    margin: .3rem 0;
    font-size: 1.1rem;
    line-height: 1.5
  }

  .route-line {
    position: absolute;
    width: 2px;
    background: #fff;
    height: 100px;
    left: 50%;
    transform: translateX(-50%);
    top: 100%
  }

  .comments-section {
    flex: 0 0 300px;
    position: fixed;
    right: 1.5rem;
    top: 2rem;
    bottom: 2rem;
    width: 300px;
    background: #0a0a0a;
    border: 1.5px solid #fff;
    border-radius: 12px;
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column
  }

  .section-title {
    font-size: 1.3rem;
    margin-bottom: .5rem
  }

  .no-comments {
    color: #aaa;
    font-size: 1rem;
    margin: 1rem 0
  }

  .comment-item {
    padding: 0.8rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1)
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem
  }

  .comment-user-info {
    display: flex;
    align-items: center;
    gap: 0.7rem
  }

  .comment-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid #fff;
    flex-shrink: 0
  }

  .user-text-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center
  }

  .comment-user {
    margin: 0;
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1.2
  }

  .comment-date {
    margin: 0;
    font-size: 0.7rem;
    color: #999;
    line-height: 1.2
  }

  .comment-text {
    margin: 0.6rem 0 0;
    text-align: left;
    font-size: 0.95rem;
    line-height: 1.4
  }

  .comment-actions {
    position: relative
  }

  .dots-btn {
    background: none;
    border: none;
    color: #ccc;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    border-radius: 4px
  }

  .dots-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff
  }

  .dropdown-menu {
    position: absolute;
    right: 0;
    top: 100%;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 6px;
    min-width: 120px;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5)
  }

  .delete-option {
    width: 100%;
    padding: 0.6rem 1rem;
    background: none;
    border: none;
    color: #ff6b6b;
    text-align: left;
    cursor: pointer;
    font-size: 0.9rem
  }

  .delete-option:hover {
    background: rgba(255, 107, 107, 0.2)
  }

  .comment-input-wrapper {
    margin-top: auto;
    display: flex;
    gap: .5rem;
    padding: .5rem;
    background: rgba(255, 255, 255, .1);
    border-radius: 8px;
    border: 1px solid #fff
  }

  .comment-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1rem;
    outline: none
  }

  .comment-input::placeholder {
    color: #aaa
  }

  .comment-send-btn {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: .3rem;
    display: flex;
    align-items: center
  }

  .comment-send-btn:hover {
    opacity: .8
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px)
    }

    to {
      opacity: 1;
      transform: translateY(0)
    }
  }

  .modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5000;
}

.modal-box {
  background: #111;
  padding: 1.5rem 2rem;
  border-radius: 10px;
  border: 1px solid #555;
  text-align: center;
  color: white;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-cancel,
.modal-confirm {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.modal-cancel {
  background: #333;
  color: #ccc;
}

.modal-cancel:hover {
  background: #444;
}

.modal-confirm {
  background: #ff4d4d;
  color: white;
}

.modal-confirm:hover {
  background: #ff3333;
}
</style>
