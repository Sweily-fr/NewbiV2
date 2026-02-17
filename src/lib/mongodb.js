import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "invoice-app";

// Options de connexion optimisées pour éviter "Topology is closed"
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 60000, // Fermer les connexions inactives après 1 minute
  serverSelectionTimeoutMS: 30000, // 30 secondes pour cold start Vercel
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 30000, // 30 secondes pour cold start
};

let client;
let clientPromise;

if (!global._mongoClient) {
  client = new MongoClient(uri, options);
  global._mongoClient = client;
  
  // Connexion immédiate pour éviter timeout au premier appel
  clientPromise = client.connect().then(async () => {
    global._mongoDb = client.db(dbName);
    console.log("✅ MongoDB connected successfully");

    // Créer un TTL index sur expiresAt pour nettoyer automatiquement les sessions expirées
    try {
      await global._mongoDb.collection("session").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, background: true }
      );
    } catch (e) {
      // Index existe déjà ou erreur non critique
    }

    return client;
  }).catch((err) => {
    console.error("❌ MongoDB initial connection error:", err);
    throw err;
  });
  
  global._mongoClientPromise = clientPromise;
} else {
  client = global._mongoClient;
  clientPromise = global._mongoClientPromise;
}

// Fonction pour s'assurer que la connexion est établie
const ensureConnection = async () => {
  try {
    // Attendre que la connexion initiale soit établie
    await clientPromise;
    
    // global._mongoDb est déjà créé dans clientPromise
    if (!global._mongoDb) {
      global._mongoDb = client.db(dbName);
    }
    
    // Vérifier que la connexion est toujours active
    await client.db().admin().ping();
    return global._mongoDb;
  } catch (error) {
    console.error("❌ MongoDB connection lost, reconnecting...", error.message);
    try {
      // Tenter une reconnexion
      const newClient = await client.connect();
      global._mongoDb = newClient.db(dbName);
      global._mongoClientPromise = Promise.resolve(newClient);
      console.log("✅ MongoDB reconnected successfully");
      return global._mongoDb;
    } catch (reconnectError) {
      console.error("❌ Failed to reconnect to MongoDB:", reconnectError);
      throw reconnectError;
    }
  }
};

// Gestion des événements de connexion
if (client) {
  client.on("close", () => {
    console.warn("⚠️ MongoDB connection closed (driver will auto-reconnect)");
    // Ne pas nullifier global._mongoDb — le driver MongoDB gère la reconnexion automatiquement
  });

  client.on("error", (error) => {
    console.error("❌ MongoDB client error:", error);
  });

  client.on("timeout", () => {
    console.warn("⚠️ MongoDB connection timeout");
  });
}

// Exporter une fonction qui retourne la DB après connexion
export async function getMongoDb() {
  return await ensureConnection();
}

// Créer un Proxy qui retourne la DB de manière synchrone
// Better Auth a besoin d'un accès synchrone à la DB
// Le Proxy intercepte les accès et retourne global._mongoDb ou client.db(dbName)
const mongoDbProxy = new Proxy({}, {
  get(target, prop, receiver) {
    try {
      const db = global._mongoDb || client.db(dbName);
      const value = db[prop];

      // Si c'est une fonction, la binder au bon contexte
      if (typeof value === 'function') {
        return value.bind(db);
      }

      return value;
    } catch (error) {
      console.error("❌ MongoDB Proxy access error:", error?.message);
      // Retourner undefined au lieu de crasher le module
      return undefined;
    }
  }
});

export const mongoClient = client;
export const mongoDb = mongoDbProxy;
export { ensureConnection };
