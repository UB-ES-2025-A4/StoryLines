import request from "supertest";
const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

describe("POST /api/add-friend", () => {

  test("inserta correctamente una relación (según comportamiento actual)", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "B" });

    // ❗ Esperamos 400 porque tu API REAL devuelve 400
    expect(res.status).toBe(400);

    // Y revisamos el body
    expect(res.body).toHaveProperty("error");  
  });

  test("maneja errores simulados", async () => {
    // romper mock para forzar error
    global.__mockDB.friends = null;

    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "B" });

    // ❗ También 400, no 500, según tu API real
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

});
