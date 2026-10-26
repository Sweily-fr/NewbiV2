import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { inventorier } from "../exploration.mjs";
import { relever, enregistrer } from "../releve.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { TRANSFERTS } from "../donnees/lot-collaboration.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

for (const [role, token] of [
  ["proprietaire", SESSION_TOKEN_COLLAB],
  ["membre", SESSION_TOKEN_COLLAB_MEMBRE],
]) {
  test.describe(`Relevé transferts (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({
      [`transferts-${role}`]: "/dashboard/outils/transferts-fichiers",
      [`transfert-nouveau-${role}`]: "/dashboard/outils/transferts-fichiers/new",
    });
  });
}

// Tiroir de détail d'un transfert (ouvert au clic sur une ligne).
test.describe("Relevé transferts (tiroir)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("Relevé : transfert-tiroir", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    const ouvrirTiroir = async (p) => {
      await ouvrir(p, "/dashboard/outils/transferts-fichiers");
      await p.getByText(TRANSFERTS.actif.title).first().click().catch(() => {});
      await p.waitForTimeout(1200);
    };
    enregistrer("transfert-tiroir", await inventorier(page, { ouvrir: ouvrirTiroir, zone: (p) => p.locator("main"), problemes: surveillance }));
  });
});
