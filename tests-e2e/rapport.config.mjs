import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Rapport unique d'un lancement réparti sur plusieurs machines : la CI
 * rassemble leurs résultats bruts (`playwright merge-reports -c
 * tests-e2e/rapport.config.mjs`) et produit le rapport Playwright complet et
 * celui de la page « Tests » de l'admin, comme si tout avait tourné ensemble.
 */
export default defineConfig({
  testDir: ".",
  reporter: [
    ["html", { open: "never", outputFolder: path.join(RACINE, "tests-e2e/rapport-html") }],
    ["./rapport-admin.mjs", { dossier: path.join(RACINE, "rapport-admin") }],
  ],
});
