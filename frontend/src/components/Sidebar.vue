<template>
  <div class="sidebar">
    <img src="@/assets/LogoBlanco.png" alt="StoryLines Logo" class="logo" />
    <nav>
      <router-link to="/" class="nav-item" :class="{ 'active': $route.path === '/' }">
        <svg class="icon" v-html="homeIcon"></svg>
        <span>Home</span>
      </router-link>

      <div class="nav-item">
        <svg class="icon" v-html="searchIcon"></svg>
        <span>Buscar</span>
      </div>

      <router-link 
        to="/notifications" 
        class="nav-item" 
        :class="{ 'active': $route.path === '/notifications' }"
      >
        <svg class="icon" v-html="notificationsIcon"></svg>
        <span>Notificaciones</span>
      </router-link>


      <router-link to="/createtrip" class="nav-item" :class="{ 'active': $route.path === '/create' }">
        <svg class="icon" v-html="createIcon"></svg>
        <span>Crear viaje</span>
      </router-link>

      <div class="nav-item">
        <svg class="icon" v-html="storeIcon"></svg>
        <span>Tienda</span>
      </div>

      <div class="nav-item">
        <svg class="icon" v-html="messagesIcon"></svg>
        <span>Mensajes</span>
      </div>

      <router-link to="/profile" class="nav-item" :class="{ 'active': $route.path === '/profile' }">
        <svg class="icon" v-html="profileIcon"></svg>
        <span>Perfil</span>
      </router-link>

      <div class="nav-item">
        <svg class="icon" v-html="settingsIcon"></svg>
        <span>Configuración</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

// ICONOS
const route = useRoute()
const homeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const createIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const profileIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4.5" stroke="currentColor" stroke-width="2"/><path d="M20 21V19C20 15.134 16.866 12 13 12H11C7.134 12 4 15.134 4 19V21" stroke="currentColor" stroke-width="2"/></svg>`
const searchIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const notificationsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a1.999 1.999 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const storeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const messagesIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const settingsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
</script>

<style scoped>
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
  align-self: flex-start;
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