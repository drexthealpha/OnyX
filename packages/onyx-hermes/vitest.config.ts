import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    include: ['src/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    pool: 'threads',
    threads: {
      singleThread: true,
    },
  },
});