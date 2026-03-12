import { test as base, expect } from '@playwright/test';

/**
 * Custom test fixture for authenticated tests.
 *
 * Authentication is handled by the setup project (auth.setup.js) which logs in once
 * and saves the storage state. All tests in the 'chromium' project automatically
 * receive the authenticated cookies via storageState in playwright.config.js.
 *
 * This fixture provides `authenticatedPage` which simply navigates to the dashboard.
 */
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Cookies are already set by storageState — just go to dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // If redirected to auth (expired session), skip the test
    if (page.url().includes('/auth/')) {
      test.skip(true, 'Session expired — re-run setup to re-authenticate');
    }

    await use(page);
  },
});

export { expect };
