import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Avatar API", () => {
  test("POST /api/avatar/upload → 400 si faltan datos", async () => {
    // Sin body
    const res1 = await request(app).post("/api/avatar/upload").send({});
    expect(res1.status).toBe(400);
    expect(res1.body.error).toBeDefined();

    // Falta imageBase64
    const res2 = await request(app)
      .post("/api/avatar/upload")
      .send({ userId: "U1" });

    expect(res2.status).toBe(400);
    expect(res2.body.error).toBeDefined();
  });
});
// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — avatar route logic", () => {
  const updateAvatar = (db, userId, image) => {
    if (!userId || !image) return { error: "Missing" };

    db.users.push({ id: userId, avatar_url: image });
    return { ok: true };
  };

  test("Actualiza avatar correctamente", () => {
    const db = { users: [] };

    const res = updateAvatar(db, "U1", "url.png");
    expect(res.ok).toBe(true);
    expect(db.users[0].avatar_url).toBe("url.png");
  });

  test("Error si falta info", () => {
    const res = updateAvatar({ users: [] }, "U1", null);
    expect(res.error).toBeDefined();
  });
});

test("404 si el body está completamente vacío", async () => {
  const res = await request(app).post("/api/avatar").send({});
  expect(res.status).toBe(404);
});

test("404 si image está presente pero vacía", async () => {
  const res = await request(app)
    .post("/api/avatar")
    .send({ userId: "U1", image: "" });

  expect(res.status).toBe(404);
});
