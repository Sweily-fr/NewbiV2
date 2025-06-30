import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = "invoice-app";

declare global {
  var _mongoClient: MongoClient;
  var _mongoDb: Db;
}

let client: MongoClient;

if (!global._mongoClient) {
  client = new MongoClient(uri);
  global._mongoClient = client;

  client
    .connect()
    .then(() => {
      global._mongoDb = client.db(dbName);
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
}

export const mongoClient = global._mongoClient || new MongoClient(uri);
export const mongoDb = global._mongoDb || mongoClient.db(dbName);
