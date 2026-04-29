import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockJSZipFile, mockJSZipGenerate } = vi.hoisted(() => ({
  mockJSZipFile: vi.fn(),
  mockJSZipGenerate: vi.fn(),
}));

vi.mock("jszip", () => ({
  default: vi.fn(function MockJSZip() {
    return {
      file: mockJSZipFile,
      generateAsync: mockJSZipGenerate,
    };
  }),
}));

import { GET } from "@/app/api/transfer/download-all/route";

function makeReq(query = "") {
  return new Request(`http://localhost/api/transfer/download-all${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/transfer/download-all", () => {
  it("returns 400 when params missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
  });

  it("creates a ZIP from successful downloads", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => ({
        arrayBuffer: async () => new ArrayBuffer(8),
      }),
      headers: new Headers({
        "content-disposition": 'attachment; filename="file1.txt"',
      }),
    });

    mockJSZipGenerate.mockResolvedValueOnce(new Blob(["zip"]));

    const res = await GET(
      makeReq("?shareLink=abc&accessKey=key&transferId=t1&fileIds=f1"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
  });

  it("handles failed file downloads gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Net"));
    mockJSZipGenerate.mockResolvedValueOnce(new Blob(["zip"]));

    const res = await GET(
      makeReq("?shareLink=abc&accessKey=key&transferId=t1&fileIds=f1,f2"),
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 when zip generation fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => ({ arrayBuffer: async () => new ArrayBuffer(8) }),
      headers: new Headers(),
    });
    mockJSZipGenerate.mockRejectedValueOnce(new Error("zip fail"));

    const res = await GET(
      makeReq("?shareLink=abc&accessKey=key&transferId=t1&fileIds=f1"),
    );
    expect(res.status).toBe(500);
  });
});
