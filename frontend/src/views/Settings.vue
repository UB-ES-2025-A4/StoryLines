<template>
    <div class="settings-page">
        <Sidebar />

        <div class="main-content">
            <h1 class="title">Configuración</h1>

            <div class="settings-container">
                <!-- Gestionar cuenta -->
                <div class="settings-section">
                    <button 
                        class="section-header" 
                        @click="toggleSection('account')"
                        :class="{ active: openSections.account }"
                    >
                        <div class="header-content">
                            <svg class="settings-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                            </svg>
                            <span>Gestionar cuenta</span>
                        </div>
                        <svg class="chevron" :class="{ rotated: openSections.account }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </button>
                    
                    <div class="section-content" v-show="openSections.account">
                        <div class="user-info-card">
                            <p><strong>Username:</strong> {{ username }}</p>
                            <p><strong>Email:</strong> {{ user?.email }}</p>
                        </div>

                        <div class="subsection">
                            <button class="subsection-btn" @click="toggleSubsection('changeEmail')">
                                Cambiar email
                                <svg class="chevron-small" :class="{ rotated: openSubsections.changeEmail }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                            </button>
                            <div class="subsection-content" v-show="openSubsections.changeEmail">
                                <input v-model="newEmail" type="email" placeholder="Nuevo email" class="primary-input" />
                                <input v-model="confirmEmail" type="email" placeholder="Confirmar nuevo email" class="primary-input" />
                                <button class="primary-btn" @click="submitEmailChange">Guardar</button>
                            </div>
                        </div>

                        <div class="subsection">
                            <button class="subsection-btn" @click="toggleSubsection('changePassword')">
                                Cambiar contraseña
                                <svg class="chevron-small" :class="{ rotated: openSubsections.changePassword }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                            </button>
                            <div class="subsection-content" v-show="openSubsections.changePassword">
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
                                <button class="primary-btn" @click="submitPasswordChange">Confirmar cambio</button>
                            </div>
                        </div>

                        <div class="subsection">
                            <button class="subsection-btn danger" @click="showDeleteModal = true">
                                Eliminar cuenta
                            </button>
                        </div>

                        <div class="subsection">
                            <button class="subsection-btn logout" @click="showLogoutModal = true">
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Personalización -->
                <div class="settings-section">
                    <button class="section-header customization-header" @click="$router.push('/customization')">
                        <div class="header-content">
                            <svg class="palette-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" fill="none"/>
                            </svg>
                            <span>Personalización</span>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-right">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modales -->
            <div v-if="showDeleteModal" class="modal-overlay">
                <div class="modal-card">
                    <h2>Confirmar eliminación de cuenta</h2>
                    <p>Introduce tu contraseña.</p>
                    <input v-model="deletePassword" type="password" placeholder="Ingresa tu contraseña" autocomplete="new-password" class="primary-input" />
                    <h4>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.</h4>
                    <div class="modal-buttons">
                        <button class="delete-btn" @click="deleteAccount">Confirmar</button>
                        <button class="secondary-btn" @click="showDeleteModal = false">Cancelar</button>
                    </div>
                </div>
            </div>

            <div v-if="showLogoutModal" class="modal-overlay">
                <div class="modal-card">
                    <h2>Confirmar cierre de sesión</h2>
                    <p>¿Estás seguro de que deseas cerrar sesión?</p>
                    <div class="modal-buttons">
                        <button class="primary-btn" @click="handleLogout">Confirmar</button>
                        <button class="secondary-btn" @click="showLogoutModal = false">Cancelar</button>
                    </div>
                </div>
            </div>

            <!-- Modal de confirmación de email -->
            <div v-if="showEmailConfirmation" class="modal-overlay">
                <div class="modal-card">
                    <h2>Confirma tu nuevo email</h2>
                    <p>Hemos enviado un correo de verificación a: <strong>{{ newEmail }}</strong></p>
                    <p><em>Debes hacer clic en el enlace del email para completar el cambio.</em></p>
                    <div class="modal-buttons">
                        <button class="primary-btn" @click="checkEmailConfirmed(true)">Ya lo he confirmado</button>
                        <button class="secondary-btn" @click="showEmailConfirmation = false">Cancelar</button>
                    </div>
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
const user = ref(null)
const username = ref('')

// Estados de las secciones
const openSections = ref({
    account: true
})

const openSubsections = ref({
    changeEmail: false,
    changePassword: false
})

