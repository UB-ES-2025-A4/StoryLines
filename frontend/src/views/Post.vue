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
                  <h3 class="stop-title">{{ stop.city || 'Parada sin nombre' }}</h3>
                  <div class="stop-info">
                    <p><strong>City:</strong> {{ stop.city || '—' }}</p>
                    <p><strong>Country:</strong> {{ stop.country || '—' }}</p>
                    <p><strong>Description:</strong> {{ stop.description || 'Sin descripción' }}</p>
                  </div>
                </div>
              </div>

              <div v-if="index < (trip.stops?.length || 0) - 1" class="route-line"></div>
            </div>
          </div>
        </div>

        <!-- Comentarios -->
        <div class="comments-section">
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

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
    };

    const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5"
    stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21"
    stroke="currentColor" stroke-width="2"/></svg>`;

    onMounted(fetchTrip);

    return {
      trip,
      loading,
      error,
      changeImage,
      formatDate,
      defaultImage,
      defaultCover,
      homeIcon,
      createIcon,
      profileIcon,
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
