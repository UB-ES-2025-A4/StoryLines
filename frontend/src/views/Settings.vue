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

                <button class="primary-btn">
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

                <button class="primary-btn">
                    Cambiar contraseña
                </button>

                <button class="primary-btn">
                    Eliminar cuenta
                </button>

                <button class="secondary-btn mt-4" @click="screen = 'main'">
                    Volver
                </button>
            </div>

            <!-- Cambiar email -->
            <div v-else-if="screen === 'changeEmail'" class="section-card">
                <h2 class="section-title">Cambiar email</h2>

                <input
                    v-model="newEmail"
                    type="email"
                    placeholder="Nuevo email"
                    class="primary-input"
                />

                <input
                    v-model="confirmEmail"
                    type="email"
                    placeholder="Confirmar nuevo email"
                    class="primary-input"
                />

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
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '@/config/supabase'
import Sidebar from '@/components/Sidebar.vue'

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
        const { data, error } = await supabase
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
    } else {
        if (showAlert) alert("Tu email aún no está confirmado. Revisa tu correo.")
    }
}
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
</style>
