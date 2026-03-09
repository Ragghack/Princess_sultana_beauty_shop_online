module.exports = {
  testEnvironment: 'node',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
     'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};