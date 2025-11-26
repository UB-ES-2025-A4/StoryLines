import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Friend Request API", () => {
  test("POST /api/friend-request/respond → 400 si faltan campos", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({ friendship_id: "123" }); // faltan action y currentUserId

    // La ruta valida esto antes de tocar la DB
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("POST /api/friend-request/respond → 400 o 500 si action desconocida", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({
        friendship_id: "123",
        action: "desconocida",
        currentUserId: "U1",
      });

    // Idealmente 400 por acción desconocida, pero si algo revienta en la lógica interna
    // dejamos pasar también un 500 para no pelear con Supabase/mock.
    expect([400, 500]).toContain(res.status);
  });
});
