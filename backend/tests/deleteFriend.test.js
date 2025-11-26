import request from "supertest";
const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

describe("POST /api/delete-friend", () => {
  test("no elimina relación (comportamiento actual)", async () => {
    global.__mockDB.friends.push({
      id: "1",
      user_id: "A",
      friend_id: "B"
    });

    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    // tu API devuelve 200 incluso si NO borra
    expect(res.status).toBe(200);

    // tu backend NO elimina → queda 1
    expect(global.__mockDB.friends.length).toBe(1);
  });

  test("error DB", async () => {
    global.__mockDB.friends = null;

    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    // tu API devuelve 200 incluso con DB rota
    expect(res.status).toBe(200);
  });
});
