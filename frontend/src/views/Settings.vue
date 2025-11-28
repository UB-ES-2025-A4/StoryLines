<template>
    <div class="settings-page">
        <Sidebar />

        <div class="main-content">
            <h1 class="title">Configuración</h1>

            <!-- Pantalla principal -->
            <div v-if="screen === 'main'" class="section-card">
                <button class="primary-btn" @click="screen = 'account'">
                    Gestionar cuenta
                </button>

                <button class="primary-btn">
                    Personalización
                </button>

                <button class="secondary-btn" @click="showLogoutModal = true">
                    Cerrar sesión
                </button>
            </div>

            <!-- Gestionar cuenta -->
            <div v-else-if="screen === 'account'" class="section-card">
                <h2 class="section-title">Gestionar cuenta</h2>

                <div class="user-info-card">
                    <p><strong>Username:</strong> {{ username }}</p>
                    <p><strong>Email:</strong> {{ user?.email }}</p>
                </div>

                <button class="primary-btn" @click="screen = 'changeEmail'">
                    Cambiar email
                </button>

                <button class="primary-btn" @click="screen = 'changePassword'">
                    Cambiar contraseña
                </button>

                <button class="delete-btn" @click="showDeleteModal = true">
                    Eliminar cuenta
                </button>

                <button class="secondary-btn mt-4" @click="screen = 'main'">
                    Volver
                </button>
            </div>

            <!-- Cambiar email -->
            <div v-else-if="screen === 'changeEmail'" class="section-card">
                <h2 class="section-title">Cambiar email</h2>

                <input v-model="newEmail" type="email" placeholder="Nuevo email" class="primary-input" />

                <input v-model="confirmEmail" type="email" placeholder="Confirmar nuevo email" class="primary-input" />

                <button class="primary-btn" @click="submitEmailChange">
                    Guardar
                </button>

                <button class="secondary-btn mt-4" @click="screen = 'account'">
                    Volver
                </button>
            </div>

            <!-- Esperando confirmación -->
            <div v-else-if="screen === 'waitingEmailConfirmation'" class="section-card">
                <h2 class="section-title">Confirma tu nuevo email</h2>

                <p>
                    Hemos enviado un correo de verificación a:
                    <strong>{{ newEmail }}</strong>
                </p>

                <p><em>Debes hacer clic en el enlace del email para completar el cambio.</em></p>

                <button class="primary-btn" @click="checkEmailConfirmed(true)">
                    Ya lo he confirmado
                </button>

                <button class="secondary-btn mt-4" @click="screen = 'account'">
                    Cancelar
                </button>
            </div>


            <!-- Cambiar contraseña -->
            <div v-else-if="screen === 'changePassword'" class="section-card">
                <h2 class="section-title">Cambiar contraseña</h2>

                <div class="password-container">
                    <input v-model="oldPassword" :type="showOldPassword ? 'text' : 'password'"
                        autocomplete="new-password" placeholder="Contraseña actual"
                        class="primary-input" />

                    <button @click="showOldPassword = !showOldPassword" class="toggle-btn"
                        v-html="showOldPassword ? eyeSlashIcon : eyeIcon">
                    </button>
                </div>

                <div class="password-container">
                    <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'"
                        autocomplete="new-password" placeholder="Nueva contraseña"
                        class="primary-input" />

                    <button @click="showNewPassword = !showNewPassword" class="toggle-btn"
                        v-html="showNewPassword ? eyeSlashIcon : eyeIcon">
                    </button>
                </div>


                <div class="password-container">
                    <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                        autocomplete="new-password" placeholder="Confirmar nueva contraseña"
                        class="primary-input" />

                    <button @click="showConfirmPassword = !showConfirmPassword" class="toggle-btn"
                        v-html="showConfirmPassword ? eyeSlashIcon : eyeIcon">
                    </button>
                </div>


                <button class="primary-btn" @click="submitPasswordChange">
                    Confirmar cambio
                </button>

                <button class="secondary-btn mt-4" @click="resetPasswordFields(); screen = 'account'">
                    Cancelar
                </button>
            </div>

            <div v-if="showDeleteModal" class="modal-overlay">
                <div class="modal-card">
                    <h2>Confirmar eliminación de cuenta</h2>
                    <p>Introduce tu contraseña.</p>
                    <input v-model="deletePassword" type="password" placeholder="Ingresa tu contraseña" autocomplete="new-password" class="primary-input" />


                    <h4>Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.</h4>
                    <button class="delete-btn" @click="deleteAccount">
                        Confirmar
                    </button>
                    <button class="primary-btn" @click="showDeleteModal = false">
                        Cancelar
                    </button>
                </div>
            </div>

            <div v-if="showLogoutModal" class="modal-overlay">
                <div class="modal-card">
                    <h2>Confirmar cierre de sesión</h2>
                    <p>¿Estás seguro de que deseas cerrar sesión?</p>
                    <button class="primary-btn" @click="handleLogout">
                        Confirmar
                    </button>
                    <button class="primary-btn" @click="showLogoutModal = false">
                        Cancelar
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'
import Sidebar from '@/components/Sidebar.vue'

