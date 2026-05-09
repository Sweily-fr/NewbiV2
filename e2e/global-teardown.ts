/**
 * Playwright Global Teardown — removes only the deterministic E2E seeds
 * AND the dynamic content created by the tests in the test workspace.
 *
 * Runs once after all test suites.
 *
 * R16 fix (phase 4) : the previous teardown only deleted invoices whose
 * `_id` matched a seed fixture, leaving every invoice/quote/credit-note
 * created at runtime by `createInvoiceMutation` & friends in the
 * collection. Over weeks of runs that accumulated to 530+ invoices,
 * 51 quotes, 54 credit-notes, 104 DocumentCounters in the test workspace
 * — slow enough to make `latestInvoiceIssueDate`, `getInvoices`,
 * `nextInvoiceNumber` etc. timeout intermittently in the full suite.
 *
 * Strategy : after deleting the seed-id-pinned fixtures (kept for the
 * familiar shape), additionally `deleteMany({ workspaceId })` on all
 * collections that the tests write into, scoped to the seed test
 * workspace ONLY. The DB-name safety guard (must contain "test" or
 * "e2e", same rule as global-setup.ts) prevents accidental wipes of
 * the dev DB.
 */
import { MongoClient } from "mongodb";
import {
  IDS,
  TEST_USER,
  TEST_CLIENTS,
  TEST_INVOICES,
  TEST_QUOTES,
  TEST_SUPPLIER_EXPENSE,
  FOREIGN_INVOICE,
} from "./seed/test-data";

function getTeardownUri(): string {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";
  if (!uri) return "";

  // Same safety guard as global-setup.ts: refuse to touch a DB whose
  // name doesn't include "test"/"e2e" (or a host marked "staging").
  // Loss of dev data here would be silent and irreversible — the
  // Principle of least surprise demands an explicit name check.
  const lower = uri.toLowerCase();
  const dbName = uri.split("/").pop()?.split("?")[0]?.toLowerCase() || "";
  const dbNameIsSafe = dbName.includes("test") || dbName.includes("e2e");
  const hostIsSafe =
    lower.includes("staging") ||
    ((lower.includes("localhost") || lower.includes("127.0.0.1")) &&
      dbNameIsSafe);

  if (!hostIsSafe) {
    console.error(
      `[E2E Teardown] REFUSING to teardown ${uri.slice(0, 80)}… — ` +
        `DB name must contain "test"/"e2e" (got "${dbName}") or host must be staging.`,
    );
    return "";
  }

  return uri;
}

export default async function globalTeardown() {
  const uri = getTeardownUri();
  if (!uri) {
    console.warn("[E2E Teardown] No safe MONGODB_URI — skipping cleanup.");
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log(`[E2E Teardown] Cleaning ${db.databaseName}…`);

    // ── Phase 1 — seed fixtures (idempotent, by _id) ──────────────────
    // Same as before: targeted delete by seeded ObjectId so the next
    // setup starts from a known empty slate.
    const clientIds = TEST_CLIENTS.map((c) => c._id);
    const invoiceIds = [
      ...TEST_INVOICES.map((i) => i._id),
      FOREIGN_INVOICE._id,
    ];
    const quoteIds = TEST_QUOTES.map((q) => q._id);

    await db.collection("user").deleteOne({ _id: IDS.user });
    await db.collection("organization").deleteOne({ _id: IDS.organizationId });
    await db.collection("member").deleteOne({ _id: IDS.memberId });
    await db.collection("clients").deleteMany({ _id: { $in: clientIds } });
    await db.collection("invoices").deleteMany({ _id: { $in: invoiceIds } });
    await db.collection("quotes").deleteMany({ _id: { $in: quoteIds } });
    await db
      .collection("expenses")
      .deleteOne({ _id: TEST_SUPPLIER_EXPENSE._id });
    await db.collection("session").deleteMany({ userId: IDS.user.toString() });
    await db.collection("account").deleteMany({ userId: IDS.user.toString() });
    await db
      .collection("verification")
      .deleteMany({ identifier: TEST_USER.email });
    await db
      .collection("subscription")
      .deleteMany({ referenceId: IDS.organizationId.toString() });

    // ── Phase 2 — dynamic content sweep (R16 fix) ─────────────────────
    // Delete every document created at runtime by the tests in the test
    // workspace. The seed's organization is already gone (Phase 1), so
    // these would otherwise stay forever.
    //
    // workspaceId is stored as ObjectId in invoices/quotes/credit-notes/
    // expenses/purchase-orders, but as string in documentcounters
    // (cf newbi-api/src/models/DocumentCounter.js — `workspaceId: String`).
    // Both forms are handled below.
    const wsObjectId = IDS.organizationId; // already an ObjectId
    const wsString = IDS.organizationId.toString();

    const sweepCollections: {
      name: string;
      filter: Record<string, unknown>;
    }[] = [
      { name: "invoices", filter: { workspaceId: wsObjectId } },
      { name: "quotes", filter: { workspaceId: wsObjectId } },
      { name: "creditnotes", filter: { workspaceId: wsObjectId } },
      { name: "expenses", filter: { workspaceId: wsObjectId } },
      { name: "purchaseorders", filter: { workspaceId: wsObjectId } },
      { name: "purchaseinvoices", filter: { workspaceId: wsObjectId } },
      { name: "imported_invoices", filter: { workspaceId: wsObjectId } },
      { name: "imported_quotes", filter: { workspaceId: wsObjectId } },
      // DocumentCounter stores workspaceId as String
      { name: "documentcounters", filter: { workspaceId: wsString } },
    ];

    let sweepTotal = 0;
    const sweepReport: string[] = [];
    for (const { name, filter } of sweepCollections) {
      try {
        const result = await db.collection(name).deleteMany(filter);
        if (result.deletedCount > 0) {
          sweepReport.push(`${name}: ${result.deletedCount}`);
          sweepTotal += result.deletedCount;
        }
      } catch (err) {
        // Collection may not exist on a fresh DB — ignore.
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("ns not found")) {
          console.warn(`[E2E Teardown] Skipping ${name}: ${msg}`);
        }
      }
    }

    if (sweepTotal > 0) {
      console.log(
        `  ↳ Swept ${sweepTotal} dynamic docs from test workspace: ${sweepReport.join(", ")}`,
      );
    }

    console.log("[E2E Teardown] Done ✓");
  } finally {
    await client.close();
  }
}