// Variables para cambio de email
const newEmail = ref('')
const confirmEmail = ref('')
const showEmailConfirmation = ref(false)
const showLogoutModal = ref(false)

// Variables para cambio de contraseña
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Variables para eliminar cuenta
const showDeleteModal = ref(false)
const deletePassword = ref('')

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
})

function toggleSection(section) {
    openSections.value[section] = !openSections.value[section]
}

function toggleSubsection(subsection) {
    openSubsections.value[subsection] = !openSubsections.value[subsection]
}

// Cerrar sesión
const handleLogout = async () => {
  await supabase.auth.signOut()
  localStorage.removeItem('user_avatar_url')
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
        showEmailConfirmation.value = true
        openSubsections.value.changeEmail = false
    }
}

// Verificar si el email fue confirmado
async function checkEmailConfirmed(showAlert = true) {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user?.email === newEmail.value) {
        if (showAlert) alert("Email confirmado correctamente.")
        user.value = session.user
        showEmailConfirmation.value = false
        newEmail.value = ''
        confirmEmail.value = ''

        if(localStorage.getItem('rememberedEmail')) {
            localStorage.setItem('rememberedEmail', newEmail.value)
        }
    } else {
        if (showAlert) alert("Tu email aún no está confirmado. Revisa tu correo.")
    }
}

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
        resetPasswordFields()
        openSubsections.value.changePassword = false
    }
}

function resetPasswordFields() {
    oldPassword.value = ""
    newPassword.value = ""
    confirmPassword.value = ""
}

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
    padding: 3rem;
    margin-left: 250px; 
    width: calc(100vw - 250px); 
    max-width: none;
}

.title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-align: left;
}

.settings-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: none;
    width: 100%;
}

.settings-section {
    background: rgba(26, 26, 26, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.section-header {
    width: 100%;
    padding: 1.5rem 2rem;
    background: none;
    border: none;
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.section-header:hover {
    background: rgba(255, 255, 255, 0.05);
}

.section-header.active {
    background: rgba(255, 255, 255, 0.1);
}

.customization-header {
    background: linear-gradient(135deg, rgba(2, 161, 143, 0.8), rgba(55, 86, 137, 0.8));
}

.customization-header:hover {
    background: linear-gradient(135deg, rgba(2, 161, 143, 0.9), rgba(55, 86, 137, 0.9));
}

.header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.palette-icon, .settings-icon {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
}

.settings-icon {
    fill: currentColor;
    stroke: none;
}

.chevron, .chevron-small, .arrow-right {
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
}

.chevron.rotated, .chevron-small.rotated {
    transform: rotate(180deg);
}

.section-content {
    padding: 0.5rem 2rem 2rem 2rem;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.user-info-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    margin-top: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info-card p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
}

.subsection {
    margin-bottom: 1rem;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
}

.subsection-btn {
    width: 100%;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.subsection-btn:hover {
    background: rgba(255, 255, 255, 0.05);
}

.subsection-btn.danger {
    color: #ff6b6b;
}

.subsection-btn.danger:hover {
    background: rgba(255, 107, 107, 0.1);
}

.subsection-btn.logout {
    color: #ffa726;
}

.subsection-btn.logout:hover {
    background: rgba(255, 167, 38, 0.1);
}

.subsection-content {
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    animation: slideDown 0.3s ease-out;
}

.primary-input {
    background: rgba(26, 26, 26, 0.8);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.primary-input:focus {
    outline: none;
    border-color: rgba(2, 161, 143, 0.5);
}

.primary-btn {
    background: #48494B;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;
    align-self: flex-start;
}

.primary-btn:hover {
    background: #5a5b5d;
    transform: translateY(-1px);
}

.secondary-btn {
    background: #375689;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;
}

.secondary-btn:hover {
    background: #4a6ba3;
}

.delete-btn {
    background: #b91c1c;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;
}

.delete-btn:hover {
    background: #dc2626;
}

.password-container {
    position: relative;
    width: 100%;
}

.toggle-btn {
    position: absolute;
    right: 1rem;
    top: 50%;
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
    color: #bebdb8;
}

.icon {
    width: 20px;
    height: 20px;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-card {
    background: rgba(26, 26, 26, 0.95);
    backdrop-filter: blur(20px);
    padding: 2.5rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 450px;
    text-align: center;
    color: white;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-card h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
}

.modal-card h4 {
    margin: 1.5rem 0;
    font-weight: 500;
    color: #ccc;
}

.modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}
</style>