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

/**
 * Create a fake request with headers that work in happy-dom.
 * happy-dom's Request constructor strips the "cookie" header,
 * so we use a plain object with a headers.get() mock.
 */
function fakeRequest(cookieHeader) {
  const headers = new Headers();
  if (cookieHeader) headers.set("x-test-cookie", cookieHeader);

  return {
    headers: {
      get: (name) => {
        if (name === "cookie") return cookieHeader || "";
        return headers.get(name);
      },
      // Required by auth.api.getSession which may iterate headers
      [Symbol.iterator]: headers[Symbol.iterator]?.bind(headers),
      entries: headers.entries.bind(headers),
      forEach: headers.forEach.bind(headers),
    },
  };
}

describe("requireSession", () => {
  afterEach(() => {
    mockGetSession.mockReset();
  });

  it("returns { user, session, cookieHeader } when session is valid", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
      session: { id: "sess123", activeOrganizationId: "org456" },
    });

    const request = fakeRequest("better-auth.session_token=abc123");
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

    try {
      await requireSession(fakeRequest());
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

    try {
      await requireSession(fakeRequest("better-auth.session_token=expired"));
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(401);
    }

    console.error.mockRestore();
  });

  it("throws 401 NextResponse when session cookie is revoked (not in DB)", async () => {
    mockGetSession.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireSession(fakeRequest("better-auth.session_token=revoked"));
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

    const result = await requireSession(fakeRequest(cookieValue));
    expect(result.cookieHeader).toBe(cookieValue);
  });
});
