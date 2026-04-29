import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockUpdateOne } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockUpdateOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({ updateOne: mockUpdateOne }),
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

import { POST } from "@/app/api/tutorial/complete/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/tutorial/complete", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("marks tutorial complete on success", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it("returns 500 on db error", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockUpdateOne.mockRejectedValueOnce(new Error("db fail"));
    const res = await POST();
    expect(res.status).toBe(500);
  });

  it("returns 500 on session error", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
