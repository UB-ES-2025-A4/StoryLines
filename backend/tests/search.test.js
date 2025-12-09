import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

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

// ============================================================
// 🧪 TESTS UNITARIOS — VALIDACIÓN (sin backend, sin imports)
// ============================================================
describe("UNIT — search filtering", () => {
  const search = (list, q) => {
    if (!q) return [];
    const t = q.toLowerCase();
    return list.filter(u => u.username.toLowerCase().includes(t));
  };

  test("Encuentra coincidencias", () => {
    const users = [
      { username: "nil" },
      { username: "nilo" },
      { username: "pep" }
    ];

    const res = search(users, "ni");
    expect(res.length).toBe(2);
  });

  test("0 resultados si no coincide", () => {
    expect(search([{ username: "abc" }], "zz")).toHaveLength(0);
  });
});


test("404 si q es cadena vacía", async () => {
  const res = await request(app).get("/api/search?q=");
  expect(res.status).toBe((404));
});

test("404 si no encuentra nada pero q es válido", async () => {
  const res = await request(app).get("/api/search?q=usuarioqueNoExiste123");
  expect(res.status).toBe(404);
});

describe("SEARCH — helper filterUsersByQuery (unit)", () => {
  function filterUsersByQuery(users, q) {
    if (!Array.isArray(users)) return [];
    if (!q || typeof q !== "string") return [];
    const term = q.toLowerCase().trim();
    if (!term) return [];

    return users.filter((u) => {
      const username = (u.username || "").toLowerCase();
      const displayName = (u.display_name || "").toLowerCase();
      return username.includes(term) || displayName.includes(term);
    });
  }

  test("encuentra por username o display_name", () => {
    const list = [
      { id: "1", username: "Nil", display_name: "Nil" },
      { id: "2", username: "Pau_", display_name: "Pau E." },
      { id: "3", username: "maria3", display_name: "María" },
    ];

    const byUsername = filterUsersByQuery(list, "pau");
    expect(byUsername).toHaveLength(1);
    expect(byUsername[0].id).toBe("2");

    const byDisplayName = filterUsersByQuery(list, "maría");
    expect(byDisplayName).toHaveLength(1);
    expect(byDisplayName[0].id).toBe("3");
  });

  test("devuelve [] con entradas raras o vacías", () => {
    expect(filterUsersByQuery(null, "a")).toEqual([]);
    expect(filterUsersByQuery([], "a")).toEqual([]);
    expect(filterUsersByQuery([{ username: null }], "")).toEqual([]);
    expect(filterUsersByQuery([{ username: "test" }], 123)).toEqual([]);
  });
});