import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist the auth client mock so it's installed before the module under test
// imports it.
const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    multiSession: {
      listDeviceSessions: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: authClientMock,
}));

import {
  checkSessionLimit,
  handleSessionLimitRedirect,
} from "@/src/lib/session-limit-handler";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("checkSessionLimit", () => {
  it("returns hasReachedLimit=true when sessions array length >= maxSessions (1)", async () => {
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: [{ id: "s1" }],
      error: null,
    });

    const result = await checkSessionLimit();
    expect(result.hasReachedLimit).toBe(true);
    expect(result.sessions).toHaveLength(1);
  });

  it("returns hasReachedLimit=true when there are multiple sessions", async () => {
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: [{ id: "s1" }, { id: "s2" }, { id: "s3" }],
      error: null,
    });

    const result = await checkSessionLimit();
    expect(result.hasReachedLimit).toBe(true);
    expect(result.sessions).toHaveLength(3);
  });

  it("handles object response with sessions key", async () => {
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: { sessions: [{ id: "s1" }, { id: "s2" }] },
      error: null,
    });

    const result = await checkSessionLimit();
    expect(result.hasReachedLimit).toBe(true);
    expect(result.sessions).toHaveLength(2);
  });

  it("wraps a non-array, non-{sessions} payload into a single-element array", async () => {
    // The implementation falls back to `[data]` for unknown shapes.
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: { id: "single-session" },
      error: null,
    });

    const result = await checkSessionLimit();
    expect(result.sessions).toHaveLength(1);
    expect(result.hasReachedLimit).toBe(true);
  });

  it("returns the safe default when authClient returns an error", async () => {
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: null,
      error: { message: "Forbidden" },
    });

    const result = await checkSessionLimit();
    expect(result).toEqual({ hasReachedLimit: false, sessions: [] });
    expect(console.error).toHaveBeenCalled();
  });

  it("returns the safe default when authClient throws", async () => {
    authClientMock.multiSession.listDeviceSessions.mockRejectedValueOnce(
      new Error("network down"),
    );

    const result = await checkSessionLimit();
    expect(result).toEqual({ hasReachedLimit: false, sessions: [] });
    expect(console.error).toHaveBeenCalled();
  });
});

describe("handleSessionLimitRedirect", () => {
  it("redirects to /auth/manage-devices when limit reached and returns true", async () => {
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: [{ id: "s1" }],
      error: null,
    });
    const router = { push: vi.fn() };

    const result = await handleSessionLimitRedirect(router);

    expect(result).toBe(true);
    expect(router.push).toHaveBeenCalledWith("/auth/manage-devices");
  });

  it("does not redirect and returns false when limit not reached (error path)", async () => {
    authClientMock.multiSession.listDeviceSessions.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });
    const router = { push: vi.fn() };

    const result = await handleSessionLimitRedirect(router);

    expect(result).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not redirect and returns false when listDeviceSessions throws", async () => {
    authClientMock.multiSession.listDeviceSessions.mockRejectedValueOnce(
      new Error("offline"),
    );
    const router = { push: vi.fn() };

    const result = await handleSessionLimitRedirect(router);

    expect(result).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
  });
});
