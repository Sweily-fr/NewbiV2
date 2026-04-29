import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSubFindOne, mockMemberFind } = vi.hoisted(() => ({
  mockSubFindOne: vi.fn(),
  mockMemberFind: vi.fn(),
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "subscription") return { findOne: mockSubFindOne };
      if (name === "member") return { find: mockMemberFind };
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

import { GET } from "@/app/api/subscription/check/route";

function makeReq(params = "") {
  return new Request(`http://localhost/api/subscription/check${params}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("GET /api/subscription/check", () => {
  it("returns 400 when userId missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("missing_user_id");
  });

  it("returns no_organization when user has no membership", async () => {
    mockMemberFind.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    const res = await GET(makeReq("?userId=507f1f77bcf86cd799439011"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasSubscription).toBe(false);
    expect(json.reason).toBe("no_organization");
  });

  it("returns no_subscription when org has no sub", async () => {
    mockSubFindOne.mockResolvedValueOnce(null);
    const res = await GET(
      makeReq("?userId=507f1f77bcf86cd799439011&organizationId=org1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasSubscription).toBe(false);
    expect(json.reason).toBe("no_subscription");
  });

  it("returns hasSubscription:true for active sub", async () => {
    mockSubFindOne.mockResolvedValueOnce({
      status: "active",
      plan: "pme",
      periodEnd: new Date(Date.now() + 86400000).toISOString(),
    });
    const res = await GET(
      makeReq("?userId=507f1f77bcf86cd799439011&organizationId=org1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasSubscription).toBe(true);
    expect(json.plan).toBe("pme");
  });

  it("returns subscription_expired when not active and not in valid canceled period", async () => {
    mockSubFindOne.mockResolvedValueOnce({
      status: "past_due",
      plan: "pme",
    });
    const res = await GET(
      makeReq("?userId=507f1f77bcf86cd799439011&organizationId=org1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasSubscription).toBe(false);
    expect(json.reason).toBe("subscription_expired");
  });

  it("returns 500 on internal error", async () => {
    mockSubFindOne.mockRejectedValueOnce(new Error("Boom"));
    const res = await GET(
      makeReq("?userId=507f1f77bcf86cd799439011&organizationId=org1"),
    );
    expect(res.status).toBe(500);
  });
});
