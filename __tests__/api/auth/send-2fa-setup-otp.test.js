import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockSetupOtpSet, mockSend2FAEmail } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockSetupOtpSet: vi.fn(),
    mockSend2FAEmail: vi.fn(),
  }),
);

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/src/lib/auth-utils", () => ({
  send2FAEmail: mockSend2FAEmail,
}));

vi.mock("@/src/lib/setup-otp-store", () => ({
  setupOtpStore: { set: mockSetupOtpSet, verify: vi.fn() },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { POST } from "@/app/api/auth/send-2fa-setup-otp/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/auth/send-2fa-setup-otp", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Non authentifié");
  });

  it("generates and sends OTP successfully", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "user1", email: "x@y.fr" },
    });
    mockSetupOtpSet.mockResolvedValueOnce(undefined);
    mockSend2FAEmail.mockResolvedValueOnce(undefined);

    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe(true);
    expect(mockSetupOtpSet).toHaveBeenCalledWith(
      "user1",
      expect.stringMatching(/^\d{6}$/),
      5 * 60 * 1000,
    );
    expect(mockSend2FAEmail).toHaveBeenCalled();
  });

  it("returns 500 on store failure", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "user1" } });
    mockSetupOtpSet.mockRejectedValueOnce(new Error("Store fail"));
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Store fail");
  });

  it("returns 500 on email send failure", async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: "user1" } });
    mockSetupOtpSet.mockResolvedValueOnce(undefined);
    mockSend2FAEmail.mockRejectedValueOnce(new Error("Email fail"));
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
