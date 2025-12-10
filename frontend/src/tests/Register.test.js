import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import Register from "@/views/Register.vue";

// ---- MOCK ROUTER ----
const pushMock = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// ---- MOCK SUPABASE ----
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockSelect = vi.fn();

const mockFrom = vi.fn(() => ({
  select: () => ({
    eq: () => ({
      maybeSingle: mockSelect,
    }),
  }),
  insert: vi.fn(() => ({ error: null }))
}));

vi.mock("@/config/supabase", () => ({
  getSupabase: () =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignIn,
      },
      from: mockFrom,
    }),
}));

// ---- MOCK useBalance ----
vi.mock("@/composables/useBalance", () => ({
  useBalance: () => ({
    loadBalance: vi.fn(),
  }),
}));

// ---- GLOBAL MOCKS ----
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Register.vue", () => {

  it("renderiza el paso 1 correctamente", () => {
    const wrapper = mount(Register);
    expect(wrapper.find("form").exists()).toBe(true);
  });

  it("muestra error si los emails no coinciden", async () => {
    const wrapper = mount(Register);

    await wrapper.find("#email").setValue("a@a.com");
    await wrapper.find("#confirmEmail").setValue("b@a.com");
    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Los correos electrónicos no coinciden");
  });

  it("muestra error si las contraseñas no coinciden", async () => {
    const wrapper = mount(Register);

    await wrapper.find("#email").setValue("a@a.com");
    await wrapper.find("#confirmEmail").setValue("a@a.com");
    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("xxxxxxx");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Las contraseñas no coinciden");
  });

  it("avanza al paso 2 cuando las validaciones son correctas", async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });

    const wrapper = mount(Register);

    await wrapper.find("#email").setValue("a@a.com");
    await wrapper.find("#confirmEmail").setValue("a@a.com");
    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("Elige tu nombre de usuario");
  });

  it("finaliza el registro correctamente", async () => {
    vi.useFakeTimers(); // ← Activamos timers falsos

    mockSelect.mockResolvedValue({ data: null, error: null });

    mockSignUp.mockResolvedValue({
      data: { user: { id: "U1" } },
      error: null,
    });

    mockSignIn.mockResolvedValue({ error: null });

    const wrapper = mount(Register);

    // Paso 1
    await wrapper.find("#email").setValue("a@a.com");
    await wrapper.find("#confirmEmail").setValue("a@a.com");
    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    // Paso 2
    await wrapper.find("button.finish-btn").trigger("click");
    await flushPromises();

    // Se ejecuta el timeout de redirección
    vi.runAllTimers(); // ← ejecuta el setTimeout de 1500ms

    expect(mockSignUp).toHaveBeenCalled();
    expect(mockSignIn).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith("/api/default-items/U1");

    // Finalmente debe redirigir
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("guarda el Recordarme correctamente", async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });

    mockSignUp.mockResolvedValue({
      data: { user: { id: "U1" } },
      error: null,
    });

    mockSignIn.mockResolvedValue({ error: null });

    const wrapper = mount(Register);

    await wrapper.find("#email").setValue("test@test.com");
    await wrapper.find("#confirmEmail").setValue("test@test.com");
    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");

    await wrapper.find("#rememberMe").setValue(true);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    await wrapper.find("button.finish-btn").trigger("click");
    await flushPromises();

    expect(localStorage.getItem("rememberedEmail")).toBe("test@test.com");
    expect(localStorage.getItem("rememberMe")).toBe("true");
  });

});
