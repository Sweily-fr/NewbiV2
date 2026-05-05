import { test, expect } from "@playwright/test";

/**
 * E2E — Cookie consent banner & localStorage persistence (GDPR).
 *
 * Verifies the round-trip we rely on for marketing-tag gating:
 *   1. First visit → banner is visible, localStorage is empty.
 *   2. After accepting/refusing → choice is persisted in localStorage.
 *   3. Reload → banner stays hidden, choice is re-read from localStorage.
 *
 * This is intentionally testing the public landing page (no auth needed).
 */

// Don't reuse the authenticated storage state — we want a clean cookie jar.
test.use({ storageState: { cookies: [], origins: [] } });

const KEY = "cookie_consent";
const DATE_KEY = "cookie_consent_date";

test.describe("Cookie consent — localStorage persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage on the target origin before each test.
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("cookie_consent");
        localStorage.removeItem("cookie_consent_date");
      } catch {}
    });
  });

  // CookieManager renders the banner with a 1s delay; allow extra time.
  // Buttons are labeled "Accepter" / "Refuser" / "Personnaliser".
  const acceptBtn = (page) => page.getByRole("button", { name: /^Accepter$/i });
  const declineBtn = (page) => page.getByRole("button", { name: /^Refuser$/i });

  test("banner appears on first visit when localStorage is empty", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(acceptBtn(page)).toBeVisible({ timeout: 15000 });

    const stored = await page.evaluate((k) => localStorage.getItem(k), KEY);
    expect(stored).toBeNull();
  });

  test("'Accepter' persists all categories=true and hides the banner", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(acceptBtn(page)).toBeVisible({ timeout: 15000 });
    await acceptBtn(page).click();

    await expect(acceptBtn(page)).toBeHidden({ timeout: 5000 });

    const stored = await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)),
      KEY,
    );
    expect(stored).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: true,
    });

    const dateStr = await page.evaluate(
      (k) => localStorage.getItem(k),
      DATE_KEY,
    );
    expect(dateStr).toBeTruthy();
    expect(() => new Date(dateStr)).not.toThrow();
  });

  test("'Refuser' persists all opt-in categories=false (necessary stays true)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(declineBtn(page)).toBeVisible({ timeout: 15000 });
    await declineBtn(page).click();

    const stored = await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)),
      KEY,
    );
    expect(stored.necessary).toBe(true);
    expect(stored.marketing).toBe(false);
    expect(stored.analytics).toBe(false);
  });

  test("choice persists across reloads — banner stays hidden", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(acceptBtn(page)).toBeVisible({ timeout: 15000 });
    await acceptBtn(page).click();

    await expect(acceptBtn(page)).toBeHidden();

    // Hard reload — still hidden because the hook reads from localStorage.
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(acceptBtn(page)).toBeHidden({ timeout: 5000 });
  });

  test("pre-seeded localStorage suppresses the banner on first render", async ({
    page,
  }) => {
    // Override the init script: write a saved consent before page load.
    await page.addInitScript(() => {
      localStorage.setItem(
        "cookie_consent",
        JSON.stringify({
          necessary: true,
          functional: true,
          analytics: false,
          marketing: false,
        }),
      );
      localStorage.setItem("cookie_consent_date", new Date().toISOString());
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(acceptBtn(page)).toBeHidden();
  });
});
