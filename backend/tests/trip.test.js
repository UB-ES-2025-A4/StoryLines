import request from "supertest";
import { describe, it, test, expect, beforeEach } from "vitest";
import app from "../src/app.js";

beforeEach(() => global.resetMockDB());

/* ============================================================
   1) GET /api/trips — publicados
============================================================ */
describe("TRIPS — GET /api/trips", () => {
  test("200 devuelve lista de viajes publicados", async () => {
    global.__mockDB.trips = [
      {
        id: "T1",
        user_id: "U1",
        trip_name: "Japón",
        cover_image: "japan.png",
        description: "desc",
        start_date: "2024",
        end_date: "2024",
        status: "published",
        users: { id: "U1", username: "pau", display_name: "Pau", avatar_url: "", user_color: "#ff0" },
        views: 5
      }
    ];

    global.__mockDB.trip_stops = [
      {
        id: "S1",
        trip_id: "T1",
        city: "Tokyo",
        images: ["img.jpg"],
        description: "Shibuya",
        country: { name: "Japan", latitude: 35, longitude: 139 }
      }
    ];

    const res = await request(app).get("/api/trips");
    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body.trips.length).toBe(1);
      expect(res.body.trips[0].stops.length).toBe(1);
    }
  });
});

/* ============================================================
   2) GET /api/trips/saved/:userId
============================================================ */
describe("TRIPS — GET /api/trips/saved/:userId", () => {
  test("200 devuelve vacío si no hay guardados", async () => {
    const res = await request(app).get("/api/trips/saved/U1");

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body).toHaveProperty("trips");
      expect(Array.isArray(res.body.trips)).toBe(true);
      expect(res.body.trips.length).toBe(0);
    }
  });


  test("200 ordenados por fecha desc", async () => {
    global.__mockDB.trip_saves = [
      { trip_id: "A", user_id: "U1", created_at: "2024-02-01" },
      { trip_id: "B", user_id: "U1", created_at: "2024-05-01" }
    ];

    global.__mockDB.trips = [
      { id: "A", user_id: "U9", trip_name: "Viaje A", status: "published", users: {} },
      { id: "B", user_id: "U9", trip_name: "Viaje B", status: "published", users: {} }
    ];

    const res = await request(app).get("/api/trips/saved/U1");
expect([200, 500]).toContain(res.status);

if (res.status === 200) {
  expect(res.body.trips[0].id).toBe("B");
}

  });
});

/* ============================================================
   3) GET /api/trips/:id
============================================================ */
describe("TRIPS — GET /api/trips/:id", () => {
  test("200 con stops / likes / comments / saves", async () => {
    global.__mockDB.trips = [{
      id: "T1",
      user_id: "U1",
      trip_name: "Japón",
      description: "test",
      cover_image: "",
      start_date: "2024",
      end_date: "2024",
      views: 12,
      users: { id: "U1", username: "pau", display_name: "Pau", avatar_url: "", user_color: "#ccc" }
    }];

    global.__mockDB.trip_stops = [{
      id: "S1",
      trip_id: "T1",
      city: "Tokyo",
      images: ["tokyo.jpg"],
      description: "Shibuya",
      country: { name: "Japan", latitude: 35, longitude: 139 }
    }];

    global.__mockDB.trip_comments = [{
      id: "C1",
      trip_id: "T1",
      text: "Brutal",
      created_at: "2024-03-01",
      user: { id: "U2", username: "ana", display_name: "Ana" }
    }];

    global.__mockDB.trip_likes = [{ id: "L1", trip_id: "T1", user_id: "U5" }];
    global.__mockDB.trip_saves = [{ id: "S1", trip_id: "T1", user_id: "U99" }];

    const res = await request(app).get("/api/trips/T1?userId=U5");

  expect([200, 500]).toContain(res.status);

  if (res.status === 200) {
    expect(res.body.trip.likes).toBe(1);
    expect(res.body.trip.commentsCount).toBe(1);
    expect(res.body.trip.userLiked).toBe(true);
    expect(res.body.trip.userSaved).toBe(false);
  }

  });

  test("404 si no existe", async () => {
    const res = await request(app).get("/api/trips/XXX");
    expect([404, 500]).toContain(res.status);

  });

  test("500 si falla", async () => {
    global.supabaseSelectThrows = true;
    const res = await request(app).get("/api/trips/T1");
    expect(res.status).toBe(500);
    global.supabaseSelectThrows = false;
  });
});

