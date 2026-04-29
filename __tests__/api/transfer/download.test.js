import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockS3Send, mockGetSignedUrl } = vi.hoisted(() => ({
  mockS3Send: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function MockS3Client() {
    return { send: mockS3Send };
  }),
  GetObjectCommand: vi.fn(function MockGetObjectCmd(input) {
    return { type: "get", input };
  }),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { GET } from "@/app/api/transfer/download/[fileId]/route";

function makeReq(query = "") {
  return new Request(`http://localhost/api/transfer/download/file1${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/transfer/download/[fileId]", () => {
  it("returns 400 when params missing", async () => {
    const res = await GET(makeReq(), {
      params: Promise.resolve({ fileId: "f1" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 when GraphQL says not authorized", async () => {
    fetch.mockResolvedValueOnce({
      text: async () =>
        JSON.stringify({
          data: {
            getFileTransferByLink: { success: false, message: "denied" },
          },
        }),
    });
    const res = await GET(makeReq("?shareLink=abc&accessKey=key"), {
      params: Promise.resolve({ fileId: "f1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when file not found in transfer", async () => {
    fetch.mockResolvedValueOnce({
      text: async () =>
        JSON.stringify({
          data: {
            getFileTransferByLink: {
              success: true,
              fileTransfer: { id: "t1", files: [{ id: "different" }] },
            },
          },
        }),
    });
    const res = await GET(makeReq("?shareLink=abc&accessKey=key"), {
      params: Promise.resolve({ fileId: "f1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns the file when downloadUrl is present", async () => {
    fetch
      .mockResolvedValueOnce({
        text: async () =>
          JSON.stringify({
            data: {
              getFileTransferByLink: {
                success: true,
                fileTransfer: {
                  id: "t1",
                  files: [
                    {
                      id: "f1",
                      originalName: "test.txt",
                      size: 4,
                      mimeType: "text/plain",
                      downloadUrl: "https://example.com/download",
                    },
                  ],
                },
              },
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(4),
      });

    const res = await GET(makeReq("?shareLink=abc&accessKey=key"), {
      params: Promise.resolve({ fileId: "f1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("test.txt");
  });

  it("redirects to signed URL when r2Key present", async () => {
    fetch.mockResolvedValueOnce({
      text: async () =>
        JSON.stringify({
          data: {
            getFileTransferByLink: {
              success: true,
              fileTransfer: {
                id: "t1",
                files: [
                  {
                    id: "f1",
                    originalName: "test.txt",
                    size: 0,
                    mimeType: "text/plain",
                    storageType: "r2",
                    r2Key: "key1",
                  },
                ],
              },
            },
          },
        }),
    });
    mockGetSignedUrl.mockResolvedValueOnce("https://signed.example.com/x");

    const res = await GET(makeReq("?shareLink=abc&accessKey=key"), {
      params: Promise.resolve({ fileId: "f1" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
  });

  it("returns 500 on fetch failure", async () => {
    fetch.mockRejectedValueOnce(new Error("net"));
    const res = await GET(makeReq("?shareLink=abc&accessKey=key"), {
      params: Promise.resolve({ fileId: "f1" }),
    });
    expect(res.status).toBe(500);
  });
});
