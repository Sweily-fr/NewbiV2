/**
 * Intégrations (/dashboard/automatisation) : page sans lien dans le menu (le
 * lien est en commentaire dans nav-secondary.jsx), ouverte par son adresse.
 * Chaque intégration est annoncée « Bientôt disponible », bouton grisé.
 *
 * Défaut d'affichage connu : la page porte encore les onglets de la liste des
 * factures (« Brouillons 3 », « À encaisser 2 », « Terminées »), avec des
 * compteurs écrits en dur et sans contenu derrière. Test dédié, reste rouge.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";

const INTEGRATIONS = ["Oracle", "Sage", "ACD", "Odoo", "Pennylane", "Cegid Quadra", "Cegid Loop"];
const ouvrirIntegrations = (page) =>
  ouvrir(page, "/dashboard/automatisation", { pret: page.getByRole("heading", { name: "Intégrations" }) });

for (const [role, token] of [
  ["propriétaire", SESSION_TOKEN_COLLAB],
  ["éditeur", SESSION_TOKEN_COLLAB_EDITEUR],
  ["membre", SESSION_TOKEN_COLLAB_MEMBRE],
]) {
  test.describe(`Intégrations (${role})`, () => {
    test.use({ storageState: connecte(token) });

    test("Les sept intégrations sont annoncées « Bientôt disponible », toutes grisées", async ({ page }) => {
      await ouvrirIntegrations(page);
      await etape(
        page,
        "Sept intégrations, aucun bouton actif",
        async () => {
          for (const nom of INTEGRATIONS) await expect(page.getByText(nom, { exact: true }).first()).toBeVisible();
          const boutons = page.getByRole("button", { name: "Bientôt disponible" });
          await expect(boutons).toHaveCount(INTEGRATIONS.length);
          for (const bouton of await boutons.all()) await expect(bouton).toBeDisabled();
          await expect(page.getByRole("button", { name: "Connecter" })).toHaveCount(0);
        },
        { capture: "ecran" },
      );
    });
  });
}

test.describe("Intégrations : affichage (défaut connu)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

  test("La page ne doit pas afficher les onglets et compteurs de la liste des factures", async ({ page }) => {
    await ouvrirIntegrations(page);
    await etape(
      page,
      "Aucun onglet « Brouillons » ou « À encaisser » sur la page des intégrations",
      async () => {
        const onglets = (await page.getByRole("tab").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
        expect(
          onglets,
          "Onglets de factures (« Brouillons 3 », « À encaisser 2 », « Terminées ») affichés sur la page des intégrations, avec des nombres écrits en dur",
        ).toEqual([]);
      },
      { capture: "ecran" },
    );
  });
});
