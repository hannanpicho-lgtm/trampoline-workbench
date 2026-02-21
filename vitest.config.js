import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    mockReset: true,
    restoreMocks: true,
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'functions/**', 'src/**'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/setup.js', '.github', 'dist'],
    },
  },
});
