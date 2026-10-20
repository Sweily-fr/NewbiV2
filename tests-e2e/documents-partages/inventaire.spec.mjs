import { test } from "../outils.mjs";
import { relever } from "../releve.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

for (const [role, token] of [
  ["proprietaire", SESSION_TOKEN_COLLAB],
  ["membre", SESSION_TOKEN_COLLAB_MEMBRE],
]) {
  test.describe(`Relevé documents partagés (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`documents-partages-${role}`]: "/dashboard/outils/documents-partages" });
  });
}
