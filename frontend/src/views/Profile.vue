<template>
  <div class="profile">
    <h1>Mi Perfil</h1>
    
    <div v-if="loading" class="loading">Cargando...</div>
    
    <div v-else class="profile-content">
      <!-- Foto de perfil -->
      <div class="profile-picture">
        <img 
          :src="profileData.avatar_url || 'https://via.placeholder.com/150'" 
          alt="Foto de perfil"
        />
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileChange" 
          accept="image/*"
          style="display: none"
        />
        <button @click="$refs.fileInput.click()">Cambiar Foto</button>
      </div>

      <!-- Información del usuario -->
      <div class="profile-info">
        <div class="form-group">
          <label>Correo:</label>
          <input type="email" :value="user?.email" disabled />
        </div>

        <div class="form-group">
          <label>Nombre de usuario:</label>
          <input 
            type="text" 
            v-model="profileData.username" 
            :disabled="!isEditing"
            placeholder="Tu nombre de usuario"
          />
        </div>

        <div class="form-group">
          <label>Apodo:</label>
          <input 
            type="text" 
            v-model="profileData.display_name" 
            :disabled="!isEditing"
            placeholder="Tu apodo"
          />
        </div>

        <div class="form-group">
          <label>Biografía:</label>
          <textarea 
            v-model="profileData.bio" 
            :disabled="!isEditing"
            placeholder="Cuéntanos sobre ti..."
            rows="4"
          ></textarea>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <div class="actions">
          <button v-if="!isEditing" @click="isEditing = true">Editar Perfil</button>
          <template v-else>
            <button @click="saveProfile" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button @click="cancelEdit" class="cancel">Cancelar</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '@/config/supabase'

export default {
  name: 'Profile',
  setup() {
    const user = ref(null)
    const profileData = ref({
      username: '',
      display_name: '',
      bio: '',
      avatar_url: ''
    })
    const originalData = ref({})
    const isEditing = ref(false)
    const loading = ref(true)
    const saving = ref(false)
    const error = ref('')
    const success = ref('')
    const fileInput = ref(null)

    // Cargar perfil al montar
    onMounted(async () => {
      await loadProfile()
    })

    const loadProfile = async () => {
      loading.value = true
      try {
        // Obtener usuario actual
        const { data: { session } } = await supabase.auth.getSession()
        user.value = session?.user

        if (!user.value) return

        // Obtener datos del perfil desde la tabla users
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.value.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        // Si existe perfil, cargar datos
        if (data) {
          profileData.value = { ...data }
          originalData.value = { ...data }
        }
      } catch (err) {
        error.value = 'Error al cargar el perfil'
        console.error(err)
      } finally {
        loading.value = false
      }
    }

    const saveProfile = async () => {
      error.value = ''
      success.value = ''
      saving.value = true

      try {
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: user.value.id,
            username: profileData.value.username,
            display_name: profileData.value.display_name,
            bio: profileData.value.bio,
            avatar_url: profileData.value.avatar_url,
            updated_at: new Date().toISOString()
          })

        if (updateError) throw updateError

        success.value = 'Perfil actualizado correctamente'
        originalData.value = { ...profileData.value }
        isEditing.value = false
      } catch (err) {
        error.value = err.message || 'Error al guardar el perfil'
      } finally {
        saving.value = false
      }
    }

    const cancelEdit = () => {
      profileData.value = { ...originalData.value }
      isEditing.value = false
      error.value = ''
    }

    const handleFileChange = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        error.value = 'Por favor selecciona una imagen válida'
        return
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        error.value = 'La imagen no puede superar los 2MB'
        return
      }

      try {
        // Subir imagen a Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Obtener URL pública
        const { data } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath)

        profileData.value.avatar_url = data.publicUrl

        // Guardar automáticamente
        await saveProfile()
      } catch (err) {
        error.value = 'Error al subir la imagen'
        console.error(err)
      }
    }

    return {
      user,
      profileData,
      isEditing,
      loading,
      saving,
      error,
      success,
      fileInput,
      saveProfile,
      cancelEdit,
      handleFileChange
    }
  }
}
</script>

<style scoped>
.profile {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-picture {
  text-align: center;
}

.profile-picture img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #42b983;
}

.profile-picture button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.actions button {
  flex: 1;
  padding: 0.75rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actions button.cancel {
  background-color: #999;
}

.actions button:hover:not(:disabled) {
  opacity: 0.9;
}

.actions button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin: 0.5rem 0;
}

.success {
  color: green;
  margin: 0.5rem 0;
}
</style>
