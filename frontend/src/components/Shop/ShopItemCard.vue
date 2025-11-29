<template>
  <div 
    class="item-card"
    :class="{ purchased: isPurchased }"
  >
    <div class="item-image-container">
      <img :src="item.imageUrl" :alt="item.name" class="item-image" />
      <div class="item-overlay">
        <div class="item-type-badge">{{ typeLabel }}</div>
        <div class="item-info-hover">
          <span class="item-price">{{ item.price }}€</span>
          <button 
            v-if="!isPurchased"
            class="btn-buy" 
            @click="$emit('purchase', item)"
          >
            Comprar
          </button>
          <div v-else class="purchased-badge">✓ Comprado</div>
        </div>
      </div>
    </div>
    <div class="item-details">
      <h4>{{ item.name }}</h4>
      <p>{{ item.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isPurchased: {
    type: Boolean,
    default: false
  }
})

defineEmits(['purchase'])

const typeLabel = computed(() => {
  const labels = {
    globe: 'Globo',
    homeBg: 'Home',
    profileBg: 'Perfil'
  }
  return labels[props.item.type] || props.item.type
})
</script>

<style scoped>
.item-card {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
}

.item-card.purchased {
  opacity: 0.6;
}

.item-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s;
}

.item-card:hover .item-image {
  filter: brightness(1.2);
  transform: scale(1.05);
}

.item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
}

.item-type-badge {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-info-hover {
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
}

.item-card:hover .item-info-hover {
  opacity: 1;
  transform: translateY(0);
}

.item-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #4ade80;
}

.btn-buy {
  background: white;
  color: #0a0a0a;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy:hover {
  background: #4ade80;
  color: white;
}

.purchased-badge {
  background: #4ade80;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
}

.item-details {
  padding: 1rem;
}

.item-details h4 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: white;
}

.item-details p {
  font-size: 0.9rem;
  color: #aaa;
}
</style>
