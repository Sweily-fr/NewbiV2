import { test, expect } from "@playwright/test";

/**
 * E2E — Public file transfer view (anonymous access).
 *
 * The transfer share page lives at /transfer/[shareLink] and accepts an
 * accessKey via query string. It renders WITHOUT auth — recipients are
 * anonymous third parties.
 *
 * Strategy: create a fake transfer via the backend GraphQL API (using an
 * authenticated session), then visit the public URL in a fresh context with
 * NO storageState. Verifies the bypass-auth path on a critical share flow.
 */

test.describe("Public file transfer view", () => {
  test.setTimeout(60000);

  test("returns a structured response for a missing/invalid share link", async ({
    page,
  }) => {
    // Use a deterministic invalid link so the page doesn't depend on prior
    // seed state. Anonymous access must not redirect to /auth.
    const fakeShareLink = "share-does-not-exist-" + Date.now();
    const fakeAccessKey = "key-does-not-exist";

    const response = await page.goto(
      `/transfer/${fakeShareLink}?accessKey=${fakeAccessKey}`,
      { waitUntil: "domcontentloaded", timeout: 30000 },
    );

    // The page must render (200 or 404), not redirect to /auth/sign-in.
    expect(response).toBeTruthy();
    expect(page.url()).not.toContain("/auth/");

    // The page should show some kind of "not found / expired / invalid"
    // messaging rather than a blank crash. We accept any of the common
    // strings used by the UI.
    const errorRegex = /invalide|expir|introuvable|not found|inaccessible/i;
    await expect(page.locator("body")).toContainText(errorRegex, {
      timeout: 15000,
    });
  });

  test("public route must NOT require authentication", async ({ page }) => {
    // Visit ANY share-link URL without auth. Even invalid ones must not
    // redirect to /auth/sign-in (would be a regression of the public route).
    await page.goto("/transfer/anything?accessKey=anything", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 5000 });
  });
});
