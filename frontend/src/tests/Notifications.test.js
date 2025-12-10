// src/tests/Notifications.test.js
import { render, fireEvent, screen, waitFor } from "@testing-library/vue";
import Notifications from "@/components/Friends/Notifications.vue";
import { supabase } from "@/config/supabase";
// Utilidad para forzar a que se resuelvan todas las Promises pendientes
const flushPromises = () => new Promise(setImmediate);

// Mock de supabase en el mismo estilo que Messages.test.js
vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}));

// Helper para fechas
function isoAgo({ seconds = 0, minutes = 0, hours = 0, days = 0, weeks = 0 } = {}) {
  const diffMs =
    seconds * 1000 +
    minutes * 60 * 1000 +
    hours * 60 * 60 * 1000 +
    days * 24 * 60 * 60 * 1000 +
    weeks * 7 * 24 * 60 * 60 * 1000;

  const d = new Date(Date.now() - diffMs);
  return d.toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();

  // Por defecto: hay sesión
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "user-123" } } }
  });

  // Por defecto: una respuesta vacía de notificaciones
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ ok: true, notifications: [] })
  });
});

/* ------------------------------------------------------------------
   1) Carga normal: notificaciones, avatar, contador no leídas
------------------------------------------------------------------ */
test("carga notificaciones y emite el contador de no leídas", async () => {
  const updateSpy = vi.fn();

  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({
      ok: true,
      notifications: [
        {
          id: 1,
          type: "friend-approval",
          message: "Tienes una solicitud de amistad",
          created_at: isoAgo({ minutes: 10 }),
          read: false,
          sender: {
            display_name: "Juan",
            username: "juan",
            avatar_url: "/avatar-juan.png"
          },
          friendship_id: 42
        },
        {
          id: 2,
          type: "friend-accepted",
          message: "Han aceptado tu solicitud",
          created_at: isoAgo({ days: 1 }),
          read: true,
          sender: null
        }
      ]
    })
  });

  render(Notifications, {
    props: {
      isVisible: false,
      onUpdateNotificationCount: updateSpy
    }
  });

  // Se muestra la notificación
  await screen.findByText("Tienes una solicitud de amistad");

  // Se emite el contador de NO leídas (solo 1)
  await waitFor(() => {
    expect(updateSpy).toHaveBeenCalledWith(1);
  });

  // Hay avatar para la de tipo != "friend-accepted"
  const imgs = screen.getAllByRole("img");
  expect(imgs[0].src).toContain("/avatar-juan.png");

  // Para "friend-accepted" NO se renderiza avatar extra
  expect(imgs.length).toBe(1);
});

/* ------------------------------------------------------------------
   2) Lista vacía -> muestra mensaje "No tienes notificaciones."
------------------------------------------------------------------ */
test("muestra mensaje cuando no hay notificaciones", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({
      ok: true,
      notifications: []
    })
  });

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("No tienes notificaciones.");
});

/* ------------------------------------------------------------------
   3) Sin sesión de usuario -> no se llama a loadNotifications
------------------------------------------------------------------ */
test("no llama a loadNotifications cuando no hay sesión de supabase", async () => {
  supabase.auth.getSession.mockResolvedValueOnce({
    data: { session: null }
  });

  global.fetch = vi.fn(); // no debería usarse

  render(Notifications, { props: { isVisible: false } });

  await waitFor(() => {
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------
   4) formatDate: semanas, días, horas, minutos, segundos y 'justo ahora'
------------------------------------------------------------------ */
test("formatea fechas correctamente (semanas, días, horas, minutos, segundos y 'justo ahora')", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({
      ok: true,
      notifications: [
        {
          id: 1,
          type: "info",
          message: "Hace semanas",
          created_at: isoAgo({ weeks: 2 }),
          read: true,
          sender: {}
        },
        {
          id: 2,
          type: "info",
          message: "Hace días",
          created_at: isoAgo({ days: 3 }),
          read: true,
          sender: {}
        },
        {
          id: 3,
          type: "info",
          message: "Hace horas",
          created_at: isoAgo({ hours: 5 }),
          read: true,
          sender: {}
        },
        {
          id: 4,
          type: "info",
          message: "Hace minutos",
          created_at: isoAgo({ minutes: 10 }),
          read: true,
          sender: {}
        },
        {
          id: 5,
          type: "info",
          message: "Hace segundos",
          created_at: isoAgo({ seconds: 30 }),
          read: true,
          sender: {}
        },
        {
          id: 6,
          type: "info",
          message: "Ahora mismo",
          created_at: new Date().toISOString(),
          read: true,
          sender: {}
        }
      ]
    })
  });

  render(Notifications, { props: { isVisible: false } });

  // Esperamos que se pinten todas
  await screen.findByText("Hace semanas");
  await screen.findByText("Hace días");
  await screen.findByText("Hace horas");
  await screen.findByText("Hace minutos");
  await screen.findByText("Hace segundos");
  await screen.findByText("Ahora mismo");

  const texts = Array.from(
    document.querySelectorAll(".notification-card small")
  ).map((el) => el.textContent.trim());

  expect(texts).toEqual(
    expect.arrayContaining([
      "2 semanas",
      "3d",
      "5h",
      "10m",
      "30s",
      "justo ahora"
    ])
  );
});

