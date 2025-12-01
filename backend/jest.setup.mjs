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
   QUERY BUILDER COMPATIBLE CON SUPABASE
   ============================================================ */
function createQuery(table) {
  return {
    _table: table,
    _filters: [],
    _or: null,
    _limit: null,

    /* ========== SELECT ========== */
    select: jest.fn().mockImplementation(function () {
      return this;
    }),

    /* ========== WHERE ========== */
    eq: jest.fn().mockImplementation(function (key, value) {
      this._filters.push({ key, value, type: "eq" });
      return this;
    }),

    neq: jest.fn().mockImplementation(function (key, value) {
      this._filters.push({ key, value, type: "neq" });
      return this;
    }),

    or: jest.fn().mockImplementation(function (expr) {
      // ej: "user_id.eq.123,friend_id.eq.123"
      this._or = expr;
      return this;
    }),

    /* ========== LIMIT ========== */
    limit: jest.fn().mockImplementation(function (num) {
      this._limit = num;
      return this;
    }),

    /* ========== ORDER ========== */
    order: jest.fn().mockImplementation(function () {
      return this;
    }),

    /* ========== SINGLE RESULT ========== */
    single: jest.fn().mockImplementation(async function () {
      const data = applyFilters(this._table, this);
      return { data: data[0] ?? null, error: null };
    }),

    maybeSingle: jest.fn().mockImplementation(async function () {
      const data = applyFilters(this._table, this);
      return { data: data[0] ?? null, error: null };
    }),

    /* ========== SELECT RESULT ========== */
    then: undefined, // evita errores de promesa accidental

    /* ========== INSERTAR ========== */
    insert: jest.fn().mockImplementation(async function (rows) {
      global.__mockDB[this._table].push(...rows);
      return { data: rows, error: null };
    }),

    /* ========== UPSERT ========== */
    upsert: jest.fn().mockImplementation(async function (rows) {
      const row = rows[0];
      const list = global.__mockDB[this._table];
      const idx = list.findIndex((e) => e.id === row.id);

      if (idx >= 0) list[idx] = row;
      else list.push(row);

      return { data: [row], error: null };
    }),

    /* ========== UPDATE ========== */
    update: jest.fn().mockImplementation(async function (row) {
      const list = global.__mockDB[this._table];
      const idx = list.findIndex((e) => e.id === row.id);

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...row };
        return { data: [list[idx]], error: null };
      }
      return { data: null, error: null };
    }),

    /* ========== DELETE ========== */
    delete: jest.fn().mockImplementation(async function () {
      const list = global.__mockDB[this._table];

      if (this._filters.length > 0) {
        this._filters.forEach((f) => {
          global.__mockDB[this._table] =
            list.filter((item) =>
              f.type === "eq"
                ? item[f.key] !== f.value
                : item[f.key] === f.value
            );
        });
      }

      return { data: null, error: null };
    }),
  };
}

/* ============================================================
   HELPERS DE FILTRADO
   ============================================================ */
function applyFilters(table, ctx) {
  let data = [...global.__mockDB[table]];

  // eq / neq
  ctx._filters.forEach((f) => {
    if (f.type === "eq") data = data.filter((x) => x[f.key] == f.value);
    if (f.type === "neq") data = data.filter((x) => x[f.key] != f.value);
  });

  // or("a.eq.1,b.eq.2")
  if (ctx._or) {
    const parts = ctx._or.split(",");
    data = data.filter((row) => {
      return parts.some((rule) => {
        const [col, op, val] = rule.split(".");
        if (op === "eq") return row[col] == val;
        return false;
      });
    });
  }

  if (ctx._limit !== null) {
    data = data.slice(0, ctx._limit);
  }

  return data;
}

/* ============================================================
   MOCK SUPABASE (FINAL)
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
   CARGAR APP DESPUÉS DEL MOCK
   ============================================================ */
const { default: app } = await import("./src/app.js");
global.__app = app;
