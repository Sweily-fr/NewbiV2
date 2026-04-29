import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/banking-connect/status/route";

function makeReq({
  method = "GET",
  url = "http://localhost/api/banking-connect/status",
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

describe("GET /api/banking-connect/status", () => {
  it("returns 400 when workspace id is missing", async () => {
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("WorkspaceId requis");
  });

  it("proxies to backend and returns data on happy path", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ connected: true, provider: "bridge" }),
    });
    const req = makeReq({
      headers: { "x-workspace-id": "ws-1", cookie: "a=b" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ connected: true, provider: "bridge" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/banking-connect/status"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-workspace-id": "ws-1",
        }),
      }),
    );
  });

  it("forwards backend error status with parsed JSON", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => JSON.stringify({ error: "upstream down" }),
    });
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream down");
  });

  it("returns plain text wrapped in error when response is not JSON", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "raw error string",
    });
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("raw error string");
  });

  it("returns 500 when fetch throws", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("net down"));
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });

  it("strips /graphql suffix from backend URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/graphql";
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    await GET(req);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.example.com/banking-connect/status",
      expect.any(Object),
    );
    delete process.env.NEXT_PUBLIC_API_URL;
  });
});
