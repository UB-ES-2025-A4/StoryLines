<template>
  <div class="register-container">
    <div class="register">
      <!-- Imagen del logo -->
      <img src="@/assets/LogoBlanco.png" alt="Logo" class="logo" />

      <form @submit.prevent="handleLogin" class="form-content">
        <div class="form-group">
          <label for="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder=" "
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder=" "
          />
        </div>

        <!-- Checkbox Recordarme -->
        <div class="checkbox-group">
          <input
            type="checkbox"
            id="rememberMe"
            v-model="rememberMe"
          />
          <label for="rememberMe">Recordarme</label>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <p class="login-text">
        ¿No tienes cuenta?
        <router-link to="/register">Registrarse</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const email = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const error = ref('')
    const loading = ref(false)

    const handleLogin = async () => {
      error.value = ''
      loading.value = true

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value
        })

        if (signInError) throw signInError

        // Guardar credenciales si se marca "Recordarme"
        if (rememberMe.value) {
          localStorage.setItem('rememberedEmail', email.value)
          localStorage.setItem('rememberedPassword', password.value)
        } else {
          localStorage.removeItem('rememberedEmail')
          localStorage.removeItem('rememberedPassword')
        }

        router.push('/')
      } catch (err) {
        error.value = 'Credenciales incorrectas'
      } finally {
        loading.value = false
      }
    }

    // Al montar, recuperar datos guardados
    onMounted(() => {
      const savedEmail = localStorage.getItem('rememberedEmail')
      const savedPassword = localStorage.getItem('rememberedPassword')

      if (savedEmail && savedPassword) {
        email.value = savedEmail
        password.value = savedPassword
        rememberMe.value = true
      }
    })

    return {
      email,
      password,
      rememberMe,
      error,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

* {
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

/* Fondo negro y centrado */
.register-container {
  background-color: #000;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 8vh;
}

/* Caja principal */
.register {
  background-color: #1a1a1a;
  border-radius: 15px;
  padding: 2rem 1rem;
  width: 100%;
  max-width: 460px;
  color: #fff;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo */
.logo {
  width: 180px;
  margin-bottom: 1.8rem;
  opacity: 0.9;
}

/* Formulario */
.form-content {
  width: 100%;
  padding: 0 0.5rem;
}

/* Campos */
.form-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  width: 100%;
}

label {
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #fff;
  text-align: left;
  padding-left: 0.3rem;
}

/* Inputs */
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid transparent;
  border-radius: 10px;
  background-color: #000;
  color: #fff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

input::placeholder {
  color: #888;
}

/* Borde blanco en foco o con texto */
input:focus,
input:not(:placeholder-shown) {
  border-color: #fff;
}

/* Checkbox */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.6rem 0 1rem;
  color: #fff;
  font-size: 0.95rem;
}

/* Ajuste visual del texto */
.checkbox-group label {
  position: relative;
  top: 2.5px; /* baja ligeramente el texto para centrarlo visualmente */
}

.checkbox-group input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #fff; /* color del check */
  cursor: pointer;
}

/* Botón */
button {
  width: 100%;
  padding: 1rem;
  background-color: #fff;
  color: #000;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.2rem;
}

button:hover:not(:disabled) {
  background-color: #e0e0e0;
  border-color: #000;
  transform: scale(1.02);
}

button:disabled {
  background-color: #888;
  cursor: not-allowed;
}

/* Mensajes */
.error {
  color: #ff4d4d;
  margin: 1rem 0;
}

/* Enlace */
.login-text {
  margin-top: 1.5rem;
  text-align: center;
  color: #fff;
}

a {
  color: #fff;
  font-weight: 600;
  text-decoration: underline;
}

a:hover {
  color: #ccc;
}
</style>
