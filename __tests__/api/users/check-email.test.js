import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindOne, mockEnsureConnection } = vi.hoisted(() => {
  const mockFindOne = vi.fn();
  return {
    mockFindOne,
    mockEnsureConnection: vi.fn(async () => ({
      collection: () => ({ findOne: mockFindOne }),
    })),
  };
});

vi.mock("@/src/lib/mongodb", () => ({
  ensureConnection: mockEnsureConnection,
  mongoDb: { collection: () => ({ findOne: mockFindOne }) },
}));

import { POST } from "@/app/api/users/check-email/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/users/check-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/users/check-email", () => {
  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
  });

  it("returns exists:false when user not found", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exists).toBe(false);
  });

  it("returns exists:true when user found", async () => {
    mockFindOne.mockResolvedValueOnce({ _id: "u1" });
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exists).toBe(true);
    expect(json.email).toBe("x@y.fr");
  });

  it("lowercases email before lookup", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    await POST(makeReq({ body: { email: "FOO@BAR.com" } }));
    expect(mockFindOne).toHaveBeenCalledWith({ email: "foo@bar.com" });
  });

  it("returns 500 on internal error", async () => {
    mockEnsureConnection.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(500);
  });
});
