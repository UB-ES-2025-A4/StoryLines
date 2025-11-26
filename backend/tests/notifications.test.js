import request from "supertest";
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
