<template>
  <div class="register-container">
    <div class="register">
      <!-- Imagen del logo -->
      <img src="@/assets/LogoBlanco.png" alt="Logo" class="logo" />

      <form @submit.prevent="handleLogin" class="form-content">
        <div class="form-group">
          <label for="email">Correo Electrónico:</label>
          <input type="email" id="email" v-model="email" required placeholder=" " />
        </div>

        <div class="form-group" style="position: relative;">
          <label for="password">Contraseña:</label>
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" required placeholder=" "
            style="padding-right: 2.5rem;" />
          <button type="button" @click="showPassword = !showPassword" class="toggle-btn"
            v-html="showPassword ? eyeSlashIcon : eyeIcon">
          </button>
        </div>

        <div class="checkbox-row">
          <!-- Checkbox Recordarme -->
          <div class="checkbox-group">
            <input type="checkbox" id="rememberMe" v-model="rememberMe" />
            <label for="rememberMe">Recordarme</label>
          </div>

          <p class="forgot-password" @click="openResetModal">
            ¿Has olvidado tu contraseña?
          </p>

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

    <!-- Modal para restablecer contraseña-->
    <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
      <div class="modal">

        <h3>Restablecer contraseña</h3>

        <div class="form-group">
          <label for="resetEmail">Introduce tu correo electrónico</label>
          <input type="email" id="resetEmail" v-model="resetEmail" required placeholder=" " class="login-input" />
        </div>

        <p v-if="resetMessage" class="success-msg">{{ resetMessage }}</p>
        <p v-if="resetError" class="error-msg">{{ resetError }}</p>

        <button class="login-btn" @click="sendResetEmail" :disabled="resetLoading">
          {{ resetLoading ? 'Enviando...' : 'Enviar enlace' }}
        </button>

        <button class="cancel-btn" @click="closeResetModal">
          Cancelar
        </button>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSupabase } from '@/config/supabase'
import { useBalance } from '@/composables/useBalance'
import { resetPurchases } from "@/composables/usePurchases"
import { resetCustomization } from "@/composables/useCustomization"
import { usePurchases } from "@/composables/usePurchases"
import { useCustomization } from "@/composables/useCustomization"



export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const email = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const error = ref('')
    const loading = ref(false)
    const { loadBalance } = useBalance()
    const { initialize: initializePurchases } = usePurchases()
    const { initialize: initializeCustomization } = useCustomization()



    const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    // 1️⃣ LOGIN
    const supabase = await getSupabase()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })

    // Si Supabase devuelve error → credenciales malas
    if (signInError || !data?.user) {
      console.error('Error de login:', signInError)
      error.value = 'Credenciales incorrectas'
      return
    }

    const userId = data.user.id

    // 2️⃣ LIMPIAR ESTADO DEL USUARIO ANTERIOR
    try {
      resetPurchases()
    } catch (e) {
      console.warn('resetPurchases falló:', e)
    }

    try {
      resetCustomization()
    } catch (e) {
      console.warn('resetCustomization falló:', e)
    }

    // 3️⃣ ASEGURAR ITEMS POR DEFECTO (NO ROMPER LOGIN SI FALLA)
    try {
      await fetch(`/api/default-items/${userId}`)
    } catch (e) {
      console.error('Error llamando a /api/default-items:', e)
      // NO lanzamos error, solo log
    }

    // 4️⃣ CARGAR ESTADO DEL NUEVO USUARIO (COMPRAS + CUSTOM + SALDO)
    try {
      await initializePurchases(userId)
    } catch (e) {
      console.error('Error inicializando compras:', e)
    }

    try {
      await initializeCustomization(userId)
    } catch (e) {
      console.error('Error inicializando customización:', e)
    }

    try {
      await loadBalance()
    } catch (e) {
      console.error('Error cargando balance:', e)
    }

    // 5️⃣ RECORDAR CREDENCIALES (OPCIONAL)
    if (rememberMe.value) {
      localStorage.setItem('rememberedEmail', email.value)
      localStorage.setItem('rememberedPassword', password.value)
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberedEmail')
      localStorage.removeItem('rememberedPassword')
      localStorage.removeItem('rememberMe')
    }

    // 6️⃣ TODO OK → HOME
    router.push('/')
  } catch (e) {
    console.error('Error inesperado en handleLogin:', e)
    // Solo aquí ponemos un mensaje genérico
    error.value = 'Ha ocurrido un error al iniciar sesión'
  } finally {
    loading.value = false
  }
}


    const showResetModal = ref(false)
    const resetEmail = ref('')
    const resetLoading = ref(false)
    const resetError = ref('')
    const resetMessage = ref('')

    const openResetModal = () => {
      resetEmail.value = email.value
      resetMessage.value = ''
      resetError.value = ''
      showResetModal.value = true
    }

    const closeResetModal = () => {
      showResetModal.value = false
    }

    const sendResetEmail = async () => {
      resetError.value = ''
      resetMessage.value = ''
      resetLoading.value = true

      try {
        const supabase = await getSupabase()
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.value, {
          redirectTo: window.location.origin + '/reset-password'
        })

        if (resetErr) throw resetErr

        resetMessage.value = 'Te hemos enviado un correo de restablecimiento.'
      } catch (err) {
        resetError.value = 'Error al enviar el correo de restablecimiento.'
      } finally {
        resetLoading.value = false
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

    const showPassword = ref(false)

    return {
      email,
      password,
      rememberMe,
      error,
      loading,
      handleLogin,
      showResetModal,
      openResetModal,
      closeResetModal,
      resetEmail,
      resetLoading,
      resetError,
      resetMessage,
      sendResetEmail,
      eyeIcon,
      eyeSlashIcon,
      showPassword
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
    border-color: transparent !important;
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

/* Row del checkbox + link */
.checkbox-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.6rem 0 1rem;
}

.forgot-password {
  color: #fff;
  opacity: 0.85;
  font-size: 0.9rem;
  cursor: pointer;
}

.forgot-password:hover {
  cursor: pointer;
  text-decoration: underline;
}

/* MODAL RESTABLECER – ESTILO EXACTAMENTE IGUAL QUE EL LOGIN */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal {
  background: #1a1a1a;
  padding: 2.5rem 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 420px;
  color: #fff;
  position: relative;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
  text-align: center;
}

.modal h3 {
  margin: 0 0 1.8rem 0;
  font-size: 1.4rem;
  font-weight: 600;
}


.modal .form-group {
  margin-bottom: 1.5rem;
}

.modal label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-align: left;
  padding-left: 0.3rem;
}

.modal input {
  width: 100%;
  padding: 0.75rem;
  background: #000;
  border: 1px solid transparent;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  transition: border 0.3s ease;
}

.modal input:focus,
.modal input:not(:placeholder-shown) {
  border-color: #fff;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.8rem;
}

.login-btn:hover:not(:disabled) {
  background: #e0e0e0;
  transform: scale(1.02);
}

.login-btn:disabled {
  background: #888;
  cursor: not-allowed;
}

.cancel-btn {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.9rem;
  background: transparent;
  color: #aaa;
  border: 1px solid #444;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.05);
  border-color: #666;
}

/* Mensajes */
.success-msg {
  color: #4ade80;
  margin: 1rem 0 0;
  font-size: 0.95rem;
}

.error-msg {
  color: #ff6b6b;
  margin: 1rem 0 0;
  font-size: 0.95rem;
}

</style>
