import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLaunchBrowser } = vi.hoisted(() => ({
  mockLaunchBrowser: vi.fn(),
}));

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: mockLaunchBrowser,
}));

import { POST } from "@/app/api/quotes/generate-pdf/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/quotes/generate-pdf", {
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

describe("POST /api/quotes/generate-pdf", () => {
  it("returns 400 when quoteId is missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
  });

  it("returns the generated PDF", async () => {
    const browser = makeMockBrowser({
      pdfData: { success: true, buffer: [1, 2, 3] },
    });
    mockLaunchBrowser.mockResolvedValueOnce(browser);
    const res = await POST(makeReq({ body: { quoteId: "q1" } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("quote-q1.pdf");
  });

  it("returns 500 when result has error", async () => {
    const browser = makeMockBrowser({ pdfData: { error: "fail" } });
    mockLaunchBrowser.mockResolvedValueOnce(browser);
    const res = await POST(makeReq({ body: { quoteId: "q1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when browser launch fails", async () => {
    mockLaunchBrowser.mockRejectedValueOnce(new Error("fail"));
    const res = await POST(makeReq({ body: { quoteId: "q1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when PDF buffer missing", async () => {
    const browser = makeMockBrowser({ pdfData: { success: false } });
    mockLaunchBrowser.mockResolvedValueOnce(browser);
    const res = await POST(makeReq({ body: { quoteId: "q1" } }));
    expect(res.status).toBe(500);
  });
});
