import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockS3Send } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockS3Send: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function MockS3Client() {
    return { send: mockS3Send };
  }),
  PutObjectCommand: vi.fn(function MockPutObjectCmd(input) {
    return { type: "put", input };
  }),
}));

import { POST } from "@/app/api/cloudflare/upload-icon/route";

function makeFormReq(formData) {
  // Build a Request with FormData
  return new Request("http://localhost/api/cloudflare/upload-icon", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.CLOUDFLARE_ACCOUNT_ID = "acc";
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
  process.env.CLOUDFLARE_R2_BUCKET_NAME = "bucket";
});

describe("POST /api/cloudflare/upload-icon", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const fd = new FormData();
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(401);
  });

  it("returns 400 when params missing", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    const fd = new FormData();
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(400);
  });

  it("returns 403 when userId differs from session", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    const fd = new FormData();
    fd.append(
      "file",
      new Blob(["<svg></svg>"], { type: "image/svg+xml" }),
      "icon.svg",
    );
    fd.append("userId", "u2");
    fd.append("signatureId", "s1");
    fd.append("platform", "facebook");
    fd.append("color", "#FF0000");
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(403);
  });

  it("uploads icon successfully", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockS3Send.mockResolvedValueOnce({});

    const fd = new FormData();
    fd.append(
      "file",
      new Blob(["<svg></svg>"], { type: "image/svg+xml" }),
      "icon.svg",
    );
    fd.append("userId", "u1");
    fd.append("signatureId", "s1");
    fd.append("platform", "facebook");
    fd.append("color", "#FF0000");

    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.url).toContain("custom-icons/u1/s1/facebook-FF0000");
    expect(json.platform).toBe("facebook");
  });

  it("returns 500 on S3 error", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockS3Send.mockRejectedValueOnce(new Error("S3 fail"));
    const fd = new FormData();
    fd.append(
      "file",
      new Blob(["<svg></svg>"], { type: "image/svg+xml" }),
      "icon.svg",
    );
    fd.append("userId", "u1");
    fd.append("signatureId", "s1");
    fd.append("platform", "x");
    fd.append("color", "#000");
    const res = await POST(makeFormReq(fd));
    expect(res.status).toBe(500);
  });
});
