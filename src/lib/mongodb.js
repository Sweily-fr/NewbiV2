import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "invoice-app";

// Options de connexion optimisées pour Vercel
const options = {
  maxPoolSize: 10, // Limite le nombre de connexions simultanées
  serverSelectionTimeoutMS: 5000, // Timeout pour sélectionner un serveur
  socketTimeoutMS: 45000, // Timeout pour les opérations socket
  connectTimeoutMS: 10000, // Timeout pour la connexion initiale
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  maxIdleTimeMS: 30000, // Ferme les connexions inactives après 30s
  retryWrites: true, // Retry automatique des écritures
  w: "majority", // Write concern
};

let client;
let clientPromise;

// Différent comportement selon l'environnement
if (process.env.NODE_ENV === "development") {
  // En développement, utilise une variable globale pour éviter les reconnexions
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client
      .connect()
      .then((client) => {
        console.log("✅ MongoDB connected successfully (development)");
        return client;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error (development):", err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En production, crée une nouvelle connexion
  client = new MongoClient(uri, options);
  clientPromise = client
    .connect()
    .then((client) => {
      console.log("✅ MongoDB connected successfully (production)");
      return client;
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error (production):", err);
      throw err;
    });
}
