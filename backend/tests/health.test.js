import { jest } from "@jest/globals";

import request from "supertest";
const app = (await import("../src/app.js")).default;

describe("GET /health", () => {

  it("should return ok: true and include env + uptime", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("env");     // no comparamos valor exacto
    expect(res.body).toHaveProperty("uptime");  // es dinámico
  });

  it("should handle unexpected errors gracefully", async () => {
    // 1. localizar la ruta montada en /health
    const layer = app._router.stack.find(
      (layer) =>
        layer.route === undefined &&        // es un router.use(...)
        layer.name === "router" &&          // express router
        layer.regexp?.toString().includes("\\/health")
    );

    expect(layer).toBeDefined();

    // 2. obtener la ruta interna GET "/"
    const inner = layer.handle.stack.find(
      (r) => r.route?.path === "/" && r.route?.methods.get
    );

    expect(inner).toBeDefined();

    const original = inner.route.stack[0].handle;

    // 3. sustituimos handler por error
    inner.route.stack[0].handle = () => {
      throw new Error("Simulated failure");
    };

    const res = await request(app).get("/health");

    // restauramos handler original
    inner.route.stack[0].handle = original;

    // la ruta debería enviar 500
    expect(res.status).toBe(500);
    expect(res.body).toEqual({});
  });
});
