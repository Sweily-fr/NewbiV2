import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: vi.fn(),
}));

import { POST } from "@/app/api/credit-notes/generate-pdf/route";
import { launchBrowser } from "@/src/lib/puppeteer";

function makeReq({
  method = "POST",
  url = "http://localhost/api/credit-notes/generate-pdf",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function mockBrowser({
  pdfData = { success: true, buffer: [1, 2, 3, 4] },
  throwOnGoto = false,
} = {}) {
  const page = {
    goto: vi.fn(
      throwOnGoto
        ? () => Promise.reject(new Error("nav fail"))
        : () => Promise.resolve(),
    ),
    waitForFunction: vi.fn(() => Promise.resolve()),
    evaluate: vi.fn(() => Promise.resolve(pdfData)),
  };
  return {
    newPage: vi.fn(() => Promise.resolve(page)),
    close: vi.fn(() => Promise.resolve()),
  };
}

describe("POST /api/credit-notes/generate-pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if creditNoteId missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBeTruthy();
  });

  it("returns PDF buffer on happy path", async () => {
    launchBrowser.mockResolvedValue(mockBrowser());
    const res = await POST(makeReq({ body: { creditNoteId: "abc123" } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain(
      "credit-note-abc123.pdf",
    );
  });

  it("returns 500 if pdfData has error", async () => {
    launchBrowser.mockResolvedValue(
      mockBrowser({ pdfData: { error: "render error" } }),
    );
    const res = await POST(makeReq({ body: { creditNoteId: "x" } }));
    expect(res.status).toBe(500);
    const j = await res.json();
    expect(j.error).toBeTruthy();
  });

  it("returns 500 if pdfData not successful", async () => {
    launchBrowser.mockResolvedValue(
      mockBrowser({ pdfData: { success: false } }),
    );
    const res = await POST(makeReq({ body: { creditNoteId: "x" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 if launchBrowser throws", async () => {
    launchBrowser.mockRejectedValue(new Error("puppeteer fail"));
    const res = await POST(makeReq({ body: { creditNoteId: "x" } }));
    expect(res.status).toBe(500);
    const j = await res.json();
    expect(j.error).toBeTruthy();
  });
});
