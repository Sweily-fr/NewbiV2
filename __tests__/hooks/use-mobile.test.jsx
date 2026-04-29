import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/src/hooks/use-mobile";

let mockListeners = [];
let originalMatchMedia;
let originalInnerWidth;

beforeEach(() => {
  mockListeners = [];
  originalMatchMedia = window.matchMedia;
  originalInnerWidth = window.innerWidth;

  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: (event, listener) => {
      mockListeners.push({ event, listener });
    },
    removeEventListener: (event, listener) => {
      mockListeners = mockListeners.filter(
        (l) => !(l.event === event && l.listener === listener),
      );
    },
  }));
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(window, "innerWidth", {
    value: originalInnerWidth,
    writable: true,
    configurable: true,
  });
});

const setWidth = (w) => {
  Object.defineProperty(window, "innerWidth", {
    value: w,
    writable: true,
    configurable: true,
  });
};

describe("useIsMobile", () => {
  it("returns false for desktop width", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true for narrow width", () => {
    setWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when matchMedia change fires", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(400);
      mockListeners.forEach((l) => l.listener());
    });
    expect(result.current).toBe(true);
  });

  it("removes listener on unmount", () => {
    setWidth(1024);
    const { unmount } = renderHook(() => useIsMobile());
    expect(mockListeners.length).toBeGreaterThan(0);
    unmount();
    expect(mockListeners.length).toBe(0);
  });
});
