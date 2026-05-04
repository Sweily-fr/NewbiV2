import { test, expect } from "@playwright/test";

/**
 * Auth — Visual regression tests.
 *
 * Capture des screenshots de référence pour login, signup, forget-password.
 * Première exécution : crée les baselines via `--update-snapshots`.
 * Exécutions suivantes : compare pixel-à-pixel → fail si diff > maxDiffPixelRatio.
 *
 * Les baselines sont stockées dans `auth-visual.spec.js-snapshots/`.
 */

// Pré-accepte la bannière cookies pour ne pas polluer les screenshots
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true }),
    );
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
  });
});

// Tolérance par défaut : ~0.5% des pixels peuvent différer (anti-aliasing,
// font rendering subtil). Ajuste si besoin.
const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: "disabled",
  maxDiffPixelRatio: 0.005,
};

// Helper : attendre que la page soit visuellement stable avant snapshot
async function waitForStable(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  // Charge des fonts (la première frappe peut prendre du temps)
  await page.evaluate(() => document.fonts?.ready);
  // Petit délai pour les transitions CSS résiduelles
  await page.waitForTimeout(300);
}

test.describe("Visual — Login", () => {
  test("vue initiale (Google + email) — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/auth/login");
    await expect(page.getByText("Connectez-vous").first()).toBeVisible();
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "login-initial-desktop.png",
      SCREENSHOT_OPTIONS,
    );
  });

  test("vue initiale — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto("/auth/login");
    await expect(page.getByText("Connectez-vous").first()).toBeVisible();
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "login-initial-mobile.png",
      SCREENSHOT_OPTIONS,
    );
  });

  test("vue formulaire email — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/auth/login");
    await page
      .getByRole("button", { name: /Continuer avec l'email/i })
      .first()
      .click();
    await expect(
      page.getByText(/Connectez-vous avec votre email/i).first(),
    ).toBeVisible();
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "login-email-form-desktop.png",
      SCREENSHOT_OPTIONS,
    );
  });

  test("vue formulaire email — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth/login");
    await page
      .getByRole("button", { name: /Continuer avec l'email/i })
      .first()
      .click();
    await expect(
      page.getByText(/Connectez-vous avec votre email/i).first(),
    ).toBeVisible();
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "login-email-form-mobile.png",
      SCREENSHOT_OPTIONS,
    );
  });
});

test.describe("Visual — Signup", () => {
  test("vue initiale — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/auth/signup");
    await page.waitForLoadState("domcontentloaded");
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "signup-initial-desktop.png",
      SCREENSHOT_OPTIONS,
    );
  });

  test("vue initiale — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth/signup");
    await page.waitForLoadState("domcontentloaded");
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "signup-initial-mobile.png",
      SCREENSHOT_OPTIONS,
    );
  });
});

test.describe("Visual — Forget password", () => {
  test("vue initiale — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/auth/forget-password");
    await page.waitForLoadState("domcontentloaded");
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "forget-password-desktop.png",
      SCREENSHOT_OPTIONS,
    );
  });

  test("vue initiale — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth/forget-password");
    await page.waitForLoadState("domcontentloaded");
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "forget-password-mobile.png",
      SCREENSHOT_OPTIONS,
    );
  });
});

test.describe("Visual — États d'erreur", () => {
  test("login — erreur email invalide affichée", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/auth/login");
    await page
      .getByRole("button", { name: /Continuer avec l'email/i })
      .first()
      .click();
    // Attendre que le form soit dans le DOM (animation de switch view ~150ms)
    await expect(
      page.getByText(/Connectez-vous avec votre email/i).first(),
    ).toBeVisible();
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    await page.evaluate(() => {
      document.querySelectorAll("form").forEach((f) => (f.noValidate = true));
    });
    await form.locator("input#email").fill("pas-un-email");
    await form.locator("input#password").fill("Password123!");
    await form.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.getByText(/Email invalide/i).first()).toBeVisible();
    await waitForStable(page);
    await expect(page).toHaveScreenshot(
      "login-error-email-invalid.png",
      SCREENSHOT_OPTIONS,
    );
  });
});
