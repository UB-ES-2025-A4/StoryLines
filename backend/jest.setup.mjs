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
  return {
    _table: table,
    _filters: [],
    _or: null,
    _limit: null,

    /* ========================== SELECT ======================== */
    select: jest.fn().mockImplementation(function () {
      this._selectCalled = true;
      return this; // permite .eq(), .neq(), .order(), etc.
    }),

    /* ========================== WHERE ========================== */
    eq: jest.fn().mockImplementation(function (key, value) {
      this._filters.push({ key, value, type: "eq" });
      return this;
    }),

    neq: jest.fn().mockImplementation(function (key, value) {
      this._filters.push({ key, value, type: "neq" });
      return this;
    }),

    or: jest.fn().mockImplementation(function (expr) {
      this._or = expr;
      return this;
    }),

    limit: jest.fn().mockImplementation(function (n) {
      this._limit = n;
      return this;
    }),

    order: jest.fn().mockImplementation(function () {
      return this;
    }),

    /* ======================== EJECUCIÓN ======================== */
    async _run() {
      let data = [...(global.__mockDB[this._table] || [])];

      this._filters.forEach((f) => {
        if (f.type === "eq") data = data.filter((x) => x[f.key] == f.value);
        if (f.type === "neq") data = data.filter((x) => x[f.key] != f.value);
      });

      if (this._or) {
        const parts = this._or.split(",");
        data = data.filter((row) =>
          parts.some((rule) => {
            const [col, op, val] = rule.split(".");
            return op === "eq" && row[col] == val;
          })
        );
      }

      if (this._limit !== null) data = data.slice(0, this._limit);
      return data;
    },

    /* ========================== SINGLE ========================= */
    async single() {
      const data = await this._run();
      return { data: data[0] ?? null, error: null };
    },

    async maybeSingle() {
      const data = await this._run();
      return { data: data[0] ?? null, error: null };
    },

    /* ========================== SELECT-FINAL =================== */
    async then() {
      const data = await this._run();
      return { data, error: null };
    },

    /* ========================== INSERT ========================= */
    async insert(rows) {
      global.__mockDB[this._table].push(...rows);
      return { data: rows, error: null };
    },

    /* ========================== UPSERT ========================= */
    upsert: jest.fn().mockImplementation(function (rows) {
      const row = rows[0];
      const list = global.__mockDB[this._table];
      const idx = list.findIndex((e) => e.id === row.id);
      if (idx >= 0) list[idx] = row;
      else list.push(row);
      return this; // permite .select()
    }),

    /* ========================== UPDATE ========================= */
    async update(obj) {
      const list = global.__mockDB[this._table];
      const idx = list.findIndex((e) => e.id === obj.id);

      if (idx >= 0)
        list[idx] = { ...list[idx], ...obj };

      return { data: list[idx] ?? null, error: null };
    },

    /* ========================== DELETE ========================= */
    async delete() {
      let list = global.__mockDB[this._table];

      this._filters.forEach((f) => {
        list = list.filter((item) =>
          f.type === "eq"
            ? item[f.key] !== f.value
            : item[f.key] === f.value
        );
      });

      global.__mockDB[this._table] = list;
      return { data: null, error: null };
    },
  };
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