/* ------------------------------------------------------------------
   5) Aceptar solicitud de amistad (data.ok = true)
------------------------------------------------------------------ */
test("acepta solicitud de amistad y recarga notificaciones", async () => {
  global.fetch = vi
    .fn()
    // 1ª llamada: loadNotifications inicial
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "friend-approval",
            message: "Tienes una solicitud",
            created_at: isoAgo({ minutes: 5 }),
            read: false,
            sender: { display_name: "Pepe", username: "pepe", avatar_url: "" },
            friendship_id: 99
          }
        ]
      })
    })
    // 2ª llamada: /friend-request/respond (accept)
    .mockResolvedValueOnce({
      json: async () => ({ ok: true })
    })
    // 3ª llamada: loadNotifications tras aceptar
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: []
      })
    });

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("Tienes una solicitud");
  await fireEvent.click(screen.getByText("Aceptar"));

  // 2ª llamada debe ser al endpoint de respond con acción "accept"
  const [, respondCall] = global.fetch.mock.calls;
  expect(respondCall[0]).toBe("/api/friend-request/respond");

  const body = JSON.parse(respondCall[1].body);
  expect(body).toMatchObject({
    friendship_id: 99,
    action: "accept",
    currentUserId: "user-123"
  });

  // Después de recargar, ya no hay notificaciones
  await screen.findByText("No tienes notificaciones.");
});

/* ------------------------------------------------------------------
   6) Rechazar solicitud de amistad (data.ok = true)
------------------------------------------------------------------ */
test("rechaza solicitud de amistad y recarga notificaciones", async () => {
  global.fetch = vi
    .fn()
    // 1ª: loadNotifications
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "friend-approval",
            message: "Otra solicitud",
            created_at: isoAgo({ minutes: 3 }),
            read: false,
            sender: { display_name: "Ana", username: "ana", avatar_url: "" },
            friendship_id: 123
          }
        ]
      })
    })
    // 2ª: respond (reject)
    .mockResolvedValueOnce({
      json: async () => ({ ok: true })
    })
    // 3ª: reload
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: []
      })
    });

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("Otra solicitud");
  await fireEvent.click(screen.getByText("Rechazar"));

  const [, respondCall] = global.fetch.mock.calls;
  expect(respondCall[0]).toBe("/api/friend-request/respond");

  const body = JSON.parse(respondCall[1].body);
  expect(body).toMatchObject({
    friendship_id: 123,
    action: "reject",
    currentUserId: "user-123"
  });

  await screen.findByText("No tienes notificaciones.");
});

/* ------------------------------------------------------------------
   7) acceptRequest: data.ok = false => no recarga
------------------------------------------------------------------ */
test("no recarga notificaciones si acceptRequest devuelve ok = false", async () => {
  global.fetch = vi
    .fn()
    // loadNotifications inicial
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "friend-approval",
            message: "Solicitud X",
            created_at: isoAgo({ minutes: 1 }),
            read: false,
            sender: { display_name: "X", username: "x", avatar_url: "" },
            friendship_id: 50
          }
        ]
      })
    })
    // respond con ok=false
    .mockResolvedValueOnce({
      json: async () => ({ ok: false })
    });

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("Solicitud X");
  await fireEvent.click(screen.getByText("Aceptar"));

  // Solo dos llamadas: loadNotifications + respond
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

/* ------------------------------------------------------------------
   8) rejectRequest: data.ok = false => no recarga
------------------------------------------------------------------ */
test("no recarga notificaciones si rejectRequest devuelve ok = false", async () => {
  global.fetch = vi
    .fn()
    // loadNotifications
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "friend-approval",
            message: "Solicitud Y",
            created_at: isoAgo({ minutes: 2 }),
            read: false,
            sender: { display_name: "Y", username: "y", avatar_url: "" },
            friendship_id: 77
          }
        ]
      })
    })
    // respond con ok=false
    .mockResolvedValueOnce({
      json: async () => ({ ok: false })
    });

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("Solicitud Y");
  await fireEvent.click(screen.getByText("Rechazar"));

  expect(global.fetch).toHaveBeenCalledTimes(2);
});

