import { jest } from "@jest/globals";

import request from "supertest";

process.env.NODE_ENV = "test";

// Mock de Supabase
jest.unstable_mockModule("../src/config/supabase.js", () => {
  return {
    supabaseAdmin: {
      from: (table) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          // Para delete y upload
          if (global.__avatarMock_fetchError) {
            return { data: null, error: { message: "fetch error" } };
          }
          return {
            data: { avatar_url: global.__avatarMock_existingUrl || null },
            error: null,
          };
        }),
        update: jest.fn().mockReturnThis(),
      }),

      storage: {
        from: () => ({
          upload: jest.fn().mockImplementation((file, buf) => {
            if (global.__avatarMock_uploadError) {
              return { error: { message: "upload error" } };
            }
            return { error: null };
          }),
          remove: jest.fn().mockResolvedValue({}),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: "https://example.com/new-avatar.png" },
          }),
        }),
      },
    },
  };
});

let app;
beforeAll(async () => {
  const imported = await import("../src/app.js");
  app = imported.default || imported.app;
});

// Reset global mocks before each test
beforeEach(() => {
  global.__avatarMock_fetchError = false;
  global.__avatarMock_existingUrl = null;
  global.__avatarMock_uploadError = false;
});

/* -----------------------------------------------------------
   📌 TESTS /upload
----------------------------------------------------------- */
describe("POST /api/avatar/upload", () => {
  it("should return 400 if missing fields", async () => {
    const res = await request(app)
      .post("/api/avatar/upload")
      .send({ userId: "u1" });

    expect(res.status).toBe(400);
  });

  it("should return 500 if fetch user fails", async () => {
    global.__avatarMock_fetchError = true;

    const res = await request(app)
      .post("/api/avatar/upload")
      .send({ userId: "u1", imageBase64: "aaa" });

    expect(res.status).toBe(500);
  });

  it("should return 500 if upload fails", async () => {
    global.__avatarMock_uploadError = true;

    const res = await request(app)
      .post("/api/avatar/upload")
      .send({ userId: "u1", imageBase64: "aaa" });

    expect(res.status).toBe(500);
  });

  it("should upload avatar successfully", async () => {
    global.__avatarMock_existingUrl = null;

    const res = await request(app)
      .post("/api/avatar/upload")
      .send({
        userId: "u1",
        imageBase64: "AAA",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.avatar_url).toBe("https://example.com/new-avatar.png");
  });
});

/* -----------------------------------------------------------
   📌 TESTS /delete
----------------------------------------------------------- */
describe("POST /api/avatar/delete", () => {
  it("should return 400 if missing userId", async () => {
    const res = await request(app)
      .post("/api/avatar/delete")
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 500 if fetch user fails", async () => {
    global.__avatarMock_fetchError = true;

    const res = await request(app)
      .post("/api/avatar/delete")
      .send({ userId: "u1" });

    expect(res.status).toBe(500);
  });

  it("should delete avatar when exists", async () => {
    global.__avatarMock_existingUrl = "https://old.com/old.png";

    const res = await request(app)
      .post("/api/avatar/delete")
      .send({ userId: "u1" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should work even if no previous avatar exists", async () => {
    global.__avatarMock_existingUrl = null;

    const res = await request(app)
      .post("/api/avatar/delete")
      .send({ userId: "u1" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
