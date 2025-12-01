export default {
  testEnvironment: "node",
  transform: {},

  moduleNameMapper: {
    "^\\.\\/src\\/config\\/supabase\\.js$": "<rootDir>/tests/mocks/supabaseMock.js",
    "^src\\/config\\/supabase\\.js$": "<rootDir>/tests/mocks/supabaseMock.js"
  },

  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "json", "node"],

  extensionsToTreatAsEsm: []
};
