// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Relais publics des événements de mesure (Meta, TikTok) : appelables sans
 * session, ils ne relaient que ce qu'un visiteur déclare lui-même, avec des
 * valeurs bornées, et refusent les corps invalides sans erreur serveur.
 */

vi.hoisted(() => {
  process.env.META_PIXEL_ID = "pixel_test";
  process.env.META_CAPI_TOKEN = "jeton_test";
  process.env.TIKTOK_PIXEL_ID = "pixel_tiktok_test";
  process.env.TIKTOK_EVENTS_API_TOKEN = "jeton_tiktok_test";
});

const fournisseur = vi.fn(
  async () =>
    new Response(
      JSON.stringify({ code: 0, events_received: 1, fbtrace_id: "trace" }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    ),
);

beforeEach(() => {
  fournisseur.mockClear();
  vi.stubGlobal("fetch", fournisseur);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

let ip = 0;
const requete = (path, body, { brut = false, adresse } = {}) =>
  new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Une adresse par appel : la limite de débit a son propre test
      "x-forwarded-for": adresse || `203.0.113.${(ip++ % 250) + 1}`,
    },
    body: brut ? body : JSON.stringify(body),
  });

const RELAIS = [
  ["/api/meta-capi", () => import("@/app/api/meta-capi/route")],
  ["/api/tiktok-events", () => import("@/app/api/tiktok-events/route")],
];

describe.each(RELAIS)("POST %s", (path, charger) => {
  const appel = async (body, options) =>
    (await charger()).POST(requete(path, body, options));

  it("JSON invalide : 400, aucun envoi", async () => {
    const res = await appel("{pas du json", { brut: true });
    expect(res.status).toBe(400);
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("corps qui n'est pas un objet : 400", async () => {
    expect((await appel([1, 2])).status).toBe(400);
    expect((await appel("texte")).status).toBe(400);
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("achat déclaré par le navigateur : refusé, aucun envoi", async () => {
    const res = await appel({
      eventName: "Purchase",
      value: 999999,
      currency: "EUR",
    });
    expect(res.status).toBe(400);
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("abonnement déclaré par le navigateur : refusé", async () => {
    expect((await appel({ eventName: "Subscribe", value: 17.99 })).status).toBe(
      400,
    );
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("événement inventé : refusé", async () => {
    expect((await appel({ eventName: "AchatGeant" })).status).toBe(400);
    expect((await appel({ eventName: { $ne: "" } })).status).toBe(400);
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("montant hors bornes ou non numérique : refusé", async () => {
    for (const value of [999999, -5, "100", { a: 1 }]) {
      const res = await appel({ eventName: "Lead", value });
      expect(res.status, `valeur ${String(value)}`).toBe(400);
    }
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("devise ou identifiant d'événement mal formés : refusés", async () => {
    expect(
      (await appel({ eventName: "Lead", currency: "euros<script>" })).status,
    ).toBe(400);
    expect(
      (await appel({ eventName: "Lead", eventId: "x".repeat(200) })).status,
    ).toBe(400);
    expect(
      (await appel({ eventName: "Lead", email: { $gt: "" } })).status,
    ).toBe(400);
    expect(fournisseur).not.toHaveBeenCalled();
  });

  it("prospect déclaré (Lead) : relayé une fois, réponse du fournisseur non renvoyée", async () => {
    const res = await appel({
      eventName: "Lead",
      email: "zoe@exemple.fr",
      eventId: "evt-1",
    });
    expect(res.status).toBe(200);
    expect(fournisseur).toHaveBeenCalledTimes(1);
    const corps = await res.json();
    expect(corps).toEqual({ success: true });
    expect(JSON.stringify(corps)).not.toContain("trace");
  });

  it("appels répétés depuis une même adresse : 429 au-delà de la limite", async () => {
    const statuts = [];
    for (let i = 0; i < 25; i++) {
      statuts.push(
        (await appel({ eventName: "ViewContent" }, { adresse: "198.51.100.7" }))
          .status,
      );
    }
    expect(statuts.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuts.slice(20).every((s) => s === 429)).toBe(true);
    expect(fournisseur).toHaveBeenCalledTimes(20);
  });
});
