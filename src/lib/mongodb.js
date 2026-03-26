import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "invoice-app";

// Options de connexion optimisées pour Vercel serverless
const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 10000,
};

let client;

if (!global._mongoClient) {
  client = new MongoClient(uri, options);
  global._mongoClient = client;
  global._mongoConnected = false;
  global._mongoConnecting = null;
} else {
  client = global._mongoClient;
}

// Créer les index (appelé une seule fois après connexion réussie)
async function createIndexes(db) {
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

// Connexion lazy avec retry — ne crash JAMAIS le process
async function connect() {
  // Déjà connecté
  if (global._mongoConnected && global._mongoDb) {
    return global._mongoDb;
  }

  // Connexion en cours — ne pas en lancer une deuxième
  if (global._mongoConnecting) {
    return global._mongoConnecting;
  }

  global._mongoConnecting = (async () => {
    try {
      await client.connect();
      global._mongoDb = client.db(dbName);
      global._mongoConnected = true;
      global._mongoConnecting = null;
      console.log("✅ MongoDB connected successfully");

      // Créer les index en background (non bloquant)
      createIndexes(global._mongoDb).catch(() => {});

      return global._mongoDb;
    } catch (err) {
      global._mongoConnected = false;
      global._mongoConnecting = null;
      // Log l'erreur mais NE PAS throw — le process reste vivant pour la prochaine requête
      console.error("❌ MongoDB connection failed:", err?.message || err);
      return null;
    }
  })();

  return global._mongoConnecting;
}

// Lancer la connexion dès le chargement du module (non bloquant, pas de throw)
connect();

// Fonction pour s'assurer que la connexion est établie (avec retry)
const ensureConnection = async () => {
  // Tenter la connexion (ou réutiliser si déjà connectée)
  const db = await connect();
  if (db) return db;

  // Premier essai a échoué — retenter une fois
  console.warn("⚠️ MongoDB retry connexion...");
  const retryDb = await connect();
  if (retryDb) return retryDb;

  throw new Error("MongoDB unavailable after retry");
};

// Gestion des événements de connexion
client.on("close", () => {
  console.warn("⚠️ MongoDB connection closed");
  global._mongoConnected = false;
});

client.on("error", (error) => {
  console.error("❌ MongoDB client error:", error?.message);
  global._mongoConnected = false;
});

// Exporter une fonction qui retourne la DB après connexion
export async function getMongoDb() {
  return await ensureConnection();
}

// Proxy synchrone pour Better Auth (qui a besoin d'un accès synchrone à la DB)
const mongoDbProxy = new Proxy(
  {},
  {
    get(target, prop) {
      try {
        const db = global._mongoDb || client.db(dbName);
        const value = db[prop];
        if (typeof value === "function") {
          return value.bind(db);
        }
        return value;
      } catch (error) {
        console.error("❌ MongoDB Proxy access error:", error?.message);
        return undefined;
      }
    },
  },
);

export const mongoClient = client;
export const mongoDb = mongoDbProxy;
export { ensureConnection };
