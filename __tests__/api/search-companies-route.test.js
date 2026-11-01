// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * GET /api/search-companies : proxy public vers l'annuaire des entreprises
 * de l'État. Recherche bornée et limitée par adresse, pour que l'annuaire
 * ne bloque pas le site (inscription, informations légales).
 */

const annuaire = vi.fn(
  async () =>
    new Response(JSON.stringify({ results: [], total_results: 0 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
);

beforeEach(() => {
  annuaire.mockClear();
  vi.stubGlobal("fetch", annuaire);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

let ip = 0;
const chercher = async (query, adresse) => {
  const { GET } = await import("@/app/api/search-companies/route");
  return GET(
    new Request(`http://localhost/api/search-companies?${query}`, {
      headers: {
        "x-forwarded-for": adresse || `203.0.113.${(ip++ % 250) + 1}`,
      },
    }),
  );
};

describe("GET /api/search-companies", () => {
  for (const [cas, query] of [
    ["recherche d'un caractère", "q=a"],
    ["recherche vide", "q=%20%20"],
    ["recherche de 5 000 caractères", `q=${"a".repeat(5000)}`],
    ["10 000 résultats demandés", "q=boulangerie&limite=10000"],
    ["0 résultat demandé", "q=boulangerie&limite=0"],
    ["nombre de résultats négatif", "q=boulangerie&limite=-5"],
    [
      "nombre de résultats non numérique",
      "q=boulangerie&limite=10%26etat_administratif=F",
    ],
  ]) {
    it(`${cas} : 400, l'annuaire n'est pas interrogé`, async () => {
      expect((await chercher(query)).status).toBe(400);
      expect(annuaire).not.toHaveBeenCalled();
    });
  }

  it("recherche accentuée et nombre de résultats des écrans (8) : transmise telle quelle", async () => {
    const res = await chercher(
      `q=${encodeURIComponent("Boulangerie Lefèvre & Fils")}&limite=8`,
    );
    expect(res.status).toBe(200);
    const url = new URL(String(annuaire.mock.calls[0][0]));
    expect(url.hostname).toBe("recherche-entreprises.api.gouv.fr");
    expect(url.searchParams.get("q")).toBe("Boulangerie Lefèvre & Fils");
    expect(url.searchParams.get("limite")).toBe("8");
    expect([...url.searchParams.keys()].sort()).toEqual(["limite", "q"]);
  });

  it("sans nombre de résultats : 10 par défaut", async () => {
    await chercher("q=boulangerie");
    expect(
      new URL(String(annuaire.mock.calls[0][0])).searchParams.get("limite"),
    ).toBe("10");
  });

  it("recherches en série depuis une même adresse : 429 au-delà de 60 par minute", async () => {
    const statuts = [];
    for (let i = 0; i < 65; i++)
      statuts.push((await chercher("q=boulangerie", "198.51.100.9")).status);
    expect(statuts.slice(0, 60).every((s) => s === 200)).toBe(true);
    expect(statuts.slice(60).every((s) => s === 429)).toBe(true);
    expect(annuaire).toHaveBeenCalledTimes(60);
    // Les autres adresses continuent de chercher
    expect((await chercher("q=boulangerie", "198.51.100.10")).status).toBe(200);
  });
});
