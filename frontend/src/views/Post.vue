<template>
  <div
    class="post-page"
    :style="{
      backgroundImage: `url(${trip?.cover_image || defaultCover})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backgroundBlendMode: 'overlay'
    }"
  >
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
            </button>
            <button class="action-button">
              <span class="action-icon" v-html="saveIcon"></span>
            </button>
          </div>

          <div class="stops-route">
            <div
              v-for="(stop, index) in trip.stops || []"
              :key="index"
              class="stop-card-wrapper"
            >
              <div class="stop-card fade-in">
                <div class="stop-images">
                  <button
                    class="nav-arrow left"
                    @click="changeImage(stop, -1)"
                    :disabled="stop.currentImageIndex === 0"
                  >◀</button>

                  <img
                    :src="stop.images && stop.images.length > 0
                      ? stop.images[stop.currentImageIndex]
                      : defaultImage"
                    alt="Stop image"
                    class="stop-image"
                  />

                  <button
                    class="nav-arrow right"
                    @click="changeImage(stop, 1)"
                    :disabled="!stop.images || stop.currentImageIndex === stop.images.length - 1"
                  >▶</button>
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

        <!-- Comentarios -->
        <div v-show="showComments" class="comments-section">
          <h2 class="section-title">Comentarios</h2>
          <div v-if="!trip.comments || trip.comments.length === 0" class="no-comments">
            No hay comentarios todavía.
          </div>
          <div v-else>
            <div
              class="comment-card"
              v-for="(comment, index) in trip.comments"
              :key="index"
            >
              <div class="comment-header">
                <span class="comment-username">{{ comment.user || 'Anónimo' }}</span>
                <span class="comment-timestamp">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p class="comment-text">{{ comment.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
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

    const defaultImage =
      "https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg";
    const defaultCover = "https://i.imgur.com/mS1b7mF.jpeg";

    // Like state
    const isLiked = ref(false);
    const likeCount = ref(0);

    // Comments visibility
    const showComments = ref(false);

    const fetchTrip = async () => {
      try {
        const id = route.params.id;
        const res = await fetch(`/api/trips/${id}`);
        const data = await res.json();

        if (data.ok && data.trip) {
          data.trip.stops?.forEach((stop) => {
            stop.currentImageIndex = 0;
            if (!Array.isArray(stop.images)) stop.images = [];
          });
          trip.value = data.trip;
          likeCount.value = data.trip.likes || 0;
          isLiked.value = data.trip.userLiked || false;
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

    // Toggle like
    const toggleLike = async () => {
      try {
        const id = route.params.id;
        const res = await fetch(`/api/trips/${id}/like`, {
          method: isLiked.value ? 'DELETE' : 'POST',
        });
        const data = await res.json();
        if (data.ok) {
          isLiked.value = !isLiked.value;
          likeCount.value += isLiked.value ? 1 : -1;
        }
      } catch (e) {
        console.error('Error toggling like');
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
    };

    // Action icons
    const likeOutlineIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const likeFilledIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M11.645 20.906l-.007-.003-.022-.01a15.741 15.741 0 01-.383-.218 25.45 25.45 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.01-.007.004-.003.001a.752 .752 0 01-.704 0l-.003-.001z"/></svg>`;
    const commentIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const saveIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    onMounted(fetchTrip);

    return {
      trip,
      loading,
      error,
      changeImage,
      formatDate,
      defaultImage,
      defaultCover,
      isLiked,
      likeCount,
      toggleLike,
      showComments,
      likeOutlineIcon,
      likeFilledIcon,
      commentIcon,
      saveIcon,
    };
  },
};
</script>

<style scoped>
/* ======= GENERAL ======= */
.post-page {
  display: flex;
  min-height: 100vh;
  color: #fff;
  position: relative;
}

/* ======= SIDEBAR ======= */
.sidebar {
  width: 250px;
  background: #0a0a0a;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
}

.logo {
  width: 130px;
  height: auto;
  margin-bottom: 2rem;
  align-self: flex-start;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
  color: #ccc;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.icon {
  width: 20px;
  height: 20px;
}

/* ======= MAIN CONTENT (centrado) ======= */
.main-content {
  flex: 1;
  padding: 2rem;
  margin-left: 250px;
  margin-right: 350px; /* espacio para comentarios */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
}

/* ======= CONTENIDO DEL VIAJE ======= */
.trip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.trip-details {
  width: 100%;
  max-width: 850px;
  text-align: center;
  margin: 0 auto;
}

.trip-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #fff;
}

.trip-description {
  color: #ccc;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 700px;
  margin-inline: auto;
  line-height: 1.6;
}

/* ======= TRIP ACTIONS ======= */
.trip-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #fff;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
}

.like-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
}

/* ======= STOP CARDS ======= */
.stop-card-wrapper {
  position: relative;
  margin-bottom: 6rem;
  width: 100%;
}

.stop-card {
  padding: 2rem;
  border: 1.5px solid #fff;
  border-radius: 12px;
  background: rgba(10, 10, 10, 0.7);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 850px;
  margin: 0 auto;
  min-height: 300px;
  animation: fadeIn 0.6s ease-in;
}

.stop-images {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 350px;
}

.stop-image {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #fff;
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
  max-width: 400px;
}

.stop-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.stop-info p {
  margin: 0.3rem 0;
  font-size: 1.1rem;
  line-height: 1.5;
}

.route-line {
  position: absolute;
  width: 2px;
  background: #fff;
  height: 100px;
  left: 50%;
  transform: translateX(-50%);
  top: 100%;
}

/* ======= PANEL DE COMENTARIOS ======= */
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
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.comment-card {
  margin-bottom: 1rem;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  color: #ccc;
  margin-bottom: 0.3rem;
}

.comment-username {
  font-weight: bold;
  color: #fff;
}

.comment-timestamp {
  color: #888;
}

.comment-text {
  font-size: 1.1rem;
  margin: 0;
}

/* ======= ANIMACIÓN FADE-IN ======= */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>