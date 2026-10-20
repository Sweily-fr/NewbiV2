/**
 * Relevé des pages des bons de commande (E2E_INVENTAIRE=1 seulement),
 * organisation « Ventes », pour chaque rôle : liste (une ligne épinglée par
 * statut), sélection, panneau, éditeur. Outil pour écrire les tests, il ne
 * vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { contenu } from "../exploration.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { BC_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { epingler, idDe, ouvrirPanneau, panneau } from "../devis/ventes.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const STATUTS = ["brouillon", "en-attente", "valide", "en-cours", "livre", "annule"];

test.describe("Relevé des bons de commande (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });
  relever({ "ventes-bc": "/dashboard/outils/bons-commande", "ventes-bc-nouveau": "/dashboard/outils/bons-commande/new" });
  [B.aConfirmerEditeur, B.aRepasserBrouillon, B.aLivrer, B.enCours, B.aFacturer, B.annule].forEach((doc, i) =>
    releverEtat(`ventes-bc-ligne-${STATUTS[i]}`, (page) => epingler(page, "bc", doc)),
  );
  [B.aSupprimerGroupe1, B.aEnvoyer, B.valide, B.enCours, B.livre, B.annule].forEach((doc, i) =>
    releverEtat(`ventes-bc-panneau-${STATUTS[i]}`, (page) => ouvrirPanneau(page, "bc", doc), { zone: panneau }),
  );
  releverEtat("ventes-bc-selection", async (page) => {
    await epingler(page, "bc", B.aSupprimerGroupe2);
    await page.getByRole("checkbox", { name: /S[ée]lectionner la ligne/ }).first().check();
    await page.waitForTimeout(500);
  });
  releverEtat("ventes-bc-nouveau-articles", async (page) => {
    await ouvrirEditeur(page, "/dashboard/outils/bons-commande/new");
    await choisirClient(page, "Boulangerie Lumière SARL");
    await continuer(page);
  });
  relever({
    "ventes-bc-edition-brouillon": `/dashboard/outils/bons-commande/${idDe(B.avecCgv)}/editer`,
    "ventes-bc-edition-en-attente": `/dashboard/outils/bons-commande/${idDe(B.aModifierEnAttente)}/editer`,
  });
});

const DOCS_ROLE = {
  editeur: { ligne: [B.cibleSupprimer, B.cibleModifier, B.cibleFacture], panneau: [B.aConfirmerEditeur, B.cibleStatut, B.cibleFacture] },
  lecteur: { ligne: [B.brouillon, B.enAttente, B.livre], panneau: [B.brouillon, B.enAttente, B.livre] },
};
for (const [role, token] of [
  ["editeur", SESSION_TOKEN_VENTES_EDITEUR],
  ["lecteur", SESSION_TOKEN_VENTES_LECTEUR],
]) {
  test.describe(`Relevé des bons de commande (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`ventes-${role}-bc`]: "/dashboard/outils/bons-commande", [`ventes-${role}-bc-nouveau`]: "/dashboard/outils/bons-commande/new" });
    ["brouillon", "en-attente", "livre"].forEach((nom, i) => {
      releverEtat(`ventes-${role}-bc-ligne-${nom}`, (page) => epingler(page, "bc", DOCS_ROLE[role].ligne[i]));
      releverEtat(`ventes-${role}-bc-panneau-${nom}`, (page) => ouvrirPanneau(page, "bc", DOCS_ROLE[role].panneau[i]), { zone: panneau });
    });
    releverEtat(`ventes-${role}-bc-edition`, (page) => ouvrir(page, `/dashboard/outils/bons-commande/${idDe(B.brouillon)}/editer`), { zone: contenu });
  });
}
