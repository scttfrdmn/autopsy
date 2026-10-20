import { defineConfig } from '@playwright/test';

// Extensions need a persistent context per test; run serially to keep it simple.
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
});
