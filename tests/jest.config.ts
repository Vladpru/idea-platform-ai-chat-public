import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'allure-jest/node',
  testEnvironmentOptions: {
    resultsDir: './allure-results',
  },
  rootDir: '.',
  globalSetup: '<rootDir>/setup/global-setup.js',
  globalTeardown: '<rootDir>/setup/global-teardown.js',
  testMatch: ['**/api/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup/pactum.setup.ts'],
  moduleNameMapper: {
    '^@helpers/(.*)$': '<rootDir>/helpers/$1',
  },
  testTimeout: 60000,
  verbose: true,
};

export default config;