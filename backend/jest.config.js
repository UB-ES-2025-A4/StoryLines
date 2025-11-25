export default {
  testEnvironment: "node",

  moduleNameMapper: {
    "^\\./config/supabase.js$": "<rootDir>/tests/__mocks__/config/supabase.js",
    "^config/supabase.js$": "<rootDir>/tests/__mocks__/config/supabase.js",
    "^src/config/supabase.js$": "<rootDir>/tests/__mocks__/config/supabase.js"
  },

  transform: {},
};