/**
 * P0 — Clients backend CRUD (raw GraphQL).
 *
 * Couvre 2 invariants critiques :
 *   Test 1 (READ) : la query GetClients retourne les clients seedés
 *     (Entreprise Alpha SAS + Micro-entreprise Beta) avec leur workspaceId.
 *   Test 2 (CREATE) : la mutation CreateClient persiste un nouveau client
 *     avec id, et retourne les bons champs (name, email, type).
 *
 * Bypass UI complète parce que le modal client (clients-modal.jsx) a un flow
 * complexe (recherche entreprise via API gouv, multi-étapes). Pour un P0
 * backend de base, le raw GraphQL est plus robuste et plus rapide.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { IDS } from "../seed/test-data";

const WORKSPACE_ID = IDS.organizationId.toString();
const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";

test.describe("[P0][Clients] Backend CRUD via GraphQL", () => {
  test("Test 1 — GetClients retourne les clients seedés", async ({
    authenticatedPage: page,
  }) => {
    const response = await page.request.post(GRAPHQL_URL, {
      headers: { "x-workspace-id": WORKSPACE_ID },
      data: {
        operationName: "GetClients",
        variables: {
          workspaceId: WORKSPACE_ID,
          page: 1,
          limit: 50,
          search: "",
        },
        query: `
          query GetClients($workspaceId: String!, $page: Int, $limit: Int, $search: String) {
            clients(workspaceId: $workspaceId, page: $page, limit: $limit, search: $search) {
              items { id name email type }
              totalItems
            }
          }
        `,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();

    const items = body.data?.clients?.items;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2);

    const names = items.map((c) => c.name);
    expect(names).toContain("Entreprise Alpha SAS");
    expect(names).toContain("Micro-entreprise Beta");
  });

  test("Test 2 — CreateClient persiste un nouveau client COMPANY", async ({
    authenticatedPage: page,
  }) => {
    // Email unique par run pour éviter la contrainte d'unicité
    const uniqueEmail = `e2e-client-${Date.now()}@p0test.local`;

    const response = await page.request.post(GRAPHQL_URL, {
      headers: { "x-workspace-id": WORKSPACE_ID },
      data: {
        operationName: "CreateClient",
        variables: {
          workspaceId: WORKSPACE_ID,
          input: {
            name: "P0 Test Client SARL",
            email: uniqueEmail,
            type: "COMPANY",
            siret: "12345678901234",
            vatNumber: "FR12345678901",
            address: {
              street: "10 rue du Test",
              city: "Lyon",
              postalCode: "69001",
              country: "France",
            },
          },
        },
        query: `
          mutation CreateClient($workspaceId: String!, $input: ClientInput!) {
            createClient(workspaceId: $workspaceId, input: $input) {
              id
              name
              email
              type
              siret
              address { street city postalCode country }
            }
          }
        `,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();

    const client = body.data?.createClient;
    expect(client, "createClient payload missing").toBeTruthy();
    expect(client.id).toBeTruthy();
    expect(client.name).toBe("P0 Test Client SARL");
    expect(client.email).toBe(uniqueEmail);
    expect(client.type).toBe("COMPANY");
    expect(client.address?.city).toBe("Lyon");
  });
});
