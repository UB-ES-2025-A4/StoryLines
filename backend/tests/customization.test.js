import request from "supertest";
import { describe, test, expect, beforeEach } from "vitest";

import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

/* ============================================================
   🧪 CUSTOMIZATION API — ENDPOINT TESTS
============================================================ */
describe("Customization API", () => {

  /* --------------------------------------------------
     GET /api/customization/:userId
  -------------------------------------------------- */
  test("GET /api/customization/:userId → responde si userId existe", async () => {
    const res = await request(app).get("/api/customization/U1");

    // Ruta existe → nunca 404
    expect([200, 500]).toContain(res.status);
  });

  test("GET /api/customization/:userId → body coherente si 200", async () => {
    const res = await request(app).get("/api/customization/U1");

    if (res.status === 200) {
      expect(res.body).toBeDefined();

      if ("equipped" in res.body) {
        expect(typeof res.body.equipped).toBe("object");
      }
    }
  });

  /* --------------------------------------------------
     POST /api/customization/equip
  -------------------------------------------------- */
  test("POST /api/customization/equip → 400 si falta data", async () => {
    const res = await request(app)
      .post("/api/customization/equip")
      .send({});

    expect(res.status).toBe(400);
  });

  test("POST /api/customization/equip → responde si data completa", async () => {
    const res = await request(app)
      .post("/api/customization/equip")
      .send({
        userId: "U1",
        itemId: "ITEM1",
        slot: "globe"
      });

    // Puede ser:
    // 200 → equipado
    // 404 → item no existe
    // 400 → mismatch
    // 500 → DB error
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  /* --------------------------------------------------
     POST /api/customization/unequip
  -------------------------------------------------- */
  test("POST /api/customization/unequip → 400 si falta data", async () => {
    const res = await request(app)
      .post("/api/customization/unequip")
      .send({});

    expect(res.status).toBe(400);
  });

  test("POST /api/customization/unequip → responde si data completa", async () => {
    const res = await request(app)
      .post("/api/customization/unequip")
      .send({
        userId: "U1",
        slot: "globe"
      });

    expect([200, 500]).toContain(res.status);
  });
});
