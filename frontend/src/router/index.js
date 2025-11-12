import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/config/supabase'

// Importar vistas/componentes (crearemos estos después)
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Profile from '@/views/Profile.vue'
import CreatePost from '@/views/CreateTrip.vue'
import Post from '@/views/Post.vue' 

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true } // Solo para usuarios no autenticados
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },

  {
     path: '/profile',
     name: 'Profile',
     component: Profile,
     meta: { requiresAuth: true } // Solo para usuarios autenticados
   },

  {
    path: '/createtrip',
    name: 'CreateTrip',
    component: CreatePost,
    meta: { requiresAuth: true }   // <- IMPORTANTE
  },

  {
    path: '/post/:id',    // ✅ ruta dinámica
    name: 'Post',
    component: Post
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navegación para proteger rutas
router.beforeEach(async (to, from, next) => {
  // Obtener sesión actual
  const { data: { session } } = await supabase.auth.getSession()
  
  // Si la ruta requiere autenticación y no hay sesión
  if (to.meta.requiresAuth && !session) {
    next('/login')
  }
  // Si la ruta es solo para guests (login/register) y hay sesión
  else if (to.meta.requiresGuest && session) {
    next('/')
  }
  // Permitir navegación
  else {
    next()
  }
})

export default router
