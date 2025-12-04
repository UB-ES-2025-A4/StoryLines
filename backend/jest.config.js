export default {
  testEnvironment: "node",
  transform: {},

  // Muy importante para Jest + ESM: evita errores de import/export
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1.js",
  },

  setupFiles: ["<rootDir>/jest.setup.mjs"],
};
