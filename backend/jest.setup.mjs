import { jest } from "@jest/globals";

/* ============================================================
   MEMORIA GLOBAL
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
   EJECUCIÓN DE FILTROS
   ============================================================ */
function runFilters(ctx) {
  let data = [...(global.__mockDB[ctx._table] || [])];

  ctx._filters.forEach(f => {
    if (f.type === "eq") data = data.filter(x => x[f.key] == f.value);
    if (f.type === "neq") data = data.filter(x => x[f.key] != f.value);
  });

  if (ctx._or) {
    const rules = ctx._or.split(",");
    data = data.filter(row => rules.some(rule => {
      const [col, op, val] = rule.split(".");
      return op === "eq" && row[col] == val;
    }));
  }

  if (ctx._limit != null) data = data.slice(0, ctx._limit);

  return data;
}

/* ============================================================
   QUERY BUILDER — EMULACIÓN COMPLETA DE SUPABASE
   ============================================================ */
function createQuery(table) {
  const ctx = {
    _table: table,
    _filters: [],
    _limit: null,
    _or: null,

    /* ========================================================
       SELECT
       ======================================================== */
    select(columns = "*") {
      const wrapper = {
        ctx,

        eq: (k, v) => { ctx._filters.push({ type: "eq", key: k, value: v }); return wrapper; },
        neq: (k, v) => { ctx._filters.push({ type: "neq", key: k, value: v }); return wrapper; },
        or: (expr) => { ctx._or = expr; return wrapper; },
        limit: (n) => { ctx._limit = n; return wrapper; },
        order: () => wrapper,

        async single() {
          const data = runFilters(ctx);
          return { data: data[0] ?? null, error: null };
        },

        async maybeSingle() {
          const data = runFilters(ctx);
          return { data: data[0] ?? null, error: null };
        },

        /* PROMESA REAL */
        then(resolve) {
          const data = runFilters(ctx);
          resolve({ data, error: null });
        }
      };

      return wrapper;
    },

    /* ========================================================
       INSERT
       ======================================================== */
    async insert(rows) {
      if (!global.__mockDB[this._table]) return { data: null, error: "DB error" };
      global.__mockDB[this._table].push(...rows);
      return { data: rows, error: null };
    },

    /* ========================================================
       UPDATE
       ======================================================== */
    async update(row) {
      const list = global.__mockDB[this._table] || [];
      const idx = list.findIndex(e => e.id === row.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...row };
        return { data: [list[idx]], error: null };
      }
      return { data: null, error: null };
    },

    /* ========================================================
       UPSERT
       ======================================================== */
    upsert(rows) {
      const row = rows[0];
      const list = global.__mockDB[this._table] || [];
      const idx = list.findIndex(r => r.id === row.id);

      if (idx >= 0) list[idx] = row;
      else list.push(row);

      return {
        select() {
          return {
            then(resolve) {
              resolve({ data: [row], error: null });
            }
          };
        }
      };
    },

    /* ========================================================
       DELETE
       ======================================================== */
    async delete() {
      let list = global.__mockDB[this._table] || [];

      if (ctx._filters.length > 0) {
        ctx._filters.forEach(f => {
          list = list.filter(row =>
            f.type === "eq"
              ? row[f.key] !== f.value
              : row[f.key] === f.value
          );
        });
      }

      global.__mockDB[this._table] = list;
      return { data: null, error: null };
    }
  };

  return ctx;
}

/* ============================================================
   MOCK SUPABASE COMPLETO
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
   CARGAR APP
   ============================================================ */
const { default: app } = await import("./src/app.js");
global.__app = app;
