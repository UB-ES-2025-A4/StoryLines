<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>Recargar Saldo</h3>
        <p class="current-balance">
          Saldo actual: <strong>{{ formattedBalance }}</strong>
        </p>
        
        <div class="recharge-options">
          <button @click="recharge(500)" class="btn-recharge">
            <span class="amount">+500€</span>
          </button>
          <button @click="recharge(1000)" class="btn-recharge">
            <span class="amount">+1.000€</span>
          </button>
          <button @click="recharge(5000)" class="btn-recharge">
            <span class="amount">+5.000€</span>
          </button>
        </div>

        <div class="custom-recharge">
          <label>Cantidad personalizada:</label>
          <div class="input-group">
            <input 
              v-model.number="customAmount" 
              type="number" 
              placeholder="Introduce cantidad"
              min="1"
              class="input-amount"
              @keyup.enter="rechargeCustom"
            />
            <button @click="rechargeCustom" class="btn-add" :disabled="!isValidAmount">
              Añadir
            </button>
          </div>
        </div>

        <button @click="closeModal" class="btn-close">Cerrar</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBalance } from '@/composables/useBalance'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'recharged'])

const { addBalance, formattedBalance } = useBalance()
const customAmount = ref(null)

const isValidAmount = computed(() => {
  return customAmount.value && customAmount.value > 0
})

function recharge(amount) {
  const success = addBalance(amount)
  if (success) {
    emit('recharged', amount)
    customAmount.value = null
  }
}

function rechargeCustom() {
  if (isValidAmount.value) {
    recharge(customAmount.value)
  }
}

function closeModal() {
  customAmount.value = null
  emit('close')
}
</script>

<style scoped>
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
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #1a1a1a;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(50px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  color: white;
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.current-balance {
  color: #aaa;
  margin-bottom: 1.5rem;
}

.current-balance strong {
  color: #4ade80;
  font-size: 1.25rem;
}

.recharge-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-recharge {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.btn-recharge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-recharge:hover::before {
  opacity: 1;
}

.btn-recharge:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

.btn-recharge .amount {
  display: block;
  font-size: 1.1rem;
}

.custom-recharge {
  margin-bottom: 1.5rem;
}

.custom-recharge label {
  display: block;
  color: #ccc;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.input-group {
  display: flex;
  gap: 1rem;
}

.input-amount {
  flex: 1;
  background: #0a0a0a;
  border: 2px solid #333;
  color: white;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.input-amount:focus {
  outline: none;
  border-color: #667eea;
}

.input-amount::placeholder {
  color: #666;
}

.btn-add {
  background: #4ade80;
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-add:hover:not(:disabled) {
  background: #22c55e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-close {
  width: 100%;
  background: #333;
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #444;
  transform: translateY(-2px);
}
</style>
