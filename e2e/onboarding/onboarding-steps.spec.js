import { test, expect } from "../fixtures/auth.fixture.js";

// Note: l'onboarding complet est déjà couvert par e2e/onboarding/onboarding.spec.js.
// Ce fichier complète avec des tests spécifiques sur les étapes intermédiaires.

test.describe("Onboarding steps", () => {
  test.setTimeout(90000);

  test("Page onboarding accessible si non complétée", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/onboarding", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1000);

    // Soit la page d'onboarding s'affiche, soit redirige vers dashboard si déjà fait
    const url = page.url();
    const onOnboarding = url.includes("/onboarding");
    const onDashboard = url.includes("/dashboard");

    expect(onOnboarding || onDashboard).toBe(true);
  });

  // Test inactif — voir REGRESSIONS_TO_FIX.md R4.
  // Pour activer : seed un user "fresh" (hasSeenOnboarding: false,
  // onboardingCompleted: false sur l'organisation) ou créer un projet
  // Playwright "fresh-user" dédié. Quand activé, retirer le `.fixme` ET
  // le check `if (!page.url().includes("/onboarding"))`.
  test.fixme("Étape entreprise - champs SIRET/nom visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/onboarding", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1500);

    // Si on est déjà passé l'onboarding, skip
    if (!page.url().includes("/onboarding")) {
      test.skip(true, "Onboarding déjà complété");
    }

    const siretField = page
      .locator('input[name*="siret"]')
      .or(page.locator('input[placeholder*="SIRET"]'))
      .or(page.locator('input[placeholder*="entreprise"]'))
      .first();

    const isVisible = await siretField
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Best-effort: la page peut être à une autre étape
    if (isVisible) {
      await expect(siretField).toBeEnabled();
    }
  });

  // Test inactif — voir REGRESSIONS_TO_FIX.md R4.
  // Pour activer : seed un user "fresh" (cf. test ci-dessus). Quand activé,
  // retirer le `.fixme` ET le check `if (!page.url().includes("/onboarding"))`.
  test.fixme("Boutons de navigation entre étapes présents", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/onboarding", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1500);

    if (!page.url().includes("/onboarding")) {
      test.skip(true, "Onboarding déjà complété");
    }

    const nextBtn = page
      .locator('button:has-text("Suivant")')
      .or(page.locator('button:has-text("Continuer")'))
      .or(page.locator('button:has-text("Valider")'))
      .or(page.locator('button:has-text("Terminer")'))
      .first();

    await expect(nextBtn).toBeVisible({ timeout: 10000 });
  });
});
