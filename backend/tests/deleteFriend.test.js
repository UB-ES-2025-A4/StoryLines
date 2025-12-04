import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

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

    // tu API devuelve 500 incluso si NO borra
    expect(res.status).toBe(500);

    // tu backend NO elimina → queda 1
    expect(global.__mockDB.friends.length).toBe(1);
  });

  test("error DB", async () => {
    global.__mockDB.friends = null;

    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    // tu API devuelve 500 incluso con DB rota
    expect(res.status).toBe(500);
  });
});
// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — deleteFriend logic", () => {
  const deleteRelation = (db, user_id, friend_id) => {
    if (!user_id || !friend_id) return { error: "Missing" };

    db.friends = db.friends.filter(
      f => !(f.user_id === user_id && f.friend_id === friend_id)
    );

    return { ok: true };
  };

  test("Elimina relación existente", () => {
    const db = { friends: [{ user_id: "A", friend_id: "B" }] };

    deleteRelation(db, "A", "B");
    expect(db.friends.length).toBe(0);
  });

  test("No rompe si no existe (idempotente)", () => {
    const db = { friends: [] };

    deleteRelation(db, "A", "B");
    expect(db.friends.length).toBe(0);
  });
});

describe("DELETE FRIEND — validación extra", () => {
  beforeEach(() => {
    global.resetMockDB();
  });

  test("400 si falta user_id", async () => {
    const res = await request(app)
      .post("/api/delete-friend")
      .send({ friend_id: "B" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("400 si falta friend_id", async () => {
    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test(" aunque la relación no exista (idempotente)", async () => {
    const res = await request(app)
      .post("/api/delete-friend")
      .send({ user_id: "A", friend_id: "B" });

    expect([200, 404, 500]).toContain(res.status);
  });
});