import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

/**
 * Browser-mode Vitest config — runs tests in a REAL browser (Chromium via Playwright).
 *
 * Use the separate `__tests__/browser/` folder so these tests are opt-in and
 * don't slow down `npm test` (which uses happy-dom).
 *
 * Launch: `npm run test:browser` (headless) or `npm run test:browser:ui` (visible UI).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["__tests__/browser/**/*.test.{js,jsx,ts,tsx}"],
    setupFiles: ["__tests__/browser/setup.js"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: false, // show the browser window
      instances: [{ browser: "chromium" }],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
