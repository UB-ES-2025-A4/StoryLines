import { render, fireEvent, waitFor } from "@testing-library/vue";
import Sidebar from "@/components/Sidebar.vue";
import { vi } from "vitest";

// ----------------------
// MOCK ROUTER
// ----------------------
const mockPush = vi.fn();

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/" }),
  useRouter: () => ({ push: mockPush })
}));

// ----------------------
// REGISTRO GLOBAL DE router-link (para evitar warnings)
// ----------------------
const RouterLinkStub = {
  name: "router-link",
  props: ["to"],
  template: `<a @click="go"><slot /></a>`,
  methods: {
    go() {
      this.$emit("click");
      // Simular navegación real
      mockPush(this.to);
    }
  }
};

// ----------------------
// MOCK SUBCOMPONENTES
// ----------------------
vi.mock("@/components/Friends/Searcher.vue", () => ({
  default: {
    name: "Searcher",
    props: ["isOpen"],
    template: "<div>SearcherComponent</div>"
  }
}));

vi.mock("@/components/Friends/Notifications.vue", () => ({
  default: {
    name: "Notifications",
    props: ["isVisible"],
    template: "<div>NotificationsComponent</div>"
  }
}));

vi.mock("@/components/Friends/Messages.vue", () => ({
  default: {
    name: "Messages",
    props: ["isOpen"],
    template: "<div>MessagesComponent</div>"
  }
}));

// ----------------------
// MOCK SUPABASE
// ----------------------
vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: "123" } } } })
      )
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() =>
        Promise.resolve({
          data: { avatar_url: "avatar.png" },
          error: null
        })
      )
    }))
  }
}));

// ----------------------
// MOCK fetch
// ----------------------
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ok: true, notifications: [] })
  })
);

// ----------------------
// RENDER HELPER (inyecta router y router-link)
// ----------------------
function renderSidebar() {
  return render(Sidebar, {
    global: {
      components: {
        "router-link": RouterLinkStub
      },
      config: {
        globalProperties: {
          $route: { path: "/" }
        }
      }
    }
  });
}

// ----------------------
// TESTS
// ----------------------
describe("Sidebar.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("renderiza correctamente", () => {
    const { getByText } = renderSidebar();
    expect(getByText("Home")).toBeTruthy();
    expect(getByText("Buscar")).toBeTruthy();
    expect(getByText("Tienda")).toBeTruthy();
    expect(getByText("Perfil")).toBeTruthy();
  });

  test("abre y cierra el panel de búsqueda", async () => {
    const { getByText, container } = renderSidebar();

    const btn = getByText("Buscar");
    await fireEvent.click(btn);

    await waitFor(() =>
      expect(container.querySelector(".searcher-panel.show")).not.toBeNull()
    );

    await fireEvent.click(btn);

    await waitFor(() =>
      expect(container.querySelector(".searcher-panel.show")).toBeNull()
    );
  });

  test("abre notificaciones y cierra búsqueda", async () => {
    const { getByText, container } = renderSidebar();

    const searchBtn = getByText("Buscar");
    const notifBtn = getByText("Notificaciones");

    await fireEvent.click(searchBtn);
    await fireEvent.click(notifBtn);

    await waitFor(() => {
      expect(container.querySelector(".notification-panel.show")).not.toBeNull();
      expect(container.querySelector(".searcher-panel.show")).toBeNull();
    });
  });

  test("abre mensajes y cierra otros paneles", async () => {
    const { getByText, container } = renderSidebar();

    const msgBtn = getByText("Mensajes");
    const notifBtn = getByText("Notificaciones");

    await fireEvent.click(notifBtn);
    await fireEvent.click(msgBtn);

    await waitFor(() => {
      expect(container.querySelector(".messages-panel.show")).not.toBeNull();
      expect(container.querySelector(".notification-panel.show")).toBeNull();
    });
  });

  test("muestra el avatar guardado en localStorage", async () => {
    localStorage.setItem("user_avatar_url", "test-avatar.png");

    const { container } = renderSidebar();

    await waitFor(() => {
      const img = container.querySelector(".avatar");
      expect(img.src).toContain("test-avatar.png");
    });
  });

  test("router-link → navega a /profile", async () => {
    const { getByText } = renderSidebar();

    await fireEvent.click(getByText("Perfil"));
    expect(mockPush).toHaveBeenCalled();
  });
});
