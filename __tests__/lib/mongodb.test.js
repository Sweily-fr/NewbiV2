import { describe, it, expect, vi, beforeEach } from "vitest";

const { MongoClientCtor, dbInstance, collections } = vi.hoisted(() => {
  const collections = {};
  const dbInstance = {
    collection: vi.fn((name) => {
      if (!collections[name]) {
        collections[name] = { createIndex: vi.fn().mockResolvedValue("ok") };
      }
      return collections[name];
    }),
  };
  const MongoClientCtor = vi.fn(function MockClient(uri, options) {
    return {
      uri,
      options,
      db: vi.fn(() => dbInstance),
    };
  });
  return { MongoClientCtor, dbInstance, collections };
});

vi.mock("mongodb", () => ({ MongoClient: MongoClientCtor }));

beforeEach(() => {
  // Each test reloads the module from scratch
  delete global._mongoClient;
  vi.resetModules();
  MongoClientCtor.mockClear();
  Object.keys(collections).forEach((k) => delete collections[k]);
});

describe("lib/mongodb", () => {
  it("creates a MongoClient with the URI from env and Vercel-friendly options", async () => {
    process.env.MONGODB_URI = "mongodb://test/27017";
    process.env.MONGODB_DB_NAME = "db-test";

    await import("@/src/lib/mongodb");
    expect(MongoClientCtor).toHaveBeenCalledTimes(1);
    const [uri, opts] = MongoClientCtor.mock.calls[0];
    expect(uri).toBe("mongodb://test/27017");
    expect(opts).toMatchObject({
      maxPoolSize: 1,
      minPoolSize: 0,
      retryWrites: true,
      retryReads: true,
    });
  });

  it("falls back to default URI/dbName when env vars are absent", async () => {
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DB_NAME;

    await import("@/src/lib/mongodb");
    expect(MongoClientCtor.mock.calls[0][0]).toBe("mongodb://localhost:27017");
  });

  it("reuses the global client across module loads (serverless reuse)", async () => {
    process.env.MONGODB_URI = "mongodb://x/27017";

    const a = await import("@/src/lib/mongodb");
    expect(MongoClientCtor).toHaveBeenCalledTimes(1);

    vi.resetModules();
    const b = await import("@/src/lib/mongodb");

    // No new MongoClient created, same global client reused
    expect(MongoClientCtor).toHaveBeenCalledTimes(1);
    expect(a.mongoClient).toBe(b.mongoClient);
  });

  it("getMongoDb resolves to the db, calling client.db(dbName)", async () => {
    process.env.MONGODB_DB_NAME = "my-db";
    const { getMongoDb, mongoClient } = await import("@/src/lib/mongodb");
    const db = await getMongoDb();
    expect(db).toBe(dbInstance);
    expect(mongoClient.db).toHaveBeenCalledWith("my-db");
  });

  it("ensureConnection is an alias of getMongoDb", async () => {
    const { ensureConnection, getMongoDb } = await import("@/src/lib/mongodb");
    expect(ensureConnection).toBe(getMongoDb);
  });

  it("exports the synchronous mongoDb db handle", async () => {
    const { mongoDb } = await import("@/src/lib/mongodb");
    expect(mongoDb).toBe(dbInstance);
  });

  it("ensures indexes are created (TTL + uniques) on first call", async () => {
    const { getMongoDb } = await import("@/src/lib/mongodb");
    await getMongoDb();
    // Wait for fire-and-forget ensureIndexes to settle
    await new Promise((r) => setTimeout(r, 0));

    expect(dbInstance.collection).toHaveBeenCalledWith("session");
    expect(dbInstance.collection).toHaveBeenCalledWith("subscription");
    expect(dbInstance.collection).toHaveBeenCalledWith("twoFactorSetupOtp");

    expect(collections.session.createIndex).toHaveBeenCalledWith(
      { expiresAt: 1 },
      expect.objectContaining({ expireAfterSeconds: 0 }),
    );
    expect(collections.member.createIndex).toHaveBeenCalledWith(
      { userId: 1, organizationId: 1 },
      expect.objectContaining({ unique: true }),
    );
  });

  it("does not recreate indexes on subsequent getMongoDb() calls", async () => {
    const { getMongoDb } = await import("@/src/lib/mongodb");
    await getMongoDb();
    await new Promise((r) => setTimeout(r, 0));
    const callsAfterFirst = collections.session.createIndex.mock.calls.length;

    await getMongoDb();
    await new Promise((r) => setTimeout(r, 0));

    expect(collections.session.createIndex.mock.calls.length).toBe(
      callsAfterFirst,
    );
  });
});
