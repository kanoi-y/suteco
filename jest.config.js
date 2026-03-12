module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['expo-sqlite-mock/src/setup.ts', '<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@datasets/(.*)$': '<rootDir>/datasets/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
