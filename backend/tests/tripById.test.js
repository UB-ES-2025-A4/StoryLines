import { jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";

describe("GET /api/trips/:id (TEST MODE)", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";

    global.__tripByIdMockError = false;
    global.__tripByIdMockData = {
      id: "trip123",
      trip_name: "Test Trip",
      description: "desc",
      cover_image: "img.png",
      start_date: "2025-01-01",
      end_date: "2025-01-03",
      comment: "hello!",
      stops: [
        {
          id: 1,
          city: "Tokyo",
          description: "stop 1",
          images: ["img1"],
          country_id: 1,
        },
      ],
    };
  });

  it("should return 500 if __tripByIdMockError is true", async () => {
    global.__tripByIdMockError = true;

    const res = await request(app).get("/api/trips/trip123");

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  it("should return 200 with null trip if __tripByIdMockData = null", async () => {
    global.__tripByIdMockData = null;

    const res = await request(app).get("/api/trips/trip123");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.trip).toBeNull();
  });

  it("should return 200 and trip data when ok", async () => {
    const res = await request(app).get("/api/trips/trip123");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.trip.id).toBe("trip123");
    expect(res.body.trip.comment).toBe("hello!");
    expect(res.body.trip.stops.length).toBe(1);
  });
});
