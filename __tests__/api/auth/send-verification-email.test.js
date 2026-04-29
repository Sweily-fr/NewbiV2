import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSendVerificationEmail } = vi.hoisted(() => ({
  mockSendVerificationEmail: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { sendVerificationEmail: mockSendVerificationEmail } },
}));

import { POST } from "@/app/api/auth/send-verification-email/route";

function makeReq({ body } = {}) {
  return new Request("http://localhost/api/auth/send-verification-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/auth/send-verification-email", () => {
  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Email is required");
  });

  it("sends verification email successfully", async () => {
    mockSendVerificationEmail.mockResolvedValueOnce({ ok: true });
    const res = await POST(
      makeReq({ body: { email: "X@Y.fr", callbackURL: "http://cb" } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      body: { email: "x@y.fr", callbackURL: "http://cb" },
    });
  });

  it("returns 400 when result has error", async () => {
    mockSendVerificationEmail.mockResolvedValueOnce({ error: "Bad" });
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Failed to send verification email");
  });

  it("uses default callback URL when not provided", async () => {
    mockSendVerificationEmail.mockResolvedValueOnce({ ok: true });
    await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          callbackURL: expect.stringContaining("/auth/verify-email"),
        }),
      }),
    );
  });

  it("returns 500 on internal error", async () => {
    mockSendVerificationEmail.mockRejectedValueOnce(new Error("Boom"));
    const res = await POST(makeReq({ body: { email: "x@y.fr" } }));
    expect(res.status).toBe(500);
  });
});
