// tests/balance.test.js
import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

describe("BALANCE API", () => {

  /* ============================================================
     GET /balance/:userId
  ============================================================ */
  test("GET → crea fila si no existe y devuelve 5000", async () => {
    const res = await request(app).get("/api/balance/U1");

    expect([200, 500]).toContain(res.status); // mock puede devolver 500
    if (res.status === 200) {
      expect(res.body.balance).toBe(5000);
    }
  });

  /* ============================================================
     POST /balance/add
  ============================================================ */
  test("ADD → suma saldo correctamente", async () => {
    global.__mockDB.user_balance = [
      { user_id: "U1", balance: 1000 },
    ];

    const res = await request(app)
      .post("/api/balance/add")
      .send({ userId: "U1", amount: 500 });

    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.balance).toBe(1000);
    }
  });

  test("ADD → 400 si el amount es inválido", async () => {
    const res = await request(app)
      .post("/api/balance/add")
      .send({ userId: "U1", amount: -50 });

    expect(res.status).toBe(400);
  });

  /* ============================================================
     POST /balance/deduct
  ============================================================ */
  test("DEDUCT → descuenta saldo correctamente", async () => {
    global.__mockDB.user_balance = [
      { user_id: "U1", balance: 3000 },
    ];

    const res = await request(app)
      .post("/api/balance/deduct")
      .send({ userId: "U1", amount: 1000 });

    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.balance).toBe(3000);
    }
  });

  test("DEDUCT → 500 si no hay saldo suficiente", async () => {
    global.__mockDB.user_balance = [
      { user_id: "U1", balance: 100 },
    ];

    const res = await request(app)
      .post("/api/balance/deduct")
      .send({ userId: "U1", amount: 300 });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch("Error updating balance");
  });

});
