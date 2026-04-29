import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockVerifyEmail } = vi.hoisted(() => ({
  mockVerifyEmail: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { verifyEmail: mockVerifyEmail } },
}));

import { GET } from "@/app/api/auth/verify-email/route";

function makeReq(url = "http://localhost/api/auth/verify-email") {
  return new Request(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("GET /api/auth/verify-email", () => {
  it("redirects with missing-token error when token is absent", async () => {
    const res = await GET(makeReq("http://localhost/api/auth/verify-email"));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("error=missing-token");
  });

  it("redirects to verify-email page on success and copies cookies", async () => {
    const headers = new Headers();
    headers.append("set-cookie", "session=abc; Path=/");
    mockVerifyEmail.mockResolvedValueOnce({
      status: 200,
      headers,
    });

    const res = await GET(
      makeReq("http://localhost/api/auth/verify-email?token=tok123"),
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("verified=true");
  });

  it("redirects to invalid-token on non-200 response", async () => {
    mockVerifyEmail.mockResolvedValueOnce({
      status: 400,
      headers: new Headers(),
    });
    const res = await GET(
      makeReq("http://localhost/api/auth/verify-email?token=tok123"),
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("error=invalid-token");
  });

  it("redirects to server-error when verifyEmail throws", async () => {
    mockVerifyEmail.mockRejectedValueOnce(new Error("Boom"));
    const res = await GET(
      makeReq("http://localhost/api/auth/verify-email?token=tok123"),
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("error=server-error");
  });
});
