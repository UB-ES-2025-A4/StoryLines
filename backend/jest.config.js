export default {
  testEnvironment: "node",
  transform: {},

  // Muy importante → cargar el mock ANTES de cualquier test
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Permitir ES Modules
  extensionsToTreatAsEsm: [".js"],

  // Evitar que Jest intente transformar cosas de node_modules
  moduleFileExtensions: ["js", "json", "node"],
};
