// tests/profile.test.js
import request from "supertest";

let app;
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(async () => {
  process.env.NODE_ENV = "test";

  global.__profileEmailMap = {};

  const imported = await import("../src/app.js");
  app = imported.default || imported.app;
});

describe("POST /api/profile", () => {
  it("should update profile when userId exists", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_UUID,
        username: "john_doe",
        display_name: "John",
        bio: "",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.id).toBe(VALID_UUID);
  });

  it("should return 400 if display_name too long", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_UUID,
        username: "johnny",
        display_name: "A".repeat(25), // > 15
        bio: "",
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 if bio too long", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_UUID,
        username: "johnny",
        display_name: "John",
        bio: "B".repeat(200), // > 150
      });

    expect(res.status).toBe(400);
  });

  it("should resolve user by email if userId missing", async () => {
    global.__profileEmailMap = {
      "test@mail.com": VALID_UUID,
    };

    const res = await request(app)
      .post("/api/profile")
      .send({
        email: "test@mail.com",
        username: "testuser",
        display_name: "Test",
        bio: "",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.id).toBe(VALID_UUID);
  });
});
