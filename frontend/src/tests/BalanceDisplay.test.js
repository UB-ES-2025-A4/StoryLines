import { render, fireEvent } from "@testing-library/vue";
import BalanceDisplay from "@/components/Shop/BalanceDisplay.vue";
import { vi } from "vitest";

// ---------------------------
// MOCK useBalance composable
// ---------------------------
vi.mock("@/composables/useBalance", () => ({
  useBalance: () => ({
    formattedBalance: "1.500"
  })
}));

describe("BalanceDisplay.vue", () => {
  test("muestra el balance formateado", () => {
    const { getByText } = render(BalanceDisplay);
    expect(getByText("1.500")).toBeTruthy();
  });

  test("renderiza el icono correctamente", () => {
    const { container } = render(BalanceDisplay);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("alt")).toBe("Créditos");
  });

  test("emite el evento click al hacer click", async () => {
    const { container, emitted } = render(BalanceDisplay);
    const div = container.querySelector(".balance-display");

    await fireEvent.click(div);

    expect(emitted().click).toBeTruthy();
    expect(emitted().click.length).toBe(1);
  });
});
