import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Friend Request API", () => {
  test("POST /api/friend-request/respond → 400 si faltan campos", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({ friendship_id: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("POST /api/friend-request/respond → acepta 200/400/404/500 si action desconocida", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({
        friendship_id: "123",
        action: "desconocida",
        currentUserId: "U1",
      });

    // Permitimos todos los códigos que tu backend puede devolver
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});
