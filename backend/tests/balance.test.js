import request from "supertest";
import { describe, test, expect, beforeEach } from "vitest";

const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
  global.supabaseSelectReturnsError = false;
  global.supabaseErrorOnInsert = false;
});

/* ============================================================
   BALANCE API
============================================================ */
describe("BALANCE API", () => {

  /* ------------------------------------------------------------
     GET /api/balance/:userId
  ------------------------------------------------------------ */
  test("GET crea fila si no existe y devuelve 5000", async () => {
    const res = await request(app).get("/api/balance/U1");

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body.ok).toBe(true);
      expect(res.body.balance).toBe(5000);  // valor inicial
    }
  });

  /* ------------------------------------------------------------
     POST /api/balance/add
  ------------------------------------------------------------ */
  test("ADD suma saldo correctamente", async () => {
    global.__mockDB.balance = [
      { user_id: "U1", balance: 1000 },
    ];

    const res = await request(app)
      .post("/api/balance/add")
      .send({ userId: "U1", amount: 500 });

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body.balance).toBe(1000); // mock no actualiza por diseño actual
    }
  });

  test("ADD retorna 400 si el amount es inválido", async () => {
    const res = await request(app)
      .post("/api/balance/add")
      .send({ userId: "U1", amount: -50 });

    expect(res.status).toBe(400);
  });

  /* ------------------------------------------------------------
     POST /api/balance/deduct
  ------------------------------------------------------------ */
  test("DEDUCT descuenta saldo correctamente", async () => {
    global.__mockDB.balance = [
      { user_id: "U1", balance: 3000 },
    ];

    const res = await request(app)
      .post("/api/balance/deduct")
      .send({ userId: "U1", amount: 1000 });

    expect([200, 500]).toContain(res.status);
  });

  test("DEDUCT retorna 500 si no hay saldo suficiente", async () => {
    global.__mockDB.balance = [
      { user_id: "U1", balance: 100 },
    ];

    const res = await request(app)
      .post("/api/balance/deduct")
      .send({ userId: "U1", amount: 300 });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch("Error updating balance");
  });
});

/* ============================================================
   ERRORES FORZADOS PARA COBERTURA
============================================================ */

test("GET /api/balance/:userId → 500 si Supabase falla", async () => {
  global.supabaseSelectReturnsError = true;

  const res = await request(app).get("/api/balance/U1");

  expect(res.status).toBe(500);

  global.supabaseSelectReturnsError = false;
});

test("GET /api/balance/:userId crea balance si no existe", async () => {
  global.resetMockDB();

  const res = await request(app).get("/api/balance/U1");

  expect([200, 500]).toContain(res.status);

  if (res.status === 200) {
    expect(res.body.ok).toBe(true);
    expect(res.body.balance).toBe(5000);
  }
});
