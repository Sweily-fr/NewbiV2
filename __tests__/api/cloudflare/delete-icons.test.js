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
  ListObjectsV2Command: vi.fn(function MockListObjectsCmd(input) {
    return { type: "list", input };
  }),
  DeleteObjectsCommand: vi.fn(function MockDeleteObjsCmd(input) {
    return { type: "delete", input };
  }),
}));

import { DELETE } from "@/app/api/cloudflare/delete-icons/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/cloudflare/delete-icons", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
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

describe("DELETE /api/cloudflare/delete-icons", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await DELETE(
      makeReq({ body: { userId: "u1", signatureId: "s1" } }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when params missing", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await DELETE(makeReq({ body: { userId: "u1" } }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when userId differs from session", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await DELETE(
      makeReq({ body: { userId: "u2", signatureId: "s1" } }),
    );
    expect(res.status).toBe(403);
  });

  it("returns success when no icons found", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockS3Send.mockResolvedValueOnce({ Contents: [] });
    const res = await DELETE(
      makeReq({ body: { userId: "u1", signatureId: "s1" } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deletedCount).toBe(0);
  });

  it("deletes found icons", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockS3Send
      .mockResolvedValueOnce({ Contents: [{ Key: "k1" }, { Key: "k2" }] })
      .mockResolvedValueOnce({ Deleted: [{ Key: "k1" }, { Key: "k2" }] });

    const res = await DELETE(
      makeReq({ body: { userId: "u1", signatureId: "s1" } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deletedCount).toBe(2);
  });

  it("returns 500 on S3 error", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    mockS3Send.mockRejectedValueOnce(new Error("S3 down"));
    const res = await DELETE(
      makeReq({ body: { userId: "u1", signatureId: "s1" } }),
    );
    expect(res.status).toBe(500);
  });
});
