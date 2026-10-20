/**
 * Relevé des pages publiques à formulaire (E2E_INVENTAIRE=1 seulement),
 * visiteur sans session : contact, générateurs, calculateur, index des outils.
 */
import { test } from "../outils.mjs";
import { relever } from "../releve.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

test.describe("Relevé des pages publiques", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  relever({ "pil-contact": "/contact" }, { zone: (p) => p.locator("form").first() });
  relever(
    {
      "pil-generateur-facture": "/outils/generateur-de-facture",
      "pil-generateur-devis": "/outils/generateur-de-devis",
      "pil-calculateur-penalites": "/outils/calculateur-penalites-retard",
      "pil-outils": "/outils",
    },
    { zone: (p) => p.locator("main").first() },
  );
});
