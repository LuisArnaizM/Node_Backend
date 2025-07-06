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
      branches: 40,
      functions: 30,
      lines: 40,
      statements: 40
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/unitTestSetup.js'],
  testTimeout: 10000,
  verbose: true
};
