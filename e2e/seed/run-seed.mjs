/**
 * Seed runner — called by both Playwright globalSetup and Cypress setupNodeEvents.
 * Delegates to the TypeScript global-setup so there's a single source of truth.
 *
 * Invoked as an ES module from Cypress (which runs Node). We dynamically import
 * the .ts file via tsx if Cypress hasn't already compiled it — simpler approach:
 * duplicate the minimal seeding logic here in plain JS.
 */
import { MongoClient, ObjectId } from "mongodb";

const IDS = {
  user: new ObjectId("aaaaaaaaaaaaaaaaaaaaa001"),
  organizationId: new ObjectId("bbbbbbbbbbbbbbbbbbbb0001"),
  memberId: new ObjectId("bbbbbbbbbbbbbbbbbbbb0002"),
};

export async function seedDatabase({ email, password, baseUrl }) {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";
  if (!uri) throw new Error("MONGODB_URI_TEST or MONGODB_URI required");

  // Safety: refuse to run against prod-looking URIs
  const lower = uri.toLowerCase();
  const safe =
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("test") ||
    lower.includes("e2e") ||
    lower.includes("staging");
  if (!safe) throw new Error(`Unsafe MONGODB_URI: ${uri.slice(0, 60)}`);

  // 1. Ensure the test user exists via Better Auth signup
  const signup = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email, password, name: "Test E2E" }),
  });
  if (!signup.ok && signup.status !== 422 && signup.status !== 400) {
    const text = await signup.text();
    throw new Error(`Signup failed (${signup.status}): ${text.slice(0, 200)}`);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    const userDoc = await db.collection("user").findOne({ email });
    if (!userDoc) throw new Error(`User ${email} not found after signup`);
    const realUserId = userDoc._id;

    // Targeted cleanup of our seeded documents
    await db
      .collection("organization")
      .deleteOne({ _id: IDS.organizationId });
    await db
      .collection("member")
      .deleteMany({ userId: realUserId.toString() });
    await db
      .collection("subscription")
      .deleteMany({ referenceId: IDS.organizationId.toString() });

    // Organization with full company info (so RBAC + company-info-guard pass)
    await db.collection("organization").insertOne({
      _id: IDS.organizationId,
      name: "Newbi Test SASU",
      slug: "newbi-test-sasu",
      createdBy: realUserId.toString(),
      createdAt: new Date(),
      companyName: "Newbi Test SASU",
      companyEmail: "contact@newbi-test.fr",
      addressStreet: "1 rue du Test",
      addressCity: "Paris",
      addressZipCode: "75001",
      addressCountry: "France",
      siret: "12345678901234",
      legalForm: "SASU",
    });

    // Membership
    await db.collection("member").insertOne({
      _id: IDS.memberId,
      userId: realUserId.toString(),
      organizationId: IDS.organizationId.toString(),
      role: "owner",
      createdAt: new Date(),
    });

    // Trialing subscription — dashboard layout accepts "active" or "trialing"
    await db.collection("subscription").insertOne({
      referenceId: IDS.organizationId.toString(),
      organizationId: IDS.organizationId.toString(),
      plan: "pme",
      status: "trialing",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Point any active sessions at our seeded org
    await db.collection("session").updateMany(
      { userId: realUserId.toString() },
      { $set: { activeOrganizationId: IDS.organizationId.toString() } },
    );

    return { userId: realUserId, organizationId: IDS.organizationId };
  } finally {
    await client.close();
  }
}
