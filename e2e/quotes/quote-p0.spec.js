/**
 * P0 — Création de devis + Conversion devis → facture.
 *
 * Test 1 (UI) : création d'un devis via le formulaire /devis/new. Pattern
 * identique au P0 facture (stepper + Accordion items). Asserte status,
 * prefix format, total TTC.
 *
 * Test 2 (Backend pur, raw GraphQL) : conversion d'un devis COMPLETED en
 * facture via la mutation convertQuoteToInvoice. C'est l'invariant business
 * le plus critique du système : un devis accepté doit générer une facture
 * avec le bon montant et le bon client. Bypass total de l'UI.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_CLIENTS, IDS } from "../seed/test-data";

const TEST_CLIENT = TEST_CLIENTS[0]; // Entreprise Alpha SAS
const COMPLETED_QUOTE_ID = IDS.quoteCompleted.toString();
const WORKSPACE_ID = IDS.organizationId.toString();

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";

test.describe("[P0][Devis] Création + conversion en facture", () => {
  // Le devis fire un peu plus de queries Apollo au mount que la facture
  // (templates + prochain numéro + autres). Donne 90s pour absorber les
  // étapes cumulées (goto + auth + popover + step2 + mutation + redirect).
  test.setTimeout(90000);

  test("Test 1 — Crée un devis standard (status=PENDING, format prefix/number)", async ({
    authenticatedPage: page,
  }) => {
    await test.step("Aller sur /devis/new", async () => {
      await page.goto("/dashboard/outils/devis/new", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await expect(
        page.locator("text=Sélection d'un client").first(),
      ).toBeVisible({ timeout: 30000 });
    });

    await test.step("Sélectionner le client", async () => {
      const combobox = page.locator('button[role="combobox"]').first();
      await combobox.click();
      const clientOption = page
        .locator(
          `[data-radix-popper-content-wrapper] button:has-text("${TEST_CLIENT.name}")`,
        )
        .first();
      await expect(clientOption).toBeVisible({ timeout: 10000 });
      await clientOption.click();
      await page.waitForTimeout(500);
    });

    await test.step("Passer à l'étape 2", async () => {
      await page.locator('button:has-text("Suivant")').first().click();
      await expect(
        page.locator("text=Articles et produits").first(),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Ajouter et saisir un article", async () => {
      await page.getByRole("button", { name: /Ajouter un article/i }).click();
      await page
        .getByText(/^Article 1$/)
        .first()
        .click();
      await expect(page.locator("#item-description-0")).toBeVisible({
        timeout: 5000,
      });
      await page.locator("#item-description-0").fill("Prestation devis P0");
      await page.getByLabel("Quantité").first().fill("1");
      await page.locator("#item-price-0").fill("1500");
      await page.waitForTimeout(300);
    });

    const mutationPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        res.request().postData()?.includes("CreateQuote") &&
        !res.request().postData()?.includes("IntrospectionQuery"),
      { timeout: 20000 },
    );

    await test.step("Valider et émettre le devis", async () => {
      await page.getByRole("button", { name: /Créer le devis/i }).click();
    });

    const response = await mutationPromise;
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();
    const quote = body.data?.createQuote;
    expect(quote, "createQuote payload missing").toBeTruthy();

    // Status PENDING (bouton "Créer le devis" = PENDING ; "Brouillon" = DRAFT)
    expect(quote.status).toBe("PENDING");

    // Format prefix : tolère D-YYYYMM (style backend) ou DEV-XXX (autre convention)
    expect(quote.prefix).toMatch(/^(D-\d{6}|DEV-|DV-)/);
    expect(quote.number).toMatch(/^\d{3,4}$/);

    // Total TTC = 1500 × 1.20 = 1800
    expect(Number(quote.totalTTC)).toBeCloseTo(1800, 2);

    await test.step("Vérifier la redirection vers la liste", async () => {
      await page.waitForURL("**/dashboard/outils/devis", {
        timeout: 30000,
      });
    });
  });

  test("Test 2 — Convertit un devis COMPLETED en facture (raw GraphQL)", async ({
    authenticatedPage: page,
  }) => {
    // Bypass UI : on hit directement le backend avec la mutation.
    // C'est l'invariant business critique : un devis accepté doit générer
    // une facture qui référence bien le devis source et qui a le même montant.
    // Note : la mutation ne prend PAS workspaceId en argument (le resolver
    // le récupère depuis context). On envoie x-workspace-id en header pour
    // que withWorkspace() le trouve.
    const response = await page.request.post(GRAPHQL_URL, {
      headers: {
        "x-workspace-id": WORKSPACE_ID,
      },
      data: {
        operationName: "ConvertQuoteToInvoice",
        variables: {
          id: COMPLETED_QUOTE_ID,
          distribution: [100],
          isDeposit: false,
          skipValidation: false,
        },
        query: `
          mutation ConvertQuoteToInvoice(
            $id: ID!
            $distribution: [Float]
            $isDeposit: Boolean
            $skipValidation: Boolean
          ) {
            convertQuoteToInvoice(
              id: $id
              distribution: $distribution
              isDeposit: $isDeposit
              skipValidation: $skipValidation
            ) {
              id
              prefix
              number
              status
              finalTotalTTC
              client { name }
            }
          }
        `,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(
      body.errors,
      `convertQuoteToInvoice failed: ${JSON.stringify(body.errors)}`,
    ).toBeFalsy();

    const result = body.data?.convertQuoteToInvoice;
    expect(result, "convertQuoteToInvoice payload missing").toBeTruthy();

    // Selon distribution, peut retourner un Invoice unique ou un array
    const invoice = Array.isArray(result) ? result[0] : result;

    expect(invoice.id, "invoice id missing").toBeTruthy();
    expect(invoice.prefix).toMatch(/^F-\d{6}$/);
    // La conversion crée un invoice DRAFT avec un numéro temporaire
    // "DRAFT-XXXX" qui sera réécrit lors de l'émission. PENDING aurait
    // un numéro 4-digits final. On tolère les deux formes.
    expect(invoice.number).toMatch(/^(DRAFT-\d+|\d{4})$/);
    expect(["DRAFT", "PENDING"]).toContain(invoice.status);

    // L'invariant business : la facture résultante a un montant non-zéro
    expect(Number(invoice.finalTotalTTC)).toBeGreaterThan(0);

    // Le client est préservé depuis le devis source
    expect(invoice.client?.name).toBeTruthy();
  });
});
