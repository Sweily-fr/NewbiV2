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

import { GET } from "@/app/api/invoices/data/[id]/route";

function makeReq() {
  return new Request("http://localhost/api/invoices/data/abc");
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

describe("GET /api/invoices/data/[id]", () => {
  it("returns 404 when invoice not found", async () => {
    mockDb.collection.mockReturnValue({
      findOne: vi.fn().mockResolvedValue(null),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns formatted invoice", async () => {
    const invoice = {
      _id: { toString: () => "i1" },
      number: "INV-001",
      prefix: "F",
      status: "DRAFT",
      totalHT: 100,
      totalVAT: 20,
      totalTTC: 120,
      items: [],
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === "invoices")
        return { findOne: vi.fn().mockResolvedValue(invoice) };
      return { findOne: vi.fn().mockResolvedValue(null) };
    });
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "i1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("i1");
    expect(json.number).toBe("INV-001");
  });

  it("includes client data when present", async () => {
    const invoice = {
      _id: { toString: () => "i2" },
      number: "INV-002",
      client: "client1",
    };
    const clientData = {
      _id: { toString: () => "client1" },
      name: "ACME",
      email: "a@b.com",
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === "invoices")
        return { findOne: vi.fn().mockResolvedValue(invoice) };
      if (name === "clients")
        return { findOne: vi.fn().mockResolvedValue(clientData) };
      return { findOne: vi.fn().mockResolvedValue(null) };
    });
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "i2" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.client.name).toBe("ACME");
  });

  it("returns 500 on connection failure", async () => {
    mockConnect.mockRejectedValueOnce(new Error("conn fail"));
    const res = await GET(makeReq(), { params: Promise.resolve({ id: "i3" }) });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erreur serveur");
  });
});
