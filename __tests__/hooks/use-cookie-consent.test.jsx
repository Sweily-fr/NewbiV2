import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCookieConsent } from "@/src/hooks/useCookieConsent";

beforeEach(() => {
  localStorage.clear();
});

describe("useCookieConsent", () => {
  it("starts loading and finishes false consent", async () => {
    const { result } = renderHook(() => useCookieConsent());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cookieConsent).toBeNull();
    expect(result.current.hasConsent("analytics")).toBe(false);
  });

  it("loads previously stored consent", async () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ analytics: true, marketing: false }),
    );
    const { result } = renderHook(() => useCookieConsent());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cookieConsent.analytics).toBe(true);
    expect(result.current.hasConsent("analytics")).toBe(true);
    expect(result.current.hasConsent("marketing")).toBe(false);
  });

  it("updateConsent persists to localStorage with date", async () => {
    const { result } = renderHook(() => useCookieConsent());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateConsent({ analytics: true, marketing: true });
    });

    expect(JSON.parse(localStorage.getItem("cookie_consent"))).toEqual({
      analytics: true,
      marketing: true,
    });
    expect(localStorage.getItem("cookie_consent_date")).toBeTruthy();
  });

  it("openCookieSettings dispatches a custom event", async () => {
    const { result } = renderHook(() => useCookieConsent());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const handler = vi.fn();
    window.addEventListener("openCookiePreferences", handler);
    act(() => {
      result.current.openCookieSettings();
    });
    expect(handler).toHaveBeenCalled();
    window.removeEventListener("openCookiePreferences", handler);
  });
});
