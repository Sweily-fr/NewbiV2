/**
 * One-shot cleanup of E2E fixtures left behind in the DEV database.
 *
 * Context: until today, e2e/global-setup.ts was seeding into invoice-app
 * (the dev DB) instead of invoice-app-test. The teardown only removes the
 * specific seeded _ids, so any document a test created during its run
 * (invoices, clients, counters…) stayed in invoice-app and started showing
 * up in the user's dev dashboard.
 *
 * Now that the e2e setup writes to invoice-app-test, this script wipes the
 * accumulated leftovers from invoice-app once.
 *
 * Run:   CONFIRM_CLEANUP=yes node e2e/scripts/cleanup-dev-db.mjs
 *
 * Safety:
 *   - Refuses any DB name that isn't exactly "invoice-app".
 *   - Refuses URIs containing "prod", "live", or "production".
 *   - Requires CONFIRM_CLEANUP=yes.
 */

import { MongoClient, ObjectId } from "mongodb";

const URI = process.env.CLEANUP_URI || "mongodb://localhost:27017/invoice-app";
const EXPECTED_DB = "invoice-app";

// Mirror of e2e/seed/test-data.ts — kept in sync manually because importing
// a .ts file from a .mjs runner needs tsx and we don't want a new dep.
const TEST_ORG_ID = new ObjectId("bbbbbbbbbbbbbbbbbbbb0001");
const TEST_MEMBER_ID = new ObjectId("bbbbbbbbbbbbbbbbbbbb0002");
const TEST_USER_ID = new ObjectId("aaaaaaaaaaaaaaaaaaaaa001");
const FOREIGN_ORG_ID = new ObjectId("ffffffffffffffff00000099");
const FOREIGN_USER_ID = new ObjectId("ffffffffffffffff00000003");
const FOREIGN_INVOICE_ID = new ObjectId("ffffffffffffffff00000001");
const FOREIGN_CLIENT_ID = new ObjectId("ffffffffffffffff00000002");

const TEST_USER_EMAIL = "test-e2e@newbi.fr";

// All known seeded _ids (cross-checked with global-setup.ts upserts).
const SEEDED_INVOICE_IDS = [
  new ObjectId("dddddddddddddddddddd0001"),
  new ObjectId("dddddddddddddddddddd0002"),
  new ObjectId("dddddddddddddddddddd0003"),
  FOREIGN_INVOICE_ID,
];
const SEEDED_QUOTE_IDS = [
  new ObjectId("ffffffffffffffffffff0001"),
  new ObjectId("ffffffffffffffffffff0002"),
  new ObjectId("ffffffffffffffffffff0003"),
];
const SEEDED_CLIENT_IDS = [
  new ObjectId("cccccccccccccccccccc0001"),
  new ObjectId("cccccccccccccccccccc0002"),
  FOREIGN_CLIENT_ID,
];
const SEEDED_EXPENSE_IDS = [new ObjectId("eeeeeeeeeeeeeeeeeeee0001")];

const ORG_IDS = [TEST_ORG_ID, FOREIGN_ORG_ID];
const ORG_IDS_STR = ORG_IDS.map((o) => o.toString());

// Collections wiped by-workspaceId. Both ObjectId and string forms because
// resolvers historically wrote workspaceId both ways depending on the path.
const WORKSPACE_COLLECTIONS = [
  "clients",
  "invoices",
  "quotes",
  "creditnotes",
  "expenses",
  "purchaseinvoices",
  "purchaseorders",
  "documentcounters",
  "products",
  "suppliers",
  "transactions",
];

function ensureSafe(uri) {
  const lower = uri.toLowerCase();
  if (/(prod|live|production)/.test(lower)) {
    throw new Error(
      `[Cleanup] URI looks production-shaped (${uri}). Refusing.`,
    );
  }
  // Extract the DB name: last path segment, strip query string.
  const dbName = uri.split("/").pop()?.split("?")[0] || "";
  if (dbName !== EXPECTED_DB) {
    throw new Error(
      `[Cleanup] Expected DB "${EXPECTED_DB}", got "${dbName}". Refusing.`,
    );
  }
  if (process.env.CONFIRM_CLEANUP !== "yes") {
    throw new Error(
      `[Cleanup] Set CONFIRM_CLEANUP=yes to actually run. Aborting (dry mode).`,
    );
  }
  return dbName;
}

async function safeDelete(coll, filter, label) {
  try {
    const exists = await coll.findOne({}, { projection: { _id: 1 } });
    // Collection might be empty / non-existent — both are fine.
    void exists;
    const res = await coll.deleteMany(filter);
    return { label, deleted: res.deletedCount || 0 };
  } catch (err) {
    if (err?.code === 26 /* NamespaceNotFound */) {
      return { label, deleted: 0, skipped: true };
    }
    throw err;
  }
}

