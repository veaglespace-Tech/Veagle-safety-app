module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
  },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@reduxjs/toolkit|react-redux|react-native-web)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
};
