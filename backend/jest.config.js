export default {
  testEnvironment: "node",
  transform: {},
  moduleDirectories: ["node_modules", "src"],
  // Si ya tienes jest.setup.js, lo dejamos pero vacío o sin lógica rara
  setupFiles: ["<rootDir>/jest.setup.js"],
};