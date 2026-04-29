import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockMemberFindOne, mockSubFindOne, mockOrgUpdateOne } =
  vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockMemberFindOne: vi.fn(),
    mockSubFindOne: vi.fn(),
    mockOrgUpdateOne: vi.fn(),
  }));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: mockMemberFindOne };
      if (name === "subscription") return { findOne: mockSubFindOne };
      if (name === "organization") return { updateOne: mockOrgUpdateOne };
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

import { POST } from "@/app/api/organizations/[organizationId]/complete-onboarding/route";

function makeReq() {
  return new Request(
    "http://localhost/api/organizations/org1/complete-onboarding",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("POST /api/organizations/[organizationId]/complete-onboarding", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439011" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user not member of org", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce(null);
    const res = await POST(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when no active subscription", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce(null);
    const res = await POST(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(400);
  });

  it("completes onboarding when subscription is active", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce({ status: "active" });
    mockOrgUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await POST(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439012" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 500 on internal error", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(500);
  });
});
