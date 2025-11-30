// frontend/src/composables/useBalance.js
import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'

// Estado compartido
const balance = ref(0)
const loading = ref(false)
const lastError = ref(null)

// helper para saber quién es el usuario actual
async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data?.user) throw new Error('Usuario no autenticado')
  return data.user.id
}

// Cargar balance desde backend (crea fila si no existe)
async function loadBalance() {
  try {
    loading.value = true
    lastError.value = null

    const userId = await getCurrentUserId()

    const res = await fetch(`/api/balance/${userId}`)
    const data = await res.json()

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error al cargar balance')
    }

    balance.value = data.balance ?? 0
    return balance.value
  } catch (err) {
    console.error('loadBalance error', err)
    lastError.value = err
    // si hay error dejamos el balance como está (por defecto 0)
    return balance.value
  } finally {
    loading.value = false
  }
}

// Añadir fondos
async function addBalance(amount) {
  amount = Number(amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn('La cantidad debe ser positiva')
    return false
  }

  try {
    const userId = await getCurrentUserId()

    const res = await fetch('/api/balance/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error al recargar balance')
    }

    balance.value = data.balance
    return true
  } catch (err) {
    console.error('addBalance error', err)
    lastError.value = err
    return false
  }
}

// Restar fondos (compras)
async function deductBalance(amount) {
  amount = Number(amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn('La cantidad debe ser positiva')
    return { success: false, error: 'Cantidad inválida' }
  }

  try {
    const userId = await getCurrentUserId()

    const res = await fetch('/api/balance/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      const msg = data.error || 'Error al descontar balance'
      return { success: false, error: msg, balance: balance.value }
    }

    balance.value = data.balance
    return { success: true, balance: balance.value }
  } catch (err) {
    console.error('deductBalance error', err)
    lastError.value = err
    return { success: false, error: err.message, balance: balance.value }
  }
}

// API pública del composable
export function useBalance() {
  // Si nadie ha cargado aún el balance, lo disparamos en segundo plano.
  if (balance.value === 0 && !loading.value) {
    // fire-and-forget
    loadBalance().catch(() => {})
  }

  function getBalance() {
    return balance.value
  }

  function hasEnoughBalance(amount) {
    amount = Number(amount)
    if (!Number.isFinite(amount) || amount <= 0) return false
    return balance.value >= amount
  }

  const formattedBalance = computed(() =>
    balance.value.toLocaleString('es-ES')
  )

  return {
    // estado
    balance: computed(() => balance.value),
    formattedBalance,
    loading: computed(() => loading.value),
    lastError: computed(() => lastError.value),

    // métodos
    loadBalance,
    getBalance,
    addBalance,
    deductBalance,
    hasEnoughBalance
  }
}
