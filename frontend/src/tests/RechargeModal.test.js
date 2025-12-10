import { render, fireEvent } from "@testing-library/vue";
import RechargeModal from "@/components/Shop/RechargeModal.vue";
import { vi } from "vitest";

// ----------------------------
// MOCK useBalance()
// ----------------------------
vi.mock("@/composables/useBalance", () => ({
  useBalance: () => ({
    formattedBalance: "1.000",
    addBalance: vi.fn(() => true) // siempre devuelve success
  })
}));

// ----------------------------
// MOCK Teleport (lo desactivamos)
// ----------------------------
vi.stubGlobal("Teleport", (props, { slots }) => slots.default());

// ----------------------------

describe("RechargeModal.vue", () => {
  test("renderiza el modal cuando isOpen = true", () => {
    const { getByText } = render(RechargeModal, {
      props: { isOpen: true }
    });

    expect(getByText("Recargar Saldo")).toBeTruthy();
    expect(getByText("Saldo actual:")).toBeTruthy();
  });

  test("emite 'recharged' al pulsar recarga rápida (500)", async () => {
    const { getByText, emitted } = render(RechargeModal, {
      props: { isOpen: true }
    });

    const btn = getByText("+500");
    await fireEvent.click(btn);

    expect(emitted().recharged).toBeTruthy();
    expect(emitted().recharged[0]).toEqual([500]);
  });

  test("emite 'recharged' al pulsar recarga rápida (1000)", async () => {
    const { getByText, emitted } = render(RechargeModal, {
      props: { isOpen: true }
    });

    await fireEvent.click(getByText("+1.000"));

    expect(emitted().recharged).toBeTruthy();
    expect(emitted().recharged[0]).toEqual([1000]);
  });

  test("recarga personalizada válida emite 'recharged'", async () => {
    const { getByPlaceholderText, getByText, emitted } = render(RechargeModal, {
      props: { isOpen: true }
    });

    const input = getByPlaceholderText("Introduce cantidad");
    const btn = getByText("Añadir");

    await fireEvent.update(input, "250");
    await fireEvent.click(btn);

    expect(emitted().recharged).toBeTruthy();
    expect(emitted().recharged[0]).toEqual([250]);
  });

  test("no emite 'recharged' si la cantidad personalizada es inválida", async () => {
    const { getByPlaceholderText, getByText, emitted } = render(RechargeModal, {
      props: { isOpen: true }
    });

    const input = getByPlaceholderText("Introduce cantidad");
    const btn = getByText("Añadir");

    await fireEvent.update(input, "0");
    await fireEvent.click(btn);

    expect(emitted().recharged).toBeFalsy();
  });

  test("botón Cerrar emite 'close'", async () => {
    const { getByText, emitted } = render(RechargeModal, {
      props: { isOpen: true }
    });

    await fireEvent.click(getByText("Cerrar"));

    expect(emitted().close).toBeTruthy();
  });
});
