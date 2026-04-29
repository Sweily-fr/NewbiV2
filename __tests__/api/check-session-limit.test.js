import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...a) => mockGetSession(...a) } },
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

const collections = {};
function getCollection(name) {
  if (!collections[name]) {
    collections[name] = {
      findOne: vi.fn(),
      find: vi.fn(() => ({ toArray: () => Promise.resolve([]) })),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };
  }
  return collections[name];
}

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: (n) => getCollection(n) },
}));

vi.mock("mongodb", () => {
  function MockObjectId(id) {
    this._id = id;
  }
  return { ObjectId: MockObjectId };
});

import { GET } from "@/app/api/check-session-limit/route";

function makeReq() {
  return new Request("http://localhost/api/check-session-limit");
}

describe("GET /api/check-session-limit", () => {
  beforeEach(() => {
    Object.keys(collections).forEach((k) => delete collections[k]);
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns sessions count and limit", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u1" },
      session: { activeOrganizationId: "org1", token: "tok-current" },
    });
    getCollection("organization").findOne.mockResolvedValue({
      sessionSettings: { maxSessions: 2, inactivityTimeout: 12 },
    });
    getCollection("session").find.mockReturnValue({
      toArray: () =>
        Promise.resolve([
          {
            _id: { toString: () => "s1" },
            token: "t1",
            userAgent: "ua",
            ipAddress: "1.1.1.1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.sessionCount).toBe(1);
    expect(j.maxSessions).toBe(2);
    expect(j.hasReachedLimit).toBe(false);
  });

  it("hasReachedLimit true when sessions exceed max", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u1" },
      session: { activeOrganizationId: "org1", token: "tok" },
    });
    getCollection("organization").findOne.mockResolvedValue({
      sessionSettings: { maxSessions: 1, inactivityTimeout: 12 },
    });
    getCollection("session").find.mockReturnValue({
      toArray: () =>
        Promise.resolve([
          {
            _id: { toString: () => "s1" },
            token: "t1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            _id: { toString: () => "s2" },
            token: "t2",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
    });

    const res = await GET(makeReq());
    const j = await res.json();
    expect(j.hasReachedLimit).toBe(true);
  });

  it("uses defaults when no orgId", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u1" },
      session: { token: "tok" },
    });
    getCollection("session").find.mockReturnValue({
      toArray: () => Promise.resolve([]),
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.maxSessions).toBe(1);
  });

  it("returns 500 on error", async () => {
    mockGetSession.mockRejectedValue(new Error("boom"));
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });
});
