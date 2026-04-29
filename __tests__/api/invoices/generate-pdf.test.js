import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLaunchBrowser } = vi.hoisted(() => ({
  mockLaunchBrowser: vi.fn(),
}));

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: mockLaunchBrowser,
}));

import { POST } from "@/app/api/invoices/generate-pdf/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/invoices/generate-pdf", {
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

describe("POST /api/invoices/generate-pdf", () => {
  it("returns 400 when invoiceId is missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invoiceId est requis");
  });

  it("returns the generated PDF", async () => {
    const browser = makeMockBrowser({
      pdfData: { success: true, buffer: [1, 2, 3, 4] },
    });
    mockLaunchBrowser.mockResolvedValueOnce(browser);

    const res = await POST(makeReq({ body: { invoiceId: "i1" } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("invoice-i1.pdf");
  });

  it("returns 500 when PDF generation has error in result", async () => {
    const browser = makeMockBrowser({
      pdfData: { error: "render failed" },
    });
    mockLaunchBrowser.mockResolvedValueOnce(browser);

    const res = await POST(makeReq({ body: { invoiceId: "i1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when browser launch fails", async () => {
    mockLaunchBrowser.mockRejectedValueOnce(new Error("Chromium fail"));
    const res = await POST(makeReq({ body: { invoiceId: "i1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when buffer is empty", async () => {
    const browser = makeMockBrowser({ pdfData: { success: false } });
    mockLaunchBrowser.mockResolvedValueOnce(browser);
    const res = await POST(makeReq({ body: { invoiceId: "i1" } }));
    expect(res.status).toBe(500);
  });
});
