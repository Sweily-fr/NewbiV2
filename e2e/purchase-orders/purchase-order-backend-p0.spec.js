/**
 * P0 — Bons de commande (BDC) backend invariants via raw GraphQL.
 *
 * Bypass complet de l'UI parce que /dashboard/outils/bons-commande/new a un
 * blocker timing sur GetNextPurchaseOrderNumber (voir e2e/TODO.md). Ce spec
 * teste l'invariant central : un BDC créé via mutation atterrit en backend
 * avec status correct, prefix BC-YYYYMM, numéro 4-digits, total cohérent.
 *
 * Stratégie cohérente avec ce qui a marché pour clients et conversion devis :
 * raw GraphQL = high-ROI quand l'UI a un blocker non-trivial.
 *
 * Note : status default backend = DRAFT (enum : DRAFT, CONFIRMED, IN_PROGRESS,
 * DELIVERED, CANCELED). Pas de PENDING comme pour les factures.
 * Aucune encryption hook côté model (vérifié), donc pas de risque
 * DATA_ENCRYPTION_KEY similaire aux avoirs.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_CLIENTS, IDS } from "../seed/test-data";

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";
const WORKSPACE_ID = IDS.organizationId.toString();
const TEST_CLIENT = TEST_CLIENTS[0]; // Entreprise Alpha SAS

const CLIENT_INPUT = {
  name: TEST_CLIENT.name,
  email: TEST_CLIENT.email,
  type: "COMPANY",
  siret: TEST_CLIENT.siret,
  vatNumber: TEST_CLIENT.vatNumber,
  address: {
    street: TEST_CLIENT.address.street,
    city: TEST_CLIENT.address.city,
    postalCode: TEST_CLIENT.address.postalCode,
    country: TEST_CLIENT.address.country,
  },
};

test.describe("[P0][BDC] Backend invariants (raw GraphQL)", () => {
  test("Crée un BDC CONFIRMED avec prefix BC-YYYYMM et total cohérent", async ({
    authenticatedPage: page,
  }) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const response = await page.request.post(GRAPHQL_URL, {
      headers: { "x-workspace-id": WORKSPACE_ID },
      data: {
        operationName: "CreatePurchaseOrder",
        variables: {
          workspaceId: WORKSPACE_ID,
          input: {
            client: CLIENT_INPUT,
            issueDate: today,
            status: "CONFIRMED",
            items: [
              {
                description: "Achat matériel P0",
                quantity: 2,
                unitPrice: 500,
                vatRate: 20,
                unit: "unite",
              },
            ],
          },
        },
        query: `
          mutation CreatePurchaseOrder($workspaceId: ID!, $input: CreatePurchaseOrderInput!) {
            createPurchaseOrder(workspaceId: $workspaceId, input: $input) {
              id
              prefix
              number
              status
              totalHT
              totalTTC
              finalTotalTTC
            }
          }
        `,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();

    const po = body.data?.createPurchaseOrder;
    expect(po, "createPurchaseOrder payload missing").toBeTruthy();

    expect(po.id).toBeTruthy();
    expect(po.status).toBe("CONFIRMED");
    expect(po.prefix).toMatch(/^BC-\d{6}$/);
    expect(po.number).toMatch(/^\d{4}$/);

    // Total HT = 2 × 500 = 1000 ; Total TTC = 1000 × 1.20 = 1200
    expect(Number(po.totalHT)).toBeCloseTo(1000, 2);
    expect(Number(po.totalTTC)).toBeCloseTo(1200, 2);
  });
});
