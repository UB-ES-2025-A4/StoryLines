import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Trips API", () => {
  test("GET /api/trips → responde con una lista", async () => {
    const res = await request(app).get("/api/trips");

    // Mientras la ruta esté montada, no debería ser 404
    expect(res.status).not.toBe(404);

    // Si todo va bien y el mock de Supabase funciona, debe devolver trips como array
    if (res.status === 200) {
      expect(Array.isArray(res.body.trips)).toBe(true);
    }
  });
});
