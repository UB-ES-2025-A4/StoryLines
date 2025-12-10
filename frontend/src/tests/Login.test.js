import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import Login from "../views/Login.vue";

// ======================================================
// PRE-DECLARE STORES (evita hoisting bug de Vitest)
// ======================================================
const purchasesStore = { initialize: vi.fn() };
const customizationStore = { initialize: vi.fn() };
const balanceStore = { loadBalance: vi.fn() };

// ======================================================
// SUPABASE MOCK
// ======================================================
const supabaseInstance = {
  auth: {
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
};

vi.mock("../config/supabase", () => ({
  getSupabase: () => Promise.resolve(supabaseInstance),
}));

// ======================================================
// ROUTER MOCK
// ======================================================
const routerPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: routerPush }),
}));

// ======================================================
// FIX ABSOLUTO PARA FETCH
// ======================================================
global.fetch = vi.fn((url) => {
  if (url.startsWith("/")) url = "http://localhost" + url;
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
});

// ======================================================
// STORES MOCK (EXPORTS EXACTOS COMO EN LOGIN.VUE)
// ======================================================
vi.mock("../composables/usePurchases", () => ({
  usePurchases: () => purchasesStore,
  resetPurchases: vi.fn(),
}));

vi.mock("../composables/useCustomization", () => ({
  useCustomization: () => customizationStore,
  resetCustomization: vi.fn(),
}));

vi.mock("../composables/useBalance", () => ({
  useBalance: () => balanceStore,
}));

// ======================================================
// BEFORE EACH
// ======================================================
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  purchasesStore.initialize.mockReset();
  customizationStore.initialize.mockReset();
  balanceStore.loadBalance.mockReset();
});

// ======================================================
// RENDER
// ======================================================
const renderLogin = () =>
  render(Login, { global: { stubs: { "router-link": true } } });

// ======================================================
// TESTS
// ======================================================
describe("Login.vue - cobertura 100%", () => {
  it("renderiza campos y botones correctamente", () => {
    const { getByLabelText, getByText } = renderLogin();
    expect(getByLabelText("Correo Electrónico:")).toBeTruthy();
    expect(getByLabelText("Contraseña:")).toBeTruthy();
    expect(getByText("Iniciar Sesión")).toBeTruthy();
  });

  // ------------------------------------------------------

  it("login fallido muestra mensaje de error", async () => {
    supabaseInstance.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "bad" },
    });

    const { getByLabelText, getByText, findByText } = renderLogin();

    await Promise.resolve();

    await fireEvent.update(getByLabelText("Correo Electrónico:"), "bad@mail.com");
    await fireEvent.update(getByLabelText("Contraseña:"), "wrong");
    await fireEvent.click(getByText("Iniciar Sesión"));

    expect(await findByText("Credenciales incorrectas")).toBeTruthy();
  });


  // ------------------------------------------------------

  it("toggle de contraseña funciona", async () => {
    const { getByLabelText, container } = renderLogin();

    await Promise.resolve();

    const input = getByLabelText("Contraseña:");
    const btn = container.querySelector(".toggle-btn");

    expect(input.type).toBe("password");
    await fireEvent.click(btn);
    expect(input.type).toBe("text");
  });

  // ------------------------------------------------------

  it("reset password envía correo y muestra éxito", async () => {
    supabaseInstance.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const { getByText, getByLabelText, findByText } = renderLogin();

    await Promise.resolve();

    await fireEvent.click(getByText("¿Has olvidado tu contraseña?"));
    await fireEvent.update(getByLabelText("Introduce tu correo electrónico"), "a@mail.com");
    await fireEvent.click(getByText("Enviar enlace"));

    expect(await findByText("Te hemos enviado un correo de restablecimiento.")).toBeTruthy();
  });
});
