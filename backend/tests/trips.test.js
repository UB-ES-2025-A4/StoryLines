import { jest } from "@jest/globals";
import request from "supertest";

// ----------------------------------------
//  🔧 Mock básico de supabaseAdmin
// ----------------------------------------
jest.unstable_mockModule("../src/config/supabase.js", () => {
  return {
    supabaseAdmin: {
      from: (table) => ({
        select: () => ({
          eq: () => ({
            data: global.__mockData[table],
            error: global.__mockError[table] || null
          })
        })
      })
    }
  };
});

const loadApp = async () => {
  const appModule = await import("../src/app.js");
  return appModule.default;
};

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.FORCE_TRIPS_MOCK = "0";

  global.__tripsMockError = false;
  global.__tripsMockData = [
    { id: 1, trip_name: "Trip Test" }
  ];

  global.__mockData = {
    trips: null,
    trip_stops: null
  };

  global.__mockError = {
    trips: null,
    trip_stops: null
  };
});

// ==========================================================
//  🔹 TESTS MODO TEST
// ==========================================================
describe("GET /api/trips — test mode", () => {

  it("should return 500 if __tripsMockError is true", async () => {
    const app = await loadApp();
    global.__tripsMockError = true;

    const res = await request(app).get("/api/trips");
    expect(res.status).toBe(500);
  });

  it("should return mock trips array", async () => {
    const app = await loadApp();

    const res = await request(app).get("/api/trips");
    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(1);
    expect(res.body.trips[0].trip_name).toBe("Trip Test");
  });

});

// ==========================================================
//  🔹 TESTS MODO PRODUCCIÓN FALSIFICADA
// ==========================================================
describe("GET /api/trips — production mode (mock forced)", () => {

  const loadProdApp = async () => {
    process.env.NODE_ENV = "production";
    process.env.FORCE_TRIPS_MOCK = "1";
    jest.resetModules();
    global.__mockData.trips = null;
    global.__mockData.trip_stops = null;
    return loadApp();
  };

  it("should return 500 when trips fail", async () => {
    const app = await loadProdApp();

    global.__tripsMockError = true;

    const res = await request(app).get("/api/trips");
    expect(res.status).toBe(500);
  });

  it("should return formatted trips with multiple stops", async () => {
    const app = await loadProdApp();

    global.__tripsMockData = [
      {
        id: 10,
        user_id: 1,
        trip_name: "Test Trip",
        cover_image: null,
        start_date: "2024-01-01",
        end_date: "2024-01-10",
        description: "desc",
        users: {
          id: 1,
          display_name: "Nil",
          username: "nil",
          user_color: "red"
        }
      }
    ];

    global.__mockData = {
      trips: global.__tripsMockData,
      trip_stops: [
        {
          trip_id: 10,
          city: "Tokyo",
          images: [],
          country: { name: "Japan", latitude: 35, longitude: 139 }
        },
        {
          trip_id: 10,
          city: "Osaka",
          images: [],
          country: { name: "Japan", latitude: 35, longitude: 139 }
        }
      ]
    };

    const res = await request(app).get("/api/trips");

    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(1);

    const t = res.body.trips[0];
    expect(t.tripName).toBe("Test Trip");
    expect(t.stops.length).toBe(2);
    expect(t.stops[0].city).toBe("Tokyo");
    expect(t.stops[1].city).toBe("Osaka");
  });

  it("should return 500 when stops fail", async () => {
    const app = await loadProdApp();

    global.__tripsMockData = [
      { id: 1, trip_name: "Test Trip" }
    ];

    global.__mockData = {
      trips: global.__tripsMockData,
      trip_stops: null
    };

    global.__mockError = {
      trip_stops: { message: "Stops error" }
    };

    const res = await request(app).get("/api/trips");
    expect(res.status).toBe(500);
  });

});
