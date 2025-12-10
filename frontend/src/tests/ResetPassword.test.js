import { mount } from "@vue/test-utils";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ResetPassword from "@/views/ResetPassword.vue";

// ===============================
// DECLARAR PRIMERO LAS VARIABLES
// ===============================
let pushMock;
let signOutMock;
let updateUserMock;
let onAuthChangeMock;

// ===============================
// MOCK DE vue-router
// ===============================
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useRoute: () => ({
    query: {
      access_token: "TOKEN123",
    },
  }),
}));

// ===============================
// MOCK DE supabase (factory segura)
// ===============================
vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      updateUser: (...args) => updateUserMock(...args),
      signOut: (...args) => signOutMock(...args),
      onAuthStateChange: (...args) => onAuthChangeMock(...args),
    },
  },
}));

// ===============================
// RESET DE MOCKS ANTES DE CADA TEST
// ===============================
beforeEach(() => {
  pushMock = vi.fn();
  signOutMock = vi.fn();
  updateUserMock = vi.fn();
  onAuthChangeMock = vi.fn();

  localStorage.clear();
  vi.clearAllMocks();
});

vi.useFakeTimers();

// ===============================
// TESTS
// ===============================
describe("ResetPassword.vue", () => {

  test("renderiza correctamente", () => {
    const wrapper = mount(ResetPassword);
    expect(wrapper.find("button").exists()).toBe(true);
  });

  test("muestra error si las contraseñas no coinciden", async () => {
    const wrapper = mount(ResetPassword);

    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("99999999");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Las contraseñas no coinciden");
  });

  test("muestra error si la contraseña es demasiado corta", async () => {
    const wrapper = mount(ResetPassword);

    await wrapper.find("#password").setValue("123");
    await wrapper.find("#passwordConfirm").setValue("123");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("La contraseña debe tener al menos 8 caracteres");
  });

  test("muestra error si supabase devuelve error", async () => {
    updateUserMock.mockResolvedValue({ error: true });

    const wrapper = mount(ResetPassword);

    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Error al actualizar la contraseña");
  });

  test("actualiza correctamente y redirige", async () => {
    updateUserMock.mockResolvedValue({ error: null });

    const wrapper = mount(ResetPassword);

    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Contraseña actualizada correctamente");

    vi.runAllTimers();
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  test("Recordarme guarda en localStorage", async () => {
    updateUserMock.mockResolvedValue({ error: null });

    const wrapper = mount(ResetPassword);

    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");
    await wrapper.find("#rememberMe").setValue(true);
    await wrapper.find("form").trigger("submit");

    vi.runAllTimers();

    expect(localStorage.getItem("rememberedPassword")).toBe("12345678");
    expect(localStorage.getItem("rememberMe")).toBe("true");
  });

  test("Recordarme = false elimina datos", async () => {
    updateUserMock.mockResolvedValue({ error: null });

    localStorage.setItem("rememberedPassword", "oldpwd");
    localStorage.setItem("rememberMe", "true");

    const wrapper = mount(ResetPassword);

    await wrapper.find("#password").setValue("12345678");
    await wrapper.find("#passwordConfirm").setValue("12345678");
    await wrapper.find("#rememberMe").setValue(false);
    await wrapper.find("form").trigger("submit");

    vi.runAllTimers();

    expect(localStorage.getItem("rememberedPassword")).toBeNull();
    expect(localStorage.getItem("rememberMe")).toBeNull();
  });

  test("goToLogin llama signOut + redirect", async () => {
    const wrapper = mount(ResetPassword);

    await wrapper.find(".login-text").trigger("click");

    expect(signOutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

});
