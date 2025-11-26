// tests/addFriend.test.js
import { jest } from "@jest/globals";
import request from "supertest";

await jest.unstable_mockModule("../src/config/supabase.js", () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: {}, error: null })
    }))
  }
}));

const app = (await import("../src/app.js")).default;

describe("POST /api/add-friend", () => {

  it("should add a friend successfully", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        friend_id: "11111111-1111-4111-8111-111111111111",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should return 400 if missing fields", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({}); // nada

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Faltan campos");
  });

  it("should return 500 if database fails", async () => {
    // Cambiamos el mock: ahora insert falla
    const mod = await import("../src/config/supabase.js");
    jest.spyOn(mod.supabaseAdmin, "from").mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "DB error" }
      })
    });

    const res = await request(app)
      .post("/api/add-friend")
      .send({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        friend_id: "11111111-1111-4111-8111-111111111111",
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("DB error");
  });
});
