import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateOne = vi.fn();
const mockAccountsRetrieve = vi.fn();

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: vi.fn(() => ({
      updateOne: (...args) => mockUpdateOne(...args),
    })),
  },
}));

vi.mock("mongodb", () => ({
  ObjectId: function MockObjectId(id) {
    this.id = id;
    this.toString = () => String(id);
  },
}));

vi.mock("stripe", () => ({
  default: vi.fn(function MockStripe() {
    return {
      accounts: { retrieve: (...args) => mockAccountsRetrieve(...args) },
      customers: { list: vi.fn() },
      invoices: { list: vi.fn() },
      billingPortal: { sessions: { create: vi.fn() } },
      accountLinks: { create: vi.fn() },
    };
  }),
}));

function makeReq({
  method = "POST",
  url = "http://localhost/api/stripe/connect/status",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { POST } = await import("@/app/api/stripe/connect/status/route");

beforeEach(() => {
  mockUpdateOne.mockReset();
  mockAccountsRetrieve.mockReset();
});

describe("POST /api/stripe/connect/status", () => {
  it("returns 400 when accountId missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/accountId/);
  });

  it("retrieves account and updates DB on success (active)", async () => {
    mockAccountsRetrieve.mockResolvedValue({
      id: "acct_1",
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
    });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    const res = await POST(
      makeReq({ body: { accountId: "acct_1", userId: "u1" } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isOnboarded).toBe(true);
    expect(body.chargesEnabled).toBe(true);
    expect(body.accountStatus).toBe("active");
    expect(mockAccountsRetrieve).toHaveBeenCalledWith("acct_1");
  });

  it("returns pending status when charges disabled", async () => {
    mockAccountsRetrieve.mockResolvedValue({
      id: "acct_2",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    const res = await POST(makeReq({ body: { accountId: "acct_2" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accountStatus).toBe("pending");
    expect(body.isOnboarded).toBe(false);
  });

  it("returns 500 on Stripe upstream error", async () => {
    mockAccountsRetrieve.mockRejectedValue(new Error("not found"));
    const res = await POST(makeReq({ body: { accountId: "acct_x" } }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("not found");
  });
});
