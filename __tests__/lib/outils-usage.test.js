/**
 * Comptage des documents des générateurs gratuits (src/lib/outils-usage.js) :
 * rang retenu d'une visite à l'autre seulement avec les cookies fonctionnels,
 * rien de stocké sinon, et un envoi au serveur sans saisie ni cookie.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  compterDocument,
  envoyerComptage,
  CLE_COMPTEUR,
  RANG_MAX,
  _reinitialiserVisite,
} from "@/src/lib/outils-usage";

const JOUR = 24 * 60 * 60 * 1000;

const consentement = (functional) =>
  localStorage.setItem(
    "cookie_consent",
    JSON.stringify({
      necessary: true,
      functional,
      analytics: false,
      marketing: false,
    }),
  );

beforeEach(() => {
  localStorage.clear();
  _reinitialiserVisite();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compterDocument", () => {
  it("sans choix sur les cookies : compte la visite et ne stocke rien", () => {
    expect(compterDocument()).toEqual({ rang: 1, portee: "visite" });
    expect(compterDocument()).toEqual({ rang: 2, portee: "visite" });
    expect(localStorage.getItem(CLE_COMPTEUR)).toBeNull();
  });

  it("cookies fonctionnels refusés : efface un compteur resté d'avant", () => {
    localStorage.setItem(
      CLE_COMPTEUR,
      JSON.stringify({ n: 4, depuis: Date.now() }),
    );
    consentement(false);
    expect(compterDocument()).toEqual({ rang: 1, portee: "visite" });
    expect(localStorage.getItem(CLE_COMPTEUR)).toBeNull();
  });

  it("cookies fonctionnels acceptés : compte d'une visite à l'autre", () => {
    consentement(true);
    const t0 = Date.UTC(2026, 10, 20);
    expect(compterDocument(t0)).toEqual({ rang: 1, portee: "navigateur" });
    _reinitialiserVisite();
    expect(compterDocument(t0 + JOUR)).toEqual({
      rang: 2,
      portee: "navigateur",
    });
    _reinitialiserVisite();
    expect(compterDocument(t0 + 30 * JOUR)).toEqual({
      rang: 3,
      portee: "navigateur",
    });
    expect(JSON.parse(localStorage.getItem(CLE_COMPTEUR))).toEqual({
      n: 3,
      depuis: t0,
    });
  });

  it("repart à 1 au-delà de 13 mois", () => {
    consentement(true);
    const t0 = Date.UTC(2025, 9, 1);
    localStorage.setItem(CLE_COMPTEUR, JSON.stringify({ n: 7, depuis: t0 }));
    const apres = t0 + 400 * JOUR;
    expect(compterDocument(apres)).toEqual({ rang: 1, portee: "navigateur" });
    expect(JSON.parse(localStorage.getItem(CLE_COMPTEUR))).toEqual({
      n: 1,
      depuis: apres,
    });
  });

  it("compteur illisible ou incohérent : repart à 1", () => {
    consentement(true);
    localStorage.setItem(CLE_COMPTEUR, "pas du json");
    expect(compterDocument()).toEqual({ rang: 1, portee: "navigateur" });
    localStorage.setItem(CLE_COMPTEUR, JSON.stringify({ n: -3, depuis: 0 }));
    expect(compterDocument().rang).toBe(1);
  });
});

describe("envoyerComptage", () => {
  it("envoie l'outil, le rang plafonné et la portée, sans cookie", () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    envoyerComptage({ outil: "facture", rang: 37, portee: "navigateur" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/outils/documents");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("omit");
    expect(options.keepalive).toBe(true);
    expect(JSON.parse(options.body)).toEqual({
      outil: "facture",
      rang: RANG_MAX,
      portee: "navigateur",
    });
  });

  it("ne lève jamais d'erreur, même hors ligne", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("hors ligne"))),
    );
    expect(() =>
      envoyerComptage({ outil: "devis", rang: 1, portee: "visite" }),
    ).not.toThrow();
  });
});
