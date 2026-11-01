// @vitest-environment node
import { describe, it, expect } from "vitest";

/**
 * Anciennes adresses de téléchargement des transferts : elles renvoient
 * toujours vers la page de transfert du site, quel que soit le lien reçu.
 */
const ROUTES = [
  [
    "/api/transfer/download/x",
    () => import("@/app/api/transfer/download/[fileId]/route"),
  ],
  [
    "/api/transfer/download-all",
    () => import("@/app/api/transfer/download-all/route"),
  ],
];

describe.each(ROUTES)("GET %s", (chemin, charger) => {
  const appel = async (query) =>
    (await charger()).GET(new Request(`https://www.newbi.fr${chemin}${query}`));

  for (const lien of [
    "//exemple.invalid",
    "/\\exemple.invalid",
    "https://exemple.invalid/x",
    "javascript:alert(1)",
    "../../dashboard",
  ]) {
    it(`lien « ${lien} » : redirection sur l'origine du site, vers /transfer/<lien encodé>`, async () => {
      const res = await appel(
        `?shareLink=${encodeURIComponent(lien)}&accessKey=k`,
      );
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const cible = new URL(res.headers.get("location"));
      expect(cible.origin).toBe("https://www.newbi.fr");
      expect(cible.pathname).toBe(`/transfer/${encodeURIComponent(lien)}`);
      expect(cible.searchParams.get("key")).toBe("k");
    });
  }

  it("paramètres manquants : 400", async () => {
    expect((await appel("?shareLink=abc")).status).toBe(400);
    expect((await appel("?accessKey=k")).status).toBe(400);
    expect((await appel("")).status).toBe(400);
  });
});
