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
  // 1. S'assurer que la query GetClients a résolu — sinon le combobox
  //    ouvre un état vide et l'option n'existe pas.
  //    Best-effort : si la query a déjà répondu avant qu'on s'abonne
  //    (cache Apollo hit), on continue sans bloquer.
  await page
    .waitForResponse(
      (r) =>
        r.url().includes("/graphql") &&
        r.request().postData()?.includes("GetClients") &&
        r.ok(),
      { timeout: 5000 },
    )
    .catch(() => {});

  // 2. Cliquer sur le combobox trigger
  const trigger = page.locator('button[role="combobox"]').first();
  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.click();

  // 3. Attendre que Radix ouvre le popover (data-state="open" sur le trigger)
  await expect(trigger).toHaveAttribute("data-state", "open", {
    timeout: 5000,
  });

  // 4. Cliquer sur l'option. Le rendu (cf client-selector.jsx:746-769) est :
  //    `<button type="button" key={client.id}>{client.name}</button>`
  //    pas de role/data-testid. On cible par texte exact + filter pour
  //    exclure le bouton trigger lui-même (qui contient aussi le nom
  //    du client une fois sélectionné — non pertinent ici car on
  //    sélectionne pour la 1re fois, mais sécurité).
  const option = page
    .locator("button", { hasText: clientName })
    .filter({ hasNot: page.locator('[role="combobox"]') })
    .first();
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();

  // 5. Attendre que le combobox se referme (Radix passe à closed).
  //    Signal stable que la sélection est commitée.
  await expect(trigger).toHaveAttribute("data-state", "closed", {
    timeout: 5000,
  });
}
