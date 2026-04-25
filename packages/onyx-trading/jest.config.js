/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@onyx/(.*)$': '<rootDir>/../onyx-$1/src/index.ts',
  },
  testMatch: ['**/tests/**/*.test.ts'],
};