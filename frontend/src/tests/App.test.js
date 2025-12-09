import { render, screen } from '@testing-library/vue'
import App from '@/App.vue'
import { createRouter, createWebHistory } from 'vue-router'

// Creamos un componente de prueba para el router-view
const FakeHome = {
  template: '<div>Componente cargado</div>'
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: FakeHome }
  ]
})

test('App renderiza el router-view con su contenido', async () => {
  render(App, {
    global: {
      plugins: [router]
    }
  })

  // Esperar a que el router inicialice
  await router.isReady()

  // Comprobación
  expect(screen.getByText('Componente cargado')).toBeTruthy()
})
