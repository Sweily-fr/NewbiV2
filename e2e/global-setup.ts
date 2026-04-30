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
import { MongoClient } from "mongodb";
import {
  IDS,
  TEST_ORGANIZATION,
  TEST_MEMBER,
  TEST_CLIENTS,
  TEST_INVOICES,
  TEST_QUOTES,
  TEST_SUPPLIER_EXPENSE,
} from "./seed/test-data";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";

  if (!uri) {
    throw new Error(
      "[E2E Seed] MONGODB_URI_TEST (or MONGODB_URI) is not set. Aborting.",
    );
  }

  const lower = uri.toLowerCase();
  const isSafe =
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("test") ||
    lower.includes("e2e") ||
    lower.includes("staging");

  if (!isSafe) {
    throw new Error(
      `[E2E Seed] MONGODB_URI looks like a production database. ` +
        `URI must contain "test", "e2e", "staging", or "localhost". Got: ${uri.slice(0, 60)}…`,
    );
  }

  return uri;
}

async function ensureTestUser(
  baseUrl: string,
  email: string,
  password: string,
) {
  // Try to sign up. If user already exists, Better Auth returns 4xx — we ignore it.
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl, // Better Auth requires a non-null Origin
    },
    body: JSON.stringify({ email, password, name: "Test E2E" }),
  });
  if (res.ok) {
    console.log(`  ↳ Created Better Auth user ${email}`);
  } else if (res.status === 422 || res.status === 400) {
    console.log(`  ↳ Test user ${email} already exists — reusing`);
  } else {
    const text = await res.text();
    throw new Error(
      `[E2E Seed] signup failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }
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

  // 1. Create (or reuse) the test user through Better Auth. This populates
  //    both the `user` and `account` collections with a valid credential.
  await ensureTestUser(baseUrl, email, password);

  // 2. Seed the rest of the deterministic fixtures directly in Mongo.
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log(`[E2E Seed] Connected to ${db.databaseName}`);

    // Look up the created user by email so we can wire the organization/member
    // references to the real Better Auth user id.
    const userDoc = await db.collection("user").findOne({ email });
    if (!userDoc) {
      throw new Error(`[E2E Seed] Could not find user ${email} after signup`);
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
    // Better Auth's session.create.before hook looks up `member` with
    // userId as ObjectId — insert as ObjectId, not string, otherwise the
    // hook fails to find the member and activeOrganizationId is never set
    // on new sessions.
    await db.collection("member").replaceOne(
      { _id: TEST_MEMBER._id },
      {
        ...TEST_MEMBER,
        userId: realUserId,
        organizationId: IDS.organizationId.toString(),
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
    const upsertOps = <T extends { _id: unknown }>(docs: T[]) =>
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
    console.log(
      `  ↳ Inserted ${TEST_CLIENTS.length} clients, ${TEST_INVOICES.length} invoices, ${TEST_QUOTES.length} quotes, 1 expense`,
    );

    console.log("[E2E Seed] Done ✓");
  } finally {
    await client.close();
  }
}
