<template>
    <div class="customization-page">
      <Sidebar />
      
      <div class="customization-content">
        <div class="header-section">
          <button class="back-btn" @click="$router.push('/settings')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="back-icon">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          <h1 class="title">Personalización</h1>
          <div class="color-selector">
            <span class="color-label">Color de usuario</span>
            <input 
              type="color" 
              :value="hexColor" 
              @input="handleColorChange"
              class="color-picker-small"
            />
          </div>
        </div>
        
        <!-- Drop zones con preview y botón eliminar -->
        <div class="drop-zones">
          <div class="drop-zone" @drop="handleDrop($event, 'globe')" @dragover.prevent>
            <h3>Globo</h3>
            <div class="preview-container">
              <div class="equipped-preview">
                <img v-if="equippedPreviews.globe" :src="equippedPreviews.globe" class="equipped-image" />
                <div v-else class="no-item-placeholder">Sin equipar</div>
              </div>
              <div class="current-item">{{ equippedItems.globe || 'Sin equipar' }}</div>
              <button 
                v-if="getEquippedItem('globe')" 
                @click="unequipItem('globe')" 
                class="unequip-btn"
              >
                ✕ Quitar
              </button>
            </div>
          </div>
          <div class="drop-zone" @drop="handleDrop($event, 'homeBg')" @dragover.prevent>
            <h3>Fondo de home</h3>
            <div class="preview-container">
              <div class="equipped-preview">
                <img v-if="equippedPreviews.homeBg" :src="equippedPreviews.homeBg" class="equipped-image" />
                <div v-else class="no-item-placeholder">Sin equipar</div>
              </div>
              <div class="current-item">{{ equippedItems.homeBg || 'Sin equipar' }}</div>
              <button 
                v-if="getEquippedItem('homeBg')" 
                @click="unequipItem('homeBg')" 
                class="unequip-btn"
              >
                ✕ Quitar
              </button>
            </div>
          </div>
          <div class="drop-zone" @drop="handleDrop($event, 'profileBg')" @dragover.prevent>
            <h3>Fondo de perfil</h3>
            <div class="preview-container">
              <div class="equipped-preview">
                <img v-if="equippedPreviews.profileBg" :src="equippedPreviews.profileBg" class="equipped-image" />
                <div v-else class="no-item-placeholder">Sin equipar</div>
              </div>
              <div class="current-item">{{ equippedItems.profileBg || 'Sin equipar' }}</div>
              <button 
                v-if="getEquippedItem('profileBg')" 
                @click="unequipItem('profileBg')" 
                class="unequip-btn"
              >
                ✕ Quitar
              </button>
            </div>
          </div>

        </div>
  
        <!-- Filtros -->
        <div class="filter-bar">
          <button 
            :class="{ active: currentFilter === 'all' }" 
            @click="currentFilter = 'all'"
            class="filter-btn"
          >
            Todos
          </button>
          <button 
            :class="{ active: currentFilter === 'globe' }" 
            @click="currentFilter = 'globe'"
            class="filter-btn"
          >
            Globos
          </button>
          <button 
            :class="{ active: currentFilter === 'homeBg' }" 
            @click="currentFilter = 'homeBg'"
            class="filter-btn"
          >
            Fondos de home
          </button>
          <button 
            :class="{ active: currentFilter === 'profileBg' }" 
            @click="currentFilter = 'profileBg'"
            class="filter-btn"
          >
            Fondos de perfil
          </button>
        </div>
  
        <!-- Items comprados -->
        <div class="purchased-items">
          <div class="section-header">
            <h3>Items Comprados</h3>
            <div class="info-tooltip">
              <div class="info-icon">i</div>
              <div class="tooltip-content">
                Arrastra los items a las zonas de arriba para equiparlos.
              </div>
            </div>
          </div>
          <div class="items-grid">
            <div 
              v-for="item in filteredPurchasedItems" 
              :key="item.id"
              class="item-card"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
            >
              <div class="item-image-container">
                <img :src="item.imageUrl" :alt="item.name" />
                <div class="item-overlay">
                  <div class="item-type-badge">{{ getTypeName(item.type) }}</div>
                  <div class="item-details">
                    <h3>{{ item.name }}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
