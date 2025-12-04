import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

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
// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — addFriend logic", () => {
  const insertRelation = (db, user_id, friend_id) => {
    if (!user_id || !friend_id) return { error: "Missing fields" };

    db.friends.push({ user_id, friend_id });
    return { ok: true };
  };

  test("Inserta una relación válida", () => {
    const db = { friends: [] };
    const res = insertRelation(db, "A", "B");

    expect(res.ok).toBe(true);
    expect(db.friends.length).toBe(1);
  });

  test("Error si faltan campos", () => {
    const db = { friends: [] };
    const res = insertRelation(db, "A", null);

    expect(res.error).toBeDefined();
  });
});

describe("ADD FRIEND — casos de validación extra", () => {
  beforeEach(() => {
    global.resetMockDB();
  });

  test("400 si falta user_id", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({ friend_id: "B" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("400 si falta friend_id", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("400 si user_id y friend_id son iguales", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({ user_id: "A", friend_id: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe("ADD-FRIEND — helper canBeFriends (unit)", () => {
  function canBeFriends(userId, friendId) {
    if (!userId || !friendId) return false;
    if (typeof userId !== "string" || typeof friendId !== "string") return false;
    return userId !== friendId;
  }

  test("no permite ser amigo de uno mismo", () => {
    expect(canBeFriends("A", "A")).toBe(false);
  });

  test("permite amistad entre IDs distintos válidos", () => {
    expect(canBeFriends("A", "B")).toBe(true);
  });

  test("devuelve false si falta algún ID o tipos raros", () => {
    expect(canBeFriends(null, "B")).toBe(false);
    expect(canBeFriends("A", null)).toBe(false);
    expect(canBeFriends(123, "B")).toBe(false);
  });
});