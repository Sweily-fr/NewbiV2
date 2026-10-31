import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ATTRIBUTION_STORAGE_KEY,
  captureAttributionFromLocation,
  externalReferrer,
  isPublicPath,
  readStoredAttribution,
  rememberLastPage,
} from "@/src/lib/attribution";

/**
 * Attribution des inscriptions : jusqu'au 31/10/2026, seule une URL portant
 * des paramètres UTM ou gclid créait un enregistrement, si bien qu'aucune
 * inscription venue du référencement naturel n'était attribuée.
 */

function visit(url, referrer = "") {
  window.history.replaceState({}, "", url);
  Object.defineProperty(document, "referrer", {
    value: referrer,
    configurable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("externalReferrer", () => {
  it("réduit un site tiers à origine + chemin", () => {
    expect(
      externalReferrer(
        "https://www.google.com/search?q=mon+email%40x.fr",
        "www.newbi.fr",
      ),
    ).toBe("https://www.google.com/search");
  });

  it("distingue navigation interne (null) et absence de référent", () => {
    expect(externalReferrer("https://www.newbi.fr/blog", "www.newbi.fr")).toBe(
      null,
    );
    expect(externalReferrer("", "www.newbi.fr")).toBeUndefined();
    expect(externalReferrer("pas une url", "www.newbi.fr")).toBeUndefined();
  });
});

describe("isPublicPath", () => {
  it("écarte inscription, application et rendus techniques", () => {
    expect(isPublicPath("/blog/facturer-en-sous-traitance-regles")).toBe(true);
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/transfer/abc")).toBe(true);
    expect(isPublicPath("/auth/signup")).toBe(false);
    expect(isPublicPath("/dashboard/factures")).toBe(false);
    expect(isPublicPath("/pdf-generator/invoice/preview")).toBe(false);
    expect(isPublicPath("/payer")).toBe(true);
  });
});

describe("captureAttributionFromLocation", () => {
  it("enregistre une arrivée depuis Google naturel sans paramètre", () => {
    visit("/blog/facturer-en-sous-traitance-regles", "https://www.google.com/");
    captureAttributionFromLocation();
    expect(readStoredAttribution()).toMatchObject({
      landingPage: "/blog/facturer-en-sous-traitance-regles",
      referrer: "https://www.google.com/",
    });
  });

  it("enregistre un accès direct (sans référent)", () => {
    visit("/tarifs");
    captureAttributionFromLocation();
    const stored = readStoredAttribution();
    expect(stored.landingPage).toBe("/tarifs");
    expect(stored.referrer).toBeUndefined();
  });

  it("garde le premier contact sans campagne", () => {
    visit("/blog/a", "https://www.google.com/");
    captureAttributionFromLocation();
    visit("/blog/b", "https://chatgpt.com/");
    captureAttributionFromLocation();
    expect(readStoredAttribution().landingPage).toBe("/blog/a");
  });

  it("ignore un chargement interne ou une page non publique", () => {
    visit("/blog/a", `${window.location.origin}/blog`);
    captureAttributionFromLocation();
    expect(readStoredAttribution()).toBeNull();

    visit("/auth/signup", "https://accounts.google.com/");
    captureAttributionFromLocation();
    expect(readStoredAttribution()).toBeNull();
  });

  it("une campagne remplace un premier contact naturel (dernier clic)", () => {
    visit("/blog/a", "https://www.google.com/");
    captureAttributionFromLocation();
    visit("/lp/facture?utm_source=google&utm_medium=cpc&gclid=abc");
    captureAttributionFromLocation();
    const stored = readStoredAttribution();
    expect(stored).toMatchObject({
      utm_source: "google",
      utm_medium: "cpc",
      hadClickId: true,
      landingPage: "/lp/facture",
    });
    // Pas de consentement marketing : l'identifiant de clic n'est pas gardé.
    expect(stored.gclid).toBeUndefined();
  });

  it("conserve la dernière page notée quand la campagne est recapturée", () => {
    visit("/lp/facture?utm_source=google");
    captureAttributionFromLocation();
    rememberLastPage("/tarifs");
    localStorage.setItem("cookie_consent", JSON.stringify({ marketing: true }));
    captureAttributionFromLocation();
    expect(readStoredAttribution().lastPage).toBe("/tarifs");
  });
});

describe("rememberLastPage", () => {
  it("note la dernière page publique, pas l'inscription", () => {
    visit("/blog/a", "https://www.google.com/");
    captureAttributionFromLocation();
    rememberLastPage("/blog/a");
    rememberLastPage("/outils/generateur-de-facture");
    rememberLastPage("/auth/signup");
    expect(readStoredAttribution()).toMatchObject({
      landingPage: "/blog/a",
      lastPage: "/outils/generateur-de-facture",
    });
  });

  it("un enregistrement réduit à la dernière page n'empêche pas le premier contact", () => {
    rememberLastPage("/blog/a");
    visit("/blog/b", "https://www.bing.com/");
    captureAttributionFromLocation();
    expect(readStoredAttribution()).toMatchObject({
      landingPage: "/blog/b",
      referrer: "https://www.bing.com/",
      lastPage: "/blog/a",
    });
  });

  it("expire avec la fenêtre de 90 jours", () => {
    localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({
        landingPage: "/blog/a",
        capturedAt: Date.now() - 91 * 24 * 60 * 60 * 1000,
      }),
    );
    expect(readStoredAttribution()).toBeNull();
  });
});
