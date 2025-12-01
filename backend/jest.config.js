export default {
  testEnvironment: "node",
  transform: {},

  // Cargar el setup ANTES que los tests
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Extensiones permitidas
  moduleFileExtensions: ["js", "json", "node"],
};
