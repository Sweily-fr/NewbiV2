import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = "invoice-app";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxIdleTimeMS: 30000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client
      .connect()
      .then(() => {
        console.log("✅ MongoDB connected successfully");
        return client;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client
    .connect()
    .then(() => {
      console.log("✅ MongoDB connected successfully");
      return client;
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      throw err;
    });
}

// Fonction pour s'assurer que la connexion est établie
const ensureConnection = async () => {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    await db.admin().ping();
    console.log("✅ MongoDB reconnected successfully");
    return db;
  } catch (error) {
    console.error("❌ Failed to ensure MongoDB connection:", error);
    throw error;
  }
};

export const mongoClient = clientPromise;
export const mongoDb = async () => {
  const client = await clientPromise;
  return client.db(dbName);
};
export { ensureConnection };
