/**
 * Navigation du wizard de création — bouton "Suivant" enabled/disabled.
 *
 * Couvre INVOICES_PAGE.md §17 (validation au submit / step 1) — la règle
 * isStep1Valid (cf enhanced-invoice-form.jsx:539-547) gate l'accès au step 2
 * sur l'existence d'un client.id dans le formulaire.
 *
 * Note — Test 3.1 ("ouverture page : bouton Suivant disabled sans client")
 * est DÉJÀ couvert par validation-erreurs.spec.js Test 1. On ne le duplique
 * pas. Ce fichier ajoute uniquement les transitions :
 *   3.2 — sélectionner un client → bouton enabled
 *   3.3 — désélectionner le client → bouton redevient disabled
 *
 * Le client picker est un combobox (cf invoices-form-sections/client-
 * selector.jsx) avec un bouton "Supprimer la sélection" (aria-label) pour
 * effacer la sélection une fois faite.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_CLIENTS } from "../seed/test-data";

const TEST_CLIENT = TEST_CLIENTS[0]; // Entreprise Alpha SAS

async function gotoEditor(page) {
  await page.goto("/dashboard/outils/factures/new", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await expect(page.locator("text=Sélection d'un client").first()).toBeVisible({
    timeout: 30000,
  });
}

async function selectSeededClient(page) {
  // Pattern aligné sur validation-erreurs.spec.js + crud-ui.spec.js : ouvrir
  // le combobox, cliquer sur l'option correspondant au client seedé.
  const combobox = page.locator('button[role="combobox"]').first();
  await combobox.click();
  const option = page
    .locator(
      `[data-radix-popper-content-wrapper] button:has-text("${TEST_CLIENT.name}")`,
    )
    .first();
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();
}

async function getNextButton(page) {
  return page.locator('button:has-text("Suivant")').first();
}

test.describe("[Factures] Wizard navigation — bouton Suivant (§17)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(60000);

  test("Test 3.2 — Sélectionner un client active le bouton Suivant (§17.1)", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);

    // Précondition : sans client, le bouton est disabled (cf
    // validation-erreurs.spec.js Test 1 — couvert).
    const nextBtn = await getNextButton(page);
    await expect(nextBtn).toBeDisabled({ timeout: 5000 });

    // Sélectionner le client seedé
    await selectSeededClient(page);

    // Le bouton doit devenir enabled — on attend l'état attendu via
    // waitForFunction plutôt qu'un sleep arbitraire (la propagation passe
    // par setValue + setTimeout(100ms) interne pour synchroniser
    // companyInfo dans use-invoice-editor).
    await page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll("button")).filter(
          (b) => b.textContent?.includes("Suivant"),
        );
        return btns.length > 0 && !btns[0].disabled;
      },
      { timeout: 10000 },
    );
    await expect(
      nextBtn,
      "Suivant doit être enabled une fois le client sélectionné",
    ).toBeEnabled();
  });

  test("Test 3.3 — Désélectionner le client redésactive le bouton Suivant (§17.1)", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);

    // 1. Sélectionner un client → bouton enabled
    await selectSeededClient(page);
    const nextBtn = await getNextButton(page);
    await page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll("button")).filter(
          (b) => b.textContent?.includes("Suivant"),
        );
        return btns.length > 0 && !btns[0].disabled;
      },
      { timeout: 10000 },
    );
    await expect(nextBtn).toBeEnabled();

    // 2. Désélectionner via le bouton "Supprimer la sélection" (X icon dans
    //    le client-selector — cf client-selector.jsx:813-825). Il n'apparaît
    //    qu'une fois un client sélectionné.
    const removeBtn = page.getByRole("button", {
      name: "Supprimer la sélection",
    });
    await expect(removeBtn).toBeVisible({ timeout: 5000 });
    await removeBtn.click();

    // 3. Le bouton Suivant doit redevenir disabled (isStep1Valid retombe à
    //    false dès que client.id n'est plus défini).
    await page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll("button")).filter(
          (b) => b.textContent?.includes("Suivant"),
        );
        return btns.length > 0 && btns[0].disabled;
      },
      { timeout: 10000 },
    );
    await expect(
      nextBtn,
      "Suivant doit redevenir disabled après désélection du client",
    ).toBeDisabled();
  });
});
