// @vitest-environment node
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

// Dynamic import after env setup — the helper reads process.env at call time
let requireInternalSecret, hasInternalSecret;

beforeEach(async () => {
  // Re-import to pick up env changes per test
  const mod = await import("@/src/lib/security/require-internal-secret");
  requireInternalSecret = mod.requireInternalSecret;
  hasInternalSecret = mod.hasInternalSecret;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(secretValue) {
  return new Request("http://localhost/api/test", {
    headers: secretValue ? { "x-internal-secret": secretValue } : {},
  });
}

describe("requireInternalSecret", () => {
  it("passes when X-Internal-Secret header matches INTERNAL_API_SECRET", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "my-secret-value-123");

    // Should not throw
    expect(() =>
      requireInternalSecret(makeRequest("my-secret-value-123")),
    ).not.toThrow();
  });

  it("throws 401 when X-Internal-Secret header is missing", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "my-secret-value-123");
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      requireInternalSecret(makeRequest());
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(401);
    }

    console.error.mockRestore();
  });

  it("throws 401 when X-Internal-Secret header has wrong value", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "my-secret-value-123");
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      requireInternalSecret(makeRequest("wrong-secret"));
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(401);
    }

    console.error.mockRestore();
  });

  it("throws 500 when INTERNAL_API_SECRET env var is not defined", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      requireInternalSecret(makeRequest("any-value"));
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(500);
    }

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("INTERNAL_API_SECRET is not defined"),
    );
    spy.mockRestore();
  });
});

describe("hasInternalSecret", () => {
  it("returns true when valid secret is present", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "my-secret-value-123");

    expect(hasInternalSecret(makeRequest("my-secret-value-123"))).toBe(true);
  });

  it("returns false when secret is missing", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "my-secret-value-123");

    expect(hasInternalSecret(makeRequest())).toBe(false);
  });

  it("returns false when secret is invalid", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "my-secret-value-123");

    expect(hasInternalSecret(makeRequest("wrong-secret"))).toBe(false);
  });

  it("returns false when INTERNAL_API_SECRET env var is not defined (with warning)", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(hasInternalSecret(makeRequest("any-value"))).toBe(false);

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("INTERNAL_API_SECRET is not defined"),
    );
    spy.mockRestore();
  });
});
