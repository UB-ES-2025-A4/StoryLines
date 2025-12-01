import { jest } from "@jest/globals";

// ------------------------------------------------------------
// 1) Cargar la app Express REAL (no el server.js)
// ------------------------------------------------------------
import app from "./src/app.js";
global.__app = app;

// ------------------------------------------------------------
// 2) Mock DB en memoria
// ------------------------------------------------------------
global.__mockDB = {
  users: [],
  friends: [],
  notifications: [],
  trips: [],
};

global.resetMockDB = () => {
  global.__mockDB = {
    users: [],
    friends: [],
    notifications: [],
    trips: [],
  };

  global.__mockListUsers = [];
};

// ------------------------------------------------------------
// 3) Mock listUsers de supabaseAdmin.auth.admin
// ------------------------------------------------------------
global.__mockListUsers = [];

const mockAuthAdmin = {
  listUsers: jest.fn().mockResolvedValue({
    data: { users: global.__mockListUsers },
    error: null,
  }),
};

// ------------------------------------------------------------
// 4) Mock genérico de supabase.from(table)
// ------------------------------------------------------------
function mockTable(tableName) {
  return {
    select: jest.fn().mockResolvedValue({
      data: global.__mockDB[tableName] ?? [],
      error: null,
    }),

    insert: jest.fn().mockImplementation(async (rows) => {
      global.__mockDB[tableName].push(...rows);
      return { data: rows, error: null };
    }),

    upsert: jest.fn().mockImplementation(async (rows) => {
      const row = rows[0];
      const list = global.__mockDB[tableName];
      const index = list.findIndex((r) => r.id === row.id);

      if (index >= 0) list[index] = row;
      else list.push(row);

      return { data: [row], error: null };
    }),

    delete: jest.fn().mockImplementation(async (filter) => {
      const [[key, val]] = Object.entries(filter);
      global.__mockDB[tableName] = global.__mockDB[tableName].filter(
        (row) => row[key] !== val
      );
      return { data: null, error: null };
    }),

    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
}

// ------------------------------------------------------------
// 5) Mock completo de supabase.js
// ------------------------------------------------------------
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: {
    from: (table) => mockTable(table),
  },
  supabaseAdmin: {
    from: (table) => mockTable(table),
    auth: { admin: mockAuthAdmin },
  },
}));
