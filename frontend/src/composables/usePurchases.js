import { ref, computed } from 'vue'
import { useBalance } from './useBalance'
import { DEFAULT_ITEMS } from '@/data/shopThemes'

const STORAGE_KEY = 'purchased_items'
const purchasedItems = ref([])
let initialized = false

function initialize() {
  if (!initialized) {
    loadPurchasedItems()
    initialized = true
  }
}

function loadPurchasedItems() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const defaultItemIds = Object.values(DEFAULT_ITEMS)
  
  if (saved) {
    const existing = JSON.parse(saved)
    // Asegurar que los items por defecto SIEMPRE estén en la lista
    const merged = new Set([...defaultItemIds, ...existing])
    purchasedItems.value = Array.from(merged)
    savePurchasedItems()
  } else {
    // Inicializar con items por defecto ya comprados
    purchasedItems.value = defaultItemIds
    savePurchasedItems()
  }
}

function savePurchasedItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(purchasedItems.value))
}

export function usePurchases() {
  initialize()
  const { hasEnoughBalance, deductBalance } = useBalance()

  function getPurchasedItems() {
    return purchasedItems.value
  }

  function isPurchased(itemId) {
    return purchasedItems.value.includes(itemId)
  }

  function purchaseItem(item) {
    if (isPurchased(item.id)) {
      return {
        success: false,
        message: 'Ya has comprado este item',
        type: 'error'
      }
    }

    if (!hasEnoughBalance(item.price)) {
      return {
        success: false,
        message: 'Saldo insuficiente',
        type: 'error'
      }
    }

    deductBalance(item.price)
    purchasedItems.value.push(item.id)
    savePurchasedItems()

    return {
      success: true,
      message: `Compraste ${item.name}`,
      type: 'success',
      amount: item.price
    }
  }

  function purchaseTheme(theme, themeItems) {
    const unpurchasedItems = themeItems.filter(item => !isPurchased(item.id))

    if (unpurchasedItems.length === 0) {
      return {
        success: false,
        message: 'Ya tienes este theme completo',
        type: 'error'
      }
    }

    const totalPrice = unpurchasedItems.length === themeItems.length
      ? theme.price
      : unpurchasedItems.reduce((sum, item) => sum + item.price, 0)

    if (!hasEnoughBalance(totalPrice)) {
      return {
        success: false,
        message: 'Saldo insuficiente',
        type: 'error'
      }
    }

    deductBalance(totalPrice)
    unpurchasedItems.forEach(item => {
      purchasedItems.value.push(item.id)
    })
    savePurchasedItems()

    return {
      success: true,
      message: `Compraste el theme ${theme.name}`,
      type: 'success',
      amount: totalPrice
    }
  }

  const purchasedCount = computed(() => purchasedItems.value.length)

  return {
    purchasedItems: computed(() => purchasedItems.value),
    purchasedCount,
    getPurchasedItems,
    isPurchased,
    purchaseItem,
    purchaseTheme
  }
}
