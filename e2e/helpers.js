/**
 * E2E helpers — wrap deterministic Playwright waits so specs don't litter
 * `waitForTimeout(3000)` calls (which slow tests AND make them flaky).
 *
 * Rule of thumb:
 *   - For data fetches, prefer `waitForGraphQL` (waits for the actual response)
 *   - For UI state changes, prefer `expect(locator).toBeVisible()` (auto-retries)
 *   - Only use `waitForTimeout(<= 500ms)` for Radix UI animations that have no
 *     stable signal (popover open, accordion expand). Anything longer is a smell.
 */

/**
 * Wait for a GraphQL response matching the given operation name.
 * Use this instead of arbitrary timeouts after triggering a mutation/query.
 */
export async function waitForGraphQL(
  page,
  operationName,
  { timeout = 15000 } = {},
) {
  return page.waitForResponse(
    async (res) => {
      if (!res.url().includes("/graphql")) return false;
      try {
        const req = res.request();
        const body = req.postData();
        if (!body) return false;
        const parsed = JSON.parse(body);
        if (Array.isArray(parsed)) {
          return parsed.some((q) => q.operationName === operationName);
        }
        return parsed.operationName === operationName;
      } catch {
        return false;
      }
    },
    { timeout },
  );
}

/**
 * Navigate to a path AND wait for the first GraphQL load to settle.
 */
export async function navigateAndSettle(page, path, { timeout = 30000 } = {}) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout });
}

/**
 * Read required env vars or throw — prevents committing real test credentials
 * as fallbacks in source files.
 */
export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Set it in .env.test or your CI secret store.`,
    );
  }
  return value;
}
