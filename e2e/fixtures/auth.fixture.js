/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixtures use a `use` callback that ESLint mistakes for a React hook. */
import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixture for authenticated tests.
 *
 * Authentication is handled by the setup project (auth.setup.js) which logs in once
 * and saves the storage state. All tests in the 'chromium' project automatically
 * receive the authenticated cookies via storageState in playwright.config.js.
 *
 * This fixture provides `authenticatedPage` which:
 *  - navigates to the dashboard (skips the test if the session is expired)
 *  - captures all GraphQL requests + GraphQL errors + console errors during the
 *    test, and attaches them as `graphql-trace.json` to the report when the test
 *    fails. Makes "what happened just before the failure?" trivial to answer.
 */
export const test = base.extend({
  authenticatedPage: async ({ page }, use, testInfo) => {
    // Cookies are already set by storageState — just go to dashboard
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // If redirected to auth (expired session), skip the test
    if (page.url().includes("/auth/")) {
      test.skip(true, "Session expired — re-run setup to re-authenticate");
    }

    // Capture all GraphQL traffic (requests + non-OK responses + console errors).
    // Attached as graphql-trace.json on failure for post-mortem.
    const gqlLog = [];

    page.on("request", (req) => {
      if (req.url().includes("/graphql")) {
        try {
          const body = req.postData();
          const parsed = body ? JSON.parse(body) : {};
          if (Array.isArray(parsed)) {
            for (const q of parsed) {
              gqlLog.push({
                ts: Date.now(),
                op: q.operationName,
                vars: q.variables,
              });
            }
          } else {
            gqlLog.push({
              ts: Date.now(),
              op: parsed.operationName,
              vars: parsed.variables,
            });
          }
        } catch {
          /* swallow parse errors silently — we just won't log this request */
        }
      }
    });

    page.on("response", async (res) => {
      if (res.url().includes("/graphql") && !res.ok()) {
        gqlLog.push({
          ts: Date.now(),
          op: "HTTP_ERROR",
          status: res.status(),
          body: await res.text().catch(() => "?"),
        });
      }
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        gqlLog.push({
          ts: Date.now(),
          op: "CONSOLE_ERROR",
          text: msg.text(),
        });
      }
    });

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach("graphql-trace.json", {
        body: JSON.stringify(gqlLog, null, 2),
        contentType: "application/json",
      });
    }
  },
});

export { expect };
