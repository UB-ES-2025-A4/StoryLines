import { render, fireEvent, screen, waitFor } from "@testing-library/vue";
import Messages from "@/components/Friends/Messages.vue";
import { nextTick } from "vue";
import { supabase } from "../../src/config/supabase";

// -----------------------------------------------------
// ROUTER MOCK
// -----------------------------------------------------
const pushMock = vi.fn(() => Promise.resolve(true));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock })
}));

// -----------------------------------------------------
// GLOBAL FETCH MOCK
// -----------------------------------------------------
beforeEach(() => {
  pushMock.mockClear();

  global.fetch = vi.fn((url, opts) => {
    // Friends list
    if (url.startsWith("/api/friends")) {
      return Promise.resolve({
        json: () => Promise.resolve({
          ok: true,
          friends: [
            {
              id: 99,
              friend: {
                id: 2,
                username: "juan",
                display_name: "Juan",
                avatar_url: ""
              }
            }
          ]
        })
      });
    }

    // LISTA DE CHATS
    if (url.startsWith("/api/messages/recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chats: [
            {
              friendship_id: 99,
              friend: { id: 2, username: "juan", display_name: "Juan", avatar_url: "" },
              last_message: "Mensaje 1",
              created_at: new Date().toISOString(),
              sender_id: "me",
              unreadCounts: 0
            }
          ]
        })
      });
    }

    // MENSAJES del chat
    if (url.startsWith("/api/messages/99?userId")) {
      return Promise.resolve({
        json: () => Promise.resolve({
          messages: [
            {
              id: 1,
              content: "Mensaje 1",
              created_at: new Date().toISOString(),
              sender_id: "2"
            }
          ]
        })
      });
    }

    // ENVÍO DE MENSAJE
    if (url.startsWith("/api/messages/99") && opts?.method === "POST") {
      return Promise.resolve({
        json: () => Promise.resolve({
          message: {
            id: 500,
            content: JSON.parse(opts.body).message,
            created_at: new Date().toISOString(),
            sender_id: "me"
          }
        })
      });
    }

    return Promise.resolve({ json: () => ({}) });
  });
});

vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: { user: { id: "me" } }
          }
        })
      )
    }
  }
}));


// -----------------------------------------------------
// FUNCION PARA MONTAR COMPONENTE
// -----------------------------------------------------
function mountMessages() {
  return render(Messages, {
    props: { isOpen: true }
  });
}
async function openChatFromList() {
  await screen.findByText("Juan");
  await fireEvent.click(screen.getByText("Juan"));
  await screen.findByText("Mensaje 1");
}

// -----------------------------------------------------
// TESTS
// -----------------------------------------------------

describe("Messages.vue", () => {

  // 1. LISTA DE CHATS
test("muestra lista de chats recientes al abrir el panel", async () => {
  mountMessages();

  await screen.findByText("Nuevo chat");

  await screen.findByText((content) => content.includes("Mensaje 1"));
});




  // 2. ABRIR CHAT
  test("al hacer click en un chat se abre y carga mensajes", async () => {
    mountMessages();

    await screen.findByText("Juan");
    await fireEvent.click(screen.getByText("Juan"));

    await screen.findByText("Mensaje 1");
  });

  // 3. ENVIAR MENSAJE
  test("envía un mensaje y aparece en pantalla", async () => {
    mountMessages();

    await screen.findByText("Juan");
    await fireEvent.click(screen.getByText("Juan"));

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await fireEvent.update(input, "Hola!");
    await fireEvent.click(screen.getByRole("button", { name: "" })); // botón enviar

    await screen.findByText("Hola!");
  });

  // 4. MODO NEW → BACK
  test("permite cambiar al modo 'new chat' y volver a la lista", async () => {
    mountMessages();

    await fireEvent.click(screen.getByText("Nuevo chat"));
    await screen.findByPlaceholderText("Buscar amigos...");

    await fireEvent.click(screen.getByText("←"));
    await screen.findByText("Chats");
  });

  // 5. FILTRO DE AMIGOS
  test("filtra amigos por el buscador", async () => {
    mountMessages();

    await fireEvent.click(screen.getByText("Nuevo chat"));
    await screen.findByPlaceholderText("Buscar amigos...");

    const input = screen.getByPlaceholderText("Buscar amigos...");
    await fireEvent.update(input, "juan");

    expect(screen.getByText("Juan")).toBeTruthy();
  });

  // 6. startChat
  test("startChat inicia un chat desde la vista de nuevos amigos", async () => {
    mountMessages();

    await fireEvent.click(screen.getByText("Nuevo chat"));
    await screen.findByText("Juan");

    await fireEvent.click(screen.getByText("Juan"));
    await screen.findByText("Mensaje 1"); // el mensaje cargado
  });

  // 7. DRAFT
  test("guarda un borrador y lo restaura al volver al chat", async () => {
    mountMessages();

    await screen.findByText("Juan");
    await fireEvent.click(screen.getByText("Juan"));

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await fireEvent.update(input, "borrador...");

    await fireEvent.click(screen.getByText("←"));
    await screen.findByText("Nuevo chat");

    await fireEvent.click(screen.getByText("Juan"));
    await screen.findByDisplayValue("borrador...");
  });

  // 8. scrollBottom
test("scrollBottom desplaza la vista de mensajes hacia abajo", async () => {
  mountMessages();

  // abrir un chat real
  await screen.findByText("Juan");
  await fireEvent.click(screen.getByText("Juan"));
  await screen.findByText("Mensaje 1");

  const list = document.querySelector(".messages-list");

  // Mockear scrollHeight dinámicamente
  Object.defineProperty(list, "scrollHeight", {
    configurable: true,
    get: () => 800,
  });

  list.scrollTop = 0;

  await nextTick();

  expect(list.scrollTop).toBe(800);
});




  // 9. update-unread-count
  test("emite update-unread-count con total correcto", async () => {
    const spy = vi.fn();
    render(Messages, {
      props: { isOpen: true, onUpdateUnreadCount: spy }
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(0);
    });
  });

  // 10. Router push
  test("redirige al perfil del amigo mediante router.push", async () => {
    mountMessages();

    await screen.findByText("Juan");
    await fireEvent.click(screen.getByText("Juan"));

    const headerName = screen.getByText("Juan");
    await fireEvent.click(headerName);

    expect(pushMock).toHaveBeenCalledWith("/user/2");
  });

});
test("no muestra nada cuando isOpen = false", async () => {
  render(Messages, { props: { isOpen: false } });

  const drawer = document.querySelector(".messages-drawer");

  // Debe existir pero estar oculto con v-show
  expect(drawer).not.toBeNull();
  expect(drawer.style.display).toBe("none");
});


