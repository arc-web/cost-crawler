const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  setupFiles: ['<rootDir>/jest-setup.js'],
  testEnvironmentOptions: {
    localstoragePath: path.join(__dirname, '.jest-tmp-localStorage'),
  },
};
