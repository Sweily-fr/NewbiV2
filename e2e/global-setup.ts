/**
 * Playwright Global Setup — seeds the test MongoDB with deterministic E2E data.
 *
 * Runs once before all test suites.
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import {
  TEST_USER,
  TEST_ORGANIZATION,
  TEST_MEMBER,
  TEST_CLIENTS,
  TEST_INVOICES,
  TEST_QUOTES,
  TEST_SUPPLIER_EXPENSE,
  SEEDED_COLLECTIONS,
} from "./seed/test-data";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";

  if (!uri) {
    throw new Error(
      "[E2E Seed] MONGODB_URI_TEST (or MONGODB_URI) is not set. Aborting."
    );
  }

  // Safety guard: refuse to run against anything that looks like production
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
        `URI must contain "test", "e2e", "staging", or "localhost". Got: ${uri.slice(0, 60)}…`
    );
  }

  return uri;
}

export default async function globalSetup() {
  const uri = getMongoUri();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log(`[E2E Seed] Connected to ${db.databaseName}`);

    // 1. Clean all seeded collections
    for (const col of SEEDED_COLLECTIONS) {
      const collection = db.collection(col);
      const { deletedCount } = await collection.deleteMany({});
      if (deletedCount > 0) {
        console.log(`  ↳ Cleaned ${col}: ${deletedCount} docs removed`);
      }
    }

    // 2. Hash user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_USER.password, salt);

    // 3. Insert user (with hashed password)
    await db.collection("user").insertOne({
      ...TEST_USER,
      password: hashedPassword,
    });
    console.log("  ↳ Inserted test user");

    // 4. Insert organization + member (Better Auth tables)
    await db.collection("organization").insertOne(TEST_ORGANIZATION);
    await db.collection("member").insertOne(TEST_MEMBER);
    console.log("  ↳ Inserted organization + member");

    // 5. Insert clients
    await db.collection("clients").insertMany(TEST_CLIENTS);
    console.log(`  ↳ Inserted ${TEST_CLIENTS.length} clients`);

    // 6. Insert invoices
    await db.collection("invoices").insertMany(TEST_INVOICES);
    console.log(`  ↳ Inserted ${TEST_INVOICES.length} invoices`);

    // 7. Insert quotes
    await db.collection("quotes").insertMany(TEST_QUOTES);
    console.log(`  ↳ Inserted ${TEST_QUOTES.length} quotes`);

    // 8. Insert supplier expense
    await db.collection("expenses").insertOne(TEST_SUPPLIER_EXPENSE);
    console.log("  ↳ Inserted supplier expense");

    console.log("[E2E Seed] Done ✓");
  } finally {
    await client.close();
  }
}
