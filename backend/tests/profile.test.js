import { jest } from '@jest/globals';
import request from "supertest";
import app from "../src/app.js";


const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("POST /api/profile", () => {

  it("should update profile when userId exists", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_UUID,
        username: "john_doe",
        display_name: "John",
        bio: "Hello world!"
      });

    console.log("UPDATE PROFILE RESPONSE:", res.status, res.body);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should return 400 if username too short", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        userId: VALID_UUID,
        username: "a",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("3 y 15 caracteres");
  });

  it("should return 400 if missing userId and email", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({
        username: "validname",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Falta userId o email");
  });

  it("should resolve user by email if userId missing", async () => {
    const res = await request(app)
    .post("/api/profile")
    .send({
        email: "test@example.com",
        username: "testuser",
        display_name: "Test",       // <-- NECESARIO
        bio: "",                    // <-- opcional
        avatar_url: ""              // <-- opcional
    });


    console.log("EMAIL PROFILE RESPONSE:", res.status, res.body);

    expect(res.status).toBe(200);
  });

});
