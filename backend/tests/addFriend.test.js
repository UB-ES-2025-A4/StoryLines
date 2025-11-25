import { jest } from '@jest/globals';
import request from "supertest";
import app from "../src/app.js";

describe("POST /api/add-friend", () => {
  it("should add a friend successfully", async () => {
    const body = {
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      friend_id: "11111111-1111-4111-8111-111111111111",
    };

    const res = await request(app)
      .post("/api/add-friend")
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should return 400 if missing fields", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Faltan campos");
  });
});