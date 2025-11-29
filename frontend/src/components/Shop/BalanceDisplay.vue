<template>
  <div class="balance-display" @click="$emit('click')">
    <span class="balance-icon">💰</span>
    <span class="balance-amount">{{ formattedBalance }}</span>
  </div>
</template>

<script setup>
import { useBalance } from '@/composables/useBalance'

defineEmits(['click'])

const { formattedBalance } = useBalance()
</script>

<style scoped>
.balance-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.balance-display:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.balance-icon {
  font-size: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.balance-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}
</style>
