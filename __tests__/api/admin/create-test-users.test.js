import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockUserFindOne,
  mockUserInsertOne,
  mockMemberFindOne,
  mockMemberInsertOne,
  mockOrgFindOne,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockUserFindOne: vi.fn(),
  mockUserInsertOne: vi.fn(),
  mockMemberFindOne: vi.fn(),
  mockMemberInsertOne: vi.fn(),
  mockOrgFindOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "user")
        return { findOne: mockUserFindOne, insertOne: mockUserInsertOne };
      if (name === "member")
        return { findOne: mockMemberFindOne, insertOne: mockMemberInsertOne };
      if (name === "organization") return { findOne: mockOrgFindOne };
      return {};
    },
  },
}));

vi.mock("mongodb", () => {
  function ObjectId(id) {
    if (!(this instanceof ObjectId)) return new ObjectId(id);
    this.id = id || "generated_id";
    this.toString = () => String(this.id);
  }
  return { ObjectId };
});

import { POST } from "@/app/api/admin/create-test-users/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/admin/create-test-users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.NODE_ENV = "development";
});

describe("POST /api/admin/create-test-users", () => {
  it("returns 400 when params missing", async () => {
    const res = await POST(makeReq({ body: { organizationId: "org1" } }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when organization not found", async () => {
    mockOrgFindOne.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          members: [{ email: "a@b.com", role: "member", name: "A" }],
        },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("creates new test user successfully", async () => {
    mockOrgFindOne.mockResolvedValueOnce({ _id: "org1", name: "Org" });
    mockUserFindOne.mockResolvedValueOnce(null);
    mockUserInsertOne.mockResolvedValueOnce({ acknowledged: true });
    mockMemberFindOne.mockResolvedValueOnce(null);
    mockMemberInsertOne.mockResolvedValueOnce({ acknowledged: true });

    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          members: [{ email: "a@b.com", role: "member", name: "A" }],
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.results[0].status).toBe("success");
  });

  it("reports already_member when member exists", async () => {
    mockOrgFindOne.mockResolvedValueOnce({ _id: "org1", name: "Org" });
    mockUserFindOne.mockResolvedValueOnce({ _id: "u1" });
    mockMemberFindOne.mockResolvedValueOnce({ _id: "m1" });

    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          members: [{ email: "a@b.com", role: "member", name: "A" }],
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].status).toBe("already_member");
  });

  it("returns 401 in production without session/key", async () => {
    process.env.NODE_ENV = "production";
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          members: [{ email: "a@b.com", role: "member", name: "A" }],
        },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 500 on internal error", async () => {
    mockOrgFindOne.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          members: [{ email: "a@b.com", role: "member", name: "A" }],
        },
      }),
    );
    expect(res.status).toBe(500);
  });
});