/* ------------------------------------------------------------------
   9) loadNotifications: error de red -> entra en catch
------------------------------------------------------------------ */
test("loadNotifications maneja errores de red sin romper", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

  render(Notifications, { props: { isVisible: false } });

  await waitFor(() => {
    expect(errorSpy).toHaveBeenCalled();
  });

  errorSpy.mockRestore();
});

/* ------------------------------------------------------------------
   10) watch isVisible: marca como leídas y recarga
------------------------------------------------------------------ */
test("cuando isVisible pasa a true marca como leídas y recarga", async () => {
  global.fetch = vi
    .fn()
    // 1ª: loadNotifications inicial
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "info",
            message: "Notif inicial",
            created_at: isoAgo({ minutes: 1 }),
            read: false,
            sender: {}
          }
        ]
      })
    })
    // 2ª: markAsRead
    .mockResolvedValueOnce({
      json: async () => ({ ok: true })
    })
    // 3ª: loadNotifications tras marcar
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: []
      })
    });

  const { rerender } = render(Notifications, {
    props: { isVisible: false }
  });

  // Se ha cargado una vez
  await screen.findByText("Notif inicial");
  expect(global.fetch).toHaveBeenCalledTimes(1);

  // Cambiamos isVisible -> true
  await rerender({ isVisible: true });

  await waitFor(() => {
    // Debe llamarse al endpoint de mark-read
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notifications/mark-read",
      expect.objectContaining({
        method: "POST"
      })
    );
    // Y una tercera vez para recargar notificaciones
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});

/* ------------------------------------------------------------------
   11) markAsRead: error de red -> catch
------------------------------------------------------------------ */
test("markAsRead maneja errores sin lanzar (sin console.error obligatorio)", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  // Mock de supabase con user
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "u1" } } }
  });

  // 1ª llamada → loadNotifications (montado)
  // 2ª llamada → markAsRead (watch)
  // Ambas deben fallar
  global.fetch = vi.fn(() => Promise.reject("ERR"));

  const { rerender } = render(Notifications, {
    props: { isVisible: false }
  });

  // Esperar a onMounted()
  await flushPromises();

  // 2) Cambiamos isVisible → TRUE → llama a markAsRead()
  await rerender({ isVisible: true });

  await flushPromises();

  // Se debe haber llamado al menos 1 vez a console.error
  expect(errorSpy).toHaveBeenCalled();

  // Debe haberse llamado 2 veces:
  // - loadNotifications en onMounted
  // - markAsRead al activar isVisible
  expect(global.fetch).toHaveBeenCalledTimes(3);

  errorSpy.mockRestore();
});



/* ------------------------------------------------------------------
   12) acceptRequest: error de red -> catch
------------------------------------------------------------------ */
test("acceptRequest maneja error de red en fetch", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  global.fetch = vi
    .fn()
    // loadNotifications inicial ok
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "friend-approval",
            message: "Error al aceptar",
            created_at: isoAgo({ minutes: 1 }),
            read: false,
            sender: {},
            friendship_id: 500
          }
        ]
      })
    })
    // respond falla
    .mockRejectedValueOnce(new Error("accept-fail"));

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("Error al aceptar");
  await fireEvent.click(screen.getByText("Aceptar"));

  await waitFor(() => {
    expect(errorSpy).toHaveBeenCalled();
  });

  errorSpy.mockRestore();
});

/* ------------------------------------------------------------------
   13) rejectRequest: error de red -> catch
------------------------------------------------------------------ */
test("rejectRequest maneja error de red en fetch", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  global.fetch = vi
    .fn()
    // loadNotifications inicial ok
    .mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        notifications: [
          {
            id: 1,
            type: "friend-approval",
            message: "Error al rechazar",
            created_at: isoAgo({ minutes: 1 }),
            read: false,
            sender: {},
            friendship_id: 700
          }
        ]
      })
    })
    // respond falla
    .mockRejectedValueOnce(new Error("reject-fail"));

  render(Notifications, { props: { isVisible: false } });

  await screen.findByText("Error al rechazar");
  await fireEvent.click(screen.getByText("Rechazar"));

  await waitFor(() => {
    expect(errorSpy).toHaveBeenCalled();
  });

  errorSpy.mockRestore();
});
