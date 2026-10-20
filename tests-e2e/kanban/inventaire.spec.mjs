/**
 * Relevé des pages kanban peuplées (compte « Collab »), pour écrire les tests
 * de boutons. Lancé seulement avec E2E_INVENTAIRE=1.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { inventorier, contenu } from "../exploration.mjs";
import { relever, enregistrer } from "../releve.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { TABLEAUX } from "../donnees/lot-collaboration.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const id = (doc) => doc._id.toHexString();

const PAGES = (role) => ({
  [`kanban-${role}`]: "/dashboard/outils/kanban",
  [`kanban-tableau-${role}`]: `/dashboard/outils/kanban/${id(TABLEAUX.lecture)}`,
});

for (const [role, token] of [
  ["proprietaire", SESSION_TOKEN_COLLAB],
  ["editeur", SESSION_TOKEN_COLLAB_EDITEUR],
  ["membre", SESSION_TOKEN_COLLAB_MEMBRE],
]) {
  test.describe(`Relevé kanban (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever(PAGES(role));
  });
}

// Relevé de la page entière du tableau (en-tête compris, hors zone « contenu »).
test.describe("Relevé kanban (tableau entier)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("Relevé : kanban-tableau-page", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    enregistrer(
      "kanban-tableau-page",
      await inventorier(page, {
        ouvrir: (p) => ouvrir(p, `/dashboard/outils/kanban/${id(TABLEAUX.lecture)}`),
        zone: (p) => p.locator("main"),
        problemes: surveillance,
      }),
    );
  });
});
