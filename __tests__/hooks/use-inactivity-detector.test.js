import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const performLogoutMock = vi.fn();
vi.mock("@/src/lib/auth-client", () => ({
  performLogout: (...args) => performLogoutMock(...args),
}));

import { useInactivityDetector } from "@/src/hooks/useInactivityDetector";

beforeEach(() => {
  vi.useFakeTimers();
  performLogoutMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

const HOUR = 60 * 60 * 1000;

describe("useInactivityDetector", () => {
  it("triggers logout after the timeout elapses (default 12h)", () => {
    renderHook(() => useInactivityDetector());

    expect(performLogoutMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(12 * HOUR + 1);
    });

    expect(performLogoutMock).toHaveBeenCalledTimes(1);
    expect(performLogoutMock).toHaveBeenCalledWith({
      redirectTo: "/auth/session-expired?reason=inactivity",
    });
  });

  it("respects a custom timeoutHours option", () => {
    renderHook(() => useInactivityDetector({ timeoutHours: 2 }));

    act(() => {
      vi.advanceTimersByTime(2 * HOUR - 100);
    });
    expect(performLogoutMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(performLogoutMock).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    renderHook(() => useInactivityDetector({ enabled: false }));
    act(() => {
      vi.advanceTimersByTime(24 * HOUR);
    });
    expect(performLogoutMock).not.toHaveBeenCalled();
  });

  it("seeds localStorage with the activity timestamp on mount", () => {
    renderHook(() => useInactivityDetector());
    const stored = localStorage.getItem("newbi_last_activity");
    expect(stored).toBeTruthy();
    expect(parseInt(stored, 10)).toBeGreaterThan(0);
  });

  it("clears its timer on unmount", () => {
    const { unmount } = renderHook(() => useInactivityDetector());
    unmount();
    act(() => {
      vi.advanceTimersByTime(13 * HOUR);
    });
    expect(performLogoutMock).not.toHaveBeenCalled();
  });

  it("resets the timer when another tab updates the storage key", () => {
    renderHook(() => useInactivityDetector({ timeoutHours: 1 }));

    act(() => {
      vi.advanceTimersByTime(50 * 60 * 1000); // 50 min
    });

    // Simulate a cross-tab activity event near the deadline.
    act(() => {
      const event = new StorageEvent("storage", {
        key: "newbi_last_activity",
        newValue: String(Date.now()),
      });
      window.dispatchEvent(event);
    });

    // Advance past the original deadline (10 min more) — should not log out
    // because the timer was reset for another full hour.
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });
    expect(performLogoutMock).not.toHaveBeenCalled();

    // But after another full hour, it does log out.
    act(() => {
      vi.advanceTimersByTime(1 * HOUR);
    });
    expect(performLogoutMock).toHaveBeenCalledTimes(1);
  });
});
