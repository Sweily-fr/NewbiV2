import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: {
    useSession: useSessionMock,
  },
}));

import { useUser } from "@/src/lib/auth/hooks";

beforeEach(() => {
  vi.clearAllMocks();
  useSessionMock.mockReset();
});

describe("useUser", () => {
  it("returns session when present", () => {
    const refetch = vi.fn();
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" } },
      isPending: false,
      error: null,
      refetch,
    });
    const { result } = renderHook(() => useUser());
    expect(result.current.session).toEqual({ user: { id: "u-1" } });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.refetch).toBe(refetch);
  });

  it("returns null when session is undefined", () => {
    useSessionMock.mockReturnValue({
      data: undefined,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useUser());
    expect(result.current.session).toBeNull();
  });

  it("returns null when session is null", () => {
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useUser());
    expect(result.current.session).toBeNull();
  });

  it("propagates pending state", () => {
    useSessionMock.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useUser());
    expect(result.current.isPending).toBe(true);
  });

  it("propagates error state", () => {
    const err = new Error("session error");
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
      error: err,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useUser());
    expect(result.current.error).toBe(err);
  });

  it("calls authClient.useSession exactly once per render", () => {
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    renderHook(() => useUser());
    expect(useSessionMock).toHaveBeenCalledTimes(1);
  });
});
