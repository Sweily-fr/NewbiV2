import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Resolve env paths so they work regardless of where Playwright is invoked
// from (terminal at NewbiV2/, monorepo root, VS Code Playwright extension, etc.).
// Walk up from process.cwd() until we find package.json with name "newbiv2".
function findProjectRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        const json = JSON.parse(fs.readFileSync(pkg, "utf-8"));
        if (json.name === "newbiv2") return dir;
      } catch {}
    }
    // Also check NewbiV2/ subdirectory (case when cwd is monorepo root)
    const sub = path.join(dir, "NewbiV2", "package.json");
    if (fs.existsSync(sub)) return path.join(dir, "NewbiV2");
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd(); // fallback
}

const PROJECT_ROOT = findProjectRoot();

// Load .env.test first, then fall back to .env.
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.test") });
dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });

const isCI = !!process.env.CI;
const isHeaded = process.argv.includes("--headed");
const isUIMode = process.argv.includes("--ui");

// Use a locally-installed Chromium-based browser instead of Playwright's
// bundled binary. PLAYWRIGHT_BROWSER_PATH can be overridden via env.
const OPERA_PATH =
  process.env.PLAYWRIGHT_BROWSER_PATH ||
  "/Applications/Opera.app/Contents/MacOS/Opera";

// Launch options merge: local browser + (optionally) slowMo in headed mode.
const launchOptions = {
  executablePath: OPERA_PATH,
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
  reporter: isCI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["github"],
        ["json", { outputFile: "playwright-report/results.json" }],
      ]
    : [["list"], ["html", { open: "on-failure" }]],
  timeout: 45000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: isHeaded || isUIMode ? "on" : "retain-on-failure",
    video: isHeaded ? "on" : "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 30000,
    actionTimeout: 10000,
    testIdAttribute: "data-testid",
    launchOptions,
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
    // Cross-browser: Firefox — opt-in via PLAYWRIGHT_PROJECT=firefox
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        // Use bundled Firefox (Opera path doesn't apply here)
        launchOptions: isHeaded ? { slowMo: 300 } : {},
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\/.*\.spec\.js/,
      testMatch:
        /smoke\/.*\.spec\.js|public-pages\/.*\.spec\.js|navigation\/.*\.spec\.js/,
    },
    // Cross-browser: WebKit (Safari) — opt-in
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        launchOptions: isHeaded ? { slowMo: 300 } : {},
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\/.*\.spec\.js/,
      testMatch:
        /smoke\/.*\.spec\.js|public-pages\/.*\.spec\.js|navigation\/.*\.spec\.js/,
    },
    // Mobile viewport (Pixel 5) — opt-in via PLAYWRIGHT_PROJECT=mobile
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        launchOptions,
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\/.*\.spec\.js/,
      testMatch:
        /smoke\/.*\.spec\.js|public-pages\/.*\.spec\.js|navigation\/.*\.spec\.js/,
    },
    // Accessibility audits with axe-core — opt-in
    {
      name: "a11y",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /a11y\/.*\.spec\.js/,
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
