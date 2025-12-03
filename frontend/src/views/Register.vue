<template>
  <div class="register-container">
    <div class="register">
      <!-- Imagen del logo -->
      <img src="@/assets/LogoBlanco.png" alt="Logo" class="logo" />

      <form v-if="!showUsernameStep" @submit.prevent="handleRegister" class="form-content">
        <div class="form-group">
          <label for="username">Nombre de usuario:</label>
          <input type="text" id="username" v-model="username" required placeholder=" " :disabled="showUsernameStep" />
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico:</label>
          <input type="email" id="email" v-model="email" required placeholder=" " />
        </div>

        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input type="password" id="password" v-model="password" required minlength="8" placeholder=" " />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña:</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required placeholder="" />
        </div>

        <div class="checkbox-group">
          <input
            type="checkbox"
            id="rememberMe"
            v-model="rememberMe"
          />
          <label for="rememberMe">Recordarme</label>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Registrarse' }}
        </button>
      </form>

      <div v-else class="username-step">
        <h3> Elige tu nombre de usuario</h3>
        <div class="form-group" style="position: relative; margin: 2rem 0;">
          <input type="text" v-model="username" @input="checkUsernameAvailability" :placeholder="tempUsername"
            autocomplete="off" class="username-input" style="text-align: center; font-size: 1.3rem; padding: 1rem;"
            autofocus />

          <div style="margin-top: 0.8rem; min-height: 28px;">
            <small v-if="checkingUsername" style="color:#888;">Comprobando disponibilidad...</small>
            <small v-else-if="usernameAvailable === true" style="color:#4ade80; font-weight:600;">Disponible</small>
            <small v-else-if="usernameAvailable === false" style="color:#ff5555; font-weight:600;">Ya está en
              uso</small>
            <small v-else-if="username && !isValidUsername(username)" style="color:#ff5555; font-weight:600;">Solo se permiten letras, números, "." y "_". Longitud: 3-20 caracteres.</small>
          </div>
        </div>

        <button @click="saveUsernameAndFinish" :disabled="usernameAvailable !== true || checkingUsername || !username.trim()"
          class="finish-btn">
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
import { supabase } from '@/config/supabase'
import { useBalance } from '@/composables/useBalance'


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
    const { loadBalance } = useBalance()

    const showUsernameStep = ref(false)
    const checkingUsername = ref(false)
    const usernameAvailable = ref(null)
    const tempUserId = ref(null)
    const tempUsername = ref('')

    const rememberMe = ref(false)

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
        const { data: authUser, error: signUpError } = await supabase.auth.signUp({
          email: email.value,
          password: password.value
        })

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('already') || signUpError.status === 400) {
            error.value = 'Este correo electrónico ya está en uso'
            loading.value = false
            return
          } else{
            error.value = signUpError.message || 'Error al registrarse'
          }
          loading.value = false
          return
          
        }

        tempUsername.value = generateRandomUsername()

        username.value = tempUsername.value

        //check if generated username is available, if not generate again
        let isAvailable = false
        while (!isAvailable) {
          const { data, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', tempUsername.value)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError
          }

          if (!data) {
            isAvailable = true
          } else {
            tempUsername.value = generateRandomUsername()
          }
        }

        usernameAvailable.value = true

        const { error: insertError } = await supabase.from('users').insert([
          {
            id: authUser.user.id,
            username: tempUsername.value,
          }
        ])

        if (insertError) throw insertError
        
        tempUserId.value = authUser.user.id
        showUsernameStep.value = true
        success.value = 'Ahora elige tu nombre de usuario...'
        loading.value = false
        await loadBalance()
      } catch (err) {
        error.value = err.message || 'Error al registrarse'
      } finally {
        loading.value = false
      }
    }

    function isValidUsername(name) {
      // ^ = inicio, $ = fin, \w = [a-zA-Z0-9_], {3,20} = longitud mínima 3, máxima 20
      return /^[a-zA-Z0-9._]{3,20}$/.test(name)
    }

    const checkUsernameAvailability = async () => {
      const name = username.value.trim()
      if (!isValidUsername(name)) {
        usernameAvailable.value = null
        return
      }

      checkingUsername.value = true
      usernameAvailable.value = null

      try{
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('username', name)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        usernameAvailable.value = !data
      } catch (err) {
        console.error('Error checking username availability:', err)
      } finally {
        checkingUsername.value = false
      }
    }

    const saveUsernameAndFinish = async () => {
      if (!usernameAvailable.value || !tempUserId.value) return

      loading.value = true
      error.value = ''
      success.value = ''

      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ username: username.value.trim() })
          .eq('id', tempUserId.value)

        if (updateError) throw updateError

        success.value = '¡Registro completado con éxito!'

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
        error.value = err.message || 'Error al guardar el nombre de usuario'
      } finally {
        loading.value = false
      }
    }

    function generateRandomUsername() {
      const adjectives = ['Rápido', 'Feliz', 'Cool', 'Lento', 'Valiente']
      const nouns = ['Tigre', 'Lobo', 'Gato', 'Dragón', 'Zorro']
      const number = Math.floor(Math.random() * 1000) // número aleatorio 0-999
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
      const noun = nouns[Math.floor(Math.random() * nouns.length)]
      return `${adjective}${noun}${number}`
    }

    return {
      username,
      email,
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
