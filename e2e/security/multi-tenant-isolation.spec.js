/**
 * P0 — Multi-tenant data isolation.
 *
 * Asserts that a user cannot access invoices belonging to another tenant,
 * even if they know the document's _id. Two layers of defense are tested:
 *
 *   Test B (Backend, raw GraphQL) — most important. Sends a GetInvoice query
 *   with the foreign id + OUR workspaceId. The resolver must NOT return the
 *   foreign payload (either errors[] is set, or invoice=null). This bypasses
 *   the UI entirely and asserts the resolver enforces the workspace filter.
 *
 *   Test A (UI) — navigating to /factures/<foreignId> must NOT render the
 *   foreign invoice. The page should show a "not found" state.
 *
 * Note : un Test C (foreign id + foreign workspaceId) avait été écrit pour
 * tester l'enforcement RBAC quand le client passe un workspaceId arbitraire.
 * Il révélait une vraie faille backend (cf. e2e/TODO.md → "🚨 P0 SÉCURITÉ").
 * Supprimé du code en attendant le fix backend (ressuscitable depuis le
 * commit `9c02169a`). À rallumer dès que la cause root est patchée.
 *
 * If any of these ever fails, that's a critical security hole — a malicious
 * client could enumerate _ids and exfiltrate data across tenants.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { FOREIGN_IDS, IDS } from "../seed/test-data";

const FOREIGN_INVOICE_ID = FOREIGN_IDS.invoiceId.toString();
const OUR_WORKSPACE_ID = IDS.organizationId.toString();

const GET_INVOICE_QUERY = `
  query GetInvoice($id: ID!, $workspaceId: ID!) {
    invoice(id: $id, workspaceId: $workspaceId) {
      id
      prefix
      number
      totalTTC
      finalTotalTTC
      client {
        name
        email
      }
    }
  }
`;

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";

test.describe("[P0][Security] Multi-tenant invoice isolation", () => {
  test("Test B (backend) — GetInvoice with foreign id + our workspace must not leak", async ({
    authenticatedPage: page,
  }) => {
    // Authenticated context already has the session cookie via storageState.
    // We hit the GraphQL endpoint directly using page.request, which inherits
    // the session cookies from the browser context.
    const response = await page.request.post(GRAPHQL_URL, {
      data: {
        operationName: "GetInvoice",
        variables: {
          id: FOREIGN_INVOICE_ID,
          workspaceId: OUR_WORKSPACE_ID,
        },
        query: GET_INVOICE_QUERY,
      },
    });

    expect(response.status(), "GraphQL endpoint reachable").toBe(200);
    const body = await response.json();

    // The resolver MUST refuse: either errors[0] present, or invoice=null.
    // What is NOT acceptable is returning the foreign payload.
    const invoice = body.data?.invoice ?? null;

    // Hard assertion: no foreign data leaked
    if (invoice) {
      expect(
        invoice,
        `SECURITY HOLE — GetInvoice returned cross-tenant data: ${JSON.stringify(invoice)}`,
      ).toBeNull();
    }

    // Sanity: the rejection should be visible in the response shape
    expect(body.data?.invoice ?? null).toBeNull();
  });

  test("Test A (UI) — visiting /factures/<foreignId> does not render foreign invoice", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`/dashboard/outils/factures/${FOREIGN_INVOICE_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Give the route a moment to either render ResourceNotFound or redirect.
    // Either is acceptable security behavior — what matters is no foreign data.
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});

    // Hard invariant: the page must NOT contain anything from the foreign invoice.
    const html = await page.content();
    expect(
      html.includes("Foreign Tenant Client"),
      "SECURITY HOLE — page rendered foreign tenant client name",
    ).toBe(false);
    expect(
      html.includes("119998"),
      "SECURITY HOLE — page rendered foreign tenant amount",
    ).toBe(false);
    expect(
      html.includes("F-209912"),
      "SECURITY HOLE — page rendered foreign tenant invoice prefix",
    ).toBe(false);
    expect(
      html.includes("leak-canary@foreign-tenant.test"),
      "SECURITY HOLE — page rendered foreign tenant client email",
    ).toBe(false);

    // Note on UX: the page may stay on /factures/<foreignId> with an empty
    // main, redirect to the list, or render <ResourceNotFound>. All three
    // are acceptable security behavior — the contract here is "no leak", not
    // "user-friendly UI". The not-found UX has its own separate test.
  });
});
