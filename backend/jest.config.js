export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1.js",
  },
  setupFiles: ["<rootDir>/jest.setup.mjs"],
};
