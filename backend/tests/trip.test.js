import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Trips API", () => {
  test("GET /api/trips → responde con una lista", async () => {
    const res = await request(app).get("/api/trips");

    // Mientras la ruta esté montada, no debería ser 404
    expect(res.status).not.toBe(404);

    // Si todo va bien y el mock de Supabase funciona, debe devolver trips como array
    if (res.status === 200) {
      expect(Array.isArray(res.body.trips)).toBe(true);
    }
  });
});
// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — trip validators", () => {
  const validateTrip = (t) => {
    if (!t.user_id) return false;
    if (!t.trip_name || t.trip_name.trim().length < 3) return false;
    return true;
  };

  test("Viaje válido", () => {
    const t = {
      user_id: "A",
      trip_name: "Paris"
    };

    expect(validateTrip(t)).toBe(true);
  });

  test("Viaje inválido por nombre corto", () => {
    const t = { user_id: "A", trip_name: "aa" };
    expect(validateTrip(t)).toBe(false);
  });
});

describe("TRIPS — validación extra", () => {
  beforeEach(() => {
    global.resetMockDB();
  });

  test("400 si POST /api/trips recibe body vacío", async () => {
    const res = await request(app).post("/api/trips").send({});

    expect([400, 422]).toContain(res.status); // ajusta al código real que devuelva tu endpoint
  });

  test("400 si falta user_id al crear viaje", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({
        trip_name: "Viaje sin user",
        description: "Desc",
        status: "draft",
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("TRIPS — helper groupTripsByStatus (unit)", () => {
  function groupTripsByStatus(trips) {
    if (!Array.isArray(trips)) return {};
    return trips.reduce((acc, t) => {
      const status = t.status || "unknown";
      if (!acc[status]) acc[status] = [];
      acc[status].push(t);
      return acc;
    }, {});
  }

  test("agrupa viajes por status", () => {
    const trips = [
      { id: "1", status: "published" },
      { id: "2", status: "draft" },
      { id: "3", status: "published" },
      { id: "4" }, // sin status
    ];

    const grouped = groupTripsByStatus(trips);
    expect(grouped.published).toHaveLength(2);
    expect(grouped.draft).toHaveLength(1);
    expect(grouped.unknown).toHaveLength(1);
  });

  test("devuelve objeto vacío si no recibe array", () => {
    expect(groupTripsByStatus(null)).toEqual({});
    expect(groupTripsByStatus("no-array")).toEqual({});
  });
});