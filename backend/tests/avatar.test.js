import request from "supertest";
import app from "../src/app.js";

beforeEach(() => {
  if (global.resetMockDB) global.resetMockDB();
});

describe("Avatar API", () => {
  test("POST /api/avatar/upload → 400 si faltan datos", async () => {
    // Sin body
    const res1 = await request(app).post("/api/avatar/upload").send({});
    expect(res1.status).toBe(400);
    expect(res1.body.error).toBeDefined();

    // Falta imageBase64
    const res2 = await request(app)
      .post("/api/avatar/upload")
      .send({ userId: "U1" });

    expect(res2.status).toBe(400);
    expect(res2.body.error).toBeDefined();
  });
});
