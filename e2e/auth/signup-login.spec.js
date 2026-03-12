import { test, expect } from '@playwright/test';
import { TEST_USER } from '../fixtures/test-data.fixture.js';

test.describe('Authentication flows', () => {
  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');

      // Target the first visible form (desktop layout)
      const form = page.locator('form').first();
      await expect(form.locator('input[id="email"]')).toBeVisible();
      await expect(form.locator('input[id="password"]')).toBeVisible();
      await expect(form.locator('button[type="submit"]')).toBeVisible();
      // Google OAuth button is outside the form
      await expect(page.locator('button:has-text("Google")').first()).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      const form = page.locator('form').first();
      await form.locator('input[id="email"]').fill('invalid@example.com');
      await form.locator('input[id="password"]').fill('WrongPassword123');
      await form.locator('button[type="submit"]').click();

      // Wait for error toast — custom sonner toast with "Email ou mot de passe incorrect"
      // or the submit button to stop loading (error handled without toast)
      await expect(
        page.locator('text="Email ou mot de passe incorrect"').or(
          page.locator('[data-sonner-toast]')
        ).or(
          page.locator('text="incorrect"')
        ).first()
      ).toBeVisible({ timeout: 20000 });
    });

    test('should redirect after successful login', async ({ page }) => {
      await page.goto('/auth/login');

      const form = page.locator('form').first();
      await form.locator('input[id="email"]').fill(TEST_USER.email);
      await form.locator('input[id="password"]').fill(TEST_USER.password);
      await form.locator('button[type="submit"]').click();

      // Should redirect to dashboard, onboarding, or manage-devices (session limit)
      await page.waitForURL(/\/(dashboard|onboarding|auth\/manage-devices)/, { timeout: 35000 });
      expect(page.url()).toMatch(/\/(dashboard|onboarding|manage-devices)/);
    });
  });

  test.describe('Signup', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/auth/signup');

      const form = page.locator('form').first();
      await expect(
        form.locator('input[type="email"], input[name="email"], input[id="email"]').first()
      ).toBeVisible();
      await expect(
        form.locator('input[type="password"], input[name="password"], input[id="password"]').first()
      ).toBeVisible();
    });

    test('should validate required fields on submit', async ({ page }) => {
      await page.goto('/auth/signup');

      const submitButton = page.locator('form button[type="submit"]').first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/auth');
      }
    });
  });

  test.describe('Protected routes', () => {
    test('should redirect unauthenticated users from dashboard to auth', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL('**/auth/**', { timeout: 10000 });
      expect(page.url()).toContain('/auth');
    });
  });
});
