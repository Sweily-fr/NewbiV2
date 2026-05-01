/**
 * Onboarding seed helpers — wipe and restore the test user's organization +
 * subscription so the spec can exercise the real /onboarding flow.
 *
 * The default Playwright globalSetup seeds a "trialing" subscription for the
 * test user so most specs land on /dashboard. This helper inverts that for
 * the onboarding spec only, then restores the seeded state in afterAll.
 *
 * Mirrors the Mongo logic in e2e/global-setup.ts and e2e/seed/run-seed.mjs.
 */
import { MongoClient, ObjectId } from "mongodb";

const IDS = {
  organizationId: new ObjectId("bbbbbbbbbbbbbbbbbbbb0001"),
  memberId: new ObjectId("bbbbbbbbbbbbbbbbbbbb0002"),
};

function getMongoUri() {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";
  if (!uri) throw new Error("MONGODB_URI_TEST or MONGODB_URI required");
  const lower = uri.toLowerCase();
  const safe =
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("test") ||
    lower.includes("e2e") ||
    lower.includes("staging");
  if (!safe) throw new Error(`Unsafe MONGODB_URI: ${uri.slice(0, 60)}`);
  return uri;
}

async function withDb(fn) {
  const client = new MongoClient(getMongoUri());
  try {
    await client.connect();
    return await fn(client.db());
  } finally {
    await client.close();
  }
}

async function findUserId(db, email) {
  const userDoc = await db.collection("user").findOne({ email });
  if (!userDoc) throw new Error(`Test user ${email} not found in Mongo`);
  return userDoc._id;
}

/**
 * Remove organization + member + subscription for the test user, and clear
 * activeOrganizationId on their sessions. After this the /onboarding flow
 * is required.
 */
export async function clearOrganization(email) {
  await withDb(async (db) => {
    const realUserId = await findUserId(db, email);
    await db.collection("organization").deleteOne({ _id: IDS.organizationId });
    await db.collection("member").deleteMany({ userId: realUserId.toString() });
    await db
      .collection("subscription")
      .deleteMany({ referenceId: IDS.organizationId.toString() });
    await db
      .collection("session")
      .updateMany(
        { userId: realUserId.toString() },
        { $set: { activeOrganizationId: null } },
      );
  });
}

/**
 * Re-seed the same organization + trialing subscription that globalSetup
 * normally puts in place, so other specs that depend on the dashboard still
 * work after the onboarding spec runs.
 */
export async function restoreOrganization(email) {
  await withDb(async (db) => {
    const realUserId = await findUserId(db, email);

    await db.collection("organization").deleteOne({ _id: IDS.organizationId });
    // Cleanup member par _id ET par userId (string + ObjectId) — Better Auth
    // peut écrire userId comme ObjectId quand il crée un member en réponse au
    // "Choisir ce plan", ce qui fait passer à travers `deleteMany({userId:
    // string})` et fait échouer le insertOne suivant avec E11000 sur _id.
    await db.collection("member").deleteMany({
      $or: [
        { _id: IDS.memberId },
        { userId: realUserId.toString() },
        { userId: realUserId },
      ],
    });
    await db
      .collection("subscription")
      .deleteMany({ referenceId: IDS.organizationId.toString() });

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

    await db.collection("member").insertOne({
      _id: IDS.memberId,
      userId: realUserId.toString(),
      organizationId: IDS.organizationId.toString(),
      role: "owner",
      createdAt: new Date(),
    });

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

    await db
      .collection("session")
      .updateMany(
        { userId: realUserId.toString() },
        { $set: { activeOrganizationId: IDS.organizationId.toString() } },
      );
  });
}
