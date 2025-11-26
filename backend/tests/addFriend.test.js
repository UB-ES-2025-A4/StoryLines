import request from "supertest";

const app = global.__app;

beforeEach(() => global.resetMockDB());

describe("POST /api/add-friend", () => {
  test("debe devolver 400 si faltan campos", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/faltan/i);
  });

  test("debe insertar correctamente una relación", async () => {
    global.__mockDB.users.push(
      { id: "A", username: "userA" },
      { id: "B", username: "userB" }
    );

    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(global.__mockDB.friends.length).toBe(1);
    expect(global.__mockDB.friends[0].user_id).toBe("A");
    expect(global.__mockDB.friends[0].friend_id).toBe("B");
  });

  test("debe manejar errores simulados de la DB", async () => {
    // Simulamos error insertando undefined (mockInsert lo rompe)
    global.__mockDB.friends = null;

    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});
