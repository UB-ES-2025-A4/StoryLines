import { jest } from "@jest/globals";

/* ============================================================
   BASE DE DATOS EN MEMORIA
   ============================================================ */
global.__mockDB = {
  users: [],
  friends: [],
  notifications: [],
  trips: [],
};

global.__mockListUsers = [];

global.resetMockDB = () => {
  global.__mockDB = {
    users: [],
    friends: [],
    notifications: [],
    trips: [],
  };
  global.__mockListUsers = [];
};

/* ============================================================
   QUERY BUILDER SUPABASE-COMPATIBLE
   ============================================================ */
function createQuery(table) {
  const ctx = {
    _table: table,
    _filters: [],
    _or: null,
    _limit: null,

    /* ========================================================
       SELECT — AHORA ACTÚA COMO PROMESA REAL
       ======================================================== */
    select(columns = "*") {
      this._select = columns;
      return {
        ctx: this,

        eq: (k, v) => { this._filters.push({ type:"eq", key:k, value:v }); return this; },
        neq: (k, v) => { this._filters.push({ type:"neq", key:k, value:v }); return this; },
        or: (expr) => { this._or = expr; return this; },
        limit: (n) => { this._limit = n; return this; },
        order: () => this,

        single: async () => {
          const data = runFilters(this);
          return { data: data[0] ?? null, error: null };
        },

        maybeSingle: async () => {
          const data = runFilters(this);
          return { data: data[0] ?? null, error: null };
        },

        /* PROMESA REAL: .then() → ejecuta query */
        then: (resolve) => {
          const data = runFilters(this);
          resolve({ data, error: null });
        }
      };
    },

    /* ========================================================
       INSERT / UPSERT / UPDATE / DELETE (sin cambios)
       ======================================================== */

    async insert(rows) {
      global.__mockDB[this._table].push(...rows);
      return { data: rows, error: null };
    },

    upsert(rows) {
      const row = rows[0];
      const list = global.__mockDB[this._table];
      const idx = list.findIndex((e) => e.id === row.id);
      if (idx >= 0) list[idx] = row;
      else list.push(row);
      return {
        select: () => ({
          then: (resolve) => resolve({ data: [row], error: null })
        })
      };
    },

    async update(row) {
      const list = global.__mockDB[this._table];
      const idx = list.findIndex((e) => e.id === row.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...row };
      return { data: [list[idx]], error: null };
    },

    async delete() {
      let list = global.__mockDB[this._table];
      this._filters.forEach((f) => {
        list = list.filter((item) =>
          f.type === "eq" ? item[f.key] !== f.value : item[f.key] === f.value
        );
      });
      global.__mockDB[this._table] = list;
      return { data: null, error: null };
    },
  };

  return ctx;
}

/* ============================================================
   EJECUCIÓN REAL DE FILTROS
   ============================================================ */
function runFilters(ctx) {
  let data = [...(global.__mockDB[ctx._table] || [])];

  ctx._filters.forEach((f) => {
    if (f.type === "eq") data = data.filter((x) => x[f.key] == f.value);
    if (f.type === "neq") data = data.filter((x) => x[f.key] != f.value);
  });

  if (ctx._or) {
    const parts = ctx._or.split(",");
    data = data.filter((row) =>
      parts.some((rule) => {
        const [col, op, val] = rule.split(".");
        return op === "eq" && row[col] == val;
      })
    );
  }

  if (ctx._limit !== null) data = data.slice(0, ctx._limit);

  return data;
}


/* ============================================================
   MOCK SUPABASE FINAL
   ============================================================ */
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: {
    from: (table) => createQuery(table),
  },
  supabaseAdmin: {
    from: (table) => createQuery(table),
    auth: {
      admin: {
        listUsers: jest.fn().mockResolvedValue({
          data: { users: global.__mockListUsers },
          error: null,
        }),
      },
    },
  },
}));

/* ============================================================
   IMPORTAR LA APP DESPUÉS DEL MOCK
   ============================================================ */
const { default: app } = await import("./src/app.js");
global.__app = app;