<script setup>
import { onMounted, ref, computed } from 'vue'
import { supabase } from '@/config/supabase'
import Sidebar from '@/components/Sidebar.vue'
import { usePurchases } from '@/composables/usePurchases'
import { useCustomization } from '@/composables/useCustomization'
import { getItems } from '@/data/shopThemes.js'

const user = ref(null)

// Personalización
const { isPurchased } = usePurchases()
const { getEquippedItem, equipItem, unequipItem: unequipSlot, initialize: initCustomization, getUserColor, updateUserColor } = useCustomization()
const purchasedItems = ref([])
const equippedItems = ref({})
const currentFilter = ref('all')
const allItems = ref([])
const currentUserColor = ref(null)
const scrollInterval = ref(null)

const filteredPurchasedItems = computed(() => {
    if (currentFilter.value === 'all') {
        return purchasedItems.value
    }
    return purchasedItems.value.filter(item => item.type === currentFilter.value)
})

// Computed para las previews que se actualiza automáticamente
const equippedPreviews = computed(() => {
    if (allItems.value.length === 0) return { globe: null, homeBg: null, profileBg: null }
    
    return {
        globe: getEquippedPreview('globe'),
        homeBg: getEquippedPreview('homeBg'),
        profileBg: getEquippedPreview('profileBg')
    }
})

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null

  if (user.value) {
    // 🔥 aseguramos que el composable carga desde BD
    await initCustomization(user.value.id)
    await loadCustomizationData()
    // Cargar el color después de la inicialización
    currentUserColor.value = getUserColor() || 'rgba(128, 128, 128, 1)'
  }
})


async function loadCustomizationData() {
    try {
        const itemsData = await getItems()
        allItems.value = itemsData

        
        const res = await fetch(`/api/purchases/${user.value.id}`)
        const data = await res.json()
        
        if (data.ok) {
            const purchasedItemIds = data.items
            purchasedItems.value = allItems.value.filter(item => 
                purchasedItemIds.includes(item.id)
            )
        } else {
            purchasedItems.value = []
        }
        
        equippedItems.value = {
          globe: getItemName(getEquippedItem('globe'), allItems.value),
          homeBg: getItemName(getEquippedItem('homeBg'), allItems.value),
          profileBg: getItemName(getEquippedItem('profileBg'), allItems.value)
        }

        // El color ya se carga en onMounted después de initCustomization

    } catch (error) {
        console.error('Error loading customization data:', error)
        purchasedItems.value = []
    }
}

function getTypeName(type) {
    const types = {
        globe: 'Globo',
        homeBg: 'Home',
        profileBg: 'Perfil'
    }
    return types[type] || type
}

function getEquippedPreview(slotType) {
  const equippedId = getEquippedItem(slotType)
  if (!equippedId) return null
  
  const item = allItems.value.find(i => i.id === equippedId)
  return item ? item.imageUrl : null
}


function getItemName(itemId, allItems) {
    if (!itemId) return 'Sin equipar'
    const item = allItems.find(i => i.id === itemId)
    return item ? item.name : 'Sin equipar'
}

function handleDragStart(event, item) {
    event.dataTransfer.setData('text/plain', JSON.stringify(item))
    
    // Agregar listeners para auto-scroll
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragend', handleDragEnd)
}

function handleDragOver(event) {
    const scrollThreshold = 100
    const scrollSpeed = 10
    const y = event.clientY
    const windowHeight = window.innerHeight
    
    // Limpiar intervalo anterior
    if (scrollInterval.value) {
        clearInterval(scrollInterval.value)
        scrollInterval.value = null
    }
    
    // Scroll hacia arriba
    if (y < scrollThreshold) {
        scrollInterval.value = setInterval(() => {
            window.scrollBy(0, -scrollSpeed)
        }, 16)
    }
    // Scroll hacia abajo
    else if (y > windowHeight - scrollThreshold) {
        scrollInterval.value = setInterval(() => {
            window.scrollBy(0, scrollSpeed)
        }, 16)
    }
}

