import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

import { POST } from "@/app/api/signatures/auto-save/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/signatures/auto-save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/signatures/auto-save", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({ body: { signatureId: "s1", signatureData: {} } }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when params missing", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
  });

  it("creates signature successfully", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "u1", organizationId: "ws1" },
      token: "tok",
    });
    // First fetch is the cleanup-temp fetch (for temp- IDs), second is GraphQL.
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, deletedCount: 0 }),
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          createEmailSignature: { id: "s1-new", signatureName: "Auto" },
        },
      }),
    });

    const res = await POST(
      makeReq({
        body: {
          signatureId: "temp-1",
          signatureData: { signatureName: "Auto" },
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.signatureId).toBe("s1-new");
  });

  it("updates signature when id is not temp", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "u1", organizationId: "ws1" },
      token: "tok",
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          updateEmailSignature: { id: "s1", signatureName: "Mine" },
        },
      }),
    });
    const res = await POST(
      makeReq({
        body: { signatureId: "s1", signatureData: { signatureName: "Mine" } },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.signatureId).toBe("s1");
  });

  it("returns 500 when GraphQL HTTP error", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" }, token: "tok" });
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "err",
    });
    const res = await POST(
      makeReq({ body: { signatureId: "s1", signatureData: {} } }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 when GraphQL has errors", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" }, token: "tok" });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: "Bad" }] }),
    });
    const res = await POST(
      makeReq({ body: { signatureId: "s1", signatureData: {} } }),
    );
    expect(res.status).toBe(500);
  });
});
