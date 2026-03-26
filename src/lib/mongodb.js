import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "invoice-app";

// Options optimisées pour Vercel serverless + Atlas
const options = {
  maxPoolSize: 1, // 1 connexion par instance serverless (réduit les 82 → ~10)
  minPoolSize: 0,
  maxIdleTimeMS: 10000, // Fermer après 10s d'inactivité
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 5000,
  compressors: ["zstd", "snappy"],
};

/**
 * Pattern recommandé par MongoDB pour les serverless (Vercel/Lambda).
 *
 * En dev : global._mongoClientPromise persiste grâce au HMR (pas de reconnexion à chaque save)
 * En prod : global._mongoClientPromise persiste tant que l'instance serverless est chaude
 *           → réutilise la même connexion entre les invocations
 */
let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

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
  ];

  await Promise.allSettled(
    indexes.map(({ coll, idx, opts }) =>
      db.collection(coll).createIndex(idx, opts),
    ),
  );
}

/**
 * Retourne la DB connectée. Réutilise la connexion existante.
 */
export async function getMongoDb() {
  const client = await clientPromise;
  const db = client.db(dbName);
  ensureIndexes(db).catch(() => {});
  return db;
}

/**
 * Proxy synchrone pour Better Auth.
 * Better Auth accède à la DB de manière synchrone (mongoDb.collection(...)).
 * Le Proxy attend que la connexion soit prête et redirige les appels.
 */
let resolvedDb = null;

// Résoudre la DB dès que possible (non bloquant)
clientPromise
  .then((client) => {
    resolvedDb = client.db(dbName);
    ensureIndexes(resolvedDb).catch(() => {});
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err?.message);
    // Reset pour retry à la prochaine invocation
    global._mongoClientPromise = null;
  });

const mongoDbProxy = new Proxy(
  {},
  {
    get(target, prop) {
      if (!resolvedDb) return undefined;
      const value = resolvedDb[prop];
      if (typeof value === "function") return value.bind(resolvedDb);
      return value;
    },
  },
);

export const mongoDb = mongoDbProxy;
export const mongoClient = null;
export const ensureConnection = getMongoDb;
