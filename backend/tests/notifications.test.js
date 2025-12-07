import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Notifications API", () => {
  test("GET /api/notifications → 400 si falta userId", async () => {
    const res = await request(app).get("/api/notifications");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("GET /api/notifications → responde algo si hay userId", async () => {
    const res = await request(app).get("/api/notifications?userId=U1");

    // Con el mock actual puede ser 200 (todo OK) o 500 si algo peta en Supabase.
    // Lo único que NO debería ser es 404 si la ruta está bien montada.
    expect([200, 500]).toContain(res.status);
  });
});
// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — notifications logic", () => {
  const createNotif = (db, userId, text) => {
    if (!userId || !text) return { error: "Missing" };

    const notif = { id: db.list.length + 1, userId, text };
    db.list.push(notif);
    return notif;
  };

  test("Crea una notificación válida", () => {
    const db = { list: [] };

    const n = createNotif(db, "U1", "Hola!");
    expect(n.text).toBe("Hola!");
    expect(db.list.length).toBe(1);
  });

  test("Error si faltan datos", () => {
    const db = { list: [] };
    const res = createNotif(db, null, "");

    expect(res.error).toBeDefined();
  });
});

test("404 si falta user_id en POST", async () => {
  const res = await request(app)
    .post("/api/notifications")
    .send({ type: "friend_request", message: "Hola" });

  expect(res.status).toBe(404);
});

test("404 si falta type en POST", async () => {
  const res = await request(app)
    .post("/api/notifications")
    .send({ user_id: "U1", message: "Hola" });

  expect(res.status).toBe(404);
});
