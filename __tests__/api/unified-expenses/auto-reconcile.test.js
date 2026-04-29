import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock(
  "@/app/dashboard/outils/transactions/components/transactions/utils/mappers",
  () => ({
    mapCategoryToEnum: vi.fn(() => "OTHER"),
  }),
);

import { POST } from "@/app/api/unified-expenses/auto-reconcile/route";

function makeFormReq(formData, headers = {}) {
  return new NextRequest(
    "http://localhost/api/unified-expenses/auto-reconcile",
    {
      method: "POST",
      headers,
      body: formData,
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("POST /api/unified-expenses/auto-reconcile", () => {
  it("returns 400 when workspaceId is missing", async () => {
    const fd = new FormData();
    fd.append("file", new Blob(["data"]), "f.jpg");
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(400);
  });

  it("returns 400 when file is missing", async () => {
    const fd = new FormData();
    fd.append("workspaceId", "ws1");
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(400);
  });

  it("links to existing transaction", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: {
          uploadTransactionReceipt: {
            success: true,
            transaction: { id: "t1", receiptFile: { url: "u" } },
          },
        },
      }),
    });

    const fd = new FormData();
    fd.append("workspaceId", "ws1");
    fd.append("transactionId", "t1");
    fd.append("file", new Blob(["data"]), "receipt.jpg");

    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.action).toBe("linked");
  });

  it("creates new transaction when no transactionId", async () => {
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: { createTransaction: { id: "newT1", amount: 50 } },
        }),
      })
      .mockResolvedValueOnce({ json: async () => ({}) });

    const fd = new FormData();
    fd.append("workspaceId", "ws1");
    fd.append("file", new Blob(["data"]), "receipt.jpg");
    fd.append("ocrData", JSON.stringify({ amount: 50, vendor: "Acme" }));

    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.action).toBe("created");
    expect(json.transactionId).toBe("newT1");
  });

  it("returns 500 when GraphQL has errors during link", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ errors: [{ message: "Bad" }] }),
    });
    const fd = new FormData();
    fd.append("workspaceId", "ws1");
    fd.append("transactionId", "t1");
    fd.append("file", new Blob(["data"]), "f.jpg");
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(500);
  });

  it("returns 500 on outer fetch error", async () => {
    fetch.mockRejectedValueOnce(new Error("Network"));
    const fd = new FormData();
    fd.append("workspaceId", "ws1");
    fd.append("transactionId", "t1");
    fd.append("file", new Blob(["data"]), "f.jpg");
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(500);
  });
});
