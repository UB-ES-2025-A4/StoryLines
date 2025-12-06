import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";

const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

describe("SHOP ITEMS API", () => {

  test("GET /api/shop/items/:id → devuelve fondo espacial específico", async () => {
    global.__mockDB.shop_items = [
      {
        id: "space_bg_42",
        name: "Cosmic Stars",
        description: "Fondo del espacio profundo con estrellas brillantes",
        type: "bg",
        price: 500,
        image_url: "stars.png",
        texture_url: "stars_texture.png",
        bg_url: null,
        is_default: false
      }
    ];

    const res = await request(app).get("/api/shop/items/space_bg_42");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(res.body.item.id).toBe("space_bg_42");
    expect(res.body.item.type).toBe("bg");
    expect(res.body.item.name).toBe("Cosmic Stars");
    expect(res.body.item.texture_url).toBe("stars_texture.png");
  });

  test("GET /api/shop/items/:id → 404 si el fondo espacial no existe", async () => {
    global.__mockDB.shop_items = [];

    const res = await request(app).get("/api/shop/items/space_unknown");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

});
