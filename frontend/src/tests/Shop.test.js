import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Shop from "@/views/Shop.vue";

// =====================================================
// BYPASS triggerCelebration (DOM real)
// =====================================================
document.querySelector = vi.fn(() => {
  const el = document.createElement("div");
  el.appendChild = vi.fn();
  return el;
});

// =====================================================
// MOCK SUPABASE
// =====================================================
vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "USER123" } },
        })
      ),
    },
  },
}));

// =====================================================
// MOCK useBalance
// =====================================================
vi.mock("@/composables/useBalance", () => ({
  useBalance: () => ({
    balance: 100,
    loadBalance: vi.fn(),
  }),
}));

// =====================================================
// MOCK usePurchases
// =====================================================
const mockIsPurchased = vi.fn(() => false);
const mockMakePurchase = vi.fn(() =>
  Promise.resolve({ success: true, message: "Comprado", type: "success" })
);

vi.mock("@/composables/usePurchases", () => ({
  usePurchases: () => ({
    isPurchased: mockIsPurchased,
    purchaseItem: mockMakePurchase,
    purchaseTheme: vi.fn(),
    initialize: vi.fn(),
  }),
}));

// =====================================================
// MOCK ITEMS
// =====================================================
const mockItems = [
  { id: 1, type: "theme", name: "Tema 1" },
  { id: 2, type: "color", name: "Color 1" },
  { id: 3, type: "theme", name: "Tema 2" },
];

vi.mock("@/data/shopThemes.js", () => ({
  getItems: vi.fn(() => Promise.resolve(mockItems)),
  getFeaturedTheme: vi.fn(),
  getItemsByTheme: vi.fn(),
}));

// =====================================================
// STUBS — ShopItemCard dinámico
// =====================================================
const globalStubs = {
  Sidebar: { template: "<div></div>" },
  BalanceDisplay: { template: "<div></div>" },
  RechargeModal: { template: "<div></div>" },
  FilterBar: { template: "<div></div>" },
  TextureTester: { template: "<div></div>" },

  ShopItemCard: {
    props: ["item"],
    template: `<div class="stub-item">{{ item.name }}</div>`,
  },

  // ❗ NO stubeamos TransitionGroup (para que re-renderice)
};

// =====================================================
// TESTS
// =====================================================
describe("Shop.vue", () => {
  let wrapper;

  beforeEach(async () => {
    wrapper = mount(Shop, {
      global: { stubs: globalStubs },
    });

    await Promise.resolve();
    await Promise.resolve();
  });

  it("renderiza correctamente", () => {
    expect(wrapper.text()).toContain("Tienda");
  });

  it("carga correctamente los items", () => {
    expect(wrapper.findAll(".stub-item").length).toBe(3);
  });

  it("filtra items correctamente", async () => {
    wrapper.vm.currentFilter = "theme";
    await wrapper.vm.$nextTick();
    await new Promise((r) => setTimeout(r)); // 🔥 permite re-render

    const items = wrapper.findAll(".stub-item");
    expect(items.length).toBe(2);
  });

  it("muestra toast al recargar", async () => {
    wrapper.vm.showNotification("Recargaste", "success");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Recargaste");
  });

  it("bloquea compra sin usuario", async () => {
    const supabase = (await import("@/config/supabase")).supabase;

    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    });

    await wrapper.vm.purchaseItem({ id: 99 });

    expect(wrapper.text()).toContain("Necesitas iniciar sesión");
  });

  it("permite compra con usuario", async () => {
    await wrapper.vm.purchaseItem({ id: 1 });

    expect(mockMakePurchase).toHaveBeenCalled();
  });
});
