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
      opts: { background: true },
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

  await Promise.allSettled(
    indexes.map(({ coll, idx, opts }) =>
      db.collection(coll).createIndex(idx, opts),
    ),
  );
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
