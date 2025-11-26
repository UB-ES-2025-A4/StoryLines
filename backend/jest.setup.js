// jest.setup.js
import { jest } from "@jest/globals";

process.env.NODE_ENV = "test";

let supabaseTables = {};

// Permite a los tests modificar tablas mockeadas
export function __setSupabaseTableMock(table, value) {
  supabaseTables[table] = value;
}

// Generador de un query builder compatible con Supabase
function buildMockQuery(table) {
  const resolve = () => {
    const entry = supabaseTables[table] || {};
    return Promise.resolve({ data: entry.data ?? null, error: entry.error ?? null });
  };

  const builder = {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        neq: jest.fn(() => resolve()),
        single: jest.fn(() => resolve()),
        order: jest.fn(() => resolve()),
      })),
      single: jest.fn(() => resolve()),
      order: jest.fn(() => resolve()),
    })),
    insert: jest.fn(() => resolve()),
    update: jest.fn(() => resolve()),
    upsert: jest.fn(() => resolve()),
  };

  return builder;
}

// Mock principal del módulo supabase
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabaseAdmin: {
    from: (table) => buildMockQuery(table),

    auth: {
      admin: {
        listUsers: jest.fn(async () => ({
          data: { users: [] },
          error: null
        }))
      }
    }
  }
}));
