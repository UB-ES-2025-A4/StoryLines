export default {
  testEnvironment: "node",
  transform: {},

  // NECESARIO PARA EVITAR EL BUG CON ES MODULES
  extensionsToTreatAsEsm: [".js"],

  // NECESARIO PARA QUE JEST NO ENTRE EN RECURSIÓN TRANSFORMANDO ARCHIVOS
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1.js",
  },

  setupFiles: ["<rootDir>/jest.setup.mjs"],
};
