import { jest } from "@jest/globals";

/** ------------------------------------------------------------
 *   MOCK GENÉRICO DE UNA TABLA SUPABASE (completo y encadenable)
 * ------------------------------------------------------------*/
function createMockQuery(tableName) {

  const query = {
    _table: tableName,
    _filter: null,
    _or: null,

    select: jest.fn().mockImplementation(function () {
      return query;
    }),

    eq: jest.fn().mockImplementation(function (key, value) {
      query._filter = { key, value };
      return query;
    }),

    neq: jest.fn().mockImplementation(function () {
      return query;
    }),

    or: jest.fn().mockImplementation(function (value) {
      query._or = value;
      return query;
    }),

    single: jest.fn().mockImplementation(async function () {
      const data = global.__mockDB[tableName] ?? [];

      if (!query._filter) return { data: null, error: null };

      const row = data.find(r => r[query._filter.key] === query._filter.value) || null;
      return { data: row, error: null };
    }),

    insert: jest.fn().mockImplementation(async function (rows) {
      global.__mockDB[tableName].push(...rows);
      return { data: rows, error: null };
    }),

    update: jest.fn().mockImplementation(async function (row) {
      const list = global.__mockDB[tableName];
      const index = list.findIndex(r => r.id === row.id);

      if (index >= 0) list[index] = { ...list[index], ...row };
      return { data: row, error: null };
    }),

    delete: jest.fn().mockImplementation(async function () {
      const list = global.__mockDB[tableName];
      if (query._filter) {
        global.__mockDB[tableName] = list.filter(
          r => r[query._filter.key] !== query._filter.value
        );
      }
      return { data: null, error: null };
    }),

    then: undefined // muy importante para evitar promesas raras
  };

  return query;
}

/** -----------------------------
 *    MOCK COMPLETO DE SUPABASE
 * ----------------------------- */
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: {
    from: (table) => createMockQuery(table),
  },

  supabaseAdmin: {
    from: (table) => createMockQuery(table),
    auth: {
      admin: {
        listUsers: jest.fn().mockResolvedValue({
          data: { users: global.__mockListUsers },
          error: null,
        })
      }
    }
  }
}));

/** -----------------------------
 *  Cargar la app después del mock
 * ----------------------------- */
const { default: app } = await import("./src/app.js");
global.__app = app;

/** -----------------------------
 *   DB en memoria
 * ----------------------------- */
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
