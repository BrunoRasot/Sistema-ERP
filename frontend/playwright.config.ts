import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'Desktop Chrome',
      use: {
        viewport: { width: 1440, height: 900 },
        defaultBrowserType: 'chromium',
      },
    },
  ],
});
