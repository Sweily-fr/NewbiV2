/**
 * Relevé de l'espace gestionnaire (E2E_INVENTAIRE=1 seulement) : pages du
 * cabinet, et page d'invitation vue par le client (sans répondre).
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { inventorier } from "../exploration.mjs";
import { enregistrer, relever } from "../releve.mjs";
import { connecte, SESSION_TOKEN_CABINET, SESSION_TOKEN_CLIENT_CABINET } from "../config.mjs";
import { INVITATIONS } from "../donnees/lot-pilotage.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const G = "/dashboard/gestionnaire";

test.describe("Relevé de l'espace gestionnaire (cabinet)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CABINET) });
  relever({
    "pil-gestionnaire-clients": G,
    "pil-gestionnaire-factures": `${G}/factures`,
    "pil-gestionnaire-devis": `${G}/devis`,
    "pil-gestionnaire-bons-commande": `${G}/bons-commande`,
    "pil-gestionnaire-bons-livraison": `${G}/bons-de-livraison`,
    "pil-gestionnaire-avoirs": `${G}/avoirs`,
    "pil-gestionnaire-inviter": `${G}/clients/inviter`,
    "pil-gestionnaire-nouveau": `${G}/clients/nouveau`,
  });
});

test.describe("Relevé de l'invitation d'un cabinet (client)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENT_CABINET) });
  test("Relevé : pil-invitation-gestionnaire", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    const url = `/invitation-gestionnaire/${INVITATIONS.aRefuser._id.toHexString()}`;
    enregistrer(
      "pil-invitation-gestionnaire",
      await inventorier(page, { ouvrir: (p) => ouvrir(p, url), zone: (p) => p.locator("body"), problemes: surveillance, exclure: /^(Accepter|Refuser|Confier)/ }),
    );
  });
});
