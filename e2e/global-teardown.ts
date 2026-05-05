/**
 * Playwright Global Teardown — removes only the deterministic E2E seeds.
 *
 * Runs once after all test suites.
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

export default async function globalTeardown() {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";

  if (!uri) {
    console.warn("[E2E Teardown] No MONGODB_URI set — skipping cleanup.");
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log(`[E2E Teardown] Cleaning ${db.databaseName}…`);

    // Targeted cleanup — same rationale as global-setup: leave dev data alone.
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

    console.log("[E2E Teardown] Done ✓");
  } finally {
    await client.close();
  }
}
