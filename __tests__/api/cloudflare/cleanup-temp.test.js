import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

import { POST } from "@/app/api/cloudflare/cleanup-temp/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/cloudflare/cleanup-temp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/cloudflare/cleanup-temp", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ body: { userId: "u1" } }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when userId missing", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" }, token: "tok" });
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
  });

  it("returns success after GraphQL cleanup", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" }, token: "tok" });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          cleanupTemporaryFiles: {
            success: true,
            deletedCount: 3,
            message: "OK",
          },
        },
      }),
    });
    const res = await POST(
      makeReq({ body: { userId: "u1", newSignatureId: "sig1" } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.deletedCount).toBe(3);
  });

  it("returns 500 on GraphQL HTTP error", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" }, token: "tok" });
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    });
    const res = await POST(makeReq({ body: { userId: "u1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when GraphQL response has errors", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" }, token: "tok" });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: "Bad query" }] }),
    });
    const res = await POST(makeReq({ body: { userId: "u1" } }));
    expect(res.status).toBe(500);
  });
});
