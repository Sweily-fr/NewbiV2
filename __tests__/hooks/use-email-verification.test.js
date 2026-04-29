import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn(),
    sendVerificationEmail: vi.fn(),
  },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: authClientMock,
}));

import { useEmailVerification } from "@/src/hooks/useEmailVerification";

beforeEach(() => {
  vi.clearAllMocks();
  authClientMock.getSession.mockResolvedValue({ data: null });
  authClientMock.sendVerificationEmail.mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEmailVerification", () => {
  it("polls the session immediately on mount", async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: { email: "x@y.fr", emailVerified: true } },
    });

    renderHook(() => useEmailVerification());
    await waitFor(() => expect(authClientMock.getSession).toHaveBeenCalled());
  });

  it("updates isVerified=false when email is unverified", async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: { email: "x@y.fr", emailVerified: false } },
    });

    const { result } = renderHook(() => useEmailVerification());
    await waitFor(() => expect(result.current.isVerified).toBe(false));
  });

  it("resendVerificationEmail calls authClient.sendVerificationEmail with the user's email", async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: { email: "user@test.fr", emailVerified: false } },
    });
    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.resendVerificationEmail();
    });

    expect(authClientMock.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@test.fr" }),
    );
  });

  it("resendVerificationEmail is a no-op when there is no session", async () => {
    authClientMock.getSession.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.resendVerificationEmail();
    });
    expect(authClientMock.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
