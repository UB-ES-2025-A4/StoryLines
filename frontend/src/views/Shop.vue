<template>
  <div class="shop-page">
    <Sidebar />
    
    <div class="shop-content">
      <!-- Header con saldo -->
      <div class="shop-header">
        <div class="header-left">
          <h1>Tienda</h1>
          <button @click="showTextureTester = true" class="btn-test">Probar Texturas</button>
        </div>
        <BalanceDisplay @click="showRechargeModal = true" />
      </div>

      <!-- Grid de Items -->
      <div class="items-section">
        <div class="section-header">
          <h3>Todos los Items</h3>
        </div>
        <FilterBar :currentFilter="currentFilter" @filter-change="handleFilterChange" />
        <TransitionGroup name="items" tag="div" class="items-grid">
          <ShopItemCard 
            v-for="item in filteredItems" 
            :key="item.id" 
            :item="item"
            :isPurchased="isPurchased(item.id)"
            @purchase="purchaseItem"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- Modal de Recarga -->
    <RechargeModal 
      :isOpen="showRechargeModal" 
      @close="showRechargeModal = false"
      @recharged="handleRecharge"
    />

    <!-- Texture Tester Modal -->
    <TextureTester 
      v-if="showTextureTester" 
      @close="showTextureTester = false"
    />

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ShopItemCard from '@/components/Shop/ShopItemCard.vue'
import BalanceDisplay from '@/components/Shop/BalanceDisplay.vue'
import RechargeModal from '@/components/Shop/RechargeModal.vue'
import FilterBar from '@/components/Shop/FilterBar.vue'
import TextureTester from '@/components/Shop/TextureTester.vue'
import { useBalance } from '@/composables/useBalance'
import { usePurchases } from '@/composables/usePurchases'
import { getItems, getFeaturedTheme, getItemsByTheme } from '@/data/shopThemes.js'

// Balance system
const { balance } = useBalance()
const showRechargeModal = ref(false)

// Purchase system
const { isPurchased, purchaseItem: makePurchase, purchaseTheme: buyTheme } = usePurchases()

// Texture tester
const showTextureTester = ref(false)

// Filter system
const currentFilter = ref('all')

// Toast notifications
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Shop data
const allItems = ref([])

const filteredItems = computed(() => {
  if (currentFilter.value === 'all') {
    return allItems.value
  }
  return allItems.value.filter(item => item.type === currentFilter.value)
})

onMounted(() => {
  allItems.value = getItems()
})

function handleFilterChange(filterId) {
  currentFilter.value = filterId
}

// Balance event handler
function handleRecharge(amount) {
  showNotification(`Recargaste ${amount} créditos`, 'success')
}

function purchaseItem(item) {
  const result = makePurchase(item)
  showNotification(result.message, result.type)
  
  if (result.success) {
    triggerCelebration()
  }
}

function triggerCelebration() {
  const celebration = document.createElement('div')
  celebration.className = 'celebration-confetti'
  celebration.innerHTML = '★'
  document.querySelector('.shop-content').appendChild(celebration)
  
  setTimeout(() => {
    celebration.remove()
  }, 2000)
}

// Utility functions
function showNotification(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<style scoped>
.shop-page {
  display: flex;
  min-height: 100vh;
  background: #0a0a0a;
}

.shop-content {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  color: white;
}

/* Header */
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.shop-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
}

.btn-test {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-test:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.balance-display:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.balance-icon {
  font-size: 1.5rem;
}

.balance-amount {
  font-size: 1.25rem;
  font-weight: 600;
}

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 3rem;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-content {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.hero-image-container {
  flex: 1;
  max-width: 400px;
}

.hero-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 12px;
}

.hero-info {
  flex: 1;
}

.featured-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.hero-info h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.hero-info p {
  color: #aaa;
  margin-bottom: 1.5rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4ade80;
}

.btn-buy-bundle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-buy-bundle:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-buy-bundle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Items Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.items-section h3 {
  font-size: 1.75rem;
  margin: 0;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  position: relative;
}

/* TransitionGroup animations */
.items-move,
.items-enter-active,
.items-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.items-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.items-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-30px);
}

.items-leave-active {
  position: absolute;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin-bottom: 1rem;
}

.recharge-options {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.btn-recharge {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-recharge:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.custom-recharge {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-amount {
  flex: 1;
  background: #0a0a0a;
  border: 1px solid #333;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
}

.btn-add {
  background: #4ade80;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add:hover {
  background: #22c55e;
}

.btn-close {
  width: 100%;
  background: #333;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #444;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: 2000;
  animation: slideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  min-width: 280px;
}

@keyframes slideIn {
  from { 
    transform: translateX(400px) scale(0.8); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0) scale(1); 
    opacity: 1; 
  }
}

.toast-notification.success {
  border-left: 4px solid #4ade80;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(26, 26, 26, 0.95) 50%);
}

.toast-notification.success::before {
  content: '✓';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #4ade80;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  color: #0a0a0a;
}

.toast-notification.error {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(26, 26, 26, 0.95) 50%);
}

.toast-notification.error::before {
  content: '✕';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #ef4444;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  color: white;
}

/* Celebration */
.celebration-confetti {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 120px;
  z-index: 9999;
  animation: celebrate 2s ease-out forwards;
  pointer-events: none;
}

@keyframes celebrate {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -80%) scale(0.5) rotate(360deg);
    opacity: 0;
  }
}
</style>
