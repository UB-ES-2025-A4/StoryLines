<template>
  <div class="texture-tester">
    <div class="tester-header">
      <h2>Probador de Texturas</h2>
      <button @click="$emit('close')" class="close-btn">Cerrar</button>
    </div>

    <div class="test-section">
      <h3>Texturas de Globo</h3>
      <div class="texture-grid">
        <div 
          v-for="item in globeItems" 
          :key="item.id"
          class="texture-card"
          @click="equipAndTest(item)"
        >
          <img :src="item.imageUrl" :alt="item.name" />
          <p>{{ item.name }}</p>
          <div v-if="isEquipped(item.id)" class="equipped-badge">Equipado</div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Fondos Home</h3>
      <div class="texture-grid">
        <div 
          v-for="item in homeBgItems" 
          :key="item.id"
          class="texture-card"
          @click="equipAndTest(item)"
        >
          <img :src="item.imageUrl" :alt="item.name" />
          <p>{{ item.name }}</p>
          <div v-if="isEquipped(item.id)" class="equipped-badge">Equipado</div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Fondos Perfil</h3>
      <div class="texture-grid">
        <div 
          v-for="item in profileBgItems" 
          :key="item.id"
          class="texture-card"
          @click="equipAndTest(item)"
        >
          <img :src="item.imageUrl" :alt="item.name" />
          <p>{{ item.name }}</p>
          <div v-if="isEquipped(item.id)" class="equipped-badge">Equipado</div>
        </div>
      </div>
    </div>

    <div class="test-info">
      <h4>Items Equipados Actualmente:</h4>
      <pre>{{ JSON.stringify(equippedItems, null, 2) }}</pre>
      <button @click="clearAll" class="clear-btn">Limpiar Todo</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getItems } from '@/data/shopThemes'
import { useCustomization } from '@/composables/useCustomization'

const { equippedItems, equipItem, isEquipped } = useCustomization()


const allItems = ref([])
const loading = ref(true)
const error = ref(null)

// cargar items del backend al montar el componente
onMounted(async () => {
  try {
    const items = await getItems()
    allItems.value = items
  } catch (e) {
    console.error('Error cargando items de la tienda', e)
    error.value = 'No se han podido cargar los items'
  } finally {
    loading.value = false
  }
})

const globeItems = computed(() => 
  allItems.value.filter(item => item.type === 'globe')
)

const homeBgItems = computed(() => 
  allItems.value.filter(item => item.type === 'homeBg')
)

const profileBgItems = computed(() => 
  allItems.value.filter(item => item.type === 'profileBg')
)

function equipAndTest(item) {
  equipItem(item.id, item.type)
  alert(`Equipado: ${item.name}\n\nRecarga la página para ver los cambios en Home/Profile/Globe`)
}

function clearAll() {
  localStorage.removeItem('equipped_items')
  location.reload()
}

defineEmits(['close'])
</script>


<style scoped>
.texture-tester {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  background: #1a1a1a;
  border-radius: 16px;
  padding: 2rem;
  z-index: 10000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.tester-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tester-header h2 {
  color: white;
  margin: 0;
}

.close-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.test-section {
  margin-bottom: 2rem;
}

.test-section h3 {
  color: white;
  margin-bottom: 1rem;
}

.texture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.texture-card {
  position: relative;
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.texture-card:hover {
  transform: scale(1.05);
}

.texture-card img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.texture-card p {
  color: white;
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
}

.equipped-badge {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: #22c55e;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.test-info {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 2rem;
}

.test-info h4 {
  color: white;
  margin-top: 0;
}

.test-info pre {
  background: #1a1a1a;
  color: #4ade80;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.clear-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}
</style>
