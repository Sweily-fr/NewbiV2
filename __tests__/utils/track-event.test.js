import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent } from "@/src/utils/trackEvent";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
  window.fbq = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackEvent — consent gating", () => {
  it("does NOT call fbq or fetch when there is no consent", async () => {
    window.fbq = vi.fn();
    await trackEvent({ eventName: "Lead", email: "x@y.fr" });
    expect(window.fbq).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does NOT call fbq when consent is set but marketing=false", async () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, marketing: false }),
    );
    window.fbq = vi.fn();
    await trackEvent({ eventName: "Lead" });
    expect(window.fbq).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls fbq AND CAPI when marketing consent is granted", async () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, marketing: true }),
    );
    window.fbq = vi.fn();
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await trackEvent({
      eventName: "Lead",
      email: "x@y.fr",
      value: 12.5,
    });

    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.fbq.mock.calls[0][0]).toBe("track");
    expect(window.fbq.mock.calls[0][1]).toBe("Lead");
    expect(window.fbq.mock.calls[0][2]).toEqual({
      value: 12.5,
      currency: "EUR",
    });
    expect(window.fbq.mock.calls[0][3]).toMatchObject({
      eventID: expect.any(String),
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/meta-capi",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      eventName: "Lead",
      email: "x@y.fr",
      value: 12.5,
      currency: "EUR",
    });
    expect(body.eventId).toBeTruthy();
  });

  it("uses EUR by default and respects custom currency", async () => {
    localStorage.setItem("cookie_consent", JSON.stringify({ marketing: true }));
    window.fbq = vi.fn();
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await trackEvent({ eventName: "Purchase", currency: "USD", value: 50 });
    expect(window.fbq.mock.calls[0][2]).toEqual({ value: 50, currency: "USD" });
  });

  it("recovers from invalid JSON in localStorage as no-consent", async () => {
    localStorage.setItem("cookie_consent", "{not-json");
    window.fbq = vi.fn();
    await trackEvent({ eventName: "Lead" });
    expect(window.fbq).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("works even when window.fbq is missing (only calls CAPI)", async () => {
    localStorage.setItem("cookie_consent", JSON.stringify({ marketing: true }));
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await trackEvent({ eventName: "Lead" });
    expect(fetch).toHaveBeenCalled();
  });
});
