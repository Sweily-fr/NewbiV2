// Config jetable (supprimée après exécution) : lance un spec de page publique
// contre le serveur Next déjà actif sur :3000, sans le globalSetup qui seed un
// utilisateur de test (il exige la base invoice-app-test + le backend e2e).
import { defineConfig, devices } from "@playwright/test";

const OPERA_PATH =
  process.env.PLAYWRIGHT_BROWSER_PATH ||
  "/Applications/Opera.app/Contents/MacOS/Opera";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3000",
    testIdAttribute: "data-testid",
    navigationTimeout: 60000,
    actionTimeout: 15000,
    launchOptions: { executablePath: OPERA_PATH },
  },
  projects: [{ name: "public", use: { ...devices["Desktop Chrome"] } }],
});
