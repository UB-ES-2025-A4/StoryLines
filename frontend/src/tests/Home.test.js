import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/vue";
import Home from "@/views/Home.vue";

// --- MOCK ROUTER ---
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() })
}));

// --- MOCK SUPABASE ---
vi.mock("@/config/supabase", () => {
  return {
    supabase: {
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null } }),
        onAuthStateChange: vi.fn()
      }
    }
  };
});

// --- MOCK COMPONENTS ---
vi.mock("@/components/Sidebar.vue", () => ({
  default: { template: "<div data-testid='sidebar'></div>" }
}));
vi.mock("@/components/Globe/GlobeView.vue", () => ({
  default: { template: "<div data-testid='globeview'></div>" }
}));

// --- MOCK COMPOSABLES ---
vi.mock("@/composables/useCustomization", () => ({
  initialize: vi.fn(),
  resetCustomization: vi.fn()
}));

describe("Home.vue", () => {
  beforeEach(() => localStorage.clear());

  it("renderiza Sidebar, GlobeView y header", async () => {
    const { getByTestId, getByText } = render(Home, {
      global: { stubs: ["router-link"] }
    });
    expect(getByTestId("sidebar")).toBeTruthy();
    expect(getByTestId("globeview")).toBeTruthy();
    expect(getByText("StoryLines")).toBeTruthy();
  });

  it("muestra guest menu si no hay usuario", async () => {
    const { getByText, container } = render(Home, {
      global: { stubs: ["router-link"] }
    });

    expect(getByText("Explora viajes alrededor del mundo")).toBeTruthy();

    const loginBtn = container.querySelector(".btn.btn-primary");
    const registerBtn = container.querySelector(".btn.btn-outline");

    expect(loginBtn).toBeTruthy();
    expect(registerBtn).toBeTruthy();

    expect(loginBtn.getAttribute("to")).toBe("/login");
    expect(registerBtn.getAttribute("to")).toBe("/register");
  });

  it("llama a initialize si hay usuario en onMounted", async () => {
    const { supabase } = await import("@/config/supabase");
    const { initialize } = await import("@/composables/useCustomization");

    supabase.auth.getSession = vi.fn(() =>
      Promise.resolve({ data: { session: { user: { id: "user123" } } } })
    );

    render(Home, { global: { stubs: ["router-link"] } });
    await new Promise(r => setTimeout(r, 0));

    expect(initialize).toHaveBeenCalledWith("user123");
  });

  it("resetea customization y limpia localStorage en SIGNED_OUT", async () => {
    const { resetCustomization } = await import("@/composables/useCustomization");
    const { supabase } = await import("@/config/supabase");

    localStorage.setItem("user_balance", "100");
    localStorage.setItem("purchased_items", "items");
    localStorage.setItem("equipped_items", "equipped");

    let callback;
    supabase.auth.onAuthStateChange = vi.fn(cb => (callback = cb));

    render(Home, { global: { stubs: ["router-link"] } });

    callback("SIGNED_OUT", null);
    await new Promise(r => setTimeout(r, 0));

    expect(resetCustomization).toHaveBeenCalled();
    expect(localStorage.getItem("user_balance")).toBeNull();
    expect(localStorage.getItem("purchased_items")).toBeNull();
    expect(localStorage.getItem("equipped_items")).toBeNull();
  });

  it("responde a SIGNED_IN y llama a initialize", async () => {
    const { initialize } = await import("@/composables/useCustomization");
    const { supabase } = await import("@/config/supabase");

    let callback;
    supabase.auth.onAuthStateChange = vi.fn(cb => (callback = cb));

    render(Home, { global: { stubs: ["router-link"] } });

    callback("SIGNED_IN", { user: { id: "user456" } });
    await new Promise(r => setTimeout(r, 0));

    expect(initialize).toHaveBeenCalledWith("user456");
  });
});
