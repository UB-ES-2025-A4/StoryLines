<template>
  <div class="filter-bar">
    <button 
      v-for="filter in filters" 
      :key="filter.id"
      class="filter-button"
      :class="{ active: currentFilter === filter.id }"
      @click="$emit('filter-change', filter.id)"
    >
      <span class="filter-icon">{{ filter.icon }}</span>
      <span class="filter-label">{{ filter.label }}</span>
    </button>
  </div>
</template>

<script setup>
const filters = [
  { id: 'all', label: 'Todos', icon: '🌟' },
  { id: 'globe', label: 'Globos', icon: '🌍' },
  { id: 'homeBg', label: 'Fondos Home', icon: '🏠' },
  { id: 'profileBg', label: 'Fondos Perfil', icon: '👤' }
]

defineProps({
  currentFilter: {
    type: String,
    default: 'all'
  }
})

defineEmits(['filter-change'])
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-button {
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

.filter-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-2px);
}

.filter-button.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.filter-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.filter-label {
  line-height: 1;
}

@media (max-width: 768px) {
  .filter-bar {
    gap: 0.5rem;
  }
  
  .filter-button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .filter-icon {
    font-size: 1rem;
  }
}
</style>
