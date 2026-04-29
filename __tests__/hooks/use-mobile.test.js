import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/src/hooks/use-mobile";

describe("useIsMobile", () => {
  let mqlListeners;
  let originalInnerWidth;

  beforeEach(() => {
    mqlListeners = [];
    originalInnerWidth = window.innerWidth;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: window.innerWidth < 768,
      media: query,
      addEventListener: (event, fn) => mqlListeners.push(fn),
      removeEventListener: (event, fn) => {
        mqlListeners = mqlListeners.filter((l) => l !== fn);
      },
    }));
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setWidth = (w) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: w,
    });
  };

  it("returns true when window width is below 768px", () => {
    setWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when window width is 768px or above", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when the matchMedia listener fires", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(500);
      mqlListeners.forEach((fn) => fn());
    });
    expect(result.current).toBe(true);
  });

  it("uses the 768px breakpoint exactly (767 → true, 768 → false)", () => {
    setWidth(767);
    const { result: r1 } = renderHook(() => useIsMobile());
    expect(r1.current).toBe(true);

    setWidth(768);
    const { result: r2 } = renderHook(() => useIsMobile());
    expect(r2.current).toBe(false);
  });
});
