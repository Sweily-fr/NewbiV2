import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";

const mockUseSession = vi.fn();
const mockUseInactivityDetector = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  useSession: (...args) => mockUseSession(...args),
}));

vi.mock("@/src/hooks/useInactivityDetector", () => ({
  useInactivityDetector: (...args) => mockUseInactivityDetector(...args),
}));

import { InactivityDetector } from "@/src/components/inactivity-detector";

describe("InactivityDetector", () => {
  beforeEach(() => {
    mockUseSession.mockReset();
    mockUseInactivityDetector.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ inactivityTimeout: 6 }),
        }),
      ),
    );
  });

  it("renders nothing (returns null)", () => {
    mockUseSession.mockReturnValue({ data: null });
    const { container } = render(<InactivityDetector />);
    expect(container.firstChild).toBeNull();
  });

  it("calls useInactivityDetector with default 12h when no session", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<InactivityDetector />);
    expect(mockUseInactivityDetector).toHaveBeenCalledWith({
      timeoutHours: 12,
      enabled: false,
    });
  });

  it("does not fetch settings when there is no session user", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<InactivityDetector />);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fetches settings when user session exists", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
    render(<InactivityDetector />);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/session-settings",
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  it("updates the timeout when receiving custom event", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
    render(<InactivityDetector />);

    await waitFor(() => {
      expect(mockUseInactivityDetector).toHaveBeenCalled();
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("inactivitySettingsChanged", {
          detail: { inactivityTimeout: 3 },
        }),
      );
    });

    // The hook should have been called with timeoutHours: 3 in some call
    await waitFor(() => {
      const calls = mockUseInactivityDetector.mock.calls.map((c) => c[0]);
      expect(calls.some((c) => c.timeoutHours === 3)).toBe(true);
    });
  });

  it("handles fetch errors gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Network down"))),
    );
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
    render(<InactivityDetector />);
    await waitFor(() => {
      const calls = mockUseInactivityDetector.mock.calls.map((c) => c[0]);
      // After fetch fails, settingsLoaded becomes true so enabled should be true
      expect(calls.some((c) => c.enabled === true)).toBe(true);
    });
  });
});
