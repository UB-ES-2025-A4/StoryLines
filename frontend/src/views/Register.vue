<template>
  <div class="register-container">
    <div class="register">
      <!-- Imagen del logo -->
      <img src="@/assets/LogoBlanco.png" alt="Logo" class="logo" />

      <!-- PASO 1: email / password -->
      <form v-if="!showUsernameStep" @submit.prevent="handleRegister" class="form-content">

        <div class="form-group">
          <label for="email">Correo Electrónico:</label>
          <input type="email" id="email" v-model="email" required placeholder="" autocomplete="off" />
        </div>

        <div class="form-group">
          <label for="confirmEmail">Confirmar Correo Electrónico:</label>
          <input type="email" id="confirmEmail" v-model="confirmEmail" required placeholder="" autocomplete="new-email" />
        </div>
        
        <div class="form-group" style="position: relative;">
          <label for="password">Contraseña:</label>
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" required minlength="8" placeholder=""  autocomplete="new-password"
            style="padding-right: 2.5rem;" />
          <button type="button" @click="showPassword = !showPassword" class="toggle-btn"
            v-html="showPassword ? eyeSlashIcon : eyeIcon">
          </button>
        </div>

        <div class="form-group" style="position: relative;">
          <label for="passwordConfirm">Confirmar contraseña:</label>
          <input :type="showPasswordConfirm ? 'text' : 'password'" id="passwordConfirm" v-model="confirmPassword" required placeholder=" " autocomplete="off"
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
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Validando...' : 'Siguiente' }}
        </button>
      </form>

      <!-- PASO 2: escoger username -->
      <div v-else class="username-step">
        <h3> Elige tu nombre de usuario</h3>

        <div class="form-group" style="position: relative; margin: 2rem 0;">
          <input
            type="text"
            v-model="username"
            @input="checkUsernameAvailability(username)"
            autocomplete="off"
            class="username-input"
            style="text-align: center; font-size: 1.3rem; padding: 1rem;"
            autofocus
          />

          <div style="margin-top: 0.8rem; min-height: 28px; max-width: 300px;">
            <small v-if="checkingUsername" style="color:#888;">Comprobando disponibilidad...</small>
            <small v-else-if="usernameAvailable === true" style="color:#4ade80; font-weight:600;">Disponible</small>
            <small v-else-if="usernameAvailable === false" style="color:#ff5555; font-weight:600;">Ya está en uso</small>
            <small v-else-if="username && !isValidUsername(username)" style="color:#ff5555; font-weight:600;">
              Solo se permiten letras, números, "." y "_". Longitud: 3-20 caracteres.
            </small>
          </div>
        </div>

        <button
          @click="saveUsernameAndFinish"
          :disabled="usernameAvailable !== true || checkingUsername || !username.trim()"
          class="finish-btn"
        >
          Finalizar registro
        </button>
      </div>

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
import { getSupabase } from '@/config/supabase'
import { useBalance } from '@/composables/useBalance'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()

    const username = ref('')
    const email = ref('')
    const confirmEmail = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const error = ref('')
    const success = ref('')
    const loading = ref(false)
    const { loadBalance } = useBalance()

    const showUsernameStep = ref(false)
    const checkingUsername = ref(false)
    const usernameAvailable = ref(null)
    const tempUsername = ref('')
    const rememberMe = ref(false)

    const showPassword = ref(false)
    const showPasswordConfirm = ref(false)
    
    const handleRegister = async () => {

      console.log({
        email: email.value,
        confirmEmail: confirmEmail.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      });
      error.value = ''
      success.value = ''

      if (email.value !== confirmEmail.value) {
        error.value = 'Los correos electrónicos no coinciden'
        return
      }

      if (password.value !== confirmPassword.value) {
        error.value = 'Las contraseñas no coinciden'
        return
      }

      if (password.value.length < 8) {
        error.value = 'La contraseña debe tener al menos 8 caracteres'
        return
      }

      tempUsername.value = generateRandomUsername()
      while(!checkUsernameAvailability(tempUsername.value)) {
        tempUsername.value = generateRandomUsername()
      }
      username.value = tempUsername.value
      showUsernameStep.value = true
      await checkUsernameAvailability(username.value)
    }

    function isValidUsername(name) {
      return /^[a-zA-Z0-9._]{3,20}$/.test(name)
    }

    const checkUsernameAvailability = async (name) => {
      name = username.value.trim()

      if (!isValidUsername(name)) {
        usernameAvailable.value = null
        return
      }

      checkingUsername.value = true
      usernameAvailable.value = null

      try {
        const supabase = await getSupabase()
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('username', name)
          .maybeSingle()

        if (error) {
          console.error('Supabase error:', error)
          usernameAvailable.value = null
          checkingUsername.value = false
          return
        }

        usernameAvailable.value = !data
      } catch (err) {
        console.error('Error checking username availability:', err)
      } finally {
        checkingUsername.value = false
      }
    }

    const saveUsernameAndFinish = async () => {
      if (!usernameAvailable.value) return

      loading.value = true
      error.value = ''
      success.value = ''

      try {
        // Crear usuario en auth
        const supabase = await getSupabase()
        const { data: authUser, error: signUpError } = await supabase.auth.signUp({
          email: email.value,
          password: password.value
        })

        if (signUpError) {
          error.value = signUpError.message || 'Error en el registro'
          loading.value = false
          return
        }

        // Insertar en tabla users
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ id: authUser.user.id, username: username.value.trim() }])

        if (insertError) throw insertError

        success.value = '¡Registro completado con éxito!'

        // sign in automático después del registro
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value
        })
        // ⭐ Añadir ítems gratuitos por defecto al nuevo usuario
        await fetch(`/api/default-items/${authUser.user.id}`)


        if (signInError) throw signInError

        if (rememberMe.value) {
          localStorage.setItem('rememberedEmail', email.value)
          localStorage.setItem('rememberedPassword', password.value)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberedEmail')
          localStorage.removeItem('rememberedPassword')
          localStorage.removeItem('rememberMe')
        }

        await loadBalance()
        setTimeout(() => router.push('/'), 1500)
      } catch (err) {
        error.value = err.message || 'Error al guardar el usuario'
      } finally {
        loading.value = false
      }
    }

    function generateRandomUsername() {
      const adjectives = ['Rapido', 'Feliz', 'Cool', 'Lento', 'Valiente']
      const nouns = ['Tigre', 'Lobo', 'Gato', 'Dragon', 'Zorro']
      const number = Math.floor(Math.random() * 1000)
      return `${nouns[Math.floor(Math.random()*nouns.length)]}${adjectives[Math.floor(Math.random()*adjectives.length)]}${number}`
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
      username,
      email,
      confirmEmail,
      password,
      confirmPassword,
      error,
      success,
      loading,
      handleRegister,
      showUsernameStep,
      checkingUsername,
      usernameAvailable,
      checkUsernameAvailability,
      saveUsernameAndFinish,
      generateRandomUsername,
      tempUsername,
      rememberMe,
      showPassword,
      showPasswordConfirm,
      isValidUsername,
      eyeIcon,
      eyeSlashIcon
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

button.toggle-btn {
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


button.toggle-btn:hover {
    color: #bebdb8 !important;
    background: none !important;
    transform: translateY(-50%) !important;
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

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.6rem 0 1rem;
  color: #fff;
  font-size: 0.95rem;
}

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
