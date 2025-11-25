import { jest } from "@jest/globals";
import request from "supertest";

// 🧪 MOCK DE SUPABASE (base)
let insertMock = jest.fn(() => Promise.resolve({ data: {}, error: null }));

await jest.unstable_mockModule("../src/config/supabase.js", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: (...args) => insertMock(...args),
    }),
  },
}));

// Importar app DESPUÉS del mock
const app = (await import("../src/app.js")).default;

describe("POST /api/add-friend", () => {

  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ data: {}, error: null });
  });

  // ✔️ Caso OK
  it("should add a friend successfully", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        friend_id: "11111111-1111-4111-8111-111111111111",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  // ❌ Falta un campo → 400
  it("should return 400 when user_id is missing", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({
        friend_id: "11111111-1111-4111-8111-111111111111",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Faltan campos");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("should return 400 when friend_id is missing", async () => {
    const res = await request(app)
      .post("/api/add-friend")
      .send({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Faltan campos");
    expect(insertMock).not.toHaveBeenCalled();
  });

  // 💥 Simulación error interno → 500
  it("should return 500 if Supabase insert throws an error", async () => {
    insertMock.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
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
