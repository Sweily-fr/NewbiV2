import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "invoice-app";

// Options optimisées pour Vercel serverless + Atlas
const options = {
  maxPoolSize: 1,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 5000,
  // compressors: ["zstd", "snappy"], // Désactivé — modules natifs optionnels non installés
};

// Réutiliser le client MongoDB entre les invocations serverless
// Le driver MongoDB gère la reconnexion automatiquement — pas besoin de connect()
if (!global._mongoClient) {
  global._mongoClient = new MongoClient(uri, options);
}
const client = global._mongoClient;

// Créer les index (une seule fois par instance)
let indexesCreated = false;
async function ensureIndexes(db) {
  if (indexesCreated) return;
  indexesCreated = true;

  const indexes = [
    {
      coll: "session",
      idx: { expiresAt: 1 },
      opts: { expireAfterSeconds: 0, background: true },
    },
    {
      coll: "pending_org_data",
      idx: { expiresAt: 1 },
      opts: { expireAfterSeconds: 0, background: true },
    },
    {
      coll: "member",
      idx: { userId: 1, organizationId: 1 },
      opts: { unique: true, background: true },
    },
    {
      coll: "subscription",
      idx: { stripeSubscriptionId: 1 },
      opts: { unique: true, sparse: true, background: true },
    },
    {
      coll: "subscription",
      idx: { referenceId: 1 },
      opts: { unique: true, background: true }, // MOYEN-19: prevent double subscription per org
    },
    {
      coll: "stripeWebhookEvents",
      idx: { eventId: 1 },
      opts: { unique: true, background: true },
    },
    // Setup 2FA OTP store (serverless-safe)
    {
      coll: "twoFactorSetupOtp",
      idx: { userId: 1 },
      opts: { unique: true, background: true },
    },
    {
      coll: "twoFactorSetupOtp",
      idx: { expiresAt: 1 },
      opts: { expireAfterSeconds: 0, background: true },
    },
  ];

  const results = await Promise.allSettled(
    indexes.map(({ coll, idx, opts }) =>
      db.collection(coll).createIndex(idx, opts),
    ),
  );

  // Migration: if subscription.referenceId index existed without unique,
  // createIndex with unique:true fails (IndexOptionsConflict 85/86).
  // Drop the old index and recreate with unique constraint.
  const referenceIdResult = results[4]; // 5th index in the array (0-indexed)
  if (referenceIdResult.status === "rejected") {
    const code = referenceIdResult.reason?.code;
    if (code === 85 || code === 86) {
      try {
        await db.collection("subscription").dropIndex("referenceId_1");
        await db
          .collection("subscription")
          .createIndex({ referenceId: 1 }, { unique: true, background: true });
        console.log(
          "[mongodb] Migrated subscription.referenceId index to unique",
        );
      } catch (migrationError) {
        console.error(
          "[mongodb] Failed to migrate referenceId index:",
          migrationError.message,
        );
      }
    }
  }
}

/**
 * Retourne la DB connectée (async).
 * Le driver MongoDB 4.x+ se connecte automatiquement à la première opération.
 */
export async function getMongoDb() {
  const db = client.db(dbName);
  ensureIndexes(db).catch(() => {});
  return db;
}

/**
 * Accès synchrone à la DB pour Better Auth.
 * Fonctionne car le driver MongoDB 4.x+ n'a plus besoin de connect() explicite —
 * il se connecte automatiquement à la première opération.
 */
export const mongoDb = client.db(dbName);
export const mongoClient = client;
export const ensureConnection = getMongoDb;
