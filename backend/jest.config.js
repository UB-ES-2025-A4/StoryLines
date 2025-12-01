export default {
  testEnvironment: "node",
  transform: {},

  // Fuerza que Jest NO use el cache de ESM para supabase.js
  moduleNameMapper: {
    "^@/config/supabase$": "<rootDir>/tests/__mocks__/supabaseMock.js"
  },

  setupFiles: ["<rootDir>/jest.setup.js"],

  moduleFileExtensions: ["js", "json", "node"],

  // IMPORTANTE
  extensionsToTreatAsEsm: []
};
