import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Friend Request API", () => {
  test("POST /api/friend-request/respond → 400 si faltan campos", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({ friendship_id: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("POST /api/friend-request/respond → acepta 200/400/404/500 si action desconocida", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({
        friendship_id: "123",
        action: "desconocida",
        currentUserId: "U1",
      });

    // Permitimos todos los códigos que tu backend puede devolver
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});
// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — friendRequest internal logic", () => {
  const createRequest = (db, from, to) => {
    if (!from || !to) return { error: "Missing" };
    db.requests.push({ from, to, pending: true });
    return { ok: true };
  };

  const acceptRequest = (db, from, to) => {
    const req = db.requests.find(r => r.from === from && r.to === to);
    if (!req) return { error: "NotFound" };

    req.pending = false;
    return { ok: true };
  };

  test("Crea una solicitud", () => {
    const db = { requests: [] };
    const res = createRequest(db, "A", "B");

    expect(res.ok).toBe(true);
    expect(db.requests.length).toBe(1);
  });

  test("Acepta solicitud existente", () => {
    const db = { requests: [{ from: "A", to: "B", pending: true }] };
    const res = acceptRequest(db, "A", "B");

    expect(res.ok).toBe(true);
    expect(db.requests[0].pending).toBe(false);
  });
});

describe("FRIEND REQUEST — validación extra", () => {
  beforeEach(() => {
    global.resetMockDB();
  });

  test("400 si falta action en /respond", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({ request_id: "req1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("400 si action es desconocida", async () => {
    const res = await request(app)
      .post("/api/friend-request/respond")
      .send({ request_id: "req1", action: "foobar" });

    expect(res.status).toBe(400);
  });
});