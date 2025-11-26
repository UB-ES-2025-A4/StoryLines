import { jest } from "@jest/globals";
import request from "supertest";

//
// ---------------------------------------------------------
// 1) MOCKS COMPLETOS DE SUPABASE (insert → select → single)
// ---------------------------------------------------------
//

let mockInsert;
let mockSelect;
let mockSingle;

await jest.unstable_mockModule("../src/config/supabase.js", () => {
  mockInsert = jest.fn();
  mockSelect = jest.fn();
  mockSingle = jest.fn();

  return {
    supabaseAdmin: {
      from: jest.fn((table) => {
        return {
          // INSERT (trip y stops)
          insert: mockInsert.mockReturnValue({
            select: () => ({
              single: mockSingle
            })
          }),

          // Para .select() en rutas que usen select sin insert
          select: mockSelect
        };
      })
    }
  };
});

//
// 2) IMPORTAR APP *DESPUÉS* DE MOCKEAR
//
let app;
beforeAll(async () => {
  const imported = await import("../src/app.js");
  app = imported.default;
});


//
// ---------------------------------------------------------
// 3) RESET DE MOCKS ANTES DE CADA TEST
// ---------------------------------------------------------
//
beforeEach(() => {
  jest.clearAllMocks();

  // Trip insert success → devuelve id 55
  mockSingle.mockResolvedValue({
    data: { id: 55 },
    error: null
  });

  // Stops insert success
  mockInsert.mockResolvedValue({
    data: {},
    error: null
  });
});


//
// ---------------------------------------------------------
// 4) TESTS
// ---------------------------------------------------------
//
describe("POST /api/trips — errores de validación", () => {

  it("400 si falta user_id", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({
        trip_name: "X",
        start_date: "2025-01-01",
        end_date: "2025-01-10",
        status: "published",
        stops: []
      });

    expect(res.status).toBe(400);
  });

  it("400 si falta trip_name", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({
        user_id: "u1",
        start_date: "2025-01-01",
        end_date: "2025-01-10",
        status: "published",
        stops: []
      });

    expect(res.status).toBe(400);
  });

  it("400 si faltan fechas", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({
        user_id: "u1",
        trip_name: "X",
        status: "published",
        stops: []
      });

    expect(res.status).toBe(400);
  });

  it("400 si no hay stops array", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({
        user_id: "u1",
        trip_name: "X",
        start_date: "2025-01-01",
        end_date: "2025-01-10",
        status: "published"
      });

    expect(res.status).toBe(400);
  });

});


//
// ---------------------------------------------------------
// 5) ÉXITO REAL: trip + stops
// ---------------------------------------------------------
//
describe("POST /api/trips — éxito", () => {

  it("should create trip + stops successfully", async () => {

    const res = await request(app)
      .post("/api/trips")
      .send({
        user_id: "u1",
        trip_name: "Viaje Test",
        cover_image: null,
        start_date: "2025-01-01",
        end_date: "2025-01-10",
        description: "desc",
        status: "published",
        stops: [
          {
            city: "Tokyo",
            country_id: 1,
            images: []
          },
          {
            city: "Osaka",
            country_id: 1,
            images: []
          }
        ]
      });

    // ✔ la ruta NO debe fallar
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.tripId).toBe(55);

    // ✔ insert inicial (trip)
    expect(mockInsert).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();

    // ✔ inserts de stops (2 veces)
    expect(mockInsert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

});


//
// ---------------------------------------------------------
// 6) Error al crear trip (primer insert error)
// ---------------------------------------------------------
//
describe("POST /api/trips — errores internos", () => {

  it("500 si falla insert del trip", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "insert trip error" }
    });

    const res = await request(app)
      .post("/api/trips")
      .send({
        user_id: "u1",
        trip_name: "X",
        start_date: "2025-01-01",
        end_date: "2025-01-10",
        status: "published",
        stops: []
      });

    expect(res.status).toBe(500);
  });

  it("500 si falla insert de un stop", async () => {
    mockInsert.mockResolvedValueOnce({ data: {}, error: null }); // trip ok
    mockSingle.mockResolvedValue({ data: { id: 77 }, error: null });

    mockInsert.mockResolvedValueOnce({
      data: null,
      error: { message: "stop error" }
    });

    const res = await request(app)
      .post("/api/trips")
      .send({
        user_id: "u1",
        trip_name: "X",
        start_date: "2025-01-01",
        end_date: "2025-01-10",
        status: "published",
        stops: [{ city: "Tokyo", country_id: 1 }]
      });

    expect(res.status).toBe(500);
  });

});
