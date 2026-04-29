import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/banking-connect/gocardless/connect/route";

function makeReq({
  url = "http://localhost/api/banking-connect/gocardless/connect",
  headers = {},
} = {}) {
  return new NextRequest(url, { method: "GET", headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/banking-connect/gocardless/connect", () => {
  it("returns 400 when workspace id is missing", async () => {
    const req = makeReq({
      url: "http://localhost/api/banking-connect/gocardless/connect?institutionId=ins-1",
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("WorkspaceId requis");
  });

  it("returns 400 when institution id is missing", async () => {
    const req = makeReq({ headers: { "x-workspace-id": "ws-1" } });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("InstitutionId requis");
  });

  it("proxies to backend with both ids", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ link: "https://gocardless.example" }),
    });
    const req = makeReq({
      url: "http://localhost/api/banking-connect/gocardless/connect?institutionId=ins-1",
      headers: { "x-workspace-id": "ws-1", cookie: "c=d" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.link).toContain("gocardless");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("institutionId=ins-1"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-workspace-id": "ws-1",
        }),
      }),
    );
  });

  it("forwards backend error", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: "invalid institution" }),
    });
    const req = makeReq({
      url: "http://localhost/api/banking-connect/gocardless/connect?institutionId=ins-1",
      headers: { "x-workspace-id": "ws-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("invalid institution");
  });

  it("returns 500 on fetch error", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("net"));
    const req = makeReq({
      url: "http://localhost/api/banking-connect/gocardless/connect?institutionId=ins-1",
      headers: { "x-workspace-id": "ws-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
