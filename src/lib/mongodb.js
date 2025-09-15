import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = "invoice-app";

// Configuration optimisée pour serverless
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // En développement, réutiliser la connexion
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En production, nouvelle connexion à chaque fois
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Fonction pour obtenir la base de données de manière sûre
export const getDatabase = async () => {
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

// Export synchrone pour Better Auth (sera initialisé de manière lazy)
export const mongoDb = {
  async collection(name) {
    const db = await getDatabase();
    return db.collection(name);
  },
  async admin() {
    const db = await getDatabase();
    return db.admin();
  },
  async command(command, options) {
    const db = await getDatabase();
    return db.command(command, options);
  },
  async createCollection(name, options) {
    const db = await getDatabase();
    return db.createCollection(name, options);
  },
  async dropCollection(name) {
    const db = await getDatabase();
    return db.dropCollection(name);
  },
  async listCollections(filter, options) {
    const db = await getDatabase();
    return db.listCollections(filter, options);
  },
  async stats(options) {
    const db = await getDatabase();
    return db.stats(options);
  }
};

export const mongoClient = client;
