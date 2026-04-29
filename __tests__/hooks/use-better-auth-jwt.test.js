import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { performLogoutMock, useSessionMock } = vi.hoisted(() => ({
  performLogoutMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock("@/src/lib/auth-client", () => ({
  performLogout: performLogoutMock,
  useSession: useSessionMock,
}));

import { useBetterAuthJWT } from "@/src/hooks/useBetterAuthJWT";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useBetterAuthJWT — session shape", () => {
  it("returns isAuthenticated=true when session has a user", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1", email: "u@example.com" } },
      isPending: false,
    });

    const { result } = renderHook(() => useBetterAuthJWT());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isReady).toBe(true);
    expect(result.current.user.email).toBe("u@example.com");
  });

  it("returns isAuthenticated=false when no session", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });

    const { result } = renderHook(() => useBetterAuthJWT());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeUndefined();
  });

  it("propagates isPending to isLoading", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    const { result } = renderHook(() => useBetterAuthJWT());
    expect(result.current.isLoading).toBe(true);
  });

  it("explicitly returns no JWT (cookie-only auth)", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" } },
      isPending: false,
    });
    const { result } = renderHook(() => useBetterAuthJWT());
    expect(result.current.bearerToken).toBeNull();
    expect(result.current.jwtToken).toBeNull();
    expect(result.current.hasJWT).toBe(false);
  });
});

describe("useBetterAuthJWT.apiRequest", () => {
  it("includes credentials and JSON content-type by default", async () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    fetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useBetterAuthJWT());
    await act(async () => {
      await result.current.apiRequest("/api/test");
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("merges custom headers with defaults", async () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    fetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useBetterAuthJWT());
    await act(async () => {
      await result.current.apiRequest("/api/test", {
        headers: { "X-Trace": "abc" },
      });
    });

    expect(fetch.mock.calls[0][1].headers).toMatchObject({
      "Content-Type": "application/json",
      "X-Trace": "abc",
    });
  });
});

describe("useBetterAuthJWT.graphqlRequest", () => {
  it("posts to /graphql and returns the data on success", async () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ping: "pong" } }),
    });

    const { result } = renderHook(() => useBetterAuthJWT());
    let returned;
    await act(async () => {
      returned = await result.current.graphqlRequest("query { ping }");
    });

    expect(returned).toEqual({ ping: "pong" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/graphql",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.query).toBe("query { ping }");
  });

  it("throws with the GraphQL error message on errors", async () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: "Bad query" }] }),
    });

    const { result } = renderHook(() => useBetterAuthJWT());
    await expect(result.current.graphqlRequest("bad")).rejects.toThrow(
      "Bad query",
    );
  });
});

describe("useBetterAuthJWT.logout", () => {
  it("delegates to performLogout from auth-client", async () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    const { result } = renderHook(() => useBetterAuthJWT());
    expect(result.current.logout).toBe(performLogoutMock);
  });
});
