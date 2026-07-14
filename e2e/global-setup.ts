/**
 * Playwright Global Setup — seeds the test MongoDB with deterministic E2E data.
 *
 * Credential creation goes through the Better Auth HTTP signup endpoint so the
 * password is hashed with Better Auth's own format (scrypt, not bcrypt) — this
 * is the only reliable way to make login work without duplicating the auth
 * library's internals.
 *
 * Runs once before all test suites.
 */
import { MongoClient, ObjectId } from "mongodb";
import {
  IDS,
  TEST_ORGANIZATION,
  TEST_MEMBER,
  TEST_CLIENTS,
  TEST_INVOICES,
  TEST_QUOTES,
  TEST_SUPPLIER_EXPENSE,
  FOREIGN_INVOICE,
} from "./seed/test-data";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";

  if (!uri) {
    throw new Error(
      "[E2E Seed] MONGODB_URI_TEST (or MONGODB_URI) is not set. Aborting.",
    );
  }

  // Require the DB *name* itself to mark it as a test database — relying on
  // "localhost" alone would let a misconfig silently seed into invoice-app
  // (the dev DB), which is exactly the bug this check is here to prevent.
  const lower = uri.toLowerCase();
  const dbName = uri.split("/").pop()?.split("?")[0]?.toLowerCase() || "";
  const dbNameIsSafe = dbName.includes("test") || dbName.includes("e2e");
  const hostIsSafe =
    lower.includes("staging") ||
    ((lower.includes("localhost") || lower.includes("127.0.0.1")) &&
      dbNameIsSafe);

  if (!hostIsSafe) {
    throw new Error(
      `[E2E Seed] Refusing to seed into ${uri.slice(0, 80)}… — ` +
        `the database name must contain "test" or "e2e" (got "${dbName}"), ` +
        `or the host must contain "staging".`,
    );
  }

  return uri;
}

async function ensureTestUser(
  baseUrl: string,
  email: string,
  password: string,
) {
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl, // Better Auth requires a non-null Origin
    },
    body: JSON.stringify({ email, password, name: "Test E2E" }),
  });

  const bodyText = await res.text();
  let bodyJson: { code?: string; message?: string } | null = null;
  try {
    bodyJson = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    // Body wasn't JSON — keep the raw text for the error message.
  }

  if (res.ok) {
    console.log(`  ↳ Created Better Auth user ${email} (status ${res.status})`);
    return;
  }

  // Better Auth signals "user already exists" with code USER_ALREADY_EXISTS
  // (or a 4xx message containing those words). Treat anything else — including
  // generic 400/422 responses — as a real failure so we don't silently skip
  // signup and crash later on the missing-user lookup.
  const haystack = [bodyJson?.code, bodyJson?.message, bodyText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isAlreadyExists =
    haystack.includes("already exists") ||
    haystack.includes("user_already_exists") ||
    haystack.includes("user_exists");

  if (isAlreadyExists) {
    console.log(
      `  ↳ Test user ${email} already exists — reusing (status ${res.status})`,
    );
    return;
  }

  throw new Error(
    `[E2E Seed] Signup failed for ${email}: status=${res.status}, body=${bodyText.slice(0, 500)}`,
  );
}

