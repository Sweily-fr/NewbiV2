import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Dashboard home", () => {
  test.setTimeout(90000);

  test("Page d'accueil dashboard affiche un titre et la sidebar", async ({
    authenticatedPage: page,
  }) => {
    await page.waitForTimeout(1000);

    // Le dashboard doit avoir au moins un h1/h2 avec un titre métier
    // et la sidebar de navigation visible
    const hasHeading = await page
      .locator("h1, h2")
      .first()
      .isVisible({ timeout: 10000 });
    expect(hasHeading).toBe(true);

    const sidebar = page
      .locator('[data-sidebar="sidebar"], aside, [role="navigation"]')
      .first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test("Sidebar de navigation est visible", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page
      .locator('[data-sidebar="sidebar"]')
      .or(page.locator("aside"))
      .or(page.locator('[role="navigation"]'))
      .first();

    await expect(sidebar).toBeVisible({ timeout: 15000 });
  });

  test("Liens principaux du menu sont présents", async ({
    authenticatedPage: page,
  }) => {
    // Attendre que la sidebar soit montée (la fixture fait `domcontentloaded`,
    // pas `networkidle` — la sidebar peut ne pas être rendue tout de suite).
    await page
      .locator('[data-sidebar="sidebar"], aside, [role="navigation"]')
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Libellés top-level de la sidebar (cf. src/components/nav-main.jsx).
    // "Factures" et "Devis" ne sont PLUS top-level — ce sont des sub-items
    // du collapsible "Ventes" (fermé par défaut). "Contacts" a été renommé
    // "Clients". On cherche maintenant des items réellement visibles.
    const expectedLinks = ["Accueil", "Ventes", "Clients"];
    let foundCount = 0;

    for (const linkText of expectedLinks) {
      const link = page.locator(`text=/^${linkText}$/i`).first();
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        foundCount++;
      }
    }

    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test("Dashboard charge des données via GraphQL", async ({
    authenticatedPage: page,
  }) => {
    // waitForResponse au lieu d'un timeout fixe — sous charge parallèle
    // l'Apollo client peut mettre >3s à monter et émettre sa première query.
    const responsePromise = page
      .waitForResponse((res) => res.url().includes("/graphql"), {
        timeout: 20000,
      })
      .catch(() => null);

    await page.reload({ waitUntil: "domcontentloaded" });
    const response = await responsePromise;

    expect(response).not.toBeNull();
  });

  test("Le dashboard expose un point d'entrée utilisateur (avatar ou menu)", async ({
    authenticatedPage: page,
  }) => {
    // L'app doit fournir un moyen d'accéder au profil/déconnexion : avatar,
    // menu utilisateur, OU lien "Compte" dans la sidebar — au moins un des trois
    const avatar = page
      .locator(
        '[data-testid="user-menu"], button:has(img), [role="button"]:has(img)',
      )
      .first();
    const accountLink = page
      .locator('a[href*="/account"], a[href*="/profil"]')
      .first();

    const hasAvatar = await avatar
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasAccountLink = await accountLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(
      hasAvatar || hasAccountLink,
      "Aucun point d'entrée vers le compte utilisateur trouvé (avatar ni lien)",
    ).toBe(true);
  });
});
