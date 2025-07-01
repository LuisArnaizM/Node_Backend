module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/unitTestSetup.js'],
  testTimeout: 10000,
  verbose: true
};
