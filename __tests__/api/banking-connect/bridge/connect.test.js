import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/banking-connect/bridge/connect/route";

function makeReq({
  url = "http://localhost/api/banking-connect/bridge/connect",
  headers = {},
} = {}) {
  return new NextRequest(url, {
    method: "GET",
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/banking-connect/bridge/connect", () => {
  it("returns 400 when workspace id is missing", async () => {
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("WorkspaceId requis");
  });

  it("calls backend without providerId when none is given", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://bridge.example/start" }),
    });
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalled();
    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("/banking-connect/bridge/connect");
    expect(calledUrl).not.toContain("providerId=");
  });

  it("appends providerId to backend URL when present", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://bridge.example/start" }),
    });
    const req = makeReq({
      url: "http://localhost/api/banking-connect/bridge/connect?providerId=42",
      headers: { "x-workspace-id": "ws-1" },
    });
    await GET(req);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("providerId=42"),
      expect.any(Object),
    );
  });

  it("forwards backend error response", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("returns 500 on fetch error", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("boom"));
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
