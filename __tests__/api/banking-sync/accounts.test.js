import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/banking-sync/accounts/route";

function makeReq({
  url = "http://localhost/api/banking-sync/accounts",
  headers = {},
} = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/banking-sync/accounts", () => {
  it("returns 400 when workspaceId missing", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("WorkspaceId requis");
  });

  it("proxies to backend and returns success", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: [{ id: "a1" }] }),
    });
    const res = await POST(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accounts).toHaveLength(1);
    expect(fetch).toHaveBeenCalled();
  });

  it("propagates backend non-OK status", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: "Bad gateway" }),
    });
    const res = await POST(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Bad gateway");
  });

  it("accepts workspaceId via query param", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: [] }),
    });
    const res = await POST(
      makeReq({
        url: "http://localhost/api/banking-sync/accounts?workspaceId=ws-q",
      }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 on fetch error", async () => {
    fetch.mockRejectedValueOnce(new Error("Network"));
    const res = await POST(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erreur interne du serveur");
  });
});