function handleDragEnd() {
    // Limpiar listeners y intervalos
    document.removeEventListener('dragover', handleDragOver)
    document.removeEventListener('dragend', handleDragEnd)
    
    if (scrollInterval.value) {
        clearInterval(scrollInterval.value)
        scrollInterval.value = null
    }
}

async function handleDrop(event, slotType) {
  event.preventDefault()
  const itemData = JSON.parse(event.dataTransfer.getData('text/plain'))
  
  if (itemData.type !== slotType) {
    return
  }

  const ok = await equipItem(itemData.id, slotType)
  if (!ok) return   // si el backend falla, no cambiamos la UI

  equippedItems.value[slotType] = itemData.name
}

async function unequipItem(slotType) {
  const ok = await unequipSlot(slotType)
  if (!ok) return

  equippedItems.value[slotType] = 'Sin equipar'
}

function rgbaToHex(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return '#007bff'
  
  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])
  
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function hexToRgba(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 1)`
}

const hexColor = computed(() => currentUserColor.value ? rgbaToHex(currentUserColor.value) : '#808080')

async function handleColorChange(event) {
  const newColor = hexToRgba(event.target.value)
  const ok = await updateUserColor(newColor)
  if (ok) {
    currentUserColor.value = newColor
  }
}


</script>
  
<style scoped>
.customization-page {
  display: flex;
  min-height: 100vh;
  background: #0A0A0A;
  color: #fff;
}

.customization-content {
  flex: 1;
  padding: 2rem;
  margin-left: 250px;
  width: calc(100vw - 250px);
  max-width: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(55, 86, 137, 0.3);
  color: white;
  border-color: rgba(55, 86, 137, 0.5);
  transform: translateX(-2px);
}

.back-icon {
  width: 16px;
  height: 16px;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-align: left;
}

.drop-zones {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.drop-zone {
  flex: 1;
  border: 2px dashed #666;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  min-height: 120px;
  background: #1a1a1a;
  color: white;
  transition: all 0.3s;
}

.drop-zone:hover {
  border-color: #007bff;
}

.drop-zone h3 {
  margin: 0 0 1rem 0;
  color: #fff;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.equipped-preview {
  width: 100px;
  height: 100px;
  border: 2px dashed #666;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.equipped-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.no-item-placeholder {
  color: #666;
  font-size: 0.8rem;
  text-align: center;
}

.drop-zone:hover .equipped-preview {
  border-color: #007bff;
}

.current-item {
  color: #ccc;
  font-size: 0.9rem;
}

.unequip-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}

.unequip-btn:hover {
  background: #c82333;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  justify-content: flex-start;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-2px);
}

.filter-btn.active {
  background: linear-gradient(135deg, rgba(2, 161, 143, 0.8), rgba(55, 86, 137, 0.8));
  border-color: rgba(2, 161, 143, 0.8);
  color: white;
}

.purchased-items {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #fff;
  text-align: left;
}

.info-tooltip {
  position: relative;
  display: inline-block;
}

.info-icon {
  width: 20px;
  height: 20px;
  background: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  cursor: help;
  transition: background 0.2s;
}

.info-icon:hover {
  background: #888;
}

.tooltip-content {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 1000;
  transition: opacity 0.3s, visibility 0.3s;
}

.tooltip-content::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #333;
}

.info-tooltip:hover .tooltip-content {
  visibility: visible;
  opacity: 1;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.item-card {
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: grab;
  position: relative;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.item-card:active {
  cursor: grabbing;
}

.item-image-container {
  position: relative;
  width: 100%;
  padding-top: 100%;
  overflow: hidden;
}

.item-card img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.item-card:hover img {
  transform: scale(1.05);
  filter: brightness(1.2);
}

.item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.9) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.item-type-badge {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-details {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.item-card:hover .item-details {
  opacity: 1;
  transform: translateY(0);
}

.item-details h3 {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
}

.color-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.color-label {
  font-size: 1rem;
  font-weight: 500;
  color: #ccc;
}

.color-preview-small {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.color-picker-small {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: none;
  padding: 0;
}

.color-picker-small::-webkit-color-swatch-wrapper {
  padding: 0;
  border: none;
  border-radius: 50%;
}

.color-picker-small::-webkit-color-swatch {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}
</style>