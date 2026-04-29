import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockAggregate, mockFind } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockAggregate: vi.fn(),
  mockFind: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { aggregate: mockAggregate };
      if (name === "invitation") return { find: mockFind };
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

import { GET } from "@/app/api/organizations/[organizationId]/members/route";

function makeReq() {
  return new Request("http://localhost/api/organizations/org1/members", {
    method: "GET",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("GET /api/organizations/[organizationId]/members", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439011" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns members and invitations", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockAggregate.mockReturnValueOnce({
      toArray: vi
        .fn()
        .mockResolvedValueOnce([
          { id: "m1", email: "a@b.com", role: "member", type: "member" },
        ]),
    });
    mockFind.mockReturnValueOnce({
      toArray: vi
        .fn()
        .mockResolvedValueOnce([
          {
            _id: { toString: () => "i1" },
            email: "inv@b.com",
            role: "member",
            status: "pending",
          },
        ]),
    });

    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439011" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
  });

  it("returns empty arrays when no members or invitations", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockAggregate.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockFind.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439011" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(0);
  });

  it("returns 500 on aggregation error", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockAggregate.mockImplementationOnce(() => {
      throw new Error("Agg fail");
    });
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "507f1f77bcf86cd799439011" }),
    });
    expect(res.status).toBe(500);
  });

  it("returns 500 when session check fails", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const res = await GET(makeReq(), {
      params: Promise.resolve({ organizationId: "org1" }),
    });
    expect(res.status).toBe(500);
  });
});
