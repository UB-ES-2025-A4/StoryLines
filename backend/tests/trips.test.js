import { jest } from '@jest/globals';
import request from "supertest";
import app from "../src/app.js";

const VALID_TRIP = {
  id: "trip123",
  user_id: "user123",
  trip_name: "Viaje a Japón",
  description: "Increíble",
  cover_image: "https://img.com/cover.jpg",
  start_date: "2025-01-01",
  end_date: "2025-01-10",
  status: "published",
  users: {
    id: "user123",
    username: "tomi",
    display_name: "Tomi",
    user_color: "rgba(192,192,192,1)"
  }
};

const VALID_STOP = {
  trip_id: "trip123",
  city: "Tokyo",
  images: [],
  country: {
    id: "jp",
    name: "Japan",
    latitude: 35.6762,
    longitude: 139.6503
  }
};

jest.mock("../src/config/supabase.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "trips") {
        return {
          select: () => ({
            eq: () => ({
              then: undefined,
              finally: undefined,
              async then() {},
              async catch() {},
              data: [VALID_TRIP],
              error: null
            }),
            data: [VALID_TRIP],
            error: null
          })
        };
      }

      if (table === "trip_stops") {
        return {
          select: () => ({
            then: undefined,
            finally: undefined,
            async then() {},
            async catch() {},
            data: [VALID_STOP],
            error: null
          })
        };
      }

      return {
        select: () => ({
          data: [],
          error: null
        })
      };
    }
  }
}));

describe("GET /api/trips", () => {

  it("should return 200 and a list of formatted trips", async () => {
    const res = await request(app).get("/api/trips");

    console.log("TRIPS RESPONSE:", res.status, res.body);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(Array.isArray(res.body.trips)).toBe(true);
    expect(res.body.trips.length).toBeGreaterThan(0);

    const trip = res.body.trips[0];

    // Validar estructura básica
    expect(trip).toHaveProperty("id");
    expect(trip).toHaveProperty("userId");
    expect(trip).toHaveProperty("userName");
    expect(trip).toHaveProperty("userColor");
    expect(trip).toHaveProperty("tripName");
    expect(trip).toHaveProperty("coverImage");
    expect(trip).toHaveProperty("stops");
    expect(trip).toHaveProperty("startDate");
    expect(trip).toHaveProperty("endDate");
    expect(trip).toHaveProperty("description");

    // Validar stops
    expect(Array.isArray(trip.stops)).toBe(true);
    expect(trip.stops.length).toBeGreaterThan(0);

    const stop = trip.stops[0];
    expect(stop).toHaveProperty("country");
    expect(stop).toHaveProperty("city");
    expect(stop).toHaveProperty("lat");
    expect(stop).toHaveProperty("lng");
  });

});
