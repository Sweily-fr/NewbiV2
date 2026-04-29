import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindOne = vi.fn();

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: vi.fn(() => ({
      findOne: (...args) => mockFindOne(...args),
    })),
  },
}));

vi.mock("mongodb", () => ({
  ObjectId: function MockObjectId(id) {
    this.id = id;
    this.toString = () => String(id);
  },
}));

function makeReq({
  method = "GET",
  url = "http://localhost/api/stripe/connect/account",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { GET } = await import("@/app/api/stripe/connect/account/route");

beforeEach(() => {
  mockFindOne.mockReset();
});

describe("GET /api/stripe/connect/account", () => {
  it("returns 400 when userId missing", async () => {
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/connect/account" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/userId/);
  });

  it("returns 200 with success=false when no account found", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await GET(
      makeReq({
        url: "http://localhost/api/stripe/connect/account?userId=507f1f77bcf86cd799439011",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/Aucun compte/);
  });

  it("returns 200 with the account info when found", async () => {
    mockFindOne.mockResolvedValue({
      accountId: "acct_1",
      isOnboarded: true,
      chargesEnabled: true,
      payoutsEnabled: false,
    });
    const res = await GET(
      makeReq({
        url: "http://localhost/api/stripe/connect/account?userId=507f1f77bcf86cd799439011",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.accountId).toBe("acct_1");
    expect(body.isOnboarded).toBe(true);
    expect(body.chargesEnabled).toBe(true);
    expect(body.payoutsEnabled).toBe(false);
  });

  it("returns 500 when DB throws", async () => {
    mockFindOne.mockRejectedValue(new Error("db down"));
    const res = await GET(
      makeReq({
        url: "http://localhost/api/stripe/connect/account?userId=507f1f77bcf86cd799439011",
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe("db down");
  });
});
