import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

const uri = process.env.MONGODB_URI; // met ton URI MongoDB dans un fichier .env.local
const options = {};

if (!process.env.MONGODB_URI) {
  throw new Error("add MONGODB_URI to .env.local");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // En développement, utilise une variable globale pour éviter de multiples connexions
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri!, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En production, crée une connexion normale
  client = new MongoClient(uri!, options);
  clientPromise = client.connect();
}

export default clientPromise;
