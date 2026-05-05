import { test, expect } from "@playwright/test";
import { requireEnv } from "../helpers.js";
import { clearOrganization, restoreOrganization } from "./seed-helpers.js";

/**
 * Onboarding — tests interactifs sur tout le parcours d'accueil.
 *
 * Vrai flow :
 *   1. AccountTypeStep — Entreprise / Cabinet Comptable
 *   2. EmployeeCountStep — taille de l'entreprise
 *   3. CompanySearchStep — recherche SIREN (API /api/search-companies)
 *   4. PlanSelectionStep — choix du plan + facturation mensuelle/annuelle
 *
 * Note importante : la page rend desktop + mobile en parallèle (Tailwind
 * md:hidden) → la plupart des textes existent en double, d'où le `.first()`
 * systématique. Sans ça, Playwright lève "strict mode violation".
 *
 * globalSetup seed une org + subscription "trialing" qui ferait sauter
 * l'onboarding. On les retire avant la suite et on les remet après.
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test-e2e@newbi.fr";

test.beforeAll(async () => {
  requireEnv("TEST_USER_EMAIL");
  await clearOrganization(TEST_EMAIL);
});

test.afterAll(async () => {
  await restoreOrganization(TEST_EMAIL);
});

// Pré-accepte la bannière cookies (sinon elle intercepte les clics).
// addInitScript injecte le localStorage AVANT que la page se charge.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true }),
    );
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
  });
});

test.describe("Onboarding — étape 1 (type de compte)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("Quel type de compte").first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("affiche les 2 choix (Entreprise activé, Cabinet désactivé)", async ({
    page,
  }) => {
    await expect(page.getByText("Entreprise").first()).toBeVisible();
    await expect(page.getByText("Cabinet Comptable").first()).toBeVisible();
    const cabinetButton = page
      .getByRole("button", { name: /Cabinet Comptable/ })
      .first();
    await expect(cabinetButton).toBeDisabled();
  });

  test("passe à l'étape 2 en cliquant Entreprise", async ({ page }) => {
    await page.getByText("Entreprise").first().click();
    await expect(page).toHaveURL(/step=2/, { timeout: 10000 });
    await expect(
      page.getByText("Quelle est la taille de votre entreprise").first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Onboarding — étape 2 (taille)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("Quel type de compte").first()).toBeVisible({
      timeout: 20000,
    });
    await page.getByText("Entreprise").first().click();
    await expect(page.getByText("Quelle est la taille").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("affiche les 5 tranches de taille", async ({ page }) => {
    await expect(page.getByText("Juste moi").first()).toBeVisible();
    await expect(page.getByText("2-5 employés").first()).toBeVisible();
    await expect(page.getByText("6-10 employés").first()).toBeVisible();
    await expect(page.getByText("11-50 employés").first()).toBeVisible();
    await expect(page.getByText("Plus de 50 employés").first()).toBeVisible();
  });

  test("sélectionne une taille et passe à l'étape 3", async ({ page }) => {
    await page.getByText("2-5 employés").first().click();
    await page.getByRole("button", { name: "Continuer" }).first().click();

    await expect(page).toHaveURL(/step=3/, { timeout: 10000 });
    await expect(
      page.getByText("Recherchez votre entreprise").first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Onboarding — étape 3 (recherche SIREN)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding?step=3");
    // Si l'app rebondit sur étape 1 (state non persisté), on refait le parcours
    const accountTypeVisible = await page
      .getByText("Quel type de compte")
      .first()
      .isVisible()
      .catch(() => false);
    if (accountTypeVisible) {
      await page.getByText("Entreprise").first().click();
      await expect(page.getByText("Quelle est la taille").first()).toBeVisible({
        timeout: 10000,
      });
      await page.getByText("2-5 employés").first().click();
      await page.getByRole("button", { name: "Continuer" }).first().click();
    }
    await expect(
      page.getByText("Recherchez votre entreprise").first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("affiche le champ de recherche", async ({ page }) => {
    await expect(page.locator("input#company-search").first()).toBeVisible();
    await expect(
      page.getByText("Nom de l'entreprise, SIRET ou SIREN").first(),
    ).toBeVisible();
  });

  test("recherche 'sweily' — input accepte la saisie", async ({ page }) => {
    const input = page.locator("input#company-search").first();
    await input.fill("sweily");
    await expect(input).toHaveValue("sweily");
  });

  test("le bouton Continuer est désactivé tant qu'aucune entreprise n'est sélectionnée", async ({
    page,
  }) => {
    const continueBtn = page.getByRole("button", { name: "Continuer" }).first();
    await expect(continueBtn).toBeDisabled();
  });
});

test.describe("Onboarding — étape 4 (choix du plan)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding?step=4");
    await expect(
      page.getByText(/Freelance|TPE|Entreprise/).first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("affiche les 3 plans avec leurs prix mensuels", async ({ page }) => {
    await expect(page.getByText("Freelance").first()).toBeVisible();
    await expect(page.getByText("TPE").first()).toBeVisible();
    // "Entreprise" est ambigu (plan + titre étape 1) — on cible le badge "Populaire"
    await expect(page.getByText("Populaire").first()).toBeVisible();
    // Prix mensuel TPE = 48,99€
    await expect(page.getByText("48,99").first()).toBeVisible();
  });

  test("bascule entre facturation mensuelle et annuelle", async ({ page }) => {
    // Par défaut : mensuel, TPE = 48,99€
    await expect(page.getByText("48,99").first()).toBeVisible();

    await page.getByRole("button", { name: "Annuel" }).first().click();
    // Annuel : TPE = 44,09€
    await expect(page.getByText("44,09").first()).toBeVisible();
    await expect(page.getByText("-10%").first()).toBeVisible();

    await page.getByRole("button", { name: "Mensuel" }).first().click();
    await expect(page.getByText("48,99").first()).toBeVisible();
  });

  test("clique sur 'Choisir ce plan' déclenche /api/create-org-subscription", async ({
    page,
  }) => {
    // Vérifie juste que le clic émet bien la requête vers l'API Stripe —
    // on n'assert pas le status car en local Stripe peut renvoyer 4xx
    // selon la config (clés test, plan déjà actif, etc.).
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/create-org-subscription") &&
        req.method() === "POST",
      { timeout: 20000 },
    );
    await page.getByRole("button", { name: "Choisir ce plan" }).first().click();
    await requestPromise;
  });
});
