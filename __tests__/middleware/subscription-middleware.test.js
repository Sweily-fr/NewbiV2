import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth client used inside the middleware
vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { subscriptionMiddleware } from "@/src/middleware/subscription";
import { auth } from "@/src/lib/auth";

const buildRequest = ({
  pathname,
  cookies = "",
  origin = "https://app.newbi.fr",
} = {}) => {
  const url = `${origin}${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    headers: new Headers({ cookie: cookies }),
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("subscriptionMiddleware — excluded routes", () => {
  it.each([
    ["/auth/login"],
    ["/api/auth/callback"],
    ["/api/webhooks/stripe"],
    ["/pricing"],
    ["/checkout"],
    ["/billing"],
    ["/onboarding/step-1"],
  ])("lets %s through without checking session", async (pathname) => {
    const request = buildRequest({ pathname });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(200);
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });
});

describe("subscriptionMiddleware — public routes", () => {
  it.each([["/"], ["/blog/article-x"], ["/contact"]])(
    "lets %s through without auth check",
    async (pathname) => {
      const request = buildRequest({ pathname });
      const response = await subscriptionMiddleware(request);

      expect(response.status).toBe(200);
      expect(auth.api.getSession).not.toHaveBeenCalled();
    },
  );
});

describe("subscriptionMiddleware — protected dashboard routes", () => {
  it("redirects to /auth/login when there is no session", async () => {
    auth.api.getSession.mockResolvedValue(null);

    const request = buildRequest({ pathname: "/dashboard/invoices" });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(307); // NextResponse.redirect uses 307 by default
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("lets the request through when the user has an active session", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });

    const request = buildRequest({ pathname: "/dashboard/invoices" });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(200);
  });
});

describe("subscriptionMiddleware — protected API routes", () => {
  it.each([["/api/graphql"], ["/api/upload"], ["/api/bridge"], ["/api/ocr"]])(
    "returns 401 JSON when %s is hit without a session",
    async (pathname) => {
      auth.api.getSession.mockResolvedValue(null);

      const request = buildRequest({ pathname });
      const response = await subscriptionMiddleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Non authentifié" });
    },
  );

  it("lets API requests through when the user has a session", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });

    const request = buildRequest({ pathname: "/api/graphql" });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(200);
  });
});

describe("subscriptionMiddleware — DB error fallback", () => {
  it("lets the request through when the session lookup throws but a session cookie is present", async () => {
    auth.api.getSession.mockRejectedValue(new Error("Mongo down"));

    const request = buildRequest({
      pathname: "/dashboard",
      cookies: "better-auth.session_token=abc.def",
    });
    const response = await subscriptionMiddleware(request);

    // No redirect: revalidation will happen in the Server Component layout
    expect(response.status).toBe(200);
  });

  it("redirects to /auth/login when the session lookup throws AND no session cookie is present", async () => {
    auth.api.getSession.mockRejectedValue(new Error("Mongo down"));

    const request = buildRequest({ pathname: "/dashboard" });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("returns 401 JSON for protected API on DB error without session cookie", async () => {
    auth.api.getSession.mockRejectedValue(new Error("Mongo down"));

    const request = buildRequest({ pathname: "/api/graphql" });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(401);
  });

  it("recognizes the secure cookie variant", async () => {
    auth.api.getSession.mockRejectedValue(new Error("Mongo down"));

    const request = buildRequest({
      pathname: "/dashboard",
      cookies: "__Secure-better-auth.session_token=xyz",
    });
    const response = await subscriptionMiddleware(request);

    expect(response.status).toBe(200);
  });
});
