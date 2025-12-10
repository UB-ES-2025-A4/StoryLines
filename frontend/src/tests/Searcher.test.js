import { render, screen, fireEvent, waitFor } from "@testing-library/vue"
import Searcher from "@/components/Friends/Searcher.vue"
import { vi } from "vitest"
import { supabase } from "@/config/supabase.js"

// ----------------------------------------------------------
// MOCK ROUTER
// ----------------------------------------------------------
const routerPush = vi.fn()

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: routerPush
  })
}))

// ----------------------------------------------------------
// MOCK SUPABASE
// ----------------------------------------------------------
vi.mock("@/config/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "123" } }
      })
    }
  }
}))

// ----------------------------------------------------------
// UTILIDAD: MOCK FETCH
// ----------------------------------------------------------
function mockFetchSequence(sequence) {
  global.fetch = vi.fn()
  sequence.forEach(res =>
    global.fetch.mockResolvedValueOnce({
      ok: res.ok,
      json: async () => res.json
    })
  )
}

// ----------------------------------------------------------
// TESTS
// ----------------------------------------------------------
describe("Searcher.vue", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ----------------------------------------------------------
  test("renderiza cuando isOpen = true", () => {
    render(Searcher, { props: { isOpen: true } })
    expect(screen.getByText("Buscar")).toBeTruthy()
  })

  // ----------------------------------------------------------
  test("limpia todo al cerrar (watch isOpen)", async () => {
    const { rerender } = render(Searcher, {
      props: { isOpen: true }
    })

    const input = screen.getByPlaceholderText("Busca un usuario")
    await fireEvent.update(input, "abc")

    await rerender({ isOpen: false })

    expect(input.value).toBe("")
  })

  // ----------------------------------------------------------
  test("no llama a searchUsers si query vacía", async () => {
    global.fetch = vi.fn()

    render(Searcher, { props: { isOpen: true } })

    const input = screen.getByPlaceholderText("Busca un usuario")
    await fireEvent.update(input, "")
    await fireEvent.input(input)

    expect(global.fetch).not.toHaveBeenCalled()
  })

  // ----------------------------------------------------------
  test("muestra lista vacía cuando no hay usuarios", async () => {
    mockFetchSequence([
      { ok: true, json: { users: [] } }
    ])

    render(Searcher, { props: { isOpen: true } })

    const input = screen.getByPlaceholderText("Busca un usuario")
    await fireEvent.update(input, "a")
    await fireEvent.input(input)

    const emptyMsg = await screen.findByText("No se encontraron usuarios")
    expect(emptyMsg).toBeTruthy()
  })

  // ----------------------------------------------------------
  test("muestra usuarios devueltos por la API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [
          { id: "1", username: "pepe", display_name: "Pepe", friendshipStatus: "none" }
        ]
      })
    })

    render(Searcher, { props: { isOpen: true } })

    const input = screen.getByPlaceholderText("Busca un usuario")
    await fireEvent.update(input, "a")
    await fireEvent.input(input)

    expect(await screen.findByText("pepe")).toBeTruthy()
  })

  // ----------------------------------------------------------
  test("muestra error si searchUsers falla", async () => {
    mockFetchSequence([
      { ok: false, json: { error: "Error en la búsqueda" } }
    ])

    render(Searcher, { props: { isOpen: true } })

    const input = screen.getByPlaceholderText("Busca un usuario")
    await fireEvent.update(input, "a")
    await fireEvent.input(input)

    const msg = await screen.findByText(/error en la búsqueda/i)
    expect(msg).toBeTruthy()
  })

  // ----------------------------------------------------------
  test("click en usuario navega correctamente y cierra", async () => {
    mockFetchSequence([
      { ok: true, json: { users: [
        { id: "1", username: "pepe", display_name: "Pepe", friendshipStatus: "none" }
      ] }}
    ])

    const closeMock = vi.fn()

    render(Searcher, {
      props: { isOpen: true, onClose: closeMock }
    })

    const input = screen.getByPlaceholderText("Busca un usuario")
    await fireEvent.update(input, "p")
    await fireEvent.input(input)

    const user = await screen.findByText("pepe")
    await fireEvent.click(user)

    expect(routerPush).toHaveBeenCalledWith("/user/1")
    expect(closeMock).toHaveBeenCalled()
  })

  // ----------------------------------------------------------
  test("cerrar emite evento close", async () => {
    const closeMock = vi.fn()

    render(Searcher, {
      props: { isOpen: true, onClose: closeMock }
    })

    const closeBtn = screen.getByText("✕")
    await fireEvent.click(closeBtn)

    expect(closeMock).toHaveBeenCalled()
  })


})
