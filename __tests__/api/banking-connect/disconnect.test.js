import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/banking-connect/disconnect/route";

function makeReq({
  method = "POST",
  url = "http://localhost/api/banking-connect/disconnect",
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
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/banking-connect/disconnect", () => {
  it("returns 400 when workspace id is missing", async () => {
    const req = makeReq({ body: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("WorkspaceId requis");
  });

  it("proxies disconnect to backend successfully", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ disconnected: true }),
    });
    const req = makeReq({
      body: {},
      headers: { "x-workspace-id": "ws-1", cookie: "x=y" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.disconnected).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/banking-connect/disconnect"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-workspace-id": "ws-1",
        }),
      }),
    );
  });

  it("forwards backend error response", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: "forbidden" }),
    });
    const req = makeReq({ body: {}, headers: { "x-workspace-id": "ws-1" } });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("returns 500 when fetch throws", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("net down"));
    const req = makeReq({ body: {}, headers: { "x-workspace-id": "ws-1" } });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
