import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "invoice-app";

// Options de connexion optimisées pour éviter "Topology is closed"
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 60000, // Fermer les connexions inactives après 1 minute
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 10000,
};

let client;

if (!global._mongoClient) {
  client = new MongoClient(uri, options);
  global._mongoClient = client;

  client
    .connect()
    .then(() => {
      global._mongoDb = client.db(dbName);
      console.log("✅ MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      // Ne pas lancer d'erreur ici pour éviter de casser l'app
    });
} else {
  client = global._mongoClient;
}

// Fonction pour s'assurer que la connexion est établie
const ensureConnection = async () => {
  try {
    if (!global._mongoDb) {
      await client.connect();
      global._mongoDb = client.db(dbName);
    }
    // Vérifier que la connexion est toujours active
    await client.db().admin().ping();
    return global._mongoDb;
  } catch (error) {
    console.error("❌ MongoDB connection lost, reconnecting...", error.message);
    try {
      // Tenter une reconnexion
      await client.connect();
      global._mongoDb = client.db(dbName);
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
    console.warn("⚠️ MongoDB connection closed");
    global._mongoDb = null;
  });

  client.on("error", (error) => {
    console.error("❌ MongoDB client error:", error);
  });

  client.on("timeout", () => {
    console.warn("⚠️ MongoDB connection timeout");
  });
}

export const mongoClient = global._mongoClient || new MongoClient(uri, options);
export const mongoDb = global._mongoDb || client?.db(dbName);
export { ensureConnection };