async function main() {
  const dbName = ensureSafe(URI);
  console.log(`[Cleanup] Target: ${URI}`);
  console.log(`[Cleanup] Confirmed DB name: ${dbName}\n`);

  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db();

  // Sanity: double-check the live connection landed where we asked.
  if (db.databaseName !== EXPECTED_DB) {
    await client.close();
    throw new Error(
      `[Cleanup] Connected to "${db.databaseName}", expected "${EXPECTED_DB}". Refusing.`,
    );
  }

  const results = [];

  try {
    // 1. Test users (seeded + any other test-pattern leftovers).
    const userFilter = {
      $or: [
        { email: TEST_USER_EMAIL },
        { email: /test-e2e@/ },
        { email: /@test\.newbi/ },
        { _id: TEST_USER_ID },
        { _id: FOREIGN_USER_ID },
      ],
    };
    // Capture the user _ids before deleting them so we can clean their
    // Better Auth sessions/accounts/verification rows next.
    const usersToDelete = await db
      .collection("user")
      .find(userFilter, { projection: { _id: 1, email: 1 } })
      .toArray();
    const userIds = usersToDelete.map((u) => u._id);
    const userIdsStr = userIds.map((id) => id.toString());
    const userEmails = usersToDelete.map((u) => u.email).filter(Boolean);

    results.push(await safeDelete(db.collection("user"), userFilter, "user"));

    // 2. Better Auth auxiliary collections — userId stored as string.
    if (userIdsStr.length) {
      results.push(
        await safeDelete(
          db.collection("session"),
          { userId: { $in: userIdsStr } },
          "session",
        ),
      );
      results.push(
        await safeDelete(
          db.collection("account"),
          { userId: { $in: userIdsStr } },
          "account",
        ),
      );
    }
    if (userEmails.length) {
      results.push(
        await safeDelete(
          db.collection("verification"),
          { identifier: { $in: userEmails } },
          "verification",
        ),
      );
    }

    // 3. Organizations (TEST + FOREIGN) and their members + subscriptions.
    results.push(
      await safeDelete(
        db.collection("organization"),
        { _id: { $in: ORG_IDS } },
        "organization",
      ),
    );
    results.push(
      await safeDelete(
        db.collection("member"),
        {
          $or: [
            { _id: TEST_MEMBER_ID },
            { organizationId: { $in: ORG_IDS_STR } },
            { organizationId: { $in: ORG_IDS } },
          ],
        },
        "member",
      ),
    );
    results.push(
      await safeDelete(
        db.collection("subscription"),
        { referenceId: { $in: ORG_IDS_STR } },
        "subscription",
      ),
    );

    // 4. Business collections — anything tied to one of the test workspaces.
    //    workspaceId may be stored as ObjectId or string, so match both.
    const workspaceFilter = {
      $or: [
        { workspaceId: { $in: ORG_IDS } },
        { workspaceId: { $in: ORG_IDS_STR } },
      ],
    };
    for (const collName of WORKSPACE_COLLECTIONS) {
      results.push(
        await safeDelete(db.collection(collName), workspaceFilter, collName),
      );
    }

    // 5. Belt-and-braces: targeted _id deletes for the seed fixtures, in case
    //    a doc was somehow re-attached to a different workspaceId.
    results.push(
      await safeDelete(
        db.collection("invoices"),
        { _id: { $in: SEEDED_INVOICE_IDS } },
        "invoices (seeded _ids)",
      ),
    );
    results.push(
      await safeDelete(
        db.collection("quotes"),
        { _id: { $in: SEEDED_QUOTE_IDS } },
        "quotes (seeded _ids)",
      ),
    );
    results.push(
      await safeDelete(
        db.collection("clients"),
        { _id: { $in: SEEDED_CLIENT_IDS } },
        "clients (seeded _ids)",
      ),
    );
    results.push(
      await safeDelete(
        db.collection("expenses"),
        { _id: { $in: SEEDED_EXPENSE_IDS } },
        "expenses (seeded _ids)",
      ),
    );

    // ─── Recap ──────────────────────────────────────────────────────
    console.log(`[Cleanup ${dbName}] Deleted:`);
    let total = 0;
    for (const r of results) {
      const tag = r.skipped ? " (collection missing — skipped)" : "";
      console.log(`  - ${r.label.padEnd(28)} ${r.deleted}${tag}`);
      total += r.deleted;
    }
    console.log(`\n[Cleanup ${dbName}] Total documents removed: ${total}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
