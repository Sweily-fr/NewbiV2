import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env.test first, then fall back to .env.
dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env" });

const isCI = !!process.env.CI;
const isHeaded = process.argv.includes("--headed");

// Use a locally-installed Chromium-based browser instead of Playwright's
// bundled binary. BRAVE_PATH can be overridden via env if you prefer Arc or Chrome.
const BRAVE_PATH =
  process.env.PLAYWRIGHT_BROWSER_PATH ||
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

// Launch options merge: local browser + (optionally) slowMo in headed mode.
const launchOptions = {
  executablePath: BRAVE_PATH,
  ...(isHeaded && { slowMo: 300 }),
};

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI || isHeaded ? 1 : 2,
  reporter: isCI ? "html" : "list",
  timeout: 45000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 30000,
    launchOptions,
    ...(isHeaded && { video: "on" }),
  },
  projects: [
    // Setup project: logs in once and saves cookies
    {
      name: "setup",
      testMatch: /auth\.setup\.js/,
    },
    // Auth tests run WITHOUT storageState (test real login/signup flows)
    {
      name: "auth-tests",
      testMatch: /auth\/.*\.spec\.js/,
      use: { ...devices["Desktop Chrome"], launchOptions },
      dependencies: ["setup"],
    },
    // Authenticated tests: reuse cookies from setup
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\/.*\.spec\.js/,
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !isCI,
        timeout: 120000,
      },
});
