import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const isHeaded = process.argv.includes('--headed');

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI || isHeaded ? 1 : 2,
  reporter: isCI ? 'html' : 'list',
  timeout: 45000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30000,
    // In headed mode: slow down actions so you can follow visually
    ...(isHeaded && {
      launchOptions: { slowMo: 300 },
      video: 'on',
    }),
  },
  projects: [
    // Setup project: logs in once and saves cookies
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    // Auth tests run WITHOUT storageState (test real login/signup flows)
    // Runs after setup to avoid parallel session conflicts
    {
      name: 'auth-tests',
      testMatch: /auth\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // Authenticated tests: reuse cookies from setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\/.*\.spec\.js/,
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120000,
  },
});
