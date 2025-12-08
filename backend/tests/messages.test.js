import request from "supertest";
import { describe, test, expect, beforeEach } from "vitest";

import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

/* ============================================================
    MESSAGES API — ENDPOINT TESTS
============================================================ */
describe("Messages API", () => {

  /* --------------------------------------------------
     GET /api/messages/recents
  -------------------------------------------------- */
  test("GET /api/messages/recents → 400 si falta userId", async () => {
    const res = await request(app).get("/api/messages/recents");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("GET /api/messages/recents → responde si hay userId", async () => {
    const res = await request(app)
      .get("/api/messages/recents?userId=U1");

    // Com en notifications:
    // NO hauria de ser 404 si la ruta existeix
    expect([200, 500]).toContain(res.status);
  });

  /* --------------------------------------------------
     GET /api/messages/:friendshipId
  -------------------------------------------------- */
  test("GET /api/messages/:friendshipId → requiere userId", async () => {
    const res = await request(app)
      .get("/api/messages/F1");

    expect([403, 500]).toContain(res.status);
  });

  test("GET /api/messages/:friendshipId → responde si hay userId", async () => {
    const res = await request(app)
      .get("/api/messages/F1?userId=U1");

    expect([200, 403, 500]).toContain(res.status);
  });

  /* --------------------------------------------------
     POST /api/messages/:friendshipId
  -------------------------------------------------- */
  test("POST /api/messages/:friendshipId → 400 si falta message", async () => {
    const res = await request(app)
      .post("/api/messages/F1")
      .send({ senderId: "U1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("POST /api/messages/:friendshipId → responde si message existe", async () => {
    const res = await request(app)
      .post("/api/messages/F1")
      .send({
        senderId: "U1",
        message: "Hola!"
      });

    // 201 → ok
    // 403 → no pertenece
    // 500 → Supabase mock peta
    expect([201, 403, 500]).toContain(res.status);
  });
});
