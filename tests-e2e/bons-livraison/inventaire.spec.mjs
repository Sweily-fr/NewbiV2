/**
 * Relevé des pages des bons de livraison (E2E_INVENTAIRE=1 seulement),
 * organisation « Ventes », pour chaque rôle : liste (une ligne épinglée par
 * statut), sélection, panneau, éditeur, page d'un bon. Outil pour écrire
 * les tests, il ne vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { contenu } from "../exploration.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR, SESSION_TOKEN_FREELANCE_VENTES } from "../config.mjs";
import { BL_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { epingler, idDe, ouvrirPanneau, panneau } from "../devis/ventes.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const STATUTS = ["brouillon", "a-expedier", "expedie", "livre", "annule"];

test.describe("Relevé des bons de livraison (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });
  relever({
    "ventes-bl": "/dashboard/outils/bons-de-livraison",
    "ventes-bl-nouveau": "/dashboard/outils/bons-de-livraison/new",
    "ventes-bl-consultation": `/dashboard/outils/bons-de-livraison/${idDe(B.consultation)}`,
    "ventes-bl-edition-brouillon": `/dashboard/outils/bons-de-livraison/${idDe(B.aEmettre)}/editer`,
    "ventes-bl-edition-a-expedier": `/dashboard/outils/bons-de-livraison/${idDe(B.aModifier)}/editer`,
  });
  [B.aEmettre, B.aExpedierPanneau, B.aReceptionner, B.aFacturer, B.annule].forEach((doc, i) =>
    releverEtat(`ventes-bl-ligne-${STATUTS[i]}`, (page) => epingler(page, "bl", doc)),
  );
  [B.aSupprimerGroupe1, B.pdf, B.expedie, B.livre, B.annule].forEach((doc, i) =>
    releverEtat(`ventes-bl-panneau-${STATUTS[i]}`, (page) => ouvrirPanneau(page, "bl", doc), { zone: panneau }),
  );
  releverEtat("ventes-bl-selection", async (page) => {
    await epingler(page, "bl", B.aSupprimerGroupe2);
    await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    await page.waitForTimeout(500);
  });
  releverEtat("ventes-bl-nouveau-articles", async (page) => {
    await ouvrirEditeur(page, "/dashboard/outils/bons-de-livraison/new");
    await choisirClient(page, "Boulangerie Lumière SARL");
    await continuer(page);
  });
});

const DOCS_ROLE = {
  editeur: { ligne: [B.cibleSupprimer, B.cibleStatut, B.cibleFacture], panneau: [B.aSupprimerGroupe2, B.aAnnulerEditeur, B.cibleReception] },
  lecteur: { ligne: [B.brouillon, B.aExpedier, B.livre], panneau: [B.brouillon, B.aExpedier, B.livre] },
};
for (const [role, token] of [
  ["editeur", SESSION_TOKEN_VENTES_EDITEUR],
  ["lecteur", SESSION_TOKEN_VENTES_LECTEUR],
]) {
  test.describe(`Relevé des bons de livraison (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({
      [`ventes-${role}-bl`]: "/dashboard/outils/bons-de-livraison",
      [`ventes-${role}-bl-nouveau`]: "/dashboard/outils/bons-de-livraison/new",
      [`ventes-${role}-bl-consultation`]: `/dashboard/outils/bons-de-livraison/${idDe(B.expedie)}`,
    });
    ["brouillon", "a-expedier", "livre"].forEach((nom, i) => {
      releverEtat(`ventes-${role}-bl-ligne-${nom}`, (page) => epingler(page, "bl", DOCS_ROLE[role].ligne[i]));
      releverEtat(`ventes-${role}-bl-panneau-${nom}`, (page) => ouvrirPanneau(page, "bl", DOCS_ROLE[role].panneau[i]), { zone: panneau });
    });
    releverEtat(`ventes-${role}-bl-edition`, (page) => ouvrir(page, `/dashboard/outils/bons-de-livraison/${idDe(B.brouillon)}/editer`), { zone: contenu });
  });
}

// Offre d'entrée : les bons de livraison sont ouverts à toutes les offres.
test.describe("Relevé des bons de livraison (offre d'entrée)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_VENTES) });
  relever({ "freelance-bl": "/dashboard/outils/bons-de-livraison", "freelance-devis": "/dashboard/outils/devis" });
});
