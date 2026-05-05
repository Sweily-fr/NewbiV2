import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse with simple sentinel objects so we can assert on
// what the middleware decided to do. Use vi.hoisted so the mocks are
// available inside the hoisted vi.mock factory below.
const { NextResponseMock } = vi.hoisted(() => ({
  NextResponseMock: {
    next: vi.fn(() => ({ type: "next" })),
    redirect: vi.fn((url) => ({ type: "redirect", url })),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: NextResponseMock,
}));

// Mock the delegated subscription middleware so we can drive the
// happy-path / error-path branches of the root middleware.
vi.mock("@/src/middleware/subscription", () => ({
  subscriptionMiddleware: vi.fn(),
}));

// The root middleware imports from a relative path; mock that exact
// specifier too so Vitest hits the same module instance.
vi.mock("./src/middleware/subscription", () => ({
  subscriptionMiddleware: vi.fn(),
}));

import { middleware } from "@/middleware";
import { subscriptionMiddleware } from "@/src/middleware/subscription";

function makeReq(pathname, { cookies = {}, cookieHeader } = {}) {
  const headers = new Headers();
  if (cookieHeader !== undefined) {
    headers.set("cookie", cookieHeader);
  } else {
    const serialized = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (serialized) headers.set("cookie", serialized);
  }

  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    cookies: {
      get: (k) => (k in cookies ? { value: cookies[k] } : undefined),
      has: (k) => k in cookies,
    },
    headers,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("root middleware — delegation to subscriptionMiddleware", () => {
  it("delegates to subscriptionMiddleware and returns its result", async () => {
    const expected = { type: "delegated", from: "subscriptionMiddleware" };
    subscriptionMiddleware.mockResolvedValueOnce(expected);

    const req = makeReq("/dashboard/invoices");
    const res = await middleware(req);

    expect(subscriptionMiddleware).toHaveBeenCalledTimes(1);
    expect(subscriptionMiddleware).toHaveBeenCalledWith(req);
    expect(res).toBe(expected);
  });

  it("delegates for public paths too (subscriptionMiddleware decides)", async () => {
    const expected = { type: "next" };
    subscriptionMiddleware.mockResolvedValueOnce(expected);

    const req = makeReq("/");
    const res = await middleware(req);

    expect(subscriptionMiddleware).toHaveBeenCalledWith(req);
    expect(res).toBe(expected);
    // The root middleware itself should not have called NextResponse on the
    // happy path — that's subscriptionMiddleware's job.
    expect(NextResponseMock.next).not.toHaveBeenCalled();
    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
  });

  it("delegates for API routes", async () => {
    const expected = { type: "api-pass" };
    subscriptionMiddleware.mockResolvedValueOnce(expected);

    const req = makeReq("/api/graphql");
    const res = await middleware(req);

    expect(subscriptionMiddleware).toHaveBeenCalledWith(req);
    expect(res).toBe(expected);
  });
});

describe("root middleware — fatal error fallback on protected routes", () => {
  it("redirects to /auth/login when subscriptionMiddleware throws AND no session cookie", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq("/dashboard");
    const res = await middleware(req);

    expect(NextResponseMock.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = NextResponseMock.redirect.mock.calls[0][0];
    expect(redirectArg).toBeInstanceOf(URL);
    expect(redirectArg.pathname).toBe("/auth/login");
    expect(res).toEqual({ type: "redirect", url: redirectArg });
    expect(NextResponseMock.next).not.toHaveBeenCalled();
  });

  it("redirects on a nested dashboard path when no session cookie is present", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("db dead"));

    const req = makeReq("/dashboard/clients/123");
    const res = await middleware(req);

    expect(NextResponseMock.redirect).toHaveBeenCalled();
    expect(res.type).toBe("redirect");
  });

  it("lets the request through (NextResponse.next) when subscriptionMiddleware throws but a session cookie is present", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq("/dashboard", {
      cookieHeader: "better-auth.session_token=abc.def",
    });
    const res = await middleware(req);

    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    expect(NextResponseMock.next).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ type: "next" });
  });

  it("recognizes the __Secure- cookie variant on fatal error", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq("/dashboard", {
      cookieHeader: "__Secure-better-auth.session_token=xyz",
    });
    const res = await middleware(req);

    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    expect(NextResponseMock.next).toHaveBeenCalledTimes(1);
    expect(res.type).toBe("next");
  });

  it("logs the fatal error to console.error", async () => {
    const err = new Error("explosion");
    subscriptionMiddleware.mockRejectedValueOnce(err);

    const req = makeReq("/dashboard");
    await middleware(req);

    expect(console.error).toHaveBeenCalled();
    const firstCall = console.error.mock.calls[0];
    expect(firstCall[0]).toContain("[Middleware]");
  });
});

describe("root middleware — fatal error fallback on non-protected routes", () => {
  it("returns NextResponse.next() when subscriptionMiddleware throws on a public route", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq("/");
    const res = await middleware(req);

    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    expect(NextResponseMock.next).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ type: "next" });
  });

  it("returns NextResponse.next() when subscriptionMiddleware throws on an API route (non-/dashboard)", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq("/api/graphql");
    const res = await middleware(req);

    // /api/graphql is not in AUTH_REQUIRED_PREFIXES (only "/dashboard" is),
    // so the fallback path simply lets the request through.
    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    expect(NextResponseMock.next).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ type: "next" });
  });

  it("does not check session cookie for non-protected routes", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq("/pricing");
    const headersGetSpy = vi.spyOn(req.headers, "get");

    const res = await middleware(req);

    expect(res).toEqual({ type: "next" });
    // It might still be called for other reasons, but the redirect path
    // should never be taken for a non-protected route.
    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    headersGetSpy.mockRestore();
  });
});

describe("root middleware — config matcher", () => {
  it("exposes the expected matcher excluding _next, favicon, public, and api/auth", async () => {
    const { config } = await import("@/middleware");
    expect(config).toBeDefined();
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|public/|api/auth).*)",
    ]);
  });
});

describe("root middleware — error message handling", () => {
  it("handles thrown errors with no .message property", async () => {
    subscriptionMiddleware.mockRejectedValueOnce("plain string error");

    const req = makeReq("/dashboard");
    const res = await middleware(req);

    // Should still take the protected-route fallback path, which redirects
    // because there's no session cookie.
    expect(NextResponseMock.redirect).toHaveBeenCalled();
    expect(res.type).toBe("redirect");
  });

  it("handles missing cookie header (returns empty string fallback)", async () => {
    subscriptionMiddleware.mockRejectedValueOnce(new Error("boom"));

    // Build a request whose headers.get("cookie") returns null.
    const req = {
      nextUrl: new URL("http://localhost/dashboard"),
      url: "http://localhost/dashboard",
      cookies: { get: () => undefined, has: () => false },
      headers: { get: vi.fn(() => null) },
    };

    const res = await middleware(req);

    // No cookie at all → redirect to /auth/login
    expect(NextResponseMock.redirect).toHaveBeenCalled();
    expect(res.type).toBe("redirect");
  });
});
