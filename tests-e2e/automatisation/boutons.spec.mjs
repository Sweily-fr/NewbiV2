/**
 * Intégrations (/dashboard/automatisation) : page sans lien dans le menu (le
 * lien est en commentaire dans nav-secondary.jsx), ouverte par son adresse.
 * Chaque intégration est annoncée « Bientôt disponible », bouton grisé.
 *
 * Défaut d'affichage : la page porte encore les onglets de la liste des
 * factures (« Brouillons 3 », « À encaisser 2 », « Terminées »), avec des
 * compteurs écrits en dur et sans contenu derrière (test dédié plus bas).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";

const INTEGRATIONS = ["Oracle", "Sage", "ACD", "Odoo", "Pennylane", "Cegid Quadra", "Cegid Loop"];

const ouvrirIntegrations = (page) =>
  ouvrir(page, "/dashboard/automatisation", { pret: page.getByRole("heading", { name: "Intégrations" }) });

// Onglets restés de la liste des factures : ils ne filtrent rien (aucun contenu derrière).
const ONGLETS = {
  "tab Toutes": { sansEffet: "onglet déjà sélectionné" },
  "tab Brouillons 3": { etat: /\[selected\]/ },
  "tab À encaisser 2": { etat: /\[selected\]/ },
  "tab Terminées": { etat: /\[selected\]/ },
};
const BOUTONS = {
  ...ONGLETS,
  "button Bientôt disponible": { desactive: "intégration pas encore disponible" },
};

for (const [role, token] of [
  ["propriétaire", SESSION_TOKEN_COLLAB],
  ["éditeur", SESSION_TOKEN_COLLAB_EDITEUR],
  ["membre, lecture seule", SESSION_TOKEN_COLLAB_MEMBRE],
]) {
  test.describe(`Intégrations (${role})`, () => {
    test.use({ storageState: connecte(token) });
    verifierBoutons({ test, titre: "Intégrations", ouvrir: ouvrirIntegrations, boutons: BOUTONS });
  });
}

test.describe("Intégrations : contenu de la page", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

  test("Chaque intégration est annoncée « Bientôt disponible », sans bouton actif", async ({ page }) => {
    await ouvrirIntegrations(page);
    await etape(
      page,
      "Sept intégrations, toutes grisées",
      async () => {
        for (const nom of INTEGRATIONS) await expect(page.getByText(nom, { exact: true }).first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Bientôt disponible" })).toHaveCount(INTEGRATIONS.length);
        for (const bouton of await page.getByRole("button", { name: "Bientôt disponible" }).all()) await expect(bouton).toBeDisabled();
        await expect(page.getByRole("button", { name: "Connecter" })).toHaveCount(0);
      },
      { capture: "ecran" },
    );
  });

  test("La page n'affiche pas les onglets et compteurs fictifs de la liste des factures", async ({ page }) => {
    await ouvrirIntegrations(page);
    await etape(
      page,
      "Aucun onglet « Brouillons » ou « À encaisser » sur la page des intégrations",
      async () => {
        const onglets = await page.getByRole("tab").allInnerTexts();
        expect(
          onglets.map((t) => t.replace(/\s+/g, " ").trim()),
          "Onglets de factures (« Brouillons 3 », « À encaisser 2 »…) affichés sur la page des intégrations, avec des nombres écrits en dur",
        ).toEqual([]);
      },
      { capture: "ecran" },
    );
  });
});
