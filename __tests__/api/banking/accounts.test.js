import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/banking/accounts/route";

function makeReq({
  url = "http://localhost/api/banking/accounts",
  headers = {},
} = {}) {
  return new Request(url, {
    method: "GET",
    headers: { "content-type": "application/json", ...headers },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/banking/accounts", () => {
  it("returns 400 when workspaceId is missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("WorkspaceId requis");
  });

  it("returns accounts from backend", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: [{ id: "a1" }, { id: "a2" }] }),
    });
    const res = await GET(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accounts).toHaveLength(2);
  });

  it("forwards backend error status", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: "Forbidden" }),
    });
    const res = await GET(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(403);
  });

  it("returns 500 on fetch error", async () => {
    fetch.mockRejectedValueOnce(new Error("net"));
    const res = await GET(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erreur interne du serveur");
    expect(json.accounts).toEqual([]);
  });
});
