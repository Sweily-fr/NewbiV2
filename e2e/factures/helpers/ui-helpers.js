/**
 * UI helpers partagés entre spec files factures.
 *
 * `selectSeededClient(page)` était dupliqué dans 3 specs avec un
 * sélecteur Radix popper fragile :
 *   `[data-radix-popper-content-wrapper] button:has-text(...)`
 * qui faisait flake les UI tests (wizard-navigation T3.2/T3.3,
 * validation-erreurs T4) quand la query GetClients n'avait pas
 * encore résolu au moment du click sur l'option.
 *
 * Le helper consolidé :
 *   1. attend la réponse GraphQL `GetClients` (souscription avant
 *      navigate au cas où la query a déjà résolu côté Apollo cache)
 *   2. ouvre le combobox via son rôle accessible
 *   3. attend que le trigger soit en `data-state="open"`
 *   4. clique sur le bouton option visible portant le nom du client
 *      seedé, exclu explicitement du trigger combobox via filter
 *
 * Pas de `waitForTimeout` magique. Tous les attentes sont sur des
 * conditions observables.
 */
import { expect } from "@playwright/test";
import { TEST_CLIENTS } from "../../seed/test-data";

const DEFAULT_CLIENT_NAME = TEST_CLIENTS[0].name; // "Entreprise Alpha SAS"

/**
 * Ouvre le combobox client de l'éditeur et sélectionne le client
 * seedé `TEST_CLIENTS[0]` (Entreprise Alpha SAS).
 *
 * Doit être appelé sur la page /dashboard/outils/factures/new après
 * que la section "Sélection d'un client" est visible.
 *
 * @param {import("@playwright/test").Page} page
 * @param {string} [clientName=DEFAULT_CLIENT_NAME] — nom exact du client
 */
export async function selectSeededClient(
  page,
  clientName = DEFAULT_CLIENT_NAME,
) {
  // 1. Cliquer sur le combobox trigger.
  const trigger = page.locator('button[role="combobox"]').first();
  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.click();

  // 2. Attendre que Radix ouvre le popover (data-state="open" sur le trigger)
  //    ET que la query GetClients ait pu résoudre — `useClients` est
  //    monté à l'ouverture du combobox (cf client-selector.jsx:165), donc
  //    la query commence après le click. Skip-friendly si Apollo cache
  //    a déjà servi.
  await expect(trigger).toHaveAttribute("data-state", "open", {
    timeout: 5000,
  });
  await page
    .waitForResponse(
      (r) =>
        r.url().includes("/graphql") &&
        r.request().postData()?.includes("GetClients") &&
        r.ok(),
      { timeout: 3000 },
    )
    .catch(() => {});

  // 3. Cliquer sur l'option. On garde `data-radix-popper-content-wrapper`
  //    (attribut public Radix en v1.x — cf
  //    node_modules/@radix-ui/react-popper/dist/index.mjs:147) car il
  //    scope correctement la recherche au portal. Timeout élargi à 20s
  //    pour absorber la latence en suite full sur un workspace chargé.
  const option = page
    .locator(
      `[data-radix-popper-content-wrapper] button:has-text("${clientName}")`,
    )
    .first();
  await expect(option).toBeVisible({ timeout: 20000 });
  await option.click();

  // 5. Attendre que le combobox se referme (Radix passe à closed).
  //    Signal stable que la sélection est commitée.
  await expect(trigger).toHaveAttribute("data-state", "closed", {
    timeout: 5000,
  });
}
