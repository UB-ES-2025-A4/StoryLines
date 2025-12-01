import request from "supertest";
const app = global.__app;

const VALID_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  global.resetMockDB();
});

describe("PROFILE — VALIDATION EDGE CASES (según backend real)", () => {

  // ------------------------------------------------------------
  // USERNAME
  // ------------------------------------------------------------
  test("400 si username está vacío", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({ userId: VALID_ID, username: "" });

    expect(res.status).toBe(400);
  });

  test("200 si username contiene espacios (tu backend lo permite)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({ userId: VALID_ID, username: "hola mundo" });

    expect(res.status).toBe(200);
  });

  test("200 si username contiene caracteres no permitidos (tu backend no los valida)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({ userId: VALID_ID, username: "nil$$$" });

    expect(res.status).toBe(200);
  });

  test("400 si username demasiado largo (>15)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({ userId: VALID_ID, username: "a".repeat(20) });

    expect(res.status).toBe(400);
  });

  // ------------------------------------------------------------
  // DISPLAY NAME
  // ------------------------------------------------------------
  test("200 si display_name contiene emojis (tu backend los permite)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID,
        username: "nil",
        display_name: "Nil 😎",
      });

    expect(res.status).toBe(200);
  });

  test("200 si display_name es null (tu backend lo permite)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID,
        username: "nil",
        display_name: null,
      });

    expect(res.status).toBe(200);
  });

  test("400 si display_name supera los 16 caracteres", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID,
        username: "nil",
        display_name: "a".repeat(30),
      });

    expect(res.status).toBe(400);
  });

  // ------------------------------------------------------------
  // BIO
  // ------------------------------------------------------------
  test("200 si bio no es string (tu backend lo permite)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID,
        username: "nil",
        bio: 100,
      });

    expect(res.status).toBe(200);
  });

  test("400 si bio supera los 150 caracteres", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID,
        username: "nil",
        bio: "x".repeat(200),
      });

    expect(res.status).toBe(400);
  });

  // ------------------------------------------------------------
  // EMAIL
  // ------------------------------------------------------------
  test("400 si email no es string", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        email: 123,
        username: "nil",
      });

    expect(res.status).toBe(400);
  });

  test("404 si email no existe en DB", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        email: "noexiste@mail.com",
        username: "nil",
      });

    expect(res.status).toBe(404);
  });

  // ------------------------------------------------------------
  // USER ID
  // ------------------------------------------------------------
  test("400 si userId es inválido (no UUID)", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({ userId: "123", username: "nil" });

    expect(res.status).toBe(400);
  });

  // ------------------------------------------------------------
  // INVALID JSON
  // ------------------------------------------------------------
  test("400 si el body es completamente vacío", async () => {
    const res = await request(app).post("/api/profile").send({});

    expect(res.status).toBe(400);
  });
});
