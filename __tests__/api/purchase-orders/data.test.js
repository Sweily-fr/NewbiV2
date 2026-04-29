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

import { GET } from "@/app/api/purchase-orders/data/[id]/route";

function makeReq() {
  return new Request("http://localhost/api/purchase-orders/data/abc");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockDb.collection.mockReset();
  mockConnect.mockReset();
  mockConnect.mockResolvedValue({ db: () => mockDb, close: mockClose });
});

describe("GET /api/purchase-orders/data/[id]", () => {
  it("returns 404 when not found", async () => {
    mockDb.collection.mockReturnValue({
      findOne: vi.fn().mockResolvedValue(null),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Bon de commande non trouvé");
  });

  it("returns formatted purchase order", async () => {
    const po = {
      _id: { toString: () => "po1" },
      number: "BC-001",
      prefix: "BC",
      totalHT: 100,
      items: [],
    };
    mockDb.collection.mockReturnValue({
      findOne: vi.fn().mockResolvedValue(po),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "po1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("po1");
    expect(json.number).toBe("BC-001");
  });

  it("returns 500 on connection failure", async () => {
    mockConnect.mockRejectedValueOnce(new Error("conn fail"));
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "po1" }),
    });
    expect(res.status).toBe(500);
  });

  it("returns default appearance when not provided", async () => {
    const po = { _id: { toString: () => "po2" }, number: "BC-002" };
    mockDb.collection.mockReturnValue({
      findOne: vi.fn().mockResolvedValue(po),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "po2" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.appearance).toEqual({
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    });
  });
});
