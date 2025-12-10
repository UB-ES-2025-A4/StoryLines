import { render, fireEvent } from "@testing-library/vue";
import ShopItemCard from "@/components/Shop/ShopItemCard.vue";

describe("ShopItemCard.vue", () => {
  const mockItem = {
    id: "123",
    name: "Globo Azul",
    description: "Un globo bonito",
    price: 500,
    imageUrl: "https://example.com/globo.png",
    type: "globe"
  };

  test("renderiza correctamente la información del item", () => {
    const { getByText, getByAltText } = render(ShopItemCard, {
      props: { item: mockItem }
    });

    // Nombre
    expect(getByText("Globo Azul")).toBeTruthy();
    // Descripción
    expect(getByText("Un globo bonito")).toBeTruthy();
    // Precio
    expect(getByText("500")).toBeTruthy();
    // Imagen
    expect(getByAltText("Globo Azul")).toBeTruthy();
  });

  test("muestra el tipo mapeado correctamente (globe → Globo)", () => {
    const { getByText } = render(ShopItemCard, {
      props: { item: mockItem }
    });

    expect(getByText("Globo")).toBeTruthy();
  });

  test("muestra botón Comprar cuando isPurchased = false", () => {
    const { getByText } = render(ShopItemCard, {
      props: {
        item: mockItem,
        isPurchased: false
      }
    });

    expect(getByText("Comprar")).toBeTruthy();
  });

  test("muestra badge 'Comprado' cuando isPurchased = true", () => {
    const { getByText, queryByText } = render(ShopItemCard, {
      props: {
        item: mockItem,
        isPurchased: true
      }
    });

    expect(getByText("Comprado")).toBeTruthy();
    expect(queryByText("Comprar")).toBeNull();
  });

  test("emite 'purchase' con el item al hacer click en Comprar", async () => {
    const { getByText, emitted } = render(ShopItemCard, {
      props: {
        item: mockItem,
        isPurchased: false
      }
    });

    const btn = getByText("Comprar");
    await fireEvent.click(btn);

    expect(emitted().purchase).toBeTruthy();
    expect(emitted().purchase[0]).toEqual([mockItem]);
  });
});
