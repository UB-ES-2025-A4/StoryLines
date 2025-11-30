import { ref, computed } from 'vue'
import { DEFAULT_ITEMS } from '@/data/shopThemes'

const STORAGE_KEY = 'equipped_items'
const equippedItems = ref({
  globe: null,
  homeBg: null,
  profileBg: null
})

let initialized = false

function initialize() {
  if (!initialized) {
    loadEquippedItems()
    initialized = true
  }
}

function loadEquippedItems() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const existing = JSON.parse(saved)
    // Asegurar que siempre haya items equipados (usar defaults si están vacíos)
    equippedItems.value = {
      globe: existing.globe || DEFAULT_ITEMS.globe,
      homeBg: existing.homeBg || DEFAULT_ITEMS.homeBg,
      profileBg: existing.profileBg || DEFAULT_ITEMS.profileBg
    }
    saveEquippedItems()
  } else {
    // Inicializar con items por defecto
    equippedItems.value = { ...DEFAULT_ITEMS }
    saveEquippedItems()
  }
}

function saveEquippedItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equippedItems.value))
}

export function useCustomization() {
  initialize()

  function getEquippedItem(slot) {
    return equippedItems.value[slot]
  }

  function getAllEquippedItems() {
    return { ...equippedItems.value }
  }

  function equipItem(itemId, itemType) {
    equippedItems.value[itemType] = itemId
    saveEquippedItems()
    return true
  }

  function unequipItem(itemType) {
    equippedItems.value[itemType] = null
    saveEquippedItems()
    return true
  }

  function isEquipped(itemId) {
    return Object.values(equippedItems.value).includes(itemId)
  }

  function getEquippedSlot(itemId) {
    for (const [slot, id] of Object.entries(equippedItems.value)) {
      if (id === itemId) return slot
    }
    return null
  }

  function isCompleteTheme(themeId, themeItems) {
    if (!themeItems || themeItems.length === 0) return false
    
    return themeItems.every(item => {
      return equippedItems.value[item.type] === item.id
    })
  }

  const hasGlobe = computed(() => equippedItems.value.globe !== null)
  const hasHomeBg = computed(() => equippedItems.value.homeBg !== null)
  const hasProfileBg = computed(() => equippedItems.value.profileBg !== null)
  const hasCompleteSet = computed(() => hasGlobe.value && hasHomeBg.value && hasProfileBg.value)

  // Alias para compatibilidad
  const getEquippedItemByType = getEquippedItem

  return {
    equippedItems: computed(() => equippedItems.value),
    hasGlobe,
    hasHomeBg,
    hasProfileBg,
    hasCompleteSet,
    getEquippedItem,
    getEquippedItemByType, // Alias
    getAllEquippedItems,
    equipItem,
    unequipItem,
    isEquipped,
    getEquippedSlot,
    isCompleteTheme
  }
}
