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

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id
}

async function initialize() {
  if (initialized) return
  initialized = true

  const userId = await getCurrentUserId()
  if (!userId) return

  try {
    // ⭐ 1. Intentamos cargar de backend
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
    console.error("Error cargando desde backend, usando localStorage fallback", err)
  }

  // ⭐ 2. Fallback: si backend falla → usar localStorage
  loadEquippedItems()
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

  // ⭐ NUEVO → equipar llamando al backend
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

  // ⭐ NUEVO → des-equipar en backend
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

  const hasGlobe = computed(() => equippedItems.value.globe !== null)
  const hasHomeBg = computed(() => equippedItems.value.homeBg !== null)
  const hasProfileBg = computed(() => equippedItems.value.profileBg !== null)
  const hasCompleteSet = computed(() =>
    hasGlobe.value && hasHomeBg.value && hasProfileBg.value
  )

  return {
    equippedItems: computed(() => equippedItems.value),
    getEquippedItem,
    getAllEquippedItems,
    equipItem,
    unequipItem,
    isEquipped,
    getEquippedSlot,
    hasGlobe,
    hasHomeBg,
    hasProfileBg,
    hasCompleteSet
  }
}
