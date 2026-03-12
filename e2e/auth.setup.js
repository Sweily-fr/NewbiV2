import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

/**
 * Global setup: logs in once and saves the storage state (cookies/localStorage).
 * All other tests reuse this state — no repeated logins, no session limit issues.
 */
setup('authenticate', async ({ page }) => {
  setup.setTimeout(120000);

  const email = process.env.TEST_USER_EMAIL || 'luffy32291@gmail.com';
  const password = process.env.TEST_USER_PASSWORD || 'Test1234';

  // Retry login up to 2 times (transient failures)
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto('/auth/login', { waitUntil: 'networkidle', timeout: 30000 });

    // Target the first visible form (desktop layout)
    const form = page.locator('form').first();
    await form.waitFor({ state: 'visible', timeout: 15000 });

    // Clear and fill fields — use click + type for react-hook-form compatibility
    const emailInput = form.locator('input[id="email"]');
    await emailInput.click();
    await emailInput.fill(email);

    const passwordInput = form.locator('input[id="password"]');
    await passwordInput.click();
    await passwordInput.fill(password);

    // Small delay to let react-hook-form register the values
    await page.waitForTimeout(500);

    await form.locator('button[type="submit"]').click();

    // Wait for redirect after login
    try {
      await page.waitForURL(/\/(dashboard|onboarding|auth\/manage-devices)/, { timeout: 45000 });
      break; // Success — exit retry loop
    } catch (e) {
      if (attempt === 2) throw e;
      // First attempt failed — retry
      console.log('Login attempt 1 failed, retrying...');
    }
  }

  // If redirected to manage-devices, revoke other sessions and continue
  if (page.url().includes('manage-devices')) {
    // Wait for the sessions list to load
    const keepSessionBtn = page.locator('button:has-text("Garder cette session uniquement")').first();
    const continueBtn = page.locator('button:has-text("Continuer")').first();

    // Wait for either button to appear (multi-session or single-session)
    await expect(keepSessionBtn.or(continueBtn).first()).toBeVisible({ timeout: 15000 });

    if (await keepSessionBtn.isVisible()) {
      // Multiple sessions — click "Garder cette session uniquement"
      await keepSessionBtn.click();

      // Confirmation dialog appears — click "Confirmer"
      const confirmBtn = page.locator('[role="alertdialog"] button:has-text("Confirmer")').first();
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.click();
    } else {
      // Single session — click "Continuer"
      await continueBtn.click();
    }

    // Wait for redirect to dashboard
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });
  }

  // Save the authenticated state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
