import { jest } from "@jest/globals";

// ------------------------------------------------------------
// 1) Mock COMPLETO de supabase.js *ANTES* de importar app.js
// ------------------------------------------------------------
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: {
    from: () => ({
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: [], error: null }),
      update: async () => ({ data: [], error: null }),
      delete: async () => ({ data: [], error: null }),
      eq() { return this; }
    }),
  },
  supabaseAdmin: {
    from: () => ({
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: [], error: null }),
      update: async () => ({ data: [], error: null }),
      delete: async () => ({ data: [], error: null }),
      eq() { return this; }
    }),
    auth: {
      admin: {
        listUsers: async () => ({
          data: { users: [] },
          error: null
        })
      }
    }
  }
}));

// ------------------------------------------------------------
// 2) Cargar la app DESPUÉS del mock
// ------------------------------------------------------------
const { default: app } = await import("./src/app.js");
global.__app = app;


// ------------------------------------------------------------
// 3) Mock DB
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
};
