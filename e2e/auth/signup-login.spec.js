import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../seed/test-data";

/**
 * Auth E2E — Login + Signup (nouveau design "Linear-style").
 *
 * Le login a 2 vues : vue initiale (Google + Continuer avec l'email) puis
 * vue formulaire (email/password). On teste les 2.
 *
 * Les pages signup/login rendent desktop + mobile en parallèle → `.first()`
 * partout pour éviter les strict mode violations.
 */

// Pré-accepte la bannière cookies pour ne pas bloquer les clics
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true }),
    );
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
  });
});

test.describe("Auth — Login (vue initiale)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("Connectez-vous").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("affiche le titre et les 2 boutons d'action", async ({ page }) => {
    await expect(page.getByText("Connectez-vous").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continuer avec l'email/i }).first(),
    ).toBeVisible();
  });

  test("affiche le logo Newbi en haut", async ({ page }) => {
    const logo = page.locator('img[alt="Newbi"]').first();
    await expect(logo).toBeVisible();
  });

  test("le footer mentionne CGU + politique de confidentialité", async ({
    page,
  }) => {
    await expect(page.getByText(/Conditions générales/i).first()).toBeVisible();
    await expect(
      page.getByText(/Politique de confidentialité/i).first(),
    ).toBeVisible();
  });

  test("le lien S'inscrire pointe vers /auth/signup", async ({ page }) => {
    const link = page.getByRole("link", { name: /S'inscrire/i }).first();
    await expect(link).toHaveAttribute("href", "/auth/signup");
  });
});

test.describe("Auth — Login (vue formulaire email)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page
      .getByRole("button", { name: /Continuer avec l'email/i })
      .first()
      .click();
    // Le titre change → "Connectez-vous avec votre email"
    await expect(
      page.getByText(/Connectez-vous avec votre email/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("affiche les champs email + password + bouton Se connecter", async ({
    page,
  }) => {
    const form = page.locator("form").first();
    await expect(form.locator("input#email")).toBeVisible();
    await expect(form.locator("input#password")).toBeVisible();
    await expect(
      form.getByRole("button", { name: /Se connecter/i }),
    ).toBeVisible();
  });

  test("le lien Mot de passe oublié pointe vers /auth/forget-password", async ({
    page,
  }) => {
    const link = page
      .getByRole("link", { name: /Mot de passe oublié/i })
      .first();
    await expect(link).toHaveAttribute("href", "/auth/forget-password");
  });

  test("Retour à la connexion ramène à la vue initiale", async ({ page }) => {
    await page.getByRole("button", { name: /Retour à la connexion/i }).click();
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/i }).first(),
    ).toBeVisible();
  });

  test("validation : email invalide affiche une erreur", async ({ page }) => {
    const form = page.locator("form").first();
    // Désactive la validation HTML5 native pour que react-hook-form puisse
    // afficher son propre message "Email invalide"
    await page.evaluate(() => {
      document.querySelectorAll("form").forEach((f) => (f.noValidate = true));
    });
    await form.locator("input#email").fill("pas-un-email");
    await form.locator("input#password").fill("Password123!");
    await form.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.getByText(/Email invalide/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("validation : champs vides empêchent la soumission", async ({
    page,
  }) => {
    const form = page.locator("form").first();
    await form.getByRole("button", { name: /Se connecter/i }).click();
    // L'erreur "Email est requis" ou "Mot de passe est requis" doit apparaître
    await expect(
      page.getByText(/(Email est requis|Mot de passe est requis)/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("mauvais credentials : toast d'erreur", async ({ page }) => {
    const form = page.locator("form").first();
    await form.locator("input#email").fill("inexistant@example.com");
    await form.locator("input#password").fill("WrongPassword123!");
    await form.getByRole("button", { name: /Se connecter/i }).click();

    // Toast Sonner OU texte d'erreur dans la page
    await expect(
      page
        .locator("[data-sonner-toast]")
        .or(page.getByText(/incorrect/i))
        .first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("bons credentials : redirige vers dashboard/onboarding/manage-devices", async ({
    page,
  }) => {
    const form = page.locator("form").first();
    await form.locator("input#email").fill(TEST_CREDENTIALS.email);
    await form.locator("input#password").fill(TEST_CREDENTIALS.password);
    await form.getByRole("button", { name: /Se connecter/i }).click();

    await page.waitForURL(/\/(dashboard|onboarding|auth\/manage-devices)/, {
      timeout: 35000,
    });
    expect(page.url()).toMatch(/\/(dashboard|onboarding|manage-devices)/);
  });
});

test.describe("Auth — Signup (vue initiale)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signup");
    // La page signup peut atterrir sur différentes vues selon la session.
    // On attend juste que la page soit montée.
    await page.waitForLoadState("domcontentloaded");
  });

  test("la page se charge sur /auth/signup", async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("affiche un bouton Google ou un formulaire d'inscription", async ({
    page,
  }) => {
    // Selon l'état (déjà connecté ou non), différentes vues s'affichent
    const googleBtn = page.getByRole("button", { name: /Google/i }).first();
    const form = page.locator("form").first();
    const anyVisible = await googleBtn
      .isVisible()
      .catch(() => false)
      .then((v) => v || form.isVisible().catch(() => false));
    expect(anyVisible).toBe(true);
  });
});

test.describe("Auth — Routes protégées", () => {
  test("/dashboard non authentifié → redirige vers /auth", async ({ page }) => {
    // Force un context sans cookies (ce projet partage le storageState authentifié,
    // donc on nettoie d'abord)
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth\//, { timeout: 15000 });
    expect(page.url()).toMatch(/\/auth\//);
  });

  test("/dashboard/clients non authentifié → redirige vers /auth", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/clients");
    await page.waitForURL(/\/auth\//, { timeout: 15000 });
    expect(page.url()).toMatch(/\/auth\//);
  });
});
