<template>
  <div class="register-container">
    <div class="register">

      <!-- Logo -->
      <img src="@/assets/LogoBlanco.png" alt="Logo" class="logo" />

      <form @submit.prevent="updatePassword" class="form-content">

        <div class="form-group" style="position: relative;">
          <label for="password">Nueva contraseña:</label>
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" required placeholder=" "
            style="padding-right: 2.5rem;" />
          <button type="button" @click="showPassword = !showPassword" class="toggle-btn"
            v-html="showPassword ? eyeSlashIcon : eyeIcon">
          </button>
        </div>

        <div class="form-group" style="position: relative;">
          <label for="passwordConfirm">Repetir contraseña:</label>
          <input :type="showPasswordConfirm ? 'text' : 'password'" id="passwordConfirm" v-model="passwordConfirm" required placeholder=" "
            style="padding-right: 2.5rem;" />
          <button type="button" @click="showPasswordConfirm = !showPasswordConfirm" class="toggle-btn"
            v-html="showPasswordConfirm ? eyeSlashIcon : eyeIcon">
          </button>
        </div>

        <div class="checkbox-group">
            <input type="checkbox" id="rememberMe" v-model="rememberMe" />
            <label for="rememberMe">Recordarme</label>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success-msg">{{ success }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </form>

      <p class="login-text" @click="goToLogin">
        Volver al inicio de sesión
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/config/supabase'

export default {
  name: 'ResetPassword',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const token = route.query.access_token || ''
    const password = ref('')
    const passwordConfirm = ref('')
    const loading = ref(false)
    const error = ref('')
    const success = ref('')

    const showPassword = ref(false)
    const showPasswordConfirm = ref(false)

    const rememberMe = ref(false)

    

    const updatePassword = async () => {
      error.value = ''
      success.value = ''

      if (password.value !== passwordConfirm.value) {
        error.value = 'Las contraseñas no coinciden'
        return
      }

      loading.value = true

      
      if (password.value !== passwordConfirm.value) {
        error.value = 'Las contraseñas no coinciden'
        return
      }

      if (password.value.length < 8) {
        error.value = 'La contraseña debe tener al menos 8 caracteres'
        return
      }

        const { error: updateError } = await supabase.auth.updateUser(
        { password: password.value },
        { accessToken: token }
      )

      loading.value = false

      if (updateError) {
        error.value = 'Error al actualizar la contraseña'
        return
      }

      // Si hay credenciales guardadas, actualizarlas
      if (rememberMe.value) {
        localStorage.setItem('rememberedPassword', password.value)
        localStorage.setItem('rememberMe', 'true')
    } else {
        localStorage.removeItem('rememberedPassword')
        localStorage.removeItem('rememberMe')
    }

      success.value = 'Contraseña actualizada correctamente'

      // Esperar un segundo para que el usuario lo vea
      setTimeout(() => {
        router.push('/')
      }, 900)
    }

      onMounted(() => {
          supabase.auth.onAuthStateChange((event, session) => {
              if (event === 'PASSWORD_RECOVERY') {
                  console.log("Modo recuperación activado, puedes cambiar la contraseña.")
              }
          })
      })

      const goToLogin = async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }


    const eyeIcon = `
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
</svg>
`

    const eyeSlashIcon = `
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">     
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>     
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>     
    <line x1="3" y1="3" x2="21" y2="21"/> </svg>
`

    return {
      password,
      passwordConfirm,
      loading,
      error,
      success,
      updatePassword,
      goToLogin,
      showPassword,
      showPasswordConfirm,
      eyeIcon,
      eyeSlashIcon,
      rememberMe
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

/* Igual que Login.vue */
.register-container {
  background-color: #000;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 8vh;
}

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

.logo {
  width: 180px;
  margin-bottom: 1.8rem;
  opacity: 0.9;
}

.form-content {
  width: 100%;
  padding: 0 0.5rem;
}

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

input[type="password"],
input[type="text"] {
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

input:focus,
input:not(:placeholder-shown) {
  border-color: #fff;
}

/* Botón igual que en Login.vue */
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

/* Missatges */
.error {
  color: #ff4d4d;
  margin: 1rem 0;
}

.success-msg {
  color: #4ade80;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.login-text {
  margin-top: 1.5rem;
  text-align: center;
  color: #fff;
}

.login-text:hover {
  cursor: pointer;
  text-decoration: underline;
}

a {
  color: #fff;
  font-weight: 600;
  text-decoration: underline;
}

a:hover {
  color: #ccc;
}

.toggle-btn {
    position: absolute;
    right: 1rem;
    top: 1.9rem;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #777b7e;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}


.toggle-btn:hover {
    color: #bebdb8 !important;
    background: none !important;
    transform: translateY(-50%) !important;
}

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

</style>
