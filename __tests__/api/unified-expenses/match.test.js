import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/unified-expenses/match/route";

function makeReq({ body } = {}) {
  return new NextRequest("http://localhost/api/unified-expenses/match", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/unified-expenses/match", () => {
  it("returns 400 when workspaceId is missing", async () => {
    const res = await POST(makeReq({ body: { amount: 10 } }));
    expect(res.status).toBe(400);
  });

  it("returns no match when score below threshold", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: { transactions: [] },
      }),
    });
    const res = await POST(
      makeReq({ body: { workspaceId: "ws1", amount: 10 } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.found).toBe(false);
  });

  it("finds best match with high score", async () => {
    const today = new Date().toISOString().split("T")[0];
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: {
          transactions: [
            {
              id: "t1",
              amount: -100,
              description: "Acme Store",
              date: today,
            },
          ],
        },
      }),
    });
    const res = await POST(
      makeReq({
        body: {
          workspaceId: "ws1",
          amount: 100,
          date: today,
          vendor: "Acme",
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.found).toBe(true);
    expect(json.transaction.id).toBe("t1");
  });

  it("skips transactions with existing receipt", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: {
          transactions: [
            {
              id: "t1",
              amount: 100,
              description: "Acme",
              date: "2026-01-01",
              receiptFile: { url: "x" },
            },
          ],
        },
      }),
    });
    const res = await POST(
      makeReq({
        body: { workspaceId: "ws1", amount: 100, date: "2026-01-01" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.found).toBe(false);
  });

  it("returns 500 on GraphQL errors", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ errors: [{ message: "Bad" }] }),
    });
    const res = await POST(
      makeReq({ body: { workspaceId: "ws1", amount: 1 } }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 on fetch error", async () => {
    fetch.mockRejectedValueOnce(new Error("net"));
    const res = await POST(
      makeReq({ body: { workspaceId: "ws1", amount: 1 } }),
    );
    expect(res.status).toBe(500);
  });
});
