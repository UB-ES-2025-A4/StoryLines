import { ref, computed } from "vue"
import { supabase } from "@/config/supabase"
import { DEFAULT_ITEMS } from "@/data/shopThemes"

const STORAGE_KEY = "equipped_items"

/* ======================
   STATE GLOBAL
====================== */
const equippedItems = ref({
  globe: null,
  homeBg: null,
  profileBg: null
})

const userColor = ref('rgba(0, 123, 255, 1)')

let initialized = false

/* ======================
   RESET (SOLO MEMORIA)
====================== */
export function resetCustomization() {
  equippedItems.value = {
    globe: null,
    homeBg: null,
    profileBg: null
  }
  userColor.value = 'rgba(0, 123, 255, 1)'
  initialized = false
}

/* ======================
   HELPERS
====================== */
async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id
}

function saveEquippedItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equippedItems.value))
}

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
    equippedItems.value = { ...DEFAULT_ITEMS }
  }

  saveEquippedItems()
}

/* ======================
   INITIALIZE CON MODO
====================== */
export async function initialize(
  userId,
  options = { mode: "self" } // self | visitor
) {
  if (!userId) return

  const isVisitor = options.mode === "visitor"

  // 🔒 Solo bloquear en modo self
  if (!isVisitor && initialized) return
  if (!isVisitor) initialized = true

  try {
    const res = await fetch(`/api/customization/${userId}`)
    const data = await res.json()

    if (data.ok) {
      equippedItems.value = {
        globe: data.equipped.globe || DEFAULT_ITEMS.globe,
        homeBg: data.equipped.homeBg || DEFAULT_ITEMS.homeBg,
        profileBg: data.equipped.profileBg || DEFAULT_ITEMS.profileBg
      }

      userColor.value =
        data.equipped.userColor || 'rgba(0, 123, 255, 1)'

      // 🔥 SOLO guardar si es el usuario propio
      if (!isVisitor) {
        saveEquippedItems()
      }

      return
    }
  } catch (err) {
    console.error("Error cargando BD:", err)
  }

  /* ======================
     FALLBACK
  ====================== */
  if (isVisitor) {
    // ❌ visitor NO usa localStorage
    equippedItems.value = { ...DEFAULT_ITEMS }
    userColor.value = 'rgba(0, 123, 255, 1)'
    return
  }

  // ✅ self usa localStorage
  loadEquippedItems()
}

/* ======================
   COMPOSABLE
====================== */
export function useCustomization() {
  function getEquippedItem(slot) {
    return equippedItems.value[slot]
  }

  function getAllEquippedItems() {
    return { ...equippedItems.value }
  }

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

  async function updateUserColor(color) {
    const userId = await getCurrentUserId()

    const res = await fetch("/api/customization/color", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, color })
    })

    const data = await res.json()
    if (!data.ok) return false

    userColor.value = color
    return true
  }

  function getUserColor() {
    return userColor.value
  }

  return {
    initialize,
    resetCustomization,

    equippedItems: computed(() => equippedItems.value),
    userColor: computed(() => userColor.value),

    getEquippedItem,
    getAllEquippedItems,

    equipItem,
    unequipItem,

    isEquipped,
    getEquippedSlot,

    updateUserColor,
    getUserColor,

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
