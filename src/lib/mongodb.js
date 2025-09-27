import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "invoice-app";

let client;

if (!global._mongoClient) {
  client = new MongoClient(uri);
  global._mongoClient = client;

  client
    .connect()
    .then(() => {
      global._mongoDb = client.db(dbName);
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
    return global._mongoDb;
  } catch (error) {
    console.error("❌ Failed to ensure MongoDB connection:", error);
    throw error;
  }
};

export const mongoClient = global._mongoClient || new MongoClient(uri);
export const mongoDb = global._mongoDb || client?.db(dbName);
export { ensureConnection };
