import { render, fireEvent, waitFor } from "@testing-library/vue";
import TextureTester from "@/components/Shop/TextureTester.vue";

// ---------- MOCK useCustomization ----------
const equipItemMock = vi.fn();

vi.mock("@/composables/useCustomization", () => ({
  useCustomization: () => ({
    equippedItems: { globe: "g1", homeBg: null, profileBg: "p1" },
    equipItem: equipItemMock,
    isEquipped: (id) => id === "g1" || id === "p1"
  })
}));

// ---------- MOCK getItems ----------
vi.mock("@/data/shopThemes", () => ({
  getItems: vi.fn()
}));

import { getItems } from "@/data/shopThemes";

describe("TextureTester.vue", () => {
  const mockItems = [
    { id: "g1", name: "Globo Azul", type: "globe", imageUrl: "g1.png" },
    { id: "g2", name: "Globo Rojo", type: "globe", imageUrl: "g2.png" },
    { id: "h1", name: "Home Azul", type: "homeBg", imageUrl: "h1.png" },
    { id: "h2", name: "Home Rosa", type: "homeBg", imageUrl: "h2.png" },
    { id: "p1", name: "Perfil Verde", type: "profileBg", imageUrl: "p1.png" }
  ];

  beforeEach(() => {
    equipItemMock.mockClear();
    getItems.mockResolvedValue(mockItems);
  });

  test("carga y muestra los items divididos por categoría", async () => {
    const { getByText } = render(TextureTester);

    await waitFor(() => {
      expect(getByText("Globo Azul")).toBeTruthy();
      expect(getByText("Home Azul")).toBeTruthy();
      expect(getByText("Perfil Verde")).toBeTruthy();
    });
  });

  test("muestra badge 'Equipado' según useCustomization", async () => {
    const { getAllByText } = render(TextureTester);

    await waitFor(() => {
      const badges = getAllByText("Equipado");
      expect(badges.length).toBe(2); // g1 y p1
    });
  });

  test("llama a equipItem al hacer click en un item", async () => {
    const { getByText } = render(TextureTester);

    await waitFor(() => getByText("Globo Rojo"));

    const item = getByText("Globo Rojo");
    await fireEvent.click(item);

    expect(equipItemMock).toHaveBeenCalledWith("g2", "globe");
  });

  test("emite 'close' al pulsar el botón cerrar", async () => {
    const { getByText, emitted } = render(TextureTester);

    const btn = getByText("Cerrar");
    await fireEvent.click(btn);

    expect(emitted().close).toBeTruthy();
  });

  // ❌ Eliminado: el componente NO renderiza mensajes de error
});
