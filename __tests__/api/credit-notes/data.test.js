import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConnect = vi.fn();
const mockClose = vi.fn();
const mockDb = {
  collection: vi.fn(),
};

vi.mock("mongodb", () => {
  function MockObjectId(id) {
    this._id = id;
    this.toString = () => String(id);
  }
  MockObjectId.prototype.toString = function () {
    return String(this._id);
  };

  return {
    MongoClient: {
      connect: (...args) => mockConnect(...args),
    },
    ObjectId: MockObjectId,
  };
});

import { GET } from "@/app/api/credit-notes/data/[id]/route";

function makeReq({ url = "http://localhost/api/credit-notes/data/abc" } = {}) {
  return new Request(url);
}

describe("GET /api/credit-notes/data/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.collection.mockReset();
    mockConnect.mockReset();
    mockClose.mockReset();
    mockConnect.mockResolvedValue({
      db: () => mockDb,
      close: mockClose,
    });
  });

  it("returns 404 if credit note not found", async () => {
    mockDb.collection.mockReturnValue({
      findOne: vi.fn().mockResolvedValue(null),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "notfound" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns formatted credit note", async () => {
    const creditNote = {
      _id: { toString: () => "cn1" },
      number: "AV-001",
      prefix: "AV",
      issueDate: "2025-01-01",
      status: "PENDING",
      totalHT: 100,
      totalVAT: 20,
      totalTTC: 120,
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === "creditnotes") {
        return { findOne: vi.fn().mockResolvedValue(creditNote) };
      }
      return { findOne: vi.fn().mockResolvedValue(null) };
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "cn1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("cn1");
    expect(json.number).toBe("AV-001");
  });

  it("includes client and originalInvoice info when present", async () => {
    const creditNote = {
      _id: { toString: () => "cn2" },
      number: "AV-002",
      client: "client123",
      originalInvoice: "inv1",
    };
    const clientData = {
      _id: { toString: () => "client123" },
      name: "ACME",
      email: "a@b.com",
      phone: "111",
      address: "addr",
    };
    const invoiceData = {
      _id: { toString: () => "inv1" },
      number: "INV-001",
      prefix: "F",
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === "creditnotes")
        return { findOne: vi.fn().mockResolvedValue(creditNote) };
      if (name === "clients")
        return { findOne: vi.fn().mockResolvedValue(clientData) };
      if (name === "invoices")
        return { findOne: vi.fn().mockResolvedValue(invoiceData) };
      return { findOne: vi.fn().mockResolvedValue(null) };
    });

    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "cn2" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.client.name).toBe("ACME");
    expect(json.originalInvoice.number).toBe("INV-001");
  });

  it("returns 500 on connection failure", async () => {
    mockConnect.mockRejectedValue(new Error("conn fail"));
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "cn3" }),
    });
    expect(res.status).toBe(500);
    const j = await res.json();
    expect(j.error).toBe("Erreur serveur");
  });
});
