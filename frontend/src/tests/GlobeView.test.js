import { render, fireEvent, screen, waitFor } from "@testing-library/vue";
import GlobeView from "@/components/Globe/GlobeView.vue";
import { nextTick } from "vue";
import { vi } from "vitest";

/* -----------------------------------------------------
   🔥 FIX GLOBAL (SOLUCIÓN DEFINITIVA)
   👉 Vitest ejecuta el componente antes de tu mock.
   👉 Por eso friends.value llegaba undefined.
   👉 Mockeamos ref() para que NUNCA devuelva undefined.
----------------------------------------------------- */
vi.mock("vue", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    ref: (initial) => mod.ref(initial ?? []), // ⭐ fuerza [] si initial es undefined
  };
});

/* -----------------------------------------------------
   MOCKS COMPLETOS
----------------------------------------------------- */

vi.mock("globe.gl", () => ({
  default: () => () => ({
    globeImageUrl: vi.fn().mockReturnThis(),
    backgroundImageUrl: vi.fn().mockReturnThis(),
    width: vi.fn().mockReturnThis(),
    height: vi.fn().mockReturnThis(),

    arcsData: vi.fn().mockReturnThis(),
    arcLabel: vi.fn().mockReturnThis(),
    arcStartLat: vi.fn().mockReturnThis(),
    arcStartLng: vi.fn().mockReturnThis(),
    arcEndLat: vi.fn().mockReturnThis(),
    arcEndLng: vi.fn().mockReturnThis(),
    arcColor: vi.fn().mockReturnThis(),
    arcStroke: vi.fn().mockReturnThis(),
    arcDashLength: vi.fn().mockReturnThis(),
    arcDashGap: vi.fn().mockReturnThis(),
    arcDashAnimateTime: vi.fn().mockReturnThis(),
    onArcHover: vi.fn().mockReturnThis(),
    onArcClick: vi.fn().mockReturnThis(),

    htmlElementsData: vi.fn().mockReturnThis(),
    htmlElement: vi.fn().mockReturnThis(),

    controls: () => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),

    pointOfView: vi.fn().mockReturnThis()
  })
}));

vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null }, error: null
      }),
      onAuthStateChange: vi.fn(() => {})
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

vi.mock("@/composables/useCustomization", () => ({
  useCustomization: () => ({
    getUserColor: () => "#00ff00",
    userColor: { value: "#00ff00" },
    getEquippedItem: () => null
  }),
  initialize: vi.fn()
}));

vi.mock("@/data/shopThemes", () => ({
  getItems: vi.fn().mockResolvedValue([{ id: 1 }])
}));

vi.mock("@/data/dummyTrips.js", () => ({
  convertTripsToArcs: vi.fn(() => []),
  processDestinationsFromTrips: vi.fn(() => [])
}));

/* -----------------------------------------------------
   MOCK GLOBAL DE FETCH (SEGURIDAD)
----------------------------------------------------- */
global.fetch = vi.fn().mockResolvedValue({
  json: async () => ({
    ok: true,
    trips: [],
    friends: [] // ⭐ nunca undefined
  })
});




/* -----------------------------------------------------
   1) Render básico + modo visitante
----------------------------------------------------- */
test("renderiza el componente en modo visitante y carga trips", async () => {
  render(GlobeView);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/trips");
  });

  await screen.findByText("Discovery");
  await screen.findByText("Friends");
});


/* -----------------------------------------------------
   2) setMode('friends') --> debe abrir modal auth si no hay user
----------------------------------------------------- */
test("setMode a friends muestra modal si no hay usuario logueado", async () => {
  render(GlobeView);

  const friendsTab = await screen.findByText("Friends");
  await fireEvent.click(friendsTab);

  // 🔥 AQUÍ EL CAMBIO
  await screen.findByText("No tienes amigos todavía");
});


/* -----------------------------------------------------
   3) Cuando user está logueado → no muestra modal
----------------------------------------------------- */
test("setMode a friends con usuario logueado NO abre modal", async () => {
  const { supabase } = await import("@/config/supabase");
  supabase.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: "123" } }, error: null
  });

  render(GlobeView);

  await nextTick();

  const friendsTab = await screen.findByText("Friends");
  await fireEvent.click(friendsTab);

  expect(screen.queryByText("No tienes amigos todavía")).toBeNull();
});


/* -----------------------------------------------------
   4) fetchSuggestedUsers funciona y muestra sugeridos
----------------------------------------------------- */
test("fetchSuggestedUsers muestra usuarios sugeridos", async () => {
  const { supabase } = await import("@/config/supabase");

  supabase.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: "100" } }, error: null
  });

  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [
        { id: "200", username: "juan", avatar_url: "" },
        { id: "201", username: "ana", avatar_url: "" }
      ],
      error: null
    })
  });

  render(GlobeView);

  const friendsTab = await screen.findByText("Friends");
  await fireEvent.click(friendsTab);

  await screen.findByText("No tienes amigos todavía");

  await screen.findByText("juan");
  await screen.findByText("ana");
});


/* -----------------------------------------------------
   5) addFriend envía POST + actualiza lista
----------------------------------------------------- */
test("addFriend envía POST y actualiza sugerencias", async () => {
  const { supabase } = await import("@/config/supabase");

  supabase.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: "100" } }, error: null
  });

  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [
        { id: "200", username: "juan", avatar_url: "" }
      ],
      error: null
    })
  });

    global.fetch = vi
    .fn()
    .mockResolvedValueOnce({ json: async () => ({ ok: true, trips: [], friends: [] }) })
    .mockResolvedValueOnce({ json: async () => ({ ok: true, friends: [] }) }) // ⭐ FIX
    .mockResolvedValueOnce({ json: async () => ({ ok: true, friends: [] }) });

  render(GlobeView);

  const friendsTab = await screen.findByText("Friends");
  await fireEvent.click(friendsTab);

  const button = await screen.findByText("Añadir amigo");
  await fireEvent.click(button);

  const addFriendCall = global.fetch.mock.calls.find(
    c => c[0] === "/api/add-friend"
  );

  expect(addFriendCall).toBeTruthy();
  expect(addFriendCall[1].method).toBe("POST");

  await waitFor(() => {
    expect(screen.queryByText("juan")).toBeNull();
  });
});


/* -----------------------------------------------------
   6) closeAuthModal cambia modo a discovery si no user
----------------------------------------------------- */
test("closeAuthModal vuelve a discovery cuando user no está logueado", async () => {
  render(GlobeView);

  const friends = await screen.findByText("Friends");
  await fireEvent.click(friends);

  // 🔥 AQUÍ EL CAMBIO
  await screen.findByText("No tienes amigos todavía");

  const closeButton = await screen.findByText("Cerrar");
  await fireEvent.click(closeButton);

  await screen.findByText("Discovery");
});


/* -----------------------------------------------------
   7) onUnmounted limpia listeners
----------------------------------------------------- */
test("onUnmounted limpia listeners sin errores", async () => {
  const { unmount } = render(GlobeView);
  expect(() => unmount()).not.toThrow();
});
