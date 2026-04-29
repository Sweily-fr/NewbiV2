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

import { POST } from "@/app/api/auth/check-user/route";

function makeReq({
  method = "POST",
  url = "http://localhost/api/auth/check-user",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/auth/check-user", () => {
  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Email is required");
  });

  it("returns exists:false when user not found", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exists).toBe(false);
    expect(json.emailVerified).toBe(false);
  });

  it("returns exists:true with emailVerified", async () => {
    mockFindOne.mockResolvedValueOnce({ emailVerified: true });
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exists).toBe(true);
    expect(json.emailVerified).toBe(true);
  });

  it("lowercases email when querying", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    await POST(makeReq({ body: { email: "Foo@Bar.com" } }));
    expect(mockFindOne).toHaveBeenCalledWith({ email: "foo@bar.com" });
  });

  it("returns 500 on internal error", async () => {
    mockEnsureConnection.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});
