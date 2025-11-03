<template>
  <div class="register-container">
    <div class="register">
      <!-- Imagen del logo -->
      <img src="../LogoBlanco.png" alt="Logo" class="logo" />

      <form @submit.prevent="handleRegister" class="form-content">
        <div class="form-group">
          <label for="username">Nombre de usuario:</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
            placeholder=" "
          />
        </div>

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
            minlength="8"
            placeholder=" "
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña:</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder=""
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Registrarse' }}
        </button>
      </form>

      <p class="login-text">
        ¿Ya tienes cuenta?
        <router-link to="/login">Iniciar Sesión</router-link>
      </p>
    </div>
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
    const username = ref('')
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const error = ref('')
    const success = ref('')
    const loading = ref(false)

    const handleRegister = async () => {
      error.value = ''
      success.value = ''

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

        const { data: existingUser, error: usernameError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username.value)
          .maybeSingle()

        if (usernameError) throw usernameError

        if (existingUser) {
          error.value = 'Este nombre de usuario ya está en uso'
          loading.value = false
          return
        }

        const { data: authUser, error: signUpError } = await supabase.auth.signUp({
          email: email.value,
          password: password.value
        })

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('already') || signUpError.status === 400) {
            error.value = 'Este correo electrónico ya está en uso'
            loading.value = false
            return
          }
          throw signUpError
        }

        const { error: insertError } = await supabase.from('users').insert([
          {
            id: authUser.user.id,
            username: username.value,
          }
        ])

        if (insertError) throw insertError

        success.value = '¡Registro exitoso! Redirigiendo...'
        setTimeout(() => router.push('/'), 1500)
      } catch (err) {
        error.value = err.message || 'Error al registrarse'
      } finally {
        loading.value = false
      }
    }

    return {
      username,
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

* {
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

/* Fondo negro */
.register-container {
  background-color: #000;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 8vh;
}

/* Contenedor del formulario */
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

/* Imagen del logo */
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
input {
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

.success {
  color: #ffffff;
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
