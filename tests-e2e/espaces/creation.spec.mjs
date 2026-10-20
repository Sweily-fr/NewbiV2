/**
 * Créer un nouvel espace (/create-workspace) : étape entreprise (recherche
 * dans l'annuaire simulé), étape de l'offre ; le paiement passe par Stripe,
 * injoignable dans les tests : rien ne doit être créé avant. Page d'erreur
 * de paiement. Propriétaire d'« Équipe ».
 *
 * Ces pages ne deviennent jamais « calmes » (requêtes répétées) : elles sont
 * ouvertes avec page.goto et une attente explicite de leur contenu.
 */
import { test, expect, etape } from "../outils.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_EQUIPE } from "../config.mjs";
import { verifierBoutons } from "../exploration.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_EQUIPE) });

async function ouvrirCreation(page) {
  await page.goto("/create-workspace");
  const recherche = page.getByPlaceholder("Nom de l'entreprise, SIRET ou SIREN...");
  await expect(recherche).toBeVisible({ timeout: 45_000 });
  return recherche;
}

test.describe("Créer un espace", () => {
  test("Sans entreprise choisie : « Continuer » reste grisé", async ({ page }) => {
    await ouvrirCreation(page);
    await expect(page.getByRole("button", { name: "Continuer", exact: true })).toBeDisabled();
  });

  test("Entreprise choisie dans l'annuaire : étape de l'offre, aucun espace créé avant le paiement", async ({ page }) => {
    const avant = await (await base()).collection("organization").countDocuments({});
    const recherche = await ouvrirCreation(page);
    await recherche.fill("Boulangerie");
    await page.getByRole("button", { name: /BOULANGERIE DU MARCHE/ }).first().click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await etape(page, "Étape de l'offre", async () => {
      await expect(page.getByText(/Freelance|PME|Entreprise/).first()).toBeVisible();
    }, { capture: "ecran" });
    expect(await (await base()).collection("organization").countDocuments({}), "Un espace a été créé avant le paiement").toBe(avant);
  });
});

verifierBoutons({
  test,
  titre: "Erreur de paiement à la création d'un espace",
  ouvrir: async (page) => {
    await page.goto("/create-workspace/payment-error");
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible({ timeout: 45_000 });
  },
  zone: (page) => page.locator("body"),
  boutons: {
    "button Réessayer": { navigation: "/create-workspace" },
    "button Retour au tableau de bord": { navigation: "/dashboard" },
  },
});
