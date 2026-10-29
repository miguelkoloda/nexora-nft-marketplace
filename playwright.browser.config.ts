import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.browser.spec.ts',
  globalTeardown: './tests/global-teardown.mjs',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-browser' }],
  ],
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5187',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node scripts/browser-preview-server.mjs',
      url: 'http://127.0.0.1:5187',
      timeout: 30_000,
    },
    {
      command: 'node --experimental-strip-types server/realtime/index.ts',
      url: 'http://127.0.0.1:5188/__demo/health',
      timeout: 30_000,
    },
  ],
})