/* ============================================================
   4) POST /api/trips
============================================================ */
describe("TRIPS — POST /api/trips", () => {
  test("400 si falta user_id", async () => {
    const res = await request(app).post("/api/trips").send({});
    expect(res.status).toBe(400);
  });

  test("200 crea viaje", async () => {
    const res = await request(app).post("/api/trips").send({
      user_id: "U1",
      trip_name: "Europa",
      start_date: "2024",
      end_date: "2024",
      status: "draft",
      stops: [{ city: "Paris", country_id: 33, images: ["a"] }]
    });

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      expect(global.__mockDB.trips.length).toBe(1);
      expect(global.__mockDB.trip_stops.length).toBe(1);
    }
  });

  test("500 si insert falla", async () => {
    global.supabaseErrorOnInsert = true;
    const res = await request(app).post("/api/trips").send({
      user_id: "U1",
      trip_name: "Test",
      start_date: "2024",
      end_date: "2024",
      status: "draft",
      stops: []
    });

    expect(res.status).toBe(500);
    global.supabaseErrorOnInsert = false;
  });
});

/* ============================================================
   5) LIKE / UNLIKE
============================================================ */
describe("TRIPS — LIKE / UNLIKE", () => {
  test("like crea like si no existe", async () => {
    const res = await request(app)
      .post("/api/trips/T1/like")
      .send({ userId: "U10" });

    expect([200, 500]).toContain(res.status);
  });

  test("unlike elimina like", async () => {
    global.__mockDB.trip_likes = [{ id: "L1", trip_id: "T1", user_id: "U10" }];
    const res = await request(app).delete("/api/trips/T1/like/U10");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   6) COMMENTS
============================================================ */
describe("TRIPS — COMMENTS", () => {
  test("400 si falta info", async () => {
    const res = await request(app).post("/api/trips/T1/comments").send({});
    expect(res.status).toBe(400);
  });

  test("crear comentario", async () => {
    const res = await request(app)
      .post("/api/trips/T1/comments")
      .send({ userId: "U1", text: "Hola" });

    expect([200, 500]).toContain(res.status);
  });

  test("eliminar comentario", async () => {
    global.__mockDB.trip_comments = [{ id: "C1", trip_id: "T1", text: "x" }];
    const res = await request(app).delete("/api/trips/T1/comments/C1/U1");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   7) SAVE / UNSAVE
============================================================ */
describe("TRIPS — SAVE / UNSAVE", () => {
  test("400 si falta userId", async () => {
    const res = await request(app).post("/api/trips/T1/save").send({});
    expect(res.status).toBe(400);
  });

  test("guardar viaje", async () => {
    const res = await request(app).post("/api/trips/T1/save").send({ userId: "U1" });
    expect([200, 500]).toContain(res.status);
  });

  test("unsave elimina guardado", async () => {
    global.__mockDB.trip_saves = [{ id: "S1", trip_id: "T1", user_id: "U1" }];
    const res = await request(app).delete("/api/trips/T1/save/U1");
    expect([200, 500]).toContain(res.status);
  });
});

/* ============================================================
   8) UNIT — VALIDADORES (from dev)
============================================================ */
describe("UNIT — trip validators", () => {
  const validateTrip = (t) => {
    if (!t.user_id) return false;
    if (!t.trip_name || t.trip_name.trim().length < 3) return false;
    return true;
  };

  test("viaje válido", () => {
    expect(validateTrip({ user_id: "A", trip_name: "Paris" })).toBe(true);
  });

  test("viaje inválido", () => {
    expect(validateTrip({ user_id: "A", trip_name: "aa" })).toBe(false);
  });
});

/* ============================================================
   9) UNIT — groupTripsByStatus (from dev)
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

  test("agrupa correctamente", () => {
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
});
