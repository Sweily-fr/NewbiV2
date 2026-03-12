/**
 * Playwright Global Teardown — removes all E2E test data from MongoDB.
 *
 * Runs once after all test suites.
 */
import { MongoClient } from "mongodb";
import { SEEDED_COLLECTIONS } from "./seed/test-data";

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

    for (const col of SEEDED_COLLECTIONS) {
      await db.collection(col).deleteMany({});
    }

    console.log("[E2E Teardown] Done ✓");
  } finally {
    await client.close();
  }
}
