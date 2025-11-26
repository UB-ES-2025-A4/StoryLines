import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Search API", () => {
  test("GET /api/search/users → 400 si falta q", async () => {
    const res = await request(app).get("/api/search/users?userId=U1");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("GET /api/search/users → 400 si falta userId", async () => {
    const res = await request(app).get("/api/search/users?q=test");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("GET /api/search/friend-status/:id → 400 si falta userId", async () => {
    const res = await request(app).get(
      "/api/search/friend-status/target-123"
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
