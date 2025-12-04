export default {
  testEnvironment: "node",

  // Imprescindible para que Jest trate tu proyecto como ESM
  extensionsToTreatAsEsm: [".js"],

  transform: {},

  // Necesario para imports relativos ESM
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  setupFiles: ["<rootDir>/jest.setup.mjs"],
};
