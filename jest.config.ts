import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};

export default config;
