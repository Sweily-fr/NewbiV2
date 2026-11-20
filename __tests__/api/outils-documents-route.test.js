// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * POST /api/outils/documents : compte un document des générateurs gratuits,
 * en total par jour. Route publique : elle n'accepte que l'outil, le rang et
 * la portée (jamais le contenu du document) et seulement depuis le site.
 */

const updateOne = vi.fn(async () => ({ acknowledged: true }));
const collection = vi.fn(() => ({ updateOne }));
vi.mock("@/src/lib/mongodb", () => ({ mongoDb: { collection } }));

vi.mock("@/src/lib/security", () => ({
  withErrorHandler: (h) => h,
  apiError: (status, message) =>
    new Response(JSON.stringify({ error: message }), { status }),
}));

const { POST } = await import("@/app/api/outils/documents/route");

let ipSuivante = 0;
const post = (
  body,
  { origin = "https://www.newbi.fr", ip = `10.0.0.${++ipSuivante}` } = {},
) =>
  POST(
    new Request("https://www.newbi.fr/api/outils/documents", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "www.newbi.fr",
        "x-forwarded-host": "www.newbi.fr",
        "x-forwarded-for": ip,
        ...(origin ? { origin } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/outils/documents", () => {
  it("ajoute 1 au total du jour pour cet outil, ce rang et cette portée", async () => {
    const res = await post({ outil: "facture", rang: 3, portee: "navigateur" });
    expect(res.status).toBe(204);
    expect(collection).toHaveBeenCalledWith("outil_documents");
    const [filtre, maj, options] = updateOne.mock.calls[0];
    expect(filtre).toEqual({
      jour: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      outil: "facture",
      portee: "navigateur",
      rang: 3,
    });
    expect(maj).toEqual({ $inc: { n: 1 } });
    expect(options).toEqual({ upsert: true });
  });

  it("refuse tout autre champ, notamment le contenu du document", async () => {
    const res = await post({
      outil: "devis",
      rang: 1,
      portee: "visite",
      client: "Société Martin",
    });
    expect(res.status).toBe(400);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuse un outil, un rang ou une portée inconnus", async () => {
    for (const body of [
      { outil: "avoir", rang: 1, portee: "visite" },
      { outil: "facture", rang: 0, portee: "visite" },
      { outil: "facture", rang: 11, portee: "visite" },
      { outil: "facture", rang: 2.5, portee: "visite" },
      { outil: "facture", rang: 1, portee: "compte" },
      "pas du json",
    ]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuse une requête venue d'un autre site ou sans origine", async () => {
    const body = { outil: "facture", rang: 1, portee: "visite" };
    expect((await post(body, { origin: "https://exemple.fr" })).status).toBe(
      403,
    );
    expect((await post(body, { origin: null })).status).toBe(403);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("freine le remplissage en masse depuis une même adresse", async () => {
    const body = { outil: "facture", rang: 1, portee: "visite" };
    const statuts = [];
    for (let i = 0; i < 31; i++) {
      statuts.push((await post(body, { ip: "192.0.2.7" })).status);
    }
    expect(statuts.slice(0, 30).every((s) => s === 204)).toBe(true);
    expect(statuts[30]).toBe(429);
  });
});
