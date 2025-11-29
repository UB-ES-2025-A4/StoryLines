import { ref, computed } from 'vue'

const STORAGE_KEY = 'user_balance'
const INITIAL_BALANCE = 5000

// Estado reactivo compartido
const balance = ref(0)

/**
 * Composable para manejar el balance del usuario
 */
export function useBalance() {
  // Cargar balance desde localStorage
  function loadBalance() {
    const saved = localStorage.getItem(STORAGE_KEY)
    balance.value = saved ? parseInt(saved) : INITIAL_BALANCE
    return balance.value
  }

  // Guardar balance en localStorage
  function saveBalance() {
    localStorage.setItem(STORAGE_KEY, balance.value.toString())
  }

  // Obtener balance actual
  function getBalance() {
    if (balance.value === 0) {
      loadBalance()
    }
    return balance.value
  }

  // Añadir fondos al balance
  function addBalance(amount) {
    if (amount <= 0) {
      console.warn('La cantidad debe ser positiva')
      return false
    }
    balance.value += amount
    saveBalance()
    return true
  }

  // Deducir fondos del balance
  function deductBalance(amount) {
    if (amount <= 0) {
      console.warn('La cantidad debe ser positiva')
      return false
    }
    if (balance.value < amount) {
      console.warn('Balance insuficiente')
      return false
    }
    balance.value -= amount
    saveBalance()
    return true
  }

  // Verificar si hay suficiente balance
  function hasEnoughBalance(amount) {
    return balance.value >= amount
  }

  // Balance formateado con separador de miles (sin símbolo, se usa imagen)
  const formattedBalance = computed(() => {
    return balance.value.toLocaleString('es-ES')
  })

  // Inicializar al usar el composable
  if (balance.value === 0) {
    loadBalance()
  }

  return {
    balance: computed(() => balance.value),
    formattedBalance,
    getBalance,
    addBalance,
    deductBalance,
    hasEnoughBalance,
    loadBalance,
    saveBalance
  }
}
