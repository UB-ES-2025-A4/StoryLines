import request from "supertest";

const app = global.__app;

const VALID_ID_1 = "11111111-1111-4111-8111-111111111111";
const VALID_ID_2 = "22222222-2222-4222-8222-222222222222";
const VALID_ID_3 = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  global.resetMockDB();
});

describe("POST /api/profile", () => {

  // ------------------------------------------------------------
  // 1) Resolver userId desde email
  // ------------------------------------------------------------
  test("debe resolver id usando email si no se pasa userId", async () => {
    global.__mockDB.users.push({
      id: VALID_ID_1,
      email: "test@test.com",
      username: "olduser",
    });

    const res = await request(app)
      .post("/api/profile")
      .send({
        email: "test@test.com",
        username: "newname",
        display_name: "Nuevo",
        bio: "Hola",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const saved = global.__mockDB.users[0];
    expect(saved.username).toBe("newname");
  });

  // ------------------------------------------------------------
  // 2) Username ya existe → 409
  // ------------------------------------------------------------
  test("debe devolver 409 si username ya existe", async () => {
    global.__mockDB.users.push({
      id: VALID_ID_1,
      email: "a@a.com",
      username: "usuario1"
    });

    global.__mockDB.users.push({
      id: VALID_ID_2,
      email: "b@b.com",
      username: "repetido"
    });

    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID_1,
        username: "repetido",
        display_name: "Test",
        bio: "hola"
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya está en uso/i);
  });

  // ------------------------------------------------------------
  // 3) Actualizar perfil existente
  // ------------------------------------------------------------
  test("debe actualizar un perfil existente", async () => {
    global.__mockDB.users.push({
      id: VALID_ID_1,
      username: "old",
      display_name: "Viejo",
    });

    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID_1,
        username: "nuevoUsername",
        display_name: "NombreNuevo",
        bio: "BioNueva",
        avatar_url: "https://x.com/foto.png",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const updated = global.__mockDB.users[0];
    expect(updated.username).toBe("nuevoUsername");
    expect(updated.display_name).toBe("NombreNuevo");
    expect(updated.bio).toBe("BioNueva");
  });

  // ------------------------------------------------------------
  // 4) Falta username → 400
  // ------------------------------------------------------------
  test("debe devolver 400 si falta username", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID_1,
        display_name: "Test",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/usuario/i);
  });

  // ------------------------------------------------------------
  // 5) display_name demasiado largo
  // ------------------------------------------------------------
  test("display_name demasiado largo → 400", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID_1,
        username: "test123",
        display_name: "a".repeat(20),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/apodo inválido/i);
  });

  // ------------------------------------------------------------
  // 6) Bio demasiado larga
  // ------------------------------------------------------------
  test("bio supera el máximo → 400", async () => {
    const longBio = "x".repeat(200);

    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_ID_1,
        username: "test123",
        display_name: "Test",
        bio: longBio,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/biografía/i);
  });
});