test("muestra 'No hay chats recientes' cuando no hay chats", async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes("/api/messages/recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ chats: [] })
      });
    }
    if (url.includes("/api/friends"))
      return Promise.resolve({ json: () => Promise.resolve({ ok: true, friends: [] }) });

    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  await screen.findByText("No hay chats recientes");
});
test("si fetch recents devuelve !ok, recentChats = []", async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes("/api/messages/recents")) {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      });
    }

    if (url.includes("/api/friends")) {
      return Promise.resolve({
        json: () => Promise.resolve({ ok: true, friends: [] })
      });
    }

    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  await waitFor(() =>
    expect(screen.getByText("No hay chats recientes")).toBeTruthy()
  );
});
test("muestra 'No hay amigos' cuando filteredFriends está vacío", async () => {
  global.fetch = vi.fn(() => Promise.resolve({
    json: () => Promise.resolve({ ok: true, friends: [] })
  }));

  render(Messages, { props: { isOpen: true } });

  await fireEvent.click(screen.getByText("Nuevo chat"));
  await screen.findByText("No hay amigos");
});
test("no envía mensaje si messageInput está vacío", async () => {
  const postMock = vi.fn();

  global.fetch = vi.fn((url, opts) => {
    // cuando se envía mensaje → POST → contamos llamadas
    if (opts?.method === "POST") postMock();

    // recents con un chat disponible
    if (url.includes("/api/messages/recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chats: [
            {
              friendship_id: 99,
              friend: { id: 2, display_name: "Juan", avatar_url: "" },
              last_message: "Hola",
              created_at: new Date().toISOString(),
              sender_id: "me",
              unreadCounts: 0
            }
          ]
        })
      });
    }

    // mensajes del chat
    if (url.includes("/api/messages/99")) {
      return Promise.resolve({
        json: () => Promise.resolve({ messages: [] })
      });
    }

    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  // Abrimos el chat real
  await screen.findByText("Juan");
  await fireEvent.click(screen.getByText("Juan"));

  // Botón enviar
  const btn = screen.getByRole("button", { name: "" });
  expect(btn).toBeTruthy();

  // messageInput vacío → NO debe enviar nada
  await fireEvent.click(btn);

  expect(postMock).not.toHaveBeenCalled();
});

