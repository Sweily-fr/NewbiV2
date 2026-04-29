import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockMemberFindOne, mockSubFindOne } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockMemberFindOne: vi.fn(),
    mockSubFindOne: vi.fn(),
  }),
);

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: mockMemberFindOne };
      if (name === "subscription") return { findOne: mockSubFindOne };
      return {};
    },
  },
}));

vi.mock("mongodb", () => {
  function ObjectId(id) {
    if (!(this instanceof ObjectId)) return new ObjectId(id);
    this.id = id;
    this.toString = () => id;
  }
  return { ObjectId };
});

import { GET } from "@/app/api/organizations/[organizationId]/subscription/route";

function makeReq() {
  return new Request("http://localhost/api/organizations/org1/subscription");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("GET /api/organizations/[organizationId]/subscription", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439011" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user not member", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns default plan when no subscription", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isDefault).toBe(true);
    expect(json.plan).toBeNull();
  });

  it("returns active subscription details", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce({
      _id: "s1",
      plan: "pme",
      status: "active",
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
      periodEnd: new Date(Date.now() + 86400000).toISOString(),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.plan).toBe("pme");
    expect(json.status).toBe("active");
    expect(json.isDefault).toBe(false);
  });

  it("returns expired status when canceled and past periodEnd", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce({
      plan: "pme",
      status: "canceled",
      periodEnd: new Date(Date.now() - 86400000).toISOString(),
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("expired");
    expect(json.isExpired).toBe(true);
  });

  it("returns 500 on internal error", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(500);
  });
});
