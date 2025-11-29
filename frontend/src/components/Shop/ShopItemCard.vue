<template>
  <div class="shop-item-card" :class="{ purchased: isPurchased }">
    <div class="item-image-container">
      <img 
        :src="item.imageUrl" 
        :alt="item.name" 
        class="item-image" 
        loading="lazy"
        decoding="async"
      />
      <div class="item-overlay">
        <div class="item-type-badge">{{ getTypeName(item.type) }}</div>
        <div class="item-details">
          <h3>{{ item.name }}</h3>
          <p class="item-description">{{ item.description }}</p>
          <div class="item-footer">
            <span class="item-price">
              {{ item.price }} <img src="@/assets/credtis.png" alt="créditos" class="price-icon" />
            </span>
            <button 
              v-if="!isPurchased" 
              @click="$emit('purchase', item)"
              class="buy-button"
            >
              Comprar
            </button>
            <span v-else class="purchased-badge">Comprado</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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

function getTypeName(type) {
  const types = {
    globe: 'Globo',
    homeBg: 'Home',
    profileBg: 'Perfil'
  }
  return types[type] || type
}
</script>

<style scoped>
.shop-item-card {
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  position: relative;
}

.shop-item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.shop-item-card.purchased {
  opacity: 0.6;
}

.item-image-container {
  position: relative;
  width: 100%;
  padding-top: 100%;
  overflow: hidden;
}

.item-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.shop-item-card:hover .item-image {
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

.shop-item-card.purchased .item-type-badge {
  background: rgba(34, 197, 94, 0.3);
}

.item-details {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.shop-item-card:hover .item-details {
  opacity: 1;
  transform: translateY(0);
}

.item-details h3 {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
}

.item-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.item-price {
  font-size: 18px;
  font-weight: 700;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-icon {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(84%) sepia(35%) saturate(846%) hue-rotate(358deg) brightness(103%) contrast(98%);
}

.buy-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-size: 14px;
}

.buy-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.purchased-badge {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid #22c55e;
}
</style>
