// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

// Mock auth.api.getSession — we test the helper logic, not Better Auth itself
const mockGetSession = vi.fn();
vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args) => mockGetSession(...args),
    },
  },
}));

// Import after mock setup
const { requireSession } = await import("@/src/lib/security/require-session");

describe("requireSession", () => {
  afterEach(() => {
    mockGetSession.mockReset();
  });

  it("returns { user, session, cookieHeader } when session is valid", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
      session: { id: "sess123", activeOrganizationId: "org456" },
    });

    const request = new Request("http://localhost/api/test", {
      headers: { cookie: "better-auth.session_token=abc123" },
    });

    const result = await requireSession(request);

    expect(result.user).toEqual({ id: "user123", email: "test@example.com" });
    expect(result.session).toEqual({
      id: "sess123",
      activeOrganizationId: "org456",
    });
    expect(result.cookieHeader).toBe("better-auth.session_token=abc123");
  });

  it("throws 401 NextResponse when no session cookie is present", async () => {
    mockGetSession.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = new Request("http://localhost/api/test");

    try {
      await requireSession(request);
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Non authentifié");
    }

    console.error.mockRestore();
  });

  it("throws 401 NextResponse when session cookie is expired", async () => {
    mockGetSession.mockResolvedValue({ user: null });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = new Request("http://localhost/api/test", {
      headers: { cookie: "better-auth.session_token=expired" },
    });

    try {
      await requireSession(request);
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(401);
    }

    console.error.mockRestore();
  });

  it("throws 401 NextResponse when session cookie is revoked (not in DB)", async () => {
    mockGetSession.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = new Request("http://localhost/api/test", {
      headers: { cookie: "better-auth.session_token=revoked" },
    });

    try {
      await requireSession(request);
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(401);
    }

    console.error.mockRestore();
  });

  it("includes raw cookie header string in cookieHeader for proxy use", async () => {
    const cookieValue =
      "better-auth.session_token=abc; other-cookie=xyz; tracking=123";
    mockGetSession.mockResolvedValue({
      user: { id: "user1" },
      session: { id: "sess1" },
    });

    const request = new Request("http://localhost/api/test", {
      headers: { cookie: cookieValue },
    });

    const result = await requireSession(request);
    expect(result.cookieHeader).toBe(cookieValue);
  });
});
