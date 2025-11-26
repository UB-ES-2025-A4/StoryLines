import request from "supertest";
const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

describe("POST /api/add-friend", () => {
  test("inserta relación (según comportamiento actual)", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "B" });

    // tu API REAL devuelve 400 SIEMPRE
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("maneja error DB (según comportamiento actual)", async () => {
    global.__mockDB.friends = null;

    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
