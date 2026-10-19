import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, DOSSIERS, sessionCookie } from "./config.mjs";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Tests de bout en bout de Newbi (site + API) sur des données de test (base
 * Mongo en mémoire, voir serveur.mjs), jamais sur la prod. Depuis la racine :
 *   npm run tests-e2e        tous les tests, navigateur invisible
 *   npm run tests-e2e:ui     fenêtre Playwright : on lance, on voit chaque page
 *   npm run tests-e2e:voir   navigateur visible
 * En local : NEWBI_API_DIR=<copie de newbi-api sans .env> (voir README.md).
 * Les dossiers de résultats sont relatifs à la racine du site.
 */
export default defineConfig({
  testDir: ".",
  // Le relevé des pages (outil pour écrire les tests) ne tourne que seul, à la demande.
  ...(process.env.E2E_INVENTAIRE === "1" ? { testMatch: "**/inventaire.spec.mjs" } : { testMatch: "**/*.spec.mjs", testIgnore: "**/inventaire.spec.mjs" }),
  outputDir: path.join(RACINE, DOSSIERS.resultats),
  globalSetup: "./prechauffage.mjs",
  fullyParallel: true,
  // Un test à la fois : les données sont partagées et la machine de CI est
  // modeste (même choix que la suite de l'admin).
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(RACINE, DOSSIERS.rapportHtml) }],
    // Résultats et captures pour la page « Tests » de l'admin (CI).
    ...(process.env.E2E_RAPPORT_ADMIN === "1" ? [["./rapport-admin.mjs", { dossier: path.join(RACINE, "rapport-admin") }]] : []),
  ],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    // « Copier l'e-mail », « Copier le lien » : le presse-papiers doit marcher comme chez un utilisateur.
    permissions: ["clipboard-read", "clipboard-write"],
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Rapport pour l'admin (CI) : la vidéo de chaque test, vert ou rouge, pour
    // voir ce que le navigateur a vraiment fait. En local, seulement les échecs.
    video: process.env.E2E_RAPPORT_ADMIN === "1" ? "on" : "retain-on-failure",
    // Connecté d'office avec le compte de test (session écrite dans la base en mémoire).
    storageState: { cookies: [sessionCookie()], origins: [] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: "node tests-e2e/serveur.mjs",
    cwd: RACINE,
    url: `${BASE_URL}/auth/login`,
    // Toujours un serveur neuf : les données de test sont réécrites à chaque lancement.
    reuseExistingServer: false,
    // Base en mémoire, API, puis build de production du site : plusieurs minutes.
    timeout: 900_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
