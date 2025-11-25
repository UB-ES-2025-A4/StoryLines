import { jest } from "@jest/globals";

// Mock global del módulo supabase
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
      })),
      insert: jest.fn(() =>
        Promise.resolve({ data: {}, error: null })
      ),
      update: jest.fn(() =>
        Promise.resolve({ data: {}, error: null })
      ),
      upsert: jest.fn(() =>
        Promise.resolve({ data: {}, error: null })
      ),
    })),

    auth: {
      admin: {
        listUsers: jest.fn(async () => ({
          data: { users: [] },
          error: null,
        })),
      },
    },
  },
}));
