// tests/shopItems.test.js
import request from "supertest";
const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

describe("SHOP ITEMS API", () => {

  test("GET /api/shop/items → devuelve lista de fondos del espacio", async () => {
    global.__mockDB.shop_items = [
      {
        id: "space_bg_1",
        name: "Galaxy Nebula",
        description: "Fondo espacial con una nebulosa púrpura",
        type: "bg",
        price: 350,
        image_url: "nebula.png",
        texture_url: null,
        bg_url: "nebula_bg.png",
        is_default: false
      }
    ];

    const res = await request(app).get("/api/shop/items");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].id).toBe("space_bg_1");
    expect(res.body.items[0].type).toBe("bg");
    expect(res.body.items[0].name).toBe("Galaxy Nebula");
    expect(res.body.items[0].bgUrl).toBe("nebula_bg.png");
  });

  test("GET /api/shop/items/:id → devuelve fondo espacial específico", async () => {
    global.__mockDB.shop_items = [
      {
        id: "space_bg_42",
        name: "Cosmic Stars",
        description: "Fondo del espacio profundo con estrellas brillantes",
        type: "bg",
        price: 500,
        image_url: "stars.png",
        texture_url: null,
        bg_url: "stars_bg.png",
        is_default: false
      }
    ];

    const res = await request(app).get("/api/shop/items/space_bg_42");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(res.body.item.id).toBe("space_bg_42");
    expect(res.body.item.type).toBe("bg");
    expect(res.body.item.name).toBe("Cosmic Stars");
    expect(res.body.item.bgUrl).toBe("stars_bg.png");
  });

  test("GET /api/shop/items/:id → 404 si el fondo espacial no existe", async () => {
    global.__mockDB.shop_items = [];

    const res = await request(app).get("/api/shop/items/space_unknown");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

});
