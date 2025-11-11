<template>
  <div class="post-page">
    <!-- Sidebar -->
    <div class="sidebar">
      <img src="@/assets/LogoBlanco.png" alt="StoryLines Logo" class="logo" />
      <nav>
        <router-link to="/" class="nav-item" :class="{ 'active': $route.path === '/' }">
          <svg class="icon" v-html="homeIcon"></svg>
          <span>Home</span>
        </router-link>
        <router-link to="/createtrip" class="nav-item" :class="{ 'active': $route.path === '/createtrip' }">
          <svg class="icon" v-html="createIcon"></svg>
          <span>Create</span>
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ 'active': $route.path === '/profile' }">
          <svg class="icon" v-html="profileIcon"></svg>
          <span>Profile</span>
        </router-link>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="trip-content">
        <!-- Trip Details -->
        <div class="trip-details">
          <h1 class="trip-title">{{ mockTrip.title }}</h1>
          <div class="stops-route">
            <div v-for="(stop, index) in mockTrip.stops" :key="index" class="stop-card-wrapper">
              <div class="stop-card">
                <div class="stop-images">
                  <button class="nav-arrow left" @click="changeImage(stop, -1)" :disabled="stop.currentImageIndex === 0">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 18L9 12L15 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <img :src="stop.images[stop.currentImageIndex]" alt="Stop image" class="stop-image" />
                  <button class="nav-arrow right" @click="changeImage(stop, 1)" :disabled="stop.currentImageIndex === stop.images.length - 1">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6L15 12L9 18" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div class="stop-details">
                  <h3 class="stop-title">{{ stop.title }}</h3>
                  <div class="stop-info">
                    <p><strong>City:</strong> {{ stop.city }}</p>
                    <p><strong>Country:</strong> {{ stop.country }}</p>
                    <p><strong>Description:</strong> {{ stop.description }}</p>
                  </div>
                </div>
              </div>
              <div v-if="index < mockTrip.stops.length - 1" class="route-line"></div>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h2 class="section-title">Comments</h2>
          <div class="comment-card" v-for="(comment, index) in mockTrip.comments" :key="index">
            <div class="comment-header">
              <span class="comment-username">user{{ index + 1 }}</span>
              <span class="comment-timestamp">01:25 PM, Nov 11, 2025</span>
            </div>
            <p class="comment-text">{{ comment }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Post',
  setup() {
    const mockTrip = ref({
      title: 'Trip Title',
      coverImage: 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg',
      stops: [
        {
          title: 'Stop 1',
          city: 'Sample City',
          country: 'Sample Country',
          description: 'This is a mock description for Stop 1.',
          images: [
            'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg',
            'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg',
            'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'
          ],
          currentImageIndex: 0
        },
        {
          title: 'Stop 2',
          city: 'Another City',
          country: 'Another Country',
          description: 'This is a mock description for Stop 2.',
          images: ['https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg', 'https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg'],
          currentImageIndex: 0
        }
      ],
      comments: ['Great trip!', 'Amazing photos!', 'Can’t wait to see more!']
    })

    const changeImage = (stop, delta) => {
      const newIndex = stop.currentImageIndex + delta
      if (newIndex >= 0 && newIndex < stop.images.length) {
        stop.currentImageIndex = newIndex
      }
    }

    onMounted(() => {
    })

    const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21" stroke="currentColor" stroke-width="2"/></svg>`;

    return {
      mockTrip,
      changeImage,
      homeIcon,
      createIcon,
      profileIcon
    }
  }
}
</script>

<style scoped>
.post-page {
  display: flex;
  min-height: 100vh;
  background: url('https://jkfenner.com/wp-content/uploads/2019/11/default-450x450.jpg') no-repeat center center/cover;
  background-color: rgba(0, 0, 0, 0.5);
  background-blend-mode: overlay;
  color: #fff;
  position: relative;
}

.sidebar {
  width: 250px;
  background: #0A0A0A;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  align-self: left;
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
  gap: 1rem;
  font-size: 1.1rem;
  color: #ccc;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s;
  position: relative;
  min-height: 40px;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
}

.icon {
  width: 20px;
  height: 20px;
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

.main-content {
  flex: 1;
  padding: 2rem 2rem 2rem 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  width: 100%;
}

.trip-content {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  width: 100%;
  justify-content: center;
}

.trip-details {
  flex: 1;
  max-width: 850px;
  text-align: center;
  padding-top: 1rem;
}

.trip-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #fff;
}

.stops-route {
  position: relative;
  text-align: center;
}

.stop-card-wrapper {
  position: relative;
  margin-bottom: 6rem;
  display: inline-block;
  vertical-align: top;
}

.stop-card {
  padding: 2rem;
  border: 1.5px solid #fff;
  border-radius: 12px;
  background: #0A0A0A;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 850px;
  margin: 0 auto;
  position: relative;
  min-height: 300px; /* Increased height */
}

.stop-images {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 350px;
  padding: 0 10px;
}

.stop-image {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #fff;
  display: block;
  z-index: 0;
}

.nav-arrow {
  background: rgba(10, 10, 10, 0.8);
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
  z-index: 1;
}

.nav-arrow:hover {
  opacity: 1;
}

.nav-arrow.left {
  margin-right: 10px;
}

.nav-arrow.right {
  margin-left: 10px;
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow svg {
  width: 24px;
  height: 24px;
}

.stop-details {
  flex: 1;
  min-width: 0;
  padding-left: 1.5rem;
  text-align: left;
  max-width: 400px;
}

.stop-title {
  font-size: 1.5rem; /* Slightly larger for emphasis */
  margin-bottom: 1rem;
}

.stop-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* Better spacing between items */
}

.stop-info p {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.5; /* Improved readability */
}

.route-line {
  position: absolute;
  width: 2px;
  background: #fff;
  height: 100px;
  left: 50%;
  transform: translateX(-50%);
  top: 100%;
  z-index: 0;
  opacity: 1;
}

.comments-section {
  flex: 0 0 300px;
  position: fixed;
  right: 2rem;
  top: 2rem;
  bottom: 2rem;
  background: #0A0A0A;
  border: 1.5px solid #fff;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  margin-left: 0;
}

.comment-card {
  margin-bottom: 1rem;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  font-size: 1.0rem;
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
</style>