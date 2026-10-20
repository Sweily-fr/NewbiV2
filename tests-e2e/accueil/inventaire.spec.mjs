/**
 * Relevé de l'accueil (E2E_INVENTAIRE=1 seulement), pour chaque compte du
 * lot : propriétaire, Éditeur et Membre de « Pilotage », Comptable (cabinet)
 * et super admin de « Boulangerie Cliente ».
 */
import { test } from "../outils.mjs";
import { relever } from "../releve.mjs";
import {
  connecte,
  SESSION_TOKEN_CABINET,
  SESSION_TOKEN_CLIENT_CABINET,
  SESSION_TOKEN_PILOTAGE,
  SESSION_TOKEN_PILOTAGE_EDITEUR,
  SESSION_TOKEN_PILOTAGE_MEMBRE,
} from "../config.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

for (const [nom, token] of [
  ["proprietaire", SESSION_TOKEN_PILOTAGE],
  ["editeur", SESSION_TOKEN_PILOTAGE_EDITEUR],
  ["membre", SESSION_TOKEN_PILOTAGE_MEMBRE],
  ["cabinet", SESSION_TOKEN_CABINET],
  ["client-cabinet", SESSION_TOKEN_CLIENT_CABINET],
]) {
  test.describe(`Relevé de l'accueil (${nom})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`pil-accueil-${nom}`]: "/dashboard" });
  });
}
