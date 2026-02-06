export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}