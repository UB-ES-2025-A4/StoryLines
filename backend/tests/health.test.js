import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";


const app = global.__app;

describe("GET /api/health", () => {
  it("should respond with ok:true", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should include env and uptime", async () => {
    const res = await request(app).get("/api/health");

    expect(res.body).toHaveProperty("env");
    expect(res.body).toHaveProperty("uptime");

    // uptime debe ser un número
    expect(typeof res.body.uptime).toBe("number");
  });

  it("should return NODE_ENV = test durante los tests", async () => {
    const res = await request(app).get("/api/health");

    expect(res.body.env).toBe("test");
  });
});
