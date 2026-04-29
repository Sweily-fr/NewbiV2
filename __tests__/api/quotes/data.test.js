import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConnect = vi.fn();
const mockClose = vi.fn();
const mockDb = { collection: vi.fn() };

vi.mock("mongodb", () => {
  function MockObjectId(id) {
    this._id = id;
    this.toString = () => String(id);
  }
  MockObjectId.prototype.toString = function () {
    return String(this._id);
  };
  return {
    MongoClient: { connect: (...args) => mockConnect(...args) },
    ObjectId: MockObjectId,
  };
});

import { GET } from "@/app/api/quotes/data/[id]/route";

function makeReq() {
  return new Request("http://localhost/api/quotes/data/abc");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mockDb.collection.mockReset();
  mockConnect.mockReset();
  mockClose.mockReset();
  mockConnect.mockResolvedValue({ db: () => mockDb, close: mockClose });
});

describe("GET /api/quotes/data/[id]", () => {
  it("returns 404 when quote not found", async () => {
    mockDb.collection.mockReturnValue({
      findOne: vi.fn().mockResolvedValue(null),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Devis non trouvé");
  });

  it("returns formatted quote", async () => {
    const quote = {
      _id: { toString: () => "q1" },
      number: "Q-001",
      prefix: "D",
      status: "DRAFT",
      totalHT: 100,
      validUntil: "2026-12-31",
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === "quotes")
        return { findOne: vi.fn().mockResolvedValue(quote) };
      return { findOne: vi.fn().mockResolvedValue(null) };
    });
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "q1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("q1");
    expect(json.number).toBe("Q-001");
  });

  it("includes client info when present", async () => {
    const quote = {
      _id: { toString: () => "q2" },
      number: "Q-002",
      client: "c1",
    };
    const clientData = {
      _id: { toString: () => "c1" },
      name: "ACME",
      email: "x@y.com",
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === "quotes")
        return { findOne: vi.fn().mockResolvedValue(quote) };
      if (name === "clients")
        return { findOne: vi.fn().mockResolvedValue(clientData) };
      return { findOne: vi.fn().mockResolvedValue(null) };
    });
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "q2" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.client.name).toBe("ACME");
  });

  it("returns 500 on connection failure", async () => {
    mockConnect.mockRejectedValueOnce(new Error("conn fail"));
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "q3" }) });
    expect(res.status).toBe(500);
  });
});
