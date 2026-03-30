const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  testEnvironmentOptions: {
    autoUseFakeTimers: false,
    localstoragePath: path.join(__dirname, '.jest-localStorage'),
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
