<template>
  <div class="profile-page">
    <Sidebar />

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else class="profile-card">

      <!-- CABECERA DEL PERFIL -->
      <div class="profile-header">
        <div class="avatar-container">
          <img
            class="avatar"
            :src="profile.avatar_url || defaultAvatar"
            alt="Foto de perfil"
          />
        </div>

        <div class="profile-text">
          <h2 class="username">{{ profile.username }}</h2>
          <h1 class="display-name">{{ profile.display_name }}</h1>
          <p class="bio">{{ profile.bio }}</p>
        </div>
      </div>

      <!-- VIAJES PUBLICADOS -->
      <div class="recent-trips-section">
        <div class="recent-trips-header">
          <h2 style="text-align:center; color:white">Viajes publicados</h2>
        </div>

        <div class="trips-container">
          <div 
            v-if="trips.length > 0" 
            class="trip-cards-wrapper"
          >
            <div 
              class="trip-card"
              v-for="trip in trips"
              :key="trip.id"
              @click="goToTrip(trip.id)"
            >
              <img :src="trip.cover_image || defaultImg" class="trip-image" />

              <div class="trip-info">
                <div class="trip-details">
                  <h4>{{ trip.trip_name }}</h4>
                  <p>{{ truncateText(trip.description, 120) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-trips-message">
            No hay viajes publicados.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/config/supabase';
import Sidebar from '@/components/Sidebar.vue';

const route = useRoute();
const router = useRouter();

const userId = route.params.id;
const loading = ref(true);

const profile = ref({});
const trips = ref([]);

const defaultAvatar =
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";

const defaultImg =
  "https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg";

const loadProfile = async () => {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  profile.value = data || {};
};

const loadTrips = async () => {
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("start_date", { ascending: false });

  trips.value = data || [];
};

const truncateText = (text, limit) =>
  text?.length > limit ? text.slice(0, limit) + "..." : text || "";

const goToTrip = (id) => router.push(`/post/${id}`);

onMounted(async () => {
  await loadProfile();
  await loadTrips();
  loading.value = false;
});
</script>

<style scoped>
/* DIRECTAMENTE EL MISMO CSS DE PROFILE.VUE */

.profile-page {
  min-height: 100vh;
  background: url('https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?ixlib=rb-4.1.0')
    center/cover no-repeat;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  color: #fff;
}

.profile-card {
  background: linear-gradient(to bottom, rgba(11, 47, 74, 0.6), rgba(39, 45, 45, 0.6));
  backdrop-filter: blur(14px);
  width: 100%;
  max-width: 700px;
  padding: 3rem 1rem;
  min-height: 100vh;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  margin-right: 20%;
}

.profile-text { 
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ffffff;
}

.username {
  font-size: 2rem;
}

.display-name {
  font-size: 1.3rem;
}

.bio {
  font-size: 0.9rem;
}

.recent-trips-section {
  width: 95%;
}

.recent-trips-header {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(2, 161, 143, 0.8), rgba(55, 86, 137, 0.8));
}

.trips-container {
  padding: 1.5rem 2rem;
  background: rgba(11, 47, 74, 0.3);
}

.trip-card {
  background: #fff;
  border-radius: 16px;
  display: flex;
  gap: 1.5rem;
  height: 150px;
  cursor: pointer;
  position: relative;
}

.trip-card:hover {
  background: #f0f0f0;
}

.trip-image {
  width: 150px;
  height: 100%;
  border-radius: 12px 0 0 12px;
  object-fit: cover;
}

.trip-details h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #000;
}

.trip-details p {
  color: #000;
}

.no-trips-message {
  text-align: center;
  font-size: 1.2rem;
  color: #fff;
}
</style>
