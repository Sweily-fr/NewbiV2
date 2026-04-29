import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLaunchBrowser } = vi.hoisted(() => ({
  mockLaunchBrowser: vi.fn(),
}));

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: mockLaunchBrowser,
}));

import { POST } from "@/app/api/purchase-orders/generate-pdf/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/purchase-orders/generate-pdf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

function makeMockBrowser({ pdfData }) {
  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(pdfData),
  };
  return {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe("POST /api/purchase-orders/generate-pdf", () => {
  it("returns 400 when purchaseOrderId is missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
  });

  it("returns the generated PDF", async () => {
    const browser = makeMockBrowser({
      pdfData: { success: true, buffer: [1, 2, 3] },
    });
    mockLaunchBrowser.mockResolvedValueOnce(browser);
    const res = await POST(makeReq({ body: { purchaseOrderId: "po1" } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain(
      "purchase-order-po1.pdf",
    );
  });

  it("returns 500 when generation has error", async () => {
    const browser = makeMockBrowser({ pdfData: { error: "fail" } });
    mockLaunchBrowser.mockResolvedValueOnce(browser);
    const res = await POST(makeReq({ body: { purchaseOrderId: "po1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when browser launch fails", async () => {
    mockLaunchBrowser.mockRejectedValueOnce(new Error("fail"));
    const res = await POST(makeReq({ body: { purchaseOrderId: "po1" } }));
    expect(res.status).toBe(500);
  });
});
