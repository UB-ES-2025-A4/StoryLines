import request from "supertest";
import { jest } from "@jest/globals";

// ------------------------------------------------------------
// 1) IMPORTAR LA APP (Express, no server.js)
// ------------------------------------------------------------
import app from "./src/app.js";
global.__app = app;

// ------------------------------------------------------------
// 2) MOCK DB EN MEMORIA
// ------------------------------------------------------------
global.__mockDB = {
  users: [],
  friends: [],
  notifications: [],
  trips: [],
};

global.resetMockDB = () => {
  global.__mockDB.users = [];
  global.__mockDB.friends = [];
  global.__mockDB.notifications = [];
  global.__mockDB.trips = [];
  global.__mockListUsers = [];       // ← importante para tests de email
};

// ------------------------------------------------------------
// 3) MOCK listUsers (supabaseAdmin.auth.admin.listUsers)
// ------------------------------------------------------------
global.__mockListUsers = [];

const mockAuthAdmin = {
  listUsers: jest.fn().mockImplementation(async () => ({
    data: { users: global.__mockListUsers },
    error: null,
  })),
};

// ------------------------------------------------------------
// 4) MOCK GENÉRICO PARA .from(tabla)
// ------------------------------------------------------------
function mockTable(tableName) {
  return {
    select: jest.fn().mockImplementation(async () => {
      return { data: global.__mockDB[tableName] ?? [], error: null };
    }),

    insert: jest.fn().mockImplementation(async (rows) => {
      global.__mockDB[tableName].push(...rows);
      return { data: rows, error: null };
    }),

    upsert: jest.fn().mockImplementation(async (rows) => {
      const row = rows[0];
      const list = global.__mockDB[tableName];
      const idx = list.findIndex((x) => x.id === row.id);

      if (idx >= 0) list[idx] = row;
      else list.push(row);

      return { data: [row], error: null };
    }),

    delete: jest.fn().mockImplementation(async ({ eq }) => {
      const key = Object.keys(eq)[0];
      const val = eq[key];

      global.__mockDB[tableName] =
        global.__mockDB[tableName].filter((r) => r[key] !== val);

      return { data: null, error: null };
    }),

    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
}

// ------------------------------------------------------------
// 5) MOCK COMPLETO DE supabase y supabaseAdmin
// ------------------------------------------------------------
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: {
    from: (table) => mockTable(table),
  },

  supabaseAdmin: {
    from: (table) => mockTable(table),
    auth: {
      admin: mockAuthAdmin, // ← ahora sí funciona correctamente
    },
  },
}));
