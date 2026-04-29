import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockFindOne } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFindOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({ findOne: mockFindOne }),
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

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { GET } from "@/app/api/tutorial/status/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/tutorial/status", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns hasCompletedTutorial:true when user has completed", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockFindOne.mockResolvedValueOnce({ hasCompletedTutorial: true });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasCompletedTutorial).toBe(true);
  });

  it("returns false when not yet completed", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockFindOne.mockResolvedValueOnce({});
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasCompletedTutorial).toBe(false);
  });

  it("returns false when user not found", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockFindOne.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasCompletedTutorial).toBe(false);
  });

  it("returns 500 on db error", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockFindOne.mockRejectedValueOnce(new Error("db fail"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
