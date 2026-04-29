import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/banking-connect/bridge/institutions/route";

function makeReq({
  url = "http://localhost/api/banking-connect/bridge/institutions",
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

describe("GET /api/banking-connect/bridge/institutions", () => {
  it("uses default country FR when not provided", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ institutions: [] }),
    });
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("country=FR"),
      expect.any(Object),
    );
  });

  it("forwards a custom country query param", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ institutions: [{ id: 1 }] }),
    });
    const req = makeReq({
      url: "http://localhost/api/banking-connect/bridge/institutions?country=DE",
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.institutions).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("country=DE"),
      expect.any(Object),
    );
  });

  it.skip("forwards cookie header to backend", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ institutions: [] }),
    });
    const req = makeReq({ headers: { cookie: "session=abc" } });
    await GET(req);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: "session=abc" }),
      }),
    );
  });

  it("forwards backend error response", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: "bad gateway" }),
    });
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("bad gateway");
  });

  it("returns 500 when fetch throws", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("Network failure"));
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
