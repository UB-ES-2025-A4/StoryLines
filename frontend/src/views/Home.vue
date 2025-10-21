<template>
  <div class="home">
    <h1>StoryLines - Around the World</h1>
    <div v-if="user">
      <p>Bienvenido, {{ user.email }}</p>
      <router-link to="/profile">Ir a Perfil</router-link>
      <button @click="handleLogout">Cerrar Sesión</button>
    </div>
    <div v-else>
      <p>Explora viajes alrededor del mundo</p>
      <router-link to="/login">Iniciar Sesión</router-link>
      <router-link to="/register">Registrarse</router-link>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const user = ref(null)

    // Obtener usuario actual
    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user || null
    })

    // Escuchar cambios en la autenticación
    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user || null
    })

    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }

    return {
      user,
      handleLogout
    }
  }
}
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}
a {
  margin: 0 1rem;
}
button {
  margin-left: 1rem;
}
</style>
