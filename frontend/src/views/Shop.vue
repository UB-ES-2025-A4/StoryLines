<template>
  <div class="shop-page">
    <Sidebar />
    
    <div class="shop-content">
      <!-- Header con saldo -->
      <div class="shop-header">
        <h1>Tienda</h1>
        <BalanceDisplay @click="showRechargeModal = true" />
      </div>

      <!-- Banner Hero - Theme destacado -->
      <div v-if="featuredTheme" class="hero-banner">
        <div class="hero-content">
          <div class="hero-image-container">
            <img :src="featuredTheme.items[0].imageUrl" :alt="featuredTheme.name" class="hero-image" />
          </div>
          <div class="hero-info">
            <div class="featured-badge">✨ DESTACADO</div>
            <h2>{{ featuredTheme.name }}</h2>
            <p>{{ featuredTheme.description }}</p>
            <div class="hero-actions">
              <span class="hero-price">{{ featuredTheme.price }}€</span>
              <button 
                class="btn-buy-bundle" 
                @click="purchaseTheme(featuredTheme)"
                :disabled="isThemePurchased(featuredTheme.id)"
              >
                {{ isThemePurchased(featuredTheme.id) ? '✓ Comprado' : 'Comprar Theme Completo' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid de Items -->
      <div class="items-section">
        <h3>Todos los Items</h3>
        <div class="items-grid">
          <ShopItemCard 
            v-for="item in allItems" 
            :key="item.id" 
            :item="item"
            :isPurchased="isPurchased(item.id)"
            @purchase="purchaseItem"
          />
        </div>
      </div>
    </div>

    <!-- Modal de Recarga -->
    <RechargeModal 
      :isOpen="showRechargeModal" 
      @close="showRechargeModal = false"
      @recharged="handleRecharge"
    />

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ShopItemCard from '@/components/Shop/ShopItemCard.vue'
import BalanceDisplay from '@/components/Shop/BalanceDisplay.vue'
import RechargeModal from '@/components/Shop/RechargeModal.vue'
import { useBalance } from '@/composables/useBalance'
import { getItems, getFeaturedTheme, getItemsByTheme } from '@/data/shopThemes.js'

// Balance system
const { balance, deductBalance, hasEnoughBalance } = useBalance()
const showRechargeModal = ref(false)

// Purchase system
const purchasedItems = ref([])

// Toast notifications
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Shop data
const featuredTheme = ref(null)
const allItems = ref([])

onMounted(() => {
  loadPurchasedItems()
  featuredTheme.value = getFeaturedTheme()
  allItems.value = getItems()
})

// Balance event handler
function handleRecharge(amount) {
  showNotification(`¡Recargaste ${amount}€!`, 'success')
}

// Purchase functions
function loadPurchasedItems() {
  const saved = localStorage.getItem('purchased_items')
  purchasedItems.value = saved ? JSON.parse(saved) : []
}

function savePurchasedItems() {
  localStorage.setItem('purchased_items', JSON.stringify(purchasedItems.value))
}

function isPurchased(itemId) {
  return purchasedItems.value.includes(itemId)
}

function isThemePurchased(themeId) {
  const themeItems = getItemsByTheme(themeId)
  return themeItems.every(item => isPurchased(item.id))
}

function purchaseItem(item) {
  if (isPurchased(item.id)) {
    showNotification('Ya has comprado este item', 'error')
    return
  }

  if (!hasEnoughBalance(item.price)) {
    showNotification('Saldo insuficiente', 'error')
    return
  }

  deductBalance(item.price)
  purchasedItems.value.push(item.id)
  savePurchasedItems()
  showNotification(`¡Compraste ${item.name}!`, 'success')
}

function purchaseTheme(theme) {
  const themeItems = getItemsByTheme(theme.id)
  const unpurchasedItems = themeItems.filter(item => !isPurchased(item.id))

  if (unpurchasedItems.length === 0) {
    showNotification('Ya tienes este theme completo', 'error')
    return
  }

  // Calcular precio ajustado
  const totalPrice = unpurchasedItems.length === themeItems.length 
    ? theme.price 
    : unpurchasedItems.reduce((sum, item) => sum + item.price, 0)

  if (!hasEnoughBalance(totalPrice)) {
    showNotification('Saldo insuficiente', 'error')
    return
  }

  deductBalance(totalPrice)
  unpurchasedItems.forEach(item => {
    purchasedItems.value.push(item.id)
  })
  savePurchasedItems()
  showNotification(`¡Compraste el theme ${theme.name}!`, 'success')
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

.shop-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
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
.items-section h3 {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
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
  background: #1a1a1a;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 2000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast-notification.success {
  border-left: 4px solid #4ade80;
}

.toast-notification.error {
  border-left: 4px solid #ef4444;
}
</style>