export default async function globalSetup() {
  const uri = getMongoUri();
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "[E2E Seed] TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test",
    );
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log(`[E2E Seed] Connected to ${db.databaseName}`);

    // Belt-and-suspenders cleanup: if the previous teardown was skipped
    // (e.g. `--ui` killed with Ctrl+C, process crash), a stale user is still
    // in the DB. Signup would then no-op via the 422 branch in
    // ensureTestUser, and login would fail 401 because the stored hash was
    // computed from the *previous* TEST_USER_PASSWORD. Wipe first so signup
    // always recreates the credential against the current .env.test value.
    const stale = await db.collection("user").findOne({ email });
    if (stale) {
      const id = stale._id;
      const idStr = id.toString();
      await db.collection("account").deleteMany({
        $or: [{ userId: idStr }, { userId: id }],
      });
      await db.collection("session").deleteMany({
        $or: [{ userId: idStr }, { userId: id }],
      });
      await db.collection("user").deleteOne({ _id: id });
      console.log(`  ↳ Cleared stale user ${email} from previous run`);
    }

    // 1. Create the test user through Better Auth. After the wipe above this
    //    always hits the "created" path on a healthy DB; the 422 branch in
    //    ensureTestUser remains as a safety net for concurrent runs.
    await ensureTestUser(baseUrl, email, password);

    // 2. Look up the created user by email so we can wire the organization/
    //    member references to the real Better Auth user id.
    const userDoc = await db.collection("user").findOne({ email });
    if (!userDoc) {
      const userCount = await db.collection("user").countDocuments();
      const sampleEmails = await db
        .collection("user")
        .find({}, { projection: { email: 1, _id: 0 } })
        .limit(5)
        .toArray();
      const safeUri = uri.replace(/\/\/[^@]*@/, "//***@");
      throw new Error(
        `[E2E Seed] Could not find user "${email}" after signup. ` +
          `Looked in db="${db.databaseName}" via uri="${safeUri}". ` +
          `Total users in this DB: ${userCount}. ` +
          `Sample emails: ${JSON.stringify(sampleEmails.map((u) => u.email))}. ` +
          `If the signup logged status 200 but the user is missing, the frontend ` +
          `wrote to a different database — confirm MONGODB_URI / MONGODB_DB_NAME ` +
          `are identical between the seed and the Next server (npm run start:e2e).`,
      );
    }
    const realUserId = userDoc._id;

    // Mark the user as having seen onboarding so OnboardingGuard does not
    // redirect to /auth/signup. Also set hasCompletedTutorial to skip tutorial
    // overlay on the dashboard.
    await db
      .collection("user")
      .updateOne(
        { _id: realUserId },
        { $set: { hasSeenOnboarding: true, hasCompletedTutorial: true } },
      );

    // Idempotent seed — all writes are replaceOne+upsert so reruns (with or
    // without teardown) never hit duplicate-key errors. Members with stale
    // userIds (e.g. from a previous test user) are still cleaned up.
    await db.collection("member").deleteMany({
      $or: [{ userId: realUserId.toString() }, { userId: realUserId }],
    });

    // Organization + membership (Better Auth raw collections)
    await db.collection("organization").replaceOne(
      { _id: IDS.organizationId },
      {
        ...TEST_ORGANIZATION,
        createdBy: realUserId.toString(),
      },
      { upsert: true },
    );
    // Better Auth's Mongo adapter coerces `userId` and `organizationId`
    // (both have `references: { field: "id" }` in the schema) to ObjectId
    // before querying. Real members written by Better Auth itself have these
    // fields stored as ObjectId. If the seed inserts strings, lookups like
    // `findFullOrganization` (which joins member by organizationId) and
    // `findMemberByOrgId` silently return null → 403/400 cascade in the
    // dashboard.
    await db.collection("member").replaceOne(
      { _id: TEST_MEMBER._id },
      {
        ...TEST_MEMBER,
        userId: realUserId,
        organizationId: IDS.organizationId,
      },
      { upsert: true },
    );
    console.log("  ↳ Upserted organization + member");

    // Subscription — the dashboard layout redirects to /onboarding when the
    // active organization has no active/trialing subscription. Seed a trialing
    // one so the test user lands directly on /dashboard.
    await db.collection("subscription").deleteMany({
      referenceId: IDS.organizationId.toString(),
    });
    await db.collection("subscription").insertOne({
      referenceId: IDS.organizationId.toString(),
      organizationId: IDS.organizationId.toString(),
      plan: "pme",
      status: "trialing",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("  ↳ Inserted trialing subscription");

    // Also set activeOrganizationId on any existing sessions for this user so
    // the dashboard layout's first check picks our seeded org.
    await db
      .collection("session")
      .updateMany(
        { userId: realUserId.toString() },
        { $set: { activeOrganizationId: IDS.organizationId.toString() } },
      );

    // Rewrite fixtures with the real userId + organizationId
    const rewire = <T extends { workspaceId?: unknown; createdBy?: unknown }>(
      docs: T[],
    ) =>
      docs.map((d) => ({
        ...d,
        workspaceId: IDS.organizationId,
        createdBy: realUserId,
      }));

    // Idempotent bulk upserts (replaceOne with upsert per document) instead
    // of insertMany, so a rerun without teardown never hits duplicate-key.
    const upsertOps = <T extends { _id: ObjectId }>(docs: T[]) =>
      docs.map((d) => ({
        replaceOne: {
          filter: { _id: d._id },
          replacement: d,
          upsert: true,
        },
      }));

    await db.collection("clients").bulkWrite(upsertOps(rewire(TEST_CLIENTS)));
    await db.collection("invoices").bulkWrite(upsertOps(rewire(TEST_INVOICES)));
    await db.collection("quotes").bulkWrite(upsertOps(rewire(TEST_QUOTES)));
    await db.collection("expenses").replaceOne(
      { _id: TEST_SUPPLIER_EXPENSE._id },
      {
        ...TEST_SUPPLIER_EXPENSE,
        workspaceId: IDS.organizationId,
        createdBy: realUserId,
      },
      { upsert: true },
    );

    // Foreign tenant invoice — bypasses rewire() on purpose: its workspaceId
    // must remain foreign for multi-tenant isolation tests to be meaningful.
    await db
      .collection("invoices")
      .replaceOne({ _id: FOREIGN_INVOICE._id }, FOREIGN_INVOICE, {
        upsert: true,
      });

    console.log(
      `  ↳ Inserted ${TEST_CLIENTS.length} clients, ${TEST_INVOICES.length} invoices (+1 foreign), ${TEST_QUOTES.length} quotes, 1 expense`,
    );

    console.log("[E2E Seed] Done ✓");
  } finally {
    await client.close();
  }
}
