import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { inventorier } from "../exploration.mjs";
import { relever, enregistrer } from "../releve.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { SIGNATURES } from "../donnees/lot-collaboration.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const id = (doc) => doc._id.toHexString();

for (const [role, token] of [
  ["proprietaire", SESSION_TOKEN_COLLAB],
  ["membre", SESSION_TOKEN_COLLAB_MEMBRE],
]) {
  test.describe(`Relevé signatures (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`signatures-${role}`]: "/dashboard/outils/signatures-mail" });
  });
}

// Éditeur de signature (page entière, en-tête compris).
test.describe("Relevé signatures (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("Relevé : signature-editeur-page", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    enregistrer(
      "signature-editeur-page",
      await inventorier(page, {
        ouvrir: (p) => ouvrir(p, `/dashboard/outils/signatures-mail/${id(SIGNATURES.proprietaire)}`),
        zone: (p) => p.locator("main"),
        problemes: surveillance,
      }),
    );
  });
});
