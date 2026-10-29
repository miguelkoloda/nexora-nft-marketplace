import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/api',
  testMatch: '**/*.api.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 15_000,
})
