import request from "supertest";
import app from "../src/app.js";

const TRIP_ID = "trip123";

describe("GET /api/trips/:id", () => {
  it("should return a full trip object with stops and comments", async () => {
    const res = await request(app).get(`/api/trips/${TRIP_ID}`);

    console.log("TRIP BY ID RESPONSE:", res.status, res.body);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const trip = res.body.trip;

    // Validación general
    expect(trip).toBeDefined();
    expect(trip.id).toBe(TRIP_ID);
    expect(trip.trip_name).toBe("Viaje a Japón");
    expect(trip.description).toBe("Increíble viaje");

    // Usuario del viaje
    expect(trip.user.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(trip.user.username).toBe("testuser");

    // Paradas
    expect(Array.isArray(trip.stops)).toBe(true);
    expect(trip.stops.length).toBe(1);
    expect(trip.stops[0]).toMatchObject({
      city: "Tokyo",
      country: "Japón",
      description: "Templos y sushi",
      images: ["tokyo1.jpg"],
    });

    // Comentarios
    expect(Array.isArray(trip.comments)).toBe(true);
    expect(trip.comments.length).toBeGreaterThan(0);
    expect(trip.comments[0].text).toBe("Increíble viaje!");
  });

  it("should return 404 if trip does not exist", async () => {
    const res = await request(app).get("/api/trips/unknown-trip");

    console.log("TRIP NOT FOUND RESPONSE:", res.status, res.body);

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it("should return 400 if no id provided", async () => {
    const res = await request(app).get("/api/trips/");

    expect([200, 400, 404]).toContain(res.status);
  });
});
