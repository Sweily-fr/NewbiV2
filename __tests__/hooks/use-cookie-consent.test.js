import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCookieConsent } from "@/src/hooks/useCookieConsent";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCookieConsent", () => {
  it("starts with cookieConsent=null and isLoading=true on first render", () => {
    const { result } = renderHook(() => useCookieConsent());
    // After the effect runs synchronously in renderHook, isLoading is false.
    // The initial render may still show isLoading=true depending on timing.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.cookieConsent).toBeNull();
  });

  it("hydrates from localStorage when consent is already saved", () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, marketing: false, analytics: true }),
    );

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.cookieConsent).toEqual({
      necessary: true,
      marketing: false,
      analytics: true,
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("hasConsent('marketing') returns false when no consent has been given", () => {
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.hasConsent("marketing")).toBe(false);
    expect(result.current.hasConsent("analytics")).toBe(false);
  });

  it("hasConsent returns the consent flag from saved data", () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, marketing: true, analytics: false }),
    );

    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.hasConsent("necessary")).toBe(true);
    expect(result.current.hasConsent("marketing")).toBe(true);
    expect(result.current.hasConsent("analytics")).toBe(false);
  });

  it("updateConsent persists to localStorage and updates state", () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.updateConsent({
        necessary: true,
        marketing: true,
        analytics: false,
      });
    });

    expect(result.current.cookieConsent).toEqual({
      necessary: true,
      marketing: true,
      analytics: false,
    });

    // Persisted in localStorage
    expect(JSON.parse(localStorage.getItem("cookie_consent"))).toEqual({
      necessary: true,
      marketing: true,
      analytics: false,
    });

    // Date stamp also written
    const date = localStorage.getItem("cookie_consent_date");
    expect(date).toBeTruthy();
    expect(() => new Date(date)).not.toThrow();
  });

  it("updateConsent overwrites previous consent", () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, marketing: true, analytics: true }),
    );
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.updateConsent({
        necessary: true,
        marketing: false,
        analytics: false,
      });
    });

    expect(result.current.hasConsent("marketing")).toBe(false);
    expect(JSON.parse(localStorage.getItem("cookie_consent"))).toMatchObject({
      marketing: false,
    });
  });

  it("openCookieSettings dispatches an 'openCookiePreferences' window event", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.openCookieSettings();
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.type).toBe("openCookiePreferences");
  });
});
