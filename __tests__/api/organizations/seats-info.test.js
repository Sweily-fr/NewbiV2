import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockMemberFindOne, mockSubFindOne, mockMemberFind } =
  vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockMemberFindOne: vi.fn(),
    mockSubFindOne: vi.fn(),
    mockMemberFind: vi.fn(),
  }));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member")
        return { findOne: mockMemberFindOne, find: mockMemberFind };
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

import { GET } from "@/app/api/organizations/[organizationId]/seats-info/route";

function makeReq() {
  return new Request("http://localhost/api/organizations/org1/seats-info");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/organizations/[organizationId]/seats-info", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user not member of org", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when no subscription", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns seat info for pme plan", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });
    mockSubFindOne.mockResolvedValueOnce({ plan: "pme" });
    mockMemberFind.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { role: "owner", status: "active" },
        { role: "member", status: "active" },
        { role: "accountant", status: "active" },
      ]),
    });

    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.includedSeats).toBe(10);
    expect(json.currentMembers).toBe(2); // accountant excluded
    expect(json.plan).toBe("pme");
  });

  it("returns 500 on internal error", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(500);
  });
});