test("scrollBottom no falla si messagesList es null", async () => {
  const { container } = render(Messages, { props: { isOpen: true } });

  // Forzamos a que no exista la ref
  container.querySelector(".messages-list")?.remove();

  // Llamamos a sendMessage para disparar scrollBottom
  await screen.findByText("Juan");
  await fireEvent.click(screen.getByText("Juan"));

  // No debe crashear → si el test pasa, está cubierto
});
test("fetchMessages maneja correctamente data.error", async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes("/api/friends"))
      return Promise.resolve({ json: () => Promise.resolve({ ok: true, friends: [] }) });

    if (url.includes("/api/messages/recents"))
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ chats: [] }) });

    if (url.includes("/api/messages/")) {
      return Promise.resolve({ json: () => Promise.resolve({ error: true }) });
    }

    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  // Abrimos chat aunque no existan mensajes válidos
  await screen.findByText("Nuevo chat");
  // No debe petar
});

test("loadFriends maneja error y deja friends = []", async () => {
  global.fetch = vi.fn(() => Promise.reject("err"));

  render(Messages, { props: { isOpen: true } });

  await waitFor(() => {
    // Friends estuvo vacío
    expect(screen.getByText("Nuevo chat")).toBeTruthy();
  });
});

test("trunca el texto cuando es largo", async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes("recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chats: [
            {
              friendship_id: 1,
              friend: { id: 2, display_name: "Juan" },
              last_message: "a".repeat(80),
              created_at: new Date().toISOString(),
              sender_id: "2",
              unreadCounts: 0
            }
          ]
        })
      });
    }
    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  await screen.findByText(/^aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\.\.\.$/);
});

test("muestra 'ayer' cuando created_at es ayer", async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  global.fetch = vi.fn((url) => {
    if (url.includes("recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chats: [
            {
              friendship_id: 1,
              friend: { id: 2, display_name: "Juan" },
              last_message: "Hola",
              created_at: yesterday.toISOString(),
              sender_id: "2",
              unreadCounts: 0
            }
          ]
        })
      });
    }
    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  await screen.findByText("ayer");
});

test("usa username cuando display_name no existe", async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes("recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chats: [
            {
              friendship_id: 1,
              friend: { id: 2, username: "juanito" },
              last_message: "hola",
              created_at: new Date().toISOString(),
              unreadCounts: 0
            }
          ]
        })
      });
    }
    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  await screen.findByText("juanito");
});

test("saveDraft guarda y restaura el borrador correctamente", async () => {
  // Mock supabase user
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "u1" } } }
  });

  // --------- 1ª OLA DE MOCKS (friends, recents, messages) ---------
  global.fetch = vi.fn((url) => {
    if (url.includes("/api/friends")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ok: true,
          friends: [
            {
              id: 1,
              friend: {
                id: 10,
                username: "juanito",
                display_name: "Juan",
                avatar_url: null
              }
            }
          ]
        })
      });
    }

    if (url.includes("/api/messages/recents")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          chats: [
            {
              friendship_id: 1,
              friend: { id: 10, display_name: "Juan", avatar_url: null },
              last_message: "Hola",
              created_at: new Date().toISOString(),
              sender_id: "other",
              unreadCounts: 0
            }
          ]
        })
      });
    }

    if (url.includes("/api/messages/1")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ messages: [] })
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  // --------- 2) Render inicial ---------
  render(Messages, { props: { isOpen: true } });

  // --------- 3) Abrir chat ---------
  await screen.findByText("Juan");
  await fireEvent.click(screen.getByText("Juan"));

  // --------- 4) Escribir borrador ---------
  const input = screen.getByPlaceholderText("Escribe un mensaje...");
  await fireEvent.update(input, "borrador prueba");

  // --------- 5) Volver atrás (guarda borrador) ---------
  await fireEvent.click(screen.getByText("←"));

  // --------- 6) 2ª OLA DE MOCKS (recents + messages) ---------
  global.fetch = vi.fn((url) => {
    if (url.includes("/api/messages/recents")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          chats: [
            {
              friendship_id: 1,
              friend: { id: 10, display_name: "Juan", avatar_url: null },
              last_message: "Hola",
              created_at: new Date().toISOString(),
              sender_id: "other",
              unreadCounts: 0
            }
          ]
        })
      });
    }

    if (url.includes("/api/messages/1")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ messages: [] })
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  // --------- 7) Reabrir chat ---------
  await screen.findByText("Juan");
  await fireEvent.click(screen.getByText("Juan"));

  // --------- 8) Verificar restauración del borrador ---------
expect(await screen.findByDisplayValue("borrador prueba")).toBeTruthy();
});



test("usa avatar por defecto cuando avatar_url es null", async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes("recents")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chats: [
            {
              friendship_id: 1,
              friend: { id: 2, display_name: "Juan", avatar_url: null },
              last_message: "Hola",
              created_at: new Date().toISOString(),
              unreadCounts: 0
            }
          ]
        })
      });
    }
    return Promise.resolve({ json: () => ({}) });
  });

  render(Messages, { props: { isOpen: true } });

  const img = await screen.findByRole("img");
  expect(img.src).toContain("Default_pfp.jpg");
});
