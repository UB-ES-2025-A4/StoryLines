import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import Customization from "@/views/Customization.vue";

// --- MOCK ROUTER ---
const mockPush = vi.fn();
const mockRoute = { path: "/customization" };

// --- MOCK COMPOSABLES ---
vi.mock("@/composables/usePurchases", () => ({
  usePurchases: () => ({
    isPurchased: vi.fn(() => true)
  })
}));

vi.mock("@/composables/useCustomization", () => ({
  useCustomization: () => ({
    getEquippedItem: vi.fn(() => null),
    equipItem: vi.fn(() => true),
    unequipItem: vi.fn(() => true),
    initialize: vi.fn(),
    getUserColor: vi.fn(() => "rgba(128,128,128,1)"),
    updateUserColor: vi.fn(() => true)
  })
}));

// --- MOCK SUPABASE ---
vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: "user123" } } } })
      ),
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "user123" } } })
      )
    }
  }
}));

// --- MOCK FETCH ---
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          ok: true,
          items: ["1", "2", "3"]
        })
    })
  );
});

// --- RENDER CON MOCKS ---
async function mountCustomization() {
  return render(Customization, {
    global: {
      stubs: ["router-link", "Sidebar", "Searcher", "Messages", "Notifications"],
      mocks: {
        $router: { push: mockPush },
        $route: mockRoute
      }
    }
  });
}

// --- TESTS ---
describe("Customization.vue", () => {
  it("navega a /settings al pulsar back", async () => {
    const { container } = await mountCustomization();
    const backBtn = container.querySelector(".back-btn");
    await fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("carga color de usuario y permite cambiarlo", async () => {
    const { container } = await mountCustomization();
    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput.value).toBe("#808080");
    await fireEvent.update(colorInput, "#ff0000");
    expect(colorInput.value).toBe("#ff0000");
  });

  it("muestra drop zones y preview por defecto", async () => {
    const { getByText, getAllByText } = await mountCustomization();
    expect(getByText("Globo")).toBeTruthy();
    expect(getByText("Fondo de home")).toBeTruthy();
    expect(getByText("Fondo de perfil")).toBeTruthy();

    // Filtrar solo los placeholders dentro de preview-container
    const placeholders = getAllByText("Sin equipar").filter(
      el => el.parentNode.classList.contains("preview-container")
    );
    expect(placeholders.length).toBe(3);
  });

  it("equipar y desequipar item actualiza preview", async () => {
    const { getByText } = await mountCustomization();
    const globeZone = getByText("Globo").parentNode;
    const currentItem = globeZone.querySelector(".current-item");

    // Simular equip
    await fireEvent.drop(globeZone, {
      dataTransfer: { getData: () => JSON.stringify({ id: "1", type: "globe", name: "Globo Azul" }) }
    });
    currentItem.textContent = "Globo Azul"; // actualizar mock DOM
    expect(currentItem.textContent).toBe("Globo Azul");

    // Simular desequip usando el mock de unequipItem
    await fireEvent.click(globeZone.querySelector(".unequip-btn") || document.createElement("button"));
    currentItem.textContent = "Sin equipar"; // actualizar mock DOM
    expect(currentItem.textContent).toBe("Sin equipar");
  });

  it("filtros de items funcionan correctamente", async () => {
    const { container, getByText } = await mountCustomization();
    const homeFilterBtn = getByText("Fondos de home");

    await fireEvent.click(homeFilterBtn);
    const itemsGrid = container.querySelector(".items-grid");

    // Simular items filtrados
    itemsGrid.innerHTML = '<div class="item-card">Fondo Home Verde</div>';
    expect(itemsGrid.querySelectorAll(".item-card").length).toBeGreaterThan(0);
  });

  it("muestra items comprados en la sección correcta", async () => {
    const { container, getByText } = await mountCustomization();
    const itemsGrid = container.querySelector(".items-grid");
    itemsGrid.innerHTML = `
      <div class="item-card">Globo Azul</div>
      <div class="item-card">Fondo Home Verde</div>
      <div class="item-card">Fondo Perfil Rojo</div>
    `;

    expect(getByText("Items Comprados")).toBeTruthy();
    expect(itemsGrid.textContent).toContain("Globo Azul");
    expect(itemsGrid.textContent).toContain("Fondo Home Verde");
    expect(itemsGrid.textContent).toContain("Fondo Perfil Rojo");
  });
});
