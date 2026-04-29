import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/banking-sync/transactions/route";

function makeReq({
  url = "http://localhost/api/banking-sync/transactions",
  headers = {},
  body,
} = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/banking-sync/transactions", () => {
  it("returns 400 when workspaceId missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
  });

  it("proxies to backend successfully", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [{ id: "t1" }] }),
    });
    const res = await POST(
      makeReq({ headers: { "x-workspace-id": "ws1" }, body: {} }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactions).toHaveLength(1);
  });

  it("propagates backend error status", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Auth" }),
    });
    const res = await POST(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(401);
  });

  it("returns 500 on fetch error", async () => {
    fetch.mockRejectedValueOnce(new Error("net"));
    const res = await POST(makeReq({ headers: { "x-workspace-id": "ws1" } }));
    expect(res.status).toBe(500);
  });
});
