import { ref, computed } from "vue"
import { supabase } from "@/config/supabase"
import { DEFAULT_ITEMS } from "@/data/shopThemes"

const STORAGE_KEY = "equipped_items"

const equippedItems = ref({
  globe: null,
  homeBg: null,
  profileBg: null
})

let initialized = false

// 🔥 RESET al cambiar de usuario
export function resetCustomization() {
  equippedItems.value = {
    globe: null,
    homeBg: null,
    profileBg: null
  }
  initialized = false
  // 🔥 limpia también el localStorage para no arrastrar datos de otro user
  localStorage.removeItem(STORAGE_KEY)
}

// Obtener ID usuario actual
async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id
}

// 🔥 LOAD DESDE LOCALSTORAGE SI NO HAY BD
function loadEquippedItems() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (saved) {
    const existing = JSON.parse(saved)
    equippedItems.value = {
      globe: existing.globe || DEFAULT_ITEMS.globe,
      homeBg: existing.homeBg || DEFAULT_ITEMS.homeBg,
      profileBg: existing.profileBg || DEFAULT_ITEMS.profileBg
    }
  } else {
    // Si no hay nada guardado, usar defaults
    equippedItems.value = { ...DEFAULT_ITEMS }
  }

  saveEquippedItems()
}

// Guardar local
function saveEquippedItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equippedItems.value))
}

// 🔥 INITIALIZE — SOLO SE LLAMA TRAS LOGIN
export async function initialize(userId) {
  if (!userId) return
  if (initialized) return
  initialized = true

  try {
    const res = await fetch(`/api/customization/${userId}`)
    const data = await res.json()

    if (data.ok) {
      equippedItems.value = {
        globe: data.equipped.globe || DEFAULT_ITEMS.globe,
        homeBg: data.equipped.homeBg || DEFAULT_ITEMS.homeBg,
        profileBg: data.equipped.profileBg || DEFAULT_ITEMS.profileBg
      }

      saveEquippedItems()
      return
    }
  } catch (err) {
    console.error("Error cargando BD:", err)
  }

  // Si BD falla → usar localStorage
  loadEquippedItems()
}

// =============================
//      COMPOSABLE PRINCIPAL
// =============================
export function useCustomization() {
  function getEquippedItem(slot) {
    return equippedItems.value[slot]
  }

  function getAllEquippedItems() {
    return { ...equippedItems.value }
  }

  // EQUIPAR ITEM
  async function equipItem(itemId, slot) {
    const userId = await getCurrentUserId()

    const res = await fetch("/api/customization/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, itemId, slot })
    })

    const data = await res.json()
    if (!data.ok) return false

    equippedItems.value[slot] = itemId
    saveEquippedItems()
    return true
  }

  // DESEQUIPAR
  async function unequipItem(slot) {
    const userId = await getCurrentUserId()

    const res = await fetch("/api/customization/unequip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, slot })
    })

    const data = await res.json()
    if (!data.ok) return false

    equippedItems.value[slot] = null
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

  return {
    initialize,
    equippedItems: computed(() => equippedItems.value),
    getEquippedItem,
    getAllEquippedItems,
    equipItem,
    unequipItem,
    isEquipped,
    getEquippedSlot,
    hasGlobe: computed(() => equippedItems.value.globe !== null),
    hasHomeBg: computed(() => equippedItems.value.homeBg !== null),
    hasProfileBg: computed(() => equippedItems.value.profileBg !== null),
    hasCompleteSet: computed(() =>
      equippedItems.value.globe &&
      equippedItems.value.homeBg &&
      equippedItems.value.profileBg
    )
  }
}
