// tests/supabaseMock.mjs
import { jest } from "@jest/globals";

/* ============================================================
   RESET DB
============================================================ */
const TABLES = [
  "users",
  "friends",
  "notifications",
  "trips",
  "trip_stops",
  "shop_items",
  "user_balance",
  "user_items",
  "trip_likes",
  "trip_comments",
  "trip_saves",
  "countries",
];

global.__mockDB = {};
TABLES.forEach(t => global.__mockDB[t] = []);

global.__mockListUsers = [];

global.resetMockDB = () => {
  TABLES.forEach(t => global.__mockDB[t] = []);
  global.__mockListUsers = [];
};

/* ============================================================
   HELPERS
============================================================ */
function applyFilters(ctx, rows) {
  let data = [...rows];

  ctx.filters.forEach(f => {
    if (f.type === "eq") data = data.filter(r => r?.[f.column] == f.value);
    if (f.type === "neq") data = data.filter(r => r?.[f.column] != f.value);
    if (f.type === "in") data = data.filter(r => f.values.includes(r?.[f.column]));
  });

  if (ctx.orExpr) {
    const rules = ctx.orExpr.split(",").map(r => r.trim());
    data = data.filter(row =>
      rules.some(rule => {
        const [col, op, val] = rule.split(".");
        return op === "eq" && row?.[col] == val;
      })
    );
  }

  if (ctx.limit != null) data = data.slice(0, ctx.limit);

  if (ctx.orderBy) {
    const col = ctx.orderBy;
    const asc = ctx.orderAsc;
    data.sort((a, b) => {
      if (a?.[col] < b?.[col]) return asc ? -1 : 1;
      if (a?.[col] > b?.[col]) return asc ? 1 : -1;
      return 0;
    });
  }

  return data;
}

/* ============================================================
   EXECUTION
============================================================ */
async function exec(ctx) {
  const table = ctx.table;
  const store = global.__mockDB[table] || [];

  // SELECT
  if (ctx.action === "select") {
    let data = applyFilters(ctx, store);

    if (ctx.singleMode) return { data: data[0] ?? null, error: null };
    if (ctx.maybeSingleMode) return { data: data[0] ?? null, error: null };

    return { data, error: null };
  }

  // INSERT
  if (ctx.action === "insert") {
    const payload = Array.isArray(ctx.payload) ? ctx.payload : [ctx.payload];
    store.push(...payload);

    if (!ctx.returning) return { data: payload, error: null };

    let selected = applyFilters(ctx, payload);
    if (ctx.singleMode) selected = selected[0] ?? null;

    return { data: selected, error: null };
  }

  // UPDATE
  if (ctx.action === "update") {
    const updated = [];

    for (let row of store) {
      if (applyFilters(ctx, [row]).length > 0) {
        Object.assign(row, ctx.payload);
        updated.push(row);
      }
    }

    let data = updated;
    if (ctx.singleMode) data = data[0] ?? null;

    return { data, error: null };
  }

  // UPSERT
  if (ctx.action === "upsert") {
    const row = ctx.payload;
    const store = global.__mockDB[table];

    const idx = store.findIndex(r => r.id === row.id);
    if (idx >= 0) store[idx] = { ...store[idx], ...row };
    else store.push(row);

    let data = row;
    return { data, error: null };
  }

  // DELETE
  if (ctx.action === "delete") {
    const kept = [];
    const removed = [];

    for (let row of store) {
      if (applyFilters(ctx, [row]).length > 0) removed.push(row);
      else kept.push(row);
    }

    global.__mockDB[table] = kept;

    let data = removed;
    if (ctx.singleMode) data = data[0] ?? null;

    return { data, error: null };
  }

  return { data: null, error: null };
}

/* ============================================================
   QUERY BUILDER (NO THENABLES)
============================================================ */
function createQuery(table) {
  const ctx = {
    table,
    action: "select",
    payload: null,
    filters: [],
    returning: false,
    singleMode: false,
    maybeSingleMode: false,
    orExpr: null,
    limit: null,
    orderBy: null,
    orderAsc: true,
  };

  return {
    select() { ctx.action = "select"; return this; },

    eq(column, value) { ctx.filters.push({ type: "eq", column, value }); return this; },
    neq(column, value) { ctx.filters.push({ type: "neq", column, value }); return this; },
    in(column, values) { ctx.filters.push({ type: "in", column, values }); return this; },
    or(expr) { ctx.orExpr = expr; return this; },
    limit(n) { ctx.limit = n; return this; },
    order(col, { ascending = true } = {}) {
      ctx.orderBy = col;
      ctx.orderAsc = ascending;
      return this;
    },

    insert(payload) { ctx.action = "insert"; ctx.payload = payload; return this; },
    update(payload) { ctx.action = "update"; ctx.payload = payload; return this; },
    upsert(payload) { ctx.action = "upsert"; ctx.payload = payload[0]; return this; },
    delete() { ctx.action = "delete"; return this; },

    selectReturning() { ctx.returning = true; return this; },

    async single() { ctx.singleMode = true; return exec(ctx); },
    async maybeSingle() { ctx.maybeSingleMode = true; return exec(ctx); },
    async all() { return exec(ctx); },
    async exec() { return exec(ctx); },
  };
}

/* ============================================================
   MOCK MODULE
============================================================ */
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: {
    from: t => createQuery(t),
  },
  supabaseAdmin: {
    from: t => createQuery(t),

    storage: {
      from: () => ({
        upload: async () => ({ data: {}, error: null }),
        remove: async () => ({ data: {}, error: null }),
        getPublicUrl: (file) => ({ data: { publicUrl: "mock://" + file } })
      }),
    },

    auth: {
      admin: {
        listUsers: jest.fn().mockResolvedValue({
          data: { users: global.__mockListUsers },
          error: null
        }),
      },
    },
  },
}));

/* ============================================================
   LOAD APP
============================================================ */
const { default: app } = await import("./src/app.js");
global.__app = app;