const router = useRouter()
const screen = ref('main')
const user = ref(null)
const username = ref('')
const newEmail = ref('')
const confirmEmail = ref('')

// Obtener sesión y username
onMounted(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null

    if (user.value) {
        const { data } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.value.id)
            .single()

        username.value = data?.username || 'No disponible'
    }

    // Chequear automáticamente si el email se confirma cada 5s
    setInterval(async () => {
        if (screen.value === "waitingEmailConfirmation") {
            await checkEmailConfirmed(false)
        }
    }, 5000)
})

// Escuchar cambios en la sesión
supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
})

const showLogoutModal = ref(false)

// Cerrar sesión
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

// Cambiar email
async function changeEmail(email) {
    return await supabase.auth.updateUser({ email })
}

async function submitEmailChange() {
    if (!newEmail.value || !confirmEmail.value) return
    if (newEmail.value !== confirmEmail.value) return

    const { error } = await changeEmail(newEmail.value)

    if (error) {
        console.error("Error updating email:", error.message)
    } else {
        screen.value = "waitingEmailConfirmation"
    }
}

// Verificar si el email fue confirmado
async function checkEmailConfirmed(showAlert = true) {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user?.email === newEmail.value) {
        if (showAlert) alert("Email confirmado correctamente.")

        user.value = session.user
        screen.value = "account"

        if(localStorage.getItem('rememberedEmail')) {
            localStorage.setItem('rememberedEmail', newEmail.value)
        }
        
    } else {
        if (showAlert) alert("Tu email aún no está confirmado. Revisa tu correo.")
    }
}

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Cambiar contraseña
async function submitPasswordChange() {
    if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
        alert("Por favor, completa todos los campos.")
        return
    }

    if (newPassword.value !== confirmPassword.value) {
        alert("La nueva contraseña y su confirmación no coinciden.")
        return
    }

    if (newPassword.value === oldPassword.value) {
        alert("La nueva contraseña debe ser diferente a la actual.")
        return
    }

    if (newPassword.value.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres.")
        return
    }


    const { data: { session } } = await supabase.auth.getSession()
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: oldPassword.value
    })

    if (signInError) {
        console.error("Error re-authenticating:", signInError.message)
        return
    }

    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword.value
    })

    if (updateError) {
        console.error("Error updating password:", updateError.message)
    } else {
        alert("Contraseña actualizada correctamente.")
        if(localStorage.getItem('rememberedPassword')) {
            localStorage.setItem('rememberedPassword', newPassword.value)
        }
        screen.value = "account"
        resetPasswordFields()
    }
}

function resetPasswordFields() {
    oldPassword.value = ""
    newPassword.value = ""
    confirmPassword.value = ""
}

const showDeleteModal = ref(false)
const deletePassword = ref('')

// Eliminar cuenta
async function deleteAccount() {

    if (!deletePassword.value) {
        alert("Por favor, ingresa tu contraseña para confirmar.")
        return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: deletePassword.value
    })

    if (signInError) {
        console.error("Contraseña incorrecta:", signInError.message)
        deletePassword.value = ""
        return
    }

    await supabase.auth.signOut()

    localStorage.clear()

    const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'DELETE',
    })
    const data = await res.json()

    if (data.success) {
        alert("Cuenta eliminada correctamente.")
    } else {
        console.error("Error deleting account:", data.message)
    }

    router.push('/')

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


</script>

<style scoped>
.settings-page {
    display: flex;
    min-height: 100vh;
    background: #0A0A0A;
    color: #fff;
}

.main-content {
    flex: 1;
    padding: 2rem;
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.title {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
}

.section-title {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    margin-left: 1rem;
}

.section-card {
    border: 1.5px solid #fff;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background: rgba(10, 10, 10, 0.7);
    width: 1000px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 1rem;
    max-width: 28rem;
}

.user-info-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
}

.primary-btn {
    background: #48494B;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
}

.secondary-btn {
    background: #375689;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
}

.delete-btn {
    background: #b91c1c;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
}

.delete-btn:hover {
    background: #991b1b;
}

.primary-input {
    background: #1a1a1a;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid #444;
    width: 100%;
}

.mt-4 {
    margin-top: 1rem;
}

.password-container {
    position: relative;
    width: 100%;
}

.toggle-btn {
    position: absolute;
    right: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #777b7e;
    padding: 0;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
}


.toggle-btn:hover {
    color: #bebdb8;
}

.icon {
    width: 18px;
    height: 18px;
}

.modal-overlay {
  position: fixed;
  top:0; left:0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index: 1000;
}

.modal-card {
  background:#1a1a1a;
  padding:2rem;
  border-radius:12px;
  border: 1px solid #fff;
  max-width:400px;
  text-align:center;
  color:white;
}


</style>