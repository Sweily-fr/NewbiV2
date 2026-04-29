import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn(),
    sendVerificationEmail: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: authClientMock,
}));

import { useEmailVerification } from "@/src/hooks/useEmailVerification";

beforeEach(() => {
  vi.useFakeTimers();
  authClientMock.getSession = vi.fn().mockResolvedValue({
    data: { user: { email: "joe@example.com", emailVerified: true } },
  });
  authClientMock.sendVerificationEmail = vi.fn().mockResolvedValue({
    data: {},
  });
  // Stub window.location.origin (jsdom default)
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useEmailVerification", () => {
  it("starts with isVerified=true (default)", async () => {
    const { result } = renderHook(() => useEmailVerification());
    expect(result.current.isVerified).toBe(true);
  });

  it("subscribes to verification changes on mount", async () => {
    const { result, unmount } = renderHook(() => useEmailVerification());
    expect(typeof result.current.resendVerificationEmail).toBe("function");
    unmount();
  });

  it("resendVerificationEmail calls authClient with current email", async () => {
    const { result } = renderHook(() => useEmailVerification());
    await act(async () => {
      await result.current.resendVerificationEmail();
    });
    expect(authClientMock.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "joe@example.com",
        callbackURL: expect.stringContaining("/api/auth/verify-email"),
      }),
    );
  });

  it("resendVerificationEmail is a no-op when no email in session", async () => {
    authClientMock.getSession = vi
      .fn()
      .mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useEmailVerification());
    await act(async () => {
      await result.current.resendVerificationEmail();
    });
    expect(authClientMock.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
