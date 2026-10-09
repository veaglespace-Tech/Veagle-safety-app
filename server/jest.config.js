export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
};
