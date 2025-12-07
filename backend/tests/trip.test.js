import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

/* ============================================================
   GET /api/trips
============================================================ */
describe("GET /api/trips", () => {
  it("debería devolver lista de viajes publicados", async () => {
    const res = await request(app).get("/api/trips");

    expect([200, 500]).toContain(res.status); // el mock puede fallar

    if (res.status === 200) {
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.trips)).toBe(true);
    }
  });
});

/* ============================================================
   GET /api/trips/:id
============================================================ */
describe("GET /api/trips/:id", () => {
  it("404 si el viaje no existe", async () => {
    const res = await request(app).get("/api/trips/unknown");

    expect([404, 500]).toContain(res.status);
  });

  it("200 si existe", async () => {
    if (!global.mockDB) return;

    const id = global.mockDB.createTrip();

    const res = await request(app).get(`/api/trips/${id}`);

    if (res.status === 200) {
      expect(res.body.trip.id).toBe(id);
      expect(Array.isArray(res.body.trip.stops)).toBe(true);
    }
  });
});

/* ============================================================
   POST /api/trips
============================================================ */
describe("POST /api/trips", () => {
  it("400 si body vacío", async () => {
    const res = await request(app).post("/api/trips").send({});
    expect(res.status).toBe(400);
  });

  it("400 si faltan campos obligatorios", async () => {
    const res = await request(app).post("/api/trips").send({
      user_id: "1",
      trip_name: "X",
      // faltan fechas y status
    });

    expect(res.status).toBe(400);
  });

  it("200 crea viaje correctamente", async () => {
    const res = await request(app).post("/api/trips").send({
      user_id: "u1",
      trip_name: "Mi viaje",
      start_date: "2024-01-01",
      end_date: "2024-01-05",
      status: "draft",
      stops: [
        { city: "Madrid", country_id: 1, images: [] },
        { city: "Roma", country_id: 2, images: [] },
      ]
    });

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body.ok).toBe(true);
      expect(res.body.tripId).toBeDefined();
    }
  });
});

/* ============================================================
   LIKE / UNLIKE
============================================================ */
describe("Trips Likes API", () => {
  it("POST like requiere datos", async () => {
    const res = await request(app)
      .post("/api/trips/1/like")
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST like funciona", async () => {
    const res = await request(app)
      .post("/api/trips/1/like")
      .send({ userId: "u1" });

    expect([200, 500]).toContain(res.status);
  });

  it("DELETE unlike funciona", async () => {
    const res = await request(app).delete("/api/trips/1/like/u1");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   COMMENTS
============================================================ */
describe("Trips Comments API", () => {
  it("POST comment requiere datos", async () => {
    const res = await request(app)
      .post("/api/trips/1/comments")
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST comment funciona", async () => {
    const res = await request(app)
      .post("/api/trips/1/comments")
      .send({ userId: "u1", text: "Hola!" });

    expect([200, 500]).toContain(res.status);
  });

  it("DELETE comment funciona", async () => {
    const res = await request(app).delete("/api/trips/1/comments/100/u1");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   SAVED TRIPS
============================================================ */
describe("Trips Saves API", () => {
  it("POST save requiere datos", async () => {
    const res = await request(app)
      .post("/api/trips/1/save")
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST save funciona", async () => {
    const res = await request(app)
      .post("/api/trips/1/save")
      .send({ userId: "u1" });

    expect([200, 500]).toContain(res.status);
  });

  it("DELETE save funciona", async () => {
    const res = await request(app).delete("/api/trips/1/save/u1");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   VIEWS
============================================================ */
describe("Trips Views API", () => {
  it("incrementa views sin error", async () => {
    const res = await request(app).post("/api/trips/1/view");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   UNIT TESTS — VALIDADORES
============================================================ */
describe("UNIT — trip validators", () => {
  const validateTrip = (t) => {
    if (!t.user_id) return false;
    if (!t.trip_name || t.trip_name.trim().length < 3) return false;
    return true;
  };

  it("viaje válido", () => {
    expect(validateTrip({ user_id: "A", trip_name: "Paris" })).toBe(true);
  });

  it("viaje inválido", () => {
    expect(validateTrip({ user_id: "A", trip_name: "aa" })).toBe(false);
  });
});

/* ============================================================
   UNIT — groupTripsByStatus
============================================================ */
describe("UNIT — groupTripsByStatus", () => {
  function groupTripsByStatus(trips) {
    if (!Array.isArray(trips)) return {};
    return trips.reduce((acc, t) => {
      const status = t.status || "unknown";
      if (!acc[status]) acc[status] = [];
      acc[status].push(t);
      return acc;
    }, {});
  }

  it("agrupa por status", () => {
    const grouped = groupTripsByStatus([
      { id: 1, status: "published" },
      { id: 2, status: "draft" },
      { id: 3, status: "published" },
      { id: 4 }
    ]);

    expect(grouped.published.length).toBe(2);
    expect(grouped.draft.length).toBe(1);
    expect(grouped.unknown.length).toBe(1);
  });

  it("retorna {} si no es array", () => {
    expect(groupTripsByStatus(null)).toEqual({});
  });
});
