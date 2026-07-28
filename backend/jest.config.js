module.exports = {
  testEnvironment: "node",
  testTimeout: 120000,
  verbose: true,
  testPathIgnorePatterns: ["/node_modules/", "__tests__/setup.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "services/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "!node_modules",
  ],
};
