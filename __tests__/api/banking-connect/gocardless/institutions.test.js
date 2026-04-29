import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/banking-connect/gocardless/institutions/route";

function makeReq({
  url = "http://localhost/api/banking-connect/gocardless/institutions",
  headers = {},
} = {}) {
  return new NextRequest(url, { method: "GET", headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/banking-connect/gocardless/institutions", () => {
  it("uses default country FR", async () => {
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

  it.skip("forwards a custom country and cookie", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ institutions: [{ id: 1 }] }),
    });
    const req = makeReq({
      url: "http://localhost/api/banking-connect/gocardless/institutions?country=DE",
      headers: { cookie: "session=abc" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.institutions).toEqual([{ id: 1 }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("country=DE"),
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: "session=abc" }),
      }),
    );
  });

  it("forwards backend error", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: "down" }),
    });
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("down");
  });

  it("returns 500 on network error", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const req = makeReq();
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
