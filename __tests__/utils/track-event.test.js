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

describe("trackGoogleAdsConversion / trackSignupConversion", () => {
  let mod;
  beforeEach(async () => {
    mod = await import("@/src/utils/trackEvent");
    window.gtag = vi.fn();
  });
  afterEach(() => {
    window.gtag = undefined;
  });

  it("envoie la conversion Inscription avec le bon send_to, même sans consentement", () => {
    const sent = mod.trackSignupConversion("user-1");
    expect(sent).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-18448267727/9_9LCMfq2_YcEM_z6NxE",
    });
  });

  it("ne compte qu'une fois par utilisateur (rechargement, email + OAuth)", () => {
    expect(mod.trackSignupConversion("user-1")).toBe(true);
    expect(mod.trackSignupConversion("user-1")).toBe(false);
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(mod.trackSignupConversion("user-2")).toBe(true);
    expect(window.gtag).toHaveBeenCalledTimes(2);
  });

  it("ne fait rien si gtag n'est pas chargé ou si la conversion est inconnue", () => {
    expect(
      mod.trackGoogleAdsConversion({ conversion: "nope", dedupeKey: "u" }),
    ).toBe(false);
    window.gtag = undefined;
    expect(mod.trackSignupConversion("user-3")).toBe(false);
  });

  it("Essai démarré : bon libellé, montant et identifiant de transaction", () => {
    const sent = mod.trackTrialStartConversion({
      subscriptionId: "sub_essai_1",
      value: 17.99,
      currency: "EUR",
    });
    expect(sent).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-18448267727/LdElCOiH-7odEM_z6NxE",
      value: 17.99,
      currency: "EUR",
      transaction_id: "sub_essai_1",
    });
  });

  it("Essai démarré : une seule fois par abonnement, rien sans abonnement", () => {
    const essai = { subscriptionId: "sub_essai_2", value: 17.99 };
    expect(mod.trackTrialStartConversion(essai)).toBe(true);
    expect(mod.trackTrialStartConversion(essai)).toBe(false);
    expect(mod.trackTrialStartConversion({ value: 17.99 })).toBe(false);
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });

  it("Essai démarré sans montant lisible : conversion envoyée sans valeur", () => {
    mod.trackTrialStartConversion({
      subscriptionId: "sub_essai_3",
      value: null,
    });
    expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-18448267727/LdElCOiH-7odEM_z6NxE",
      transaction_id: "sub_essai_3",
    });
  });
});
