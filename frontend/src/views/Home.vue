<template>
  <div class="home">
    <!-- Globo 3D como fondo -->
    <GlobeView />
    
    <!-- Header con navegación -->
    <header class="header">
      <div class="logo">
        <h1>StoryLines</h1>
      </div>
      
      <nav class="nav">
        <div v-if="user" class="user-menu">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleLogout" class="btn btn-outline">Cerrar Sesión</button>
        </div>
        <div v-else class="guest-menu">
          <p class="explore-text">Explora viajes alrededor del mundo</p>
          <router-link to="/login" class="btn btn-primary">Iniciar Sesión</router-link>
          <router-link to="/register" class="btn btn-outline">Registrarse</router-link>
        </div>
      </nav>
    </header>

    <!-- Sidebar -->
    <div class="sidebar">
      <img src="@/assets/LogoBlanco.png" alt="StoryLines Logo" class="logo" />
      <nav>
        <router-link to="/" class="nav-item" :class="{ 'active': $route.path === '/' }">
          <svg class="icon" v-html="homeIcon"></svg>
          <span>Home</span>
        </router-link>
        <router-link to="/createtrip" class="nav-item" :class="{ 'active': $route.path === '/create' }">
          <svg class="icon" v-html="createIcon"></svg>
          <span>Create</span>
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ 'active': $route.path === '/profile' }">
          <svg class="icon" v-html="profileIcon"></svg>
          <span>Profile</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'
import GlobeView from '@/components/Globe/GlobeView.vue'

const router = useRouter()
const user = ref(null)

// Obtener usuario actual
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
})

// Escuchar cambios en la autenticación
supabase.auth.onAuthStateChange((event, session) => {
  user.value = session?.user || null
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

// SVG Icons
const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21" stroke="currentColor" stroke-width="2"/></svg>`;
</script>

<style scoped>
.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Header flotante */
.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  z-index: 10;
}

.logo h1 {
  margin: 0;
  font-size: 28px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.tagline {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-menu,
.guest-menu {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-email {
  color: white;
  font-size: 14px;
  margin-right: 8px;
}

.explore-text {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 14px;
  margin-right: 12px;
}

/* Botones */
.btn {
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: rgba(0, 123, 255, 0.9);
  color: white;
}

.btn-primary:hover {
  background: rgba(0, 123, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.btn-secondary {
  background: rgba(40, 167, 69, 0.9);
  color: white;
}

.btn-secondary:hover {
  background: rgba(40, 167, 69, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
}

/* Card de información flotante */
.info-overlay {
  position: absolute;
  bottom: 30px;
  left: 30px;
  z-index: 10;
  max-width: 350px;
}

.info-card {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-card h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #fff;
}

.info-card p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}

.info-card li {
  font-size: 13px;
  margin: 6px 0;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.color-indicator.blue {
  background: rgba(0, 123, 255, 1);
}

.color-indicator.green {
  background: rgba(40, 167, 69, 1);
}

.color-indicator.orange {
  background: rgba(255, 152, 0, 1);
}

.info-card .tip {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }
  
  .info-overlay {
    bottom: 15px;
    left: 15px;
    right: 15px;
    max-width: none;
  }
  
  .info-card {
    padding: 15px;
  }
  
  .user-menu,
  .guest-menu {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .explore-text {
    width: 100%;
    text-align: center;
    margin-bottom: 8px;
  }
}

  .sidebar {
  width: 250px;
  background: #0a0a0a;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  z-index: 100;
  resize: horizontal;
  min-width: 200px;
  max-width: 300px;
  transition: width 0.2s, padding 0.2s;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  /* Removed invalid align-self: left */
  /* Align to left if desired: */
  align-self: flex-start; /* Optional: aligns logo to the left */
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
  /* Changed from justify-content: center to flex-start for left alignment */
  justify-content: flex-start;
  gap: 1rem;
  font-size: 1.1rem;
  color: #ccc;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s;
  position: relative;
  min-height: 40px;
  /* Removed text-align: center since it's no longer needed */
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center; /* Keeps SVG centered within its container */
}

.icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}
</style>
