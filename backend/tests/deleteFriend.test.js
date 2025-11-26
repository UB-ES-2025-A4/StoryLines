import request from "supertest";

const app = global.__app;

beforeEach(() => global.resetMockDB());

describe("POST /api/delete-friend", () => {
  test("debe devolver 400 si faltan campos", async () => {
    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/faltan/i);
  });

  test("debe eliminar una relación existente", async () => {
    global.__mockDB.friends.push({
      id: "relX",
      user_id: "A",
      friend_id: "B"
    });

    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(global.__mockDB.friends.length).toBe(0);
  });

  test("debe ser idempotente (si no existe, igual ok)", async () => {
    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("debe manejar errores de DB", async () => {
    global.__mockDB.friends = null; // rompe delete()

    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});
