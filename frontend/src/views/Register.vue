<template>
  <div class="register">
    <h1>Crear Cuenta</h1>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="email">Correo Electrónico:</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="tu@email.com"
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña:</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          minlength="8"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirmar Contraseña:</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          required
          placeholder="Confirma tu contraseña"
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Registrando...' : 'Registrarse' }}
      </button>
    </form>

    <p>
      ¿Ya tienes cuenta?
      <router-link to="/login">Iniciar Sesión</router-link>
    </p>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const error = ref('')
    const success = ref('')
    const loading = ref(false)

    const handleRegister = async () => {
      error.value = ''
      success.value = ''

      // Validación de contraseñas
      if (password.value !== confirmPassword.value) {
        error.value = 'Las contraseñas no coinciden'
        return
      }

      if (password.value.length < 8) {
        error.value = 'La contraseña debe tener al menos 8 caracteres'
        return
      }

      loading.value = true

      try {
        // Registrar usuario con Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.value,
          password: password.value
        })

        if (signUpError) throw signUpError

        success.value = '¡Registro exitoso! Redirigiendo...'
        
        // Redirigir al home o perfil
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } catch (err) {
        error.value = err.message || 'Error al registrarse'
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      confirmPassword,
      error,
      success,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #359268;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin: 1rem 0;
}

.success {
  color: green;
  margin: 1rem 0;
}

p {
  margin-top: 1rem;
  text-align: center;
}
</style>
