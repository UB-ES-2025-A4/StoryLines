import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import Settings from "@/views/Settings.vue";

// --------------------
// 1. MOCKS FIJOS
// --------------------
vi.mock("@/components/Sidebar.vue", () => ({
  default: { template: "<div class='sidebar-stub'></div>" }
}));

const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock })
}));

global.alert = vi.fn();

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true })
  })
);

vi.mock("@/config/supabase", () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        signOut: vi.fn(),
        signInWithPassword: vi.fn(),
        updateUser: vi.fn()
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { username: "PauTest" }
              })
          })
        })
      })
    }
  };
});

// 💡 Importar supabase después del mock
import { supabase } from "@/config/supabase";

// --------------------
// 2. RESET ANTES DE CADA TEST
// --------------------
beforeEach(() => {
  vi.clearAllMocks();

  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "USER123", email: "test@mail.com" } } }
  });

  supabase.auth.signOut.mockResolvedValue({});
  supabase.auth.updateUser.mockResolvedValue({ error: null });
  supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
});

// --------------------
// 3. TESTS
// --------------------
describe("Settings.vue", () => {
  it("renderiza correctamente", async () => {
    const wrapper = mount(Settings);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find(".title").text()).toBe("Configuración");
  });

  it("abre y cierra sección cuenta", async () => {
    const wrapper = mount(Settings);

    expect(wrapper.vm.openSections.account).toBe(true);
    await wrapper.find(".section-header").trigger("click");
    expect(wrapper.vm.openSections.account).toBe(false);
    await wrapper.find(".section-header").trigger("click");
    expect(wrapper.vm.openSections.account).toBe(true);
  });

  it("cambia email correctamente", async () => {
    const wrapper = mount(Settings);

    wrapper.vm.newEmail = "nuevo@mail.com";
    wrapper.vm.confirmEmail = "nuevo@mail.com";

    await wrapper.vm.submitEmailChange();

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      email: "nuevo@mail.com"
    });

    expect(wrapper.vm.showEmailConfirmation).toBe(true);
  });

  it("bloquea cambio de email si no coinciden", async () => {
    const wrapper = mount(Settings);

    wrapper.vm.newEmail = "a@mail.com";
    wrapper.vm.confirmEmail = "b@mail.com";

    await wrapper.vm.submitEmailChange();

    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("cambia contraseña correctamente", async () => {
    const wrapper = mount(Settings);

    wrapper.vm.oldPassword = "111111";
    wrapper.vm.newPassword = "222222";
    wrapper.vm.confirmPassword = "222222";

    await wrapper.vm.submitPasswordChange();

    expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: "222222"
    });
  });

  it("logout funciona", async () => {
    const wrapper = mount(Settings);

    await wrapper.vm.handleLogout();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("elimina cuenta correctamente", async () => {
    const wrapper = mount(Settings);

    wrapper.vm.deletePassword = "123456";

    await wrapper.vm.deleteAccount();

    expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith("/api/users/USER123", {
      method: "DELETE"
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
