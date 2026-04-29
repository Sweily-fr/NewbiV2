import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockOtpVerify, mockUpdateOne } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOtpVerify: vi.fn(),
  mockUpdateOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/setup-otp-store", () => ({
  setupOtpStore: { verify: mockOtpVerify, set: vi.fn() },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({ updateOne: mockUpdateOne }),
  },
}));

vi.mock("mongodb", () => {
  function ObjectId(id) {
    if (!(this instanceof ObjectId)) return new ObjectId(id);
    this.id = id;
    this.toString = () => id;
  }
  return { ObjectId };
});

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { POST } from "@/app/api/auth/verify-2fa-setup-otp/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/auth/verify-2fa-setup-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/auth/verify-2fa-setup-otp", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ body: { code: "123456" } }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when code is missing or invalid length", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await POST(makeReq({ body: { code: "12" } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Code invalide");
  });

  it("returns 400 when code is incorrect", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockOtpVerify.mockResolvedValueOnce(false);
    const res = await POST(makeReq({ body: { code: "123456" } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Code incorrect ou expiré");
  });

  it("verifies OTP and enables 2FA successfully", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    mockOtpVerify.mockResolvedValueOnce(true);
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await POST(makeReq({ body: { code: "123456" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verified).toBe(true);
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it("returns 500 on internal error", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST(makeReq({ body: { code: "123456" } }));
    expect(res.status).toBe(500);
  });
});
