import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockUserFindOne,
  mockUserDeleteOne,
  mockMemberDeleteOne,
  mockOrgFindOne,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockUserFindOne: vi.fn(),
  mockUserDeleteOne: vi.fn(),
  mockMemberDeleteOne: vi.fn(),
  mockOrgFindOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "user")
        return { findOne: mockUserFindOne, deleteOne: mockUserDeleteOne };
      if (name === "member")
        return { findOne: vi.fn(), deleteOne: mockMemberDeleteOne };
      if (name === "organization") return { findOne: mockOrgFindOne };
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

import { POST } from "@/app/api/admin/delete-test-users/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/admin/delete-test-users", {
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

describe("POST /api/admin/delete-test-users", () => {
  it("returns 400 when params missing", async () => {
    const res = await POST(makeReq({ body: { organizationId: "org1" } }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when org not found", async () => {
    mockOrgFindOne.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          emails: ["a@b.com"],
        },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("reports not_found when user does not exist", async () => {
    mockOrgFindOne.mockResolvedValueOnce({ _id: "o1", name: "Org" });
    mockUserFindOne.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          emails: ["a@b.com"],
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].status).toBe("not_found");
  });

  it("deletes user and member successfully", async () => {
    mockOrgFindOne.mockResolvedValueOnce({ _id: "o1", name: "Org" });
    mockUserFindOne.mockResolvedValueOnce({ _id: "u1" });
    mockMemberDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    mockUserDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });

    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          emails: ["a@b.com"],
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].status).toBe("success");
  });

  it("reports not_member when no member to delete", async () => {
    mockOrgFindOne.mockResolvedValueOnce({ _id: "o1", name: "Org" });
    mockUserFindOne.mockResolvedValueOnce({ _id: "u1" });
    mockMemberDeleteOne.mockResolvedValueOnce({ deletedCount: 0 });

    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          emails: ["a@b.com"],
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].status).toBe("not_member");
  });

  it("returns 401 in production without session/key", async () => {
    process.env.NODE_ENV = "production";
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        body: {
          organizationId: "507f1f77bcf86cd799439011",
          emails: ["a@b.com"],
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
          emails: ["a@b.com"],
        },
      }),
    );
    expect(res.status).toBe(500);
  });
});
